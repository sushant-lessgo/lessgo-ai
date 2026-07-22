// src/modules/skeletons/work/heroSlides.ts
// section-background phase 3 (D8) — the hero-slides INVARIANT, in one pure module.
//
// THE INVARIANT: a hero's `slides` array is either ABSENT/empty or has ≥2 entries —
// NEVER exactly 1. The renderer forks at `slides.length >= 2`
// (`WorkHeroSlider.core.tsx`), so a length-1 array falls into the `<2` branch and
// the canvas renders whatever stale scalar `portrait_image` was left behind —
// possibly an image the user just deleted. Every mutation the editor can perform
// goes through the helpers below, and NO helper ever RETURNS a `slides` array of
// length 1.
//
// PURE DATA + LOGIC — no React, no store, no skeleton/template imports. Safe to
// import from the editor panel, from tests, and (type-only) from anywhere.
//
// Two other doors into the same invariant are closed elsewhere:
//   - WRITE side: `stampHeroSlides` (`src/modules/generation/workCollections.ts`)
//     skips when the derived array would be < 2.
//   - READ side: `normalizeSlides` below coerces a legacy length-1 draft to
//     single-image state WITHOUT mutating it, so the panel always agrees with what
//     the canvas is actually showing.

/** One hero slide. `{id, image}` ONLY — no crop, no focal point, no per-slide copy
 *  (spec Scope OUT, founder-ruled; do not widen this shape). */
export interface HeroSlide {
  id: string;
  image?: string;
}

/** Contract cap (workSections.ts `slides` max). Phase 4's tray enforces it in UI;
 *  the helpers enforce it here so no code path can exceed it. */
export const MAX_HERO_SLIDES = 6;

/** The minimum a real slideshow can be. Below this, single-image state. */
export const MIN_HERO_SLIDES = 2;

/** The element shape these helpers read (a hero section's `elements` map). */
export interface HeroSlidesElements {
  portrait_image?: string;
  slides?: unknown;
}

/**
 * The result of a mutation. TWO shapes, because "single-image state" is not
 * `slides: []` — the `slides` KEY must be GONE (see `demoteToSingle`).
 */
export type HeroSlidesPatch =
  /** Write `slides` (always length ≥2). `portrait_image` is left ALONE — keeping it
   *  is what makes a later demote / a Color↔Image round trip lossless. */
  | { kind: 'slides'; slides: HeroSlide[] }
  /** Single-image state: set `portrait_image` and DELETE the `slides` key. */
  | { kind: 'single'; portraitImage: string };

/**
 * Elements are stored in TWO shapes across the codebase: the raw value
 * (`elements.slides = [...]`, what `updateElementContent` writes and what seeds
 * carry) and a legacy WRAPPED object. Callers hand us whichever they have, so
 * unwrap defensively — reading only one shape would make the panel silently
 * disagree with the canvas.
 *
 * The live legacy wrapper in this repo is `{ content, type, isEditable, editMode }`
 * (see `getStringContent`, `src/types/store/storeTypes.ts`), and the repo's own
 * precedent (`WorkFooter.tsx`) unwraps BOTH `content` and `value`. So do we:
 * `content` first (the shape actually written), then `value`. If a
 * `{ content: url }` portrait ever reached us with only the `value` branch,
 * `normalizeSlides` would report NO image and `promoteToSlides` would write an
 * EMPTY first slide.
 */
function unwrap(v: unknown): unknown {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if ('content' in (v as any)) return (v as any).content;
    if ('value' in (v as any)) return (v as any).value;
  }
  return v;
}

/** Read `slides` defensively off an arbitrary elements map. */
function rawSlides(elements: HeroSlidesElements | null | undefined): HeroSlide[] {
  const raw = unwrap(elements?.slides);
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is HeroSlide => Boolean(s) && typeof s === 'object');
}

let seq = 0;
/** Slide ids only need to be unique within one hero (they key React children and
 *  the phase-4 tray's drag items). Not crypto, not persisted-cross-project. */
export function newSlideId(): string {
  seq += 1;
  return `slide-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export interface NormalizedSlides {
  /** True when the canvas is rendering the multi-slide slider (length ≥2). */
  isSlideshow: boolean;
  /** The slide set when `isSlideshow`; otherwise EMPTY (never length 1). */
  slides: HeroSlide[];
  /** The single image the canvas is showing when `!isSlideshow` ('' when none). */
  image: string;
  /** The id of the slide `image` came from, when it came from an orphan slide.
   *  Preserved on promote so a pre-existing single slide is not silently re-keyed. */
  imageSlideId?: string;
}

/**
 * READ-SIDE coercion — every panel/helper entry point runs this FIRST.
 *
 * A pre-existing length-1 `slides` array (legacy drafts, or anything that slipped
 * past the guards) is reported as SINGLE-IMAGE state, without mutating the draft.
 *
 * TIE-BREAK — `portrait_image` WINS when both are present. This is not arbitrary:
 * the core forks at `>= 2`, so a length-1 draft renders `portrait_image` on canvas,
 * and the panel must agree with what the USER SEES. The never-rendered orphan slide
 * loses.
 */
export function normalizeSlides(
  elements: HeroSlidesElements | null | undefined,
): NormalizedSlides {
  const slides = rawSlides(elements);
  if (slides.length >= MIN_HERO_SLIDES) {
    return { isSlideshow: true, slides, image: '' };
  }
  const portraitRaw = unwrap(elements?.portrait_image);
  const portrait = typeof portraitRaw === 'string' ? portraitRaw : '';
  if (portrait) return { isSlideshow: false, slides: [], image: portrait };
  const orphan = slides[0];
  const orphanImage = typeof orphan?.image === 'string' ? orphan.image : '';
  return {
    isSlideshow: false,
    slides: [],
    image: orphanImage,
    imageSlideId: orphanImage ? orphan?.id : undefined,
  };
}

/**
 * Add an image. From single-image state this PROMOTES to a slideshow:
 * slide 1 = the CURRENT NORMALIZED VISIBLE image (so a pre-existing single slide is
 * carried over, id and all, rather than discarded — only a never-rendered orphan
 * that lost the `portrait_image` tie-break is dropped, and it was invisible, so
 * nothing the user can see is lost). From an existing slideshow it APPENDS.
 *
 * At the cap it returns the set unchanged (never > MAX_HERO_SLIDES).
 */
export function promoteToSlides(
  elements: HeroSlidesElements | null | undefined,
  newImage: string,
): HeroSlidesPatch {
  const norm = normalizeSlides(elements);
  if (norm.isSlideshow) {
    if (norm.slides.length >= MAX_HERO_SLIDES) {
      return { kind: 'slides', slides: norm.slides };
    }
    return { kind: 'slides', slides: [...norm.slides, { id: newSlideId(), image: newImage }] };
  }
  const first: HeroSlide = { id: norm.imageSlideId || newSlideId(), image: norm.image };
  return { kind: 'slides', slides: [first, { id: newSlideId(), image: newImage }] };
}

/**
 * Drop back to a single image. The survivor becomes `portrait_image` and the
 * `slides` KEY is removed — NOT written as `[]` (note N5): `stampHeroSlides` skips
 * only on `Array.isArray(slides) && slides.length > 0`, so an empty array would be
 * re-stamped on a later collection run and the user's demote would silently undo
 * itself. The caller must therefore write elements WITHOUT the key (setSection),
 * which is exactly what `kind: 'single'` means.
 */
export function demoteToSingle(slides: HeroSlide[], removedId?: string): HeroSlidesPatch {
  const survivor = slides.find((s) => s.id !== removedId) ?? slides[0];
  return { kind: 'single', portraitImage: (survivor?.image as string) || '' };
}

/** Reorder (the phase-4 filmstrip's drop). Play order IS document order. */
export function reorderSlides(slides: HeroSlide[], from: number, to: number): HeroSlidesPatch {
  const next = [...slides];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) {
    return settle(next);
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return settle(next);
}

/** Swap ONE slide's image, order untouched. */
export function replaceSlide(slides: HeroSlide[], slideId: string, image: string): HeroSlidesPatch {
  return settle(slides.map((s) => (s.id === slideId ? { ...s, image } : s)));
}

/** Remove one slide. At length 2 this AUTO-DEMOTES (the invariant) — no confirm
 *  dialog anywhere; a single undo restores the whole gesture. */
export function removeSlide(slides: HeroSlide[], slideId: string): HeroSlidesPatch {
  const next = slides.filter((s) => s.id !== slideId);
  if (next.length < MIN_HERO_SLIDES) return demoteToSingle(slides, slideId);
  return settle(next);
}

/** The single choke point that enforces "never length 1" on every RETURN path. */
function settle(slides: HeroSlide[]): HeroSlidesPatch {
  if (slides.length < MIN_HERO_SLIDES) return demoteToSingle(slides);
  return { kind: 'slides', slides: slides.slice(0, MAX_HERO_SLIDES) };
}
