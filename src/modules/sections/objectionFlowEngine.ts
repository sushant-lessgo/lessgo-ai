// objectionFlowEngine.ts - ✅ FIXED: Uses centralized taxonomy types
import { sectionList, type SectionSpacing } from "./sectionList";
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

// ===== CORE OBJECTION FLOWS (9 MAIN COMBINATIONS) =====
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
    sections: [SECTION_IDS.hero, SECTION_IDS.uniqueMechanism, SECTION_IDS.features, SECTION_IDS.comparisonTable, SECTION_IDS.results, SECTION_IDS.testimonials, SECTION_IDS.cta],
    reasoning: "Known problem, crowded market - focus on differentiation",
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

// ===== STAGE-BASED SECTION AVAILABILITY =====
const SECTION_AVAILABILITY: Record<string, { unavailable: string[], substitutions: Record<string, string> }> = {
  "pre-mvp": {
    unavailable: [SECTION_IDS.testimonials, SECTION_IDS.pricing, SECTION_IDS.results],
    substitutions: {
      [SECTION_IDS.testimonials]: SECTION_IDS.founderNote,
      [SECTION_IDS.pricing]: SECTION_IDS.problem,
      [SECTION_IDS.results]: SECTION_IDS.beforeAfter
    }
  },
  "mvp-development": {
    unavailable: [SECTION_IDS.testimonials, SECTION_IDS.pricing],
    substitutions: {
      [SECTION_IDS.testimonials]: SECTION_IDS.founderNote,
      [SECTION_IDS.pricing]: SECTION_IDS.features
    }
  },
  "mvp-launched": {
    unavailable: [SECTION_IDS.pricing],
    substitutions: {
      [SECTION_IDS.pricing]: SECTION_IDS.features
    }
  },
  "early-feedback": {
    unavailable: [],
    substitutions: {}
  }
};

// ===== GOAL-BASED MODIFIERS =====
const GOAL_MODIFIERS: Record<string, { add: string[], prioritize: string[], insertAfter?: Record<string, string> }> = {
  "buy-now": {
    add: [SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.pricing, SECTION_IDS.objectionHandling],
    insertAfter: { [SECTION_IDS.pricing]: SECTION_IDS.features }
  },
  "subscribe": {
    add: [SECTION_IDS.pricing],
    prioritize: [SECTION_IDS.pricing],
    insertAfter: { [SECTION_IDS.pricing]: SECTION_IDS.features }
  },
  "contact-sales": {
    add: [SECTION_IDS.security, SECTION_IDS.integrations],
    prioritize: [SECTION_IDS.socialProof, SECTION_IDS.results],
    insertAfter: { 
      [SECTION_IDS.security]: SECTION_IDS.features,
      [SECTION_IDS.integrations]: SECTION_IDS.security
    }
  },
  "book-call": {
    add: [SECTION_IDS.results, SECTION_IDS.objectionHandling],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.results],
    insertAfter: { [SECTION_IDS.objectionHandling]: SECTION_IDS.results }
  },
  "waitlist": {
    add: [SECTION_IDS.socialProof, SECTION_IDS.founderNote],
    prioritize: [SECTION_IDS.problem, SECTION_IDS.socialProof],
    insertAfter: { [SECTION_IDS.founderNote]: SECTION_IDS.problem }
  },
  "early-access": {
    add: [SECTION_IDS.socialProof, SECTION_IDS.founderNote],
    prioritize: [SECTION_IDS.uniqueMechanism, SECTION_IDS.socialProof],
    insertAfter: { [SECTION_IDS.founderNote]: SECTION_IDS.uniqueMechanism }
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

// ===== MAIN FUNCTION =====
export function getSectionsFromObjectionFlows(input: FlowInput): string[] {
  // console.log('🧠 Starting Objection Flow Analysis:', input);
  
  // Step 1: Get base flow
  const baseFlow = getBaseObjectionFlow(input.awarenessLevel, input.marketSophisticationLevel);
 // console.log('📋 Base Flow:', baseFlow);
  
  // Step 2: Apply stage-based substitutions
  const stageAdjustedFlow = applyStageSubstitutions(baseFlow.sections, input.startupStage);
 // console.log('🔄 Stage Adjusted:', stageAdjustedFlow);
  
  // Step 3: Apply goal modifiers
  const goalAdjustedFlow = applyGoalModifiers(stageAdjustedFlow, input.landingGoal);
  // console.log('🎯 Goal Adjusted:', goalAdjustedFlow);
  
  // Step 4: Apply audience modifiers
  const audienceAdjustedFlow = applyAudienceModifiers(goalAdjustedFlow, input.targetAudience);
  // console.log('👥 Audience Adjusted:', audienceAdjustedFlow);
  
  // Step 5: Always add FAQ (copywriter best practice)
  const withFAQ = addFAQSection(audienceAdjustedFlow);
 // console.log('❓ With FAQ:', withFAQ);
  
  // Step 6: Apply 8-section cap with smart prioritization
  const finalFlow = applySectionCap(withFAQ, input);
  // console.log('✂️ Final Capped Flow:', finalFlow);
  
  // Step 7: Order sections properly
  const orderedFlow = orderSections(finalFlow);
  // console.log('📊 Final Ordered Flow:', orderedFlow);
  
  // Step 8: Add header at the beginning and footer at the end
  const withHeaderFooter = ['header', ...orderedFlow, 'footer'];
  // console.log('🎯 With Header and Footer:', withHeaderFooter);
  
  return withHeaderFooter;
}

// ===== HELPER FUNCTIONS =====

function getBaseObjectionFlow(awareness: AwarenessLevel, sophistication: MarketSophisticationLevel): ObjectionFlow {
  const flowKey = `${awareness}+${sophistication}`;
  
  // Check if we have exact match
  if (OBJECTION_FLOWS[flowKey]) {
   // console.log(`✅ Found exact flow: ${flowKey}`);
    return OBJECTION_FLOWS[flowKey];
  }
  
  // Use fallback
  const fallbackKey = FALLBACK_MAPPINGS[flowKey];
  if (fallbackKey && OBJECTION_FLOWS[fallbackKey]) {
    // console.log(`🔄 Using fallback: ${flowKey} → ${fallbackKey}`);
    return OBJECTION_FLOWS[fallbackKey];
  }
  
  // Ultimate fallback
  console.warn(`⚠️ No flow found for ${flowKey}, using problem-aware+level-3`);
  return OBJECTION_FLOWS["problem-aware+level-3"];
}

function applyStageSubstitutions(sections: string[], stage: StartupStage): string[] {
  const stageGroup = getStageGroup(stage);
  const availability = SECTION_AVAILABILITY[stageGroup];
  
  if (!availability) return sections;
  
  const substitutedSections = sections.map(section => {
    if (availability.unavailable.includes(section)) {
      const substitute = availability.substitutions[section];
      if (substitute) {
      //  console.log(`🔄 Stage substitution: ${section} → ${substitute} (${stage})`);
        return substitute;
      }
    }
    return section;
  });
  
  // ✅ FIXED: Remove duplicates that might be created by substitutions
  const uniqueSections = [...new Set(substitutedSections)];
  
  if (uniqueSections.length !== substitutedSections.length) {
   // console.log(`🔧 Removed ${substitutedSections.length - uniqueSections.length} duplicate sections from substitutions`);
  }
  
  return uniqueSections;
}

function getStageGroup(stage: StartupStage): string {
  if (['pre-mvp', 'problem-exploration'].includes(stage)) return 'pre-mvp';
  if (['mvp-development'].includes(stage)) return 'mvp-development';
  if (['mvp-launched'].includes(stage)) return 'mvp-launched';
  return 'early-feedback'; // Default for later stages
}

function applyGoalModifiers(sections: string[], goal: LandingGoalType): string[] {
  const modifier = GOAL_MODIFIERS[goal];
  if (!modifier) return sections;
  
  let modifiedSections = [...sections];
  
  // Add new sections at appropriate positions
  modifier.add.forEach(sectionToAdd => {
    if (!modifiedSections.includes(sectionToAdd)) {
      const insertAfter = modifier.insertAfter?.[sectionToAdd];
      if (insertAfter) {
        const insertIndex = modifiedSections.indexOf(insertAfter);
        if (insertIndex !== -1) {
          modifiedSections.splice(insertIndex + 1, 0, sectionToAdd);
         // console.log(`➕ Goal modifier: Added ${sectionToAdd} after ${insertAfter}`);
        } else {
          modifiedSections.push(sectionToAdd);
         // console.log(`➕ Goal modifier: Added ${sectionToAdd} at end`);
        }
      } else {
        modifiedSections.push(sectionToAdd);
       // console.log(`➕ Goal modifier: Added ${sectionToAdd}`);
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
     // console.log(`👥 Audience modifier: Added ${sectionToAdd} for ${audienceType}`);
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

function addFAQSection(sections: string[]): string[] {
  // Add FAQ if not already present and no dedicated objection handling
  if (!sections.includes(SECTION_IDS.faq) && !sections.includes(SECTION_IDS.objectionHandling)) {
    const ctaIndex = sections.indexOf(SECTION_IDS.cta);
    if (ctaIndex !== -1) {
      sections.splice(ctaIndex, 0, SECTION_IDS.faq);
     // console.log(`❓ Added FAQ before CTA`);
    } else {
      sections.push(SECTION_IDS.faq);
     // console.log(`❓ Added FAQ at end`);
    }
  }
  return sections;
}

function applySectionCap(sections: string[], input: FlowInput): string[] {
  if (sections.length <= 8) return sections;
  
 // console.log(`✂️ Applying section cap: ${sections.length} → 8 sections`);
  
  // Determine user profile for prioritization
  const userProfile = determineUserProfile(input);
 // console.log(`👤 User profile: ${userProfile}`);
  
  // Score each section based on priority for this profile
  const sectionScores = sections.map(section => ({
    section,
    score: calculateSectionScore(section, userProfile)
  }));
  
  // Sort by score (highest first) and take top 8
  sectionScores.sort((a, b) => b.score - a.score);
  const cappedSections = sectionScores.slice(0, 8).map(item => item.section);
  
 // console.log('📊 Section priorities:', sectionScores.map(s => `${s.section}: ${s.score}`));
  
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

function orderSections(sections: string[]): string[] {
  // Get section order from sectionList
  const sectionOrderMap = new Map();
  sectionList.forEach((section, index) => {
    sectionOrderMap.set(section.id, section.order);
  });
  
  // Sort sections by their defined order
  return sections.sort((a, b) => {
    const orderA = sectionOrderMap.get(a) || 999;
    const orderB = sectionOrderMap.get(b) || 999;
    return orderA - orderB;
  });
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