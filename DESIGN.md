# BOB UI context

한국어 모바일 앱의 기존 Buy or Bye 시안을 유지한다. 시각 값의 원본은
`src/theme/tokens.ts`이며 `src/theme`과 `src/components/ui`를 통해 화면에 적용한다.
화면별 색상·간격·폰트 값을 새로 만들지 않는다. 문구는 `src/constants/copy.ts`에서 관리한다.

## 행동과 공통 컴포넌트

- 결정 버튼은 공통 `Button`의 Buy 기본형과 Bye 변형을 사용한다.
- 시뮬레이션 진행 중과 종료 후 모두 Buy·Bye를 선택할 수 있다. 보류는 종료 후에만 가능하다.
- 상태 전이는 `src/lib/calc/itemMachine.ts`, 로컬 구매·지출 처리는 `src/data/actions/items.ts`가 담당한다.
- 결정 완료 피드백과 이동은 기존 결과 화면의 `useToast` 및 Expo Router 흐름을 재사용한다.
- 목표 달성 원은 정보를 표시한다. 눌러서 축하 애니메이션을 재실행하지 않는다.
- 홈 상단에는 연결된 알림함이 없는 알림 아이콘을 표시하지 않는다.

이번 변경은 사용자 요청에 따라 앱 실행, 자동 검사, 시각 검증을 수행하지 않았다.
