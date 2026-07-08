/**
 * Section Helper Utilities
 * Provides functions to identify and work with different section types
 */

import { sectionList } from '@/modules/sections/sectionList';
import type { CTAButton } from '@/types/destination';

/**
 * scale-04 — the single source of truth for a CTA's role. Reads the new
 * `cta.role` first, then falls back to the legacy `buttonConfig.ctaType`, then
 * to the element-key naming convention (`secondary_*` ⇒ secondary). Keeps old
 * saved pages classifying correctly while new writes carry `cta.role` explicitly.
 */
export function deriveCtaRole(opts: {
  cta?: Pick<CTAButton, 'role'> | { role?: unknown } | undefined;
  ctaType?: 'primary' | 'secondary' | undefined;
  elementKey?: string | undefined;
}): 'primary' | 'secondary' {
  const role = opts.cta?.role;
  if (role === 'primary' || role === 'secondary') return role;
  if (opts.ctaType === 'primary' || opts.ctaType === 'secondary') return opts.ctaType;
  if (opts.elementKey && /secondary/i.test(opts.elementKey)) return 'secondary';
  return 'primary';
}

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
