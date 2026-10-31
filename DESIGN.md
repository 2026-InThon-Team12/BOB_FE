# BOB UI context — apklike

화면 기준은 `BoB_handoff/prototype/*.html`이다. `src/theme`과 공통 UI 컴포넌트를 통해 색상·간격·폰트를 적용한다. 문구는 `src/constants/copy.ts`와 `src/constants/htmlCopy.ts`에서 관리한다.

- 결정 버튼은 공통 Button의 Buy 기본형과 Bye 변형을 사용한다.
- 진행 중과 종료 후 모두 Buy·Bye를 표시한다. 보류는 종료 후에만 표시한다. 조기 Bye는 [백엔드 수정](docs/backend-early-bye.md) 이후 서버에서 허용된다.
- 실제 앱의 결정 요청은 `apkStore` → `apkRepository` → 서버 API 흐름을 사용한다. 서버 성공 후 홈으로 이동하며 실패 시 물품·로컬 답변을 보존한다.
- 기존 로컬 전용 `itemMachine`·`actions/items`는 활성 앱의 서버 기록을 대체하지 않는다.
- 목표 달성 원은 정보를 표시하며 클릭해서 축하 애니메이션을 재생하지 않는다.
- 홈에는 설정 아이콘으로 APK의 설정 진입을 제공한다. 미연결 알림함 아이콘을 표시하지 않는다.

상세 통합 범위는 [frontend-mvp 통합 내역](docs/frontend-mvp-integration.md)을 참고한다.
