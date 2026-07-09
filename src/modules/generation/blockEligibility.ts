// src/modules/generation/blockEligibility.ts
// scale-09 phase 4 — DETERMINISTIC block eligibility filter at assembly.
//
// Given a template + section type, pick which declared block (variant) renders
// the section. Selection is a pure function of two OPTIONAL, deterministically
// derived signals — a card-count capacity hint and normalized asset facts.
// NO AI, NO randomness. When nothing eligible (or no signal), the section's
// declared default is returned — selection NEVER fails generation.
//
//   eligible(variant) = capacityFits(cardCountHint) ∧ assetNeedsMet(assetFacts)
//   selectEligibleBlock: default if eligible → else first eligible (declaration
//   order) → else default.
//
// ── FIREWALL (load-bearing) ─────────────────────────────────────────────────
// PURE. Imports ONLY the pure-data block manifest (`blockManifest.ts`) + TYPES
// (erased at compile time). It must NOT import any component, `.tsx`,
// `'use client'` module, resolver, or element schema — so server-side selection
// code (parseStrategy*, mock generators, fan-out assembly) can call it without
// dragging any template component into the bundle.

import type { AssetKind, BlockDeclaration, SectionBlockSet } from '@/modules/templates/blockManifest';
import { blockManifests } from '@/modules/templates/blockManifest';
import type { TemplateId, ServiceAssetInput } from '@/types/service';
import type { Brief } from '@/types/brief';

/**
 * Normalized asset facts — typed booleans unifying the service typed asset
 * booleans (`ServiceAssetInput`) and the product loose Brief (`proofAvailable`
 * + `facts`). Keys stay in sync with `AssetKind` in blockManifest.ts
 * (`hasTestimonials` is carried for derivation completeness; only the AssetKind
 * keys gate eligibility). A variant's `requiresAssets: AssetKind[]` is satisfied
 * when every listed kind's corresponding fact is `true`.
 */
export interface AssetFacts {
  hasPhotos: boolean;
  hasLogos: boolean;
  hasTestimonials: boolean;
  hasTestimonialPhotos: boolean;
}

/** Map an AssetKind (manifest `requiresAssets`) → its AssetFacts boolean. */
function assetFactForKind(kind: AssetKind, facts: AssetFacts): boolean {
  switch (kind) {
    case 'photos':
      return facts.hasPhotos;
    case 'logos':
      return facts.hasLogos;
    case 'testimonialPhotos':
      return facts.hasTestimonialPhotos;
    default:
      return false;
  }
}

export interface EligibilityInput {
  /** Card count of the section's primary collection (e.g. features.length). */
  cardCountHint?: number;
  /** Normalized asset presence facts. */
  assetFacts?: AssetFacts;
}

/**
 * A variant's capacity is met when: no capacity declared, OR no hint provided
 * (absent hint ⇒ never filters — the default block wins), OR the hint falls
 * within [minCards, maxCards].
 */
function capacityFits(decl: BlockDeclaration, cardCountHint?: number): boolean {
  if (!decl.capacity) return true;
  if (cardCountHint === undefined) return true;
  return cardCountHint >= decl.capacity.minCards && cardCountHint <= decl.capacity.maxCards;
}

/**
 * A variant's asset needs are met when it declares no `requiresAssets`, OR every
 * required AssetKind is `true` in the provided facts. Absent facts ⇒ any asset
 * requirement is UNMET (conservative: a photo-led variant does not slip in when
 * we have no evidence of photos).
 */
function assetNeedsMet(decl: BlockDeclaration, assetFacts?: AssetFacts): boolean {
  const required = decl.requiresAssets;
  if (!required || required.length === 0) return true;
  if (!assetFacts) return false;
  return required.every((kind) => assetFactForKind(kind, assetFacts));
}

/** Pure eligibility predicate over a single declaration (exported for tests). */
export function isBlockEligible(decl: BlockDeclaration, input: EligibilityInput = {}): boolean {
  return capacityFits(decl, input.cardCountHint) && assetNeedsMet(decl, input.assetFacts);
}

/**
 * Pick a layout name from a resolved SectionBlockSet (exported for tests):
 * default if eligible → else first eligible in declaration order → else default.
 * NEVER returns undefined.
 */
export function pickFromSet(set: SectionBlockSet, input: EligibilityInput = {}): string {
  const defaultDecl = set.variants.find((v) => v.layoutName === set.default);
  if (defaultDecl && isBlockEligible(defaultDecl, input)) return set.default;

  const firstEligible = set.variants.find((v) => isBlockEligible(v, input));
  if (firstEligible) return firstEligible.layoutName;

  return set.default;
}

/**
 * Deterministically select the layout name for (templateId, sectionType).
 * Returns `null` when no manifest entry exists — the caller then falls back to
 * its legacy per-template layout name map (A1 guardrail: manifest is additive).
 */
export function selectEligibleBlock(
  templateId: TemplateId | string | null | undefined,
  sectionType: string,
  input: EligibilityInput = {}
): string | null {
  const manifest = templateId ? blockManifests[templateId as TemplateId] : undefined;
  const set = manifest?.[sectionType];
  if (!set) return null;
  return pickFromSet(set, input);
}

/** Normalized asset facts from the service typed asset booleans. */
export function deriveAssetFactsFromServiceAssets(assets: ServiceAssetInput): AssetFacts {
  return {
    hasPhotos: !!(assets.hasTeamPhotos || assets.hasFounderPhoto),
    hasLogos: !!assets.hasClientLogos,
    hasTestimonials: !!assets.hasTestimonials,
    hasTestimonialPhotos: !!assets.hasTestimonials && assets.testimonialType === 'photos',
  };
}

/**
 * Normalized asset facts from the product Brief. Reads the top-level
 * `proofAvailable` string list (kinds like "testimonials", "client logos") and
 * the loose `facts.entry.testimonials` list. Purely additive / defensive — no
 * existing declaration requires assets, so this never changes today's output.
 */
export function deriveAssetFactsFromBrief(brief: Brief | null | undefined): AssetFacts {
  const proof = Array.isArray(brief?.proofAvailable) ? brief!.proofAvailable! : [];
  const proofHas = (needle: string) => proof.some((p) => p.toLowerCase().includes(needle));

  const factsEntry = (brief?.facts?.['entry'] ?? null) as { testimonials?: unknown } | null;
  const entryTestimonials =
    factsEntry && Array.isArray(factsEntry.testimonials) ? factsEntry.testimonials : [];

  return {
    hasPhotos: proofHas('photo') || proofHas('image') || proofHas('gallery'),
    hasLogos: proofHas('logo'),
    hasTestimonials: proofHas('testimonial') || entryTestimonials.length > 0,
    hasTestimonialPhotos: proofHas('testimonial') && proofHas('photo'),
  };
}
