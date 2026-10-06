/** Admin image uploads: pure checks, shared by the API and the tests (DB-free). */

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // admin nginx allows 5 MB per request

export type ImageKind = { mime: string; ext: string };

/** Identifies the image from its first bytes, never from the file name or the browser's claim. */
export function sniffImage(buf: Uint8Array): ImageKind | null {
  const b = (i: number): number => buf[i] ?? -1;
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return { mime: 'image/png', ext: 'png' };
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return { mime: 'image/gif', ext: 'gif' };
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
      b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return { mime: 'image/webp', ext: 'webp' };
  return null;
}

export type UploadCheck = { ok: true; kind: ImageKind } | { ok: false; error: string };

export function checkUpload(buf: Uint8Array): UploadCheck {
  if (buf.length === 0) return { ok: false, error: 'The file is empty.' };
  if (buf.length > MAX_UPLOAD_BYTES) return { ok: false, error: 'Image is larger than 4 MB. Compress it and try again.' };
  const kind = sniffImage(buf);
  if (!kind) return { ok: false, error: 'Only PNG, JPEG, WebP or GIF images can be uploaded.' };
  return { ok: true, kind };
}

/** Public file name: "<id>-<random>.<ext>". The random part keeps uploads unguessable by counting ids. */
export function parseMediaName(name: string): { id: number; token: string } | null {
  const m = /^(\d{1,10})-([a-f0-9]{16})\.(png|jpg|gif|webp)$/.exec(name);
  return m && m[1] && m[2] ? { id: Number(m[1]), token: m[2] } : null;
}
