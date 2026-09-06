const DEFAULT_RECENT_DAY_LIMIT = 35;

export const getHistoryDate = (item) => {
    if (typeof item === 'string') return item;
    return item && item.date ? item.date : null;
};

export const getHistoryDaysRead = (item) => {
    const rawValue = typeof item === 'object' && item !== null ? Number(item.daysRead) : 1;
    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
};

export const buildRecentReadDailyCounts = (readHistory, maxDays = DEFAULT_RECENT_DAY_LIMIT) => {
    if (!Array.isArray(readHistory)) return [];

    const countsByDate = new Map();
    readHistory.forEach(item => {
        const date = getHistoryDate(item);
        if (!date) return;

        if (!countsByDate.has(date)) {
            countsByDate.set(date, { date, daysRead: 0 });
        }
        countsByDate.get(date).daysRead += getHistoryDaysRead(item);
    });

    return Array.from(countsByDate.values()).slice(-maxDays);
};

export const normalizeRecentReadDailyCounts = (member, maxDays = DEFAULT_RECENT_DAY_LIMIT) => {
    if (Array.isArray(member && member.recentReadDailyCounts)) {
        return member.recentReadDailyCounts
            .map(item => ({
                date: getHistoryDate(item),
                daysRead: getHistoryDaysRead(item),
            }))
            .filter(item => item.date)
            .slice(-maxDays);
    }

    if (Array.isArray(member && member.readHistory) && member.readHistory.length > 0) {
        return buildRecentReadDailyCounts(member.readHistory, maxDays);
    }

    if (Array.isArray(member && member.recentReadDates)) {
        return buildRecentReadDailyCounts(member.recentReadDates, maxDays);
    }

    return [];
};

export const addRecentReadActivity = (
    recentReadDailyCounts,
    date,
    daysRead = 1,
    maxDays = DEFAULT_RECENT_DAY_LIMIT
) => {
    const normalized = normalizeRecentReadDailyCounts({ recentReadDailyCounts }, maxDays);
    const next = normalized.filter(item => item.date !== date);
    const previous = normalized.find(item => item.date === date);
    next.push({
        date,
        daysRead: (previous ? previous.daysRead : 0) + getHistoryDaysRead({ daysRead }),
    });
    return next.slice(-maxDays);
};

export const getCompletedReadingDays = (member) => {
    const readCount = Math.max(1, Number(member && member.readCount) || 1);
    const currentDay = Math.min(365, Math.max(1, Number(member && member.currentDay) || 1));
    return (readCount - 1) * 365 + (currentDay - 1);
};
