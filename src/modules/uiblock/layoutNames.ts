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
    // V3 ARCHIVED: 'BeforeAfterSlider',
    'SplitCard',
    // V3 ARCHIVED: 'TextListTransformation',
    // V3 ARCHIVED: 'VisualStoryline',
    // V3 ARCHIVED: 'StatComparison',
    // V3 ARCHIVED: 'PersonaJourney',
  ],

  features: [
    'IconGrid',
    'SplitAlternating',
    // V3 ARCHIVED: 'FeatureTestimonial',
    'MetricTiles',
    // V3 ARCHIVED: 'MiniCards',
    'Carousel',
    // V3 ARCHIVED: 'Tabbed',
  ],

  faq: [
    'AccordionFAQ',
    'TwoColumnFAQ',
    'InlineQnAList',
    'SegmentedFAQTabs',
    // V3 ARCHIVED: 'QuoteStyleAnswers',
    // V3 ARCHIVED: 'IconWithAnswers',
    // V3 ARCHIVED: 'TestimonialFAQs',
    // V3 ARCHIVED: 'ChatBubbleFAQ',
  ],

  pricing: [
    'TierCards',
    'ToggleableMonthlyYearly',
    // V3 ARCHIVED: 'FeatureMatrix',
    // V3 ARCHIVED: 'SegmentBasedPricing',
    'SliderPricing',
    'CallToQuotePlan',
    // V3 ARCHIVED: 'CardWithTestimonial',
    // V3 ARCHIVED: 'MiniStackedCards',
  ],

  testimonials: [
    'QuoteGrid',
    'VideoTestimonials',
    'AvatarCarousel',
    'BeforeAfterQuote',
    // V3 ARCHIVED: 'SegmentedTestimonials',
    // V3 ARCHIVED: 'RatingCards',
    'PullQuoteStack',
    // V3 ARCHIVED: 'InteractiveTestimonialMap',
  ],

  problem: [
    // V3 ARCHIVED: 'StackedPainBullets',
    // V3 ARCHIVED: 'BeforeImageAfterText',
    // V3 ARCHIVED: 'EmotionalQuotes',
    'CollapsedCards',
    'SideBySideSplit',
    'PersonaPanels',
  ],

  results: [
    'StatBlocks',
    // V3 ARCHIVED: 'BeforeAfterStats',
    // V3 ARCHIVED: 'QuoteWithMetric',
    // V3 ARCHIVED: 'EmojiOutcomeGrid',
    // V3 ARCHIVED: 'TimelineResults',
    // V3 ARCHIVED: 'OutcomeIcons',
    'StackedWinsList',
    // V3 ARCHIVED: 'PersonaResultPanels',
    'ResultsGallery',
  ],

  howItWorks: [
    'ThreeStepHorizontal',
    'VerticalTimeline',
    // V3 ARCHIVED: 'IconCircleSteps',
    'AccordionSteps',
    'VideoWalkthrough',
    // V3 ARCHIVED: 'ZigzagImageSteps',
    // V3 ARCHIVED: 'AnimatedProcessLine',
  ],

  useCases: [
    // V3 ARCHIVED: 'CustomerJourneyFlow',
    'IndustryUseCaseGrid',
    // V3 ARCHIVED: 'InteractiveUseCaseMap',
    'PersonaGrid',
    'RoleBasedScenarios',
    // V3 ARCHIVED: 'UseCaseCarousel',
    // V3 ARCHIVED: 'WorkflowDiagrams',
  ],

  uniqueMechanism: [
    // V3 ARCHIVED: 'AlgorithmExplainer',
    // V3 ARCHIVED: 'InnovationTimeline',
    'MethodologyBreakdown',
    'ProcessFlowDiagram',
    'PropertyComparisonMatrix',
    'SecretSauceReveal',
    'StackedHighlights',
    // V3 ARCHIVED: 'SystemArchitecture',
    'TechnicalAdvantage',
  ],

  socialProof: [
    'LogoWall',
    // V3 ARCHIVED: 'MediaMentions',
    // V3 ARCHIVED: 'UserCountBar',
    // V3 ARCHIVED: 'IndustryBadgeLine',
    // V3 ARCHIVED: 'MapHeatSpots',
    // V3 ARCHIVED: 'StackedStats',
    // V3 ARCHIVED: 'StripWithReviews',
    // V3 ARCHIVED: 'SocialProofStrip',
  ],

  objectionHandling: [
    // V3 ARCHIVED: 'ObjectionAccordion',
    'MythVsRealityGrid',
    // V3 ARCHIVED: 'QuoteBackedAnswers',
    'VisualObjectionTiles',
    // V3 ARCHIVED: 'ProblemToReframeBlocks',
    // V3 ARCHIVED: 'SkepticToBelieverSteps',
    // V3 ARCHIVED: 'BoldGuaranteePanel',
  ],

  founderNote: [
    'FounderCardWithQuote',
    'LetterStyleBlock',
    // V3 ARCHIVED: 'VideoNoteWithTranscript',
    'MissionQuoteOverlay',
    'TimelineToToday',
    // V3 ARCHIVED: 'SideBySidePhotoStory',
    // V3 ARCHIVED: 'StoryBlockWithPullquote',
    'FoundersBeliefStack',
  ],

  cta: [
    'CenteredHeadlineCTA',
    // V3 ARCHIVED: 'CTAWithBadgeRow',
    'VisualCTAWithMockup',
    // V3 ARCHIVED: 'SideBySideCTA',
    // V3 ARCHIVED: 'CountdownLimitedCTA',
    // V3 ARCHIVED: 'CTAWithFormField',
    'ValueStackCTA',
    // V3 ARCHIVED: 'TestimonialCTACombo',
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
