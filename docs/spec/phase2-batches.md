# 2단계(정적 화면) 배치 계획 및 진행 상황

`docs/spec/aay-studio-spec.md` 11장의 **2단계: 정적 화면**은 화면 수가 많아 한 번에 진행하지 않고,
아래처럼 배치(A~G)로 나눠 순서대로 진행한다. 새 세션에서 "배치 C 진행해줘" 같은 요청을 받으면
이 문서를 기준으로 어떤 화면을 만들면 되는지 파악한다.

**[`docs/spec/spec-addendum.md`](spec-addendum.md)가 `aay-studio-spec.md` 이후 추가된 내용이고, 충돌 시 우선한다.**
특히 라이브러리 구조(영상/캐릭터/세계관/스토리 4탭)는 addendum 기준으로 배치 F에서 새로 구현했다.

## 배치 목록

| 배치 | 범위(스펙) | 라우트 | Figma node id | 상태 |
|---|---|---|---|---|
| A | 5.1 랜딩, 5.2 홈, 5.3 작업 방식 선택 | `/`, `/home`, `/create` | `1:2`, `53:102`, `53:299` | 완료 |
| B | 5.4 템플릿 선택 + 캐릭터·세계관·스토리 설정 | `/create/template`, `/create/template/setup` | `53:202`, `53:472` | 완료 |
| C | 5.5 직접 만들기 플로우(아이디어 입력, AI 기획 확인) | `/create/manual`, `/create/manual/brief` | `5:2`, `14:119` | 완료 |
| D | 5.6 생성 중, 5.7 검토, 5.8 게시 설정 — 템플릿·직접 만들기 공통 | `/create/settings`, `/create/generating`, `/create/review`, `/create/publish` | `63:699`, `63:905`, `63:1399`, `63:1695` | 완료 |
| E | 5.9 라이브러리 - 영상, 5.10 영상 상세 | `/library/videos`, `/library/videos/:videoId` | `72:194`, `97:221` | 완료(배치 F에서 라우트 개정) |
| F | addendum — 라이브러리 캐릭터/세계관/스토리(목록+상세), 공통 상세 헤더 도입 | `/library/characters(+:id)`, `/library/worlds(+:id)`, `/library/stories(+:id)` | 아래 "배치 F 확인 결과" 참고 | 완료 |
| G | 5.11 마이페이지 | `/mypage` | `105:234` | 대기 |

세부 node id 매핑은 `docs/spec/figma-frame-map.md`를 함께 참고한다.

## 배치 C 확인 결과 (완료)

- `Create - 직접 만들기 - step1`(`5:2`) = `/create/manual`(아이디어 입력: 요청 내용, 게시 플랫폼, 화면 비율, 영상 길이).
- `Create - 직접 만들기 - step2`(`14:119`) = `/create/manual/brief`(AI 기획 확인: 원본 요청 + 연출 방향/장면 구성/오디오 구성 + 출력 정보/생성 정보).
- `Create - 직접 만들기 - step3`(`39:160`)은 배치 C 범위가 아니라 **`/create/generating`(생성 중) 화면 그 자체**였다.
  즉, 직접 만들기 플로우는 별도의 "생성 정보 설정" 단계 없이 AI 기획 확인(`14:119`) 다음 바로 생성 중 화면으로 넘어간다.
  같은 이유로 `63:1211`(step4)·`63:1504`(step5)는 각각 `/create/review`·`/create/publish`일 가능성이 높다 — 배치 D 시작 시 확인.
- `40:315`/`42:709`는 `14:119`의 "수정" 버튼을 눌렀을 때의 편집 모드(각 필드가 인풋으로 바뀌고 Save 버튼 노출) 변형이다.
  조건부 노출/모드 전환은 3단계(프론트엔드 상태) 범위이므로 배치 C에서는 구현하지 않았다 — `14:119`의 보기 모드만 정적으로 구현.
- 템플릿 플로우의 `/create/settings`(`63:699`)는 `14:119`와 레이아웃이 거의 동일하지만 좌측 상단 박스가
  "원본 요청" 대신 "요약"(템플릿/주인공/주변 인물/세계관/스토리)이고, 하단 좌측 버튼이 "← 이전" 대신 "← 설정 수정"이다.
  두 화면은 라우트가 다르므로(스펙 4.2) 배치 D에서 `/create/settings`를 별도 페이지로 구현해야 한다 — `CreateManualBriefPage`의
  `InfoCard` 패턴(연출 방향/장면 구성/오디오 구성/출력 정보/생성 정보 박스)을 참고해서 구조를 재사용할 수 있다.

## 배치 D 확인 결과 (완료)

- `/create/settings`(`63:699`)는 템플릿 플로우 전용이다. 직접 만들기는 이 라우트를 전혀 쓰지 않는다(배치 C 결론 참고).
  "요약" 박스(템플릿/주인공/주변 인물/세계관/스토리, 인물은 40×40 아바타 자리표시자 포함)만 `/create/manual/brief`의 "원본 요청" 박스와
  다르고, 나머지(연출 방향/장면 구성/오디오 구성/출력 정보/생성 정보 `InfoCard`, 하단 버튼)는 동일한 구조라 `InfoCard`를
  `src/components/common/InfoCard/InfoCard.tsx`로 공통화해서 두 화면 모두에서 재사용한다.
- **가로 스테퍼 표시 여부는 진입 플로우에 따라 다르다(사용자 확인 완료)**: 직접 만들기로 들어왔을 때만
  `/create/generating`·`/create/review`·`/create/publish`에 상단 5단계 스테퍼(요청-AI기획-생성-검토-게시)가 보이고,
  템플릿 플로우로 들어왔을 때는 보이지 않는다. `src/router/createFlow.ts`의 `useCreateFlow()` 훅으로 구현했다 —
  화면 전환 시 `navigate(path, { state: { flow: 'template' | 'manual' } })`로 넘기고, 각 공유 페이지는
  `useCreateFlow()`로 현재 플로우를 읽어 스테퍼를 조건부 렌더링한다. `state`가 없으면(직접 URL 진입 등) `template`으로 간주한다.
- **영상 플레이어 가로 폭이 스펙(5.7 "가로 폭 800px")과 다르다.** Figma 실측: 검토 화면 600px, 게시 화면(정보 카드와 나란히 배치) 300px.
  둘 다 800px가 아니어서, 이번엔 Figma 실측값을 그대로 사용했다(문서 우선순위 규칙상 시각 수치는 Figma 우선).
  플레이어를 다루는 후속 작업(3~5단계) 전에 이 폭 값이 맞는지 한 번 더 확인이 필요하다.
- 영상 미리보기(재생바 + 재생/음량 버튼 + 실제 비율을 나타내는 안쪽 사각형)는 검토·게시 화면에 반복돼서
  `src/components/common/VideoPreview/VideoPreview.tsx`로 공통화했다.
- `CreateManualBriefPage`의 "생성 · 24크레딧 →" 버튼이 배치 C에서 연결되지 않은 채 남아 있던 것을 이번에
  `/create/generating`(flow: manual)로 연결해 일관성을 맞췄다.

## 배치 E 확인 결과 (완료)

- 라이브러리 화면(`72:194`)에는 "영상/캐릭터/세계관" 탭이 있지만, **Figma에서 "캐릭터"(`133:265`)·"세계관"(`133:444`) 탭 프레임을
  열어보면 "영상" 탭 내용을 그대로 복사해놓은 미완성 placeholder였다**(같은 영상 카드, 같은 문구). 실제 캐릭터/세계관
  라이브러리 디자인이 없으므로, 사용자 확인 후 "영상" 탭만 실제로 구현하고 나머지 두 탭은 비활성(disabled) 버튼으로만 넣었다.
  나중에 실제 디자인이 나오면 그때 구현한다 — 카드 내용을 임의로 지어내지 않는다.
- 카드 상태별 배지 색상: 게시 완료 = `#555` 배경/흰 텍스트, 예약 게시 = 흰 배경/`#bbb` 테두리/`#333` 텍스트,
  게시 실패 = `#777` 배경/흰 텍스트. `src/components/common/StatusBadge/StatusBadge.tsx`로 공통화했다(라이브러리 카드·영상 상세 공용).
- 라이브러리 카드의 타이포는 앱의 다른 화면과 다른 회색조를 쓴다(제목 `#111`, 메타 `#666`, 날짜 `#999`) — 기존
  `$color-black`/`$color-text`/`$color-text-muted`(`#000`/`#333`/`#555`)와는 별개의, 이 화면 전용 값이라 토큰화하지 않고
  페이지 스타일에 리터럴로 넣었다.
- 검색창/필터/정렬/보기전환 버튼은 스펙 6.2가 명시한 예외(라이브러리는 공통 Dropdown/Input과 다른 형태 허용)에 해당해서
  공통 컴포넌트를 억지로 재사용하지 않고 이 페이지 전용 스타일로 구현했다(테두리 `#d9d9d9`, radius 8px 등 기존 공통 Input/Dropdown과 다름).
- **Figma MCP 팁**: 컴포넌트 인스턴스가 포함된 노드에 `get_design_context`를 호출하면 5분 타임아웃이 나는 경우가 있었다
  (이 세션에서 라이브러리 탭 인스턴스, LNB 인스턴스 등에서 반복 발생). 인스턴스가 없는 하위 노드(잎 텍스트 노드 등)를
  개별로 조회하면 빠르게 응답한다. 그래도 필요한 값(이번엔 탭 텍스트 크기)을 못 얻으면, 사용자에게 Figma에서 해당
  컴포넌트 내부로 더블클릭해 들어가 텍스트 레이어를 직접 선택해달라고 요청하고 `nodeId` 없이 `get_design_context`를 호출한다
  (선택된 노드를 기준으로 조회됨). 이렇게 확인한 라이브러리 탭 텍스트는 활성/비활성 모두 18px bold였다 — 겉보기(button 스타일)로
  14px일 거라고 추측했다면 틀렸을 값이라, 반드시 이 방식으로 재확인해야 한다.

## 배치 F 확인 결과 (완료) — `spec-addendum.md` 반영

- 배치 E 완료 후 `spec-addendum.md`가 추가되면서 Figma에도 실제 캐릭터/세계관/스토리 라이브러리 디자인이 새로 생겼다
  (배치 E 때는 "영상" 탭 내용을 복사한 placeholder였던 것과 다름 — 사용자가 확인해줌). node id:
  - 캐릭터 목록 `133:265`, 캐릭터 상세 `158:310`(동일 내용의 중복 프레임 `151:395`는 사용자가 Figma에서 삭제함)
  - 세계관 목록 `133:444`, 세계관 상세 `151:750`
  - 스토리 목록 `151:858`, 스토리 상세 `151:990`
- **라우트를 이번에 재구성했다**: 기존 `/library`, `/library/:videoId`를 `/library/videos`, `/library/videos/:videoId`로 옮기고,
  `/library`는 `/library/videos`로 리다이렉트한다(사용자 요청 — 영상 탭도 다른 탭들과 대칭되는 하위 경로를 갖도록).
  새 라우트: `/library/characters(+:characterId)`, `/library/worlds(+:worldId)`, `/library/stories(+:storyId)`.
  페이지 파일도 `LibraryPage`/`LibraryDetailPage` → `LibraryVideosPage`/`LibraryVideoDetailPage`로 이름을 바꿨다.
- **공통 상세 헤더 규칙**(addendum 10장)을 `src/components/common/LibraryDetailHeader/LibraryDetailHeader.tsx`로 구현했다:
  좌측 "← OO 목록"(Button secondary), 가운데 제목(+선택적 배지), 우측 "수정"(secondary)+"삭제"(danger, 기존 Button 컴포넌트 그대로 재사용).
  영상 상세도 이 공통 헤더로 개정해서 수정/삭제 버튼이 새로 생겼다(이전엔 없었음).
- **`DetailField`**(`src/components/common/DetailField/DetailField.tsx`): 라벨 100px + 테두리 박스(단일/여러 줄) 패턴.
  캐릭터/세계관/스토리 상세의 이름·설명 등 필드에 쓴다. 영상 상세의 읽기전용 필드(배경 `#f8f8f8`, 흐린 느낌)와 달리,
  이 세 상세 화면의 필드는 Figma에서 테두리 `#333`의 일반(입력 가능해 보이는) 스타일이라 서로 다르게 구현했다 — 통일시키지 않는다.
- **`LibraryListRow`**(`src/components/common/LibraryListRow/LibraryListRow.tsx`): 세계관·스토리 목록이 공유하는 가로형 리스트 행.
- **캐릭터 카드 색상은 영상 카드와 다르다**: 제목 `#333`(영상은 `#111`), 설명/메타 둘 다 `#555`(영상은 `#666`/`#999` 분리),
  카드 테두리 `#ddd`(영상은 `#d9d9d9`). 비슷해 보이는 카드라도 Figma 값을 다시 확인해야 한다는 걸 보여주는 사례.
- 캐릭터/세계관/스토리 상세의 "관리 정보" 카드에서 마지막 항목(수정일 또는 사용 크레딧) 값이 Figma에 "YouTube에서 보기"로
  잘못 들어있었다(영상 상세를 복제하면서 생긴 실수로 보임). 그대로 베끼지 않고 문맥에 맞는 값(날짜, 크레딧 수)으로 채웠다.
- "새 캐릭터/세계관/스토리 만들기" 버튼은 실제 생성 팝업이 아직 없어서(addendum 4장의 새 캐릭터 생성 흐름은 3~4단계 범위)
  다른 화면 이동 없이 비활성 상태로 뒀다 — 관련 없는 화면(템플릿 설정 등)으로 임의로 연결하지 않는다.
- 라이브러리 카드/행의 "⋮" 메뉴, 수정/삭제 확인 팝업은 아직 클릭 동작이 없다(3단계 "팝업" 범위).

## 배치 F 후속 반영 — 카드/목록 보기 전환, 아이콘 실물화

- 사용자가 Figma에 "더보기(⋮)" 아이콘, 카드/목록 보기 아이콘 실물, 그리고 **영상·캐릭터 라이브러리의 목록 보기(테이블형)
  화면**을 추가로 채워 넣었다. `docs/spec/figma-frame-map.md`에 새 node id를 기록해뒀다.
- "⋮" 텍스트는 `src/components/common/MoreIcon/MoreIcon.tsx`, 카드/목록 보기 아이콘은
  `src/components/common/GridViewIcon/GridViewIcon.tsx`·`ListViewIcon/ListViewIcon.tsx`로 Figma 원본 SVG를 그대로 옮겨
  공통화했다(라이브러리 전 화면 공용).
- **영상/캐릭터 라이브러리는 이제 카드·목록 보기 전환이 실제로 동작한다**(`useState<'grid' | 'list'>`). 목록 보기는
  Figma의 테이블 레이아웃(헤더 행 배경 `#f8f8f8`, 행 높이 78px, 구분선 `#ddd`, 컬럼별 고정 너비)을 그대로 구현했다 —
  기존 `LibraryListRow`(세계관·스토리용, 2단 요약형)와는 다른 진짜 테이블 구조라 재사용하지 않고 각 페이지에 직접 구현했다.
  세계관·스토리는 애초에 보기 전환 기능이 없다(스펙대로).

## 지금까지 정한 구현 방식(새 세션도 그대로 따를 것)

- **공통 버튼**: Figma에는 `#333`/`#000` 배경 버튼이 섞여 있지만, 스펙 6.1("주요 실행: 검정 배경")과
  1단계에서 만든 `Button` 컴포넌트(`variant="primary"` = 검정)로 통일해서 재사용한다. 새 버튼 variant를 만들지 않는다.
- **드롭다운**: 공통 `Dropdown` 컴포넌트에 `hideLabel` prop이 있다(`src/components/common/Dropdown/Dropdown.tsx`).
  "세계관 선택"처럼 라벨이 드롭다운 내부 텍스트로만 표시되는 화면(스펙 6.2 예외 케이스)에 사용한다.
- **LNB 폰트**: 18px다(Figma 페이지의 LNB 인스턴스는 스케일이 축소되어 12px로 보이지만, 마스터 컴포넌트 기준은 18px).
- **Header/Sidebar의 로그인 전 상태**: 현재 경로가 `/home`이면 `Header`의 로그아웃 아이콘과 `Sidebar`의 크레딧 위젯을
  숨긴다(`useLocation` 기반 임시 처리). 실제 인증 상태 기반 분기가 아니므로, 4단계(Google 인증 연동) 때 대체될 예정이다.
- **조건부 노출/자동 스크롤 등 인터랙션**: 아직 구현하지 않았다. "새 세계관 만들기 선택 시에만 입력창 노출",
  "우측 스테퍼 클릭 시 자동 스크롤" 같은 동작은 3단계(프론트엔드 상태) 작업 범위다. 지금은 Figma 캡처에 보이는
  요소를 있는 그대로(항상 노출) 정적으로만 구현한다.
- **이미지 에셋**: Figma 로컬 서버(`localhost:3845`)의 이미지 URL은 영구적이지 않으므로, 실제 사용 크기의
  2배 정도로 Figma에서 직접 내보내 받아 `src/assets/`에 저장해서 쓴다(예: `src/assets/platforms/`).
  원본 크기 그대로 받으면 불필요하게 큰 파일이 될 수 있다(Instagram 아이콘이 960×960 → 32×32로 교체된 사례 있음).
- **작업 완료 후**: `npm run lint`, `npm run build` 확인 후 커밋·푸시한다(사용자 요청 시).
- **가로형 스테퍼(요청/AI 기획/생성/검토/게시)**: 공통 컴포넌트 `src/components/common/Stepper/Stepper.tsx`로 구현했다
  (`current` prop으로 활성 단계 표시). 템플릿 플로우의 캐릭터/세계관/스토리 세로 스테퍼와는 별개 컴포넌트다.
  단, `/create/generating`·`/create/review`·`/create/publish`에서는 직접 만들기로 들어왔을 때만 렌더링한다(위 "배치 D 확인 결과" 참고).
- **`InfoCard`(라벨:값 목록 + 선택적 "수정" 버튼)**와 **`VideoPreview`(재생바 + 재생/음량 버튼 자리표시자)**는
  `src/components/common/`에 공통 컴포넌트로 있다. AI 기획 확인·검토·게시 등 정보 카드나 영상 미리보기가 필요한 화면에서 재사용한다.
- **플로우 구분이 필요한 공유 화면**: `src/router/createFlow.ts`의 `useCreateFlow()` 훅을 사용한다.
  `navigate(path, { state: { flow: 'template' | 'manual' } })`로 넘기고 받는 쪽에서 `useCreateFlow()`로 읽는다.
- **`StatusBadge`(영상 상태 배지)**는 `src/components/common/StatusBadge/StatusBadge.tsx`에 있다.
  라이브러리 카드와 영상 상세 화면에서 재사용한다.
- **라이브러리 공통 컴포넌트**: `LibraryTabs`(4탭), `LibraryDetailHeader`(뒤로가기/제목/수정·삭제), `DetailField`(라벨+박스 필드),
  `LibraryListRow`(세계관·스토리 목록 행) — 전부 `src/components/common/`에 있다. 라이브러리 화면을 새로 만들 때 우선 재사용한다.
