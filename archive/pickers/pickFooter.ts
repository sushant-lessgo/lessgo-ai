import type { LayoutPickerInput } from "./layoutPickerInput";

export type FooterLayout =
  | "SimpleFooter"
  | "MultiColumnFooter"
  | "LinksAndSocialFooter"
  | "ContactFooter";

/**
 * Selects the optimal Footer layout based on trust and navigation needs
 * Footer sections provide legal, links, and trust signals - always position -1
 */
export function pickFooterLayout(input: LayoutPickerInput): FooterLayout {
  const {
    startupStage,
    marketCategory,
    toneProfile,
    landingPageGoals,
    targetAudience,

    // PHASE 2.5: Flow-aware context fields (minimal use - always position -1)
    totalSectionsInFlow,
  } = input;

  // ===== PHASE 2.5: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.21.1: Enterprise/Regulated = Trust Footer
  if (
    (marketCategory === 'Healthcare Technology' ||
     marketCategory === 'Legal Technology' ||
     marketCategory === 'Finance & Accounting Tools') ||
    targetAudience === 'enterprise'
  ) {
    // Regulated/enterprise needs trust signals in footer
    return "ContactFooter";  // Professional footer with contact info for trust
  }

  // HR-4.21.2: Simple Landing Page = Simple Footer
  if (
    (landingPageGoals === 'signup' ||
     landingPageGoals === 'free-trial' ||
     landingPageGoals === 'download' ||
     landingPageGoals === 'waitlist') &&
    (startupStage === 'mvp' || startupStage === 'idea')
  ) {
    // Low-friction goals + early stage = minimal footer
    return "SimpleFooter";  // Links + legal only
  }

  // ===== EXISTING: Footer Selection =====

  // Early stage or MVPs start simple
  if (startupStage === 'mvp' || startupStage === 'idea') {
    return "SimpleFooter";  // Links + legal
  }

  // Marketing tools benefit from social links
  if (marketCategory === 'Marketing & Sales Tools') {
    return "LinksAndSocialFooter";  // Includes social media integration
  }

  // Industry-specific SaaS needs comprehensive footer
  if (
    marketCategory === 'Business Productivity Tools' ||
    marketCategory === 'Data & Analytics Tools' ||
    marketCategory === 'HR & People Operations Tools'
  ) {
    return "MultiColumnFooter";  // Multi-column sitemap footer
  }

  // Confident/playful brands prefer social integration
  if (toneProfile === 'confident-playful') {
    return "LinksAndSocialFooter";  // Includes social links
  }

  // Luxury/expert needs structured footer
  if (toneProfile === 'luxury-expert') {
    return "MultiColumnFooter";  // Professional multi-column
  }

  // Growth/scale companies need comprehensive footer
  if (startupStage === 'growth' || startupStage === 'scale') {
    return "MultiColumnFooter";  // Full footer with all sections
  }

  // Default to simple footer for balance
  return "SimpleFooter";  // Links + legal
}
