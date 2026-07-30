# Figma 프레임 ID 매핑

Figma 파일 `AAY` (`https://www.figma.com/design/s1vcVinETNj4YPpZH4z35B/AAY`) 페이지 1의 전체 프레임 목록이다.
매 단계마다 페이지 전체를 다시 조회하지 않도록, `mcp__figma-desktop__get_metadata`(nodeId: `0:1`)로 확인한 결과를 기록해둔다.
개별 화면 작업 시 아래 nodeId로 `get_design_context` / `get_screenshot` / `get_variable_defs`를 바로 호출한다.

| 화면(Figma 프레임명) | node id | 대응 스펙 |
|---|---|---|
| Landing | `1:2` | 5.1 랜딩 |
| Home | `53:102` | 5.2 홈 |
| Create - 작업 방식 선택 | `53:299` | 5.3 작업 방식 선택 |
| Create - 템플릿 적용 - step1 | `53:202` | 5.4 템플릿 적용 플로우 |
| Create - 템플릿 적용 - step2 | `53:472` | 5.4 템플릿 적용 플로우 |
| Create - 템플릿 적용 - step3 | `63:699` | 5.4 → `/create/settings` (AI 기획 확인 + 출력/생성 정보). 직접 만들기 플로우와 공유되는 라우트 |
| Create - 템플릿 적용 - step4 | `63:905` | 5.6 영상 생성 중 → `/create/generating`. 공유 라우트 |
| Create - 템플릿 적용 - step5 | `63:1399` | 5.7 영상 검토 → `/create/review`. 공유 라우트 |
| Create - 템플릿 적용 - step6 | `63:1695` | 5.8 게시 설정 → `/create/publish`. 공유 라우트 |
| Create - 직접 만들기 - step1 | `5:2` | 5.5 → `/create/manual` (아이디어 입력). 배치 C 완료 |
| Create - 직접 만들기 - step2 | `14:119` | 5.5 → `/create/manual/brief` (AI 기획 확인). 배치 C 완료 |
| Create - 직접 만들기 - step2(edit mode) | `40:315` | `14:119`의 "수정" 버튼 클릭 시 편집 모드 변형. 3단계(상태) 범위, 배치 C에서는 미구현 |
| Create - 직접 만들기 - step2(edit mode) | `42:709` | 위와 동일 + 필수값(장면 길이 합) 초과로 생성 버튼 비활성화된 변형 |
| Create - 직접 만들기 - step3 | `39:160` | 5.6 → `/create/generating` (생성 중). 템플릿 플로우와 공유되는 라우트. 배치 D 대상 |
| Create - 직접 만들기 - step4 | `63:1211` | 5.7 → `/create/review`. 템플릿 플로우(`63:1399`)와 내용은 동일하고 상단에 5단계 가로 스테퍼만 추가로 있음 |
| Create - 직접 만들기 - step5 | `63:1504` | 5.8 → `/create/publish`. 템플릿 플로우(`63:1695`)와 내용은 동일하고 상단에 5단계 가로 스테퍼만 추가로 있음 |
| 라이브러리 - 영상 | `72:194` | 5.9 라이브러리 → `/library/videos`(구 `/library`, 배치 F에서 라우트 이전). 배치 E 완료 |
| 라이브러리 - 영상 상세 | `97:221` | 5.10 영상 상세 → `/library/videos/:videoId`(구 `/library/:videoId`). 배치 E 완료, 배치 F에서 공통 상세 헤더로 개정 |
| 라이브러리 - 캐릭터 | `133:265` | addendum → `/library/characters`. 배치 E 때는 "영상" 탭을 복사한 placeholder였으나, addendum과 함께 실제 디자인이 생겨 배치 F에서 구현 완료 |
| 라이브러리 - 캐릭터 상세 | `158:310` | addendum → `/library/characters/:characterId`. 배치 F 완료. (동일 내용의 중복 프레임 `151:395`는 사용자가 Figma에서 삭제함) |
| 라이브러리 - 세계관 | `133:444` | addendum → `/library/worlds`. 배치 E 때는 placeholder였으나 배치 F에서 실제 구현 완료 |
| 라이브러리 - 세계관 상세 | `151:750` | addendum → `/library/worlds/:worldId`. 배치 F 완료 |
| 라이브러리 - 스토리 | `151:858` | addendum → `/library/stories`. 배치 F 완료 |
| 라이브러리 - 스토리 상세 | `151:990` | addendum → `/library/stories/:storyId`. 배치 F 완료 |
| 마이페이지 | `105:234` | 5.11 마이페이지 |
| 완료 팝업(공통) | `63:1833` | 6.4 게시 완료 팝업 |
| 컨펌 팝업(공통) | `105:413` | 6.3 일반 컨펌 |
| 컨펌 팝업(위험 실행) | `105:444` | 6.3 위험 컨펌 |
| 얼럿 팝업(공통) | `105:434` | 6.3 얼럿 |
| 컨펌 팝업(캐릭터 생성/설명으로 만들기) | `132:237` | 5.4/5.5 캐릭터 설정 하위 팝업 |
| 컨펌 팝업(캐릭터 생성/이미지로 만들기) | `133:682` | 5.4/5.5 캐릭터 설정 하위 팝업 |

## 참고

- 직접 만들기 플로우에는 템플릿 플로우의 `/create/settings`에 해당하는 별도 "설정" 단계가 없다. `14:119`(AI 기획 확인) 화면 자체가
  출력 정보·생성 정보를 함께 보여주고, 다음 단계로 바로 `39:160`(생성 중)으로 넘어간다. 상세 근거는
  `docs/spec/phase2-batches.md`의 "배치 C 확인 결과" 참고.
- "라이브러리 - 캐릭터"(`133:265`), "라이브러리 - 세계관"(`133:444`)은 배치 E 시점엔 "영상" 탭을 복사해놓은 미완성 상태였지만,
  `docs/spec/spec-addendum.md`와 함께 Figma에 실제 디자인(캐릭터 카드형, 세계관/스토리 가로 리스트형)이 추가돼 배치 F에서 구현했다.
- 이 표는 Figma 파일이 수정되면 최신 상태가 아닐 수 있다. node id 조회가 실패하면 이 표를 맹신하지 말고 `get_metadata`로 재확인한다.
