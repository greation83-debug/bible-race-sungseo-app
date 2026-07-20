// users 컬렉션 전체에서 평문 password 필드를 삭제하는 1회성 마이그레이션.
// 실행: node scripts/remove-password-fields.mjs        (실제 삭제)
//       node scripts/remove-password-fields.mjs --dry-run (대상만 출력)
// 주의: firestore.rules 배포 후에는 익명 인증이 차단되므로 이 스크립트는 rules 배포 전에 실행해야 한다.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAOMubppe1JZbBh0VBv7UIbZyY2S1RI9fw',
  authDomain: 'bible-sungseo.firebaseapp.com',
  projectId: 'bible-sungseo',
  storageBucket: 'bible-sungseo.firebasestorage.app',
  messagingSenderId: '1061949588108',
  appId: '1:1061949588108:web:e8e3bbd6c3f73afa5131a9',
};

const dryRun = process.argv.includes('--dry-run');

firebase.initializeApp(firebaseConfig);
await firebase.auth().signInAnonymously();
const db = firebase.firestore();

const snap = await db.collection('users').get();
const targets = [];
snap.forEach((doc) => {
  const d = doc.data();
  if (d.password !== undefined || d.passwordResetRequired !== undefined) {
    targets.push(doc.id);
  }
});
console.log(`users 총 ${snap.size}명 중 password/passwordResetRequired 필드 보유: ${targets.length}명`);

if (dryRun) {
  console.log('(dry-run) 삭제하지 않고 종료합니다.');
} else {
  for (let i = 0; i < targets.length; i += 450) {
    const batch = db.batch();
    for (const uid of targets.slice(i, i + 450)) {
      batch.update(db.collection('users').doc(uid), {
        password: firebase.firestore.FieldValue.delete(),
        passwordResetRequired: firebase.firestore.FieldValue.delete(),
      });
    }
    await batch.commit();
    console.log(`삭제 진행: ${Math.min(i + 450, targets.length)}/${targets.length}`);
  }

  // 검증
  const verify = await db.collection('users').get();
  let remain = 0;
  verify.forEach((doc) => { if (doc.data().password !== undefined) remain += 1; });
  console.log(`검증: password 필드 잔존 ${remain}명 (0이어야 정상)`);
}

await firebase.auth().signOut();
await firebase.app().delete();
