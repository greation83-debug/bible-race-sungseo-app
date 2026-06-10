import { useState, useCallback } from 'react';
import { db, firebase } from '../utils/firebase';
import { ACHIEVEMENTS } from '../data/achievements';
import { calculateSubgroupStats } from '../utils/statsUtils';
import { kstTodayDateString } from '../utils/dateUtils';

export const useUserBibleActions = (
    currentUser,
    setCurrentUser,
    allMembersForRace,
    setAllMembersForRace,
    setCommunityMembers,
    setSubgroupStats,
    setViewingDay,
    viewingDay
) => {
    const [readHistory, setReadHistory] = useState([]);
    const [hasReadToday, setHasReadToday] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [levelUpToast, setLevelUpToast] = useState(null);
    const [bonusToast, setBonusToast] = useState(null);
    const [newAchievement, setNewAchievement] = useState(null);

    const checkAchievements = useCallback(async (user, userMemos) => {
        if (!user) return;
        const newEarned = [];
        const currentEarnedIds = new Set(user.achievements || []);

        ACHIEVEMENTS.forEach(ach => {
            if (currentEarnedIds.has(ach.id)) return;
            if (ach.condition(user, userMemos)) {
                newEarned.push(ach.id);
                setNewAchievement(ach);
                setTimeout(() => setNewAchievement(null), 5000);
            }
        });

        if (newEarned.length > 0) {
            const updated = [...(user.achievements || []), ...newEarned];
            try {
                await db.collection('users').doc(user.uid).update({ achievements: updated });
            } catch (e) {
                console.error('업적 저장 실패:', e);
            }
        }
    }, []);

    const handleRead = useCallback(async () => {
        if (!currentUser) return;
        const uid = currentUser.uid;
        const todayStr = kstTodayDateString();

        let currentProgressDay = currentUser.currentDay || 1;
        if (currentProgressDay > 365) {
            currentProgressDay = ((currentProgressDay - 1) % 365) + 1;
        }
        const vDay = viewingDay || currentProgressDay;
        const oldScore = currentUser.score || 0;
        const oldLevel = Math.floor(oldScore / 100);

        const streakBonus = Math.min(5, currentUser.streak || 0);
        const addedScore = 10 + streakBonus;
        const newScore = oldScore + addedScore;
        const newLevel = Math.floor(newScore / 100);

        const nextViewingDay = vDay >= 365 ? 1 : vDay + 1;

        const currentReadCount = currentUser.readCount || 1;
        const shouldAdvanceProgress = vDay >= currentProgressDay;
        let newProgressDay = currentProgressDay;
        let newReadCount = currentReadCount;
        let completedRound = false;

        if (shouldAdvanceProgress) {
            newProgressDay = nextViewingDay;
            if (vDay >= 365) {
                newReadCount = currentReadCount + 1;
                completedRound = true;
            }
        }

        let newStreak = 1;
        if (currentUser.lastReadDate) {
            const lastDate = new Date(currentUser.lastReadDate);
            const todayDate = new Date(todayStr);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = (currentUser.streak || 0) + 1;
            else if (diffDays === 0) newStreak = currentUser.streak || 0;
        }

        const historyItem = { date: todayStr, day: vDay, score: addedScore };

        // Firestore용 (sentinel 포함) - 클라이언트 상태에 사용 금지
        const firestoreUpdateData = {
            currentDay: newProgressDay,
            readCount: newReadCount,
            score: firebase.firestore.FieldValue.increment(addedScore),
            streak: newStreak,
            lastReadDate: todayStr,
            readHistory: firebase.firestore.FieldValue.arrayUnion(historyItem),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // 로컬 상태용 (실제 값만) - sentinel 절대 포함 불가
        const localUpdateData = {
            currentDay: newProgressDay,
            readCount: newReadCount,
            score: newScore,
            streak: newStreak,
            lastReadDate: todayStr,
            readHistory: [...(currentUser.readHistory || []), historyItem],
        };

        const userRef = db.collection('users').doc(uid);
        const historyRef = userRef.collection('history').doc();

        try {
            const batch = db.batch();
            batch.set(userRef, firestoreUpdateData, { merge: true });
            batch.set(historyRef, historyItem);
            await batch.commit();

            const updatedUser = { ...currentUser, ...localUpdateData };
            setCurrentUser(updatedUser);
            setViewingDay(nextViewingDay);
            setHasReadToday(true);
            setReadHistory(prev => [historyItem, ...prev]);

            if (newLevel > oldLevel) {
                setLevelUpToast(true);
                setTimeout(() => setLevelUpToast(false), 5000);
            }
            if (streakBonus > 0) {
                setBonusToast(`${streakBonus}일 연속 보너스 +${streakBonus}pt!`);
                setTimeout(() => setBonusToast(null), 3000);
            }

            // loadAllMembers() 대신 로컬 낙관적 업데이트 (Firestore 풀스캔 제거)
            const memberPatch = {
                currentDay: newProgressDay,
                readCount: newReadCount,
                score: newScore,
                streak: newStreak,
                lastReadDate: todayStr,
            };
            const updatedMembers = (() => {
                const found = allMembersForRace.some(m => m.uid === uid);
                if (found) return allMembersForRace.map(m => m.uid === uid ? { ...m, ...memberPatch } : m);
                return [...allMembersForRace, {
                    uid,
                    name: currentUser.name,
                    subgroupId: currentUser.subgroupId || null,
                    communityId: currentUser.communityId || null,
                    communityName: currentUser.communityName || null,
                    ...memberPatch,
                }];
            })();
            setAllMembersForRace(updatedMembers);
            setSubgroupStats(calculateSubgroupStats(updatedMembers));
            if (currentUser.communityId) {
                setCommunityMembers(updatedMembers.filter(m => m.communityId === currentUser.communityId));
            }

            // summary/global 비동기 업데이트 (다른 사용자의 다음 로드에 반영)
            db.collection('summary').doc('global').set({
                members: {
                    [uid]: {
                        name: currentUser.name,
                        subgroupId: currentUser.subgroupId || null,
                        communityId: currentUser.communityId || null,
                        communityName: currentUser.communityName || null,
                        ...memberPatch,
                    }
                }
            }, { merge: true }).catch(e => console.warn('summary 업데이트 실패:', e));

            if (completedRound) {
                alert(`🎉 축하합니다! ${newReadCount - 1}독을 완료하셨습니다!\n\n이제 ${newReadCount}독을 시작합니다! 🏃‍♂️`);
            }

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            checkAchievements(updatedUser, currentUser.memos || {});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("읽기 처리 실패:", e);
            alert('저장에 실패했습니다. 네트워크 확인 후 다시 시도해주세요.');
        }
    }, [currentUser, viewingDay, allMembersForRace, setCurrentUser, setViewingDay, setAllMembersForRace, setCommunityMembers, setSubgroupStats, checkAchievements]);

    const handleRestart = useCallback(async (setMemos, setReadHistory) => {
        if (!currentUser) return;
        const uid = currentUser.uid;

        try {
            const today = kstTodayDateString();
            await db.collection('users').doc(uid).set({
                currentDay: 1, score: 0, streak: 0, startDate: today,
                lastReadDate: null, memos: {}, achievements: [],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            setCurrentUser(prev => ({
                ...prev, currentDay: 1, score: 0, streak: 0, startDate: today,
                lastReadDate: null, achievements: [], readCount: 1
            }));
            if (setMemos) setMemos({});
            if (setReadHistory) setReadHistory([]);
            alert('재시작되었습니다! 오늘부터 Day 1입니다. 화이팅! 🔥');
        } catch (e) {
            console.error("재시작 실패:", e);
            alert('재시작 실패');
        }
    }, [currentUser, setCurrentUser]);

    const changeStartDate = useCallback(async (dayOffset) => {
        if (!currentUser) return;
        const uid = currentUser.uid;

        try {
            await db.collection('users').doc(uid).set({
                dayOffset: dayOffset,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            setCurrentUser(prev => ({ ...prev, dayOffset: dayOffset }));
        } catch (e) {
            console.error("날짜 설정 실패:", e);
        }
    }, [currentUser, setCurrentUser]);

    return {
        readHistory,
        setReadHistory,
        hasReadToday,
        setHasReadToday,
        showConfetti,
        setShowConfetti,
        levelUpToast,
        setLevelUpToast,
        bonusToast,
        setBonusToast,
        newAchievement,
        setNewAchievement,
        handleRead,
        handleRestart,
        changeStartDate,
        checkAchievements
    };
};
