// src/modules/cms/materializePublish.ts
//
// PUBLISH MATERIALIZER — server-only plain module (no 'use client', no React).
// Runs inside /api/publish, AFTER the ownership gate and BEFORE
// `sanitizeContentForPublish`, and replaces every placed `cmscollection`
// section's elements with the authoritative render model read from the
// Collection / CollectionGroup / CollectionItem tables.
//
// ── THE SERVER IS THE AUTHORITY ─────────────────────────────────────────────
// The client-sent snapshot carries ONLY the placement (`elements.collectionId`
// (+ optional `layoutHint`)). The data itself is never trusted from the client:
// it is read here, keyed by the tokenId the route ALREADY ownership-verified.
// Passing an unverified tokenId in would be a cross-tenant leak — see the
// publish route's step-1 gate and `publish.authz.test.ts`.
//
// ── DISCOVERY IS TOKEN-KEYED, NOT PAYLOAD-DERIVED ──────────────────────────
// The collection set comes from ONE `tokenId` query (`loadCmsBundlesForToken`),
// not from walking the payload for placed sections. Page emission is therefore
// DECOUPLED from placement (founder ruling, phase 8B): toggling `listingPage` /
// `detailPages` on publishes those pages even if the block sits nowhere. This
// replaced phase 3's zero-query fast path; the guarantee that now stands in its
// place is the zero-collections BYTE-IDENTITY invariant documented on
// `materializeCmsForPublish` and pinned by test.
//
// ── PARITY BY CONSTRUCTION ──────────────────────────────────────────────────
// The model comes from `toRenderModel()` — the exact same function the editor
// adapter calls. One shaping path ⇒ the two feeds cannot diverge.
//
// ── THE SILENT-VANISH PIN (read before editing) ─────────────────────────────
// The publish payload carries NO `sectionLayouts` map; `LandingPagePublishedRenderer`
// rebuilds layouts EXCLUSIVELY from `content[sid].layout` and silently
// `return null`s a section with no layout. So this module PRESERVES
// `content[sid].layout` (and `id`) when it rewrites a section — swapping in a
// bare elements payload would drop the section from the published page while the
// (forgiving) editor kept rendering it.
//
// ── COERCION-PROOF OUTPUT ───────────────────────────────────────────────────
// The output flows through `coercePublishValue` right after us. No object we
// emit may carry BOTH a string `content` and a string `type` key, and no map may
// carry a numeric key (ANY one numeric key whose value is a string collapses the
// whole object into the concatenation of its numeric keys, discarding every
// other key). `toRenderModel`'s shape (`{fieldType, value}`, letter-prefixed
// field ids, arrays for ordered data) satisfies both; the byte-identical
// round-trip test in `materializePublish.test.ts` is the binding proof.
//
// ── URL-KEY-PROOF OUTPUT (the SECOND chokepoint) ────────────────────────────
// There are TWO sanitize passes after us, not one. The second,
// `sanitizeContentHtml` (publishSanitizer.ts, route.ts:133), recurses into
// `elements.cmsModel` and rewrites any STRING prop whose key ends in
// `href`/`url`/`link`/`slug` to `'#'` when it isn't a URL. That is why the model
// keys are `primaryCta` / `collectionRef` / `itemRef` and NOT
// `primaryLink` / `collectionSlug` / `slug` — see the key-name note atop
// `render/toRenderModel.ts`. `materializePublish.test.ts` runs BOTH chokepoints
// in route order and meta-guards the key names; never assert against only one.
//
// ── AUTHORITY SCOPING ───────────────────────────────────────────────────────
// Structurally incapable of touching anything but `cmscollection` sections: the
// walk filters on the section-id TYPE prefix and rewrites nothing else. `works`
// / `products` / every other section and subpage passes through untouched (the
// works-catalog authority boundary).

import { prisma } from '@/lib/prisma';
import {
  toRenderModel,
  toDetailModel,
  allRenderItems,
  cmsDetailPath,
  fieldById,
  CMS_MODEL_ELEMENT_KEY,
  CMS_DETAIL_ELEMENT_KEY,
  type CmsRenderModel,
  type CmsDetailModel,
} from './render/toRenderModel';
import type { CmsCollectionBundle, CmsCollection, FieldDef, CollectionRoles } from './types';
import {
  CMS_SECTION_TYPE,
  CMS_COLLECTION_LAYOUT,
  isCmsSectionId,
  CMS_ITEM_SECTION_TYPE,
  CMS_COLLECTION_ITEM_LAYOUT,
  isCmsItemSectionId,
  CMS_LISTING_MARKER,
  cmsListingSectionId,
  isCmsListingSectionId,
  cmsListingPath,
} from './sectionKeys';

// EVERY section-identity constant (listing AND detail) lives in the prisma-free
// `./sectionKeys`, so client modules (the editor store slice) can share them
// without pulling this server-only module's `@/lib/prisma` import into the browser
// bundle. Re-exported here for back-compat — existing tests/consumers import them
// from this path (`materializePublish.test.ts`, `hooks/editStore/cmsActions.test.ts`),
// so this re-export is load-bearing: deleting it breaks them.
export {
  CMS_SECTION_TYPE,
  CMS_COLLECTION_LAYOUT,
  isCmsSectionId,
  CMS_ITEM_SECTION_TYPE,
  CMS_COLLECTION_ITEM_LAYOUT,
  isCmsItemSectionId,
  CMS_LISTING_MARKER,
  cmsListingSectionId,
  isCmsListingSectionId,
  cmsListingPath,
};

/** One placed cms section, located inside whichever container holds it. */
interface FoundSection {
  container: Record<string, any>;
  sectionId: string;
}

/**
 * Every cms section in the payload, across BOTH containers: the root page
 * (`content.content` ?? `content`, driven by `content.layout.sections`) and every
 * subpage (`sub.content` ?? `sub`, driven by `sub.layout.sections`). A cms section
 * placed on a subpage must materialize too, or it publishes empty.
 */
export function findCmsSections(content: Record<string, any>): FoundSection[] {
  const found: FoundSection[] = [];

  const scan = (sections: unknown, container: unknown) => {
    if (!Array.isArray(sections) || !container || typeof container !== 'object') return;
    for (const sid of sections) {
      if (typeof sid !== 'string' || !isCmsSectionId(sid)) continue;
      found.push({ container: container as Record<string, any>, sectionId: sid });
    }
  };

  // Root page — same container resolution as `sanitizeContentForPublish`.
  scan(
    content?.layout?.sections,
    content?.content && typeof content.content === 'object' ? content.content : content
  );

  // Subpages.
  const subs = content?.subpages;
  if (subs && typeof subs === 'object') {
    for (const sub of Object.values(subs) as any[]) {
      scan(
        sub?.layout?.sections,
        sub?.content && typeof sub.content === 'object' ? sub.content : sub
      );
    }
  }

  return found;
}

/** The collectionId a placed section points at (`null` when unplaced/malformed). */
function placedCollectionId(section: any): string | null {
  const raw = section?.elements?.collectionId;
  return typeof raw === 'string' && raw ? raw : null;
}

/**
 * Rewrite every PLACED cms section's elements from `bundles`. PURE (no DB) — the
 * DB read is `loadCmsBundlesForToken`, so tests drive this with fixtures.
 *
 * Placement is still what drives INLINE rendering: a collection in `bundles` that
 * is placed nowhere contributes no section here (it may still emit PAGES — see
 * `materializeCmsForPublish`).
 *
 * - preserves `layout` (defaulting to `CMS_COLLECTION_LAYOUT`) and `id`
 * - preserves every non-`elements` section prop (backgroundType, aiMetadata, …)
 * - REPLACES `elements` wholesale: server authority, so a client-sent stale
 *   `cmsModel` can never survive
 * - unknown / deleted collectionId → placement kept, no model written → the
 *   published twin renders an empty block; the publish is NOT failed
 *
 * @returns the number of sections materialized (diagnostic; used by tests)
 */
export function materializeCmsContent(
  content: Record<string, any>,
  bundles: Map<string, CmsCollectionBundle>
): number {
  const sections = findCmsSections(content);
  for (const { container, sectionId } of sections) {
    const prev = (container[sectionId] ?? {}) as Record<string, any>;
    const collectionId = placedCollectionId(prev);
    const layoutHint = prev?.elements?.layoutHint;

    const elements: Record<string, any> = {};
    if (collectionId) elements.collectionId = collectionId;
    if (typeof layoutHint === 'string' && layoutHint) elements.layoutHint = layoutHint;

    const bundle = collectionId ? bundles.get(collectionId) : undefined;
    if (bundle) {
      elements[CMS_MODEL_ELEMENT_KEY] = toRenderModel(bundle);
    }

    container[sectionId] = {
      ...prev,
      id: prev.id || sectionId,
      // THE dual pin's publish half — never drop this.
      layout: typeof prev.layout === 'string' && prev.layout ? prev.layout : CMS_COLLECTION_LAYOUT,
      elements,
    };
  }
  return sections.length;
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL PAGES (phase 4) — server-authoritative fan-out into content.subpages
// ════════════════════════════════════════════════════════════════════════════
//
// `detailPages: on` ⇒ every item of the collection gets its own published page —
// placed or not (the decoupling ruling; before it, an unplaced collection's item
// pages silently never shipped). There are no editor page entries for these (plan Deviations #3): this
// module is their SOLE author, they ride the existing generic subpage chain
// (subpages → blob → KV → /p/<slug>/<subpath>), and `pageActions.ts` is not
// touched — so naayom's live products pages are untouched by construction.
//
// ── PATH CONVENTION (pinned) ────────────────────────────────────────────────
// Key AND card href are the SAME leading-slash absolute bare path,
// `/<collectionRef>/<itemRef>` (`cmsDetailPath`). Slash-less breaks KV route
// derivation and the publish route's locale collision guard, and fails
// `isSafeURL` → the href is coerced to '#'.
//
// ── THE DUAL PIN APPLIES TO EVERY FAN-OUT SECTION ───────────────────────────
// Subpage layouts are ALSO rebuilt exclusively from `content[sid].layout`
// (`LandingPagePublishedRenderer.tsx:106-113`), and a missing layout hits the
// silent `return null` at :121 — the section vanishes with no error. So every id
// in `layout.sections` gets a full `{id, layout, elements}` entry.
//
// ── AUTHORITY SCOPING ───────────────────────────────────────────────────────
// We touch ONLY subpages that are STRUCTURALLY cms detail pages (every section
// id carries the `cmscollectionitem` type prefix). Non-cms subpages — user pages,
// naayom's `/products/*`, works pages — are never written and never removed. A
// computed cms path landing on a non-cms subpage is a FAIL-LOUD collision, never
// a silent overwrite (publish itself has no collision detection:
// `usePublishFlow.ts:177` blindly assigns `subpages[pathSlug]`).

// `CMS_ITEM_SECTION_TYPE`, `CMS_COLLECTION_ITEM_LAYOUT` and `isCmsItemSectionId`
// live in `./sectionKeys` alongside their listing counterparts (imported +
// re-exported at the top of this file).

/**
 * Thrown when a computed detail path would overwrite a non-cms subpage.
 *
 * The publish route CATCHES THIS BY CLASS and maps it to a 409 carrying
 * `.message` verbatim (`api/publish/route.ts`), because the user has to act on it
 * (rename the page, or change the collection/item slug) and cannot do that unless
 * they are told WHICH path collided. So the message is a user-facing contract:
 * keep the path in it, and keep the class exported.
 */
export class CmsPathCollisionError extends Error {
  constructor(public readonly path: string) {
    super(
      `A page already exists at "${path}", so the collection page cannot be created. ` +
        `Rename that page, or change the collection or item slug.`
    );
    this.name = 'CmsPathCollisionError';
  }
}

// ── FAN-OUT CAP (the serial-publish safety valve) ───────────────────────────
// Detail-page fan-out used to be BOTH conditional and small: only a PLACED
// collection emitted pages, so placement was an accidental brake. Decoupling
// removed that brake — every collection with `detailPages` on now fans out, on
// every publish, unconditionally.
//
// The cost is not linear-and-harmless: publish renders one blob AND writes one
// KV route PER PAGE, SERIALLY, inside a single serverless request. A collection
// with a few hundred items therefore does not merely get slow — it exhausts the
// function timeout and dies as an OPAQUE timeout on the highest-blast-radius
// route in the codebase, with no message the user (or Sentry) can act on.
//
// So the fan-out is CAPPED, and exceeding the cap fails LOUD and EARLY (before
// any mutation, same discipline as the collision guard).
//
// ── TWO CAPS, TWO DIFFERENT JOBS (read this before touching either) ─────────
// There are TWO constants, and only ONE of them is the actual safety guard:
//
//  · MAX_CMS_DETAIL_PAGES_TOTAL — THE GUARD. The timeout is a property of the
//    WHOLE publish request, so only a TOTAL across every collection can bound
//    it. A per-collection cap cannot: ten collections of 100 items each are ten
//    individually-legal collections that still fan out to 1000 pages and time
//    out exactly as if there were no cap at all. This constant is what actually
//    prevents the opaque timeout.
//  · MAX_CMS_DETAIL_PAGES_PER_COLLECTION — THE BETTER ERROR MESSAGE. When ONE
//    oversized collection is the cause, naming it ("Books has 340 items") is far
//    more actionable than an aggregate total the user has to attribute himself.
//    Checked FIRST for exactly that reason. It is deliberately NOT the binding
//    constraint, and it is <= the total by construction, so it can never permit
//    something the total forbids.
//
// NOT a product statement about how big a collection may be — a v1 safety valve
// chosen to sit comfortably inside one request. Batched/async fan-out is the
// real fix and is a later track; when it lands, these two constants are the
// single place to raise or retire the limits.
//
// ⚠️ BOTH NUMBERS ARE ARITHMETIC ESTIMATES, NOT MEASUREMENTS. They are derived
// from an assumed ~100-300ms per page, never timed against a real seeded
// collection. Owed before beta: ONE timing run (seed a collection at the cap,
// publish, measure) and write the MEASURED per-page cost into the comments
// below, so the next person tunes from data instead of re-deriving the guess.

/**
 * Max detail pages ONE PUBLISH may emit, across ALL collections. THE GUARD.
 *
 * 100: publish renders one blob + writes one KV route per page, SERIALLY, in a
 * single request — assume ~300ms per page worst case (~100ms typical). The
 * request also has to fit the REST of publish: the root HTML render, both
 * sanitize passes, the KV route writes and the DB work. Reserving roughly half
 * of a 60s serverless budget for that leaves ~30s for fan-out ⇒ ~100 pages at
 * the worst-case per-page cost.
 *
 * Deliberately CONSERVATIVE: too low fails loud with an actionable 409 and is a
 * one-line raise; too high fails as the opaque timeout this cap exists to
 * eliminate. (Estimate, not a measurement — see the ⚠️ note above.)
 */
export const MAX_CMS_DETAIL_PAGES_TOTAL = 100;

/**
 * Max detail pages ONE collection may fan out to in a single publish.
 *
 * Equal to the total cap today, which is intentional: a single collection may
 * legitimately use the whole budget. Its job is NOT to bound the request (the
 * total does that) but to produce the specific, actionable message when one
 * collection is the culprit. Keep it <= `MAX_CMS_DETAIL_PAGES_TOTAL`; a larger
 * value would be dead, since the total would trip first.
 */
export const MAX_CMS_DETAIL_PAGES_PER_COLLECTION = 100;

/**
 * Thrown when a collection's detail-page fan-out would exceed the cap.
 *
 * Mapped by the publish route to a 409 carrying `.message` verbatim, exactly
 * like `CmsPathCollisionError` — the user can act on it (turn the toggle off, or
 * split/trim the collection) but only if they are told WHICH collection and what
 * the limit is. So the message is a user-facing contract; keep the collection
 * name and the number in it, and keep the class exported.
 *
 * We do NOT truncate to the first N items instead: a half-published collection
 * is worse than a refused one — the user gets a live page with items silently
 * missing and no signal that anything was dropped.
 */
export class CmsFanOutLimitError extends Error {
  constructor(
    public readonly collectionName: string,
    public readonly itemCount: number
  ) {
    super(
      `Collection "${collectionName}" has ${itemCount} items; detail pages are limited to ` +
        `${MAX_CMS_DETAIL_PAGES_PER_COLLECTION} per collection. Turn detail pages off for ` +
        `this collection, or reduce its items.`
    );
    this.name = 'CmsFanOutLimitError';
  }
}

/**
 * Thrown when the TOTAL detail-page fan-out across ALL collections would exceed
 * the request-wide cap. This is the class that guards the actual failure mode —
 * `CmsFanOutLimitError` only fires when a SINGLE collection is oversized, which
 * is the easy case.
 *
 * Mapped by the publish route to a 409 carrying `.message` verbatim, like the
 * other two. It is a SEPARATE class with NO shared base: a base class would let
 * a future error type silently enrol itself into the route's 409 branch, so the
 * route narrows on each class by explicit `instanceof`.
 *
 * The message must carry the TOTAL, the LIMIT, and the remedy — the user cannot
 * act on "too many pages" alone, because no single collection is at fault and
 * the total is not visible anywhere in the UI. No truncation, for the same
 * reason as above: a half-published site is worse than a refused publish.
 */
export class CmsTotalFanOutLimitError extends Error {
  constructor(public readonly totalItems: number) {
    super(
      `Publishing would create ${totalItems} collection detail pages, but one publish is ` +
        `limited to ${MAX_CMS_DETAIL_PAGES_TOTAL} in total across all collections. ` +
        `Turn detail pages off for some collections, or reduce their items.`
    );
    this.name = 'CmsTotalFanOutLimitError';
  }
}

/**
 * Fail loud if the detail-page fan-out would exceed EITHER cap. PURE (no DB, no
 * mutation) — call it BEFORE anything writes.
 *
 * Order is deliberate: the PER-COLLECTION check runs first so that a single
 * oversized collection yields the message that NAMES it, rather than an opaque
 * aggregate the user has to attribute himself. The TOTAL check then runs over
 * the accumulated count and is the one that actually bounds the request — it
 * catches the case the per-collection cap structurally cannot: many collections
 * each individually UNDER the per-collection cap whose SUM still times the
 * function out.
 *
 * Counts the collections' ITEMS, not the pages that would actually be emitted.
 * The two differ only for slug-less items (which emit no page), so counting
 * items is the CONSERVATIVE choice — it can trip slightly early, never late —
 * and it keeps the error messages ("has N items" / "would create N pages") true
 * against what the user sees in the collection editor.
 *
 * Only `detailPages`-on collections are counted, for BOTH caps: a toggled-off
 * collection emits no detail pages at all, so its size is irrelevant to the
 * request's cost. Listing pages are exactly one per collection and need no cap.
 */
export function assertCmsFanOutWithinLimit(bundles: Map<string, CmsCollectionBundle>): void {
  let total = 0;
  for (const bundle of bundles.values()) {
    if (!bundle.collection.detailPages) continue;
    const count = bundle.items.length;
    if (count > MAX_CMS_DETAIL_PAGES_PER_COLLECTION) {
      throw new CmsFanOutLimitError(bundle.collection.name || bundle.collection.slug, count);
    }
    total += count;
  }
  // THE guard. Runs after the loop so the per-collection message wins whenever
  // it applies, but this is the check the timeout actually depends on.
  if (total > MAX_CMS_DETAIL_PAGES_TOTAL) {
    throw new CmsTotalFanOutLimitError(total);
  }
}

/**
 * Is this subpage entry one WE authored? True only when it has at least one
 * section and EVERY section id is a `cmscollectionitem` id. A user cannot author
 * such a page (no editor plumbing exists), so this is a safe ownership marker —
 * and it is the same structural filtering phase 3 used, not a looser rule.
 */
export function isCmsDetailSubpage(sub: any): boolean {
  const sections = sub?.layout?.sections;
  if (!Array.isArray(sections) || sections.length === 0) return false;
  return sections.every((s: unknown) => typeof s === 'string' && isCmsItemSectionId(s));
}

/** The section id of an item's detail section — deterministic, so republishing
 *  the same item produces a byte-identical subpage. Item ids are Prisma cuids
 *  (letter-prefixed), so the id is coercion-safe. */
function detailSectionId(itemId: string): string {
  return `${CMS_ITEM_SECTION_TYPE}-${itemId}`;
}

/** The <title> of a detail page: the item's title-role value, else the
 *  collection name, else the item slug. Always a non-empty string. */
function detailTitle(detail: CmsDetailModel): string {
  const title = fieldById(detail.item, detail.roles.title);
  const fromTitle = typeof title?.value === 'string' ? title.value.trim() : '';
  return fromTitle || detail.collectionName || detail.item.itemRef;
}

/**
 * Build ONE subpage entry. Shape is PINNED:
 *   `{ layout: { sections }, content, title }`
 * `theme` is deliberately OMITTED — `renderPublishedExport.ts:262-278` falls back
 * to the root theme, so detail pages inherit the site's look automatically. No
 * `seo` either (the root cascade applies).
 */
function buildDetailSubpage(detail: CmsDetailModel): Record<string, any> {
  const sid = detailSectionId(detail.item.itemId);
  return {
    layout: { sections: [sid] },
    content: {
      // THE DUAL PIN: a full entry with a non-empty `layout`, for every id in
      // `layout.sections`. Drop `layout` and the page publishes BLANK, silently.
      [sid]: {
        id: sid,
        layout: CMS_COLLECTION_ITEM_LAYOUT,
        elements: {
          collectionId: detail.collectionId,
          [CMS_DETAIL_ELEMENT_KEY]: detail,
        },
      },
    },
    title: detailTitle(detail),
  };
}

/** Every detail subpage a set of bundles should produce, keyed by path. */
export function buildDetailSubpages(
  bundles: Map<string, CmsCollectionBundle>
): Map<string, Record<string, any>> {
  const out = new Map<string, Record<string, any>>();
  for (const bundle of bundles.values()) {
    const model: CmsRenderModel = toRenderModel(bundle);
    if (!model.detailPages) continue; // toggle OFF ⇒ this collection makes no pages
    for (const item of allRenderItems(model)) {
      const path = cmsDetailPath(model.collectionRef, item.itemRef);
      if (!path) continue; // missing slug ⇒ no page (and the card carries no link)
      out.set(path, buildDetailSubpage(toDetailModel(model, item)));
    }
  }
  return out;
}

/**
 * Reconcile `content.subpages` with the authoritative detail pages. PURE (no DB).
 * Mutates `content` in place.
 *
 * 1. FAIL LOUD on a computed path that is occupied by a NON-cms subpage.
 * 2. REMOVE every cms detail subpage that is no longer authoritative (detailPages
 *    toggled off, item deleted/renamed, collection unplaced) — scoped to
 *    structurally-cms entries, so nothing else can be dropped.
 * 3. WRITE every computed entry, overwriting any stale client-sent copy (server
 *    authority: the client's snapshot of a cms path is never trusted).
 *
 * @returns counts (diagnostic; used by tests)
 */
export function applyCmsDetailPages(
  content: Record<string, any>,
  bundles: Map<string, CmsCollectionBundle>
): { written: number; removed: number } {
  const desired = buildDetailSubpages(bundles);

  const existing =
    content?.subpages && typeof content.subpages === 'object' ? content.subpages : null;

  // 1. collision guard — before ANY mutation, so a failed publish changes nothing.
  if (existing) {
    for (const path of desired.keys()) {
      const sub = existing[path];
      if (sub !== undefined && !isCmsDetailSubpage(sub)) {
        throw new CmsPathCollisionError(path);
      }
    }
  }

  if (!existing && desired.size === 0) return { written: 0, removed: 0 };

  const subpages: Record<string, any> = existing ?? {};
  if (!existing) content.subpages = subpages;

  // 2. prune stale cms detail pages (never anything else).
  let removed = 0;
  for (const path of Object.keys(subpages)) {
    if (desired.has(path)) continue;
    if (!isCmsDetailSubpage(subpages[path])) continue; // not ours → untouched
    delete subpages[path];
    removed++;
  }

  // 3. write the authoritative entries.
  for (const [path, entry] of desired) subpages[path] = entry;

  return { written: desired.size, removed };
}

// ════════════════════════════════════════════════════════════════════════════
// LISTING PAGES (phase 8B) — the `/<collectionRef>` page, per-collection toggle
// ════════════════════════════════════════════════════════════════════════════
//
// Designer t12 says a collection yields TWO pages: a listing (`/books`) and item
// pages (`/books/:slug`). v1 shipped only the item half plus a manually PLACED
// listing block; `listingPage` (default OFF, founder ruling) restores the other
// half as an opt-in.
//
// A listing page is NOT a new block: it is the SAME `cmscollection` section on a
// page of its own, carrying the SAME `toRenderModel()` output under the SAME
// element key. So every phase-3/4 pin re-applies verbatim, and nothing new can
// diverge between the placed block and the listing page — they are one renderer
// fed by one model.
//
// ── EVERY PIN, RESTATED (this path has already produced two publish-only bugs) ─
//  · DUAL PIN — `content[sid] = {id, layout: CMS_COLLECTION_LAYOUT, elements}`
//    for the single id in `layout.sections`. Layout-less ⇒ the published
//    renderer's silent `return null` and a BLANK page, with no error anywhere.
//  · LEADING-SLASH ABSOLUTE key `/<collectionRef>` (`cmsListingPath`). Never
//    slash-less, never `/p/<slug>/…`.
//  · ENTRY SHAPE `{layout:{sections}, content, title}`; `theme` omitted on
//    purpose (the root theme cascades, `renderPublishedExport.ts:262-278`).
//  · KEY-NAMING LAW — nothing added here ends in href/url/link/slug.
//  · AUTHORITY SCOPING — only cms listing paths are written or pruned.
//  · COLLISION → `CmsPathCollisionError` → 409, checked BEFORE any mutation.
//
// ── DECOUPLED FROM PLACEMENT (founder ruling — supersedes the phase-8B draft) ─
// The authoritative set is EVERY collection of the token with `listingPage` on,
// placed or not. The modal's "CREATES THESE PAGES" tiles promise these pages the
// moment the toggle flips; coupling them to placement made that promise fail
// silently. The same ruling retro-fixes `detailPages`, which had been coupled
// since phase 4. Cost + the invariant that replaced the zero-query fast path:
// see `materializeCmsForPublish`.

/**
 * Build ONE listing subpage entry. Shape PINNED, same as `buildDetailSubpage`.
 * The section id embeds the collection id, so republishing is byte-identical and
 * the entry is recognisably OURS (see `CMS_LISTING_MARKER`).
 */
function buildListingSubpage(model: CmsRenderModel): Record<string, any> {
  const sid = cmsListingSectionId(model.collectionId);
  return {
    layout: { sections: [sid] },
    content: {
      // THE DUAL PIN. Drop `layout` and this page publishes BLANK, silently.
      [sid]: {
        id: sid,
        layout: CMS_COLLECTION_LAYOUT,
        elements: {
          collectionId: model.collectionId,
          [CMS_MODEL_ELEMENT_KEY]: model,
        },
      },
    },
    title: model.collectionName || model.collectionRef,
  };
}

/** Every listing subpage a set of bundles should produce, keyed by path. */
export function buildListingSubpages(
  bundles: Map<string, CmsCollectionBundle>
): Map<string, Record<string, any>> {
  const out = new Map<string, Record<string, any>>();
  for (const bundle of bundles.values()) {
    const model: CmsRenderModel = toRenderModel(bundle);
    if (!model.listingPage) continue; // toggle OFF ⇒ no page
    const path = cmsListingPath(model.collectionRef);
    if (!path) continue; // no slug ⇒ no page
    out.set(path, buildListingSubpage(model));
  }
  return out;
}

/**
 * Is this subpage entry a listing page WE authored?
 *
 * Non-empty AND every section id carries the listing marker. A user CAN place a
 * `cmscollection` block on their own subpage, so a bare type-prefix test would
 * claim that page as ours and DELETE it on toggle-off. The marker segment is
 * what makes the ownership test safe.
 */
export function isCmsListingSubpage(sub: any): boolean {
  const sections = sub?.layout?.sections;
  if (!Array.isArray(sections) || sections.length === 0) return false;
  return sections.every((s: unknown) => typeof s === 'string' && isCmsListingSectionId(s));
}

/**
 * Reconcile `content.subpages` with the authoritative listing pages. PURE (no DB).
 * Mutates `content` in place. Identical discipline to `applyCmsDetailPages`:
 * fail-loud collision FIRST, then prune only our own, then write.
 */
export function applyCmsListingPages(
  content: Record<string, any>,
  bundles: Map<string, CmsCollectionBundle>
): { written: number; removed: number } {
  const desired = buildListingSubpages(bundles);

  const existing =
    content?.subpages && typeof content.subpages === 'object' ? content.subpages : null;

  // 1. collision guard — before ANY mutation, so a failed publish changes nothing.
  if (existing) {
    for (const path of desired.keys()) {
      const sub = existing[path];
      if (sub !== undefined && !isCmsListingSubpage(sub)) {
        throw new CmsPathCollisionError(path);
      }
    }
  }

  if (!existing && desired.size === 0) return { written: 0, removed: 0 };

  const subpages: Record<string, any> = existing ?? {};
  if (!existing) content.subpages = subpages;

  // 2. prune stale listing pages (never anything else — see isCmsListingSubpage).
  let removed = 0;
  for (const path of Object.keys(subpages)) {
    if (desired.has(path)) continue;
    if (!isCmsListingSubpage(subpages[path])) continue; // not ours → untouched
    delete subpages[path];
    removed++;
  }

  // 3. write the authoritative entries.
  for (const [path, entry] of desired) subpages[path] = entry;

  return { written: desired.size, removed };
}

/**
 * Check BOTH cms path families for collisions before EITHER reconciler mutates.
 *
 * Each `apply*` already guards itself, but they run in sequence: without this
 * pre-pass a LISTING collision would throw only after the DETAIL pages had
 * already been written into `content`. The publish route discards the payload on
 * a 409 either way, so this is about keeping the stated invariant true —
 * "checked before any mutation" — rather than about a live bug.
 */
export function assertNoCmsPathCollisions(
  content: Record<string, any>,
  bundles: Map<string, CmsCollectionBundle>
): void {
  const existing =
    content?.subpages && typeof content.subpages === 'object' ? content.subpages : null;
  if (!existing) return;

  for (const path of buildDetailSubpages(bundles).keys()) {
    const sub = existing[path];
    if (sub !== undefined && !isCmsDetailSubpage(sub)) throw new CmsPathCollisionError(path);
  }
  for (const path of buildListingSubpages(bundles).keys()) {
    const sub = existing[path];
    if (sub !== undefined && !isCmsListingSubpage(sub)) throw new CmsPathCollisionError(path);
  }
}

/**
 * The top-level page paths a project already occupies (`Project.content.pages[*]
 * .pathSlug`), as leading-slash absolute paths.
 *
 * Used by the collection/item slug routes to reject a slug that would SHADOW an
 * existing page — the write-time half of the collision guard above. Keeping it
 * next to the publish-side guard is deliberate: one module owns the path rule.
 */
export function reservedPagePaths(projectContent: unknown): Set<string> {
  const out = new Set<string>();
  const pages = (projectContent as any)?.pages;
  if (!pages || typeof pages !== 'object') return out;
  for (const page of Object.values(pages) as any[]) {
    const p = page?.pathSlug;
    if (typeof p !== 'string' || !p) continue;
    out.add(p.startsWith('/') ? p : `/${p}`);
  }
  return out;
}

/**
 * Would a collection with this slug shadow an existing page path? True when a
 * page already sits at `/<slug>` OR anywhere beneath it (`/<slug>/…`) — the
 * latter is the one that actually bites: a collection slugged `products` on
 * naayom would fan out `/products/<item>` straight onto live product pages.
 */
export function collectionSlugShadowsPage(slug: string, reserved: Set<string>): boolean {
  if (!slug) return false;
  const base = `/${slug}`;
  for (const path of reserved) {
    if (path === base || path.startsWith(`${base}/`)) return true;
  }
  return false;
}

/** Would this item's detail page land exactly on an existing page path? */
export function itemSlugShadowsPage(
  collectionSlug: string,
  itemSlug: string,
  reserved: Set<string>
): boolean {
  const path = cmsDetailPath(collectionSlug, itemSlug);
  return !!path && reserved.has(path);
}

/** Narrow a Prisma Collection row (Json columns) to the app-level shape. */
function toCmsCollection(row: any): CmsCollection {
  return {
    id: row.id,
    projectId: row.projectId,
    tokenId: row.tokenId,
    name: row.name,
    slug: row.slug,
    fieldSchema: (Array.isArray(row.fieldSchema) ? row.fieldSchema : []) as FieldDef[],
    roles: ((row.roles && typeof row.roles === 'object' ? row.roles : {}) as CollectionRoles),
    detailPages: !!row.detailPages,
    // Phase 8B: carried so `toRenderModel` can decide the listing page. The two
    // remaining amendment fields (`purposes`, `featuredOnHome`) are deliberately
    // NOT narrowed here — they are stored-but-unread by ruling, and putting them
    // in the publish model would make them look like a delivered capability.
    listingPage: !!row.listingPage,
    layoutHint: row.layoutHint ?? null,
    order: row.order ?? 0,
  };
}

/**
 * Read ALL of this token's collections (with groups + items) in ONE query.
 *
 * The `tokenId` filter is the tenant boundary AND the whole `where` clause: it is
 * the only key this module ever reads by, so a tampered snapshot can never pull
 * another project's rows. (The route's ownership gate is the first line of
 * defence; this is the second — and the caller MUST have run it, see
 * `materializeCmsForPublish`.)
 *
 * ── WHY "ALL", NOT "THE PLACED ONES" (founder ruling, phase 8B) ─────────────
 * Page emission is DECOUPLED from placement: a collection whose `listingPage` /
 * `detailPages` toggle is on must publish its pages whether or not its block sits
 * on any page — the modal's "CREATES THESE PAGES" tiles promise exactly that, and
 * the old placement-derived id list silently broke the promise. So discovery is
 * `tokenId`-keyed, not payload-derived.
 *
 * The `select` is explicit (not `include`) so the query carries only the columns
 * the bundle actually reads — the stored-but-unread `purposes` column and the
 * timestamps stay off the wire.
 */
export async function loadCmsBundlesForToken(
  tokenId: string
): Promise<Map<string, CmsCollectionBundle>> {
  const bundles = new Map<string, CmsCollectionBundle>();
  if (!tokenId) return bundles;

  const rows = await prisma.collection.findMany({
    // `@@index([tokenId, order])` on Collection covers this exactly, and the
    // matching `orderBy` keeps the emitted page set deterministic run-to-run.
    where: { tokenId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      projectId: true,
      tokenId: true,
      name: true,
      slug: true,
      fieldSchema: true,
      roles: true,
      detailPages: true,
      listingPage: true,
      layoutHint: true,
      order: true,
      groups: {
        orderBy: { order: 'asc' },
        select: { id: true, collectionId: true, name: true, order: true },
      },
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          collectionId: true,
          groupId: true,
          slug: true,
          values: true,
          order: true,
          slugLocked: true,
        },
      },
    },
  });

  for (const row of rows as any[]) {
    bundles.set(row.id, {
      collection: toCmsCollection(row),
      groups: (row.groups ?? []).map((g: any) => ({
        id: g.id,
        collectionId: g.collectionId,
        name: g.name,
        order: g.order ?? 0,
      })),
      items: (row.items ?? []).map((i: any) => ({
        id: i.id,
        collectionId: i.collectionId,
        groupId: i.groupId ?? null,
        slug: i.slug,
        values: (i.values && typeof i.values === 'object' ? i.values : {}) as any,
        order: i.order ?? 0,
        slugLocked: !!i.slugLocked,
      })),
    });
  }

  return bundles;
}

/**
 * Publish entry point. Mutates `content` IN PLACE.
 *
 * `tokenId` MUST already be ownership-verified by the caller — the collection
 * read below happens AFTER the route's `assertProjectOwner` gate and is keyed by
 * nothing else.
 *
 * ── PAGE EMISSION IS DECOUPLED FROM PLACEMENT (founder ruling, phase 8B) ────
 * Discovery is `tokenId`-keyed, NOT payload-derived: every collection with
 * `listingPage` / `detailPages` on emits its pages regardless of whether its
 * block is placed anywhere. Placement still drives INLINE rendering exactly as
 * before (`materializeCmsContent` rewrites only placed sections).
 *
 * ── WHAT THIS COST, AND WHAT REPLACED IT ───────────────────────────────────
 * Phase 3 had a zero-query FAST PATH: a payload with no cms sections issued no
 * queries at all, which was the blast-radius mitigation on this (highest-risk)
 * route. Decoupling necessarily trades it for ONE indexed query per publish. The
 * guarantee that REPLACES it — and that is now the thing to protect — is
 * BYTE-IDENTITY:
 *   · a project with ZERO collections is byte-identical after materialization
 *     (whole payload, `subpages` included), and
 *   · a project whose collections all have BOTH toggles off is byte-identical
 *     too (absent a placed block, which legitimately gets its model written).
 * Both hold structurally: with an empty desired set the reconcilers only prune
 * entries they can PROVE they authored (the `cmscollectionitem` prefix / the
 * `cmscollection-listing-` marker), and they never create `content.subpages`.
 * Both are pinned by explicit tests in `materializePublish.test.ts`.
 *
 * Decoupling ALSO removed placement as an accidental brake on detail-page
 * fan-out, so the fan-out is now CAPPED — `assertCmsFanOutWithinLimit`, checked
 * below before anything mutates. TWO caps: `MAX_CMS_DETAIL_PAGES_TOTAL` is the
 * guard (the timeout is a property of the whole REQUEST, so only a total can
 * bound it); `MAX_CMS_DETAIL_PAGES_PER_COLLECTION` exists to name the culprit
 * collection when there is one.
 *
 * @returns the number of cms sections materialized
 */
export async function materializeCmsForPublish(
  tokenId: string,
  content: Record<string, any>
): Promise<number> {
  const bundles = await loadCmsBundlesForToken(tokenId);

  // BOTH fail-loud guards run FIRST — before any container is touched, so a
  // rejected publish leaves the payload byte-identical.
  // Cap before collisions: an over-cap collection is a refusal regardless of
  // where its paths land, and this check is the cheaper of the two.
  assertCmsFanOutWithinLimit(bundles);
  assertNoCmsPathCollisions(content, bundles);
  // Placed sections only: unplaced collections contribute PAGES (below), never
  // inline content.
  const materialized = materializeCmsContent(content, bundles);
  // Fan-out AFTER the listing sections: the detail sections we add carry the
  // `cmscollectionitem` prefix, which `findCmsSections` deliberately does not
  // match, so the two passes cannot interfere in either order — but this order
  // keeps "listing first, then its pages" readable.
  //
  // With an empty `bundles` these two are the ORPHAN REAPER: they drop cms pages
  // left behind by a deleted collection or a toggled-off switch, and touch
  // nothing else.
  applyCmsDetailPages(content, bundles);
  // Listing pages last. Both reconcilers write disjoint path sets (`/<c>` vs
  // `/<c>/<i>`) and each prunes ONLY entries it can prove it authored, so the
  // order is not load-bearing — it just reads as "the block, then its pages".
  applyCmsListingPages(content, bundles);
  return materialized;
}
