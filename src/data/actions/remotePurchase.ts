import { z } from 'zod';
import { policy } from '@/config/policy';
import { addDays, diffDays } from '@/lib/date';
import { DateKeySchema, type Item } from '@/types';
import { getState, update } from '../store';

export const RemotePurchaseSchema = z.object({
  id: z.string(), item_id: z.string().optional(),
  purchased_on: DateKeySchema, review_due_on: DateKeySchema.optional(),
  review_start: DateKeySchema, review_end: DateKeySchema,
  review: z.object({
    used_days: z.number().nullable(), frequency: z.string().nullable(),
    min_days: z.number(), max_days: z.number(), estimated_days: z.number(),
    submitted_on: DateKeySchema,
  }).nullable().optional(),
  expected_days_in_review_window: z.number().nullable().optional(),
  expected_usage_rate: z.number().nullable().optional(),
  prediction_window_days: z.number().nonnegative().optional(),
  comparison_reason: z.string().nullable().optional(),
  comparison_eligible: z.boolean().optional(),
});

export function purchasePatch(raw: unknown): Pick<Item, 'purchaseId' | 'purchase' | 'review'> {
  const row = RemotePurchaseSchema.parse(raw);
  const patch: Pick<Item, 'purchaseId' | 'purchase' | 'review'> = {
    purchaseId: row.id,
    purchase: {boughtAt: `${row.purchased_on}T00:00:00+09:00`,
      reviewDueOn: row.review_due_on ?? addDays(row.review_end, 1),
      reviewStart: row.review_start, reviewEnd: row.review_end},
  };
  if (row.review === null) patch.review = undefined;
  if (row.review) {
    const saved = row.review;
    const legacy: Record<string, string> = {ALMOST_DAILY:'daily', OFTEN:'often', SOMETIMES:'sometimes', NEVER:'never'};
    const bucket = saved.frequency ? legacy[saved.frequency] ?? saved.frequency
      : policy.reviewUsageBuckets.find(b => saved.estimated_days >= b.minDays && saved.estimated_days <= b.maxDays)?.id ?? 'never';
    const actualWindow = diffDays(row.review_start, row.review_end) + 1;
    const predictionWindow = row.prediction_window_days ?? actualWindow;
    patch.review = {
      usageBucket: bucket, usedDays: saved.estimated_days, at:`${saved.submitted_on}T00:00:00+09:00`,
      minDays: saved.min_days, maxDays: saved.max_days, syncState:'synced',
      comparison: {
        expectedDays: row.expected_days_in_review_window ?? null,
        predictedRate: row.expected_usage_rate ?? null,
        predictionWindowDays: predictionWindow, actualWindowDays: actualWindow,
        eligible: row.comparison_eligible ?? (row.comparison_reason === null && predictionWindow === actualWindow),
        reason: row.comparison_reason ?? null,
      },
    };
  }
  return patch;
}

export async function applyRemotePurchase(itemId: string, raw: unknown): Promise<void> {
  const row = RemotePurchaseSchema.parse(raw);
  const item = getState().items[itemId];
  if (!item || item.purchaseId !== row.id || (row.item_id && item.remoteId !== row.item_id)) {
    throw new Error('구매 점검 응답의 상품이 일치하지 않아요.');
  }
  if (!row.review) throw new Error('저장된 구매 점검 응답이 없어요.');
  await update(s => ({items:{...s.items,[itemId]:{...s.items[itemId],...purchasePatch(row)}}}));
}
