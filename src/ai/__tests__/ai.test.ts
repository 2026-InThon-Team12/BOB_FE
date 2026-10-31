import { AiRequestError, AiUnavailableError, withFallback, type AiService } from '@/ai';
import { fallbackAi, guessCategoryByKeyword } from '@/ai/fallback';
import { mockAi } from '@/ai/mock';
import { realAi } from '@/ai/real';
import { mapCartScreenshot, mapCategory, mapLink, mapQuestions, toCategory } from '@/ai/real/mappers';

describe('fallback', () => {
  it('키워드로 카테고리 추측, 못 찾으면 기타', () => {
    expect(guessCategoryByKeyword('닌텐도 스위치 OLED')).toEqual({ category: 'game', confidence: 0.5 });
    expect(guessCategoryByKeyword('오버핏 니트')).toMatchObject({ category: 'clothing' });
    expect(guessCategoryByKeyword('에어팟 프로')).toMatchObject({ category: 'digital' });
    expect(guessCategoryByKeyword('알 수 없는 물건')).toEqual({ category: 'etc', confidence: 0 });
  });

  it('인식 기능은 AiUnavailableError (화면이 직접 입력으로 전환)', async () => {
    await expect(fallbackAi.parseCartScreenshot({ uri: 'x' })).rejects.toBeInstanceOf(AiUnavailableError);
    await expect(fallbackAi.parseLink('https://a.b')).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('질문은 카테고리 기본 템플릿', async () => {
    const qs = await fallbackAi.personalizeQuestions({ name: '의자', price: 1, category: 'hobby', reasons: [] });
    expect(qs.length).toBeGreaterThan(0);
  });
});

describe('withFallback', () => {
  const failing: AiService = {
    classifyCategory: () => Promise.reject(new AiRequestError('x', 'timeout')),
    parseCartScreenshot: () => Promise.reject(new AiRequestError('x', 'network')),
    parseLink: () => Promise.reject(new AiRequestError('x', 'http', 500)),
    parseDiscountRules: () => Promise.reject(new AiRequestError('x', 'invalid_response')),
    personalizeQuestions: () => Promise.reject(new AiRequestError('x', 'not_configured')),
  };

  it('원격 호출이 실패하면 로컬 대체를 쓴다', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ai = withFallback(failing, fallbackAi);
    await expect(ai.classifyCategory({ name: '캠핑 랜턴' })).resolves.toMatchObject({ category: 'hobby' });
    await expect(ai.parseCartScreenshot({ uri: 'x' })).rejects.toMatchObject({ code: 'network', message: 'x' });
    warn.mockRestore();
  });

  it('원격 호출이 성공하면 그 결과를 쓴다', async () => {
    const ai = withFallback({ ...failing, classifyCategory: async () => ({ category: 'food', confidence: 1 }) }, fallbackAi);
    await expect(ai.classifyCategory({ name: '캠핑 의자' })).resolves.toEqual({ category: 'food', confidence: 1 });
  });
});

describe('real mappers', () => {
  it('카테고리는 API enum·영문 키·한글 라벨을 받는다', () => {
    expect(toCategory('DIGITAL')).toBe('digital');
    expect(toCategory('DAILY_LIVING')).toBe('daily');
    expect(toCategory('APPLIANCES')).toBe('appliance');
    expect(toCategory('digital')).toBe('digital');
    expect(toCategory('디지털기기')).toBe('digital');
    expect(toCategory('없는값')).toBeUndefined();
    expect(mapCategory({ category: '모르는 분류', confidence: 0.9 })).toEqual({ category: 'etc', confidence: 0 });
  });

  it('OpenAPI DraftAnalysis에서 카테고리를 꺼낸다', () => {
    expect(
      mapCategory({
        items: [
          {
            name: '무선 이어폰',
            price: 89000,
            category: 'DIGITAL',
            supplemental_question: '오늘 쓸 일이 있었나요?',
            source: 'MANUAL',
            category_source: 'AI',
            simulation_days: 7,
          },
        ],
        warnings: [],
        analysis_method: 'text',
      }),
    ).toEqual({ category: 'digital', confidence: 0.5 });
  });

  it('스크린샷 DraftAnalysis의 items·warnings·analysis_method를 보존한다', () => {
    const analysis = mapCartScreenshot({
      items: [{ name: ' 니트 ', price: 59000.4, category: '의류', confidence: 0.9 }],
      warnings: ['CONFIRM_EXTRACTED_ITEMS'],
      analysis_method: 'ocr',
    });
    expect(analysis).toEqual({
      items: [
        {
          name: '니트',
          price: 59000,
          imageUri: undefined,
          category: 'clothing',
          categoryConfidence: 0.9,
          source: 'screenshot',
          sourceUrl: undefined,
        },
      ],
      warnings: ['CONFIRM_EXTRACTED_ITEMS'],
      analysisMethod: 'ocr',
    });
  });

  it('OpenAPI 스크린샷 응답의 snake_case·null 필드를 변환한다', () => {
    const analysis = mapCartScreenshot({
      items: [
        {
          name: ' 오버핏 니트 ',
          price: null,
          category: 'CLOTHING',
          supplemental_question: '오늘 입을 순간이 있었나요?',
          source: 'SCREENSHOT',
          source_url: null,
          image_url: 'https://example.com/knit.jpg',
          image_crop: null,
          category_source: 'AI',
          simulation_days: null,
        },
      ],
      warnings: [],
      analysis_method: 'vision',
    });
    expect(analysis.items).toEqual([
      {
        name: '오버핏 니트',
        price: undefined,
        imageUri: 'https://example.com/knit.jpg',
        category: 'clothing',
        categoryConfidence: 0.5,
        source: 'screenshot',
        sourceUrl: undefined,
      },
    ]);
    expect(analysis).toMatchObject({ warnings: [], analysisMethod: 'vision' });
  });

  it('OpenAPI 상품 URL DraftAnalysis를 링크 초안으로 변환한다', () => {
    const sourceUrl = 'https://shop.example.com/item/1';
    expect(
      mapLink(
        {
          items: [
            {
              name: '기계식 키보드',
              price: 30000,
              category: 'DIGITAL',
              supplemental_question: '오늘 키보드가 필요했나요?',
              source: 'URL',
              source_url: sourceUrl,
              category_source: 'AI',
              simulation_days: 7,
            },
          ],
          warnings: [],
          analysis_method: 'text',
        },
        sourceUrl,
      ),
    ).toMatchObject({ name: '기계식 키보드', category: 'digital', source: 'link', sourceUrl });
  });

  it('vision 상품 이미지 crop을 로컬에서 표시할 수 있는 data URI로 변환한다', () => {
    const imageCrop = { mime_type: 'image/jpeg', base64: '/9j/2Q==', width: 100, height: 80, box: [0, 0, 1000, 1000] };
    const result = mapCartScreenshot({
      items: [{ name: '키보드', price: 30000, image_url: null, image_crop: imageCrop }],
      analysis_method: 'vision',
    });
    expect(result.items[0].imageUri).toBe('data:image/jpeg;base64,/9j/2Q==');
  });

  it('상품 이미지 URL이 있으면 crop보다 우선한다', () => {
    const result = mapCartScreenshot({
      items: [{ name: '키보드', image_url: 'https://example.com/keyboard.jpg',
        image_crop: { mime_type: 'image/jpeg', base64: '/9j/2Q==' } }],
      analysis_method: 'vision',
    });
    expect(result.items[0].imageUri).toBe('https://example.com/keyboard.jpg');
  });

  it.each([
    null,
    {},
    { mime_type: 'image/svg+xml', base64: 'PHN2Zz4=' },
    { mime_type: 'image/jpeg', base64: '' },
    { mime_type: 'image/jpeg', base64: 'invalid base64' },
    { mime_type: 'image/jpeg', base64: '/9j/2Q=' },
  ])('crop이 없거나 잘못돼도 이름과 가격은 유지한다: %j', (imageCrop) => {
    const result = mapCartScreenshot({
      items: [{ name: '키보드', price: 30000, image_crop: imageCrop }],
      analysis_method: 'vision',
    });
    expect(result.items[0]).toMatchObject({ name: '키보드', price: 30000, imageUri: undefined });
  });

  it('형식이 다르면 invalid_response', () => {
    expect(() => mapCartScreenshot({ wrong: true })).toThrow(AiRequestError);
    expect(() => mapQuestions([{ text: 'q', options: [{ label: 'a', countsAsUse: true }] }])).toThrow(AiRequestError);
  });

  it('질문: 모르는 kind는 기본값, variant 기본 normal', () => {
    const [q] = mapQuestions({
      questions: [{ text: '오늘?', kind: 'weird', options: [{ label: '예', countsAsUse: true }, { label: '아니오', countsAsUse: false }] }],
    });
    expect(q).toMatchObject({ kind: 'need_moment', variant: 'normal' });
  });
});

describe('mock', () => {
  it('장바구니 스크린샷 실패를 고정 상품으로 채우지 않는다', async () => {
    jest.useFakeTimers();
    const p = mockAi.parseCartScreenshot({ uri: 'x' });
    jest.runAllTimers();
    await expect(p).rejects.toBeInstanceOf(AiUnavailableError);
    jest.useRealTimers();
  });
});

describe('real (BE 공유 API 기준)', () => {
  it('BE에 없는 기능은 AiUnavailableError → 로컬 대체로 넘어간다', async () => {
    await expect(realAi.parseDiscountRules({ uri: 'x' })).rejects.toBeInstanceOf(AiUnavailableError);
    await expect(
      realAi.personalizeQuestions({ name: '의자', price: 1, category: 'hobby', reasons: [] }),
    ).rejects.toBeInstanceOf(AiUnavailableError);

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const qs = await withFallback(realAi, fallbackAi).personalizeQuestions({ name: '의자', price: 1, category: 'hobby', reasons: [] });
    expect(qs.length).toBeGreaterThan(0);
    warn.mockRestore();
  });
});
