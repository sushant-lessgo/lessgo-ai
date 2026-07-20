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
import { describe, it, expect, vi } from 'vitest';

// `@/lib/prisma` is only used by loadCmsBundles (not exercised here — the pure
// materializer takes fixtures), but importing the module must not boot Prisma.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

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
  CMS_COLLECTION_LAYOUT,
  CMS_COLLECTION_ITEM_LAYOUT,
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
  // video + audio are here so the KEY-NAME meta-guard below covers ALL NINE field
  // types: a future `mediaUrl`-style key added to the media branch must trip the
  // no-suffix-match assertion, not slip through an unexercised branch.
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'released', name: 'Released', type: 'date' },
  { id: 'topics', name: 'Topics', type: 'tags' },
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
