# 3단계(프론트엔드 상태) 배치 계획 및 진행 상황

`docs/spec/aay-studio-spec.md` 11장의 **3단계: 프론트엔드 상태**(폼 입력, 조건부 노출, 활성·비활성 상태,
스테퍼, 자동 스크롤, 카드·목록 보기, 검색·필터·정렬, 팝업, 목데이터 기반 상태 분기)를 배치(A~F)로 나눠 진행한다.
2단계와 동일하게 새 세션에서 "3단계 배치 B 진행해줘" 같은 요청을 받으면 이 문서를 기준으로 파악한다.

`docs/spec/spec-addendum.md`(12·13·14장: 저장 완료 알림/삭제 정책/크레딧 부족 예외)와
`docs/spec/spec-addendum-credit.md`(7장: 잔액 부족 정책)를 함께 참고한다.

## 배치 목록

| 배치 | 범위 | 상태 |
|---|---|---|
| A | 공통 팝업(위험 컨펌) 연동 — 라이브러리 캐릭터/세계관/스토리 삭제, 마이페이지 계정 탈퇴 | 완료(브라우저 미검증) |
| B | 카드 더보기(⋮) 메뉴(영상/캐릭터/세계관/스토리) | 완료(브라우저 미검증) |
| C | 캐릭터 생성 팝업(설명으로 만들기 / 이미지로 만들기) + 완료 알림 + 크레딧 부족 컨펌 팝업 | 완료(브라우저 미검증) |
| D | 스토리 영상 Step2 조건부 노출(세계관·스토리 새로 만들기/AI 추천/이전 이야기 비활성 조건) + 세계관·스토리 생성·수정 폼(addendum 11.2/11.3) | 완료(사용자 브라우저 확인 완료) |
| E | 라이브러리 검색·필터·정렬 실제 동작, 카드/목록 보기 상태 로컬 스토리지 유지 | 완료(브라우저 미검증) |
| F | 우측 세로 스테퍼 클릭 시 자동 스크롤, 남은 조건부 UI 점검 | 완료(브라우저 미검증) |

## 배치 A 확인 결과 (완료, 브라우저 미검증)

- 공통 팝업 컴포넌트(`ConfirmPopup`/`RiskConfirmPopup`/`AlertPopup`, `src/components/common/Popup/`)는 1단계에서
  이미 만들어져 있었지만 실제로 어느 화면에서도 쓰이고 있지 않았다 — 이번 배치에서 처음으로 실제 연결했다.
- Figma 공통 팝업(`105:413` 컨펌, `105:444` 위험 컨펌, `105:434` 얼럿)은 "타이틀"/"내용" 자리표시자만 있는
  범용 컴포넌트라 문구는 각 화면 맥락(addendum 13장 삭제 정책)에 맞게 채웠다.
- **적용 범위**: `LibraryCharacterDetailPage`/`LibraryWorldDetailPage`/`LibraryStoryDetailPage`의 `LibraryDetailHeader`
  "삭제" 버튼, `MyPage`의 "계정 탈퇴" 버튼. 각 페이지에서 `useState`로 팝업 열림 상태를 관리하고 `RiskConfirmPopup`을 띄운다.
  확인 시 목록 화면(또는 계정 탈퇴는 랜딩 `/`)으로 이동한다 — 실제 삭제 API가 없으므로 목데이터 배열 조작 대신 이동만
  구현했다(목록에서 실제로 항목이 사라지는 것까지는 다음 배치에서 "더보기 메뉴"와 함께 처리하는 게 자연스럽다).
- **영상은 이 배치에 포함하지 않았다**: 영상 상세(`LibraryVideoDetailPage`)는 Figma상 수정/삭제 버튼이 없고
  (`showActions={false}`), 삭제는 카드의 "더보기(⋮)" 메뉴에서만 가능하다(addendum 7.2). 더보기 메뉴 자체가 아직
  없어서(배치 B 범위) 영상 삭제는 배치 B에서 함께 처리한다.
- **⚠️ 브라우저 미검증**: 이번 배치 작업 중 Chrome 자동화 도구 연결이 끊겨서 실제 화면에서 팝업이 뜨는지, 딤 처리와
  버튼 스타일이 Figma와 맞는지 확인하지 못했다. `npm run lint`/`npm run build`만 통과했다. 다음 세션에서 브라우저로
  꼭 한 번 확인이 필요하다.

## 배치 B 확인 결과 (완료, 브라우저 미검증)

- Figma에서 더보기 팝메뉴 컴포넌트(`97:398` "popmenu")를 확인했다 — variant 5개: 다운로드/삭제/예약 변경/게시 설정 변경/수정.
  addendum 7.2 텍스트는 "영상 상세/게시 설정 변경(예약 변경)/삭제"라고 되어 있지만 Figma에는 "영상 상세" 항목이 없고
  "다운로드"가 있다 — 카드 클릭 시 이미 영상 상세로 이동하므로 "영상 상세"가 메뉴에 없는 것으로 보고, **사용자 확인 후
  Figma 컴포넌트 그대로(다운로드+게시 설정 변경/예약 변경+삭제) 구현했다.**
  - 게시 완료: 다운로드 / 게시 설정 변경 / 삭제
  - 예약 게시: 다운로드 / 예약 변경 / 삭제
  - 게시 실패: 다운로드 / 게시 설정 변경 / 삭제
  - 캐릭터/세계관/스토리 카드: 수정 / 삭제 (addendum 5·6·7장과 일치, Figma 컴포넌트의 "수정" variant와도 일치)
- **새 공통 컴포넌트**: `src/components/common/CardMenu/CardMenu.tsx` — 트리거(`MoreIcon` 버튼) + 바깥 클릭/Esc로 닫히는
  플로팅 패널. `items: CardMenuItem[]`을 받아 렌더링한다(각 항목 `{ key, label, icon, danger?, onSelect }`).
  아이콘은 `DownloadIcon`/`TrashIcon`/`ClockIcon`/`PublishSettingsIcon`/`EditIcon`으로 새로 만들었다(모두
  `src/components/common/`). 해당 노드들이 인스턴스 타임아웃으로 `get_design_context`가 끝까지 실패해서, 처음엔
  스크린샷을 보고 비슷한 모양으로 재구성했다가, **사용자가 Figma에서 각 아이콘 노드를 하나씩 직접 선택해줘서
  `nodeId` 없이 `get_design_context`를 호출하는 방식으로 5개 전부 정확한 원본 path로 교체했다**
  (`97:381` 게시 설정 변경 = 펜치+렌치, `97:340` 다운로드, `97:353` 삭제 = 원본부터 `#D00000` 스트로크,
  `97:375` 예약 변경 = 시계+연필 조합, `151:382` 수정 = 연필). 전부 exact-path 상태로 완료됐다.
- **카드/행 구조를 `<button>` → `<div role="button" tabIndex={0}>`로 변경**했다: 더보기 메뉴 트리거가 실제 `<button>`이라
  기존처럼 카드 전체를 `<button>`으로 감싸면 버튼 안에 버튼이 중첩되는 유효하지 않은 HTML이 된다. 카드 전체 클릭 영역은
  `role="button"` + `tabIndex={0}` + Enter/Space 키보드 핸들러로 접근성을 유지했다. 적용 대상: `LibraryVideosPage`
  카드/행, `LibraryCharactersPage` 카드/행, `LibraryListRow`(세계관·스토리 공용).
- **더보기 메뉴 항목 중 실제 동작이 있는 건 "삭제"뿐이다.** 다운로드/수정/게시 설정 변경/예약 변경은 대상 화면·기능이
  아직 없어서(각각 파일 저장소, 캐릭터·세계관·스토리 수정 폼, 게시 설정 수정 화면, 예약 변경 화면 — 전부 미구현)
  클릭해도 아무 동작이 없다. "삭제"는 배치 A와 같은 `RiskConfirmPopup` 패턴을 쓰되, 이번엔 목록이 이미 그 화면이므로
  확인 시 목데이터 배열에서 실제로 항목을 제거한다(`useState` 배열 + `filter`) — spec 11장 3단계의 "목데이터 기반
  상태 분기"에 해당.
- **크레딧 부족 컨펌 팝업은 배치 C로 옮겼다**: 원래 배치 B에 묶여 있었는데, 배치 C에서 실제로는 캐릭터 이미지 생성이
  아니라(그쪽은 Figma에도 금액이 "N"으로만 있어서 숫자를 지어낼 수 없었다) 이미 숫자가 확정된 "생성 · 24크레딧" 버튼
  3곳(`/create/settings`, `/create/free/brief`, `/create/review`)에 연결했다. 아래 "배치 C 확인 결과" 참고.
- ⚠️ 배치 A와 마찬가지로 이번에도 브라우저로 직접 확인하지 못했다. `npm run lint`/`npm run build`만 통과했다.

## 배치 C 확인 결과 (완료, 브라우저 미검증)

- Figma에서 캐릭터 생성 팝업 두 변형(`132:237` 설명으로 만들기, `133:682` 이미지로 만들기)의 전체 구조를 `get_metadata`로
  확인했다(카드가 700px 폭에 1097px 높이라 내부 스크롤이 있고, `get_screenshot`으로는 하단이 잘려 보여서 metadata로
  필드 구성을 확정했다). 필드: 이름 / 캐릭터 설명 / 특징 또는 소품 / 대표 이미지(모드별 다름) / 참고 이미지(최대 3장) —
  addendum 5장과 정확히 일치한다.
- **새 컴포넌트 `CharacterCreatePopup`**(`src/components/common/CharacterCreatePopup/`): `PopupShell`은 작은
  확인창(360px) 전용이라 이 폼에는 맞지 않아서 별도 카드(700px, 내용 많으면 세로 스크롤)로 새로 만들었다. 탭으로
  "설명으로 만들기"/"이미지로 만들기" 전환, 대표 이미지 영역만 모드에 따라 다른 UI를 보여준다(설명 모드: AI 생성 버튼,
  이미지 모드: 업로드 버튼 — 업로드 후 캐릭터 설명 칸에 "AI가 분석한 설명"을 mock으로 채워준다).
  - 대표 이미지 "N크레딧으로 이미지 생성" 버튼은 캐릭터 설명이 비어있으면 비활성화된다(addendum 5.1의 "필수 설명이
    입력되지 않은 상태에서는 이미지 생성 버튼을 비활성화할 수 있다"를 반영).
  - 참고 이미지 "업로드"/"N크레딧으로 이미지 생성" 버튼은 클릭할 때마다 참고 이미지 칩을 하나씩 추가한다(최대 3장,
    가득 차면 버튼이 사라진다). 실제 이미지 대신 라벨 칩으로 표시하는데, 이는 캐릭터 상세 페이지가 이미 참고 이미지를
    실제 이미지 없이 라벨 placeholder로 보여주는 기존 패턴과 맞춘 것이다.
  - 대표 이미지 "업로드"는 실제 `<input type="file">`을 연결해서 진짜 파일 선택 동작을 한다(파일을 실제로 어디
    저장하거나 미리보기하지는 않는다 — 그건 4단계 파일 저장소 연동 범위).
- **연결 지점**: `LibraryCharactersPage`의 "+ 새 캐릭터 만들기" 버튼, 그리고 사용자 요청으로 `CreateStorySetupPage`의
  "새 캐릭터 만들기"(주인공)/"캐릭터 추가"(주변 인물) 버튼도 같은 팝업을 띄우도록 추가로 연결했다. 주인공은 생성 시
  캐릭터 선택 드롭다운의 선택값으로 반영되고(`Dropdown`에 `value`/`options`를 넘겨 controlled로 전환), 주변 인물은
  생성할 때마다 이름이 버튼 옆에 쉼표로 나열된다. 다만 이 페이지의 캐릭터 선택은 여전히 "직접 만든 캐릭터 1명"만
  반영하는 최소 상태이고, 기존 캐릭터 목록에서 고르는 실제 드롭다운 옵션·AI 추천 등 나머지 Step2 상호작용은 여전히
  배치 D 범위다.
- **완료 알림**: 생성 성공 시 `AlertPopup`으로 "캐릭터를 만들었어요."를 띄운다. addendum 12장은 "Alert를 닫으면 해당
  요소의 상세 화면으로 이동한다"고 하지만, `LibraryCharacterDetailPage`가 아직 `:characterId`를 실제로 읽지 않고
  "김햄찌" 고정 데이터만 보여주는 상태라(배치 F 때부터 그랬음), 새로 만든 캐릭터로 이동해도 엉뚱한 내용이 보이는
  문제가 있다. 그래서 상세로 이동하지 않고 목록 맨 앞에 새 캐릭터를 추가한 채 목록에 머무르는 것으로 대신했다 —
  상세 페이지가 id별로 실제 데이터를 보여주게 되면(4단계 데이터 저장 연동) 그때 addendum 문구대로 상세 이동을 붙인다.
- **크레딧 부족 컨펌 팝업**: 새 컴포넌트 `InsufficientCreditPopup`(`src/components/common/InsufficientCreditPopup/`)과
  mock 크레딧 값 `src/mocks/credit.ts`의 `CURRENT_CREDIT_BALANCE`(1,500, 기존 Sidebar 표시값과 동일 — Sidebar도 이제
  이 상수를 가져다 쓰도록 리팩터링해서 값이 한 곳에서만 관리된다)를 만들었다. `/create/settings`, `/create/free/brief`,
  `/create/review`의 "생성"/"다시 생성" 버튼(전부 24크레딧)에 연결했다: 클릭 시 잔액을 확인하고, 부족하면 컨펌 팝업
  ("크레딧이 부족해요 / 이 작업에는 N크레딧이 필요해요...")을 띄우고 "크레딧 충전" 확인 시 `/mypage/credits/charge`로
  이동한다.
  - **현재 mock 잔액(1,500)이 항상 필요 크레딧(24)보다 많아서, 정상적으로 테스트하면 이 팝업이 뜨는 걸 볼 수 없다.**
    이건 버그가 아니라 로직이 올바르게 항상 "충분함" 분기를 타는 것이다 — 실제로 부족 상태를 보고 싶으면
    `src/mocks/credit.ts`의 `CURRENT_CREDIT_BALANCE`를 임시로 24 미만 값으로 낮추면 된다.
  - 캐릭터 생성 팝업의 이미지 생성 버튼("N크레딧으로 이미지 생성")에는 이 체크를 연결하지 않았다 — addendum 15장이
    "현재 정확한 차감량이 확정되지 않았으므로 Figma에는 N크레딧으로 표시한다"고 명시했고 실제로 Figma에도 숫자가 아닌
    "N"이 그대로 쓰여 있어서, 존재하지 않는 숫자를 지어내 비교 로직을 만들지 않았다. 실제 차감량이 정해지면 그때
    `InsufficientCreditPopup`을 재사용해서 붙이면 된다.

## 배치 D 확인 결과 (완료, 사용자 브라우저 확인 완료)

- `CreateStorySetupPage`(스토리 영상 Step2)의 세계관·스토리 영역을 실제로 상호작용하게 만들었다. 배치 B(2단계) 때는
  Figma 기본 노출 상태(세계관 "새로 만들기", 스토리 "새 이야기 만들기") 그대로 정적으로만 구현했었는데, 그 기본값을
  그대로 유지한 채(`worldMode`/`storyMode` 초기값 `'new'`) 다른 옵션을 클릭했을 때도 전환되도록 만들었다.
  - 세계관: `기존 세계관 선택`(드롭다운 선택) / `새 세계관 만들기` / `사용하지 않기` 3가지 모드. `새 세계관 만들기`
    모드일 때만 textarea + "N크레딧으로 AI 추천" 버튼이 보인다.
  - 스토리: `새 이야기 만들기` / `이전 이야기 이어가기` 2가지 모드. `새 이야기 만들기` 모드일 때만 textarea + AI 추천
    버튼이 보인다.
  - **예외 정책(addendum 4.3)**: 세계관을 `새 세계관 만들기`로 바꾸면 스토리가 `이전 이야기 이어가기` 상태였어도
    자동으로 `새 이야기 만들기`로 되돌아가고, `이전 이야기 이어가기` 드롭다운 자체가 `disabled`된다(새 세계관에는
    이어갈 기존 스토리가 없다는 정책적 이유 그대로).
  - textarea는 배치 B 때 정적 placeholder `<p>`였던 것을 진짜 `<textarea>`(글자수 카운터 실시간 반영, `maxLength`
    1,000/500)로 바꿨다.
  - "N크레딧으로 AI 추천" 버튼은 클릭하면 0.7초간 "추천 중..."으로 바뀌었다가 mock 추천 문구로 textarea를 채운다
    (기존 라이브러리 세계관·스토리 상세 페이지의 목데이터 문구를 재사용해서 세계관을 톤을 맞췄다). 사용자가 이후
    자유롭게 수정할 수 있다(addendum 4.2/4.3 "사용자는 결과를 직접 수정할 수 있다").
- **더보기 메뉴 클리핑 버그 수정**: `LibraryCharactersPage`의 카드(`.card`)에 있던 `overflow: hidden`이 `CardMenu`
  드롭다운 패널을 카드 테두리 안에서 잘라버리는 문제가 있었는데(배치 B 때는 몰랐던 부분), 사용자가 직접 발견해서
  캐릭터 카드에서 그 속성을 지웠다. 같은 문제가 `LibraryVideosPage`의 영상 카드에도 그대로 있어서 동일하게
  `overflow: hidden`을 제거해 맞췄다(썸네일의 위쪽 두 모서리가 카드의 둥근 모서리보다 아주 살짝 각지게 보일 수
  있는 트레이드오프가 있지만, 더보기 메뉴가 아예 안 보이는 것보다 낫다고 판단했다).
- **"세계관·스토리 생성·수정 폼"**: 처음엔 캐시된 Figma 페이지 metadata 덤프에서 "만들기"/"수정" 키워드로 찾아봤을 때
  안 보여서 "디자인이 없다"고 판단해 보류했었는데, 사용자가 실제로는 있다고 알려줘서 `get_metadata`(nodeId `0:1`)를
  새로 호출해 다시 찾았다 — 세션 중 Figma 파일이 계속 바뀌기 때문에 캐시를 오래 신뢰하면 안 된다는 교훈.
  `라이브러리 - 세계관 만들기/수정`(`203:1808`), `라이브러리 - 세계관 만들기/수정`(`203:1893`)을 찾아서 이번 배치에서
  마저 구현했다.
  - 둘 다 팝업이 아니라 **독립된 페이지**다(라이브러리 상세처럼 LNB/헤더가 있는 전체 화면, 콘텐츠 폭 850px).
    새 라우트: `/library/worlds/new`, `/library/worlds/:worldId/edit`, `/library/stories/new`,
    `/library/stories/:storyId/edit` — 같은 컴포넌트(`LibraryWorldFormPage`/`LibraryStoryFormPage`)를
    `useParams()`로 `:worldId`/`:storyId` 유무를 봐서 생성/수정 모드를 나눈다(존재하면 수정 모드, 버튼 문구도
    "OO 만들기" ↔ "수정 완료"로 바뀐다 — addendum 11.2/11.3 그대로).
  - 세계관 폼 필드: 세계관 이름 / 한 줄 설명 / 상세 설명 / 시간·공간 배경(두 칸) / 세계관 규칙 / 금지 설정 /
    연결 캐릭터(드롭다운) / AI 추천. 스토리 폼 필드: 스토리 제목 / 세계관(드롭다운) / 등장 캐릭터(드롭다운) /
    이야기 형식(옴니버스·이어쓰기, 드롭다운) / 줄거리 / 상세 이야기 / 이전 이야기(드롭다운) / AI 추천.
    전부 Figma metadata에서 라벨·placeholder 문구를 그대로 가져왔다.
  - 인풋/텍스트에어리어 스타일이 기존 공통 `Input` 컴포넌트(테두리 `$color-text`, radius 10px)와 다르다
    (테두리 `#ddd`, radius 8px, 라벨 폭 140px) — Figma 실측이 그렇게 되어 있어서 공통 컴포넌트를 억지로 재사용하지
    않고 이 두 페이지 전용 스타일로 새로 만들었다(배치 E 확인 결과의 "라이브러리는 공통 컴포넌트와 다른 형태 허용"
    선례와 같은 판단).
  - AI 추천 버튼은 `CreateStorySetupPage`와 동일하게 0.7초 로딩 후 mock 문구로 주요 필드(세계관은 "상세 설명",
    스토리는 "줄거리")를 채운다.
  - **수정 모드의 초기값은 기존 상세 페이지(`LibraryWorldDetailPage`/`LibraryStoryDetailPage`)의 고정 목데이터
    ("햄찌네 회사생활", "김햄찌의 첫 출근")를 그대로 가져와 채웠다.** 다만 상세 페이지 자체가 아직 `:worldId`/`:storyId`별
    실제 데이터를 보여주지 않는 정적 페이지라서(배치 F 이후 계속 있던 제약, 배치 C에서도 같은 이유로 캐릭터 상세 이동을
    생략했었다), 이 폼도 "어떤 세계관을 수정하든 항상 햄찌네 회사생활 값으로 채워짐" 수준의 한계가 있다. 실제 id별
    데이터 저장이 붙는 4단계 이후 제대로 연결된다.
  - 제출(생성/수정) 성공 시 `AlertPopup` 표시 후 목록 또는 상세로 돌아간다. **다만 라이브러리 목록 페이지들은
    각자 자기 `useState` 배열만 관리하고 폼은 별도 페이지라서, 폼에서 만든 새 세계관/스토리가 목록으로 돌아갔을 때
    실제로 목록에 추가되지는 않는다**(캐릭터 생성 팝업은 같은 페이지 안의 상태라 추가됐던 것과 다른 점). 이것도
    실제 저장소가 붙기 전까지의 한계로 남겨뒀다.

## 배치 E 확인 결과 (완료, 브라우저 미검증)

- **검색·필터·정렬**을 4개 라이브러리 목록(영상/캐릭터/세계관/스토리) 전부에 실제로 연결했다. `useMemo`로 검색어(제목/이름
  부분 일치) + 상태·제작방식·작성방식·스토리유형 필터(정확히 일치) + 정렬(최근/오래된 순, 배열 뒤집기)을 조합해서
  화면에 보여줄 목록을 계산한다. 필터·정렬 값이 바뀔 때마다 다시 계산되고 원본 목데이터 배열 자체는 바뀌지 않는다.
  - 영상: 상태(게시 완료/예약 게시/게시 실패) + 제작 방식(스토리 영상/자유 영상) + 검색 + 정렬.
  - 캐릭터: 검색 + 정렬만(원래 필터 버튼이 없는 화면이었다).
  - 세계관: 작성 방식(사용자 작성/AI 추천) + 검색 + 정렬.
  - 스토리: 스토리 유형(단편/이어지는 이야기) + 검색 + 정렬.
  - 필터링 결과가 0개면 "검색 결과가 없어요." 문구를 보여준다(Figma에 빈 상태 디자인은 없지만, 실제로 동작하는
    검색 기능이라면 당연히 있어야 하는 최소한의 처리라고 판단해서 기존 톤(muted 텍스트)에 맞춰 추가했다).
- **필터/정렬 드롭다운**: 처음엔 네이티브 `<select>`(+`appearance:none`+절대위치 화살표)로 구현했는데, 네이티브
  select의 옵션 목록은 브라우저가 그려서 CSS로 스타일을 맞출 수 없다는 한계가 있었다. 사용자가 Figma에서 카드
  더보기 메뉴 컴포넌트(`133:348`, 배치 B의 `97:398`와 같은 계열)를 직접 선택해서 "드롭다운 옵션 디자인을 이거랑
  맞추되 아이콘은 빼라"고 알려줘서, 네이티브 select 대신 커스텀 컴포넌트 `src/components/common/FilterDropdown/`로
  다시 만들었다 — 트리거 버튼은 기존 `.filter`/`.sort` 스타일(테두리 `#d9d9d9`, radius 8px) 그대로 두고, 옵션
  목록 패널만 Figma 더보기 메뉴와 같은 톤(흰 배경, radius 10px, `box-shadow: 0px 0px 2px rgba(0,0,0,0.15)`, 행 높이
  32px, 아이콘 없이 텍스트만)으로 새로 그렸다. `includeAllOption` prop으로 "전체" 옵션이 있는 필터(상태/제작방식/
  작성방식/스토리유형)와 없는 정렬(최근/오래된 순, 옵션 2개 중 하나 필수)을 모두 지원한다.
- **카드/목록 보기 상태 로컬 스토리지 유지**: 새 훅 `src/hooks/useViewPreference.ts`를 만들어서 영상·캐릭터 라이브러리의
  `view` 상태를 `localStorage`(`aay.library.videos.view` / `aay.library.characters.view`)에 저장한다. 새로고침하거나
  다시 방문해도 마지막으로 선택한 보기 방식이 유지된다. 세계관·스토리는 보기 전환 기능 자체가 없어서 대상이 아니다.
- ⚠️ 이번에도 Chrome 브라우저 도구가 연결되지 않아 직접 화면에서 확인하지 못했다. `npm run lint`/`npm run build`만 통과했다.

### 배치 E 후속 수정 (사용자 확인 완료)

- **검색창 포커스 스타일**: 인풋 자체의 브라우저 기본 포커스 테두리(`outline`)가 인풋 박스에만 딱 맞게 그려져서
  둥근 바깥 테두리 박스와 어긋나 보였다. 인풋엔 `outline: none`을 주고, 대신 바깥 박스(`.searchInput`)에
  `:focus-within`으로 `2px solid $color-text-muted` 테두리를 준다 — 이 프로젝트에서 강조 상태에 2px 테두리를 쓰는
  기존 선례(`.viewButton`, `MyPageCreditChargePage`의 `.productSelected`)와 맞췄다.
  4개 라이브러리 페이지(영상/캐릭터/세계관/스토리) 전부 동일하게 적용.
- **더보기 아이콘 우측 정렬**: 영상·캐릭터 목록 보기의 `.colMore`에 `margin-left: auto`를 줘서 다른 열 너비 합계와
  무관하게 항상 행의 맨 오른쪽 끝에 붙도록 했다.
- **영상 목록 보기 "게시 정보" 텍스트**: 게시 실패 상태일 때만 "다시 시도해 주세요"만 보여주도록 바꿨다(기존엔
  "게시 실패 · 다시 시도해 주세요."로 상태 열과 문구가 중복됐었다). 카드 보기의 `dateLine` 표시는 그대로 뒀다
  (사용자가 "목록 보기"만 콕 집어서 요청함).
  - 예: `video.status === '게시 실패' ? '다시 시도해 주세요' : video.dateLine`
- **열 너비를 px에서 %로 전환**: Figma 실측 픽셀값(콘텐츠 폭 948px 기준)을 그대로 비율로 환산해서 적용했다
  (예: 영상 128px → 13.502%, 300px → 31.646% ...). 값 자체가 바뀐 게 아니라 같은 비율을 %로 표현한 것 — 실측
  대조 결과 원래 px 값도 이미 정확했다(980px 콘텐츠 폭에 16px 좌우 패딩 + 948px 열 합계가 정확히 맞아떨어짐).

## 배치 F 확인 결과 (완료, 브라우저 미검증)

- **우측 세로 스테퍼 클릭 시 자동 스크롤**: `CreateStorySetupPage`의 스테퍼(`캐릭터`/`세계관`/`스토리`)가 지금까지는
  클릭이 안 되는 장식용 `<span>`/`<p>`였고, 첫 번째 항목이 스크롤 위치와 무관하게 항상 `active` 상태로 하드코딩돼
  있었다. `activeStepId` state를 추가하고 각 스텝을 `<button>`으로 바꿔서, 클릭하면 `document.getElementById(stepId)
  .scrollIntoView({ behavior: 'smooth', block: 'start' })`로 해당 섹션(`#section-character`/`#section-world`/
  `#section-story`, 이미 존재하던 id)으로 스크롤하고 배지가 활성 스타일로 바뀐다.
  - **스크롤 위치를 따라가는 scroll-spy(IntersectionObserver)는 만들지 않았다** — 사용자가 스크롤을 직접 내렸을 때
    자동으로 활성 배지가 바뀌는 것까지는 요청 범위(요청 문구가 "클릭 시 자동 스크롤"이라 클릭 → 스크롤 방향만
    명시함)를 벗어난다고 판단했다. 필요하면 별도로 요청해달라.
- **남은 조건부 UI 점검 → `InfoCard` 수정 모드 구현**: Figma `40:315`("Create - 자유 영상 - step2(edit mode)")를
  확인해보니, `연출 방향`/`장면 구성`/`오디오 구성` 3개 카드가 "수정" 버튼을 누르면 각 값이 밑줄 인풋으로 바뀌고
  줄 끝에 회색 원형 X 아이콘(Tabler `circle-x-filled`, 값 지우기용으로 보임), 카드 우측에 "저장" 버튼이 나타나는
  구조였다(`Original Request` 카드는 `43:971` Save 프레임이 Figma에서 `hidden="true"`라 수정 대상이 아님 — 기존
  구현과 일치). 지금까지 `InfoCard`의 `editable`/`onEdit`은 버튼만 있고 실제 동작이 없는 no-op이었는데, 이번에
  `InfoCard.tsx` 내부에 `isEditing`/`values` state를 추가해서 실제로 동작하게 만들었다.
  - 수정 클릭 →가 값 있는 `<p>` 대신 `<input>` + 원형 X(값 비우기) 버튼으로 바뀌고 버튼 문구가 "저장"으로 바뀐다.
    다시 누르면(저장) 값이 그대로 유지된 채 보기 모드로 돌아간다(Figma에 취소 버튼이 없어서 "되돌리기"는 만들지
    않았다 — 저장 버튼만 있는 그대로 구현).
  - 적용 대상은 `CreateSettingsPage`/`CreateFreeBriefPage`의 `연출 방향`/`장면 구성`/`오디오 구성` 3개 카드
    (원래부터 `editable` prop이 붙어 있던 카드들, 페이지 코드 수정 없이 `InfoCard` 자체만 바꿔서 3곳 모두 자동으로
    동작한다). `출력 정보`/`생성 정보`/`영상 정보`처럼 `editable`이 없는 카드는 그대로 읽기 전용이다.
  - **⚠️ 의도적으로 범위에서 뺀 부분**: `장면 구성` 카드는 Figma edit mode에서 단순 값 수정 말고도 장면 추가
    (`+ Add Scene`), 장면별 삭제 아이콘, "Total duration 20/20 sec" 같은 합계 검증(초과 시 생성 버튼 비활성 —
    인접 프레임 `42:709`가 그 상태로 추정)까지 있는, `InfoCard`의 단순 label:value 편집보다 훨씬 큰 별도 기능이다.
    `SCENE_ITEMS`이 지금은 다른 카드와 같은 `{label, value}` 배열이라 우선은 나머지 두 카드와 동일하게 값만
    수정되게 두고, 장면 추가/삭제/길이 합계 검증은 이번 배치에 포함하지 않았다 — 별도로 요청하면 `InfoCard`와
    별개의 전용 컴포넌트(동적 리스트 + 검증 로직)로 다시 설계해야 한다.
  - 원형 X 아이콘은 Figma 컴포넌트가 라이브러리 인스턴스라 `get_design_context`가 300초 타임아웃으로 실패했다
    (배치 B 때와 동일한 제약). `get_metadata`로 컴포넌트명(`tabler-icon-circle-x-filled`)만 확인하고, 정확한
    벡터 path 대신 같은 모양(원 안에 X)의 직접 그린 SVG로 대체했다 — 카드 더보기 메뉴 아이콘들처럼 사용자가 노드를
    직접 선택해줘야 exact path를 뜰 수 있는데, 이번엔 기능적으로 중요하지 않은 장식 아이콘이라 우선 진행했다.
    정확한 path가 필요하면 Figma에서 해당 아이콘 노드를 선택해달라고 요청하면 된다.
- ⚠️ 이번에도 Chrome 브라우저 도구가 연결되지 않아 실제 화면에서 확인하지 못했다. `npm run lint`/`npm run build`만
  통과했다.

## 지금까지 정한 구현 방식(새 세션도 그대로 따를 것)

- 삭제 확인은 항상 `RiskConfirmPopup`(변형 확인 버튼: `dangerFilled`)을 쓰고, 일반 확인은 `ConfirmPopup`,
  단일 확인 버튼 알림은 `AlertPopup`을 쓴다. 세 컴포넌트 모두 `isOpen` prop으로 노출 여부를 제어하는
  제어 컴포넌트라 각 페이지에서 `useState`로 열림 상태를 관리한다.
- **카드/행의 더보기 메뉴**는 `src/components/common/CardMenu/CardMenu.tsx`를 재사용한다. 카드 전체가 클릭 가능한
  화면에서는 카드 바깥 요소를 `<button>`이 아니라 `role="button"` div로 만들어야 한다(더보기 버튼과 중첩 방지).
  삭제처럼 실제 상태 변경이 필요한 메뉴 항목은 목록 페이지의 목데이터 배열을 `useState`로 관리하고 `filter`로 반영한다.
- **mock 크레딧 잔액**은 `src/mocks/credit.ts`의 `CURRENT_CREDIT_BALANCE` 하나만 쓴다(Sidebar도 이걸 가져다 쓴다).
  다른 곳에 크레딧 잔액을 새로 하드코딩하지 않는다.
- **크레딧 부족 확인**은 `src/components/common/InsufficientCreditPopup/InsufficientCreditPopup.tsx`를 재사용한다
  (`requiredCredit` prop만 넘기면 됨, 확인 시 자동으로 `/mypage/credits/charge`로 이동). 단, 필요 크레딧 수치가
  아직 확정되지 않은 곳(Figma에 "N크레딧"으로만 표시된 버튼)에는 숫자를 지어내서 붙이지 않는다.
- **큰 폼이 필요한 팝업**(캐릭터 생성처럼)은 `PopupShell`(360px 확인창 전용)을 억지로 쓰지 않고 필요하면
  `CharacterCreatePopup`처럼 독립된 카드 컴포넌트를 새로 만든다.
- **라이브러리 필터/정렬 드롭다운**은 네이티브 `<select>`가 아니라 `src/components/common/FilterDropdown/FilterDropdown.tsx`를
  재사용한다(옵션 목록을 CSS로 스타일링하려면 커스텀 컴포넌트가 필요하다 — 네이티브 select는 불가능). 트리거 스타일은
  각 페이지의 `.filter`/`.sort` 클래스를 `triggerClassName`으로 그대로 넘긴다. "전체" 옵션이 있으면
  `includeAllOption`(기본 true), 필수 선택(정렬처럼)이면 `includeAllOption={false}`로 옵션 목록에 전부 넣는다.
- **카드/목록 보기 상태 유지**가 필요하면 `src/hooks/useViewPreference.ts`를 재사용한다(`localStorage` 키만 다르게
  넘기면 됨). 새 페이지에 직접 `localStorage` 코드를 새로 작성하지 않는다.
- **입력창 포커스 표시**는 인풋 자체에 `outline: none`을 주고 바깥 테두리 박스에 `:focus-within { border: 2px solid
  $color-text-muted; }`를 준다. 강조 테두리는 이 프로젝트에서 항상 2px를 쓴다(`.viewButton`, `.productSelected`와
  동일 규칙).
- **테이블형 목록의 열 너비**는 px가 아니라 Figma 실측 픽셀을 콘텐츠 폭(보통 948px, 패딩 제외) 기준 비율로 환산한
  %로 적용한다. 마지막 열(더보기 아이콘)에는 `margin-left: auto`를 같이 줘서 폭 합계에 미세한 오차가 있어도 항상
  우측 끝에 붙는다.
- **`InfoCard`(`src/components/common/InfoCard/`)의 `editable` 카드는 이제 실제로 수정 모드가 동작한다**(값이
  밑줄 인풋 + 원형 X 지우기 버튼으로 바뀌고 버튼이 "저장"으로 바뀜, 취소 없음). 단순 label:value 편집이 필요하면
  이 컴포넌트를 그대로 재사용하면 된다. 값 하나 이상을 넘어서는 동적 리스트 편집(장면 추가/삭제, 합계 검증 등)이
  필요하면 `InfoCard`를 억지로 확장하지 말고 전용 컴포넌트로 새로 설계한다 — `장면 구성` 카드가 그 예시였는데,
  이후 `ScenePlanCard`로 실제 구현했다(아래 "장면 구성 고급 편집" 참고).

### 장면 구성(Scene Plan) 고급 편집 구현 — `ScenePlanCard`

배치 F에서 "`InfoCard`의 단순 편집보다 큰 별도 기능"이라 미뤄뒀던 장면 추가/삭제 + 길이 합계 검증을, Figma
`40:315`(정상 범위)/`42:709`(초과 시 Save 비활성화 변형)를 다시 확인해서 새 컴포넌트
`src/components/common/ScenePlanCard/`로 구현했다.

- **데이터 모델을 바꿨다**: 기존 `SCENE_ITEMS`(`{label:'0~5초', value:'...'}`, 보기 모드 그대로의 문자열)를
  `SCENES`(`{id, durationSec, description}`)로 교체했다 — 보기 모드의 "0~5초" 같은 구간 라벨은 이제 각 장면의
  `durationSec`을 앞에서부터 누적해서 매번 계산한다(장면 길이가 바뀌면 구간 라벨도 자동으로 맞게 바뀐다).
- **편집 모드**: 장면마다 빨간 원형 마이너스(삭제) 아이콘 + `scene N` 라벨 + 밑줄 처리된 길이 입력(숫자, "sec"
  단위 고정) + 밑줄 처리된 설명 입력(+ 기존 `InfoCard`와 같은 원형 X 지우기 버튼). 하단에 "+ 장면 추가"
  버튼(Figma 그대로 원형 플러스 아이콘 + 테두리 버튼)과 "전체 길이 X/20초" 카운터가 있다.
- **길이 초과 검증**: 전체 길이가 20초를 넘으면 카운터 숫자가 빨간색(`$color-danger`)으로 바뀌고, "저장" 버튼이
  비활성화된다(Figma `42:709`의 회색 Save 버튼과 동일 — `$color-disabled-bg`). 저장 버튼이 비활성화된 동안은
  수정 모드를 빠져나갈 수 없다(초과 상태로 저장이 안 되게 막는 게 Figma 의도와 맞다고 판단).
- **`InfoCard`의 "수정"/"저장" 버튼 스타일도 이번에 Figma 실측대로 고쳤다**: 기존엔 "수정"↔"저장" 텍스트만
  바뀌고 스타일(흰 배경, `#555` 테두리/글자)은 그대로였는데, Figma를 보니 편집 중일 때의 "Save"는 **채워진
  버튼**(배경 `$color-text-muted`, 흰 글자)이었다. `InfoCard.module.scss`에 `.editButtonActive` modifier를
  추가해서 편집 중에만 채워진 스타일이 적용되게 고쳤다(연출 방향/오디오 구성 카드도 함께 정확해졌다) —
  `ScenePlanCard`도 같은 클래스를 재사용해서 저장 비활성화 시 회색으로 바뀌는 것까지 일관되게 처리했다.
- 아이콘(삭제 원형 마이너스, 추가 원형 플러스)은 Figma의 실제 SVG 벡터를 그대로 가져와 인라인으로 넣었다
  (`#D00000`/`#555555` 스트로크, 배치 F 때 근사치로 그렸던 원형 X 지우기 아이콘과 달리 이번엔 정확한 원본
  path를 받아왔다).

## 배치 이후 추가 작업: 결제 Mock 흐름 + GA4 연동 + 생성/게시 완료 파이프라인

3단계 배치 A~F 완료 후, `spec-addendum-credit.md` 24장 "현재 프론트엔드 단계" 범위로 진행한 작업이다.

### 결제 Mock 흐름 (완료)

- `MyPageCreditChargePage`의 "결제하기"가 `src/mocks/credit.ts`의 `requestCreditPayment()`를 호출한다. PG 솔루션이
  붙으면 이 함수 내부만 교체하면 되는 구조다. 지금은 0.7초 뒤 `MOCK_PAYMENT_RESULT`(기본 `'success'`)를 반환한다 —
  실패 케이스를 보려면 이 값을 잠깐 `'failure'`로 바꿔서 테스트한다(크레딧 잔액 mock과 동일한 방식).
- 결제 성공("크레딧 충전이 완료되었어요")/실패("크레딧 충전에 실패했어요") 모두 공통 `AlertPopup`을 재사용하고
  내용(description)은 없다. 이를 위해 `AlertPopup`/`PopupShell`의 `description`을 옵셔널로 바꿨다.
- 확인 버튼 동작은 진입 경로로 분기한다: `InsufficientCreditPopup`이 충전 페이지로 이동할 때
  `navigate(..., { state: { returnTo: 현재경로 } })`로 원래 페이지를 함께 넘기고, 충전 페이지는 `returnTo`가 있으면
  (생성 중 진입) 확인 시 그 페이지로 돌아가고 없으면(마이페이지에서 직접 진입) 팝업만 닫는다.

### 생성/게시 완료 파이프라인 보강 (완료)

GA4의 `video_creation_completed`/`publish_completed`가 addendum 21장 "주요 이벤트" 5개 중 2개인데, 실제로 붙일 완료
시점 자체가 없었다 — `CreateGeneratingPage`가 진행률 12%·"다음" 버튼 `disabled` 고정이었고 `CreatePublishPage`의
"게시하기" 버튼은 `onClick`이 아예 없었다(2단계 정적 화면 이후 3단계 배치들에서 빠졌던 부분). 이번에 함께 고쳤다.

- `CreateGeneratingPage`: 진입 3초 뒤 mock으로 완료 처리(진행률 100%, 4개 작업 항목 전부 완료 아이콘, "다음" 버튼
  활성화). 여러 단계로 나눠 애니메이션하지 않고 한 번에 완료로 전환하는, 이 프로젝트의 기존 mock 패턴(AI 추천
  버튼의 0.7초 단일 전환)과 동일한 방식을 따랐다.
- `CreatePublishPage`: "게시하기" 클릭 → 0.7초 "게시 중..." → 완료. 완료 팝업은 spec 6.4에 정의된 정식 디자인
  (Figma 노드 `63:1833`)대로 새 컴포넌트 `src/components/common/PublishCompletePopup/`로 구현했다. 처음엔
  Figma MCP 서버가 끊겨서 공통 `AlertPopup`(단일 버튼)으로 임시 대체했었는데, **사용자가 정식 디자인대로 다시
  만들어달라고 요청해서 교체했다.**
  - 구조: 브랜드 `Aaaay!` + 타이틀 "게시가 완료되었습니다." + 플랫폼·제목·채널명 정보 박스(라벨/값 2열, `InfoCard`와
    같은 톤이지만 이 팝업 전용으로 새로 그렸다 — `InfoCard`는 제목+수정 버튼이 있는 카드 레이아웃이라 이 팝업의
    "타이틀 없는 순수 정보 박스" 구조와 안 맞아서 재사용하지 않았다) + 버튼 2개("게시물 보기"/"홈으로").
  - 팝업 바깥 껍데기(`dim`/`card`/`brand`/`title`)는 새로 안 만들고 `src/components/common/Popup/Popup.module.scss`의
    기존 클래스를 그대로 import해서 재사용했다(치수가 Figma 실측과 정확히 일치: 카드 360px, 패딩 30px, gap 26px).
  - 버튼도 새로 안 만들고 기존 `Button` 컴포넌트를 그대로 썼다 — "게시물 보기"는 Figma 실측(테두리·글자 `#555`)이
    `variant="secondary"`와 정확히 일치, "홈으로"는 Figma가 `#333` 배경이라 기존 `variant="primary"`(`$color-black`
    `#000`)와 완전히 같은 색은 아니지만 이 프로젝트의 표준 진한 버튼이 `primary`이므로 그대로 재사용했다(육안 구분이
    거의 안 되는 수준의 차이).
  - 플랫폼 아이콘은 기존에 이미 있던 `src/assets/platforms/youtube.png`를 재사용했다(`CreateStoryPage`에서 쓰던
    것과 동일 파일, 새로 받아오지 않았다).
  - **"제목"/"채널명" 값은 실제 데이터가 없어서(제목 입력칸이 정적 placeholder) Figma에 있는 샘플 문구를 그대로
    mock으로 넣었다**: "샘플로 입력한 제목입니다." / "마호의유튜브" (`PublishedPage`의 `PUBLISHED_TITLE`/
    `PUBLISHED_CHANNEL_NAME` 상수). 실제 제목 입력이 붙으면 그 값으로 교체하면 된다.
  - "게시물 보기" 버튼은 실제로 연결할 게시물 URL이 없어서 클릭해도 동작이 없다(더보기 메뉴의 다운로드/수정처럼
    대상 기능이 없는 항목은 그대로 두는 이 프로젝트의 기존 패턴과 동일).
- **게시 설정 화면의 "제목"/"게시글 내용" 입력칸을 실제 입력 가능하게 바꿨다**: 정적 placeholder `<p>`였던 걸
  각각 `<input>`/`<textarea>`로 교체했다(Figma `63:1695` 확인 결과 글자수 카운터는 없어서 추가하지 않았다).
  게시 완료 팝업의 "제목" 값은 `postTitle.trim() || PUBLISHED_TITLE`로 연결해서, 사용자가 실제로 제목을 입력하면
  그 값을 보여주고 비워두면 기존 Figma 샘플 문구로 대체한다.
  - "게시하기"의 제목/게시글 내용 입력칸은 여전히 정적 placeholder 문단이라(실제 `<textarea>`가 아님) 아무 값도
    입력할 수 없다. 이번 작업 범위(GA4 이벤트를 위한 완료 지점 확보)에 포함하지 않았고, 완료 팝업에도 실제 입력
    제목 대신 플랫폼·계정 정보만 넣었다.
- `src/router/createFlow.ts`에 `useCreateGenerationMeta()`를 추가했다 — 기존 `useCreateFlow()`(flow만 읽음)에 더해
  `duration`/`ratio`/`retryCount`를 라우터 state로 이어 받는다. 생성 시작(`CreateSettingsPage`/`CreateFreeBriefPage`)
  → 생성 중 → 검토 → 게시까지 이 값들을 계속 실어 나른다.

### GA4 연동 (완료, 측정 ID 대기 중)

- 공통 모듈 `src/lib/analytics.ts`: `initAnalytics()`(gtag.js 로드, 개발 환경에서 `debug_mode: true`로 DebugView
  노출), `setAnalyticsUserId()`(로그인/로그아웃 시 user_id 설정용 — 실제 로그인이 없어서 아직 호출하는 곳 없음),
  `trackEvent()` + 이벤트별 타입 있는 헬퍼 함수들. `initAnalytics()`는 `main.tsx`에서 앱 시작 시 한 번 호출한다.
- 측정 ID는 `VITE_GA4_MEASUREMENT_ID` 환경변수로 관리한다(`.env.example`에 변수명만 기록, 실값은 `.env.local`).
  **사용자가 GA4 속성을 만들고 측정 ID를 알려주면 `.env.local`에 채워 넣어야 실제로 이벤트가 전송된다** — 그 전까지는
  `trackEvent`가 조용히 no-op한다.
- **이번에 연결한 이벤트**: `character_created`(`CharacterCreatePopup` 제출 시), `world_created`/`story_created`
  (각 폼의 생성 모드 제출 시, 수정 모드는 제외), `video_creation_started`(생성 버튼 클릭 시, `CreateSettingsPage`/
  `CreateFreeBriefPage`), `video_creation_completed`+`credit_spent`(생성 완료 시, `CreateGeneratingPage`),
  `generation_retry`(검토 화면 "다시 생성"), `review_completed`(검토 완료 → 게시 설정 이동),
  `publish_completed`(게시 완료), `credit_insufficient`(크레딧 부족 팝업 노출 시점 3곳),
  `view_item_list`/`select_item`/`begin_checkout`/`purchase`/`payment_failed`(크레딧 충전 페이지).
- **의도적으로 제외한 이벤트**: `sign_up`/`login`/`youtube_connected`는 실제 Google 인증이 없어서(4단계 범위) 제외
  했다 — 가짜 완료를 진짜처럼 보내지 않기 위함. `free_credit_granted`/`weekly_credit_claimed`/`credit_refunded`/
  `credit_expired`/`refund`/`publish_failed`/`video_creation_failed`/`onboarding_started`도 그 상태를 만들어낼 실제
  mock 트리거가 없어서(무료 크레딧 지급, 주간 지원 수령, 생성/게시 실패 흐름 전부 미구현) 제외했다. 필요해지면
  해당 mock 흐름을 먼저 만들고 붙여야 한다.
- `.env.local`이 없어도(=측정 ID가 없으면) `initAnalytics()`가 아무 것도 하지 않고 조용히 끝나므로, 지금 상태로
  빌드/실행해도 에러는 없다.

### GA4 DebugView 검증 — 보류 (계정/속성 단 이슈로 추정, 코드 문제 아님)

배치 이후 실제 측정 ID(`G-57RQEMX8FD`)를 받아 로컬/배포 환경 모두에서 장시간 검증을 시도했으나, GA4 DebugView·
실시간 보고서 어디에도 데이터가 전혀 잡히지 않았다. 원인을 좁히기 위해 다음을 전부 확인했고 전부 정상이었다:

- `gtag.js` 스크립트 정상 로드(200, 실제 라이브러리 응답 확인), `dataLayer`/`gtag` 정상 동작, 콘솔 에러 없음
- 측정 프로토콜 `collect` 엔드포인트에 직접 요청 시 204(성공) 응답
- 배포 번들에 측정 ID 정상 포함(로컬 빌드는 처음부터 정상, GitHub Actions 빌드는 `.env.local`이 CI에 없어서
  비어 있던 걸 발견해서 리포지토리 Actions 변수(`VITE_GA4_MEASUREMENT_ID`)로 전달하도록 고쳤다 — 이건 실제
  버그였고 고쳤다)
- 광고 차단 확장, hosts 파일, DNS, 시스템 프록시, Windows Defender 네트워크 보호, Chrome 엔터프라이즈 정책 —
  전부 차단 요소 없음 확인
- Chrome/Edge/시크릿/게스트 모드, PC와 휴대폰(다른 통신사 데이터망)까지 동일 증상
- 완전히 새로 만든 GA4 속성(측정 ID `G-T88X6Q6DWC`)에서도 동일 증상 재현 — 기존 속성 설정 문제도 아님
- 구글 공식 진단 도구(Tag Assistant)에서도 "연결되지 않음"/"이 태그는 조회를 보내지 않았습니다" 표시

즉 코드·빌드·네트워크·브라우저·속성 설정 전부 정상인데도 데이터가 전혀 수집되지 않는 상태이고, 남아 있는 유일한
공통 변수는 "테스트에 사용한 구글 계정" 하나뿐이다(다른 계정으로 교차 검증은 사용자가 접근 가능한 다른 계정이
없어서 시도하지 못했다). **사용자 판단으로 이 단계에서는 GA4 DebugView 실검증을 보류하기로 했다.** 코드는
그대로 두고(`initAnalytics()`/이벤트 연결 전부 정상 구현 상태), 나중에 다른 구글 계정으로 교차 검증하거나
구글 애널리틱스 고객센터에 문의할 상황이 되면 그때 다시 확인한다. `VITE_GA4_MEASUREMENT_ID`는 현재
`G-T88X6Q6DWC`(새로 만든 속성)로 맞춰져 있다.
