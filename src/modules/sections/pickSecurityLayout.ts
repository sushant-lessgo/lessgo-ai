
export type TargetAudience =
  | "founders"
  | "creators"
  | "marketers"
  | "businesses"
  | "builders"
  | "enterprise"
  | "community";

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type MarketCategory =
  | "Work & Productivity Tools"
  | "Marketing & Sales Tools"
  | "Engineering & Development Tools"
  | "AI Tools"
  | "Design & Creative Tools"
  | "No-Code & Low-Code Platforms"
  | "Customer Support & Service Tools"
  | "Data & Analytics Tools"
  | "HR & People Operations Tools"
  | "Finance & Accounting Tools"
  | "Web3 & Blockchain Tools"
  | "Product Add-ons & Integrations"
  | "Industry-Specific SaaS";

export type SecurityLayout =
  | "ComplianceBadgeRow"
  | "SecurityChecklist"
  | "AuditTrustPanel"
  | "FAQStyleSecurity"
  | "StatWithShieldIcons"
  | "PartnerValidationRow"
  | "DiagramInfraSecurity"
  | "ExpandablePolicyCards";

interface LayoutPickerInput {
  targetAudience: TargetAudience;
  toneProfile: ToneProfile;
  marketCategory: MarketCategory;
}

export function pickSecurityLayout({
  targetAudience,
  toneProfile,
  marketCategory,
}: LayoutPickerInput): SecurityLayout {
  // Priority rules
  if (targetAudience === "enterprise" || marketCategory === "Finance & Accounting Tools") {
    return "ComplianceBadgeRow";
  }

  if (toneProfile === "minimal-technical" || marketCategory === "Engineering & Development Tools") {
    return "SecurityChecklist";
  }

  if (toneProfile === "luxury-expert" || targetAudience === "businesses") {
    return "AuditTrustPanel";
  }

  if (toneProfile === "friendly-helpful") {
    return "FAQStyleSecurity";
  }

  if (targetAudience === "creators" || toneProfile === "confident-playful") {
    return "StatWithShieldIcons";
  }

  if (marketCategory === "Web3 & Blockchain Tools") {
    return "DiagramInfraSecurity";
  }

  if (marketCategory === "Customer Support & Service Tools") {
    return "PartnerValidationRow";
  }

  // Fallback default
  return "ExpandablePolicyCards";
}
