import type { LayoutPickerInput } from "./layoutPickerInput";

export type HeaderLayout =
  | "NavWithCTAHeader"
  | "FullNavHeader"
  | "MinimalNavHeader"
  | "CenteredLogoHeader";

/**
 * Selects the optimal Header layout based on landing page context
 * Header sections provide navigation and branding - always position 0
 */
export function pickHeaderLayout(input: LayoutPickerInput): HeaderLayout {
  const {
    toneProfile,
    startupStage,
    landingPageGoals,
    targetAudience,
    pricingModel,

    // PHASE 2.5: Flow-aware context fields (minimal use - always position 0)
    positionInFlow,
  } = input;

  // ===== PHASE 2.5: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.20.1: Landing Page = Simple (avoid navigation distraction)
  // For dedicated landing pages (not website), keep header minimal
  if (
    landingPageGoals === 'buy-now' ||
    landingPageGoals === 'subscribe' ||
    landingPageGoals === 'signup' ||
    landingPageGoals === 'free-trial'
  ) {
    // High-conversion goals need focused header
    return "NavWithCTAHeader";  // Logo + nav + CTA
  }

  // HR-4.20.2: Luxury/Professional = Navigation
  if (toneProfile === 'luxury-expert') {
    return "FullNavHeader";  // Full nav with dual CTAs
  }

  // ===== EXISTING: Simple Header Selection =====

  // Early stage startups benefit from focused CTAs
  if (startupStage === 'mvp' || startupStage === 'idea') {
    return "NavWithCTAHeader";  // Logo + nav + CTA
  }

  // SaaS typically needs more navigation options
  if (pricingModel === 'tiered') {
    return "FullNavHeader";  // Full nav with dual CTAs
  }

  // Confident/playful brands might prefer centered logo
  if (toneProfile === 'confident-playful') {
    return "MinimalNavHeader";  // Logo + minimal nav
  }

  // Simple/minimal approach for technical products
  if (toneProfile === 'minimal-technical') {
    return "MinimalNavHeader";  // Logo + minimal nav
  }

  // Enterprise audiences expect professional navigation
  if (targetAudience === 'enterprise') {
    return "FullNavHeader";  // Full nav with dual CTAs
  }

  // Default to simple header for balanced approach
  return "NavWithCTAHeader";  // Logo + nav + CTA
}
