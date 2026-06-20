// src/modules/templates/techpremium/resolveTechPremiumBlock.ts
// TechPremium block dispatch. Maps (sectionType, mode) → React component for the 7
// product-audience sections. Keyed by SECTION TYPE (the registry dispatches by
// section type, not the stored layout name), so one block per section is a clean
// 1:1 map. Mirrors resolveMeridianBlock.

import React from 'react';
import { TechPremiumPlaceholderBlock } from './TechPremiumPlaceholderBlock';

// Edit-mode blocks
import TechPremiumNav from './blocks/Header/TechPremiumNav';
import TechPremiumHero from './blocks/Hero/TechPremiumHero';
import TechPremiumCapabilities from './blocks/Features/TechPremiumCapabilities';
import TechPremiumResults from './blocks/Testimonials/TechPremiumResults';
import TechPremiumPricing from './blocks/Pricing/TechPremiumPricing';
import TechPremiumCTA from './blocks/CTA/TechPremiumCTA';
import TechPremiumFooter from './blocks/Footer/TechPremiumFooter';
import TechPremiumCatalog from './blocks/Catalog/TechPremiumCatalog';
import TechPremiumProductDetail from './blocks/ProductDetail/TechPremiumProductDetail';

// Published-mode blocks
import TechPremiumNavPublished from './blocks/Header/TechPremiumNav.published';
import TechPremiumHeroPublished from './blocks/Hero/TechPremiumHero.published';
import TechPremiumCapabilitiesPublished from './blocks/Features/TechPremiumCapabilities.published';
import TechPremiumResultsPublished from './blocks/Testimonials/TechPremiumResults.published';
import TechPremiumPricingPublished from './blocks/Pricing/TechPremiumPricing.published';
import TechPremiumCTAPublished from './blocks/CTA/TechPremiumCTA.published';
import TechPremiumFooterPublished from './blocks/Footer/TechPremiumFooter.published';
import TechPremiumCatalogPublished from './blocks/Catalog/TechPremiumCatalog.published';
import TechPremiumProductDetailPublished from './blocks/ProductDetail/TechPremiumProductDetail.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

const TECHPREMIUM_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: TechPremiumNav,          published: TechPremiumNavPublished },
  hero:         { edit: TechPremiumHero,         published: TechPremiumHeroPublished },
  features:     { edit: TechPremiumCapabilities, published: TechPremiumCapabilitiesPublished },
  testimonials: { edit: TechPremiumResults,      published: TechPremiumResultsPublished },
  pricing:      { edit: TechPremiumPricing,      published: TechPremiumPricingPublished },
  cta:          { edit: TechPremiumCTA,          published: TechPremiumCTAPublished },
  footer:       { edit: TechPremiumFooter,       published: TechPremiumFooterPublished },
  // Collection system (Phase 3) — editor-only insertion, never generated.
  catalog:       { edit: TechPremiumCatalog,       published: TechPremiumCatalogPublished },
  productdetail: { edit: TechPremiumProductDetail, published: TechPremiumProductDetailPublished },
};

export type TechPremiumBlockMode = 'edit' | 'published';

export function resolveTechPremiumBlock(
  sectionType: string,
  mode: TechPremiumBlockMode = 'edit',
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = TECHPREMIUM_BLOCK_REGISTRY[key];
  if (!entry) {
    return TechPremiumPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
