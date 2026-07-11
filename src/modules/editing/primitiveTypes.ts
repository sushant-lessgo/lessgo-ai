/**
 * Edit-primitive interface (editor phase-3, phase 4).
 *
 * PLAIN module — published-safe, NO 'use client'. BOTH the edit renderer and the
 * published renderer import from here, so it must contain only types + pure data
 * (no React, no hooks, no client-only APIs).
 *
 * Editing behavior lives in platform primitives; templates only DECLARE which
 * primitive each slot uses (see `docs/tracks/editorPlan.md` — the edit-primitive
 * vocabulary). This file is that shared contract; phases 5 (`logo`) and 6
 * (`imageCollection`) consume it.
 */

/**
 * The closed set of edit primitives (~10 ever) per the editorPlan vocabulary table.
 * Templates declare a slot's `kind`; the platform primitive owns all editing UI.
 */
export type PrimitiveKind =
  | 'text'
  | 'image'
  | 'imageCollection'
  | 'logo'
  | 'button'
  | 'link'
  | 'collection'
  | 'form';

/**
 * A slot declaration: a template says "this slot is edited by primitive X" plus
 * optional capacity/shape hints the primitive enforces (min/max items, aspect).
 * Templates DECLARE; primitives IMPLEMENT.
 */
export interface PrimitiveSlot {
  kind: PrimitiveKind;
  /** Minimum item count (collection / imageCollection). */
  min?: number;
  /** Maximum item count (collection / imageCollection). */
  max?: number;
  /** Preferred aspect ratio hint, e.g. '16/9' (image / imageCollection). */
  aspect?: string;
}

/**
 * One item in an `imageCollection` (hero slider · portfolio grid · gallery · logo
 * wall). `alt`/`caption` are per-item; the canonical alt store is
 * `elementMetadata[collectionKey].alt[id]` (2026-07-11 alt-text law) — `alt` here
 * is the sibling-derived fallback shape a block may carry inline.
 */
export interface ImageCollectionItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

/**
 * Target render surface for a logo. Header renders on a LIGHT surface; footer on a
 * DARK surface (founder requirement 2026-07-11). `resolveLogo` (phase 5) consumes
 * this to pick the surface-appropriate asset.
 */
export type Surface = 'light' | 'dark';

/**
 * Site-scoped logo value (one value, nav + footer derive).
 *
 * Founder requirement (2026-07-11): one asset does NOT suffice — a dark-colored
 * mark vanishes on the dark footer surface. So the value carries an optional
 * dark-surface variant:
 *  - `url`      — primary, LIGHT-surface asset (header).
 *  - `darkUrl`  — optional DARK-surface asset (footer). Footer falls back to `url`
 *                 when unset.
 *  - `wordmark` — text fallback when no image asset exists.
 *
 * Phase 4 defines the TYPE ONLY. The store-persistence mechanism (an explicit dark
 * field vs a CSS-treatment approach) is decided at the phase-5 gate; this shape is
 * expressive enough to support either without a breaking change.
 */
export interface LogoValue {
  url?: string;
  darkUrl?: string;
  wordmark?: string;
}
