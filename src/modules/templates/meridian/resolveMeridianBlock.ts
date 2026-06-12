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

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// A1 (Phase 11a): keyed by SECTION TYPE, not layout name — mirrors Hearth's
// resolveServiceBlock. The registry dispatches by section type (componentRegistry
// passes 'hero', 'features', …), so Meridian re-resolves its own one-block-per-
// section regardless of the stored layout string (kept in saved content, unused
// here). One block per section per template makes this a clean 1:1 map.
const MERIDIAN_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: MeridianNavHeader,    published: MeridianNavHeaderPublished },
  hero:         { edit: TerminalHero,         published: TerminalHeroPublished },
  features:     { edit: HairlineFeatureGrid,  published: HairlineFeatureGridPublished },
  testimonials: { edit: ProofWithLogoRail,    published: ProofWithLogoRailPublished },
  pricing:      { edit: ThreeTierPricing,     published: ThreeTierPricingPublished },
  cta:          { edit: ArcCTA,               published: ArcCTAPublished },
  footer:       { edit: HairlineFooter,       published: HairlineFooterPublished },
};

export type MeridianBlockMode = 'edit' | 'published';

export function resolveMeridianBlock(
  sectionType: string,
  mode: MeridianBlockMode = 'edit',
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = MERIDIAN_BLOCK_REGISTRY[key];
  if (!entry) {
    // Unknown section type: keep the placeholder so the renderer doesn't crash.
    return MeridianPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
