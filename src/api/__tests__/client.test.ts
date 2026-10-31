import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, bobApi, buildUrl, ensureGuestSession, extractToken, normalizeApiBaseUrl } from '@/api';
import { resetSessionCache } from '@/api/session';
import { realAi } from '@/ai/real';

jest.mock('@/config/env', () => ({
  env: { demo: false, aiMode: 'real', apiBaseUrl: 'https://api.test/' },
}));

type Call = { url: string; init: RequestInit };
let calls: Call[];
let responses: { status: number; body?: unknown }[];

beforeEach(async () => {
  calls = [];
  responses = [];
  await AsyncStorage.clear();
  resetSessionCache();
  globalThis.fetch = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses.shift() ?? { status: 200, body: {} };
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => (r.body === undefined ? '' : JSON.stringify(r.body)),
    } as Response;
  }) as unknown as typeof fetch;
});

const header = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name];

describe('buildUrl', () => {
  it('호스트 주소와 /api/v1 포함 Base URL을 같게 정규화한다', () => {
    expect(normalizeApiBaseUrl('https://bob-be.vercel.app')).toBe('https://bob-be.vercel.app');
    expect(normalizeApiBaseUrl('https://bob-be.vercel.app/api/v1/')).toBe('https://bob-be.vercel.app');
    expect(normalizeApiBaseUrl('https://bob-be.vercel.app/docs')).toBe('https://bob-be.vercel.app');
    expect(normalizeApiBaseUrl(' https://bob-be.vercel.app/docs/api/v1/ ')).toBe('https://bob-be.vercel.app');
  });

  it('기본 주소 + /api/v1 + 경로, 쿼리 인코딩', () => {
    expect(buildUrl('/items')).toBe('https://api.test/api/v1/items');
    expect(buildUrl('/today', { date: '2026-10-31', skip: undefined, q: 'a b' })).toBe(
      'https://api.test/api/v1/today?date=2026-10-31&q=a%20b',
    );
  });
});

describe('게스트 세션', () => {
  it('사진 첫 업로드: 게스트 발급 → image multipart 인증 요청 → 실제 상품으로 변환', async () => {
    const append = jest.spyOn(FormData.prototype, 'append');
    responses.push({ status: 201, body: { access_token: 'cart-token' } }, { status: 200, body: {
      items: [{ name: '사진 속 키보드', price: 45000, category: 'DIGITAL', source: 'SCREENSHOT' }],
      warnings: ['CONFIRM_EXTRACTED_ITEMS'], analysis_method: 'ocr',
    } });
    const result = await realAi.parseCartScreenshot({ uri: 'file:///prepared.png', name: 'cart.png', mimeType: 'image/png' });
    expect(calls.map((c) => c.url)).toEqual(['https://api.test/api/v1/guest-sessions', 'https://api.test/api/v1/cart-extractions']);
    expect(header(calls[1], 'Authorization')).toBe('Bearer cart-token');
    expect(header(calls[1], 'Content-Type')).toBeUndefined();
    expect(append).toHaveBeenCalledWith('image', { uri: 'file:///prepared.png', name: 'cart.png', type: 'image/png' });
    append.mockRestore();
    expect(result.items).toEqual([expect.objectContaining({ name: '사진 속 키보드', price: 45000, category: 'digital', source: 'screenshot' })]);
  });

  it('토큰 필드 이름 후보', () => {
    expect(extractToken({ token: 'a' })).toBe('a');
    expect(extractToken({ accessToken: 'b' })).toBe('b');
    expect(extractToken({ access_token: 'c' })).toBe('c');
    expect(() => extractToken({})).toThrow(ApiError);
  });

  it('처음 한 번만 발급받고 이후에는 저장된 토큰을 쓴다', async () => {
    responses.push({ status: 201, body: { token: 'guest-1' } });
    expect(await ensureGuestSession()).toBe('guest-1');
    resetSessionCache(); // 앱 재시작 흉내 → 저장소에서 다시 읽는다
    expect(await ensureGuestSession()).toBe('guest-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: 'https://api.test/api/v1/guest-sessions', init: { method: 'POST' } });
  });
});

describe('엔드포인트', () => {
  beforeEach(async () => {
    await AsyncStorage.setItem('bob-guest-token', 'tok');
  });

  it('경로·메서드·인증 헤더·JSON 본문', async () => {
    await bobApi.productUrlDrafts.create('https://shop.example.com/item/1');
    await bobApi.simulations.putAnswers('sim 1', '2026-10-31', { answers: [] });
    await bobApi.items.putDecision('it1', { decision: 'buy' });
    await bobApi.budgets.get('2026-10');
    await bobApi.goals.patchCurrent({ name: '피규어' });
    await bobApi.impulses.putDecision('im1', { decision: 'resisted' });
    await bobApi.pushToken.delete();

    expect(calls.map((c) => `${c.init.method} ${c.url.replace('https://api.test/api/v1', '')}`)).toEqual([
      'POST /product-url-drafts',
      'PUT /simulations/sim%201/answers/2026-10-31',
      'PUT /items/it1/decision',
      'GET /budgets/2026-10',
      'PATCH /goals/current',
      'PUT /impulses/im1/decision',
      'DELETE /me/push-token',
    ]);
    expect(header(calls[0], 'Authorization')).toBe('Bearer tok');
    expect(header(calls[0], 'Content-Type')).toBe('application/json');
    expect(calls[0].init.body).toBe(JSON.stringify({ url: 'https://shop.example.com/item/1' }));
    expect(calls[1].init.body).toBe(JSON.stringify({ answers: [] }));
    expect(calls[3].init.body).toBeUndefined();
  });

  it('401이면 세션을 새로 받아 한 번 다시 시도', async () => {
    responses.push({ status: 401 }, { status: 201, body: { token: 'new' } }, { status: 200, body: { ok: 1 } });
    await expect(bobApi.today.get()).resolves.toEqual({ ok: 1 });
    expect(calls.map((c) => header(c, 'Authorization'))).toEqual(['Bearer tok', undefined, 'Bearer new']);
  });

  it('서버 오류는 ApiError(http, status, body)', async () => {
    responses.push({ status: 422, body: { message: 'bad' } });
    await expect(bobApi.items.list()).rejects.toMatchObject({ code: 'http', status: 422, body: { message: 'bad' } });
  });

  it('이미지는 multipart (Content-Type은 fetch가 정함)', async () => {
    await bobApi.cartExtractions.create({ uri: 'file:///cart.png', name: 'cart.png', mimeType: 'image/png' });
    expect(calls[0].url).toBe('https://api.test/api/v1/cart-extractions');
    expect(calls[0].init.body).toBeInstanceOf(FormData);
    expect(header(calls[0], 'Content-Type')).toBeUndefined();
  });

  it('품목 일괄 등록은 Idempotency-Key를 보낸다', async () => {
    await bobApi.items.batchCreate({ items: [{ name: '키보드' }] }, 'reg_12345678');
    expect(calls[0].url).toBe('https://api.test/api/v1/items/batch');
    expect(header(calls[0], 'Idempotency-Key')).toBe('reg_12345678');
    expect(header(calls[0], 'Authorization')).toBe('Bearer tok');
  });
});
