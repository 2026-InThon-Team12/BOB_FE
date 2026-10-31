import { newDraft } from '../apkDomain';
import { cropImageUri, storedCropUri } from '../imageCrop';

it.each(['image/jpeg', 'image/png', 'image/webp'])('preserves %s in APK screenshot drafts', (mime_type) => {
  const image_crop = { mime_type, base64: 'AQIDBA==' };
  const draft = newDraft({ name: '사진 상품', price: 1000, image_crop });
  expect(storedCropUri(draft.crop)).toBe(`data:${mime_type};base64,AQIDBA==`);
});

it('keeps existing JPEG crops readable after the import', () => {
  expect(storedCropUri('AQIDBA==')).toBe('data:image/jpeg;base64,AQIDBA==');
});

it.each([
  { mime_type: 'image/svg+xml', base64: 'AQIDBA==' },
  { mime_type: 'image/png', base64: 'invalid base64' },
  { mime_type: 'image/png', base64: '' },
])('discards a malformed crop without losing the product: %j', (image_crop) => {
  expect(cropImageUri(image_crop)).toBeUndefined();
  expect(newDraft({ name: '사진 상품', price: 1000, image_crop })).toMatchObject({
    name: '사진 상품',
    price: '1000',
    crop: '',
  });
});
