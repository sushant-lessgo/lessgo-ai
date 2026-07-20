// src/modules/cms/materializePublish.test.ts
// ============================================================================
// THE binding publish gate for CMS collections (plan phase 3, step 5).
// Vitest — NOT e2e: `e2e/cms-publish.spec.ts` cannot run without Blob/KV and
// tolerates a 500 locally, so every load-bearing assertion lives here.
//
// What each block defends, and against which specific failure:
//
//  1. SCOPE          — only `cmscollection` sections are touched. A generic
//                      re-materializer that rewrote `works` would corrupt a live
//                      customer catalog (works-authority boundary).
//  2. WALK SCOPE     — root AND subpage containers. A cms section on a subpage
//                      would otherwise publish empty.
//  3. SILENT VANISH  — `content[sid].layout` MUST survive. The publish payload
//                      carries no `sectionLayouts` map and the published renderer
//                      resolves layout ONLY from `content[sid].layout`, silently
//                      `return null`ing a section without one.
//  4. COERCION       — the materialized snapshot round-trips through BOTH publish
//                      sanitize chokepoints BYTE-IDENTICAL. There are TWO, and the
//                      gate MUST run both, in route order (api/publish/route.ts):
//                        (a) `sanitizeContentForPublish` (route.ts:82) —
//                            `coercePublishValue` rewrites `{type, content}` pairs and
//                            ANY object carrying a numeric key whose value is a string
//                            (discarding every non-numeric sibling);
//                        (b) `sanitizeContentHtml`      (route.ts:133) —
//                            recurses into `elements.cmsModel` and rewrites every
//                            STRING prop whose KEY ends in href/url/link/slug to '#'
//                            (`isUrlContentKey`).
//                      Running only (a) is exactly why the `primaryLink`/`collectionSlug`
//                      corruption shipped green once. NEVER narrow this back to one pass.
//  4b. KEY NAMES     — a permanent meta-guard asserts no key anywhere in the
//                      materialized model ends in href/url/link/slug except the
//                      sanctioned `url` value keys. Structural recurrence prevention:
//                      a future `detailSlug`/`shareLink` field fails here, not in prod.
//  5. PARITY         — the materialized snapshot is rendered through the REAL
//                      `LandingPagePublishedRenderer`, never the registry component
//                      directly: a direct render bypasses layout resolution +
//                      the silent null and would sit GREEN while publish drops the
//                      section entirely. DO NOT "simplify" this back.
//  6. XSS            — a `javascript:` URL nested inside a gallery/link value is
//                      absent from the materialized snapshot (the publish walker's
//                      one-level recursion cannot reach it; toRenderModel can).
// ============================================================================

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Most gates below drive the PURE materializer with fixtures and never touch the
// DB. The `materializeCmsForPublish` set at the bottom does, so `collection
// .findMany` is a stub whose rows each test sets — importing the module must
// still never boot Prisma.
const findMany = vi.hoisted(() => vi.fn(async (): Promise<any[]> => []));
vi.mock('@/lib/prisma', () => ({ prisma: { collection: { findMany } } }));

import {
  materializeCmsContent,
  findCmsSections,
  isCmsSectionId,
  isCmsItemSectionId,
  isCmsDetailSubpage,
  applyCmsDetailPages,
  buildDetailSubpages,
  reservedPagePaths,
  collectionSlugShadowsPage,
  itemSlugShadowsPage,
  CmsPathCollisionError,
  CmsFanOutLimitError,
  CmsTotalFanOutLimitError,
  assertCmsFanOutWithinLimit,
  MAX_CMS_DETAIL_PAGES_PER_COLLECTION,
  MAX_CMS_DETAIL_PAGES_TOTAL,
  CMS_COLLECTION_LAYOUT,
  CMS_COLLECTION_ITEM_LAYOUT,
  applyCmsListingPages,
  buildListingSubpages,
  isCmsListingSubpage,
  assertNoCmsPathCollisions,
  cmsListingPath,
  cmsListingSectionId,
  isCmsListingSectionId,
  materializeCmsForPublish,
} from './materializePublish';
import {
  toRenderModel,
  toDetailModel,
  allRenderItems,
  cmsDetailPath,
  CMS_MODEL_ELEMENT_KEY,
  CMS_DETAIL_ELEMENT_KEY,
} from './render/toRenderModel';
import CollectionDetail from './render/CollectionDetail';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { sanitizeContentHtml, isUrlContentKey } from '@/lib/publishSanitizer';
import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
import CollectionSection from './render/CollectionSection';
import type { CmsCollectionBundle, FieldDef } from './types';

// ── fixtures ────────────────────────────────────────────────────────────────

const CMS_SID = 'cmscollection-aaa111';
const CMS_SID_SUB = 'cmscollection-bbb222';
const HERO_SID = 'hero-abc12345';
const WORKS_SID = 'works-def67890';

const FIELDS: FieldDef[] = [
  { id: 'cover', name: 'Cover', type: 'image' },
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'blurb', name: 'Blurb', type: 'text_long' },
  { id: 'shots', name: 'Shots', type: 'gallery' },
  // video + audio are here so the KEY-NAME meta-guard below covers every field
  // type that has an emit path: a future `mediaUrl`-style key added to the media
  // branch must trip the no-suffix-match assertion, not slip through an
  // unexercised branch. Phase 8B added `stat` (below) so ALL 10 types are swept.
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'released', name: 'Released', type: 'date' },
  { id: 'topics', name: 'Topics', type: 'tags' },
  // The 10th type. Its two property names (`key`, `value`) are a publish-
  // correctness contract — renaming either to something ending in
  // href/url/link/slug ships '#' on every published spec row.
  { id: 'weight', name: 'Weight', type: 'stat' },
];

function bundle(id = 'col1'): CmsCollectionBundle {
  return {
    collection: {
      id,
      projectId: 'p1',
      tokenId: 'tok1',
      name: 'Books',
      slug: 'books',
      fieldSchema: FIELDS,
      roles: { title: 'title', cover: 'cover', primaryLink: 'buy' },
      detailPages: false,
      layoutHint: null,
      order: 0,
    },
    groups: [{ id: 'gA', collectionId: id, name: 'Recent', order: 0 }],
    items: [
      {
        id: 'i1',
        collectionId: id,
        groupId: 'gA',
        slug: 'deep-work',
        values: {
          cover: { url: 'https://cdn.test/cover.png' },
          title: 'Deep Work',
          blurb: 'A long\nblurb.',
          shots: [{ url: '/one.png' }, { url: 'https://cdn.test/two.png' }],
          clip: { kind: 'link', url: 'https://cdn.test/clip.mp4' },
          track: { kind: 'upload', url: '/track.mp3' },
          buy: { url: 'mailto:hi@acme.com', label: 'Email me' },
          released: '2026-01-02',
          topics: ['focus', 'craft'],
          weight: { key: 'Weight', value: '4.2 kg' },
        } as any,
        order: 0,
        slugLocked: false,
      },
      {
        id: 'i2',
        collectionId: id,
        groupId: null,
        slug: 'loose',
        values: { title: 'Ungrouped', buy: { url: 'tel:+15551234', label: 'Call' } } as any,
        order: 1,
        slugLocked: false,
      },
    ],
  };
}

/** A hostile bundle: `javascript:` URLs nested where the publish walker can't reach. */
function hostileBundle(): CmsCollectionBundle {
  const b = bundle('colX');
  b.items = [
    {
      id: 'iX',
      collectionId: 'colX',
      groupId: null,
      slug: 'x',
      values: {
        title: 'Hostile',
        cover: { url: 'javascript:alert(1)' },
        shots: [{ url: 'javascript:alert(2)' }, { url: 'https://cdn.test/ok.png' }],
        buy: { url: 'javascript:alert(3)', label: 'Click' },
      } as any,
      order: 0,
      slugLocked: false,
    },
  ];
  return b;
}

const bundleMap = (...bs: CmsCollectionBundle[]) =>
  new Map(bs.map((b) => [b.collection.id, b]));

/** A realistic publish payload: root page + a subpage, cms + non-cms sections. */
function payload(opts: { cmsRoot?: boolean; cmsSub?: boolean; collectionId?: string } = {}) {
  const { cmsRoot = true, cmsSub = false, collectionId = 'col1' } = opts;
  const rootSections = [HERO_SID, WORKS_SID, ...(cmsRoot ? [CMS_SID] : [])];
  const content: Record<string, any> = {
    title: 'A page',
    layout: { sections: rootSections, theme: { colors: {} } },
    content: {
      [HERO_SID]: {
        id: HERO_SID,
        layout: 'leftCopyRightImage',
        elements: { headline: 'Hi', subheadline: 'There' },
      },
      [WORKS_SID]: {
        id: WORKS_SID,
        layout: 'WorksGrid',
        elements: {
          works: [{ title: 'Kundius shoot', image: 'https://cdn.test/w.png' }],
        },
      },
      ...(cmsRoot
        ? {
            [CMS_SID]: {
              id: CMS_SID,
              layout: CMS_COLLECTION_LAYOUT,
              backgroundType: 'neutral',
              elements: { collectionId },
            },
          }
        : {}),
    },
    subpages: {
      '/about': {
        title: 'About',
        layout: { sections: ['hero-sub00001', ...(cmsSub ? [CMS_SID_SUB] : [])] },
        content: {
          'hero-sub00001': {
            id: 'hero-sub00001',
            layout: 'leftCopyRightImage',
            elements: { headline: 'About us' },
          },
          ...(cmsSub
            ? {
                [CMS_SID_SUB]: {
                  id: CMS_SID_SUB,
                  layout: CMS_COLLECTION_LAYOUT,
                  elements: { collectionId },
                },
              }
            : {}),
        },
      },
    },
  };
  return content;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * BOTH publish sanitize chokepoints, in the order `api/publish/route.ts` runs
 * them (materialize → sanitizeContentForPublish:82 → … → sanitizeContentHtml:133).
 * Every gate below that claims to model "what publish emits" MUST go through this
 * — `sanitizeContentHtml` is the pass that key-dispatches url-suffixed keys, and
 * omitting it hid a real published-only corruption.
 */
function runPublishSanitizers(content: Record<string, any>): void {
  sanitizeContentForPublish(content);
  sanitizeContentHtml(content);
}

/** Every object key in a structure paired with its value, recursively. */
function allEntries(v: any, out: Array<[string, any]> = []): Array<[string, any]> {
  if (!v || typeof v !== 'object') return out;
  if (Array.isArray(v)) {
    v.forEach((x) => allEntries(x, out));
    return out;
  }
  for (const [k, val] of Object.entries(v)) {
    out.push([k, val]);
    allEntries(val, out);
  }
  return out;
}

/** Every object key in a structure, recursively (for the numeric-key assertion). */
function allKeys(v: any, out: string[] = []): string[] {
  if (!v || typeof v !== 'object') return out;
  if (Array.isArray(v)) {
    v.forEach((x) => allKeys(x, out));
    return out;
  }
  for (const k of Object.keys(v)) {
    out.push(k);
    allKeys(v[k], out);
  }
  return out;
}

// ── 1. section-id typing ────────────────────────────────────────────────────

describe('cms section identification', () => {
  it('matches only the cmscollection type prefix', () => {
    expect(isCmsSectionId(CMS_SID)).toBe(true);
    expect(isCmsSectionId('hero-1')).toBe(false);
    expect(isCmsSectionId('works-1')).toBe(false);
    expect(isCmsSectionId('cmscollectionitem-1')).toBe(false);
  });

  it('finds cms sections in BOTH containers (root + every subpage)', () => {
    const found = findCmsSections(payload({ cmsRoot: true, cmsSub: true }));
    expect(found.map((f) => f.sectionId).sort()).toEqual([CMS_SID, CMS_SID_SUB].sort());
  });
});

// ── 2. scope: everything else passes through byte-identical ─────────────────

describe('materializeCmsContent — authority scoping', () => {
  it('leaves works / products / hero sections and subpages byte-identical', () => {
    const content = payload({ cmsRoot: true, cmsSub: true });
    const before = clone(content);
    materializeCmsContent(content, bundleMap(bundle()));

    expect(content.content[HERO_SID]).toEqual(before.content[HERO_SID]);
    expect(content.content[WORKS_SID]).toEqual(before.content[WORKS_SID]);
    expect(content.subpages['/about'].content['hero-sub00001']).toEqual(
      before.subpages['/about'].content['hero-sub00001']
    );
    expect(content.layout).toEqual(before.layout);
    expect(content.title).toBe(before.title);
  });

  it('a payload with NO cms sections is an exact no-op', () => {
    const content = payload({ cmsRoot: false });
    const before = clone(content);
    expect(materializeCmsContent(content, bundleMap(bundle()))).toBe(0);
    expect(content).toEqual(before);
  });

  it('empty tables (no bundles at all) still no-ops the non-cms payload', () => {
    const content = payload({ cmsRoot: false });
    const before = clone(content);
    materializeCmsContent(content, new Map());
    expect(content).toEqual(before);
  });
});

// ── 3. materialization + the silent-vanish pin ──────────────────────────────

describe('materializeCmsContent — placement → model', () => {
  it('writes the model under CMS_MODEL_ELEMENT_KEY and preserves placement', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    const section = content.content[CMS_SID];

    expect(section.elements.collectionId).toBe('col1');
    expect(section.elements[CMS_MODEL_ELEMENT_KEY]).toEqual(toRenderModel(bundle()));
    // and the section's own props survived the rewrite
    expect(section.backgroundType).toBe('neutral');
    expect(section.id).toBe(CMS_SID);
  });

  it('PRESERVES a non-empty content[sid].layout for every cms section (silent-vanish pin)', () => {
    const content = payload({ cmsRoot: true, cmsSub: true });
    materializeCmsContent(content, bundleMap(bundle()));
    for (const sid of [CMS_SID]) {
      expect(typeof content.content[sid].layout).toBe('string');
      expect(content.content[sid].layout.length).toBeGreaterThan(0);
    }
    const sub = content.subpages['/about'].content[CMS_SID_SUB];
    expect(typeof sub.layout).toBe('string');
    expect(sub.layout.length).toBeGreaterThan(0);
  });

  it('supplies the default layout when a placement arrived without one', () => {
    const content = payload();
    delete content.content[CMS_SID].layout;
    materializeCmsContent(content, bundleMap(bundle()));
    expect(content.content[CMS_SID].layout).toBe(CMS_COLLECTION_LAYOUT);
  });

  it('materializes a cms section placed on a SUBPAGE', () => {
    const content = payload({ cmsRoot: false, cmsSub: true });
    materializeCmsContent(content, bundleMap(bundle()));
    const sub = content.subpages['/about'].content[CMS_SID_SUB];
    expect(sub.elements[CMS_MODEL_ELEMENT_KEY]).toEqual(toRenderModel(bundle()));
  });

  it('unknown collectionId → empty section, placement kept, publish NOT failed', () => {
    const content = payload({ collectionId: 'deleted-col' });
    expect(() => materializeCmsContent(content, bundleMap(bundle()))).not.toThrow();
    const section = content.content[CMS_SID];
    expect(section.elements.collectionId).toBe('deleted-col');
    expect(section.elements[CMS_MODEL_ELEMENT_KEY]).toBeUndefined();
    expect(section.layout).toBe(CMS_COLLECTION_LAYOUT); // still renders (empty), not dropped
  });

  it('a client-sent cmsModel is OVERWRITTEN by the server model (server authority)', () => {
    const content = payload();
    content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY] = {
      collectionRef: 'forged',
      groups: [{ groupId: null, name: null, items: [{ itemId: 'x', itemRef: 'x', fields: [] }] }],
    };
    materializeCmsContent(content, bundleMap(bundle()));
    expect(content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY]).toEqual(
      toRenderModel(bundle())
    );
  });
});

// ── 4. coercion-proof: byte-identical sanitize round-trip ───────────────────

describe('coercion-proof materialized shape', () => {
  it('round-trips through BOTH publish chokepoints BYTE-IDENTICAL', () => {
    const content = payload({ cmsRoot: true, cmsSub: true });
    materializeCmsContent(content, bundleMap(bundle()));
    const beforeSanitize = clone(content);

    runPublishSanitizers(content);

    // The whole cms section — placement elements AND the full data payload.
    expect(content.content[CMS_SID]).toEqual(beforeSanitize.content[CMS_SID]);
    expect(content.subpages['/about'].content[CMS_SID_SUB]).toEqual(
      beforeSanitize.subpages['/about'].content[CMS_SID_SUB]
    );
    // Guard against vacuity: the payload must actually be non-trivial.
    const model = content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY];
    expect(model.groups.length).toBeGreaterThan(0);
    expect(model.groups[0].items[0].fields.length).toBeGreaterThan(2);
    // Named, non-'#' assertions on exactly the values the url-key walker corrupts.
    // These are FIELD IDS and a collection slug, not URLs: '#' here = the bug.
    expect(model.roles.primaryCta).toBe('buy');
    expect(model.collectionRef).toBe('books');
    expect(model.groups[0].items[0].itemRef).toBe('deep-work');
  });

  it('the SECOND chokepoint does not scheme-gate any model key to "#"', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    runPublishSanitizers(content);
    const model = content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY];
    const hashed = allEntries(model).filter(([, v]) => v === '#');
    expect(hashed).toEqual([]);
  });

  it('META-GUARD: no model key ends in href/url/link/slug except sanctioned `url` values', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    const model = content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY];

    const entries = allEntries(model);
    expect(entries.length).toBeGreaterThan(20); // anti-vacuity
    const offenders = entries
      .filter(([k]) => isUrlContentKey(k))
      // `url` inside an image/gallery/video/audio/link VALUE is a genuine URL —
      // scheme-gating it is correct and desirable. Everything else is a bug.
      .filter(([k]) => k !== 'url')
      .map(([k]) => k);
    expect(offenders).toEqual([]);
    // …and the sanctioned exception really is present (this guard isn't vacuous).
    expect(entries.some(([k]) => k === 'url')).toBe(true);
  });

  it('carries NO numeric key anywhere (coercion rule 2: ANY numeric key collapses the object)', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    const model = content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY];
    const keys = allKeys(model);
    expect(keys.length).toBeGreaterThan(10); // anti-vacuity
    expect(keys.some((k) => /^\d+$/.test(k))).toBe(false);
  });

  it('carries no object with BOTH a string `content` and a string `type` key (rule 1)', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    const model = content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY];
    const walk = (v: any): boolean => {
      if (!v || typeof v !== 'object') return false;
      if (Array.isArray(v)) return v.some(walk);
      if (typeof v.content === 'string' && typeof v.type === 'string') return true;
      return Object.values(v).some(walk);
    };
    expect(walk(model)).toBe(false);
  });
});

// ── 5. XSS: hostile nested URLs never reach the snapshot ────────────────────

describe('nested URL sanitization survives materialization', () => {
  it('drops javascript: URLs from gallery + link values', () => {
    const content = payload({ collectionId: 'colX' });
    materializeCmsContent(content, bundleMap(hostileBundle()));
    const json = JSON.stringify(content);
    expect(json).not.toContain('javascript:');
    // …and the safe sibling in the same gallery survived (proves it isn't blanket-dropping)
    expect(json).toContain('https://cdn.test/ok.png');
  });
});

// ── 6. PARITY through the REAL published renderer ───────────────────────────
//
// The published half MUST go through LandingPagePublishedRenderer: it is the only
// place that rebuilds layouts from `content[sid].layout` and silently drops a
// section without one. Rendering the registry component directly would bypass
// exactly the failure this gate exists to catch.

const COMPARED_ATTRS = ['class', 'style', 'src', 'alt', 'href'];

function skeleton(node: Element): string {
  const parts: string[] = [];
  const walk = (el: Element, depth: number) => {
    const attrBits = COMPARED_ATTRS.map((n) => `${n}=${el.getAttribute(n) ?? ''}`).join('|');
    const dataBits = Array.from(el.attributes)
      .filter((a) => a.name.startsWith('data-cms'))
      .map((a) => `${a.name}=${a.value}`)
      .sort()
      .join(',');
    parts.push(`${'  '.repeat(depth)}${el.tagName.toLowerCase()}[${attrBits}]{${dataBits}}`);
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) {
        const t = (child.textContent || '').trim();
        if (t) parts.push(`${'  '.repeat(depth + 1)}#text:${t}`);
      } else if (child.nodeType === 1) {
        walk(child as Element, depth + 1);
      }
    }
  };
  walk(node, 0);
  return parts.join('\n');
}

function dom(node: React.ReactElement): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}

function cmsBodyOf(container: HTMLElement): Element {
  const body = container.querySelector('[data-cms-body]');
  if (!body) throw new Error('the cms section did not render at all (silent vanish?)');
  return body;
}

describe('materialized snapshot ↔ editor parity (through the real published renderer)', () => {
  const renderPublished = (content: Record<string, any>) =>
    dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: content.layout.sections,
        content: content.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );

  it('publishes the SAME body skeleton the editor renders from the same tables', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    // Render what publish ACTUALLY emits: post-BOTH-chokepoints. Rendering the
    // raw materialized snapshot skips `sanitizeContentHtml` — the exact blind
    // spot that let a '#'-corrupted role ship with this gate green.
    runPublishSanitizers(content);

    const published = renderPublished(content);
    // Edit path: the SAME toRenderModel output the materializer used, through the
    // edit twin (store-free injected-model path).
    const edit = dom(
      React.createElement(CollectionSection, { sectionId: CMS_SID, model: toRenderModel(bundle()) })
    );

    const publishedSkeleton = skeleton(cmsBodyOf(published));
    expect(publishedSkeleton).toBe(skeleton(cmsBodyOf(edit)));
    // Anti-vacuity: real content, not an empty block.
    expect(publishedSkeleton).toContain('#text:Deep Work');
    expect(publishedSkeleton.split('\n').length).toBeGreaterThan(20);
    // The CTA slot is POPULATED on the published page. A '#'-corrupted
    // `roles.primaryCta` makes fieldById() return null, silently emptying it
    // while the editor still renders it — the published-only regression.
    expect(publishedSkeleton).toContain('lg-cms__cta');
    expect(publishedSkeleton).toContain('mailto:hi@acme.com');
  });

  it('a cms section stripped of its layout DOES vanish from the published render (the gate bites)', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle()));
    delete content.content[CMS_SID].layout; // simulate the half-pin bug
    const published = renderPublished(content);
    expect(published.querySelector('[data-cms-body]')).toBeNull();
  });

  it('an unknown collectionId publishes an EMPTY block, not a broken/absent one', () => {
    const content = payload({ collectionId: 'deleted-col' });
    materializeCmsContent(content, bundleMap(bundle()));
    const published = renderPublished(content);
    expect(cmsBodyOf(published).textContent).toContain('No items yet');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PHASE 4 — detail pages + slugs
// ════════════════════════════════════════════════════════════════════════════
//
// What these defend, and against which failure:
//
//  A. PATH CONVENTION — subpage KEY *and* card HREF are leading-slash absolute
//     `/<collectionRef>/<itemRef>`. Slash-less breaks KV route derivation and the
//     publish route's locale collision guard, and fails `isSafeURL` → '#'.
//  B. DUAL PIN ON SUBPAGES — every id in a fan-out subpage's `layout.sections`
//     must have `content[sid].layout` non-empty, or the published renderer's
//     silent `return null` drops the section and the page publishes BLANK.
//  C. AUTHORITY — only structurally-cms subpages are written or pruned; a
//     computed path landing on a real page FAILS LOUD (publish itself has no
//     collision detection, `usePublishFlow.ts:177`).
//  D. SANITIZE — detail subpages round-trip BOTH chokepoints byte-identical, and
//     the key-name meta-guard covers the DETAIL model too.
//  E. PARITY — the materialized subpage renders through the REAL
//     `LandingPagePublishedRenderer` (never the registry component directly).

/** Same collection as `bundle()`, with detail pages ON. */
function detailBundle(id = 'col1'): CmsCollectionBundle {
  const b = bundle(id);
  b.collection.detailPages = true;
  return b;
}

const PATH_1 = '/books/deep-work';
const PATH_2 = '/books/loose';

/** A genuine, user-authored (NON-cms) subpage entry. */
const realPage = (headline: string) => ({
  title: 'Real page',
  layout: { sections: ['hero-real0001'] },
  content: {
    'hero-real0001': { id: 'hero-real0001', layout: 'leftCopyRightImage', elements: { headline } },
  },
});

describe('detail fan-out — path convention + entry shape', () => {
  it('keys every subpage by the LEADING-SLASH absolute path', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));

    const keys = Object.keys(content.subpages).filter((k) => k !== '/about');
    expect(keys.sort()).toEqual([PATH_1, PATH_2].sort());
    // …explicitly: every cms key starts with '/', never slash-less, never /p/…
    for (const k of keys) {
      expect(k.startsWith('/')).toBe(true);
      expect(k.startsWith('/p/')).toBe(false);
    }
    expect(cmsDetailPath('books', 'deep-work')).toBe(PATH_1);
  });

  it('emits the PINNED entry shape {layout:{sections},content,title} — no theme, no seo', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const entry = content.subpages[PATH_1];

    expect(Object.keys(entry).sort()).toEqual(['content', 'layout', 'title']);
    expect(Array.isArray(entry.layout.sections)).toBe(true);
    expect(entry.layout.sections.length).toBe(1);
    // theme is OPTIONAL and deliberately absent — the ROOT theme cascades
    // (renderPublishedExport.ts:262-278). Emitting one would freeze a stale theme.
    expect(entry.layout.theme).toBeUndefined();
    expect(entry.seo).toBeUndefined();
    expect(entry.title).toBe('Deep Work'); // title-role value
  });

  it('DUAL PIN: every subpage section has a non-empty content[sid].layout', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));

    for (const path of [PATH_1, PATH_2]) {
      const entry = content.subpages[path];
      expect(entry.layout.sections.length).toBeGreaterThan(0);
      for (const sid of entry.layout.sections) {
        const section = entry.content[sid];
        expect(section).toBeTruthy();
        expect(typeof section.layout).toBe('string');
        expect(section.layout.length).toBeGreaterThan(0);
        expect(section.layout).toBe(CMS_COLLECTION_ITEM_LAYOUT);
        expect(section.id).toBe(sid);
        expect(section.elements[CMS_DETAIL_ELEMENT_KEY]).toBeTruthy();
      }
    }
  });

  it('detail section ids carry the cmscollectionitem prefix (and are NOT cms collection ids)', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const sid = content.subpages[PATH_1].layout.sections[0];
    expect(isCmsItemSectionId(sid)).toBe(true);
    // …so the phase-3 listing walk can never pick them up.
    expect(isCmsSectionId(sid)).toBe(false);
    expect(findCmsSections(content).map((f) => f.sectionId)).not.toContain(sid);
  });

  it('the listing CARD links to the same leading-slash path (href convention)', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(detailBundle()));
    runPublishSanitizers(content);
    const published = dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: content.layout.sections,
        content: content.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );
    const hrefs = Array.from(published.querySelectorAll('a.lg-cms__titlelink')).map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs).toContain(PATH_1);
    expect(hrefs).toContain(PATH_2);
    // The '#'-coercion regression: a slash-less href would be rewritten by
    // sanitizePublishedUrl. Assert none survived as '#'.
    expect(hrefs).not.toContain('#');
  });

  it('detailPages OFF → the listing card carries NO detail link', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(bundle())); // detailPages: false
    const published = dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: content.layout.sections,
        content: content.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );
    expect(published.querySelector('a.lg-cms__titlelink')).toBeNull();
  });

  // HONESTY NOTE: this does NOT guard `slugLocked`. Nothing in the phase-4 path
  // READS that flag — `materializePublish.ts` only copies it into the bundle, and
  // `buildDetailSubpages` derives the path from `item.itemRef` alone. Setting
  // `slugLocked` here would change nothing, so it is deliberately NOT set: the
  // test would sit green with or without it (an inert assertion). `slugLocked` is
  // an UNGUARDED PIN until the phase-7 item editor gives it a reader; whoever
  // adds that reader owns writing its first real test.
  // What IS guarded below: the stored item slug is used VERBATIM in the subpage
  // path — never re-derived from the title or any other field.
  it('uses the stored item slug VERBATIM in the subpage path (never re-derived)', () => {
    const b = detailBundle();
    b.items[0].slug = 'my-custom-path';
    const content = payload();
    applyCmsDetailPages(content, bundleMap(b));
    expect(content.subpages['/books/my-custom-path']).toBeTruthy();
    expect(content.subpages[PATH_1]).toBeUndefined();
  });
});

describe('detail fan-out — authority scoping', () => {
  it('leaves NON-cms subpages byte-identical', () => {
    const content = payload();
    content.subpages['/contact'] = realPage('Contact us');
    const before = clone(content.subpages);

    applyCmsDetailPages(content, bundleMap(detailBundle()));

    expect(content.subpages['/about']).toEqual(before['/about']);
    expect(content.subpages['/contact']).toEqual(before['/contact']);
  });

  it('OVERWRITES a stale client-sent copy of a cms path (server authority)', () => {
    const content = payload();
    const sid = `cmscollectionitem-i1`;
    // A structurally-cms subpage carrying forged content.
    content.subpages[PATH_1] = {
      title: 'FORGED',
      layout: { sections: [sid] },
      content: {
        [sid]: { id: sid, layout: CMS_COLLECTION_ITEM_LAYOUT, elements: { cmsItem: { hacked: true } } },
      },
    };
    applyCmsDetailPages(content, bundleMap(detailBundle()));

    expect(content.subpages[PATH_1].title).toBe('Deep Work');
    const written = content.subpages[PATH_1].content[sid].elements[CMS_DETAIL_ELEMENT_KEY];
    expect((written as any).hacked).toBeUndefined();
    expect(written.item.itemRef).toBe('deep-work');
  });

  it('FAILS LOUD when a computed path collides with a real (non-cms) page', () => {
    const content = payload();
    content.subpages[PATH_1] = realPage('A page the user made');
    expect(() => applyCmsDetailPages(content, bundleMap(detailBundle()))).toThrow(
      CmsPathCollisionError
    );
  });

  it('a failed collision guard mutates NOTHING (no half-written fan-out)', () => {
    const content = payload();
    content.subpages[PATH_1] = realPage('A page the user made');
    const before = clone(content);
    expect(() => applyCmsDetailPages(content, bundleMap(detailBundle()))).toThrow();
    expect(content).toEqual(before);
  });

  it('toggle OFF → the cms subpages are REMOVED, non-cms untouched', () => {
    const content = payload();
    content.subpages['/contact'] = realPage('Contact us');
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    expect(content.subpages[PATH_1]).toBeTruthy();

    // Same collection, detailPages now off.
    const off = applyCmsDetailPages(content, bundleMap(bundle()));
    expect(off.written).toBe(0);
    expect(off.removed).toBe(2);
    expect(content.subpages[PATH_1]).toBeUndefined();
    expect(content.subpages[PATH_2]).toBeUndefined();
    expect(content.subpages['/about']).toBeTruthy();
    expect(content.subpages['/contact']).toBeTruthy();
  });

  it('an ORPHANED cms subpage (collection unplaced entirely) is pruned', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const { removed } = applyCmsDetailPages(content, new Map());
    expect(removed).toBe(2);
    expect(Object.keys(content.subpages)).toEqual(['/about']);
  });

  it('a deleted item loses its page; the surviving item keeps its own', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const b = detailBundle();
    b.items = b.items.filter((i) => i.id !== 'i1');
    applyCmsDetailPages(content, bundleMap(b));
    expect(content.subpages[PATH_1]).toBeUndefined();
    expect(content.subpages[PATH_2]).toBeTruthy();
  });

  it('isCmsDetailSubpage only accepts an all-cmscollectionitem section list', () => {
    expect(isCmsDetailSubpage({ layout: { sections: ['cmscollectionitem-a'] } })).toBe(true);
    expect(isCmsDetailSubpage({ layout: { sections: ['hero-a'] } })).toBe(false);
    expect(isCmsDetailSubpage({ layout: { sections: ['cmscollectionitem-a', 'hero-a'] } })).toBe(
      false
    );
    expect(isCmsDetailSubpage({ layout: { sections: [] } })).toBe(false);
    expect(isCmsDetailSubpage({})).toBe(false);
    // a cms LISTING section is not a detail page
    expect(isCmsDetailSubpage({ layout: { sections: ['cmscollection-a'] } })).toBe(false);
  });

  it('creates content.subpages when the payload had none, and no-ops when there is nothing to do', () => {
    const withNone: Record<string, any> = { layout: { sections: [] }, content: {} };
    applyCmsDetailPages(withNone, bundleMap(detailBundle()));
    expect(Object.keys(withNone.subpages).sort()).toEqual([PATH_1, PATH_2].sort());

    const empty: Record<string, any> = { layout: { sections: [] }, content: {} };
    applyCmsDetailPages(empty, new Map());
    expect(empty.subpages).toBeUndefined();
  });
});

describe('detail fan-out — coercion + url-key proof', () => {
  it('detail subpages round-trip BOTH publish chokepoints BYTE-IDENTICAL', () => {
    const content = payload();
    materializeCmsContent(content, bundleMap(detailBundle()));
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const before = clone(content);

    runPublishSanitizers(content);

    expect(content.subpages[PATH_1]).toEqual(before.subpages[PATH_1]);
    expect(content.subpages[PATH_2]).toEqual(before.subpages[PATH_2]);

    // Anti-vacuity + the exact values the url-key walker corrupts.
    const sid = content.subpages[PATH_1].layout.sections[0];
    const detail = content.subpages[PATH_1].content[sid].elements[CMS_DETAIL_ELEMENT_KEY];
    expect(detail.item.fields.length).toBeGreaterThan(2);
    expect(detail.item.itemRef).toBe('deep-work');
    expect(detail.collectionRef).toBe('books');
    expect(detail.roles.primaryCta).toBe('buy');
  });

  it('the SECOND chokepoint scheme-gates nothing in the detail model to "#"', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    runPublishSanitizers(content);
    const sid = content.subpages[PATH_1].layout.sections[0];
    const detail = content.subpages[PATH_1].content[sid].elements[CMS_DETAIL_ELEMENT_KEY];
    expect(allEntries(detail).filter(([, v]) => v === '#')).toEqual([]);
  });

  // ⚠️ PHASE-4 FINDING — the naming law is no longer "depth luck" here.
  // Empirically probed: `sanitizeContentHtml` recurses THREE levels into a
  // subpage section's `elements`, i.e. it REACHES `elements.cmsItem.item.<key>`
  // (it stops one level short, inside `item.fields[]`). In the LISTING model the
  // item keys sat below the walker; on a DETAIL page they sit right in it. So
  // `collectionRef` / `itemRef` are actively saved by their names, and a rename
  // to `collectionSlug` / `slug` would '#'-corrupt the published item page while
  // the editor kept rendering it. This test proves the corruption is real at
  // exactly that depth, so the guard above cannot be dismissed as theoretical.
  it('a url-SUFFIXED key at the detail model\'s depth IS corrupted (the naming law bites)', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const sid = content.subpages[PATH_1].layout.sections[0];
    const detail = content.subpages[PATH_1].content[sid].elements[CMS_DETAIL_ELEMENT_KEY];

    // simulate the forbidden rename, at the real depths the model uses
    detail.collectionSlug = detail.collectionRef; // depth 2
    detail.item.slug = detail.item.itemRef;       // depth 3

    runPublishSanitizers(content);

    expect(detail.collectionSlug).toBe('#');
    expect(detail.item.slug).toBe('#');
    // …while the correctly-named keys are untouched.
    expect(detail.collectionRef).toBe('books');
    expect(detail.item.itemRef).toBe('deep-work');
  });

  it('META-GUARD: no DETAIL-model key ends in href/url/link/slug except sanctioned `url`', () => {
    const model = toRenderModel(detailBundle());
    const detail = toDetailModel(model, allRenderItems(model)[0]);

    const entries = allEntries(detail);
    expect(entries.length).toBeGreaterThan(20); // anti-vacuity
    const offenders = entries
      .filter(([k]) => isUrlContentKey(k))
      .filter(([k]) => k !== 'url')
      .map(([k]) => k);
    expect(offenders).toEqual([]);
    expect(entries.some(([k]) => k === 'url')).toBe(true);
  });

  it('the detail model carries NO numeric key anywhere (coercion rule 2)', () => {
    const model = toRenderModel(detailBundle());
    const detail = toDetailModel(model, allRenderItems(model)[0]);
    const keys = allKeys(detail);
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.some((k) => /^\d+$/.test(k))).toBe(false);
  });

  it('drops javascript: URLs from a detail page too', () => {
    const hostile = hostileBundle();
    hostile.collection.detailPages = true;
    const content = payload({ collectionId: 'colX' });
    applyCmsDetailPages(content, bundleMap(hostile));
    const json = JSON.stringify(content.subpages);
    expect(json).not.toContain('javascript:');
    expect(json).toContain('https://cdn.test/ok.png');
  });
});

// ── detail PARITY through the REAL published renderer ───────────────────────
//
// Same rule as the listing gate: the published half MUST go through
// LandingPagePublishedRenderer, the only place that rebuilds layouts from
// `content[sid].layout` and silently drops a section without one. A direct
// registry render would sit GREEN while publish emitted a blank page.

describe('detail page ↔ editor parity (through the real published renderer)', () => {
  function publishedDetail(content: Record<string, any>, path: string) {
    const entry = content.subpages[path];
    return dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: entry.layout.sections,
        content: entry.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );
  }

  const detailBodyOf = (c: HTMLElement) => {
    const body = c.querySelector('[data-cms-detail-body]');
    if (!body) throw new Error('the detail section did not render at all (silent vanish?)');
    return body;
  };

  it('publishes the SAME detail body skeleton the editor renders from the same tables', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    // Render what publish ACTUALLY emits: post-BOTH-chokepoints.
    runPublishSanitizers(content);

    const model = toRenderModel(detailBundle());
    const item = allRenderItems(model).find((i) => i.itemRef === 'deep-work')!;
    const edit = dom(
      React.createElement(CollectionDetail, {
        sectionId: `cmscollectionitem-${item.itemId}`,
        model: toDetailModel(model, item),
      })
    );

    const publishedSkeleton = skeleton(detailBodyOf(publishedDetail(content, PATH_1)));
    expect(publishedSkeleton).toBe(skeleton(detailBodyOf(edit)));
    // Anti-vacuity: real content, and the CTA slot POPULATED on published.
    expect(publishedSkeleton).toContain('#text:Deep Work');
    expect(publishedSkeleton.split('\n').length).toBeGreaterThan(20);
    expect(publishedSkeleton).toContain('lg-cms__cta');
    expect(publishedSkeleton).toContain('mailto:hi@acme.com');
  });

  it('a detail section stripped of its layout DOES vanish from the published render (the gate bites)', () => {
    const content = payload();
    applyCmsDetailPages(content, bundleMap(detailBundle()));
    const entry = content.subpages[PATH_1];
    delete entry.content[entry.layout.sections[0]].layout; // simulate the half-pin bug
    expect(publishedDetail(content, PATH_1).querySelector('[data-cms-detail-body]')).toBeNull();
  });

  it('a detail page with no materialized model renders empty, not broken', () => {
    const sid = 'cmscollectionitem-ghost';
    const entry = {
      layout: { sections: [sid] },
      content: { [sid]: { id: sid, layout: CMS_COLLECTION_ITEM_LAYOUT, elements: {} } },
      title: 'Ghost',
    };
    const rendered = dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: entry.layout.sections,
        content: entry.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );
    expect(detailBodyOf(rendered).textContent).toContain('Nothing here yet');
  });
});

// ── write-time shadow guards (the other half of the collision story) ────────

describe('reserved page-path helpers (route write-time guards)', () => {
  const projectContent = {
    pages: {
      home: { id: 'home', pathSlug: '/', title: 'Home' },
      p1: { id: 'p1', pathSlug: '/products', title: 'Products' },
      p2: { id: 'p2', pathSlug: '/products/nwc-1000', title: 'NWC 1000' },
      p3: { id: 'p3', pathSlug: 'contact', title: 'Contact' }, // slash-less in store
    },
  };

  it('normalizes every page path to leading-slash absolute', () => {
    expect([...reservedPagePaths(projectContent)].sort()).toEqual(
      ['/', '/contact', '/products', '/products/nwc-1000'].sort()
    );
    expect(reservedPagePaths(null).size).toBe(0);
    expect(reservedPagePaths({}).size).toBe(0);
  });

  it('a collection slug that shadows a page (or its subtree) is rejected', () => {
    const reserved = reservedPagePaths(projectContent);
    expect(collectionSlugShadowsPage('products', reserved)).toBe(true); // naayom!
    expect(collectionSlugShadowsPage('contact', reserved)).toBe(true);
    expect(collectionSlugShadowsPage('books', reserved)).toBe(false);
    expect(collectionSlugShadowsPage('', reserved)).toBe(false);
  });

  it('an item slug is rejected only when its exact detail path already exists', () => {
    const reserved = reservedPagePaths(projectContent);
    expect(itemSlugShadowsPage('products', 'nwc-1000', reserved)).toBe(true);
    expect(itemSlugShadowsPage('products', 'nwc-2000', reserved)).toBe(false);
    expect(itemSlugShadowsPage('books', 'deep-work', reserved)).toBe(false);
  });
});

describe('buildDetailSubpages', () => {
  it('produces nothing for a detailPages-off collection', () => {
    expect(buildDetailSubpages(bundleMap(bundle())).size).toBe(0);
  });

  it('produces one entry per item for a detailPages-on collection', () => {
    expect([...buildDetailSubpages(bundleMap(detailBundle())).keys()].sort()).toEqual(
      [PATH_1, PATH_2].sort()
    );
  });

  it('skips an item with no slug (no page, rather than a "/books/" path)', () => {
    const b = detailBundle();
    b.items[0].slug = '';
    expect([...buildDetailSubpages(bundleMap(b)).keys()]).toEqual([PATH_2]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PHASE 8B — the LISTING page (`/<collectionRef>`, per-collection toggle)
// ════════════════════════════════════════════════════════════════════════════
//
// This mirrors the phase-4 detail set ASSERTION FOR ASSERTION, because it is the
// same publish path with the same five ways to fail silently:
//
//  A. PATH CONVENTION — the subpage KEY is leading-slash absolute `/<ref>`.
//     Slash-less breaks KV route derivation and the locale collision guard.
//  B. DUAL PIN — every id in `layout.sections` must have a non-empty
//     `content[sid].layout`, or `LandingPagePublishedRenderer` silently
//     `return null`s it and the page publishes BLANK.
//  C. AUTHORITY — only listing pages WE authored are written or pruned. Unlike
//     detail pages this is NOT purely structural: a user can put a
//     `cmscollection` block on their own subpage, so ownership is proven by the
//     `cmscollection-listing-*` marker, not by the type prefix.
//  D. SANITIZE — round-trips BOTH chokepoints byte-identical.
//  E. PARITY — rendered through the REAL published renderer, never the registry
//     component (which bypasses exactly the failure B describes).

/** Same collection as `bundle()`, with the LISTING page on. */
function listingBundle(id = 'col1'): CmsCollectionBundle {
  const b = bundle(id);
  b.collection.listingPage = true;
  return b;
}

const LISTING_PATH = '/books';

describe('listing page — path convention + entry shape', () => {
  it('keys the subpage by the LEADING-SLASH absolute path', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));

    const keys = Object.keys(content.subpages).filter((k) => k !== '/about');
    expect(keys).toEqual([LISTING_PATH]);
    expect(keys[0].startsWith('/')).toBe(true);
    expect(keys[0].startsWith('/p/')).toBe(false);
    expect(cmsListingPath('books')).toBe(LISTING_PATH);
  });

  it('matches the pinned subpage shape {layout:{sections}, content, title}', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const sub = content.subpages[LISTING_PATH];

    expect(Object.keys(sub).sort()).toEqual(['content', 'layout', 'title']);
    expect(Array.isArray(sub.layout.sections)).toBe(true);
    expect(sub.layout.sections).toHaveLength(1);
    // `theme` is deliberately ABSENT — the root theme cascades.
    expect(sub.layout.theme).toBeUndefined();
    expect(sub.title).toBe('Books');
  });

  it('DUAL PIN: every id in layout.sections has a non-empty content[sid].layout', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const sub = content.subpages[LISTING_PATH];

    for (const sid of sub.layout.sections) {
      const entry = sub.content[sid];
      expect(entry, sid).toBeTruthy();
      expect(typeof entry.layout).toBe('string');
      expect(entry.layout.length).toBeGreaterThan(0);
      expect(entry.layout).toBe(CMS_COLLECTION_LAYOUT);
      expect(entry.id).toBe(sid);
    }
  });

  it('carries the SAME model the placed block gets (one feed, not a second)', () => {
    const content = payload();
    const b = listingBundle();
    applyCmsListingPages(content, bundleMap(b));
    const sub = content.subpages[LISTING_PATH];
    const sid = sub.layout.sections[0];

    expect(sub.content[sid].elements[CMS_MODEL_ELEMENT_KEY]).toEqual(toRenderModel(b));
    expect(sub.content[sid].elements.collectionId).toBe('col1');
  });

  it('emits NOTHING when the toggle is off, and nothing for a slug-less collection', () => {
    const off = payload();
    applyCmsListingPages(off, bundleMap(bundle()));
    expect(Object.keys(off.subpages)).toEqual(['/about']);

    const b = listingBundle();
    b.collection.slug = '';
    const noSlug = payload();
    applyCmsListingPages(noSlug, bundleMap(b));
    expect(Object.keys(noSlug.subpages)).toEqual(['/about']);
  });
});

describe('listing page — authority scoping + pruning', () => {
  it('leaves non-cms subpages byte-identical', () => {
    const content = payload();
    const before = clone(content);
    applyCmsListingPages(content, bundleMap(listingBundle()));

    expect(content.subpages['/about']).toEqual(before.subpages['/about']);
    expect(content.content).toEqual(before.content);
    expect(content.layout).toEqual(before.layout);
  });

  it('TOGGLE OFF prunes the listing page it previously wrote', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    expect(content.subpages[LISTING_PATH]).toBeTruthy();

    const off = applyCmsListingPages(content, bundleMap(bundle()));
    expect(content.subpages[LISTING_PATH]).toBeUndefined();
    expect(off.removed).toBe(1);
    // …and it took nothing else with it.
    expect(Object.keys(content.subpages)).toEqual(['/about']);
  });

  it('never prunes a USER subpage that merely CONTAINS a placed collection block', () => {
    // THE trap that detail pages do not have: a user can "Add to page" a
    // cmscollection block onto their own subpage. A type-prefix ownership test
    // would claim `/shop` as ours and DELETE it the moment the toggle goes off.
    const content = payload();
    content.subpages['/shop'] = {
      title: 'Shop',
      layout: { sections: [CMS_SID_SUB] },
      content: {
        [CMS_SID_SUB]: {
          id: CMS_SID_SUB,
          layout: CMS_COLLECTION_LAYOUT,
          elements: { collectionId: 'col1' },
        },
      },
    };
    const before = clone(content.subpages['/shop']);

    applyCmsListingPages(content, bundleMap(bundle())); // toggle OFF ⇒ prune pass
    expect(content.subpages['/shop']).toEqual(before);
    expect(isCmsListingSubpage(content.subpages['/shop'])).toBe(false);
  });

  it('overwrites a stale CLIENT-SENT copy of the listing path (server authority)', () => {
    const content = payload();
    const sid = cmsListingSectionId('col1');
    content.subpages[LISTING_PATH] = {
      title: 'stale',
      layout: { sections: [sid] },
      content: {
        [sid]: {
          id: sid,
          layout: CMS_COLLECTION_LAYOUT,
          elements: { collectionId: 'col1', [CMS_MODEL_ELEMENT_KEY]: { hacked: true } },
        },
      },
    };
    applyCmsListingPages(content, bundleMap(listingBundle()));

    expect(content.subpages[LISTING_PATH].title).toBe('Books');
    expect(content.subpages[LISTING_PATH].content[sid].elements[CMS_MODEL_ELEMENT_KEY]).toEqual(
      toRenderModel(listingBundle())
    );
  });

  it('a listing path landing on a REAL page FAILS LOUD, before any mutation', () => {
    const content = payload();
    content.subpages[LISTING_PATH] = realPage('Our books');
    const before = clone(content);

    expect(() => applyCmsListingPages(content, bundleMap(listingBundle()))).toThrow(
      CmsPathCollisionError
    );
    // The narrow instanceof catch in api/publish maps THIS class to a 409; the
    // payload must be untouched so a failed publish changes nothing.
    expect(content).toEqual(before);
  });

  it('the collision message names the colliding path (the user has to act on it)', () => {
    const content = payload();
    content.subpages[LISTING_PATH] = realPage('Our books');
    try {
      applyCmsListingPages(content, bundleMap(listingBundle()));
      throw new Error('expected a collision');
    } catch (e) {
      expect(e).toBeInstanceOf(CmsPathCollisionError);
      expect((e as Error).message).toContain(LISTING_PATH);
    }
  });

  it('assertNoCmsPathCollisions catches a LISTING collision before detail pages are written', () => {
    // Without the pre-pass, applyCmsDetailPages would already have mutated
    // `content` by the time the listing guard threw.
    const b = listingBundle();
    b.collection.detailPages = true;
    const content = payload();
    content.subpages[LISTING_PATH] = realPage('Our books');
    const before = clone(content);

    expect(() => assertNoCmsPathCollisions(content, bundleMap(b))).toThrow(CmsPathCollisionError);
    expect(content).toEqual(before);
  });
});

describe('listing page — coercion + url-key proof', () => {
  it('round-trips through BOTH publish chokepoints BYTE-IDENTICAL', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const beforeSanitize = clone(content);

    runPublishSanitizers(content);

    expect(content.subpages[LISTING_PATH]).toEqual(beforeSanitize.subpages[LISTING_PATH]);

    const sid = content.subpages[LISTING_PATH].layout.sections[0];
    const model = content.subpages[LISTING_PATH].content[sid].elements[CMS_MODEL_ELEMENT_KEY];
    // anti-vacuity + the exact values the url-key walker corrupts
    expect(model.groups.length).toBeGreaterThan(0);
    expect(model.roles.primaryCta).toBe('buy');
    expect(model.collectionRef).toBe('books');
  });

  it('the SECOND chokepoint scheme-gates nothing on the listing page to "#"', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    runPublishSanitizers(content);
    const sub = content.subpages[LISTING_PATH];
    expect(allEntries(sub).filter(([, v]) => v === '#')).toEqual([]);
  });

  it('META-GUARD: nothing added by the listing page ends in href/url/link/slug', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const entries = allEntries(content.subpages[LISTING_PATH]);
    expect(entries.length).toBeGreaterThan(20); // anti-vacuity
    const offenders = entries.filter(([k]) => isUrlContentKey(k)).filter(([k]) => k !== 'url');
    expect(offenders).toEqual([]);
    expect(entries.some(([k]) => k === 'url')).toBe(true);
  });

  it('carries NO numeric key anywhere (coercion rule 2)', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const keys = allKeys(content.subpages[LISTING_PATH]);
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.some((k) => /^\d+$/.test(k))).toBe(false);
  });
});

describe('listing page ↔ editor parity (through the real published renderer)', () => {
  const renderListing = (content: Record<string, any>) => {
    const sub = content.subpages[LISTING_PATH];
    return dom(
      React.createElement(LandingPagePublishedRenderer, {
        sections: sub.layout.sections,
        content: sub.content,
        theme: { colors: { sectionBackgrounds: {} } },
      })
    );
  };

  it('publishes the SAME body skeleton the editor renders from the same tables', () => {
    const content = payload();
    const b = listingBundle();
    applyCmsListingPages(content, bundleMap(b));
    runPublishSanitizers(content);

    const published = renderListing(content);
    const sid = content.subpages[LISTING_PATH].layout.sections[0];
    const edit = dom(
      React.createElement(CollectionSection, { sectionId: sid, model: toRenderModel(b) })
    );

    const publishedSkeleton = skeleton(cmsBodyOf(published));
    expect(publishedSkeleton).toBe(skeleton(cmsBodyOf(edit)));
    // anti-vacuity: real content, real CTA, and the 10th type actually rendered
    expect(publishedSkeleton).toContain('#text:Deep Work');
    expect(publishedSkeleton).toContain('lg-cms__cta');
    expect(publishedSkeleton).toContain('#text:4.2 kg');
    expect(publishedSkeleton.split('\n').length).toBeGreaterThan(20);
  });

  it('a listing section stripped of its layout DOES vanish (the gate bites)', () => {
    const content = payload();
    applyCmsListingPages(content, bundleMap(listingBundle()));
    const sid = content.subpages[LISTING_PATH].layout.sections[0];
    delete content.subpages[LISTING_PATH].content[sid].layout;

    expect(renderListing(content).querySelector('[data-cms-body]')).toBeNull();
  });
});

describe('listing page — fast-path pruning', () => {
  it('prunes an orphaned listing page even with ZERO cms sections left', () => {
    // The last collection block was deleted from the page. No cms sections ⇒ no
    // queries — but the previously published listing page must still go away.
    const content = payload({ cmsRoot: false });
    applyCmsListingPages(content, bundleMap(listingBundle()));
    expect(content.subpages[LISTING_PATH]).toBeTruthy();

    applyCmsListingPages(content, new Map());
    expect(content.subpages[LISTING_PATH]).toBeUndefined();
    expect(content.subpages['/about']).toBeTruthy();
  });
});

describe('buildListingSubpages', () => {
  it('produces nothing for a listingPage-off collection', () => {
    expect(buildListingSubpages(bundleMap(bundle())).size).toBe(0);
  });

  it('produces exactly one entry for a listingPage-on collection', () => {
    expect([...buildListingSubpages(bundleMap(listingBundle())).keys()]).toEqual([LISTING_PATH]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DECOUPLING (founder ruling) — page emission does NOT depend on placement
// ════════════════════════════════════════════════════════════════════════════
//
// `materializeCmsForPublish` now discovers collections by TOKEN, not by walking
// the payload for placed blocks. Two things must be proven here:
//
//  1. THE BUG IT FIXES — a collection with `listingPage` / `detailPages` on but
//     placed NOWHERE emits its pages. (The modal's "CREATES THESE PAGES" tiles
//     promised them; coupling made the promise fail silently. `detailPages` had
//     this defect since phase 4, not just the new listing pages.)
//  2. THE GUARANTEE THAT REPLACED THE FAST PATH — phase 3's "zero cms sections ⇒
//     zero queries" mitigation is gone, so the materializer can now reach
//     payloads it never touched before. Byte-identity for a project with no
//     collections (and for one whose toggles are all off) is what stands in its
//     place, and it is asserted on the SERIALIZED payload, not with `toEqual`.

/** A Prisma `Collection` row (+ nested groups/items) built from a fixture bundle. */
function rowOf(b: CmsCollectionBundle) {
  return { ...b.collection, groups: b.groups, items: b.items };
}

const TOKEN = 'tok1';
/** True byte-identity, not structural equality: key ORDER counts too. */
const bytes = (v: unknown) => JSON.stringify(v);

// Each gate below queues its own rows with `mockResolvedValueOnce`; without this
// a leftover queue entry would silently feed the next test.
beforeEach(() => {
  findMany.mockReset();
  findMany.mockResolvedValue([]);
});

describe('materializeCmsForPublish — the zero-query fast path is replaced by byte-identity', () => {
  it('a project with ZERO collections is byte-identical, subpages included', async () => {
    findMany.mockResolvedValueOnce([]);
    const content = payload({ cmsRoot: false });
    const before = bytes(content);

    expect(await materializeCmsForPublish(TOKEN, content)).toBe(0);

    expect(bytes(content)).toBe(before);
    // anti-vacuity: the payload really does carry subpages we could have damaged
    expect(Object.keys(content.subpages)).toEqual(['/about']);
  });

  it('a project whose collections all have BOTH toggles off is byte-identical', async () => {
    findMany.mockResolvedValueOnce([rowOf(bundle())]); // detailPages+listingPage off
    const content = payload({ cmsRoot: false });
    const before = bytes(content);

    await materializeCmsForPublish(TOKEN, content);

    expect(bytes(content)).toBe(before);
  });

  it('reads collections by tokenId ONLY (the tenant boundary, after the owner gate)', async () => {
    findMany.mockResolvedValueOnce([]);
    await materializeCmsForPublish(TOKEN, payload({ cmsRoot: false }));

    const arg = findMany.mock.calls.at(-1)![0] as any;
    expect(arg.where).toEqual({ tokenId: TOKEN });
    expect(findMany).toHaveBeenCalledTimes(1); // one round trip per publish
  });
});

describe('materializeCmsForPublish — emission is DECOUPLED from placement', () => {
  it('emits listing AND item pages for a collection PLACED NOWHERE (the fixed bug)', async () => {
    const b = listingBundle();
    b.collection.detailPages = true;
    findMany.mockResolvedValueOnce([rowOf(b)]);

    const content = payload({ cmsRoot: false }); // no cmscollection section anywhere
    expect(findCmsSections(content)).toEqual([]);

    expect(await materializeCmsForPublish(TOKEN, content)).toBe(0); // nothing INLINE

    expect(Object.keys(content.subpages).sort()).toEqual(
      ['/about', LISTING_PATH, '/books/deep-work', '/books/loose'].sort()
    );
    // the listing page is fully formed, not a husk (DUAL PIN + the real model)
    const sub = content.subpages[LISTING_PATH];
    const sid = sub.layout.sections[0];
    expect(sub.content[sid].layout).toBe(CMS_COLLECTION_LAYOUT);
    expect(sub.content[sid].elements[CMS_MODEL_ELEMENT_KEY]).toEqual(toRenderModel(b));
  });

  it('placed AND toggled on ⇒ exactly ONE listing page (no duplicate from two routes)', async () => {
    const b = listingBundle();
    findMany.mockResolvedValueOnce([rowOf(b)]);

    const content = payload({ cmsRoot: true }); // block ALSO placed on the root page
    expect(await materializeCmsForPublish(TOKEN, content)).toBe(1); // inline still works

    const listingPaths = Object.keys(content.subpages).filter((k) => k === LISTING_PATH);
    expect(listingPaths).toHaveLength(1);
    // the two routes produce DIFFERENT section ids — the placement keeps its uuid
    // id, the page gets the marker id — so neither can shadow the other.
    expect(content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY]).toEqual(toRenderModel(b));
    expect(isCmsListingSectionId(CMS_SID)).toBe(false);
    expect(content.subpages[LISTING_PATH].layout.sections).toEqual([cmsListingSectionId('col1')]);
  });

  it('toggle OFF prunes the pages again even though nothing is placed', async () => {
    const on = listingBundle();
    on.collection.detailPages = true;
    findMany.mockResolvedValueOnce([rowOf(on)]);
    const content = payload({ cmsRoot: false });
    await materializeCmsForPublish(TOKEN, content);
    expect(content.subpages[LISTING_PATH]).toBeTruthy();

    findMany.mockResolvedValueOnce([rowOf(bundle())]); // both toggles back off
    await materializeCmsForPublish(TOKEN, content);

    expect(Object.keys(content.subpages)).toEqual(['/about']);
  });

  it('PRUNING STILL CANNOT TOUCH a user page that merely contains a placed block', async () => {
    // The pruning surface GREW with decoupling: this pass now runs on payloads
    // the materializer previously never saw. The `cmscollection-listing-` marker
    // is the only thing stopping `/shop` from being deleted here.
    const content = payload({ cmsRoot: false });
    content.subpages['/shop'] = {
      title: 'Shop',
      layout: { sections: [CMS_SID_SUB] },
      content: {
        [CMS_SID_SUB]: {
          id: CMS_SID_SUB,
          layout: CMS_COLLECTION_LAYOUT,
          elements: { collectionId: 'col1' },
        },
      },
    };
    const before = bytes(content.subpages['/shop']);

    findMany.mockResolvedValueOnce([]); // collection deleted ⇒ full prune pass
    await materializeCmsForPublish(TOKEN, content);

    expect(content.subpages['/shop']).toBeTruthy();
    expect(bytes(content.subpages['/shop'])).toBe(before);
  });

  it('an unplaced collection whose listing path hits a REAL page still 409s, unmutated', async () => {
    findMany.mockResolvedValueOnce([rowOf(listingBundle())]);
    const content = payload({ cmsRoot: false });
    content.subpages[LISTING_PATH] = realPage('Our books');
    const before = bytes(content);

    await expect(materializeCmsForPublish(TOKEN, content)).rejects.toBeInstanceOf(
      CmsPathCollisionError
    );
    expect(bytes(content)).toBe(before);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FAN-OUT CAP — the brake decoupling removed
// ════════════════════════════════════════════════════════════════════════════
//
// Before decoupling, detail-page fan-out was conditional on PLACEMENT — an
// accidental brake. Now every `detailPages`-on collection fans out on every
// publish, and publish renders one blob + writes one KV route PER ITEM,
// SERIALLY, inside ONE serverless request. Uncapped, a few-hundred-item
// collection dies as an OPAQUE TIMEOUT on the highest-blast-radius route.
//
// What these gates pin:
//  · at the cap        → publishes fine (the cap is not off-by-one strict)
//  · one over the cap  → FAILS LOUD, mapped-status error naming the collection
//  · the failure happens BEFORE ANY MUTATION (byte-identity, same discipline as
//    the collision guard) — never a half-published collection
//  · a toggled-OFF collection is exempt at any size (it emits no pages)

/** `detailBundle()` inflated to exactly `n` items (unique ids + slugs). */
function bigDetailBundle(n: number, id = 'col1'): CmsCollectionBundle {
  const b = detailBundle(id);
  const proto = b.items[0];
  b.items = Array.from({ length: n }, (_, i) => ({
    ...clone(proto),
    id: `i${i}`,
    collectionId: id,
    groupId: 'gA',
    slug: `item-${i}`,
    order: i,
  }));
  return b;
}

describe('detail fan-out cap', () => {
  it('the pure guard passes AT the cap and throws ONE over it', () => {
    expect(() =>
      assertCmsFanOutWithinLimit(bundleMap(bigDetailBundle(MAX_CMS_DETAIL_PAGES_PER_COLLECTION)))
    ).not.toThrow();
    expect(() =>
      assertCmsFanOutWithinLimit(bundleMap(bigDetailBundle(MAX_CMS_DETAIL_PAGES_PER_COLLECTION + 1)))
    ).toThrow(CmsFanOutLimitError);
  });

  it('an OVER-cap collection with detailPages OFF is exempt (it emits no pages)', () => {
    const b = bigDetailBundle(MAX_CMS_DETAIL_PAGES_PER_COLLECTION * 5);
    b.collection.detailPages = false;
    expect(() => assertCmsFanOutWithinLimit(bundleMap(b))).not.toThrow();
  });

  it('publishing AT the cap works and emits exactly that many detail pages', async () => {
    const n = MAX_CMS_DETAIL_PAGES_PER_COLLECTION;
    findMany.mockResolvedValueOnce([rowOf(bigDetailBundle(n))]);
    const content = payload({ cmsRoot: false });

    await materializeCmsForPublish(TOKEN, content);

    const detailPaths = Object.keys(content.subpages).filter((k) => k.startsWith('/books/'));
    expect(detailPaths).toHaveLength(n);
  });

  it('ONE over the cap FAILS LOUD, naming the collection and the limit', async () => {
    const n = MAX_CMS_DETAIL_PAGES_PER_COLLECTION + 1;
    // NOT `…Once`: this gate makes two calls (throw-type, then message).
    findMany.mockResolvedValue([rowOf(bigDetailBundle(n))]);
    const content = payload({ cmsRoot: false });

    await expect(materializeCmsForPublish(TOKEN, content)).rejects.toBeInstanceOf(
      CmsFanOutLimitError
    );

    // The message is the user-facing contract: it must identify WHICH collection
    // and WHAT the limit is, or the user cannot act on it.
    const err = await materializeCmsForPublish(TOKEN, payload({ cmsRoot: false })).catch((e) => e);
    expect(err).toBeInstanceOf(CmsFanOutLimitError);
    expect(err.message).toContain('Books');
    expect(err.message).toContain(String(n));
    expect(err.message).toContain(String(MAX_CMS_DETAIL_PAGES_PER_COLLECTION));
  });

  it('the over-cap failure mutates NOTHING (no half-written fan-out)', async () => {
    findMany.mockResolvedValue([rowOf(bigDetailBundle(MAX_CMS_DETAIL_PAGES_PER_COLLECTION + 1))]);
    const content = payload({ cmsRoot: true }); // block placed too — nothing may be rewritten
    const before = bytes(content);

    await expect(materializeCmsForPublish(TOKEN, content)).rejects.toBeInstanceOf(
      CmsFanOutLimitError
    );

    expect(bytes(content)).toBe(before);
    // anti-vacuity: this payload DOES carry the things the throw must have spared
    expect(Object.keys(content.subpages)).toEqual(['/about']);
    expect(content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY]).toBeUndefined();
  });

});

// ════════════════════════════════════════════════════════════════════════════
// THE GLOBAL FAN-OUT CAP — the one that actually guards the timeout
// ════════════════════════════════════════════════════════════════════════════
//
// A PER-COLLECTION cap cannot bound the request: the timeout is a property of
// the WHOLE publish, so ten collections of 100 items each are ten individually
// LEGAL collections that still fan out to 1000 pages and time out exactly as if
// there were no cap at all. `MAX_CMS_DETAIL_PAGES_TOTAL` closes that gap; the
// per-collection cap survives only to name the culprit when there is one.
//
// The load-bearing gate below is "MANY collections, each UNDER the
// per-collection cap, summing OVER the total" — that is the exact case the
// per-collection cap structurally cannot catch.

/** Two-plus collections whose per-collection counts are all legal. */
function spreadBundles(n: number, per: number): CmsCollectionBundle[] {
  return Array.from({ length: n }, (_, i) => {
    const b = bigDetailBundle(per, `col${i}`);
    b.collection.name = `Coll ${i}`;
    b.collection.slug = `books-${i}`;
    return b;
  });
}

describe('total fan-out cap (across ALL collections)', () => {
  it('the per-collection cap is <= the total, so it can never permit what the total forbids', () => {
    expect(MAX_CMS_DETAIL_PAGES_PER_COLLECTION).toBeLessThanOrEqual(MAX_CMS_DETAIL_PAGES_TOTAL);
  });

  // ── THE GAP THIS CLOSES ───────────────────────────────────────────────────
  it('throws when the TOTAL exceeds the cap even though EVERY collection is under the per-collection cap', () => {
    const per = Math.floor(MAX_CMS_DETAIL_PAGES_TOTAL / 4) + 1;
    const bundles = spreadBundles(5, per);

    // anti-vacuity: the per-collection guard is genuinely satisfied by each one,
    // so ONLY the global check can be what throws here.
    for (const b of bundles) {
      expect(b.items.length).toBeLessThanOrEqual(MAX_CMS_DETAIL_PAGES_PER_COLLECTION);
      expect(() => assertCmsFanOutWithinLimit(bundleMap(b))).not.toThrow();
    }
    expect(per * 5).toBeGreaterThan(MAX_CMS_DETAIL_PAGES_TOTAL);

    expect(() => assertCmsFanOutWithinLimit(bundleMap(...bundles))).toThrow(
      CmsTotalFanOutLimitError
    );
  });

  it('passes AT the total and throws ONE over it', () => {
    const half = MAX_CMS_DETAIL_PAGES_TOTAL / 2;
    const at = [bigDetailBundle(half, 'colA'), bigDetailBundle(MAX_CMS_DETAIL_PAGES_TOTAL - half, 'colB')];
    at[1].collection.slug = 'b-books';
    expect(() => assertCmsFanOutWithinLimit(bundleMap(...at))).not.toThrow();

    const over = [bigDetailBundle(half, 'colA'), bigDetailBundle(MAX_CMS_DETAIL_PAGES_TOTAL - half + 1, 'colB')];
    over[1].collection.slug = 'b-books';
    expect(() => assertCmsFanOutWithinLimit(bundleMap(...over))).toThrow(CmsTotalFanOutLimitError);
  });

  it('a single OVERSIZED collection still gets the collection-NAMING error, not the aggregate one', () => {
    // Both caps are breached; the per-collection check runs first precisely so
    // the user is told WHICH collection rather than a total he cannot attribute.
    const b = bigDetailBundle(MAX_CMS_DETAIL_PAGES_PER_COLLECTION + 1);
    const err = (() => {
      try {
        assertCmsFanOutWithinLimit(bundleMap(b));
      } catch (e) {
        return e as Error;
      }
    })();
    expect(err).toBeInstanceOf(CmsFanOutLimitError);
    expect(err).not.toBeInstanceOf(CmsTotalFanOutLimitError);
  });

  it('the two error classes are SEPARATE — neither is a base of the other', () => {
    // A shared hierarchy would silently enrol future error types into the
    // route's 409 branch. Keep them siblings.
    const total = new CmsTotalFanOutLimitError(999);
    const per = new CmsFanOutLimitError('Books', 999);
    expect(total).not.toBeInstanceOf(CmsFanOutLimitError);
    expect(per).not.toBeInstanceOf(CmsTotalFanOutLimitError);
    expect(Object.getPrototypeOf(CmsTotalFanOutLimitError)).toBe(Error);
    expect(Object.getPrototypeOf(CmsFanOutLimitError)).toBe(Error);
  });

  it('collections with detailPages OFF do not count toward the total', () => {
    const bundles = spreadBundles(5, MAX_CMS_DETAIL_PAGES_TOTAL);
    for (const b of bundles) b.collection.detailPages = false;
    expect(() => assertCmsFanOutWithinLimit(bundleMap(...bundles))).not.toThrow();
  });

  it('publishing AT the total works and emits exactly that many detail pages', async () => {
    const half = MAX_CMS_DETAIL_PAGES_TOTAL / 2;
    const a = bigDetailBundle(half, 'colA');
    a.collection.slug = 'a-books';
    const b = bigDetailBundle(MAX_CMS_DETAIL_PAGES_TOTAL - half, 'colB');
    b.collection.slug = 'b-books';
    findMany.mockResolvedValueOnce([rowOf(a), rowOf(b)]);
    const content = payload({ cmsRoot: false });

    await materializeCmsForPublish(TOKEN, content);

    const detailPaths = Object.keys(content.subpages).filter(
      (k) => k.startsWith('/a-books/') || k.startsWith('/b-books/')
    );
    expect(detailPaths).toHaveLength(MAX_CMS_DETAIL_PAGES_TOTAL);
  });

  it('ONE over the total FAILS LOUD, naming the TOTAL and the limit', async () => {
    const per = Math.floor(MAX_CMS_DETAIL_PAGES_TOTAL / 4) + 1;
    const bundles = spreadBundles(5, per);
    const total = per * 5;
    // NOT `…Once`: this gate makes two calls (throw-type, then message).
    findMany.mockResolvedValue(bundles.map(rowOf));

    await expect(materializeCmsForPublish(TOKEN, payload({ cmsRoot: false }))).rejects.toBeInstanceOf(
      CmsTotalFanOutLimitError
    );

    const err = await materializeCmsForPublish(TOKEN, payload({ cmsRoot: false })).catch((e) => e);
    expect(err).toBeInstanceOf(CmsTotalFanOutLimitError);
    expect(err.message).toContain(String(total));
    expect(err.message).toContain(String(MAX_CMS_DETAIL_PAGES_TOTAL));
  });

  it('the over-total failure mutates NOTHING (no half-written fan-out)', async () => {
    const per = Math.floor(MAX_CMS_DETAIL_PAGES_TOTAL / 4) + 1;
    findMany.mockResolvedValue(spreadBundles(5, per).map(rowOf));
    const content = payload({ cmsRoot: true }); // block placed too — nothing may be rewritten
    const before = bytes(content);

    await expect(materializeCmsForPublish(TOKEN, content)).rejects.toBeInstanceOf(
      CmsTotalFanOutLimitError
    );

    expect(bytes(content)).toBe(before);
    // anti-vacuity: this payload DOES carry the things the throw must have spared
    expect(Object.keys(content.subpages)).toEqual(['/about']);
    expect(content.content[CMS_SID].elements[CMS_MODEL_ELEMENT_KEY]).toBeUndefined();
  });
});

describe('listing section ids are distinguishable from user placements', () => {
  it('a marked listing id is recognised; a uuid placement is NOT', () => {
    expect(isCmsListingSectionId(cmsListingSectionId('col1'))).toBe(true);
    expect(isCmsListingSectionId(CMS_SID)).toBe(false);
    expect(isCmsListingSectionId('cmscollection-3f9a1b2c-4d5e')).toBe(false);
    expect(isCmsListingSectionId('cmscollectionitem-i1')).toBe(false);
    // …and it still dispatches as a cmscollection block.
    expect(isCmsSectionId(cmsListingSectionId('col1'))).toBe(true);
  });
});
