import React from 'react';

import AccordionFAQ from '@/modules/UIBlocks/FAQ/AccordionFAQ';
import BasicFeatureGrid from '@/modules/UIBlocks/Comparison/BasicFeatureGrid';
import CenteredHeadlineCTA from '@/modules/UIBlocks/PrimaryCTA/CenteredHeadlineCTA';
import FounderCardWithQuote from '@/modules/UIBlocks/FounderNote/FounderCardWithQuote';
import IconGrid from '@/modules/UIBlocks/Features/IconGrid';
import LeftCopyRightImage from '@/modules/UIBlocks/Hero/leftCopyRightImage';
import LogoGrid from '@/modules/UIBlocks/Integration/LogoGrid';
import LogoWall from '@/modules/UIBlocks/SocialProof/LogoWall';
import MockupWithCTA from '@/modules/UIBlocks/Close/MockupWithCTA';
import ObjectionAccordion from '@/modules/UIBlocks/Objection/ObjectionAccordion';
import PersonaGrid from '@/modules/UIBlocks/UseCase/PersonaGrid';
import QuoteGrid from '@/modules/UIBlocks/Testimonial/QuoteGrid';
import SecurityChecklist from '@/modules/UIBlocks/Security/SecurityChecklist';
import SideBySideBlock from '@/modules/UIBlocks/BeforeAfter/SideBySideBlock';
import StackedHighlights from '@/modules/UIBlocks/UniqueMechanism/StackedHighlights';
import StackedPainBullets from '@/modules/UIBlocks/Problem/StackedPainBullets';
import StackedTextVisual from '@/modules/UIBlocks/BeforeAfter/StackedTextVisual';
import StatBlocks from '@/modules/UIBlocks/Results/StatBlocks';
import ThreeStepHorizontal from '@/modules/UIBlocks/HowItWorks/ThreeStepHorizontal';
import TierCards from '@/modules/UIBlocks/Pricing/TierCards';


// Component registry type definition
export type ComponentRegistry = Record<string, Record<string, React.ComponentType<any>>>;

// Main component registry - maps section types and layouts to components
export const componentRegistry: ComponentRegistry = {
  beforeAfter: {
    SideBySideBlocks: SideBySideBlock,
    // StackedTextVisual: StackedTextVisual,
    // BeforeAfterSlider: BeforeAfterSlider,
    // SplitCard: SplitCard,
    // TextListTransformation: TextListTransformation,
    // VisualStoryline: VisualStoryline,
    // StatComparison: StatComparison,
    // PersonaJourney: PersonaJourney,
  },
  
  hero: {
    leftCopyRightImage: LeftCopyRightImage,
    // centerStacked: CenterStacked,
    // splitScreen: SplitScreen,
    // imageFirst: ImageFirst,
  },
  
  features: {
    IconGrid: IconGrid,
    // SplitAlternating: SplitAlternating,
    // Tabbed: Tabbed,
    // Timeline: Timeline,
    // FeatureTestimonial: FeatureTestimonial,
    // MetricTiles: MetricTiles,
    // MiniCards: MiniCards,
    // Carousel: Carousel,
  },
  
  faq: {
    AccordionFAQ: AccordionFAQ,
    // TwoColumnFAQ: TwoColumnFAQ,
    // InlineQnAList: InlineQnAList,
    // SegmentedFAQTabs: SegmentedFAQTabs,
    // QuoteStyleAnswers: QuoteStyleAnswers,
    // IconWithAnswers: IconWithAnswers,
    // TestimonialFAQs: TestimonialFAQs,
    // ChatBubbleFAQ: ChatBubbleFAQ,
  },
  
  pricing: {
    TierCards: TierCards,
    // ToggleableMonthlyYearly: ToggleableMonthlyYearly,
    // FeatureMatrix: FeatureMatrix,
    // SegmentBasedPricing: SegmentBasedPricing,
    // SliderPricing: SliderPricing,
    // CallToQuotePlan: CallToQuotePlan,
    // CardWithTestimonial: CardWithTestimonial,
    // MiniStackedCards: MiniStackedCards,
  },
  
  testimonials: {
    QuoteGrid: QuoteGrid,
    // VideoTestimonials: VideoTestimonials,
    // AvatarCarousel: AvatarCarousel,
    // BeforeAfterQuote: BeforeAfterQuote,
    // SegmentedTestimonials: SegmentedTestimonials,
    // RatingCards: RatingCards,
    // PullQuoteStack: PullQuoteStack,
    // InteractiveTestimonialMap: InteractiveTestimonialMap,
  },
  
  problem: {
    StackedPainBullets: StackedPainBullets,
    // BeforeImageAfterText: BeforeImageAfterText,
    // SideBySideSplit: SideBySideSplit,
    // EmotionalQuotes: EmotionalQuotes,
    // CollapsedCards: CollapsedCards,
    // PainMeterChart: PainMeterChart,
    // PersonaPanels: PersonaPanels,
    // ProblemChecklist: ProblemChecklist,
  },
  
  results: {
    StatBlocks: StatBlocks,
    // BeforeAfterStats: BeforeAfterStats,
    // QuoteWithMetric: QuoteWithMetric,
    // EmojiOutcomeGrid: EmojiOutcomeGrid,
    // TimelineResults: TimelineResults,
    // OutcomeIcons: OutcomeIcons,
    // StackedWinsList: StackedWinsList,
    // PersonaResultPanels: PersonaResultPanels,
  },
  
  howItWorks: {
    ThreeStepHorizontal: ThreeStepHorizontal,
    // VerticalTimeline: VerticalTimeline,
    // IconCircleSteps: IconCircleSteps,
    // AccordionSteps: AccordionSteps,
    // CardFlipSteps: CardFlipSteps,
    // VideoWalkthrough: VideoWalkthrough,
    // ZigzagImageSteps: ZigzagImageSteps,
    // AnimatedProcessLine: AnimatedProcessLine,
  },
  
  useCases: {
    PersonaGrid: PersonaGrid,
    // TabbedUseCases: TabbedUseCases,
    // IndustryTiles: IndustryTiles,
    // ScenarioCards: ScenarioCards,
    // JobToBeDoneList: JobToBeDoneList,
    // SegmentSplitBlocks: SegmentSplitBlocks,
    // CarouselAvatars: CarouselAvatars,
    // RoleBenefitMatrix: RoleBenefitMatrix,
  },
  
  uniqueMechanism: {
    StackedHighlights: StackedHighlights,
    // VisualFlywheel: VisualFlywheel,
    // PillarIcons: PillarIcons,
    // IllustratedModel: IllustratedModel,
    // ExplainerWithTags: ExplainerWithTags,
    // ComparisonTable: ComparisonTable,
    // PatentStrip: PatentStrip,
    // SingleBigIdea: SingleBigIdea,
  },
  
  socialProof: {
    LogoWall: LogoWall,
    // MediaMentions: MediaMentions,
    // UserCountBar: UserCountBar,
    // IndustryBadgeLine: IndustryBadgeLine,
    // MapHeatSpots: MapHeatSpots,
    // StackedStats: StackedStats,
    // StripWithReviews: StripWithReviews,
    // SocialProofStrip: SocialProofStrip,
  },
  
  security: {
    // ComplianceBadgeRow: ComplianceBadgeRow,
    SecurityChecklist: SecurityChecklist,
    // AuditTrustPanel: AuditTrustPanel,
    // FAQStyleSecurity: FAQStyleSecurity,
    // StatWithShieldIcons: StatWithShieldIcons,
    // PartnerValidationRow: PartnerValidationRow,
    // DiagramInfraSecurity: DiagramInfraSecurity,
    // ExpandablePolicyCards: ExpandablePolicyCards,
  },
  
  integrations: {
    LogoGrid: LogoGrid,
    // CategoryAccordion: CategoryAccordion,
    // InteractiveStackDiagram: InteractiveStackDiagram,
    // UseCaseTiles: UseCaseTiles,
    // BadgeCarousel: BadgeCarousel,
    // TabbyIntegrationCards: TabbyIntegrationCards,
    // ZapierLikeBuilderPreview: ZapierLikeBuilderPreview,
    // LogoWithQuoteUse: LogoWithQuoteUse,
  },
  
  objectionHandling: {
    ObjectionAccordion: ObjectionAccordion,
    // MythVsRealityGrid: MythVsRealityGrid,
    // QuoteBackedAnswers: QuoteBackedAnswers,
    // VisualObjectionTiles: VisualObjectionTiles,
    // ProblemToReframeBlocks: ProblemToReframeBlocks,
    // SkepticToBelieverSteps: SkepticToBelieverSteps,
    // BoldGuaranteePanel: BoldGuaranteePanel,
    // ObjectionCarousel: ObjectionCarousel,
  },
  
  founderNote: {
    FounderCardWithQuote: FounderCardWithQuote,
    // LetterStyleBlock: LetterStyleBlock,
    // VideoNoteWithTranscript: VideoNoteWithTranscript,
    // MissionQuoteOverlay: MissionQuoteOverlay,
    // TimelineToToday: TimelineToToday,
    // SideBySidePhotoStory: SideBySidePhotoStory,
    // StoryBlockWithPullquote: StoryBlockWithPullquote,
    // FoundersBeliefStack: FoundersBeliefStack,
  },
  
  comparisonTable: {
    BasicFeatureGrid: BasicFeatureGrid,
    // CheckmarkComparison: CheckmarkComparison,
    // YouVsThemHighlight: YouVsThemHighlight,
    // ToggleableComparison: ToggleableComparison,
    // CompetitorCallouts: CompetitorCallouts,
    // AnimatedUpgradePath: AnimatedUpgradePath,
    // PersonaUseCaseCompare: PersonaUseCaseCompare,
    // LiteVsProVsEnterprise: LiteVsProVsEnterprise,
  },
  
  cta: {
    CenteredHeadlineCTA: CenteredHeadlineCTA,
    // CTAWithBadgeRow: CTAWithBadgeRow,
    // VisualCTAWithMockup: VisualCTAWithMockup,
    // SideBySideCTA: SideBySideCTA,
    // CountdownLimitedCTA: CountdownLimitedCTA,
    // CTAWithFormField: CTAWithFormField,
    // ValueStackCTA: ValueStackCTA,
    // TestimonialCTACombo: TestimonialCTACombo,
  },
  
  closeSection: {
    MockupWithCTA: MockupWithCTA,
    // BonusStackCTA: BonusStackCTA,
    // LeadMagnetCard: LeadMagnetCard,
    // EnterpriseContactBox: EnterpriseContactBox,
    // ValueReinforcementBlock: ValueReinforcementBlock,
    // LivePreviewEmbed: LivePreviewEmbed,
    // SideBySideOfferCards: SideBySideOfferCards,
    // MultistepCTAStack: MultistepCTAStack,
  },
};

// Helper function to get a component by section and layout
export function getComponent(sectionType: string, layoutName: string): React.ComponentType<any> | null {
  const sectionComponents = componentRegistry[sectionType];
  if (!sectionComponents) {
    console.warn(`No components found for section type: ${sectionType}`);
    return null;
  }
  
  const component = sectionComponents[layoutName];
  if (!component) {
    console.warn(`No component found for layout: ${sectionType}.${layoutName}`);
    return null;
  }
  
  return component;
}

// Helper function to get all available layouts for a section type
export function getAvailableLayouts(sectionType: string): string[] {
  const sectionComponents = componentRegistry[sectionType];
  return sectionComponents ? Object.keys(sectionComponents) : [];
}

// Helper function to check if a layout exists
export function hasLayout(sectionType: string, layoutName: string): boolean {
  return componentRegistry[sectionType]?.[layoutName] !== undefined;
}