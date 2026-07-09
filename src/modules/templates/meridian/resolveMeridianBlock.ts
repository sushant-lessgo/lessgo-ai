// src/modules/templates/meridian/resolveMeridianBlock.ts
// Meridian block dispatch — P2 real implementation.
// Maps (sectionType, layoutName, mode) → React component for the 7 pilot blocks.
// Mirrors Hearth's resolveServiceBlock: a single map keyed by lowercased layout
// name handles both edit (PascalCase input) and published (pre-lowercased) callers.

import React from 'react';
import { MeridianPlaceholderBlock } from './MeridianPlaceholderBlock';

// Edit-mode blocks
import MeridianNavHeader from './blocks/Header/MeridianNavHeader';
import TerminalHero from './blocks/Hero/TerminalHero';
import HairlineFeatureGrid from './blocks/Features/HairlineFeatureGrid';
import ProofWithLogoRail from './blocks/Testimonials/ProofWithLogoRail';
import ThreeTierPricing from './blocks/Pricing/ThreeTierPricing';
import ArcCTA from './blocks/CTA/ArcCTA';
import HairlineFooter from './blocks/Footer/HairlineFooter';

// Published-mode blocks
import MeridianNavHeaderPublished from './blocks/Header/MeridianNavHeader.published';
import TerminalHeroPublished from './blocks/Hero/TerminalHero.published';
import HairlineFeatureGridPublished from './blocks/Features/HairlineFeatureGrid.published';
import ProofWithLogoRailPublished from './blocks/Testimonials/ProofWithLogoRail.published';
import ThreeTierPricingPublished from './blocks/Pricing/ThreeTierPricing.published';
import ArcCTAPublished from './blocks/CTA/ArcCTA.published';
import HairlineFooterPublished from './blocks/Footer/HairlineFooter.published';

// Shared blog blocks (server-safe; same component for edit + published — blog
// pages never enter the edit canvas). See src/modules/templates/shared/blog/.
import BlogPostBodyBlock from '../shared/blog/BlogPostBodyBlock';
import BlogIndexBlock from '../shared/blog/BlogIndexBlock';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Variant-keyed section entry (scale-09 phase 3): `variants` is keyed by the
// LOWERCASED layout name; `default` is the layout name used when the stored
// layout is absent/unknown/foreign. Today every section has exactly ONE variant
// (the current default) — the real meridian variants land in phase 6.
interface SectionEntry {
  variants: Record<string, BlockEntry>;
  default: string; // lowercased layout name
}

/** Build a single-variant section entry (one block per section, pre-phase-6). */
function single(layoutName: string, entry: BlockEntry): SectionEntry {
  const key = layoutName.toLowerCase();
  return { variants: { [key]: entry }, default: key };
}

// Keyed by SECTION TYPE. Within a section, dispatch is
// `variants[layoutName] ?? variants[default]`, so an unknown/foreign layout name
// falls back to the section default block — this is the A1 guardrail (template
// switching needs no layout-name rewrites) preserved under variant dispatch.
const MERIDIAN_BLOCK_REGISTRY: Record<string, SectionEntry> = {
  header:       single('MeridianNavHeader',   { edit: MeridianNavHeader,    published: MeridianNavHeaderPublished }),
  hero:         single('TerminalHero',        { edit: TerminalHero,         published: TerminalHeroPublished }),
  features:     single('HairlineFeatureGrid', { edit: HairlineFeatureGrid,  published: HairlineFeatureGridPublished }),
  testimonials: single('ProofWithLogoRail',   { edit: ProofWithLogoRail,    published: ProofWithLogoRailPublished }),
  pricing:      single('ThreeTierPricing',    { edit: ThreeTierPricing,     published: ThreeTierPricingPublished }),
  cta:          single('ArcCTA',              { edit: ArcCTA,               published: ArcCTAPublished }),
  footer:       single('HairlineFooter',      { edit: HairlineFooter,       published: HairlineFooterPublished }),
  // Blog (Phase 1) — publish-time synthesized pages, never generated/edited.
  blogpostbody: single('BlogPostBody',        { edit: BlogPostBodyBlock,    published: BlogPostBodyBlock }),
  blogindex:    single('BlogIndex',           { edit: BlogIndexBlock,       published: BlogIndexBlock }),
};

export type MeridianBlockMode = 'edit' | 'published';

export function resolveMeridianBlock(
  sectionType: string,
  mode: MeridianBlockMode = 'edit',
  layoutName?: string,
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const section = MERIDIAN_BLOCK_REGISTRY[key];
  if (!section) {
    // Unknown section type: keep the placeholder so the renderer doesn't crash.
    return MeridianPlaceholderBlock;
  }
  // Variant lookup with section-type fallback (A1): unknown/foreign/absent
  // layout ⇒ the section's default block.
  const entry =
    section.variants[(layoutName || '').toLowerCase()] ??
    section.variants[section.default];
  return mode === 'published' ? entry.published : entry.edit;
}
