// src/modules/uiblock/uiblockTags.ts
// UIBlock tag classifications for composition rules and AI selection
// Tags: text-heavy, accordion, image, persona-aware

import type { UIBlockTag } from '@/types/generation';

type UIBlockTagMap = Record<string, UIBlockTag[]>;

/**
 * Tag definitions:
 * - text-heavy: Primarily text-based, minimal/no images
 * - accordion: Uses collapsible/expandable UI pattern
 * - image: Prominently features images or visuals
 * - persona-aware: Designed for multiple personas/audiences
 */

// ===== HEADER =====
const headerTags: UIBlockTagMap = {
  MinimalNavHeader: ['text-heavy'],
  // ARCHIVED: NavWithCTAHeader: ['text-heavy'],
  // ARCHIVED: CenteredLogoHeader: ['image'],
  // ARCHIVED: FullNavHeader: ['text-heavy'],
};

// ===== HERO =====
const heroTags: UIBlockTagMap = {
  leftCopyRightImage: ['image'],
  centerStacked: ['image'],
  splitScreen: ['image'],
  imageFirst: ['image'],
  // ARCHIVED: minimalist: ['text-heavy'],
};

// ===== BEFORE/AFTER =====
const beforeAfterTags: UIBlockTagMap = {
  SideBySideBlocks: ['text-heavy'],
  StackedTextVisual: ['text-heavy'],
  // V3 ARCHIVED: BeforeAfterSlider: ['image'],
  SplitCard: ['text-heavy'],
  // V3 ARCHIVED: TextListTransformation: ['text-heavy'],
  // V3 ARCHIVED: VisualStoryline: ['image'],
  // V3 ARCHIVED: StatComparison: ['text-heavy'],
  // V3 ARCHIVED: PersonaJourney: ['text-heavy', 'persona-aware'],
};

// ===== FEATURES =====
const featuresTags: UIBlockTagMap = {
  IconGrid: ['text-heavy'],
  SplitAlternating: ['image'],
  // V3 ARCHIVED: FeatureTestimonial: ['image'],
  MetricTiles: ['text-heavy'],
  // V3 ARCHIVED: MiniCards: ['text-heavy'],
  Carousel: ['image'],
  // V3 ARCHIVED: Tabbed: ['text-heavy'],
};

// ===== FAQ =====
const faqTags: UIBlockTagMap = {
  AccordionFAQ: ['text-heavy', 'accordion'],
  TwoColumnFAQ: ['text-heavy'],
  InlineQnAList: ['text-heavy'],
  SegmentedFAQTabs: ['text-heavy'],
  // V3 ARCHIVED: QuoteStyleAnswers: ['text-heavy'],
  // V3 ARCHIVED: IconWithAnswers: ['text-heavy'],
  // V3 ARCHIVED: TestimonialFAQs: ['text-heavy'],
  // V3 ARCHIVED: ChatBubbleFAQ: ['text-heavy'],
};

// ===== PRICING =====
const pricingTags: UIBlockTagMap = {
  TierCards: ['text-heavy'],
  ToggleableMonthlyYearly: ['text-heavy'],
  // V3 ARCHIVED: FeatureMatrix: ['text-heavy'],
  // V3 ARCHIVED: SegmentBasedPricing: ['text-heavy', 'persona-aware'],
  // V3 ARCHIVED: SliderPricing: ['text-heavy'],
  CallToQuotePlan: ['text-heavy'],
  // V3 ARCHIVED: CardWithTestimonial: ['text-heavy'],
  // V3 ARCHIVED: MiniStackedCards: ['text-heavy'],
};

// ===== TESTIMONIALS =====
const testimonialsTags: UIBlockTagMap = {
  QuoteGrid: ['text-heavy'],
  VideoTestimonials: ['image'],
  // V3 ARCHIVED: AvatarCarousel: ['image'],
  BeforeAfterQuote: ['text-heavy'],
  // V3 ARCHIVED: SegmentedTestimonials: ['text-heavy', 'persona-aware'],
  // V3 ARCHIVED: RatingCards: ['text-heavy'],
  PullQuoteStack: ['text-heavy'],
  // V3 ARCHIVED: InteractiveTestimonialMap: ['image'],
};

// ===== PROBLEM =====
const problemTags: UIBlockTagMap = {
  StackedPainBullets: ['text-heavy'],
  // V3 ARCHIVED: BeforeImageAfterText: ['image'],
  // V3 ARCHIVED: EmotionalQuotes: ['text-heavy'],
  // V3 ARCHIVED: CollapsedCards: ['text-heavy', 'accordion'],
  // V3 ARCHIVED: SideBySideSplit: ['text-heavy'],
  // V3 ARCHIVED: PersonaPanels: ['text-heavy', 'persona-aware'],
};

// ===== RESULTS =====
const resultsTags: UIBlockTagMap = {
  StatBlocks: ['text-heavy'],
  // V3 ARCHIVED: BeforeAfterStats: ['text-heavy'],
  // V3 ARCHIVED: QuoteWithMetric: ['text-heavy'],
  // V3 ARCHIVED: EmojiOutcomeGrid: ['text-heavy'],
  // V3 ARCHIVED: TimelineResults: ['text-heavy'],
  // V3 ARCHIVED: OutcomeIcons: ['text-heavy'],
  StackedWinsList: ['text-heavy'],
  // V3 ARCHIVED: PersonaResultPanels: ['text-heavy', 'persona-aware'],
  ResultsGallery: ['image'],
};

// ===== HOW IT WORKS =====
const howItWorksTags: UIBlockTagMap = {
  ThreeStepHorizontal: ['text-heavy'],
  VerticalTimeline: ['text-heavy'],
  // V3 ARCHIVED: IconCircleSteps: ['text-heavy'],
  AccordionSteps: ['text-heavy', 'accordion'],
  VideoWalkthrough: ['image'],
  // V3 ARCHIVED: ZigzagImageSteps: ['image'],
  // V3 ARCHIVED: AnimatedProcessLine: ['text-heavy'],
};

// ===== USE CASES =====
const useCasesTags: UIBlockTagMap = {
  // V3 ARCHIVED: CustomerJourneyFlow: ['text-heavy'],
  IndustryUseCaseGrid: ['text-heavy'],
  // V3 ARCHIVED: InteractiveUseCaseMap: ['image'],
  PersonaGrid: ['text-heavy', 'persona-aware'],
  RoleBasedScenarios: ['text-heavy', 'persona-aware'],
  // V3 ARCHIVED: UseCaseCarousel: ['image'],
  // V3 ARCHIVED: WorkflowDiagrams: ['image'],
};

// ===== UNIQUE MECHANISM =====
const uniqueMechanismTags: UIBlockTagMap = {
  // V3 ARCHIVED: AlgorithmExplainer: ['text-heavy'],
  // V3 ARCHIVED: InnovationTimeline: ['text-heavy'],
  MethodologyBreakdown: ['text-heavy'],
  ProcessFlowDiagram: ['image'],
  PropertyComparisonMatrix: ['text-heavy'],
  SecretSauceReveal: ['text-heavy'],
  StackedHighlights: ['text-heavy'],
  // V3 ARCHIVED: SystemArchitecture: ['image'],
  TechnicalAdvantage: ['text-heavy'],
};

// ===== SOCIAL PROOF =====
const socialProofTags: UIBlockTagMap = {
  LogoWall: ['image'],
  // V3 ARCHIVED: MediaMentions: ['image'],
  // V3 ARCHIVED: UserCountBar: ['text-heavy'],
  // V3 ARCHIVED: IndustryBadgeLine: ['image'],
  // V3 ARCHIVED: MapHeatSpots: ['image'],
  // V3 ARCHIVED: StackedStats: ['text-heavy'],
  // V3 ARCHIVED: StripWithReviews: ['text-heavy'],
  // V3 ARCHIVED: SocialProofStrip: ['text-heavy'],
};

// ===== OBJECTION HANDLING =====
const objectionHandlingTags: UIBlockTagMap = {
  // V3 ARCHIVED: ObjectionAccordion: ['text-heavy', 'accordion'],
  MythVsRealityGrid: ['text-heavy'],
  // V3 ARCHIVED: QuoteBackedAnswers: ['text-heavy'],
  VisualObjectionTiles: ['image'],
  // V3 ARCHIVED: ProblemToReframeBlocks: ['text-heavy'],
  // V3 ARCHIVED: SkepticToBelieverSteps: ['text-heavy'],
  // V3 ARCHIVED: BoldGuaranteePanel: ['text-heavy'],
};

// ===== FOUNDER NOTE =====
const founderNoteTags: UIBlockTagMap = {
  // ARCHIVED: FounderCardWithQuote: ['image'],
  LetterStyleBlock: ['text-heavy'],
  // V3 ARCHIVED: VideoNoteWithTranscript: ['image'],
  // ARCHIVED: MissionQuoteOverlay: ['image'],
  // ARCHIVED: TimelineToToday: ['text-heavy'],
  // V3 ARCHIVED: SideBySidePhotoStory: ['image'],
  // V3 ARCHIVED: StoryBlockWithPullquote: ['text-heavy'],
  // ARCHIVED: FoundersBeliefStack: ['text-heavy'],
};

// ===== CTA =====
const ctaTags: UIBlockTagMap = {
  CenteredHeadlineCTA: ['text-heavy'],
  // V3 ARCHIVED: CTAWithBadgeRow: ['text-heavy'],
  VisualCTAWithMockup: ['image'],
  // V3 ARCHIVED: SideBySideCTA: ['text-heavy'],
  // V3 ARCHIVED: CountdownLimitedCTA: ['text-heavy'],
  // V3 ARCHIVED: CTAWithFormField: ['text-heavy'],
  ValueStackCTA: ['text-heavy'],
  // V3 ARCHIVED: TestimonialCTACombo: ['text-heavy'],
};

// ===== FOOTER =====
const footerTags: UIBlockTagMap = {
  // ARCHIVED: SimpleFooter: ['text-heavy'],
  // ARCHIVED: LinksAndSocialFooter: ['text-heavy'],
  // ARCHIVED: MultiColumnFooter: ['text-heavy'],
  ContactFooter: ['text-heavy'],
};

/**
 * Complete UIBlock tags map
 * Keys are layout names, values are arrays of tags
 */
export const uiblockTags: UIBlockTagMap = {
  ...headerTags,
  ...heroTags,
  ...beforeAfterTags,
  ...featuresTags,
  ...faqTags,
  ...pricingTags,
  ...testimonialsTags,
  ...problemTags,
  ...resultsTags,
  ...howItWorksTags,
  ...useCasesTags,
  ...uniqueMechanismTags,
  ...socialProofTags,
  ...objectionHandlingTags,
  ...founderNoteTags,
  ...ctaTags,
  ...footerTags,
};

/**
 * Get tags for a specific UIBlock layout
 */
export function getTags(layoutName: string): UIBlockTag[] {
  return uiblockTags[layoutName] || [];
}

/**
 * Check if a layout has a specific tag
 */
export function hasTag(layoutName: string, tag: UIBlockTag): boolean {
  return getTags(layoutName).includes(tag);
}

/**
 * Check if layout is text-heavy
 */
export function isTextHeavy(layoutName: string): boolean {
  return hasTag(layoutName, 'text-heavy');
}

/**
 * Check if layout uses accordion pattern
 */
export function isAccordion(layoutName: string): boolean {
  return hasTag(layoutName, 'accordion');
}

/**
 * Check if layout is image-based
 */
export function isImageBased(layoutName: string): boolean {
  return hasTag(layoutName, 'image');
}

/**
 * Check if layout is persona-aware (for multiple audiences)
 */
export function isPersonaAware(layoutName: string): boolean {
  return hasTag(layoutName, 'persona-aware');
}

/**
 * Get all layouts with a specific tag
 */
export function getLayoutsWithTag(tag: UIBlockTag): string[] {
  return Object.entries(uiblockTags)
    .filter(([_, tags]) => tags.includes(tag))
    .map(([layout]) => layout);
}

/**
 * Format layout with tags for prompt
 * e.g., "IconGrid [text-heavy]"
 */
export function formatLayoutWithTags(layoutName: string): string {
  const tags = getTags(layoutName);
  if (tags.length === 0) return layoutName;
  return `${layoutName} [${tags.join(', ')}]`;
}

// ============================================================
// UIBLOCK ORIENTATIONS (for rhythm-based selection in V3)
// ============================================================

export type UIBlockOrientation = 'horizontal' | 'vertical' | 'grid' | 'stack';

/**
 * Orientation metadata for rhythm-based UIBlock selection
 * Used to alternate layouts for visual variety
 */
export const uiblockOrientations: Record<string, UIBlockOrientation> = {
  // BeforeAfter
  SideBySideBlocks: 'horizontal',
  StackedTextVisual: 'vertical',
  SplitCard: 'horizontal',

  // HowItWorks
  ThreeStepHorizontal: 'horizontal',
  VerticalTimeline: 'vertical',
  AccordionSteps: 'vertical',
  VideoWalkthrough: 'stack', // Video takes priority, neutral rhythm

  // Results
  StatBlocks: 'horizontal',
  StackedWinsList: 'vertical',
  ResultsGallery: 'grid',

  // UseCases
  IndustryUseCaseGrid: 'grid',
  PersonaGrid: 'horizontal',
  RoleBasedScenarios: 'vertical',

  // UniqueMechanism
  SecretSauceReveal: 'horizontal',
  StackedHighlights: 'vertical',
  TechnicalAdvantage: 'horizontal',
  MethodologyBreakdown: 'horizontal',
  PropertyComparisonMatrix: 'vertical',
  ProcessFlowDiagram: 'horizontal',

  // Features
  IconGrid: 'grid',
  MetricTiles: 'grid',
  Carousel: 'horizontal',
  SplitAlternating: 'vertical',

  // Testimonials
  QuoteGrid: 'grid',
  PullQuoteStack: 'vertical',
  // V3 ARCHIVED: AvatarCarousel: 'horizontal',
  VideoTestimonials: 'stack',
  BeforeAfterQuote: 'vertical',

  // FAQ
  InlineQnAList: 'vertical',
  TwoColumnFAQ: 'horizontal',
  AccordionFAQ: 'vertical',
  SegmentedFAQTabs: 'horizontal',

  // Pricing
  TierCards: 'horizontal',
  ToggleableMonthlyYearly: 'horizontal',
  // V3 ARCHIVED: SliderPricing: 'vertical',
  CallToQuotePlan: 'stack',

  // ObjectionHandle
  VisualObjectionTiles: 'grid',
  MythVsRealityGrid: 'horizontal',

  // Problem
  StackedPainBullets: 'vertical',
  // V3 ARCHIVED: CollapsedCards: 'vertical',
  // V3 ARCHIVED: PersonaPanels: 'horizontal',

  // CTA
  CenteredHeadlineCTA: 'stack',
  VisualCTAWithMockup: 'horizontal',
  ValueStackCTA: 'vertical',

  // Hero
  leftCopyRightImage: 'horizontal',
  centerStacked: 'stack',
  splitScreen: 'horizontal',
  imageFirst: 'vertical',
};

/**
 * Get orientation for a UIBlock layout
 * Returns null if not defined (defaults to neutral in selection logic)
 */
export function getOrientation(layoutName: string): UIBlockOrientation | null {
  return uiblockOrientations[layoutName] || null;
}

/**
 * Check if layout is horizontal
 */
export function isHorizontal(layoutName: string): boolean {
  return getOrientation(layoutName) === 'horizontal';
}

/**
 * Check if layout is vertical
 */
export function isVertical(layoutName: string): boolean {
  return getOrientation(layoutName) === 'vertical';
}

/**
 * Get opposite orientation for rhythm
 */
export function getOppositeOrientation(
  orientation: UIBlockOrientation | null
): UIBlockOrientation {
  if (orientation === 'horizontal') return 'vertical';
  if (orientation === 'vertical') return 'horizontal';
  // For grid/stack/null, default to horizontal
  return 'horizontal';
}
