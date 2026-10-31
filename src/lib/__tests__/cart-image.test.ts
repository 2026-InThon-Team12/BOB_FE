import { ImageManipulator } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { prepareCartImage } from '@/lib/image';

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { PNG: 'png', JPEG: 'jpeg' },
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const base64 = (bytes: number) => 'A'.repeat(Math.ceil(bytes / 3) * 4);
let save: jest.Mock;
let resize: jest.Mock;
let release: jest.Mock;
let releaseContext: jest.Mock;
const originalOS = Platform.OS;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  Platform.OS = 'android';
  save = jest.fn();
  resize = jest.fn();
  release = jest.fn();
  releaseContext = jest.fn();
  const context = { resize, renderAsync: jest.fn().mockResolvedValue({ saveAsync: save, release }), release: releaseContext };
  resize.mockReturnValue(context);
  (ImageManipulator.manipulate as jest.Mock).mockReturnValue(context);
});
afterEach(() => { Platform.OS = originalOS; globalThis.fetch = originalFetch; });

it('converts an unsupported HEIC source to a sharp PNG with matching upload metadata', async () => {
  save.mockResolvedValue({ uri: 'file:///converted.png', width: 1080, height: 2000, base64: base64(3000) });
  const result = await prepareCartImage({ uri: 'file:///source.heic', name: 'source.heic', mimeType: 'image/heic', width: 1080, height: 2000 });
  expect(result).toMatchObject({ uri: 'file:///converted.png', name: 'cart.png', mimeType: 'image/png' });
  expect(save).toHaveBeenCalledWith({ format: 'png', compress: 1, base64: true });
  expect(release).toHaveBeenCalled();
  expect(releaseContext).toHaveBeenCalled();
});

it('falls back from oversized PNG to a JPEG below 4MB', async () => {
  save.mockResolvedValueOnce({ base64: base64(4_000_002) })
    .mockResolvedValueOnce({ base64: base64(4_000_002) })
    .mockResolvedValueOnce({ uri: 'file:///cart.jpg', width: 1000, height: 2000, base64: base64(3000) });
  const result = await prepareCartImage({ uri: 'file:///large.png', width: 1000, height: 2000 });
  expect(result).toMatchObject({ name: 'cart.jpg', mimeType: 'image/jpeg' });
  expect(save).toHaveBeenLastCalledWith({ format: 'jpeg', compress: 0.88, base64: true });
});

it('bounds tall screenshots without cropping and rejects an image still above the byte limit', async () => {
  save.mockResolvedValue({ base64: base64(4_000_002) });
  await expect(prepareCartImage({ uri: 'file:///tall.png', width: 2000, height: 16000 })).rejects.toThrow('사진이 너무 커요');
  expect(resize).toHaveBeenCalledWith({ width: 1000, height: 8000 });
  expect(save).toHaveBeenCalledTimes(5);
  expect(release).toHaveBeenCalled();
});

it('uploads the converted Blob on web, not the original unsupported file', async () => {
  Platform.OS = 'web';
  const converted = new Blob(['png'], { type: 'image/png' });
  const original = new Blob(['heic'], { type: 'image/heic' });
  save.mockResolvedValue({ uri: 'data:image/png;base64,AAAA', width: 100, height: 200, base64: 'AAAA' });
  globalThis.fetch = jest.fn().mockResolvedValue({ blob: async () => converted });
  const result = await prepareCartImage({ uri: 'blob:original', width: 100, height: 200, file: original });
  expect(result.file).toBe(converted);
  expect(result.mimeType).toBe('image/png');
});

it('rejects invalid dimensions before decoding', async () => {
  (ImageManipulator.manipulate as jest.Mock).mockClear();
  await expect(prepareCartImage({ uri: 'file:///broken', width: 0, height: 100 })).rejects.toThrow('사진을 열 수 없어요');
  expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
});
