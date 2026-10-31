/**
 * 이미지 선택·축소.
 * - AI 인식용 원본은 업로드할 때만 쓰고 저장하지 않는다.
 * - 저장하는 사진(목표·물품 썸네일)은 작은 JPEG data URI로 바꿔 로컬 데이터에 넣는다
 *   (웹 localStorage 용량 한도 대비, 백업 파일에도 그대로 포함됨).
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { policy } from '@/config/policy';
import { copy } from '@/constants/copy';

export type PickedImage = {
  uri: string;
  name?: string;
  mimeType?: string;
  /** 웹에서 고른 파일 (업로드용) */
  file?: Blob;
  width: number;
  height: number;
};

/** 앨범에서 사진 한 장 고르기. 취소하면 null */
export async function pickImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    name: a.fileName ?? undefined,
    mimeType: a.mimeType ?? undefined,
    file: a.file ?? undefined,
    width: a.width,
    height: a.height,
  };
}

/** Match the native APK's upload limits while retaining small screenshot text. */
export async function prepareCartImage(image: PickedImage): Promise<PickedImage> {
  if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width <= 0 || image.height <= 0) {
    throw new Error(copy.register.imageUnreadable);
  }
  const limits = policy.cartImage;
  const scale = Math.min(1, limits.maxSide / Math.max(image.width, image.height),
    Math.sqrt(limits.maxPixels / (image.width * image.height)));
  const width = Math.max(1, Math.floor(image.width * scale));
  const height = Math.max(1, Math.floor(image.height * scale));
  const context = ImageManipulator.manipulate(image.uri, { maxWidth: width, maxHeight: height });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    rendered = await context.resize({ width, height }).renderAsync();
    const formats = [
      ...(width * height <= limits.pngMaxPixels ? [{ format: SaveFormat.PNG, compress: 1 }] : []),
      ...limits.jpegQualities.map((compress) => ({ format: SaveFormat.JPEG, compress })),
    ];
    for (const options of formats) {
      const saved = await rendered.saveAsync({ ...options, base64: true });
      if (!saved.base64) throw new Error(copy.register.imageUnreadable);
      const padding = saved.base64.endsWith('==') ? 2 : saved.base64.endsWith('=') ? 1 : 0;
      const bytes = saved.base64.length * 3 / 4 - padding;
      if (bytes <= 0 || bytes > limits.maxBytes) continue;
      const png = options.format === SaveFormat.PNG;
      const mimeType = png ? 'image/png' : 'image/jpeg';
      // Web must upload the converted file, not ImagePicker's original HEIC/large Blob.
      const file = Platform.OS === 'web'
        ? await (await fetch(`data:${mimeType};base64,${saved.base64}`)).blob()
        : undefined;
      return { uri: saved.uri, width: saved.width, height: saved.height,
        name: png ? 'cart.png' : 'cart.jpg', mimeType, file };
    }
    throw new Error(copy.register.imageTooLarge);
  } finally {
    rendered?.release();
    context.release();
  }
}

/**
 * 저장용 썸네일 (가로 최대 256px JPEG data URI).
 * 웹 구현은 height: null(비율 유지)을 처리하지 못해 높이를 직접 계산한다.
 */
export async function toThumbnail(image: Pick<PickedImage, 'uri' | 'width' | 'height'>, maxWidth = 256): Promise<string> {
  const width = Math.min(maxWidth, image.width || maxWidth);
  const height = image.width && image.height ? Math.max(1, Math.round((image.height * width) / image.width)) : width;
  const rendered = await ImageManipulator.manipulate(image.uri).resize({ width, height }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, base64: true, compress: 0.7 });
  return `data:image/jpeg;base64,${saved.base64}`;
}
