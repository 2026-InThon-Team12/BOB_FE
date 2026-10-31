/** 사용자가 확인한 로컬 품목을 BE /items/batch 계약으로 등록한다. */
import { bobApi } from '@/api';
import { env } from '@/config/env';
import type { CategoryId, DiscountRule, Item, ItemSource, ReasonId } from '@/types';

import { removeItem } from './items';
import { getState, update } from '../store';
import { getToday } from '../clock';
import { addDays, diffDays } from '@/lib/date';
import { simulationDays } from '@/lib/calc/simulation';
import { policy } from '@/config/policy';
import { z } from 'zod';
import { requestDigest } from '@/lib/requestDigest';

const CATEGORY_TO_API: Record<CategoryId, string> = {
  daily: 'DAILY_LIVING',
  clothing: 'CLOTHING',
  furniture: 'FURNITURE',
  appliance: 'APPLIANCES',
  digital: 'DIGITAL',
  hobby: 'HOBBY',
  game: 'GAME',
  beauty: 'BEAUTY',
  food: 'FOOD',
  etc: 'OTHER',
};

const REASON_TO_API: Record<ReasonId, string> = {
  sns_ad: 'ADVERTISEMENT',
  discount_limited: 'DISCOUNT_LIMITED',
  bundle_discount: 'EXTRA_DISCOUNT',
  stress: 'STRESS',
  peer: 'SOCIAL',
  need: 'NECESSITY',
  long_wanted: 'LONG_WANTED',
  other: 'OTHER',
};

const SOURCE_TO_API: Record<ItemSource, string> = {
  manual: 'MANUAL',
  screenshot: 'SCREENSHOT',
  link: 'URL',
};

const httpsUrl = (value: string | undefined) => (value?.startsWith('https://') ? value : undefined);

export function toApiItemInput(item: Item) {
  return {
    name: item.name,
    price: item.price,
    category: CATEGORY_TO_API[item.category],
    purchase_reasons: item.reasons.map((reason) => REASON_TO_API[reason]),
    reason_other_text: item.reasonOtherText,
    sale_ends_on: item.saleEndsAt,
    source: SOURCE_TO_API[item.source],
    source_url: httpsUrl(item.sourceUrl),
    image_url: httpsUrl(item.imageUri),
    question_mode: 'LOCAL',
  };
}

/** mock 데모는 로컬만 저장하고, real 모드에서는 반드시 BE 등록까지 완료한다. */
export type DiscountReview = {
  rule: DiscountRule;
  neededIds: string[];
  decision: 'NEEDED' | 'ALL';
};

export async function registerItemsRemote(items: Item[], idempotencyKey: string, review?: DiscountReview): Promise<void> {
  const payload = {
    items: items.map(toApiItemInput),
    ...(review ? { discount_review: {
      rule: {
        minimum_amount: review.rule.minAmount,
        unit: review.rule.unit === 'pct' ? 'PCT' : 'WON',
        value: review.rule.value,
        shipping_fee: review.rule.shipFee,
        free_shipping_enabled: review.rule.freeShipOn,
        free_shipping_minimum: review.rule.freeShipOn ? review.rule.freeShipMin : null,
      },
      needed_item_indexes: items.flatMap((item, index) => review.neededIds.includes(item.id) ? [index] : []),
      decision: review.decision,
    } } : {}),
  };
  // The request body is part of the retry identity: edits must not reuse an old key.
  const key = await registrationRequestKey(idempotencyKey, payload);
  const selected = review?.decision === 'NEEDED' ? items.filter((i) => review.neededIds.includes(i.id)) : items;
  if (env.aiMode === 'real') {
    const response = z.object({ items: z.array(RemoteItemSchema) }).parse(await bobApi.items.batchCreate(payload, key));
    if (response.items.length !== selected.length) throw new Error('등록 응답의 상품 수가 일치하지 않아요.');
    selected.forEach((item, index) => applyRemoteItem(item.id, response.items[index]));
  } else {
    const today = getToday();
    update((s) => ({ items: { ...s.items, ...Object.fromEntries(selected.map((i) => {
      const days = Math.max(0, Math.min(simulationDays(i.price, policy.simulationBands), i.saleEndsAt ? diffDays(today, i.saleEndsAt) : Infinity));
      return [i.id, {...i, registrationState: 'complete' as const, simulation: { startAt: `${days ? addDays(today,1) : today}T00:00:00+09:00`, durationDays: days }}];
    })) } }));
  }
}

const RemoteItemSchema = z.object({
  id: z.string(), decision: z.string().nullable(),
  simulation: z.object({ id: z.string(), start_date: z.string(), end_date_exclusive: z.string(), duration_days: z.number(), observation_dates: z.array(z.string()).optional() }),
  purchase: z.object({ id: z.string(), purchased_on: z.string(), review_start: z.string(), review_end: z.string() }).nullable(),
});
export function applyRemoteItem(localId: string, response: unknown): Item {
  const row = RemoteItemSchema.parse(response);
  const item = getState().items[localId];
  if (!item) throw new Error('등록 초안을 찾지 못했어요.');
  const next: Item = { ...item, registrationState: 'complete', remoteId: row.id, simulationId: row.simulation.id,
    status: row.decision === 'BUY' ? 'bought' : row.decision === 'GIVE_UP' ? 'abandoned' : 'simulating',
    simulation: { startAt: `${row.simulation.start_date}T00:00:00+09:00`, durationDays: row.simulation.duration_days, endDate: row.simulation.end_date_exclusive, observationDates: row.simulation.observation_dates },
    ...(row.purchase ? { purchaseId: row.purchase.id, purchase: { boughtAt: `${row.purchase.purchased_on}T00:00:00+09:00`, reviewStart: row.purchase.review_start, reviewEnd: row.purchase.review_end } } : {}),
  };
  update((s) => ({items: {...s.items, [localId]: next}}));
  return next;
}

// An unchanged registration request always keeps the same retry key.
async function registrationRequestKey(base: string, payload: unknown): Promise<string> {
  // A deterministic 128-bit digest avoids retaining another copy of the cart.
  return `${base.slice(0,60)}-${requestDigest(JSON.stringify(payload))}`;
}

/** Extra-discount carts must be reviewed before the backend can start their simulations. */
export async function registerAfterReasons(items: Item[], idempotencyKey: string): Promise<'discount' | 'done'> {
  if (items.some((item) => item.reasons.includes('bundle_discount'))) return 'discount';
  await registerItemsRemote(items, idempotencyKey);
  return 'done';
}

/** Only change local decisions after the server accepts the exact reviewed cart. */
export async function completeDiscountRegistration(items: Item[], review: DiscountReview, idempotencyKey?: string): Promise<number> {
  if (idempotencyKey) await registerItemsRemote(items, idempotencyKey, review);
  const excluded = review.decision === 'NEEDED' ? items.filter((item) => !review.neededIds.includes(item.id)) : [];
  excluded.forEach((item) => removeItem(item.id));
  return excluded.length;
}
