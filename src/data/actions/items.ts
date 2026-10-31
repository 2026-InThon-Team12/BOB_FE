/** 물품 등록·결정·점검 (기능 1·2·3·6) */
import { refreshGoalAchievements } from './goals';
import { policy } from '@/config/policy';
import { defaultQuestionTemplates } from '@/constants/questionTemplates';
import {
  bucketForCategory,
  buildQuestions,
  canPerform,
  derivePhase,
  NEXT_STATUS,
  simulationDays,
  type DecisionAction,
} from '@/lib/calc';
import { addDays, diffDays } from '@/lib/date';
import { simulationDayKeys } from '@/lib/calc/simulation';
import { createId } from '@/lib/id';
import type { CategoryId, ConfirmedItemInput, Expense, Item, Question, ReasonId } from '@/types';

import { getNowIso, getToday } from '../clock';
import { DataError } from '../errors';
import { getState, update } from '../store';

const requireItem = (id: string): Item => {
  const item = getState().items[id];
  if (!item) throw new DataError(`물품을 찾을 수 없어요: ${id}`, 'not_found');
  return item;
};

const assertCan = (item: Item, action: DecisionAction | 'review') => {
  const phase = derivePhase(item, getToday(), policy);
  if (!canPerform(phase, action)) {
    throw new DataError(`'${phase}' 단계에서는 '${action}'을(를) 할 수 없어요.`, 'invalid_transition');
  }
};

const omitKeys = <T>(record: Record<string, T>, drop: (v: T) => boolean) =>
  Object.fromEntries(Object.entries(record).filter(([, v]) => !drop(v)));

/** 확인을 마친 물품들을 등록하고 시뮬레이션을 시작한다 */
export function addItems(inputs: ConfirmedItemInput[], pending = false): Item[] {
  const now = getNowIso();
  // 한 번에 등록한 물건은 같은 쇼핑몰 묶음 (할인 함정 확인에서 함께 본다)
  const batchId = inputs[0]?.batchId ?? createId('bt_');
  const created: Item[] = [];
  const createdQuestions: Question[] = [];

  for (const input of inputs) {
    if (!input.name.trim()) throw new DataError('물품 이름이 비어 있어요.', 'invalid_input');
    if (!Number.isInteger(input.price) || input.price < 0) {
      throw new DataError('가격이 올바르지 않아요.', 'invalid_input');
    }
    const id = createId('it_');
    const fallback = defaultQuestionTemplates(input.category);
    created.push({
      id,
      registrationState: pending ? 'pending' : 'complete',
      name: input.name.trim(),
      price: input.price,
      imageUri: input.imageUri,
      category: input.category,
      categoryConfidence: input.categoryConfidence,
      reasons: [...new Set(input.reasons)],
      source: input.source,
      sourceUrl: input.sourceUrl,
      batchId,
      status: 'simulating',
      createdAt: now,
      simulation: { startAt: now, durationDays: simulationDays(input.price, policy.simulationBands) },
    });
    createdQuestions.push(
      ...buildQuestions({
        itemId: id,
        templates: input.questionTemplates?.length ? input.questionTemplates : fallback,
        fallbackTemplates: fallback,
        createId: () => createId('q_'),
      }),
    );
  }

  update((s) => ({
    items: { ...s.items, ...Object.fromEntries(created.map((i) => [i.id, i])) },
    questions: { ...s.questions, ...Object.fromEntries(createdQuestions.map((q) => [q.id, q])) },
  }));
  return created;
}

export type ItemPatch = Partial<{
  name: string;
  price: number;
  category: CategoryId;
  reasons: ReasonId[];
  reasonOtherText: string | undefined;
  saleEndsAt: string | undefined;
  imageUri: string | undefined;
}>;

/**
 * 물품 정보 수정 (시뮬레이션 중일 때만 — 등록 직후 이유 고르기 화면도 여기로 저장한다).
 * 가격이 바뀌면 시뮬레이션 기간도 다시 계산한다. 카테고리를 바꾸면 AI 신뢰도는 지운다.
 */
export function updateItem(id: string, patch: ItemPatch): Item {
  const item = requireItem(id);
  if (item.status !== 'simulating') {
    throw new DataError('결정이 끝난 물품은 수정할 수 없어요.', 'invalid_transition');
  }
  if (patch.name !== undefined && !patch.name.trim()) throw new DataError('물품 이름이 비어 있어요.', 'invalid_input');

  const next: Item = {
    ...item,
    ...patch,
    name: patch.name?.trim() ?? item.name,
    reasons: patch.reasons ? [...new Set(patch.reasons)] : item.reasons,
    categoryConfidence: patch.category && patch.category !== item.category ? undefined : item.categoryConfidence,
    simulation:
      patch.price !== undefined && patch.price !== item.price
        ? { ...item.simulation, durationDays: simulationDays(patch.price, policy.simulationBands) }
        : item.simulation,
  };
  update((s) => ({ items: { ...s.items, [id]: next } }));
  return next;
}

/** Buy(구매) / Bye(포기) / 보류(시뮬레이션 policy.holdDays일 연장) */
export function decideItem(id: string, action: DecisionAction): Item {
  const item = requireItem(id);
  assertCan(item, action);
  const now = getNowIso();

  let next: Item = { ...item, status: NEXT_STATUS[action], decidedAt: now, ...(action === 'abandon' ? {savingGoalId: Object.values(getState().goals).find(g => g.isActive)?.id} : {}) };
  let expense: Expense | null = null;

  if (action === 'buy') {
    next = { ...next, purchase: { boughtAt: now } };
    expense = {
      id: createId('ex_'),
      amount: item.price,
      bucket: bucketForCategory(item.category, policy),
      label: item.name,
      source: 'item',
      refId: item.id,
      at: now,
    };
  }
  if (action === 'hold') {
    const today = getToday();
    const extension = Math.min(policy.holdDays, item.saleEndsAt ? diffDays(today, item.saleEndsAt) : Infinity);
    if (extension <= 0) throw new DataError('판매 마감일이 지나 보류할 수 없어요.', 'invalid_transition');
    const dates = [...simulationDayKeys(item), ...Array.from({length: extension}, (_, i) => addDays(today, i + 1))];
    next = {
      ...next,
      decidedAt: undefined,
      simulation: { ...item.simulation, durationDays: dates.length, observationDates: dates, endDate: addDays(today, extension + 1) },
      summary: undefined,
    };
  }

  update((s) => ({
    items: { ...s.items, [id]: next },
    ...(expense ? { expenses: { ...s.expenses, [expense.id]: expense } } : {}),
  }));
  refreshGoalAchievements();
  return next;
}

/** 구매 후 실사용 점검 (기능 2) — 사용 일수 구간(policy.reviewUsageBuckets)으로 답한다 */
export function submitReview(id: string, input: { usageBucket: string }): Item {
  const item = requireItem(id);
  assertCan(item, 'review');
  const bucket = policy.reviewUsageBuckets.find((b) => b.id === input.usageBucket);
  if (!bucket) throw new DataError(`없는 사용 구간이에요: ${input.usageBucket}`, 'invalid_input');
  const next: Item = {
    ...item,
    review: { usageBucket: bucket.id, usedDays: bucket.usedDays, at: getNowIso() },
  };
  update((s) => ({ items: { ...s.items, [id]: next } }));
  return next;
}

/** 물품과 그 질문·답변·구매 지출을 함께 지운다 */
export function removeItem(id: string): void {
  requireItem(id);
  update((s) => {
    const { [id]: _removed, ...items } = s.items;
    return {
      items,
      questions: omitKeys(s.questions, (q) => q.itemId === id),
      answers: omitKeys(s.answers, (a) => a.itemId === id),
      expenses: omitKeys(s.expenses, (e) => e.source === 'item' && e.refId === id),
    };
  });
}
