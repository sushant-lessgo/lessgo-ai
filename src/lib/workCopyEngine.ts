// src/lib/workCopyEngine.ts
// work-copy-engine — LEAF module (no React, no generation imports).
//
// Single source of truth for the WORK-copy-engine template allow-list. Both the
// generation fork (`work.llm.ts` → `workCopyEngineEnabled`) AND the editor's
// story-interview panel gate (`MainContent.tsx` → `isWorkCopyTemplate`) consume
// THIS const so the two never drift. Kept dependency-free so it can be imported
// from the editor bundle without dragging generation code along.

/**
 * Founder-approved ALLOW-LIST of WORK templates the LLM copy engine may drive.
 * `atelier` is the ONLY tested/approved work-multipage template; every OTHER
 * work-multipage template (lumen, any future one) keeps today's SKELETON
 * (manual-fill) path even when the env flag is ON, until explicitly added here.
 * Extend by appending a templateId (named const so it's easy to find + widen).
 */
export const WORK_COPY_ENGINE_TEMPLATES: readonly string[] = ['atelier'];

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
