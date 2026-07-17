// src/lib/workCopyEngine.ts
// work-copy-engine — LEAF module (no React, no generation imports).
//
// Single source of truth for the WORK-copy-engine template allow-list AND the
// `NEXT_PUBLIC_WORK_COPY_ENGINE` kill-switch. The generation fork
// (`work.llm.ts`, which RE-EXPORTS both), the editor's story-interview panel
// gate (`MainContent.tsx` → `isWorkCopyTemplate`) and the journey seam's
// STEP-05 `preflight` all consume THIS module so they can never drift. Kept
// dependency-free so it can be imported from the editor bundle — and from the
// onboarding journey seam, which loads PRE-CONFIRM on the entry page — without
// dragging the generation/template graph along (landmine 14).

/**
 * Founder-approved ALLOW-LIST of WORK templates the LLM copy engine may drive.
 * `atelier` is the live tested/approved work-multipage template; `atelier2` is the
 * work-SKELETON Atelier skin — added as the E2 skeleton pilot so the ingestion
 * journey can resolve to it (journey-eligible + copy-engine-allowed) and prove
 * grouped-photo binding on the skeleton. Every OTHER work-multipage template
 * (lumen, any future one) keeps today's manual-fill path even when the env flag is
 * ON, until explicitly added here. Extend by appending a templateId.
 *
 * atelier2 = E2 skeleton pilot; absorb at atelier-skeleton-cutover.
 */
export const WORK_COPY_ENGINE_TEMPLATES: readonly string[] = ['atelier', 'atelier2'];

/**
 * Pure template-MEMBERSHIP predicate: is `templateId` a work-copy-engine
 * template? Independent of the `NEXT_PUBLIC_WORK_COPY_ENGINE` generation
 * kill-switch — the editor's story-interview panel + its story-regen route are
 * usable for work-template projects regardless of the wizard flag, so the panel
 * gate uses THIS (not `workCopyEngineEnabled`).
 */
export function isWorkCopyTemplate(templateId: string | null | undefined): boolean {
  return !!templateId && WORK_COPY_ENGINE_TEMPLATES.includes(templateId);
}

/**
 * Whether the WORK LLM copy engine is enabled for `templateId`. TRUE only when
 * (a) the env kill-switch `NEXT_PUBLIC_WORK_COPY_ENGINE === 'true'` AND (b) the
 * template is on `WORK_COPY_ENGINE_TEMPLATES`. `NEXT_PUBLIC_*` is BUILD-TIME
 * INLINED (work-copy-engine plan decision #8) — flipping it needs a REDEPLOY,
 * not a runtime toggle. Default OFF (unset ⇒ false) ⇒ the existing skeleton
 * path is byte-identical.
 *
 * RELOCATED here from `@/modules/wizard/generation/work.llm` (work-onboarding-
 * shell P5) and re-exported from there, so generation callers keep their import
 * surface. The move exists so the journey's STEP-05 `preflight` can stay SYNC
 * and firewall-clean: the seam reads the kill-switch from this LEAF instead of
 * statically importing `work.llm.ts` (whose module top pulls the template
 * registry + multi-page assembly onto whatever imports it). There is exactly
 * ONE implementation of this check — never re-derive `process.env
 * .NEXT_PUBLIC_WORK_COPY_ENGINE` anywhere else.
 */
export function workCopyEngineEnabled(templateId: string | null | undefined): boolean {
  if (process.env.NEXT_PUBLIC_WORK_COPY_ENGINE !== 'true') return false;
  return isWorkCopyTemplate(templateId);
}
