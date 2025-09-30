import type { LayoutPickerInput } from "./layoutPickerInput";

export type SecurityLayout =
  | "AuditResultsPanel"
  | "PenetrationTestResults"
  | "PrivacyCommitmentBlock"
  | "SecurityChecklist"
  | "SecurityGuaranteePanel"
  | "TrustSealCollection";

/**
 * Selects the optimal Security section layout based on trust requirements and technical depth needs
 * Security sections address trust and compliance concerns - prioritizes credibility and risk mitigation
 */
export function pickSecurityLayout(input: LayoutPickerInput): SecurityLayout {
  const {
  awarenessLevel,
  toneProfile,
  startupStage,             // ✅ FIXED
  marketCategory,
  landingPageGoals,         // ✅ FIXED  
  targetAudience,           // ✅ FIXED
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
    (targetAudience === "enterprise" || targetAudience === "businesses")
  ) {
    return "TrustSealCollection";
  }

  // 2. Technical audiences need infrastructure details
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools" || marketCategory === "AI Tools") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "SecurityGuaranteePanel";
  }

  // 3. Enterprise with formal audit requirements
  if (
    targetAudience === "enterprise" &&
    (startupStage === "growth" || startupStage === "scale") &&
    (problemType === "compliance-or-risk") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "AuditResultsPanel";
  }

  // 4. Detailed security concerns need checklist format
  if (
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "SecurityChecklist";
  }

  // 5. Simple trust building for early stage or SMB
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    (targetAudience === "founders" || targetAudience === "businesses") &&
    marketSophisticationLevel <= "level-2"
  ) {
    return "SecurityGuaranteePanel";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<SecurityLayout, number> = {
    AuditResultsPanel: 0,
    PenetrationTestResults: 0,
    PrivacyCommitmentBlock: 0,
    SecurityChecklist: 0,
    SecurityGuaranteePanel: 0,
    TrustSealCollection: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudience === "enterprise") {
    scores.TrustSealCollection += 5;
    scores.AuditResultsPanel += 5;
    scores.PrivacyCommitmentBlock += 4;
    scores.PenetrationTestResults += 3;
    scores.SecurityGuaranteePanel += 3;
  } else if (targetAudience === "builders") {
    scores.SecurityGuaranteePanel += 5;
    scores.SecurityChecklist += 4;
    scores.PenetrationTestResults += 3;
    scores.PrivacyCommitmentBlock += 2;
  } else if (targetAudience === "businesses") {
    scores.TrustSealCollection += 4;
    scores.SecurityChecklist += 4;
    scores.SecurityGuaranteePanel += 3;
    scores.AuditResultsPanel += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.SecurityGuaranteePanel += 4;
    scores.SecurityChecklist += 3;
    scores.TrustSealCollection += 2;
  } else if (targetAudience === "marketers") {
    scores.SecurityChecklist += 4;
    scores.SecurityGuaranteePanel += 3;
    scores.TrustSealCollection += 2;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "compliance-or-risk") {
    scores.TrustSealCollection += 4;
    scores.AuditResultsPanel += 4;
    scores.PrivacyCommitmentBlock += 4;
    scores.PenetrationTestResults += 3;
    scores.SecurityChecklist += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.SecurityChecklist += 3;
    scores.SecurityGuaranteePanel += 3;
    scores.TrustSealCollection += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.TrustSealCollection += 3;
    scores.SecurityGuaranteePanel += 2;
    scores.AuditResultsPanel += 2;
  } else {
    // Default for other problem types
    scores.SecurityChecklist += 2;
    scores.SecurityGuaranteePanel += 2;
  }

  // Market Category Scoring (High Weight: 3-4 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.SecurityGuaranteePanel += 4;
    scores.PenetrationTestResults += 3;
    scores.SecurityChecklist += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.SecurityGuaranteePanel += 4;
    scores.PrivacyCommitmentBlock += 3;
    scores.AuditResultsPanel += 2;
  } else if (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools") {
    scores.TrustSealCollection += 4;
    scores.AuditResultsPanel += 4;
    scores.PrivacyCommitmentBlock += 3;
    scores.PenetrationTestResults += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.SecurityChecklist += 3;
    scores.TrustSealCollection += 3;
    scores.SecurityGuaranteePanel += 2;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.SecurityChecklist += 3;
    scores.SecurityGuaranteePanel += 3;
    scores.TrustSealCollection += 2;
  } else if (marketCategory === "Customer Support & Service Tools") {
    scores.TrustSealCollection += 3;
    scores.SecurityChecklist += 3;
    scores.PrivacyCommitmentBlock += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.SecurityGuaranteePanel += 4;
    scores.SecurityChecklist += 3;
    scores.TrustSealCollection += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.SecurityChecklist += 4;
    scores.TrustSealCollection += 3;
    scores.AuditResultsPanel += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.PenetrationTestResults += 4;
    scores.AuditResultsPanel += 4;
    scores.PrivacyCommitmentBlock += 3;
    scores.SecurityGuaranteePanel += 3;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.SecurityGuaranteePanel += 3;
    scores.SecurityChecklist += 2;
    scores.TrustSealCollection += 1;
  } else if (startupStage === "traction") {
    scores.SecurityChecklist += 3;
    scores.TrustSealCollection += 2;
    scores.SecurityGuaranteePanel += 2;
  } else if (startupStage === "growth") {
    scores.AuditResultsPanel += 3;
    scores.TrustSealCollection += 3;
    scores.PrivacyCommitmentBlock += 2;
    scores.PenetrationTestResults += 2;
  } else if (startupStage === "scale") {
    scores.AuditResultsPanel += 3;
    scores.PenetrationTestResults += 3;
    scores.PrivacyCommitmentBlock += 2;
    scores.TrustSealCollection += 2;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.SecurityGuaranteePanel += 3;
    scores.SecurityChecklist += 2;
    scores.TrustSealCollection += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SecurityChecklist += 3;
    scores.AuditResultsPanel += 2;
    scores.TrustSealCollection += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.PrivacyCommitmentBlock += 3;
    scores.PenetrationTestResults += 3;
    scores.AuditResultsPanel += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "minimal-technical") {
    scores.PenetrationTestResults += 3;
    scores.SecurityChecklist += 2;
    scores.SecurityGuaranteePanel += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.AuditResultsPanel += 3;
    scores.TrustSealCollection += 3;
    scores.PrivacyCommitmentBlock += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.SecurityChecklist += 3;
    scores.SecurityGuaranteePanel += 2;
    scores.TrustSealCollection += 2;
  } else if (toneProfile === "confident-playful") {
    scores.SecurityGuaranteePanel += 3;
    scores.SecurityChecklist += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.TrustSealCollection += 3;
    scores.AuditResultsPanel += 2;
    scores.SecurityGuaranteePanel += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.AuditResultsPanel += 2;
    scores.PenetrationTestResults += 2;
    scores.PrivacyCommitmentBlock += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.TrustSealCollection += 2;
    scores.SecurityGuaranteePanel += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.SecurityChecklist += 2;
    scores.SecurityGuaranteePanel += 1;
  } else if (landingPageGoals === "signup") {
    scores.SecurityGuaranteePanel += 2;
    scores.SecurityChecklist += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.AuditResultsPanel += 2;
    scores.PrivacyCommitmentBlock += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.SecurityGuaranteePanel += 2;
    scores.SecurityChecklist += 1;
  } else if (pricingModel === "tiered") {
    scores.TrustSealCollection += 2;
    scores.SecurityGuaranteePanel += 1;
  }

  // Copy Intent Scoring (Low Weight: 1-2 points)
  if (copyIntent === "pain-led") {
    scores.SecurityChecklist += 2;
    scores.SecurityGuaranteePanel += 1;
  } else if (copyIntent === "desire-led") {
    scores.TrustSealCollection += 2;
    scores.AuditResultsPanel += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as SecurityLayout, score } : max,
    { layout: "SecurityChecklist" as SecurityLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "SecurityChecklist";
}