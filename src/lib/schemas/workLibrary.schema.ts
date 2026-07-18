// src/lib/schemas/workLibrary.schema.ts
// Request body for PUT /api/work-library (work-library-board phase 3).
//
// House convention: `<name>.schema.ts` (cf. media.schema.ts / workFacts.schema.ts).
// The PUT body is the FULL rebuilt group array (the board sends the whole array on
// every commit — the route re-emits facts through `applyRailEdit({field:'groups'})`).
//
// SHAPE = `WorkGroupInput[]` (src/modules/wizard/work/rail.ts), so the parsed
// output feeds `applyRailEdit` directly. Zod is a first-gate BELT here — the
// authoritative validation is still `applyRailEdit` → `WorkFactsSchema` on the
// server (the rail is the single write door). We add the two E2 photo CAPS
// (per-group / total) so a runaway board payload is rejected before it reaches
// the rail: the constants are REUSED from the ingestion proposal (D11), never
// re-hardcoded.
//
// FIREWALL: zod + the pure cap constants only. No react / stores / prisma.

import { z } from 'zod';
import {
  PHOTOS_PER_GROUP_CAP,
  PHOTOS_TOTAL_CAP,
} from '@/modules/wizard/work/ingest/proposeGroups';

/** Mirror of `WorkPhotoRefSchema` (workFacts.schema.ts) — reference + board flags. */
const PhotoRefInput = z.object({
  id: z.string(),
  url: z.string().optional(),
  alt: z.string().optional(),
  cover: z.boolean().optional(),
  // hide-not-destroy: the board sends `hidden:true` to hide a photo in place.
  hidden: z.boolean().optional(),
});

/** Mirror of `WorkGroupInput.price` — every field optional; the rail normalizes. */
const PriceInput = z
  .object({
    mode: z.enum(['exact', 'from', 'on-request']).optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })
  .optional();

/** Mirror of `WorkSubItemSchema` (second level — shoots / projects). */
const SubItemInput = z.object({
  name: z.string(),
  photos: z.array(PhotoRefInput),
  client: z.string().optional(),
  problem: z.string().optional(),
  result: z.string().optional(),
});

/** One group. Per-group photo cap (24) enforced here as a belt (D11). */
const GroupInput = z.object({
  name: z.string(),
  kind: z.enum(['category', 'story']).optional(),
  price: PriceInput,
  photos: z.array(PhotoRefInput).max(PHOTOS_PER_GROUP_CAP).optional(),
  items: z.array(SubItemInput).optional(),
  // Board-owned stable slug — carried verbatim (seeded server-side when absent).
  slug: z.string().optional(),
});

/**
 * PUT /api/work-library body. `groups` is the FULL rebuilt array. The total
 * photo cap (150) is a cross-group belt (per-group cap lives on `photos.max`).
 */
export const WorkLibraryPutSchema = z
  .object({
    tokenId: z.string().min(1),
    groups: z.array(GroupInput),
  })
  .superRefine((v, ctx) => {
    const total = v.groups.reduce((n, g) => n + (g.photos?.length ?? 0), 0);
    if (total > PHOTOS_TOTAL_CAP) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Too many photos across all groups (max ${PHOTOS_TOTAL_CAP})`,
        path: ['groups'],
      });
    }
  });

export type WorkLibraryPutInput = z.infer<typeof WorkLibraryPutSchema>;
export type WorkLibraryGroupInput = z.infer<typeof GroupInput>;
