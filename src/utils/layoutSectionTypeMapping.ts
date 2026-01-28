// Mapping of layout names to their section types
export const layoutToSectionType: Record<string, string> = {
  // BeforeAfter layouts
  'SideBySideBlocks': 'beforeAfter',
  'StackedTextVisual': 'beforeAfter',
  'SplitCard': 'beforeAfter',

  // FAQ layouts
  'AccordionFAQ': 'faq',
  'TwoColumnFAQ': 'faq',
  'InlineQnAList': 'faq',
  'SegmentedFAQTabs': 'faq',

  // Features layouts
  'IconGrid': 'features',
  'SplitAlternating': 'features',
  'MetricTiles': 'features',
  'Carousel': 'features',

  // FounderNote layouts
  'LetterStyleBlock': 'founderNote',

  // Hero layouts
  'leftCopyRightImage': 'hero',
  'centerStacked': 'hero',
  'splitScreen': 'hero',
  'imageFirst': 'hero',

  // HowItWorks layouts
  'ThreeStepHorizontal': 'howItWorks',
  'VerticalTimeline': 'howItWorks',
  'AccordionSteps': 'howItWorks',
  'VideoWalkthrough': 'howItWorks',

  // Objection layouts
  'MythVsRealityGrid': 'objectionHandling',
  'VisualObjectionTiles': 'objectionHandling',

  // Pricing layouts
  'TierCards': 'pricing',
  'ToggleableMonthlyYearly': 'pricing',
  'SliderPricing': 'pricing',
  'CallToQuotePlan': 'pricing',

  // Problem layouts
  'StackedPainBullets': 'problem',

  // Results layouts
  'StatBlocks': 'results',
  'StackedWinsList': 'results',
  'ResultsGallery': 'results',

  // SocialProof layouts
  'LogoWall': 'socialProof',

  // Testimonial layouts
  'QuoteGrid': 'testimonials',
  'VideoTestimonials': 'testimonials',
  'AvatarCarousel': 'testimonials',
  'BeforeAfterQuote': 'testimonials',
  'PullQuoteStack': 'testimonials',

  // UniqueMechanism layouts
  'MethodologyBreakdown': 'uniqueMechanism',
  'ProcessFlowDiagram': 'uniqueMechanism',
  'PropertyComparisonMatrix': 'uniqueMechanism',
  'SecretSauceReveal': 'uniqueMechanism',
  'StackedHighlights': 'uniqueMechanism',
  'TechnicalAdvantage': 'uniqueMechanism',

  // UseCase layouts
  'IndustryUseCaseGrid': 'useCases',
  'PersonaGrid': 'useCases',
  'RoleBasedScenarios': 'useCases',

  // CTA layouts
  'CenteredHeadlineCTA': 'cta',
  'VisualCTAWithMockup': 'cta',
  'ValueStackCTA': 'cta',

  // Header layouts
  'MinimalNavHeader': 'header',

  // Footer layouts
  'ContactFooter': 'footer',
};

export function getSectionTypeFromLayout(layoutName: string): string {
  return layoutToSectionType[layoutName] || 'hero'; // Default to hero if not found
}
