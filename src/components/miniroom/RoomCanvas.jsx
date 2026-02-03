import React, { useState } from 'react';
import SpriteItem from './SpriteItem';
import CharacterView from './CharacterView';
import { SHOP_ITEMS } from '../../data/shop_items';
import { Assets } from '../../assets/miniroom';

const RoomCanvas = ({
    activeRoom,
    character,
    previewItem,
    isPlacementMode = false,
    selectedPlacementId,
    onGridClick,
    onItemClick,
    onCharacterClick
}) => {
    const GRID_SIZE = 10;
    const TILE_W = 64;
    const TILE_H = 32;

    const wallpaperItem = SHOP_ITEMS.find(i => i.id === (activeRoom.wallpaper || 'wall_plain_white'));
    const floorItem = SHOP_ITEMS.find(i => i.id === (activeRoom.floor || 'floor_plain_gray'));

    const wallpaperUrl = wallpaperItem?.spriteSheet ? Assets[wallpaperItem.spriteSheet] : '';
    const wallPosPX = wallpaperItem ? -(wallpaperItem.spriteX * wallpaperItem.width) : 0;
    const wallPosPY = wallpaperItem ? -(wallpaperItem.spriteY * wallpaperItem.height) : 0;

    const floorUrl = floorItem?.spriteSheet ? Assets[floorItem.spriteSheet] : '';
    const floorPosPX = floorItem ? -(floorItem.spriteX * floorItem.width) : 0;
    const floorPosPY = floorItem ? -(floorItem.spriteY * floorItem.height) : 0;

    const getPos = (gx, gy) => {
        const x = (gx - gy) * (TILE_W / 2);
        const y = (gx + gy) * (TILE_H / 2);
        return { x, y };
    };

    const roomStyle = {
        position: 'relative',
        width: '640px',
        height: '420px',
        margin: '0 auto',
    };

    // 캐릭터 위치
    const charPos = activeRoom.characterPos || { x: 4, y: 4 };

    return (
        <div className="room-canvas-container py-10 flex items-center justify-center bg-slate-200 rounded-[2rem] overflow-hidden shadow-inner border-4 border-white/50 relative">
            <div style={roomStyle}>
                {/* 1. 벽 */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute" style={{
                        width: '320px', height: '240px', transform: 'skewY(-26deg)', left: '0', top: '20px',
                        backgroundColor: '#fff', borderRight: '2px solid #eee',
                        backgroundImage: `url(${wallpaperUrl})`, backgroundPosition: `${wallPosPX}px ${wallPosPY}px`,
                        backgroundSize: '192px auto', imageRendering: 'pixelated'
                    }} />
                    <div className="absolute" style={{
                        width: '320px', height: '240px', transform: 'skewY(26deg)', left: '320px', top: '20px',
                        backgroundColor: '#fff', borderLeft: '2px solid #eee',
                        backgroundImage: `url(${wallpaperUrl})`, backgroundPosition: `${wallPosPX}px ${wallPosPY}px`,
                        backgroundSize: '192px auto', imageRendering: 'pixelated', filter: 'brightness(0.95)'
                    }} />
                </div>

                {/* 2. 바닥 그리드 및 인터랙션 레이어 */}
                <div className="absolute top-[180px] left-[320px] -translate-x-1/2">
                    {Array.from({ length: GRID_SIZE }).map((_, gy) => (
                        <div key={gy} style={{ position: 'absolute', zIndex: 0 }}>
                            {Array.from({ length: GRID_SIZE }).map((_, gx) => {
                                const { x, y } = getPos(gx, gy);
                                return (
                                    <div
                                        key={gx}
                                        onClick={() => onGridClick && onGridClick(gx, gy)}
                                        className={`${isPlacementMode ? 'hover:bg-blue-500/20 cursor-crosshair' : ''} transition-colors`}
                                        style={{
                                            position: 'absolute', left: x, top: y, width: TILE_W, height: TILE_H,
                                            backgroundImage: `url(${floorUrl})`, backgroundPosition: `${floorPosPX}px ${floorPosPY}px`,
                                            backgroundSize: '192px auto', zIndex: 0, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', imageRendering: 'pixelated'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}

                    {/* 3. 배치된 가구들 */}
                    {activeRoom.items?.map((item) => {
                        const { x, y } = getPos(item.x, item.y);
                        const shopItem = SHOP_ITEMS.find(i => i.id === item.itemId);
                        if (!shopItem) return null;

                        return (
                            <div
                                key={item.id}
                                onClick={(e) => { e.stopPropagation(); onItemClick && onItemClick(item); }}
                                className={`absolute transition-transform hover:scale-105 cursor-pointer ${selectedPlacementId === item.id ? 'ring-2 ring-blue-500 rounded-full scale-110' : ''}`}
                                style={{
                                    left: x, top: y,
                                    // 아이소메트릭 정렬 기준: 발 아래가 타일 중앙에 오도록 오프셋 조절
                                    transform: `translate(${-shopItem.width / 4}px, ${-shopItem.height / 2}px)`,
                                    zIndex: 10 + item.y // Y좌표에 기반한 간단한 Sorting
                                }}
                            >
                                <SpriteItem item={shopItem} scale={1} />
                            </div>
                        );
                    })}

                    {/* 4. 캐릭터 (미리보기 반영) */}
                    {(() => {
                        const { x, y } = getPos(charPos.x, charPos.y);
                        // 미리보기 아이템이 캐릭터 관련이면 임시 캐릭터 객체 생성
                        let displayChar = { ...character };
                        if (previewItem) {
                            if (previewItem.category === 'character') displayChar.baseId = previewItem.id;
                            if (previewItem.category === 'hair') displayChar.hairId = previewItem.id;
                            if (previewItem.category === 'accessory') displayChar.accessoryId = previewItem.id;
                            if (previewItem.category === 'outfit') displayChar.outfitId = previewItem.id;
                        }

                        return (
                            <div
                                onClick={(e) => { e.stopPropagation(); onCharacterClick && onCharacterClick(); }}
                                className={`absolute cursor-move transition-all group ${selectedPlacementId === 'character' ? 'scale-110' : ''}`}
                                style={{
                                    left: x, top: y, zIndex: 50 + charPos.y,
                                    transform: 'translate(-50%, -70%)'
                                }}
                            >
                                <div className="relative">
                                    <CharacterView character={displayChar} />
                                    <div className="w-10 h-3 bg-black/10 rounded-full blur-[2px] mx-auto -mt-2"></div>
                                    {selectedPlacementId === 'character' && (
                                        <div className="absolute -inset-4 border-2 border-blue-500 rounded-xl animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* 5. 바닥/벽지 미리보기 표시 */}
                    {previewItem && (previewItem.category === 'wallpaper' || previewItem.category === 'floor') && (
                        <div className="absolute -top-[180px] -left-[320px] w-[640px] h-[400px] pointer-events-none ring-4 ring-indigo-500/50 rounded-3xl flex items-center justify-center bg-indigo-500/10 z-[100]">
                            <p className="bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-xl">미리보기 중: {previewItem.name}</p>
                        </div>
                    )}
                </div>
            </div>

            {isPlacementMode && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-black shadow-xl z-[200] animate-bounce">
                    🖱️ 이동할 곳을 클릭하세요
                </div>
            )}
        </div>
    );
};

export default RoomCanvas;
