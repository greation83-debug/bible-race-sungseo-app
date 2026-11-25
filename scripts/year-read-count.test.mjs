// 새해 독수 초기화 시험: node --import ./scripts/test-extensionless-loader.mjs --test scripts/year-read-count.test.mjs
// 2026-12-31 → 2027-01-01(한국 시간)으로 시계를 바꿔 가며 확인한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    kstYear, getYearReadCount, getYearProgressDay, getYearCompletedDays,
    buildYearBaseFields, pickYearFields, compareByYearProgress,
} from '../src/utils/yearReadCount.js';
import { getMemosForDay } from '../src/utils/memoUtils.js';

const DEC31 = new Date('2026-12-31T23:30:00+09:00');
const JAN1 = new Date('2027-01-01T00:10:00+09:00');
// 한국은 이미 1월 1일이지만 UTC로는 아직 12월 31일인 순간
const JAN1_EARLY_UTC_DEC31 = new Date('2026-12-31T15:30:00Z');

// 전역 시계를 바꿔서 내부에서 new Date()를 쓰는 함수(소그룹 통계 등)도 시험한다.
const withClock = async (fixed, fn) => {
    const RealDate = globalThis.Date;
    class FakeDate extends RealDate {
        constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); }
        static now() { return fixed.getTime(); }
    }
    globalThis.Date = FakeDate;
    try { return await fn(); } finally { globalThis.Date = RealDate; }
};

// 작년(2026)에 3독째 DAY 200을 읽던 사람 — 아직 countYear 없음
const veteran = { uid: 'v', name: '베테랑', readCount: 3, currentDay: 200 };
// 1독째 DAY 300
const beginner = { uid: 'b', name: '초보', readCount: 1, currentDay: 300 };

test('한국 시간 기준 연도', () => {
    assert.equal(kstYear(DEC31), 2026);
    assert.equal(kstYear(JAN1), 2027);
    assert.equal(kstYear(JAN1_EARLY_UTC_DEC31), 2027);
});

test('12/31까지는 지금처럼 평생 독수, 새해 기준값도 쓰지 않음', () => {
    assert.equal(getYearReadCount(veteran, DEC31), 3);
    assert.equal(getYearProgressDay(veteran, DEC31), 2 * 365 + 200);
    assert.equal(buildYearBaseFields(veteran, DEC31), null);
});

test('① 1/1에는 접속 안 한 사람도 1독으로 보임 ② currentDay 유지', () => {
    assert.equal(getYearReadCount(veteran, JAN1), 1);
    assert.equal(getYearReadCount({ ...veteran, countYear: 2026, yearBaseCount: 1 }, JAN1), 1);
    assert.equal(getYearProgressDay(veteran, JAN1), 200); // 읽던 DAY 200 그대로
    assert.equal(veteran.currentDay, 200);
    assert.equal(veteran.readCount, 3); // 평생 값은 그대로
});

test('새해 첫 접속 때 본인 문서에 countYear/yearBaseCount 기록 후에도 1독', () => {
    const fields = buildYearBaseFields(veteran, JAN1);
    assert.deepEqual(fields, { countYear: 2027, yearBaseCount: 3 });
    const loggedIn = { ...veteran, ...fields };
    assert.equal(getYearReadCount(loggedIn, JAN1), 1);
    assert.equal(buildYearBaseFields(loggedIn, JAN1), null); // 두 번 쓰지 않음
    assert.deepEqual(pickYearFields(loggedIn), { countYear: 2027, yearBaseCount: 3 });
    assert.deepEqual(pickYearFields(veteran), { countYear: null, yearBaseCount: null });
});

test('그 해 안에 365일을 다 읽어 readCount가 오르면 올해 2독', () => {
    const loggedIn = { ...veteran, countYear: 2027, yearBaseCount: 3 };
    const finished = { ...loggedIn, readCount: 4, currentDay: 1 };
    assert.equal(getYearReadCount(finished, JAN1), 2);
    assert.equal(getYearProgressDay(finished, JAN1), 365 + 1);
});

test('기준값 없이 새해 첫 읽기에서 바로 완주해도 2독 (읽기 처리 경로)', () => {
    // 탭을 열어둔 채 해를 넘겨 바로 DAY 365를 읽은 경우: 오르기 전 값(3)을 기준으로 남긴다.
    const nearEnd = { ...veteran, currentDay: 365 };
    const fields = buildYearBaseFields(nearEnd, JAN1, nearEnd.readCount);
    const after = { ...nearEnd, ...fields, readCount: 4, currentDay: 1 };
    assert.equal(getYearReadCount(after, JAN1), 2);
});

test('③ 순위: 새해에는 올해 진행으로 정렬 (1독째 DAY 300 > 3독째 DAY 200)', () => {
    const decOrder = [veteran, beginner].sort(compareByYearProgress(DEC31)).map(m => m.uid);
    assert.deepEqual(decOrder, ['v', 'b']);
    const janOrder = [veteran, beginner].sort(compareByYearProgress(JAN1)).map(m => m.uid);
    assert.deepEqual(janOrder, ['b', 'v']);
    assert.equal(getYearCompletedDays(beginner, JAN1), 299);
    assert.equal(getYearCompletedDays(veteran, JAN1), 199);
});

test('③ 소그룹 진행률·누적 읽기왕도 같은 함수로 계산 (전역 시계 변경)', async () => {
    const { calculateSubgroupStats } = await import('../src/utils/statsUtils.js');
    const { getCompletedReadingDays } = await import('../src/utils/readHistoryUtils.js');
    const { MOCK_COMMUNITIES } = await import('../src/data/communities.js');
    const comm = MOCK_COMMUNITIES[0];
    const sub = comm.subgroups[0];
    const members = [
        { ...veteran, communityId: comm.id, subgroupId: sub },
        { ...beginner, communityId: comm.id, subgroupId: sub },
    ];
    const key = `${comm.id}_${sub}`;
    const dec = await withClock(DEC31, () => calculateSubgroupStats(members)[key]);
    const jan = await withClock(JAN1, () => calculateSubgroupStats(members)[key]);
    assert.equal(dec.avgDay, Math.round((2 * 365 + 200 + 300) / 2));
    assert.equal(jan.avgDay, Math.round((200 + 300) / 2));
    assert.equal(await withClock(DEC31, () => getCompletedReadingDays(veteran)), 2 * 365 + 199);
    assert.equal(await withClock(JAN1, () => getCompletedReadingDays(veteran)), 199);
});

test('④ 메모는 평생 readCount로 계속 보임 (새해에도 그대로)', () => {
    const memos = {
        m1: { id: 'm1', day: 199, readCount: 3, text: '3독째 199일 묵상', date: '2026-12-30' },
        m2: { id: 'm2', day: 199, readCount: 1, text: '1독째 199일 묵상', date: '2024-07-01' },
        old: { day: 199, text: '차수 없는 옛 메모', date: '2023-01-01' },
    };
    const loggedIn = { ...veteran, ...buildYearBaseFields(veteran, JAN1) };
    // 메모 화면은 currentUser.readCount(평생 값, 3)를 그대로 넘긴다
    const shown = getMemosForDay(memos, 199, loggedIn.readCount).map(m => m.text);
    assert.deepEqual(shown, ['차수 없는 옛 메모', '3독째 199일 묵상']);
    assert.equal(getYearReadCount(loggedIn, JAN1), 1); // 화면 표시는 1독
});

test('다시 시작(재시작)과 관리자 수정 때 기준값', () => {
    assert.deepEqual(buildYearBaseFields(null, JAN1, 1), { countYear: 2027, yearBaseCount: 1 });
    // 기준값이 readCount보다 크게 꼬여도 0독/음수로 내려가지 않음
    assert.equal(getYearReadCount({ readCount: 1, currentDay: 5, countYear: 2027, yearBaseCount: 3 }, JAN1), 1);
});

test('2028년이 되면 다시 1독', () => {
    const y2027 = { ...veteran, readCount: 5, countYear: 2027, yearBaseCount: 3 };
    const Y2028 = new Date('2028-01-01T00:00:01+09:00');
    assert.equal(getYearReadCount(y2027, JAN1), 3);
    assert.equal(getYearReadCount(y2027, Y2028), 1);
    assert.deepEqual(buildYearBaseFields(y2027, Y2028), { countYear: 2028, yearBaseCount: 5 });
});
