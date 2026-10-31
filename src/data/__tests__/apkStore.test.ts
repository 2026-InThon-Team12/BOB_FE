import { apkActions, useApkState } from '@/data/apkStore';
import { apkRepository as repo } from '@/data/apkRepository';
import { newDraft, type Json } from '@/lib/apkDomain';

const initial = useApkState.getState();
beforeEach(() => {
  useApkState.setState(initial, true);
  repo.local = { account: 'test', drafts: [], records: {}, pending: {}, crops: {}, summaries: {} };
  jest.spyOn(repo, 'init').mockResolvedValue();
  jest.spyOn(repo, 'persist').mockResolvedValue();
});
afterEach(() => jest.restoreAllMocks());

it('home and wallet display server results rather than the old local store', async () => {
  const request = jest.spyOn(repo, 'request').mockImplementation(async (_method, path) => {
    if (path === '/home')
      return { simulations: [{ id: 'server-item' }], today: { date: '2026-11-01' }, goal: { id: 'goal' } };
    if (path.startsWith('/wallet')) return { remaining_amount: 123456, plan: { income: 500000 } };
    if (path.startsWith('/expenses')) return { items: [{ id: 'expense' }] };
    return {};
  });
  await apkActions.init();
  await apkActions.refresh('wallet');
  expect(useApkState.getState()).toMatchObject({
    home: { simulations: [{ id: 'server-item' }] },
    goal: { id: 'goal' },
    wallet: { remaining_amount: 123456 },
    expenses: [{ id: 'expense' }],
  });
  expect(request).toHaveBeenCalledWith('GET', expect.stringContaining('/wallet?month='));
});
it.each([
  ['FIRST', '/goals'],
  ['CHANGE', '/goals/current/replacement'],
  ['NEXT', '/goals/current/next'],
])('goal mode %s follows the APK endpoint', async (mode, path) => {
  const request = jest.spyOn(repo, 'request').mockResolvedValue({});
  useApkState.setState({ setup: { mode, current_goal: { id: 'old-goal' } } });
  const body = { name: 'new goal', target_amount: 100000 };
  await apkActions.goalSave(body, false);
  expect(request).toHaveBeenCalledWith(
    'POST',
    path,
    mode === 'CHANGE' ? { ...body, current_goal_id: 'old-goal', carry_savings: false } : body,
    true,
  );
  expect(request).toHaveBeenLastCalledWith('GET', '/home');
});
it('discount compares needed flags, then registers the reviewed selection', async () => {
  const request = jest.spyOn(repo, 'request').mockResolvedValue({ items: [] });
  repo.local.drafts = [true, false].map((needed) => ({
    ...newDraft({ name: 'item', price: 1000 }),
    reasons: ['EXTRA_DISCOUNT'],
    needed,
  }));
  const rule = {
    minimum_amount: 2000,
    unit: 'PCT',
    value: 10,
    shipping_fee: 0,
    free_shipping_enabled: false,
  };
  await apkActions.discount(rule);
  expect(request).toHaveBeenCalledWith('POST', '/discount-previews', {
    rule,
    items: [
      { client_id: '0', name: 'item', price: 1000, enabled: true },
      { client_id: '1', name: 'item', price: 1000, enabled: false },
    ],
  });
  await apkActions.register('NEEDED');
  expect(request).toHaveBeenCalledWith(
    'POST',
    '/items/batch',
    expect.objectContaining({ discount_review: { rule, needed_item_indexes: [0], decision: 'NEEDED' } }),
    true,
  );
  expect(repo.local.drafts).toHaveLength(0);
});
it('prevents double submission while a request is in flight', async () => {
  let resolve!: (value: Json) => void;
  const request = jest.spyOn(repo, 'request').mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const first = apkActions.refresh('today');
  expect(await apkActions.refresh('today')).toBe(false);
  resolve({ date: '2026-11-01' });
  await first;
  expect(request).toHaveBeenCalledTimes(1);
});
it('keeps every character of rapid draft edits while persistence is pending', async () => {
  repo.local.drafts = [newDraft()];
  await Promise.all([
    apkActions.draft(0, { name: '키' }),
    apkActions.draft(0, { name: '키보' }),
    apkActions.draft(0, { name: '키보드' }),
  ]);
  expect(useApkState.getState().drafts[0].name).toBe('키보드');
});

it('selecting screenshot drafts only changes pending drafts and preserves registered items', async () => {
  const saved = { id: 'already-registered', name: 'first photo' };
  useApkState.setState({ home: { simulations: [saved] }, history: [saved] });
  repo.local.drafts = [newDraft({ name: 'keep', price: 1000 }), newDraft({ name: 'exclude', price: 2000 })];
  const request = jest.spyOn(repo, 'request');
  expect(await apkActions.selectDrafts([0])).toBe(true);
  expect(repo.local.drafts.map((d) => d.name)).toEqual(['keep']);
  expect(repo.persist).toHaveBeenCalled();
  expect(useApkState.getState().home.simulations).toEqual([saved]);
  expect(useApkState.getState().history).toEqual([saved]);
  expect(request).not.toHaveBeenCalled();
  expect(await apkActions.selectDrafts([])).toBe(false);
  expect(repo.local.drafts.map((d) => d.name)).toEqual(['keep']);
});
