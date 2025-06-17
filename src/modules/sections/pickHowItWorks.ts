
export type AwarenessLevel =
  | "Unaware"
  | "Problem-Aware"
  | "Solution-Aware"
  | "Product-Aware"
  | "Most-Aware";

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

export type HowItWorksLayout =
  | "ThreeStepHorizontal"
  | "VerticalTimeline"
  | "IconCircleSteps"
  | "AccordionSteps"
  | "CardFlipSteps"
  | "VideoWalkthrough"
  | "ZigzagImageSteps"
  | "AnimatedProcessLine";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  startupStageGroup: StartupStageGroup;
  marketCategory: MarketCategory;
}

export function pickHowItWorksLayout({
  awarenessLevel,
  toneProfile,
  startupStageGroup,
  marketCategory,
}: LayoutPickerInput): HowItWorksLayout {
  // Priority rules
  if (awarenessLevel === "Unaware" || awarenessLevel === "Problem-Aware") {
    return "VerticalTimeline";
  }

  if (toneProfile === "confident-playful" && startupStageGroup === "idea") {
    return "IconCircleSteps";
  }

  if (toneProfile === "minimal-technical" && marketCategory === "Engineering & Development Tools") {
    return "AccordionSteps";
  }

  if (toneProfile === "luxury-expert" && awarenessLevel === "Most-Aware") {
    return "CardFlipSteps";
  }

  if (marketCategory === "AI Tools" || marketCategory === "Design & Creative Tools") {
    return "VideoWalkthrough";
  }

  if (toneProfile === "bold-persuasive" && awarenessLevel === "Solution-Aware") {
    return "ZigzagImageSteps";
  }

  if (startupStageGroup === "idea" && toneProfile === "friendly-helpful") {
    return "AnimatedProcessLine";
  }

  // Fallback default
  return "ThreeStepHorizontal";
}
