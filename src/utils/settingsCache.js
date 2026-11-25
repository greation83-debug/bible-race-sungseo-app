// 공지·카톡 링크를 기기에 하루(한국 날짜 기준) 저장해 Firestore 읽기를 줄인다.
// localStorage를 못 쓰는 환경(사생활 보호 모드 등)에서는 조용히 Firestore로 돌아간다.
import { kstDateKey } from './dateUtils';

const PREFIX = 'settings_cache_v1_';

export const readDailySetting = (key, today = kstDateKey()) => {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.date !== today || !('value' in parsed)) return undefined;
        return parsed.value;
    } catch (e) {
        return undefined;
    }
};

export const writeDailySetting = (key, value, today = kstDateKey()) => {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify({ date: today, value: value === undefined ? null : value }));
    } catch (e) {
        // 저장 실패해도 화면에는 영향 없음
    }
};
