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
// Home-page blocks (Phase 4b)
import TechPremiumTrust from './blocks/Trust/TechPremiumTrust';
import TechPremiumProblem from './blocks/Problem/TechPremiumProblem';
import TechPremiumProcess from './blocks/Process/TechPremiumProcess';
import TechPremiumExplainer from './blocks/Explainer/TechPremiumExplainer';
import TechPremiumLineup from './blocks/Lineup/TechPremiumLineup';
import TechPremiumGalleryPreview from './blocks/GalleryPreview/TechPremiumGalleryPreview';
import TechPremiumCompatibility from './blocks/Compatibility/TechPremiumCompatibility';
import TechPremiumFaq from './blocks/Faq/TechPremiumFaq';
// Standalone pages (Phase 4c)
import TechPremiumGallery from './blocks/Gallery/TechPremiumGallery';
import TechPremiumContact from './blocks/Contact/TechPremiumContact';

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
// Home-page blocks (Phase 4b)
import TechPremiumTrustPublished from './blocks/Trust/TechPremiumTrust.published';
import TechPremiumProblemPublished from './blocks/Problem/TechPremiumProblem.published';
import TechPremiumProcessPublished from './blocks/Process/TechPremiumProcess.published';
import TechPremiumExplainerPublished from './blocks/Explainer/TechPremiumExplainer.published';
import TechPremiumLineupPublished from './blocks/Lineup/TechPremiumLineup.published';
import TechPremiumGalleryPreviewPublished from './blocks/GalleryPreview/TechPremiumGalleryPreview.published';
import TechPremiumCompatibilityPublished from './blocks/Compatibility/TechPremiumCompatibility.published';
import TechPremiumFaqPublished from './blocks/Faq/TechPremiumFaq.published';
// Standalone pages (Phase 4c)
import TechPremiumGalleryPublished from './blocks/Gallery/TechPremiumGallery.published';
import TechPremiumContactPublished from './blocks/Contact/TechPremiumContact.published';

// Shared blog blocks (server-safe; same component for edit + published — blog
// pages never enter the edit canvas). See src/modules/templates/shared/blog/.
import BlogPostBodyBlock from '../shared/blog/BlogPostBodyBlock';
import BlogIndexBlock from '../shared/blog/BlogIndexBlock';

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
  // Home-page blocks (Phase 4b) — archetype-only insertion.
  trust:          { edit: TechPremiumTrust,          published: TechPremiumTrustPublished },
  problem:        { edit: TechPremiumProblem,        published: TechPremiumProblemPublished },
  process:        { edit: TechPremiumProcess,        published: TechPremiumProcessPublished },
  explainer:      { edit: TechPremiumExplainer,      published: TechPremiumExplainerPublished },
  lineup:         { edit: TechPremiumLineup,         published: TechPremiumLineupPublished },
  gallerypreview: { edit: TechPremiumGalleryPreview, published: TechPremiumGalleryPreviewPublished },
  compatibility:  { edit: TechPremiumCompatibility,  published: TechPremiumCompatibilityPublished },
  faq:            { edit: TechPremiumFaq,            published: TechPremiumFaqPublished },
  // Standalone pages (Phase 4c) — archetype-only insertion.
  gallery:        { edit: TechPremiumGallery,        published: TechPremiumGalleryPublished },
  contact:        { edit: TechPremiumContact,        published: TechPremiumContactPublished },
  // Blog (Phase 1) — publish-time synthesized pages, never generated/edited.
  blogpostbody:   { edit: BlogPostBodyBlock,         published: BlogPostBodyBlock },
  blogindex:      { edit: BlogIndexBlock,            published: BlogIndexBlock },
};

export type TechPremiumBlockMode = 'edit' | 'published';

export function resolveTechPremiumBlock(
  sectionType: string,
  mode: TechPremiumBlockMode = 'edit',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _layoutName?: string, // one block per section; accepted for TemplateModule contract parity
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = TECHPREMIUM_BLOCK_REGISTRY[key];
  if (!entry) {
    return TechPremiumPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
