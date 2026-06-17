// src/utils/sectionAnchors.ts
// Maps each on-page section to a stable in-page anchor id so nav/footer links can
// scroll to it (href="#<anchor>"). Section types CAN repeat on a page (a user may
// duplicate a section), so duplicates are suffixed: first "features", then
// "features-2", "features-3". Used by BOTH the renderers (which emit id={anchor} on
// the section wrapper) and the editor link picker (which writes href="#<anchor>"),
// so the ids always match.

import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';

/**
 * Build a sectionId → anchorId map from the page's ordered section ids.
 * First occurrence of a type keeps the bare type ("pricing"); repeats get a
 * numeric suffix ("pricing-2", "pricing-3").
 */
export function buildSectionAnchorMap(sectionIds: string[]): Record<string, string> {
  const counts: Record<string, number> = {};
  const map: Record<string, string> = {};
  for (const id of sectionIds) {
    const type = extractSectionType(id);
    const n = (counts[type] = (counts[type] || 0) + 1);
    map[id] = n === 1 ? type : `${type}-${n}`;
  }
  return map;
}

/**
 * Build the "scroll to section" dropdown options for the link picker from the page's
 * ordered section ids. Excludes header/footer themselves. value = "#<anchor>".
 */
export function buildSectionLinkOptions(
  sectionIds: string[]
): { value: string; label: string }[] {
  const anchorMap = buildSectionAnchorMap(sectionIds);
  return sectionIds
    .filter((id) => {
      const t = extractSectionType(id);
      return t !== 'header' && t !== 'footer';
    })
    .map((id) => ({
      value: `#${anchorMap[id]}`,
      label: prettySectionLabel(extractSectionType(id)),
    }));
}

/** Human-friendly label for a section type (for the "scroll to section" dropdown). */
export function prettySectionLabel(type: string): string {
  const labels: Record<string, string> = {
    hero: 'Hero',
    features: 'Features',
    pricing: 'Pricing',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    cta: 'Call to action',
    contact: 'Contact',
    about: 'About',
    header: 'Header',
    footer: 'Footer',
  };
  if (labels[type]) return labels[type];
  // Fallback: split camelCase, capitalize.
  const spaced = type.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
