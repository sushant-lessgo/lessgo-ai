import React from 'react';

// Header components
import MinimalNavHeader from '@/modules/UIBlocks/Header/MinimalNavHeader';
import NavWithCTAHeader from '@/modules/UIBlocks/Header/NavWithCTAHeader';
import CenteredLogoHeader from '@/modules/UIBlocks/Header/CenteredLogoHeader';
import FullNavHeader from '@/modules/UIBlocks/Header/FullNavHeader';

// Footer components
import SimpleFooter from '@/modules/UIBlocks/Footer/SimpleFooter';
import LinksAndSocialFooter from '@/modules/UIBlocks/Footer/LinksAndSocialFooter';
import MultiColumnFooter from '@/modules/UIBlocks/Footer/MultiColumnFooter';
import ContactFooter from '@/modules/UIBlocks/Footer/ContactFooter';

import AccordionFAQ from '@/modules/UIBlocks/FAQ/AccordionFAQ';
import AccordionSteps from '@/modules/UIBlocks/HowItWorks/AccordionSteps';
// V3 ARCHIVED: import AlgorithmExplainer from '@/modules/UIBlocks/UniqueMechanism/AlgorithmExplainer';
// V3 ARCHIVED: import AnimatedProcessLine from '@/modules/UIBlocks/HowItWorks/AnimatedProcessLine';
// ARCHIVED: import AnimatedUpgradePath from '@/modules/UIBlocks/Comparison/AnimatedUpgradePath';
// ARCHIVED: import AuditResultsPanel from '@/modules/UIBlocks/Security/AuditResultsPanel';
import AvatarCarousel from '@/modules/UIBlocks/Testimonials/AvatarCarousel';
// ARCHIVED: import BadgeCarousel from '@/modules/UIBlocks/Integration/BadgeCarousel';
// ARCHIVED: import BasicFeatureGrid from '@/modules/UIBlocks/Comparison/BasicFeatureGrid';
import BeforeAfterQuote from '@/modules/UIBlocks/Testimonials/BeforeAfterQuote';
// V3 ARCHIVED: import BeforeAfterStats from '@/modules/UIBlocks/Results/BeforeAfterStats';
// V3 ARCHIVED: import BeforeImageAfterText from '@/modules/UIBlocks/Problem/BeforeImageAfterText';
// V3 ARCHIVED: import BoldGuaranteePanel from '@/modules/UIBlocks/ObjectionHandle/BoldGuaranteePanel';
// ARCHIVED: import BonusStackCTA from '@/modules/UIBlocks/Close/BonusStackCTA';
// V3 ARCHIVED: import BeforeAfterSlider from '@/modules/UIBlocks/BeforeAfter/BeforeAfterSlider';
// import BeforeAfterWorkflow from '@/modules/UIBlocks/UseCases/BeforeAfterWorkflow'; // Temporarily disabled - not related to use case
import CallToQuotePlan from '@/modules/UIBlocks/Pricing/CallToQuotePlan';
// V3 ARCHIVED: import CardFlipSteps from '@/modules/UIBlocks/HowItWorks/CardFlipSteps';
// V3 ARCHIVED: import CardWithTestimonial from '@/modules/UIBlocks/Pricing/CardWithTestimonial';
import Carousel from '@/modules/UIBlocks/Features/Carousel';
// ARCHIVED: import CategoryAccordion from '@/modules/UIBlocks/Integration/CategoryAccordion';
import CenterStacked from '@/modules/UIBlocks/Hero/CenterStacked';
import CenteredHeadlineCTA from '@/modules/UIBlocks/CTA/CenteredHeadlineCTA';
// V3 ARCHIVED: import ChatBubbleFAQ from '@/modules/UIBlocks/FAQ/ChatBubbleFAQ';
// ARCHIVED: import CheckmarkComparison from '@/modules/UIBlocks/Comparison/CheckmarkComparison';
import CollapsedCards from '@/modules/UIBlocks/Problem/CollapsedCards';
// ARCHIVED: import CompetitorCallouts from '@/modules/UIBlocks/Comparison/CompetitorCallouts';
// V3 ARCHIVED: import CTAWithBadgeRow from '@/modules/UIBlocks/CTA/CTAWithBadgeRow';
// V3 ARCHIVED: import CTAWithFormField from '@/modules/UIBlocks/CTA/CTAWithFormField';
// V3 ARCHIVED: import CountdownLimitedCTA from '@/modules/UIBlocks/CTA/CountdownLimitedCTA';
// V3 ARCHIVED: import CustomerJourneyFlow from '@/modules/UIBlocks/UseCases/CustomerJourneyFlow';
// V3 ARCHIVED: import EmojiOutcomeGrid from '@/modules/UIBlocks/Results/EmojiOutcomeGrid';
// V3 ARCHIVED: import EmotionalQuotes from '@/modules/UIBlocks/Problem/EmotionalQuotes';
// ARCHIVED: import EnterpriseContactBox from '@/modules/UIBlocks/Close/EnterpriseContactBox';
// V3 ARCHIVED: import FeatureMatrix from '@/modules/UIBlocks/Pricing/FeatureMatrix';
// V3 ARCHIVED: import FeatureTestimonial from '@/modules/UIBlocks/Features/FeatureTestimonial';
import FounderCardWithQuote from '@/modules/UIBlocks/FounderNote/FounderCardWithQuote';
import FoundersBeliefStack from '@/modules/UIBlocks/FounderNote/FoundersBeliefStack';
// V3 ARCHIVED: import IconCircleSteps from '@/modules/UIBlocks/HowItWorks/IconCircleSteps';
import IconGrid from '@/modules/UIBlocks/Features/IconGrid';
// V3 ARCHIVED: import IconWithAnswers from '@/modules/UIBlocks/FAQ/IconWithAnswers';
import ImageFirst from '@/modules/UIBlocks/Hero/ImageFirst';
import MinimalistComponent from '@/modules/UIBlocks/Hero/Minimalist';
// V3 ARCHIVED: import InnovationTimeline from '@/modules/UIBlocks/UniqueMechanism/InnovationTimeline';
// V3 ARCHIVED: import IndustryBadgeLine from '@/modules/UIBlocks/SocialProof/IndustryBadgeLine';
import IndustryUseCaseGrid from '@/modules/UIBlocks/UseCases/IndustryUseCaseGrid';
import InlineQnAList from '@/modules/UIBlocks/FAQ/InlineQnAList';
// ARCHIVED: import InteractiveStackDiagram from '@/modules/UIBlocks/Integration/InteractiveStackDiagram';
// V3 ARCHIVED: import InteractiveTestimonialMap from '@/modules/UIBlocks/Testimonials/InteractiveTestimonialMap';
// V3 ARCHIVED: import InteractiveUseCaseMap from '@/modules/UIBlocks/UseCases/InteractiveUseCaseMap';
// ARCHIVED: import LeadMagnetCard from '@/modules/UIBlocks/Close/LeadMagnetCard';
import LeftCopyRightImage from '@/modules/UIBlocks/Hero/LeftCopyRightImage';
import LetterStyleBlock from '@/modules/UIBlocks/FounderNote/LetterStyleBlock';
// ARCHIVED: import LiteVsProVsEnterprise from '@/modules/UIBlocks/Comparison/LiteVsProVsEnterprise';
// ARCHIVED: import LivePreviewEmbed from '@/modules/UIBlocks/Close/LivePreviewEmbed';
// ARCHIVED: import LogoGrid from '@/modules/UIBlocks/Integration/LogoGrid';
// ARCHIVED: import LogoWithQuoteUse from '@/modules/UIBlocks/Integration/LogoWithQuoteUse';
import LogoWall from '@/modules/UIBlocks/SocialProof/LogoWall';
// V3 ARCHIVED: import MapHeatSpots from '@/modules/UIBlocks/SocialProof/MapHeatSpots';
// V3 ARCHIVED: import MediaMentions from '@/modules/UIBlocks/SocialProof/MediaMentions';
import MethodologyBreakdown from '@/modules/UIBlocks/UniqueMechanism/MethodologyBreakdown';
import MetricTiles from '@/modules/UIBlocks/Features/MetricTiles';
// V3 ARCHIVED: import MiniCards from '@/modules/UIBlocks/Features/MiniCards';
// V3 ARCHIVED: import MiniStackedCards from '@/modules/UIBlocks/Pricing/MiniStackedCards';
import MissionQuoteOverlay from '@/modules/UIBlocks/FounderNote/MissionQuoteOverlay';
// ARCHIVED: import MockupWithCTA from '@/modules/UIBlocks/Close/MockupWithCTA';
// ARCHIVED: import MultistepCTAStack from '@/modules/UIBlocks/Close/MultistepCTAStack';
import MythVsRealityGrid from '@/modules/UIBlocks/ObjectionHandle/MythVsRealityGrid';
// V3 ARCHIVED: import ObjectionAccordion from '@/modules/UIBlocks/ObjectionHandle/ObjectionAccordion';
// import ObjectionCarousel from '@/modules/UIBlocks/ObjectionHandle/ObjectionCarousel'; // Temporarily disabled
// V3 ARCHIVED: import OutcomeIcons from '@/modules/UIBlocks/Results/OutcomeIcons';
// TODO: Disabled for MVP - import PainMeterChart from '@/modules/UIBlocks/Problem/PainMeterChart';
// ARCHIVED: import PenetrationTestResults from '@/modules/UIBlocks/Security/PenetrationTestResults';
import PersonaGrid from '@/modules/UIBlocks/UseCases/PersonaGrid';
// V3 ARCHIVED: import PersonaJourney from '@/modules/UIBlocks/BeforeAfter/PersonaJourney';
import PersonaPanels from '@/modules/UIBlocks/Problem/PersonaPanels';
// V3 ARCHIVED: import PersonaResultPanels from '@/modules/UIBlocks/Results/PersonaResultPanels';
import ResultsGallery from '@/modules/UIBlocks/Results/ResultsGallery';
// ARCHIVED: import PersonaUseCaseCompare from '@/modules/UIBlocks/Comparison/PersonaUseCaseCompare';
// ARCHIVED: import PrivacyCommitmentBlock from '@/modules/UIBlocks/Security/PrivacyCommitmentBlock';
import ProcessFlowDiagram from '@/modules/UIBlocks/UniqueMechanism/ProcessFlowDiagram';
// TODO: Temporarily disabled - not useful currently
// import ProblemChecklist from '@/modules/UIBlocks/Problem/ProblemChecklist';
// V3 ARCHIVED: import ProblemToReframeBlocks from '@/modules/UIBlocks/ObjectionHandle/ProblemToReframeBlocks';
import PropertyComparisonMatrix from '@/modules/UIBlocks/UniqueMechanism/PropertyComparisonMatrix';
import PullQuoteStack from '@/modules/UIBlocks/Testimonials/PullQuoteStack';
// V3 ARCHIVED: import QuoteBackedAnswers from '@/modules/UIBlocks/ObjectionHandle/QuoteBackedAnswers';
import QuoteGrid from '@/modules/UIBlocks/Testimonials/QuoteGrid';
// V3 ARCHIVED: import QuoteStyleAnswers from '@/modules/UIBlocks/FAQ/QuoteStyleAnswers';
// V3 ARCHIVED: import QuoteWithMetric from '@/modules/UIBlocks/Results/QuoteWithMetric';
// V3 ARCHIVED: import RatingCards from '@/modules/UIBlocks/Testimonials/RatingCards';
import RoleBasedScenarios from '@/modules/UIBlocks/UseCases/RoleBasedScenarios';
import SecretSauceReveal from '@/modules/UIBlocks/UniqueMechanism/SecretSauceReveal';
// ARCHIVED: import SecurityChecklist from '@/modules/UIBlocks/Security/SecurityChecklist';
// ARCHIVED: import SecurityGuaranteePanel from '@/modules/UIBlocks/Security/SecurityGuaranteePanel';
// V3 ARCHIVED: import SegmentBasedPricing from '@/modules/UIBlocks/Pricing/SegmentBasedPricing';
import SegmentedFAQTabs from '@/modules/UIBlocks/FAQ/SegmentedFAQTabs';
// V3 ARCHIVED: import SegmentedTestimonials from '@/modules/UIBlocks/Testimonials/SegmentedTestimonials';
import SideBySideBlocks from '@/modules/UIBlocks/BeforeAfter/SideBySideBlock';
// ARCHIVED: import SideBySideOfferCards from '@/modules/UIBlocks/Close/SideBySideOfferCards';
// V3 ARCHIVED: import SideBySideCTA from '@/modules/UIBlocks/CTA/SideBySideCTA';
// V3 ARCHIVED: import SideBySidePhotoStory from '@/modules/UIBlocks/FounderNote/SideBySidePhotoStory';
import SideBySideSplit from '@/modules/UIBlocks/Problem/SideBySideSplit';
// V3 ARCHIVED: import SkepticToBelieverSteps from '@/modules/UIBlocks/ObjectionHandle/SkepticToBelieverSteps';
import SliderPricing from '@/modules/UIBlocks/Pricing/SliderPricing';
// V3 ARCHIVED: import SocialProofStrip from '@/modules/UIBlocks/SocialProof/SocialProofStrip';
import SplitCard from '@/modules/UIBlocks/BeforeAfter/SplitCard';
import StackedHighlights from '@/modules/UIBlocks/UniqueMechanism/StackedHighlights';
// V3 ARCHIVED: import StackedStats from '@/modules/UIBlocks/SocialProof/StackedStats';
import StackedWinsList from '@/modules/UIBlocks/Results/StackedWinsList';
// V3 ARCHIVED: import SystemArchitecture from '@/modules/UIBlocks/UniqueMechanism/SystemArchitecture';
// V3 ARCHIVED: import StackedPainBullets from '@/modules/UIBlocks/Problem/StackedPainBullets';
import SplitAlternating from '@/modules/UIBlocks/Features/SplitAlternating';
import StackedTextVisual from '@/modules/UIBlocks/BeforeAfter/StackedTextVisual';
import SplitScreen from '@/modules/UIBlocks/Hero/SplitScreen';
import StatBlocks from '@/modules/UIBlocks/Results/StatBlocks';
// V3 ARCHIVED: import StoryBlockWithPullquote from '@/modules/UIBlocks/FounderNote/StoryBlockWithPullquote';
import TechnicalAdvantage from '@/modules/UIBlocks/UniqueMechanism/TechnicalAdvantage';
// V3 ARCHIVED: import StripWithReviews from '@/modules/UIBlocks/SocialProof/StripWithReviews';
// V3 ARCHIVED: import Tabbed from '@/modules/UIBlocks/Features/Tabbed';
// ARCHIVED: import TabbyIntegrationCards from '@/modules/UIBlocks/Integration/TabbyIntegrationCards';
// V3 ARCHIVED: import TestimonialCTACombo from '@/modules/UIBlocks/CTA/TestimonialCTACombo';
// V3 ARCHIVED: import TestimonialFAQs from '@/modules/UIBlocks/FAQ/TestimonialFAQs';
import ThreeStepHorizontal from '@/modules/UIBlocks/HowItWorks/ThreeStepHorizontal';
import TierCards from '@/modules/UIBlocks/Pricing/TierCards';
// V3 ARCHIVED: import TimelineResults from '@/modules/UIBlocks/Results/TimelineResults';
// import Timeline from '@/modules/UIBlocks/Features/Timeline'; // Temporarily retired
import TimelineToToday from '@/modules/UIBlocks/FounderNote/TimelineToToday';
// ARCHIVED: import ToggleableComparison from '@/modules/UIBlocks/Comparison/ToggleableComparison';
import ToggleableMonthlyYearly from '@/modules/UIBlocks/Pricing/ToggleableMonthlyYearly';
// ARCHIVED: import TrustSealCollection from '@/modules/UIBlocks/Security/TrustSealCollection';
import TwoColumnFAQ from '@/modules/UIBlocks/FAQ/TwoColumnFAQ';
// V3 ARCHIVED: import StatComparison from '@/modules/UIBlocks/BeforeAfter/StatComparison';
// V3 ARCHIVED: import TextListTransformation from '@/modules/UIBlocks/BeforeAfter/TextListTransformation';
// V3 ARCHIVED: import UseCaseCarousel from '@/modules/UIBlocks/UseCases/UseCaseCarousel';
// ARCHIVED: import UseCaseTiles from '@/modules/UIBlocks/Integration/UseCaseTiles';
// V3 ARCHIVED: import UserCountBar from '@/modules/UIBlocks/SocialProof/UserCountBar';
// ARCHIVED: import ValueReinforcementBlock from '@/modules/UIBlocks/Close/ValueReinforcementBlock';
import ValueStackCTA from '@/modules/UIBlocks/CTA/ValueStackCTA';
import VerticalTimeline from '@/modules/UIBlocks/HowItWorks/VerticalTimeline';
// V3 ARCHIVED: import VideoNoteWithTranscript from '@/modules/UIBlocks/FounderNote/VideoNoteWithTranscript';
import VideoTestimonials from '@/modules/UIBlocks/Testimonials/VideoTestimonials';
import VideoWalkthrough from '@/modules/UIBlocks/HowItWorks/VideoWalkthrough';
import VisualCTAWithMockup from '@/modules/UIBlocks/CTA/VisualCTAWithMockup';
import VisualObjectionTiles from '@/modules/UIBlocks/ObjectionHandle/VisualObjectionTiles';
// V3 ARCHIVED: import VisualStoryline from '@/modules/UIBlocks/BeforeAfter/VisualStoryline';
// V3 ARCHIVED: import WorkflowDiagrams from '@/modules/UIBlocks/UseCases/WorkflowDiagrams';
// ARCHIVED: import YouVsThemHighlight from '@/modules/UIBlocks/Comparison/YouVsThemHighlight';
// ARCHIVED: import ZapierLikeBuilderPreview from '@/modules/UIBlocks/Integration/ZapierLikeBuilderPreview';
// V3 ARCHIVED: import ZigzagImageSteps from '@/modules/UIBlocks/HowItWorks/ZigzagImageSteps';
// ARCHIVED: import Announcement from '@/modules/UIBlocks/Miscellaneous/Announcement';


import { logger } from '@/lib/logger';
// Component registry type definition
export type ComponentRegistry = Record<string, Record<string, React.ComponentType<any>>>;

// Main component registry - maps section types and layouts to components
export const componentRegistry: ComponentRegistry = {
  header: {
    MinimalNavHeader: MinimalNavHeader,
    NavWithCTAHeader: NavWithCTAHeader,
    CenteredLogoHeader: CenteredLogoHeader,
    FullNavHeader: FullNavHeader,
  },
  
  beforeAfter: {
    SideBySideBlocks: SideBySideBlocks,
    StackedTextVisual: StackedTextVisual,
    // V3 ARCHIVED: BeforeAfterSlider: BeforeAfterSlider,
    SplitCard: SplitCard,
    // V3 ARCHIVED: TextListTransformation: TextListTransformation,
    // V3 ARCHIVED: VisualStoryline: VisualStoryline,
    // V3 ARCHIVED: StatComparison: StatComparison,
    // V3 ARCHIVED: PersonaJourney: PersonaJourney,
  },
  
  hero: {
    leftCopyRightImage: LeftCopyRightImage,
    centerStacked: CenterStacked,
    splitScreen: SplitScreen,
    imageFirst: ImageFirst,
    minimalist: MinimalistComponent,
  },
  
  features: {
    IconGrid: IconGrid,
    SplitAlternating: SplitAlternating,
    // Timeline: Timeline, // Temporarily retired
    // V3 ARCHIVED: FeatureTestimonial: FeatureTestimonial,
    MetricTiles: MetricTiles,
    // V3 ARCHIVED: MiniCards: MiniCards,
    Carousel: Carousel,
    // V3 ARCHIVED: Tabbed: Tabbed,
  },
  
  faq: {
    AccordionFAQ: AccordionFAQ,
    TwoColumnFAQ: TwoColumnFAQ,
    InlineQnAList: InlineQnAList,
    SegmentedFAQTabs: SegmentedFAQTabs,
    // V3 ARCHIVED: QuoteStyleAnswers: QuoteStyleAnswers,
    // V3 ARCHIVED: IconWithAnswers: IconWithAnswers,
    // V3 ARCHIVED: TestimonialFAQs: TestimonialFAQs,
    // V3 ARCHIVED: ChatBubbleFAQ: ChatBubbleFAQ,
  },
  
  pricing: {
    TierCards: TierCards,
    ToggleableMonthlyYearly: ToggleableMonthlyYearly,
    // V3 ARCHIVED: FeatureMatrix: FeatureMatrix,
    // V3 ARCHIVED: SegmentBasedPricing: SegmentBasedPricing,
    SliderPricing: SliderPricing,
    CallToQuotePlan: CallToQuotePlan,
    // V3 ARCHIVED: CardWithTestimonial: CardWithTestimonial,
    // V3 ARCHIVED: MiniStackedCards: MiniStackedCards,
  },
  
  testimonials: {
    QuoteGrid: QuoteGrid,
    VideoTestimonials: VideoTestimonials,
    AvatarCarousel: AvatarCarousel,
    BeforeAfterQuote: BeforeAfterQuote,
    // V3 ARCHIVED: SegmentedTestimonials: SegmentedTestimonials,
    // V3 ARCHIVED: RatingCards: RatingCards,
    PullQuoteStack: PullQuoteStack,
    // V3 ARCHIVED: InteractiveTestimonialMap: InteractiveTestimonialMap,
  },
  
  problem: {
    // V3 ARCHIVED: StackedPainBullets: StackedPainBullets,
    // V3 ARCHIVED: BeforeImageAfterText: BeforeImageAfterText,
    SideBySideSplit: SideBySideSplit,
    // V3 ARCHIVED: EmotionalQuotes: EmotionalQuotes,
    CollapsedCards: CollapsedCards,
    // TODO: Disabled for MVP - PainMeterChart: PainMeterChart,
    PersonaPanels: PersonaPanels,
    // TODO: Temporarily disabled - not useful currently
    // ProblemChecklist: ProblemChecklist,
  },
  
  results: {
    StatBlocks: StatBlocks,
    // V3 ARCHIVED: BeforeAfterStats: BeforeAfterStats,
    // V3 ARCHIVED: QuoteWithMetric: QuoteWithMetric,
    // V3 ARCHIVED: EmojiOutcomeGrid: EmojiOutcomeGrid,
    // V3 ARCHIVED: TimelineResults: TimelineResults,
    // V3 ARCHIVED: OutcomeIcons: OutcomeIcons,
    StackedWinsList: StackedWinsList,
    // V3 ARCHIVED: PersonaResultPanels: PersonaResultPanels,
    ResultsGallery: ResultsGallery,
  },
  
  howItWorks: {
    ThreeStepHorizontal: ThreeStepHorizontal,
    VerticalTimeline: VerticalTimeline,
    // V3 ARCHIVED: IconCircleSteps: IconCircleSteps,
    AccordionSteps: AccordionSteps,
    // V3 ARCHIVED: CardFlipSteps: CardFlipSteps,
    VideoWalkthrough: VideoWalkthrough,
    // V3 ARCHIVED: ZigzagImageSteps: ZigzagImageSteps,
    // V3 ARCHIVED: AnimatedProcessLine: AnimatedProcessLine,
  },
  
  useCases: {
    // V3 ARCHIVED: BeforeAfterWorkflow: BeforeAfterWorkflow,
    // V3 ARCHIVED: CustomerJourneyFlow: CustomerJourneyFlow,
    IndustryUseCaseGrid: IndustryUseCaseGrid,
    // V3 ARCHIVED: InteractiveUseCaseMap: InteractiveUseCaseMap,
    PersonaGrid: PersonaGrid,
    RoleBasedScenarios: RoleBasedScenarios,
    // V3 ARCHIVED: UseCaseCarousel: UseCaseCarousel,
    // V3 ARCHIVED: WorkflowDiagrams: WorkflowDiagrams,
  },
  
  uniqueMechanism: {
    // V3 ARCHIVED: AlgorithmExplainer: AlgorithmExplainer,
    // V3 ARCHIVED: InnovationTimeline: InnovationTimeline,
    MethodologyBreakdown: MethodologyBreakdown,
    ProcessFlowDiagram: ProcessFlowDiagram,
    PropertyComparisonMatrix: PropertyComparisonMatrix,
    SecretSauceReveal: SecretSauceReveal,
    StackedHighlights: StackedHighlights,
    // V3 ARCHIVED: SystemArchitecture: SystemArchitecture,
    TechnicalAdvantage: TechnicalAdvantage,
  },
  
  socialProof: {
    LogoWall: LogoWall,
    // V3 ARCHIVED: MediaMentions: MediaMentions,
    // V3 ARCHIVED: UserCountBar: UserCountBar,
    // V3 ARCHIVED: IndustryBadgeLine: IndustryBadgeLine,
    // V3 ARCHIVED: MapHeatSpots: MapHeatSpots,
    // V3 ARCHIVED: StackedStats: StackedStats,
    // V3 ARCHIVED: StripWithReviews: StripWithReviews,
    // V3 ARCHIVED: SocialProofStrip: SocialProofStrip,
  },
  
  // ARCHIVED: security section - components moved to archive/uiblocks-extra/Security
  // security: {
  //   AuditResultsPanel: AuditResultsPanel,
  //   PenetrationTestResults: PenetrationTestResults,
  //   PrivacyCommitmentBlock: PrivacyCommitmentBlock,
  //   SecurityChecklist: SecurityChecklist,
  //   SecurityGuaranteePanel: SecurityGuaranteePanel,
  //   TrustSealCollection: TrustSealCollection,
  // },

  // ARCHIVED: integrations section - components moved to archive/uiblocks-extra/Integration
  // integrations: {
  //   LogoGrid: LogoGrid,
  //   CategoryAccordion: CategoryAccordion,
  //   InteractiveStackDiagram: InteractiveStackDiagram,
  //   UseCaseTiles: UseCaseTiles,
  //   BadgeCarousel: BadgeCarousel,
  //   TabbyIntegrationCards: TabbyIntegrationCards,
  //   ZapierLikeBuilderPreview: ZapierLikeBuilderPreview,
  //   LogoWithQuoteUse: LogoWithQuoteUse,
  // },
  
  objectionHandling: {
    // V3 ARCHIVED: ObjectionAccordion: ObjectionAccordion,
    MythVsRealityGrid: MythVsRealityGrid,
    // V3 ARCHIVED: QuoteBackedAnswers: QuoteBackedAnswers,
    VisualObjectionTiles: VisualObjectionTiles,
    // V3 ARCHIVED: ProblemToReframeBlocks: ProblemToReframeBlocks,
    // V3 ARCHIVED: SkepticToBelieverSteps: SkepticToBelieverSteps,
    // V3 ARCHIVED: BoldGuaranteePanel: BoldGuaranteePanel,
    // V3 ARCHIVED: ObjectionCarousel: ObjectionCarousel,
  },
  
  founderNote: {
    FounderCardWithQuote: FounderCardWithQuote,
    LetterStyleBlock: LetterStyleBlock,
    // V3 ARCHIVED: VideoNoteWithTranscript: VideoNoteWithTranscript,
    MissionQuoteOverlay: MissionQuoteOverlay,
    TimelineToToday: TimelineToToday,
    // V3 ARCHIVED: SideBySidePhotoStory: SideBySidePhotoStory,
    // V3 ARCHIVED: StoryBlockWithPullquote: StoryBlockWithPullquote,
    FoundersBeliefStack: FoundersBeliefStack,
  },
  
  // ARCHIVED: comparisonTable section - components moved to archive/uiblocks-extra/Comparison
  // comparisonTable: {
  //   BasicFeatureGrid: BasicFeatureGrid,
  //   CheckmarkComparison: CheckmarkComparison,
  //   YouVsThemHighlight: YouVsThemHighlight,
  //   ToggleableComparison: ToggleableComparison,
  //   CompetitorCallouts: CompetitorCallouts,
  //   AnimatedUpgradePath: AnimatedUpgradePath,
  //   PersonaUseCaseCompare: PersonaUseCaseCompare,
  //   LiteVsProVsEnterprise: LiteVsProVsEnterprise,
  // },
  
  cta: {
    CenteredHeadlineCTA: CenteredHeadlineCTA,
    // V3 ARCHIVED: CTAWithBadgeRow: CTAWithBadgeRow,
    VisualCTAWithMockup: VisualCTAWithMockup,
    // V3 ARCHIVED: SideBySideCTA: SideBySideCTA,
    // V3 ARCHIVED: CountdownLimitedCTA: CountdownLimitedCTA,
    // V3 ARCHIVED: CTAWithFormField: CTAWithFormField,
    ValueStackCTA: ValueStackCTA,
    // V3 ARCHIVED: TestimonialCTACombo: TestimonialCTACombo,
  },
  
  // ARCHIVED: closeSection - components moved to archive/uiblocks-extra/Close
  // closeSection: {
  //   MockupWithCTA: MockupWithCTA,
  //   BonusStackCTA: BonusStackCTA,
  //   LeadMagnetCard: LeadMagnetCard,
  //   EnterpriseContactBox: EnterpriseContactBox,
  //   ValueReinforcementBlock: ValueReinforcementBlock,
  //   LivePreviewEmbed: LivePreviewEmbed,
  //   SideBySideOfferCards: SideBySideOfferCards,
  //   MultistepCTAStack: MultistepCTAStack,
  // },

  // ARCHIVED: miscellaneous section - components moved to archive/uiblocks-extra/Miscellaneous
  // miscellaneous: {
  //   Announcement: Announcement,
  // },

  footer: {
    SimpleFooter: SimpleFooter,
    LinksAndSocialFooter: LinksAndSocialFooter,
    MultiColumnFooter: MultiColumnFooter,
    ContactFooter: ContactFooter,
  },
};

// Helper function to extract section type from section ID
export function extractSectionType(sectionId: string): string {
  // Section IDs are in format: sectionType-timestamp (e.g., "hero-1753195467366")
  // Extract everything before the last dash and numbers
  const match = sectionId.match(/^([a-zA-Z]+)/);
  if (!match) return sectionId;

  const rawType = match[1].toLowerCase();

  // Normalize to registry keys (PascalCase sections → camelCase registry)
  const typeMap: Record<string, string> = {
    'objectionhandle': 'objectionHandling',
    'howitworks': 'howItWorks',
    'beforeafter': 'beforeAfter',
    'socialproof': 'socialProof',
    'usecases': 'useCases',
    'uniquemechanism': 'uniqueMechanism',
    'foundernote': 'founderNote',
  };

  return typeMap[rawType] || rawType;
}

// Helper function to get a component by section and layout
export function getComponent(sectionIdOrType: string, layoutName: string): React.ComponentType<any> | null {
  // Extract section type from section ID if needed
  const sectionType = extractSectionType(sectionIdOrType);
  
  const sectionComponents = componentRegistry[sectionType];
  if (!sectionComponents) {
    logger.warn(`No components found for section type: ${sectionType} (from: ${sectionIdOrType})`);
    return null;
  }
  
  const component = sectionComponents[layoutName];
  if (!component) {
    logger.warn(`No component found for layout: ${sectionType}.${layoutName}`);
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