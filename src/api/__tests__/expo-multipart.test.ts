import { Platform } from 'react-native';

// Exercise the installed SDK's real encoder, not a fetch spy that accepts any body.
import { installFormDataPatch } from '../../../node_modules/expo/src/winter/FormData';
import { convertFormDataAsync } from '../../../node_modules/expo/src/winter/fetch/convertFormData';
import { toFormData } from '../http';

const originalFormData = globalThis.FormData;
const originalOS = Platform.OS;

beforeEach(() => {
  class NativeFormData { _parts: unknown[] = []; }
  globalThis.FormData = installFormDataPatch(NativeFormData as unknown as typeof FormData) as unknown as typeof FormData;
  Platform.OS = 'android';
});
afterEach(() => { globalThis.FormData = originalFormData; Platform.OS = originalOS; });

it('reproduces the pre-request failure of the old URI-object payload on SDK 58', async () => {
  const legacy = new FormData();
  legacy.append('image', { uri: 'file:///cart.png', name: 'cart.png', type: 'image/png' } as unknown as Blob);
  await expect(convertFormDataAsync(legacy, 'test-boundary')).rejects.toThrow('Unsupported FormDataPart implementation');
});

it.each(['android', 'ios'] as const)('encodes actual file bytes with image filename and MIME on %s', async (os) => {
  Platform.OS = os;
  const form = toFormData({ upload: { uri: 'file:///cart.png', name: 'cart.png', mimeType: 'image/png' } });
  const { body } = await convertFormDataAsync(form, 'test-boundary');
  const encoded = Array.from(body).map((n) => String.fromCharCode(n)).join('');
  expect(encoded).toContain('name="image"; filename="cart.png"');
  expect(encoded).toContain('content-type: image/png');
  expect(encoded).toContain(String.fromCharCode(137, 80, 78, 71));
  expect(encoded).not.toContain('file:///');
});
