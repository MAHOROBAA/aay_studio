# AAY Studio MVP 백엔드·인프라·AI 연동 기획 명세

## 1. 문서 목적

AAY Studio의 화면 개발 완료 이후 실제 내부 테스트를 위해 필요한 다음 항목을 정의한다.

- 백엔드 언어 및 프레임워크
- 프론트엔드·백엔드 호스팅
- 데이터베이스
- 사용자 인증 및 폐쇄형 베타 접근 정책
- AI 생성 공급자
- 파일 스토리지
- 비동기 작업 및 예약 게시
- 크레딧 및 API 원가 기록
- PG 연동 범위
- 내부 테스터 관리 CLI

이 문서와 기존 명세가 충돌할 경우 본 문서를 우선한다.

---

# 2. MVP 운영 목적

현재 MVP는 공개 판매용 서비스가 아니라 `비공개 내부 테스트 버전`이다.

서비스를 바로 출시하거나 결제를 받는 것이 목적이 아니라 다음 항목을 검증하는 것이 목적이다.

- AI 생성 기능의 실제 동작 여부
- 캐릭터 일관성
- 세계관·스토리 생성 품질
- 영상 생성 품질
- 기능별 API 원가
- AI 생성 실패율
- 평균 재생성 횟수
- 평균 생성 시간
- 영상 1개 제작에 필요한 총비용
- YouTube 업로드 및 예약 게시 안정성
- 실제 테스터 사용 패턴

테스트 결과를 기반으로 추후 다음 정책을 확정한다.

- 기능별 크레딧 차감량
- 무료 크레딧 지급량
- 유료 크레딧 상품 구성
- 서비스 마진
- PG 연동
- 공개 서비스 전환 여부

---

# 3. 최종 기술 구성

| 구분 | 선정 기술 |
|---|---|
| 프론트엔드 | React + Vite + TypeScript |
| 프론트엔드 호스팅 | Vercel |
| 백엔드 언어 | TypeScript |
| 백엔드 런타임 | Node.js |
| 백엔드 프레임워크 | NestJS |
| 백엔드 호스팅 | Google Cloud Run |
| 데이터베이스 | Supabase PostgreSQL |
| 사용자 인증 | Supabase Auth |
| 로그인 방식 | Google 로그인 only |
| AI 텍스트 | Google Gemini API |
| AI 이미지 | Google Gemini Image API |
| AI 영상 | Google Gemini Video API |
| 파일 스토리지 | Cloudflare R2 |
| 비동기 작업 | Google Cloud Tasks |
| 주기 점검 | Google Cloud Scheduler |
| YouTube 예약 공개 | YouTube Data API `status.publishAt` |
| 영상 최종 조합 | FFmpeg |
| PG | 내부 테스트 MVP에서 제외 |

전체 구조:

```text
React/Vite
    │
    └─ Vercel
         │
         ▼
NestJS API
    │
    └─ Google Cloud Run
         ├─ Supabase PostgreSQL
         ├─ Supabase Auth
         ├─ Google Gemini API
         ├─ Cloudflare R2
         ├─ Google Cloud Tasks
         ├─ Google Cloud Scheduler
         ├─ YouTube Data API
         └─ FFmpeg

PG 연결 없음
일반 회원가입 없음
허용된 테스트 계정만 접근
```

---

# 4. 백엔드 구성

## 4.1 기본 구성

```text
언어: TypeScript
런타임: Node.js
프레임워크: NestJS
배포: Google Cloud Run
```

프론트엔드와 백엔드가 같은 TypeScript를 사용하도록 구성한다.

초기 단계에서는 마이크로서비스로 분리하지 않고 하나의 NestJS 애플리케이션으로 개발한다. 대신 기능별 모듈을 분리한다.

## 4.2 권장 모듈 구조

```text
backend/
├─ src/
│  ├─ auth/
│  ├─ users/
│  ├─ beta-testers/
│  ├─ projects/
│  ├─ characters/
│  ├─ worlds/
│  ├─ stories/
│  ├─ contents/
│  ├─ generation/
│  ├─ ai-providers/
│  ├─ credits/
│  ├─ storage/
│  ├─ youtube/
│  ├─ jobs/
│  ├─ analytics/
│  ├─ audit/
│  └─ common/
│
└─ scripts/
   └─ testers/
      ├─ add-tester.ts
      ├─ list-testers.ts
      ├─ get-tester.ts
      ├─ update-status.ts
      └─ adjust-credit.ts
```

## 4.3 주요 서비스

```text
AuthService
BetaTesterService
CharacterService
WorldService
StoryService
ContentService
GenerationService
CreditService
StorageService
YoutubeService
AdminAuditService
```

CLI 스크립트와 향후 관리자 화면은 동일한 서비스 로직을 사용해야 한다.

---

# 5. 데이터베이스

## 5.1 DB 선정

```text
Supabase PostgreSQL
```

AAY Studio는 사용자, 프로젝트, 캐릭터, 세계관, 스토리, 영상, 게시, 크레딧 간 관계가 많으므로 관계형 DB를 사용한다.

크레딧 차감과 생성 작업 등록은 트랜잭션으로 처리해야 한다.

## 5.2 주요 테이블

```text
profiles
beta_testers
projects

characters
character_images
worlds
stories
story_characters

contents
content_scenes
generated_assets
generation_jobs
ai_usage_logs

youtube_connections
publications

credit_accounts
credit_transactions
credit_policies

admin_audit_logs
analytics_events
```

결제 관련 테이블은 PG 개발 시점에 추가한다.

```text
payment_orders
payment_transactions
```

현재 내부 테스트 단계에서는 위 결제 테이블을 필수로 구현하지 않는다.

---

# 6. 인증과 폐쇄형 베타 정책

## 6.1 기본 정책

* Google 로그인 only
* 일반 사용자의 자유 가입 불가
* 관리자가 사전에 등록한 Google 이메일만 가입 가능
* 허용 목록 등록 자체를 초대로 간주
* 별도의 초대 이메일이나 초대 링크는 필수로 사용하지 않음
* 허용되지 않은 계정은 Supabase 사용자 생성 단계에서 차단
* 비활성화된 테스터는 기존 계정이 있어도 접근 불가
* 프론트엔드와 백엔드 양쪽에서 접근 검증
* 내부 테스트 기간에는 결제 기능 비활성화

## 6.2 AAY 로그인과 YouTube 연결 구분

AAY 서비스 로그인과 YouTube 채널 연결은 별개의 인증이다.

```text
AAY 서비스 로그인
→ Supabase Auth Google OAuth

YouTube 채널 연결
→ Google OAuth + YouTube Data API 권한
```

AAY에 Google로 로그인했다고 해서 YouTube 업로드 권한이 자동으로 생기지 않는다.

YouTube 연결 정보는 별도의 `youtube_connections` 테이블에 저장한다.

YouTube refresh token은 프론트엔드에 저장하지 않는다. 백엔드에서 암호화하여 저장한다.

---

# 7. 테스터 허용 목록

## 7.1 beta_testers 테이블

권장 필드:

```text
id
email
name
role
status
default_credit
daily_credit_limit
total_credit_limit
invited_by
invited_at
joined_at
last_login_at
disabled_at
memo
created_at
updated_at
```

## 7.2 값 정의

```text
role
- admin
- tester

status
- invited
- active
- disabled
```

상태 설명:

| 상태       | 설명                       |
| -------- | ------------------------ |
| invited  | 허용 목록에 등록됐지만 아직 로그인하지 않음 |
| active   | 최초 로그인 완료 및 서비스 사용 가능    |
| disabled | 가입 또는 서비스 접근 중지          |

## 7.3 이메일 처리

이메일은 저장 및 비교 전에 정규화한다.

```ts
const normalizedEmail = email.trim().toLowerCase()
```

`email` 필드에는 Unique Constraint를 적용한다.

---

# 8. 가입 및 로그인 흐름

```text
1. 관리자가 테스터 Google 이메일을 CLI로 등록
2. beta_testers에 invited 상태로 저장
3. 테스터가 Google 로그인 선택
4. Supabase Before User Created Hook 실행
5. Google 이메일을 정규화하여 beta_testers 조회
6. invited 또는 active 상태면 사용자 생성 허용
7. 미등록 또는 disabled 상태면 사용자 생성 거부
8. Supabase Auth 사용자 생성
9. profiles 생성
10. beta_testers 상태를 active로 변경
11. 최초 테스트 크레딧 1회 지급
12. 서비스 홈으로 이동
```

## 8.1 미허용 계정 안내

```text
테스트 참여가 허용되지 않은 계정이에요.

AAY Studio는 현재 초대받은 테스터만 이용할 수 있어요.
초대받은 Google 계정으로 다시 로그인해 주세요.
```

버튼:

```text
다른 Google 계정으로 로그인
```

Supabase 또는 서버의 원본 오류 메시지를 사용자에게 그대로 노출하지 않는다.

---

# 9. 접근 검증

접근 제어는 세 단계로 처리한다.

## 9.1 가입 단계

Supabase `Before User Created Hook`에서 이메일 허용 여부를 검사한다.

미등록 이메일은 `auth.users`에 생성되지 않아야 한다.

## 9.2 로그인 이후

이미 가입한 사용자가 로그인할 때도 `beta_testers.status`를 확인한다.

```text
active
→ 접근 허용

disabled
→ 세션 종료 및 접근 차단
```

## 9.3 백엔드 API

NestJS 인증 Guard에서 매 요청마다 다음 항목을 검증한다.

```text
유효한 Supabase JWT인가?
→ beta_testers에 등록된 계정인가?
→ status가 active인가?
→ 해당 기능에 필요한 role을 보유했는가?
```

프론트엔드에서 메뉴를 숨기는 것만으로 접근 제어를 처리하면 안 된다.

---

# 10. 권한 정책

| 기능            | admin | tester |
| ------------- | ----: | -----: |
| 서비스 사용        |    가능 |     가능 |
| AI 생성         |    가능 |     가능 |
| 자신의 콘텐츠 조회    |    가능 |     가능 |
| 다른 테스터 콘텐츠 조회 |    가능 |    불가능 |
| 테스트 크레딧 지급    |    가능 |    불가능 |
| 테스터 등록        |    가능 |    불가능 |
| 테스터 비활성화      |    가능 |    불가능 |
| 전체 AI 비용 조회   |    가능 |    불가능 |
| 자신의 크레딧 내역 조회 |    가능 |     가능 |
| 전체 관리자 로그 조회  |    가능 |    불가능 |

권한 정보는 사용자가 직접 수정할 수 있는 `user_metadata`에 저장하지 않는다.

DB 또는 사용자가 수정할 수 없는 `app_metadata`를 사용한다.

---

# 11. 테스터 관리 CLI

별도의 관리자 화면은 개발하지 않는다.

마호가 로컬 또는 승인된 관리자 환경에서 CLI를 실행해 테스터를 관리한다.

## 11.1 명령어

### 테스터 등록

```bash
npm run tester:add -- \
  --email user@example.com \
  --name "김테스터"
```

### 테스터 목록

```bash
npm run tester:list
```

### 테스터 상세 조회

```bash
npm run tester:get -- --email user@example.com
```

### 접근 중지

```bash
npm run tester:disable -- \
  --email user@example.com \
  --reason "테스트 종료"
```

### 접근 재개

```bash
npm run tester:enable -- \
  --email user@example.com \
  --reason "추가 테스트"
```

### 테스트 크레딧 지급

```bash
npm run tester:credit -- \
  --email user@example.com \
  --amount 5000 \
  --reason "영상 생성 추가 테스트"
```

### 테스트 크레딧 회수

```bash
npm run tester:credit -- \
  --email user@example.com \
  --amount -1000 \
  --reason "오지급 회수"
```

## 11.2 삭제 정책

테스터 삭제 명령은 제공하지 않는다.

잘못 등록했거나 테스트가 종료된 계정은 `disabled`로 변경한다.

가입·크레딧·생성·테스트 이력을 보존한다.

## 11.3 필수 입력

다음 명령에는 `reason`이 필수다.

* 크레딧 지급
* 크레딧 회수
* 테스터 비활성화
* 테스터 재활성화

`reason`이 없으면 실행하지 않는다.

## 11.4 감사 로그

모든 관리자 CLI 실행은 `admin_audit_logs`에 저장한다.

```text
admin_user_id
action
target_type
target_id
before_value
after_value
reason
created_at
```

---

# 12. 테스트 크레딧

## 12.1 기본 정책

내부 테스트 단계에서는 실제 결제 없이 테스트 크레딧을 사용한다.

테스터에게는 다음 두 방식으로 크레딧을 지급한다.

* 최초 로그인 시 기본 테스트 크레딧 1회 지급
* 관리자 CLI를 통한 추가 지급

## 12.2 최초 지급

```text
type: BETA_INITIAL_GRANT
```

중복 지급 방지 키:

```text
beta-initial-grant:{userId}
```

로그아웃 후 다시 로그인하거나 로그인 콜백이 중복 호출돼도 한 번만 지급한다.

## 12.3 추가 지급

```text
type: BETA_MANUAL_GRANT
```

## 12.4 회수

```text
type: BETA_MANUAL_DEDUCT
```

현재 잔액을 직접 수정하지 않고 거래 내역을 추가한다.

---

# 13. 크레딧 데이터 구조

## 13.1 credit_accounts

현재 사용 가능한 잔액을 관리한다.

```text
user_id
available_balance
reserved_balance
updated_at
```

## 13.2 credit_transactions

모든 적립·예약·사용·복구·회수를 기록한다.

```text
id
user_id
type
amount
balance_after
feature_type
generation_job_id
reason
idempotency_key
created_by
created_at
```

## 13.3 크레딧 상태 흐름

```text
available
→ reserved
→ consumed

작업 실패 시:
reserved
→ refunded
```

생성 버튼을 누르는 즉시 최종 차감하지 않는다.

```text
1. 보유 크레딧 확인
2. 필요 크레딧 예약
3. AI 생성 실행
4. 성공 시 사용 확정
5. 실패 시 예약 크레딧 복구
```

모든 처리는 DB 트랜잭션을 사용한다.

---

# 14. AI API 사용 원가 기록

내부 테스트의 핵심 목적은 기능별 실제 원가를 측정하는 것이다.

모든 AI 호출은 `ai_usage_logs`에 기록한다.

## 14.1 기록 항목

```text
id
user_id
project_id
content_id
generation_job_id

feature_type
provider
model

input_tokens
output_tokens
input_image_count
output_image_count
video_duration_seconds
output_resolution

provider_cost_usd
exchange_rate
provider_cost_krw

credit_reserved
credit_consumed

status
error_code
error_message

requested_at
completed_at
duration_ms
```

## 14.2 feature_type

```text
WORLD_RECOMMEND
STORY_RECOMMEND
CHARACTER_IMAGE
SCENE_IMAGE
SCENE_VIDEO
TTS
SUBTITLE
THUMBNAIL
FINAL_RENDER
```

## 14.3 비용 계산

테스트 초기에는 다음 기준을 사용할 수 있다.

```text
1크레딧 = API 원가 1원
```

이는 판매 가격이 아니라 내부 원가 분석을 위한 임시 기준이다.

실제 판매 시 다음 비용을 포함하여 차감량을 재산정한다.

```text
AI API 원가
+ 실패 재시도 비용
+ 서버 비용
+ 파일 스토리지 비용
+ 환율 변동 안전폭
+ PG 수수료
+ 운영비
+ 서비스 마진
```

---

# 15. AI 공급자

## 15.1 기본 정책

MVP에서는 공급자를 지나치게 분산하지 않고 Google Gemini API를 중심으로 사용한다.

```text
텍스트: Google Gemini
이미지: Google Gemini Image
영상: Google Gemini Video
```

다만 코드가 특정 공급자에 직접 종속되지 않도록 Provider Adapter 구조를 사용한다.

## 15.2 인터페이스

```ts
interface TextGenerationProvider {
  generateWorld(input: WorldGenerationInput): Promise<WorldResult>
  generateStory(input: StoryGenerationInput): Promise<StoryResult>
  generateScenes(input: SceneGenerationInput): Promise<SceneResult>
}

interface ImageGenerationProvider {
  generateCharacter(input: CharacterImageInput): Promise<ImageResult>
  generateScene(input: SceneImageInput): Promise<ImageResult>
}

interface VideoGenerationProvider {
  generateSceneVideo(input: SceneVideoInput): Promise<VideoResult>
}
```

환경변수 예시:

```env
AI_TEXT_PROVIDER=google
AI_TEXT_MODEL=gemini-3.1-flash-lite

AI_IMAGE_PROVIDER=google
AI_IMAGE_MODEL=gemini-3.1-flash-image

AI_VIDEO_PROVIDER=google
AI_VIDEO_MODEL=POC_AFTER_SELECTION
```

모델명은 서비스 코드에 하드코딩하지 않는다.

---

# 16. 텍스트 생성

사용 기능:

* 세계관 추천
* 스토리 추천
* 이전 이야기 이어쓰기
* 캐릭터 설정 보완
* 장면 구성
* 제목·설명·해시태그 생성
* 설정 충돌 검토
* 금지 표현 검토

텍스트 응답은 가능한 한 구조화된 JSON으로 받는다.

예시:

```json
{
  "title": "스토리 제목",
  "summary": "스토리 요약",
  "scenes": [
    {
      "order": 1,
      "description": "장면 설명",
      "dialogue": "대사",
      "duration": 5
    }
  ]
}
```

AI의 응답을 바로 DB에 확정 저장하지 않는다.

사용자가 검토·수정 후 완료했을 때 저장한다.

---

# 17. 이미지 생성

## 17.1 핵심 정책

같은 프롬프트를 반복하는 방식으로 캐릭터 일관성을 유지하지 않는다.

캐릭터별 시각 정보를 저장하고 장면 생성 시 참고 이미지로 전달한다.

## 17.2 캐릭터 자료

```text
대표 이미지
정면
측면
3/4 방향
전신
주요 표정
고정 의상
고정 소품
```

이를 캐릭터 Reference Pack으로 관리한다.

## 17.3 생성 결과 저장

AI 공급자가 반환한 임시 URL을 그대로 DB에 저장하지 않는다.

```text
AI 이미지 생성
→ 결과 다운로드
→ Cloudflare R2 업로드
→ R2 object key 저장
→ generated_assets 등록
```

---

# 18. 영상 생성

## 18.1 모델 선정

영상 공급자는 Google을 기준으로 개발하되 세부 모델은 POC 후 확정한다.

후보:

```text
Gemini Omni Flash
Veo 계열
```

Preview 모델을 운영 모델로 자동 확정하지 않는다.

## 18.2 생성 단위

전체 쇼츠를 한 번에 생성하지 않는다.

```text
스토리 생성
→ 장면 구성
→ 장면별 이미지 생성
→ 장면별 영상 생성
→ 음성 생성
→ 자막 생성
→ FFmpeg 최종 조합
→ 최종 영상 저장
```

이 구조를 통해 다음 기능을 지원한다.

* 장면별 재생성
* 이미지와 영상의 부분 수정
* 실패한 장면만 재시도
* 기능별 크레딧 계산
* 장면별 API 원가 기록

## 18.3 영상 모델 POC 지표

```text
캐릭터 얼굴 일치율
체형 유지율
의상·소품 유지율
보조 인물 일관성
움직임 오류
배경 일관성
생성 성공률
평균 생성 시간
초당 생성 원가
평균 재생성 횟수
```

---

# 19. 음성 및 최종 조합

## 19.1 TTS

후보:

```text
Gemini TTS
Google Cloud Text-to-Speech
```

한국어 음질과 감정 표현을 테스트한 후 확정한다.

TTS도 공급자 인터페이스를 사용한다.

## 19.2 FFmpeg

FFmpeg는 다음 작업을 담당한다.

* 장면 영상 연결
* 음성 삽입
* BGM 삽입
* 자막 렌더링
* 9:16 출력
* 썸네일 추출
* 최종 파일 인코딩

FFmpeg 작업은 Cloud Run의 비동기 작업으로 실행한다.

---

# 20. 파일 스토리지

## 20.1 공급자

```text
Cloudflare R2
```

## 20.2 저장 대상

```text
캐릭터 대표 이미지
캐릭터 참고 이미지
장면 이미지
장면 영상
최종 영상
썸네일
음성 파일
자막 파일
```

## 20.3 저장 경로

```text
users/{userId}/
└─ projects/{projectId}/
   ├─ characters/{characterId}/
   └─ contents/{contentId}/
      ├─ images/
      ├─ videos/
      ├─ audio/
      ├─ subtitles/
      └─ final/
```

## 20.4 접근 정책

* 버킷은 Private
* 공개 고정 URL 사용 금지
* signed URL 사용
* DB에는 object key와 메타데이터 저장
* AI 공급자 임시 URL은 만료 전에 R2로 복사
* 사용자별 경로 분리
* 다른 테스터의 파일 접근 차단

---

# 21. 비동기 생성 작업

AI 생성과 YouTube 업로드는 일반 HTTP 요청 안에서 완료될 때까지 기다리지 않는다.

```text
사용자 생성 요청
→ JWT 및 테스터 상태 확인
→ 입력값 검증
→ 크레딧 예약
→ generation_jobs 생성
→ Cloud Tasks 등록
→ jobId 반환
→ 백그라운드 작업 실행
→ 작업 상태 업데이트
→ 성공 또는 실패 처리
```

## 21.1 작업 상태

```text
PENDING
QUEUED
PROCESSING
SUCCEEDED
FAILED
CANCELED
```

## 21.2 중복 실행 방지

각 작업에 `idempotency_key`를 부여한다.

Cloud Tasks가 동일 작업을 재호출해도 다음이 중복 생성되면 안 된다.

* 크레딧 차감
* 이미지 생성 기록
* 영상 생성 기록
* YouTube 업로드
* 테스트 크레딧 지급

---

# 22. YouTube 예약 게시

## 22.1 기본 방식

AAY 서버가 예약 시각에 직접 공개 처리하지 않는다.

```text
영상을 YouTube에 비공개로 미리 업로드
→ privacyStatus = private
→ publishAt = 예약 일시
→ YouTube가 예약 시각에 공개
```

## 22.2 예약 변경

예약 변경 시 YouTube `videos.update`를 호출하여 `publishAt`을 갱신한다.

## 22.3 보정 작업

Google Cloud Scheduler가 5~10분 간격으로 다음 상태를 확인한다.

```text
예약 상태 동기화
게시 완료 여부 확인
업로드 실패 확인
장시간 PROCESSING 작업 확인
실패 작업 재등록
OAuth 토큰 오류 확인
```

---

# 23. API 비용 통제

전 직장 동료가 테스트에 참여하므로 예상치 못한 API 비용을 방지해야 한다.

## 23.1 테스터 제한

```text
최초 지급 크레딧
계정별 잔액 제한
일일 영상 생성 횟수
총 사용 크레딧
```

예시 환경변수:

```env
APP_MODE=private_beta
PAYMENT_ENABLED=false

DAILY_AI_COST_LIMIT_USD=20
MONTHLY_AI_COST_LIMIT_USD=200
VIDEO_GENERATION_DAILY_LIMIT_PER_USER=3
```

실제 제한값은 POC 후 변경한다.

## 23.2 전체 비용 상한

일일 또는 월간 AI 비용이 상한에 도달하면 신규 생성 요청을 중지한다.

안내 문구 예시:

```text
현재 테스트 사용량이 한도에 도달했어요.
관리자가 사용량을 확인한 후 다시 이용할 수 있어요.
```

## 23.3 자동 추가 지급 금지

테스터가 잔액을 모두 사용해도 크레딧을 자동으로 추가하지 않는다.

관리자가 사용 내역을 확인한 후 CLI로 추가 지급한다.

---

# 24. PG 및 결제 정책

## 24.1 내부 테스트 MVP

PG를 연동하지 않는다.

사유:

* 사업자등록 필요
* PG 계약 및 심사 필요
* 연동 비용 발생
* 아직 기능별 API 원가 미확정
* 크레딧 차감량 및 상품 가격 미확정

## 24.2 개발 제외 범위

```text
토스페이먼츠 SDK
결제위젯
결제 승인 API
결제 웹훅
결제 취소
부분 취소
현금영수증
실제 크레딧 충전
결제 내역
```

## 24.3 현재 화면 처리

이미 개발된 크레딧 충전 화면은 삭제하지 않는다.

내부 테스트 환경에서는 다음 중 현재 UI 구조에 적합한 방식으로 비활성화한다.

* 충전 버튼 비활성화
* `준비 중` 표시
* 크레딧 충전 라우트 접근 차단

권장 문구:

```text
크레딧 충전 기능은 정식 출시 후 제공할 예정이에요.
```

## 24.4 Feature Flag

```env
PAYMENT_ENABLED=false
PAYMENT_PROVIDER=none
```

결제 버튼과 관련 API는 `PAYMENT_ENABLED`가 `true`일 때만 활성화한다.

---

# 25. 크레딧 부족 팝업

**[2026-08-03 갱신 — `spec-addendum-credit.md` §7 및 후속 전달사항으로 아래 정책이 확정되어, 이 문서에 있던
"PG 미연동이므로 확인 버튼 1개만 노출" 정책은 폐기한다.]**

크레딧 충전 화면 자체는 프론트엔드만 구현된 상태이고 실제 PG 결제·크레딧 지급 서버 로직은 아직 없지만(§24 참고),
팝업의 `크레딧 충전` 버튼은 그 화면으로 이동하는 용도로 노출한다.

노출 조건: 생성 및 재생성 요청 시 보유 크레딧이 필요한 크레딧보다 부족하면 노출한다.

문구:

```text
크레딧이 부족합니다.

영상을 생성하려면 {필요 크레딧}크레딧이 필요합니다.
현재 보유 크레딧: {보유 크레딧}
```

버튼:

```text
취소
크레딧 충전
```

`크레딧 충전` 선택 시 `/mypage/credits/charge`로 이동한다.

---

# 26. 보안 정책

## 26.1 시크릿 관리

다음 값은 프론트엔드에 포함하거나 Git에 커밋하면 안 된다.

```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_AI_API_KEY
GOOGLE_CLIENT_SECRET
YOUTUBE_CLIENT_SECRET
R2_SECRET_ACCESS_KEY
CLOUD_TASKS_SERVICE_ACCOUNT
```

로컬에서는 `.env`, 배포 환경에서는 Secret Manager를 사용한다.

## 26.2 예시 환경변수

```env
APP_MODE=private_beta
PAYMENT_ENABLED=false
PAYMENT_PROVIDER=none

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_AI_API_KEY=
AI_TEXT_PROVIDER=google
AI_TEXT_MODEL=gemini-3.1-flash-lite
AI_IMAGE_PROVIDER=google
AI_IMAGE_MODEL=gemini-3.1-flash-image
AI_VIDEO_PROVIDER=google
AI_VIDEO_MODEL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=

DAILY_AI_COST_LIMIT_USD=
MONTHLY_AI_COST_LIMIT_USD=
VIDEO_GENERATION_DAILY_LIMIT_PER_USER=
```

`.env`는 반드시 `.gitignore`에 포함한다.

---

# 27. 내부 테스트 측정 지표

기능별로 다음 값을 집계한다.

| 지표              | 목적              |
| --------------- | --------------- |
| 성공 1건당 평균 원가    | 크레딧 차감량 산정      |
| 실패율             | 공급자 안정성 확인      |
| 평균 재생성 횟수       | 실제 사용자 체감 원가 산정 |
| 평균 생성 시간        | UX 및 타임아웃 결정    |
| 캐릭터 일관성         | 이미지·영상 모델 평가    |
| 평균 장면 수         | 영상 1개 총원가 계산    |
| 평균 파일 크기        | 스토리지 비용 계산      |
| YouTube 업로드 실패율 | 재시도 정책 수립       |
| 프롬프트 토큰 사용량     | 텍스트 원가 계산       |
| 해상도별 원가         | 품질 옵션 결정        |
| 사용자별 크레딧 사용량    | 무료 지급량 결정       |
| 기능별 재사용률        | 핵심 기능 가치 검증     |

`API 한 번 호출 비용`과 `사용자가 만족하는 결과 한 건을 얻는 비용`을 구분한다.

---

# 28. 개발 범위

## 28.1 이번 단계에 구현

* NestJS 백엔드 기본 구조
* Supabase PostgreSQL 연결
* DB 마이그레이션
* Supabase Google 로그인
* 폐쇄형 베타 허용 목록
* Before User Created Hook
* NestJS 접근 Guard
* 테스터 관리 CLI
* 관리자 감사 로그
* 테스트 크레딧 원장
* 크레딧 예약·확정·복구
* AI Provider Adapter
* 텍스트 생성 연동
* 이미지 생성 연동
* 영상 생성 POC
* R2 파일 저장
* generation_jobs
* ai_usage_logs
* Cloud Tasks 연동
* YouTube OAuth 연결
* YouTube 비공개 업로드
* YouTube 예약 게시
* Cloud Scheduler 보정 작업
* GA 및 내부 분석 이벤트

## 28.2 이번 단계에서 제외

* 일반 사용자 공개 가입
* 이메일 회원가입
* 카카오·네이버 로그인
* 관리자 웹페이지
* PG 계약 및 실제 결제
* 크레딧 상품 판매
* 자동 환불
* 정기결제
* TikTok 게시
* Instagram 게시
* 다국어
* 공개 프로덕션 출시

---

# 29. 권장 개발 순서

## Step 1. 기반 구성

* NestJS 프로젝트 생성
* 환경변수 관리
* Supabase 연결
* DB 마이그레이션 구조
* Cloud Run 배포

## Step 2. 인증 및 폐쇄형 베타

* Supabase Google 로그인
* beta_testers 테이블
* Before User Created Hook
* profiles 생성
* NestJS Guard
* 테스터 CLI
* 권한 및 RLS

## Step 3. 크레딧

* credit_accounts
* credit_transactions
* 최초 테스트 크레딧
* 관리자 추가 지급
* 예약·확정·복구
* 크레딧 부족 처리

## Step 4. 스토리지

* Cloudflare R2 연결
* signed URL
* 이미지 업로드
* 생성 파일 저장
* 사용자별 접근 제한

## Step 5. 텍스트·이미지 AI

* Provider Adapter
* 세계관 생성
* 스토리 생성
* 캐릭터 이미지 생성
* 장면 이미지 생성
* ai_usage_logs

## Step 6. 영상 생성

* 영상 모델 POC
* 장면별 생성
* 비동기 작업
* 실패 재시도
* FFmpeg 최종 조합

## Step 7. YouTube

* YouTube OAuth
* 채널 연결
* 비공개 업로드
* 즉시 게시
* 예약 게시
* 예약 변경
* 실패 상태 처리

## Step 8. 테스트 및 비용 분석

* 테스터 계정 등록
* 테스트 크레딧 지급
* 사용량 측정
* 모델 품질 비교
* 기능별 평균 원가 산정
* 크레딧 정책 확정

---

# 30. 완료 조건

다음 조건을 충족하면 내부 테스트용 MVP 백엔드 구축이 완료된 것으로 본다.

* 허용 목록에 등록된 Google 계정만 가입 가능하다.
* 미등록 Google 계정은 Supabase 사용자 생성 단계에서 거부된다.
* disabled 테스터는 기존 계정이 있어도 API에 접근할 수 없다.
* CLI로 테스터를 등록·조회·비활성화·재활성화할 수 있다.
* CLI로 테스트 크레딧을 지급·회수할 수 있다.
* 모든 관리자 작업이 감사 로그에 기록된다.
* 최초 테스트 크레딧은 한 번만 지급된다.
* AI 작업 전 크레딧이 예약된다.
* AI 작업 성공 시 크레딧 사용이 확정된다.
* AI 작업 실패 시 예약 크레딧이 복구된다.
* AI 호출별 공급자·모델·원가·소요 시간이 기록된다.
* 캐릭터 참고 이미지를 이후 이미지 생성에 재사용할 수 있다.
* 생성 파일이 Cloudflare R2에 저장된다.
* 장시간 생성 작업이 비동기로 처리된다.
* 중복 작업으로 크레딧이나 결과가 중복 생성되지 않는다.
* YouTube 채널 연결과 AAY 서비스 로그인이 분리되어 있다.
* YouTube 즉시 게시와 예약 게시가 동작한다.
* PG와 결제 기능이 비활성화되어 있다.
* 일반 사용자 공개 가입이 차단되어 있다.
* 테스터별·전체 API 비용 상한이 적용된다.
