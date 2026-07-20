// src/modules/cms/sectionKeys.ts
//
// CMS section identity constants — PURE, DEPENDENCY-FREE, ISOMORPHIC.
//
// ⚠️ KEEP THIS MODULE IMPORT-FREE. It exists solely so the editor store slice
// (`hooks/editStore/cmsActions.ts`, a client module) can share the section-type /
// layout names with the server-only publish materializer WITHOUT dragging
// `materializePublish.ts` — and therefore `@/lib/prisma` — into the browser
// bundle. `@/lib/prisma` has a top-level side effect and the package is not
// marked `sideEffects: false`, so webpack cannot tree-shake it away: importing
// these constants from `materializePublish` shipped ~73 kB of Prisma browser
// runtime into the editor chunk. Adding ANY import here (especially a Prisma- or
// React-bearing one) silently re-opens that hole.
//
// `materializePublish.ts` re-exports all three for back-compat: existing tests
// and consumers import them from there.

/** Lowercased section-type prefix of a placed CMS section id (`cmscollection-<uuid>`). */
export const CMS_SECTION_TYPE = 'cmscollection';

/**
 * The layout NAME stored on a placed cms section. Dispatch does NOT key off it
 * (shared blocks resolve by section TYPE), but the published renderer needs it
 * present to render the section at all. It must NEVER gain a
 * `layoutElementSchema` entry (plan Deviations #4).
 */
export const CMS_COLLECTION_LAYOUT = 'SharedCmsCollection';

/** `cmscollection-abc123` → true; `hero-abc123` / `works-…` → false. */
export function isCmsSectionId(sectionId: string): boolean {
  return typeof sectionId === 'string' && sectionId.split('-')[0].toLowerCase() === CMS_SECTION_TYPE;
}
