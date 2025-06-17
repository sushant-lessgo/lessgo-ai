
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

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type StartupStageGroup =
  | "idea"
  | "mvp"
  | "traction"
  | "growth"
  | "scale";

export type IntegrationLayout =
  | "LogoGrid"
  | "CategoryAccordion"
  | "InteractiveStackDiagram"
  | "UseCaseTiles"
  | "BadgeCarousel"
  | "TabbyIntegrationCards"
  | "ZapierLikeBuilderPreview"
  | "LogoWithQuoteUse";

interface LayoutPickerInput {
  marketCategory: MarketCategory;
  toneProfile: ToneProfile;
  startupStageGroup: StartupStageGroup;
}

export function pickIntegrationLayout({
  marketCategory,
  toneProfile,
  startupStageGroup,
}: LayoutPickerInput): IntegrationLayout {
  // Priority rules
  if (marketCategory === "Engineering & Development Tools" || toneProfile === "minimal-technical") {
    return "InteractiveStackDiagram";
  }

  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    return "LogoGrid";
  }

  if (startupStageGroup === "scale" || marketCategory === "Marketing & Sales Tools") {
    return "TabbyIntegrationCards";
  }

  if (toneProfile === "confident-playful" || marketCategory === "No-Code & Low-Code Platforms") {
    return "BadgeCarousel";
  }

  if (marketCategory === "AI Tools" || toneProfile === "bold-persuasive") {
    return "ZapierLikeBuilderPreview";
  }

  if (toneProfile === "friendly-helpful") {
    return "UseCaseTiles";
  }

  if (toneProfile === "luxury-expert") {
    return "LogoWithQuoteUse";
  }

  // Fallback default
  return "CategoryAccordion";
}
