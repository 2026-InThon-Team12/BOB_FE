/** 사용자가 확인한 로컬 품목을 BE /items/batch 계약으로 등록한다. */
import { bobApi } from '@/api';
import { env } from '@/config/env';
import type { CategoryId, Item, ItemSource, ReasonId } from '@/types';

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
export async function registerItemsRemote(items: Item[], idempotencyKey: string): Promise<void> {
  if (env.aiMode !== 'real') return;
  await bobApi.items.batchCreate({ items: items.map(toApiItemInput) }, idempotencyKey);
}
