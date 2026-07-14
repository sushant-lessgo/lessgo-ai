// src/lib/schemas/workStrategy.schema.ts
// ============================================================================
// WORK STRATEGY RESPONSE SCHEMA — the ONE small AI strategy call's contract.
//
// The work slim-strategy split (plan design-decision #2): everything STRUCTURAL
// (pages / sections / card counts / leads / story branch) is decided in pure
// code by `assembleWorkStructure` (phase 1). The single AI strategy call
// contributes ONLY three narrative angles on top of that structure:
//   • positioningAngle — the one-line stance the whole site leans on
//   • storyAngle       — the frame for the About / story section
//   • voiceNotes        — a few concrete voice reminders for the copy phase
//
// The schema is DELIBERATELY tiny: it is the enforcement point for AC-3's second
// half ("the AI returns ONLY angle/story/voice — nothing structural"). Any
// structural field the model tries to return is dropped by this parse (zod
// object strips unknown keys), so the AI can NEVER contribute structure.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   zod only. No react / stores / hooks / templateId.
// ============================================================================

import { z } from 'zod';

export const WorkStrategyResponseSchema = z.object({
  /** The one-line stance the whole site leans on (positioning). */
  positioningAngle: z.string().min(1),
  /** The frame for the About / story section (narrative angle only). */
  storyAngle: z.string().min(1),
  /** A few concrete voice reminders carried into the copy phase. */
  voiceNotes: z.array(z.string().min(1)).min(1),
});

export type WorkStrategyResponse = z.infer<typeof WorkStrategyResponseSchema>;
