// src/modules/templates/surge/resolveServiceBlock.ts
// Surge block dispatch — keyed by SECTION TYPE (lowercase), not layout name.
// Covers the 7 shared service sections + 4 Surge-only delta sections.

import React from 'react';
import { SurgePlaceholderBlock } from './SurgePlaceholderBlock';

// Edit-mode blocks — shared service sections
import SurgeNavHeader from './blocks/Header/WarmNavHeader';
import SurgeHero from './blocks/Hero/PetalFramedHero';
import SurgeServiceCards from './blocks/Services/IconServiceCards';
import SurgePullQuote from './blocks/Testimonials/PullQuoteWithMark';
import SurgePackages from './blocks/Packages/TieredPackages';
import SurgeCTA from './blocks/CTA/BookCallCTA';
import SurgeFooter from './blocks/Footer/ContactFooterRich';
// Edit-mode blocks — Surge-only delta sections
import SurgeLogoStrip from './blocks/Logos/LogoStrip';
import SurgeAbout from './blocks/About/AboutWithStats';
import SurgeCaseCards from './blocks/CaseStudies/ResultCaseCards';
import SurgeStatsBand from './blocks/Stats/StatsBand';

// Published-mode blocks — shared service sections
import SurgeNavHeaderPublished from './blocks/Header/WarmNavHeader.published';
import SurgeHeroPublished from './blocks/Hero/PetalFramedHero.published';
import SurgeServiceCardsPublished from './blocks/Services/IconServiceCards.published';
import SurgePullQuotePublished from './blocks/Testimonials/PullQuoteWithMark.published';
import SurgePackagesPublished from './blocks/Packages/TieredPackages.published';
import SurgeCTAPublished from './blocks/CTA/BookCallCTA.published';
import SurgeFooterPublished from './blocks/Footer/ContactFooterRich.published';
// Published-mode blocks — Surge-only delta sections
import SurgeLogoStripPublished from './blocks/Logos/LogoStrip.published';
import SurgeAboutPublished from './blocks/About/AboutWithStats.published';
import SurgeCaseCardsPublished from './blocks/CaseStudies/ResultCaseCards.published';
import SurgeStatsBandPublished from './blocks/Stats/StatsBand.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (lowercase single tokens — §3g casing rule).
const SERVICE_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: SurgeNavHeader,    published: SurgeNavHeaderPublished },
  hero:         { edit: SurgeHero,         published: SurgeHeroPublished },
  services:     { edit: SurgeServiceCards, published: SurgeServiceCardsPublished },
  testimonials: { edit: SurgePullQuote,    published: SurgePullQuotePublished },
  packages:     { edit: SurgePackages,     published: SurgePackagesPublished },
  cta:          { edit: SurgeCTA,          published: SurgeCTAPublished },
  footer:       { edit: SurgeFooter,       published: SurgeFooterPublished },
  // Surge-only delta sections
  logos:        { edit: SurgeLogoStrip,    published: SurgeLogoStripPublished },
  about:        { edit: SurgeAbout,        published: SurgeAboutPublished },
  casestudies:  { edit: SurgeCaseCards,    published: SurgeCaseCardsPublished },
  stats:        { edit: SurgeStatsBand,    published: SurgeStatsBandPublished },
};

export type ServiceBlockMode = 'edit' | 'published';

export function resolveServiceBlock(
  sectionType: string,
  mode: ServiceBlockMode = 'edit'
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = SERVICE_BLOCK_REGISTRY[key];
  if (!entry) {
    return SurgePlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
