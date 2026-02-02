// ====================================================================
// Supabase Edge Function: Page Content (pageId로 직접 본문 가져오기)
// 배포: supabase functions deploy notion-proxy-page --no-verify-jwt
// ====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

// 블록 자식들 재귀적으로 가져오기
async function fetchBlockChildren(blockId: string, notionKey: string, depth: number = 0): Promise<any[]> {
  if (depth > 2) return [];
  
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
    
    for (const block of data.results) {
      allBlocks.push(block);
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

    if (!NOTION_KEY) {
      throw new Error("NOTION_KEY가 설정되지 않았습니다.");
    }

    const { pageId } = await req.json();
    
    if (!pageId) {
      return new Response(JSON.stringify({ error: "pageId가 필요합니다." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Fetching page content: ${pageId}`);

    // 블록 가져오기 (DB 쿼리 없이 직접!)
    const blocks = await fetchBlockChildren(pageId, NOTION_KEY);
    
    let text = "";
    blocks.forEach((block: any) => {
      text += blockToText(block);
    });

    if (!text.trim()) {
      text = "본문 내용이 없습니다.";
    }

    console.log(`Fetched ${blocks.length} blocks, text length: ${text.length}`);

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
