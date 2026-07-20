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
// `materializePublish.ts` re-exports every name below for back-compat: existing
// tests and consumers import them from there (`materializePublish.test.ts` and
// `hooks/editStore/cmsActions.test.ts` both do — the re-export is load-bearing,
// not decoration).

// ── LISTING SECTIONS (the placed `cmscollection` block) ─────────────────────

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

// ── LISTING PAGES (the auto-emitted `/<collectionRef>` page, phase 8B) ──────
//
// A listing PAGE is the same `cmscollection` block on a page of its own. Its
// section id therefore SHARES the `cmscollection` type prefix (dispatch must
// resolve the same block) — but it carries a distinguishing SECOND segment so
// the materializer can tell "a page WE authored" from "a subpage the user built
// that happens to contain a placed collection block".
//
// ⚠️ THAT DISTINCTION IS THE PRUNE SAFETY. Detail pages can use a purely
// structural test (a user cannot author a `cmscollectionitem` section at all),
// but a user CAN put a `cmscollection` block on their own subpage via "Add to
// page". Without this marker, toggling `listingPage` off would DELETE that
// user's page.
//
// ── THE INVARIANT THAT MAKES IT SAFE: `parts.length > 2` ────────────────────
// A user placement is `cmscollection-<rand>` where `<rand>` is
// `Math.random().toString(36).slice(2,10)` (`hooks/editStore/cmsActions.ts`,
// `newCmsSectionId`) — base36, HYPHEN-FREE. So a placement splits into exactly
// TWO parts and `isCmsListingSectionId`'s `parts.length > 2` rejects it, no
// matter what `parts[1]` happens to spell. The type-prefix and marker checks
// alone are NOT the guard.
//
// ⚠️ THEREFORE: placement ids MUST remain hyphen-free. Switching
// `newCmsSectionId` to `crypto.randomUUID()` (uuids CONTAIN hyphens) would give
// a placement 6 parts, and any placement whose second segment spelled `listing`
// would be claimed as ours and pruned. `cmsActions.test.ts` pins the hyphen-free
// id format so that change fails loudly instead of silently.

/** Second segment marking a section as the auto-emitted listing page's own. */
export const CMS_LISTING_MARKER = 'listing';

/** The deterministic section id of a collection's listing page. */
export function cmsListingSectionId(collectionId: string): string {
  return `${CMS_SECTION_TYPE}-${CMS_LISTING_MARKER}-${collectionId}`;
}

/** `cmscollection-listing-abc` → true; `cmscollection-<rand>` (a user placement,
 *  hyphen-free ⇒ 2 parts) → false. `parts.length > 2` is the load-bearing half —
 *  see the hyphen-free invariant above. */
export function isCmsListingSectionId(sectionId: string): boolean {
  if (typeof sectionId !== 'string') return false;
  const parts = sectionId.split('-');
  return (
    parts[0].toLowerCase() === CMS_SECTION_TYPE &&
    parts[1] === CMS_LISTING_MARKER &&
    parts.length > 2
  );
}

/** The published path of a collection's listing page: `/<collectionRef>`.
 *  LEADING-SLASH ABSOLUTE — the pinned convention (see `cmsDetailPath`).
 *  `null` when the collection has no slug (→ no page). */
export function cmsListingPath(collectionRef: string | null | undefined): string | null {
  if (!collectionRef) return null;
  return `/${collectionRef}`;
}

// ── DETAIL SECTIONS (the per-item fan-out pages, phase 4) ───────────────────
//
// A SEPARATE type prefix on purpose: `findCmsSections` (the listing walk) matches
// `isCmsSectionId` ONLY, so the detail sections the fan-out adds can never be
// re-walked as listings. The two id spaces are deliberately disjoint — see the
// `isCmsItemSectionId` note below and `materializePublish.test.ts`.

/** Lowercased section-type prefix of a fan-out detail section. */
export const CMS_ITEM_SECTION_TYPE = 'cmscollectionitem';

/**
 * Layout NAME stored on a fan-out detail section. Like `CMS_COLLECTION_LAYOUT`
 * it keys nothing template-side (shared blocks dispatch on section TYPE) but the
 * published renderer needs it PRESENT to render the section at all. It must
 * NEVER gain a `layoutElementSchema` entry (plan Deviations #4).
 */
export const CMS_COLLECTION_ITEM_LAYOUT = 'SharedCmsCollectionItem';

/** `cmscollectionitem-abc123` → true. Note `isCmsSectionId` is FALSE for these. */
export function isCmsItemSectionId(sectionId: string): boolean {
  return (
    typeof sectionId === 'string' &&
    sectionId.split('-')[0].toLowerCase() === CMS_ITEM_SECTION_TYPE
  );
}
