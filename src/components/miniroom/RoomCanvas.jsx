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
    onCharacterClick,
    onPreviewClick,
    previewPos = { x: 4, y: 4 }
}) => {
    const GRID_SIZE = 10;
    const TILE_W = 64;
    const TILE_H = 32;

    const isFurniturePreview = previewItem && !['wallpaper', 'floor', 'character', 'hair', 'accessory', 'outfit'].includes(previewItem.category);

    // 미리보기 우선 적용: previewItem이 wallpaper/floor면 해당 아이템 사용
    const effectiveWallpaperId = (previewItem?.category === 'wallpaper')
        ? previewItem.id
        : (activeRoom.wallpaper || 'wall_plain_white');
    const effectiveFloorId = (previewItem?.category === 'floor')
        ? previewItem.id
        : (activeRoom.floor || 'floor_plain_white');

    const wallpaperItem = SHOP_ITEMS.find(i => i.id === effectiveWallpaperId) || previewItem;
    const floorItem = SHOP_ITEMS.find(i => i.id === effectiveFloorId) || previewItem;

    const wallpaperUrl = wallpaperItem?.spriteSheet ? Assets[wallpaperItem.spriteSheet] : '';
    const wallPosPX = wallpaperItem ? -(wallpaperItem.spriteX * (wallpaperItem.width || 64)) : 0;
    const wallPosPY = wallpaperItem ? -(wallpaperItem.spriteY * (wallpaperItem.height || 64)) : 0;

    const floorUrl = floorItem?.spriteSheet ? Assets[floorItem.spriteSheet] : '';
    const floorPosPX = floorItem ? -(floorItem.spriteX * (floorItem.width || 64)) : 0;
    const floorPosPY = floorItem ? -(floorItem.spriteY * (floorItem.height || 64)) : 0;

    const getPos = (gx, gy) => {
        const x = (gx - gy) * (TILE_W / 2);
        const y = (gx + gy) * (TILE_H / 2);
        return { x, y };
    };


    const roomStyle = {
        position: 'relative',
        width: '640px',
        height: '520px', // 바닥 높이(320) + 여유분
        margin: '0 auto',
    };

    // 캐릭터 위치
    const charPos = activeRoom.characterPos || { x: 4, y: 4 };

    return (
        <div className="room-canvas-container py-10 flex items-center justify-center bg-slate-200 rounded-[2rem] overflow-hidden shadow-inner border-4 border-white/50 relative">
            <div style={roomStyle}>
                {/* 1. 벽 (미리보기 시 투명도 조절) */}
                <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-500 ${isFurniturePreview ? 'opacity-40' : 'opacity-100'}`}>
                    {/* 왼쪽 벽 */}
                    <div className="absolute" style={{
                        width: '320px', height: '240px', transform: 'skewY(-26.5deg)', left: '0', top: '-220px',
                        backgroundColor: wallpaperItem?.color || '#fff',
                        borderRight: '1.5px solid rgba(0,0,0,0.05)',
                        backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
                        backgroundPosition: `${wallPosPX}px ${wallPosPY}px`,
                        backgroundSize: `512px auto`, // 8컬럼 기준
                        imageRendering: 'pixelated'
                    }} >
                        <div className="absolute bottom-0 w-full h-[6px] bg-white/20 border-t border-black/5" />
                    </div>

                    {/* 오른쪽 벽 */}
                    <div className="absolute" style={{
                        width: '320px', height: '240px', transform: 'skewY(26.5deg)', left: '320px', top: '-220px',
                        backgroundColor: wallpaperItem?.color || '#fff',
                        backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
                        backgroundPosition: `${wallPosPX}px ${wallPosPY}px`,
                        backgroundSize: `512px auto`,
                        imageRendering: 'pixelated', filter: 'brightness(0.97)'
                    }} >
                        <div className="absolute bottom-0 w-full h-[6px] bg-white/10 border-t border-black/5" />
                    </div>

                    {/* 코너 세로 라인 및 그림자 */}
                    <div className="absolute left-[319.5px] top-[-100px] w-[1px] h-[300px] bg-black/10 z-10" />
                    {/* 바닥과의 경계 그림자 */}
                    <div className="absolute left-[320px] top-[180px] w-[320px] h-[160px] bg-gradient-to-br from-black/5 to-transparent pointer-events-none" style={{ transform: 'skewY(26.5deg)', transformOrigin: 'top left' }} />
                    <div className="absolute left-0 top-[180px] w-[320px] h-[160px] bg-gradient-to-bl from-black/5 to-transparent pointer-events-none" style={{ transform: 'skewY(-26.5deg)', transformOrigin: 'top right' }} />
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
                                        className={`${isPlacementMode ? 'hover:bg-blue-500/40 cursor-crosshair' : ''} transition-all`}
                                        style={{
                                            position: 'absolute', left: x, top: y, width: TILE_W, height: TILE_H,
                                            backgroundColor: floorItem?.color || 'transparent',
                                            backgroundImage: floorUrl ? `url(${floorUrl})` : 'none',
                                            backgroundPosition: `${floorPosPX}px ${floorPosPY}px`,
                                            backgroundSize: `512px auto`, zIndex: 0,
                                            // 흰 장판일 경우 그리드 라인을 숨기기 위해 배경 투명도 조절 및 clip-path 유지
                                            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                            opacity: isFurniturePreview && !isPlacementMode ? 0.3 : 1,
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}

                    {/* 3. 배치된 가구들 (미리보기 시 흐리게) */}
                    <div className={`transition-all duration-500 ${isFurniturePreview ? 'opacity-20 saturate-0 scale-95 blur-[1px] pointer-events-none' : 'opacity-100 scale-100'}`}>
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
                    </div>

                    {/* 4. 캐릭터 (미리보기 반영) */}
                    <div className={`transition-all duration-500 ${isFurniturePreview ? 'opacity-20 blur-[1px] pointer-events-none' : 'opacity-100'}`}>
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
                    </div>

                    {/* 5. 벽지/바닥 미리보기 표시 라벨 */}
                    {previewItem && (previewItem.category === 'wallpaper' || previewItem.category === 'floor') && (
                        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 z-[100]">
                            <p className="bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-xl animate-bounce border-2 border-white/50">
                                🎨 미리보기 적용됨: {previewItem.name}
                            </p>
                        </div>
                    )}

                    {/* 6. 가구/소품 미리보기 (집중 모드) */}
                    {isFurniturePreview && (() => {
                        const { x, y } = getPos(previewPos.x, previewPos.y);
                        return (
                            <div
                                onClick={(e) => { e.stopPropagation(); onPreviewClick && onPreviewClick(); }}
                                className={`absolute cursor-move transition-all ${selectedPlacementId === 'preview' ? 'scale-110' : 'hover:scale-105'}`}
                                style={{
                                    left: x,
                                    top: y,
                                    transform: `translate(${-(previewItem.width || 32) / 4}px, ${-(previewItem.height || 32) / 2}px)`,
                                    zIndex: 100,
                                }}
                            >
                                <div className="relative">
                                    {/* 아이템 발밑 강조 후광 */}
                                    <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-150 animate-pulse"></div>

                                    <SpriteItem item={previewItem} scale={1.2} className={selectedPlacementId === 'preview' ? 'brightness-125' : ''} />

                                    {/* 미리보기 라벨 */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg font-bold border-2 border-white/30 flex items-center gap-1 z-20">
                                        <span className="animate-pulse">✨</span> {previewItem.name}
                                    </div>

                                    {selectedPlacementId === 'preview' ? (
                                        <div className="absolute inset-x-[-10px] inset-y-[-10px] border-4 border-dashed border-indigo-500 rounded-2xl animate-pulse"></div>
                                    ) : (
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 이동</div>
                                    )}

                                    {/* 핑 애니메이션 */}
                                    {!selectedPlacementId && <div className="absolute inset-0 rounded-lg ring-4 ring-indigo-500/50 animate-ping pointer-events-none"></div>}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {(isPlacementMode || isFurniturePreview) && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[200]">
                    <div className={`${isPlacementMode ? 'bg-blue-600' : 'bg-indigo-600'} text-white px-8 py-2.5 rounded-full font-black shadow-2xl border-2 border-white/20 animate-in slide-in-from-top-4`}>
                        {selectedPlacementId ? (
                            <span className="flex items-center gap-2">🎯 {selectedPlacementId === 'preview' ? '미리보기 아이템' : '아이템'}을 옮길 곳을 클릭하세요!</span>
                        ) : (
                            <span className="flex items-center gap-2">🔍 미리보기 모드 (아이템을 클릭해 이동해보세요)</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


export default RoomCanvas;
