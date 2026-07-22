import { useState, useCallback } from 'react';
import { db, firebase } from '../utils/firebase';
import { countMemoEntries, getMemoEntries, memoEntriesToMap } from '../utils/memoUtils';

export const useMemos = (currentUser) => {
    const [memos, setMemos] = useState({});

    const loadMemos = useCallback(async (uid) => {
        if (!db || !uid) return {};
        try {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            const legacyEntries = userDoc.exists ? getMemoEntries(userDoc.data().memos || {}) : [];
            let savedEntries = [];
            try {
                const memoSnapshot = await userRef.collection('memos').get();
                savedEntries = memoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                // 규칙 배포 전에도 기존 묵상은 계속 보이도록 레거시 데이터로 폴백한다.
                console.warn('새 묵상 저장소를 불러오지 못해 기존 기록만 표시합니다:', e);
            }
            const loadedMemos = memoEntriesToMap([...legacyEntries, ...savedEntries]);
            setMemos(loadedMemos);
            return loadedMemos;
        } catch (e) {
            console.error("메모 불러오기 실패:", e);
        }
        return {};
    }, []);

    const saveMemo = useCallback(async (day, memoText, verseSubtitle, checkAchievements, onComplete) => {
        const uid = currentUser ? currentUser.uid : null;
        if (!uid || !memoText.trim()) return;

        const memoRef = db.collection('users').doc(uid).collection('memos').doc();
        const memoEntry = {
            id: memoRef.id,
            day: Number(day),
            readCount: Number(currentUser.readCount || 1),
            text: memoText,
            date: new Date().toISOString(),
            title: verseSubtitle || ''
        };
        const newMemos = { ...memos, [memoRef.id]: memoEntry };
        setMemos(newMemos);
        if (typeof onComplete === 'function') onComplete();

        try {
            const batch = db.batch();
            batch.set(memoRef, { ...memoEntry, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            batch.set(db.collection('users').doc(uid), {
                memoCount: countMemoEntries(newMemos),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            await batch.commit();
            if (checkAchievements) checkAchievements(currentUser, newMemos);
        } catch (e) {
            console.error("메모 저장 실패:", e);
            setMemos(memos);
        }
    }, [currentUser, memos]);

    return {
        memos,
        setMemos,
        loadMemos,
        saveMemo
    };
};
