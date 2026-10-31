import { toApiItemInput } from '@/data/actions/remoteItems';
import { makeItem } from '@/test/factories';

describe('BE 품목 등록 mapper', () => {
  it('카테고리·이유·출처를 OpenAPI enum으로 변환한다', () => {
    expect(
      toApiItemInput(
        makeItem({
          name: '무선 키보드',
          category: 'digital',
          reasons: ['sns_ad', 'need', 'other'],
          reasonOtherText: '업무용',
          saleEndsAt: '2026-11-02',
          source: 'screenshot',
          sourceUrl: 'https://shop.example.com/item/1',
          imageUri: 'data:image/jpeg;base64,local-only',
        }),
      ),
    ).toEqual({
      name: '무선 키보드',
      price: 50000,
      category: 'DIGITAL',
      purchase_reasons: ['ADVERTISEMENT', 'NECESSITY', 'OTHER'],
      reason_other_text: '업무용',
      sale_ends_on: '2026-11-02',
      source: 'SCREENSHOT',
      source_url: 'https://shop.example.com/item/1',
      image_url: undefined,
      question_mode: 'LOCAL',
    });
  });
});
