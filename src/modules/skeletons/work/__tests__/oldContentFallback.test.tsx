// src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx
// atelier-skeleton-cutover phase 1 — RENDER-level graceful-fallback proof.
//
// The live `atelier` id now dispatches through the work-skeleton. A STRAY old-
// atelier project (persisted against the retired hand-written skin) carries an OLD
// content shape: the gallery field is `works: [{id,title,caption,image}]` (NOT the
// skeleton's group-reference `groups`), and the hero uses `headline`/`lede`/
// `cta_text` (NOT `name`/`quote`/`cta_label`). When such a project is published it
// hits the SKELETON published blocks. This test proves those blocks do NOT throw
// inside `renderToStaticMarkup` when fed the old shape — they degrade to neutral
// defaults/empty cells instead of 500-ing the publish path.
//
// PROP-SHAPE TRAP (why this is NOT vacuous): skeleton `.published` blocks take
// FLAT-SPREAD props (`<Published sectionId=… {...content} />`, the
// renderParity.work.test.tsx:111 pattern), NOT a `content={}` prop. Passing
// `content={oldFixture}` would leave every field `undefined`, render defaults, and
// pass VACUOUSLY. We SPREAD the old fixture as flat props so the old-vs-new field
// access (`works` vs `groups`, `headline` vs `name`) actually executes.
//
// Published blocks are pure (no hooks / no store), so `renderToStaticMarkup` is the
// real published-renderer path — no jsdom mount needed.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import { resolveWorkBlock } from '../resolveWorkBlock';
import { WorkPlaceholderBlock } from '../WorkPlaceholderBlock';

// OLD-atelier gallery shape: a flat `works` list (id/title/caption/image), NO
// `groups`. The skeleton gallery reads `groups` → undefined → must render empty.
const OLD_WORK_FIXTURE = {
  eyebrow: 'Selected work',
  headline: 'Selected <em>work</em>',
  lede: 'A short cut of recent commissions.',
  works: [
    { id: 'aw1', title: 'Bloom Atelier', caption: 'Editorial', image: '' },
    { id: 'aw2', title: 'Northlight', caption: 'Portrait', image: '' },
  ],
  more_text: 'View the full portfolio →',
  more_href: '#work',
};

// OLD-atelier hero shape: headline/lede/cta_text (skeleton wants name/quote/
// cta_label). Every skeleton hero field access resolves undefined → defaults.
const OLD_HERO_FIXTURE = {
  eyebrow: 'Portfolio · Commissions',
  headline: 'Seen. Chosen. <em>Remembered.</em>',
  lede: 'A body of work that does the persuading for you.',
  cta_text: 'Start a project',
  cta_href: '#contact',
  secondary_cta_text: 'See the work',
  secondary_cta_href: '#work',
};

describe('work-skeleton published blocks survive OLD-atelier content shapes (no 500)', () => {
  it('work gallery default: old `works` shape (no `groups`) renders without throwing + non-empty', () => {
    const Published = resolveWorkBlock('work', 'published', 'WorkGalleryGrid')!;
    expect(Published).not.toBe(WorkPlaceholderBlock);
    let html = '';
    expect(() => {
      html = renderToStaticMarkup(
        <Published sectionId="work-test1234" {...OLD_WORK_FIXTURE} />,
      );
    }).not.toThrow();
    expect(html.length).toBeGreaterThan(0);
  });

  it('work gallery via stray OLD layout name "AtelierWorkGallery" (→ default) also survives', () => {
    // resolveWorkBlock falls the unknown old layout name back to the section default;
    // the render must still be crash-free with the old content shape.
    const Published = resolveWorkBlock('work', 'published', 'AtelierWorkGallery')!;
    let html = '';
    expect(() => {
      html = renderToStaticMarkup(
        <Published sectionId="work-test1234" {...OLD_WORK_FIXTURE} />,
      );
    }).not.toThrow();
    expect(html.length).toBeGreaterThan(0);
  });

  it('hero default: old hero keys (headline/lede/cta_text) render without throwing + non-empty', () => {
    const Published = resolveWorkBlock('hero', 'published', 'WorkHeroSlider')!;
    expect(Published).not.toBe(WorkPlaceholderBlock);
    let html = '';
    expect(() => {
      html = renderToStaticMarkup(
        <Published sectionId="hero-test1234" {...OLD_HERO_FIXTURE} />,
      );
    }).not.toThrow();
    expect(html.length).toBeGreaterThan(0);
  });

  it('WorkPlaceholderBlock (published path) is server-safe: renders a non-empty band', () => {
    // A stray old-only section type (e.g. `quote`) resolves the placeholder; it must
    // render server-side without throwing.
    let html = '';
    expect(() => {
      html = renderToStaticMarkup(
        <WorkPlaceholderBlock sectionId="quote-test1234" layout="AtelierQuoteBand" />,
      );
    }).not.toThrow();
    expect(html.length).toBeGreaterThan(0);
  });
});
