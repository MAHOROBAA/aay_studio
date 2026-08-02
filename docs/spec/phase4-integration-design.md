# 4단계: 외부 연동 설계

> **⚠️ 이 문서의 "열린 질문"들은 이후 [`docs/spec/spec-addendum-backend.md`](spec-addendum-backend.md)에서
> 전부 확정됐다.** 백엔드 언어/프레임워크, 호스팅, DB, 인증, AI 공급자, 파일 스토리지, 비동기 작업, YouTube
> 예약 게시, PG 보류 정책까지 그 문서가 기준이다. 실제 작업은 이 문서가 아니라 `spec-addendum-backend.md`
> 29장 "권장 개발 순서"를 따른다. 이 문서는 각 영역이 프론트 mock과 어떻게 대응되는지 정리한 참고 자료로만
> 남겨둔다.

`docs/spec/aay-studio-spec.md` 11장의 4단계(외부 연동 설계) 범위를 다룬다. 이 문서는 **설계 문서**다 — 실제
백엔드 코드는 아직 한 줄도 없고, 이 문서에서도 새로 작성하지 않는다. 지금까지 만든 프론트엔드가 mock 데이터로
흉내 내고 있는 동작들을 실제로 채우려면 어떤 데이터·API·외부 연동이 필요한지 영역별로 정리하고, **임의로 결정하면
안 되는 부분(공급자·기술 선택)은 열린 질문으로 남겨둔다.** (`CLAUDE.md` 1조: "구현자는 임의로 공급자나 기술을
선택하지 않는다.")

이 문서는 5단계(실제 연동과 검증) 작업을 시작하기 전에 사용자가 열린 질문에 답하면서 채워나가는 용도로 쓴다.

## 0. 지금까지 없는 것

이 저장소엔 프론트엔드(Vite + React)만 있고 **백엔드가 전혀 없다.** 모든 상태는 프론트 메모리(`useState`)에만
있고 새로고침하면 사라진다. 4단계를 실제로 시작하려면 최소한 다음이 먼저 정해져야 한다.

- 백엔드 언어/프레임워크, 호스팅
- 데이터베이스 종류
- 인증 방식(세션 vs JWT)
- 배포 환경(GitHub Pages는 정적 호스팅이라 백엔드를 못 올린다 — 백엔드는 별도 인프라가 필요하다)

## 1. Google 인증과 사용자 계정 저장

**현재 프론트 상태**: 로그인 버튼이 실제 동작 없이 화면만 있다(랜딩 → 홈 이동이 인증 없이 그냥 라우팅됨). 로그인
가드가 전혀 없어서 `/home`, `/library` 등 모든 라우트에 그냥 접근된다.

**spec 8.1 요구사항**: Google 로그인만 지원, 최초 로그인 시 계정 자동 생성, 인증 실패 시 계정 생성 안 함,
비로그인 사용자는 홈/만들기/라이브러리/마이페이지 접근 불가(→ 랜딩으로), 로그아웃 시 랜딩 이동.

**필요한 것**:
- 서버: Google OAuth 2.0(Authorization Code flow) 처리, 콜백에서 사용자 조회/생성, 세션 또는 JWT 발급
- User 테이블: `id`(내부 UUID, GA4 user_id로도 씀 — addendum 17장), `googleId`, `email`, `name`,
  `profileImageUrl`, `createdAt`, `lastLoginAt`
- 프론트: `AppRouter.tsx`에 인증 가드(비로그인 시 `/`로 리다이렉트하는 라우트 래퍼) 추가, 로그인 상태 전역 관리
  (Context 또는 별도 상태 라이브러리 — 이 프로젝트는 아직 전역 상태 라이브러리가 없다)
- `src/lib/analytics.ts`의 `setAnalyticsUserId()`를 로그인/로그아웃 시점에 실제로 호출

**열린 질문 (사용자 결정 필요)**:
- 세션 관리를 직접 구현할지, Auth 서비스(Firebase Auth, Supabase Auth, Auth0 등)를 쓸지
- 세션 저장 방식(쿠키+서버 세션 vs JWT+로컬 저장)

## 2. 데이터 저장 (캐릭터·세계관·스토리·영상)

**현재 프론트 상태**: 4개 라이브러리 목록 전부 각 페이지의 `useState` 배열이 mock 시드 데이터로 초기화된다.
생성 폼에서 제출해도 그 배열에 반영되지 않는다(배치 D/F에서 반복 확인된 한계). 새로고침하면 전부 초기값으로
되돌아간다.

**필요한 테이블** (spec 2장의 개념 정의 + 실제 구현된 폼 필드 기준으로 도출, 문자열 그대로 spec 예시 항목 반영):

### Character
- `id`, `ownerId`, `name`, `role`(주인공/보조), `description`(설명), `traits`(특징·소품),
  `visualNotes`(외형 특징, 종/유형, 의상과 소품, 체형과 크기, 화면 노출 범위 — spec 2.1 예시),
  `speechStyle`(말투·성격), `representativeImageUrl`, `referenceImageUrls`(배열, 최대 3장 — addendum 5.1),
  `createdAt`, `updatedAt`
- 현재 `CharacterCreatePopup`은 이름/설명/특징/이미지 정도만 입력받는다 — 나머지 spec 2.1 필드(역할, 화면
  노출 범위 등)는 폼에 아직 없어서, 실제 저장 붙일 때 폼도 같이 확장할지 결정 필요.

### World
- `id`, `ownerId`, `name`, `shortDescription`, `description`, `timeBackground`, `spaceBackground`,
  `rules`, `restrictions`, `authorType`(사용자 작성/AI 추천), `connectedCharacterIds`(배열 — 현재 폼은
  드롭다운 단일 선택이라 다대다로 바꿀지 확인 필요), `createdAt`, `updatedAt`

### Story
- `id`, `ownerId`, `worldId`, `title`, `summary`, `content`, `storyType`(옴니버스/이어쓰기),
  `characterIds`(배열), `previousStoryId`(이어쓰기 시), `createdAt`, `updatedAt`

### Video
- `id`, `ownerId`, `creationMethod`(story/free), `worldId`, `storyId`, `characterIds`,
  `aspectRatio`(16:9/9:16), `durationSeconds`, `title`, `postContent`(게시글 내용), `audience`,
  `visibility`, `status`(generating/review/scheduled/published/failed), `thumbnailUrl`, `fileUrl`,
  `platform`(youtube), `externalVideoId`, `externalChannelName`, `scheduledAt`, `publishedAt`,
  `creditAmount`, `retryCount`, `failureReason`, `createdAt`, `updatedAt`

크레딧 관련 테이블(`CreditProduct`/`PaymentOrder`/`CreditGrant`/`CreditTransaction`/`CreditUsage`)은 이미
`spec-addendum-credit.md` 13장에 필드까지 확정돼 있다 — 여기서 다시 정의하지 않는다.

**열린 질문**:
- DB 종류(관계형 vs 문서형) — 캐릭터/세계관/스토리의 다대다 연결 관계가 많아서 관계형(PostgreSQL 등)이
  자연스러워 보이지만 최종 선택은 사용자 몫이다.
- 캐릭터/세계관/스토리 각 폼을 spec 2장의 전체 필드까지 확장할지, 지금 프론트 필드 수준으로 저장만 붙일지

## 3. AI 생성 (기획 추천 · 이미지 생성 · 영상 생성)

**현재 프론트 상태**: 전부 `window.setTimeout` mock이다 — AI 추천 버튼(0.7초 후 고정 문구로 채움), 캐릭터
대표/참고 이미지 생성(0.6초 후 라벨만 바뀜), 영상 생성(`CreateGeneratingPage`, 3초 후 완료 처리). 실제 AI
API를 호출하는 코드는 전혀 없다.

**필요한 것**:
- 텍스트 생성(세계관·스토리 상세 설명, AI 기획 추천 문구)
- 이미지 생성(캐릭터 대표/참고 이미지)
- 영상 생성(장면 이미지 → 영상 변환 → 오디오 합성, `CreateGeneratingPage`의 4단계 상태 표시와 대응)
- 각 호출은 `CreditUsage`(addendum 13장)에 `apiProvider`/`apiModel`/`estimatedApiCost`/`actualApiCost`로
  기록돼야 한다.
- 생성 실패 시 크레딧 환불(`credit_refunded` 이벤트, addendum 19장)과 `video_creation_failed` 이벤트 연결

**열린 질문 (전부 사용자 결정 필요 — CLAUDE.md가 임의 선택을 금지)**:
- 텍스트/이미지/영상 생성 각각 어떤 AI 공급자를 쓸지(같은 공급자로 통일할지, 기능별로 다르게 할지)
- 각 기능의 실제 크레딧 차감량(현재 addendum엔 "N크레딧"으로만 표시된 곳들이 있다 — 배치 C에서 실제 숫자가
  없어서 크레딧 부족 체크를 못 붙였던 부분과 동일한 이유)
- 영상 생성처럼 오래 걸리는 작업을 동기 API로 기다릴지, 비동기 잡 큐 + 웹훅/폴링으로 처리할지

## 4. 파일 저장

**현재 프론트 상태**: 이미지/영상 파일 자체가 없다. `CharacterCreatePopup`의 "업로드"는 실제
`<input type="file">`을 열지만 그 파일을 저장하거나 미리보기하지 않는다(배치 C에서 의도적으로 범위 제외).
라이브러리의 썸네일도 전부 텍스트 placeholder다.

**필요한 것**:
- 객체 스토리지(생성된 이미지/영상, 업로드한 참고 이미지)
- URL 스킴(공개 URL vs 서명된 URL — 영상은 다운로드 기능(더보기 메뉴의 "다운로드", 아직 미구현)과도 연결됨)
- 업로드 용량/포맷 제한 정책(현재 spec에 명시 없음)

**열린 질문**:
- 스토리지 공급자(S3, GCS, Cloudflare R2, Supabase Storage 등)
- 접근 제어(누구나 볼 수 있는 공개 URL인지, 로그인 사용자만 볼 수 있는 서명 URL인지)

## 5. 게시 플랫폼 (YouTube)

**현재 프론트 상태**: `CreatePublishPage`/`LibraryVideoPublishSettingsPage` 둘 다 "YouTube"가 고정 텍스트고,
계정도 `io******o@gmail.com` 같은 mock이다. 실제 YouTube 계정 연결이나 업로드 API 호출이 없다.

**필요한 것**:
- YouTube Data API v3 OAuth 연결(로그인용 Google 인증과는 별도 스코프 — `youtube.upload` 등)이 필요하다.
  addendum과 spec 모두 "Google 계정 로그인"과 "YouTube 채널 연결"을 구분해서 언급한다(마이페이지의 "연결
  계정" 섹션, `youtube_connected` GA4 이벤트가 로그인의 `sign_up`/`login`과 별개인 것도 이 구분과 일치).
- refresh token은 서버에서만 보관(CLAUDE.md 6조 — 절대 프론트 환경변수에 넣지 않는다)
- 영상 업로드 API 호출, 업로드 결과(videoId, 채널명) 저장, 실패 시 `publish_failed` 이벤트

**열린 질문**:
- 없음(YouTube Data API로 이미 확정돼 있다 — spec 자체가 YouTube 전용 MVP). 다만 API 쿼터·심사 정책은
  실제 연동 시점에 확인 필요.

## 6. 예약 실행

**현재 프론트 상태**: "예약 게시" 상태와 "예약 변경" 폼(날짜/시간 입력)은 있지만, 실제로 그 시각에 게시를
트리거하는 로직이 없다(그냥 mock 데이터 문자열로만 존재).

**필요한 것**:
- 예약 시각에 실제로 YouTube 업로드를 실행하는 스케줄러/워커
- 실행 실패 시 재시도 정책, `게시 실패` 상태로 전환 + 알림

**열린 질문**:
- 스케줄링 방식(서버 cron, 클라우드 스케줄러(Cloud Tasks/EventBridge 등), 메시지 큐 + 워커) — 백엔드
  호스팅 결정과 묶여서 정해야 한다.

## 7. 크레딧과 결제

이미 `spec-addendum-credit.md`에 정책(2~8장)과 처리 흐름(9~13장)이 상세히 정의돼 있다. 4단계에서 할 일은
그 문서를 실제 서버 로직으로 옮기는 것이지, 정책을 새로 정하는 게 아니다.

**현재 프론트 상태**: `MyPageCreditChargePage`의 결제 mock 흐름(`requestCreditPayment()`)이 0.7초 후
성공/실패를 반환한다. 실제 PG 호출, 서버 승인, 크레딧 원장 반영은 전혀 없다.

**필요한 것** (addendum 10장 결제 처리 흐름을 그대로 따른다):
1. 서버 API: 상품 조회, 주문 생성, 결제 승인(PG 웹훅 검증 포함), 크레딧 원장 기록
2. `src/mocks/credit.ts`의 `requestCreditPayment()`를 실제 서버 API 호출로 교체
3. 프론트의 `trackPurchase`/`trackPaymentFailed`(GA4) 호출 시점을 "PG 승인 완료 후"로 유지(이미 그렇게
   구현돼 있다 — addendum 16장 "purchase는 PG 승인 및 크레딧 지급 완료 후 전송" 원칙과 일치)

**열린 질문**: addendum 9.2가 이미 "PG가 확정되기 전까지 특정 PG SDK에 강하게 결합하지 않는다"고 명시했다 —
**PG사 선택 자체가 열린 질문**(사업자등록·PG 심사 등 비개발 절차와 묶여 있어서 개발팀 단독으로 정할 수 없는
항목이라고 addendum 9.1이 이미 밝히고 있다).

## 8. 우선순위 제안 (확정 아님 — 사용자 확인 필요)

기술적 의존관계만 보면 이런 순서가 자연스럽다:

1. 백엔드 인프라 + DB 선택 (0장) — 다른 모든 항목의 전제조건
2. Google 인증(1장) — 로그인 없이는 "누구의 데이터인지"를 저장할 수 없어서 2~7장 전부의 전제조건
3. 데이터 저장(2장) — 캐릭터/세계관/스토리/영상을 실제로 저장해야 나머지가 의미 있어짐
4. 크레딧·결제(7장) — addendum에 이미 설계가 끝나 있어 상대적으로 빠르게 옮길 수 있음
5. AI 생성(3장) + 파일 저장(4장) — 서로 강하게 얽혀 있어 함께 진행
6. 게시 플랫폼(5장) + 예약 실행(6장) — 영상이 실제로 만들어진 뒤에야 의미 있음

이 순서와 각 장의 "열린 질문"에 대한 답을 사용자가 정해주면, 그다음부터 5단계(실제 연동과 검증)로 넘어가
실제 코드를 작성할 수 있다.
