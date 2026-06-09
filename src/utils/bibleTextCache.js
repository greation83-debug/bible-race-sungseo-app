const BIBLE_CACHE_BASE = `${import.meta.env.BASE_URL || './'}bible-cache`.replace(/\/+$/, '');

export const getBibleCachePath = (planId, day) => {
    const safePlanId = String(planId || '1year_revised').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeDay = String(day).padStart(3, '0');
    return `${BIBLE_CACHE_BASE}/${safePlanId}/${safeDay}.json`;
};

export const fetchStaticBibleText = async (planId, day) => {
    const url = getBibleCachePath(planId, day);
    try {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data || !data.text) return null;
        return data;
    } catch (error) {
        console.warn('정적 성경본문 캐시 읽기 실패:', url, error);
        return null;
    }
};
