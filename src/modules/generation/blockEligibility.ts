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
import { pickSeeded } from '@/modules/generation/spread';

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
  /**
   * template-factory phase 10 — OPTIONAL spread seed (the project token). When
   * present, `pickFromSet` picks a SEEDED choice among the ELIGIBLE variants
   * (deterministic per token; spreads across tokens) instead of always the
   * declaration-first eligible one. ABSENT ⇒ the legacy deterministic path is
   * byte-identical (default-first → first-eligible → default), so every existing
   * caller/test is unaffected. Copy never changes: co-eligible variants that
   * spread here share a `copyShape`/consumes contract (variant-swap-integrity).
   */
  seed?: string;
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
  // SLOT (work-skeleton phase 1) — a declared-but-not-built capability is NEVER
  // eligible: no component exists to render it. This is the single generation-side
  // slot filter; `pickFromSet`/`selectEligibleBlock` ride on it, so a slot can
  // never be generated or selected as a section's block.
  if (decl.slot) return false;
  return capacityFits(decl, input.cardCountHint) && assetNeedsMet(decl, input.assetFacts);
}

/**
 * Pick a layout name from a resolved SectionBlockSet (exported for tests).
 *
 * WITHOUT a seed (legacy, byte-identical): default if eligible → else first
 * eligible in declaration order → else default.
 *
 * WITH a seed (phase-10 spread): pick a SEEDED choice among ALL eligible
 * variants (default included in the pool) → else default. Same token → same
 * pick (reproducible); different tokens spread across the eligible set. Salted
 * by `set.default` so each section draws independently from the same token.
 *
 * NEVER returns undefined; always a VALID eligible (or default) layout name.
 */
export function pickFromSet(set: SectionBlockSet, input: EligibilityInput = {}): string {
  if (input.seed !== undefined) {
    const eligibleNames = set.variants
      .filter((v) => isBlockEligible(v, input))
      .map((v) => v.layoutName);
    if (eligibleNames.length === 0) return set.default;
    return pickSeeded(eligibleNames, input.seed, `block:${set.default}`) ?? set.default;
  }

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

// ── copy-compatibility (variant-swap-integrity phase 2) ─────────────────────
// Editor variant swaps must never silently drop a present copy value or render
// an empty block. Two guards, ONE home (this module) so the picker's runtime
// filter and the conformance check cannot drift apart:
//   • isCopyCompatible — RUNTIME predicate over a section's LIVE elements.
//   • findIncompatibleCoEligiblePairs — STATIC pairwise helper for the
//     conformance test (which injects a schema-based classifier).

/** A present element value is non-empty (arrays iff length>0, strings iff trimmed non-empty). */
function isPresentValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true; // non-nullish number / boolean / object
}

/**
 * RUNTIME copy-compat predicate (ASYMMETRIC). Given a section's LIVE elements,
 * decide whether swapping the section to target block `decl` is safe. Target is
 * OFFERED iff BOTH:
 *   (i)  NO SILENT SCALAR DROP — every present, non-empty SCALAR (non-array) key
 *        of the section ∈ consumes(decl). Array/collection keys are EXEMPT.
 *   (ii) NON-EMPTY RENDER — consumes(decl) ∩ presentKeys ≠ ∅ (renders ≥1 present key).
 * There is deliberately NO `consumes(decl) ⊆ present` condition — that would
 * wrongly hide superset-consumes variants (e.g. vestria Tailored → FullBleed,
 * whose extra hero_video_* keys are optional-and-absent).
 *
 * Array-key exemption: safe today because clampSectionCards truncates every
 * top-level array on swap and no current pair renders a DIFFERENT collection key
 * — a future pair reading a different collection key would silently non-render
 * it, at which point collection-key handling must be added here.
 *
 * NOTE: this runtime classification judges arrayness by VALUE (Array.isArray),
 * whereas the static conformance check (findIncompatibleCoEligiblePairs) judges
 * it by SCHEMA. The two methods are intentionally distinct and are bridged by
 * check (e)'s consistency assertion.
 *
 * FIREWALL-safe: pure data logic; no component/schema imports.
 */
export function isCopyCompatible(
  decl: BlockDeclaration,
  sectionElements: Record<string, unknown> | null | undefined
): boolean {
  const elements = sectionElements ?? {};
  const consumes = new Set(decl.consumes);
  const presentKeys: string[] = [];

  for (const [key, value] of Object.entries(elements)) {
    if (!isPresentValue(value)) continue;
    presentKeys.push(key);
    const isCollection = Array.isArray(value);
    // (i) present, non-empty SCALAR not consumed by target ⇒ silent copy drop.
    if (!isCollection && !consumes.has(key)) return false;
  }

  // (ii) non-empty render: at least one present key is consumed by the target.
  return presentKeys.some((k) => consumes.has(k));
}

/** Classification of a consumed element key, injected by the static test. */
export type ConsumedKeyKind = 'scalar' | 'collection';

/** A both-ways scalar-divergent co-eligible variant pair (conformance failure). */
export interface IncompatibleVariantPair {
  a: string;
  b: string;
}

/** Asset facts with every kind present — used to gate STATIC co-eligibility. */
const ALL_ASSETS_PRESENT: AssetFacts = {
  hasPhotos: true,
  hasLogos: true,
  hasTestimonials: true,
  hasTestimonialPhotos: true,
};

/**
 * STATIC conformance helper (drives conformance check (e)). For ONE
 * SectionBlockSet, return every CO-ELIGIBLE variant pair that is BOTH-WAYS
 * scalar-divergent — i.e. genuinely incompatible (no lossless swap in either
 * direction). Such a pair MUST be split by distinct `copyShape` tags.
 *
 * Co-eligible = SAME `copyShape` group AND both pass `isBlockEligible` under
 * identical (all-present) asset facts (`internalDispatch` is NOT exempt).
 * Both-ways scalar-divergent = A consumes a SCALAR key ∉ consumes(B) AND B
 * consumes a SCALAR key ∉ consumes(A). Superset/equal pairs are one-way (or
 * zero-way) divergent and PASS.
 *
 * `classify(layoutName, key)` reports whether a consumed key is scalar or a
 * collection per the STATIC element schema. It is injected by the caller (the
 * test) so THIS runtime module imports no schema — the firewall stays intact.
 */
export function findIncompatibleCoEligiblePairs(
  set: SectionBlockSet,
  classify: (layoutName: string, key: string) => ConsumedKeyKind
): IncompatibleVariantPair[] {
  const variants = set.variants;
  const out: IncompatibleVariantPair[] = [];

  const scalarConsumes = (decl: BlockDeclaration): string[] =>
    decl.consumes.filter((k) => classify(decl.layoutName, k) === 'scalar');

  for (let i = 0; i < variants.length; i++) {
    for (let j = i + 1; j < variants.length; j++) {
      const A = variants[i];
      const B = variants[j];

      // Co-eligibility gate: same copyShape group + both asset-eligible.
      if ((A.copyShape ?? undefined) !== (B.copyShape ?? undefined)) continue;
      if (!isBlockEligible(A, { assetFacts: ALL_ASSETS_PRESENT })) continue;
      if (!isBlockEligible(B, { assetFacts: ALL_ASSETS_PRESENT })) continue;

      const aConsumes = new Set(A.consumes);
      const bConsumes = new Set(B.consumes);
      const aDropsIntoB = scalarConsumes(A).some((k) => !bConsumes.has(k));
      const bDropsIntoA = scalarConsumes(B).some((k) => !aConsumes.has(k));
      if (aDropsIntoB && bDropsIntoA) out.push({ a: A.layoutName, b: B.layoutName });
    }
  }
  return out;
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

  // ── capability ≠ content (proof-truth spec, acceptance criterion 3) ──────────
  // `proofAvailable` is a CAPABILITY-HINT list ("what assets does this business
  // have"), NOT evidence that proof CONTENT exists. Per-field decisions:
  //
  //  • hasPhotos / hasLogos — pure LAYOUT-capability hints. They only pick which
  //    block variant renders (photo-led vs text-led, logo-wall); they do NOT make
  //    the AI fabricate a proof CLAIM. Reading the capability-hint list here is
  //    correct → LEFT AS capability hints.
  //  • hasTestimonials — CONTENT-claiming (real verbatim quotes). It must derive
  //    ONLY from actually-captured quotes (`facts.entry.testimonials`), NEVER from
  //    `proofAvailable`. The user's *conscious* proof toggle is carried separately
  //    by the route-level `proof` object (section-inclusion gate — sectionGrammar.ts:74
  //    / parseStrategyProduct.ts:43); it does NOT reach this Brief seam (BriefSchema
  //    has no confirmed-proof boolean), so we derive from captured quotes only and
  //    do NOT invent new plumbing in this phase.
  //  • hasTestimonialPhotos — gates the photo-testimonial variant; also CONTENT-
  //    claiming (a fabricated person WITH a photo). Same rule: require real captured
  //    testimonials; `photo` stays a capability hint for the photo dimension.
  return {
    hasPhotos: proofHas('photo') || proofHas('image') || proofHas('gallery'),
    hasLogos: proofHas('logo'),
    hasTestimonials: entryTestimonials.length > 0,
    hasTestimonialPhotos: entryTestimonials.length > 0 && proofHas('photo'),
  };
}
