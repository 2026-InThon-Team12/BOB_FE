import { DEFAULT_OPTIONS, defaultQuestionTemplates } from '@/constants/questionTemplates';
import { CATEGORY_IDS } from '@/types';

describe('질문 템플릿 (디자인 시안: 답 3개 = 스와이프 3방향)', () => {
  it('모든 카테고리의 모든 질문은 있었어요 · 딱히 없었어요 · 잘 모르겠어요', () => {
    for (const category of CATEGORY_IDS) {
      for (const t of defaultQuestionTemplates(category)) {
        expect(t.options).toEqual(DEFAULT_OPTIONS);
      }
    }
    expect(DEFAULT_OPTIONS.map((o) => o.label)).toEqual(['있었어요', '딱히 없었어요', '잘 모르겠어요']);
  });
});
