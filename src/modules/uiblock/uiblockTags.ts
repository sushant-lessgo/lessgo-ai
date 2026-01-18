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
  NavWithCTAHeader: ['text-heavy'],
  CenteredLogoHeader: ['image'],
  FullNavHeader: ['text-heavy'],
};

// ===== HERO =====
const heroTags: UIBlockTagMap = {
  leftCopyRightImage: ['image'],
  centerStacked: ['image'],
  splitScreen: ['image'],
  imageFirst: ['image'],
  minimalist: ['text-heavy'],
};

// ===== BEFORE/AFTER =====
const beforeAfterTags: UIBlockTagMap = {
  SideBySideBlocks: ['text-heavy'],
  StackedTextVisual: ['text-heavy'],
  BeforeAfterSlider: ['image'],
  SplitCard: ['text-heavy'],
  TextListTransformation: ['text-heavy'],
  VisualStoryline: ['image'],
  StatComparison: ['text-heavy'],
  PersonaJourney: ['text-heavy', 'persona-aware'],
};

// ===== FEATURES =====
const featuresTags: UIBlockTagMap = {
  IconGrid: ['text-heavy'],
  SplitAlternating: ['image'],
  FeatureTestimonial: ['image'],
  MetricTiles: ['text-heavy'],
  MiniCards: ['text-heavy'],
  Carousel: ['image'],
};

// ===== FAQ =====
const faqTags: UIBlockTagMap = {
  AccordionFAQ: ['text-heavy', 'accordion'],
  TwoColumnFAQ: ['text-heavy'],
  InlineQnAList: ['text-heavy'],
  SegmentedFAQTabs: ['text-heavy'],
  QuoteStyleAnswers: ['text-heavy'],
  IconWithAnswers: ['text-heavy'],
  TestimonialFAQs: ['text-heavy'],
  ChatBubbleFAQ: ['text-heavy'],
};

// ===== PRICING =====
const pricingTags: UIBlockTagMap = {
  TierCards: ['text-heavy'],
  ToggleableMonthlyYearly: ['text-heavy'],
  FeatureMatrix: ['text-heavy'],
  SegmentBasedPricing: ['text-heavy', 'persona-aware'],
  SliderPricing: ['text-heavy'],
  CallToQuotePlan: ['text-heavy'],
  CardWithTestimonial: ['text-heavy'],
  MiniStackedCards: ['text-heavy'],
};

// ===== TESTIMONIALS =====
const testimonialsTags: UIBlockTagMap = {
  QuoteGrid: ['text-heavy'],
  VideoTestimonials: ['image'],
  AvatarCarousel: ['image'],
  BeforeAfterQuote: ['text-heavy'],
  SegmentedTestimonials: ['text-heavy', 'persona-aware'],
  RatingCards: ['text-heavy'],
  PullQuoteStack: ['text-heavy'],
  InteractiveTestimonialMap: ['image'],
};

// ===== PROBLEM =====
const problemTags: UIBlockTagMap = {
  StackedPainBullets: ['text-heavy'],
  BeforeImageAfterText: ['image'],
  EmotionalQuotes: ['text-heavy'],
  CollapsedCards: ['text-heavy', 'accordion'],
  PersonaPanels: ['text-heavy', 'persona-aware'],
};

// ===== RESULTS =====
const resultsTags: UIBlockTagMap = {
  StatBlocks: ['text-heavy'],
  BeforeAfterStats: ['text-heavy'],
  QuoteWithMetric: ['text-heavy'],
  EmojiOutcomeGrid: ['text-heavy'],
  TimelineResults: ['text-heavy'],
  OutcomeIcons: ['text-heavy'],
  StackedWinsList: ['text-heavy'],
  PersonaResultPanels: ['text-heavy', 'persona-aware'],
  ResultsGallery: ['image'],
};

// ===== HOW IT WORKS =====
const howItWorksTags: UIBlockTagMap = {
  ThreeStepHorizontal: ['text-heavy'],
  VerticalTimeline: ['text-heavy'],
  IconCircleSteps: ['text-heavy'],
  AccordionSteps: ['text-heavy', 'accordion'],
  VideoWalkthrough: ['image'],
  ZigzagImageSteps: ['image'],
  AnimatedProcessLine: ['text-heavy'],
};

// ===== USE CASES =====
const useCasesTags: UIBlockTagMap = {
  CustomerJourneyFlow: ['text-heavy'],
  IndustryUseCaseGrid: ['text-heavy'],
  InteractiveUseCaseMap: ['image'],
  PersonaGrid: ['text-heavy', 'persona-aware'],
  RoleBasedScenarios: ['text-heavy', 'persona-aware'],
  UseCaseCarousel: ['image'],
  WorkflowDiagrams: ['image'],
};

// ===== UNIQUE MECHANISM =====
const uniqueMechanismTags: UIBlockTagMap = {
  AlgorithmExplainer: ['text-heavy'],
  InnovationTimeline: ['text-heavy'],
  MethodologyBreakdown: ['text-heavy'],
  ProcessFlowDiagram: ['image'],
  PropertyComparisonMatrix: ['text-heavy'],
  SecretSauceReveal: ['text-heavy'],
  StackedHighlights: ['text-heavy'],
  SystemArchitecture: ['image'],
  TechnicalAdvantage: ['text-heavy'],
};

// ===== SOCIAL PROOF =====
const socialProofTags: UIBlockTagMap = {
  LogoWall: ['image'],
  MediaMentions: ['image'],
  UserCountBar: ['text-heavy'],
  IndustryBadgeLine: ['image'],
  MapHeatSpots: ['image'],
  StackedStats: ['text-heavy'],
  StripWithReviews: ['text-heavy'],
  SocialProofStrip: ['text-heavy'],
};

// ===== OBJECTION HANDLING =====
const objectionHandlingTags: UIBlockTagMap = {
  ObjectionAccordion: ['text-heavy', 'accordion'],
  MythVsRealityGrid: ['text-heavy'],
  QuoteBackedAnswers: ['text-heavy'],
  VisualObjectionTiles: ['image'],
  ProblemToReframeBlocks: ['text-heavy'],
  SkepticToBelieverSteps: ['text-heavy'],
  BoldGuaranteePanel: ['text-heavy'],
};

// ===== FOUNDER NOTE =====
const founderNoteTags: UIBlockTagMap = {
  FounderCardWithQuote: ['image'],
  LetterStyleBlock: ['text-heavy'],
  VideoNoteWithTranscript: ['image'],
  MissionQuoteOverlay: ['image'],
  TimelineToToday: ['text-heavy'],
  SideBySidePhotoStory: ['image'],
  StoryBlockWithPullquote: ['text-heavy'],
  FoundersBeliefStack: ['text-heavy'],
};

// ===== CTA =====
const ctaTags: UIBlockTagMap = {
  CenteredHeadlineCTA: ['text-heavy'],
  CTAWithBadgeRow: ['text-heavy'],
  VisualCTAWithMockup: ['image'],
  SideBySideCTA: ['text-heavy'],
  CountdownLimitedCTA: ['text-heavy'],
  CTAWithFormField: ['text-heavy'],
  ValueStackCTA: ['text-heavy'],
  TestimonialCTACombo: ['text-heavy'],
};

// ===== FOOTER =====
const footerTags: UIBlockTagMap = {
  SimpleFooter: ['text-heavy'],
  LinksAndSocialFooter: ['text-heavy'],
  MultiColumnFooter: ['text-heavy'],
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
