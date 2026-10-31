/**
 * BE 서버 AI 연동 (https://bob-be.vercel.app/docs 기준).
 *
 * - 이 어댑터는 등록 초안·장바구니·URL 추출을 담당한다.
 * - OpenAPI의 ItemDraftRequest / DraftAnalysis 형식을 사용한다.
 * - BE에 없는 기능은 AiUnavailableError → withFallback이 로컬 대체(키워드·템플릿·직접 입력)로 넘긴다.
 */
import { bobApi } from '@/api';

import { AiUnavailableError, type AiService } from '../types';
import { mapCartScreenshot, mapCategory, mapLink } from './mappers';

const unsupported = (feature: keyof AiService) => () => Promise.reject(new AiUnavailableError(feature));

export const realAi: AiService = {
  // 등록 초안: 이름(·가격) → DraftAnalysis.items[0]의 카테고리
  classifyCategory: async ({ name, price }) => mapCategory(await bobApi.itemDrafts.create({ name, price })),
  parseCartScreenshot: async (image) => mapCartScreenshot(await bobApi.cartExtractions.create(image)),
  parseLink: async (url) => mapLink(await bobApi.productUrlDrafts.create(url), url),
  // 구형 일괄 질문 인터페이스. 실제 매일 맞춤 질문·요약은 data/actions/reflections에서 서버 ID로 호출한다.
  parseDiscountRules: unsupported('parseDiscountRules'),
  personalizeQuestions: unsupported('personalizeQuestions'),
};
