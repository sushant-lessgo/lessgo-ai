// src/modules/templates/atelier/resolveAtelierBlock.ts
// Atelier block dispatch — keyed by SECTION TYPE (lowercase single token), not
// layout name. Covers all 8 Atelier section types. Schema is keyed by the
// `Atelier*` layout name (§3g two-identifier discipline); dispatch here is by type.

import React from 'react';
import { AtelierPlaceholderBlock } from './AtelierPlaceholderBlock';

// Edit-mode blocks
import AtelierNavHeader from './blocks/Header/AtelierNavHeader';
import AtelierHero from './blocks/Hero/AtelierHero';
import AtelierWorkGallery from './blocks/Work/AtelierWorkGallery';
import AtelierPackages from './blocks/Packages/AtelierPackages';
import AtelierAbout from './blocks/About/AtelierAbout';
import AtelierQuoteBand from './blocks/Quote/AtelierQuoteBand';
import AtelierContact from './blocks/Contact/AtelierContact';
import AtelierFooter from './blocks/Footer/AtelierFooter';

// Published-mode blocks
import AtelierNavHeaderPublished from './blocks/Header/AtelierNavHeader.published';
import AtelierHeroPublished from './blocks/Hero/AtelierHero.published';
import AtelierWorkGalleryPublished from './blocks/Work/AtelierWorkGallery.published';
import AtelierPackagesPublished from './blocks/Packages/AtelierPackages.published';
import AtelierAboutPublished from './blocks/About/AtelierAbout.published';
import AtelierQuoteBandPublished from './blocks/Quote/AtelierQuoteBand.published';
import AtelierContactPublished from './blocks/Contact/AtelierContact.published';
import AtelierFooterPublished from './blocks/Footer/AtelierFooter.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (lowercase single tokens — §3g casing rule; hyphen-free).
const ATELIER_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:   { edit: AtelierNavHeader,   published: AtelierNavHeaderPublished },
  hero:     { edit: AtelierHero,        published: AtelierHeroPublished },
  work:     { edit: AtelierWorkGallery, published: AtelierWorkGalleryPublished },
  packages: { edit: AtelierPackages,    published: AtelierPackagesPublished },
  about:    { edit: AtelierAbout,       published: AtelierAboutPublished },
  quote:    { edit: AtelierQuoteBand,   published: AtelierQuoteBandPublished },
  contact:  { edit: AtelierContact,     published: AtelierContactPublished },
  footer:   { edit: AtelierFooter,      published: AtelierFooterPublished },
};

export type AtelierBlockMode = 'edit' | 'published';

export function resolveAtelierBlock(
  sectionType: string,
  mode: AtelierBlockMode = 'edit',
  _layoutName?: string, // one block per section this phase; variants land phase 9
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = ATELIER_BLOCK_REGISTRY[key];
  if (!entry) {
    return AtelierPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
