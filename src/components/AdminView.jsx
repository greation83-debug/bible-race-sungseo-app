import React from 'react';
import Icon from './Icon';

const AdminView = ({
    handleLogout,
    downloadCSV,
    adminViewMode,
    setAdminViewMode,
    adminFilter,
    setAdminFilter,
    adminSortBy,
    setAdminSortBy,
    allUsers,
    MOCK_COMMUNITIES,
    BIBLE_VERSIONS,
    announcementInput,
    setAnnouncementInput,
    saveAnnouncement,
    generateMemosCSV,
    generateMemosHTML,
    editingUser,
    setEditingUser,
    startEditUser,
    saveEditUser,
    changingPassword,
    setChangingPassword,
    newPassword,
    setNewPassword,
    changePassword,
    deleteUser,
    lastSyncInfo,
    setLastSyncInfo,
    syncProgress,
    setSyncProgress,
    selectedSyncVersions,
    setSelectedSyncVersions,
    syncNotionToFirestore,
    adminStats,
    kakaoLinkInput,
    setKakaoLinkInput,
    saveKakaoLink,
    db
}) => {
    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-slate-800">🛠️ 관리자 모드</h1>
                        <button onClick={handleLogout} className="text-sm bg-slate-200 px-3 py-2 rounded hover:bg-slate-300">나가기</button>
                    </div>
                    <button onClick={downloadCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold">
                        <Icon name="download" size={18} /> CSV 다운로드
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icon name="chart" size={20} className="text-blue-500" /> 📊 오늘 통계 ({new Date().toLocaleDateString('ko-KR')})
                    </h2>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-blue-600">{adminStats.totalUsers}</div>
                            <div className="text-xs text-slate-500">전체 회원</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-green-600">{adminStats.readToday}</div>
                            <div className="text-xs text-slate-500">오늘 읽은 사람</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-orange-600">{adminStats.readRate}%</div>
                            <div className="text-xs text-slate-500">오늘 참여율</div>
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-700 mb-2">📌 공동체별 오늘 현황</h3>
                    <div className="space-y-2">
                        {Object.keys(adminStats.communityStats).map(function (id) {
                            var stat = adminStats.communityStats[id];
                            return (
                                <div key={id} className="flex items-center gap-3">
                                    <div className="w-20 text-sm font-bold text-slate-600">{stat.name}</div>
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: stat.rate + "%" }}></div>
                                    </div>
                                    <div className="text-sm text-slate-500 w-28 text-right">{stat.readToday}/{stat.total}명 ({stat.rate}%)</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            😴 미참여자 관리
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAdminViewMode('today')}
                                className={`text-xs px-3 py-1 rounded-full font-bold ${adminViewMode === 'today' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                                오늘 미참여
                            </button>
                            <button
                                onClick={() => setAdminViewMode('inactive')}
                                className={`text-xs px-3 py-1 rounded-full font-bold ${adminViewMode === 'inactive' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                                장기 미참여
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                        <button
                            onClick={() => setAdminFilter('all')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${adminFilter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                        >
                            전체
                        </button>
                        {MOCK_COMMUNITIES.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setAdminFilter(c.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${adminFilter === c.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {(() => {
                            const todayStr = new Date().toDateString();
                            const today = new Date();

                            // 필터링
                            let filteredUsers = adminFilter === 'all'
                                ? allUsers
                                : allUsers.filter(u => u.communityId === adminFilter);

                            if (adminViewMode === 'today') {
                                // 오늘 안 읽은 사람
                                const notReadUsers = filteredUsers.filter(u => u.lastReadDate !== todayStr);

                                // 대그룹별, 소그룹별로 그룹화
                                const groupedByCommunity = {};
                                notReadUsers.forEach(u => {
                                    const commKey = u.communityId || 'none';
                                    if (!groupedByCommunity[commKey]) groupedByCommunity[commKey] = {};
                                    const subKey = u.subgroupId || '미배정';
                                    if (!groupedByCommunity[commKey][subKey]) groupedByCommunity[commKey][subKey] = [];
                                    groupedByCommunity[commKey][subKey].push(u);
                                });

                                // MOCK_COMMUNITIES 순서대로 정렬
                                const sortedGroups = [];
                                MOCK_COMMUNITIES.forEach(comm => {
                                    const subgroups = groupedByCommunity[comm.id];
                                    if (subgroups) {
                                        comm.subgroups.forEach(subName => {
                                            if (subgroups[subName]) {
                                                sortedGroups.push([subName, subgroups[subName]]);
                                            }
                                        });
                                    }
                                });
                                // 미배정 추가
                                Object.keys(groupedByCommunity).forEach(function (commId) {
                                    var subgroups = groupedByCommunity[commId];
                                    if (subgroups['미배정']) {
                                        sortedGroups.push(['미배정', subgroups['미배정']]);
                                    }
                                });

                                const totalNotRead = notReadUsers.length;

                                return (
                                    <div>
                                        <div className="mb-3 text-sm text-slate-500">
                                            총 <strong className="text-red-600">{totalNotRead}명</strong>이 오늘 아직 안 읽었습니다.
                                        </div>
                                        {sortedGroups.length > 0 ? (
                                            sortedGroups.map(([group, users]) => (
                                                <div key={group} className="mb-4 bg-slate-50 p-3 rounded-lg">
                                                    <div className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                                        <span>📁 {group}</span>
                                                        <span className="text-red-500">{users.length}명</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {users.map((u, idx) => {
                                                            const lastRead = u.lastReadDate ? new Date(u.lastReadDate) : null;
                                                            const daysSince = lastRead ? Math.floor((today - lastRead) / (1000 * 60 * 60 * 24)) : 999;
                                                            return (
                                                                <span key={u.uid} className={`text-xs px-2 py-1 rounded-full border ${daysSince >= 7 ? 'bg-red-100 text-red-700 border-red-200' : daysSince >= 3 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                                    <span className="font-mono text-[10px] opacity-60 mr-1">{idx + 1}.</span>
                                                                    {u.name} {daysSince > 0 && <span className="opacity-70">({daysSince}일)</span>}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-green-600">
                                                <div className="text-4xl mb-2">🎉</div>
                                                <p className="font-bold">모두 읽었습니다!</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                // 장기 미참여자 정렬
                                const usersWithDays = filteredUsers.map(u => {
                                    const lastRead = u.lastReadDate ? new Date(u.lastReadDate) : null;
                                    const daysSince = lastRead ? Math.floor((today - lastRead) / (1000 * 60 * 60 * 24)) : 999;
                                    return { ...u, daysSince };
                                }).filter(u => u.daysSince >= 1)
                                    .sort((a, b) => {
                                        if (adminSortBy === 'name') {
                                            return a.name.localeCompare(b.name);
                                        } else if (adminSortBy === 'day') {
                                            const aTotalDays = ((a.readCount || 1) - 1) * 365 + (a.currentDay || 1);
                                            const bTotalDays = ((b.readCount || 1) - 1) * 365 + (b.currentDay || 1);
                                            return bTotalDays - aTotalDays;
                                        } else if (adminSortBy === 'score') {
                                            return (b.score || 0) - (a.score || 0);
                                        } else if (adminSortBy === 'subgroup') {
                                            const commA = a.communityName || '';
                                            const commB = b.communityName || '';
                                            const commCompare = commA.localeCompare(commB, 'ko-KR');
                                            if (commCompare !== 0) return commCompare;
                                            const subA = a.subgroupId || '';
                                            const subB = b.subgroupId || '';
                                            return subA.localeCompare(subB, 'ko-KR');
                                        } else {
                                            return b.daysSince - a.daysSince;
                                        }
                                    });

                                return (
                                    <div>
                                        <div className="mb-3 flex gap-2">
                                            {['name', 'day', 'score', 'subgroup'].map(sort => (
                                                <button
                                                    key={sort}
                                                    onClick={() => setAdminSortBy(sort)}
                                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold ${adminSortBy === sort ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                                >
                                                    {sort === 'name' ? '이름순' : sort === 'day' ? '진행순' : sort === 'score' ? '점수순' : '소그룹순'}
                                                </button>
                                            ))}
                                        </div>
                                        {usersWithDays.length > 0 ? (
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-600 w-10">#</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-600">이름</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-600">소그룹</th>
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-600">안 읽은 날</th>
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-600">진행률</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {usersWithDays.slice(0, 50).map((u, idx) => (
                                                        <tr key={u.uid} className={`border-b ${u.daysSince >= 14 ? 'bg-red-50' : u.daysSince >= 7 ? 'bg-orange-50' : ''}`}>
                                                            <td className="px-3 py-2 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                                                            <td className="px-3 py-2 font-bold text-slate-800">{u.name}</td>
                                                            <td className="px-3 py-2 text-slate-500 text-xs">{u.subgroupId || '-'}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.daysSince >= 14 ? 'bg-red-500 text-white' : u.daysSince >= 7 ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                                                                    {u.daysSince === 999 ? '기록없음' : `${u.daysSince}일`}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-xs">
                                                                {(() => {
                                                                    const readCount = u.readCount || 1;
                                                                    const currentDay = u.currentDay || 1;
                                                                    const totalDays = (readCount - 1) * 365 + currentDay;
                                                                    if (readCount > 1) {
                                                                        return (
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <span className="font-bold text-slate-700">DAY {totalDays}</span>
                                                                                <span className="px-1.5 py-0.5 bg-gradient-to-br from-purple-500 to-purple-700 text-white text-[10px] font-bold rounded-full">{readCount}독</span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <span className="font-bold text-slate-700">DAY {currentDay}</span>;
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-8 text-green-600">
                                                <div className="text-4xl mb-2">🎉</div>
                                                <p className="font-bold">장기 미참여자가 없습니다!</p>
                                            </div>
                                        )}
                                        {usersWithDays.length > 50 && (
                                            <div className="mt-2 text-center text-xs text-slate-400">
                                                상위 50명만 표시 (전체 {usersWithDays.length}명)
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })()}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded"></span> 1-2일</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded"></span> 3-6일</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> 7일+</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        👑 완주자 명예의 전당 ({allUsers.filter(u => u.currentDay >= 365 || (u.readCount || 1) >= 2).length}명)
                    </h2>
                    {(() => {
                        const finishers = allUsers
                            .filter(u => u.currentDay >= 365 || (u.readCount || 1) >= 2)
                            .sort((a, b) => (b.score || 0) - (a.score || 0));
                        return finishers.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {finishers.map((u, idx) => {
                                    const readCount = u.readCount || 1;
                                    return (
                                        <div key={u.uid} className={`p-4 rounded-xl text-center border-2 ${idx === 0 ? 'bg-yellow-50 border-yellow-300' : idx === 1 ? 'bg-slate-50 border-slate-300' : idx === 2 ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-100'}`}>
                                            <div className="text-2xl mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</div>
                                            <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                                                {u.name}
                                                {readCount >= 2 && (
                                                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">{readCount}독</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{u.score || 0}점</div>
                                            <div className="text-[10px] text-slate-400">{u.communityName} {u.subgroupId}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <div className="text-4xl mb-2">🏰</div>
                                <p>아직 완주자가 없습니다.</p>
                                <p className="text-xs mt-1">365일을 완주하면 명예의 전당에 등재됩니다!</p>
                            </div>
                        );
                    })()}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        📢 광고/공지 관리
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">공지 내용</label>
                            <textarea
                                value={announcementInput.text}
                                onChange={(e) => setAnnouncementInput(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="예: 이번 주일 성탄절 예배가 있습니다!"
                                className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-600">링크 버튼 설정</label>
                                <button
                                    onClick={() => setAnnouncementInput(prev => ({
                                        ...prev,
                                        links: [...(prev.links || []), { url: '', text: '' }]
                                    }))}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"
                                >
                                    <Icon name="plus" size={12} /> 버튼 추가
                                </button>
                            </div>

                            {(announcementInput.links || []).map((link, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl relative group border border-slate-100">
                                    <button
                                        onClick={() => setAnnouncementInput(prev => ({
                                            ...prev,
                                            links: prev.links.filter((_, i) => i !== idx)
                                        }))}
                                        className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-red-100 hover:bg-red-50 transition-colors"
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">버튼 글자</label>
                                            <input
                                                type="text"
                                                value={link.text}
                                                onChange={(e) => {
                                                    const newLinks = [...announcementInput.links];
                                                    newLinks[idx].text = e.target.value;
                                                    setAnnouncementInput(prev => ({ ...prev, links: newLinks }));
                                                }}
                                                placeholder="예: 바로가기, 신청하기"
                                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">연결할 주소 (URL)</label>
                                            <input
                                                type="url"
                                                value={link.url}
                                                onChange={(e) => {
                                                    const newLinks = [...announcementInput.links];
                                                    newLinks[idx].url = e.target.value;
                                                    setAnnouncementInput(prev => ({ ...prev, links: newLinks }));
                                                }}
                                                placeholder="https://..."
                                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={announcementInput.enabled}
                                    onChange={(e) => setAnnouncementInput(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-slate-600">광고 활성화</span>
                            </label>
                            <button
                                onClick={saveAnnouncement}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                저장하기
                            </button>
                        </div>

                        {announcementInput.text && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                                <p className="text-xs text-slate-400 mb-3 font-bold uppercase tracking-wider">배너 미리보기</p>
                                <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                        <div className="flex-shrink-0 w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-slate-100">
                                            📢
                                        </div>
                                        <div className="flex-1 min-w-0 text-center md:text-left">
                                            <p className="text-[18px] text-slate-900 font-bold whitespace-pre-wrap leading-snug">{announcementInput.text}</p>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                                                {(announcementInput.links || []).map((link, idx) => (
                                                    link.text && (
                                                        <div key={idx} className="bg-[#03C75A] text-white px-8 py-3 rounded-2xl text-[16px] font-black shadow-md">
                                                            {link.text}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        💬 카카오톡 채널 연동
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">카카오톡 채널 채팅 URL</label>
                            <input
                                type="url"
                                value={kakaoLinkInput}
                                onChange={(e) => setKakaoLinkInput(e.target.value)}
                                placeholder="https://pf.kakao.com/_xxxx/chat"
                                className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                ※ 교회의 카카오톡 채널 관리자 센터에서 채팅 URL을 복사하여 붙여넣으세요.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={saveKakaoLink}
                                className="bg-[#FEE500] text-[#3c1e1e] px-8 py-2.5 rounded-xl font-bold hover:bg-[#FDD835] shadow-lg shadow-yellow-100 transition-all active:scale-95"
                            >
                                링크 저장하기
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            📝 묵상 관리
                        </h2>
                        <button
                            onClick={generateMemosCSV}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold text-sm"
                        >
                            <Icon name="download" size={16} /> 전체 CSV 다운로드
                        </button>
                    </div>

                    {(() => {
                        const usersWithMemos = allUsers.filter(u => u.memos && Object.keys(u.memos || {}).length > 0);
                        const totalMemos = allUsers.reduce((sum, u) => sum + Object.keys(u.memos || {}).length, 0);

                        return (
                            <div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-purple-600">{totalMemos}</div>
                                        <div className="text-xs text-slate-500">총 묵상 수</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-blue-600">{usersWithMemos.length}</div>
                                        <div className="text-xs text-slate-500">묵상 작성자</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {allUsers.length > 0 ? Math.round((usersWithMemos.length / allUsers.length) * 100) : 0}%
                                        </div>
                                        <div className="text-xs text-slate-500">참여율</div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-700 mb-2">✍️ 묵상왕 TOP 10</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {allUsers
                                        .map(u => ({ ...u, memoCount: Object.keys(u.memos || {}).length }))
                                        .filter(u => u.memoCount > 0)
                                        .sort((a, b) => b.memoCount - a.memoCount)
                                        .slice(0, 10)
                                        .map((u, idx) => (
                                            <div key={u.uid} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-slate-800">{u.name}</span>
                                                        <span className="text-xs text-slate-400 ml-2">{u.subgroupId}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-purple-600">{u.memoCount}개</span>
                                                    <button
                                                        onClick={() => generateMemosHTML(u.name, u.memos || {}, { currentDay: u.currentDay, score: u.score, streak: u.streak })}
                                                        className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200"
                                                    >
                                                        HTML
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {editingUser && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">회원 정보 수정 ({editingUser.name})</h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">소속 공동체</label>
                                <select value={editingUser.communityId} onChange={e => {
                                    const comm = MOCK_COMMUNITIES.find(c => c.id === e.target.value);
                                    setEditingUser({ ...editingUser, communityId: comm.id, communityName: comm.name, subgroupId: comm.subgroups[0] });
                                }} className="w-full border rounded p-2 text-sm">
                                    {MOCK_COMMUNITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">소그룹</label>
                                <select value={editingUser.subgroupId} onChange={e => setEditingUser({ ...editingUser, subgroupId: e.target.value })} className="w-full border rounded p-2 text-sm">
                                    {(() => {
                                        const comm = MOCK_COMMUNITIES.find(c => c.id === editingUser.communityId);
                                        return comm ? comm.subgroups.map(s => <option key={s} value={s}>{s}</option>) : null;
                                    })()}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={saveEditUser} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">저장</button>
                                <button onClick={() => setEditingUser(null)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded hover:bg-slate-300">취소</button>
                            </div>
                        </div>
                    </div>
                )}

                {changingPassword && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setChangingPassword(null)}>
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">🔑 암호 변경</h3>
                            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-blue-700">
                                    <strong>{changingPassword.name}</strong>님의 암호를 변경합니다.
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    현재 암호: {changingPassword.password}
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-slate-600 mb-2">새 암호 (6자리 이상)</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="123456"
                                    className="w-full border border-slate-300 rounded-lg p-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    ※ 사용자에게 이 암호를 전달해주세요
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => changePassword(changingPassword.uid, changingPassword.name, changingPassword.password)}
                                    disabled={!newPassword || newPassword.length < 6}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                >
                                    암호 변경
                                </button>
                                <button
                                    onClick={() => {
                                        setChangingPassword(null);
                                        setNewPassword('');
                                    }}
                                    className="flex-1 bg-slate-200 text-slate-600 py-3 rounded-lg hover:bg-slate-300 font-bold"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800">👥 전체 회원 목록</h2>
                        <div className="flex gap-2">
                            {['name', 'day', 'score', 'subgroup'].map(sort => (
                                <button
                                    key={sort}
                                    onClick={() => setAdminSortBy(sort)}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold ${adminSortBy === sort ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {sort === 'name' ? '이름순' : sort === 'day' ? '진행순' : sort === 'score' ? '점수순' : '소그룹순'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-3 py-3 text-center w-10">#</th>
                                    <th className="px-3 py-3">이름</th>
                                    <th className="px-3 py-3">부서/소그룹</th>
                                    <th className="px-3 py-3 text-center">Day</th>
                                    <th className="px-3 py-3 text-center">점수</th>
                                    <th className="px-3 py-3 text-center">마지막읽은날</th>
                                    <th className="px-3 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const sorted = [...allUsers].sort((a, b) => {
                                        if (adminSortBy === 'name') return a.name.localeCompare(b.name);
                                        if (adminSortBy === 'day') {
                                            const aTotalDays = ((a.readCount || 1) - 1) * 365 + (a.currentDay || 1);
                                            const bTotalDays = ((b.readCount || 1) - 1) * 365 + (b.currentDay || 1);
                                            return bTotalDays - aTotalDays;
                                        }
                                        if (adminSortBy === 'score') return (b.score || 0) - (a.score || 0);
                                        if (adminSortBy === 'subgroup') {
                                            const commCompare = (a.communityName || '').localeCompare(b.communityName || '', 'ko-KR');
                                            if (commCompare !== 0) return commCompare;
                                            return (a.subgroupId || '').localeCompare(b.subgroupId || '', 'ko-KR');
                                        }
                                        return 0;
                                    });

                                    return sorted.map((u, idx) => {
                                        const readToday = u.lastReadDate === new Date().toDateString();
                                        const readCount = u.readCount || 1;
                                        const currentDay = u.currentDay || 1;
                                        const totalDays = (readCount - 1) * 365 + currentDay;
                                        return (
                                            <tr key={idx} className={`border-b hover:bg-slate-50 ${readToday ? 'bg-green-50' : ''}`}>
                                                <td className="px-3 py-3 text-center text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                                                <td className="px-3 py-3 font-medium text-slate-900">{u.name}{readToday && <span className="ml-1 text-green-500">✓</span>}</td>
                                                <td className="px-3 py-3"><span className="font-bold">{u.communityName}</span><span className="text-xs text-slate-400 block">{u.subgroupId}</span></td>
                                                <td className="px-3 py-3 text-center">
                                                    {readCount > 1 ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="font-bold text-blue-600">DAY {totalDays}</span>
                                                            <span className="px-1.5 py-0.5 bg-gradient-to-br from-purple-500 to-purple-700 text-white text-[10px] font-bold rounded-full">{readCount}독</span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-bold text-blue-600">DAY {currentDay}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center">{u.score}</td>
                                                <td className="px-3 py-3 text-center text-xs text-slate-400">{u.lastReadDate ? new Date(u.lastReadDate).toLocaleDateString('ko-KR') : '-'}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={() => setChangingPassword(u)} className="text-purple-500 hover:text-purple-700 p-1 bg-purple-50 rounded" title="암호 변경"><Icon name="refresh" size={14} /></button>
                                                        <button onClick={() => startEditUser(u)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded" title="정보 수정"><Icon name="edit" size={14} /></button>
                                                        <button onClick={() => deleteUser(u.uid, u.name)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded" title="삭제"><Icon name="trash" size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        🔄 노션 데이터 동기화
                    </h2>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700">
                            노션의 성경 본문을 Firestore에 캐싱하여 <strong>로딩 속도를 10배 이상</strong> 향상시킵니다.<br />
                            노션 본문을 수정했을 때만 동기화하면 됩니다.
                        </p>
                    </div>
                    {lastSyncInfo && (
                        <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm">
                            <p className="text-slate-600">
                                마지막 동기화: {(lastSyncInfo.lastSyncAt && lastSyncInfo.lastSyncAt.toDate) ? lastSyncInfo.lastSyncAt.toDate().toLocaleString('ko-KR') : '정보 없음'}
                            </p>
                            <p className="text-slate-500 text-xs">
                                성공: {lastSyncInfo.successCount || 0}개 / 실패: {lastSyncInfo.errorCount || 0}개
                            </p>
                            {lastSyncInfo.syncedVersions && (
                                <p className="text-slate-400 text-xs mt-1">
                                    동기화된 버전: {lastSyncInfo.syncedVersions.join(', ')}
                                </p>
                            )}
                            {lastSyncInfo.failedItems && lastSyncInfo.failedItems.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-red-600 text-xs font-bold mb-2">❌ 실패 목록 ({lastSyncInfo.failedItems.length}개):</p>
                                    <div className="max-h-32 overflow-y-auto bg-white rounded p-2 text-xs">
                                        {lastSyncInfo.failedItems.map((item, idx) => (
                                            <div key={idx} className="text-red-500 py-0.5">
                                                • {item.versionName} Day {item.day} ({item.date}) - {item.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {syncProgress ? (
                        <div className="space-y-3">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <p className="text-sm font-bold text-amber-700 mb-2">⏳ 동기화 진행 중... ({syncProgress.current}/{syncProgress.total})</p>
                                {syncProgress.status && <p className="text-xs text-amber-800 mb-2 font-medium">{syncProgress.status}</p>}
                                {syncProgress.currentVersion && <p className="text-xs text-amber-600 mb-2">버전: {syncProgress.currentVersion} {syncProgress.currentDay > 0 && `- Day ${syncProgress.currentDay}`}</p>}
                                <div className="w-full bg-amber-200 rounded-full h-3">
                                    <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-amber-600 mt-2">✅ 성공: {syncProgress.success}개 / ❌ 실패: {syncProgress.error}개</p>
                            </div>
                            <p className="text-xs text-slate-500 text-center">⚠️ 창을 닫지 마세요. 약 2분 소요됩니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-2">동기화할 버전 선택:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs font-bold text-slate-500 mb-2">📖 일년일독</p>
                                        {BIBLE_VERSIONS['1year'].map(v => {
                                            const planId = `1year_${v.id}`;
                                            const isChecked = selectedSyncVersions.indexOf(planId) !== -1;
                                            return (
                                                <label key={planId} className="flex items-center gap-2 py-1 cursor-pointer">
                                                    <input type="checkbox" checked={isChecked} onChange={(e) => {
                                                        if (e.target.checked) setSelectedSyncVersions([...selectedSyncVersions, planId]);
                                                        else setSelectedSyncVersions(selectedSyncVersions.filter(id => id !== planId));
                                                    }} className="w-4 h-4 rounded" />
                                                    <span className="text-sm text-slate-700">{v.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs font-bold text-slate-500 mb-2">📗 신약일독</p>
                                        {BIBLE_VERSIONS['nt'].map(v => {
                                            const planId = `nt_${v.id}`;
                                            const isChecked = selectedSyncVersions.indexOf(planId) !== -1;
                                            return (
                                                <label key={planId} className="flex items-center gap-2 py-1 cursor-pointer">
                                                    <input type="checkbox" checked={isChecked} onChange={(e) => {
                                                        if (e.target.checked) setSelectedSyncVersions([...selectedSyncVersions, planId]);
                                                        else setSelectedSyncVersions(selectedSyncVersions.filter(id => id !== planId));
                                                    }} className="w-4 h-4 rounded" />
                                                    <span className="text-sm text-slate-700">{v.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700">선택됨: <strong>{selectedSyncVersions.length}개</strong> 버전</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (selectedSyncVersions.length === 0) { alert('동기화할 버전을 선택해주세요.'); return; }
                                    if (!confirm(`${selectedSyncVersions.length}개 버전을 동기화합니다. 진행할까요?`)) return;
                                    const totalDays = selectedSyncVersions.length * 365;
                                    setSyncProgress({ current: 0, total: totalDays, success: 0, error: 0, currentVersion: '', currentDay: 0 });
                                    const result = await syncNotionToFirestore(selectedSyncVersions);
                                    alert(`동기화 완료!\n성공: ${result.success}개\n실패: ${result.error}개`);
                                    const syncDoc = await db.collection('settings').doc('sync').get();
                                    if (syncDoc.exists) setLastSyncInfo(syncDoc.data());
                                }}
                                disabled={selectedSyncVersions.length === 0}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 text-lg disabled:opacity-50"
                            >
                                📥 선택한 버전 동기화 ({selectedSyncVersions.length * 365}개)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminView;
