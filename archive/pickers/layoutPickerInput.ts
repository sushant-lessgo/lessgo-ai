import type {
  AwarenessLevel,
  ToneProfile,
  StartupStageGroup,
  MarketCategory,
  LandingGoalType,
  TargetAudienceGroup,
  PricingModel,
  PricingModifier,
  PricingCommitmentOption,
  MarketSophisticationLevel,
  CopyIntent,
  ProblemType,
} from "@/modules/inference/taxonomy";
import type { AssetAvailability } from "@/types/core/index";
import type {
  SectionPurpose,
  FlowTone,
  FlowComplexity,
  PreviousSectionContext,
  NextSectionContext
} from "./flowContextTypes";

/**
 * ✅ FIXED: Layout picker input interface using canonical field names
 * All field names now match the canonical InputVariables and HiddenInferredFields interfaces
 *
 * ✅ ENHANCED: Flow-aware context fields added (Phase 1 - Sprint: UIBlock Business Rules)
 * Optional fields enable pickers to understand their role in the objection flow
 */
export interface LayoutPickerInput {
  // ===== CORE FIELDS FROM HIDDEN INFERRED FIELDS =====
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  marketSophisticationLevel: MarketSophisticationLevel;
  copyIntent: CopyIntent;
  problemType: ProblemType;

  // ===== CORE FIELDS FROM INPUT VARIABLES =====
  marketCategory: MarketCategory;
  startupStage: StartupStageGroup;                    // ✅ FIXED: was 'startupStageGroup'
  landingPageGoals: LandingGoalType;             // ✅ FIXED: was 'landingGoalType'
  targetAudience: TargetAudienceGroup;               // ✅ FIXED: was 'targetAudienceGroup'
  pricingModel: PricingModel;

  // ===== OPTIONAL PRICING FIELDS =====
  pricingModifier?: PricingModifier;
  pricingCommitmentOption?: PricingCommitmentOption;

  // ===== ASSET AVAILABILITY =====
  assetAvailability?: AssetAvailability;              // Sprint 7: Asset-aware layout selection

  // ===== FLOW-AWARE CONTEXT FIELDS (OPTIONAL - Phase 1) =====

  /**
   * Purpose of this section in the objection flow
   *
   * Determines what job the section needs to do RIGHT NOW in the user's mental journey.
   *
   * @example 'agitate-pain' for problem section in problem-aware flow at position 2
   * @example 'identify-problem' for problem section in unaware flow at position 2
   * @example 'prove' for results section validating unique mechanism
   */
  sectionPurpose?: SectionPurpose;

  /**
   * Position of this section in the overall flow
   *
   * Zero-indexed position in the section sequence (excluding header/footer).
   *
   * @example 2 means third content section (position 0=header, 1=hero, 2=this section)
   */
  positionInFlow?: number;

  /**
   * Total number of sections in the flow
   *
   * Includes all content sections but excludes header/footer.
   *
   * @example 8 means there are 8 total content sections in the landing page
   */
  totalSectionsInFlow?: number;

  /**
   * Context about the previous section in the flow
   *
   * Used for sequential coherence and section pairing rules.
   *
   * Pairing rules:
   * - Problem → BeforeAfter (show relief after agitating pain)
   * - UniqueMechanism → Results (validate the mechanism works)
   * - Features → Results (prove capabilities deliver outcomes)
   *
   * @example { type: 'problem', layout: 'EmotionalQuotes', tone: 'emotional', density: 'medium' }
   */
  previousSection?: PreviousSectionContext;

  /**
   * Context about the next section in the flow
   *
   * Used to prepare the user for the next mental step.
   *
   * Rules:
   * - If next is CTA → Make current section decisive, not educational
   * - If next is objectionHandling → Current section can make bold claims
   * - If next is pricing → Current section should justify value
   *
   * @example { type: 'cta', purpose: 'close' }
   */
  nextSection?: NextSectionContext;

  /**
   * Overall tone established by early sections
   *
   * Set by the first content section (usually position 3) and maintained across the page
   * to ensure tonal coherence.
   *
   * Scoring adjustments:
   * - 'emotional' → Boost relatable layouts, penalize heavy analytical
   * - 'analytical' → Boost data-driven layouts, penalize overly casual
   * - 'balanced' → Allow mix of both approaches
   *
   * @example 'emotional' if problem section used EmotionalQuotes
   * @example 'analytical' if problem section used CollapsedCards
   */
  flowTone?: FlowTone;

  /**
   * Overall complexity level of the flow
   *
   * Determined by early sections and maintained for coherence.
   *
   * Scoring adjustments:
   * - 'simple' → Boost scannable layouts, penalize detailed ones
   * - 'detailed' → Allow comprehensive layouts
   * - 'moderate' → Balanced approach
   *
   * @example 'simple' if features section used IconGrid
   * @example 'detailed' if features section used SplitAlternating
   */
  flowComplexity?: FlowComplexity;
}