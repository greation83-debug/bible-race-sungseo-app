// ====================================================================
// Supabase Edge Function for Notion API (페이지네이션 + 중첩블록 지원)
// 이 코드를 Supabase Edge Function (예: notion-proxy)에 배포하세요.
// ====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS 설정을 위한 헤더 (모든 도메인에서 호출 허용)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// ★ 블록의 자식 블록들을 재귀적으로 가져오는 함수
async function fetchBlockChildren(blockId: string, notionKey: string, depth: number = 0): Promise<any[]> {
  if (depth > 3) return []; // 무한 루프 방지 (최대 3단계)
  
  let allBlocks: any[] = [];
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
    
    // 각 블록에 대해 자식이 있으면 재귀 호출
    for (const block of data.results) {
      allBlocks.push(block);
      
      // has_children이 true면 자식 블록도 가져옴
      if (block.has_children) {
        const children = await fetchBlockChildren(block.id, notionKey, depth + 1);
        allBlocks = allBlocks.concat(children);
      }
    }
    
    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }

  return allBlocks;
}

// ★ 블록을 텍스트로 변환하는 함수
function blockToText(block: any): string {
  const type = block.type;
  
  // 오디오 블록 처리 (audioUrl을 반환하기 위해 특별 처리)
  if (type === 'audio') {
    const audioFile = block.audio?.file || block.audio?.external;
    if (audioFile?.url) {
      return `[AUDIO]${audioFile.url}[/AUDIO]\n\n`;
    }
  }
  
  // rich_text가 있는 블록 처리
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
    if (type === 'toggle') return `**${textContent}**\n\n`; // 토글 제목은 볼드로
    return `${textContent}\n\n`;
  }
  
  // 구분선
  if (type === 'divider') return `---\n\n`;
  
  return '';
}

serve(async (req) => {
  // 1. CORS Preflight 요청 처리 (OPTIONS 요청)
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // 2. 환경 변수에서 Notion 키 가져오기 (Supabase Secrets에 저장해야 함)
    const NOTION_KEY = Deno.env.get("NOTION_KEY");
    const NOTION_DB_ID = Deno.env.get("NOTION_DB_ID");

    if (!NOTION_KEY || !NOTION_DB_ID) {
      throw new Error("서버 환경 변수(Notion Key)가 설정되지 않았습니다.");
    }

    // 3. 클라이언트(HTML)에서 보낸 데이터 받기
    const { tag, date } = await req.json();
    
    if (!tag || !date) {
      return new Response(JSON.stringify({ error: "태그와 날짜 정보가 필요합니다." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 4. Notion API 호출: 데이터베이스 쿼리 (페이지네이션 지원)
    console.log(`Querying Notion: Tag=${tag}, Date=${date}`);
    
    let allResults: any[] = [];
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
      allResults = allResults.concat(queryData.results);
      
      hasMore = queryData.has_more;
      nextCursor = queryData.next_cursor;
      
      console.log(`Fetched ${queryData.results.length} pages, total: ${allResults.length}, hasMore: ${hasMore}`);
    }

    // 5. 날짜 매칭 로직 (서버에서 처리하여 로직 숨김)
    const matchedPage = allResults.find((page: any) => {
      let dateVal = null;
      // '게시날짜' 수식 속성 또는 '날짜' 속성 확인
      if (page.properties['게시날짜']?.formula?.type === 'date') {
        dateVal = page.properties['게시날짜'].formula.date?.start;
      } 
      if (!dateVal && page.properties['날짜']?.date) {
        dateVal = page.properties['날짜'].date.start;
      }
      if (!dateVal) return false;
      // "YYYY-MM-DD" 에서 "MM-DD"만 비교
      return dateVal.slice(5) === date;
    });

    if (!matchedPage) {
      return new Response(JSON.stringify({ 
        title: null, 
        text: `[알림] 날짜(${date})에 해당하는 말씀이 없습니다.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 6. 페이지 정보 가져오기
    const pageTitle = matchedPage.properties['이름']?.title[0]?.plain_text || "무제";
    
    // ★ 오디오 URL 가져오기 (노션 DB에 '오디오URL' URL 속성이 있는 경우)
    let audioUrl = matchedPage.properties['오디오URL']?.url || null;
    
    // ★ Google Drive URL 자동 변환
    if (audioUrl && audioUrl.includes('drive.google.com/file/d/')) {
      const match = audioUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        audioUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    
    // 7. ★ 모든 블록 가져오기 (자식 블록 포함, 재귀적) ★
    console.log(`Fetching blocks for page: ${matchedPage.id}`);
    const allBlocks = await fetchBlockChildren(matchedPage.id, NOTION_KEY);
    console.log(`Total blocks fetched (including children): ${allBlocks.length}`);

    // 8. 블록을 Markdown 텍스트로 변환 + 오디오 URL 추출
    let fullText = "";
    allBlocks.forEach((block: any) => {
      fullText += blockToText(block);
    });
    
    // 본문에서 오디오 URL 추출 (속성보다 우선)
    const audioMatch = fullText.match(/\[AUDIO\](.*?)\[\/AUDIO\]/);
    if (audioMatch && audioMatch[1]) {
      audioUrl = audioMatch[1];
      // 텍스트에서 오디오 태그 제거
      fullText = fullText.replace(/\[AUDIO\].*?\[\/AUDIO\]\n\n/g, '');
    }

    if (!fullText.trim()) {
       const aiSummary = matchedPage.properties['AI 요약']?.rich_text?.[0]?.plain_text;
       if (aiSummary) fullText = `[AI 요약]\n${aiSummary}`;
       else fullText = "본문 내용이 없습니다.";
    }

    // 9. 결과 반환 (오디오URL 포함)
    return new Response(JSON.stringify({ title: pageTitle, text: fullText, audioUrl }), {
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