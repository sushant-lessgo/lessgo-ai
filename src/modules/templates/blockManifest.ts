// src/modules/templates/blockManifest.ts
// scale-09 phase 2 — the D18 block-declaration surface as PURE DATA.
//
// This module is the statically-importable half of template registration: it
// declares, per template + section type, the copy-compatible blocks (variants)
// that may render that section, their default, and the deterministic-selection
// metadata (capacity / required assets) used by later phases. It is deliberately
// SEPARATE from the scale-01 registry (whose entries are async dynamic-import
// LOADERS behind the bundle firewall) so server-side generation/selection code
// can import declarations WITHOUT dragging any template component into the
// bundle. See docs/task/scale-09-block-variants.plan.md phase 2.
//
// ── FIREWALL (load-bearing) ─────────────────────────────────────────────────
// PURE DATA. Imports ONLY the `TemplateId` TYPE (erased at compile time). It
// must NOT import any component, `.tsx`, `'use client'` module, resolver, or
// element schema. `consumes` keys are HARD-CODED (not derived) so this file
// stays a leaf on the import graph and the conformance test (blockManifest.test)
// genuinely verifies them against the element contract rather than tautologically.
//
// ── consumes key sourcing ───────────────────────────────────────────────────
// Each declaration's `consumes` = the block's own top-level element keys, copied
// verbatim from the canonical element schemas (cited per section below):
//   product: src/modules/audience/product/elementSchema.ts
//            (meridianElementSchema / vestriaElementSchema)
//   service: src/modules/audience/service/elementSchema.ts (serviceElementSchema)
// The conformance test proves `consumes ⊆ getAllElements(contract)` — product
// contract via resolveEngineSectionSchema(layoutName) (the meridian∪vestria
// thing-engine union), service contract via the block's own layout schema.

import type { TemplateId } from '@/types/service';
// Work-skeleton manifest is PURE DATA (no component/schema import) — safe here.
import { workSkeletonManifest } from '@/modules/skeletons/work/manifest';

/** Asset facts a variant may require to be eligible (phase 4 uses these). */
export type AssetKind = 'photos' | 'logos' | 'testimonialPhotos';

/** One declared block that can render a section (a "variant"). */
export interface BlockDeclaration {
  /** Stored layout name — the schema + dispatch key. */
  layoutName: string;
  /** Editor swap-card title. */
  label: string;
  /** Editor swap-card sub-copy. */
  blurb?: string;
  /**
   * Canonical element keys this block consumes — MUST be ⊆ the section's element
   * contract (copy-compatibility D18). A variant may consume union-sourced keys
   * another template contributed; it may NOT invent keys.
   */
  consumes: string[];
  /**
   * Copy-shape group (variant-swap-integrity phase 2). Variants in one section
   * that carry DIFFERENT `copyShape` values are declared CONTENT-EXCLUSIVE:
   * they read fundamentally different copy (e.g. a multi-review grid vs a single
   * pull-quote) so swapping between them would drop scalar copy in BOTH
   * directions. Such pairs are NEVER co-offered at runtime (picker copyShape
   * filter) and are excluded from the conformance both-ways-divergence check (e).
   * `undefined` = the set's default group. Tag ONLY genuinely both-ways-scalar-
   * divergent pairs (surge testimonials); superset-compatible pairs (vestria
   * hero, meridian skins) stay untagged and freely swappable.
   */
  copyShape?: string;
  /** Card-count capacity of the block's primary collection (deterministic-selection hint). */
  capacity?: { minCards: number; maxCards: number };
  /** Asset facts required for this variant to be eligible at selection. */
  requiresAssets?: AssetKind[];
  /**
   * True when this variant shares ONE dispatcher component with its siblings
   * (surge testimonials, vestria hero) that branches internally on the stored
   * layout — as opposed to registry-level variant dispatch. The phase-3
   * distinctness guard exempts these (they resolve to the SAME component).
   */
  internalDispatch?: boolean;
  /**
   * SLOT (work-skeleton phase 1) — a DECLARED-but-NOT-BUILT capability: this
   * layout name is reserved (e.g. a future video-bg hero) but has NO component
   * yet. A slot is metadata only. It is NEVER offered in the editor picker,
   * NEVER generated (`isBlockEligible` returns false), NEVER counted as a "real"
   * (built) variant, and is SKIPPED by the conformance resolution/distinctness/
   * consumes/copyShape walks (it has no resolvable component or contract).
   * INVARIANT: a slot must NEVER be a set's `default`.
   */
  slot?: true;
}

/** Per-section-type declaration: the default layout + all declared variants. */
export interface SectionBlockSet {
  /** Default layout name — MUST appear among `variants[].layoutName`. */
  default: string;
  variants: BlockDeclaration[];
}

/** A template's full block manifest, keyed by section type. */
export type TemplateBlockManifest = Record<string, SectionBlockSet>;

// ── slot helpers (work-skeleton phase 1) — pure data, safe to import from the
//    client editor UI (this module is a leaf on the import graph) ─────────────

/**
 * The BUILT (non-slot) variants of a set — the ones that have a real component,
 * are offered/generated, and count toward "does this section have >1 variant".
 * Byte-neutral for every existing manifest (nothing declares `slot` yet).
 */
export function builtVariants(set: SectionBlockSet): BlockDeclaration[] {
  return set.variants.filter((v) => !v.slot);
}

/** Count of BUILT (non-slot) variants — a slot must not inflate this count. */
export function builtVariantCount(set: SectionBlockSet): number {
  return builtVariants(set).length;
}

/**
 * INVARIANT probe: does the set's `default` name a SLOT declaration? MUST always
 * be false — a slot (declared-but-not-built) can never be a set default.
 */
export function defaultIsSlot(set: SectionBlockSet): boolean {
  return set.variants.some((v) => v.layoutName === set.default && v.slot === true);
}

// ── meridian (product / thing engine) ───────────────────────────────────────
// Source: meridianElementSchema (MERIDIAN_LAYOUT_NAMES). One declared variant
// per section this phase; the 3 real meridian variants land in phase 6.
const meridianManifest: TemplateBlockManifest = {
  header: {
    default: 'MeridianNavHeader',
    variants: [
      {
        layoutName: 'MeridianNavHeader',
        label: 'Hairline nav',
        consumes: ['logo_text', 'cta_text', 'cta_href', 'signin_text', 'signin_url', 'logo_image'],
      },
    ],
  },
  hero: {
    default: 'TerminalHero',
    variants: [
      {
        layoutName: 'TerminalHero',
        label: 'Terminal hero',
        consumes: [
          'status_text', 'audience_tag', 'headline', 'lede', 'cta_text',
          'cta_subtext', 'secondary_cta_text', 'caption', 'hero_image',
        ],
      },
      // scale-09 phase 6 — photo-led hero skin (same slots as TerminalHero;
      // hero_image is already in TerminalHero's consumes / the hero contract).
      // Offered only once a hero image exists (requiresAssets: photos).
      {
        layoutName: 'EditorialPhotoHero',
        label: 'Editorial photo hero',
        blurb: 'Photo-led split hero — needs a hero image.',
        consumes: [
          'status_text', 'audience_tag', 'headline', 'lede', 'cta_text',
          'cta_subtext', 'secondary_cta_text', 'caption', 'hero_image',
        ],
        requiresAssets: ['photos'],
      },
    ],
  },
  features: {
    default: 'HairlineFeatureGrid',
    variants: [
      {
        layoutName: 'HairlineFeatureGrid',
        label: 'Hairline feature grid',
        consumes: ['eyebrow', 'headline', 'lede'],
        capacity: { minCards: 3, maxCards: 9 },
      },
      // scale-09 phase 6 — full-width hairline ledger skin (same slots).
      {
        layoutName: 'LedgerFeatureList',
        label: 'Ledger list',
        blurb: 'Full-width hairline rows — reads like schematic docs.',
        consumes: ['eyebrow', 'headline', 'lede'],
        capacity: { minCards: 3, maxCards: 9 },
      },
    ],
  },
  testimonials: {
    default: 'ProofWithLogoRail',
    variants: [
      {
        layoutName: 'ProofWithLogoRail',
        label: 'Proof with logo rail',
        consumes: ['eyebrow', 'headline'],
        capacity: { minCards: 1, maxCards: 3 },
      },
      // scale-09 phase 6 — centered editorial skin (same slots; optional
      // stats/logos bands omit when empty).
      {
        layoutName: 'CenteredEditorialTestimonials',
        label: 'Centered editorial',
        blurb: 'One dominant pull-quote, centered, with optional stats + logos.',
        consumes: ['eyebrow', 'headline'],
        capacity: { minCards: 1, maxCards: 3 },
      },
    ],
  },
  pricing: {
    default: 'ThreeTierPricing',
    variants: [
      {
        layoutName: 'ThreeTierPricing',
        label: 'Three-tier pricing',
        consumes: ['eyebrow', 'headline', 'lede'],
        capacity: { minCards: 2, maxCards: 3 },
      },
    ],
  },
  cta: {
    default: 'ArcCTA',
    variants: [
      {
        layoutName: 'ArcCTA',
        label: 'Arc CTA',
        consumes: ['eyebrow', 'headline', 'body', 'cta_text', 'secondary_cta_text', 'phone_line'],
      },
    ],
  },
  footer: {
    default: 'HairlineFooter',
    variants: [
      {
        layoutName: 'HairlineFooter',
        label: 'Hairline footer',
        consumes: [
          'wordmark', 'logo_image', 'tag', 'blurb', 'contact_address', 'contact_tel',
          'contact_email', 'newsletter_placeholder', 'newsletter_cta', 'copyright',
          'location', 'whatsapp_number', 'whatsapp_prefill', 'whatsapp_label',
        ],
      },
    ],
  },
};

// ── hearth (service flagship) ───────────────────────────────────────────────
// Source: serviceElementSchema (PILOT_LAYOUT_NAMES core 7). One declared variant
// per section this phase; the 3 real hearth variants land in phase 7.
const hearthManifest: TemplateBlockManifest = {
  header: {
    default: 'WarmNavHeader',
    variants: [
      {
        layoutName: 'WarmNavHeader',
        label: 'Warm nav',
        consumes: ['logo_text', 'cta_text', 'logo_image'],
      },
    ],
  },
  hero: {
    default: 'PetalFramedHero',
    variants: [
      {
        layoutName: 'PetalFramedHero',
        label: 'Petal-framed hero',
        consumes: [
          'eyebrow', 'headline', 'lede', 'cta_text', 'cta_subtext',
          'secondary_cta_text', 'hero_image', 'meta',
        ],
      },
    ],
  },
  services: {
    default: 'IconServiceCards',
    variants: [
      {
        layoutName: 'IconServiceCards',
        label: 'Icon service cards',
        consumes: ['eyebrow', 'headline', 'lede'],
        capacity: { minCards: 3, maxCards: 6 },
      },
    ],
  },
  testimonials: {
    default: 'PullQuoteWithMark',
    variants: [
      {
        layoutName: 'PullQuoteWithMark',
        label: 'Pull quote',
        consumes: [
          'eyebrow', 'quote', 'author_name', 'author_role',
          'author_company', 'author_photo', 'meta',
        ],
      },
    ],
  },
  packages: {
    default: 'TieredPackages',
    variants: [
      {
        layoutName: 'TieredPackages',
        label: 'Tiered packages',
        consumes: ['eyebrow', 'headline', 'lede'],
        capacity: { minCards: 1, maxCards: 3 },
      },
    ],
  },
  cta: {
    default: 'BookCallCTA',
    variants: [
      {
        layoutName: 'BookCallCTA',
        label: 'Book-a-call CTA',
        consumes: ['eyebrow', 'headline', 'lede', 'cta_text', 'secondary_cta_text', 'meta'],
      },
    ],
  },
  footer: {
    default: 'ContactFooterRich',
    variants: [
      {
        layoutName: 'ContactFooterRich',
        label: 'Rich contact footer',
        consumes: [
          'tagline', 'contact_email', 'contact_phone', 'address', 'copyright',
          'whatsapp_number', 'whatsapp_label', 'whatsapp_prefill', 'links_heading', 'logo_image',
        ],
      },
    ],
  },
};

// ── surge (service) — testimonials only ─────────────────────────────────────
// Declares the two testimonials variants so phase 1's deterministic default
// (ReviewGrid) becomes DECLARED. internalDispatch: these share surge's
// SurgeTestimonials dispatcher (branches on stored layout). Partial manifest —
// surge's other sections fall back to the name map (PILOT_LAYOUT_NAMES) in later
// phases. Source: serviceElementSchema (ReviewGrid / PullQuoteWithMark).
const surgeManifest: TemplateBlockManifest = {
  testimonials: {
    default: 'ReviewGrid',
    variants: [
      {
        layoutName: 'ReviewGrid',
        label: 'Review grid',
        blurb: 'Multi-proof grid — best when you have several quotes.',
        // copyShape 'reviews': section-scalar copy is eyebrow/headline + a
        // reviews[] collection. Both-ways scalar-divergent from PullQuote
        // (headline ∉ PullQuote; quote/author_* ∉ ReviewGrid) → content-exclusive.
        copyShape: 'reviews',
        consumes: ['eyebrow', 'headline'],
        capacity: { minCards: 1, maxCards: 3 },
        internalDispatch: true,
      },
      {
        layoutName: 'PullQuoteWithMark',
        label: 'Pull quote',
        blurb: 'One standout quote with a mark.',
        // copyShape 'pullquote': a single quote + author scalars — no headline,
        // no collection. Distinct group from ReviewGrid (see above).
        copyShape: 'pullquote',
        consumes: [
          'eyebrow', 'quote', 'author_name', 'author_role',
          'author_company', 'author_photo', 'meta',
        ],
        capacity: { minCards: 1, maxCards: 1 },
        internalDispatch: true,
      },
    ],
  },
};

// ── vestria (product / thing engine) — hero only ────────────────────────────
// Declares the two hero variants so the existing content[heroId].layout swap
// becomes DECLARED. internalDispatch: both render through vestria's hero wrapper
// (branches on stored layout). Partial manifest — vestria's other sections fall
// back to the name map (VESTRIA_LAYOUT_NAMES) in later phases. Source:
// vestriaElementSchema (VestriaTailoredHero / VestriaFullBleedHero); both hero
// layouts are unioned into thingElementContract.hero, so consumes ⊆ contract.
const vestriaManifest: TemplateBlockManifest = {
  hero: {
    default: 'VestriaTailoredHero',
    variants: [
      {
        layoutName: 'VestriaTailoredHero',
        label: 'Tailored hero',
        blurb: 'Split hero with value props.',
        consumes: [
          'tag_text', 'headline', 'lede', 'cta_text', 'cta_href',
          'secondary_cta_text', 'secondary_cta_href', 'hero_image', 'stamp_value', 'stamp_label',
        ],
        internalDispatch: true,
      },
      {
        layoutName: 'VestriaFullBleedHero',
        label: 'Full-bleed video hero',
        blurb: 'Dark full-bleed autoplay video with a bottom stat row.',
        consumes: [
          'tag_text', 'headline', 'lede', 'cta_text', 'cta_href',
          'secondary_cta_text', 'secondary_cta_href', 'hero_image',
          'hero_video_desktop', 'hero_video_mobile', 'hero_video_poster',
          'stamp_value', 'stamp_label',
        ],
        internalDispatch: true,
      },
    ],
  },
};

/**
 * Block manifests, keyed by template. Partial — lex/lumen/granth/techpremium are
 * DEFERRED (plan Q6): they carry no manifest yet and fall back to the legacy
 * per-template layout name maps.
 */
export const blockManifests: Partial<Record<TemplateId, TemplateBlockManifest>> = {
  meridian: meridianManifest,
  hearth: hearthManifest,
  surge: surgeManifest,
  vestria: vestriaManifest,
  // atelier-skeleton-cutover: atelier rides the work-skeleton manifest (the old
  // hand-written atelierManifest is gone). ONE manifest describes the whole
  // skeleton's block surface (skins swap tokens only).
  atelier: workSkeletonManifest,
};
