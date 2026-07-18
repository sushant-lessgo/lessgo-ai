// src/modules/skeletons/ids.ts
// Pure-data registry of the templateIds that are backed by a SKELETON module
// (rather than a hand-written per-template block set). Consumed by the static
// export pipeline (htmlGenerator injects `work.v1.js` when a page's templateId is
// listed here) and anywhere else that must branch skeleton-vs-classic WITHOUT
// importing template/skeleton code.
//
// FIREWALL-SAFE: pure data — NO React, NO template-module imports, NO skeleton
// imports. atelier-skeleton-cutover re-pointed the live `atelier` id onto the
// work-skeleton (the dev work-skeleton staging id was retired at cutover).

export const skeletonBackedTemplateIds: string[] = ['atelier'];

/** True when a templateId resolves through a skeleton module. */
export function isSkeletonBacked(id: string | null | undefined): boolean {
  return !!id && skeletonBackedTemplateIds.includes(id);
}
