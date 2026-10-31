import { productUrlFromText } from '../productUrl';

it('extracts a shopping share URL including a Markdown-pasted link', () => {
  expect(productUrlFromText('쿠팡을 추천합니다!\nhttps://link.coupang.com/a/iiCxV0bZzo')).toBe('https://link.coupang.com/a/iiCxV0bZzo');
  expect(productUrlFromText('[상품](https://shop.example/p?itemId=1&vendorItemId=2)')).toBe('https://shop.example/p?itemId=1&vendorItemId=2');
});
it.each(['http://shop.example/p', 'https://u:p@shop.example/p', 'https://shop.example:8443/p', 'https://one.example https://two.example', '상품명'])('rejects ambiguous or unsupported input %s', value => {
  expect(productUrlFromText(value)).toBeNull();
});
