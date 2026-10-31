/**
 * 환경 변수는 이 파일에서만 읽는다.
 * EXPO_PUBLIC_* 값은 빌드 시점에 치환되므로 반드시 `process.env.NAME` 형태로 직접 접근해야 한다.
 */
export const env = {
  /** 데모·개발용 화면(/dev) 노출 여부 */
  demo: process.env.EXPO_PUBLIC_DEMO === 'true',
  /** AI 구현체: mock(기본) | real(BE 서버). real이 실패하면 로컬 fallback으로 바뀐다 */
  aiMode: process.env.EXPO_PUBLIC_AI_MODE === 'real' ? ('real' as const) : ('mock' as const),
  /** BE 서버 주소 (예: https://api.example.com — /api/v1은 붙이지 않는다) */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
} as const;
