/**
 * 데모·개발용 mock. 그럴듯한 고정 응답을 약간의 지연과 함께 돌려준다.
 */
import { policy } from '@/config/policy';
import { defaultQuestionTemplates } from '@/constants/questionTemplates';

import { guessCategoryByKeyword } from './fallback';
import type { AiService } from './types';

const delay = () => {
  const { minDelayMs, maxDelayMs } = policy.mock;
  return new Promise((r) => setTimeout(r, minDelayMs + Math.random() * (maxDelayMs - minDelayMs)));
};

export const mockAi: AiService = {
  async classifyCategory({ name }) {
    await delay();
    const guess = guessCategoryByKeyword(name);
    return { ...guess, confidence: guess.category === 'etc' ? 0.3 : 0.92 };
  },

  async parseCartScreenshot() {
    await delay();
    return [
      { name: '오버핏 니트 가디건', price: 59_000, category: 'clothing', categoryConfidence: 0.95, source: 'screenshot' },
      { name: '무선 블루투스 이어폰', price: 89_000, category: 'digital', categoryConfidence: 0.93, source: 'screenshot' },
      { name: '데스크 조명 스탠드', price: 34_900, category: 'furniture', categoryConfidence: 0.71, source: 'screenshot' },
    ];
  },

  async parseLink(url) {
    await delay();
    return {
      name: '캠핑 릴렉스 체어',
      price: 45_000,
      category: 'hobby',
      categoryConfidence: 0.88,
      source: 'link',
      sourceUrl: url,
    };
  },

  async parseDiscountRules() {
    await delay();
    const { defaultMin, defaultPct, freeShipMin, shipFee } = policy.discount;
    return { minAmount: defaultMin, value: defaultPct, unit: 'pct', freeShipOn: true, freeShipMin, shipFee };
  },

  async personalizeQuestions({ category }) {
    await delay();
    return defaultQuestionTemplates(category);
  },
};
