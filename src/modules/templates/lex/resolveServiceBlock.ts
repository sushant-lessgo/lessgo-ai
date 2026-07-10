// src/modules/templates/lex/resolveServiceBlock.ts
// Lex block dispatch.
//
// A1 (Phase 11a): keyed by SECTION TYPE, not layout name. Lex owns exactly one
// block per section type, so section-type dispatch lets the editor switch
// between Hearth and Lex without rewriting stored layout names. Restore
// name-keyed dispatch if Phase 9 multi-block (`uiblockDecisions`) ever lands.

import React from 'react';
import { LexPlaceholderBlock } from './LexPlaceholderBlock';

// Edit-mode blocks
import LetterheadNav from './blocks/Header/LetterheadNav';
import ProspectusHero from './blocks/Hero/ProspectusHero';
import PracticeAreaGrid from './blocks/Services/PracticeAreaGrid';
import LetterOfReference from './blocks/Testimonials/LetterOfReference';
import FeeSchedule from './blocks/Packages/FeeSchedule';
import EngravedInvitationCTA from './blocks/CTA/EngravedInvitationCTA';
import ColophonFooter from './blocks/Footer/ColophonFooter';

// Published-mode blocks
import LetterheadNavPublished from './blocks/Header/LetterheadNav.published';
import ProspectusHeroPublished from './blocks/Hero/ProspectusHero.published';
import PracticeAreaGridPublished from './blocks/Services/PracticeAreaGrid.published';
import LetterOfReferencePublished from './blocks/Testimonials/LetterOfReference.published';
import FeeSchedulePublished from './blocks/Packages/FeeSchedule.published';
import EngravedInvitationCTAPublished from './blocks/CTA/EngravedInvitationCTA.published';
import ColophonFooterPublished from './blocks/Footer/ColophonFooter.published';

// Shared blog blocks (server-safe; same component for edit + published — blog
// pages never enter the edit canvas). See src/modules/templates/shared/blog/.
import BlogPostBodyBlock from '../shared/blog/BlogPostBodyBlock';
import BlogIndexBlock from '../shared/blog/BlogIndexBlock';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (A1).
const LEX_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  header:       { edit: LetterheadNav,        published: LetterheadNavPublished },
  hero:         { edit: ProspectusHero,       published: ProspectusHeroPublished },
  services:     { edit: PracticeAreaGrid,     published: PracticeAreaGridPublished },
  testimonials: { edit: LetterOfReference,    published: LetterOfReferencePublished },
  packages:     { edit: FeeSchedule,          published: FeeSchedulePublished },
  cta:          { edit: EngravedInvitationCTA, published: EngravedInvitationCTAPublished },
  footer:       { edit: ColophonFooter,       published: ColophonFooterPublished },
  // Blog (Phase 1) — publish-time synthesized pages, never generated/edited.
  blogpostbody: { edit: BlogPostBodyBlock,    published: BlogPostBodyBlock },
  blogindex:    { edit: BlogIndexBlock,       published: BlogIndexBlock },
};

export type LexBlockMode = 'edit' | 'published';

export function resolveServiceBlock(
  sectionType: string,
  mode: LexBlockMode = 'edit',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _layoutName?: string, // one block per section; accepted for TemplateModule contract parity
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = LEX_BLOCK_REGISTRY[key];
  if (!entry) {
    // Unknown section type: keep the placeholder so the renderer doesn't crash.
    return LexPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
