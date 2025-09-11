export const layoutRegistry = {
  BeforeAfter: [
    "SideBySideBlocks",
    "StackedTextVisual",
    "BeforeAfterSlider",
    "SplitCard",
    "TextListTransformation",
    "VisualStoryline",
    "StatComparison",
    "PersonaJourney",
  ] as const,

  Close: [
    "MockupWithCTA",
    "BonusStackCTA",
    "LeadMagnetCard",
    "EnterpriseContactBox",
    "ValueReinforcementBlock",
    "LivePreviewEmbed",
    "SideBySideOfferCards",
    "MultistepCTAStack",
  ] as const,

  Comparison: [
    "BasicFeatureGrid",
    "CheckmarkComparison",
    "YouVsThemHighlight",
    "ToggleableComparison",
    "CompetitorCallouts",
    "AnimatedUpgradePath",
    "PersonaUseCaseCompare",
    "LiteVsProVsEnterprise",
  ] as const,

  FAQ: [
    "AccordionFAQ",
    "TwoColumnFAQ",
    "InlineQnAList",
    "SegmentedFAQTabs",
    "QuoteStyleAnswers",
    "IconWithAnswers",
    "TestimonialFAQs",
    "ChatBubbleFAQ",
  ] as const,

  Features: [
    "IconGrid",
    "SplitAlternating",
    "FeatureTestimonial",
    "MetricTiles",
    "MiniCards",
    "Carousel",
  ] as const,

  FounderNote: [
    "FounderCardWithQuote",
    "LetterStyleBlock",
    "VideoNoteWithTranscript",
    "MissionQuoteOverlay",
    "TimelineToToday",
    "SideBySidePhotoStory",
    "StoryBlockWithPullquote",
    "FoundersBeliefStack",
  ] as const,

  Hero: [
    "leftCopyRightImage",
    "centerStacked",
    "splitScreen",
    "imageFirst",
  ] as const,

  HowItWorks: [
    "ThreeStepHorizontal",
    "VerticalTimeline",
    "IconCircleSteps",
    "AccordionSteps",
    "VideoWalkthrough",
    "ZigzagImageSteps",
    "AnimatedProcessLine",
  ] as const,

  Integration: [
    "LogoGrid",
    "CategoryAccordion",
    "InteractiveStackDiagram",
    "UseCaseTiles",
    "BadgeCarousel",
    "TabbyIntegrationCards",
    "ZapierLikeBuilderPreview",
    "LogoWithQuoteUse",
  ] as const,

  Objection: [
    "ObjectionAccordion",
    "MythVsRealityGrid",
    "QuoteBackedAnswers",
    "VisualObjectionTiles",
    "ProblemToReframeBlocks",
    "SkepticToBelieverSteps",
    "BoldGuaranteePanel",
    "ObjectionCarousel",
  ] as const,

  Pricing: [
    "TierCards",
    "ToggleableMonthlyYearly",
    "FeatureMatrix",
    "SegmentBasedPricing",
    "SliderPricing",
    "CallToQuotePlan",
    "CardWithTestimonial",
    "MiniStackedCards",
  ] as const,

  CTA: [
    "CenteredHeadlineCTA",
    "CTAWithBadgeRow",
    "VisualCTAWithMockup",
    "SideBySideCTA",
    "CountdownLimitedCTA",
    "CTAWithFormField",
    "ValueStackCTA",
    "TestimonialCTACombo",
  ] as const,

  Problem: [
    "StackedPainBullets",
    "BeforeImageAfterText",
    "SideBySideSplit",
    "EmotionalQuotes",
    "CollapsedCards",
    // TODO: "PainMeterChart", - Disabled for MVP due to complex UX. Great copywriting potential for post-MVP.
    "PersonaPanels",
    "ProblemChecklist",
  ] as const,

  Results: [
    "StatBlocks",
    "BeforeAfterStats",
    "QuoteWithMetric",
    "EmojiOutcomeGrid",
    "TimelineResults",
    "OutcomeIcons",
    "StackedWinsList",
    "PersonaResultPanels",
  ] as const,

  Security: [
    "ComplianceBadgeRow",
    "SecurityChecklist",
    "AuditTrustPanel",
    "FAQStyleSecurity",
    "StatWithShieldIcons",
    "PartnerValidationRow",
    "DiagramInfraSecurity",
    "ExpandablePolicyCards",
  ] as const,

  SocialProof: [
    "LogoWall",
    "MediaMentions",
    "UserCountBar",
    "IndustryBadgeLine",
    "MapHeatSpots",
    "StackedStats",
    "StripWithReviews",
    "SocialProofStrip",
  ] as const,

  Testimonial: [
    "QuoteGrid",
    "VideoTestimonials",
    "AvatarCarousel",
    "BeforeAfterQuote",
    "SegmentedTestimonials",
    "RatingCards",
    "PullQuoteStack",
    "InteractiveTestimonialMap",
  ] as const,

  UniqueMechanism: [
    "StackedHighlights",
    "VisualFlywheel",
    "PillarIcons",
    "IllustratedModel",
    "ExplainerWithTags",
    "ComparisonTable",
    "PatentStrip",
    "TechnicalCards",
  ] as const,

  UseCase: [
    "PersonaGrid",
    "TabbedUseCases",
    "IndustryTiles",
    "ScenarioCards",
    "JobToBeDoneList",
    "SegmentSplitBlocks",
    "CarouselAvatars",
    "RoleBenefitMatrix",
  ] as const,

  Header: [
    "CenteredLogoHeader",
    "FullNavHeader",
    "MinimalNavHeader",
    "NavWithCTAHeader",
  ] as const,

  Footer: [
    "SimpleFooter",
    "LinksAndSocialFooter",
    "MultiColumnFooter",
    "ContactFooter",
  ] as const,
} as const;
