// src/modules/skeletons/ids.ts
// Pure-data registry of the templateIds that are backed by a SKELETON module
// (rather than a hand-written per-template block set). Consumed by the static
// export pipeline (htmlGenerator injects `work.v1.js` when a page's templateId is
// listed here) and anywhere else that must branch skeleton-vs-classic WITHOUT
// importing template/skeleton code.
//
// FIREWALL-SAFE: pure data — NO React, NO template-module imports, NO skeleton
// imports. Phase 3 registers the first skin id (`atelier2`, the dev id cutover to
// `atelier` in phase 9).

export const skeletonBackedTemplateIds: string[] = ['atelier2'];

/** True when a templateId resolves through a skeleton module. */
export function isSkeletonBacked(id: string | null | undefined): boolean {
  return !!id && skeletonBackedTemplateIds.includes(id);
}
