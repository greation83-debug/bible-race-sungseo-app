const asDayNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

// 새 묵상 문서와 기존 users.memos 맵을 동일한 글 단위 목록으로 변환한다.
export const getMemoEntries = (memos = {}) => Object.entries(memos || {}).flatMap(([key, memo]) => {
    if (!memo || typeof memo !== 'object') return [];

    if (memo.day !== undefined && !Array.isArray(memo.texts)) {
        return [{
            id: memo.id || key,
            day: asDayNumber(memo.day),
            readCount: memo.readCount ? Number(memo.readCount) : null,
            text: memo.text || '',
            date: memo.date || '',
            title: memo.title || '',
            legacy: Boolean(memo.legacy),
        }];
    }

    const texts = Array.isArray(memo.texts) ? memo.texts : [memo.text || ''];
    return texts.filter(text => String(text).trim()).map((text, index) => ({
        id: `legacy-${key}-${index}`,
        day: asDayNumber(memo.day !== undefined ? memo.day : key),
        readCount: memo.readCount ? Number(memo.readCount) : null,
        text,
        date: memo.date || '',
        title: memo.title || '',
        legacy: true,
    }));
});

export const memoEntriesToMap = (entries = []) => entries.reduce((result, entry) => {
    if (entry && entry.id) result[entry.id] = entry;
    return result;
}, {});

export const countMemoEntries = (memos = {}) => getMemoEntries(memos).length;

export const getMemosForDay = (memos, day, readCount) => getMemoEntries(memos)
    .filter(entry => entry.day === Number(day)
        && (entry.readCount === null || entry.readCount === Number(readCount)))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

export const sortMemoEntriesNewestFirst = (memos) => getMemoEntries(memos)
    .sort((a, b) => {
        const dateOrder = String(b.date).localeCompare(String(a.date));
        if (dateOrder !== 0) return dateOrder;
        if ((b.readCount || 0) !== (a.readCount || 0)) return (b.readCount || 0) - (a.readCount || 0);
        return b.day - a.day;
    });

