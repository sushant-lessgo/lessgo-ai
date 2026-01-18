/**
 * Validate and fix section ordering.
 */
import type { SectionType, LandingGoal, AssetAvailability } from '@/types/generation';

// Low friction goals = FAQ after CTA
const LOW_FRICTION_GOALS: LandingGoal[] = ['waitlist', 'signup', 'free-trial', 'download'];

// High friction goals = FAQ before CTA
const HIGH_FRICTION_GOALS: LandingGoal[] = ['buy', 'demo'];

/**
 * Validate and fix section ordering based on spec rules.
 *
 * Rules:
 * 1. Dedupe sections
 * 2. Remove Testimonials/SocialProof/Results if assets not available
 * 3. Fixed ordering: Header first, Hero second, CTA near-end, Footer last
 * 4. FAQ placement by friction: low friction = after CTA, high friction = before CTA
 */
export function validateSections(
  sections: SectionType[],
  landingGoal: LandingGoal,
  assets: AssetAvailability
): SectionType[] {
  // 1. Dedupe while preserving order
  const seen = new Set<SectionType>();
  const deduped: SectionType[] = [];
  for (const section of sections) {
    if (!seen.has(section)) {
      seen.add(section);
      deduped.push(section);
    }
  }

  // 2. Filter by asset availability
  const filtered = deduped.filter((s) => {
    if (s === 'Testimonials' && !assets.hasTestimonials) return false;
    if (s === 'SocialProof' && !assets.hasSocialProof) return false;
    if (s === 'Results' && !assets.hasConcreteResults) return false;
    return true;
  });

  // 3. Extract fixed sections and middle sections
  const fixedSections: SectionType[] = ['Header', 'Hero', 'CTA', 'Footer'];
  const middle = filtered.filter((s) => !fixedSections.includes(s));

  // 4. Handle FAQ placement based on goal friction
  const hasFAQ = middle.includes('FAQ');
  const middleWithoutFAQ = middle.filter((s) => s !== 'FAQ');

  // 5. Build final order
  const result: SectionType[] = ['Header', 'Hero'];

  // Add middle sections (without FAQ for now)
  result.push(...middleWithoutFAQ);

  // 6. Place FAQ and CTA based on friction
  if (LOW_FRICTION_GOALS.includes(landingGoal)) {
    // Low friction: CTA then FAQ
    result.push('CTA');
    if (hasFAQ) result.push('FAQ');
  } else {
    // High friction: FAQ then CTA
    if (hasFAQ) result.push('FAQ');
    result.push('CTA');
  }

  // Footer always last
  result.push('Footer');

  return result;
}

/**
 * Ensure minimum required sections are present.
 */
export function ensureMinimumSections(sections: SectionType[]): SectionType[] {
  const required: SectionType[] = ['Header', 'Hero', 'CTA', 'Footer'];
  const missing = required.filter((s) => !sections.includes(s));

  if (missing.length === 0) return sections;

  // Add missing sections in correct positions
  const result = [...sections];

  if (!result.includes('Header')) {
    result.unshift('Header');
  }
  if (!result.includes('Hero')) {
    const headerIdx = result.indexOf('Header');
    result.splice(headerIdx + 1, 0, 'Hero');
  }
  if (!result.includes('Footer')) {
    result.push('Footer');
  }
  if (!result.includes('CTA')) {
    const footerIdx = result.indexOf('Footer');
    result.splice(footerIdx, 0, 'CTA');
  }

  return result;
}
