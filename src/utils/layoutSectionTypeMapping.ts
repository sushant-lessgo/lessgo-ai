// Mapping of layout names to their section types
export const layoutToSectionType: Record<string, string> = {
  // BeforeAfter layouts
  'SideBySideBlocks': 'beforeAfter',
  'StackedTextVisual': 'beforeAfter',
  'BeforeAfterSlider': 'beforeAfter',
  'SplitCard': 'beforeAfter',
  'TextListTransformation': 'beforeAfter',
  'VisualStoryline': 'beforeAfter',
  'StatComparison': 'beforeAfter',
  'PersonaJourney': 'beforeAfter',

  // Close layouts
  'MockupWithCTA': 'closeSection',
  'BonusStackCTA': 'closeSection',
  'LeadMagnetCard': 'closeSection',
  'EnterpriseContactBox': 'closeSection',
  'ValueReinforcementBlock': 'closeSection',
  'LivePreviewEmbed': 'closeSection',
  'SideBySideOfferCards': 'closeSection',
  'MultistepCTAStack': 'closeSection',

  // Comparison layouts
  'BasicFeatureGrid': 'comparisonTable',
  'CheckmarkComparison': 'comparisonTable',
  'YouVsThemHighlight': 'comparisonTable',
  'ToggleableComparison': 'comparisonTable',
  'CompetitorCallouts': 'comparisonTable',
  'AnimatedUpgradePath': 'comparisonTable',
  'PersonaUseCaseCompare': 'comparisonTable',
  'LiteVsProVsEnterprise': 'comparisonTable',

  // FAQ layouts
  'AccordionFAQ': 'faq',
  'TwoColumnFAQ': 'faq',
  'InlineQnAList': 'faq',
  'SegmentedFAQTabs': 'faq',
  'QuoteStyleAnswers': 'faq',
  'IconWithAnswers': 'faq',
  'TestimonialFAQs': 'faq',
  'ChatBubbleFAQ': 'faq',

  // Features layouts
  'IconGrid': 'features',
  'SplitAlternating': 'features',
  'Tabbed': 'features',
  'Timeline': 'features',
  'FeatureTestimonial': 'features',
  'MetricTiles': 'features',
  'MiniCards': 'features',
  'Carousel': 'features',

  // FounderNote layouts
  'FounderCardWithQuote': 'founderNote',
  'LetterStyleBlock': 'founderNote',
  'VideoNoteWithTranscript': 'founderNote',
  'MissionQuoteOverlay': 'founderNote',
  'TimelineToToday': 'founderNote',
  'SideBySidePhotoStory': 'founderNote',
  'StoryBlockWithPullquote': 'founderNote',
  'FoundersBeliefStack': 'founderNote',

  // Hero layouts
  'leftCopyRightImage': 'hero',
  'centerStacked': 'hero',
  'splitScreen': 'hero',
  'imageFirst': 'hero',

  // HowItWorks layouts
  'ThreeStepHorizontal': 'howItWorks',
  'VerticalTimeline': 'howItWorks',
  'IconCircleSteps': 'howItWorks',
  'AccordionSteps': 'howItWorks',
  'CardFlipSteps': 'howItWorks',
  'VideoWalkthrough': 'howItWorks',
  'ZigzagImageSteps': 'howItWorks',
  'AnimatedProcessLine': 'howItWorks',

  // Integration layouts
  'LogoGrid': 'integrations',
  'CategoryAccordion': 'integrations',
  'InteractiveStackDiagram': 'integrations',
  'UseCaseTiles': 'integrations',
  'BadgeCarousel': 'integrations',
  'TabbyIntegrationCards': 'integrations',
  'ZapierLikeBuilderPreview': 'integrations',
  'LogoWithQuoteUse': 'integrations',

  // Objection layouts
  'ObjectionAccordion': 'objectionHandling',
  'MythVsRealityGrid': 'objectionHandling',
  'QuoteBackedAnswers': 'objectionHandling',
  'StoryDrivenObjections': 'objectionHandling',
  'ResearchBackedProof': 'objectionHandling',
  'TabsWithEvidence': 'objectionHandling',
  'VideoProofPoints': 'objectionHandling',
  'SecurityBadgesObjection': 'objectionHandling',

  // Pricing layouts
  'TierCards': 'pricing',
  'PricingComparisonTable': 'pricing',
  'ToggleableMonthlyYearly': 'pricing',
  'SinglePlanHighlight': 'pricing',
  'ROICalculator': 'pricing',
  'FreemiumToEnterpriseFlow': 'pricing',
  'FeatureMatrix': 'pricing',
  'SliderBasedQuotes': 'pricing',

  // Problem layouts
  'StackedPainBullets': 'problem',
  'BeforeImageAfterText': 'problem',
  'SideBySideSplit': 'problem',
  'EmotionalQuotes': 'problem',
  'CollapsedCards': 'problem',
  'PainMeterChart': 'problem',
  'PersonaPanels': 'problem',
  'ProblemChecklist': 'problem',

  // Results layouts
  'StatBlocks': 'results',
  'BeforeAfterStats': 'results',
  'QuoteWithMetric': 'results',
  'EmojiOutcomeGrid': 'results',
  'TimelineResults': 'results',
  'OutcomeIcons': 'results',
  'StackedWinsList': 'results',
  'PersonaResultPanels': 'results',

  // Security layouts
  'ComplianceBadgeRow': 'security',
  'SecurityChecklist': 'security',
  'AuditTrustPanel': 'security',
  'FAQStyleSecurity': 'security',
  'StatWithShieldIcons': 'security',
  'PartnerValidationRow': 'security',
  'DiagramInfraSecurity': 'security',
  'ExpandablePolicyCards': 'security',

  // SocialProof layouts
  'LogoWall': 'socialProof',
  'MediaMentions': 'socialProof',
  'UserCountBar': 'socialProof',
  'IndustryBadgeLine': 'socialProof',
  'MapHeatSpots': 'socialProof',
  'StackedStats': 'socialProof',
  'StripWithReviews': 'socialProof',
  'SocialProofStrip': 'socialProof',

  // Testimonial layouts
  'QuoteGrid': 'testimonials',
  'VideoTestimonials': 'testimonials',
  'AvatarCarousel': 'testimonials',
  'BeforeAfterQuote': 'testimonials',
  'SegmentedTestimonials': 'testimonials',
  'StarRatingCards': 'testimonials',
  'TestimonialSlider': 'testimonials',
  'ThreadTestimonials': 'testimonials',

  // UniqueMechanism layouts
  'StackedHighlights': 'uniqueMechanism',
  'VisualFlywheel': 'uniqueMechanism',
  'PillarIcons': 'uniqueMechanism',
  'IllustratedModel': 'uniqueMechanism',
  'ExplainerWithTags': 'uniqueMechanism',
  'UniqueMechanismComparisonTable': 'uniqueMechanism',
  'PatentStrip': 'uniqueMechanism',
  'SingleBigIdea': 'uniqueMechanism',

  // UseCase layouts
  'PersonaCards': 'useCases',
  'IndustryTabs': 'useCases',
  'ScenarioSlider': 'useCases',
  'WorkflowDiagrams': 'useCases',
  'RoleBasedBenefits': 'useCases',
  'DayInTheLife': 'useCases',
  'MatrixByIndustrySize': 'useCases',
  'SuccessStoryTiles': 'useCases',

  // CTA layouts
  'CenteredHeadlineCTA': 'cta',
  'CTAWithBadgeRow': 'cta',
  'VisualCTAWithMockup': 'cta',
  'SideBySideCTA': 'cta',
  'CountdownLimitedCTA': 'cta',
  'CTAWithFormField': 'cta',
  'ValueStackCTA': 'cta',
  'TestimonialCTACombo': 'cta',
};

export function getSectionTypeFromLayout(layoutName: string): string {
  return layoutToSectionType[layoutName] || 'hero'; // Default to hero if not found
}