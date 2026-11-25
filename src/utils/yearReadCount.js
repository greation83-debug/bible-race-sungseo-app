// 해마다 "N독" 세기를 1독부터 다시 시작하기 위한 계산 모음.
//
// - readCount: 평생 몇 독째인지(1부터). 메모 차수(memo.readCount)와 맞물려 있으므로 절대 되돌리지 않는다.
// - countYear: 올해 독수의 기준 연도(한국 시간).
// - yearBaseCount: countYear 1월 1일(또는 그 해 첫 접속) 때의 readCount.
// - currentDay: 읽던 위치. 새해에도 그대로 이어서 읽는다.
//
// 올해 독수 = countYear == 올해 ? readCount - yearBaseCount + 1 : 1
// 새해에 아직 접속하지 않은 사람도 계산상 1독으로 보인다.
// 순위·소그룹 진행률·레이스맵·관리자 화면은 모두 이 파일의 함수로 계산한다.

// 이 해부터 해마다 초기화한다. 그 전 해에는 지금처럼 평생 독수를 그대로 보여준다.
export const YEAR_RESET_START_YEAR = 2027;

const DAYS_PER_ROUND = 365;

// 한국 시간 기준 연도
export const kstYear = (now = new Date()) => {
    const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(now));
    return Number.isFinite(year) ? year : now.getFullYear();
};

const lifetimeReadCount = (member) => Math.max(1, Number(member && member.readCount) || 1);

const clampDay = (member) => Math.min(DAYS_PER_ROUND, Math.max(1, Number(member && member.currentDay) || 1));

// 화면에 보이는 "N독" (올해 기준)
export const getYearReadCount = (member, now = new Date()) => {
    const readCount = lifetimeReadCount(member);
    const year = kstYear(now);
    if (year < YEAR_RESET_START_YEAR) return readCount;
    if (!member || Number(member.countYear) !== year) return 1;
    const base = Number(member.yearBaseCount);
    if (!Number.isFinite(base) || base < 1) return 1;
    return Math.max(1, readCount - base + 1);
};

// 올해 누적 진행 DAY (순위·레이스맵·소그룹 평균에 사용): (올해독수-1)*365 + currentDay
export const getYearProgressDay = (member, now = new Date()) => (
    (getYearReadCount(member, now) - 1) * DAYS_PER_ROUND + clampDay(member)
);

// 올해 다 읽은 날 수: (올해독수-1)*365 + (currentDay-1)
export const getYearCompletedDays = (member, now = new Date()) => getYearProgressDay(member, now) - 1;

// 올해 첫 접속·첫 읽기 때 회원 문서에 써야 할 기준값. 이미 올해 값이 있으면 null.
// readCountBefore: 이번 쓰기 전의 평생 readCount (읽기 처리 중 독수가 오르기 전 값)
export const buildYearBaseFields = (member, now = new Date(), readCountBefore) => {
    const year = kstYear(now);
    if (year < YEAR_RESET_START_YEAR) return null;
    if (member && Number(member.countYear) === year && Number(member.yearBaseCount) >= 1) {
        return null;
    }
    const base = readCountBefore !== undefined
        ? Math.max(1, Number(readCountBefore) || 1)
        : lifetimeReadCount(member);
    return { countYear: year, yearBaseCount: base };
};

// summary/레이스맵에 함께 실어 보낼 필드 (다른 회원 화면에서도 같은 계산이 되도록)
const toNumberOrNull = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

export const pickYearFields = (member) => ({
    countYear: toNumberOrNull(member && member.countYear),
    yearBaseCount: toNumberOrNull(member && member.yearBaseCount),
});

// 순위 정렬용 비교 함수 (올해 누적 진행 내림차순)
export const compareByYearProgress = (now = new Date()) => (a, b) => (
    getYearProgressDay(b, now) - getYearProgressDay(a, now)
);
