/**
 * BE 서버 AI 연동 (`BE api 공유.md` 기준).
 *
 * - 데이터는 로컬에만 저장하므로 BE API 중 AI 기능(등록 초안, 장바구니 추출)만 쓴다.
 * - 경로는 공유 문서 기준으로 확정. 요청 본문과 응답 형식은 스펙을 받기 전이라 가정이다
 *   (요청: 아래 body, 응답: mappers.ts) — 스펙이 오면 이 두 곳만 고친다.
 * - BE에 없는 기능은 AiUnavailableError → withFallback이 로컬 대체(키워드·템플릿·직접 입력)로 넘긴다.
 */
import { bobApi } from '@/api';

import { AiUnavailableError, type AiService } from '../types';
import { mapCartScreenshot, mapCategory } from './mappers';

const unsupported = (feature: keyof AiService) => () => Promise.reject(new AiUnavailableError(feature));

export const realAi: AiService = {
  // 등록 초안: 이름(·가격) → 카테고리 추천 (가정)
  classifyCategory: async ({ name, price }) => mapCategory(await bobApi.itemDrafts.create({ name, price })),
  parseCartScreenshot: async (image) => mapCartScreenshot(await bobApi.cartExtractions.create(image)),
  // BE 공유 API에 없음 (링크 파싱·할인 조건 인식·질문 맞춤)
  parseLink: unsupported('parseLink'),
  parseDiscountRules: unsupported('parseDiscountRules'),
  personalizeQuestions: unsupported('personalizeQuestions'),
};
