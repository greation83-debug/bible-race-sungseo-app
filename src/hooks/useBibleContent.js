import { useState, useCallback } from 'react';
import { db } from '../utils/firebase';
import { SUPABASE_FUNCTION_URL, GENESIS_1, AUDIO_BASE_URL } from '../data/constants';
import { BIBLE_VERSIONS, PLAN_TYPES } from '../data/bible_options';
import { getActualDay } from '../utils/helpers';

/**
 * 새한글 버전 본문 전처리: 절 번호 앞에 줄바꿈 삽입 및 마크업 추가
 * 패턴: 문장 시작 또는 구두점 뒤의 숫자(단위가 아닌 경우)
 */
const formatSaehangulText = (text) => {
    if (!text) return text;

    // 개선된 패턴:
    // 1. (^|[.!?""“”‘’\(\)\[\]]\s*) : 문장 시작 또는 각종 문장 부호/괄호 뒤(공백 포함)
    // 2. (\d+) : 절 번호
    // 3. (?!\s*(개월|개|년|일|번|차|회|명|층|시|분|초|세|살|권|편|절|장|막)(?![가-힣])) : 뒤에 단위가 붙는 경우 제외
    // 4. (?=\s*[^0-9]) : 뒤에 숫자가 아닌 문자가 오는 경우 (연속된 숫자의 중간이 아님을 보장)
    const versePattern = /(^|[.!?""“”‘’\(\)\[\]]\s*)(\d+)(?!\s*(개월|개|년|일|번|차|회|명|층|시|분|초|세|살|권|편|절|장|막)(?![가-힣]))(?=\s*[^0-9])/gm;

    // 절 번호를 [[VERSE:숫자]] 형식으로 마킹 (나중에 렌더러에서 스타일링)
    // 첫 번째 절(문장 시작)은 줄바꿈 없이, 나머지는 줄바꿈 추가
    let isFirst = true;
    const formatted = text.replace(versePattern, (match, prefix, verseNum) => {
        const marker = `[[VERSE:${verseNum}]]`;

        // 줄바꿈 조건: 문장 시작이 아니고 앞부분에 공백이나 부호가 있는 경우
        if (isFirst && prefix.trim() === '') {
            isFirst = false;
            return marker;
        }
        isFirst = false;

        // 줄바꿈과 함께 마커 반환 (기존 공백/부호 유지)
        return `${prefix}\n${marker}`;
    });

    return formatted;
};

export const useBibleContent = (currentUser) => {
    const [verseData, setVerseData] = useState({
        title: '',
        subtitle: '',
        text: '',
        audioUrl: null,
        loading: false
    });
    const [viewingDay, setViewingDay] = useState(null);

    // Firestore에서 캐시된 본문 가져오기
    const fetchVerseFromCache = async (planId, day) => {
        if (!db) return null;
        try {
            const [planType, version] = (planId || '1year_revised').split('_');
            const cacheKey = `${planType}_${version}_${day}`;
            const doc = await db.collection('verses').doc(cacheKey).get();
            if (doc.exists) return doc.data();
        } catch (e) {
            console.error("캐시 읽기 실패:", e);
        }
        return null;
    };

    // 노션 API 호출 (캐시 없을 때 fallback)
    const fetchFromNotion = async (planId, currentDay) => {
        if (!SUPABASE_FUNCTION_URL) return { title: null, text: "서버 연결 설정이 필요합니다." };
        const [planType, version] = (planId || '1year_revised').split('_');
        const planGroup = BIBLE_VERSIONS[planType];
        const versionInfo = planGroup ? planGroup.find(v => v.id === version) : null;
        const targetTag = versionInfo ? versionInfo.tagName : '개역개정 일년일독';

        const targetDate = new Date(2025, 0, currentDay);
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');

        try {
            const response = await fetch(SUPABASE_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: targetTag, date: `${mm}-${dd}` })
            });
            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const data = await response.json();
            if (data.error) return { title: null, text: `[오류] ${data.error}` };
            return { title: data.title, text: data.text, audioUrl: data.audioUrl };
        } catch (e) {
            console.error(e);
            return { title: null, text: "서버와 통신 중 오류가 발생했습니다." };
        }
    };

    const fetchNotionData = async (planId, currentDay) => {
        const cached = await fetchVerseFromCache(planId, currentDay);
        if (cached && cached.text) return cached;
        return await fetchFromNotion(planId, currentDay);
    };

    const loadContent = useCallback(async (dayToShow) => {
        if (!currentUser) return;
        setVerseData(prev => ({ ...prev, loading: true }));

        const { planId, dayOffset = 0, readCount = 1 } = currentUser;
        const [planType, version] = (planId || '1year_revised').split('_');
        const planTypeData = PLAN_TYPES.find(p => p.id === planType);
        const planTypeName = planTypeData ? planTypeData.title : '성경 통독';

        const actualDay = getActualDay(dayToShow, dayOffset);
        const notionData = await fetchNotionData(planId, actualDay);

        const readCountBadge = readCount > 1 ? ` (${readCount}독)` : '';

        if (notionData && notionData.text && !notionData.text.startsWith('[오류]')) {
            let processedText = notionData.text;

            // 새한글 버전일 경우 절 표시 처리
            if (version && version.startsWith('saehangul')) {
                processedText = formatSaehangulText(processedText);
            }

            let finalAudioUrl = notionData.audioUrl || null;
            if (!finalAudioUrl && AUDIO_BASE_URL && AUDIO_BASE_URL.startsWith('http')) {
                const baseUrl = AUDIO_BASE_URL.replace(/\/$/, '');
                finalAudioUrl = `${baseUrl}/${planId}/${actualDay}.mp3`;
            }

            setVerseData({
                title: `${planTypeName} DAY ${dayToShow}일${readCountBadge}`,
                subtitle: notionData.title || `(제목 없음)`,
                text: processedText,
                audioUrl: finalAudioUrl,
                loading: false
            });
        } else {
            const planGroup = BIBLE_VERSIONS[planType];
            const versionInfo = planGroup ? planGroup.find(v => v.id === version) : null;
            const versionName = (versionInfo && versionInfo.name) || '기본';
            let displayText = actualDay === 1 ? GENESIS_1 : ((notionData && notionData.text) || `데이터를 불러올 수 없습니다.`);

            // 새한글 버전일 경우 절 표시 처리
            if (version && version.startsWith('saehangul')) {
                displayText = formatSaehangulText(displayText);
            }

            setVerseData({
                title: `${planTypeName} DAY ${dayToShow}일${readCountBadge}`,
                subtitle: `${versionName} 읽기`,
                text: displayText,
                audioUrl: null,
                loading: false
            });
        }
    }, [currentUser]);

    return {
        verseData,
        setVerseData,
        viewingDay,
        setViewingDay,
        loadContent
    };
};
