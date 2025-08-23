import type { LayoutPickerInput } from "./layoutPickerInput";

/**
 * Picks the best header layout based on business context
 */
export function pickHeaderLayout(input: LayoutPickerInput): string {
  const { 
    startupStage,
    landingPageGoals,
    pricingModel,
    toneProfile
  } = input;

  // Luxury tone prefers full navigation
  if (toneProfile === 'luxury-expert') {
    return 'FullNavHeader';
  }

  // Early stage startups benefit from focused CTAs
  if (startupStage === 'mvp') {
    return 'NavWithCTAHeader';
  }

  // SaaS typically needs more navigation options
  if (pricingModel === 'tiered') {
    return 'FullNavHeader';
  }

  // Confident/playful brands might prefer centered logo
  if (toneProfile === 'confident-playful') {
    return 'CenteredLogoHeader';
  }

  // Lead generation focus needs prominent CTA
  if (landingPageGoals?.includes('lead_generation')) {
    return 'NavWithCTAHeader';
  }

  // Simple/minimal approach for MVP or early products
  if (toneProfile === 'minimal-technical') {
    return 'MinimalNavHeader';
  }

  // Default to nav with CTA for balanced approach
  return 'NavWithCTAHeader';
}