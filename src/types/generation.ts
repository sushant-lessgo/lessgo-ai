// src/types/generation.ts
// New generation system types - Phase 1 Foundation
// Reference: newOnboarding.md

/**
 * ===== LANDING GOALS =====
 * What should visitors do on the landing page
 */
export const landingGoals = [
  'waitlist',
  'signup',
  'free-trial',
  'buy',
  'demo',
  'download'
] as const;

export type LandingGoal = (typeof landingGoals)[number];

export const landingGoalLabels: Record<LandingGoal, string> = {
  'waitlist': 'Join waitlist',
  'signup': 'Sign up',
  'free-trial': 'Start free trial',
  'buy': 'Buy now',
  'demo': 'Book demo',
  'download': 'Download'
};

/**
 * ===== VIBES =====
 * Design personality system
 */
export const vibes = [
  'Dark Tech',
  'Light Trust',
  'Warm Friendly',
  'Bold Energy',
  'Calm Minimal'
] as const;

export type Vibe = (typeof vibes)[number];

/**
 * ===== PRICING MODELS =====
 */
export const pricingModels = [
  'free',
  'freemium',
  'subscription',
  'one-time',
  'usage-based',
  'enterprise'
] as const;

export type PricingModel = (typeof pricingModels)[number];

export const pricingModelLabels: Record<PricingModel, string> = {
  'free': 'Free',
  'freemium': 'Freemium',
  'subscription': 'Subscription',
  'one-time': 'One-time purchase',
  'usage-based': 'Usage-based',
  'enterprise': 'Enterprise'
};

/**
 * ===== AWARENESS LEVELS =====
 * Eugene Schwartz awareness spectrum
 * Canonical lowercase tokens - use labels for display
 */
export const awarenessLevels = [
  'unaware',
  'problem-aware',
  'solution-aware',
  'product-aware',
  'most-aware'
] as const;

export type AwarenessLevel = (typeof awarenessLevels)[number];

export const awarenessLevelLabels: Record<AwarenessLevel, string> = {
  'unaware': 'Unaware',
  'problem-aware': 'Problem-aware',
  'solution-aware': 'Solution-aware',
  'product-aware': 'Product-aware',
  'most-aware': 'Most aware'
};

/**
 * ===== SOPHISTICATION LEVELS =====
 * Market sophistication - how saturated is the market
 * Canonical lowercase tokens - use labels for display
 */
export const sophisticationLevels = ['low', 'medium', 'high'] as const;

export type SophisticationLevel = (typeof sophisticationLevels)[number];

export const sophisticationLevelLabels: Record<SophisticationLevel, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High'
};

/**
 * ===== SECTION TYPES =====
 * 17 allowed sections - MUST match spec exactly
 */
export const sectionTypes = [
  // Fixed (always present, fixed positions)
  'Header',
  'Hero',
  'CTA',
  'Footer',
  // Story
  'Problem',
  'BeforeAfter',
  'Features',
  'UniqueMechanism',
  'HowItWorks',
  // Proof
  'Testimonials',
  'SocialProof',
  'Results',
  'FounderNote',
  // Conversion
  'Pricing',
  'ObjectionHandle',
  'FAQ',
  // Targeting
  'UseCases'
] as const;

export type SectionType = (typeof sectionTypes)[number];

// Fixed sections that always appear in specific positions
export const fixedSections: SectionType[] = ['Header', 'Hero', 'CTA', 'Footer'];

// Sections that answer specific objections
export const sectionPurposes: Record<SectionType, string> = {
  'Header': 'Navigation and branding',
  'Hero': 'Hook + promise + primary CTA',
  'CTA': 'Final conversion push',
  'Footer': 'Links and legal',
  'Problem': 'Do you understand my pain?',
  'BeforeAfter': 'What transformation do I get?',
  'Features': 'What do I get?',
  'UniqueMechanism': 'Why is this different?',
  'HowItWorks': 'How do I use it?',
  'Testimonials': 'Are there people like me?',
  'SocialProof': 'Is this legit? Who else uses this?',
  'Results': 'Does it work?',
  'FounderNote': 'Who\'s behind this?',
  'Pricing': 'How much?',
  'ObjectionHandle': 'What about [risk]?',
  'FAQ': 'Small questions',
  'UseCases': 'Is this for me?'
};

/**
 * ===== ONE READER =====
 * Primary target persona for copy generation
 */
export interface OneReader {
  who: string;                      // "Freelance designer billing 5+ clients monthly"
  coreDesire: string;               // "Get paid faster without awkward follow-ups"
  corePain: string;                 // "Chasing payments feels unprofessional"
  beliefs: string;                  // "Clients always pay late, invoicing is tedious"
  awareness: AwarenessLevel;
  sophistication: SophisticationLevel;
  emotionalState: string;           // "Frustrated", "Overwhelmed", "Motivated"
}

/**
 * ===== ONE IDEA =====
 * Core value proposition
 */
export interface OneIdea {
  bigBenefit: string;               // "Spend time on creative work, not admin"
  uniqueMechanism: string;          // "AI creates invoices from a chat"
  reasonToBelieve: string;          // "10,000+ freelancers, avg 14 days faster"
}

/**
 * ===== IVOC (Intelligent Voice of Customer) =====
 * Research-derived customer insights from Tavily
 */
export interface IVOC {
  pains: string[];
  desires: string[];
  objections: string[];
  firmBeliefs: string[];
  shakableBeliefs: string[];
  commonPhrases: string[];
}

/**
 * ===== FEATURE ANALYSIS =====
 * Feature -> Benefit -> Benefit-of-Benefit chain
 */
export interface FeatureAnalysis {
  feature: string;                  // "AI invoice creation"
  benefit: string;                  // "Create invoices in seconds"
  benefitOfBenefit: string;         // "Spend time on creative work, not admin"
}

/**
 * ===== OBJECTION THEMES =====
 * Categorize objections by what they're questioning
 */
export const objectionThemes = [
  'trust',   // "Is this legit? Who uses this?"
  'risk',    // "What if it doesn't work? Can I cancel?"
  'fit',     // "Is this for me / my situation?"
  'how',     // "How does it work? Is it hard to use?"
  'what',    // "What exactly do I get?"
  'price',   // "Is it worth the cost?"
  'effort',  // "How much work is this to set up?"
] as const;

export type ObjectionTheme = (typeof objectionThemes)[number];

/**
 * ===== FRICTION LEVELS =====
 * Derived from landing goal + offer
 */
export const frictionLevels = ['low', 'medium', 'high'] as const;

export type FrictionLevel = (typeof frictionLevels)[number];

/**
 * ===== FRICTION ASSESSMENT =====
 * AI's assessment of friction level with reasoning
 */
export interface FrictionAssessment {
  level: FrictionLevel;
  reasoning: string;
}

/**
 * ===== ENHANCED OBJECTION =====
 * Objection with theme, intensity, and pre-handling flag
 */
export interface EnhancedObjection {
  thought: string;                  // "Will clients take AI invoices seriously?"
  theme: ObjectionTheme;            // "trust"
  intensity: 'low' | 'medium' | 'high'; // derived from IVOC (firmBelief=high)
  preHandledByHero?: boolean;       // Hero already addresses this (e.g., free trial handles risk)
}

/**
 * ===== OBJECTION GROUP =====
 * Multiple objections resolved by one section (many:1)
 */
export interface ObjectionGroup {
  theme: ObjectionTheme;
  objections: EnhancedObjection[];
  resolvedBy: SectionType;
  reasoning: string;                // Why this section resolves these objections
}

/**
 * ===== OBJECTION MAPPING (Legacy) =====
 * Maps reader objections to sections that address them
 */
export interface ObjectionMapping {
  thought: string;                  // "Will clients take AI invoices seriously?"
  section: SectionType;             // "SocialProof"
}

/**
 * ===== ASSET AVAILABILITY =====
 * What assets does the user have available
 */
export interface AssetAvailability {
  hasTestimonials: boolean;
  hasSocialProof: boolean;          // Logos, user counts, etc.
  hasConcreteResults: boolean;      // Stats, case studies
}

/**
 * ===== UNDERSTANDING DATA =====
 * AI-extracted info from oneLiner (Step 1 -> Step 2 playback)
 */
export interface UnderstandingData {
  categories: string[];
  audiences: string[];
  whatItDoes: string;
  features: string[];
}

/**
 * ===== STRATEGY OUTPUT =====
 * Result of strategy generation API
 */
export interface StrategyOutput {
  vibe: Vibe;
  oneReader: OneReader;
  oneIdea: OneIdea;
  featureAnalysis: FeatureAnalysis[];
  objections: ObjectionMapping[];
  sections: SectionType[];
}

/**
 * ===== ENHANCED STRATEGY OUTPUT =====
 * New strategy output with friction assessment and objection groups
 */
export interface EnhancedStrategyOutput {
  vibe: Vibe;
  oneReader: OneReader;
  oneIdea: OneIdea;
  featureAnalysis: FeatureAnalysis[];
  frictionAssessment: FrictionAssessment;
  allObjections: EnhancedObjection[];
  objectionGroups: ObjectionGroup[];
  sections: SectionType[];
}

/**
 * ===== UIBLOCK SELECTION (Phase 3) =====
 */

// UIBlock tags for composition rules
export type UIBlockTag = 'text-heavy' | 'accordion' | 'image' | 'persona-aware';

// Question returned when AI is uncertain
export interface UIBlockQuestion {
  id: string;                       // e.g., "Hero.layout"
  section: SectionType;
  question: string;
  options: string[];                // 2-4 layout options
  candidates: string[];             // For deterministic second pass
}

// UIBlock selection request
export interface UIBlockSelectRequest {
  strategy: StrategyOutput;
  productName: string;
  assets: AssetAvailability;
  answers?: Record<string, string>; // Answers from previous questions
}

// UIBlock selection response - all resolved
export interface UIBlockSelectResponseResolved {
  success: true;
  uiblocks: Record<SectionType, string>;
  creditsUsed: number;
  creditsRemaining: number;
}

// UIBlock selection response - needs input
export interface UIBlockSelectResponseNeedsInput {
  success: true;
  needsInput: true;
  uiblocks: Partial<Record<SectionType, string | null>>; // null = unresolved
  questions: UIBlockQuestion[];
}

export type UIBlockSelectResponse = UIBlockSelectResponseResolved | UIBlockSelectResponseNeedsInput;

/**
 * ===== COPY GENERATION (Phase 3) =====
 */

// Element value types
export type ElementValueReview = { value: string; needsReview: true };
export type ElementValue = string | string[] | null | ElementValueReview | Record<string, unknown>[];

// Section copy output
export interface SectionCopy {
  elements: Record<string, ElementValue>;
}

// Copy generation request
export interface GenerateCopyRequest {
  strategy: StrategyOutput;
  uiblocks: Record<SectionType, string>;
  productName: string;
  oneLiner: string;
  offer: string;
  landingGoal: LandingGoal;
  features: Array<{ feature: string; benefit: string }>;
}

// Copy generation response
export interface GenerateCopyResponse {
  success: true;
  sections: Record<string, SectionCopy>;
  creditsUsed: number;
  creditsRemaining: number;
}

// Copy generation error response
export interface GenerateCopyErrorResponse {
  success: false;
  error: string;
  partialSections?: Record<string, SectionCopy>; // Partial results if some parsed
}

/**
 * ===== VALIDATORS =====
 */
export const isValidLandingGoal = (v: string): v is LandingGoal =>
  landingGoals.includes(v as LandingGoal);

export const isValidVibe = (v: string): v is Vibe =>
  vibes.includes(v as Vibe);

export const isValidPricingModel = (v: string): v is PricingModel =>
  pricingModels.includes(v as PricingModel);

export const isValidSectionType = (v: string): v is SectionType =>
  sectionTypes.includes(v as SectionType);

export const isValidAwarenessLevel = (v: string): v is AwarenessLevel =>
  awarenessLevels.includes(v as AwarenessLevel);

export const isValidSophisticationLevel = (v: string): v is SophisticationLevel =>
  sophisticationLevels.includes(v as SophisticationLevel);

export const isValidObjectionTheme = (v: string): v is ObjectionTheme =>
  objectionThemes.includes(v as ObjectionTheme);

export const isValidFrictionLevel = (v: string): v is FrictionLevel =>
  frictionLevels.includes(v as FrictionLevel);
