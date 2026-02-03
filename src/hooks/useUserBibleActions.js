import { useState, useCallback } from 'react';
import { db, firebase } from '../utils/firebase';
import { ACHIEVEMENTS } from '../data/achievements';
import { calculateSubgroupStats } from '../utils/statsUtils';

export const useUserBibleActions = (
    currentUser,
    setCurrentUser,
    setAllMembersForRace,
    setCommunityMembers,
    setSubgroupStats,
    loadAllMembers,
    setViewingDay
) => {
    const [readHistory, setReadHistory] = useState([]);
    const [hasReadToday, setHasReadToday] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [levelUpToast, setLevelUpToast] = useState(null);
    const [bonusToast, setBonusToast] = useState(null);
    const [newAchievement, setNewAchievement] = useState(null);

    const checkAchievements = useCallback((user, userMemos) => {
        if (!user) return;
        const newEarned = [];
        const currentEarnedIds = new Set(user.achievements || []);

        ACHIEVEMENTS.forEach(ach => {
            if (currentEarnedIds.has(ach.id)) return;
            if (ach.condition(user, userMemos)) {
                newEarned.push(ach.id);
                setNewAchievement((prev) => ach); // Use callback to ensure we handle quick successions?
                setTimeout(() => setNewAchievement(null), 5000);
            }
        });

        if (newEarned.length > 0) {
            const updated = [...(user.achievements || []), ...newEarned];
            db.collection('users').doc(user.uid).update({ achievements: updated });
        }
    }, []);

    const handleRead = useCallback(async () => {
        if (!currentUser) return;
        const uid = currentUser.uid;
        const todayStr = new Date().toDateString();

        const currentDay = currentUser.currentDay || 1;
        const oldScore = currentUser.score || 0;
        const oldLevel = Math.floor(oldScore / 100);

        const streakBonus = Math.min(5, currentUser.streak || 0);
        const addedScore = 10 + streakBonus;
        const newScore = oldScore + addedScore;
        const newLevel = Math.floor(newScore / 100);

        const newDay = currentDay >= 365 ? 1 : currentDay + 1;
        const newReadCount = currentDay >= 365 ? (currentUser.readCount || 1) + 1 : (currentUser.readCount || 1);
        const completedRound = currentDay >= 365;

        // 연속 읽기 계산
        let newStreak = 1;
        if (currentUser.lastReadDate) {
            const lastDate = new Date(currentUser.lastReadDate);
            const todayDate = new Date(todayStr);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) newStreak = (currentUser.streak || 0) + 1;
            else if (diffDays === 0) newStreak = currentUser.streak || 0;
        }

        const updateData = {
            currentDay: newDay,
            readCount: newReadCount,
            score: newScore,
            streak: newStreak,
            lastReadDate: todayStr,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const historyItem = { date: todayStr, day: currentDay, score: addedScore };

        try {
            await db.collection('users').doc(uid).set(updateData, { merge: true });
            await db.collection('users').doc(uid).collection('history').add(historyItem);

            const updatedUser = { ...currentUser, ...updateData };
            setCurrentUser(updatedUser);
            setViewingDay(newDay);
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

            const allMembers = await loadAllMembers();
            setAllMembersForRace(allMembers);
            setSubgroupStats(calculateSubgroupStats(allMembers));

            if (currentUser.communityId) {
                const myCommMembers = allMembers.filter(m => m.communityId === currentUser.communityId);
                setCommunityMembers(myCommMembers);
            }

            if (completedRound) {
                alert(`🎉 축하합니다! ${newReadCount - 1}독을 완료하셨습니다!\n\n이제 ${newReadCount}독을 시작합니다! 🏃‍♂️`);
            }

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            checkAchievements(updatedUser, {});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("읽기 처리 실패:", e);
        }
    }, [currentUser, setCurrentUser, loadAllMembers, setAllMembersForRace, setCommunityMembers, setSubgroupStats, checkAchievements]);

    const handleRestart = useCallback(async (setMemos, setReadHistory) => {
        if (!currentUser) return;
        const uid = currentUser.uid;

        try {
            const today = new Date().toDateString();
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
