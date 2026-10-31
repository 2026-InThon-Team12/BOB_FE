/** 데모·개발용 mock. 실제 인식으로 오인할 수 있는 고정 사진 결과는 만들지 않는다. */
import { policy } from '@/config/policy';
import { defaultQuestionTemplates } from '@/constants/questionTemplates';

import { guessCategoryByKeyword } from './fallback';
import { AiUnavailableError, type AiService } from './types';

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
    throw new AiUnavailableError('parseCartScreenshot');
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
