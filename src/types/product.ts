// src/types/product.ts
// Product-route types — Meridian template (Meridian migration P0).
// Mirrors the palette section of types/service.ts (Hearth).
// 3-tier model: audienceType='product' → templateId='meridian' → variantId + paletteId.
// Source of truth: "Meridian - Modern Tech.html" (<head> palettes/variants).

import type { ProductStrategyResponse } from '@/lib/schemas/productStrategy.schema';

/**
 * ===== MERIDIAN PALETTE =====
 * 9 accent hues. User picks the hue; chroma/lightness held per variant.
 * Applied via `[data-palette]`. `mint` is the default ("classic modern-tech").
 */
export const meridianPalettes = [
  'mint',
  'cyan',
  'blue',
  'violet',
  'rose',
  'orange',
  'amber',
  'lime',
  'bone',
] as const;

export type MeridianPalette = (typeof meridianPalettes)[number];

/**
 * ===== MERIDIAN VARIANT =====
 * Pure token/mood swap over the same DNA, applied via `[data-variant]`.
 *  - developer (default): mono-forward, dense, hairlines, terminal precision.
 *  - marketing: softer rhythm, less mono, larger radii, more breath.
 *  - light: full light-mode inversion, hairlines preserved.
 */
export const meridianVariants = ['developer', 'marketing', 'light'] as const;

export type MeridianVariant = (typeof meridianVariants)[number];

/** Default palette when none is picked or persisted. */
export const defaultMeridianPalette: MeridianPalette = 'mint';

/** Default variant when none is picked or persisted. */
export const defaultMeridianVariant: MeridianVariant = 'developer';

/**
 * ===== MERIDIAN STRATEGY (P3 — generation wiring) =====
 * The assembled strategy passed from /api/audience/product/strategy into
 * /api/audience/product/generate-copy. = raw LLM output (ProductStrategyResponse:
 * awareness / oneReader / oneIdea / featureAnalysis) + the deterministic fixed
 * section list and block map. No vibe / section-decisions / uiblock-decisions —
 * the pilot makes no layout choices (see productStrategy.schema.ts).
 */
export interface ProductStrategyOutput extends ProductStrategyResponse {
  sections: string[]; // fixed 7: header, hero, features, testimonials, pricing, cta, footer
  uiblocks: Record<string, string>; // section type → Meridian layout name (PascalCase)
}
