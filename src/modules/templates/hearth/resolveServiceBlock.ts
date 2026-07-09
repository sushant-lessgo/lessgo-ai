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
// Shared blog blocks (server-safe; same component for edit + published — blog
// pages never enter the edit canvas). See src/modules/templates/shared/blog/.
import BlogPostBodyBlock from '../shared/blog/BlogPostBodyBlock';
import BlogIndexBlock from '../shared/blog/BlogIndexBlock';

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

// Variant-keyed section entry (scale-09 phase 3): `variants` is keyed by the
// LOWERCASED layout name; `default` is the layout name used when the stored
// layout is absent/unknown/foreign. Today every section has exactly ONE variant
// (the current default) — the real hearth variants land in phase 7.
interface SectionEntry {
  variants: Record<string, BlockEntry>;
  default: string; // lowercased layout name
}

/** Build a single-variant section entry (one block per section, pre-phase-7). */
function single(layoutName: string, entry: BlockEntry): SectionEntry {
  const key = layoutName.toLowerCase();
  return { variants: { [key]: entry }, default: key };
}

// Keyed by SECTION TYPE. Within a section, dispatch is
// `variants[layoutName] ?? variants[default]`, so an unknown/foreign layout name
// falls back to the section default block — this is the A1 guardrail (template
// switching needs no layout-name rewrites) preserved under variant dispatch.
const SERVICE_BLOCK_REGISTRY: Record<string, SectionEntry> = {
  header:       single('WarmNavHeader',     { edit: WarmNavHeader,     published: WarmNavHeaderPublished }),
  hero:         single('PetalFramedHero',   { edit: PetalFramedHero,   published: PetalFramedHeroPublished }),
  services:     single('IconServiceCards',  { edit: IconServiceCards,  published: IconServiceCardsPublished }),
  testimonials: single('PullQuoteWithMark', { edit: PullQuoteWithMark, published: PullQuoteWithMarkPublished }),
  packages:     single('TieredPackages',    { edit: TieredPackages,    published: TieredPackagesPublished }),
  cta:          single('BookCallCTA',        { edit: BookCallCTA,       published: BookCallCTAPublished }),
  footer:       single('ContactFooterRich', { edit: ContactFooterRich, published: ContactFooterRichPublished }),
  // Blog (Phase 1) — publish-time synthesized pages, never generated/edited.
  blogpostbody: single('BlogPostBody',       { edit: BlogPostBodyBlock, published: BlogPostBodyBlock }),
  blogindex:    single('BlogIndex',          { edit: BlogIndexBlock,    published: BlogIndexBlock }),
};

export type ServiceBlockMode = 'edit' | 'published';

export function resolveServiceBlock(
  sectionType: string,
  mode: ServiceBlockMode = 'edit',
  layoutName?: string,
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const section = SERVICE_BLOCK_REGISTRY[key];
  if (!section) {
    // Unknown section type: keep the placeholder so the renderer doesn't crash.
    return ServicePlaceholderBlock;
  }
  // Variant lookup with section-type fallback (A1): unknown/foreign/absent
  // layout ⇒ the section's default block.
  const entry =
    section.variants[(layoutName || '').toLowerCase()] ??
    section.variants[section.default];
  return mode === 'published' ? entry.published : entry.edit;
}
