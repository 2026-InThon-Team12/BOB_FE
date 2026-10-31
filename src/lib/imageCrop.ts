import { z } from 'zod';

// Ported from frontend-mvp 40b62c7; shared by the legacy mapper and APK drafts.
const base64 = z
  .string()
  .min(1)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
const ImageCropDto = z.object({
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  base64,
});

export function cropImageUri(crop: unknown): string | undefined {
  const result = ImageCropDto.safeParse(crop);
  return result.success ? `data:${result.data.mime_type};base64,${result.data.base64}` : undefined;
}

/** Existing APK local storage contains JPEG base64 without a MIME prefix. */
export function storedCropUri(crop?: string): string | undefined {
  if (!crop) return undefined;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(crop);
  return match
    ? cropImageUri({ mime_type: match[1], base64: match[2] })
    : cropImageUri({ mime_type: 'image/jpeg', base64: crop });
}
