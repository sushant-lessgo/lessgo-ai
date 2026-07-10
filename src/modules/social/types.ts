// src/modules/social/types.ts
// Closed vocabularies + the normalized BrandContext shape for the social-posts
// feature. PURE TYPES + `as const` data — no runtime imports, safe to read from
// server routes, pure modules, and (later) client components alike.
//
// Every BrandContext field is optional: `buildBrandContext` degrades gracefully
// for any audience/template (product / service / writer / bare-brief drafts),
// so consumers must tolerate a partial context rather than assume presence.

/** Social platforms the engine targets. Phase 6 activates x + facebook (data only). */
export type Platform = 'linkedin' | 'x' | 'facebook';

/** Post angle presets (phase 3 maps each → an instruction snippet). */
export type Archetype =
  | 'inspirational'
  | 'product_spotlight'
  | 'testimonial_quote'
  | 'tip'
  | 'announcement';

/**
 * Generation input mode:
 * - `archetype`         — brand summary + archetype instruction only
 * - `archetype_context` — same + user free-text fresh context
 * - `polish`            — brand voice + rewrite-this-draft (no archetype)
 */
export type Mode = 'archetype' | 'archetype_context' | 'polish';

/** One normalized feature/benefit pair (from onboarding OR a content section). */
export interface BrandFeature {
  feature: string;
  benefit: string;
}

/**
 * One normalized testimonial. Camel-cased + shape-unified across the two
 * storage layouts (product collection `author_name/author_role`; service flat
 * block `author_name/author_role/author_company`). `authorRole`/`authorCompany`
 * are optional because not every source carries them.
 */
export interface BrandTestimonial {
  quote: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
}

/** One social profile link (from `Brief.socialProfiles`). */
export interface BrandSocialProfile {
  platform: string;
  url: string;
}

/**
 * Prompt-ready, audience-agnostic distillation of a Project's stored brand data.
 * Assembled READ-ONLY by `buildBrandContext`. All fields optional-tolerant —
 * a bare project with only a `brief` yields a usable partial context.
 */
export interface BrandContext {
  businessName?: string;
  oneLiner?: string;
  category?: string;
  goal?: string;
  offer?: string;
  audience?: string;
  brandTone?: string;
  /** Loose bag of brand facts carried verbatim from `Brief.facts`. */
  facts?: Record<string, unknown>;
  /** Always an array (never undefined) — empty when no features exist. */
  features: BrandFeature[];
  /** Always an array (never undefined) — empty when no testimonials exist. */
  testimonials: BrandTestimonial[];
  /** Always an array (never undefined) — empty when no profiles exist. */
  socialProfiles: BrandSocialProfile[];
}
