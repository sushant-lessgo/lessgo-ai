
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

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type CopyIntent = "pain-led" | "desire-led";

export type CTALayout =
  | "CenteredHeadlineCTA"
  | "CTAWithBadgeRow"
  | "VisualCTAWithMockup"
  | "SideBySideCTA"
  | "CountdownLimitedCTA"
  | "CTAWithFormField"
  | "ValueStackCTA"
  | "TestimonialCTACombo";

interface LayoutPickerInput {
  landingGoal: LandingGoal;
  toneProfile: ToneProfile;
  copyIntent: CopyIntent;
}

export function pickPrimaryCTALayout({
  landingGoal,
  toneProfile,
  copyIntent,
}: LayoutPickerInput): CTALayout {
  // Priority rules
  if (landingGoal === "buy-now" || copyIntent === "pain-led") {
    return "CountdownLimitedCTA";
  }

  if (landingGoal === "signup" || landingGoal === "free-trial") {
    return "CTAWithFormField";
  }

  if (landingGoal === "demo" || landingGoal === "book-call" || landingGoal === "contact-sales") {
    return "SideBySideCTA";
  }

  if (landingGoal === "waitlist" || landingGoal === "early-access") {
    return "VisualCTAWithMockup";
  }

  if (landingGoal === "join-community" || toneProfile === "friendly-helpful") {
    return "TestimonialCTACombo";
  }

  if (toneProfile === "luxury-expert" || toneProfile === "bold-persuasive") {
    return "ValueStackCTA";
  }

  if (toneProfile === "minimal-technical") {
    return "CTAWithBadgeRow";
  }

  // Fallback default
  return "CenteredHeadlineCTA";
}
