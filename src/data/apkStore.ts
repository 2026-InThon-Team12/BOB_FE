import { create } from 'zustand';
import { ApiError } from '@/api';
import { apkCopy as c } from '@/constants/apkCopy';
import {
  newDraft,
  object,
  rows,
  seoulDate,
  str,
  validDraft,
  validMoney,
  type Draft,
  type Json,
  type Task,
} from '@/lib/apkDomain';
import { apkRepository as repo } from './apkRepository';

type State = {
  busy: boolean;
  ready: boolean;
  error: string;
  notice: string;
  drafts: Draft[];
  home: Json;
  today: Json;
  goal: Json;
  report: Json;
  wallet: Json;
  expenses: Json[];
  history: Json[];
  historyMore: boolean;
  shelf: Json;
  setup: Json;
  selected: Json;
  result: Json;
  review: Json;
  question: Json;
  task?: Task;
  impulse: Json;
  registrationPreview: Json;
  discount: Json;
  discountRule?: Json;
  goalPreview: Json;
  month: string;
  records: Record<string, Json>;
  crops: Record<string, string>;
};
const useStore = create<State>(() => ({
  busy: false,
  ready: false,
  error: '',
  notice: '',
  drafts: [],
  home: {},
  today: {},
  goal: {},
  report: {},
  wallet: {},
  expenses: [],
  history: [],
  historyMore: false,
  shelf: {},
  setup: {},
  selected: {},
  result: {},
  review: {},
  question: {},
  impulse: {},
  registrationPreview: {},
  discount: {},
  goalPreview: {},
  month: seoulDate().slice(0, 7),
  records: {},
  crops: {},
}));
const set = useStore.setState;
const state = useStore.getState;
const sync = () =>
  set({
    drafts: [...repo.local.drafts],
    records: { ...repo.local.records },
    crops: { ...repo.local.crops },
  });
async function loadHome() {
  const home = await repo.request('GET', '/home');
  set({ home, today: object(home.today), goal: object(home.goal) });
}
async function loadWallet() {
  const month = state().month;
  const wallet = await repo.request('GET', `/wallet?month=${month}`);
  const expenses = rows((await repo.request('GET', `/expenses?month=${month}&limit=100`)).items);
  set({ wallet, expenses });
}
export const apkActions = {
  async run(action: () => Promise<void>) {
    if (state().busy) return false;
    set({ busy: true, error: '' });
    try {
      await repo.init();
      await action();
      sync();
      return true;
    } catch (error) {
      set({
        error:
          error instanceof ApiError && error.status === 401
            ? c.auth
            : str(object(object(error).body).message || object(object(object(error).body).error).message) ||
              (error instanceof Error ? error.message : c.error),
      });
      sync();
      return false;
    } finally {
      set({ busy: false });
    }
  },
  async init() {
    if (state().ready) return true;
    return apkActions.run(async () => {
      sync();
      set({ ready: true });
      await loadHome();
    });
  },
  dismiss() {
    set({ error: '', notice: '' });
  },
  async refresh(page: string) {
    return apkActions.run(async () => {
      switch (page) {
        case 'home':
        case 'goal':
          await loadHome();
          break;
        case 'today':
          set({ today: await repo.request('GET', '/today') });
          break;
        case 'wallet':
          await loadWallet();
          break;
        case 'report':
          set({
            report: await repo.request('GET', `/reports?month=${state().month}`),
          });
          break;
        case 'shelf':
          set({ shelf: await repo.request('GET', '/goals/shelf') });
          break;
        case 'history': {
          const history = rows((await repo.request('GET', '/items?limit=100')).items);
          set({ history, historyMore: history.length === 100 });
          break;
        }
        case 'goalSetup':
          set({
            setup: await repo.request('GET', '/goals/setup'),
            goalPreview: {},
          });
          break;
      }
    });
  },
  async changeMonth(month: string, page: string) {
    set({ month });
    return apkActions.refresh(page);
  },
  async moreHistory() {
    return apkActions.run(async () => {
      const next = rows((await repo.request('GET', `/items?limit=100&offset=${state().history.length}`)).items);
      set({
        history: [...state().history, ...next],
        historyMore: next.length === 100,
      });
    });
  },
  async draft(index: number, patch: Partial<Draft>) {
    if (state().busy) return false;
    const save = repo.setDrafts(repo.local.drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    sync();
    set({ discount: {}, discountRule: undefined });
    try {
      await save;
      return true;
    } catch {
      set({ error: c.error });
      return false;
    }
  },
  async removeDraft(index: number) {
    return apkActions.run(async () => {
      await repo.setDrafts(repo.local.drafts.filter((_, i) => i !== index));
      set({ discount: {}, discountRule: undefined });
    });
  },
  async addBlank(input: Json = {}) {
    return apkActions.run(async () => {
      if (repo.local.drafts.length >= 20) throw new Error(c.tooMany);
      await repo.setDrafts([...repo.local.drafts, newDraft(input)]);
    });
  },
  async importDraft(method: 'manual' | 'url', name: string, price: string, url: string) {
    return apkActions.run(async () => {
      const output =
        method === 'url'
          ? await repo.request('POST', '/product-url-drafts', {
              url: url.trim(),
            })
          : await repo.request('POST', '/item-drafts', {
              name: name.trim(),
              ...(price ? { price: Number(price) } : {}),
            });
      await repo.acceptDrafts(output);
    });
  },
  async preview() {
    return apkActions.run(async () => {
      if (!repo.local.drafts.length || !repo.local.drafts.every(validDraft)) throw new Error(c.invalidDraft);
      set({
        registrationPreview: await repo.request('POST', '/registration-previews', repo.batchBody()),
      });
    });
  },
  clearDiscount() {
    set({ discount: {}, discountRule: undefined });
  },
  async discount(rule: Json) {
    return apkActions.run(async () => {
      const discount = await repo.request('POST', '/discount-previews', {
        items: repo.local.drafts.map((d, i) => ({
          client_id: String(i),
          name: d.name,
          price: Number(d.price),
          enabled: d.needed,
        })),
        rule,
      });
      set({ discount, discountRule: rule });
    });
  },
  async register(decision?: string) {
    return apkActions.run(async () => {
      await repo.register(decision, state().discountRule);
      set({ notice: c.registered, discount: {}, discountRule: undefined });
      await loadHome();
    });
  },
  async openItem(id: string) {
    return apkActions.run(async () => {
      const selected = await repo.request('GET', `/items/${encodeURIComponent(id)}`);
      set({ selected, result: await repo.summary(selected) });
    });
  },
  async openQuestion(task: Task) {
    return apkActions.run(async () => {
      set({ task, question: await repo.question(task) });
    });
  },
  async answer(answer: Json) {
    return apkActions.run(async () => {
      if (!state().task) throw new Error(c.invalidAnswer);
      await repo.answer(state().task!, answer);
      set({ notice: c.saved, today: await repo.request('GET', '/today') });
    });
  },
  openReview(review: Json) {
    set({ review });
  },
  async review(frequency: string) {
    return apkActions.run(async () => {
      set({
        review: await repo.request('PUT', `/purchases/${encodeURIComponent(str(state().review.id))}/review`, {
          frequency,
        }),
        notice: c.saved,
      });
      await loadHome();
    });
  },
  async decide(decision: string, price: string) {
    return apkActions.run(async () => {
      if (decision === 'BUY' && !validMoney(price)) throw new Error(c.invalidDraft);
      await repo.request(
        'PUT',
        `/items/${encodeURIComponent(str(state().selected.id))}/decision`,
        {
          decision,
          ...(decision === 'BUY' ? { actual_price: Number(price), purchased_on: seoulDate() } : {}),
        },
        true,
      );
      await loadHome();
      set({ notice: c.saved });
    });
  },
  async goalPreview(body: Json, carry: boolean) {
    return apkActions.run(async () => {
      const setup = state().setup;
      set({
        goalPreview: await repo.request('POST', '/goals/preview', {
          ...body,
          mode: setup.mode,
          carry_savings: carry,
          ...(setup.mode !== 'FIRST' ? { current_goal_id: object(setup.current_goal).id } : {}),
        }),
      });
    });
  },
  async goalSave(body: Json, carry: boolean) {
    return apkActions.run(async () => {
      const setup = state().setup;
      const mode = setup.mode;
      await repo.request(
        'POST',
        mode === 'CHANGE' ? '/goals/current/replacement' : mode === 'NEXT' ? '/goals/current/next' : '/goals',
        {
          ...body,
          ...(mode === 'CHANGE'
            ? {
                current_goal_id: object(setup.current_goal).id,
                carry_savings: carry,
              }
            : {}),
        },
        true,
      );
      await loadHome();
      set({ notice: c.saved });
    });
  },
  async goalUrl(url: string) {
    return apkActions.run(async () => {
      await repo.request('PATCH', '/goals/current', {
        source_url: url.trim() || null,
      });
      await loadHome();
    });
  },
  async impulse(name: string, amount: string) {
    return apkActions.run(async () => {
      set({
        impulse: await repo.request('POST', '/impulses', { name, amount: Number(amount) }, true),
      });
    });
  },
  async impulseDecision(decision: string) {
    return apkActions.run(async () => {
      set({
        impulse: await repo.request('PUT', `/impulses/${encodeURIComponent(str(state().impulse.id))}/decision`, {
          decision,
        }),
        notice: c.saved,
      });
      await loadHome();
    });
  },
  async budget(body: Json) {
    return apkActions.run(async () => {
      await repo.request('PUT', `/budgets/${state().month}`, body);
      await loadWallet();
      set({ notice: c.saved });
    });
  },
  async expense(body: Json, id?: string) {
    return apkActions.run(async () => {
      await repo.request(id ? 'PUT' : 'POST', id ? `/expenses/${encodeURIComponent(id)}` : '/expenses', body, !id);
      await loadWallet();
      set({ notice: c.saved });
    });
  },
  async removeExpense(id: string) {
    return apkActions.run(async () => {
      await repo.request('DELETE', `/expenses/${encodeURIComponent(id)}`);
      await loadWallet();
    });
  },
};
export const useApkState = useStore;
