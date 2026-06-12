/**
 * Validate and fix section ordering.
 */
import type { SectionType, LandingGoal, AssetAvailability, FrictionLevel } from '@/types/generation';

// Low friction goals = FAQ after CTA
const LOW_FRICTION_GOALS: LandingGoal[] = ['waitlist', 'signup', 'free-trial', 'download'];

// High friction goals = FAQ before CTA
const HIGH_FRICTION_GOALS: LandingGoal[] = ['buy', 'demo'];

/**
 * Canonical persuasion order for middle sections.
 * AI chooses which sections to include, we enforce the order.
 */
const CANONICAL_ORDER: SectionType[] = [
  'Problem',         // Awareness/Empathy - "Do you understand my pain?"
  'BeforeAfter',     // Outcome - "What transformation do I get?"
  'UniqueMechanism', // Differentiation - "Why is this different?"
  'Features',        // What you get - "What do I get?"
  'HowItWorks',      // How to use - "How do I use it?"
  'UseCases',        // Fit confirmation - "Is this for me?"
  'Testimonials',    // Trust (proof) - "Are there people like me?"
  'SocialProof',     // Trust (proof) - "Is this legit?"
  'Results',         // Trust (proof) - "Does it work?"
  'Pricing',         // Price - "How much?"
  'ObjectionHandle', // Risk - "What about [risk]?"
  'FAQ',             // Cleanup - "Small questions"
  'FounderNote',     // Personal - "Who's behind this?"
];

/**
 * Apply canonical persuasion order to middle sections.
 * Preserves only sections that exist in the input, but reorders them.
 */
export function applyCanonicalOrder(middleSections: SectionType[]): SectionType[] {
  const sectionSet = new Set(middleSections);
  return CANONICAL_ORDER.filter((s) => sectionSet.has(s));
}

/**
 * Limit proof sections to at most 2.
 * Keeps the first 2 in canonical order (Testimonials > SocialProof > Results).
 */
export function limitProofSections(middleSections: SectionType[]): SectionType[] {
  const proofSections: SectionType[] = ['Testimonials', 'SocialProof', 'Results'];
  const proofInSections = middleSections.filter((s) => proofSections.includes(s));

  if (proofInSections.length <= 2) {
    return middleSections;
  }

  // Keep first 2 proof sections (in canonical order)
  const toRemove = proofInSections.slice(2);
  return middleSections.filter((s) => !toRemove.includes(s));
}

/**
 * Determine friction level from landing goal.
 */
export function getFrictionFromGoal(landingGoal: LandingGoal): FrictionLevel {
  if (LOW_FRICTION_GOALS.includes(landingGoal)) return 'low';
  if (HIGH_FRICTION_GOALS.includes(landingGoal)) return 'high';
  return 'medium';
}

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
