const normaliseBase = (base) => `${base || './'}bible-cache`.replace(/\/+$/, '');

const BIBLE_CACHE_BASES = Array.from(new Set([
    normaliseBase(import.meta.env.BASE_URL),
    normaliseBase('./'),
    normaliseBase('/bible-race-sungseo-app/'),
    normaliseBase('/'),
]));

export const getBibleCachePath = (planId, day, base = BIBLE_CACHE_BASES[0]) => {
    const safePlanId = String(planId || '1year_revised').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeDay = String(day).padStart(3, '0');
    return `${base}/${safePlanId}/${safeDay}.json`;
};

/* global __VITE_BUILD_TIME__ */
const CACHE_BUST = typeof __VITE_BUILD_TIME__ !== 'undefined' ? __VITE_BUILD_TIME__ : '';

export const fetchStaticBibleText = async (planId, day) => {
    let lastError = null;

    for (const base of BIBLE_CACHE_BASES) {
        const rawUrl = getBibleCachePath(planId, day, base);
        const url = CACHE_BUST ? `${rawUrl}?v=${CACHE_BUST}` : rawUrl;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // 1회 재시도
                const retry = await fetch(url);
                if (!retry.ok) continue;
                const data = await retry.json();
                if (!data || !data.text) continue;
                return data;
            }
            const data = await response.json();
            if (!data || !data.text) continue;
            return data;
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        console.warn('정적 성경본문 캐시 읽기 실패:', planId, day, lastError);
    }
    return null;
};
