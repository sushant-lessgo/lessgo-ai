// section-background phase 3 — hero `bgMode` per the D7 per-variant matrix.
//
// What must hold, per hero variant, in BOTH renderers (dual-renderer law):
//   - ABSENT `bgMode` (and the explicit `'image'`) → today's EXACT markup. The two
//     outputs are compared BYTE-for-byte, so any drift in the default path is a
//     failure. (Byte-identity against the PRE-change code is additionally pinned by
//     the untouched `kundiusPages` / `oldContentFallback` / `coreParity` /
//     `uiFoundationIsolation.snap` tripwires — those render this same markup.)
//   - `'color'` → slider/image render NO media element and NO scrim; split renders
//     no media COLUMN and carries the single-column modifier class.
//   - `workherocenter` is a NO-OP: it renders no `portrait_image` at all, so a
//     stored `bgMode:'color'` must change literally nothing. Its files are
//     deliberately NOT touched by this phase — this is the proof.
//   - The slider's promoted 2-slide state emits the FROZEN `work.v1.js` hooks
//     verbatim (`.wk-hero__slide`/`.is-active`, `[data-wk-prev]`/`[data-wk-next]`,
//     `[data-wk-dots]`, `[data-wk-interval]`) — a renamed hook would demand a
//     `work.v2.js`, which is forbidden.

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';

import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { resolveWorkBlock } from '../../resolveWorkBlock';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const HERO = 'hero-bgmode01';

const HERO_CONTENT = {
  role_line: 'Photographer',
  name: 'Kundius',
  quote: 'Pictures that keep their nerve.',
  portrait_image: 'https://cdn.example/portrait.jpg',
  cta_label: 'Start a project',
  cta_href: '#contact',
};

const SLIDES = [
  { id: 's1', image: 'https://cdn.example/1.jpg' },
  { id: 's2', image: 'https://cdn.example/2.jpg' },
];

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
  useEditStoreApi: () => h.store,
}));

vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

h.store = createHarnessStore([]);

/** Seed the ONE hero section + (optionally) its stored bgMode, then mount the EDIT
 *  wrapper and read the painted DOM (the work Txt primitive paints in an effect). */
function renderEdit(
  layout: string,
  content: Record<string, any>,
  bgMode?: string,
): string {
  const elements: Record<string, any> = {};
  for (const [k, v] of Object.entries(content)) elements[k] = { value: v, content: v };
  h.store.setState({
    content: { [HERO]: { elements, layout, aiMetadata: {} } },
    sections: [HERO],
    sectionLayouts: { [HERO]: layout },
    themeValues: bgMode ? { styleTokens: { [HERO]: { bgMode } } } : {},
  });
  const Edit = resolveWorkBlock('hero', 'edit', layout)!;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(React.createElement(Edit, { sectionId: HERO })); });
  const html = container.innerHTML;
  act(() => { root.unmount(); });
  container.remove();
  return html;
}

/** Mount the PUBLISHED wrapper with flat props + the per-section styleTokens prop
 *  (exactly what `LandingPagePublishedRenderer` passes). */
function renderPublished(
  layout: string,
  content: Record<string, any>,
  bgMode?: string,
): string {
  const Published = resolveWorkBlock('hero', 'published', layout)!;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(Published, {
        sectionId: HERO,
        ...content,
        styleTokens: bgMode ? { bgMode } : undefined,
      }),
    );
  });
  const html = container.innerHTML;
  act(() => { root.unmount(); });
  container.remove();
  return html;
}

/** MARKUP only — the core inlines its whole stylesheet in a `<style>` tag, and that
 *  stylesheet legitimately names every class (`.wk-hero-img__media{…}`). A
 *  "media is gone" assertion made against the raw html would be permanently red. */
function body(html: string): string {
  return html.replace(/<style>[\s\S]*?<\/style>/g, '');
}

const MEDIA_VARIANTS: Array<[string, RegExp]> = [
  ['WorkHeroSlider', /wk-hero__media|wk-hero__slides/],
  ['WorkHeroImage', /wk-hero-img__media/],
];

describe('hero bgMode — absent / "image" leaves today\'s markup alone', () => {
  for (const layout of ['WorkHeroSlider', 'WorkHeroImage', 'WorkHeroSplit', 'WorkHeroCenter']) {
    it(`${layout}: absent bgMode === explicit "image" (byte-for-byte), both renderers`, () => {
      expect(renderEdit(layout, HERO_CONTENT)).toBe(renderEdit(layout, HERO_CONTENT, 'image'));
      expect(renderPublished(layout, HERO_CONTENT)).toBe(
        renderPublished(layout, HERO_CONTENT, 'image'),
      );
    });
  }

  it('slider: absent bgMode with 2 slides still emits the FROZEN work.v1.js hooks verbatim', () => {
    const html = body(renderPublished('WorkHeroSlider', { ...HERO_CONTENT, slides: SLIDES }));
    for (const hook of [
      'wk-hero__slide',
      'is-active',
      'data-wk-prev',
      'data-wk-next',
      'data-wk-dots',
      'data-wk-interval="5000"',
    ]) {
      expect(html, `frozen slider hook missing: ${hook}`).toContain(hook);
    }
    // …and the single-portrait DOM is NOT emitted alongside it (the >=2 fork).
    expect(html).not.toContain('wk-hero__media-in');
  });
});

describe('hero bgMode:"color" — the D7 per-variant render matrix', () => {
  for (const [layout, mediaRe] of MEDIA_VARIANTS) {
    it(`${layout}: drops the media + scrim overlays in BOTH renderers`, () => {
      for (const html of [
        body(renderEdit(layout, HERO_CONTENT, 'color')),
        body(renderPublished(layout, HERO_CONTENT, 'color')),
      ]) {
        expect(html).not.toMatch(mediaRe);
        expect(html).not.toContain('__scrim');
        // Not merely hidden — the <img> is GONE, so the browser never downloads it.
        expect(html).not.toContain('cdn.example/portrait.jpg');
        // The copy is untouched.
        expect(html).toContain('Kundius');
      }
    });
  }

  it('slider: color mode also drops a MULTI-slide set (no slide is on screen)', () => {
    for (const html of [
      body(renderEdit('WorkHeroSlider', { ...HERO_CONTENT, slides: SLIDES }, 'color')),
      body(renderPublished('WorkHeroSlider', { ...HERO_CONTENT, slides: SLIDES }, 'color')),
    ]) {
      expect(html).not.toContain('wk-hero__slide');
      expect(html).not.toContain('data-wk-interval');
      expect(html).not.toContain('cdn.example/1.jpg');
    }
  });

  it('split: omits the media COLUMN and carries the single-column modifier', () => {
    for (const html of [
      body(renderEdit('WorkHeroSplit', HERO_CONTENT, 'color')),
      body(renderPublished('WorkHeroSplit', HERO_CONTENT, 'color')),
    ]) {
      expect(html).not.toContain('wk-hero-split__media');
      expect(html).toContain('wk-hero-split--no-media');
      expect(html).toContain('Kundius');
    }
    // The modifier is inert without its rule — the ONE new selector must exist.
    expect(renderPublished('WorkHeroSplit', HERO_CONTENT, 'color')).toContain(
      '.wk-hero-split--no-media .wk-hero-split__in{ grid-template-columns:1fr; }',
    );
    // …and it is NOT applied in the default path.
    expect(renderPublished('WorkHeroSplit', HERO_CONTENT)).not.toContain(
      'class="wk-hero-split wk-hero-split--no-media"',
    );
  });

  it('center: bgMode is a NO-OP — the untouched variant renders identically', () => {
    // WorkHeroCenter.* are deliberately NOT touched by this phase (D7): the variant
    // renders no portrait_image, so there is nothing for Color mode to suppress.
    expect(renderEdit('WorkHeroCenter', HERO_CONTENT, 'color')).toBe(
      renderEdit('WorkHeroCenter', HERO_CONTENT),
    );
    expect(renderPublished('WorkHeroCenter', HERO_CONTENT, 'color')).toBe(
      renderPublished('WorkHeroCenter', HERO_CONTENT),
    );
  });
});

describe('published delivery of bgMode', () => {
  it('reads it off the per-section styleTokens prop the renderer passes', () => {
    const withProp = renderPublished('WorkHeroImage', HERO_CONTENT, 'color');
    const without = renderPublished('WorkHeroImage', HERO_CONTENT);
    expect(withProp).not.toBe(without);
    expect(body(without)).toContain('wk-hero-img__media');
    expect(body(withProp)).not.toContain('wk-hero-img__media');
  });

  it('an unrelated styleTokens payload (no bgMode) changes nothing', () => {
    const Published = resolveWorkBlock('hero', 'published', 'WorkHeroImage')!;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(Published, {
          sectionId: HERO,
          ...HERO_CONTENT,
          styleTokens: { background: 'dark' },
        }),
      );
    });
    const html = container.innerHTML;
    act(() => { root.unmount(); });
    container.remove();
    expect(html).toBe(renderPublished('WorkHeroImage', HERO_CONTENT));
  });
});
