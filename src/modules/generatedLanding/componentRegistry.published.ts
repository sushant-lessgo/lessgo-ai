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
import MinimalistPublished from '@/modules/UIBlocks/Hero/Minimalist.published';
import CenterStackedPublished from '@/modules/UIBlocks/Hero/centerStacked.published';
import ImageFirstPublished from '@/modules/UIBlocks/Hero/imageFirst.published';
import LeftCopyRightImagePublished from '@/modules/UIBlocks/Hero/leftCopyRightImage.published';
import SplitScreenPublished from '@/modules/UIBlocks/Hero/splitScreen.published';

// Header
import CenteredLogoHeaderPublished from '@/modules/UIBlocks/Header/CenteredLogoHeader.published';
import FullNavHeaderPublished from '@/modules/UIBlocks/Header/FullNavHeader.published';
import MinimalNavHeaderPublished from '@/modules/UIBlocks/Header/MinimalNavHeader.published';
import NavWithCTAHeaderPublished from '@/modules/UIBlocks/Header/NavWithCTAHeader.published';

// Miscellaneous
import AnnouncementPublished from '@/modules/UIBlocks/Miscellaneous/Announcement.published';

// Primary CTA
import CTAWithFormFieldPublished from '@/modules/UIBlocks/PrimaryCTA/CTAWithFormField.published';
import VisualCTAWithMockupPublished from '@/modules/UIBlocks/PrimaryCTA/VisualCTAWithMockup.published';
import CenteredHeadlineCTAPublished from '@/modules/UIBlocks/PrimaryCTA/CenteredHeadlineCTA.published';
import ValueStackCTAPublished from '@/modules/UIBlocks/PrimaryCTA/ValueStackCTA.published';
import TestimonialCTAComboPublished from '@/modules/UIBlocks/PrimaryCTA/TestimonialCTACombo.published';

// Footer
import SimpleFooterPublished from '@/modules/UIBlocks/Footer/SimpleFooter.published';
import ContactFooterPublished from '@/modules/UIBlocks/Footer/ContactFooter.published';
import LinksAndSocialFooterPublished from '@/modules/UIBlocks/Footer/LinksAndSocialFooter.published';
import MultiColumnFooterPublished from '@/modules/UIBlocks/Footer/MultiColumnFooter.published';

// Problem
import StackedPainBulletsPublished from '@/modules/UIBlocks/Problem/StackedPainBullets.published';
import EmotionalQuotesPublished from '@/modules/UIBlocks/Problem/EmotionalQuotes.published';
import BeforeImageAfterTextPublished from '@/modules/UIBlocks/Problem/BeforeImageAfterText.published';
import CollapsedCardsPublished from '@/modules/UIBlocks/Problem/CollapsedCards.published';
import PersonaPanelsPublished from '@/modules/UIBlocks/Problem/PersonaPanels.published';

// Results
import OutcomeIconsPublished from '@/modules/UIBlocks/Results/OutcomeIcons.published';
import EmojiOutcomeGridPublished from '@/modules/UIBlocks/Results/EmojiOutcomeGrid.published';
import StackedWinsListPublished from '@/modules/UIBlocks/Results/StackedWinsList.published';
import StatBlocksPublished from '@/modules/UIBlocks/Results/StatBlocks.published';
import ResultsGalleryPublished from '@/modules/UIBlocks/Results/ResultsGallery.published';
import BeforeAfterStatsPublished from '@/modules/UIBlocks/Results/BeforeAfterStats.published';
import PersonaResultPanelsPublished from '@/modules/UIBlocks/Results/PersonaResultPanels.published';
import QuoteWithMetricPublished from '@/modules/UIBlocks/Results/QuoteWithMetric.published';

// Features
import IconGridPublished from '@/modules/UIBlocks/Features/IconGrid.published';
import CarouselPublished from '@/modules/UIBlocks/Features/Carousel.published';
import MiniCardsPublished from '@/modules/UIBlocks/Features/MiniCards.published';
import SplitAlternatingPublished from '@/modules/UIBlocks/Features/SplitAlternating.published';
import FeatureTestimonialPublished from '@/modules/UIBlocks/Features/FeatureTestimonial.published';
import MetricTilesPublished from '@/modules/UIBlocks/Features/MetricTiles.published';

// HowItWorks
import AccordionStepsPublished from '@/modules/UIBlocks/HowItWorks/AccordionSteps.published';
import ThreeStepHorizontalPublished from '@/modules/UIBlocks/HowItWorks/ThreeStepHorizontal.published';
import IconCircleStepsPublished from '@/modules/UIBlocks/HowItWorks/IconCircleSteps.published';
import VerticalTimelinePublished from '@/modules/UIBlocks/HowItWorks/VerticalTimeline.published';
import ZigzagImageStepsPublished from '@/modules/UIBlocks/HowItWorks/ZigzagImageSteps.published';

// FounderNote
import FounderCardWithQuotePublished from '@/modules/UIBlocks/FounderNote/FounderCardWithQuote.published';
import FoundersBeliefStackPublished from '@/modules/UIBlocks/FounderNote/FoundersBeliefStack.published';
import LetterStyleBlockPublished from '@/modules/UIBlocks/FounderNote/LetterStyleBlock.published';
import SideBySidePhotoStoryPublished from '@/modules/UIBlocks/FounderNote/SideBySidePhotoStory.published';
import StoryBlockWithPullquotePublished from '@/modules/UIBlocks/FounderNote/StoryBlockWithPullquote.published';
import TimelineToTodayPublished from '@/modules/UIBlocks/FounderNote/TimelineToToday.published';
import VideoNoteWithTranscriptPublished from '@/modules/UIBlocks/FounderNote/VideoNoteWithTranscript.published';
import MissionQuoteOverlayPublished from '@/modules/UIBlocks/FounderNote/MissionQuoteOverlay.published';

// FAQ
import AccordionFAQPublished from '@/modules/UIBlocks/FAQ/AccordionFAQ.published';
import TwoColumnFAQPublished from '@/modules/UIBlocks/FAQ/TwoColumnFAQ.published';
import InlineQnAListPublished from '@/modules/UIBlocks/FAQ/InlineQnAList.published';
import QuoteStyleAnswersPublished from '@/modules/UIBlocks/FAQ/QuoteStyleAnswers.published';
import TestimonialFAQsPublished from '@/modules/UIBlocks/FAQ/TestimonialFAQs.published';
import SegmentedFAQTabsPublished from '@/modules/UIBlocks/FAQ/SegmentedFAQTabs.published';
import ChatBubbleFAQPublished from '@/modules/UIBlocks/FAQ/ChatBubbleFAQ.published';

// BeforeAfter
import SideBySideBlockPublished from '@/modules/UIBlocks/BeforeAfter/SideBySideBlock.published';
import SplitCardPublished from '@/modules/UIBlocks/BeforeAfter/SplitCard.published';
import StackedTextVisualPublished from '@/modules/UIBlocks/BeforeAfter/StackedTextVisual.published';
import TextListTransformationPublished from '@/modules/UIBlocks/BeforeAfter/TextListTransformation.published';

// Objection
import ObjectionAccordionPublished from '@/modules/UIBlocks/Objection/ObjectionAccordion.published';
import VisualObjectionTilesPublished from '@/modules/UIBlocks/Objection/VisualObjectionTiles.published';
import SkepticToBelieverStepsPublished from '@/modules/UIBlocks/Objection/SkepticToBelieverSteps.published';
import MythVsRealityGridPublished from '@/modules/UIBlocks/Objection/MythVsRealityGrid.published';
import ProblemToReframeBlocksPublished from '@/modules/UIBlocks/Objection/ProblemToReframeBlocks.published';
import QuoteBackedAnswersPublished from '@/modules/UIBlocks/Objection/QuoteBackedAnswers.published';
import BoldGuaranteePanelPublished from '@/modules/UIBlocks/Objection/BoldGuaranteePanel.published';

// Pricing
import TierCardsPublished from '@/modules/UIBlocks/Pricing/TierCards.published';
import CardWithTestimonialPublished from '@/modules/UIBlocks/Pricing/CardWithTestimonial.published';
import MiniStackedCardsPublished from '@/modules/UIBlocks/Pricing/MiniStackedCards.published';
import SegmentBasedPricingPublished from '@/modules/UIBlocks/Pricing/SegmentBasedPricing.published';

// SocialProof
import LogoWallPublished from '@/modules/UIBlocks/SocialProof/LogoWall.published';
import SocialProofStripPublished from '@/modules/UIBlocks/SocialProof/SocialProofStrip.published';
import MediaMentionsPublished from '@/modules/UIBlocks/SocialProof/MediaMentions.published';
import UserCountBarPublished from '@/modules/UIBlocks/SocialProof/UserCountBar.published';

// Testimonial
import QuoteGridPublished from '@/modules/UIBlocks/Testimonial/QuoteGrid.published';
import AvatarCarouselPublished from '@/modules/UIBlocks/Testimonial/AvatarCarousel.published';
import RatingCardsPublished from '@/modules/UIBlocks/Testimonial/RatingCards.published';

// Registry structure - ONLY server-safe published components
const publishedComponentRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    minimalist: MinimalistPublished,
    centerstacked: CenterStackedPublished,
    imagefirst: ImageFirstPublished,
    leftcopyrightimage: LeftCopyRightImagePublished,
    splitscreen: SplitScreenPublished,
  },
  header: {
    centeredlogoheader: CenteredLogoHeaderPublished,
    fullnavheader: FullNavHeaderPublished,
    minimalnavheader: MinimalNavHeaderPublished,
    navwithctaheader: NavWithCTAHeaderPublished,
  },
  miscellaneous: {
    announcement: AnnouncementPublished,
  },
  primarycta: {
    ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
    centeredheadlinecta: CenteredHeadlineCTAPublished,
    valuestackcta: ValueStackCTAPublished,
    testimonialctacombo: TestimonialCTAComboPublished,
  },
  cta: {
    ctawithformfield: CTAWithFormFieldPublished,
    visualctawithmockup: VisualCTAWithMockupPublished,
    centeredheadlinecta: CenteredHeadlineCTAPublished,
    valuestackcta: ValueStackCTAPublished,
    testimonialctacombo: TestimonialCTAComboPublished,
  },
  footer: {
    simplefooter: SimpleFooterPublished,
    contactfooter: ContactFooterPublished,
    linksandsocialfooter: LinksAndSocialFooterPublished,
    multicolumnfooter: MultiColumnFooterPublished,
  },
  problem: {
    stackedpainbullets: StackedPainBulletsPublished,
    emotionalquotes: EmotionalQuotesPublished,
    beforeimageaftertext: BeforeImageAfterTextPublished,
    collapsedcards: CollapsedCardsPublished,
    personapanels: PersonaPanelsPublished,
  },
  results: {
    outcomeicons: OutcomeIconsPublished,
    emojioutcomegrid: EmojiOutcomeGridPublished,
    stackedwinslist: StackedWinsListPublished,
    statblocks: StatBlocksPublished,
    resultsgallery: ResultsGalleryPublished,
    beforeafterstats: BeforeAfterStatsPublished,
    personaresultpanels: PersonaResultPanelsPublished,
    quotewithmetric: QuoteWithMetricPublished,
  },
  features: {
    icongrid: IconGridPublished,
    carousel: CarouselPublished,
    minicards: MiniCardsPublished,
    splitalternating: SplitAlternatingPublished,
    featuretestimonial: FeatureTestimonialPublished,
    metrictiles: MetricTilesPublished,
  },
  howitworks: {
    accordionsteps: AccordionStepsPublished,
    threestephorizontal: ThreeStepHorizontalPublished,
    iconcirclesteps: IconCircleStepsPublished,
    verticaltimeline: VerticalTimelinePublished,
    zigzagimagesteps: ZigzagImageStepsPublished,
  },
  foundernote: {
    foundercardwithquote: FounderCardWithQuotePublished,
    foundersbeliefstack: FoundersBeliefStackPublished,
    letterstyleblock: LetterStyleBlockPublished,
    missionquoteoverlay: MissionQuoteOverlayPublished,
    sidebysidephotostory: SideBySidePhotoStoryPublished,
    storyblockwithpullquote: StoryBlockWithPullquotePublished,
    timelinetotoday: TimelineToTodayPublished,
    "videonotewith transcript": VideoNoteWithTranscriptPublished,
  },
  faq: {
    accordionfaq: AccordionFAQPublished,
    twocolumnfaq: TwoColumnFAQPublished,
    inlineqnalist: InlineQnAListPublished,
    quotestyleanswers: QuoteStyleAnswersPublished,
    testimonialfaqs: TestimonialFAQsPublished,
    segmentedfaqtabs: SegmentedFAQTabsPublished,
    chatbubblefaq: ChatBubbleFAQPublished,
  },
  beforeafter: {
    sidebysideblock: SideBySideBlockPublished,
    splitcard: SplitCardPublished,
    stackedtextvisual: StackedTextVisualPublished,
    textlisttransformation: TextListTransformationPublished,
  },
  objection: {
    objectionaccordion: ObjectionAccordionPublished,
    visualobjectiontiles: VisualObjectionTilesPublished,
    skeptictobelieversteps: SkepticToBelieverStepsPublished,
    mythvsrealitygrid: MythVsRealityGridPublished,
    problemtoreframeblocks: ProblemToReframeBlocksPublished,
    quotebackedanswers: QuoteBackedAnswersPublished,
    boldguaranteepanel: BoldGuaranteePanelPublished,
  },
  pricing: {
    tiercards: TierCardsPublished,
    cardwithtestimonial: CardWithTestimonialPublished,
    ministackedcards: MiniStackedCardsPublished,
    segmentbasedpricing: SegmentBasedPricingPublished,
  },
  socialproof: {
    logowall: LogoWallPublished,
    socialproofstrip: SocialProofStripPublished,
    mediamentions: MediaMentionsPublished,
    usercountbar: UserCountBarPublished,
  },
  testimonial: {
    quotegrid: QuoteGridPublished,
    avatarcarousel: AvatarCarouselPublished,
    ratingcards: RatingCardsPublished,
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
