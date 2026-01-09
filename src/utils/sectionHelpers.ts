/**
 * Section Helper Utilities
 * Provides functions to identify and work with different section types
 */

import { sectionList } from '@/modules/sections/sectionList';

/**
 * Get the type classification of a section
 * @param sectionId - The section identifier (e.g., 'hero', 'cta', 'features')
 * @returns 'hero' | 'cta' | 'other'
 */
export function getSectionType(sectionId: string): 'hero' | 'cta' | 'other' {
  if (sectionId === 'hero') {
    return 'hero';
  }

  if (sectionId === 'cta') {
    return 'cta';
  }

  return 'other';
}

/**
 * Check if a primary CTA section exists in the given sections array
 * @param sections - Array of section IDs
 * @returns true if 'cta' section exists in the array
 */
export function hasPrimaryCTASection(sections: string[]): boolean {
  return sections.includes('cta');
}

/**
 * Find the primary CTA section in the sections array
 * @param sections - Array of section IDs
 * @returns The 'cta' section ID if found, null otherwise
 */
export function findPrimaryCTASection(sections: string[]): string | null {
  return sections.find(s => s === 'cta') || null;
}

/**
 * Get section metadata from sectionList
 * @param sectionId - The section identifier
 * @returns Section metadata or undefined if not found
 */
export function getSectionMeta(sectionId: string) {
  return sectionList.find(s => s.id === sectionId);
}

/**
 * Check if a section is a conversion-focused section (hero or CTA)
 * @param sectionId - The section identifier
 * @returns true if section is hero or cta
 */
export function isConversionSection(sectionId: string): boolean {
  return sectionId === 'hero' || sectionId === 'cta';
}

/**
 * Get the order of a section (for scrolling/positioning)
 * @param sectionId - The section identifier
 * @returns The section order number, or Infinity if not found
 */
export function getSectionOrder(sectionId: string): number {
  const meta = getSectionMeta(sectionId);
  return meta?.order ?? Infinity;
}

/**
 * Check if section A comes before section B in the page order
 * @param sectionIdA - First section identifier
 * @param sectionIdB - Second section identifier
 * @returns true if section A comes before section B
 */
export function isSectionBefore(sectionIdA: string, sectionIdB: string): boolean {
  return getSectionOrder(sectionIdA) < getSectionOrder(sectionIdB);
}
