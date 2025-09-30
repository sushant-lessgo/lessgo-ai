import type { LayoutPickerInput } from "./layoutPickerInput";

/**
 * Picks the best footer layout based on business context
 */
export function pickFooterLayout(input: LayoutPickerInput): string {
  const { 
    startupStage,
    marketCategory,
    toneProfile,
    landingPageGoals
  } = input;

  // Early stage or MVPs start simple
  if (startupStage === 'mvp') {
    return 'SimpleFooter';
  }

  // Marketing tools benefit from social links
  if (marketCategory === 'Marketing & Sales Tools') {
    return 'LinksAndSocialFooter';
  }

  // Lead generation focus needs newsletter/contact
  if (landingPageGoals?.includes('lead_generation')) {
    return 'ContactFooter';
  }

  // Industry-specific SaaS needs comprehensive footer
  if (marketCategory === 'Healthcare Technology') {
    return 'MultiColumnFooter';
  }

  // Confident/playful brands prefer social integration
  if (toneProfile === 'confident-playful') {
    return 'LinksAndSocialFooter';
  }

  // Luxury/expert needs structure
  if (toneProfile === 'luxury-expert') {
    return 'MultiColumnFooter';
  }

  // Default to links and social for balance
  return 'LinksAndSocialFooter';
}