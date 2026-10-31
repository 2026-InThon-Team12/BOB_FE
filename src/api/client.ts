/** Backend metadata is synchronized; raw daily answers remain on this device until summary. */
import { ApiError } from './errors';
import { request, type ImageUpload } from './http';
import { clearGuestToken, getGuestToken, setGuestToken } from './session';

/** 스펙 확정 전 요청 본문 */
export type Body = unknown;

/**
 * POST /guest-sessions 응답에서 토큰을 꺼낸다.
 * 형식 미확정 → 흔한 필드 이름(token / accessToken / access_token)을 받아 둔다.
 */
export function extractToken(data: unknown): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const token = d.token ?? d.accessToken ?? d.access_token;
    if (typeof token === 'string' && token) return token;
  }
  throw new ApiError('게스트 세션 응답에 토큰이 없어요.', 'invalid_response');
}

let sessionFlight: Promise<string> | undefined;
/** Concurrent first requests must all use the same guest identity. */
export function ensureGuestSession(): Promise<string> {
  if (sessionFlight) return sessionFlight;
  sessionFlight = (async () => {
    const existing = await getGuestToken();
    if (existing) return existing;
    const token = extractToken(await request({ method: 'POST', path: '/guest-sessions' }));
    await setGuestToken(token);
    return token;
  })().finally(() => { sessionFlight = undefined; });
  return sessionFlight;
}
let refreshFlight: Promise<string> | undefined;
async function refreshRejectedToken(rejected: string): Promise<string> {
  if (refreshFlight) return refreshFlight;
  refreshFlight = (async () => {
    const current = await getGuestToken();
    if (current && current !== rejected) return current;
    await clearGuestToken();
    return ensureGuestSession();
  })().finally(() => { refreshFlight = undefined; });
  return refreshFlight;
}
/** Retry once; an old 401 must never erase a newly refreshed session. */
async function authed(opts: Omit<Parameters<typeof request>[0], 'token'>): Promise<unknown> {
  const token = await ensureGuestSession();
  try {
    return await request({ ...opts, token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return request({ ...opts, token: await refreshRejectedToken(token) });
    }
    throw e;
  }
}

const seg = encodeURIComponent;

export const bobApi = {
  // ── 게스트·푸시 ──────────────────────────────────────
  guestSessions: {
    create: () => request({ method: 'POST', path: '/guest-sessions' }),
  },
  pushToken: {
    put: (body: Body) => authed({ method: 'PUT', path: '/me/push-token', json: body }),
    delete: () => authed({ method: 'DELETE', path: '/me/push-token' }),
  },

  // ── 오늘 할 일: 질문 카드·결정 대기·사후 점검 통합 조회 ──
  today: {
    get: () => authed({ method: 'GET', path: '/today' }),
  },

  // ── 등록 초안 ─────────────────────────────────────────
  itemDrafts: {
    create: (body: Body) => authed({ method: 'POST', path: '/item-drafts', json: body }),
  },
  cartExtractions: {
    create: (image: ImageUpload) => authed({ method: 'POST', path: '/cart-extractions', image: { upload: image } }),
  },
  productUrlDrafts: {
    create: (url: string) => authed({ method: 'POST', path: '/product-url-drafts', json: { url } }),
  },

  // ── 품목 ─────────────────────────────────────────────
  items: {
    batchCreate: (body: Body, idempotencyKey: string) =>
      authed({ method: 'POST', path: '/items/batch', json: body, headers: { 'Idempotency-Key': idempotencyKey } }),
    list: () => authed({ method: 'GET', path: '/items' }),
    get: (id: string) => authed({ method: 'GET', path: `/items/${seg(id)}` }),
    patch: (id: string, body: Body) => authed({ method: 'PATCH', path: `/items/${seg(id)}`, json: body }),
    /** 구매 결정 */
    putDecision: (id: string, body: Body, idempotencyKey?: string) =>
      authed({ method: 'PUT', path: `/items/${seg(id)}/decision`, json: body, ...(idempotencyKey ? {headers: {'Idempotency-Key': idempotencyKey}} : {}) }),
  },

  // ── 시뮬레이션 ────────────────────────────────────────
  simulations: {
    localQuestion: (id: string, body: Body) => authed({method: 'POST', path: `/simulations/${seg(id)}/local-question`, json: body}),
    summarize: (id: string, body: Body) => authed({method: 'POST', path: `/simulations/${seg(id)}/result-summary`, json: body}),
    /** @param date YYYY-MM-DD */
    putAnswers: (id: string, date: string, body: Body) =>
      authed({ method: 'PUT', path: `/simulations/${seg(id)}/answers/${seg(date)}`, json: body }),
    getResult: (id: string) => authed({ method: 'GET', path: `/simulations/${seg(id)}/result` }),
  },

  // ── 구매 회고 ─────────────────────────────────────────
  purchases: {
    localQuestion: (id: string, body: Body) => authed({method: 'POST', path: `/purchases/${seg(id)}/local-question`, json: body}),
    putReview: (id: string, body: Body) =>
      authed({ method: 'PUT', path: `/purchases/${seg(id)}/review`, json: body }),
  },

  // ── 예산·목표 ─────────────────────────────────────────
  budgets: {
    /** @param month YYYY-MM */
    get: (month: string) => authed({ method: 'GET', path: `/budgets/${seg(month)}` }),
    put: (month: string, body: Body) => authed({ method: 'PUT', path: `/budgets/${seg(month)}`, json: body }),
  },
  goals: {
    create: (body: Body) => authed({ method: 'POST', path: '/goals', json: body }),
    getCurrent: () => authed({ method: 'GET', path: '/goals/current' }),
    patchCurrent: (body: Body) => authed({ method: 'PATCH', path: '/goals/current', json: body }),
  },

  // ── 즉석 개입 ─────────────────────────────────────────
  impulses: {
    create: (body: Body) => authed({ method: 'POST', path: '/impulses', json: body }),
    putDecision: (id: string, body: Body) =>
      authed({ method: 'PUT', path: `/impulses/${seg(id)}/decision`, json: body }),
  },
};

export type BobApi = typeof bobApi;
