import type { LayoutPickerInput } from "./layoutPickerInput";

export type SecurityLayout =
  | "ComplianceBadgeRow"
  | "SecurityChecklist"
  | "AuditTrustPanel"
  | "FAQStyleSecurity"
  | "StatWithShieldIcons"
  | "PartnerValidationRow"
  | "DiagramInfraSecurity"
  | "ExpandablePolicyCards";

/**
 * Selects the optimal Security section layout based on trust requirements and technical depth needs
 * Security sections address trust and compliance concerns - prioritizes credibility and risk mitigation
 */
export function pickSecurityLayout(input: LayoutPickerInput): SecurityLayout {
  const {
    awarenessLevel,
    toneProfile,
    startupStageGroup,
    marketCategory,
    landingGoalType,
    targetAudienceGroup,
    pricingModel,
    pricingModifier,
    pricingCommitmentOption,
    marketSophisticationLevel,
    copyIntent,
    problemType,
  } = input;

  // High-Priority Rules (Return immediately if matched)
  
  // 1. Regulated industries need compliance badges
  if (
    (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools" || marketCategory === "Customer Support & Service Tools") &&
    (problemType === "compliance-or-risk") &&
    (targetAudienceGroup === "enterprise" || targetAudienceGroup === "businesses")
  ) {
    return "ComplianceBadgeRow";
  }

  // 2. Technical audiences need infrastructure details
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools" || marketCategory === "AI Tools") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "DiagramInfraSecurity";
  }

  // 3. Enterprise with formal audit requirements
  if (
    targetAudienceGroup === "enterprise" &&
    (startupStageGroup === "growth" || startupStageGroup === "scale") &&
    (problemType === "compliance-or-risk") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "AuditTrustPanel";
  }

  // 4. Detailed security concerns need FAQ format
  if (
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "FAQStyleSecurity";
  }

  // 5. Simple trust building for early stage or SMB
  if (
    (startupStageGroup === "idea" || startupStageGroup === "mvp") &&
    (targetAudienceGroup === "founders" || targetAudienceGroup === "businesses") &&
    marketSophisticationLevel <= "level-2"
  ) {
    return "StatWithShieldIcons";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<SecurityLayout, number> = {
    ComplianceBadgeRow: 0,
    SecurityChecklist: 0,
    AuditTrustPanel: 0,
    FAQStyleSecurity: 0,
    StatWithShieldIcons: 0,
    PartnerValidationRow: 0,
    DiagramInfraSecurity: 0,
    ExpandablePolicyCards: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudienceGroup === "enterprise") {
    scores.ComplianceBadgeRow += 5;
    scores.AuditTrustPanel += 5;
    scores.ExpandablePolicyCards += 4;
    scores.PartnerValidationRow += 4;
    scores.DiagramInfraSecurity += 3;
  } else if (targetAudienceGroup === "builders") {
    scores.DiagramInfraSecurity += 5;
    scores.FAQStyleSecurity += 4;
    scores.SecurityChecklist += 3;
    scores.ExpandablePolicyCards += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.ComplianceBadgeRow += 4;
    scores.SecurityChecklist += 4;
    scores.PartnerValidationRow += 3;
    scores.StatWithShieldIcons += 3;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.StatWithShieldIcons += 4;
    scores.SecurityChecklist += 3;
    scores.ComplianceBadgeRow += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.SecurityChecklist += 4;
    scores.StatWithShieldIcons += 3;
    scores.ComplianceBadgeRow += 2;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "compliance-or-risk") {
    scores.ComplianceBadgeRow += 4;
    scores.AuditTrustPanel += 4;
    scores.ExpandablePolicyCards += 4;
    scores.PartnerValidationRow += 3;
    scores.FAQStyleSecurity += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.SecurityChecklist += 3;
    scores.StatWithShieldIcons += 3;
    scores.PartnerValidationRow += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.PartnerValidationRow += 3;
    scores.ComplianceBadgeRow += 3;
    scores.StatWithShieldIcons += 2;
  } else {
    // Default for other problem types
    scores.SecurityChecklist += 2;
    scores.StatWithShieldIcons += 2;
  }

  // Market Category Scoring (High Weight: 3-4 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.DiagramInfraSecurity += 4;
    scores.FAQStyleSecurity += 3;
    scores.SecurityChecklist += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.DiagramInfraSecurity += 4;
    scores.ExpandablePolicyCards += 3;
    scores.AuditTrustPanel += 2;
  } else if (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools") {
    scores.ComplianceBadgeRow += 4;
    scores.AuditTrustPanel += 4;
    scores.ExpandablePolicyCards += 3;
    scores.PartnerValidationRow += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.SecurityChecklist += 3;
    scores.PartnerValidationRow += 3;
    scores.ComplianceBadgeRow += 2;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.SecurityChecklist += 3;
    scores.StatWithShieldIcons += 3;
    scores.ComplianceBadgeRow += 2;
  } else if (marketCategory === "Customer Support & Service Tools") {
    scores.ComplianceBadgeRow += 3;
    scores.SecurityChecklist += 3;
    scores.PartnerValidationRow += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.StatWithShieldIcons += 4;
    scores.SecurityChecklist += 3;
    scores.ComplianceBadgeRow += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.SecurityChecklist += 4;
    scores.PartnerValidationRow += 3;
    scores.FAQStyleSecurity += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.DiagramInfraSecurity += 4;
    scores.AuditTrustPanel += 4;
    scores.ExpandablePolicyCards += 3;
    scores.FAQStyleSecurity += 3;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.StatWithShieldIcons += 3;
    scores.SecurityChecklist += 2;
    scores.ComplianceBadgeRow += 1;
  } else if (startupStageGroup === "traction") {
    scores.SecurityChecklist += 3;
    scores.PartnerValidationRow += 2;
    scores.ComplianceBadgeRow += 2;
  } else if (startupStageGroup === "growth") {
    scores.AuditTrustPanel += 3;
    scores.PartnerValidationRow += 3;
    scores.ComplianceBadgeRow += 2;
    scores.ExpandablePolicyCards += 2;
  } else if (startupStageGroup === "scale") {
    scores.AuditTrustPanel += 3;
    scores.DiagramInfraSecurity += 3;
    scores.ExpandablePolicyCards += 2;
    scores.ComplianceBadgeRow += 2;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.StatWithShieldIcons += 3;
    scores.SecurityChecklist += 2;
    scores.ComplianceBadgeRow += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.FAQStyleSecurity += 3;
    scores.SecurityChecklist += 3;
    scores.PartnerValidationRow += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.ExpandablePolicyCards += 3;
    scores.DiagramInfraSecurity += 3;
    scores.AuditTrustPanel += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "minimal-technical") {
    scores.DiagramInfraSecurity += 3;
    scores.SecurityChecklist += 2;
    scores.FAQStyleSecurity += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.AuditTrustPanel += 3;
    scores.PartnerValidationRow += 3;
    scores.ExpandablePolicyCards += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.SecurityChecklist += 3;
    scores.StatWithShieldIcons += 2;
    scores.FAQStyleSecurity += 2;
  } else if (toneProfile === "confident-playful") {
    scores.StatWithShieldIcons += 3;
    scores.SecurityChecklist += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.ComplianceBadgeRow += 3;
    scores.PartnerValidationRow += 2;
    scores.AuditTrustPanel += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingGoalType === "contact-sales" || landingGoalType === "demo") {
    scores.AuditTrustPanel += 2;
    scores.DiagramInfraSecurity += 2;
    scores.ExpandablePolicyCards += 1;
  } else if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.ComplianceBadgeRow += 2;
    scores.PartnerValidationRow += 1;
  } else if (landingGoalType === "free-trial") {
    scores.SecurityChecklist += 2;
    scores.FAQStyleSecurity += 1;
  } else if (landingGoalType === "signup") {
    scores.StatWithShieldIcons += 2;
    scores.SecurityChecklist += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.AuditTrustPanel += 2;
    scores.ExpandablePolicyCards += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.StatWithShieldIcons += 2;
    scores.SecurityChecklist += 1;
  } else if (pricingModel === "tiered") {
    scores.ComplianceBadgeRow += 2;
    scores.PartnerValidationRow += 1;
  }

  // Copy Intent Scoring (Low Weight: 1-2 points)
  if (copyIntent === "pain-led") {
    scores.SecurityChecklist += 2;
    scores.StatWithShieldIcons += 1;
  } else if (copyIntent === "desire-led") {
    scores.PartnerValidationRow += 2;
    scores.AuditTrustPanel += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as SecurityLayout, score } : max,
    { layout: "SecurityChecklist" as SecurityLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "SecurityChecklist";
}