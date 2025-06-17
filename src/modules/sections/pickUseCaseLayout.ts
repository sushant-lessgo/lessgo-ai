
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

export type UseCaseLayout =
  | "PersonaGrid"
  | "TabbedUseCases"
  | "IndustryTiles"
  | "ScenarioCards"
  | "JobToBeDoneList"
  | "SegmentSplitBlocks"
  | "CarouselAvatars"
  | "RoleBenefitMatrix";

interface LayoutPickerInput {
  targetAudience: TargetAudience;
  toneProfile: ToneProfile;
  marketCategory: MarketCategory;
}

export function pickUseCaseLayout({
  targetAudience,
  toneProfile,
  marketCategory,
}: LayoutPickerInput): UseCaseLayout {
  // Priority rules
  if (targetAudience === "enterprise") {
    return "RoleBenefitMatrix";
  }

  if (targetAudience === "founders" && toneProfile === "bold-persuasive") {
    return "SegmentSplitBlocks";
  }

  if (targetAudience === "creators" || targetAudience === "builders") {
    return "ScenarioCards";
  }

  if (targetAudience === "marketers" && toneProfile === "confident-playful") {
    return "CarouselAvatars";
  }

  if (toneProfile === "minimal-technical" && marketCategory === "Engineering & Development Tools") {
    return "TabbedUseCases";
  }

  if (marketCategory === "Industry-Specific SaaS") {
    return "IndustryTiles";
  }

  if (targetAudience === "community" || toneProfile === "friendly-helpful") {
    return "JobToBeDoneList";
  }

  // Fallback default
  return "PersonaGrid";
}
