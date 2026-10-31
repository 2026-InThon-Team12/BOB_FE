import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, bobApi, buildUrl, ensureGuestSession, extractToken } from '@/api';
import { resetSessionCache } from '@/api/session';

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
  it('기본 주소 + /api/v1 + 경로, 쿼리 인코딩', () => {
    expect(buildUrl('/items')).toBe('https://api.test/api/v1/items');
    expect(buildUrl('/today', { date: '2026-10-31', skip: undefined, q: 'a b' })).toBe(
      'https://api.test/api/v1/today?date=2026-10-31&q=a%20b',
    );
  });
});

describe('게스트 세션', () => {
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
    await bobApi.simulations.putAnswers('sim 1', '2026-10-31', { answers: [] });
    await bobApi.items.putDecision('it1', { decision: 'buy' });
    await bobApi.budgets.get('2026-10');
    await bobApi.goals.patchCurrent({ name: '피규어' });
    await bobApi.impulses.putDecision('im1', { decision: 'resisted' });
    await bobApi.pushToken.delete();

    expect(calls.map((c) => `${c.init.method} ${c.url.replace('https://api.test/api/v1', '')}`)).toEqual([
      'PUT /simulations/sim%201/answers/2026-10-31',
      'PUT /items/it1/decision',
      'GET /budgets/2026-10',
      'PATCH /goals/current',
      'PUT /impulses/im1/decision',
      'DELETE /me/push-token',
    ]);
    expect(header(calls[0], 'Authorization')).toBe('Bearer tok');
    expect(header(calls[0], 'Content-Type')).toBe('application/json');
    expect(calls[0].init.body).toBe(JSON.stringify({ answers: [] }));
    expect(calls[2].init.body).toBeUndefined();
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
});
