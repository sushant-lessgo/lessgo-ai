// section-background phase 3 (D8) — the hero-slides invariant.
//
// THE thing under test: `slides` is never persisted with exactly 1 entry, from ANY
// direction — promote, demote, remove, reorder, replace, and a LEGACY draft that
// already carries a length-1 array. Plus the read-side tie-break that keeps the
// panel agreeing with what the canvas renders.

import { describe, it, expect } from 'vitest';
import {
  MAX_HERO_SLIDES,
  demoteToSingle,
  normalizeSlides,
  promoteToSlides,
  removeSlide,
  reorderSlides,
  replaceSlide,
  type HeroSlide,
  type HeroSlidesPatch,
} from './heroSlides';

const S = (id: string, image: string): HeroSlide => ({ id, image });

/** The invariant, as an assertion: no patch may carry a length-1 `slides` array. */
function expectInvariant(patch: HeroSlidesPatch) {
  if (patch.kind === 'slides') {
    expect(patch.slides.length, 'a helper returned a length-1 slides array').toBeGreaterThanOrEqual(2);
    expect(patch.slides.length).toBeLessThanOrEqual(MAX_HERO_SLIDES);
  }
}

describe('normalizeSlides — read-side coercion', () => {
  it('≥2 slides → slideshow state', () => {
    const n = normalizeSlides({ slides: [S('a', '/a.jpg'), S('b', '/b.jpg')] });
    expect(n.isSlideshow).toBe(true);
    expect(n.slides).toHaveLength(2);
  });

  it('no slides → single-image state off portrait_image', () => {
    const n = normalizeSlides({ portrait_image: '/p.jpg' });
    expect(n.isSlideshow).toBe(false);
    expect(n.slides).toEqual([]);
    expect(n.image).toBe('/p.jpg');
  });

  it('LEGACY length-1 slides array reads as single-image state and the draft is NOT mutated', () => {
    const elements = { portrait_image: '/p.jpg', slides: [S('orphan', '/orphan.jpg')] };
    const before = JSON.stringify(elements);
    const n = normalizeSlides(elements);
    expect(n.isSlideshow).toBe(false);
    expect(n.slides).toEqual([]);
    // TIE-BREAK: portrait_image WINS — the core forks at >=2, so THAT is what the
    // canvas is showing; the orphan slide is never rendered.
    expect(n.image).toBe('/p.jpg');
    expect(JSON.stringify(elements), 'normalizeSlides mutated the draft on READ').toBe(before);
  });

  it('length-1 slides with NO portrait_image → the orphan IS the visible image', () => {
    const n = normalizeSlides({ slides: [S('only', '/only.jpg')] });
    expect(n.isSlideshow).toBe(false);
    expect(n.image).toBe('/only.jpg');
    expect(n.imageSlideId).toBe('only');
  });

  it('unwraps the legacy `{value}` element shape (panel must agree with the canvas)', () => {
    const n = normalizeSlides({
      portrait_image: { value: '/p.jpg' } as any,
      slides: { value: [S('a', '/a'), S('b', '/b')] } as any,
    });
    expect(n.isSlideshow).toBe(true);
    expect(n.slides).toHaveLength(2);
  });

  // The LIVE legacy wrapper (`getStringContent`, storeTypes.ts) is `{content, type,
  // isEditable, editMode}` — the `{value}` case above pins a shape nothing in src/
  // writes. Without the `content` branch, `image` came back '' and promote wrote an
  // EMPTY first slide.
  it('unwraps the legacy `{content}` element shape', () => {
    const n = normalizeSlides({
      portrait_image: { content: '/p.jpg', type: 'image', isEditable: true, editMode: 'inline' } as any,
    });
    expect(n.isSlideshow).toBe(false);
    expect(n.image).toBe('/p.jpg');
  });

  it('promote off a `{content}`-wrapped portrait keeps the FIRST slide non-empty', () => {
    const patch = promoteToSlides(
      { portrait_image: { content: '/p.jpg', type: 'image' } as any },
      '/new.jpg',
    );
    expect(patch.kind).toBe('slides');
    if (patch.kind !== 'slides') throw new Error('unreachable');
    expect(patch.slides.map((s) => s.image)).toEqual(['/p.jpg', '/new.jpg']);
  });

  it('unwraps a `{content}`-wrapped slides array', () => {
    const n = normalizeSlides({ slides: { content: [S('a', '/a'), S('b', '/b')] } as any });
    expect(n.isSlideshow).toBe(true);
    expect(n.slides).toHaveLength(2);
  });

  it('empty / absent / junk input → empty single-image state', () => {
    for (const el of [undefined, null, {}, { slides: 'nope' as any }, { slides: [null, undefined] as any }]) {
      const n = normalizeSlides(el as any);
      expect(n.isSlideshow).toBe(false);
      expect(n.image).toBe('');
    }
  });
});

describe('promoteToSlides', () => {
  it('single portrait + new image → exactly 2 slides, portrait first', () => {
    const patch = promoteToSlides({ portrait_image: '/p.jpg' }, '/new.jpg');
    expectInvariant(patch);
    expect(patch.kind).toBe('slides');
    if (patch.kind !== 'slides') return;
    expect(patch.slides.map((s) => s.image)).toEqual(['/p.jpg', '/new.jpg']);
    expect(new Set(patch.slides.map((s) => s.id)).size).toBe(2); // unique ids
  });

  it('a pre-existing SINGLE slide is carried over (id preserved), not discarded', () => {
    const patch = promoteToSlides({ slides: [S('keep-me', '/only.jpg')] }, '/new.jpg');
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides[0]).toEqual({ id: 'keep-me', image: '/only.jpg' });
    expect(patch.slides[1].image).toBe('/new.jpg');
  });

  it('uses the NORMALIZED visible image as slide 1 (portrait wins the tie-break)', () => {
    const patch = promoteToSlides(
      { portrait_image: '/visible.jpg', slides: [S('orphan', '/never-rendered.jpg')] },
      '/new.jpg',
    );
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides.map((s) => s.image)).toEqual(['/visible.jpg', '/new.jpg']);
  });

  it('an existing slideshow APPENDS, and never exceeds the cap', () => {
    const three = [S('a', '/a'), S('b', '/b'), S('c', '/c')];
    const patch = promoteToSlides({ slides: three }, '/d');
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides).toHaveLength(4);

    const full = Array.from({ length: MAX_HERO_SLIDES }, (_, i) => S(`s${i}`, `/${i}`));
    const capped = promoteToSlides({ slides: full }, '/over');
    expectInvariant(capped);
    if (capped.kind !== 'slides') throw new Error('expected slides');
    expect(capped.slides).toHaveLength(MAX_HERO_SLIDES);
    expect(JSON.stringify(capped.slides)).not.toContain('/over');
  });
});

describe('demoteToSingle / removeSlide', () => {
  it('demote picks the SURVIVOR and asks for the slides KEY to be dropped', () => {
    const patch = demoteToSingle([S('a', '/a.jpg'), S('b', '/b.jpg')], 'a');
    expect(patch).toEqual({ kind: 'single', portraitImage: '/b.jpg' });
    // `kind: 'single'` is the contract that the caller must DELETE the key (N5) —
    // writing `slides: []` would let `stampHeroSlides` re-stamp on a later run.
    expect(patch).not.toHaveProperty('slides');
  });

  it('removing down to 1 AUTO-DEMOTES — the removed image is never left behind', () => {
    const patch = removeSlide([S('a', '/a.jpg'), S('b', '/b.jpg')], 'b');
    expectInvariant(patch);
    expect(patch).toEqual({ kind: 'single', portraitImage: '/a.jpg' });
  });

  it('removing from 3 stays a slideshow', () => {
    const patch = removeSlide([S('a', '/a'), S('b', '/b'), S('c', '/c')], 'b');
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('removing an unknown id changes nothing', () => {
    const patch = removeSlide([S('a', '/a'), S('b', '/b')], 'zzz');
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides).toHaveLength(2);
  });
});

describe('reorderSlides / replaceSlide', () => {
  it('reorder moves one item and keeps the rest in order', () => {
    const patch = reorderSlides([S('a', '/a'), S('b', '/b'), S('c', '/c')], 2, 0);
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides.map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('reorder with out-of-range indices is a no-op (still ≥2)', () => {
    const patch = reorderSlides([S('a', '/a'), S('b', '/b')], 5, 0);
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('replace swaps ONE image, order untouched', () => {
    const patch = replaceSlide([S('a', '/a'), S('b', '/b')], 'b', '/new');
    expectInvariant(patch);
    if (patch.kind !== 'slides') throw new Error('expected slides');
    expect(patch.slides).toEqual([S('a', '/a'), S('b', '/new')]);
  });
});

describe('THE INVARIANT — no helper can return a length-1 slides array', () => {
  const cases: Array<[string, () => HeroSlidesPatch]> = [
    ['promote from nothing', () => promoteToSlides({}, '/new')],
    ['promote from portrait', () => promoteToSlides({ portrait_image: '/p' }, '/new')],
    ['promote from a LEGACY length-1 draft', () => promoteToSlides({ slides: [S('x', '/x')] }, '/new')],
    ['remove at 2', () => removeSlide([S('a', '/a'), S('b', '/b')], 'a')],
    ['remove at 3', () => removeSlide([S('a', '/a'), S('b', '/b'), S('c', '/c')], 'a')],
    ['reorder a length-1 array (defensive)', () => reorderSlides([S('a', '/a')], 0, 0)],
    ['replace on a length-1 array (defensive)', () => replaceSlide([S('a', '/a')], 'a', '/n')],
    ['demote', () => demoteToSingle([S('a', '/a'), S('b', '/b')], 'b')],
  ];
  for (const [name, run] of cases) {
    it(name, () => {
      const patch = run();
      expectInvariant(patch);
      if (patch.kind === 'slides') expect(patch.slides.length).not.toBe(1);
    });
  }
});
