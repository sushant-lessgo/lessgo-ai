// src/modules/templates/hearth/resolveServiceBlock.ts
// Hearth block dispatch.
//
// A1 (Phase 11a): keyed by SECTION TYPE, not layout name. Hearth owns exactly
// one block per section type, so section-type dispatch lets the editor switch
// templates without rewriting stored layout names. The stored layout name is
// kept in saved content (unused here) — restore name-keyed dispatch if Phase 9
// multi-block (`uiblockDecisions`) ever lands.

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

// Keyed by section type (A1).
const SERVICE_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: WarmNavHeader,     published: WarmNavHeaderPublished },
  hero:         { edit: PetalFramedHero,   published: PetalFramedHeroPublished },
  services:     { edit: IconServiceCards,  published: IconServiceCardsPublished },
  testimonials: { edit: PullQuoteWithMark, published: PullQuoteWithMarkPublished },
  packages:     { edit: TieredPackages,    published: TieredPackagesPublished },
  cta:          { edit: BookCallCTA,       published: BookCallCTAPublished },
  footer:       { edit: ContactFooterRich, published: ContactFooterRichPublished },
};

export type ServiceBlockMode = 'edit' | 'published';

export function resolveServiceBlock(
  sectionType: string,
  mode: ServiceBlockMode = 'edit'
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = SERVICE_BLOCK_REGISTRY[key];
  if (!entry) {
    // Unknown section type: keep the placeholder so the renderer doesn't crash.
    return ServicePlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
