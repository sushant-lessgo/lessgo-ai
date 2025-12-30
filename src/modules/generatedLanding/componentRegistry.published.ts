/**
 * Published Component Registry - Server-safe component registry for published pages
 *
 * @remarks
 * - ONLY imports components with published mode support
 * - NO imports from components with hooks at module level
 * - Server-safe for renderToString
 * - Currently includes 4 test components (Minimalist, Announcement, CTAWithFormField, SimpleFooter)
 *
 * Expansion:
 * - Add more UIBlocks as they're updated with *Published functions
 * - Verify each component is server-safe before adding
 */

import React from 'react';

// Import ONLY published-safe files - NO hooks, NO editor components
// These are separate .published.tsx files with ZERO hook imports

// Hero
import MinimalistPublished from '@/modules/UIBlocks/Hero/Minimalist.published';
import CenterStackedPublished from '@/modules/UIBlocks/Hero/centerStacked.published';
import ImageFirstPublished from '@/modules/UIBlocks/Hero/imageFirst.published';
import LeftCopyRightImagePublished from '@/modules/UIBlocks/Hero/leftCopyRightImage.published';
import SplitScreenPublished from '@/modules/UIBlocks/Hero/splitScreen.published';

// Header
import CenteredLogoHeaderPublished from '@/modules/UIBlocks/Header/CenteredLogoHeader.published';
import FullNavHeaderPublished from '@/modules/UIBlocks/Header/FullNavHeader.published';
import MinimalNavHeaderPublished from '@/modules/UIBlocks/Header/MinimalNavHeader.published';
import NavWithCTAHeaderPublished from '@/modules/UIBlocks/Header/NavWithCTAHeader.published';

// Miscellaneous
import AnnouncementPublished from '@/modules/UIBlocks/Miscellaneous/Announcement.published';

// Primary CTA
import CTAWithFormFieldPublished from '@/modules/UIBlocks/PrimaryCTA/CTAWithFormField.published';
import VisualCTAWithMockupPublished from '@/modules/UIBlocks/PrimaryCTA/VisualCTAWithMockup.published';

// Footer
import SimpleFooterPublished from '@/modules/UIBlocks/Footer/SimpleFooter.published';
import ContactFooterPublished from '@/modules/UIBlocks/Footer/ContactFooter.published';
import LinksAndSocialFooterPublished from '@/modules/UIBlocks/Footer/LinksAndSocialFooter.published';
import MultiColumnFooterPublished from '@/modules/UIBlocks/Footer/MultiColumnFooter.published';

// Problem
import StackedPainBulletsPublished from '@/modules/UIBlocks/Problem/StackedPainBullets.published';

// Results
import OutcomeIconsPublished from '@/modules/UIBlocks/Results/OutcomeIcons.published';

// Features
import IconGridPublished from '@/modules/UIBlocks/Features/IconGrid.published';

// HowItWorks
import AccordionStepsPublished from '@/modules/UIBlocks/HowItWorks/AccordionSteps.published';

// FounderNote
import FounderCardWithQuotePublished from '@/modules/UIBlocks/FounderNote/FounderCardWithQuote.published';

// FAQ
import AccordionFAQPublished from '@/modules/UIBlocks/FAQ/AccordionFAQ.published';

// Registry structure - ONLY server-safe published components
const publishedComponentRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    minimalist: MinimalistPublished,
    centerstacked: CenterStackedPublished,
    imagefirst: ImageFirstPublished,
    leftcopyrightimage: LeftCopyRightImagePublished,
    splitscreen: SplitScreenPublished,
  },
  header: {
    centeredlogoheader: CenteredLogoHeaderPublished,
    fullnavheader: FullNavHeaderPublished,
    minimalnavheader: MinimalNavHeaderPublished,
    navwithctaheader: NavWithCTAHeaderPublished,
  },
  miscellaneous: {
    announcement: AnnouncementPublished,
  },
  primarycta: {
    ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
  },
  cta: {
    ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
  },
  footer: {
    simplefooter: SimpleFooterPublished,
    contactfooter: ContactFooterPublished,
    linksandsocialfooter: LinksAndSocialFooterPublished,
    multicolumnfooter: MultiColumnFooterPublished,
  },
  problem: {
    stackedpainbullets: StackedPainBulletsPublished,
  },
  results: {
    outcomeicons: OutcomeIconsPublished,
  },
  features: {
    icongrid: IconGridPublished,
  },
  howitworks: {
    accordionsteps: AccordionStepsPublished,
  },
  foundernote: {
    foundercardwithquote: FounderCardWithQuotePublished,
  },
  faq: {
    accordionfaq: AccordionFAQPublished,
  },
};

// Helper functions (same pattern as editor registry)

/**
 * Extract section type from sectionId
 * @example extractSectionType('hero-123') => 'hero'
 */
export function extractSectionType(sectionId: string): string {
  return sectionId.split('-')[0].toLowerCase();
}

/**
 * Get component from registry by section type and layout name
 * @returns Component or null if not found
 */
export function getComponent(type: string, layout: string): React.ComponentType<any> | null {
  const normalizedType = type.toLowerCase();
  const normalizedLayout = layout.toLowerCase();
  return publishedComponentRegistry[normalizedType]?.[normalizedLayout] ?? null;
}

/**
 * Check if a layout exists for a section type
 */
export function hasLayout(type: string, layout: string): boolean {
  return getComponent(type, layout) !== null;
}

/**
 * Get all available layouts for a section type
 */
export function getAvailableLayouts(type: string): string[] {
  const normalizedType = type.toLowerCase();
  return Object.keys(publishedComponentRegistry[normalizedType] || {});
}
