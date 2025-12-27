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

// Miscellaneous
import AnnouncementPublished from '@/modules/UIBlocks/Miscellaneous/Announcement.published';

// Primary CTA
import CTAWithFormFieldPublished from '@/modules/UIBlocks/PrimaryCTA/CTAWithFormField.published';

// Footer
import SimpleFooterPublished from '@/modules/UIBlocks/Footer/SimpleFooter.published';

// Registry structure - ONLY server-safe published components
const publishedComponentRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    minimalist: MinimalistPublished,
  },
  miscellaneous: {
    announcement: AnnouncementPublished,
  },
  primarycta: {
    ctawithformfield: CTAWithFormFieldPublished,
  },
  cta: {
    ctawithformfield: CTAWithFormFieldPublished,
  },
  footer: {
    simplefooter: SimpleFooterPublished,
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
