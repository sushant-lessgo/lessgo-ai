// Deterministic section selection for V3 onboarding flow
// Reference: SecondOpinion.md

import type {
  LandingGoal,
  SectionType,
  SimplifiedAwarenessLevel,
  AssetAvailability,
  SectionDecisions,
} from '@/types/generation';

export interface SectionSelectionInput {
  landingGoal: LandingGoal;
  awareness: SimplifiedAwarenessLevel;
  assets: AssetAvailability;
  sectionDecisions: SectionDecisions;
  hasMultipleAudiences: boolean;
}

/**
 * Build trust sections based on available assets
 * Order: Results → Testimonials → Social Proof → Founder Note (fallback)
 * Skip Founder Note if 2+ proof sections available
 */
function buildTrustSections(assets: AssetAvailability, isWaitlist: boolean): SectionType[] {
  const trust: SectionType[] = [];

  if (assets.hasConcreteResults) trust.push('Results');
  if (assets.hasTestimonials) trust.push('Testimonials');
  if (assets.hasSocialProof) trust.push('SocialProof');

  // Waitlist: Skip FounderNote if 2+ proof sections
  // Product Ready: Use FounderNote as fallback if none available
  if (isWaitlist) {
    if (trust.length < 2) {
      trust.push('FounderNote');
    }
  } else {
    if (trust.length === 0) {
      trust.push('FounderNote');
    }
  }

  return trust;
}

/**
 * Select sections for Waitlist pages
 * Fixed Unique Mechanism, no LLM section decisions
 */
function selectWaitlistSections(input: SectionSelectionInput): SectionType[] {
  const { awareness, assets, sectionDecisions, hasMultipleAudiences } = input;
  const sections: SectionType[] = ['Header', 'Hero'];

  // Problem section only for Cold
  if (awareness === 'problem-aware-cold') {
    sections.push('Problem');
  }

  // Fixed: Unique Mechanism always
  sections.push('UniqueMechanism');

  // Features (always)
  sections.push('Features');

  // Use cases (only if B2B + multiple audiences)
  if (sectionDecisions.isB2B && hasMultipleAudiences) {
    sections.push('UseCases');
  }

  // How it works (always)
  sections.push('HowItWorks');

  // Trust section
  const trustSections = buildTrustSections(assets, true);
  sections.push(...trustSections);

  // CTA
  sections.push('CTA');

  // Footer
  sections.push('Footer');

  return sections;
}

/**
 * Select sections for Product Ready pages
 * Uses LLM section decisions
 */
function selectProductReadySections(input: SectionSelectionInput): SectionType[] {
  const { awareness, assets, sectionDecisions, hasMultipleAudiences } = input;
  const sections: SectionType[] = ['Header', 'Hero'];

  const trustSections = buildTrustSections(assets, false);

  switch (awareness) {
    case 'problem-aware-cold':
      // Hero → Problem → [LLM sections] → Trust → Features → UseCases → HowItWorks → Pricing → CTA → FAQ
      sections.push('Problem');

      // LLM-decided sections (Before/After, UniqueMechanism)
      if (sectionDecisions.includeBeforeAfter) sections.push('BeforeAfter');
      if (sectionDecisions.includeUniqueMechanism) sections.push('UniqueMechanism');

      // Trust
      sections.push(...trustSections);

      // Features (always)
      sections.push('Features');

      // Use cases
      if (sectionDecisions.isB2B && hasMultipleAudiences) {
        sections.push('UseCases');
      }

      // How it works (always)
      sections.push('HowItWorks');

      // Pricing
      sections.push('Pricing');

      // CTA
      sections.push('CTA');

      // FAQ
      sections.push('FAQ');
      break;

    case 'problem-aware-hot':
      // Hero → [LLM sections] → Trust → Features → UseCases → HowItWorks → Pricing → CTA → FAQ
      // No Problem section (hot = already feeling pain)

      // LLM-decided sections
      if (sectionDecisions.includeBeforeAfter) sections.push('BeforeAfter');
      if (sectionDecisions.includeUniqueMechanism) sections.push('UniqueMechanism');

      // Trust
      sections.push(...trustSections);

      // Features (always)
      sections.push('Features');

      // Use cases
      if (sectionDecisions.isB2B && hasMultipleAudiences) {
        sections.push('UseCases');
      }

      // How it works (always)
      sections.push('HowItWorks');

      // Pricing
      sections.push('Pricing');

      // CTA
      sections.push('CTA');

      // FAQ
      sections.push('FAQ');
      break;

    case 'solution-aware-skeptical':
      // Hero → Trust → [LLM sections including ObjectionHandle] → Features → UseCases → HowItWorks → Pricing → CTA → FAQ

      // Trust first (skeptics need proof early)
      sections.push(...trustSections);

      // LLM-decided sections (including ObjectionHandle for skeptics)
      if (sectionDecisions.includeBeforeAfter) sections.push('BeforeAfter');
      if (sectionDecisions.includeUniqueMechanism) sections.push('UniqueMechanism');
      if (sectionDecisions.includeObjectionHandle) sections.push('ObjectionHandle');

      // Features (always)
      sections.push('Features');

      // Use cases
      if (sectionDecisions.isB2B && hasMultipleAudiences) {
        sections.push('UseCases');
      }

      // How it works (always)
      sections.push('HowItWorks');

      // Pricing
      sections.push('Pricing');

      // CTA
      sections.push('CTA');

      // FAQ
      sections.push('FAQ');
      break;

    case 'solution-aware-eager':
      // Hero → Features → UseCases → HowItWorks → Trust → Pricing → CTA → FAQ
      // No Before/After, UniqueMechanism, or ObjectionHandle (eager = ready to buy)

      // Features first (eager wants to evaluate)
      sections.push('Features');

      // Use cases
      if (sectionDecisions.isB2B && hasMultipleAudiences) {
        sections.push('UseCases');
      }

      // How it works (always)
      sections.push('HowItWorks');

      // Trust (later for eager)
      sections.push(...trustSections);

      // Pricing
      sections.push('Pricing');

      // CTA
      sections.push('CTA');

      // FAQ
      sections.push('FAQ');
      break;
  }

  // Footer
  sections.push('Footer');

  return sections;
}

/**
 * Main section selection function
 * Deterministic based on SecondOpinion.md templates
 */
export function selectSectionsV3(input: SectionSelectionInput): SectionType[] {
  const isWaitlist = input.landingGoal === 'waitlist';

  if (isWaitlist) {
    return selectWaitlistSections(input);
  } else {
    return selectProductReadySections(input);
  }
}
