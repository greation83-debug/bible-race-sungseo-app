import { useEffect, useCallback } from 'react';
import { auth, db } from '../utils/firebase';
import { calculateSubgroupStats } from '../utils/statsUtils';

// Sub-hooks
import { useBibleContent } from './useBibleContent';
import { useMemos } from './useMemos';
import { useCommunity } from './useCommunity';
import { useUserBibleActions } from './useUserBibleActions';

export const useBibleLogic = (currentUser, setCurrentUser, view) => {
    // 1. Content Hook
    const {
        verseData, setVerseData, viewingDay, setViewingDay, loadContent
    } = useBibleContent(currentUser);

    // 2. Community & Stats Hook
    const {
        subgroupStats, setSubgroupStats, communityMembers, setCommunityMembers,
        allMembersForRace, setAllMembersForRace, announcement, loadAnnouncement,
        loadAllMembers, changeSubgroup
    } = useCommunity(currentUser, setCurrentUser);

    // 3. User Actions Hook
    const {
        readHistory, setReadHistory, hasReadToday, setHasReadToday,
        showConfetti, setShowConfetti, levelUpToast, setLevelUpToast,
        bonusToast, setBonusToast, newAchievement, setNewAchievement,
        handleRead, handleRestart, changeStartDate, checkAchievements
    } = useUserBibleActions(
        currentUser, setCurrentUser,
        setAllMembersForRace, setCommunityMembers, setSubgroupStats,
        loadAllMembers,
        setViewingDay
    );

    // 4. Memos Hook
    const { memos, setMemos, loadMemos, saveMemo } = useMemos(currentUser);

    // Orchestrated Loading Effect
    useEffect(() => {
        if (view !== 'dashboard' || !currentUser) return;

        if (viewingDay === null) {
            setViewingDay(currentUser.currentDay || 1);
            return;
        }

        const loadData = async () => {
            // Load Bible Content
            await loadContent(viewingDay);

            // Load Community Data
            const allMembers = await loadAllMembers();
            setAllMembersForRace(allMembers);
            if (allMembers && allMembers.length > 0) {
                setSubgroupStats(calculateSubgroupStats(allMembers));
                if (currentUser.communityId) {
                    const myCommMembers = allMembers.filter(m => m.communityId === currentUser.communityId);
                    setCommunityMembers(myCommMembers);
                }
            }

            // Load User Specific Data
            const uid = auth.currentUser ? auth.currentUser.uid : null;
            if (uid) {
                await loadMemos(uid);
                // Also load read history if needed (already handled in App.jsx or loadMemos if we want)
                // In previous version, loadMemos also setReadHistory.
                const userDoc = await db.collection('users').doc(uid).get();
                if (userDoc.exists && userDoc.data().readHistory) {
                    setReadHistory(userDoc.data().readHistory);
                }
            }

            // Load Announcements
            await loadAnnouncement();
        };

        loadData();
    }, [
        view, currentUser?.uid, viewingDay, currentUser?.planId, currentUser?.dayOffset,
        loadContent, loadAllMembers, loadMemos, loadAnnouncement,
        setAllMembersForRace, setSubgroupStats, setCommunityMembers, setReadHistory
    ]);

    // Check if user has read today
    useEffect(() => {
        if (currentUser && currentUser.lastReadDate === new Date().toDateString()) {
            setHasReadToday(true);
        } else {
            setHasReadToday(false);
        }
    }, [currentUser, setHasReadToday]);

    return {
        // States
        verseData, setVerseData,
        subgroupStats, setSubgroupStats,
        communityMembers, setCommunityMembers,
        allMembersForRace, setAllMembersForRace,
        memos, setMemos,
        readHistory, setReadHistory,
        announcement,
        viewingDay, setViewingDay,
        hasReadToday, setHasReadToday,

        // UI States
        showConfetti, setShowConfetti,
        levelUpToast, setLevelUpToast,
        bonusToast, setBonusToast,
        newAchievement, setNewAchievement,

        // Actions
        handleRead,
        saveMemo: (day, memoText, onComplete) =>
            saveMemo(day, memoText, verseData.subtitle, checkAchievements, onComplete),
        changeSubgroup,
        handleRestart: () => handleRestart(setMemos, setReadHistory),
        changeStartDate,

        // Data Loaders
        loadAllMembers,
        loadMemos,
        loadAnnouncement
    };
};
