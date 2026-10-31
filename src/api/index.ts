/**
 * BE API 클라이언트 공개 진입점.
 * 지금은 데이터가 로컬 저장이라 @/ai(real)에서만 쓴다 — 화면·뷰모델은 직접 쓰지 않는다 (ESLint 강제).
 */
export { bobApi, ensureGuestSession, extractToken, type BobApi, type Body } from './client';
export { ApiError } from './errors';
export { API_PREFIX, buildUrl, type ImageUpload } from './http';
export { clearGuestToken } from './session';
