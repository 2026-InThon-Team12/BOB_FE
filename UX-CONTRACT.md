# BOB 모바일 UI 행동 계약

시각 기준은 DESIGN.md, 런타임 값은 src/theme/tokens.ts가 소유한다. 한국어 모바일 앱이며 날짜와 금액은 기존 날짜 계산과 formatWon을 따른다.

| 영역 | 구현 소유자 | 행동 |
| --- | --- | --- |
| 화면 스크롤·안전 영역 | components/ui/Screen | 본문 스크롤과 상단 헤더, 기기 안전 영역 유지 |
| 버튼·입력·선택 | components/ui | 공통 터치 피드백·접근성 이름·비활성 상태 재사용 |
| 할인 조건 | features/discount/useDiscountTrap | 기존 입력 검증과 계산 유지, 숫자와 단위는 함께 배치 |
| 사용법 | app/help, config/helpFlow, constants/help | 이미지와 강조 영역 좌표 공유, 이전·다음·마지막 완료 및 기존 돌아가기 경로 유지 |
| 오늘 질문·저장·수정 | features/simulation/useTodayCheck, data/actions/reflections | 질문별 스키마를 보존하고 저장 실패 시 재시도; 완료 목록에서 수정하거나 취소해 복귀 |
| 답변 결과 목록 | components/feature/ReflectionCompletion, lib/calc/todayAnswers | 오늘 답변만 표시, 마지막 관찰일 우선, 페이지 크기는 config/policy; 페이지 상태는 이 화면에서만 유지 |
| 진행도 | components/ui/ProgressBar | 텍스트 일수와 접근 가능한 백분율을 함께 제공 |

사용법에는 안전 영역 밖이나 이미지 속에 실제 조작 버튼을 배치하지 않는다. 설명이 길면 본문만 스크롤한다. 답변 결과의 강조는 관찰 종료를 안내하며 구매·포기 결정을 자동으로 수행하지 않는다.
