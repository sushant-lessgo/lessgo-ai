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
 * Rewrite every cms section's elements from `bundles`. PURE (no DB) — the DB
 * read is `loadCmsBundles`, so tests drive this with fixtures.
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
// `detailPages: on` ⇒ every item of a PLACED collection gets its own published
// page. There are no editor page entries for these (plan Deviations #3): this
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
      `A page already exists at "${path}", so the collection item page cannot be created. ` +
        `Rename that page, or change the collection or item slug.`
    );
    this.name = 'CmsPathCollisionError';
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
    layoutHint: row.layoutHint ?? null,
    order: row.order ?? 0,
  };
}

/**
 * Read the requested collections (with groups + items) for ONE token.
 *
 * The `tokenId` filter is the tenant boundary: even a collectionId belonging to
 * another project cannot be loaded here, so a tampered snapshot yields an empty
 * block rather than someone else's content. (The route's ownership gate is the
 * first line of defence; this is the second.)
 */
export async function loadCmsBundles(
  tokenId: string,
  collectionIds: string[]
): Promise<Map<string, CmsCollectionBundle>> {
  const bundles = new Map<string, CmsCollectionBundle>();
  if (!tokenId || collectionIds.length === 0) return bundles;

  const rows = await prisma.collection.findMany({
    where: { tokenId, id: { in: collectionIds } },
    include: {
      groups: { orderBy: { order: 'asc' } },
      items: { orderBy: { order: 'asc' } },
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
 * NO-OP FAST PATH: a payload with zero cms sections issues ZERO queries, so
 * every existing (non-CMS) publish keeps exactly today's behaviour and DB load.
 *
 * `tokenId` MUST already be ownership-verified by the caller.
 *
 * @returns the number of cms sections materialized
 */
export async function materializeCmsForPublish(
  tokenId: string,
  content: Record<string, any>
): Promise<number> {
  const sections = findCmsSections(content);

  if (sections.length === 0) {
    // FAST PATH — still ZERO queries. The detail-page reconcile runs with an empty
    // authoritative set because it is PURELY STRUCTURAL: it drops orphaned cms
    // detail subpages left behind when the last collection section was removed.
    // Without this, deleting the block would leave its item pages published
    // forever. Non-cms subpages are untouched, so a project that never used the
    // CMS is byte-identical to today.
    applyCmsDetailPages(content, new Map());
    return 0;
  }

  const ids = Array.from(
    new Set(
      sections
        .map(({ container, sectionId }) => placedCollectionId(container[sectionId]))
        .filter((id): id is string => !!id)
    )
  );

  const bundles = await loadCmsBundles(tokenId, ids);
  const materialized = materializeCmsContent(content, bundles);
  // Fan-out AFTER the listing sections: the detail sections we add carry the
  // `cmscollectionitem` prefix, which `findCmsSections` deliberately does not
  // match, so the two passes cannot interfere in either order — but this order
  // keeps "listing first, then its pages" readable.
  applyCmsDetailPages(content, bundles);
  return materialized;
}
