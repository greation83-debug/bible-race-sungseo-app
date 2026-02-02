// ====================================================================
// Supabase Edge Function: Bulk Sync (전체 데이터 일괄 가져오기 - 미디어 지원)
// 배포: supabase functions deploy notion-proxy-bulk --no-verify-jwt
// ====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// ===== 미디어 추출 함수 =====
interface MediaData {
  images: Array<{ url: string; caption?: string }>;
  audios: Array<{ url: string; caption?: string }>;
  files: Array<{ url: string; name: string; caption?: string }>;
  videos: Array<{ url: string; caption?: string }>;
}

function extractMediaFromBlock(block: any): MediaData {
  const media: MediaData = {
    images: [],
    audios: [],
    files: [],
    videos: []
  };

  const type = block.type;

  if (type === 'image') {
    const url = block.image?.file?.url || block.image?.external?.url;
    const caption = block.image?.caption?.map((t: any) => t.plain_text).join('') || '';
    if (url) media.images.push({ url, caption });
  }

  if (type === 'audio') {
    const url = block.audio?.file?.url || block.audio?.external?.url;
    const caption = block.audio?.caption?.map((t: any) => t.plain_text).join('') || '';
    if (url) media.audios.push({ url, caption });
  }

  if (type === 'video') {
    const url = block.video?.file?.url || block.video?.external?.url;
    const caption = block.video?.caption?.map((t: any) => t.plain_text).join('') || '';
    if (url) media.videos.push({ url, caption });
  }

  if (type === 'file') {
    const url = block.file?.file?.url || block.file?.external?.url;
    const name = block.file?.name || '첨부파일';
    const caption = block.file?.caption?.map((t: any) => t.plain_text).join('') || '';
    if (url) media.files.push({ url, name, caption });
  }

  if (type === 'pdf') {
    const url = block.pdf?.file?.url || block.pdf?.external?.url;
    const caption = block.pdf?.caption?.map((t: any) => t.plain_text).join('') || '';
    if (url) media.files.push({ url, name: 'PDF 문서', caption });
  }

  return media;
}

function mergeMedia(target: MediaData, source: MediaData): void {
  target.images.push(...source.images);
  target.audios.push(...source.audios);
  target.files.push(...source.files);
  target.videos.push(...source.videos);
}

// 블록 자식들 재귀적으로 가져오기
async function fetchBlockChildren(
  blockId: string, 
  notionKey: string, 
  depth: number = 0
): Promise<{ blocks: any[]; media: MediaData }> {
  if (depth > 2) return { blocks: [], media: { images: [], audios: [], files: [], videos: [] } };
  
  let allBlocks: any[] = [];
  const allMedia: MediaData = { images: [], audios: [], files: [], videos: [] };
  let hasMore = true;
  let nextCursor: string | null = null;

  while (hasMore) {
    const url = nextCursor 
      ? `https://api.notion.com/v1/blocks/${blockId}/children?start_cursor=${nextCursor}`
      : `https://api.notion.com/v1/blocks/${blockId}/children`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!resp.ok) break;
    
    const data = await resp.json();
    
    for (const block of data.results) {
      allBlocks.push(block);
      
      const blockMedia = extractMediaFromBlock(block);
      mergeMedia(allMedia, blockMedia);
      
      if (block.has_children) {
        const childResult = await fetchBlockChildren(block.id, notionKey, depth + 1);
        allBlocks = allBlocks.concat(childResult.blocks);
        mergeMedia(allMedia, childResult.media);
      }
    }
    
    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }

  return { blocks: allBlocks, media: allMedia };
}

// 블록을 텍스트로 변환
function blockToText(block: any): string {
  const type = block.type;
  
  if (block[type]?.rich_text) {
    const textContent = block[type].rich_text.map((t: any) => t.plain_text).join('');
    if (!textContent.trim()) return '';
    
    if (type === 'heading_1') return `# ${textContent}\n\n`;
    if (type === 'heading_2') return `## ${textContent}\n\n`;
    if (type === 'heading_3') return `### ${textContent}\n\n`;
    if (type === 'bulleted_list_item') return `• ${textContent}\n`;
    if (type === 'numbered_list_item') return `1. ${textContent}\n`;
    if (type === 'quote') return `> ${textContent}\n\n`;
    if (type === 'callout') return `💡 ${textContent}\n\n`;
    if (type === 'toggle') return `**${textContent}**\n\n`;
    return `${textContent}\n\n`;
  }
  
  if (type === 'divider') return `---\n\n`;
  
  return '';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const NOTION_KEY = Deno.env.get("NOTION_KEY");
    const NOTION_DB_ID = Deno.env.get("NOTION_DB_ID");

    if (!NOTION_KEY || !NOTION_DB_ID) {
      throw new Error("서버 환경 변수가 설정되지 않았습니다.");
    }

    const { tag, includeContent = false } = await req.json();
    
    if (!tag) {
      return new Response(JSON.stringify({ error: "태그 정보가 필요합니다." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Bulk fetching: Tag=${tag}, includeContent=${includeContent}`);

    // 1. 노션 DB에서 모든 페이지 가져오기
    let allPages: any[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    while (hasMore) {
      const queryBody: any = {
        filter: {
          property: "태그",
          multi_select: { contains: tag }
        },
        sorts: [{ property: "날짜", direction: "ascending" }],
        page_size: 100
      };
      
      if (nextCursor) {
        queryBody.start_cursor = nextCursor;
      }

      const queryResp = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryBody),
      });

      if (!queryResp.ok) {
        throw new Error(`Notion DB Query Error: ${queryResp.status}`);
      }

      const queryData = await queryResp.json();
      allPages = allPages.concat(queryData.results);
      
      hasMore = queryData.has_more;
      nextCursor = queryData.next_cursor;
      
      console.log(`Fetched ${allPages.length} pages so far...`);
    }

    console.log(`Total pages: ${allPages.length}`);

    // 2. 각 페이지 정보 추출
    const results: any[] = [];
    
    for (const page of allPages) {
      // 날짜 추출
      let dateVal = null;
      if (page.properties['게시날짜']?.formula?.type === 'date') {
        dateVal = page.properties['게시날짜'].formula.date?.start;
      }
      if (!dateVal && page.properties['날짜']?.date) {
        dateVal = page.properties['날짜'].date.start;
      }
      
      if (!dateVal) continue;
      
      const mmdd = dateVal.slice(5); // "MM-DD"
      const title = page.properties['이름']?.title[0]?.plain_text || "무제";
      
      // 오디오 URL
      let audioUrl = page.properties['오디오URL']?.url || null;
      if (audioUrl && audioUrl.includes('drive.google.com/file/d/')) {
        const match = audioUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          audioUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
      }
      
      const item: any = {
        pageId: page.id,
        date: mmdd,
        title,
        audioUrl
      };
      
      // 본문 포함 옵션 (시간이 오래 걸림)
      if (includeContent) {
        const { blocks, media } = await fetchBlockChildren(page.id, NOTION_KEY);
        let text = "";
        blocks.forEach((block: any) => {
          text += blockToText(block);
        });
        item.text = text || "본문 내용이 없습니다.";
        item.images = media.images;
        item.audios = media.audios;
        item.files = media.files;
        item.videos = media.videos;
      }
      
      results.push(item);
    }

    return new Response(JSON.stringify({ 
      total: results.length,
      items: results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});