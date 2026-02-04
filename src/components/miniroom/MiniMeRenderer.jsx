import React from 'react';

/**
 * Cyworld 'Mini-me' 스타일 캐릭터 렌더러
 * 2.5D 아이소메트릭 느낌의 픽셀 아트 스타일을 SVG로 구현합니다.
 * Type B: 아기자기하고 친근한 비례 (SD)
 */
const MiniMeRenderer = ({
    gender = 'man', // 'man', 'woman'
    hairId = null,
    outfitId = null,
    accId = null,
    isMe = false,
    className = ""
}) => {
    // 기본 상수 (타입 B 컬러 스킴 - 따뜻한 느낌 강조)
    const SKIN_COLOR = "#FFE4C4";
    const OUTLINE_COLOR = "#3C2F2F"; // 부드러운 차콜 브라운
    const EYE_COLOR = "#2D1B1B";
    const MOUTH_COLOR = "#FF8080";
    const BLUSH_COLOR = "#FFD1D1";
    const HEART_COLOR = "#FF3333";

    // 머리 색상 매핑
    const getHairColor = (id) => {
        if (id?.includes('brown')) return "#8B4513";
        if (id?.includes('yellow')) return "#F0E68C";
        if (id?.includes('red')) return "#A52A2A";
        return "#2F2F2F";
    };

    const hairColor = getHairColor(hairId);

    return (
        <svg
            viewBox="0 0 32 44"
            className={`w-full h-full drop-shadow-sm ${className}`}
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 1. 싸이월드 시그니처: 떠다니는 하트 */}
            <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
                <path d="M16 2 L17 1 L18 2 L17 3 L16 4 L15 3 L14 2 L15 1 Z" fill={HEART_COLOR} />
            </g>

            {/* 2. 몸체 및 의상 레이어 */}
            <g>
                {/* 기본 몸/속옷 */}
                <rect x="11" y="24" width="10" height="12" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" rx="1" />

                {/* 특정 의상 렌더링 (세일러복/멜빵바지 추가) */}
                {outfitId === 'outfit_sailor' && (
                    <g>
                        <rect x="11" y="24" width="10" height="8" fill="#FFFFFF" />
                        <rect x="11" y="24" width="10" height="2" fill="#3B82F6" />
                        <rect x="14" y="26" width="4" height="4" fill="#3B82F6" rx="1" />
                        <rect x="11" y="32" width="10" height="4" fill="#3B82F6" />
                    </g>
                )}
                {outfitId === 'outfit_overalls' && (
                    <g>
                        <rect x="11" y="24" width="10" height="12" fill="white" />
                        <rect x="11" y="28" width="10" height="8" fill="#4B79A1" />
                        <rect x="12" y="24" width="1.5" height="4" fill="#4B79A1" />
                        <rect x="18.5" y="24" width="1.5" height="4" fill="#4B79A1" />
                    </g>
                )}
                {outfitId && !['outfit_sailor', 'outfit_overalls'].includes(outfitId) && (
                    <rect x="11" y="24" width="10" height="12" fill="#E2E8F0" opacity="0.9" />
                )}

                {/* 팔 (Arms) */}
                <rect x="8" y="25" width="3" height="7" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" />
                <rect x="21" y="25" width="3" height="7" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" />

                {/* 다리 (Legs) */}
                <rect x="12" y="36" width="3" height="6" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" />
                <rect x="17" y="36" width="3" height="6" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" />
            </g>

            {/* 3. 머리 (Head) - 더욱 둥글고 귀여운 비례로 수정 */}
            <rect x="8.5" y="10" width="15" height="14" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.5" rx="6" />

            {/* 눈 (Eyes) - 살짝 아래로 내려 더 귀여운 인상 생성 */}
            <rect x="12" y="18.5" width="1.2" height="1.2" fill={EYE_COLOR} rx="0.3" />
            <rect x="18.8" y="18.5" width="1.2" height="1.2" fill={EYE_COLOR} rx="0.3" />

            {/* 입 (Mouth) - 아주 작게 */}
            <rect x="15" y="21.5" width="2" height="0.5" fill={MOUTH_COLOR} />

            {/* 볼터치 (Blush) - 눈 바로 아래로 배치 */}
            <rect x="10.5" y="19.5" width="2.5" height="1.2" fill={BLUSH_COLOR} rx="0.5" />
            <rect x="19" y="19.5" width="2.5" height="1.2" fill={BLUSH_COLOR} rx="0.5" />

            {/* 4. 머리카락 (Hair Style) - 하이라이트와 곡선 보강 */}
            <g fill={hairColor}>
                {/* 앞머리: 더 둥글게 */}
                <path d="M8.5 15 Q8.5 10 16 10 Q23.5 10 23.5 15 L23.5 13 L8.5 13 Z" />
                <rect x="8.5" y="10" width="15" height="3" rx="1.5" />

                {/* 옆머리: 귀여운 곡선 느낌 */}
                <rect x="8.5" y="13" width="2" height="7" rx="1" />
                <rect x="21.5" y="13" width="2" height="7" rx="1" />

                {/* 시그니처 픽셀 하이라이트: 더 선명하게 */}
                <rect x="11" y="11.5" width="2" height="1" fill="white" opacity="0.4" />
                <rect x="11.5" y="11" width="1" height="2" fill="white" opacity="0.4" />

                {/* 성별/아이디에 따른 변형 (단발/긴머리) */}
                {gender === 'woman' && (
                    <g>
                        <path d="M7 14 Q6 14 6 24 L8.5 24 L8.5 14 Z" />
                        <path d="M25 14 Q26 14 26 24 L23.5 24 L23.5 14 Z" />
                    </g>
                )}
            </g>

            {/* 5. 악세서리 (안경 등) */}
            {accId?.includes('glasses') && (
                <g fill="none" stroke={OUTLINE_COLOR} strokeWidth="0.4">
                    <rect x="11" y="16.5" width="3.5" height="2.5" />
                    <rect x="17.5" y="16.5" width="3.5" height="2.5" />
                    <line x1="14.5" y1="18" x2="17.5" y2="18" />
                </g>
            )}
        </svg>
    );
};

export default MiniMeRenderer;
