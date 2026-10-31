/**
 * BE API 클라이언트 — 백엔드 README와 OpenAPI 계약을 기준으로 한다.
 *
 * - 응답은 unknown으로 받고 각 AI mapper에서 OpenAPI 형식을 검증한다.
 * - 데이터는 로컬 저장이 원본이므로(팀 결정) 지금 앱에서 실제로 쓰는 것은 AI 관련
 *   (itemDrafts, cartExtractions, productUrlDrafts)뿐이다. 나머지는 연결 준비만 해 둔다.
 */
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

/** 저장된 게스트 토큰을 쓰고, 없으면 새로 발급받는다 */
export async function ensureGuestSession(): Promise<string> {
  const existing = await getGuestToken();
  if (existing) return existing;
  const token = extractToken(await request({ method: 'POST', path: '/guest-sessions' }));
  await setGuestToken(token);
  return token;
}

/** 인증이 필요한 호출. 토큰이 만료돼 401이 오면 세션을 새로 받아 한 번만 다시 시도한다 */
async function authed(opts: Omit<Parameters<typeof request>[0], 'token'>): Promise<unknown> {
  try {
    return await request({ ...opts, token: await ensureGuestSession() });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await clearGuestToken();
      return request({ ...opts, token: await ensureGuestSession() });
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
    putDecision: (id: string, body: Body) =>
      authed({ method: 'PUT', path: `/items/${seg(id)}/decision`, json: body }),
  },

  // ── 시뮬레이션 ────────────────────────────────────────
  simulations: {
    /** @param date YYYY-MM-DD */
    putAnswers: (id: string, date: string, body: Body) =>
      authed({ method: 'PUT', path: `/simulations/${seg(id)}/answers/${seg(date)}`, json: body }),
    getResult: (id: string) => authed({ method: 'GET', path: `/simulations/${seg(id)}/result` }),
  },

  // ── 구매 회고 ─────────────────────────────────────────
  purchases: {
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
