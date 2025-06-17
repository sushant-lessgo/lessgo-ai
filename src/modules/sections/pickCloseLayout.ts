
export type LandingGoal =
  | "waitlist"
  | "early-access"
  | "signup"
  | "free-trial"
  | "demo"
  | "book-call"
  | "buy-now"
  | "subscribe"
  | "download"
  | "join-community"
  | "watch-video"
  | "contact-sales";

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

export type CloseLayout =
  | "MockupWithCTA"
  | "BonusStackCTA"
  | "LeadMagnetCard"
  | "EnterpriseContactBox"
  | "ValueReinforcementBlock"
  | "LivePreviewEmbed"
  | "SideBySideOfferCards"
  | "MultistepCTAStack";

interface LayoutPickerInput {
  landingGoal: LandingGoal;
  targetAudience: TargetAudience;
  toneProfile: ToneProfile;
}

export function pickCloseLayout({
  landingGoal,
  targetAudience,
  toneProfile,
}: LayoutPickerInput): CloseLayout {
  // Priority rules
  if (landingGoal === "contact-sales" || targetAudience === "enterprise") {
    return "EnterpriseContactBox";
  }

  if (landingGoal === "download" || landingGoal === "join-community") {
    return "LeadMagnetCard";
  }

  if (landingGoal === "demo" || landingGoal === "watch-video") {
    return "LivePreviewEmbed";
  }

  if (landingGoal === "waitlist" || landingGoal === "early-access") {
    return "BonusStackCTA";
  }

  if (landingGoal === "book-call" || landingGoal === "free-trial") {
    return "MultistepCTAStack";
  }

  if (toneProfile === "luxury-expert" || toneProfile === "bold-persuasive") {
    return "SideBySideOfferCards";
  }

  if (toneProfile === "confident-playful" || toneProfile === "friendly-helpful") {
    return "MockupWithCTA";
  }

  // Fallback default
  return "ValueReinforcementBlock";
}
