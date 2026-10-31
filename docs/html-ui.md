# HTML UI / APK 기능 기준

디자인 원본은 상위 작업 폴더의 `BoB_handoff/prototype`이다. `Main.html`을 홈 기준으로 사용한다. `HomeA/B/C.html`은 대안 시안이다. 기능 원본은 `BOB_ANDROID/app/src/main/java/com/bob/buyorbye`의 Repository, Domain, BobViewModel과 화면에서 수행하는 API 작업이다.

| HTML | Expo 화면 |
|---|---|
| Main | `src/screens/html/dashboard.tsx` Home |
| AddMethod | `registration.tsx` Add |
| ScanReview | `registration.tsx` Drafts |
| AddReason | `registration.tsx` Drafts의 품목별 이유 선택 |
| DiscountTrap | `discount.tsx` Discount |
| DailyCheck / SwipeYes·No·Unsure | `observation.tsx` Question |
| SimResult | `observation.tsx` Result |
| PostCheck | `observation.tsx` Review |
| Goal / GoalDone / GoalShelf | `dashboard.tsx` Goal, GoalDone, Shelf |
| GoalSetup / GoalSetupFirst | `pages.tsx` GoalSetup |
| Budget | `pages.tsx` Wallet, Budget |
| Report | `dashboard.tsx` Report |

공통 헤더·하단 아이콘 탭·하단 고정 버튼·상품 행은 `shared.tsx`, 색상·간격·글꼴은 `src/theme/tokens.ts`에 있다. HTML의 IBM Plex Sans KR와 밝은 배경을 사용한다. 실제 휴대폰에서는 가짜 상태 표시줄 대신 OS 안전 영역을 사용한다.

## 실제 데이터 표시

- HTML 예시의 상품·잔액·달성률·통계는 앱 데이터에 넣지 않는다. 해당 계정의 API 응답을 표시한다.
- 등록 화면에서 제외한 항목은 **미등록 초안**에서만 제외한다. 홈·전체 기록의 서버 물품은 삭제하지 않는다.
- 이유 선택은 HTML처럼 한 품목씩 진행한다. 마지막 품목에서 APK의 등록 기간 미리보기와 할인 검토를 수행하고, 최종 등록 성공 뒤 초안만 비운다.
- 기간 배지는 서버의 `/registration-previews` 응답에 표시한다. 분석 초안에 기간이 없는 경우 시안의 가격 구간을 임의로 적용하지 않는다.
- 질문이 YES/NO/UNSURE 세 선택지이면 스와이프와 원형 버튼을 사용한다. INTEGER/TEXT/OBJECT 등 APK 서버의 다른 질문 규격에는 해당 입력을 표시한다. 숫자 질문을 임의로 예/아니오로 바꾸지 않는다.
- 결과의 날짜 칸은 실제 로컬 답변 유무를 나타낸다. 숫자·문장 답변을 임의의 사용/미사용 판정으로 바꾸지 않는다. 결과 요약·예상 사용일·사용일당 비용은 서버 값을 사용한다.
- 목표의 빠른 소비 선택은 서버 `/impulses`로 계산한다. 참기·구매·취소, 예산·지출 CRUD, 목표 FIRST/CHANGE/NEXT 기능을 유지한다.
- 사진 업로드의 `expo/fetch` + `expo-file-system File` 전송과 기존 계정 유지 처리를 그대로 사용한다.
- HTML에 없는 전체 기록·알림 설정·등록 기간 확인은 동일한 공통 디자인으로 표시한다.

## 확인 방법

`scripts/html-reference.cjs`는 원본 HTML을 Chrome으로 렌더링해 `.expo/html-reference`에 캡처한다. 원본에 요청된 웹 글꼴은 프로젝트에 설치된 동일 글꼴로 대체해 네트워크 변수를 줄인다. 실행은 작업 폴더에 원본 HTML이 있는 환경에서만 가능하다.

`scripts/apklike-smoke.cjs`는 export된 Expo 웹 앱을 390px 화면으로 실행하고 `.expo/apklike-qa`에 실제 화면을 저장한다. API는 fixture로 대체한다. 사진 연속 등록·새로고침·401 계정 유지·목표·지갑·로컬 질문·Buy/Bye·점검·즉석 소비·할인 등록을 검증한다.

타입 검사·ESLint·Jest와 Android/iOS Hermes export도 수행한다. 웹 캡처 검증은 실제 Android Expo Go에서의 실서버·키보드·사진 권한·백그라운드 알림 검증을 대신하지 않는다. APK의 WorkManager/Firebase 백그라운드 알림은 Expo Go의 지원 범위를 넘으므로 기존 제한이 남아 있다.
