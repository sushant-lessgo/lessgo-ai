// Deterministic UIBlock selection for V3 onboarding flow
// Reference: newOnboarding.md Appendix: UIBlock Selection Rules

import type {
  SectionType,
  AssetAvailability,
  SimplifiedStrategyOutput,
  LandingGoal,
  Vibe,
  TestimonialType,
} from '@/types/generation';
import { getOrientation, UIBlockOrientation, getOppositeOrientation } from './uiblockTags';

export interface SelectUIBlocksInput {
  sections: SectionType[];
  strategy: SimplifiedStrategyOutput;
  assets: AssetAvailability;
  landingGoal: LandingGoal;
  hasMultipleAudiences: boolean;
}

export interface SelectUIBlocksOutput {
  uiblocks: Record<string, string>;
}

/**
 * Random choice helper for rhythm-based selection
 */
function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Check if product has any proof assets
 */
function hasProofAssets(assets: AssetAvailability): boolean {
  return assets.hasTestimonials || assets.hasSocialProof;
}

/**
 * Select Header UIBlock
 * Always: MinimalNavHeader
 */
function selectHeader(): string {
  return 'MinimalNavHeader';
}

/**
 * Select Hero UIBlock
 * Based on: waitlist, productType, proof assets, vibe
 */
function selectHero(
  landingGoal: LandingGoal,
  productType: string,
  assets: AssetAvailability,
  vibe: Vibe
): string {
  // TODO: TEMP - Force leftCopyRightImage for V2 schema testing
  // Revert after testing is complete
  return 'leftCopyRightImage';

  /* ORIGINAL LOGIC (commented out for testing):
  // Waitlist always uses CenterStacked
  if (landingGoal === 'waitlist') {
    return 'centerStacked';
  }

  // Behind-the-scenes products use CenterStacked
  if (productType === 'behind-the-scenes') {
    return 'centerStacked';
  }

  // Visual products without proof assets use CenterStacked
  if (!hasProofAssets(assets)) {
    return 'centerStacked';
  }

  // Visual products with proof
  if (productType === 'visual-ui-hero') {
    return 'imageFirst';
  }

  // visual-ui-supports with proof
  // Dark Tech / Bold Energy get SplitScreen upgrade
  if (vibe === 'Dark Tech' || vibe === 'Bold Energy') {
    return 'splitScreen';
  }

  return 'leftCopyRightImage';
  */
}

/**
 * Select Problem UIBlock
 * B2B + multiple audiences → PersonaPanels, else CollapsedCards
 */
function selectProblem(isB2B: boolean, hasMultipleAudiences: boolean): string {
  if (isB2B && hasMultipleAudiences) {
    return 'PersonaPanels';
  }
  return 'CollapsedCards';
}

/**
 * Select BeforeAfter UIBlock
 * Alternates based on previous section orientation
 */
function selectBeforeAfter(prevOrientation: UIBlockOrientation | null): string {
  // If previous was horizontal/grid, use text-based (vertical options)
  if (prevOrientation === 'horizontal' || prevOrientation === 'grid') {
    return randomChoice(['SideBySideBlocks', 'StackedTextVisual']);
  }
  // Otherwise use image-based horizontal
  return 'SplitCard';
}

/**
 * Select HowItWorks UIBlock
 * Demo video → VideoWalkthrough, else rhythm-based
 */
function selectHowItWorks(
  hasDemoVideo: boolean,
  prevOrientation: UIBlockOrientation | null
): string {
  if (hasDemoVideo) {
    return 'VideoWalkthrough';
  }

  // Rhythm-based selection
  if (prevOrientation === 'horizontal' || prevOrientation === 'grid') {
    return randomChoice(['AccordionSteps', 'VerticalTimeline']);
  }
  return 'ThreeStepHorizontal';
}

/**
 * Select SocialProof UIBlock
 * Always: FlexibleSocialProof (adaptive component)
 */
function selectSocialProof(): string {
  // TODO: Create FlexibleSocialProof component
  // For now, use LogoWall as fallback
  return 'LogoWall';
}

/**
 * Select Testimonials UIBlock
 * Matrix: testimonialType × isB2B
 */
function selectTestimonials(
  testimonialType: TestimonialType | null,
  isB2B: boolean
): string {
  if (!testimonialType) {
    // Default based on B2B/B2C
    return isB2B ? 'QuoteGrid' : 'PullQuoteStack';
  }

  switch (testimonialType) {
    case 'text':
      return isB2B ? 'QuoteGrid' : 'PullQuoteStack';
    case 'photos':
      return isB2B ? 'QuoteGrid' : 'AvatarCarousel';
    case 'video':
      return 'VideoTestimonials';
    case 'transformation':
      return 'BeforeAfterQuote';
    default:
      return isB2B ? 'QuoteGrid' : 'PullQuoteStack';
  }
}

/**
 * Select Results UIBlock
 * visual-ui-hero → ResultsGallery, else rhythm-based
 */
function selectResults(
  productType: string,
  prevOrientation: UIBlockOrientation | null
): string {
  if (productType === 'visual-ui-hero') {
    return 'ResultsGallery';
  }

  // Rhythm-based
  if (prevOrientation === 'horizontal' || prevOrientation === 'grid') {
    return 'StackedWinsList';
  }
  return 'StatBlocks';
}

/**
 * Select Pricing UIBlock
 * From LLM decision
 */
function selectPricing(pricingUIBlock: string): string {
  return pricingUIBlock;
}

/**
 * Select ObjectionHandle UIBlock
 * From LLM decision
 */
function selectObjectionHandle(objectionHandleUIBlock: string): string {
  return objectionHandleUIBlock;
}

/**
 * Select FAQ UIBlock
 * Based on faqQuestionCount
 */
function selectFAQ(faqQuestionCount: number): string {
  if (faqQuestionCount <= 6) return 'InlineQnAList';
  if (faqQuestionCount <= 10) return 'TwoColumnFAQ';
  if (faqQuestionCount <= 14) return 'AccordionFAQ';
  return 'SegmentedFAQTabs';
}

/**
 * Select UseCases UIBlock
 * Industry → IndustryUseCaseGrid, Role → rhythm-based
 */
function selectUseCases(
  useCasesAudienceType: 'industry' | 'role',
  prevOrientation: UIBlockOrientation | null
): string {
  if (useCasesAudienceType === 'industry') {
    return 'IndustryUseCaseGrid';
  }

  // Role-based: use rhythm
  if (prevOrientation === 'horizontal' || prevOrientation === 'grid') {
    return 'RoleBasedScenarios';
  }
  return 'PersonaGrid';
}

/**
 * Select FounderNote UIBlock
 * Always: LetterStyleBlock
 */
function selectFounderNote(): string {
  return 'LetterStyleBlock';
}

/**
 * Select CTA UIBlock
 * buy → ValueStackCTA, visual → VisualCTAWithMockup, else CenteredHeadlineCTA
 */
function selectCTA(landingGoal: LandingGoal, productType: string): string {
  if (landingGoal === 'buy') {
    return 'ValueStackCTA';
  }

  if (productType === 'visual-ui-hero' || productType === 'visual-ui-supports') {
    return 'VisualCTAWithMockup';
  }

  return 'CenteredHeadlineCTA';
}

/**
 * Select Footer UIBlock
 * Always: ContactFooter
 */
function selectFooter(): string {
  return 'ContactFooter';
}

/**
 * Select Features UIBlock
 * From LLM decision
 */
function selectFeatures(featuresUIBlock: string): string {
  return featuresUIBlock;
}

/**
 * Select UniqueMechanism UIBlock
 * From LLM decision
 */
function selectUniqueMechanism(uniqueMechanismUIBlock: string): string {
  return uniqueMechanismUIBlock;
}

/**
 * Main deterministic UIBlock selection function
 * Processes sections in order, tracking orientation for rhythm
 */
export function selectUIBlocksV3(input: SelectUIBlocksInput): SelectUIBlocksOutput {
  const { sections, strategy, assets, landingGoal, hasMultipleAudiences } = input;
  const { uiblockDecisions, vibe, sectionDecisions } = strategy;

  const uiblocks: Record<string, string> = {};
  let prevOrientation: UIBlockOrientation | null = null;

  for (const section of sections) {
    let selected: string;

    switch (section) {
      case 'Header':
        selected = selectHeader();
        break;

      case 'Hero':
        selected = selectHero(landingGoal, uiblockDecisions.productType, assets, vibe);
        break;

      case 'Problem':
        selected = selectProblem(sectionDecisions.isB2B, hasMultipleAudiences);
        break;

      case 'BeforeAfter':
        selected = selectBeforeAfter(prevOrientation);
        break;

      case 'Features':
        selected = selectFeatures(uiblockDecisions.featuresUIBlock);
        break;

      case 'HowItWorks':
        selected = selectHowItWorks(assets.hasDemoVideo, prevOrientation);
        break;

      case 'UniqueMechanism':
        selected = selectUniqueMechanism(uiblockDecisions.uniqueMechanismUIBlock);
        break;

      case 'SocialProof':
        selected = selectSocialProof();
        break;

      case 'Testimonials':
        selected = selectTestimonials(assets.testimonialType, sectionDecisions.isB2B);
        break;

      case 'Results':
        selected = selectResults(uiblockDecisions.productType, prevOrientation);
        break;

      case 'Pricing':
        selected = selectPricing(uiblockDecisions.pricingUIBlock);
        break;

      case 'ObjectionHandle':
        selected = selectObjectionHandle(uiblockDecisions.objectionHandleUIBlock);
        break;

      case 'FAQ':
        selected = selectFAQ(uiblockDecisions.faqQuestionCount);
        break;

      case 'UseCases':
        selected = selectUseCases(uiblockDecisions.useCasesAudienceType, prevOrientation);
        break;

      case 'FounderNote':
        selected = selectFounderNote();
        break;

      case 'CTA':
        selected = selectCTA(landingGoal, uiblockDecisions.productType);
        break;

      case 'Footer':
        selected = selectFooter();
        break;

      default:
        // Unknown section, skip
        continue;
    }

    uiblocks[section] = selected;

    // Update orientation for rhythm tracking
    const orientation = getOrientation(selected);
    if (orientation) {
      prevOrientation = orientation;
    }
  }

  return { uiblocks };
}
