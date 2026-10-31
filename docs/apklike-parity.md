# apklike 브랜치

`BOB_ANDROID/app/src/main/java/com/bob/buyorbye/`의 Repository, BobViewModel, Domain 및 화면 파일을 기준으로 Expo의 데이터 흐름을 옮겼다. 기존 Expo의 로컬 계산 화면 대신 서버 응답을 사용하는 `/apk/[page]`로 진입한다. 기존 URL도 새 흐름으로 연결된다.

## 실행

기존 `apklike`는 GitHub에 있으며, 이번 HTML UI 수정은 로컬에만 적용한다. 최신 UI를 다른 사람이 받으려면 별도로 push해야 한다.

```sh
git switch apklike
npm ci
npx expo start --go --clear
```

실제 서버 기본 주소는 `https://bob-be.vercel.app`이다. 기존 `.env` 또는 `.env.local`에 다른 서버 주소가 있으면 수정한다. 별도 환경변수 파일 생성은 필수가 아니다. 같은 Wi-Fi에서 새 QR을 스캔한다.

## APK 기준으로 연결한 기능

| 기능 | API와 상태 처리 |
|---|---|
| 게스트 계정 | 최초 요청을 하나로 합쳐 발급, 기존 토큰 재사용, 401 시 계정 자동 교체 금지 |
| 홈·전체 기록 | `GET /home`, `GET /items?limit=100&offset=…` 서버 조회 |
| 사진·URL·직접 입력 | `/cart-extractions`, `/product-url-drafts`, `/item-drafts` → 영속 초안 |
| 사진 재선택 | 이전 사진 초안 교체/추가 선택. 실패·취소 시 기존 초안 유지. 등록 완료 물품은 영향 없음 |
| 최종 등록 | 초안 확인 → 이유·마감일 → `/registration-previews` → `/items/batch`. 성공 후 초안만 비우고 홈 조회 |
| 할인 함정 | 필요 물품 ON/OFF, 정액/정률·배송비, `/discount-previews`, `discount_review`로 선택 결과 등록 |
| 오늘·질문 | `/today`, LOCAL 질문 생성, 기기 내 답변 저장·수정·재시작 복원 |
| 결과·결정·사후 점검 | 관찰 완료 시 로컬 답변 요약 전송. BUY/HOLD/GIVE_UP, 실제 구매액, 14일 사용 범주 점검 |
| 목표·진열장 | FIRST/CHANGE/NEXT, 저축 이관, 시작액 미리보기, 상품 링크, 진열장 조회 |
| 즉석 소비 비교 | `/impulses`, 참기/구매/결정 취소, 서버 계산 결과 표시 |
| 지갑·리포트 | 월별 예산, 수동 지출 등록·수정·삭제, 서버 월별 리포트 |
| 뒤로 이동 | APK의 페이지별 목적지 매핑. 이동해도 영속 초안·서버 물품은 삭제하지 않음 |

화면 디자인의 기준은 `BoB_handoff/prototype/*.html`이다. APK의 Kotlin UI를 복제하지 않는다. HTML의 헤더, 카드, 색상, 간격, 하단 탭과 고정 버튼을 React Native로 구현하며, APK의 서버 데이터·등록·계정·질문 저장 흐름에 연결한다. 자세한 대응은 [HTML UI 기준](html-ui.md)을 참고한다.

## 저장과 호환

- 서버 물품 ID·상태·금액이 원본이다. 기존 `bob-data`의 로컬 가상 물품으로 덮어쓰지 않는다.
- `bob-guest-token`은 재사용한다. 기존 앱에서 서버에 실제 등록된 물품은 같은 토큰으로 조회한다.
- `bob-apklike-local-v1`에 초안, 질문·답변, 등록 재시도 키, 이미지 crop, 요약 캐시를 저장한다. 토큰이 바뀌면 로컬 기록을 조용히 초기화하지 않고 오류로 중단한다.
- 기존 Expo의 `bob-data`를 삭제하지 않는다. 이 저장소의 미전송 가상 물품·질문은 서버 ID와 연결할 근거가 없어 자동 변환하지 않는다.
- APK와 Expo Go는 서로 다른 앱 저장소와 게스트 계정을 사용한다. 동작을 맞추는 작업이며 두 앱의 기존 데이터를 합치는 작업은 아니다.

## 검증과 남은 확인

- 단위·통합 테스트: 연속 사진 등록 후 재시작, 초안 교체·추가·분석 실패 보존, 등록 실패 재시도 키 유지, 로컬 질문·답변·완료 요약, 401 계정 유지, 동시 첫 세션 요청, 목표 모드, 할인 선택, 서버 홈·지갑, 중복 제출 방지.
- `scripts/apklike-smoke.cjs`: 실제 웹 번들·브라우저로 사진 두 장 선택→이유→등록→새로고침→전체 기록, 401 복구, 네 개 탭 전환 검증. API는 테스트 fixture로 대체하며 실서버 데이터를 만들지 않는다. 실행에는 Playwright와 Chrome이 필요하다. `PLAYWRIGHT_MODULE`, `CHROME_PATH`로 별도 설치 경로를 지정할 수 있다.
- 타입 검사, ESLint, Android/iOS Hermes 및 웹 export 수행.
- 실제 Android Expo Go에서 실서버와 연결한 전체 기능 검증은 아직 완료하지 않았다. 물품 두 건 등록 후 앱 재실행, 목표 변경, 구매 결정·지출, 날짜가 바뀐 뒤 질문을 실제 기기에서 확인해야 한다.
- Android Expo Go는 원격 푸시를 지원하지 않는다. 설정 화면에 이 제한을 표시한다. 토큰 등록/해제 연결은 있지만, APK의 Firebase 설정·WorkManager 재시도·백그라운드 digest 처리와 완전한 알림 동등성은 별도 Android 개발 빌드 작업 및 기기 검증이 필요하다. 참고: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/

따라서 이 브랜치를 'APK와 완전히 동일하게 기기 검증이 끝난 버전'으로 간주하면 안 된다.
