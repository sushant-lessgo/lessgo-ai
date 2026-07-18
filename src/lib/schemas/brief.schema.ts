// src/lib/schemas/brief.schema.ts
// Brief record contract (scale track, scalePlan §3). Zod schema is the single
// source of truth; `type Brief` is inferred here and re-exported by
// @/types/brief (the canonical import path).
//
// v0 = CONTRACT, NOT A GATE: all top-level fields are optional because the
// Brief is built incrementally across wizard steps and there are zero readers
// yet. The serve gate (spec 02+) is what validates/rejects; this schema only
// documents shape.
//
// Import direction: schema → types only (@/types/brief re-exports the *type*
// from here, which is erased at compile time — no runtime cycle).

import { z } from 'zod';
import { copyEngines, designStyles } from '@/types/brief';
import { templateIds } from '@/types/service';
import { goalIntents, goalMechanisms } from '@/modules/goals/vocabulary';
import { WORK_PAGE_GOAL_KEYS } from '@/modules/engines/workPages';

export const BriefSchema = z.object({
  /**
   * Open string key on purpose — the business-type list grows; validated
   * against the businessTypes config at gate-time (spec 02+), not here.
   */
  businessType: z.string().optional(),
  copyEngine: z.enum(copyEngines).optional(),
  category: z.string().optional(),
  goal: z
    .object({
      intent: z.enum(goalIntents),
      mechanism: z.enum(goalMechanisms),
      /** e.g. a store URL, or [instagram, amazon] for follow-social writers. */
      destination: z.union([z.string(), z.array(z.string())]).optional(),
      /**
       * Raw wizard capture (scale-05 phase 1). `destination` stays the resolver
       * input — writeback COMPOSES it from `param` (e.g. phone → wa.me URL,
       * links[] → external). Additive + fully optional so existing Briefs and
       * frozen generation-contract fixtures parse unchanged.
       */
      param: z
        .object({
          phone: z.string(),
          email: z.string(),
          url: z.string(),
          links: z.array(z.string()),
          date: z.string(),
          message: z.string(),
        })
        .partial()
        .optional(),
    })
    .optional(),
  facts: z.record(z.string(), z.unknown()).optional(),
  proofAvailable: z.array(z.string()).optional(),
  socialProfiles: z
    .array(z.object({ platform: z.string(), url: z.string() }))
    .optional(),
  /**
   * Confirmed page/section structure (scale-07 phase 6 — first runtime writer
   * is the 7b structure-gate confirm via the saveDraft partial-brief merge).
   *
   * `pages` is OPTIONAL by DESIGN, not style (shallow-partial trap):
   * saveDraft validates patches with `BriefSchema.partial()`, which is SHALLOW
   * — it makes top-level `structure` optional but does NOT relax structure's
   * inner keys. A single-page confirm sends `{ mode:'single', sections }` with
   * no `pages` (single-page has no page list); if `pages` were required that
   * patch would fail safeParse and saveDraft's never-fail-autosave path would
   * silently SKIP the brief write — structure would never persist. Existing
   * rows stay valid either way (classify.ts writes `pages: []`).
   */
  structure: z
    .object({
      mode: z.enum(['single', 'multi']),
      /** Page names — legacy classify writeback; kept for back-compat readers. */
      pages: z.array(z.string()).optional(),
      /** Multi-page confirmed structure: per-page surviving section lists. */
      pageDetails: z
        .array(
          z.object({
            archetypeKey: z.string(),
            slug: z.string(),
            sections: z.array(z.string()),
            /**
             * Human title of the page (E4 plan screen). Optional + additive:
             * older Briefs omit it — readers prettify the key as a fallback.
             */
            title: z.string().optional(),
            /**
             * The one action this page asks a visitor to take (E4 plan screen).
             * Closed enum mirroring the `contactMethod` fact. Optional +
             * additive; generation does not consume it yet.
             */
            goal: z.enum(WORK_PAGE_GOAL_KEYS).optional(),
          })
        )
        .optional(),
      /** Single-page confirmed (surviving, ordered) body section list. */
      sections: z.array(z.string()).optional(),
    })
    .optional(),
  designStyleHint: z.enum(designStyles).optional(),
  templateShortlist: z.array(z.enum(templateIds)).optional(),
  confidence: z.number().min(0).max(1).optional(),
  /**
   * i18n-phase-1 D5 — declared content locales. >1 entry derives the
   * `bilingual` capability at the serve gate (requiredCapabilitiesFromBrief,
   * fit.ts). Optional + additive: existing Briefs and frozen
   * generation-contract fixtures parse unchanged (single-locale ⇒ absent/≤1).
   */
  locales: z.array(z.string()).optional(),
});

export type Brief = z.infer<typeof BriefSchema>;
