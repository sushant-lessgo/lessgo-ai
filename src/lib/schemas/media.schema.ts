// src/lib/schemas/media.schema.ts
// Request bodies for /api/media (media-library-picker phase 3).
//
// House convention: `<name>.schema.ts` (cf. brief.schema.ts / copy.schema.ts /
// workFacts.schema.ts). There is deliberately NO create schema — MediaAsset rows are
// only ever written through the `/api/upload-image` + `/api/proxy-image` seam, or by
// server-side callers importing `src/lib/media/registry.ts` directly (E2 ingestion).

import { z } from 'zod';

/** DELETE /api/media — soft-delete (hide) one asset. The blob is never destroyed. */
export const MediaDeleteSchema = z.object({
  tokenId: z.string().min(1),
  assetId: z.string().min(1),
});
export type MediaDeleteInput = z.infer<typeof MediaDeleteSchema>;

/**
 * POST /api/media — restore (un-hide) and/or set alt text. NOT a create endpoint.
 * At least one mutation must be requested, otherwise the call is a no-op typo.
 */
export const MediaUpdateSchema = z
  .object({
    tokenId: z.string().min(1),
    assetId: z.string().min(1),
    restore: z.boolean().optional(),
    // Empty string = clear the alt text; null is not accepted over the wire.
    alt: z.string().max(500).optional(),
  })
  .refine((v) => v.restore !== undefined || v.alt !== undefined, {
    message: 'Nothing to update: provide `restore` and/or `alt`',
  });
export type MediaUpdateInput = z.infer<typeof MediaUpdateSchema>;
