// 로그인 때 필요한 부분만 따로 둔다(관리자 암호 초기화 코드는 관리자만 따로 받음).
// loginAlias/{이름} 문서가 "이 이름은 이제 이 계정으로 로그인"을 알려준다. (암호는 저장하지 않음)
import { makePseudoEmail } from './helpers';

export const aliasIdForName = (name) => encodeURIComponent(String(name || '').trim());

// 로그인할 계정 주소: 초기화된 이름이면 새 계정, 아니면 기존 규칙
export const resolveLoginEmail = async (db, name) => {
    try {
        const alias = await db.collection('loginAlias').doc(aliasIdForName(name)).get();
        if (alias.exists && alias.data().email) return { email: alias.data().email, aliased: true };
    } catch (e) {
        console.warn('loginAlias 확인 실패, 기본 계정으로 로그인:', e);
    }
    return { email: makePseudoEmail(name), aliased: false };
};
