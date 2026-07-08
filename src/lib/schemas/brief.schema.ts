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
  structure: z
    .object({
      mode: z.enum(['single', 'multi']),
      pages: z.array(z.string()),
    })
    .optional(),
  designStyleHint: z.enum(designStyles).optional(),
  templateShortlist: z.array(z.enum(templateIds)).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type Brief = z.infer<typeof BriefSchema>;
