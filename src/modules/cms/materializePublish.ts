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
import { toRenderModel, CMS_MODEL_ELEMENT_KEY } from './render/toRenderModel';
import type { CmsCollectionBundle, CmsCollection, FieldDef, CollectionRoles } from './types';
import { CMS_SECTION_TYPE, CMS_COLLECTION_LAYOUT, isCmsSectionId } from './sectionKeys';

// The section-identity constants now LIVE in the prisma-free `./sectionKeys`, so
// client modules (the editor store slice) can share them without pulling this
// server-only module's `@/lib/prisma` import into the browser bundle. Re-exported
// here for back-compat — existing tests/consumers import them from this path.
export { CMS_SECTION_TYPE, CMS_COLLECTION_LAYOUT, isCmsSectionId };

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
  if (sections.length === 0) return 0;

  const ids = Array.from(
    new Set(
      sections
        .map(({ container, sectionId }) => placedCollectionId(container[sectionId]))
        .filter((id): id is string => !!id)
    )
  );

  const bundles = await loadCmsBundles(tokenId, ids);
  return materializeCmsContent(content, bundles);
}
