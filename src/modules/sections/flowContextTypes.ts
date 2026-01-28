/**
 * Flow-Aware Context Types for UIBlock Layout Selection
 *
 * These types enable pickers to understand their role in the objection flow
 * and maintain tonal coherence across sections.
 *
 * Created: 2025-10-09
 * Sprint: UIBlock Business Rules Implementation - Phase 1
 */

/**
 * Section purpose in the objection flow
 *
 * Determines what job the section needs to do RIGHT NOW in the user's mental journey.
 *
 * @example
 * - 'identify-problem': Unaware audience - help them see they have a problem
 * - 'agitate-pain': Problem-aware audience - validate their pain emotionally
 * - 'show-solution': Demonstrate how the solution works
 * - 'differentiate': Show what makes this solution unique (level-3+ markets)
 * - 'prove': Provide evidence and validation (testimonials, results)
 * - 'close': Remove final barriers and create urgency
 * - 'educate': Teach how it works (unaware audiences, technical products)
 */
export type SectionPurpose =
  | 'identify-problem'
  | 'agitate-pain'
  | 'show-solution'
  | 'differentiate'
  | 'prove'
  | 'close'
  | 'educate';

/**
 * Flow tone established by early sections
 *
 * Set by the first content section (usually position 3) and maintained across the page.
 *
 * @example
 * - 'emotional': LetterStyleBlock founder note → keep subsequent sections relatable
 * - 'analytical': StackedPainBullets problem section → use data-driven layouts
 * - 'balanced': IconGrid features → mix of both approaches
 */
export type FlowTone = 'emotional' | 'analytical' | 'balanced';

/**
 * Flow complexity level
 *
 * Determined by early sections and maintained for coherence.
 *
 * @example
 * - 'simple': IconGrid features → keep results simple (OutcomeIcons)
 * - 'moderate': MiniCards features → balanced approach
 * - 'detailed': SplitAlternating features → allow comprehensive layouts
 */
export type FlowComplexity = 'simple' | 'moderate' | 'detailed';

/**
 * Layout content density
 *
 * Used for visual rhythm - alternating dense and light sections prevents fatigue.
 *
 * @example
 * - 'light': IconGrid, StatBlocks, LogoWall
 * - 'medium': MetricTiles, QuoteGrid, TierCards
 * - 'heavy': SplitAlternating, StackedPainBullets, StackedWinsList
 */
export type LayoutDensity = 'light' | 'medium' | 'heavy';

/**
 * Context about the previous section in the flow
 *
 * Used for sequential coherence and section pairing rules.
 *
 * @example
 * ```typescript
 * {
 *   type: 'problem',
 *   layout: 'EmotionalQuotes',
 *   tone: 'emotional',
 *   density: 'medium'
 * }
 * ```
 *
 * Pairing rules:
 * - Problem → BeforeAfter (show relief after pain)
 * - UniqueMechanism → Results (validate the mechanism)
 * - Features → Results (prove capabilities work)
 */
export interface PreviousSectionContext {
  /**
   * Section type identifier
   * @example 'problem', 'features', 'uniqueMechanism'
   */
  type: string;

  /**
   * Selected layout for the previous section
   * @example 'EmotionalQuotes', 'IconGrid', 'StatBlocks'
   */
  layout?: string;

  /**
   * Tone set by the previous section
   * Used to maintain tonal coherence
   */
  tone?: FlowTone;

  /**
   * Content density of the previous section
   * Used for visual rhythm (alternate dense and light)
   */
  density?: LayoutDensity;
}

/**
 * Context about the next section in the flow
 *
 * Used to prepare the user for the next mental step.
 *
 * @example
 * ```typescript
 * {
 *   type: 'cta',
 *   purpose: 'close'
 * }
 * ```
 *
 * Rules:
 * - If next is CTA → Make current section decisive, not educational
 * - If next is objectionHandling → Current section can make bold claims
 * - If next is pricing → Current section should justify value
 */
export interface NextSectionContext {
  /**
   * Section type identifier
   * @example 'cta', 'results', 'objectionHandling'
   */
  type: string;

  /**
   * Purpose the next section will serve
   * Helps current section prepare the user
   */
  purpose?: SectionPurpose;
}

/**
 * Helper function to determine layout density
 *
 * Used by section orchestrator to track visual rhythm.
 *
 * @param layout - The selected layout string
 * @returns Density classification of the layout
 */
export function getLayoutDensity(layout: string): LayoutDensity {
  // Light layouts - scannable, icon-based, simple
  const lightLayouts = [
    'IconGrid',
    'OutcomeIcons',
    'StatBlocks',
    'StackedWinsList',
    'LogoWall',
    'CenteredHero',
    'MinimalHeader',
    'ContactFooter'
  ];

  // Heavy layouts - dense, detailed, comprehensive
  const heavyLayouts = [
    'SplitAlternating',
    'StackedPainBullets',
    'AccordionSteps',
    'VerticalTimeline',
    'MythVsRealityGrid',
    'VisualObjectionTiles',
    'MethodologyBreakdown'
  ];

  if (lightLayouts.some(l => layout.includes(l))) {
    return 'light';
  }

  if (heavyLayouts.some(l => layout.includes(l))) {
    return 'heavy';
  }

  return 'medium';
}

/**
 * Helper function to determine flow tone from layout
 *
 * Used to establish tone from early section layouts.
 *
 * @param layout - The selected layout string
 * @returns Tone classification of the layout
 */
export function getLayoutTone(layout: string): FlowTone {
  // Emotional layouts - personal, relatable, story-driven
  const emotionalLayouts = [
    'LetterStyleBlock',
    'VideoTestimonials',
    'QuoteGrid',
    'PullQuoteStack'
  ];

  // Analytical layouts - data-driven, structured, technical
  const analyticalLayouts = [
    'StackedPainBullets',
    'StatBlocks',
    'StackedWinsList',
    'MetricTiles',
    'MythVsRealityGrid',
    'TierCards'
  ];

  if (emotionalLayouts.some(l => layout.includes(l))) {
    return 'emotional';
  }

  if (analyticalLayouts.some(l => layout.includes(l))) {
    return 'analytical';
  }

  return 'balanced';
}

/**
 * Helper function to determine flow complexity from layout
 *
 * Used to establish complexity level from early section layouts.
 *
 * @param layout - The selected layout string
 * @returns Complexity classification of the layout
 */
export function getLayoutComplexity(layout: string): FlowComplexity {
  // Simple layouts - quick comprehension, minimal detail
  const simpleLayouts = [
    'IconGrid',
    'ThreeStepHorizontal',
    'StatBlocks',
    'CenteredHeadlineCTA',
    'TierCards',
    'LogoWall'
  ];

  // Detailed layouts - comprehensive, in-depth
  const detailedLayouts = [
    'SplitAlternating',
    'AccordionSteps',
    'VerticalTimeline',
    'SegmentedFAQTabs',
    'SliderPricing',
    'MethodologyBreakdown'
  ];

  if (simpleLayouts.some(l => layout.includes(l))) {
    return 'simple';
  }

  if (detailedLayouts.some(l => layout.includes(l))) {
    return 'detailed';
  }

  return 'moderate';
}
