# AAY Studio 크레딧·결제·분석 명세

> 본 문서는 AAY Studio의 크레딧 지급, 사용, 충전, 결제 및 GA4 분석 정책을 정의한다.
> 기존 명세와 충돌하는 경우 본 문서를 우선 적용한다.

---

## 1. 목적

AAY Studio는 AI 기능 호출에 실제 API 비용이 발생하므로 크레딧 기반 종량제를 사용한다.

사용자는 무료 크레딧으로 서비스의 핵심 가치를 먼저 경험한 뒤, 필요할 경우 유료 크레딧을 충전한다.

핵심 목표:

- 신규 사용자가 결제 전에 영상 제작 과정을 충분히 경험하게 한다.
- 사용한 AI 기능과 비용을 투명하게 안내한다.
- 무료 사용과 유료 전환 사이의 균형을 유지한다.
- 기능별 원가와 사용자 행동을 분석할 수 있게 한다.
- 결제·크레딧 데이터를 안전하고 일관되게 관리한다.

---

## 2. 크레딧 종류

### 2.1 무료 크레딧

가입, 주간 지원, 이벤트 등을 통해 무상으로 지급한다.

특징:

- 현금 환불 불가
- 다른 사용자에게 양도 불가
- 지급 사유별 유효기간 적용
- 유효기간 만료 후 자동 소멸
- 유료 크레딧보다 먼저 차감

### 2.2 보너스 크레딧

유료 크레딧 상품 구매 시 추가로 지급한다.

예시:

- 10,000원 결제
- 유료 크레딧 1,000
- 보너스 크레딧 100

특징:

- 현금 환불 대상에서 제외
- 유료 크레딧과 별도로 기록
- 상품별 유효기간 적용 가능
- 보너스 크레딧을 사용한 경우 전체 결제 건의 청약철회가 제한될 수 있음

### 2.3 유료 크레딧

사용자가 실제 결제를 통해 구매한 크레딧이다.

특징:

- 결제 건과 연결하여 관리
- 구매일로부터 1년간 유효
- 환불 및 청약철회 정책 적용
- 만료 임박순으로 차감

### 2.4 보상 크레딧

서비스 장애, 생성 실패 또는 고객 보상을 위해 지급한다.

특징:

- 지급 사유 기록
- 별도 유효기간 적용 가능
- 현금 환불 불가
- 관리자 또는 시스템이 지급

---

## 3. 크레딧 차감 순서

사용자가 여러 종류의 크레딧을 보유한 경우 다음 순서로 차감한다.

1. 만료가 임박한 무료 크레딧
2. 만료가 임박한 보너스 크레딧
3. 만료가 임박한 보상 크레딧
4. 만료가 임박한 유료 크레딧

동일 종류 안에서는 만료일이 빠른 크레딧부터 차감한다.

크레딧 종류와 만료일을 확인할 수 있도록 지급 단위별 원장을 저장한다.

---

## 4. 무료 크레딧 지급 정책

### 4.1 최초 가입 크레딧

Google 계정으로 최초 가입한 사용자에게 1회 지급한다.

지급량 기준:

- 숏폼 영상 1개를 완성할 수 있어야 한다.
- 주요 생성 단계에서 1~2회 재생성을 경험할 수 있어야 한다.
- 무료 크레딧만으로 영상 여러 개를 지속적으로 만들 수 있을 정도로 과도하게 지급하지 않는다.

유효기간:

- 최초 지급일로부터 14일
- 운영 데이터에 따라 7일 또는 14일 정책을 비교할 수 있도록 설정값으로 관리

중복 방지:

- 사용자 계정당 1회
- 동일 지급 이벤트의 중복 처리 방지
- 지급 이력을 서버에서 검증
- 프론트엔드에서 직접 지급하지 않음

### 4.2 첫 게시 보상

사용자가 생성한 첫 영상을 YouTube에 게시한 경우 1회 지급한다.

목적:

- 첫 영상의 일부 수정 또는 재생성을 지원
- 두 번째 콘텐츠 제작 진입을 유도

정책:

- 사용자당 1회
- 게시 API의 성공 응답을 확인한 뒤 지급
- 게시 실패 또는 예약만 등록된 상태에서는 지급하지 않음
- 예약 게시의 경우 실제 게시 완료 시 지급
- 지급일로부터 14일간 유효

### 4.3 주간 제작 지원 크레딧

매일 출석 보상은 제공하지 않는다.

AAY Studio는 영상 제작 서비스이므로 일일 접속보다 실제 콘텐츠 제작 주기에 맞춰 주간 단위로 소량 지급한다.

정책:

- 주 1회 지급 또는 사용자 직접 수령
- 전체 영상 1개를 생성하기에는 부족한 양
- AI 추천 또는 일부 결과 재생성 정도에 사용할 수 있는 양
- 지급일로부터 7일간 유효
- 다음 주로 누적되지 않음
- 지급 시 기존 미사용 주간 지원 크레딧은 만료 처리 가능
- 지급량과 수령 조건은 운영 설정으로 관리

초기 명칭:

`주간 제작 지원 크레딧`

### 4.4 초기에는 구현하지 않는 보상

- 매일 출석 보상
- 연속 출석 보너스
- 7일·30일 출석판
- 무료 크레딧 무제한 누적
- 매일 무료 영상 생성
- 추천인 보상
- 크리에이터 정산 및 출금

---

## 5. 기능별 크레딧 차감

크레딧은 AI 모델명을 기준으로 사용자에게 안내하지 않고 기능 단위로 안내한다.

차감 대상 예시:

- 세계관 AI 추천
- 스토리 AI 추천
- 캐릭터 대표 이미지 생성
- 캐릭터 참고 이미지 생성
- 장면 이미지 생성
- 음성 생성
- 배경음악 또는 효과음 생성
- 자막 생성
- 최종 영상 생성
- 일부 구간 재생성
- 전체 영상 재생성
- 썸네일 생성

각 기능 실행 버튼 주변에 예상 차감량을 표시한다.

예시:

- `8 크레딧 사용`
- `예상 24 크레딧`
- `재생성 시 4 크레딧이 사용돼요.`

실제 차감량은 서버 설정으로 관리하고 프론트엔드에 하드코딩하지 않는다.

---

## 6. 크레딧 차감 시점

### 6.1 기본 원칙

크레딧 차감은 서버에서 처리한다.

프론트엔드에서 잔액을 직접 변경하지 않는다.

### 6.2 처리 흐름

1. 사용자가 AI 기능 실행
2. 서버에서 현재 잔액 확인
3. 필요한 크레딧 임시 예약
4. AI API 호출
5. 작업 성공
6. 예약 크레딧 확정 차감
7. 크레딧 원장 기록
8. 변경된 잔액 응답
9. 프론트엔드 잔액 갱신

### 6.3 실패 처리

다음 경우 크레딧을 차감하지 않거나 예약 크레딧을 반환한다.

- AI API 호출 실패
- 서버 오류
- 네트워크 오류로 작업이 완료되지 않음
- 생성 결과 파일이 저장되지 않음
- 영상 조합 실패
- 게시 API 호출 실패

AI 생성 결과가 정상적으로 제공됐지만 사용자의 취향과 다르다는 이유는 자동 반환 사유에 포함하지 않는다.

서비스 오류와 결과 불만족을 구분할 수 있도록 실패 코드를 관리한다.

---

## 7. 잔액 부족 정책

사용자가 필요한 크레딧보다 적은 잔액을 보유한 경우:

1. AI 작업을 시작하지 않는다.
2. 현재 잔액과 필요 크레딧을 안내한다.
3. 크레딧 충전 화면으로 이동할 수 있는 버튼을 제공한다.

예시:

> 크레딧이 부족해요.
> 영상 생성에는 24 크레딧이 필요하며 현재 10 크레딧을 보유하고 있어요.

버튼:

- `크레딧 충전`
- `취소`

---

## 8. 크레딧 충전 상품

충전 상품은 서버 또는 관리자 설정으로 관리한다.

상품 정보:

- 상품 ID
- 상품명
- 판매 가격
- 기본 유료 크레딧
- 보너스 크레딧
- 총 지급 크레딧
- 판매 여부
- 노출 순서
- 추천 상품 여부
- 판매 시작일
- 판매 종료일

예시 구조:

| 상품 | 가격 | 유료 크레딧 | 보너스 | 총 지급 |
|---|---:|---:|---:|---:|
| Starter | 5,000원 | 설정값 | 0 | 설정값 |
| Basic | 10,000원 | 설정값 | 설정값 | 설정값 |
| Plus | 30,000원 | 설정값 | 설정값 | 설정값 |
| Pro | 50,000원 | 설정값 | 설정값 | 설정값 |

구체적인 크레딧 수량과 보너스 비율은 AI API 원가 계산 후 확정한다.

프론트엔드에 상품 가격과 크레딧을 하드코딩하지 않는다.

---

## 9. PG 결제 연동

### 9.1 기본 정책

사용자가 실제 결제수단으로 크레딧을 구매하려면 PG 서비스를 연동해야 한다.

실제 서비스 출시 전 필요한 항목:

- 사업자등록
- 통신판매업 관련 신고 검토
- PG사 가입 및 심사
- 결제 API 연동
- 결제 승인·취소·환불 연동
- 결제 웹훅 처리
- 이용약관 및 환불 정책 적용

### 9.2 개발 단계 구분

현재 프론트엔드 개발 단계:

- 크레딧 상품 UI
- 결제 요청 UI
- 결제 진행 상태
- 결제 성공 화면
- 결제 실패 화면
- 사용자 결제 취소 상태
- Mock 결제 흐름

실제 서비스 출시 전:

- PG 계약
- 운영 결제키 적용
- 서버 결제 승인
- 웹훅 검증
- 크레딧 지급
- 취소 및 환불
- 결제 대사

PG가 확정되기 전까지 특정 PG SDK에 도메인 로직을 강하게 결합하지 않는다.

---

## 10. 결제 처리 흐름

1. 사용자가 충전 상품 선택
2. 서버에서 상품 가격과 판매 상태 확인
3. 서버에서 결제 주문 생성
4. 주문 ID 반환
5. 프론트엔드에서 PG 결제창 호출
6. 사용자 결제 인증
7. 프론트엔드가 결제 인증 정보를 서버에 전달
8. 서버가 PG 결제 승인 API 호출
9. 승인 금액과 주문 금액 비교
10. 결제 승인 상태 저장
11. 유료·보너스 크레딧 원장 기록
12. 사용자 잔액 반영
13. 결제 성공 응답
14. GA4 `purchase` 이벤트 전송

성공 페이지로 이동했다는 사실만으로 크레딧을 지급하지 않는다.

반드시 서버에서 PG 결제 승인 결과를 확인한 뒤 지급한다.

---

## 11. 중복 결제 및 중복 지급 방지

다음 항목에 대해 멱등성을 보장한다.

- 결제 승인 요청
- PG 웹훅 수신
- 유료 크레딧 지급
- 보너스 크레딧 지급
- 무료 크레딧 지급
- 결제 취소
- 환불 크레딧 회수

동일한 주문 ID 또는 지급 이벤트 ID가 재전송돼도 한 번만 처리한다.

PG 웹훅의 서명 또는 인증값을 검증한다.

---

## 12. 청약철회 및 환불

### 12.1 기본 청약철회

다음 조건을 모두 만족하는 경우 결제일로부터 7일 이내 청약철회를 요청할 수 있다.

- 해당 결제 건의 유료 크레딧을 사용하지 않음
- 해당 결제 건에 포함된 보너스 크레딧을 사용하지 않음
- 결제가 취소 또는 환불되지 않은 상태

환불은 원래 결제수단으로 처리한다.

### 12.2 일부 사용한 크레딧

유료 또는 보너스 크레딧을 일부라도 사용한 결제 건의 환불 정책은 PG 심사 및 법률 검토 후 확정한다.

개발 단계에서는 다음 상태를 지원할 수 있도록 구성한다.

- 환불 가능
- 전액 환불
- 부분 환불 검토
- 환불 불가
- 관리자 확인 필요

### 12.3 탈퇴

회원 탈퇴 전에 다음 사항을 안내한다.

- 무료·보너스·보상 크레딧은 탈퇴 시 소멸
- 유료 크레딧 잔액이 있는 경우 환불 가능 여부 확인 필요
- 처리 중인 결제·환불·생성 작업이 있으면 탈퇴 제한 가능
- 탈퇴 후 크레딧 복구 불가

구체적인 약관 문구는 출시 전 법률 및 PG 정책 검토 후 확정한다.

---

## 13. 크레딧 데이터 구조

### CreditProduct

- id
- name
- price
- paidCreditAmount
- bonusCreditAmount
- currency
- isRecommended
- isActive
- displayOrder
- saleStartedAt
- saleEndedAt
- createdAt
- updatedAt

### PaymentOrder

- id
- userId
- productId
- orderId
- paymentKey
- paymentMethod
- currency
- requestedAmount
- approvedAmount
- status
- requestedAt
- approvedAt
- canceledAt
- failedAt
- failureCode
- failureMessage
- createdAt
- updatedAt

결제 상태 예시:

- pending
- authenticated
- approved
- failed
- canceled
- partially_refunded
- refunded

### CreditGrant

크레딧 지급 단위를 관리한다.

- id
- userId
- creditType
- originalAmount
- remainingAmount
- sourceType
- sourceId
- grantedAt
- expiresAt
- status

크레딧 종류:

- free
- bonus
- paid
- compensation

지급 출처:

- signup
- first_publish
- weekly_support
- purchase
- service_recovery
- promotion
- admin

### CreditTransaction

모든 크레딧 변동을 기록한다.

- id
- userId
- transactionType
- creditType
- amount
- balanceBefore
- balanceAfter
- creditGrantId
- paymentOrderId
- usageTargetType
- usageTargetId
- idempotencyKey
- reason
- createdAt

변동 유형:

- grant
- charge
- use
- refund
- expire
- revoke
- admin_adjustment

### CreditUsage

AI 기능별 사용 내역을 관리한다.

- id
- userId
- projectId
- featureType
- targetType
- targetId
- creditAmount
- apiProvider
- apiModel
- estimatedApiCost
- actualApiCost
- status
- requestedAt
- completedAt
- failedAt
- failureCode

사용자는 API 모델명을 기준으로 비용을 보지 않지만, 운영자는 원가 분석을 위해 실제 제공사와 모델 정보를 저장할 수 있다.

---

## 14. 마이페이지 크레딧 UI

마이페이지에서 다음 정보를 제공한다.

### 잔액 영역

- 총 보유 크레딧
- 무료 크레딧
- 보너스 크레딧
- 유료 크레딧
- 보상 크레딧
- 가장 가까운 만료 예정 크레딧과 만료일
- 크레딧 충전 버튼

### 이용 내역

필터:

- 전체
- 충전
- 지급
- 사용
- 반환
- 만료

내역 정보:

- 처리 일시
- 구분
- 사용 또는 지급 사유
- 변동 크레딧
- 처리 후 잔액
- 유효기간
- 결제 내역 연결

---

## 15. GA4 연동 목적

GA4는 다음 항목을 분석하기 위해 사용한다.

- 가입 후 첫 제작 진입
- 첫 영상 생성
- 첫 게시
- 무료 크레딧 사용
- 무료 크레딧 소진
- 유료 충전 전환
- 두 번째 영상 생성
- 주간 재방문
- 7일·30일 유지율
- 기능별 이탈 및 실패

GA4는 행동 분석 도구이며 결제·크레딧 원장이 아니다.

기준 데이터:

- 결제 및 매출: 백엔드 PaymentOrder
- 크레딧 잔액: CreditGrant 및 CreditTransaction
- AI 원가: CreditUsage
- 행동 및 퍼널: GA4

---

## 16. GA4 구현 원칙

- GA4 측정 ID는 환경변수로 관리한다.
- 개발 환경과 운영 환경 데이터를 분리한다.
- 이벤트 호출은 공통 Analytics 모듈에서 관리한다.
- 컴포넌트마다 GA 호출 코드를 직접 중복 작성하지 않는다.
- 이벤트 이름은 영문 lower_snake_case를 사용한다.
- 이벤트 중복 전송을 방지한다.
- 단순 버튼 클릭과 실제 처리 성공을 구분한다.
- 실제 성공 이벤트는 서버의 성공 응답 후 전송한다.
- 결제 `purchase` 이벤트는 PG 승인 및 크레딧 지급 완료 후 전송한다.
- 개발 중 GA4 DebugView에서 이벤트를 검수한다.

---

## 17. User-ID 및 개인정보

로그인 사용자는 AAY 내부에서 생성한 비식별 UUID를 GA4 `user_id`로 사용한다.

금지 정보:

- Google 이메일
- 사용자 이름
- 전화번호
- 영상 제목
- 캐릭터 이름
- 세계관 이름 및 내용
- 스토리 제목 및 내용
- 프롬프트
- YouTube 채널명
- 결제수단의 상세 정보
- 생성 콘텐츠 원문

로그아웃 시 GA4 `user_id`를 `null`로 초기화한다.

사용자 UUID를 별도의 GA 커스텀 차원으로 등록하지 않는다.

---

## 18. GA4 권장 이벤트

### 인증

#### sign_up

Google 최초 가입 완료 시 발생한다.

파라미터:

- method: google

#### login

Google 로그인 완료 시 발생한다.

파라미터:

- method: google

### 결제

- view_item_list
- select_item
- begin_checkout
- purchase
- refund

`purchase` 주요 파라미터:

- transaction_id
- currency: KRW
- value
- items
- product_id
- paid_credit_amount
- bonus_credit_amount

---

## 19. AAY 커스텀 이벤트

### 서비스 활성화

- onboarding_started
- character_created
- world_created
- story_created
- youtube_connected

### 영상 제작

- video_creation_started
- video_creation_completed
- video_creation_failed
- generation_retry
- review_completed
- publish_completed
- publish_failed

### 크레딧

- free_credit_granted
- weekly_credit_claimed
- credit_spent
- credit_refunded
- credit_insufficient
- credit_expired

### 결제

- payment_failed

---

## 20. 주요 이벤트 파라미터

### free_credit_granted

- grant_type
- credit_amount
- expires_in_days

`grant_type`:

- signup
- first_publish
- weekly_support
- service_recovery
- promotion

### credit_spent

- action_type
- credit_amount
- credit_type
- balance_after

### credit_refunded

- action_type
- credit_amount
- reason

### credit_insufficient

- action_type
- required_amount
- balance

### video_creation_started

- creation_method
- duration
- ratio
- estimated_credit_amount

### video_creation_completed

- creation_method
- duration
- credit_amount
- retry_count

### video_creation_failed

- step
- error_type
- credit_refunded

### publish_completed

- platform
- publish_type

MVP 값:

- platform: youtube
- publish_type: immediate | scheduled

---

## 21. GA4 주요 이벤트 설정

다음 이벤트를 GA4 주요 이벤트로 지정한다.

- sign_up
- youtube_connected
- video_creation_completed
- publish_completed
- purchase

필요한 경우 다음 이벤트도 주요 이벤트 후보로 검토한다.

- begin_checkout
- first_publish_completed
- second_video_created

첫 게시와 두 번째 영상은 서버 데이터로 최초 여부를 확인한 후 별도 이벤트로 전송할 수 있다.

---

## 22. 분석 퍼널

### 가입 활성화 퍼널

1. sign_up
2. onboarding_started
3. character_created
4. world_created
5. story_created
6. video_creation_started
7. video_creation_completed
8. youtube_connected
9. publish_completed

확인 지표:

- 가입 후 제작 진입률
- 가입 후 첫 영상 생성 완료율
- 가입 후 첫 게시 완료율
- 단계별 이탈률
- 첫 영상 완성까지 걸린 시간

### 무료 크레딧 전환 퍼널

1. free_credit_granted
2. credit_spent
3. credit_insufficient
4. view_item_list
5. select_item
6. begin_checkout
7. purchase

확인 지표:

- 가입 크레딧 사용률
- 무료 크레딧으로 첫 영상을 완성한 비율
- 무료 크레딧 사용 전 이탈률
- 잔액 부족 후 충전 화면 진입률
- 결제 시작률
- 결제 완료율
- 첫 결제까지 걸린 시간

### 유지 퍼널

1. 첫 영상 생성
2. 첫 게시
3. 주간 지원 크레딧 수령
4. 두 번째 영상 생성
5. 두 번째 게시

확인 지표:

- 가입 후 7일 재방문율
- 가입 후 30일 재방문율
- 두 번째 영상 생성률
- 첫 게시 후 두 번째 영상까지 걸린 시간
- 주간 지원 크레딧 수령률
- 주간 지원 크레딧 사용률
- 무료 사용자와 유료 사용자의 생성 빈도

---

## 23. GA4만으로 확인하지 않는 지표

다음 지표는 백엔드 데이터와 결합한다.

- 사용자 한 명당 AI API 비용
- 영상 한 개당 실제 원가
- 무료 크레딧 제공 비용
- 기능별 API 원가
- PG 수수료 제외 매출
- 사용자별 매출 및 손익
- 유료 크레딧 미사용 잔액
- 만료 예정 크레딧
- 환불 및 취소 금액
- 무료 크레딧 악용 비율

향후 필요할 경우 GA4 데이터를 BigQuery로 내보내 백엔드 데이터와 결합한다.

---

## 24. MVP 개발 범위

### 현재 프론트엔드 단계

- 크레딧 잔액 UI
- 크레딧 종류별 내역
- 충전 상품 UI
- 결제 Mock 흐름
- 결제 성공·실패 상태
- 잔액 부족 팝업
- 예상 차감량 안내
- 무료 크레딧 지급 상태
- GA4 기본 연동
- GA4 이벤트 공통 모듈
- DebugView 검증

### 백엔드 단계

- 크레딧 원장
- 기능별 차감
- 크레딧 예약·확정·반환
- 무료 크레딧 중복 지급 방지
- 주간 지원 크레딧
- 첫 게시 보상
- 결제 주문
- PG 승인 및 웹훅
- 유료·보너스 크레딧 지급
- 취소·환불
- API 원가 기록

### 실제 출시 필수

- 운영 PG 계약
- 실제 결제 승인 검증
- 약관 및 환불 정책
- 크레딧 유효기간 고지
- 개인정보 및 분석 동의 정책
- 결제 취소·환불 검수
- 결제·크레딧 대사
- 무료 크레딧 악용 방지

---

## 25. 구현 시 주의사항

- 크레딧 수량과 가격은 설정값으로 관리한다.
- 프론트엔드에 상품 가격이나 차감량을 하드코딩하지 않는다.
- 무료 크레딧 지급량은 AI 기능별 실제 원가 계산 후 확정한다.
- 크레딧 잔액은 서버 응답을 기준으로 표시한다.
- 낙관적 업데이트로 크레딧 잔액을 먼저 변경하지 않는다.
- 모든 크레딧 변경은 원장에 기록한다.
- 결제 성공 리다이렉트만으로 크레딧을 지급하지 않는다.
- 동일 결제·지급·차감 요청의 중복 처리를 막는다.
- 생성 실패와 결과 불만족을 구분한다.
- GA 이벤트에 사용자 입력 콘텐츠와 개인정보를 전달하지 않는다.
- 무료 정책과 지급량은 출시 후 GA4 및 백엔드 원가 데이터를 기반으로 조정한다.
