// THE binding editor↔published parity gate for the CMS block.
//
// The discipline that makes this test real: BOTH twins are rendered from the
// output of the REAL `toRenderModel()` run over a RAW fixture (collection +
// groups + items, all 9 field types, roles set AND unset). A hand-written model
// fixture would let the two data feeds drift while this test sat green — the
// exact class of "inert assertion" this repo has been bitten by before.
//
// What is compared: the `[data-cms-body]` subtree skeleton — tag names, the
// rendering-relevant attributes (`class`, `style`, `src`, `alt`, `href`), layout
// `data-cms-*` attributes and text content. Edit-only chrome (the greyed "Manage
// items" placeholder) lives OUTSIDE that subtree by construction, and only the
// genuinely sanctioned twin differences are excluded (inert onClick vs
// target/rel + CTA beacon attrs + aria-label) — everything else must match.
// See COMPARED_ATTRS below for why the exclusion list is kept this narrow.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { toRenderModel } from './toRenderModel';
import CollectionSection, { makeCmsEditPrimitives } from './CollectionSection';
import CollectionSectionPublished, {
  makeCmsPublishedPrimitives,
} from './CollectionSection.published';
import { CollectionSectionCore } from './CollectionSection.core';
import { CMS_MODEL_ELEMENT_KEY } from './toRenderModel';
import { resolveSharedBlock } from '@/modules/generatedLanding/sharedBlocks/registry';
import { resolveSharedBlockPublished } from '@/modules/generatedLanding/sharedBlocks/registry.published';
import type { CmsCollectionBundle, FieldDef } from '../types';

const FIELDS: FieldDef[] = [
  { id: 'cover', name: 'Cover', type: 'image' },
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'blurb', name: 'Blurb', type: 'text_long' },
  { id: 'shots', name: 'Shots', type: 'gallery' },
  { id: 'clip', name: 'Clip', type: 'video' },
  { id: 'track', name: 'Track', type: 'audio' },
  { id: 'buy', name: 'Buy', type: 'link' },
  { id: 'released', name: 'Released', type: 'date' },
  { id: 'topics', name: 'Topics', type: 'tags' },
];

const VALUES = {
  cover: { url: 'https://cdn.test/cover.png', assetId: 'a1' },
  title: 'Deep Work',
  blurb: 'A long\nblurb about focus.',
  shots: [{ url: '/one.png' }, { url: 'https://cdn.test/two.png' }],
  clip: { kind: 'link' as const, url: 'https://video.test/clip' },
  track: { kind: 'upload' as const, url: '/audio/track.mp3' },
  buy: { url: 'mailto:hi@acme.com', label: 'Email me' },
  released: '2026-01-02',
  topics: ['focus', 'craft'],
};

/** roles UNSET → fallback resolution; roles SET → explicit resolution. */
function rawBundle(rolesSet: boolean): CmsCollectionBundle {
  return {
    collection: {
      id: 'col1',
      projectId: 'proj1',
      tokenId: 'tok1',
      name: 'Books',
      slug: 'books',
      fieldSchema: FIELDS,
      roles: rolesSet ? { title: 'title', cover: 'shots', primaryLink: 'buy' } : {},
      detailPages: false,
      layoutHint: null,
      order: 0,
    },
    groups: [
      { id: 'gA', collectionId: 'col1', name: 'Recent', order: 0 },
      { id: 'gB', collectionId: 'col1', name: 'Archive', order: 1 },
    ],
    items: [
      {
        id: 'i1',
        collectionId: 'col1',
        groupId: 'gA',
        slug: 'deep-work',
        values: VALUES,
        order: 0,
        slugLocked: false,
      },
      {
        id: 'i2',
        collectionId: 'col1',
        groupId: 'gB',
        slug: 'sparse',
        values: { title: 'Sparse item', topics: ['solo'] },
        order: 0,
        slugLocked: false,
      },
      {
        id: 'i3',
        collectionId: 'col1',
        groupId: null,
        slug: 'loose',
        values: { title: 'Ungrouped', buy: { url: 'tel:+15551234', label: 'Call' } },
        order: 0,
        slugLocked: false,
      },
    ],
  };
}

/**
 * Attributes the parity gate COMPARES. The two primitive factories
 * (`makeCmsEditPrimitives` / `makeCmsPublishedPrimitives`) are hand-duplicated, so
 * anything left out of this set is exactly where silent divergence can hide. In
 * particular `style` is load-bearing: dropping `whiteSpace:'pre-wrap'` from one
 * twin would collapse `text_long` newlines in published only — the canonical
 * editor↔published failure class this gate exists to catch.
 */
const COMPARED_ATTRS = ['class', 'style', 'src', 'alt', 'href'];

/**
 * Structural skeleton: tag + COMPARED_ATTRS + layout `data-cms-*` attrs + text,
 * recursively.
 *
 * EXCLUDED (the sanctioned twin differences only):
 *  - `target` / `rel` — published-only, from `externalLinkProps`.
 *  - `data-lessgo-cta*` — published-only conversion beacon attrs.
 *  - `aria-label` — carried by both, but not part of the structural contract.
 *  - edit-only interaction hooks (inert `onClick`, `contentEditable`) and the
 *    `manageSlot` affordance, which lives outside `[data-cms-body]` anyway.
 * `href` is NOT excluded: it is identical in both twins (edit differs only by the
 * inert onClick), so excluding it was over-broad.
 */
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

/** Render a twin to static markup and parse it into a real DOM (jsdom env). */
function dom(node: React.ReactElement): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(node);
  return host;
}

function bodyOf(container: HTMLElement): Element {
  const body = container.querySelector('[data-cms-body]');
  if (!body) throw new Error('no [data-cms-body] rendered');
  return body;
}

// A key-sync test alone is NOT enough: a consistently mis-cased key (e.g.
// `cmsCollection` in BOTH registries AND capabilities) passes key-sync and then
// never resolves at runtime. These assert the dispatch actually lands.
describe('CMS collection block — shared-block dispatch resolves', () => {
  it('resolves the edit twin through the edit registry', () => {
    expect(resolveSharedBlock('cmscollection')).toBe(CollectionSection);
  });

  it('resolves the published twin through the published registry', () => {
    expect(resolveSharedBlockPublished('cmscollection')).toBe(CollectionSectionPublished);
  });
});

describe('CMS collection block — editor↔published parity', () => {
  for (const rolesSet of [false, true]) {
    it(`renders an identical body skeleton from the SAME toRenderModel output (roles ${rolesSet ? 'set' : 'unset'})`, () => {
      const model = toRenderModel(rawBundle(rolesSet));

      const edit = dom(<CollectionSection sectionId="cmscollection-1" model={model} />);
      const published = dom(
        <CollectionSectionPublished
          sectionId="cmscollection-1"
          {...{ [CMS_MODEL_ELEMENT_KEY]: model }}
        />
      );

      const editSkeleton = skeleton(bodyOf(edit));
      const publishedSkeleton = skeleton(bodyOf(published));

      expect(publishedSkeleton).toBe(editSkeleton);
      // Guard against a vacuous pass: the fixture must actually render content.
      expect(editSkeleton.split('\n').length).toBeGreaterThan(30);
      expect(editSkeleton).toContain('#text:Deep Work');
      // …and must actually EXERCISE each newly-compared attribute, otherwise
      // widening COMPARED_ATTRS would be theatre.
      expect(editSkeleton).toContain('pre-wrap'); // multiline text_long style
      expect(editSkeleton).toMatch(/src=\S*cover\.png|src=\S*two\.png/); // image src
      expect(editSkeleton).toMatch(/alt=[^|]+\|/); // non-empty image alt
      expect(editSkeleton).toContain('href=mailto:hi@acme.com'); // link href
    });
  }

  it('all 9 field types reach the DOM in both twins', () => {
    const model = toRenderModel(rawBundle(false));
    const edit = dom(<CollectionSection sectionId="s1" model={model} />);
    const published = dom(
      <CollectionSectionPublished sectionId="s1" {...{ [CMS_MODEL_ELEMENT_KEY]: model }} />
    );

    // Non-role fields carry data-cms-field=<fieldType>; cover/title/primaryCta are
    // consumed by the role slots (image/text_short/link).
    const typesIn = (c: HTMLElement) =>
      Array.from(c.querySelectorAll('[data-cms-field]'))
        .map((e) => e.getAttribute('data-cms-field'))
        .sort();
    const expected = ['audio', 'date', 'gallery', 'tags', 'tags', 'text_long', 'video'].sort();
    expect(typesIn(edit)).toEqual(expected);
    expect(typesIn(published)).toEqual(expected);

    // Role slots present in both.
    for (const c of [edit, published]) {
      expect(c.querySelector('.lg-cms__cover')).toBeTruthy(); // image role
      expect(c.querySelector('.lg-cms__title')).toBeTruthy(); // text_short role
      expect(c.querySelector('.lg-cms__cta')).toBeTruthy();   // link role
    }
  });

  it('mailto:/tel: CTA hrefs survive into the published anchor (wide predicate end-to-end)', () => {
    const model = toRenderModel(rawBundle(false));
    const container = dom(
      <CollectionSectionPublished sectionId="s1" {...{ [CMS_MODEL_ELEMENT_KEY]: model }} />
    );
    const hrefs = Array.from(container.querySelectorAll('a.lg-cms__cta')).map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs).toContain('mailto:hi@acme.com');
    expect(hrefs).toContain('tel:+15551234');
  });

  it('the edit twin shows a DISABLED "Manage items" placeholder, outside the compared body', () => {
    const model = toRenderModel(rawBundle(false));
    const container = dom(<CollectionSection sectionId="s1" model={model} />);
    const btn = container.querySelector('[data-cms-manage] button') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('title')).toBeTruthy(); // why-tooltip is a contract
    expect(bodyOf(container).querySelector('[data-cms-manage]')).toBeNull();
  });

  it('published twin renders an empty (not broken) block when no model was materialized', () => {
    const container = dom(<CollectionSectionPublished sectionId="s1" />);
    expect(bodyOf(container).textContent).toContain('No items yet');
  });

  it('edit twin shows a skeleton (not a crash) before the model is available', () => {
    const container = dom(<CollectionSection sectionId="s1" />);
    expect(container.querySelector('[data-cms-skeleton]')).toBeTruthy();
  });
});

// META-TEST: proves the comparator above actually BITES. The two primitive
// factories are hand-duplicated ~60-line copies, so the gate is only worth
// anything if a realistic divergence in one of them makes it fail. Here we inject
// a deliberately-diverged published `Txt` (pre-wrap dropped — which would collapse
// text_long newlines in published ONLY) and assert the skeletons differ. Before
// `style` joined COMPARED_ATTRS this divergence sat green.
describe('the parity comparator detects a real divergence', () => {
  const divergedModel = () => toRenderModel(rawBundle(false));

  function coreWith(E: ReturnType<typeof makeCmsEditPrimitives>) {
    return dom(<CollectionSectionCore model={divergedModel()} E={E} sectionId="s1" />);
  }

  it('fails when the published Txt drops style={{whiteSpace:"pre-wrap"}}', () => {
    const edit = coreWith(makeCmsEditPrimitives());

    const base = makeCmsPublishedPrimitives();
    const diverged = {
      ...base,
      // identical to the real published Txt except the multiline style is gone
      Txt: ({ value, as = 'span', className }: any) => {
        if (!value) return null;
        const Tag = as as any;
        return <Tag className={className}>{value}</Tag>;
      },
    };
    const published = coreWith(diverged as any);

    expect(skeleton(bodyOf(published))).not.toBe(skeleton(bodyOf(edit)));
  });

  it('fails when the published Img drops its alt', () => {
    const edit = coreWith(makeCmsEditPrimitives());

    const base = makeCmsPublishedPrimitives();
    const diverged = {
      ...base,
      Img: ({ src, className, imgClassName }: any) => (
        <span className={className}>
          {src ? <img src={src} alt="" className={imgClassName} loading="lazy" decoding="async" /> : null}
        </span>
      ),
    };
    const published = coreWith(diverged as any);

    expect(skeleton(bodyOf(published))).not.toBe(skeleton(bodyOf(edit)));
  });

  it('still passes with the REAL published primitives (the mutations above are the only difference)', () => {
    const edit = coreWith(makeCmsEditPrimitives());
    const published = coreWith(makeCmsPublishedPrimitives() as any);
    expect(skeleton(bodyOf(published))).toBe(skeleton(bodyOf(edit)));
  });
});
