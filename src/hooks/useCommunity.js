import { useState, useCallback } from 'react';
import { db, firebase } from '../utils/firebase';
import { calculateSubgroupStats } from '../utils/statsUtils';
import {
    buildRecentReadDailyCounts,
    normalizeRecentReadDailyCounts,
} from '../utils/readHistoryUtils';

const RACE_MEMBERS_CACHE_KEY = 'race_members_cache_v3';
const LEGACY_RACE_MEMBERS_CACHE_KEYS = ['race_members_cache_v1', 'race_members_cache_v2'];
const RACE_MEMBERS_CACHE_SCHEMA_VERSION = 3;
const RACE_MEMBERS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const hasValidProgress = (member) => {
    if (!member || typeof member !== 'object') return false;
    const currentDay = Number(member.currentDay);
    const readCount = Number(member.readCount);
    return Number.isFinite(currentDay)
        && currentDay >= 1
        && Number.isFinite(readCount)
        && readCount >= 1;
};

const compactRaceMember = (member) => {
    const recentReadDailyCounts = normalizeRecentReadDailyCounts(member);
    return {
        uid: member.uid,
        name: member.name || '',
        currentDay: Number(member.currentDay),
        readCount: Number(member.readCount),
        subgroupId: member.subgroupId || '소속없음',
        communityId: member.communityId || '',
        communityName: member.communityName || '',
        score: member.score || 0,
        streak: member.streak || 0,
        lastReadDate: member.lastReadDate || null,
        planId: member.planId || '',
        // 전체 readHistory는 사용자 문서에만 두고, 공동체 화면에는 최근 일별 합계만 전달한다.
        recentReadDailyCounts,
        recentReadDates: recentReadDailyCounts.map(item => item.date),
    };
};

const readCachedRaceMembers = () => {
    try {
        LEGACY_RACE_MEMBERS_CACHE_KEYS.forEach(key => localStorage.removeItem(key));
        const cached = localStorage.getItem(RACE_MEMBERS_CACHE_KEY);
        if (!cached) return [];
        const parsed = JSON.parse(cached);
        const cachedAt = Number(parsed.cachedAt);
        const isFresh = Number.isFinite(cachedAt)
            && Date.now() - cachedAt <= RACE_MEMBERS_CACHE_TTL_MS;
        const isValid = parsed.schemaVersion === RACE_MEMBERS_CACHE_SCHEMA_VERSION
            && Array.isArray(parsed.members)
            && parsed.members.length > 0
            && parsed.members.every(hasValidProgress);

        if (!isFresh || !isValid) {
            localStorage.removeItem(RACE_MEMBERS_CACHE_KEY);
            return [];
        }
        return parsed.members;
    } catch (e) {
        try { localStorage.removeItem(RACE_MEMBERS_CACHE_KEY); } catch (ignore) {}
        return [];
    }
};

const writeCachedRaceMembers = (members) => {
    try {
        if (!Array.isArray(members) || members.length === 0 || !members.every(hasValidProgress)) return;
        LEGACY_RACE_MEMBERS_CACHE_KEYS.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(RACE_MEMBERS_CACHE_KEY, JSON.stringify({
            schemaVersion: RACE_MEMBERS_CACHE_SCHEMA_VERSION,
            cachedAt: Date.now(),
            members: members.map(compactRaceMember)
        }));
    } catch (e) {
        // localStorage 용량/권한 문제는 레이스맵 표시만 느려질 뿐 기능에는 영향이 없다.
    }
};

export const clearRaceMembersCache = () => {
    try {
        localStorage.removeItem(RACE_MEMBERS_CACHE_KEY);
        LEGACY_RACE_MEMBERS_CACHE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch (e) {}
};

export const useCommunity = (currentUser, setCurrentUser) => {
    const [subgroupStats, setSubgroupStats] = useState({});
    const [communityMembers, setCommunityMembers] = useState([]);
    const [allMembersForRace, setAllMembersForRace] = useState(readCachedRaceMembers);
    const [announcement, setAnnouncement] = useState(null);
    const [kakaoLink, setKakaoLink] = useState(null);

    // 일반 대시보드는 summary/global 한 문서만 읽는다.
    // 전체 users 조회는 관리자가 명시적으로 집계를 재생성할 때만 허용한다.
    const loadAllMembers = useCallback(async () => {
        try {
            const summaryDoc = await db.collection('summary').doc('global').get();
            if (summaryDoc.exists) {
                const membersMap = summaryDoc.data().members || {};
                const keys = Object.keys(membersMap);
                const rawMembers = keys.map(uid => ({ uid, ...membersMap[uid] }));
                if (rawMembers.length > 0 && rawMembers.every(hasValidProgress)) {
                    const members = rawMembers.map(compactRaceMember);
                    writeCachedRaceMembers(members);
                    return members;
                }
                console.warn('summary 진행 정보가 불완전합니다. 관리자가 집계를 재생성해야 합니다.');
            }
        } catch (e) {
            console.warn('summary 읽기 실패, 기기 캐시를 사용합니다:', e);
        }
        return readCachedRaceMembers();
    }, []);

    // summary/global 전체 백필 (관리자 전용)
    const rebuildSummary = useCallback(async () => {
        try {
            const snapshot = await db.collection('users').get();
            const membersMap = {};
            snapshot.docs.forEach(doc => {
                const d = doc.data();
                const recentReadDailyCounts = buildRecentReadDailyCounts(d.readHistory);
                membersMap[doc.id] = {
                    name: d.name || '',
                    currentDay: d.currentDay || 1,
                    readCount: d.readCount || 1,
                    score: d.score || 0,
                    streak: d.streak || 0,
                    lastReadDate: d.lastReadDate || null,
                    subgroupId: d.subgroupId || null,
                    communityId: d.communityId || null,
                    communityName: d.communityName || null,
                    recentReadDailyCounts,
                    recentReadDates: recentReadDailyCounts.map(item => item.date),
                };
            });
            await db.collection('summary').doc('global').set({ members: membersMap });
            return snapshot.docs.length;
        } catch (e) {
            console.error('summary 백필 실패:', e);
            throw e;
        }
    }, []);

    const loadAnnouncement = useCallback(async () => {
        try {
            const doc = await db.collection('settings').doc('announcement').get();
            if (doc.exists && doc.data().enabled) {
                setAnnouncement(doc.data());
            } else {
                setAnnouncement(null);
            }
        } catch (e) {
            console.error("공지 로딩 실패:", e);
        }
    }, []);

    const loadKakaoLink = useCallback(async () => {
        try {
            const doc = await db.collection('settings').doc('kakao').get();
            if (doc.exists) {
                setKakaoLink(doc.data().url);
            }
        } catch (e) {
            console.error("카카오 링크 로딩 실패:", e);
        }
    }, []);

    const changeSubgroup = useCallback(async (newSubgroup) => {
        const uid = currentUser ? currentUser.uid : null;
        if (!uid) return;

        try {
            await db.collection('users').doc(uid).set({
                subgroupId: newSubgroup,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            setCurrentUser(prev => ({ ...prev, subgroupId: newSubgroup }));
            alert(`소그룹이 "${newSubgroup}"(으)로 변경되었습니다!`);

            const allMembers = await loadAllMembers();
            setAllMembersForRace(allMembers);
            setSubgroupStats(calculateSubgroupStats(allMembers));

            if (currentUser.communityId) {
                const myCommMembers = allMembers.filter(m => m.communityId === currentUser.communityId);
                setCommunityMembers(myCommMembers);
            }
        } catch (e) {
            console.error("소그룹 변경 실패:", e);
            alert('변경 실패');
        }
    }, [currentUser, setCurrentUser, loadAllMembers]);

    return {
        subgroupStats,
        setSubgroupStats,
        communityMembers,
        setCommunityMembers,
        allMembersForRace,
        setAllMembersForRace,
        announcement,
        setAnnouncement,
        kakaoLink,
        setKakaoLink,
        loadAllMembers,
        rebuildSummary,
        loadAnnouncement,
        loadKakaoLink,
        changeSubgroup
    };
};
