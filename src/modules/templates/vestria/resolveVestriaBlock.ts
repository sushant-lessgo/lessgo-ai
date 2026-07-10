// src/modules/templates/vestria/resolveVestriaBlock.ts
// Vestria block dispatch — keyed by SECTION TYPE (lowercase), not layout name.
// Covers all 12 Vestria section types. Schema is keyed by the `Vestria*` layout
// name (§3g two-identifier discipline); dispatch here is by type.

import React from 'react';
import { VestriaPlaceholderBlock } from './VestriaPlaceholderBlock';

// Edit-mode blocks
import VestriaNavHeader from './blocks/Header/VestriaNavHeader';
import VestriaTailoredHero from './blocks/Hero/VestriaTailoredHero';
import VestriaClientStrip from './blocks/Trust/VestriaClientStrip';
import VestriaIndustriesGrid from './blocks/Industries/VestriaIndustriesGrid';
import VestriaAboutStats from './blocks/About/VestriaAboutStats';
import VestriaServicesGrid from './blocks/Features/VestriaServicesGrid';
import VestriaCatalogueGrid from './blocks/Catalog/VestriaCatalogueGrid';
import VestriaMaterials from './blocks/Materials/VestriaMaterials';
import VestriaProcessRail from './blocks/Process/VestriaProcessRail';
import VestriaQuotes from './blocks/Testimonials/VestriaQuotes';
import VestriaLeadForm from './blocks/Contact/VestriaLeadForm';
import VestriaFooter from './blocks/Footer/VestriaFooter';

// Published-mode blocks
import VestriaNavHeaderPublished from './blocks/Header/VestriaNavHeader.published';
import VestriaTailoredHeroPublished from './blocks/Hero/VestriaTailoredHero.published';
import VestriaClientStripPublished from './blocks/Trust/VestriaClientStrip.published';
import VestriaIndustriesGridPublished from './blocks/Industries/VestriaIndustriesGrid.published';
import VestriaAboutStatsPublished from './blocks/About/VestriaAboutStats.published';
import VestriaServicesGridPublished from './blocks/Features/VestriaServicesGrid.published';
import VestriaCatalogueGridPublished from './blocks/Catalog/VestriaCatalogueGrid.published';
import VestriaMaterialsPublished from './blocks/Materials/VestriaMaterials.published';
import VestriaProcessRailPublished from './blocks/Process/VestriaProcessRail.published';
import VestriaQuotesPublished from './blocks/Testimonials/VestriaQuotes.published';
import VestriaLeadFormPublished from './blocks/Contact/VestriaLeadForm.published';
import VestriaFooterPublished from './blocks/Footer/VestriaFooter.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (lowercase single tokens — §3g casing rule).
const VESTRIA_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: VestriaNavHeader,      published: VestriaNavHeaderPublished },
  hero:         { edit: VestriaTailoredHero,   published: VestriaTailoredHeroPublished },
  trust:        { edit: VestriaClientStrip,    published: VestriaClientStripPublished },
  industries:   { edit: VestriaIndustriesGrid, published: VestriaIndustriesGridPublished },
  about:        { edit: VestriaAboutStats,     published: VestriaAboutStatsPublished },
  features:     { edit: VestriaServicesGrid,   published: VestriaServicesGridPublished },
  catalog:      { edit: VestriaCatalogueGrid,  published: VestriaCatalogueGridPublished },
  materials:    { edit: VestriaMaterials,      published: VestriaMaterialsPublished },
  process:      { edit: VestriaProcessRail,    published: VestriaProcessRailPublished },
  testimonials: { edit: VestriaQuotes,         published: VestriaQuotesPublished },
  contact:      { edit: VestriaLeadForm,       published: VestriaLeadFormPublished },
  footer:       { edit: VestriaFooter,         published: VestriaFooterPublished },
};

export type VestriaBlockMode = 'edit' | 'published';

export function resolveVestriaBlock(
  sectionType: string,
  mode: VestriaBlockMode = 'edit',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _layoutName?: string, // one block per section; variant switching (hero) is internalDispatch
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = VESTRIA_BLOCK_REGISTRY[key];
  if (!entry) {
    return VestriaPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
