/**
 * Shared image pipeline — processing + storage.
 *
 * Buffer-in by design: `/api/upload-image` receives multipart `File`, but E2's scrape
 * ingestion (`docs/tracks/workEndtoEnd.md` §2) fetches remote images server-side and only
 * ever holds a Buffer. Both entry points share this module so there is exactly ONE copy of
 * the sharp constants and ONE copy of the blob/dev-filesystem storage logic.
 *
 * E2 seam (the "shared spine"):
 *   const processed = await processImage(buffer, mime);
 *   const { url }   = await storeImage(processed.buffer, { tokenId, filename, contentType });
 *   await recordMediaAsset({ ...,  source: 'scrape', sourceUrl: originUrl });  // STRICT variant
 *
 * The two API routes instead use `recordMediaAssetBestEffort` — an upload must never fail
 * because the registry row failed. For E2 the row IS the deliverable ("never lose her work",
 * §8a), so E2 uses the throwing variant.
 */

import { createHash } from 'crypto';
import sharp from 'sharp';
import { put } from '@vercel/blob';

/** Longest edge of a stored raster image. Shared by upload-image + proxy-image. */
export const MAX_WIDTH = 2400;
/** WebP encoder quality for stored raster images. */
export const WEBP_QUALITY = 85;
/** Width (px) of the base64 blur placeholder. Tiny on purpose — it is inlined in a DB row. */
export const BLUR_WIDTH = 16;

export const SVG_MIME = 'image/svg+xml';

export interface ProcessedImage {
  /** The bytes to store. Re-encoded WebP for rasters; the untouched input for SVG. */
  buffer: Buffer;
  width: number | null;
  height: number | null;
  /** `buffer.length` — always available, which is why `MediaAsset.bytes` is non-null. */
  bytes: number;
  /** Storage format: 'webp' for rasters, 'svg' for SVG passthrough. */
  format: 'webp' | 'svg';
  /** `data:image/webp;base64,…` micro-thumb. Null for SVG (nothing to blur). */
  blurDataUrl: string | null;
  /** sha256 of the PROCESSED buffer. v1 = store-only (no dedupe UX yet). */
  checksum: string;
  /** File extension to use for the stored filename. */
  extension: 'webp' | 'svg';
  /** Content type to store the buffer under. */
  contentType: string;
}

/**
 * Resize → WebP → blur placeholder → checksum → dimensions.
 *
 * SVG gets an explicit branch: it is stored as-is (no sharp re-encode), because sharp would
 * rasterize it and we would lose the whole point of a vector asset. Dimensions are attempted
 * best-effort; a failure there is not an error.
 */
export async function processImage(buffer: Buffer, mimeType?: string): Promise<ProcessedImage> {
  if (mimeType === SVG_MIME) {
    let width: number | null = null;
    let height: number | null = null;
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    } catch {
      // SVG dimensions are best-effort — an unparseable SVG still stores fine.
    }
    return {
      buffer,
      width,
      height,
      bytes: buffer.length,
      format: 'svg',
      blurDataUrl: null,
      checksum: checksumOf(buffer),
      extension: 'svg',
      contentType: SVG_MIME,
    };
  }

  const processedBuffer = await sharp(buffer)
    .resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const meta = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: meta.width ?? null,
    height: meta.height ?? null,
    bytes: processedBuffer.length,
    format: 'webp',
    blurDataUrl: await makeBlurDataUrl(processedBuffer),
    checksum: checksumOf(processedBuffer),
    extension: 'webp',
    contentType: 'image/webp',
  };
}

/**
 * Tiny base64 WebP placeholder, sharp-only (no new dependency).
 * Returns null rather than throwing — a missing placeholder must never fail an upload.
 */
export async function makeBlurDataUrl(buffer: Buffer): Promise<string | null> {
  try {
    const tiny = await sharp(buffer)
      .resize(BLUR_WIDTH, null, { fit: 'inside' })
      .webp({ quality: 40 })
      .toBuffer();
    return `data:image/webp;base64,${tiny.toString('base64')}`;
  } catch {
    return null;
  }
}

export function checksumOf(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export interface StoreImageOptions {
  tokenId: string;
  /** Filename only, e.g. `1720000000000-abc123.webp` or `pexels-42.webp`. */
  filename: string;
  contentType: string;
}

export interface StoredImage {
  /** Absolute blob URL, or the `/uploads/{tokenId}/{filename}` relative URL in dev-fs mode. */
  url: string;
  storage: 'blob' | 'dev-fs';
}

/**
 * Store a processed buffer under `uploads/{tokenId}/{filename}`.
 *
 * NOTE the prefix: `uploads/…` is user media. `pages/…` is the publish blob namespace —
 * never write media there.
 *
 * Lifted verbatim from the previously-duplicated tails of `/api/upload-image` and
 * `/api/proxy-image` (identical dev guard, dir, URL shape and `put()` options — only
 * filename + contentType ever differed, which are exactly the params).
 */
export async function storeImage(buffer: Buffer, options: StoreImageOptions): Promise<StoredImage> {
  const { tokenId, filename, contentType } = options;

  const isDev = process.env.NODE_ENV === 'development';
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (isDev && !hasBlob) {
    const { writeFile, mkdir } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const path = await import('path');

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', tokenId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, filename), buffer);

    return { url: `/uploads/${tokenId}/${filename}`, storage: 'dev-fs' };
  }

  const blob = await put(`uploads/${tokenId}/${filename}`, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  return { url: blob.url, storage: 'blob' };
}
