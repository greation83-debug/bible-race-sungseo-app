// NIV 본문을 public/bible-cache/{1year_niv,nt_niv}/NNN.json 정적 파일로 만든다.
// (Notion 프록시가 멈춰 있어 Firestore verses 캐시에서 문서 ID로 직접 읽는다.)
//
// 읽기 최소화: 목록 조회(query) 없이 문서 ID batchGet만 쓴다. 문서 1개 = 읽기 1건.
// 이미 만들어진 파일은 다시 읽지 않는다. 예상 건수가 상한(기본 2,000)을 넘으면 읽지 않고 멈춘다.
//
// 사용: node scripts/export-firestore-niv-cache.mjs            (예상 건수만 출력)
//       FIREBASE_ACCOUNT=<관리자 계정> node scripts/export-firestore-niv-cache.mjs --run   (실제 읽기)
// Firebase CLI에 로그인된 관리자 계정을 쓰되, CLI 기본 계정은 바꾸지 않는다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const PROJECT = 'bible-sungseo';
const ACCOUNT_EMAIL = process.env.FIREBASE_ACCOUNT || ''; // Firebase CLI에 로그인된 관리자 계정 주소
const PLANS = ['1year_niv', 'nt_niv'];
const DAYS = 365;
const MAX_READS = 2000;
const BATCH = 100;

const outRoot = path.resolve('public/bible-cache');
const docName = (id) => `projects/${PROJECT}/databases/(default)/documents/verses/${id}`;
const fileFor = (planId, day) => path.join(outRoot, planId, `${String(day).padStart(3, '0')}.json`);

const exists = async (file) => fs.access(file).then(() => true, () => false);

const listTargets = async () => {
    const targets = [];
    for (const planId of PLANS) {
        for (let day = 1; day <= DAYS; day += 1) {
            if (!(await exists(fileFor(planId, day)))) targets.push({ planId, day, id: `${planId}_${day}` });
        }
    }
    return targets;
};

const getToken = async () => {
    const require = createRequire(import.meta.url);
    const auth = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/auth.js');
    if (!ACCOUNT_EMAIL) throw new Error('Firebase CLI 계정을 FIREBASE_ACCOUNT로 알려주세요');
    const account = (auth.getAllAccounts() || []).find(a => a.user && a.user.email === ACCOUNT_EMAIL);
    if (!account) throw new Error(`Firebase CLI에 ${ACCOUNT_EMAIL} 계정이 없습니다`);
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    return token.access_token;
};

const batchGet = async (token, ids) => {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:batchGet`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: ids.map(docName) }),
        signal: AbortSignal.timeout(30000),
        redirect: 'error',
    });
    if (!res.ok) throw new Error(`Firestore HTTP ${res.status}`);
    return res.json();
};

const fieldValue = (v) => {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('nullValue' in v) return null;
    return null;
};

const main = async () => {
    const run = process.argv.includes('--run');
    const targets = await listTargets();
    console.log(`예상 Firestore 읽기: ${targets.length}건 (상한 ${MAX_READS})`);
    if (targets.length > MAX_READS) throw new Error('예상 건수가 상한을 넘어 중단');
    if (!run || targets.length === 0) return;

    const token = await getToken();
    let reads = 0;
    const missing = [];
    let written = 0;
    // 먼저 2건만 읽어 문서 이름 규칙이 맞는지 확인(틀리면 나머지 730건을 낭비하지 않음)
    const probe = targets.filter(t => t.day === 1);
    const rest = targets.filter(t => t.day !== 1);
    for (const group of [probe, ...Array.from({ length: Math.ceil(rest.length / BATCH) }, (_, i) => rest.slice(i * BATCH, (i + 1) * BATCH))]) {
        if (group.length === 0) continue;
        const results = await batchGet(token, group.map(t => t.id));
        reads += group.length;
        const byName = new Map();
        for (const r of results) {
            if (r.found) byName.set(r.found.name, r.found);
            else if (r.missing) byName.set(r.missing, null);
        }
        for (const t of group) {
            const doc = byName.get(docName(t.id));
            const text = doc && fieldValue(doc.fields.text);
            if (!text) { missing.push(t.id); continue; }
            const file = fileFor(t.planId, t.day);
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, `${JSON.stringify({
                planId: t.planId,
                day: t.day,
                title: fieldValue(doc.fields.title) || '',
                text,
                audioUrl: fieldValue(doc.fields.audioUrl) || null,
                source: 'firestore-verses',
                exportedAt: new Date().toISOString(),
            }, null, 2)}\n`, 'utf8');
            written += 1;
        }
        if (group === probe && written === 0) {
            console.log(`확인용 2건이 비어 있어 중단 (읽기 ${reads}건)`);
            break;
        }
    }
    console.log(JSON.stringify({ reads, written, missing: missing.length, missingSample: missing.slice(0, 10) }));
};

main().catch((e) => {
    console.error(/^(Firestore HTTP|예상|Firebase CLI)/.test(e.message) ? e.message : '중단: 인증·네트워크·파일 오류');
    process.exitCode = 1;
});
