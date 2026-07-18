// src/lib/schemas/workFacts.schema.ts
// ============================================================================
// WORK FACTS SCHEMA — the D1↔D2 interface (work-contract phase A / 3).
//
// PURE DATA (zod only). Value shapes for the 8 work-vertical Brief fact slots
// (workEndtoEnd step 3 / spec §3), including the REQUIRED per-group price shape
// and the two-level work-group. This is the shape half of the freeze; the slot
// TABLE (mechanics + reconciliation onto today's live wizard contract) lives in
// `src/modules/engines/workSlots.ts`.
//
// ── STORAGE ─────────────────────────────────────────────────────────────────
//   Work facts live at `brief.facts.work` (facts is a loose `z.record`). Read
//   them with `getWorkFacts(brief.facts)` — a safeParse accessor mirroring
//   `getEntryFacts` (src/modules/brief/classify.ts) for `brief.facts.entry`.
//
// ── ALL-OPTIONAL PHILOSOPHY (mirrors brief.schema.ts) ───────────────────────
//   Every top-level slot is optional at the zod level. The schema documents
//   SHAPE, it is not a GATE — requiredness is slot MECHANICS (see workSlots.ts:
//   auto-confident / confirm-shaky / ask-unknown), resolved at runtime by
//   `resolveFieldState()` (src/modules/wizard/waterfall.ts), NOT by parse
//   failure. The single hard shape rule is the price refinement below.
//
// ── THE 8 SLOTS (spec §3) ───────────────────────────────────────────────────
//   1 identity (name + where + reach)   5 dreamClient
//   2 groups (= what you sell)          6 praise (verbatim; "what to expect"
//   3 price  (lives INSIDE each group,     for `new` sellers — reframe is the
//     a distinct ASK step; required)       wording layer)
//   4 establishment (new|established,    7 contactMethod (whatsapp|booking|form)
//     BRANCH)                            8 languages
//
// ── WORK-GROUP SHAPE (two-level, second level OPTIONAL) ─────────────────────
//   group ≙ service ≙ price (ONE spine). A group projects onto the `works`
//   CollectionKey (COLLECTIONS.works, src/modules/collections/registry.ts) —
//   reused verbatim, NEVER forked. Flat (photos only, no items) is legal per
//   group; the second level (items = shoots/projects) is optional. The story
//   fields on WorkSubItem align with the phase-1 `workdetail` element contract
//   (workSections.ts: name/client/problem/result/photos).
//
// ── SCOPE-OUT ───────────────────────────────────────────────────────────────
//   WorkPhotoRef is a REFERENCE shape only — the image-ingestion pipeline
//   (upload/Instagram/Google) is scope-OUT of phase A.
//
// ── FIREWALL (D5) ───────────────────────────────────────────────────────────
//   zod only. NEVER react / stores / hooks / template runtime. No templateId /
//   skeletonId literals.
// ============================================================================

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Price — required per group; "on request" is a legal answer.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-group price. `amount` is REQUIRED unless `mode === 'on-request'` — a
 * price answer is mandatory (the price slot is `requirement: 'required'` in
 * workSlots.ts), but "on request" (no number) is a legitimate answer.
 */
export const WorkPriceSchema = z
  .object({
    mode: z.enum(['exact', 'from', 'on-request']),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })
  .refine((p) => p.mode === 'on-request' || p.amount !== undefined, {
    message: 'amount is required unless mode is "on-request"',
    path: ['amount'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// Photo reference — reference shape only (ingestion pipeline is scope-OUT).
// ─────────────────────────────────────────────────────────────────────────────

export const WorkPhotoRefSchema = z.object({
  id: z.string(),
  url: z.string().optional(),
  alt: z.string().optional(),
  cover: z.boolean().optional(),
  /**
   * BOARD-OWNED, ADDITIVE-OPTIONAL (work-library-board). Dashboard "hide" sets
   * this flag instead of removing the ref (hide-not-destroy) — the photo stays
   * in facts, restorable in place. Pre-existing facts omit it and MUST keep
   * parsing; `deriveWorksEntries` filters `hidden:true` at the single choke
   * point so a hidden photo never reaches covers/entries/item pages. NEVER emit
   * `hidden:false` — absent means visible.
   */
  hidden: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Sub-item (second level) — internal name `items` = shoots / projects. The
// profession wording layer (phase 4) renames it per profession. Story fields
// are optional and align with the phase-1 `workdetail` contract.
// ─────────────────────────────────────────────────────────────────────────────

export const WorkSubItemSchema = z.object({
  name: z.string(),
  photos: z.array(WorkPhotoRefSchema),
  client: z.string().optional(),
  problem: z.string().optional(),
  result: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Group (first level) — the spine: group ≙ service ≙ price. Second level
// (`items`) is OPTIONAL; flat (`photos` only) is legal per group.
// ─────────────────────────────────────────────────────────────────────────────

export const WorkGroupSchema = z.object({
  name: z.string(),
  kind: z.enum(['category', 'story']),
  price: WorkPriceSchema,
  /** Direct group-level photos (flat group). */
  photos: z.array(WorkPhotoRefSchema).optional(),
  /** Second level (shoots / projects), each with its own photos. Optional. */
  items: z.array(WorkSubItemSchema).optional(),
  /**
   * BOARD-OWNED, ADDITIVE-OPTIONAL (work-library-board). Stable group identity:
   * seeded from `slugify(name)` on the first board save and PRESERVED across a
   * rename, so the `/works/<slug>` item page + gallery `href` survive a rename
   * (`deriveWorksEntries` joins by `group.slug ?? slugify(group.name)`).
   * Pre-existing facts omit it and MUST keep parsing — untouched projects fall
   * back to the name→slug join. NEVER emit an empty slug.
   */
  slug: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// The 8 slots as one object. Slot 3 (price) has no top-level key — the price
// value lives on each group (WorkGroup.price); the slot exists as a distinct
// ASK step in workSlots.ts. All top-level keys optional (shape, not gate).
// ─────────────────────────────────────────────────────────────────────────────

export const WorkFactsSchema = z.object({
  /** Slot 1 — who + where + how far they serve. */
  identity: z
    .object({
      name: z.string(),
      location: z.string().optional(),
      reach: z.string().optional(),
      /**
       * "What you do" — a short human descriptor (work-onboarding-shell P1).
       * ADDITIVE-OPTIONAL: pre-existing facts that omit it still parse, so
       * `getWorkFacts` cannot start returning null because of this key.
       * Seeded from `facts.entry.summary` (+ categories) by
       * `seedWorkFactsFromEntry` (src/modules/wizard/work/rail.ts); the rail
       * makes it user-correctable. NOT a generation input in E1.
       */
      descriptor: z.string().optional(),
    })
    .optional(),
  /** Slot 2 — what you sell. Price (slot 3) lives on each group. */
  groups: z.array(WorkGroupSchema).optional(),
  /** Slot 4 — BRANCH: reframes the praise slot (verbatim vs "what to expect"). */
  establishment: z.enum(['new', 'established']).optional(),
  /** Slot 5 — dream client (nearest existing field: whatYouTakeOn). */
  dreamClient: z.string().optional(),
  /** Slot 6 — verbatim praise (for `new` sellers, semantically "what to expect"). */
  praise: z.array(z.string()).optional(),
  /** Slot 7 — conversion mechanism (never silently guessed; one-tap confirm). */
  contactMethod: z.enum(['whatsapp', 'booking', 'form']).optional(),
  /** Slot 8 — content language(s); auto-from-location, confirm when ambiguous. */
  languages: z.array(z.string()).optional(),
  /**
   * NOT a slot — the rail's "Something wrong?" append-only correction log
   * (work-onboarding-shell P1). ADDITIVE-OPTIONAL: absent on every pre-existing
   * facts bag, so parse behaviour is unchanged. Written by `appendUserNote`
   * (src/modules/wizard/work/rail.ts); consumed in E3, ignored by generation.
   */
  userNotes: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred TS types (single source = the zod schemas above).
// ─────────────────────────────────────────────────────────────────────────────

export type WorkPrice = z.infer<typeof WorkPriceSchema>;
export type WorkPhotoRef = z.infer<typeof WorkPhotoRefSchema>;
export type WorkSubItem = z.infer<typeof WorkSubItemSchema>;
export type WorkGroup = z.infer<typeof WorkGroupSchema>;
export type WorkFacts = z.infer<typeof WorkFactsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Accessor — safeParse `brief.facts.work` (mirrors getEntryFacts).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safe reader for `brief.facts.work` (facts is a loose record). Returns the
 * parsed WorkFacts or null when absent/invalid — never throws. Pass the facts
 * bag directly: `getWorkFacts(brief?.facts)`.
 */
export function getWorkFacts(
  facts: Record<string, unknown> | undefined
): WorkFacts | null {
  const work = facts?.['work'];
  if (!work || typeof work !== 'object') return null;
  const parsed = WorkFactsSchema.safeParse(work);
  return parsed.success ? parsed.data : null;
}
