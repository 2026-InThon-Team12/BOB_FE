/**
 * BE 서버 AI 연동 (https://bob-be.vercel.app/docs 기준).
 *
 * - 데이터는 로컬에만 저장하므로 BE API 중 AI 기능(등록 초안, 장바구니·URL 추출)만 쓴다.
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
  // BE 공유 API에 없음 (할인 조건 인식·질문 맞춤)
  parseDiscountRules: unsupported('parseDiscountRules'),
  personalizeQuestions: unsupported('personalizeQuestions'),
};
