# 성경읽기 앱 보완 작업 지시서

> 대상: React 18 + Vite 4 + Firebase(compat SDK) 기반 교회 성경통독 앱.
> 배포: `npm run build` → gh-pages. 본문 텍스트는 `public/bible-cache/`의 정적 JSON에서 fetch.
> 작업은 아래 Phase 순서대로 진행하고, 각 Phase 완료 시 `npm run build`가 성공하는지 확인할 것.
> 기존 Firestore 데이터(users 컬렉션, 진행 중인 통독 기록)를 깨뜨리지 않는 것이 최우선 제약이다.

---

## Phase 1 — 보안 (최우선)

### 1-1. Firestore에서 평문 비밀번호 제거
- `src/utils/helpers.js:11` — `userDocToState`가 `password` 필드를 클라이언트 상태로 복원하는 부분 제거.
- `src/App.jsx` 회원가입(약 445~460행) — 사용자 문서 생성 시 `password: pw` 저장 제거.
- `src/App.jsx` `handleSubgroupSelect`(약 506~513행) — `{...finalUser}` 전체 set으로 `password`, `uid`가 문서에 재기록되는 문제: 변경 필드만 명시적으로 `update()` 하도록 수정.
- `src/components/AdminView.jsx:646` 부근 — 관리자 화면에 "현재 암호" 표시하는 UI 제거.
- 마이그레이션: 관리자 화면에 "비밀번호 필드 일괄 삭제" 버튼을 임시로 추가하거나, 별도 스크립트(`scripts/remove-password-fields.mjs`)로 모든 users 문서에서 `FieldValue.delete()`로 `password` 필드 삭제.
- **완료 기준**: 네트워크 탭/Firestore 콘솔 어디에서도 평문 비밀번호가 보이지 않음. 기존 사용자 로그인(Firebase Auth)은 정상 동작.

### 1-2. 관리자 인증을 하드코딩 암호에서 분리
- `src/App.jsx:344` — `name === 'admin' && pw === '08283'` 제거.
- 대체: Firestore `config/admins` 문서에 관리자 uid 목록을 두고, 정식 Firebase Auth 계정으로 로그인한 뒤 uid가 목록에 있으면 admin 모드 진입. (custom claims가 이상적이나 Cloud Functions 없이 가능한 차선책으로 uid 목록 방식 채택)
- `signInAnonymously()` 기반 관리자 진입(App.jsx:346~348) 제거.
- **완료 기준**: 번들 JS를 검색해도 관리자 암호 문자열이 없음. 관리자 uid가 아닌 계정으로는 AdminView 진입 불가.

### 1-3. Firestore Security Rules 작성
- 프로젝트 루트에 `firestore.rules` 파일 신규 작성 + README에 배포 방법 주석:
  - `users/{uid}`: 본인(`request.auth.uid == uid`)만 쓰기. 읽기는 로그인 사용자로 제한하되, 레이스맵용 전체 읽기가 필요하므로 당장은 `request.auth != null`로 익명 차단만이라도 적용. (Phase 3-1 집계 문서 도입 후 본인 외 읽기 차단으로 강화)
  - `users/{uid}/history/{doc}`: 본인만 읽기/쓰기.
  - 익명 인증(anonymous) 차단: rules에서 `request.auth.token.firebase.sign_in_provider != 'anonymous'` 검사.
  - 관리자 쓰기(타인 문서 수정, 공지 등): `config/admins` 목록 조회(`get()`) 기반 허용.
- **완료 기준**: rules 파일이 존재하고, 익명 토큰으로 users 컬렉션 list가 거부되는 시나리오가 rules 주석에 명시됨.

### 1-4. 동작하지 않는 암호 변경 기능 비활성화
- `src/App.jsx:248~280` `changePassword` — Firestore `password`/`passwordResetRequired` 필드만 기록하고 Firebase Auth 비밀번호는 변경하지 않아 **사용자가 새 암호로 로그인 불가능해지는 기능**임.
- `src/components/AdminView.jsx:665` 부근의 암호 변경 버튼/UI를 제거하거나 `disabled` + "준비 중" 처리. `changePassword` 함수와 `passwordResetRequired` 기록 코드도 제거.
- **완료 기준**: 관리자 화면에서 암호 변경 동선이 사라지고 관련 데드 코드 없음.

---

## Phase 2 — 데이터 정합성 / 안정성

### 2-1. handleRead의 sentinel 오염 및 동시성 수정
- `src/hooks/useUserBibleActions.js:43~141`:
  1. 로컬 상태 병합(약 107행)에서 `FieldValue.arrayUnion(...)`/`serverTimestamp()` sentinel이 `setCurrentUser`로 들어가는 문제 수정 — 로컬용 객체는 실제 값으로 별도 구성: `readHistory: [...(currentUser.readHistory || []), historyItem]`, `updatedAt`은 로컬 병합에서 제외.
  2. 점수/카운트 갱신은 `FieldValue.increment()` 사용으로 동시 클릭 시 유실 방지. 사용자 문서 갱신 + `history` 서브컬렉션 추가를 `db.batch()`로 묶어 원자화.
  3. 실패 시(약 139행) `console.error`만 하지 말고 `alert('저장에 실패했습니다. 네트워크 확인 후 다시 시도해주세요.')` + 낙관적 UI 롤백.
  4. `checkAchievements`(39행) 내부의 `update()`에 `await` + try/catch 추가. 137행에서 memos를 빈 객체 `{}`로 넘기는 부분은 실제 memos 상태를 전달하도록 호출부 수정 (묵상 업적이 영구 미달성되는 버그).
- **완료 기준**: "읽었습니다" 클릭 직후 `currentUser.readHistory`가 항상 진짜 배열. 오프라인 상태에서 클릭 시 사용자에게 실패 알림 표시.

### 2-2. MarkdownRenderer Hooks 규칙 위반 수정
- `src/components/MarkdownRenderer.jsx:5` — `if (!content) return null;`이 `useEffect`(47행 부근)보다 앞에 있음. early return을 모든 훅 호출 뒤로 이동.
- 같은 파일 2행의 미사용 `toSinoKorean` import 제거.
- **완료 기준**: content가 빈 값 → 텍스트로 바뀌는 재렌더에서 훅 개수 불일치 크래시 가능성 제거.

### 2-3. 본문 캐시 fetch 안정화
- `src/utils/bibleTextCache.js:22` — `cache: 'force-cache'` 제거하고 URL에 버전 쿼리 추가: manifest의 `generatedAt` 또는 빌드 타임 상수를 `?v=` 로 부착 (재배포 후 옛 본문이 영구히 보이는 문제 해결).
- `src/hooks/useBibleContent.js:9` — `withTimeout` 3000ms → 8000ms로 완화. 정적 fetch 실패 시 1회 재시도 추가.
- `src/hooks/useBibleContent.js:154` 부근 — localStorage `v_*` 키 저장 시, 키가 200개 초과면 오래된 것부터 삭제하는 간단한 정리 루틴 추가.
- **완료 기준**: 본문 JSON을 수정·재배포하면 새로고침만으로 새 본문이 보임(시크릿 창 불필요).

### 2-4. Notion 프록시의 무경고 본문 잘림 수정
- `notion-proxy.ts:36`, `notion-proxy-bulk.ts:99`, `notion-proxy-page.ts:35` — 페이지네이션 루프의 `if (!resp.ok) break;`를 throw로 변경. 429 응답이면 `Retry-After` 헤더(없으면 1초)만큼 대기 후 최대 3회 재시도. 실패 시 5xx 에러 응답 반환 (부분 본문을 정상 응답으로 내보내지 말 것).
- `scripts/export-notion-bible-cache.mjs` — 프록시가 에러를 반환하면 해당 day를 failed로 기록하는 기존 동작 유지 확인.
- **완료 기준**: rate-limit 상황에서 중간이 잘린 본문이 캐시 파일로 저장될 수 없음.

### 2-5. 날짜/시간대 통일
- 신규 헬퍼 `src/utils/dateUtils.js` 작성: `kstDateKey(date) => 'YYYY-MM-DD'` (`new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date)` 사용).
- 적용 지점: `src/utils/statsUtils.js:5`(오늘 읽음 판정), `src/hooks/useUserBibleActions.js:46`(streak/오늘 판정), `src/utils/exportUtils.js:212`(기간 파싱 — `new Date('YYYY-MM-DD')` UTC 파싱 문제).
- 주의: 기존 `readHistory`에 저장된 날짜 포맷(`toDateString()` 등)과의 호환 — 저장 포맷은 바꾸되, 비교 시 기존 포맷도 파싱해 처리하거나 양쪽 모두 Date로 정규화해 비교할 것. **기존 기록이 깨지면 안 됨.**
- **완료 기준**: 기기 시간대를 UTC로 바꿔도 "오늘 읽음"/streak이 한국 날짜 기준으로 판정됨. 기존 readHistory 기반 통계 수치가 변경 전후 동일.

### 2-6. TTS 가드 및 부수효과 정리
- `src/hooks/useTTS.js:48` — useEffect 시작부에 `if (!window.speechSynthesis) return;` 가드 추가 (미지원 브라우저 마운트 크래시 방지).
- `src/hooks/useTTS.js:76~87` — `setTtsSpeed(prev => ...)` updater 내부의 `handleStop`/`handleSpeak`/`localStorage` 부수효과를 updater 밖으로 이동 (StrictMode 이중 실행 대비).

---

## Phase 3 — 속도/비용

### 3-1. users 풀스캔 제거 (가장 효과 큰 작업)
현황: 대시보드 진입(`src/hooks/useCommunity.js:53`, `src/hooks/useBibleLogic.js:60`)과 "읽었습니다" 클릭(`src/hooks/useUserBibleActions.js:122`)마다 `users` 컬렉션 전체를 읽음. 각 문서에 readHistory 배열(연 365건+)이 포함되어 교인 수에 비례해 느려지고 비용 증가.
- 설계: `community/{communityId}/summary` 집계 문서 1개 도입. 각 사용자의 handleRead batch에 자기 항목 갱신을 포함:
  `summary.members.{uid} = { name, subgroupId, department, currentDay, readCount, score, lastReadDate }` (문서 1MB 한도 내 — 멤버당 ~150B면 5천 명까지 안전).
- 레이스맵/랭킹/MVP(`statsUtils.js`, `RaceMap.jsx`, `ReadingChampionSection.jsx`)는 summary 문서만 읽도록 변경. readHistory 전체가 필요한 화면(관리자 통계)만 기존 경로 유지.
- 최초 1회 백필: 관리자 화면에 "집계 재생성" 버튼 추가 (users 전체 읽어 summary 생성 — 관리자만 실행).
- 주의: 주간 MVP 계산(`statsUtils.js:74` getWeeklyMVP)이 readHistory를 필요로 하면, summary에 `weeklyCount`를 함께 유지하거나 최근 7일 기록만 별도 필드로 유지하는 식으로 해결.
- **완료 기준**: 일반 사용자의 대시보드 진입 시 Firestore 읽기가 (자기 문서 + summary) 수준으로 감소. 레이스맵/랭킹 표시값이 기존과 동일.

### 3-2. 기간별 CSV의 N+1 제거
- `src/utils/exportUtils.js:247` — `for...of` 안의 `await db.collection('users').doc(u.uid).get()` 제거. `allUsers`에 이미 포함된 `u.readHistory`(helpers.js:26에서 로드됨)를 직접 사용.
- 같은 파일: CSV 이스케이프 공통 헬퍼 `csvEscape(v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'` 추가하고 모든 CSV 생성 함수(161~163행 전체 CSV, 140~142행 메모 CSV, 기간 통계 CSV)에 적용. 줄바꿈은 `\r\n`으로 통일.
- 174~202행의 미사용 `countChapters` 및 파일 중간 import 데드 코드 삭제.
- **완료 기준**: 기간별 CSV 생성이 추가 Firestore 읽기 0회. 이름/메모에 콤마·따옴표가 있어도 엑셀에서 열이 안 밀림.

### 3-3. TTS 재생 중 리렌더 폭풍 해소
- `src/components/DashboardView.jsx:144~224` — 레이스 데이터 계산(정렬 4회 + O(n²) find 중복 제거)을 `useMemo`로 감싸기 (deps: `[allMembersForRace, currentUser.uid]` 수준). 중복 제거는 `Set` 기반으로 변경.
- `src/components/dashboard/RaceMap.jsx` — `React.memo`로 감싸고, 상위에서 내려주는 `racers` 배열 참조가 안정되도록 위 useMemo와 연결.
- `src/components/MarkdownRenderer.jsx:108~157` — 문장 세그먼트 파싱을 `useMemo([content, fontSize])`로 캐시. `activeChunkIndex` 변경 시에는 클래스만 바뀌도록 분리.
- `src/components/dashboard/ReadingChampionSection.jsx:32~38, 72~77` — readHistory 재순회 제거하고 `member.weeklyCount`(statsUtils가 이미 계산) 사용. `App.jsx:862`의 `() => getWeeklyMVP(communityMembers)`는 `useMemo([communityMembers])`로.
- `src/App.jsx:753` 및 `src/components/AdminView.jsx:153~330, 714~729` — 렌더마다 IIFE로 도는 관리자 통계/그룹화/정렬을 `useMemo`로.
- **완료 기준**: TTS 낭독 중 React DevTools Profiler 기준 RaceMap/AdminView가 리렌더되지 않음. 긴 장(시편 119 등) 낭독 중 하이라이트 전환이 매끄러움.

### 3-4. 번들 분할
- `vite.config.js` — `build.rollupOptions.output.manualChunks`로 `firebase`, `react`+`react-dom` vendor 청크 분리.
- **완료 기준**: 메인 JS 청크가 현재 대비 유의미하게 감소.

---

## Phase 4 — 마무리 정리 (낮은 우선순위)

- `src/App.jsx:394~399` — 로그인 오류 메시지: `auth/invalid-credential`은 비밀번호 오류에도 반환되므로 "등록되지 않은 사용자" 대신 "이름 또는 암호가 올바르지 않습니다"로 통합.
- `src/App.jsx:445~460` + `src/components/LoginView.jsx:112~129` — 회원가입에서 받은 `signupBirthdate`가 버려짐. 문서에 저장하고, `makePseudoEmail`(helpers.js:2)에 생년월일 포함(`이름_19500101@...`)으로 동명이인 가입 허용.
- `src/utils/statsUtils.js:20~24` — 소그룹 progressRate에 `Math.min(100, ...)` 클램프 (2독 이상 시 100% 초과 방지).
- `src/App.jsx:238~245` — 회원 삭제 시 `users/{uid}/history` 서브컬렉션도 batch로 함께 삭제.
- `src/components/AdminView.jsx:737` — 회원 목록 `key={idx}` → `key={u.uid}`, 목록에 50명 단위 페이지네이션 추가.
- `src/hooks/useCommunity.js:33~42` — localStorage 멤버 캐시를 로그아웃(`handleLogout`, App.jsx:688)에서 삭제 (공용 기기 개인정보 잔존 방지).
- `src/hooks/useBibleContent.js:293` — Day 1 실패 시 개역개정 GENESIS_1 하드코딩 폴백: 다른 번역본 사용자에게는 "기본 번역본으로 표시됩니다" 안내 추가 또는 폴백 제거.
- 루트의 일회성 스크립트 정리: `find_mismatch*.cjs`, `test.js`(1MB), `test_real.js`(2.3MB), `index-3.html`, `refactor_dashboard.py` 등을 `backup/`으로 이동하거나 삭제 (저장소 위생).

---

## 공통 규칙

1. Phase 단위로 커밋을 나눌 것. 커밋 메시지는 기존 스타일(영문 명령형 한 줄)을 따른다.
2. 각 Phase 완료 후 `npm run build` 성공 + `npm run dev`로 핵심 동선 수동 확인: 로그인 → 본문 읽기 → "읽었습니다" → 대시보드 레이스맵 → (관리자) CSV 내보내기.
3. Firestore 스키마 변경(talents, summary 문서)은 **기존 필드를 삭제하지 않는 추가 방식**으로만. 기존 사용자 데이터 마이그레이션은 읽기 시점 폴백(필드 없으면 기본값)으로 처리.
4. 외부 의존성 추가는 최소화 — 가상화 라이브러리 등은 도입하지 말고 페이지네이션/메모이제이션으로 해결.
5. 라인 번호는 검토 시점 기준이므로 ±수십 줄 오차가 있을 수 있음. 코드 내용으로 위치를 확인하고 작업할 것.
