// objectionFlowEngine.ts - ✅ FIXED: Uses centralized taxonomy types
import { sectionList, type SectionSpacing } from "./sectionList";
import { logger } from '@/lib/logger';
import type {
  AwarenessLevel,
  MarketSophisticationLevel,
  LandingGoalType,
  StartupStage
} from '@/modules/inference/taxonomy';

// ✅ FIXED: Remove duplicate type definitions, use centralized taxonomy types

// Constants
const SECTION_IDS = {
  beforeAfter: "beforeAfter",
  closeSection: "closeSection",
  comparisonTable: "comparisonTable", 
  cta: "cta",
  features: "features",
  faq: "faq",
  founderNote: "founderNote",
  hero: "hero",
  howItWorks: "howItWorks",
  integrations: "integrations",
  objectionHandling: "objectionHandling",
  pricing: "pricing",
  problem: "problem",
  results: "results",
  security: "security",
  socialProof: "socialProof", 
  testimonials: "testimonials",
  uniqueMechanism: "uniqueMechanism",
  useCases: "useCases"
} as const;

type SectionId = keyof typeof SECTION_IDS;

interface FlowInput {
  awarenessLevel: AwarenessLevel;
  marketSophisticationLevel: MarketSophisticationLevel;
  landingGoal: LandingGoalType;  // ✅ FIXED: Use canonical 'LandingGoalType'
  targetAudience: string;
  startupStage: StartupStage;
  marketCategory: string;
}

interface ObjectionFlow {
  sections: string[];
  reasoning: string;
  profile: string;
}

// ===== AWARENESS-BASED BASE FLOWS (RULES 1.1 - 1.5) =====
/**
 * Base section flows determined by awareness level - the starting point of the mental journey.
 * These flows answer the question: "What is this person thinking RIGHT NOW?"
 *
 * Sophistication modifiers are applied separately to adjust these base flows.
 */
const AWARENESS_BASE_FLOWS: Record<AwarenessLevel, ObjectionFlow> = {
  "unaware": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.beforeAfter, SECTION_IDS.howItWorks, SECTION_IDS.socialProof, SECTION_IDS.cta],
    reasoning: "Unaware: Identify problem they don't know exists → Show impact → Explain solution → Build basic trust",
    profile: "I don't know I have a problem"
  },

  "problem-aware": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.beforeAfter, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Problem-aware: Validate pain emotionally FIRST → Show transformation → Demonstrate solution → Prove it works",
    profile: "I know I struggle with this, do you get me?"
  },

  "solution-aware": {
    sections: [SECTION_IDS.hero, SECTION_IDS.uniqueMechanism, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Solution-aware: Differentiate immediately → Show capabilities → Prove superiority",
    profile: "I know solutions exist, why are you different?"
  },

  "product-aware": {
    sections: [SECTION_IDS.hero, SECTION_IDS.socialProof, SECTION_IDS.features, SECTION_IDS.integrations, SECTION_IDS.security, SECTION_IDS.results, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    reasoning: "Product-aware: Build trust first → Show capabilities → Prove technical fit → Handle concerns",
    profile: "I know about you specifically, evaluating fit"
  },

  "most-aware": {
    sections: [SECTION_IDS.hero, SECTION_IDS.pricing, SECTION_IDS.testimonials, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    reasoning: "Most-aware: Show offer → Quick confidence check → Remove barriers → Close",
    profile: "Almost ready, need final push"
  }
};

// ===== LEGACY OBJECTION FLOWS (DEPRECATED - Kept for fallback only) =====
/**
 * @deprecated These templates are being replaced by awareness base flows + sophistication modifiers.
 * Kept temporarily for fallback behavior during transition.
 */
const OBJECTION_FLOWS: Record<string, ObjectionFlow> = {
  "unaware+level-2": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.beforeAfter, SECTION_IDS.howItWorks, SECTION_IDS.results, SECTION_IDS.cta],
    reasoning: "New problem, emerging solutions - focus on education and basic proof",
    profile: "Unaware users in emerging market"
  },

  "problem-aware+level-2": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.features, SECTION_IDS.howItWorks, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Known problem, few solutions - educate on solution with social proof",
    profile: "Problem-aware users, early market"
  },

  "problem-aware+level-3": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.uniqueMechanism, SECTION_IDS.features, SECTION_IDS.comparisonTable, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Known problem, crowded market - validate pain FIRST, then focus on differentiation",
    profile: "Problem-aware users, competitive market"
  },

  "problem-aware+level-4": {
    sections: [SECTION_IDS.hero, SECTION_IDS.problem, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.uniqueMechanism, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    reasoning: "Known problem, skeptical market - heavy proof and objection handling",
    profile: "Problem-aware users, skeptical market"
  },

  "solution-aware+level-2": {
    sections: [SECTION_IDS.hero, SECTION_IDS.uniqueMechanism, SECTION_IDS.features, SECTION_IDS.howItWorks, SECTION_IDS.results, SECTION_IDS.cta],
    reasoning: "Solutions emerging, early adopters - focus on approach and capabilities",
    profile: "Solution-aware early adopters"
  },

  "solution-aware+level-3": {
    sections: [SECTION_IDS.hero, SECTION_IDS.uniqueMechanism, SECTION_IDS.comparisonTable, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Competitive comparison shopping - emphasize differentiation",
    profile: "Solution-aware comparison shoppers"
  },

  "solution-aware+level-4": {
    sections: [SECTION_IDS.hero, SECTION_IDS.socialProof, SECTION_IDS.results, SECTION_IDS.comparisonTable, SECTION_IDS.testimonials, SECTION_IDS.objectionHandling, SECTION_IDS.uniqueMechanism, SECTION_IDS.cta],
    reasoning: "Sophisticated comparison - credibility first, extensive proof",
    profile: "Solution-aware sophisticated buyers"
  },

  "product-aware+level-4": {
    sections: [SECTION_IDS.hero, SECTION_IDS.socialProof, SECTION_IDS.security, SECTION_IDS.integrations, SECTION_IDS.results, SECTION_IDS.pricing, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    reasoning: "Enterprise evaluation - trust, implementation, investment concerns",
    profile: "Product-aware enterprise buyers"
  },

  "most-aware+level-3": {
    sections: [SECTION_IDS.hero, SECTION_IDS.pricing, SECTION_IDS.testimonials, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    reasoning: "Warm leads, final confidence - offer, proof, risk reversal",
    profile: "Most-aware warm prospects"
  }
};

// ===== MARKET SOPHISTICATION MODIFIERS (RULES 2.1 - 2.3) =====
/**
 * Sophistication determines WHEN and HOW to differentiate.
 * These modifiers adjust the base awareness flows based on market competition.
 */
interface SophisticationModifier {
  addSections: string[];           // Sections to add if not present
  positioning: Record<string, 'early' | 'middle' | 'late'>;  // Where to position sections
  emphasis: string[];              // Sections to emphasize (ensure they're present)
  description: string;
}

const SOPHISTICATION_MODIFIERS: Record<MarketSophisticationLevel, SophisticationModifier> = {
  "level-1": {
    addSections: [],
    positioning: {},
    emphasis: [SECTION_IDS.howItWorks, SECTION_IDS.features],
    description: "Level 1: New category - simple claims work, basic education focus"
  },

  "level-2": {
    addSections: [],
    positioning: {},
    emphasis: [SECTION_IDS.howItWorks, SECTION_IDS.features],
    description: "Level 2: Few competitors - clear explanations, basic differentiation"
  },

  "level-3": {
    addSections: [SECTION_IDS.uniqueMechanism],
    positioning: {
      [SECTION_IDS.uniqueMechanism]: 'early'  // Position 2-4
    },
    emphasis: [SECTION_IDS.uniqueMechanism, SECTION_IDS.features],
    description: "Level 3: Growing competition - differentiation early, unique mechanism required"
  },

  "level-4": {
    addSections: [SECTION_IDS.socialProof, SECTION_IDS.uniqueMechanism, SECTION_IDS.objectionHandling],
    positioning: {
      [SECTION_IDS.socialProof]: 'early',        // Position 2-3
      [SECTION_IDS.uniqueMechanism]: 'middle',   // After credibility established
      [SECTION_IDS.objectionHandling]: 'late'    // Before CTA
    },
    emphasis: [SECTION_IDS.socialProof, SECTION_IDS.results, SECTION_IDS.testimonials],
    description: "Level 4: Saturated market - credibility first, heavy proof stack"
  },

  "level-5": {
    addSections: [SECTION_IDS.socialProof, SECTION_IDS.uniqueMechanism, SECTION_IDS.objectionHandling, SECTION_IDS.testimonials],
    positioning: {
      [SECTION_IDS.socialProof]: 'early',
      [SECTION_IDS.uniqueMechanism]: 'middle',
      [SECTION_IDS.objectionHandling]: 'late'
    },
    emphasis: [SECTION_IDS.socialProof, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.objectionHandling],
    description: "Level 5: Hyper-saturated - maximum proof, extensive objection handling"
  }
};

// ===== FALLBACK LOGIC FOR EDGE CASES =====
const FALLBACK_MAPPINGS: Record<string, string> = {
  // Rare sophistication levels
  "unaware+level-1": "unaware+level-2",
  "unaware+level-3": "problem-aware+level-3",
  "unaware+level-4": "problem-aware+level-4",
  "unaware+level-5": "problem-aware+level-4",

  "problem-aware+level-1": "problem-aware+level-2",
  "problem-aware+level-5": "problem-aware+level-4",

  "solution-aware+level-1": "solution-aware+level-2",
  "solution-aware+level-5": "solution-aware+level-4",

  "product-aware+level-1": "solution-aware+level-2",
  "product-aware+level-2": "solution-aware+level-3",
  "product-aware+level-3": "solution-aware+level-4",
  "product-aware+level-5": "product-aware+level-4",

  "most-aware+level-1": "most-aware+level-3",
  "most-aware+level-2": "most-aware+level-3",
  "most-aware+level-4": "most-aware+level-3",
  "most-aware+level-5": "most-aware+level-3"
};

// ===== STAGE-BASED SECTION AVAILABILITY (RULES 3.1 - 3.3) =====
/**
 * Startup stage determines what proof types are AVAILABLE and CREDIBLE.
 * This is a HARD CONSTRAINT - you can't fake what you don't have.
 *
 * RULE 3.1: Pre-MVP / MVP Development - Vision and mechanism, no real proof
 * RULE 3.2: MVP Launched / Early Feedback - Small-scale proof only
 * RULE 3.3: Traction / Growth / Scale - All proof types available
 */
const SECTION_AVAILABILITY: Record<string, {
  unavailable: string[],
  substitutions: Record<string, string>,
  description: string
}> = {
  "pre-mvp": {
    unavailable: [
      SECTION_IDS.testimonials,
      SECTION_IDS.pricing,
      SECTION_IDS.results,
      SECTION_IDS.comparisonTable,
      SECTION_IDS.socialProof
    ],
    substitutions: {
      [SECTION_IDS.testimonials]: SECTION_IDS.founderNote,      // Personal credibility
      [SECTION_IDS.pricing]: SECTION_IDS.problem,               // Focus on problem depth
      [SECTION_IDS.results]: SECTION_IDS.beforeAfter,           // Vision-based transformation
      [SECTION_IDS.comparisonTable]: SECTION_IDS.uniqueMechanism, // Technical differentiation
      [SECTION_IDS.socialProof]: SECTION_IDS.uniqueMechanism    // Mechanism as credibility
    },
    description: "Pre-MVP: Use vision, mechanism, and founder credibility - no real proof available"
  },

  "mvp-development": {
    unavailable: [
      SECTION_IDS.testimonials,
      SECTION_IDS.pricing,
      SECTION_IDS.results,
      SECTION_IDS.comparisonTable,
      SECTION_IDS.socialProof
    ],
    substitutions: {
      [SECTION_IDS.testimonials]: SECTION_IDS.founderNote,
      [SECTION_IDS.pricing]: SECTION_IDS.features,              // Show planned capabilities
      [SECTION_IDS.results]: SECTION_IDS.beforeAfter,
      [SECTION_IDS.comparisonTable]: SECTION_IDS.uniqueMechanism,
      [SECTION_IDS.socialProof]: SECTION_IDS.howItWorks        // Demonstrate approach
    },
    description: "MVP Development: Focus on approach and capabilities, avoid proof claims"
  },

  "mvp-launched": {
    unavailable: [
      SECTION_IDS.pricing,
      SECTION_IDS.results,
      SECTION_IDS.comparisonTable
    ],
    substitutions: {
      [SECTION_IDS.pricing]: SECTION_IDS.features,
      [SECTION_IDS.results]: SECTION_IDS.beforeAfter,           // Or keep as qualified results
      [SECTION_IDS.comparisonTable]: SECTION_IDS.uniqueMechanism
    },
    description: "MVP Launched: Small-scale testimonials OK, but avoid large metrics and comparisons"
  },

  "early-feedback": {
    unavailable: [SECTION_IDS.comparisonTable],                 // Not enough data yet
    substitutions: {
      [SECTION_IDS.comparisonTable]: SECTION_IDS.uniqueMechanism
    },
    description: "Early Feedback: Growing proof, but comparison needs more data"
  },

  "traction": {
    unavailable: [],
    substitutions: {},
    description: "Traction: All proof types available, backed by real data"
  },

  "growth": {
    unavailable: [],
    substitutions: {},
    description: "Growth: Comprehensive proof stack available"
  },

  "scale": {
    unavailable: [],
    substitutions: {},
    description: "Scale: Full proof portfolio including enterprise credentials"
  }
};

// ===== GOAL-BASED MODIFIERS (RULES 4.1 - 4.5) =====
/**
 * Landing goal determines objection DEPTH and section requirements.
 * Lower friction = fewer sections, lighter proof
 * Higher friction = comprehensive proof stack
 */
interface GoalModifier {
  add: string[];                           // Sections to add if not present
  required: string[];                      // Sections that MUST be present
  forbidden: string[];                     // Sections to remove (wrong for this goal)
  prioritize: string[];                    // Sections to emphasize
  insertAfter?: Record<string, string>;    // Where to position added sections
  description: string;
}

const GOAL_MODIFIERS: Record<string, GoalModifier> = {
  // RULE 4.1: Low Friction Goals (5-6 sections)
  "waitlist": {
    add: [SECTION_IDS.founderNote],
    required: [SECTION_IDS.hero, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.objectionHandling, SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.socialProof],
    insertAfter: { [SECTION_IDS.founderNote]: SECTION_IDS.problem },
    description: "Waitlist: Minimal convincing - create curiosity and FOMO"
  },

  "early-access": {
    add: [SECTION_IDS.founderNote],
    required: [SECTION_IDS.hero, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.objectionHandling, SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.uniqueMechanism, SECTION_IDS.socialProof],
    insertAfter: { [SECTION_IDS.founderNote]: SECTION_IDS.uniqueMechanism },
    description: "Early Access: Soft engagement - focus on unique angle and social signal"
  },

  "join-community": {
    add: [SECTION_IDS.socialProof],
    required: [SECTION_IDS.hero, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.pricing, SECTION_IDS.objectionHandling],
    prioritize: [SECTION_IDS.socialProof, SECTION_IDS.features],
    description: "Join Community: Build belonging - show who's already in"
  },

  "watch-video": {
    add: [],
    required: [SECTION_IDS.hero, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.pricing, SECTION_IDS.objectionHandling, SECTION_IDS.testimonials],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.howItWorks],
    description: "Watch Video: Minimal friction - just viewing content"
  },

  // RULE 4.2: Medium Friction Goals (7 sections)
  "signup": {
    add: [SECTION_IDS.features],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.features, SECTION_IDS.howItWorks],
    description: "Signup: Account creation - show value quickly"
  },

  "free-trial": {
    add: [SECTION_IDS.features, SECTION_IDS.howItWorks],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable],
    prioritize: [SECTION_IDS.features, SECTION_IDS.howItWorks],
    insertAfter: { [SECTION_IDS.howItWorks]: SECTION_IDS.features },
    description: "Free Trial: 'Just try it' - scannable features, simple how-it-works"
  },

  "download": {
    add: [SECTION_IDS.features, SECTION_IDS.howItWorks],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.cta],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.features, SECTION_IDS.socialProof],
    description: "Download: App installation - show value and build trust"
  },

  // RULE 4.3: Medium-High Friction Goals (8 sections)
  "demo": {
    add: [SECTION_IDS.results, SECTION_IDS.objectionHandling],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.cta],
    forbidden: [],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.results],
    insertAfter: { [SECTION_IDS.objectionHandling]: SECTION_IDS.results },
    description: "Demo: Show relevance - demonstrate value of meeting"
  },

  "book-call": {
    add: [SECTION_IDS.results, SECTION_IDS.objectionHandling],
    required: [SECTION_IDS.hero, SECTION_IDS.results, SECTION_IDS.cta],
    forbidden: [],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.results],
    insertAfter: { [SECTION_IDS.objectionHandling]: SECTION_IDS.results },
    description: "Book Call: Time commitment - prove meeting will be valuable"
  },

  // RULE 4.4: High Friction Goals (8 sections)
  "buy-now": {
    add: [SECTION_IDS.pricing, SECTION_IDS.objectionHandling, SECTION_IDS.results, SECTION_IDS.testimonials],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.objectionHandling, SECTION_IDS.cta],
    forbidden: [],
    prioritize: [SECTION_IDS.pricing, SECTION_IDS.objectionHandling],
    insertAfter: { [SECTION_IDS.pricing]: SECTION_IDS.features },
    description: "Buy Now: Purchase decision - full proof stack with price justification"
  },

  "subscribe": {
    add: [SECTION_IDS.pricing, SECTION_IDS.objectionHandling, SECTION_IDS.results, SECTION_IDS.testimonials],
    required: [SECTION_IDS.hero, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    forbidden: [],
    prioritize: [SECTION_IDS.pricing, SECTION_IDS.objectionHandling],
    insertAfter: { [SECTION_IDS.pricing]: SECTION_IDS.features },
    description: "Subscribe: Recurring payment - strong ongoing value proof"
  },

  // RULE 4.5: Enterprise Goals (8 sections)
  "contact-sales": {
    add: [SECTION_IDS.security, SECTION_IDS.integrations, SECTION_IDS.socialProof, SECTION_IDS.results, SECTION_IDS.objectionHandling],
    required: [SECTION_IDS.hero, SECTION_IDS.socialProof, SECTION_IDS.features, SECTION_IDS.results, SECTION_IDS.cta],
    forbidden: [],
    prioritize: [SECTION_IDS.socialProof, SECTION_IDS.security, SECTION_IDS.results],
    insertAfter: {
      [SECTION_IDS.security]: SECTION_IDS.features,
      [SECTION_IDS.integrations]: SECTION_IDS.security
    },
    description: "Contact Sales: Enterprise evaluation - technical validation and trust"
  }
};

// ===== CATEGORY-BASED MODIFIERS (RULES 5.1 - 5.5) =====
/**
 * Market category determines mental model and proof types.
 * Personal categories use emotional/experiential mental models
 * B2B categories use analytical/technical mental models
 */
interface CategoryModifier {
  add: string[];                    // Sections to add
  required: string[];               // Sections that must be present
  forbidden: string[];              // Sections to remove (wrong for this category)
  prioritize: string[];             // Sections to emphasize
  description: string;
}

const CATEGORY_MODIFIERS: Record<string, CategoryModifier> = {
  // RULE 5.1: Personal Productivity - Personal Mental Model
  "Personal Productivity Tools": {
    add: [SECTION_IDS.howItWorks, SECTION_IDS.beforeAfter],
    required: [SECTION_IDS.features],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.integrations, SECTION_IDS.security],
    prioritize: [SECTION_IDS.howItWorks, SECTION_IDS.features, SECTION_IDS.beforeAfter],
    description: "Personal: 'Will this work for ME?' - show transformation, avoid corporate elements"
  },

  // RULE 5.2: Health & Wellness - Personal Transformation
  "Health & Wellness": {
    add: [SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.beforeAfter],
    required: [SECTION_IDS.results, SECTION_IDS.testimonials],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.integrations, SECTION_IDS.security],
    prioritize: [SECTION_IDS.results, SECTION_IDS.beforeAfter, SECTION_IDS.testimonials],
    description: "Health: Personal transformation stories - show real people, avoid analytical"
  },

  "Fitness & Exercise": {
    add: [SECTION_IDS.results, SECTION_IDS.beforeAfter, SECTION_IDS.testimonials],
    required: [SECTION_IDS.results],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.integrations, SECTION_IDS.security],
    prioritize: [SECTION_IDS.results, SECTION_IDS.beforeAfter, SECTION_IDS.howItWorks],
    description: "Fitness: Visual transformation proof - before/after is king"
  },

  "Mental Health & Mindfulness": {
    add: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks],
    required: [SECTION_IDS.testimonials],
    forbidden: [SECTION_IDS.comparisonTable, SECTION_IDS.integrations, SECTION_IDS.security, SECTION_IDS.results],
    prioritize: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks],
    description: "Mental Health: Sensitive testimonials - avoid metrics, focus on journey"
  },

  "Personal Finance Management": {
    add: [SECTION_IDS.security, SECTION_IDS.results, SECTION_IDS.testimonials],
    required: [SECTION_IDS.security],
    forbidden: [SECTION_IDS.comparisonTable],
    prioritize: [SECTION_IDS.security, SECTION_IDS.results, SECTION_IDS.testimonials],
    description: "Personal Finance: Money trust - security critical, personal stories matter"
  },

  // RULE 5.3: Business Productivity - Analytical + Integration
  "Business Productivity Tools": {
    add: [SECTION_IDS.integrations, SECTION_IDS.results, SECTION_IDS.howItWorks],
    required: [SECTION_IDS.features, SECTION_IDS.integrations],
    forbidden: [],
    prioritize: [SECTION_IDS.integrations, SECTION_IDS.results, SECTION_IDS.features],
    description: "Business Productivity: Integration is key - show how it fits workflow"
  },

  "Team Collaboration Software": {
    add: [SECTION_IDS.integrations, SECTION_IDS.useCases, SECTION_IDS.socialProof],
    required: [SECTION_IDS.features, SECTION_IDS.integrations],
    forbidden: [],
    prioritize: [SECTION_IDS.integrations, SECTION_IDS.useCases, SECTION_IDS.socialProof],
    description: "Collaboration: Team adoption proof - show companies using it"
  },

  // RULE 5.4: Developer Tools - Technical Depth
  "Developer Tools & APIs": {
    add: [SECTION_IDS.integrations, SECTION_IDS.howItWorks, SECTION_IDS.security],
    required: [SECTION_IDS.howItWorks, SECTION_IDS.integrations],
    forbidden: [],
    prioritize: [SECTION_IDS.integrations, SECTION_IDS.howItWorks, SECTION_IDS.features],
    description: "Developer Tools: Technical detail - how it works and integrates"
  },

  // RULE 5.5: Healthcare/Legal - Compliance & Security
  "Healthcare Technology": {
    add: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.socialProof],
    required: [SECTION_IDS.security, SECTION_IDS.objectionHandling],
    forbidden: [],
    prioritize: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.testimonials],
    description: "Healthcare: Compliance first - HIPAA, security, risk handling"
  },

  "Legal Technology": {
    add: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.socialProof],
    required: [SECTION_IDS.security, SECTION_IDS.objectionHandling],
    forbidden: [],
    prioritize: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.testimonials],
    description: "Legal: Compliance and confidentiality - trust is everything"
  },

  "Financial Services": {
    add: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.socialProof],
    required: [SECTION_IDS.security],
    forbidden: [],
    prioritize: [SECTION_IDS.security, SECTION_IDS.socialProof, SECTION_IDS.objectionHandling],
    description: "Financial: Security and credibility - regulatory trust critical"
  },

  // Other categories
  "Education & Learning": {
    add: [SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.howItWorks],
    required: [SECTION_IDS.testimonials],
    forbidden: [],
    prioritize: [SECTION_IDS.results, SECTION_IDS.howItWorks, SECTION_IDS.testimonials],
    description: "Education: Learning outcomes - show transformation stories"
  },

  "Entertainment & Gaming": {
    add: [SECTION_IDS.howItWorks, SECTION_IDS.socialProof],
    required: [],
    forbidden: [SECTION_IDS.security, SECTION_IDS.objectionHandling, SECTION_IDS.comparisonTable],
    prioritize: [SECTION_IDS.howItWorks, SECTION_IDS.socialProof, SECTION_IDS.features],
    description: "Entertainment: Fun and social - avoid heavy analytical elements"
  },

  "Content & Creator Economy": {
    add: [SECTION_IDS.results, SECTION_IDS.useCases, SECTION_IDS.testimonials],
    required: [SECTION_IDS.results],
    forbidden: [],
    prioritize: [SECTION_IDS.results, SECTION_IDS.features, SECTION_IDS.testimonials],
    description: "Creator Tools: Results proof - show creator success stories"
  },

  "E-commerce Platform": {
    add: [SECTION_IDS.integrations, SECTION_IDS.results, SECTION_IDS.socialProof],
    required: [SECTION_IDS.features],
    forbidden: [],
    prioritize: [SECTION_IDS.results, SECTION_IDS.integrations, SECTION_IDS.socialProof],
    description: "E-commerce: Revenue proof - show GMV/sales results"
  }
};

// ===== AUDIENCE-BASED MODIFIERS =====
const AUDIENCE_MODIFIERS: Record<string, { add: string[], prioritize: string[] }> = {
  "founders": {
    add: [SECTION_IDS.founderNote],
    prioritize: [SECTION_IDS.founderNote, SECTION_IDS.problem]
  },
  "enterprise": {
    add: [SECTION_IDS.security, SECTION_IDS.integrations],
    prioritize: [SECTION_IDS.security, SECTION_IDS.socialProof]
  },
  "developers": {
    add: [SECTION_IDS.integrations, SECTION_IDS.howItWorks],
    prioritize: [SECTION_IDS.integrations, SECTION_IDS.howItWorks]
  },
  "marketers": {
    add: [SECTION_IDS.results, SECTION_IDS.useCases],
    prioritize: [SECTION_IDS.results, SECTION_IDS.features]
  },
  "students": {
    add: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks],
    prioritize: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks, SECTION_IDS.results]
  },
  "freelancers": {
    add: [SECTION_IDS.results, SECTION_IDS.testimonials],
    prioritize: [SECTION_IDS.results, SECTION_IDS.features, SECTION_IDS.testimonials]
  },
  "families": {
    add: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks],
    prioritize: [SECTION_IDS.testimonials, SECTION_IDS.howItWorks, SECTION_IDS.socialProof]
  },
  "gamers": {
    add: [SECTION_IDS.socialProof, SECTION_IDS.features],
    prioritize: [SECTION_IDS.socialProof, SECTION_IDS.features, SECTION_IDS.howItWorks]
  }
};

// ===== SECTION PRIORITY HIERARCHY =====
const SECTION_PRIORITIES: Record<string, { tier: number, profiles: string[] }> = {
  [SECTION_IDS.hero]: { tier: 1, profiles: ["all"] },
  [SECTION_IDS.cta]: { tier: 1, profiles: ["all"] },
  [SECTION_IDS.objectionHandling]: { tier: 1, profiles: ["skeptical", "enterprise"] },
  [SECTION_IDS.problem]: { tier: 1, profiles: ["unaware", "problem-aware"] },
  
  [SECTION_IDS.uniqueMechanism]: { tier: 2, profiles: ["competitive"] },
  [SECTION_IDS.comparisonTable]: { tier: 2, profiles: ["competitive"] },
  [SECTION_IDS.results]: { tier: 2, profiles: ["skeptical", "enterprise"] },
  [SECTION_IDS.testimonials]: { tier: 2, profiles: ["skeptical"] },
  [SECTION_IDS.socialProof]: { tier: 2, profiles: ["enterprise", "skeptical"] },
  [SECTION_IDS.features]: { tier: 2, profiles: ["feature-focused"] },
  [SECTION_IDS.pricing]: { tier: 2, profiles: ["ready-to-buy"] },
  
  [SECTION_IDS.security]: { tier: 3, profiles: ["enterprise"] },
  [SECTION_IDS.integrations]: { tier: 3, profiles: ["enterprise", "technical"] },
  [SECTION_IDS.howItWorks]: { tier: 3, profiles: ["unaware", "technical"] },
  [SECTION_IDS.useCases]: { tier: 3, profiles: ["business-focused"] },
  
  [SECTION_IDS.founderNote]: { tier: 4, profiles: ["early-stage", "founders"] },
  [SECTION_IDS.faq]: { tier: 4, profiles: ["all"] },
  [SECTION_IDS.beforeAfter]: { tier: 4, profiles: ["visual-focused"] }
};

// ===== GOAL-BASED SECTION CAPS =====
/**
 * Dynamic section caps based on landing page goal conversion friction
 * Lower friction goals (waitlist) = fewer sections needed
 * Higher friction goals (enterprise) = more comprehensive proof needed
 */
const GOAL_BASED_SECTION_CAPS: Record<LandingGoalType, number> = {
  // Low friction goals (5-6 sections)
  'waitlist': 6,           // Just email signup - minimal convincing needed
  'early-access': 6,       // Similar low commitment
  'join-community': 6,     // Soft engagement
  'watch-video': 5,        // Minimal friction - just viewing content

  // Medium friction goals (7 sections)
  'signup': 7,             // Account creation - moderate proof needed
  'free-trial': 7,         // Trial signup - balanced approach
  'download': 7,           // App installation - moderate commitment

  // High friction goals (8 sections)
  'demo': 8,               // Demo request - needs comprehensive case
  'book-call': 8,          // Call booking - high commitment barrier
  'contact-sales': 8,      // Enterprise sales - maximum proof stack
  'buy-now': 8,            // Purchase decision - full justification
  'subscribe': 8,          // Recurring payment - strong proof needed
};

// ===== SOPHISTICATION APPLICATION LOGIC =====

/**
 * Apply market sophistication modifiers to base awareness flow (Phase 3).
 *
 * RULES 2.1-2.3: Sophistication determines WHEN and HOW to differentiate.
 * - Level 1-2: Keep simple, education-focused
 * - Level 3: Add differentiation early (uniqueMechanism position 2-4)
 * - Level 4-5: Lead with credibility, heavy proof stack
 */
function applySophisticationModifiers(
  sections: string[],
  sophistication: MarketSophisticationLevel,
  awarenessLevel: AwarenessLevel
): string[] {
  const modifier = SOPHISTICATION_MODIFIERS[sophistication];

  if (!modifier) {
    logger.warn(`⚠️ No sophistication modifier found for level: ${sophistication}`);
    return sections;
  }

  logger.dev(`🎯 Applying sophistication modifiers: ${sophistication}`);
  logger.dev(`   ${modifier.description}`);

  let modifiedSections = [...sections];

  // Add sections specified by sophistication level
  modifier.addSections.forEach(sectionToAdd => {
    if (!modifiedSections.includes(sectionToAdd)) {
      // Position the section according to sophistication positioning rules
      const positioning = modifier.positioning[sectionToAdd];

      if (positioning === 'early') {
        // Insert after hero (position 2-3)
        const heroIndex = modifiedSections.indexOf(SECTION_IDS.hero);
        const insertIndex = heroIndex !== -1 ? heroIndex + 1 : 1;
        modifiedSections.splice(insertIndex, 0, sectionToAdd);
        logger.dev(`   ✅ Added ${sectionToAdd} at early position (${insertIndex})`);
      } else if (positioning === 'late') {
        // Insert before CTA
        const ctaIndex = modifiedSections.indexOf(SECTION_IDS.cta);
        const insertIndex = ctaIndex !== -1 ? ctaIndex : modifiedSections.length;
        modifiedSections.splice(insertIndex, 0, sectionToAdd);
        logger.dev(`   ✅ Added ${sectionToAdd} at late position (before CTA)`);
      } else {
        // Middle - add after features or in middle of array
        const featuresIndex = modifiedSections.indexOf(SECTION_IDS.features);
        if (featuresIndex !== -1) {
          modifiedSections.splice(featuresIndex + 1, 0, sectionToAdd);
          logger.dev(`   ✅ Added ${sectionToAdd} at middle position (after features)`);
        } else {
          const middleIndex = Math.floor(modifiedSections.length / 2);
          modifiedSections.splice(middleIndex, 0, sectionToAdd);
          logger.dev(`   ✅ Added ${sectionToAdd} at middle position (${middleIndex})`);
        }
      }
    }
  });

  return modifiedSections;
}

// ===== INTERSECTION OVERRIDE RULES =====

/**
 * RULE 7.1: Problem-Aware Flows Must Include Problem Section Early
 *
 * When awarenessLevel is "problem-aware", the problem section MUST be included
 * at position 2 or 3 (after hero) for emotional validation before solution discussion.
 *
 * This is the HIGHEST PRIORITY rule - overrides all other considerations.
 */
function enforceProblemAwareRule(sections: string[], awarenessLevel: AwarenessLevel): string[] {
  if (awarenessLevel !== 'problem-aware') return sections;

  const heroIndex = sections.indexOf(SECTION_IDS.hero);
  const problemIndex = sections.indexOf(SECTION_IDS.problem);

  // If problem section doesn't exist, add it after hero
  if (problemIndex === -1) {
    const insertPosition = heroIndex !== -1 ? heroIndex + 1 : 0;
    sections.splice(insertPosition, 0, SECTION_IDS.problem);
    logger.dev(`✅ RULE 7.1: Added problem section for problem-aware flow at position ${insertPosition}`);
    return sections;
  }

  // If problem section exists but is too late (position > 3), move it early
  if (problemIndex > 3) {
    const movedSection = sections.splice(problemIndex, 1)[0];
    const insertPosition = heroIndex !== -1 ? heroIndex + 1 : 0;
    sections.splice(insertPosition, 0, movedSection);
    logger.dev(`✅ RULE 7.1: Moved problem section earlier for problem-aware flow (was at ${problemIndex}, now at ${insertPosition})`);
  }

  return sections;
}

/**
 * RULE 7.2: MVP Stage Hard Constraint - Never Allow Results Section
 *
 * MVP stages (pre-mvp, mvp-development, mvp-launched) CANNOT generate credible
 * results. Generic AI-generated metrics hurt credibility.
 *
 * This is a HARD CONSTRAINT - cannot be overridden even if results made it through
 * other filters. We substitute with beforeAfter (vision-based) instead.
 */
function enforceMVPStageConstraints(sections: string[], startupStage: StartupStage): string[] {
  const mvpStages: StartupStage[] = ['pre-mvp', 'problem-exploration', 'mvp-development', 'mvp-launched'];

  if (!mvpStages.includes(startupStage)) return sections;

  const resultsIndex = sections.indexOf(SECTION_IDS.results);

  // If results section exists, remove it and substitute with beforeAfter (if not already present)
  if (resultsIndex !== -1) {
    sections.splice(resultsIndex, 1);
    logger.dev('❌ RULE 7.2: Removed results section for MVP stage:', startupStage);

    // Add beforeAfter as substitute if not present (vision-based trust building)
    if (!sections.includes(SECTION_IDS.beforeAfter)) {
      sections.splice(resultsIndex, 0, SECTION_IDS.beforeAfter);
      logger.dev('✅ RULE 7.2: Substituted results with beforeAfter for MVP stage');
    }
  }

  return sections;
}

/**
 * RULE 7.3: Free Trial Goal - No Comparison Table
 *
 * Free trial users can test the product themselves, so comparison tables create
 * unnecessary decision paralysis. The message says "just try it" but comparison
 * structure says "make a serious decision" - creates cognitive dissonance.
 *
 * Applies to: free-trial, signup goals
 */
function enforceFreeTrialRule(sections: string[], landingGoal: LandingGoalType): string[] {
  const lowFrictionGoals: LandingGoalType[] = ['free-trial', 'signup'];

  if (!lowFrictionGoals.includes(landingGoal)) return sections;

  const comparisonIndex = sections.indexOf(SECTION_IDS.comparisonTable);

  if (comparisonIndex !== -1) {
    sections.splice(comparisonIndex, 1);
    logger.dev('❌ RULE 7.3: Removed comparison table for free-trial/signup goal:', landingGoal);
    logger.dev('   Reason: Users can test themselves - comparison creates decision paralysis');
  }

  return sections;
}

/**
 * RULE 7.4: Personal Category - No Comparison Table
 *
 * Personal Productivity Tools and Health & Wellness categories use a PERSONAL
 * mental model ("Will this work for ME?") rather than analytical comparison.
 * Comparison tables feel too corporate/analytical for personal decisions.
 *
 * Applies to: Personal Productivity Tools, Health & Wellness
 */
function enforcePersonalCategoryRule(sections: string[], marketCategory: string): string[] {
  const personalCategories = [
    'Personal Productivity Tools',
    'Health & Wellness',
    'Fitness & Exercise',
    'Mental Health & Mindfulness',
    'Personal Finance Management'
  ];

  const isPersonalCategory = personalCategories.some(category =>
    marketCategory.includes(category) || category.includes(marketCategory)
  );

  if (!isPersonalCategory) return sections;

  const comparisonIndex = sections.indexOf(SECTION_IDS.comparisonTable);

  if (comparisonIndex !== -1) {
    sections.splice(comparisonIndex, 1);
    logger.dev('❌ RULE 7.4: Removed comparison table for personal category:', marketCategory);
    logger.dev('   Reason: Personal mental model conflicts with analytical comparison');
  }

  return sections;
}

/**
 * RULE 7.5 & 7.6: Complex Intersection Overrides
 *
 * Specific combinations of awareness + sophistication + stage + goal that need
 * custom-optimized flows. These override the base flow composition.
 */
interface ComplexIntersection {
  matches: (input: FlowInput) => boolean;
  override: string[];
  reasoning: string;
}

const COMPLEX_INTERSECTIONS: ComplexIntersection[] = [
  // Rule 7.5: Problem-aware + Level-3 + MVP + Free-trial
  {
    matches: (input) =>
      input.awarenessLevel === 'problem-aware' &&
      input.marketSophisticationLevel === 'level-3' &&
      ['pre-mvp', 'mvp-development', 'mvp-launched'].includes(input.startupStage) &&
      ['free-trial', 'signup'].includes(input.landingGoal),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.problem,
      SECTION_IDS.beforeAfter,
      SECTION_IDS.features,
      SECTION_IDS.howItWorks,
      SECTION_IDS.founderNote,
      SECTION_IDS.cta
    ],
    reasoning: 'Problem-aware MVP free-trial: Focus on problem validation → vision → simple capabilities → founder trust'
  },

  // Rule 7.6: Solution-aware + Level-4 + Scaling + Buy-now
  {
    matches: (input) =>
      input.awarenessLevel === 'solution-aware' &&
      ['level-4', 'level-5'].includes(input.marketSophisticationLevel) &&
      ['users-500-1k', 'users-1k-5k', 'mrr-growth', 'seed-funded', 'series-b'].includes(input.startupStage) &&
      ['buy-now', 'subscribe'].includes(input.landingGoal),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.socialProof,
      SECTION_IDS.uniqueMechanism,
      SECTION_IDS.results,
      SECTION_IDS.features,
      SECTION_IDS.testimonials,
      SECTION_IDS.pricing,
      SECTION_IDS.objectionHandling,
      SECTION_IDS.cta
    ],
    reasoning: 'Solution-aware scaling buy-now: Credibility first → differentiation → comprehensive proof stack'
  },

  // Product-aware + Enterprise + Contact-sales
  {
    matches: (input) =>
      input.awarenessLevel === 'product-aware' &&
      input.landingGoal === 'contact-sales' &&
      (input.targetAudience.includes('enterprise') || input.targetAudience.includes('b2b')),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.socialProof,
      SECTION_IDS.security,
      SECTION_IDS.features,
      SECTION_IDS.integrations,
      SECTION_IDS.results,
      SECTION_IDS.objectionHandling,
      SECTION_IDS.testimonials,
      SECTION_IDS.cta
    ],
    reasoning: 'Product-aware enterprise: Trust → security → technical fit → proof → objections'
  },

  // Most-aware + Any-stage + High-friction
  {
    matches: (input) =>
      input.awarenessLevel === 'most-aware' &&
      ['buy-now', 'subscribe', 'book-call', 'demo'].includes(input.landingGoal),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.pricing,
      SECTION_IDS.testimonials,
      SECTION_IDS.objectionHandling,
      SECTION_IDS.faq,
      SECTION_IDS.cta
    ],
    reasoning: 'Most-aware high-friction: Fast track to offer → quick confidence → remove barriers'
  },

  // Unaware + MVP + Waitlist
  {
    matches: (input) =>
      input.awarenessLevel === 'unaware' &&
      ['pre-mvp', 'mvp-development'].includes(input.startupStage) &&
      ['waitlist', 'early-access'].includes(input.landingGoal),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.problem,
      SECTION_IDS.beforeAfter,
      SECTION_IDS.howItWorks,
      SECTION_IDS.founderNote,
      SECTION_IDS.cta
    ],
    reasoning: 'Unaware MVP waitlist: Identify problem → show vision → explain approach → founder credibility'
  },

  // Problem-aware + Health/Wellness + Personal
  {
    matches: (input) =>
      input.awarenessLevel === 'problem-aware' &&
      (input.marketCategory.includes('Health') || input.marketCategory.includes('Wellness') || input.marketCategory.includes('Fitness')),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.problem,
      SECTION_IDS.beforeAfter,
      SECTION_IDS.results,
      SECTION_IDS.testimonials,
      SECTION_IDS.howItWorks,
      SECTION_IDS.cta
    ],
    reasoning: 'Problem-aware health/wellness: Emotional validation → visual transformation → real stories'
  },

  // Solution-aware + Developer-tools + Technical-audience
  {
    matches: (input) =>
      input.awarenessLevel === 'solution-aware' &&
      (input.marketCategory.includes('Developer') || input.marketCategory.includes('API')) &&
      (input.targetAudience.includes('developer') || input.targetAudience.includes('engineer')),
    override: [
      SECTION_IDS.hero,
      SECTION_IDS.uniqueMechanism,
      SECTION_IDS.howItWorks,
      SECTION_IDS.integrations,
      SECTION_IDS.features,
      SECTION_IDS.socialProof,
      SECTION_IDS.cta
    ],
    reasoning: 'Solution-aware developer tools: Technical differentiation → how it works → integrations → adoption proof'
  }
];

/**
 * Apply complex intersection overrides if any match
 */
function applyComplexIntersectionOverrides(sections: string[], input: FlowInput): string[] {
  // Check each complex intersection for match
  for (const intersection of COMPLEX_INTERSECTIONS) {
    if (intersection.matches(input)) {
      logger.dev(`🎯 COMPLEX INTERSECTION MATCH: ${intersection.reasoning}`);
      logger.dev(`   Applying custom-optimized flow override`);

      // Return the override flow (but keep any sections from base flow that aren't in override)
      const overrideSections = intersection.override.filter(s => sections.includes(s) || intersection.override.includes(s));

      // Add any critical sections from base flow that might be missing
      const criticalSections = [SECTION_IDS.hero, SECTION_IDS.cta];
      criticalSections.forEach(section => {
        if (!overrideSections.includes(section) && sections.includes(section)) {
          if (section === SECTION_IDS.hero) {
            overrideSections.unshift(section);
          } else {
            overrideSections.push(section);
          }
        }
      });

      return overrideSections;
    }
  }

  // No complex intersection match - return sections unchanged
  return sections;
}

// ===== MAIN FUNCTION =====
export function getSectionsFromObjectionFlows(input: FlowInput): string[] {

  // Step 1: Check for complex intersection overrides (Phase 9)
  // These override everything else for specific high-value combinations
  const baseFlow = getBaseObjectionFlow(input.awarenessLevel, input.marketSophisticationLevel);
  const maybeOverridden = applyComplexIntersectionOverrides(baseFlow.sections, input);

  // If complex intersection matched, it provides a complete flow - still apply stage constraints
  const usingComplexOverride = maybeOverridden !== baseFlow.sections;

  // Step 2: Apply market sophistication modifiers (Phase 3)
  // Skip if complex override was applied (it already optimized for sophistication)
  const sophisticationAdjustedFlow = usingComplexOverride
    ? maybeOverridden
    : applySophisticationModifiers(
        maybeOverridden,
        input.marketSophisticationLevel,
        input.awarenessLevel
      );

  // Step 3: Apply stage-based substitutions (always apply - ensures no impossible sections)
  const stageAdjustedFlow = applyStageSubstitutions(sophisticationAdjustedFlow, input.startupStage);

  // Step 4: Apply goal modifiers (skip if complex override - it's already optimized)
  const goalAdjustedFlow = usingComplexOverride
    ? stageAdjustedFlow
    : applyGoalModifiers(stageAdjustedFlow, input.landingGoal);

  // Step 5: Apply category modifiers (Phase 6) (skip if complex override)
  const categoryAdjustedFlow = usingComplexOverride
    ? goalAdjustedFlow
    : applyCategoryModifiers(goalAdjustedFlow, input.marketCategory);

  // Step 6: Apply audience modifiers (skip if complex override)
  const audienceAdjustedFlow = usingComplexOverride
    ? categoryAdjustedFlow
    : applyAudienceModifiers(categoryAdjustedFlow, input.targetAudience);

  // Step 7: Apply simple intersection override rules (skip if complex override - already handled)
  // RULE 7.1: Problem-aware flows MUST have problem section early
  const withProblemAwareRule = usingComplexOverride
    ? audienceAdjustedFlow
    : enforceProblemAwareRule(audienceAdjustedFlow, input.awarenessLevel);

  // RULE 7.2: MVP stages NEVER get results section (ALWAYS APPLY - stage constraint)
  const withMVPConstraints = enforceMVPStageConstraints(withProblemAwareRule, input.startupStage);

  // RULE 7.3: Free trial/signup goals exclude comparison table (ALWAYS APPLY - goal constraint)
  const withFreeTrialRule = enforceFreeTrialRule(withMVPConstraints, input.landingGoal);

  // RULE 7.4: Personal categories exclude comparison table (ALWAYS APPLY - category constraint)
  const withPersonalCategoryRule = enforcePersonalCategoryRule(withFreeTrialRule, input.marketCategory);

  // Step 8: Always add FAQ (copywriter best practice)
  const withFAQ = addFAQSection(withPersonalCategoryRule);

  // Step 9: Apply section cap with smart prioritization
  const finalFlow = applySectionCap(withFAQ, input);

  // Step 10: Order sections properly
  const orderedFlow = orderSections(finalFlow);

  // Step 11: Add header at the beginning and footer at the end
  const withHeaderFooter = ['header', ...orderedFlow, 'footer'];

  return withHeaderFooter;
}

// ===== HELPER FUNCTIONS =====

/**
 * Get base objection flow using awareness-first approach (Phase 2 implementation).
 *
 * RULE: Awareness level determines the STARTING POINT of the mental journey.
 * Sophistication modifiers are applied separately to adjust this base flow.
 */
function getBaseObjectionFlow(awareness: AwarenessLevel, sophistication: MarketSophisticationLevel): ObjectionFlow {
  // NEW APPROACH: Use awareness base flows (Phase 2)
  const baseFlow = AWARENESS_BASE_FLOWS[awareness];

  if (baseFlow) {
    logger.dev(`✅ Using awareness base flow: ${awareness}`);
    return { ...baseFlow, sections: [...baseFlow.sections] }; // Clone to avoid mutation
  }

  // FALLBACK: Use legacy templates during transition
  const flowKey = `${awareness}+${sophistication}`;
  logger.warn(`⚠️ Awareness base flow not found for ${awareness}, falling back to legacy template: ${flowKey}`);

  if (OBJECTION_FLOWS[flowKey]) {
    return { ...OBJECTION_FLOWS[flowKey], sections: [...OBJECTION_FLOWS[flowKey].sections] };
  }

  // Use fallback mapping
  const fallbackKey = FALLBACK_MAPPINGS[flowKey];
  if (fallbackKey && OBJECTION_FLOWS[fallbackKey]) {
    logger.warn(`⚠️ Using fallback mapping: ${flowKey} → ${fallbackKey}`);
    return { ...OBJECTION_FLOWS[fallbackKey], sections: [...OBJECTION_FLOWS[fallbackKey].sections] };
  }

  // Ultimate fallback - use problem-aware base
  logger.warn(`⚠️ No flow found for ${flowKey}, using problem-aware base flow`);
  return { ...AWARENESS_BASE_FLOWS["problem-aware"], sections: [...AWARENESS_BASE_FLOWS["problem-aware"].sections] };
}

/**
 * Apply startup stage constraints with intelligent substitution.
 *
 * RULES 3.1-3.3: Stage determines proof availability - hard constraint.
 * Substitutions maintain objection coverage by replacing unavailable sections
 * with credible alternatives.
 */
function applyStageSubstitutions(sections: string[], stage: StartupStage): string[] {
  const stageGroup = getStageGroup(stage);
  const availability = SECTION_AVAILABILITY[stageGroup];

  if (!availability) {
    logger.warn(`⚠️ No stage availability rules found for: ${stageGroup}`);
    return sections;
  }

  // Log stage constraints being applied
  if (availability.unavailable.length > 0) {
    logger.dev(`🚫 Stage constraints (${stageGroup}): ${availability.description}`);
    logger.dev(`   Unavailable sections: ${availability.unavailable.join(', ')}`);
  }

  const substitutedSections = sections.map(section => {
    if (availability.unavailable.includes(section)) {
      const substitute = availability.substitutions[section];
      if (substitute) {
        logger.dev(`   ↔️ Substituting ${section} → ${substitute}`);
        return substitute;
      } else {
        // No substitution available - remove section
        logger.dev(`   ❌ Removing ${section} (no credible substitute for ${stageGroup})`);
        return null;
      }
    }
    return section;
  });

  // Filter out nulls and remove duplicates
  const filteredSections = substitutedSections.filter(s => s !== null) as string[];
  const uniqueSections = [...new Set(filteredSections)];

  // Log if substitutions created duplicates
  if (uniqueSections.length !== filteredSections.length) {
    const duplicatesRemoved = filteredSections.length - uniqueSections.length;
    logger.dev(`   🔄 Removed ${duplicatesRemoved} duplicate sections created by substitutions`);
  }

  return uniqueSections;
}

/**
 * Maps all startup stage values to constraint groups.
 *
 * RULE: Group stages by proof availability, not just by label.
 */
function getStageGroup(stage: StartupStage): string {
  // Pre-MVP group: Idea stage, no product yet
  if (['pre-mvp', 'problem-exploration'].includes(stage)) {
    return 'pre-mvp';
  }

  // MVP Development group: Building, not launched
  if (['mvp-development'].includes(stage)) {
    return 'mvp-development';
  }

  // MVP Launched group: Recently launched, limited proof
  if (['mvp-launched'].includes(stage)) {
    return 'mvp-launched';
  }

  // Early Feedback group: Some users, growing proof
  if (['early-feedback', 'problem-solution-fit', 'validated-early'].includes(stage)) {
    return 'early-feedback';
  }

  // Traction group: Clear product-market signals
  if ([
    'early-monetization',
    'building-v2',
    'targeting-pmf',
    'users-250-500'
  ].includes(stage)) {
    return 'traction';
  }

  // Growth group: Scaling up
  if ([
    'users-500-1k',
    'users-1k-5k',
    'mrr-growth',
    'seed-funded'
  ].includes(stage)) {
    return 'growth';
  }

  // Scale group: Established company
  if ([
    'series-b',
    'scaling-infra',
    'global-suite'
  ].includes(stage)) {
    return 'scale';
  }

  // Default to early-feedback for unknown stages
  logger.warn(`⚠️ Unknown startup stage: ${stage}, defaulting to early-feedback`);
  return 'early-feedback';
}

/**
 * Apply landing goal modifiers with forbidden and required sections.
 *
 * RULES 4.1-4.5: Goal determines objection depth and section requirements.
 * - Remove forbidden sections (wrong proof for this goal)
 * - Add required sections (essential for this goal)
 * - Add recommended sections (helpful for this goal)
 */
function applyGoalModifiers(sections: string[], goal: LandingGoalType): string[] {
  const modifier = GOAL_MODIFIERS[goal];
  if (!modifier) {
    logger.dev(`⚠️ No goal modifiers found for: ${goal}`);
    return sections;
  }

  logger.dev(`🎯 Applying goal modifiers: ${goal}`);
  logger.dev(`   ${modifier.description}`);

  let modifiedSections = [...sections];

  // Step 1: Remove forbidden sections
  if (modifier.forbidden.length > 0) {
    const beforeCount = modifiedSections.length;
    modifiedSections = modifiedSections.filter(section => !modifier.forbidden.includes(section));
    const removedCount = beforeCount - modifiedSections.length;
    if (removedCount > 0) {
      logger.dev(`   ❌ Removed ${removedCount} forbidden sections: ${modifier.forbidden.join(', ')}`);
    }
  }

  // Step 2: Add required sections (must be present)
  modifier.required.forEach(requiredSection => {
    if (!modifiedSections.includes(requiredSection)) {
      // Add at appropriate position
      const insertAfter = modifier.insertAfter?.[requiredSection];
      if (insertAfter) {
        const insertIndex = modifiedSections.indexOf(insertAfter);
        if (insertIndex !== -1) {
          modifiedSections.splice(insertIndex + 1, 0, requiredSection);
          logger.dev(`   ✅ Added required section ${requiredSection} after ${insertAfter}`);
        } else {
          modifiedSections.push(requiredSection);
          logger.dev(`   ✅ Added required section ${requiredSection} at end`);
        }
      } else {
        modifiedSections.push(requiredSection);
        logger.dev(`   ✅ Added required section ${requiredSection}`);
      }
    }
  });

  // Step 3: Add recommended sections (if not forbidden)
  modifier.add.forEach(sectionToAdd => {
    if (!modifiedSections.includes(sectionToAdd) && !modifier.forbidden.includes(sectionToAdd)) {
      const insertAfter = modifier.insertAfter?.[sectionToAdd];
      if (insertAfter) {
        const insertIndex = modifiedSections.indexOf(insertAfter);
        if (insertIndex !== -1) {
          modifiedSections.splice(insertIndex + 1, 0, sectionToAdd);
          logger.dev(`   + Added recommended section ${sectionToAdd} after ${insertAfter}`);
        } else {
          modifiedSections.push(sectionToAdd);
          logger.dev(`   + Added recommended section ${sectionToAdd} at end`);
        }
      } else {
        modifiedSections.push(sectionToAdd);
        logger.dev(`   + Added recommended section ${sectionToAdd}`);
      }
    }
  });

  return modifiedSections;
}

function applyAudienceModifiers(sections: string[], targetAudience: string): string[] {
  let modifiedSections = [...sections];

  // Extract audience type from detailed audience string
  const audienceType = extractAudienceType(targetAudience);
  const modifier = AUDIENCE_MODIFIERS[audienceType];

  if (!modifier) return sections;

  // Add sections that aren't already present
  modifier.add.forEach(sectionToAdd => {
    if (!modifiedSections.includes(sectionToAdd)) {
      modifiedSections.push(sectionToAdd);
    }
  });

  return modifiedSections;
}

function extractAudienceType(targetAudience: string): string {
  if (targetAudience.includes('founder')) return 'founders';
  if (targetAudience.includes('enterprise')) return 'enterprise';
  if (targetAudience.includes('developer')) return 'developers';
  if (targetAudience.includes('marketer')) return 'marketers';
  return 'general';
}

/**
 * Apply category-based modifiers with mental model awareness.
 *
 * RULES 5.1-5.5: Category determines mental model and proof types.
 * - Personal categories: Emotional/experiential - avoid analytical
 * - B2B categories: Analytical/technical - show integration/security
 * - Regulated categories: Compliance first
 */
function applyCategoryModifiers(sections: string[], marketCategory: string): string[] {
  // Find matching category modifier (exact match or fuzzy match)
  let modifier = CATEGORY_MODIFIERS[marketCategory];

  // If no exact match, try fuzzy matching for common variations
  if (!modifier) {
    for (const [category, categoryModifier] of Object.entries(CATEGORY_MODIFIERS)) {
      if (marketCategory.includes(category) || category.includes(marketCategory)) {
        modifier = categoryModifier;
        break;
      }
    }
  }

  if (!modifier) {
    logger.dev(`⚠️ No category modifiers found for: ${marketCategory}`);
    return sections;
  }

  logger.dev(`🏷️ Applying category modifiers: ${marketCategory}`);
  logger.dev(`   ${modifier.description}`);

  let modifiedSections = [...sections];

  // Step 1: Remove forbidden sections (wrong mental model)
  if (modifier.forbidden.length > 0) {
    const beforeCount = modifiedSections.length;
    modifiedSections = modifiedSections.filter(section => !modifier.forbidden.includes(section));
    const removedCount = beforeCount - modifiedSections.length;
    if (removedCount > 0) {
      logger.dev(`   ❌ Removed ${removedCount} forbidden sections: ${modifier.forbidden.join(', ')}`);
    }
  }

  // Step 2: Add required sections (essential for this category)
  modifier.required.forEach(requiredSection => {
    if (!modifiedSections.includes(requiredSection)) {
      modifiedSections.push(requiredSection);
      logger.dev(`   ✅ Added required section ${requiredSection}`);
    }
  });

  // Step 3: Add recommended sections
  modifier.add.forEach(sectionToAdd => {
    if (!modifiedSections.includes(sectionToAdd) && !modifier.forbidden.includes(sectionToAdd)) {
      modifiedSections.push(sectionToAdd);
      logger.dev(`   + Added recommended section ${sectionToAdd}`);
    }
  });

  return modifiedSections;
}

function addFAQSection(sections: string[]): string[] {
  // Add FAQ if not already present and no dedicated objection handling
  if (!sections.includes(SECTION_IDS.faq) && !sections.includes(SECTION_IDS.objectionHandling)) {
    const ctaIndex = sections.indexOf(SECTION_IDS.cta);
    if (ctaIndex !== -1) {
      sections.splice(ctaIndex, 0, SECTION_IDS.faq);
    } else {
      sections.push(SECTION_IDS.faq);
    }
  }
  return sections;
}

function applySectionCap(sections: string[], input: FlowInput): string[] {
  // Get dynamic section cap based on landing goal conversion friction
  const sectionCap = GOAL_BASED_SECTION_CAPS[input.landingGoal] || 7; // Default to 7 for unmapped goals

  if (sections.length <= sectionCap) return sections;

  logger.dev(`📊 Applying goal-based section cap: ${input.landingGoal} → ${sectionCap} sections (from ${sections.length})`);

  // Determine user profile for prioritization
  const userProfile = determineUserProfile(input);

  // Score each section based on priority for this profile
  const sectionScores = sections.map(section => ({
    section,
    score: calculateSectionScore(section, userProfile)
  }));

  // Sort by score (highest first) and take top N based on goal
  sectionScores.sort((a, b) => b.score - a.score);
  const cappedSections = sectionScores.slice(0, sectionCap).map(item => item.section);

  logger.dev(`✂️ Sections after cap: ${cappedSections.join(', ')}`);

  return cappedSections;
}

function determineUserProfile(input: FlowInput): string[] {
  const profiles: string[] = [];
  
  // Awareness-based profiles
  if (input.awarenessLevel === 'unaware') profiles.push('unaware');
  if (input.awarenessLevel === 'problem-aware') profiles.push('problem-aware');
  
  // Sophistication-based profiles
  if (['level-4', 'level-5'].includes(input.marketSophisticationLevel)) profiles.push('skeptical');
  if (['level-3', 'level-4'].includes(input.marketSophisticationLevel)) profiles.push('competitive');
  
  // Goal-based profiles
  if (['contact-sales', 'book-call'].includes(input.landingGoal)) profiles.push('enterprise');
  if (['buy-now', 'subscribe', 'pricing'].includes(input.landingGoal)) profiles.push('ready-to-buy');
  
  // Audience-based profiles
  if (input.targetAudience.includes('enterprise')) profiles.push('enterprise');
  if (input.targetAudience.includes('founder')) profiles.push('founders');
  if (input.targetAudience.includes('developer')) profiles.push('technical');
  
  // Stage-based profiles
  if (['pre-mvp', 'mvp-development'].includes(input.startupStage)) profiles.push('early-stage');
  
  return profiles;
}

function calculateSectionScore(section: string, userProfiles: string[]): number {
  const sectionPriority = SECTION_PRIORITIES[section];
  if (!sectionPriority) return 0;
  
  let score = 0;
  
  // Base score by tier (lower tier = higher score)
  score += (5 - sectionPriority.tier) * 10;
  
  // Bonus for profile match
  const profileMatches = sectionPriority.profiles.filter(profile => 
    profile === 'all' || userProfiles.includes(profile)
  );
  score += profileMatches.length * 5;
  
  return score;
}

/**
 * PHASE 8: Flow-Aware Section Ordering (RULES 8.1 - 8.6)
 *
 * Orders sections to create optimal objection flow sequences.
 * Respects position rules, section pairing, and tonal consistency.
 */
function orderSections(sections: string[]): string[] {
  logger.dev('📐 Applying flow-aware section ordering...');

  // RULE 8.1: Fixed positions - hero always first, cta always last (after header/footer added)
  const fixedSections: string[] = [SECTION_IDS.hero, SECTION_IDS.cta];
  const remainingSections = sections.filter(s => !fixedSections.includes(s));

  // RULE 8.2: Position 3-4 (Early sections) - sets flow tone
  const earlySections: string[] = [SECTION_IDS.problem, SECTION_IDS.socialProof, SECTION_IDS.uniqueMechanism];
  const early = remainingSections.filter(s => earlySections.includes(s));
  const afterEarly = remainingSections.filter(s => !earlySections.includes(s));

  // RULE 8.3: Positions 5-7 (Middle sections) - educate → differentiate → prove
  const middleSections: string[] = [
    SECTION_IDS.beforeAfter,
    SECTION_IDS.features,
    SECTION_IDS.howItWorks,
    SECTION_IDS.useCases,
    SECTION_IDS.comparisonTable,
    SECTION_IDS.results,
    SECTION_IDS.integrations,
    SECTION_IDS.security
  ];
  const middle = afterEarly.filter(s => middleSections.includes(s));
  const afterMiddle = afterEarly.filter(s => !middleSections.includes(s));

  // RULE 8.4: Positions 8-9 (Late sections) - objection handling and final proof
  const lateSections: string[] = [
    SECTION_IDS.testimonials,
    SECTION_IDS.pricing,
    SECTION_IDS.objectionHandling,
    SECTION_IDS.faq,
    SECTION_IDS.founderNote
  ];
  const late = afterMiddle.filter(s => lateSections.includes(s));
  const remaining = afterMiddle.filter(s => !lateSections.includes(s));

  // Build initial ordered flow
  let orderedSections = [
    SECTION_IDS.hero,
    ...sortEarlySections(early),
    ...sortMiddleSections(middle),
    ...sortLateSections(late),
    ...remaining,
    SECTION_IDS.cta
  ].filter(s => sections.includes(s)); // Only include sections that exist

  // RULE 8.5: Apply section pairing rules
  orderedSections = applySectionPairingRules(orderedSections);

  logger.dev(`✅ Section ordering complete: ${orderedSections.join(' → ')}`);

  return orderedSections;
}

/**
 * Sort early sections (position 3-4) based on objection flow logic
 */
function sortEarlySections(sections: string[]): string[] {
  // Priority: socialProof > problem > uniqueMechanism
  const order: string[] = [SECTION_IDS.socialProof, SECTION_IDS.problem, SECTION_IDS.uniqueMechanism];
  return sections.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * Sort middle sections (position 5-7) based on educate → differentiate → prove flow
 */
function sortMiddleSections(sections: string[]): string[] {
  // Order: educate (beforeAfter, howItWorks) → differentiate (features, uniqueMechanism, comparison) → prove (results, integrations, security)
  const order: string[] = [
    SECTION_IDS.beforeAfter,
    SECTION_IDS.howItWorks,
    SECTION_IDS.features,
    SECTION_IDS.useCases,
    SECTION_IDS.comparisonTable,
    SECTION_IDS.integrations,
    SECTION_IDS.security,
    SECTION_IDS.results
  ];
  return sections.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * Sort late sections (position 8-9) - final proof and objection handling
 */
function sortLateSections(sections: string[]): string[] {
  // Order: testimonials → pricing → objectionHandling → faq → founderNote
  const order: string[] = [
    SECTION_IDS.testimonials,
    SECTION_IDS.pricing,
    SECTION_IDS.objectionHandling,
    SECTION_IDS.faq,
    SECTION_IDS.founderNote
  ];
  return sections.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * RULE 8.5: Apply section pairing rules for optimal objection flow
 *
 * - problem → beforeAfter (within 1-2 positions)
 * - uniqueMechanism → results/testimonials (within 2-3 positions)
 * - comparison → AFTER features and uniqueMechanism
 */
function applySectionPairingRules(sections: string[]): string[] {
  let orderedSections = [...sections];

  // Pairing 1: problem → beforeAfter (emotional validation)
  const problemIndex = orderedSections.indexOf(SECTION_IDS.problem);
  const beforeAfterIndex = orderedSections.indexOf(SECTION_IDS.beforeAfter);
  if (problemIndex !== -1 && beforeAfterIndex !== -1) {
    const distance = beforeAfterIndex - problemIndex;
    if (distance > 2 || distance < 0) {
      // Move beforeAfter closer to problem
      orderedSections.splice(beforeAfterIndex, 1);
      orderedSections.splice(problemIndex + 1, 0, SECTION_IDS.beforeAfter);
      logger.dev('   🔗 Paired problem → beforeAfter (emotional validation)');
    }
  }

  // Pairing 2: uniqueMechanism → results/testimonials (prove the mechanism works)
  const uniqueMechanismIndex = orderedSections.indexOf(SECTION_IDS.uniqueMechanism);
  const resultsIndex = orderedSections.indexOf(SECTION_IDS.results);
  const testimonialsIndex = orderedSections.indexOf(SECTION_IDS.testimonials);

  if (uniqueMechanismIndex !== -1) {
    const proofIndex = resultsIndex !== -1 ? resultsIndex : testimonialsIndex;
    if (proofIndex !== -1) {
      const distance = proofIndex - uniqueMechanismIndex;
      if (distance > 3 || distance < 0) {
        // Move proof closer to uniqueMechanism
        const proofSection = resultsIndex !== -1 ? SECTION_IDS.results : SECTION_IDS.testimonials;
        orderedSections.splice(proofIndex, 1);
        orderedSections.splice(uniqueMechanismIndex + 2, 0, proofSection);
        logger.dev(`   🔗 Paired uniqueMechanism → ${proofSection} (prove mechanism)`);
      }
    }
  }

  // Pairing 3: comparison → AFTER features and uniqueMechanism
  const comparisonIndex = orderedSections.indexOf(SECTION_IDS.comparisonTable);
  const featuresIndex = orderedSections.indexOf(SECTION_IDS.features);

  if (comparisonIndex !== -1 && (featuresIndex !== -1 || uniqueMechanismIndex !== -1)) {
    const requirementsSatisfied =
      (featuresIndex === -1 || comparisonIndex > featuresIndex) &&
      (uniqueMechanismIndex === -1 || comparisonIndex > uniqueMechanismIndex);

    if (!requirementsSatisfied) {
      // Move comparison after both features and uniqueMechanism
      const insertAfter = Math.max(
        featuresIndex !== -1 ? featuresIndex : -1,
        uniqueMechanismIndex !== -1 ? uniqueMechanismIndex : -1
      );
      orderedSections.splice(comparisonIndex, 1);
      orderedSections.splice(insertAfter + 1, 0, SECTION_IDS.comparisonTable);
      logger.dev('   🔗 Moved comparison AFTER features/uniqueMechanism (must understand before comparing)');
    }
  }

  return orderedSections;
}

// ===== SECTION SPACING CALCULATOR =====
/**
 * Calculate optimal spacing between sections based on:
 * - Content density of current and next section
 * - Position in the flow (breathing rhythm)
 * - Special rules (e.g., extra space before CTA)
 */
export function calculateSectionSpacing(sections: string[]): Record<string, SectionSpacing> {
  const spacingMap: Record<string, SectionSpacing> = {};
  const sectionMetaMap = new Map(sectionList.map(s => [s.id, s]));
  
  sections.forEach((sectionId, index) => {
    const currentSection = sectionMetaMap.get(sectionId);
    const nextSection = sections[index + 1] ? sectionMetaMap.get(sections[index + 1]) : null;
    const isLastSection = index === sections.length - 1;
    
    // Start with default spacing from section definition
    let spacing: SectionSpacing = currentSection?.defaultSpacingAfter || 'normal';
    
    // Apply smart spacing rules
    
    // Rule 1: Hero section always gets spacious spacing
    if (sectionId === SECTION_IDS.hero) {
      spacing = 'spacious';
    }
    
    // Rule 2: Extra space before CTA sections
    if (nextSection?.id === SECTION_IDS.cta || nextSection?.id === SECTION_IDS.closeSection) {
      spacing = 'extra';
    }
    
    // Rule 3: Compact spacing between light content sections
    if (currentSection?.contentDensity === 'light' && nextSection?.contentDensity === 'light') {
      spacing = 'compact';
    }
    
    // Rule 4: Spacious after heavy content sections
    if (currentSection?.contentDensity === 'heavy') {
      spacing = 'spacious';
    }
    
    // Rule 5: Create breathing rhythm - every 3rd section gets spacious
    if ((index + 1) % 3 === 0 && spacing !== 'extra') {
      spacing = 'spacious';
    }
    
    // Rule 6: Social proof gets compact spacing (it's usually brief)
    if (sectionId === SECTION_IDS.socialProof) {
      spacing = 'compact';
    }
    
    // Rule 7: Pricing and FAQ need more breathing room
    if (sectionId === SECTION_IDS.pricing || sectionId === SECTION_IDS.faq) {
      spacing = 'spacious';
    }
    
    // Rule 8: Last section doesn't need spacing after it
    if (isLastSection) {
      spacing = 'normal';
    }
    
    // Rule 9: Consecutive sections with same background get compact spacing
    if (currentSection?.background === nextSection?.background && 
        currentSection?.background !== 'primary-highlight') {
      spacing = 'compact';
    }
    
    spacingMap[sectionId] = spacing;
  });
  
  return spacingMap;
}