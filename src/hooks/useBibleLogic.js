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
        kakaoLink, loadKakaoLink, setKakaoLink,
        loadAllMembers, loadCommunityMembersWithHistory, changeSubgroup, rebuildSummary
    } = useCommunity(currentUser, setCurrentUser);

    // 3. User Actions Hook
    const {
        readHistory, setReadHistory, hasReadToday, setHasReadToday,
        showConfetti, setShowConfetti, levelUpToast, setLevelUpToast,
        bonusToast, setBonusToast, newAchievement, setNewAchievement,
        handleRead, handleRestart, changeStartDate, checkAchievements
    } = useUserBibleActions(
        currentUser, setCurrentUser,
        allMembersForRace,
        setAllMembersForRace, setCommunityMembers, setSubgroupStats,
        setViewingDay,
        viewingDay
    );

    // 4. Memos Hook
    const { memos, setMemos, loadMemos, saveMemo } = useMemos(currentUser);

    // [Effect 1] Load Bible Content when viewingDay changes
    useEffect(() => {
        if (view !== 'dashboard' || !currentUser || viewingDay === null) return;
        loadContent(viewingDay);
    }, [view, currentUser?.uid, viewingDay, currentUser?.planId, currentUser?.dayOffset, loadContent]);

    // [Effect 2] Initial full load when entering dashboard or user changes
    useEffect(() => {
        if (view !== 'dashboard' || !currentUser) return;

        // initial viewingDay setting
        if (viewingDay === null) {
            setViewingDay(currentUser.currentDay || 1);
        }

        const loadDashboardData = async () => {
            const uid = currentUser.uid;

            const membersPromise = loadAllMembers();
            // 읽기왕은 날짜 수가 아니라 실제로 읽은 DAY 분량을 집계해야 하므로
            // 현재 공동체 멤버의 전체 readHistory를 별도로 불러온다.
            const communityMembersPromise = currentUser.communityId
                ? loadCommunityMembersWithHistory(currentUser.communityId)
                : Promise.resolve([]);
            const memosPromise = loadMemos(uid);
            const historyPromise = (async () => {
                const historySnap = await db.collection('users').doc(uid).collection('history').get();
                const subCollectionHistory = historySnap.docs.map(doc => doc.data());

                const userDoc = await db.collection('users').doc(uid).get();
                const arrayFieldHistory = (userDoc.exists && userDoc.data().readHistory) || [];

                // 같은 날 여러 Day를 몰아서 읽을 수 있으므로 date+day 기준으로만 중복 제거한다.
                const combinedMap = new Map();
                [...arrayFieldHistory, ...subCollectionHistory].forEach(item => {
                    const dateKey = typeof item === 'string' ? item : item.date;
                    const dayKey = typeof item === 'string' ? '' : (item.day || '');
                    if (dateKey) combinedMap.set(`${dateKey}-${dayKey}`, item);
                });

                setReadHistory(Array.from(combinedMap.values()));
            })();
            const settingsPromise = Promise.all([loadAnnouncement(), loadKakaoLink()]);

            const allMembers = await membersPromise;
            setAllMembersForRace(allMembers);
            if (allMembers && allMembers.length > 0) {
                setSubgroupStats(calculateSubgroupStats(allMembers));
            }

            const fullCommunityMembers = await communityMembersPromise;
            if (currentUser.communityId) {
                const compactCommunityMembers = allMembers.filter(m => m.communityId === currentUser.communityId);
                setCommunityMembers(fullCommunityMembers.length > 0 ? fullCommunityMembers : compactCommunityMembers);
            }

            await Promise.all([memosPromise, historyPromise, settingsPromise]);
        };

        loadDashboardData();
    }, [
        view,
        currentUser?.uid,
        // We removed viewingDay from here to prevent re-fetching on every day change
        loadAllMembers, loadCommunityMembersWithHistory, loadMemos, loadAnnouncement, loadKakaoLink,
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
        kakaoLink,
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
        rebuildSummary,
        loadMemos,
        loadAnnouncement,
        loadKakaoLink,
        setKakaoLink // 셋터도 추가 (관리자용)
    };
};
