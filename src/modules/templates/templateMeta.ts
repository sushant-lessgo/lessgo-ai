// src/modules/templates/templateMeta.ts
// FROZEN (scalePlan §§3/7/11.3) — static template metadata, SIBLING to the
// loader-only registry (D-C). `registry.ts` entries stay async dynamic-import
// loaders (bundle firewall); this file is pure data — it must NEVER import a
// template module, block, or resolver. `fit()`/shortlists query this record
// without pulling any template chunk into the bundle.
//
// Truthfulness is enforced by the conformance tests (spec 01 phase 4):
// - engine-core: every non-retired, non-bespoke template must resolve every
//   section of each declared engine's core set (see
//   src/modules/engines/coreSections.ts) as a real block in BOTH modes.
// - capability evidence: every declared block-backed capability must carry a
//   `capabilitySections` entry naming the section type that evidences it, and
//   that section must resolve non-placeholder in both modes. Lying here = red
//   test.
//
// Declaration notes (D-D, resolver keys re-verified 2026-07-07):
// - granth declares NO capabilities — in particular no `blog`: granth has no
//   blog blocks (writer profile sites have no blog), and declaring blog would
//   fail capability-evidence conformance. The spec's own rule decides.
// - surge's `casestudies` is a SECTION, not a capability — the capability
//   vocab is closed (scalePlan §7); do not add a case-studies capability.
//   Surge's capability set is lead-form + packages only.
// - lumen is D4 bespoke (Kundius one-off, off-funnel): `bespoke: true` exempts
//   it from engine-core conformance and from every shortlist; it still
//   declares its real capabilities honestly and gets the evidence check.
// - techpremium is retired (scalePlan §11.4): `retired: true` with EMPTY
//   engine/capability lists — out of every catalog/shortlist; simplest
//   truthful shape.

import type { TemplateId } from '@/types/service';
import type { CopyEngine, CapabilityId, DesignStyle } from '@/types/brief';
import type { KnobSelection } from '@/types/template';

/**
 * A named "look" (template-factory phase 8) — a curated bundle of a knob
 * selection + the flat variant/palette refs, surfaced as a one-click preset in
 * the picker (phase 9). Looks are List-3 DATA: they reference ONLY declared knob
 * axes/values and real palette/variant ids (enforced by the looks-truthfulness
 * conformance rule). `knobs` persist to `Project.themeValues.knobs`; `variantId`/
 * `paletteId` keep being written to their flat columns (no migration, back-compat
 * with serve gate / swap / analytics).
 */
export interface TemplateLook {
  id: string;
  label: string;
  blurb: string;
  /** Knob bundle — axes/values MUST be declared in the template's `knobs`. */
  knobs: KnobSelection;
  /** Flat variant ref — MUST be a real template variant id. */
  variantId: string;
  /** Flat palette ref — MUST be a real template palette id. */
  paletteId: string;
}

export interface TemplateMeta {
  copyEngines: readonly CopyEngine[];
  capabilities: readonly CapabilityId[];
  designStyles: readonly DesignStyle[];
  /** Block-backed capability → section type that evidences it (conformance §6b). */
  capabilitySections?: Partial<Record<CapabilityId, string>>;
  /** Named looks (phase 8; only knob-tokenized templates ship them). */
  looks?: readonly TemplateLook[];
  retired?: true;
  bespoke?: true;
}

export const templateMeta: Record<TemplateId, TemplateMeta> = {
  meridian: {
    copyEngines: ['thing'],
    designStyles: ['tech-minimal'],
    // scale-07 phase 2 convergence: meridian's ex-pilot extras map to
    // capabilities (founder mapping): pricing→packages, cta→lead-form.
    capabilities: ['lead-form', 'packages'],
    capabilitySections: { 'lead-form': 'cta', packages: 'pricing' },
  },
  vestria: {
    copyEngines: ['thing'],
    designStyles: ['editorial-craft'],
    // NOTE (structural caps): `multipage` is trust-on-declaration — it's
    // page-menu machinery, not a block; no block-existence check covers it
    // yet (conformance exempts structural capabilities).
    //
    // scale-07 phase 2 convergence: vestria's ex-pilot extra sections map to
    // capabilities (founder mapping, 2026-07-09). trust/industries/about/
    // materials/process are EXPLICIT-TRIGGER only — never auto-inferred by
    // requiredCapabilitiesFromBrief(); they enter via the 7b structure gate
    // (phase 4). catalog + lead-form keep their existing auto-triggers.
    capabilities: [
      'multipage',
      'lead-form',
      // FLAT-GRID capability, NOT a collection. vestria's `catalog` renders
      // plain ai_generated items on one page; it is NOT a CollectionKey and has
      // no CollectionDef by construction (scale-10), so vestria can never
      // trigger the generation→collections bridge. Distinct from the collection
      // family (products|services|case-studies|works).
      'catalog',
      'trust',
      'industries',
      'about',
      'materials',
      'process',
    ],
    capabilitySections: {
      'lead-form': 'contact',
      catalog: 'catalog',
      trust: 'trust',
      industries: 'industries',
      about: 'about',
      materials: 'materials',
      process: 'process',
    },
  },
  hearth: {
    copyEngines: ['trust'],
    designStyles: ['warm-human'],
    capabilities: ['lead-form'],
    capabilitySections: { 'lead-form': 'cta' },
    // Named looks (phase 8). Each references ONLY declared hearth knob axes/values
    // (see hearthKnobs) + real hearth palettes (palettes.ts) + real variants
    // (hearthVariants). Visibly distinct across palette + density + button shape.
    // "Warm Studio" is the DEFAULT look — all-default knobs + baked palette/variant,
    // so selecting it is byte-identical to an unstyled hearth draft.
    looks: [
      {
        id: 'warm-studio',
        label: 'Warm Studio',
        blurb: 'Soft cream warmth, generous rhythm — the classic hearth.',
        knobs: { buttonShape: 'rounded', density: 'comfortable' },
        variantId: 'classic',
        paletteId: 'terracotta',
      },
      {
        id: 'calm-sage',
        label: 'Calm Sage',
        blurb: 'Tighter, restful green rhythm for a composed feel.',
        knobs: { buttonShape: 'rounded', density: 'compact' },
        variantId: 'condensed',
        paletteId: 'sage',
      },
      {
        id: 'editorial-ochre',
        label: 'Editorial Ochre',
        blurb: 'Magazine spacing with crisp, square-cut corners.',
        knobs: { buttonShape: 'square', density: 'spacious' },
        variantId: 'editorial',
        paletteId: 'ochre',
      },
      {
        id: 'bold-plum',
        label: 'Bold Plum',
        blurb: 'Fully rounded, confident, jewel-toned.',
        knobs: { buttonShape: 'pill', density: 'comfortable' },
        variantId: 'classic',
        paletteId: 'plum',
      },
    ],
  },
  lex: {
    copyEngines: ['trust'],
    designStyles: ['authority-professional'],
    capabilities: ['lead-form'],
    capabilitySections: { 'lead-form': 'cta' },
  },
  surge: {
    copyEngines: ['trust'],
    designStyles: ['bold-performance'],
    capabilities: ['lead-form', 'packages'],
    capabilitySections: { 'lead-form': 'cta', packages: 'packages' },
  },
  granth: {
    copyEngines: ['work'],
    designStyles: ['literary-quiet'],
    capabilities: [], // no blog — granth has no blog blocks (see header note)
  },
  lumen: {
    copyEngines: ['work'],
    designStyles: ['editorial-craft'],
    // NOTE (i18n-phase-1 D5): `bilingual` is now a PLATFORM-LEVEL capability —
    // fit() satisfies it for EVERY non-retired template via PLATFORM_CAPABILITIES
    // (the content-locale layer is template-agnostic), superseding Lumen's old
    // trust-on-declaration. This declaration stays (harmless — Lumen is bespoke/
    // retired-in-place); it no longer uniquely grants bilingual. Structural-cap
    // machinery is asserted by src/lib/i18n/i18nHonesty.test.ts (conformance
    // still exempts it from the block-evidence check).
    capabilities: ['bilingual', 'gallery', 'lead-form'],
    capabilitySections: { gallery: 'portfolio', 'lead-form': 'contact' },
    bespoke: true,
  },
  atelier: {
    // First NON-BESPOKE work template (visual-portfolio). Declaring `gallery`
    // here is what FLIPS the photographer serve decision MANUAL→SERVE
    // (serveGate rungC probe) — atelier is service-audience (TEMPLATE_AUDIENCE).
    copyEngines: ['work'],
    // `editorial-craft` matches photographer.defaultStyle (businessTypes config)
    // so the served photographer's shortlist pick resolves to atelier by style.
    designStyles: ['editorial-craft'],
    // `lead-form` DROPPED: satisfied via the shared-block lane (fit.ts
    // sharedBlockCapabilities), so declaring it here — without a capabilitySections
    // entry — would only red conformance group (b). `bilingual` is a PLATFORM
    // capability (never declared per-template). `multipage` is structural
    // (page-menu machinery; exempt from block-evidence).
    //
    // atelier-skeleton-cutover: atelier rides the work-skeleton, so it declares the
    // `works` COLLECTION-FAMILY capability (evidenced by the `workcatalog` catalog
    // section). This ACTIVATES the works ingestion fan-out on the live atelier look
    // — the whole point of the cutover. Conformance (b)/(b+)/(d) bite: workcatalog +
    // workdetail must resolve to real skeleton blocks in both renderers (they do).
    // atelier STAYS non-bespoke (normal selectable work look).
    capabilities: ['gallery', 'packages', 'multipage', 'works'],
    capabilitySections: { gallery: 'work', packages: 'packages', works: 'workcatalog' },
  },
  techpremium: {
    copyEngines: [],
    designStyles: [],
    capabilities: [],
    retired: true,
  },
};
