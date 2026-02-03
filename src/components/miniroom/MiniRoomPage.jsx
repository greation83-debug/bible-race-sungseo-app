import React, { useState } from 'react';
import { useMiniRoom } from '../../hooks/useMiniRoom';
import RoomCanvas from './RoomCanvas';
import ShopSection from './ShopSection';
import InventorySection from './InventorySection';
import CharacterView from './CharacterView'; // Assuming CharacterView is available

const MiniRoomPage = ({ currentUser, setView, setCurrentUser }) => {
    const {
        roomData, character, inventory, activeRoom, loading, previewItem, setPreviewItem,
        buyItem, updateRoom, placeItem, movePlacedItem, removePlacedItem, updateCharacter, moveCharacter, unlockRoom
    } = useMiniRoom(currentUser, setCurrentUser);

    const [activeTab, setActiveTab] = useState('main'); // 'main', 'shop', 'inventory'
    const [sideTab, setSideTab] = useState('room'); // 'home', 'room', 'guestbook'
    const [shopCategory, setShopCategory] = useState('wallpaper');

    // 배치/이동 모드 상태
    const [isPlacementMode, setIsPlacementMode] = useState(false);
    const [selectedPlacementId, setSelectedPlacementId] = useState(null); // 'character' 또는 item's uniqueId

    if (loading) return <div className="p-20 text-center">방을 불러오는 중...</div>;

    const currentTalants = currentUser.score || 0;

    // 아이템 클릭 시 (가구 클릭) - Logic moved to RoomCanvas prop
    // 캐릭터 클릭 시 - Logic moved to RoomCanvas prop
    // 그리드 클릭 시 (이동 실행) - Logic moved to RoomCanvas prop

    // 인벤토리에서 아이템 사용 (배치 혹은 착용) - Logic moved to InventorySection prop

    return (
        <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 cy-pixel-font">
            {/* 싸이월드 외곽 프레임 */}
            <div className="cy-frame-container max-w-5xl w-full flex relative">

                {/* 메인 프레임 */}
                <div className="cy-inner-frame flex-1 flex flex-col min-h-[600px] shadow-sm">
                    {/* 상단바: 제목 및 방문자 수 */}
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-slate-700 tracking-tight">
                                {currentUser.name}대의 미니홈피
                                <span className="ml-2 text-xs font-normal text-blue-500 underline cursor-pointer">평도</span>
                            </h1>
                        </div>
                        <div className="flex gap-4 text-[11px] text-slate-500 font-bold">
                            <span className="flex items-center gap-1">TODAY <span className="text-red-500">24</span></span>
                            <span className="w-px h-2 bg-slate-200 mt-1"></span>
                            <span className="flex items-center gap-1">TOTAL <span className="text-slate-800">1,245</span></span>
                        </div>
                    </div>

                    <div className="flex flex-1 gap-4 overflow-hidden">
                        {/* 왼쪽 사이드바 (프로필 영역) */}
                        <div className="w-48 flex flex-col gap-3">
                            <div className="aspect-square bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-center">
                                <CharacterView character={character} size="text-7xl" />
                            </div>
                            <div className="flex-1 border-t-2 border-dashed border-slate-200 pt-3 text-[11px] text-slate-600 leading-relaxed">
                                <p className="font-bold text-blue-600 mb-1">TODAY IS... {previewItem ? '쇼핑중' : '말씀열공'}</p>
                                <p>꾸준한 성경 읽기로 달란트를 모아 방을 예쁘게 꾸미고 있어요!</p>
                                <div className="mt-4 p-2 bg-slate-50 rounded italic text-slate-400">
                                    "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라"
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="p-2 bg-orange-50 rounded border border-orange-100 flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-orange-400">내 달란트</span>
                                    <span className="text-sm font-black text-orange-600">⭐ {currentTalants.toLocaleString()}</span>
                                </div>
                                <select className="w-full mt-2 text-[10px] border border-slate-200 rounded p-1">
                                    <option>일촌 파도타기</option>
                                    <option>김집사님네 방</option>
                                    <option>이선생님네 방</option>
                                </select>
                            </div>
                        </div>

                        {/* 메인 콘텐츠 영역 (미니룸 등) */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* 중간 탭 메뉴 (Room, Shop, Inventory) */}
                            <div className="flex gap-1 mb-2">
                                <button onClick={() => { setActiveTab('main'); setPreviewItem(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-x border-t transition-all ${activeTab === 'main' ? 'bg-white border-slate-200 text-slate-800 -mb-px z-10' : 'bg-slate-50 border-transparent text-slate-400'}`}>미니룸</button>
                                <button onClick={() => { setActiveTab('shop'); setPreviewItem(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-x border-t transition-all ${activeTab === 'shop' ? 'bg-white border-slate-200 text-slate-800 -mb-px z-10' : 'bg-slate-50 border-transparent text-slate-400'}`}>선물가게</button>
                                <button onClick={() => { setActiveTab('inventory'); setPreviewItem(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-x border-t transition-all ${activeTab === 'inventory' ? 'bg-white border-slate-200 text-slate-800 -mb-px z-10' : 'bg-slate-50 border-transparent text-slate-400'}`}>보관함</button>
                            </div>

                            <div className="flex-1 bg-white border border-slate-200 rounded-b-lg p-4 overflow-y-auto relative scrollbar-hide">
                                {activeTab === 'main' && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[11px] font-bold text-slate-400">Miniroom Stage #0{roomData.activeRoomIndex + 1}</span>
                                            <div className="flex gap-1">
                                                {roomData.rooms.map((_, idx) => (
                                                    <button key={idx} onClick={() => updateRoom({ activeRoomIndex: idx })} className={`w-5 h-5 text-[10px] font-bold rounded border ${roomData.activeRoomIndex === idx ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>{idx + 1}</button>
                                                ))}
                                                {roomData.unlockedRooms < 5 && (
                                                    <button onClick={unlockRoom} className="w-5 h-5 text-[10px] bg-slate-100 text-slate-400 rounded border border-slate-200 hover:bg-slate-200">+</button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center p-2 bg-[#f0f0f0] rounded border border-slate-100 shadow-inner">
                                            <RoomCanvas
                                                activeRoom={activeRoom}
                                                character={character}
                                                previewItem={previewItem}
                                                isPlacementMode={isPlacementMode}
                                                selectedPlacementId={selectedPlacementId}
                                                onGridClick={(gx, gy) => {
                                                    if (!isPlacementMode) return;
                                                    if (selectedPlacementId === 'character') moveCharacter(gx, gy);
                                                    else if (selectedPlacementId) movePlacedItem(selectedPlacementId, gx, gy);
                                                    setIsPlacementMode(false);
                                                    setSelectedPlacementId(null);
                                                }}
                                                onItemClick={(item) => { setSelectedPlacementId(item.id); setIsPlacementMode(true); }}
                                                onCharacterClick={() => { setSelectedPlacementId('character'); setIsPlacementMode(true); }}
                                            />
                                        </div>

                                        {isPlacementMode && (
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-bounce">배치 모드 활성화 중...</div>
                                                <button onClick={() => { setIsPlacementMode(false); setSelectedPlacementId(null); }} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm hover:bg-slate-50 transition-colors">취소</button>
                                                {selectedPlacementId && selectedPlacementId !== 'character' && (
                                                    <button onClick={() => { removePlacedItem(selectedPlacementId); setIsPlacementMode(false); setSelectedPlacementId(null); }} className="bg-red-50 text-red-500 border border-red-100 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-red-100 transition-colors">가구회수</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'shop' && (
                                    <ShopSection
                                        shopCategory={shopCategory}
                                        setShopCategory={setShopCategory}
                                        buyItem={buyItem}
                                        inventory={inventory}
                                        onPreview={(item) => { setPreviewItem(item); setActiveTab('main'); }}
                                        currentTalants={currentTalants}
                                    />
                                )}

                                {activeTab === 'inventory' && (
                                    <InventorySection
                                        inventory={inventory}
                                        onUseItem={(item) => {
                                            const category = item.category;
                                            if (category === 'wallpaper') updateRoom({ rooms: roomData.rooms.map((r, i) => i === roomData.activeRoomIndex ? { ...r, wallpaper: item.id } : r) });
                                            else if (category === 'floor') updateRoom({ rooms: roomData.rooms.map((r, i) => i === roomData.activeRoomIndex ? { ...r, floor: item.id } : r) });
                                            else if (['character', 'hair', 'accessory', 'outfit'].includes(category)) updateCharacter({ [`${category}Id`]: item.id });
                                            else if (['furniture', 'decoration', 'electronic', 'living', 'hobby'].includes(category)) {
                                                placeItem(item.id, 4, 4);
                                                alert("방 중앙에 배치되었습니다!");
                                            }
                                            setActiveTab('main');
                                        }}
                                    />
                                )}
                            </div>

                            {/* 하단 일촌평/방명록 레이어 (심플하게) */}
                            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-slate-700">일촌평 (Guestbook)</span>
                                    <button className="text-[10px] text-blue-500 font-bold hover:underline">더보기 +</button>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] flex gap-2">
                                        <span className="font-bold text-slate-500 shrink-0">김집사</span>
                                        <span className="text-slate-700 truncate">오늘도 말씀 은혜롭네요~!!</span>
                                        <span className="ml-auto text-slate-300">12:35</span>
                                    </div>
                                    <div className="text-[10px] flex gap-2">
                                        <span className="font-bold text-slate-500 shrink-0">이청년</span>
                                        <span className="text-slate-700 truncate">방 너무 예뻐요 도토리 많이 모으셨나봐요 ㅎㅎ</span>
                                        <span className="ml-auto text-slate-300">10:11</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 싸이월드 우측 세로 탭 */}
                <div className="flex flex-col ml-[-1px] mt-12 z-20">
                    <button onClick={() => setView('dashboard')} className="cy-side-tab !bg-orange-500 border-orange-600">홈</button>
                    <button onClick={() => setSideTab('room')} className={`cy-side-tab ${sideTab === 'room' ? 'active' : ''}`}>룸</button>
                    <button onClick={() => setSideTab('guestbook')} className={`cy-side-tab ${sideTab === 'guestbook' ? 'active' : ''}`}>방명록</button>
                    <button className="cy-side-tab">프로필</button>
                    <button className="cy-side-tab">다이어리</button>
                    <button className="cy-side-tab !bg-slate-400 !border-slate-500 opacity-50 cursor-not-allowed">설정</button>
                </div>

                {/* 브금(BGM) 전용 플레이어 바 (Classic Look) */}
                <div className="absolute top-4 right-20 bg-slate-800 text-white rounded p-1 flex items-center gap-2 px-3 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
                    <div className="text-[9px] font-bold animate-pulse text-green-400 shrink-0">BGM ON</div>
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    <span className="text-[11px] font-bold truncate max-w-[150px]">나였으면 - 나윤권 (Remake)</span>
                    <div className="flex gap-1.5 ml-1 shrink-0">
                        <span className="text-[10px] cursor-pointer hover:text-blue-400">⏮️</span>
                        <span className="text-[10px] cursor-pointer hover:text-blue-400">⏸️</span>
                        <span className="text-[10px] cursor-pointer hover:text-blue-400">⏭️</span>
                    </div>
                </div>
            </div>

            {/* 미리보기 종료 플로팅 버튼 */}
            {previewItem && activeTab === 'main' && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]">
                    <div className="bg-indigo-600 text-white pl-6 pr-2 py-2 rounded-lg shadow-2xl flex items-center gap-4 border-2 border-white/20">
                        <span className="font-bold text-xs tracking-tight">PREVIEW: {previewItem.name}</span>
                        <div className="flex gap-1">
                            {!inventory.includes(previewItem.id) && (
                                <button onClick={() => buyItem(previewItem)} className="bg-yellow-400 text-indigo-900 px-3 py-1 rounded font-black text-[10px] hover:bg-yellow-300">도토리 구매</button>
                            )}
                            <button onClick={() => setPreviewItem(null)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded font-bold text-[10px]">지우기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniRoomPage;
