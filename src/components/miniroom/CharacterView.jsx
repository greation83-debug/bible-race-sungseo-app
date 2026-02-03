import React from 'react';
import { SHOP_ITEMS } from '../../data/shop_items';

/**
 * 캐릭터 레이어 렌더링 컴포넌트
 * base + hair + accessory + outfit 순서로 겹쳐서 보여줍니다.
 */
const CharacterView = ({ character, size = "text-5xl", className = "" }) => {
    if (!character) return null;

    const base = SHOP_ITEMS.find(i => i.id === character.baseId);
    const hair = SHOP_ITEMS.find(i => i.id === character.hairId);
    const acc = SHOP_ITEMS.find(i => i.id === character.accessoryId);
    const outfit = SHOP_ITEMS.find(i => i.id === character.outfitId);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* 베이스 캐릭터 (몸) */}
            <div className={`${size} z-10`}>{base?.icon || '👤'}</div>

            {/* 머리 스타일 */}
            {hair && (
                <div className="absolute -top-1 z-20 text-3xl" style={{ transform: 'translateY(-20%)' }}>
                    {hair.icon}
                </div>
            )}

            {/* 의상 */}
            {outfit && (
                <div className="absolute inset-x-0 bottom-0 z-15 text-4xl text-center opacity-80" style={{ transform: 'translateY(10%)' }}>
                    {outfit.icon}
                </div>
            )}

            {/* 악세서리 (안경 등) */}
            {acc && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-2xl" style={{ transform: 'translate(-50%, -80%)' }}>
                    {acc.icon}
                </div>
            )}
        </div>
    );
};

export default CharacterView;
