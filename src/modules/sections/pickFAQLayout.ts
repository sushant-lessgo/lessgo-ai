import type { LayoutPickerInput } from "./layoutPickerInput";

export type FAQLayout =
  | "AccordionFAQ"
  | "TwoColumnFAQ"
  | "InlineQnAList"
  | "SegmentedFAQTabs"
  | "QuoteStyleAnswers"
  | "IconWithAnswers"
  | "TestimonialFAQs"
  | "ChatBubbleFAQ";

/**
 * Selects the optimal FAQ section layout based on audience sophistication and question complexity
 * FAQ sections address objections and concerns - prioritizes clarity and trust building
 */
export function pickFAQLayout(input: LayoutPickerInput): FAQLayout {
  const {
    awarenessLevel,
    toneProfile,
    startupStageGroup,
    marketCategory,
    landingGoalType,
    targetAudienceGroup,
    pricingModel,
    pricingModifier,
    pricingCommitmentOption,
    marketSophisticationLevel,
    copyIntent,
    problemType,
  } = input;

  // High-Priority Rules (Return immediately if matched)
  
  // 1. Enterprise audiences with complex, segmented questions
  if (
    targetAudienceGroup === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools" || marketCategory === "HR & People Operations Tools")
  ) {
    return "SegmentedFAQTabs";
  }

  // 2. Technical audiences needing organized, searchable information
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    marketSophisticationLevel >= "level-3" &&
    (awarenessLevel === "product-aware" || awarenessLevel === "most-aware")
  ) {
    return "TwoColumnFAQ";
  }

  // 3. Trust-building for established companies with customer proof
  if (
    (startupStageGroup === "growth" || startupStageGroup === "scale") &&
    (landingGoalType === "buy-now" || landingGoalType === "subscribe" || landingGoalType === "contact-sales") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "TestimonialFAQs";
  }

  // 4. Casual, approachable tone for creators and founders
  if (
    (targetAudienceGroup === "creators" || targetAudienceGroup === "founders") &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "ChatBubbleFAQ";
  }

  // 5. Expert positioning with authoritative answers
  if (
    toneProfile === "luxury-expert" &&
    (startupStageGroup === "growth" || startupStageGroup === "scale") &&
    (targetAudienceGroup === "enterprise" || targetAudienceGroup === "businesses")
  ) {
    return "QuoteStyleAnswers";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<FAQLayout, number> = {
    AccordionFAQ: 0,
    TwoColumnFAQ: 0,
    InlineQnAList: 0,
    SegmentedFAQTabs: 0,
    QuoteStyleAnswers: 0,
    IconWithAnswers: 0,
    TestimonialFAQs: 0,
    ChatBubbleFAQ: 0,
  };

  // Market Sophistication Scoring (Highest Weight: 4-5 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.IconWithAnswers += 5;
    scores.InlineQnAList += 4;
    scores.ChatBubbleFAQ += 4;
    scores.AccordionFAQ += 3;
  } else if (marketSophisticationLevel === "level-3") {
    scores.AccordionFAQ += 5;
    scores.TwoColumnFAQ += 4;
    scores.TestimonialFAQs += 3;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.SegmentedFAQTabs += 5;
    scores.TwoColumnFAQ += 4;
    scores.QuoteStyleAnswers += 4;
    scores.TestimonialFAQs += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.InlineQnAList += 4;
    scores.IconWithAnswers += 4;
    scores.ChatBubbleFAQ += 3;
    scores.AccordionFAQ += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.AccordionFAQ += 4;
    scores.TestimonialFAQs += 3;
    scores.TwoColumnFAQ += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.TwoColumnFAQ += 4;
    scores.SegmentedFAQTabs += 4;
    scores.QuoteStyleAnswers += 3;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.SegmentedFAQTabs += 4;
    scores.TwoColumnFAQ += 4;
    scores.TestimonialFAQs += 3;
    scores.QuoteStyleAnswers += 2;
  } else if (targetAudienceGroup === "builders") {
    scores.TwoColumnFAQ += 4;
    scores.AccordionFAQ += 3;
    scores.SegmentedFAQTabs += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.TestimonialFAQs += 4;
    scores.AccordionFAQ += 3;
    scores.TwoColumnFAQ += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.ChatBubbleFAQ += 4;
    scores.IconWithAnswers += 3;
    scores.InlineQnAList += 3;
  } else if (targetAudienceGroup === "marketers") {
    scores.AccordionFAQ += 4;
    scores.TestimonialFAQs += 3;
    scores.SegmentedFAQTabs += 2;
  }

  // Tone Profile Scoring (High Weight: 3-4 points)
  if (toneProfile === "friendly-helpful") {
    scores.ChatBubbleFAQ += 4;
    scores.IconWithAnswers += 3;
    scores.InlineQnAList += 3;
    scores.AccordionFAQ += 2;
  } else if (toneProfile === "confident-playful") {
    scores.ChatBubbleFAQ += 4;
    scores.IconWithAnswers += 3;
    scores.TestimonialFAQs += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.TwoColumnFAQ += 4;
    scores.AccordionFAQ += 3;
    scores.SegmentedFAQTabs += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.TestimonialFAQs += 4;
    scores.QuoteStyleAnswers += 3;
    scores.AccordionFAQ += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.QuoteStyleAnswers += 4;
    scores.SegmentedFAQTabs += 3;
    scores.TestimonialFAQs += 2;
  }

  // Copy Intent Scoring (Medium Weight: 2-3 points)
  if (copyIntent === "pain-led") {
    scores.InlineQnAList += 3;
    scores.IconWithAnswers += 3;
    scores.ChatBubbleFAQ += 2;
  } else if (copyIntent === "desire-led") {
    scores.TestimonialFAQs += 3;
    scores.QuoteStyleAnswers += 3;
    scores.SegmentedFAQTabs += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.InlineQnAList += 3;
    scores.IconWithAnswers += 2;
    scores.ChatBubbleFAQ += 2;
  } else if (startupStageGroup === "traction") {
    scores.AccordionFAQ += 3;
    scores.TwoColumnFAQ += 2;
  } else if (startupStageGroup === "growth") {
    scores.TestimonialFAQs += 3;
    scores.SegmentedFAQTabs += 2;
    scores.QuoteStyleAnswers += 2;
  } else if (startupStageGroup === "scale") {
    scores.SegmentedFAQTabs += 3;
    scores.TestimonialFAQs += 2;
    scores.QuoteStyleAnswers += 2;
  }

  // Landing Goal Scoring (Medium Weight: 2-3 points)
  if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.TestimonialFAQs += 3;
    scores.QuoteStyleAnswers += 2;
  } else if (landingGoalType === "free-trial" || landingGoalType === "demo") {
    scores.AccordionFAQ += 3;
    scores.TwoColumnFAQ += 2;
  } else if (landingGoalType === "contact-sales") {
    scores.SegmentedFAQTabs += 3;
    scores.TestimonialFAQs += 2;
  } else if (landingGoalType === "signup" || landingGoalType === "download") {
    scores.InlineQnAList += 3;
    scores.IconWithAnswers += 2;
  } else if (landingGoalType === "waitlist" || landingGoalType === "join-community") {
    scores.ChatBubbleFAQ += 3;
    scores.InlineQnAList += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "compliance-or-risk") {
    scores.SegmentedFAQTabs += 2;
    scores.QuoteStyleAnswers += 2;
    scores.TwoColumnFAQ += 1;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.TestimonialFAQs += 2;
    scores.AccordionFAQ += 1;
  } else if (problemType === "manual-repetition") {
    scores.IconWithAnswers += 2;
    scores.InlineQnAList += 1;
  } else if (problemType === "creative-empowerment") {
    scores.ChatBubbleFAQ += 2;
    scores.IconWithAnswers += 1;
  } else if (problemType === "burnout-or-overload") {
    scores.ChatBubbleFAQ += 2;
    scores.InlineQnAList += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.TwoColumnFAQ += 2;
    scores.SegmentedFAQTabs += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.TestimonialFAQs += 2;
    scores.AccordionFAQ += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.IconWithAnswers += 2;
    scores.ChatBubbleFAQ += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.AccordionFAQ += 2;
    scores.InlineQnAList += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.SegmentedFAQTabs += 2;
    scores.TwoColumnFAQ += 1;
  } else if (marketCategory === "HR & People Operations Tools") {
    scores.SegmentedFAQTabs += 2;
    scores.TestimonialFAQs += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.InlineQnAList += 2;
    scores.ChatBubbleFAQ += 1;
  } else if (pricingModel === "tiered") {
    scores.SegmentedFAQTabs += 2;
    scores.AccordionFAQ += 1;
  } else if (pricingModel === "custom-quote") {
    scores.TestimonialFAQs += 2;
    scores.QuoteStyleAnswers += 1;
  }

  // Pricing Commitment Scoring (Low Weight: 1-2 points)
  if (pricingCommitmentOption === "no-card") {
    scores.ChatBubbleFAQ += 2;
    scores.InlineQnAList += 1;
  } else if (pricingCommitmentOption === "talk-to-sales") {
    scores.SegmentedFAQTabs += 2;
    scores.TestimonialFAQs += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as FAQLayout, score } : max,
    { layout: "AccordionFAQ" as FAQLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "AccordionFAQ";
}