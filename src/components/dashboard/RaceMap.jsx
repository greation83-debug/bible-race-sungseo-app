import React, { useMemo } from 'react';

const RaceMap = ({ racers, totalRacers = racers.length, departmentChampions, getSubgroupDisplay }) => {
    const clampMapPos = (position) => Math.max(14, Math.min(position, 86));

    const getNonLinearPos = (day) => {
        const actualDay = Math.min(day, 365);
        if (actualDay <= 100) return (actualDay / 100) * 50;
        if (actualDay <= 200) return 50 + ((actualDay - 100) / 100) * 30;
        return 80 + ((actualDay - 200) / 165) * 20;
    };

    const placedRacers = useMemo(() => {
        const lanes = [12, 18, 24, 30, 38, 46, 54, 62, 70, 78, 86];
        const lastXByLane = lanes.map(() => -100);
        const sorted = [...racers]
            .map((racer, idx) => {
                const racerReadCount = racer.readCount || 1;
                const is2ndRound = racerReadCount >= 2;
                const displayDay = is2ndRound ? racer.currentDay : racer.day;
                return {
                    racer,
                    idx,
                    x: clampMapPos(getNonLinearPos(displayDay)),
                    isMe: racer.isMe,
                    racerReadCount,
                    is2ndRound,
                };
            })
            .sort((a, b) => a.x - b.x);

        const placed = sorted.map((item, displayIndex) => {
            if (item.isMe) return { ...item, displayIndex, top: 48, laneIndex: -1 };

            let bestLane = 0;
            let bestGap = -Infinity;
            lanes.forEach((laneTop, laneIndex) => {
                const minGap = item.is2ndRound ? 5 : 7;
                const gap = item.x - lastXByLane[laneIndex];
                const centerPenalty = Math.abs(laneTop - 46) * 0.05;
                const score = gap - centerPenalty;
                if ((gap >= minGap && score > bestGap) || bestGap === -Infinity) {
                    bestGap = score;
                    bestLane = laneIndex;
                }
            });
            if (item.x < 46 && lanes[bestLane] < 46) {
                const lowerLaneIndex = lanes.findIndex((laneTop, laneIndex) =>
                    laneTop >= 46 && item.x - lastXByLane[laneIndex] >= 5
                );
                if (lowerLaneIndex !== -1) {
                    bestLane = lowerLaneIndex;
                }
            }
            lastXByLane[bestLane] = item.x;
            return { ...item, displayIndex, top: lanes[bestLane], laneIndex: bestLane };
        });

        const visibleMobileUids = new Set();
        const mobileCandidates = placed.filter(item => !item.isMe);
        const maxMobileNonMe = 34;
        const me = placed.find(item => item.isMe);
        const byProgressAsc = [...mobileCandidates].sort((a, b) => a.racer.day - b.racer.day);
        const byProgressDesc = [...mobileCandidates].sort((a, b) => b.racer.day - a.racer.day);
        const byNearby = me
            ? [...mobileCandidates].sort((a, b) => Math.abs(a.racer.day - me.racer.day) - Math.abs(b.racer.day - me.racer.day))
            : [];
        const addCandidate = (item) => {
            if (item && item.racer.uid && visibleMobileUids.size < maxMobileNonMe) {
                visibleMobileUids.add(item.racer.uid);
            }
        };

        mobileCandidates.forEach(item => {
            if (departmentChampions[item.racer.uid]) {
                addCandidate(item);
            }
        });

        const balancedGroups = [byProgressDesc, byNearby, byProgressAsc];
        let groupIndex = 0;
        while (visibleMobileUids.size < maxMobileNonMe && mobileCandidates.length > visibleMobileUids.size) {
            const group = balancedGroups[groupIndex % balancedGroups.length];
            const candidate = group.find(item => item.racer.uid && !visibleMobileUids.has(item.racer.uid));
            if (!candidate) break;
            addCandidate(candidate);
            groupIndex += 1;
        }

        return placed.map(item => ({
            ...item,
            showOnMobile: item.isMe || visibleMobileUids.has(item.racer.uid)
        }));
    }, [racers, departmentChampions]);

    return (
        <div className="mx-4 mb-6 relative h-96 sm:h-72 bg-sky-texture overflow-hidden rounded-3xl shadow-xl border border-slate-100">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/20 to-transparent z-10"></div>
            <div className="mountain-back"></div>
            <div className="mountain-front"></div>
            <div className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-md border border-white/70">
                <span className="text-xs font-black text-slate-700">🏃 함께 달리는 중</span>
                <span className="text-xs font-black text-blue-600">{totalRacers}명</span>
            </div>
            <div className="absolute top-2 left-10 text-2xl opacity-80 animate-float">☁️</div>
            <div className="absolute top-5 right-20 text-xl opacity-60 animate-float-slow">☁️</div>
            <div className="absolute top-8 left-1/2 text-lg opacity-50 animate-float" style={{ animationDelay: '2s' }}>☁️</div>
            <div className="absolute bottom-2 left-5 text-sm z-10 opacity-90">🌸</div>
            <div className="absolute bottom-3 right-10 text-sm z-10 opacity-90">🌼</div>
            <div className="absolute bottom-4 left-1/3 text-xs z-10 opacity-80">🌱</div>

            {/* 100일 단위 마일스톤 */}
            {[100, 200, 300].map(day => {
                const position = getNonLinearPos(day);
                return (
                    <div key={day} className="absolute top-2 z-20 flex flex-col items-center" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                        <div className="bg-white/95 px-2 py-1 rounded-full shadow-md border-2 border-slate-400 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-700 leading-none">{day}</span>
                        </div>
                        <div className="w-0.5 h-screen bg-gradient-to-b from-slate-400 via-slate-300 to-transparent opacity-40"></div>
                    </div>
                );
            })}

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col justify-center items-center z-20 group" style={{ top: '60%' }}>
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-70 animate-pulse"></div>
                    <span className="text-5xl relative z-10 drop-shadow-2xl">🏰</span>
                </div>
                <span className="text-[9px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded-full mt-2 shadow-sm border border-slate-200 relative z-20">천국성</span>
            </div>

            {placedRacers.map(({ racer, idx, x, top, racerReadCount, is2ndRound, showOnMobile }) => {
                const isMe = racer.isMe;
                const subgroupInfo = getSubgroupDisplay(racer.subgroupId);
                const isDeptChampion = departmentChampions[racer.uid];
                const zIndex = isMe ? 29 : is2ndRound ? 28 : 25;
                const topPos = `${top}%`;
                const hideOnMobile = !showOnMobile;

                return (
                    <div key={racer.uid || idx} className={`absolute transition-all duration-1000 ease-out ${hideOnMobile ? 'hidden sm:block' : ''}`}
                        style={{ left: `${x}%`, top: topPos, zIndex, transform: 'translateX(-50%)' }}>
                        <div className="relative flex items-center">
                            {racerReadCount > 1 && (
                                <div className="absolute -left-2 -top-1 w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center border-2 border-white shadow-md z-10">
                                    <span className="text-[7px] font-bold text-white">{racerReadCount}</span>
                                </div>
                            )}
                            <div className={`flex items-stretch rounded-full shadow-md overflow-hidden ${isMe ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                <div className={`max-w-[56px] sm:max-w-[72px] text-[9px] pl-2 pr-1 py-0.5 font-bold whitespace-nowrap truncate flex items-center gap-0.5 ${isMe ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-white/95 text-slate-700'}`}>
                                    {isDeptChampion && (
                                        <span className="text-[11px]" title={`${isDeptChampion} 1위`}>👑</span>
                                    )}
                                    {racer.name}
                                </div>
                                <div className={`max-w-[54px] sm:max-w-none text-[9px] pl-1 pr-1.5 py-0.5 font-bold whitespace-nowrap truncate text-white flex items-center ${subgroupInfo.bgColor} border-l border-white/30`}>
                                    {racer.subgroupId}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RaceMap;
