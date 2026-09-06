import { useEffect } from 'react';
import { db } from '../utils/firebase';
import { calculateSubgroupStats } from '../utils/statsUtils';
import { buildRecentReadDailyCounts } from '../utils/readHistoryUtils';

// Sub-hooks
import { useBibleContent } from './useBibleContent';
import { useMemos } from './useMemos';
import { useCommunity } from './useCommunity';
import { useUserBibleActions } from './useUserBibleActions';

const hasSameDailyCounts = (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => (
        item.date === right[index].date && Number(item.daysRead) === Number(right[index].daysRead)
    ));
};

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
        loadAllMembers, changeSubgroup, rebuildSummary
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

    // [Effect 2] Initial summary load when entering dashboard or user changes
    useEffect(() => {
        if (view !== 'dashboard' || !currentUser) return;

        // initial viewingDay setting
        if (viewingDay === null) {
            setViewingDay(currentUser.currentDay || 1);
        }

        const loadDashboardData = async () => {
            const uid = currentUser.uid;

            const membersPromise = loadAllMembers();
            const memosPromise = loadMemos(uid);
            const settingsPromise = Promise.all([loadAnnouncement(), loadKakaoLink()]);

            // 로그인 때 이미 읽은 사용자 문서를 다시 조회하지 않는다.
            // handleRead가 사용자 문서의 readHistory와 history 하위 문서를 원자적으로 함께 갱신한다.
            setReadHistory(Array.isArray(currentUser.readHistory) ? currentUser.readHistory : []);

            const allMembers = await membersPromise;
            const derivedRecentReadDailyCounts = buildRecentReadDailyCounts(currentUser.readHistory);
            const existingCurrentMember = allMembers.find(member => member.uid === uid);
            const currentRecentReadDailyCounts = derivedRecentReadDailyCounts.length > 0
                ? derivedRecentReadDailyCounts
                : (existingCurrentMember?.recentReadDailyCounts || []);
            const currentMemberPatch = {
                uid,
                name: currentUser.name || '',
                currentDay: currentUser.currentDay || 1,
                readCount: currentUser.readCount || 1,
                subgroupId: currentUser.subgroupId || '소속없음',
                communityId: currentUser.communityId || '',
                communityName: currentUser.communityName || '',
                score: currentUser.score || 0,
                streak: currentUser.streak || 0,
                lastReadDate: currentUser.lastReadDate || null,
                planId: currentUser.planId || '',
                recentReadDailyCounts: currentRecentReadDailyCounts,
                recentReadDates: currentRecentReadDailyCounts.map(item => item.date),
            };
            const effectiveMembers = existingCurrentMember
                ? allMembers.map(member => member.uid === uid ? { ...member, ...currentMemberPatch } : member)
                : [...allMembers, currentMemberPatch];

            setAllMembersForRace(effectiveMembers);
            if (effectiveMembers.length > 0) {
                setSubgroupStats(calculateSubgroupStats(effectiveMembers));
            }

            if (currentUser.communityId) {
                const compactCommunityMembers = effectiveMembers.filter(m => m.communityId === currentUser.communityId);
                setCommunityMembers(compactCommunityMembers);
            }

            // 구형 summary는 날짜만 저장해 몰아 읽은 분량을 잃었다.
            // 현재 사용자는 이미 로드한 자신의 기록으로만 보정하며 추가 읽기는 발생시키지 않는다.
            const shouldBackfillMySummary = !existingCurrentMember
                || (derivedRecentReadDailyCounts.length > 0 && !hasSameDailyCounts(
                    existingCurrentMember.recentReadDailyCounts,
                    derivedRecentReadDailyCounts
                ));
            if (shouldBackfillMySummary) {
                db.collection('summary').doc('global').set({
                    members: { [uid]: currentMemberPatch }
                }, { merge: true }).catch(e => console.warn('내 읽기 요약 보정 실패:', e));
            }

            await Promise.all([memosPromise, settingsPromise]);
        };

        loadDashboardData();
    }, [
        view,
        currentUser?.uid,
        // We removed viewingDay from here to prevent re-fetching on every day change
        loadAllMembers, loadMemos, loadAnnouncement, loadKakaoLink,
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
