import type { LayoutPickerInput } from "./layoutPickerInput";

export type HowItWorksLayout =
  | "ThreeStepHorizontal"
  | "VerticalTimeline"
  | "IconCircleSteps"
  | "AccordionSteps"
  | "VideoWalkthrough"
  | "ZigzagImageSteps"
  | "AnimatedProcessLine";

/**
 * Selects the optimal HowItWorks section layout based on process complexity and user understanding needs
 * HowItWorks sections reduce friction by explaining the process - prioritizes clarity and reducing cognitive load
 */
export function pickHowItWorksLayout(input: LayoutPickerInput): HowItWorksLayout {
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
  assetAvailability,        // Sprint 7: Asset-aware layout selection

  // PHASE 2.4: Flow-aware context fields
  sectionPurpose,
  positionInFlow,
  previousSection,
  nextSection,
  flowComplexity,
} = input;

  // ===== PHASE 2.4: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.6.1: Unaware + Education = Simple Steps
  if (
    awarenessLevel === 'unaware' &&
    sectionPurpose === 'educate'
  ) {
    // Keep it simple - max 3-5 steps for education
    return "IconCircleSteps";  // Simple 3-step approach
  }

  // HR-4.6.2: Developer Tools = Technical Depth
  if (
    (marketCategory === 'Engineering & Development Tools' || marketCategory === 'AI Tools') &&
    (targetAudience === 'builders' || targetAudience === 'enterprise') &&
    marketSophisticationLevel >= 'level-3'
  ) {
    // Technical audiences need expandable depth
    return "AccordionSteps";  // Expandable technical details
  }

  // HR-4.6.3: Complex Process = Visual Flow
  if (
    (problemType === 'manual-repetition' || problemType === 'time-freedom-or-automation') &&
    flowComplexity === 'detailed'
  ) {
    // Show the full workflow visually
    return "VerticalTimeline";  // Step-by-step process visualization
  }

  // ===== EXISTING: High-Priority Rules (Return immediately if matched)
  
  // 1. Complex technical products needing detailed explanations
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "Data & Analytics Tools")
  ) {
    return "AccordionSteps";
  }

  // 2. High-touch sales with video demonstration
  if (
    (landingPageGoals === "demo" || landingPageGoals === "contact-sales") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "VideoWalkthrough";
  }

  // 3. Simple, visual process for early awareness
  if (
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") &&
    marketSophisticationLevel <= "level-2" &&
    (targetAudience === "founders" || targetAudience === "creators")
  ) {
    return "IconCircleSteps";
  }

  // 4. Interactive products needing hands-on explanation - using alternative layout
  if (
    (marketCategory === "Design & Creative Tools" || marketCategory === "No-Code & Development Platforms") &&
    (landingPageGoals === "free-trial" || landingPageGoals === "demo") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "ZigzagImageSteps";
  }

  // 5. Workflow/automation products showing process flow
  if (
    (problemType === "manual-repetition" || problemType === "time-freedom-or-automation") &&
    (marketCategory === "Business Productivity Tools" || marketCategory === "Marketing & Sales Tools") &&
    copyIntent === "desire-led"
  ) {
    return "VerticalTimeline";
  }

  // Medium-Priority Rules (Scoring system)

  const scores: Record<HowItWorksLayout, number> = {
    ThreeStepHorizontal: 0,
    VerticalTimeline: 0,
    IconCircleSteps: 0,
    AccordionSteps: 0,
    VideoWalkthrough: 0,
    ZigzagImageSteps: 0,
    AnimatedProcessLine: 0,
  };

  // ===== PHASE 2.4: FLOW-AWARE SCORING =====

  // Flow Complexity Adjustments (4 points)
  if (flowComplexity === 'simple') {
    scores.IconCircleSteps += 4;  // Max 3 steps, clear and simple
    scores.ThreeStepHorizontal += 4;
    scores.AnimatedProcessLine += 3;
    scores.AccordionSteps -= 3;  // Too detailed for simple flows
    scores.VideoWalkthrough -= 2;  // Overkill for simple processes
  } else if (flowComplexity === 'detailed') {
    scores.AccordionSteps += 4;  // Expandable depth for complex processes
    scores.VerticalTimeline += 4;  // Multi-step detailed flow
    scores.VideoWalkthrough += 3;
    scores.IconCircleSteps -= 2;  // Too simple for detailed flows
  }

  // Previous Section Context (4 points)
  if (previousSection?.type === 'uniqueMechanism') {
    // After unique mechanism: Show how the unique approach works in practice
    scores.VerticalTimeline += 4;  // Sequential breakdown of unique process
    scores.AccordionSteps += 3;  // Detailed steps of unique mechanism
    scores.ZigzagImageSteps += 3;
  } else if (previousSection?.type === 'features') {
    // After features: Tie features into practical workflow
    scores.ThreeStepHorizontal += 3;
    scores.IconCircleSteps += 3;
  }

  // Next Section Context (3 points)
  if (nextSection?.type === 'cta' || nextSection?.type === 'close') {
    // Before CTA: Keep it simple, don't overwhelm before asking for action
    scores.ThreeStepHorizontal += 3;  // Simple 3-step summary
    scores.IconCircleSteps += 3;
    scores.AnimatedProcessLine += 2;
    scores.AccordionSteps -= 2;  // Too detailed right before CTA
  } else if (nextSection?.type === 'testimonial' || nextSection?.type === 'results') {
    // Before social proof: Set up for "Here's how it worked for them"
    scores.VerticalTimeline += 3;
    scores.ZigzagImageSteps += 2;
  }

  // Position in Flow (3 points)
  if (positionInFlow !== undefined) {
    if (positionInFlow <= 3) {
      // Early flow: Simple education, build understanding
      scores.IconCircleSteps += 3;
      scores.ThreeStepHorizontal += 3;
      scores.AnimatedProcessLine += 2;
    } else if (positionInFlow >= 4 && positionInFlow <= 6) {
      // Middle flow: Detailed explanation after interest is established
      scores.VerticalTimeline += 3;
      scores.AccordionSteps += 3;
      scores.ZigzagImageSteps += 2;
    } else if (positionInFlow >= 7) {
      // Late flow: Quick recap if needed, or skip section
      scores.ThreeStepHorizontal += 2;
      scores.IconCircleSteps += 2;
    }
  }

  // ===== EXISTING SCORING (PRESERVED) =====

  // Awareness Level Scoring (Highest Weight: 4-5 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.IconCircleSteps += 5;
    scores.ThreeStepHorizontal += 4;
    scores.AnimatedProcessLine += 4;
    scores.ZigzagImageSteps += 3;
  } else if (awarenessLevel === "solution-aware") {
    scores.VerticalTimeline += 4;
    scores.ZigzagImageSteps += 4;
    scores.AccordionSteps += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.VideoWalkthrough += 5;
    scores.AccordionSteps += 4;
    scores.VerticalTimeline += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.IconCircleSteps += 4;
    scores.ThreeStepHorizontal += 4;
    scores.AnimatedProcessLine += 3;
    scores.ZigzagImageSteps += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.VerticalTimeline += 4;
    scores.ZigzagImageSteps += 3;
    scores.VideoWalkthrough += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.AccordionSteps += 4;
    scores.VideoWalkthrough += 4;
    scores.VerticalTimeline += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.VideoWalkthrough += 4;
    scores.AccordionSteps += 4;
    scores.VerticalTimeline += 3;
  } else if (targetAudience === "builders") {
    scores.AccordionSteps += 4;
    scores.VideoWalkthrough += 3;
    scores.VerticalTimeline += 2;
  } else if (targetAudience === "businesses") {
    scores.VerticalTimeline += 4;
    scores.VideoWalkthrough += 3;
    scores.ThreeStepHorizontal += 3;
    scores.ZigzagImageSteps += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.IconCircleSteps += 4;
    scores.ZigzagImageSteps += 4;
    scores.AnimatedProcessLine += 3;
    scores.ThreeStepHorizontal += 2;
  } else if (targetAudience === "marketers") {
    scores.VerticalTimeline += 4;
    scores.ZigzagImageSteps += 3;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.IconCircleSteps += 4;
    scores.ThreeStepHorizontal += 3;
    scores.AnimatedProcessLine += 3;
    scores.ZigzagImageSteps += 2;
  } else if (copyIntent === "desire-led") {
    scores.VerticalTimeline += 4;
    scores.VideoWalkthrough += 4;
    scores.AccordionSteps += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.IconCircleSteps += 3;
    scores.ZigzagImageSteps += 3;
    scores.ThreeStepHorizontal += 2;
    scores.AnimatedProcessLine += 2;
  } else if (toneProfile === "confident-playful") {
    scores.AnimatedProcessLine += 3;
    scores.ZigzagImageSteps += 2;
    scores.IconCircleSteps += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.AccordionSteps += 3;
    scores.VerticalTimeline += 3;
    scores.ThreeStepHorizontal += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.VerticalTimeline += 3;
    scores.VideoWalkthrough += 3;
  } else if (toneProfile === "luxury-expert") {
    scores.VideoWalkthrough += 3;
    scores.AccordionSteps += 3;
    scores.VerticalTimeline += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "manual-repetition") {
    scores.VerticalTimeline += 3;
    scores.AnimatedProcessLine += 3;
    scores.ZigzagImageSteps += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.VerticalTimeline += 3;
    scores.VideoWalkthrough += 2;
    scores.AnimatedProcessLine += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.AccordionSteps += 3;
    scores.VideoWalkthrough += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.AccordionSteps += 3;
    scores.VerticalTimeline += 2;
  } else if (problemType === "creative-empowerment") {
    scores.ZigzagImageSteps += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.IconCircleSteps += 3;
    scores.ThreeStepHorizontal += 2;
  }

  // Landing Goal Scoring (Medium Weight: 2-3 points)
  if (landingPageGoals === "demo" || landingPageGoals === "contact-sales") {
    scores.VideoWalkthrough += 3;
    scores.AccordionSteps += 2;
  } else if (landingPageGoals === "free-trial") {
    scores.VideoWalkthrough += 2;
    scores.VerticalTimeline += 2;
  } else if (landingPageGoals === "signup") {
    scores.ThreeStepHorizontal += 3;
    scores.IconCircleSteps += 2;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.VerticalTimeline += 3;
    scores.ZigzagImageSteps += 2;
  } else if (landingPageGoals === "download" || landingPageGoals === "waitlist") {
    scores.AnimatedProcessLine += 3;
    scores.IconCircleSteps += 2;
  }

  // Startup Stage Scoring (Low Weight: 1-2 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.IconCircleSteps += 2;
    scores.ThreeStepHorizontal += 2;
    scores.AnimatedProcessLine += 1;
  } else if (startupStage === "traction") {
    scores.ZigzagImageSteps += 2;
    scores.VerticalTimeline += 1;
  } else if (startupStage === "growth") {
    scores.VideoWalkthrough += 2;
    scores.AccordionSteps += 1;
  } else if (startupStage === "scale") {
    scores.AccordionSteps += 2;
    scores.VideoWalkthrough += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Business Productivity Tools") {
    scores.VerticalTimeline += 2;
    scores.ThreeStepHorizontal += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.ZigzagImageSteps += 2;
    scores.AnimatedProcessLine += 1;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.AccordionSteps += 2;
    scores.VideoWalkthrough += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.VerticalTimeline += 2;
    scores.ZigzagImageSteps += 1;
  } else if (marketCategory === "No-Code & Development Platforms") {
    scores.AnimatedProcessLine += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.AccordionSteps += 2;
    scores.VerticalTimeline += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.IconCircleSteps += 2;
    scores.AnimatedProcessLine += 1;
  } else if (pricingModel === "trial-free" || pricingModel === "trial-paid") {
    scores.VideoWalkthrough += 1;
  } else if (pricingModel === "custom-quote") {
    scores.VideoWalkthrough += 2;
    scores.AccordionSteps += 1;
  } else if (pricingModel === "tiered") {
    scores.VerticalTimeline += 2;
    scores.ZigzagImageSteps += 1;
  }

  // Sprint 7: Asset-Aware Scoring Adjustments
  if (assetAvailability) {
    if (!assetAvailability.demoVideo) {
      scores.VideoWalkthrough -= 100;
    }
    if (!assetAvailability.productImages) {
      scores.ZigzagImageSteps -= 50;
    }
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as HowItWorksLayout, score } : max,
    { layout: "ThreeStepHorizontal" as HowItWorksLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "ThreeStepHorizontal";
}