// src/modules/service/resolveServiceBlock.ts
// Service-block dispatch — Phase 3 real implementation.
// Maps (sectionType, layoutName, mode) → React component for the 7 pilot blocks.
//
// Casing-mismatch notice: edit registry passes PascalCase (`WarmNavHeader`);
// published registry pre-lowercases (`warmnavheader`). Inputs are normalized
// internally so a single map keyed by lowercased layoutName handles both.

import React from 'react';
import { ServicePlaceholderBlock } from './ServicePlaceholderBlock';

// Edit-mode blocks
import WarmNavHeader from './blocks/Header/WarmNavHeader';
import PetalFramedHero from './blocks/Hero/PetalFramedHero';
import IconServiceCards from './blocks/Services/IconServiceCards';
import PullQuoteWithMark from './blocks/Testimonials/PullQuoteWithMark';
import TieredPackages from './blocks/Packages/TieredPackages';
import BookCallCTA from './blocks/CTA/BookCallCTA';
import ContactFooterRich from './blocks/Footer/ContactFooterRich';

// Published-mode blocks
import WarmNavHeaderPublished from './blocks/Header/WarmNavHeader.published';
import PetalFramedHeroPublished from './blocks/Hero/PetalFramedHero.published';
import IconServiceCardsPublished from './blocks/Services/IconServiceCards.published';
import PullQuoteWithMarkPublished from './blocks/Testimonials/PullQuoteWithMark.published';
import TieredPackagesPublished from './blocks/Packages/TieredPackages.published';
import BookCallCTAPublished from './blocks/CTA/BookCallCTA.published';
import ContactFooterRichPublished from './blocks/Footer/ContactFooterRich.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

const SERVICE_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  warmnavheader:     { edit: WarmNavHeader,     published: WarmNavHeaderPublished },
  petalframedhero:   { edit: PetalFramedHero,   published: PetalFramedHeroPublished },
  iconservicecards:  { edit: IconServiceCards,  published: IconServiceCardsPublished },
  pullquotewithmark: { edit: PullQuoteWithMark, published: PullQuoteWithMarkPublished },
  tieredpackages:    { edit: TieredPackages,    published: TieredPackagesPublished },
  bookcallcta:       { edit: BookCallCTA,       published: BookCallCTAPublished },
  contactfooterrich: { edit: ContactFooterRich, published: ContactFooterRichPublished },
};

export type ServiceBlockMode = 'edit' | 'published';

export function resolveServiceBlock(
  _sectionType: string,
  layoutName: string,
  mode: ServiceBlockMode = 'edit'
): React.ComponentType<any> | null {
  const key = (layoutName || '').toLowerCase();
  const entry = SERVICE_BLOCK_REGISTRY[key];
  if (!entry) {
    // Unknown layout: keep the placeholder so the renderer doesn't crash.
    return ServicePlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
