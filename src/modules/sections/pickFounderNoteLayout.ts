import type { LayoutPickerInput } from "./layoutPickerInput";

export type FounderNoteLayout =
  | "FounderCardWithQuote"
  | "LetterStyleBlock"
  | "VideoNoteWithTranscript"
  | "MissionQuoteOverlay"
  | "TimelineToToday"
  | "SideBySidePhotoStory"
  | "StoryBlockWithPullquote"
  | "FoundersBeliefStack";

/**
 * Selects the optimal FounderNote section layout based on trust-building needs and audience connection
 * FounderNote sections build personal connection and trust - prioritizes authenticity and relatability
 */
export function pickFounderNoteLayout(input: LayoutPickerInput): FounderNoteLayout {
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
  
  // 1. Early-stage founders connecting with fellow entrepreneurs
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    (targetAudience === "founders" || targetAudience === "creators") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "FounderCardWithQuote";
  }

  // 2. Established companies with growth story
  if (
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-3" &&
    copyIntent === "desire-led"
  ) {
    return "TimelineToToday";
  }

  // 3. Video-first approach for high-touch sales
  if (
    (landingPageGoals === "demo" || landingPageGoals === "contact-sales") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "VideoNoteWithTranscript";
  }

  // 4. Mission-driven products and social impact
  if (
    (problemType === "compliance-or-risk" || problemType === "creative-empowerment" || problemType === "personal-growth-or-productivity") &&
    (toneProfile === "friendly-helpful" || toneProfile === "luxury-expert") &&
    copyIntent === "pain-led"
  ) {
    return "MissionQuoteOverlay";
  }

  // 5. Personal, storytelling approach for creators
  if (
    (targetAudience === "creators" || targetAudience === "founders") &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful") &&
    (marketCategory === "Design & Creative Tools" || marketCategory === "Marketing & Sales Tools")
  ) {
    return "SideBySidePhotoStory";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<FounderNoteLayout, number> = {
    FounderCardWithQuote: 0,
    LetterStyleBlock: 0,
    VideoNoteWithTranscript: 0,
    MissionQuoteOverlay: 0,
    TimelineToToday: 0,
    SideBySidePhotoStory: 0,
    StoryBlockWithPullquote: 0,
    FoundersBeliefStack: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudience === "founders") {
    scores.FounderCardWithQuote += 5;
    scores.FoundersBeliefStack += 4;
    scores.SideBySidePhotoStory += 3;
    scores.StoryBlockWithPullquote += 2;
  } else if (targetAudience === "creators") {
    scores.SideBySidePhotoStory += 5;
    scores.FounderCardWithQuote += 4;
    scores.StoryBlockWithPullquote += 3;
  } else if (targetAudience === "enterprise") {
    scores.VideoNoteWithTranscript += 5;
    scores.TimelineToToday += 4;
    scores.LetterStyleBlock += 3;
  } else if (targetAudience === "businesses") {
    scores.TimelineToToday += 4;
    scores.VideoNoteWithTranscript += 4;
    scores.MissionQuoteOverlay += 3;
  } else if (targetAudience === "marketers") {
    scores.StoryBlockWithPullquote += 4;
    scores.SideBySidePhotoStory += 3;
    scores.FounderCardWithQuote += 2;
  }

  // Startup Stage Scoring (High Weight: 3-4 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.FounderCardWithQuote += 4;
    scores.MissionQuoteOverlay += 4;
    scores.FoundersBeliefStack += 3;
    scores.SideBySidePhotoStory += 2;
  } else if (startupStage === "traction") {
    scores.StoryBlockWithPullquote += 4;
    scores.FounderCardWithQuote += 3;
    scores.TimelineToToday += 2;
  } else if (startupStage === "growth") {
    scores.TimelineToToday += 4;
    scores.VideoNoteWithTranscript += 3;
    scores.LetterStyleBlock += 2;
  } else if (startupStage === "scale") {
    scores.VideoNoteWithTranscript += 4;
    scores.TimelineToToday += 3;
    scores.LetterStyleBlock += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.FounderCardWithQuote += 4;
    scores.MissionQuoteOverlay += 4;
    scores.FoundersBeliefStack += 3;
    scores.SideBySidePhotoStory += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.StoryBlockWithPullquote += 4;
    scores.SideBySidePhotoStory += 3;
    scores.TimelineToToday += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.VideoNoteWithTranscript += 4;
    scores.TimelineToToday += 3;
    scores.LetterStyleBlock += 2;
  }

  // Tone Profile Scoring (High Weight: 3-4 points)
  if (toneProfile === "friendly-helpful") {
    scores.FounderCardWithQuote += 4;
    scores.SideBySidePhotoStory += 4;
    scores.MissionQuoteOverlay += 3;
    scores.StoryBlockWithPullquote += 2;
  } else if (toneProfile === "confident-playful") {
    scores.SideBySidePhotoStory += 4;
    scores.StoryBlockWithPullquote += 3;
    scores.FounderCardWithQuote += 3;
    scores.TimelineToToday += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.LetterStyleBlock += 4;
    scores.VideoNoteWithTranscript += 3;
    scores.TimelineToToday += 3;
    scores.MissionQuoteOverlay += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.FoundersBeliefStack += 4;
    scores.TimelineToToday += 3;
    scores.StoryBlockWithPullquote += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.VideoNoteWithTranscript += 4;
    scores.LetterStyleBlock += 3;
    scores.TimelineToToday += 2;
  }

  // Copy Intent Scoring (Medium Weight: 2-3 points)
  if (copyIntent === "pain-led") {
    scores.MissionQuoteOverlay += 3;
    scores.FounderCardWithQuote += 3;
    scores.FoundersBeliefStack += 2;
  } else if (copyIntent === "desire-led") {
    scores.TimelineToToday += 3;
    scores.SideBySidePhotoStory += 3;
    scores.VideoNoteWithTranscript += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "burnout-or-overload" || problemType === "personal-growth-or-productivity") {
    scores.FounderCardWithQuote += 3;
    scores.MissionQuoteOverlay += 2;
  } else if (problemType === "creative-empowerment") {
    scores.SideBySidePhotoStory += 3;
    scores.StoryBlockWithPullquote += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.TimelineToToday += 3;
    scores.VideoNoteWithTranscript += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.MissionQuoteOverlay += 3;
    scores.FoundersBeliefStack += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.StoryBlockWithPullquote += 3;
    scores.TimelineToToday += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.FounderCardWithQuote += 3;
    scores.SideBySidePhotoStory += 3;
    scores.MissionQuoteOverlay += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.StoryBlockWithPullquote += 3;
    scores.FoundersBeliefStack += 2;
    scores.TimelineToToday += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.VideoNoteWithTranscript += 3;
    scores.LetterStyleBlock += 3;
    scores.TimelineToToday += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.VideoNoteWithTranscript += 2;
    scores.LetterStyleBlock += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.TimelineToToday += 2;
    scores.StoryBlockWithPullquote += 1;
  } else if (landingPageGoals === "join-community" || landingPageGoals === "waitlist") {
    scores.SideBySidePhotoStory += 2;
    scores.FounderCardWithQuote += 2;
    scores.MissionQuoteOverlay += 1;
  } else if (landingPageGoals === "signup" || landingPageGoals === "free-trial") {
    scores.FounderCardWithQuote += 2;
    scores.StoryBlockWithPullquote += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Design & Creative Tools") {
    scores.SideBySidePhotoStory += 2;
    scores.StoryBlockWithPullquote += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.StoryBlockWithPullquote += 2;
    scores.TimelineToToday += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.FounderCardWithQuote += 2;
    scores.MissionQuoteOverlay += 1;
  } else if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.VideoNoteWithTranscript += 2;
    scores.FoundersBeliefStack += 1;
  } else if (marketCategory === "HR & People Operations Tools") {
    scores.MissionQuoteOverlay += 2;
    scores.FoundersBeliefStack += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.FounderCardWithQuote += 2;
    scores.SideBySidePhotoStory += 1;
  } else if (pricingModel === "custom-quote") {
    scores.VideoNoteWithTranscript += 2;
    scores.LetterStyleBlock += 1;
  } else if (pricingModel === "tiered") {
    scores.TimelineToToday += 2;
    scores.StoryBlockWithPullquote += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as FounderNoteLayout, score } : max,
    { layout: "FounderCardWithQuote" as FounderNoteLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "FounderCardWithQuote";
}