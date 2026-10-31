/**
 * 로컬 대체 구현 — AI가 없거나 실패했을 때.
 * - 카테고리: 키워드 사전으로 추측 (못 찾으면 '기타')
 * - 질문: 카테고리 기본 템플릿
 * - 인식 기능(스크린샷·링크·할인 조건): AiUnavailableError → 화면이 직접 입력으로 전환
 */
import { CATEGORY_KEYWORDS } from '@/constants/categoryKeywords';
import { defaultQuestionTemplates } from '@/constants/questionTemplates';

import { AiUnavailableError, type AiService, type CategoryGuess } from './types';

export function guessCategoryByKeyword(name: string): CategoryGuess {
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => normalized.includes(k.toLowerCase().replace(/\s+/g, '')))) {
      return { category, confidence: 0.5 };
    }
  }
  return { category: 'etc', confidence: 0 };
}

export const fallbackAi: AiService = {
  classifyCategory: async ({ name }) => guessCategoryByKeyword(name),
  parseCartScreenshot: async () => {
    throw new AiUnavailableError('parseCartScreenshot');
  },
  parseLink: async () => {
    throw new AiUnavailableError('parseLink');
  },
  parseDiscountRules: async () => {
    throw new AiUnavailableError('parseDiscountRules');
  },
  personalizeQuestions: async ({ category }) => defaultQuestionTemplates(category),
};
