import { bobApi } from '@/api';
import { addItems, resetAllData } from '@/data';
import { completeDiscountRegistration, registerAfterReasons, toApiItemInput } from '@/data/actions/remoteItems';
import { getState } from '@/data/store';
import { makeItem } from '@/test/factories';
import type { DiscountRule } from '@/types';

jest.mock('@/api', () => ({ bobApi: { items: { batchCreate: jest.fn() } } }));
jest.mock('@/config/env', () => ({ env: { aiMode: 'real' } }));

const post = bobApi.items.batchCreate as jest.Mock;
const rule: DiscountRule = { minAmount: 30000, value: 10, unit: 'pct', freeShipOn: true, freeShipMin: 50000, shipFee: 3000 };
const responseFor = (body: {items: unknown[]; discount_review?: {decision:string;needed_item_indexes:number[]}}) => ({items:body.items.flatMap((_,index)=>body.discount_review?.decision === 'NEEDED' && !body.discount_review.needed_item_indexes.includes(index) ? [] : [{id:`server-${index}`,decision:null,simulation:{id:`sim-${index}`,start_date:'2026-11-02',end_date_exclusive:'2026-11-05',duration_days:3,observation_dates:['2026-11-02','2026-11-03','2026-11-04']},purchase:null}])});
beforeEach(() => { post.mockReset(); post.mockImplementation(async body=>responseFor(body)); resetAllData(); });

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

describe('할인 확인 후 등록', () => {
  const createCart = () => addItems([
    { name: '말차', price: 30800, category: 'food', reasons: ['bundle_discount'], source: 'screenshot' },
    { name: '전기난로', price: 158000, category: 'appliance', reasons: ['peer'], source: 'screenshot' },
  ]);

  it('앞 품목만 추가 할인 이유여도 이유 선택에서는 서버 요청 없이 할인 화면으로 간다', async () => {
    await expect(registerAfterReasons(createCart(), 'reg_test_123')).resolves.toBe('discount');
    expect(post).not.toHaveBeenCalled();
  });

  it('추가 할인 이유가 없으면 일반 등록을 그대로 완료한다', async () => {
    await expect(registerAfterReasons(addItems([{name:'키보드',price:50000,category:'digital',reasons:['need'],source:'manual'}],true), 'reg_normal_123')).resolves.toBe('done');
    expect(post).toHaveBeenCalledWith({ items: [expect.objectContaining({ purchase_reasons: ['NECESSITY'] })] }, expect.stringMatching(/^reg_normal_123-/));
  });

  it('화면의 품목 순서에 맞는 인덱스와 할인·배송 조건을 함께 보내고 성공 후 제외한 초안을 적립 없이 제거한다', async () => {
    const items = createCart();
    post.mockImplementationOnce(async body => {
      expect(getState().items[items[0].id].status).toBe('simulating');
      return responseFor(body);
    });
    const review = { rule, neededIds: [items[1].id], decision: 'NEEDED' as const };
    await expect(completeDiscountRegistration(items, review, 'reg_test_123')).resolves.toBe(1);
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ discount_review: {
      decision: 'NEEDED', needed_item_indexes: [1],
      rule: { minimum_amount: 30000, unit: 'PCT', value: 10, shipping_fee: 3000, free_shipping_enabled: true, free_shipping_minimum: 50000 },
    } }), expect.stringMatching(/^reg_test_123-/));
    expect(getState().items[items[0].id]).toBeUndefined();
    expect(Object.keys(getState().impulses)).toHaveLength(0);
    expect(getState().items[items[1].id]).toMatchObject({remoteId:'server-1',simulationId:'sim-1',registrationState:'complete'});
    expect(getState().items[items[1].id].status).toBe('simulating');
  });

  it('등록 실패 시 로컬 결정을 바꾸지 않고 같은 요청·키로 재시도한다', async () => {
    const items = createCart();
    const review = { rule, neededIds: [], decision: 'NEEDED' as const };
    post.mockRejectedValueOnce(new Error('timeout'));
    await expect(completeDiscountRegistration(items, review, 'reg_retry_123')).rejects.toThrow('timeout');
    expect(items.every((item) => getState().items[item.id].status === 'simulating')).toBe(true);
    await expect(completeDiscountRegistration(items, review, 'reg_retry_123')).resolves.toBe(2);
    expect(post.mock.calls[0]).toEqual(post.mock.calls[1]);
    expect(post.mock.calls[1][0].discount_review.needed_item_indexes).toEqual([]);
  });

  it('다 살게요도 할인 검토를 보내며 무료배송 OFF·원 할인은 정확히 변환한다', async () => {
    const items = createCart();
    await expect(completeDiscountRegistration(items, {
      rule: { ...rule, unit: 'won', value: 3000, freeShipOn: false },
      neededIds: [items[1].id], decision: 'ALL',
    }, 'reg_all_123')).resolves.toBe(0);
    expect(post.mock.calls[0][0].discount_review).toMatchObject({
      decision: 'ALL', needed_item_indexes: [1],
      rule: { unit: 'WON', value: 3000, shipping_fee: 3000, free_shipping_enabled: false, free_shipping_minimum: null },
    });
    expect(items.every((item) => getState().items[item.id].status === 'simulating')).toBe(true);
  });
});
