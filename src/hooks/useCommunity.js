import { useState, useCallback } from 'react';
import { db, firebase } from '../utils/firebase';
import { calculateSubgroupStats } from '../utils/statsUtils';

const RACE_MEMBERS_CACHE_KEY = 'race_members_cache_v1';

const compactRaceMember = (member) => ({
    uid: member.uid,
    name: member.name || '',
    currentDay: member.currentDay || 1,
    readCount: member.readCount || 1,
    subgroupId: member.subgroupId || '소속없음',
    communityId: member.communityId || '',
    communityName: member.communityName || '',
    score: member.score || 0,
    streak: member.streak || 0,
    lastReadDate: member.lastReadDate || null,
    planId: member.planId || '',
    readHistory: Array.isArray(member.readHistory) ? member.readHistory : [],
});

const readCachedRaceMembers = () => {
    try {
        const cached = localStorage.getItem(RACE_MEMBERS_CACHE_KEY);
        if (!cached) return [];
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed.members) ? parsed.members : [];
    } catch (e) {
        return [];
    }
};

const writeCachedRaceMembers = (members) => {
    try {
        localStorage.setItem(RACE_MEMBERS_CACHE_KEY, JSON.stringify({
            cachedAt: Date.now(),
            members: members.map(compactRaceMember)
        }));
    } catch (e) {
        // localStorage 용량/권한 문제는 레이스맵 표시만 느려질 뿐 기능에는 영향이 없다.
    }
};

export const useCommunity = (currentUser, setCurrentUser) => {
    const [subgroupStats, setSubgroupStats] = useState({});
    const [communityMembers, setCommunityMembers] = useState([]);
    const [allMembersForRace, setAllMembersForRace] = useState(readCachedRaceMembers);
    const [announcement, setAnnouncement] = useState(null);
    const [kakaoLink, setKakaoLink] = useState(null);

    const loadAllMembers = useCallback(async () => {
        try {
            const snapshot = await db.collection('users').get();
            const members = snapshot.docs.map(doc => compactRaceMember({ uid: doc.id, ...doc.data() }));
            writeCachedRaceMembers(members);
            return members;
        } catch (e) {
            console.error("멤버 로딩 실패:", e);
            return readCachedRaceMembers();
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
        loadAnnouncement,
        loadKakaoLink,
        changeSubgroup
    };
};
