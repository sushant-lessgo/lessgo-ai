import type { LayoutPickerInput } from "./layoutPickerInput";

export type HeaderLayout =
  | "SimpleHeader"
  | "NavigationHeader"
  | "MinimalHeader";

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
    return "SimpleHeader";  // Logo + CTA only
  }

  // HR-4.20.2: Luxury/Professional = Navigation
  if (toneProfile === 'luxury-expert') {
    return "NavigationHeader";  // Full nav with links
  }

  // ===== EXISTING: Simple Header Selection =====

  // Early stage startups benefit from focused CTAs
  if (startupStage === 'mvp' || startupStage === 'idea') {
    return "SimpleHeader";  // Logo + CTA
  }

  // SaaS typically needs more navigation options
  if (pricingModel === 'tiered') {
    return "NavigationHeader";  // Full nav
  }

  // Confident/playful brands might prefer centered logo
  if (toneProfile === 'confident-playful') {
    return "MinimalHeader";  // Logo only
  }

  // Simple/minimal approach for technical products
  if (toneProfile === 'minimal-technical') {
    return "MinimalHeader";  // Logo only
  }

  // Enterprise audiences expect professional navigation
  if (targetAudience === 'enterprise') {
    return "NavigationHeader";  // Full nav
  }

  // Default to simple header for balanced approach
  return "SimpleHeader";  // Logo + CTA
}
