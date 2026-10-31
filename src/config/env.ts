/**
 * 환경 변수는 이 파일에서만 읽는다.
 * EXPO_PUBLIC_* 값은 빌드 시점에 치환되므로 반드시 `process.env.NAME` 형태로 직접 접근해야 한다.
 */
export const env = {
  /** 데모·개발용 화면(/dev) 노출 여부 */
  demo: process.env.EXPO_PUBLIC_DEMO === 'true',
  /** APK와 동일하게 서버를 기본 사용. mock은 개발자가 명시한 경우만 사용한다. */
  aiMode: process.env.EXPO_PUBLIC_AI_MODE === 'mock' ? ('mock' as const) : ('real' as const),
  /** BE 서버 주소 (예: https://api.example.com — /api/v1은 붙이지 않는다) */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://bob-be.vercel.app',
} as const;
