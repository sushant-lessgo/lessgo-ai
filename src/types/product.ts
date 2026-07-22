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
 * ===== TECHPREMIUM PALETTE / VARIANT =====
 * Product template for the hardware-founder persona. TWO palettes, one variant.
 * Applied via `[data-palette]` / `[data-variant]`.
 *  - forest: the original light warm-paper "control-room" system (forest +
 *    signal-lime). Source of truth: TechPremium.html (<head> :root). Kept
 *    value-identical at the token layer — it is the revert lever.
 *  - harbor: navy bands (hue 252) + brand-green signal + cool hue-240 neutrals,
 *    from the designer's `brand-palette` style block. The new default.
 */
export const techPremiumPalettes = ['forest', 'harbor'] as const;
export type TechPremiumPalette = (typeof techPremiumPalettes)[number];

/**
 * Palettes the in-editor theme picker may offer for TechPremium. Deliberately
 * NOT the full tuple: `harbor` is picker-HIDDEN so a click can never write
 * `Project.paletteId` on an existing row. Wired into
 * `PALETTES_BY_TEMPLATE.techpremium` (src/types/service.ts) — the real popover
 * source. Clicking the one `forest` swatch doubles as the manual revert lever.
 */
export const techPremiumPickerPalettes = ['forest'] as const;

export const techPremiumVariants = ['default'] as const;
export type TechPremiumVariant = (typeof techPremiumVariants)[number];

/** Default palette when none is picked or persisted. */
export const defaultTechPremiumPalette: TechPremiumPalette = 'harbor';

/** Default variant when none is picked or persisted. */
export const defaultTechPremiumVariant: TechPremiumVariant = 'default';

/**
 * ===== VESTRIA PALETTE / VARIANT =====
 * GA product template for B2B manufacturing / trade lead-gen (pilot: Golden Shadow
 * Trading — uniform manufacturing). Paper+dark editorial system with a cobalt
 * accent duo. Look system (onboarding2 Phase 5): typeface variants + accent
 * palettes + neutral mood (`data-mood` bone/slate — mood ids live in
 * modules/templates/vestria/tokens.ts, persisted via Project.themeValues).
 * Sources of truth: "Vestria - Uniform Manufacturing (Cobalt).html" (<head>
 * :root) + "Vestria - Uniform Manufacturing.html" (accent/type/surface variants).
 */
// The 8 accents mirror the mock's html[data-accent=...] blocks
// ("Vestria - Uniform Manufacturing.html"; `brass` = its :root default).
export const vestriaPalettes = [
  'cobalt',
  'brass',
  'emerald',
  'safety',
  'claret',
  'teal',
  'aubergine',
  'indigo',
] as const;
export type VestriaPalette = (typeof vestriaPalettes)[number];

/** Typeface variants: `tailored` = editorial baseline (Bodoni Moda + Hanken
 *  Grotesk — id is a hard rule, do NOT rename), `modern` (Space Grotesk +
 *  Hanken Grotesk), `heritage` (Cormorant Garamond + Source Serif 4). */
export const vestriaVariants = ['tailored', 'modern', 'heritage'] as const;
export type VestriaVariant = (typeof vestriaVariants)[number];

/** Default palette when none is picked or persisted. */
export const defaultVestriaPalette: VestriaPalette = 'cobalt';

/** Default variant when none is picked or persisted. */
export const defaultVestriaVariant: VestriaVariant = 'tailored';

/** Vestria hero variant (onboarding2 Axis B). Picked non-blockingly while copy
 *  streams; written into `content[heroId].layout` (the authoritative field the
 *  renderers read) at save time. Default = tailored (existing behavior).
 *  (Canonical home since scale-06 phase 10 retired useProductGenerationStore.) */
export type VestriaHeroVariant = 'VestriaTailoredHero' | 'VestriaFullBleedHero';

/** Vestria neutral mood (onboarding2 Axis A). Mirrors vestriaMoods in
 *  modules/templates/vestria/tokens.ts; persisted via Project.themeValues.mood.
 *  (Canonical home since scale-06 phase 10 retired useProductGenerationStore.) */
export type VestriaLookMood = 'bone' | 'slate';

/**
 * ===== MERIDIAN STRATEGY (P3 — generation wiring) =====
 * The assembled strategy passed from /api/audience/product/strategy into
 * /api/audience/product/generate-copy. = raw LLM output (ProductStrategyResponse:
 * awareness / oneReader / oneIdea / featureAnalysis) + the deterministic fixed
 * section list and block map. No vibe / section-decisions / uiblock-decisions —
 * the pilot makes no layout choices (see productStrategy.schema.ts).
 */
/**
 * One page of an agreed multi-page sitemap (newGeneration Phase 2). Produced by
 * clampSitemap (server is the law over the LLM proposal), edited by the user in
 * the SitemapReviewStep, consumed by the per-page copy fan-out (Phase 3).
 * sections are BODY-ONLY types (chrome is shared, injected at page boundaries).
 */
export interface SitemapPage {
  archetypeKey: string;
  title: string;
  pathSlug: string;
  sections: string[];
  /** AI rationale shown in the review UI (not persisted downstream). */
  reason?: string;
}

export interface ProductStrategyOutput extends ProductStrategyResponse {
  sections: string[]; // top-level (home incl. chrome): header + home body + footer
  uiblocks: Record<string, string>; // section type → layout name (PascalCase)
  /** Present only when the template has a page-archetype menu (vestria).
   *  [0] is always home. Absent for single-page templates (meridian). */
  sitemap?: SitemapPage[];
}
