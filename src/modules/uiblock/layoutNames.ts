// src/modules/uiblock/layoutNames.ts
// Layout names registry - no React imports, safe for server-side use
// This is a mirror of componentRegistry keys, maintained separately to avoid
// importing React components in API routes.

/**
 * Registry mapping section types to available layout names
 * IMPORTANT: Keep this in sync with componentRegistry.ts
 */
export const layoutNamesBySection: Record<string, string[]> = {
  header: [
    'MinimalNavHeader',
    'NavWithCTAHeader',
    'CenteredLogoHeader',
    'FullNavHeader',
  ],

  footer: [
    'SimpleFooter',
    'LinksAndSocialFooter',
    'MultiColumnFooter',
    'ContactFooter',
  ],

  hero: [
    'leftCopyRightImage',
    'centerStacked',
    'splitScreen',
    'imageFirst',
    'minimalist',
  ],

  beforeAfter: [
    'SideBySideBlocks',
    'StackedTextVisual',
    'BeforeAfterSlider',
    'SplitCard',
    'TextListTransformation',
    'VisualStoryline',
    'StatComparison',
    'PersonaJourney',
  ],

  features: [
    'IconGrid',
    'SplitAlternating',
    'FeatureTestimonial',
    'MetricTiles',
    'MiniCards',
    'Carousel',
  ],

  faq: [
    'AccordionFAQ',
    'TwoColumnFAQ',
    'InlineQnAList',
    'SegmentedFAQTabs',
    'QuoteStyleAnswers',
    'IconWithAnswers',
    'TestimonialFAQs',
    'ChatBubbleFAQ',
  ],

  pricing: [
    'TierCards',
    'ToggleableMonthlyYearly',
    'FeatureMatrix',
    'SegmentBasedPricing',
    'SliderPricing',
    'CallToQuotePlan',
    'CardWithTestimonial',
    'MiniStackedCards',
  ],

  testimonials: [
    'QuoteGrid',
    'VideoTestimonials',
    'AvatarCarousel',
    'BeforeAfterQuote',
    'SegmentedTestimonials',
    'RatingCards',
    'PullQuoteStack',
    'InteractiveTestimonialMap',
  ],

  problem: [
    'StackedPainBullets',
    'BeforeImageAfterText',
    'EmotionalQuotes',
    'CollapsedCards',
    'PersonaPanels',
  ],

  results: [
    'StatBlocks',
    'BeforeAfterStats',
    'QuoteWithMetric',
    'EmojiOutcomeGrid',
    'TimelineResults',
    'OutcomeIcons',
    'StackedWinsList',
    'PersonaResultPanels',
    'ResultsGallery',
  ],

  howItWorks: [
    'ThreeStepHorizontal',
    'VerticalTimeline',
    'IconCircleSteps',
    'AccordionSteps',
    'VideoWalkthrough',
    'ZigzagImageSteps',
    'AnimatedProcessLine',
  ],

  useCases: [
    'CustomerJourneyFlow',
    'IndustryUseCaseGrid',
    'InteractiveUseCaseMap',
    'PersonaGrid',
    'RoleBasedScenarios',
    'UseCaseCarousel',
    'WorkflowDiagrams',
  ],

  uniqueMechanism: [
    'AlgorithmExplainer',
    'InnovationTimeline',
    'MethodologyBreakdown',
    'ProcessFlowDiagram',
    'PropertyComparisonMatrix',
    'SecretSauceReveal',
    'StackedHighlights',
    'SystemArchitecture',
    'TechnicalAdvantage',
  ],

  socialProof: [
    'LogoWall',
    'MediaMentions',
    'UserCountBar',
    'IndustryBadgeLine',
    'MapHeatSpots',
    'StackedStats',
    'StripWithReviews',
    'SocialProofStrip',
  ],

  objectionHandling: [
    'ObjectionAccordion',
    'MythVsRealityGrid',
    'QuoteBackedAnswers',
    'VisualObjectionTiles',
    'ProblemToReframeBlocks',
    'SkepticToBelieverSteps',
    'BoldGuaranteePanel',
  ],

  founderNote: [
    'FounderCardWithQuote',
    'LetterStyleBlock',
    'VideoNoteWithTranscript',
    'MissionQuoteOverlay',
    'TimelineToToday',
    'SideBySidePhotoStory',
    'StoryBlockWithPullquote',
    'FoundersBeliefStack',
  ],

  cta: [
    'CenteredHeadlineCTA',
    'CTAWithBadgeRow',
    'VisualCTAWithMockup',
    'SideBySideCTA',
    'CountdownLimitedCTA',
    'CTAWithFormField',
    'ValueStackCTA',
    'TestimonialCTACombo',
  ],
};

/**
 * Get available layouts for a section type
 * Server-safe version that doesn't import React components
 */
export function getLayoutNames(sectionType: string): string[] {
  // Try exact match first (handles camelCase keys like uniqueMechanism, useCases)
  if (layoutNamesBySection[sectionType]) {
    return layoutNamesBySection[sectionType];
  }
  // Fallback to lowercase for backwards compatibility
  const lowercaseKey = sectionType.toLowerCase();
  if (layoutNamesBySection[lowercaseKey]) {
    console.warn(`[layoutNames] Using lowercase fallback for: ${sectionType} → ${lowercaseKey}`);
    return layoutNamesBySection[lowercaseKey];
  }
  return [];
}

/**
 * Check if a layout exists for a section type
 */
export function hasLayoutName(sectionType: string, layoutName: string): boolean {
  const layouts = getLayoutNames(sectionType);
  return layouts.includes(layoutName);
}
