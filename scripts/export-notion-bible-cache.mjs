import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_FUNCTION_URL = 'https://mvwhepqqzdtqtorgkrtf.supabase.co/functions/v1/notion-proxy';
const SUPABASE_BULK_URL = SUPABASE_FUNCTION_URL.replace('notion-proxy', 'notion-proxy-bulk');
const SUPABASE_PAGE_URL = SUPABASE_FUNCTION_URL.replace('notion-proxy', 'notion-proxy-page');

const versions = [
    ['1year_revised', '개역개정 일년일독'],
    ['1year_new', '새번역 일년일독'],
    ['1year_easy', '쉬운성경 일년일독'],
    ['1year_saehangul', '새한글 일년일독'],
    ['1year_sequential', '개역개정 순서대로'],
    ['nt_new', '새번역 신약일독'],
    ['nt_easy', '쉬운성경 신약일독'],
    ['nt_saehangul', '새한글 신약일독'],
    ['nt_message', '메시지 신약일독'],
];

const outRoot = path.resolve('public/bible-cache');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targetPlanIds = process.argv.slice(2);
const selectedVersions = targetPlanIds.length
    ? versions.filter(([planId]) => targetPlanIds.includes(planId))
    : versions;

const writeJson = async (filePath, data) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const postJson = async (url, body, timeoutMs = 60000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = { raw: text };
        }
        if (!response.ok) {
            throw new Error(data?.error || `HTTP ${response.status}`);
        }
        return data;
    } finally {
        clearTimeout(timer);
    }
};

const dateToDayMap = () => {
    const map = {};
    for (let day = 1; day <= 365; day += 1) {
        const targetDate = new Date(2025, 0, day);
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        map[`${mm}-${dd}`] = day;
    }
    return map;
};

const exportPlan = async (planId, tagName) => {
    console.log(`\n[${planId}] 목록 가져오기: ${tagName}`);
    const dateToDay = dateToDayMap();
    const list = await postJson(SUPABASE_BULK_URL, { tag: tagName, includeContent: false }, 120000);
    const items = Array.isArray(list.items) ? list.items : [];
    const result = { planId, tagName, total: items.length, exported: 0, failed: [], missing: [] };

    for (const item of items) {
        const day = dateToDay[item.date];
        if (!day) {
            result.failed.push({ date: item.date, title: item.title, error: '날짜 매핑 실패' });
            continue;
        }

        try {
            const page = await postJson(SUPABASE_PAGE_URL, { pageId: item.pageId }, 90000);
            if (!page.text || page.text === '본문 내용이 없습니다.') {
                throw new Error('본문 없음');
            }

            await writeJson(path.join(outRoot, planId, `${String(day).padStart(3, '0')}.json`), {
                planId,
                day,
                date: item.date,
                title: item.title || page.title || '',
                text: page.text,
                audioUrl: item.audioUrl || page.audioUrl || null,
                pageId: item.pageId,
                exportedAt: new Date().toISOString(),
            });
            result.exported += 1;
            if (result.exported % 10 === 0) {
                console.log(`  저장 ${result.exported}/${items.length}`);
            }
        } catch (error) {
            result.failed.push({ day, date: item.date, title: item.title, pageId: item.pageId, error: error.message });
            console.log(`  실패 Day ${day} ${item.date}: ${error.message}`);
        }
        await sleep(150);
    }

    for (let day = 1; day <= 365; day += 1) {
        const file = path.join(outRoot, planId, `${String(day).padStart(3, '0')}.json`);
        try {
            await fs.access(file);
        } catch {
            result.missing.push(day);
        }
    }

    return result;
};

const main = async () => {
    if (selectedVersions.length === 0) {
        throw new Error(`대상 planId가 없습니다: ${targetPlanIds.join(', ')}`);
    }

    const results = [];
    for (const [planId, tagName] of selectedVersions) {
        results.push(await exportPlan(planId, tagName));
    }

    await writeJson(path.join(outRoot, 'manifest.json'), {
        generatedAt: new Date().toISOString(),
        source: 'notion-via-supabase-proxy',
        results,
    });

    console.log('\n완료');
    console.log(JSON.stringify(results.map((r) => ({
        planId: r.planId,
        exported: r.exported,
        failed: r.failed.length,
        missing: r.missing.length,
    })), null, 2));

    if (results.some((r) => r.failed.length || r.missing.length)) {
        process.exitCode = 1;
    }
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
