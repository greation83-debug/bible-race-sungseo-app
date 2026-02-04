import React from 'react';

/**
 * Cyworld 'Mini-me' 스타일 캐릭터 렌더러
 * 픽셀 아트의 따뜻한 감성과 아이소메트릭 비율을 SVG로 정교하게 구현합니다.
 */
const MiniMeRenderer = ({
    gender = 'man', // 'man', 'woman'
    hairId = null,
    outfitId = null,
    accId = null,
    isMe = false,
    className = ""
}) => {
    // 싸이월드 특유의 따뜻하고 부드러운 컬러 팔레트
    const SKIN_COLOR = "#FFDDBB"; // 더 뽀얀 살구빛
    const OUTLINE_COLOR = "#4A332B"; // 진한 브라운 (검정보다 부드러움)
    const EYE_COLOR = "#2D1B1B";
    const MOUTH_COLOR = "#FF9999";
    const BLUSH_COLOR = "rgba(255, 182, 193, 0.6)"; // 투명도 있는 핑크
    const HIGHLIGHT_COLOR = "rgba(255, 255, 255, 0.5)";
    const SHADOW_COLOR = "rgba(0, 0, 0, 0.15)";

    // 머리 색상 매핑 (싸이월드 감성 블랙/브라운/금발)
    const getHairColor = (id) => {
        if (id?.includes('brown')) return "#704214";
        if (id?.includes('yellow') || id?.includes('gold')) return "#E6C15A";
        if (id?.includes('red')) return "#8B0000";
        return "#333333"; // 딥 그레이/블랙
    };

    const hairColor = getHairColor(hairId);

    return (
        <svg
            viewBox="0 0 32 48"
            className={`w-full h-full ${className}`}
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 0. 발밑 그림자 (입체감 부여) */}
            <ellipse cx="16" cy="42" rx="7" ry="2.5" fill={SHADOW_COLOR} />

            {/* 1. 시그니처: 떠다니는 하트 */}
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
                <path d="M16 3 L18 1.5 Q19 1 20 2 Q21 3 19 5 L16 8 L13 5 Q11 3 12 2 Q13 1 14 1.5 Z" fill="#FF4D4D" />
            </g>

            {/* 2. 다리 (Legs) */}
            <g>
                <rect x="12.5" y="34" width="3" height="8" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="1.5" />
                <rect x="16.5" y="34" width="3" height="8" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="1.5" />
            </g>

            {/* 3. 몸통 및 의상 (Body & Outfit) */}
            <g>
                {/* 기본 몸 */}
                <rect x="10.5" y="24" width="11" height="11" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="3" />

                {/* 의상 레이어 */}
                {outfitId === 'outfit_sailor' && (
                    <g>
                        <path d="M10.5 24 H21.5 V33 Q21.5 35 16 35 Q10.5 35 10.5 33 Z" fill="#FFFFFF" stroke={OUTLINE_COLOR} strokeWidth="0.6" />
                        <rect x="10.5" y="24" width="11" height="2.5" fill="#3B82F6" />
                        <rect x="15" y="25" width="2" height="3" fill="#EF4444" rx="0.5" />
                        <rect x="10.5" y="32" width="11" height="3" fill="#3B82F6" />
                    </g>
                )}
                {outfitId === 'outfit_overalls' && (
                    <g>
                        <path d="M10.5 24 H21.5 V33 Q21.5 35 16 35 Q10.5 35 10.5 33 Z" fill="#FFFFFF" stroke={OUTLINE_COLOR} strokeWidth="0.6" />
                        <rect x="10.5" y="27" width="11" height="8" fill="#5271FF" />
                        <rect x="11.5" y="24" width="2" height="5" fill="#5271FF" />
                        <rect x="18.5" y="24" width="2" height="5" fill="#5271FF" />
                    </g>
                )}
                {outfitId && !['outfit_sailor', 'outfit_overalls'].includes(outfitId) && (
                    <path d="M10.5 24 H21.5 V33 Q21.5 35 16 35 Q10.5 35 10.5 33 Z" fill="#E2E8F0" stroke={OUTLINE_COLOR} strokeWidth="0.6" />
                )}

                {/* 팔 (Arms) */}
                <rect x="7.5" y="25" width="3.5" height="8" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="1.5" />
                <rect x="21" y="25" width="3.5" height="8" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="1.5" />
            </g>

            {/* 4. 머리 (Head) - 정겨운 둥근 사각형 형태 */}
            <g>
                <rect x="8" y="10" width="16" height="15" fill={SKIN_COLOR} stroke={OUTLINE_COLOR} strokeWidth="0.6" rx="7" />

                {/* 눈 (Eyes) - 낮게 배치하여 싸이월드 특유의 순한 맛 강조 */}
                <circle cx="12.5" cy="19" r="0.8" fill={EYE_COLOR} />
                <circle cx="19.5" cy="19" r="0.8" fill={EYE_COLOR} />

                {/* 코/입 - 아주 작게 점으로 */}
                <rect x="15.5" cy="21" width="1" height="0.4" fill={OUTLINE_COLOR} opacity="0.3" rx="0.2" />
                <rect x="15" y="22" width="2" height="0.6" fill={MOUTH_COLOR} rx="0.3" />

                {/* 볼터치 (Blush) */}
                <circle cx="11" cy="20.5" r="1.5" fill={BLUSH_COLOR} />
                <circle cx="21" cy="20.5" r="1.5" fill={BLUSH_COLOR} />
            </g>

            {/* 5. 머리카락 (Hair Style) */}
            <g fill={hairColor}>
                {/* 기본 윗머리 */}
                <path d="M8 17 Q8 8 16 8 Q24 8 24 17 L24 14 L8 14 Z" stroke={OUTLINE_COLOR} strokeWidth="0.4" />
                <rect x="8" y="10" width="16" height="4.5" rx="3" />

                {/* 시그니처 광택 하이라이트 */}
                <rect x="11" y="11" width="3" height="1" fill={HIGHLIGHT_COLOR} rx="0.5" />
                <rect x="12" y="10.5" width="1" height="2" fill={HIGHLIGHT_COLOR} rx="0.5" />

                {/* 성별/헤어스타일 변형 */}
                {gender === 'woman' && (
                    <g>
                        {/* 더 길고 풍성한 옆머리 */}
                        <path d="M6.5 14 Q5 14 5 26 H8.5 L8.5 14 Z" stroke={OUTLINE_COLOR} strokeWidth="0.5" />
                        <path d="M25.5 14 Q27 14 27 26 H23.5 L23.5 14 Z" stroke={OUTLINE_COLOR} strokeWidth="0.5" />
                    </g>
                )}
                {gender === 'man' && (
                    <g>
                        {/* 까치집 같은 살짝 삐친 머리 포인트 */}
                        <path d="M12 8 L13 6 L14 8 Z" fill={hairColor} />
                    </g>
                )}
            </g>

            {/* 6. 악세서리 (Glasses 등) */}
            {accId?.includes('glasses') && (
                <g fill="none" stroke={OUTLINE_COLOR} strokeWidth="0.5">
                    <rect x="10.5" y="17.5" width="4" height="3" rx="0.5" />
                    <rect x="17.5" y="17.5" width="4" height="3" rx="0.5" />
                    <line x1="14.5" y1="19" x2="17.5" y2="19" />
                </g>
            )}
        </svg>
    );
};

export default MiniMeRenderer;
