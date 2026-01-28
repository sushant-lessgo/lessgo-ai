/**
 * Published Component Registry - Server-safe component registry for published pages
 *
 * @remarks
 * - ONLY imports components with published mode support
 * - NO imports from components with hooks at module level
 * - Server-safe for renderToString
 * - Currently includes 4 test components (Minimalist, Announcement, CTAWithFormField, SimpleFooter)
 *
 * Expansion:
 * - Add more UIBlocks as they're updated with *Published functions
 * - Verify each component is server-safe before adding
 */

import React from 'react';

// Import ONLY published-safe files - NO hooks, NO editor components
// These are separate .published.tsx files with ZERO hook imports

// Hero
// ARCHIVED: import MinimalistPublished from '@/modules/UIBlocks/Hero/Minimalist.published';
import CenterStackedPublished from '@/modules/UIBlocks/Hero/CenterStacked.published';
import ImageFirstPublished from '@/modules/UIBlocks/Hero/ImageFirst.published';
import LeftCopyRightImagePublished from '@/modules/UIBlocks/Hero/LeftCopyRightImage.published';
import SplitScreenPublished from '@/modules/UIBlocks/Hero/SplitScreen.published';

// Header
// ARCHIVED: import CenteredLogoHeaderPublished from '@/modules/UIBlocks/Header/CenteredLogoHeader.published';
// ARCHIVED: import FullNavHeaderPublished from '@/modules/UIBlocks/Header/FullNavHeader.published';
import MinimalNavHeaderPublished from '@/modules/UIBlocks/Header/MinimalNavHeader.published';
// ARCHIVED: import NavWithCTAHeaderPublished from '@/modules/UIBlocks/Header/NavWithCTAHeader.published';

// Miscellaneous
// ARCHIVED: import AnnouncementPublished from '@/modules/UIBlocks/Miscellaneous/Announcement.published';

// Primary CTA
// V3 ARCHIVED: import CTAWithFormFieldPublished from '@/modules/UIBlocks/CTA/CTAWithFormField.published';
import VisualCTAWithMockupPublished from '@/modules/UIBlocks/CTA/VisualCTAWithMockup.published';
import CenteredHeadlineCTAPublished from '@/modules/UIBlocks/CTA/CenteredHeadlineCTA.published';
import ValueStackCTAPublished from '@/modules/UIBlocks/CTA/ValueStackCTA.published';
// V3 ARCHIVED: import TestimonialCTAComboPublished from '@/modules/UIBlocks/CTA/TestimonialCTACombo.published';

// Footer
// ARCHIVED: import SimpleFooterPublished from '@/modules/UIBlocks/Footer/SimpleFooter.published';
import ContactFooterPublished from '@/modules/UIBlocks/Footer/ContactFooter.published';
// ARCHIVED: import LinksAndSocialFooterPublished from '@/modules/UIBlocks/Footer/LinksAndSocialFooter.published';
// ARCHIVED: import MultiColumnFooterPublished from '@/modules/UIBlocks/Footer/MultiColumnFooter.published';

// Problem
import StackedPainBulletsPublished from '@/modules/UIBlocks/Problem/StackedPainBullets.published';
// V3 ARCHIVED: import EmotionalQuotesPublished from '@/modules/UIBlocks/Problem/EmotionalQuotes.published';
// V3 ARCHIVED: import BeforeImageAfterTextPublished from '@/modules/UIBlocks/Problem/BeforeImageAfterText.published';
// V3 ARCHIVED: import CollapsedCardsPublished from '@/modules/UIBlocks/Problem/CollapsedCards.published';
// V3 ARCHIVED: import PersonaPanelsPublished from '@/modules/UIBlocks/Problem/PersonaPanels.published';

// Results
// V3 ARCHIVED: import OutcomeIconsPublished from '@/modules/UIBlocks/Results/OutcomeIcons.published';
// V3 ARCHIVED: import EmojiOutcomeGridPublished from '@/modules/UIBlocks/Results/EmojiOutcomeGrid.published';
import StackedWinsListPublished from '@/modules/UIBlocks/Results/StackedWinsList.published';
import StatBlocksPublished from '@/modules/UIBlocks/Results/StatBlocks.published';
import ResultsGalleryPublished from '@/modules/UIBlocks/Results/ResultsGallery.published';
// V3 ARCHIVED: import BeforeAfterStatsPublished from '@/modules/UIBlocks/Results/BeforeAfterStats.published';
// V3 ARCHIVED: import PersonaResultPanelsPublished from '@/modules/UIBlocks/Results/PersonaResultPanels.published';
// V3 ARCHIVED: import QuoteWithMetricPublished from '@/modules/UIBlocks/Results/QuoteWithMetric.published';

// Features
import IconGridPublished from '@/modules/UIBlocks/Features/IconGrid.published';
import CarouselPublished from '@/modules/UIBlocks/Features/Carousel.published';
// V3 ARCHIVED: import MiniCardsPublished from '@/modules/UIBlocks/Features/MiniCards.published';
import SplitAlternatingPublished from '@/modules/UIBlocks/Features/SplitAlternating.published';
// V3 ARCHIVED: import FeatureTestimonialPublished from '@/modules/UIBlocks/Features/FeatureTestimonial.published';
import MetricTilesPublished from '@/modules/UIBlocks/Features/MetricTiles.published';

// HowItWorks
import AccordionStepsPublished from '@/modules/UIBlocks/HowItWorks/AccordionSteps.published';
import ThreeStepHorizontalPublished from '@/modules/UIBlocks/HowItWorks/ThreeStepHorizontal.published';
// V3 ARCHIVED: import IconCircleStepsPublished from '@/modules/UIBlocks/HowItWorks/IconCircleSteps.published';
import VerticalTimelinePublished from '@/modules/UIBlocks/HowItWorks/VerticalTimeline.published';
// V3 ARCHIVED: import ZigzagImageStepsPublished from '@/modules/UIBlocks/HowItWorks/ZigzagImageSteps.published';

// FounderNote
// ARCHIVED: import FounderCardWithQuotePublished from '@/modules/UIBlocks/FounderNote/FounderCardWithQuote.published';
// ARCHIVED: import FoundersBeliefStackPublished from '@/modules/UIBlocks/FounderNote/FoundersBeliefStack.published';
import LetterStyleBlockPublished from '@/modules/UIBlocks/FounderNote/LetterStyleBlock.published';
// V3 ARCHIVED: import SideBySidePhotoStoryPublished from '@/modules/UIBlocks/FounderNote/SideBySidePhotoStory.published';
// V3 ARCHIVED: import StoryBlockWithPullquotePublished from '@/modules/UIBlocks/FounderNote/StoryBlockWithPullquote.published';
// ARCHIVED: import TimelineToTodayPublished from '@/modules/UIBlocks/FounderNote/TimelineToToday.published';
// V3 ARCHIVED: import VideoNoteWithTranscriptPublished from '@/modules/UIBlocks/FounderNote/VideoNoteWithTranscript.published';
// ARCHIVED: import MissionQuoteOverlayPublished from '@/modules/UIBlocks/FounderNote/MissionQuoteOverlay.published';

// FAQ
import AccordionFAQPublished from '@/modules/UIBlocks/FAQ/AccordionFAQ.published';
import TwoColumnFAQPublished from '@/modules/UIBlocks/FAQ/TwoColumnFAQ.published';
import InlineQnAListPublished from '@/modules/UIBlocks/FAQ/InlineQnAList.published';
// V3 ARCHIVED: import QuoteStyleAnswersPublished from '@/modules/UIBlocks/FAQ/QuoteStyleAnswers.published';
// V3 ARCHIVED: import TestimonialFAQsPublished from '@/modules/UIBlocks/FAQ/TestimonialFAQs.published';
import SegmentedFAQTabsPublished from '@/modules/UIBlocks/FAQ/SegmentedFAQTabs.published';
// V3 ARCHIVED: import ChatBubbleFAQPublished from '@/modules/UIBlocks/FAQ/ChatBubbleFAQ.published';

// BeforeAfter
import SideBySideBlockPublished from '@/modules/UIBlocks/BeforeAfter/SideBySideBlock.published';
import SplitCardPublished from '@/modules/UIBlocks/BeforeAfter/SplitCard.published';
import StackedTextVisualPublished from '@/modules/UIBlocks/BeforeAfter/StackedTextVisual.published';
// V3 ARCHIVED: import TextListTransformationPublished from '@/modules/UIBlocks/BeforeAfter/TextListTransformation.published';

// Objection
// V3 ARCHIVED: import ObjectionAccordionPublished from '@/modules/UIBlocks/ObjectionHandle/ObjectionAccordion.published';
import VisualObjectionTilesPublished from '@/modules/UIBlocks/ObjectionHandle/VisualObjectionTiles.published';
// V3 ARCHIVED: import SkepticToBelieverStepsPublished from '@/modules/UIBlocks/ObjectionHandle/SkepticToBelieverSteps.published';
import MythVsRealityGridPublished from '@/modules/UIBlocks/ObjectionHandle/MythVsRealityGrid.published';
// V3 ARCHIVED: import ProblemToReframeBlocksPublished from '@/modules/UIBlocks/ObjectionHandle/ProblemToReframeBlocks.published';
// V3 ARCHIVED: import QuoteBackedAnswersPublished from '@/modules/UIBlocks/ObjectionHandle/QuoteBackedAnswers.published';
// V3 ARCHIVED: import BoldGuaranteePanelPublished from '@/modules/UIBlocks/ObjectionHandle/BoldGuaranteePanel.published';

// Pricing
import TierCardsPublished from '@/modules/UIBlocks/Pricing/TierCards.published';
import ToggleableMonthlyYearlyPublished from '@/modules/UIBlocks/Pricing/ToggleableMonthlyYearly.published';
import CallToQuotePlanPublished from '@/modules/UIBlocks/Pricing/CallToQuotePlan.published';
// V3 ARCHIVED: import CardWithTestimonialPublished from '@/modules/UIBlocks/Pricing/CardWithTestimonial.published';
// V3 ARCHIVED: import MiniStackedCardsPublished from '@/modules/UIBlocks/Pricing/MiniStackedCards.published';
// V3 ARCHIVED: import SegmentBasedPricingPublished from '@/modules/UIBlocks/Pricing/SegmentBasedPricing.published';

// SocialProof
import LogoWallPublished from '@/modules/UIBlocks/SocialProof/LogoWall.published';
// V3 ARCHIVED: import SocialProofStripPublished from '@/modules/UIBlocks/SocialProof/SocialProofStrip.published';
// V3 ARCHIVED: import MediaMentionsPublished from '@/modules/UIBlocks/SocialProof/MediaMentions.published';
// V3 ARCHIVED: import UserCountBarPublished from '@/modules/UIBlocks/SocialProof/UserCountBar.published';

// Testimonial
import QuoteGridPublished from '@/modules/UIBlocks/Testimonials/QuoteGrid.published';
// V3 ARCHIVED: import AvatarCarouselPublished from '@/modules/UIBlocks/Testimonials/AvatarCarousel.published';
// V3 ARCHIVED: import RatingCardsPublished from '@/modules/UIBlocks/Testimonials/RatingCards.published';
import PullQuoteStackPublished from '@/modules/UIBlocks/Testimonials/PullQuoteStack.published';
import BeforeAfterQuotePublished from '@/modules/UIBlocks/Testimonials/BeforeAfterQuote.published';

// UniqueMechanism
import StackedHighlightsPublished from '@/modules/UIBlocks/UniqueMechanism/StackedHighlights.published';
// V3 ARCHIVED: import AlgorithmExplainerPublished from '@/modules/UIBlocks/UniqueMechanism/AlgorithmExplainer.published';
import ProcessFlowDiagramPublished from '@/modules/UIBlocks/UniqueMechanism/ProcessFlowDiagram.published';
import SecretSauceRevealPublished from '@/modules/UIBlocks/UniqueMechanism/SecretSauceReveal.published';
import TechnicalAdvantagePublished from '@/modules/UIBlocks/UniqueMechanism/TechnicalAdvantage.published';
// V3 ARCHIVED: import SystemArchitecturePublished from '@/modules/UIBlocks/UniqueMechanism/SystemArchitecture.published';
// V3 ARCHIVED: import InnovationTimelinePublished from '@/modules/UIBlocks/UniqueMechanism/InnovationTimeline.published';
import MethodologyBreakdownPublished from '@/modules/UIBlocks/UniqueMechanism/MethodologyBreakdown.published';
import PropertyComparisonMatrixPublished from '@/modules/UIBlocks/UniqueMechanism/PropertyComparisonMatrix.published';

// UseCase
import IndustryUseCaseGridPublished from '@/modules/UIBlocks/UseCases/IndustryUseCaseGrid.published';
// V3 ARCHIVED: import WorkflowDiagramsPublished from '@/modules/UIBlocks/UseCases/WorkflowDiagrams.published';
// V3 ARCHIVED: import InteractiveUseCaseMapPublished from '@/modules/UIBlocks/UseCases/InteractiveUseCaseMap.published';
import PersonaGridPublished from '@/modules/UIBlocks/UseCases/PersonaGrid.published';
// V3 ARCHIVED: import CustomerJourneyFlowPublished from '@/modules/UIBlocks/UseCases/CustomerJourneyFlow.published';
import RoleBasedScenariosPublished from '@/modules/UIBlocks/UseCases/RoleBasedScenarios.published';
// V3 ARCHIVED: import UseCaseCarouselPublished from '@/modules/UIBlocks/UseCases/UseCaseCarousel.published';

// Registry structure - ONLY server-safe published components
const publishedComponentRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    // ARCHIVED: minimalist: MinimalistPublished,
    centerstacked: CenterStackedPublished,
    imagefirst: ImageFirstPublished,
    leftcopyrightimage: LeftCopyRightImagePublished,
    splitscreen: SplitScreenPublished,
  },
  header: {
    // ARCHIVED: centeredlogoheader: CenteredLogoHeaderPublished,
    // ARCHIVED: fullnavheader: FullNavHeaderPublished,
    minimalnavheader: MinimalNavHeaderPublished,
    // ARCHIVED: navwithctaheader: NavWithCTAHeaderPublished,
  },
  // ARCHIVED: miscellaneous section - components moved to archive/uiblocks-extra/Miscellaneous
  // miscellaneous: {
  //   announcement: AnnouncementPublished,
  // },
  primarycta: {
    // V3 ARCHIVED: ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
    centeredheadlinecta: CenteredHeadlineCTAPublished,
    valuestackcta: ValueStackCTAPublished,
    // V3 ARCHIVED: testimonialctacombo: TestimonialCTAComboPublished,
  },
  cta: {
    // V3 ARCHIVED: ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
    centeredheadlinecta: CenteredHeadlineCTAPublished,
    valuestackcta: ValueStackCTAPublished,
    // V3 ARCHIVED: testimonialctacombo: TestimonialCTAComboPublished,
  },
  footer: {
    // ARCHIVED: simplefooter: SimpleFooterPublished,
    contactfooter: ContactFooterPublished,
    // ARCHIVED: linksandsocialfooter: LinksAndSocialFooterPublished,
    // ARCHIVED: multicolumnfooter: MultiColumnFooterPublished,
  },
  problem: {
    stackedpainbullets: StackedPainBulletsPublished,
    // V3 ARCHIVED: emotionalquotes: EmotionalQuotesPublished,
    // V3 ARCHIVED: beforeimageaftertext: BeforeImageAfterTextPublished,
    // V3 ARCHIVED: collapsedcards: CollapsedCardsPublished,
    // V3 ARCHIVED: personapanels: PersonaPanelsPublished,
  },
  results: {
    // V3 ARCHIVED: outcomeicons: OutcomeIconsPublished,
    // V3 ARCHIVED: emojioutcomegrid: EmojiOutcomeGridPublished,
    stackedwinslist: StackedWinsListPublished,
    statblocks: StatBlocksPublished,
    resultsgallery: ResultsGalleryPublished,
    // V3 ARCHIVED: beforeafterstats: BeforeAfterStatsPublished,
    // V3 ARCHIVED: personaresultpanels: PersonaResultPanelsPublished,
    // V3 ARCHIVED: quotewithmetric: QuoteWithMetricPublished,
  },
  features: {
    icongrid: IconGridPublished,
    carousel: CarouselPublished,
    // V3 ARCHIVED: minicards: MiniCardsPublished,
    splitalternating: SplitAlternatingPublished,
    // V3 ARCHIVED: featuretestimonial: FeatureTestimonialPublished,
    metrictiles: MetricTilesPublished,
  },
  howitworks: {
    accordionsteps: AccordionStepsPublished,
    threestephorizontal: ThreeStepHorizontalPublished,
    // V3 ARCHIVED: iconcirclesteps: IconCircleStepsPublished,
    verticaltimeline: VerticalTimelinePublished,
    // V3 ARCHIVED: zigzagimagesteps: ZigzagImageStepsPublished,
  },
  foundernote: {
    // ARCHIVED: foundercardwithquote: FounderCardWithQuotePublished,
    // ARCHIVED: foundersbeliefstack: FoundersBeliefStackPublished,
    letterstyleblock: LetterStyleBlockPublished,
    // ARCHIVED: missionquoteoverlay: MissionQuoteOverlayPublished,
    // V3 ARCHIVED: sidebysidephotostory: SideBySidePhotoStoryPublished,
    // V3 ARCHIVED: storyblockwithpullquote: StoryBlockWithPullquotePublished,
    // ARCHIVED: timelinetotoday: TimelineToTodayPublished,
    // V3 ARCHIVED: "videonotewith transcript": VideoNoteWithTranscriptPublished,
  },
  faq: {
    accordionfaq: AccordionFAQPublished,
    twocolumnfaq: TwoColumnFAQPublished,
    inlineqnalist: InlineQnAListPublished,
    // V3 ARCHIVED: quotestyleanswers: QuoteStyleAnswersPublished,
    // V3 ARCHIVED: testimonialfaqs: TestimonialFAQsPublished,
    segmentedfaqtabs: SegmentedFAQTabsPublished,
    // V3 ARCHIVED: chatbubblefaq: ChatBubbleFAQPublished,
  },
  beforeafter: {
    sidebysideblock: SideBySideBlockPublished,
    splitcard: SplitCardPublished,
    stackedtextvisual: StackedTextVisualPublished,
    // V3 ARCHIVED: textlisttransformation: TextListTransformationPublished,
  },
  objection: {
    // V3 ARCHIVED: objectionaccordion: ObjectionAccordionPublished,
    visualobjectiontiles: VisualObjectionTilesPublished,
    // V3 ARCHIVED: skeptictobelieversteps: SkepticToBelieverStepsPublished,
    mythvsrealitygrid: MythVsRealityGridPublished,
    // V3 ARCHIVED: problemtoreframeblocks: ProblemToReframeBlocksPublished,
    // V3 ARCHIVED: quotebackedanswers: QuoteBackedAnswersPublished,
    // V3 ARCHIVED: boldguaranteepanel: BoldGuaranteePanelPublished,
  },
  pricing: {
    tiercards: TierCardsPublished,
    toggleablemonthlyearly: ToggleableMonthlyYearlyPublished,
    calltoquoteplan: CallToQuotePlanPublished,
    // V3 ARCHIVED: cardwithtestimonial: CardWithTestimonialPublished,
    // V3 ARCHIVED: ministackedcards: MiniStackedCardsPublished,
    // V3 ARCHIVED: segmentbasedpricing: SegmentBasedPricingPublished,
  },
  socialproof: {
    logowall: LogoWallPublished,
    // V3 ARCHIVED: socialproofstrip: SocialProofStripPublished,
    // V3 ARCHIVED: mediamentions: MediaMentionsPublished,
    // V3 ARCHIVED: usercountbar: UserCountBarPublished,
  },
  testimonial: {
    quotegrid: QuoteGridPublished,
    // V3 ARCHIVED: avatarcarousel: AvatarCarouselPublished,
    // V3 ARCHIVED: ratingcards: RatingCardsPublished,
    pullquotestack: PullQuoteStackPublished,
    beforeafterquote: BeforeAfterQuotePublished,
  },
  uniquemechanism: {
    stackedhighlights: StackedHighlightsPublished,
    // V3 ARCHIVED: algorithmexplainer: AlgorithmExplainerPublished,
    processflowdiagram: ProcessFlowDiagramPublished,
    secretsaucereveal: SecretSauceRevealPublished,
    technicaladvantage: TechnicalAdvantagePublished,
    // V3 ARCHIVED: systemarchitecture: SystemArchitecturePublished,
    // V3 ARCHIVED: innovationtimeline: InnovationTimelinePublished,
    methodologybreakdown: MethodologyBreakdownPublished,
    propertycomparisonmatrix: PropertyComparisonMatrixPublished,
  },
  usecase: {
    industryusecasegrid: IndustryUseCaseGridPublished,
    // V3 ARCHIVED: workflowdiagrams: WorkflowDiagramsPublished,
    // V3 ARCHIVED: interactiveusecasemap: InteractiveUseCaseMapPublished,
    personagrid: PersonaGridPublished,
    // V3 ARCHIVED: customerjourneyflow: CustomerJourneyFlowPublished,
    rolebasedscenarios: RoleBasedScenariosPublished,
    // V3 ARCHIVED: usecasecarousel: UseCaseCarouselPublished,
  },
};

// Helper functions (same pattern as editor registry)

/**
 * Extract section type from sectionId
 * @example extractSectionType('hero-123') => 'hero'
 */
export function extractSectionType(sectionId: string): string {
  return sectionId.split('-')[0].toLowerCase();
}

/**
 * Get component from registry by section type and layout name
 * @returns Component or null if not found
 */
export function getComponent(type: string, layout: string): React.ComponentType<any> | null {
  const normalizedType = type.toLowerCase();
  const normalizedLayout = layout.toLowerCase();
  return publishedComponentRegistry[normalizedType]?.[normalizedLayout] ?? null;
}

/**
 * Check if a layout exists for a section type
 */
export function hasLayout(type: string, layout: string): boolean {
  return getComponent(type, layout) !== null;
}

/**
 * Get all available layouts for a section type
 */
export function getAvailableLayouts(type: string): string[] {
  const normalizedType = type.toLowerCase();
  return Object.keys(publishedComponentRegistry[normalizedType] || {});
}
