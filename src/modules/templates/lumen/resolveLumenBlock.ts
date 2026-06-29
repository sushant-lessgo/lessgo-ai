// src/modules/templates/lumen/resolveLumenBlock.ts
// Lumen block dispatch — keyed by SECTION TYPE (lowercase), not layout name.
// Covers all 9 Lumen section types. Schema is keyed by the `Lumen*` layout name
// (§3g two-identifier discipline); dispatch here is by type.

import React from 'react';
import { LumenPlaceholderBlock } from './LumenPlaceholderBlock';

// Edit-mode blocks
import LumenNav from './blocks/Header/LumenNav';
import LumenHero from './blocks/Hero/LumenHero';
import LumenLogos from './blocks/Logos/LumenLogos';
import LumenPricedServiceCards from './blocks/Services/LumenPricedServiceCards';
import LumenShootProcess from './blocks/Process/LumenShootProcess';
import LumenCategoryGallery from './blocks/Portfolio/LumenCategoryGallery';
import LumenPhotographerAbout from './blocks/About/LumenPhotographerAbout';
import LumenContactForm from './blocks/Contact/LumenContactForm';
import LumenFooter from './blocks/Footer/LumenFooter';

// Published-mode blocks
import LumenNavPublished from './blocks/Header/LumenNav.published';
import LumenHeroPublished from './blocks/Hero/LumenHero.published';
import LumenLogosPublished from './blocks/Logos/LumenLogos.published';
import LumenPricedServiceCardsPublished from './blocks/Services/LumenPricedServiceCards.published';
import LumenShootProcessPublished from './blocks/Process/LumenShootProcess.published';
import LumenCategoryGalleryPublished from './blocks/Portfolio/LumenCategoryGallery.published';
import LumenPhotographerAboutPublished from './blocks/About/LumenPhotographerAbout.published';
import LumenContactFormPublished from './blocks/Contact/LumenContactForm.published';
import LumenFooterPublished from './blocks/Footer/LumenFooter.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (lowercase single tokens — §3g casing rule).
const LUMEN_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:    { edit: LumenNav,                published: LumenNavPublished },
  hero:      { edit: LumenHero,               published: LumenHeroPublished },
  logos:     { edit: LumenLogos,              published: LumenLogosPublished },
  services:  { edit: LumenPricedServiceCards, published: LumenPricedServiceCardsPublished },
  process:   { edit: LumenShootProcess,       published: LumenShootProcessPublished },
  portfolio: { edit: LumenCategoryGallery,    published: LumenCategoryGalleryPublished },
  about:     { edit: LumenPhotographerAbout,  published: LumenPhotographerAboutPublished },
  contact:   { edit: LumenContactForm,        published: LumenContactFormPublished },
  footer:    { edit: LumenFooter,             published: LumenFooterPublished },
};

export type LumenBlockMode = 'edit' | 'published';

export function resolveLumenBlock(
  sectionType: string,
  mode: LumenBlockMode = 'edit'
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = LUMEN_BLOCK_REGISTRY[key];
  if (!entry) {
    return LumenPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
