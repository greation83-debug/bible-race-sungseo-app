// 실행: node --import ./scripts/test-extensionless-loader.mjs --test scripts/admin-improvements.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
};

const { readDailySetting, writeDailySetting } = await import('../src/utils/settingsCache.js');
const { estimateMemosCSVReads } = await import('../src/utils/exportUtils.js');

test('공지·카톡 캐시: 같은 날만 쓰고 날짜가 바뀌면 다시 읽음', () => {
    assert.equal(readDailySetting('kakao', '2026-11-25'), undefined);
    writeDailySetting('kakao', 'https://open.kakao.com/x', '2026-11-25');
    assert.equal(readDailySetting('kakao', '2026-11-25'), 'https://open.kakao.com/x');
    assert.equal(readDailySetting('kakao', '2026-11-26'), undefined);
    writeDailySetting('announcement', null, '2026-11-25');
    assert.equal(readDailySetting('announcement', '2026-11-25'), null); // "공지 없음"도 캐시
});

test('localStorage가 고장 나도 오류 없이 undefined', () => {
    const saved = globalThis.localStorage;
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    try {
        assert.equal(readDailySetting('kakao'), undefined);
        assert.doesNotThrow(() => writeDailySetting('kakao', 'x'));
    } finally { globalThis.localStorage = saved; }
});

test('묵상 CSV 예상 읽기 건수: 회원마다 묵상 수(빈 회원 최소 1건)', () => {
    const users = [
        { uid: 'a', memoCount: 10 },
        { uid: 'b', memoCount: 0 },
        { uid: 'c', memos: { x: { day: 1, text: '옛 메모' } } },
    ];
    assert.equal(estimateMemosCSVReads(users), 10 + 1 + 1);
    assert.equal(estimateMemosCSVReads(users, true), 12 + 3);
    assert.equal(estimateMemosCSVReads([]), 0);
});
