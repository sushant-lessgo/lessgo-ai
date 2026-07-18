// src/lib/workCopyEngine.ts
// work-copy-engine — LEAF module (no React, no generation imports).
//
// Single source of truth for the WORK-copy-engine template ALLOW-LIST. The
// generation fork (`work.llm.ts`, which RE-EXPORTS these), the editor's
// story-interview panel gate (`MainContent.tsx` → `isWorkCopyTemplate`) and the
// journey seam's STEP-05 `preflight` all consume THIS module so they can never
// drift. Kept dependency-free so it can be imported from the editor bundle —
// and from the onboarding journey seam, which loads PRE-CONFIRM on the entry
// page — without dragging the generation/template graph along (landmine 14).
//
// (B17: the former `NEXT_PUBLIC_WORK_COPY_ENGINE` env kill-switch was REMOVED —
// founder directive, work copy engine is always on. The allow-list is now the
// ONLY gate. After deploy, delete the Vercel prod env var; it is inert.)

/**
 * Founder-approved ALLOW-LIST of WORK templates the LLM copy engine may drive.
 * `atelier` is the live tested/approved work-multipage template, now skeleton-backed
 * (the work-SKELETON Atelier skin, absorbed at atelier-skeleton-cutover). Every
 * OTHER work-multipage template (lumen, any future one) keeps today's manual-fill
 * path until explicitly added here. Extend by appending a templateId.
 */
export const WORK_COPY_ENGINE_TEMPLATES: readonly string[] = ['atelier'];

/**
 * Pure template-MEMBERSHIP predicate: is `templateId` a work-copy-engine
 * template? The editor's story-interview panel + its story-regen route are
 * usable for work-template projects, so the panel gate uses THIS.
 */
export function isWorkCopyTemplate(templateId: string | null | undefined): boolean {
  return !!templateId && WORK_COPY_ENGINE_TEMPLATES.includes(templateId);
}

/**
 * Whether the WORK LLM copy engine is enabled for `templateId`. TRUE iff the
 * template is on `WORK_COPY_ENGINE_TEMPLATES` — the allow-list is the whole gate
 * (B17: the env kill-switch was removed; work is always on). Thin alias of
 * `isWorkCopyTemplate`, kept as a distinct export so the generation fork, the
 * editor panel gate and the journey seam all resolve the SAME answer. There is
 * exactly ONE implementation of this check — never re-derive it anywhere else.
 */
export function workCopyEngineEnabled(templateId: string | null | undefined): boolean {
  return isWorkCopyTemplate(templateId);
}
