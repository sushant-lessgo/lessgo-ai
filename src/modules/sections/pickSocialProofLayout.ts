
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

export type SocialProofLayout =
  | "LogoWall"
  | "MediaMentions"
  | "UserCountBar"
  | "IndustryBadgeLine"
  | "MapHeatSpots"
  | "StackedStats"
  | "StripWithReviews"
  | "SocialProofStrip";

interface LayoutPickerInput {
  targetAudience: TargetAudience;
  toneProfile: ToneProfile;
  marketCategory: MarketCategory;
}

export function pickSocialProofLayout({
  targetAudience,
  toneProfile,
  marketCategory,
}: LayoutPickerInput): SocialProofLayout {
  // Priority rules
  if (targetAudience === "enterprise" || marketCategory === "Finance & Accounting Tools") {
    return "StackedStats";
  }

  if (toneProfile === "confident-playful" || targetAudience === "creators") {
    return "UserCountBar";
  }

  if (marketCategory === "AI Tools" || marketCategory === "Marketing & Sales Tools") {
    return "MediaMentions";
  }

  if (toneProfile === "minimal-technical" || marketCategory === "Engineering & Development Tools") {
    return "LogoWall";
  }

  if (targetAudience === "community" || toneProfile === "friendly-helpful") {
    return "MapHeatSpots";
  }

  if (targetAudience === "marketers" || toneProfile === "bold-persuasive") {
    return "StripWithReviews";
  }

  if (marketCategory === "Industry-Specific SaaS") {
    return "IndustryBadgeLine";
  }

  // Fallback default
  return "SocialProofStrip";
}
