// enhancedBackgroundLogic.ts - MIGRATED: Phase 5.2 - Canonical Type System Integration

import { sectionList } from '@/modules/sections/sectionList';

// ✅ PHASE 5.2: Import canonical types from central type system
import type { 
  InputVariables,
  HiddenInferredFields,
  LandingGoalType,
  TargetAudience,
  StartupStage,
  AwarenessLevel,
  MarketSophisticationLevel
} from '@/types/core/index';

// ✅ PHASE 5.2: Use canonical types instead of custom UserProfile interface
type UserProfile = Pick<InputVariables, 'landingPageGoals' | 'targetAudience' | 'startupStage'> & 
  Pick<HiddenInferredFields, 'awarenessLevel' | 'marketSophisticationLevel'>;

type SectionBackgroundType = 'primary' | 'secondary' | 'neutral' | 'divider';
type BaselineBackgroundType = 'primary-highlight' | 'secondary-highlight' | 'neutral' | 'divider-zone';

// ===== ENHANCED TEXT COLOR HELPER FUNCTIONS =====
// Import the new improved text color utilities
import { getSmartTextColor } from '@/utils/improvedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

export function getTextColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any
): { heading: string; body: string; muted: string } {
  // Get the background CSS for analysis
  const backgroundCSS = getBackgroundCSSForType(backgroundType, colorTokens);
  
  // Analyze the background using the new smart system
  const backgroundAnalysis = analyzeBackground(backgroundCSS);
  
  // Use smart text color selection
  return {
    heading: getSmartTextColor(backgroundAnalysis.dominantColor, 'heading'),
    body: getSmartTextColor(backgroundAnalysis.dominantColor, 'body'),
    muted: getSmartTextColor(backgroundAnalysis.dominantColor, 'muted')
  };
}

// Helper function to get background CSS for analysis
function getBackgroundCSSForType(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any
): string {
  switch(backgroundType) {
    case 'primary':
      return colorTokens.bgPrimary || colorTokens.textOnPrimary || 'bg-gradient-to-r from-blue-500 to-blue-600';
    case 'secondary':
      return colorTokens.bgSecondary || colorTokens.textOnSecondary || 'bg-blue-50';
    case 'neutral':
      return colorTokens.bgNeutral || colorTokens.textOnNeutral || 'bg-white';
    case 'divider':
      return colorTokens.bgDivider || colorTokens.textOnDivider || 'bg-gray-100/50';
    default:
      return 'bg-white';
  }
}

export function getBodyColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any
): string {
  const textColors = getTextColorForBackground(backgroundType, colorTokens);
  return textColors.body;
}

export function getMutedColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any
): string {
  const textColors = getTextColorForBackground(backgroundType, colorTokens);
  return textColors.muted;
}

// Enhanced function for heading colors
export function getHeadingColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any
): string {
  const textColors = getTextColorForBackground(backgroundType, colorTokens);
  return textColors.heading;
}

// ===== CONVERSION PRIORITY MATRIX =====
const CONVERSION_PRIORITIES: Record<string, {
  profiles: string[];
  tier: number; // 1=critical, 2=important, 3=supporting
  reasoning: string;
}> = {
  // Tier 1: Critical for conversion (can override rhythm)
  hero: { profiles: ['all'], tier: 1, reasoning: 'First impression determines bounce rate' },
  cta: { profiles: ['all'], tier: 1, reasoning: 'Final conversion moment' },
  problem: { profiles: ['unaware', 'problem-aware'], tier: 1, reasoning: 'Must establish problem for unaware users' },
  pricing: { profiles: ['buy-now', 'subscribe', 'ready-to-buy'], tier: 1, reasoning: 'Purchase decision critical' },
  
  // Tier 2: Important for specific users (respect rhythm when possible)
  uniqueMechanism: { profiles: ['competitive', 'solution-aware+level-3', 'solution-aware+level-4'], tier: 2, reasoning: 'Differentiation in competitive markets' },
  results: { profiles: ['skeptical', 'level-4', 'level-5', 'enterprise'], tier: 2, reasoning: 'Proof for skeptical buyers' },
  testimonials: { profiles: ['skeptical', 'level-4', 'level-5'], tier: 2, reasoning: 'Social proof for skeptical users' },
  objectionHandling: { profiles: ['skeptical', 'level-4', 'level-5'], tier: 2, reasoning: 'Address skeptical buyer concerns' },
  socialProof: { profiles: ['enterprise', 'skeptical'], tier: 2, reasoning: 'Market validation for enterprise' },
  security: { profiles: ['enterprise', 'contact-sales'], tier: 2, reasoning: 'Enterprise security requirements' },
  
  // Tier 3: Supporting content (maintain baseline, don't upgrade)
  features: { profiles: ['feature-focused'], tier: 3, reasoning: 'Feature details for specific audiences' },
  howItWorks: { profiles: ['unaware', 'technical'], tier: 3, reasoning: 'Process explanation' },
  integrations: { profiles: ['enterprise', 'technical'], tier: 3, reasoning: 'Implementation details' },
  useCases: { profiles: ['business-focused'], tier: 3, reasoning: 'Use case examples' },
  beforeAfter: { profiles: ['visual-focused'], tier: 3, reasoning: 'Transformation visualization' },
  comparisonTable: { profiles: ['competitive'], tier: 3, reasoning: 'Feature comparison' },
  founderNote: { profiles: ['early-stage', 'founders'], tier: 3, reasoning: 'Human connection' },
  
  // Always maintain baseline
  faq: { profiles: ['all'], tier: 4, reasoning: 'Utility section' }
};

// ===== USER PROFILE ANALYSIS =====
function analyzeUserProfile(userProfile: UserProfile): string[] {
  const profileTags: string[] = [];
  
  // ✅ PHASE 5.2: Use canonical field names
  // Add awareness level
  if (userProfile.awarenessLevel) {
    profileTags.push(userProfile.awarenessLevel);
  }
  
  // Add sophistication level  
  if (userProfile.marketSophisticationLevel) {
    profileTags.push(userProfile.marketSophisticationLevel);
  }
  
  // Add combined awareness + sophistication
  if (userProfile.awarenessLevel && userProfile.marketSophisticationLevel) {
    profileTags.push(`${userProfile.awarenessLevel}+${userProfile.marketSophisticationLevel}`);
  }
  
  // Add sophistication-based tags
  if (['level-4', 'level-5'].includes(userProfile.marketSophisticationLevel || '')) {
    profileTags.push('skeptical');
  }
  
  if (['level-3', 'level-4'].includes(userProfile.marketSophisticationLevel || '')) {
    profileTags.push('competitive');
  }
  
  // ✅ PHASE 5.2: Use canonical landingPageGoals field
  // Add goal-based tags
  if (userProfile.landingPageGoals) {
    profileTags.push(userProfile.landingPageGoals);
  }
  
  if (['buy-now', 'subscribe', 'contact-sales'].includes(userProfile.landingPageGoals || '')) {
    profileTags.push('ready-to-buy');
  }
  
  if (['contact-sales', 'book-call'].includes(userProfile.landingPageGoals || '')) {
    profileTags.push('enterprise');
  }
  
  // ✅ PHASE 5.2: Use canonical targetAudience field
  // Add audience-based tags
  if (userProfile.targetAudience?.includes('enterprise')) {
    profileTags.push('enterprise');
  }
  
  if (userProfile.targetAudience?.includes('founder')) {
    profileTags.push('founders');
  }
  
  if (userProfile.targetAudience?.includes('developer')) {
    profileTags.push('developers', 'technical');
  }
  
  // ✅ PHASE 5.2: Use canonical startupStage field
  // Add stage-based tags  
  if (['pre-mvp', 'mvp-development'].includes(userProfile.startupStage || '')) {
    profileTags.push('early-stage');
  }
  
  // Universal tag
  profileTags.push('all');
  
 // console.log('👤 User profile tags:', profileTags);
  return profileTags;
}

// ===== BASELINE BACKGROUND MAPPING =====
function getBaselineBackground(sectionId: string): BaselineBackgroundType {
  const sectionMeta = sectionList.find(section => section.id === sectionId);
  return sectionMeta?.background || 'neutral';
}

function mapToBackgroundType(baselineType: BaselineBackgroundType): SectionBackgroundType {
  const mapping: Record<BaselineBackgroundType, SectionBackgroundType> = {
    'primary-highlight': 'primary',
    'secondary-highlight': 'secondary', 
    'neutral': 'neutral',
    'divider-zone': 'divider'
  };
  return mapping[baselineType];
}

// ===== CONVERSION IMPORTANCE SCORING =====
function calculateConversionImportance(sectionId: string, userProfileTags: string[]): {
  score: number;
  tier: number;
  isRelevant: boolean;
  reasoning: string;
} {
  const conversionData = CONVERSION_PRIORITIES[sectionId];
  
  if (!conversionData) {
    return { score: 0, tier: 4, isRelevant: false, reasoning: 'No conversion data' };
  }
  
  // Check if section is relevant for this user profile
  const hasProfileMatch = conversionData.profiles.some(profile => 
    profile === 'all' || userProfileTags.includes(profile)
  );
  
  if (!hasProfileMatch) {
    return { 
      score: 0, 
      tier: conversionData.tier, 
      isRelevant: false, 
      reasoning: `Not relevant for user profile` 
    };
  }
  
  // Calculate score: lower tier = higher score
  let score = (5 - conversionData.tier) * 10;
  
  // Bonus for multiple profile matches
  const profileMatches = conversionData.profiles.filter(profile => 
    profile === 'all' || userProfileTags.includes(profile)
  );
  score += profileMatches.length * 2;
  
  return {
    score,
    tier: conversionData.tier,
    isRelevant: true,
    reasoning: conversionData.reasoning
  };
}

// ===== ENHANCED BACKGROUND ASSIGNMENT =====
export function assignEnhancedBackgroundsToSections(
  sections: string[], 
  userProfile: UserProfile
): Record<string, SectionBackgroundType> {
  
 // console.log('🎨 Starting Enhanced Background Assignment (Baseline-First)...');
 // console.log('📋 Sections:', sections);
 // console.log('👤 User Profile:', userProfile);
  
  const backgroundAssignments: Record<string, SectionBackgroundType> = {};
  const userProfileTags = analyzeUserProfile(userProfile);
  
  // ===== STEP 1: START WITH BASELINE ASSIGNMENTS =====
 // console.log('\n📊 STEP 1: Applying Baseline Backgrounds');
  sections.forEach(sectionId => {
    const baselineType = getBaselineBackground(sectionId);
    const mappedType = mapToBackgroundType(baselineType);
    backgroundAssignments[sectionId] = mappedType;
   // console.log(`📌 ${sectionId}: ${baselineType} → ${mappedType} (baseline)`);
  });
  
  // ===== STEP 2: ANALYZE CONVERSION IMPORTANCE =====
 // console.log('\n🎯 STEP 2: Analyzing Conversion Importance');
  const conversionAnalysis = sections.map(sectionId => {
    const importance = calculateConversionImportance(sectionId, userProfileTags);
  //  console.log(`📊 ${sectionId}: Score=${importance.score}, Tier=${importance.tier}, Relevant=${importance.isRelevant} (${importance.reasoning})`);
    return { sectionId, ...importance };
  });
  
  // ===== STEP 3: IDENTIFY UPGRADE CANDIDATES =====
 // console.log('\n⬆️ STEP 3: Identifying Upgrade Candidates');
  const upgradeCandidates = conversionAnalysis.filter(analysis => {
    const currentBackground = backgroundAssignments[analysis.sectionId];
    
    // Can only upgrade if highly relevant and current background allows it
    if (!analysis.isRelevant || analysis.score < 15) return false;
    
    // Tier 1 (critical) can upgrade neutral → secondary, secondary → primary
    if (analysis.tier === 1) {
      return currentBackground === 'neutral' || (currentBackground === 'secondary' && analysis.score >= 25);
    }
    
    // Tier 2 (important) can upgrade neutral → secondary only
    if (analysis.tier === 2) {
      return currentBackground === 'neutral' && analysis.score >= 20;
    }
    
    // Tier 3+ should maintain baseline
    return false;
  });
  
 // console.log('🎯 Upgrade candidates:', upgradeCandidates.map(c => `${c.sectionId}(${c.score})`));
  
  // ===== STEP 4: APPLY SMART UPGRADES WITH RHYTHM CHECK =====
 // console.log('\n🎨 STEP 4: Applying Smart Upgrades');
  upgradeCandidates.forEach((candidate, index) => {
    const sectionIndex = sections.indexOf(candidate.sectionId);
    
    // Check recent background pattern for rhythm
    const recentBackgrounds = sections.slice(Math.max(0, sectionIndex - 2), sectionIndex)
      .map(s => backgroundAssignments[s]);
    
    const consecutiveHighlights = countConsecutiveHighlights(recentBackgrounds);
   // console.log(`🔍 ${candidate.sectionId}: ${consecutiveHighlights} consecutive highlights before`);
    
    // Determine upgrade path
    const currentBackground = backgroundAssignments[candidate.sectionId];
    let newBackground = currentBackground;
    
    if (candidate.tier === 1) {
      // Tier 1 (Critical): Can override rhythm up to 3 consecutive
      if (consecutiveHighlights < 3) {
        if (currentBackground === 'neutral' && candidate.score >= 15) {
          newBackground = 'secondary';
        } else if (currentBackground === 'secondary' && candidate.score >= 25) {
          newBackground = 'primary';
        }
      } else {
       // console.log(`⚠️ ${candidate.sectionId}: Tier 1 blocked by rhythm (${consecutiveHighlights} consecutive)`);
      }
    } else if (candidate.tier === 2) {
      // Tier 2 (Important): Respect rhythm at 2 consecutive
      if (consecutiveHighlights < 2 && currentBackground === 'neutral' && candidate.score >= 20) {
        newBackground = 'secondary';
      } else {
       // console.log(`⚠️ ${candidate.sectionId}: Tier 2 blocked by rhythm (${consecutiveHighlights} consecutive)`);
      }
    }
    
    if (newBackground !== currentBackground) {
      backgroundAssignments[candidate.sectionId] = newBackground;
     // console.log(`⬆️ UPGRADE: ${candidate.sectionId}: ${currentBackground} → ${newBackground} (score: ${candidate.score}, tier: ${candidate.tier})`);
    }
  });
  
  // ===== STEP 5: APPLY RHYTHM ENFORCEMENT (DOWNGRADES) =====
  // console.log('\n⬇️ STEP 5: Applying Rhythm Enforcement');
  sections.forEach((sectionId, index) => {
    const currentBackground = backgroundAssignments[sectionId];
    
    // Skip if not a highlight
    if (!['primary', 'secondary'].includes(currentBackground)) return;
    
    // Check if this creates too many consecutive highlights
    const recentAssignments = sections.slice(Math.max(0, index - 2), index + 1)
      .map(s => backgroundAssignments[s]);
    
    const consecutiveHighlights = countConsecutiveHighlights(recentAssignments);
    
    // Get conversion importance for downgrade decision
    const importance = calculateConversionImportance(sectionId, userProfileTags);
    
    // Apply rhythm enforcement rules
    if (consecutiveHighlights > 3) {
      // Hard limit: Never more than 3 consecutive
      backgroundAssignments[sectionId] = 'neutral';
      // console.log(`⬇️ FORCE DOWNGRADE: ${sectionId}: ${currentBackground} → neutral (hard limit: ${consecutiveHighlights} consecutive)`);
    } else if (consecutiveHighlights === 3 && importance.tier > 1) {
      // Soft limit: Tier 2+ yields at 3 consecutive
      backgroundAssignments[sectionId] = 'neutral';
      // console.log(`⬇️ SMART DOWNGRADE: ${sectionId}: ${currentBackground} → neutral (tier ${importance.tier} yields at 3 consecutive)`);
    }
  });
  
  // ===== STEP 6: FINAL VALIDATION AND REPORTING =====
  // console.log('\n✅ STEP 6: Final Validation');
  const finalPattern = sections.map(section => 
    `${section}(${backgroundAssignments[section]})`
  ).join(' → ');
  
  // console.log('🎨 ENHANCED Final background pattern:', finalPattern);
  
  // Validate and report metrics
  validateEnhancedPattern(sections, backgroundAssignments, userProfileTags);
  
  return backgroundAssignments;
}

// ===== HELPER FUNCTIONS =====
function countConsecutiveHighlights(backgrounds: SectionBackgroundType[]): number {
  let count = 0;
  for (let i = backgrounds.length - 1; i >= 0; i--) {
    if (['primary', 'secondary'].includes(backgrounds[i])) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function validateEnhancedPattern(
  sections: string[], 
  assignments: Record<string, SectionBackgroundType>,
  userProfileTags: string[]
): void {
 // console.log('\n🔍 Enhanced Pattern Validation');
  
  let consecutiveHighlights = 0;
  let maxConsecutive = 0;
  let violations: string[] = [];
  let upgrades = 0;
  let downgrades = 0;
  
  sections.forEach((section, index) => {
    const currentBackground = assignments[section];
    const baselineBackground = mapToBackgroundType(getBaselineBackground(section));
    const isHighlighted = ['primary', 'secondary'].includes(currentBackground);
    
    // Track consecutive highlights
    if (isHighlighted) {
      consecutiveHighlights++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveHighlights);
      
      if (consecutiveHighlights > 3) {
        violations.push(`${section} (${consecutiveHighlights} consecutive)`);
      }
    } else {
      consecutiveHighlights = 0;
    }
    
    // Track changes from baseline
    if (getBackgroundWeight(currentBackground) > getBackgroundWeight(baselineBackground)) {
      upgrades++;
    } else if (getBackgroundWeight(currentBackground) < getBackgroundWeight(baselineBackground)) {
      downgrades++;
    }
  });
  
  // Calculate metrics
  const highlightCount = sections.filter(s => ['primary', 'secondary'].includes(assignments[s])).length;
  const neutralCount = sections.filter(s => assignments[s] === 'neutral').length;
  const dividerCount = sections.filter(s => assignments[s] === 'divider').length;
  const highlightRatio = Math.round((highlightCount / sections.length) * 100);
  
  console.log('📊 Enhanced Pattern Metrics:', {
    totalSections: sections.length,
    highlights: highlightCount,
    neutrals: neutralCount,
    dividers: dividerCount,
    highlightRatio: highlightRatio + '%',
    maxConsecutive,
    upgrades,
    downgrades,
    violations: violations.length
  });
  
  // Quality assessment
  if (violations.length === 0) {
   // console.log('✅ Rhythm validation: PASSED - Excellent visual breathing');
  } else {
    console.warn('⚠️ Rhythm violations:', violations);
  }
  
  if (highlightRatio >= 30 && highlightRatio <= 60) {
   // console.log('✅ Balance validation: PASSED - Good highlight/neutral ratio');
  } else if (highlightRatio > 60) {
    console.warn('⚠️ Too many highlights - Consider more neutral sections');
  } else {
    console.warn('⚠️ Too few highlights - Consider upgrading key sections');
  }
  
 // console.log('🎯 Conversion-focused changes:', `${upgrades} upgrades, ${downgrades} rhythm downgrades`);
}

function getBackgroundWeight(background: SectionBackgroundType): number {
  const weights = { 'divider': 0, 'neutral': 1, 'secondary': 2, 'primary': 3 };
  return weights[background] || 1;
}

// ===== INTEGRATION FUNCTION =====
export function getEnhancedSectionBackground(
  sectionId: string, 
  allSections: string[], 
  userProfile: UserProfile
): SectionBackgroundType {
  const assignments = assignEnhancedBackgroundsToSections(allSections, userProfile);
  return assignments[sectionId] || 'neutral';
}