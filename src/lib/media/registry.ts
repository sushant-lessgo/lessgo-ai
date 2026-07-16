/**
 * MediaAsset registry writes.
 *
 * Two exports on purpose — the difference is who eats a DB failure:
 *
 * - `recordMediaAsset`     STRICT, throws. E2's scrape ingestion entry point, where the row IS
 *                          the deliverable (`docs/tracks/workEndtoEnd.md` §8a "never lose her
 *                          work") — a silent swallow there would lose a photo forever.
 * - `recordMediaAssetBestEffort`  swallows + logs, returns null. What `/api/upload-image` and
 *                          `/api/proxy-image` call: an upload must NEVER fail because the
 *                          registry row failed. The image is already stored at that point.
 *
 * Creation happens ONLY through this module — there is no POST-create on `/api/media`.
 */

import { prisma } from '@/lib/prisma';
import type { MediaSource } from '@prisma/client';

export interface RecordMediaAssetInput {
  projectId: string;
  tokenId: string;
  /** Clerk user id (bare column, no relation — SocialPost pattern). */
  userId: string;
  /** OUR url: absolute blob URL, or the dev-fs relative `/uploads/…` URL. */
  url: string;
  source: MediaSource;
  /** Origin URL (Pexels src.large / scraped page). Null when unobtainable. */
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
  /** Non-null by schema: processed-buffer length, or blobs[0].size on the proxy cache-hit path. */
  bytes: number;
  format: string;
  blurDataUrl?: string | null;
  checksum?: string | null;
  alt?: string | null;
}

/**
 * Upsert a MediaAsset row on the `(tokenId, url)` compound unique.
 *
 * The update arm is deliberately `{ hiddenAt: null }` and nothing else: re-recording an asset
 * means "I want this on my page", so a previously hidden asset must reappear in the library.
 * With `update: {}` the resurrection bug appears — hide a stock photo, re-pick it, and it
 * lands on the page while staying invisible in the library.
 *
 * THROWS on failure. Route callers want `recordMediaAssetBestEffort` instead.
 */
export async function recordMediaAsset(input: RecordMediaAssetInput): Promise<string> {
  const asset = await prisma.mediaAsset.upsert({
    where: { tokenId_url: { tokenId: input.tokenId, url: input.url } },
    update: { hiddenAt: null },
    create: {
      projectId: input.projectId,
      tokenId: input.tokenId,
      userId: input.userId,
      url: input.url,
      source: input.source,
      sourceUrl: input.sourceUrl ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      bytes: input.bytes,
      format: input.format,
      blurDataUrl: input.blurDataUrl ?? null,
      checksum: input.checksum ?? null,
      alt: input.alt ?? null,
    },
    select: { id: true },
  });

  return asset.id;
}

/**
 * Never-throwing wrapper around `recordMediaAsset`. Returns the asset id, or null if the write
 * failed (logged, not surfaced). Used by the upload/proxy routes only.
 */
export async function recordMediaAssetBestEffort(
  input: RecordMediaAssetInput
): Promise<string | null> {
  try {
    return await recordMediaAsset(input);
  } catch (error) {
    console.error('🟠 [MEDIA] Registry write failed (non-fatal, image is stored):', {
      tokenId: input.tokenId,
      url: input.url,
      source: input.source,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
