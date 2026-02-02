import { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { userDocToState } from '../utils/helpers';

export const useUserAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('🔐 Auth state changed:', firebaseUser ? firebaseUser.uid : null);

            if (firebaseUser) {
                try {
                    // Firestore에서 사용자 데이터 불러오기
                    const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

                    if (userDoc.exists) {
                        const user = userDocToState(userDoc);
                        console.log('✅ 사용자 데이터 복원:', user.name);
                        setCurrentUser(user);
                    } else {
                        // Firestore에 데이터가 없으면 로그인 화면으로/초기화
                        console.log('⚠️ Firestore 데이터 없음');
                        setCurrentUser(null);
                    }
                } catch (e) {
                    console.error('사용자 데이터 로딩 실패:', e);
                    setCurrentUser(null);
                }
            } else {
                // 로그인 안 된 상태
                setCurrentUser(null);
            }

            setAuthLoading(false);
        });

        // 컴포넌트 언마운트 시 리스너 해제
        return () => unsubscribe();
    }, []);

    return { currentUser, setCurrentUser, authLoading };
};
