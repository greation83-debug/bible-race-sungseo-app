// 관리자 암호 초기화 (무료 요금제용, 서버 함수 없이 동작)
//
// 앱(클라이언트)에서는 다른 사람의 로그인 암호를 직접 바꿀 수 없다.
// 그래서 초기화할 때 같은 이름으로 "새 로그인 계정"을 만들고, 기존 기록을 새 계정으로 옮긴다.
// loginAlias/{이름} 문서가 "이 이름은 이제 이 계정으로 로그인"을 알려준다. (암호는 저장하지 않음)
// 옛 계정은 앱에서 더 이상 쓰이지 않는다.
import { aliasIdForName } from './loginAlias';

const BATCH_LIMIT = 400;

// 로그인 쪽 함수는 loginAlias.js에 있다(성도 첫 화면 묶음을 작게 하려고 분리).
export { aliasIdForName, resolveLoginEmail } from './loginAlias';

const getSecondaryAuth = (firebase) => {
    const existing = firebase.apps.find(a => a.name === 'password-reset');
    const app = existing || firebase.initializeApp(firebase.app().options, 'password-reset');
    return app.auth();
};

const commitInChunks = async (db, ops) => {
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = db.batch();
        ops.slice(i, i + BATCH_LIMIT).forEach(op => op(batch));
        await batch.commit();
    }
};

export const adminResetPassword = async ({ db, firebase, adminUid, user, newPassword, onProgress = () => {} }) => {
    const oldUid = user.uid;
    const name = String(user.name || '').trim();
    if (!oldUid || !name) throw new Error('회원 정보가 올바르지 않습니다.');
    if (oldUid === adminUid) throw new Error('지금 로그인한 관리자 본인 계정은 여기서 초기화할 수 없습니다.');
    if (String(newPassword).length < 6) throw new Error('암호는 6자리 이상이어야 합니다.');

    const usersRef = db.collection('users');
    const oldRef = usersRef.doc(oldUid);

    onProgress('기록 읽는 중...');
    const [oldDoc, historySnap, memoSnap, aliasDoc, adminsDoc] = await Promise.all([
        oldRef.get(),
        oldRef.collection('history').get(),
        oldRef.collection('memos').get(),
        db.collection('loginAlias').doc(aliasIdForName(name)).get(),
        db.collection('config').doc('admins').get(),
    ]);
    if (!oldDoc.exists) throw new Error('회원 기록을 찾지 못했습니다.');

    // 1) 새 로그인 계정 만들기 (관리자 로그인은 그대로 유지되도록 별도 인스턴스 사용)
    onProgress('새 로그인 계정 만드는 중...');
    const nextSeq = ((aliasDoc.exists && aliasDoc.data().seq) || 1) + 1;
    const newEmail = `${aliasIdForName(name)}+r${nextSeq}@bible.local`;
    const secondaryAuth = getSecondaryAuth(firebase);
    await secondaryAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
    let newUid;
    try {
        const cred = await secondaryAuth.createUserWithEmailAndPassword(newEmail, String(newPassword));
        newUid = cred.user.uid;
    } catch (e) {
        if (e && e.code === 'auth/weak-password') throw new Error('암호는 6자리 이상이어야 합니다.');
        throw new Error('새 계정 만들기 실패: ' + ((e && e.message) || e));
    } finally {
        await secondaryAuth.signOut().catch(() => {});
    }
    const newRef = usersRef.doc(newUid);

    // 2) 기록 복사 (회원 문서 + 읽기 기록 + 묵상)
    onProgress('기록 옮기는 중...');
    const copyOps = [
        b => b.set(newRef, { ...oldDoc.data(), migratedFrom: oldUid, passwordResetAt: firebase.firestore.FieldValue.serverTimestamp() }),
        ...historySnap.docs.map(d => b => b.set(newRef.collection('history').doc(d.id), d.data())),
        ...memoSnap.docs.map(d => b => b.set(newRef.collection('memos').doc(d.id), d.data())),
    ];
    await commitInChunks(db, copyOps);

    // 3) 복사 확인
    const [newHistory, newMemos] = await Promise.all([
        newRef.collection('history').get(),
        newRef.collection('memos').get(),
    ]);
    if (newHistory.size !== historySnap.size || newMemos.size !== memoSnap.size) {
        throw new Error('기록 복사 확인에 실패했습니다. 옛 계정은 그대로 있으니 다시 시도해주세요.');
    }

    // 4) 이 이름의 로그인을 새 계정으로 연결, 레이스맵 집계·관리자 목록도 새 계정으로
    onProgress('로그인 연결 중...');
    const FieldPath = firebase.firestore.FieldPath;
    const FieldValue = firebase.firestore.FieldValue;
    const switchBatch = db.batch();
    switchBatch.set(db.collection('loginAlias').doc(aliasIdForName(name)), {
        email: newEmail, uid: newUid, seq: nextSeq, updatedAt: FieldValue.serverTimestamp(),
    });
    const summaryRef = db.collection('summary').doc('global');
    const summaryDoc = await summaryRef.get();
    const oldEntry = summaryDoc.exists && summaryDoc.data().members && summaryDoc.data().members[oldUid];
    if (oldEntry) {
        switchBatch.update(summaryRef, new FieldPath('members', newUid), oldEntry, new FieldPath('members', oldUid), FieldValue.delete());
    }
    const adminUids = (adminsDoc.exists && adminsDoc.data().uids) || [];
    if (adminUids.includes(oldUid)) {
        switchBatch.update(db.collection('config').doc('admins'), { uids: [...adminUids.filter(u => u !== oldUid), newUid] });
    }
    await switchBatch.commit();

    // 5) 옛 계정 기록 정리 (새 계정에 복사·확인 완료 후)
    onProgress('정리 중...');
    const deleteOps = [
        ...historySnap.docs.map(d => b => b.delete(d.ref)),
        ...memoSnap.docs.map(d => b => b.delete(d.ref)),
        b => b.delete(oldRef),
    ];
    await commitInChunks(db, deleteOps);

    return { newUid, newEmail, name, historyCount: historySnap.size, memoCount: memoSnap.size };
};
