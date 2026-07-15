// src/modules/skeletons/work/resolveWorkBlock.ts
// Work-skeleton block dispatch — variant-aware (scale-09 `SectionEntry` shape),
// keyed by SECTION TYPE (lowercase). Each section may declare multiple LAYOUT
// variants keyed by lowercased layout name plus a `default` layout. Dispatch is
// `variants[layoutName] ?? variants[default]`, with `WorkPlaceholderBlock` as the
// fallback for an unregistered section type OR an as-yet-unbuilt variant.
//
// The registry starts EMPTY — blocks register in phases 3 (hero), 4 (pilot set),
// 6 (layout library), 7 (remaining sections). Until a section registers, every
// lookup for it falls through to the placeholder. A1 guardrail preserved: a
// foreign/unknown layout name resolves to the section's `default`, so switching
// templates never breaks on a stored layout name.

import React from 'react';
import { WorkPlaceholderBlock } from './WorkPlaceholderBlock';
import WorkHeroSlider from './blocks/Hero/WorkHeroSlider';
import WorkHeroSliderPublished from './blocks/Hero/WorkHeroSlider.published';
import WorkHeroImage from './blocks/Hero/WorkHeroImage';
import WorkHeroImagePublished from './blocks/Hero/WorkHeroImage.published';
import WorkHeroSplit from './blocks/Hero/WorkHeroSplit';
import WorkHeroSplitPublished from './blocks/Hero/WorkHeroSplit.published';
import WorkHeroCenter from './blocks/Hero/WorkHeroCenter';
import WorkHeroCenterPublished from './blocks/Hero/WorkHeroCenter.published';
import WorkHeader from './blocks/Header/WorkHeader';
import WorkHeaderPublished from './blocks/Header/WorkHeader.published';
import WorkGalleryGrid from './blocks/Gallery/WorkGalleryGrid';
import WorkGalleryGridPublished from './blocks/Gallery/WorkGalleryGrid.published';
import WorkGalleryMasonry from './blocks/Gallery/WorkGalleryMasonry';
import WorkGalleryMasonryPublished from './blocks/Gallery/WorkGalleryMasonry.published';
import WorkGalleryStrip from './blocks/Gallery/WorkGalleryStrip';
import WorkGalleryStripPublished from './blocks/Gallery/WorkGalleryStrip.published';
import WorkProofTestimonials from './blocks/Proof/WorkProofTestimonials';
import WorkProofTestimonialsPublished from './blocks/Proof/WorkProofTestimonials.published';
import WorkProofLogos from './blocks/Proof/WorkProofLogos';
import WorkProofLogosPublished from './blocks/Proof/WorkProofLogos.published';
import WorkProofResults from './blocks/Proof/WorkProofResults';
import WorkProofResultsPublished from './blocks/Proof/WorkProofResults.published';
import WorkContact from './blocks/Contact/WorkContact';
import WorkContactPublished from './blocks/Contact/WorkContact.published';
import WorkFooter from './blocks/Footer/WorkFooter';
import WorkFooterPublished from './blocks/Footer/WorkFooter.published';
import WorkPackages from './blocks/Packages/WorkPackages';
import WorkPackagesPublished from './blocks/Packages/WorkPackages.published';
import WorkAbout from './blocks/About/WorkAbout';
import WorkAboutPublished from './blocks/About/WorkAbout.published';
import WorkFaq from './blocks/Faq/WorkFaq';
import WorkFaqPublished from './blocks/Faq/WorkFaq.published';
import WorkResults from './blocks/Results/WorkResults';
import WorkResultsPublished from './blocks/Results/WorkResults.published';

/** One built layout variant = an edit component + its published twin. */
export interface WorkBlockVariant {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

/** A section's variant set (scale-09). `default` names the fallback layout key. */
export interface WorkSectionEntry {
  variants: Record<string, WorkBlockVariant>;
  default: string;
}

// Keyed by section type (lowercase single tokens). Filled in phases 3/4/6/7.
// Variant keys are the LOWERCASED stored layout name (resolveWorkBlock lowercases
// the incoming layoutName before lookup). Phase 3: hero (WorkHeroSlider). The
// WorkHeroVideo slot (manifest) is declared-but-NOT-built — it has NO component,
// so it is intentionally ABSENT here.
export const WORK_BLOCK_REGISTRY: Record<string, WorkSectionEntry> = {
  header: {
    // INTERNAL DISPATCH: all 5 header arrangements share the ONE WorkHeader
    // component (it re-flows the CSS by the stored layout name, both modes). Every
    // header layout key therefore maps to the SAME component pair — the conformance
    // distinctness guard asserts .toBe(default) for the internalDispatch variants.
    default: 'workheader',
    variants: {
      workheader: { edit: WorkHeader, published: WorkHeaderPublished },
      workheaderstart: { edit: WorkHeader, published: WorkHeaderPublished },
      workheadercentered: { edit: WorkHeader, published: WorkHeaderPublished },
      workheadersplit: { edit: WorkHeader, published: WorkHeaderPublished },
      workheaderminimal: { edit: WorkHeader, published: WorkHeaderPublished },
    },
  },
  hero: {
    default: 'workheroslider',
    variants: {
      workheroslider: { edit: WorkHeroSlider, published: WorkHeroSliderPublished },
      workheroimage: { edit: WorkHeroImage, published: WorkHeroImagePublished },
      workherosplit: { edit: WorkHeroSplit, published: WorkHeroSplitPublished },
      workherocenter: { edit: WorkHeroCenter, published: WorkHeroCenterPublished },
      // WorkHeroVideo is a SLOT (manifest) — declared-but-NOT-built, no component.
    },
  },
  work: {
    default: 'workgallerygrid',
    variants: {
      workgallerygrid: { edit: WorkGalleryGrid, published: WorkGalleryGridPublished },
      workgallerymasonry: { edit: WorkGalleryMasonry, published: WorkGalleryMasonryPublished },
      workgallerystrip: { edit: WorkGalleryStrip, published: WorkGalleryStripPublished },
    },
  },
  proof: {
    default: 'workprooftestimonials',
    variants: {
      workprooftestimonials: { edit: WorkProofTestimonials, published: WorkProofTestimonialsPublished },
      workprooflogos: { edit: WorkProofLogos, published: WorkProofLogosPublished },
      workproofresults: { edit: WorkProofResults, published: WorkProofResultsPublished },
    },
  },
  contact: {
    default: 'workcontact',
    variants: {
      workcontact: { edit: WorkContact, published: WorkContactPublished },
    },
  },
  footer: {
    default: 'workfooter',
    variants: {
      workfooter: { edit: WorkFooter, published: WorkFooterPublished },
    },
  },
  packages: {
    default: 'workpackages',
    variants: {
      workpackages: { edit: WorkPackages, published: WorkPackagesPublished },
    },
  },
  about: {
    default: 'workabout',
    variants: {
      workabout: { edit: WorkAbout, published: WorkAboutPublished },
    },
  },
  faq: {
    default: 'workfaq',
    variants: {
      workfaq: { edit: WorkFaq, published: WorkFaqPublished },
    },
  },
  results: {
    default: 'workresults',
    variants: {
      workresults: { edit: WorkResults, published: WorkResultsPublished },
    },
  },
};

export type WorkBlockMode = 'edit' | 'published';

export function resolveWorkBlock(
  sectionType: string,
  mode: WorkBlockMode = 'edit',
  layoutName?: string,
): React.ComponentType<any> | null {
  const entry = WORK_BLOCK_REGISTRY[(sectionType || '').toLowerCase()];
  if (!entry) return WorkPlaceholderBlock;

  const lc = layoutName ? layoutName.toLowerCase() : undefined;
  const variant = (lc && entry.variants[lc]) || entry.variants[entry.default];
  if (!variant) return WorkPlaceholderBlock;

  return mode === 'published' ? variant.published : variant.edit;
}
