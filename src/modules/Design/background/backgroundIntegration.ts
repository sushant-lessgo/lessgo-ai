// backgroundIntegration.ts - MIGRATED: Phase 5.2 - Canonical Type System Integration
import { getTopVariationWithFunnel } from './getTopVariations';
import { bgVariations } from './bgVariations';
import { accentOptions } from '../ColorSystem/accentOptions';
import { selectAccentOption } from '../ColorSystem/selectAccentFromTags';
import { getSecondaryBackground } from './simpleSecondaryBackgrounds';
import { 
  assignEnhancedBackgroundsToSections, 
  getEnhancedSectionBackground,
  getTextColorForBackground,
  getBodyColorForBackground,
  getMutedColorForBackground
} from './enhancedBackgroundLogic';

// ✅ PHASE 5.2: Import canonical types from central type system
import type { 
  InputVariables,
  HiddenInferredFields
} from '@/types/core/content';

// ✅ PHASE 5.2: Use canonical types instead of custom OnboardingData interface
type OnboardingDataInput = InputVariables & Partial<HiddenInferredFields>;

export interface BackgroundSystem {
  primary: string;      
  secondary: string;    
  neutral: string;      
  divider: string;      
  baseColor: string;    
  accentColor: string;  
  accentCSS: string;    
}

// ===== EXISTING FUNCTIONS (Updated with canonical field names) =====

export function selectPrimaryVariation(onboardingData: OnboardingDataInput): {
  variationId: string;
  tailwindClass: string;
  baseColor: string;
} {
  // ✅ PHASE 5.2: Map canonical field names to funnel input
 const funnelInput = {
  marketCategoryId: onboardingData.marketCategory,
  targetAudienceId: onboardingData.targetAudience,
  landingPageGoalsId: onboardingData.landingPageGoals,        // ✅ goalId → landingPageGoalsId
  startupStageId: onboardingData.startupStage,               // ✅ stageId → startupStageId
  pricingModelId: onboardingData.pricingModel,               // ✅ pricingId → pricingModelId
  toneProfileId: onboardingData.toneProfile || 'friendly-helpful', // ✅ toneId → toneProfileId
};
  
  try {
    const funnelResult = getTopVariationWithFunnel(funnelInput);
    const primaryVariationKey = funnelResult?.primaryVariation;
    
    if (!primaryVariationKey || typeof primaryVariationKey !== 'string' || !primaryVariationKey.includes('::')) {
      console.warn('Invalid or missing primaryVariationKey from funnel, using smart fallback');
      return getSmartFallbackVariation(onboardingData);
    }
    
    const [archetypeId, themeId] = primaryVariationKey.split("::");
    
    const matchingVariation = bgVariations.find(
      variation => 
        variation.archetypeId === archetypeId && 
        variation.themeId === themeId
    );

    if (!matchingVariation) {
      console.warn(`No matching variation found for ${primaryVariationKey}, using fallback`);
      return getSmartFallbackVariation(onboardingData);
    }

    return {
      variationId: matchingVariation.variationId,
      tailwindClass: matchingVariation.tailwindClass,
      baseColor: matchingVariation.baseColor,
    };
    
  } catch (error) {
    console.error('Error in funnel system:', error);
    return getSmartFallbackVariation(onboardingData);
  }
}

function getSmartFallbackVariation(onboardingData: OnboardingDataInput): {
  variationId: string;
  tailwindClass: string;
  baseColor: string;
} {
  let selectedVariation;
  
  // ✅ PHASE 5.2: Use canonical field names for fallback logic
  if (onboardingData.targetAudience?.includes('enterprise') || 
      onboardingData.marketCategory?.includes('Enterprise')) {
    selectedVariation = bgVariations.find(v => v.baseColor === 'slate' || v.baseColor === 'blue') || bgVariations[0];
  }
  else if (onboardingData.startupStage?.includes('mvp') || onboardingData.startupStage?.includes('early')) {
    selectedVariation = bgVariations.find(v => v.baseColor === 'purple' || v.baseColor === 'indigo') || bgVariations[0];
  }
  else if (onboardingData.marketCategory?.includes('Productivity') || 
           onboardingData.marketCategory?.includes('HR')) {
    selectedVariation = bgVariations.find(v => v.baseColor === 'emerald' || v.baseColor === 'teal') || bgVariations[0];
  }
  else {
    selectedVariation = bgVariations[0];
  }
  
 // console.log('Smart fallback selected:', selectedVariation);
  
  return {
    variationId: selectedVariation.variationId,
    tailwindClass: selectedVariation.tailwindClass,
    baseColor: selectedVariation.baseColor,
  };
}

export function getAccentColor(baseColor: string, onboardingData: OnboardingDataInput): {
  accentColor: string;
  accentCSS: string;
} {
  try {
    // ✅ PHASE 5.2: Map canonical field names to selectAccentOption context
    const userContext = {
      marketCategory: onboardingData.marketCategory || '',
      targetAudienceGroups: onboardingData.targetAudience || '',
      landingGoalTypes: onboardingData.landingPageGoals || '', // ✅ FIXED: landingPageGoals
      startupStageGroups: onboardingData.startupStage || '',
      toneProfiles: onboardingData.toneProfile || 'friendly-helpful', // ✅ FIXED: toneProfile
      awarenessLevels: onboardingData.awarenessLevel || 'solution-aware',
      pricingModels: onboardingData.pricingModel || '',
    };

    console.log('🎨 Using sophisticated accent selection system');
    const selectedAccent = selectAccentOption(userContext, baseColor);
    
    if (selectedAccent) {
     // console.log('✅ Sophisticated accent selection successful:', selectedAccent);
      
      return {
        accentColor: selectedAccent.accentColor,
        accentCSS: `bg-${selectedAccent.accentColor}-600`,
      };
    }
  } catch (error) {
    console.warn('Error in sophisticated accent selection system:', error);
  }
  
  console.warn(`No accent options found for base color ${baseColor}, using fallback`);
  const fallbackOptions = accentOptions?.filter(option => option.baseColor === baseColor);
  if (fallbackOptions && fallbackOptions.length > 0) {
    const fallback = fallbackOptions[0];
    return {
      accentColor: fallback.accentColor,
      accentCSS: `bg-${fallback.accentColor}-600`,
    };
  }
  
  return {
    accentColor: "gray",
    accentCSS: "bg-gray-600",
  };
}

export function calculateOtherBackgrounds(baseColor: string): {
  neutral: string;
  divider: string;
} {
  const colorMap: Record<string, string> = {
    blue: "blue", sky: "sky", indigo: "indigo", purple: "purple", pink: "pink",
    red: "red", orange: "orange", amber: "amber", yellow: "yellow", lime: "lime",
    green: "green", emerald: "emerald", teal: "teal", cyan: "cyan",
    gray: "gray", slate: "slate", zinc: "zinc", neutral: "neutral", stone: "stone",
  };

  const tailwindColor = colorMap[baseColor] || "gray";

  return {
    neutral: "bg-white",
    divider: `bg-${tailwindColor}-100/50`,
  };
}

export function generateCompleteBackgroundSystem(onboardingData: OnboardingDataInput): BackgroundSystem {
 // console.log('🎨 Generating complete background system with enhanced baseline-first logic...');
  
  try {
    // Step 1: Select primary variation (hero sections)
    const primaryVariation = selectPrimaryVariation(onboardingData);
   // console.log('✅ Primary variation selected:', primaryVariation);
    
    // Step 2: Get accent color (for CTAs, buttons, highlights)
    const accentResult = getAccentColor(primaryVariation.baseColor, onboardingData);
   // console.log('✅ Accent color selected:', accentResult);
    
    // Step 3: Get simple secondary background (one-to-one mapping)
    const secondaryBackground = getSecondaryBackground(primaryVariation.baseColor);
   // console.log('✅ Simple secondary background selected:', secondaryBackground);
    
    // Step 4: Calculate other backgrounds
    const otherBackgrounds = calculateOtherBackgrounds(primaryVariation.baseColor);
   // console.log('✅ Other backgrounds calculated:', otherBackgrounds);

    const result = {
      primary: primaryVariation.tailwindClass,          // From bgVariations (bold gradients)
      secondary: secondaryBackground,                   // Simple one-to-one mapping (subtle tints)
      neutral: otherBackgrounds.neutral,               // Clean white
      divider: otherBackgrounds.divider,               // Light separator
      baseColor: primaryVariation.baseColor,           // Base color name
      accentColor: accentResult.accentColor,           // For CTAs/highlights
      accentCSS: accentResult.accentCSS,               // For CTAs/highlights
    };

   // console.log('🎉 Background system generation complete:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to generate background system:', error);
    
    const safeDefaults = {
      primary: "bg-gradient-to-br from-blue-500 to-blue-600",
      secondary: "bg-blue-50/70",
      neutral: "bg-white", 
      divider: "bg-gray-100/50",
      baseColor: "blue",
      accentColor: "purple",
      accentCSS: "bg-purple-600",
    };
    
   // console.log('🔧 Using safe default backgrounds:', safeDefaults);
    return safeDefaults;
  }
}

// ===== ✅ NEW ENHANCED SECTION BACKGROUND LOGIC =====

export function getEnhancedSectionBackgroundType(
  sectionId: string, 
  allSections: string[], 
  onboardingData: OnboardingDataInput
): 'primary' | 'secondary' | 'neutral' | 'divider' {
  
 // console.log('🎨 Using Enhanced Baseline-First Background Assignment...');
  
  // ✅ PHASE 5.2: Map canonical fields to enhanced background logic user profile
 const userProfile = {
  awarenessLevel: onboardingData.awarenessLevel || 'solution-aware',
  marketSophisticationLevel: onboardingData.marketSophisticationLevel || 'level-3', // ✅ Fixed field name too
  landingPageGoals: onboardingData.landingPageGoals || '', // ✅ landingGoal → landingPageGoals
  targetAudience: onboardingData.targetAudience || '',
  startupStage: onboardingData.startupStage || ''
};
  
  return getEnhancedSectionBackground(sectionId, allSections, userProfile);
}

export function assignEnhancedBackgroundsToAllSections(
  sections: string[], 
  onboardingData: OnboardingDataInput
): Record<string, 'primary' | 'secondary' | 'neutral' | 'divider'> {
  
 // console.log('🎨 Assigning enhanced backgrounds using baseline-first logic...');
  
  // ✅ PHASE 5.2: Map canonical fields to enhanced background logic user profile
 const userProfile = {
  awarenessLevel: onboardingData.awarenessLevel || 'solution-aware',
  marketSophisticationLevel: onboardingData.marketSophisticationLevel || 'level-3', // ✅ Fixed field name too
  landingPageGoals: onboardingData.landingPageGoals || '', // ✅ landingGoal → landingPageGoals
  targetAudience: onboardingData.targetAudience || '',
  startupStage: onboardingData.startupStage || ''
};
  
  return assignEnhancedBackgroundsToSections(sections, userProfile);
}

// ===== UPDATED MAIN FUNCTIONS (Use Enhanced Logic) =====

export function getSectionBackgroundTypeWithEnhancedLogic(
  sectionId: string, 
  allSections: string[], 
  onboardingData: OnboardingDataInput
): 'primary' | 'secondary' | 'neutral' | 'divider' {
  
  return getEnhancedSectionBackgroundType(sectionId, allSections, onboardingData);
}

export function getSectionBackgroundCSS(
  sectionId: string, 
  backgroundSystem: BackgroundSystem, 
  allSections?: string[],
  onboardingData?: OnboardingDataInput
): string {
  
  // ✅ Use Enhanced Logic if onboardingData and allSections are available
  if (onboardingData && allSections) {
    const backgroundType = getEnhancedSectionBackgroundType(sectionId, allSections, onboardingData);
    return backgroundSystem[backgroundType];
  }
  
  // ✅ Fallback to legacy logic for backward compatibility
  const backgroundType = getSectionBackgroundType(sectionId, allSections, undefined, onboardingData);
  return backgroundSystem[backgroundType];
}

// ===== LEGACY FUNCTIONS (Keep for backward compatibility) =====

export function getSectionBackgroundType(
  sectionId: string, 
  allSections?: string[], 
  currentIndex?: number,
  onboardingData?: OnboardingDataInput
): 'primary' | 'secondary' | 'neutral' | 'divider' {
  
  // ✅ If we have complete data, use enhanced logic
  if (onboardingData && allSections) {
    return getEnhancedSectionBackgroundType(sectionId, allSections, onboardingData);
  }
  
  // ✅ Simple legacy fallback
  if (sectionId.includes('hero') || sectionId.includes('cta')) return 'primary';
  if (sectionId.includes('faq')) return 'divider';
  return 'secondary';
}

export function getSectionBackgroundTypeWithContext(
  sectionId: string, 
  allSections: string[],
  onboardingData?: OnboardingDataInput
): 'primary' | 'secondary' | 'neutral' | 'divider' {
  
  // ✅ Always use enhanced logic when sections and onboarding data available
  if (onboardingData) {
    return getEnhancedSectionBackgroundType(sectionId, allSections, onboardingData);
  }
  
  // ✅ Legacy fallback
  const currentIndex = allSections.indexOf(sectionId);
  return getSectionBackgroundType(sectionId, allSections, currentIndex);
}

// ===== MIGRATION HELPER FUNCTIONS =====

export function compareBackgroundAssignments(
  sections: string[],
  onboardingData: OnboardingDataInput
): {
  enhanced: Record<string, string>;
  legacy: Record<string, string>;
  changes: Array<{section: string, from: string, to: string, reason: string}>;
} {
  
  // console.log('🔍 Comparing Enhanced vs Legacy Background Assignments...');
  
  // Get enhanced assignments
  const enhanced = assignEnhancedBackgroundsToAllSections(sections, onboardingData);
  
  // Get legacy assignments (simplified version of old mixed logic)
  const legacy: Record<string, string> = {};
  sections.forEach(section => {
    if (section.includes('hero') || section.includes('cta')) {
      legacy[section] = 'primary';
    } else if (section.includes('faq')) {
      legacy[section] = 'divider';  
    } else {
      legacy[section] = 'secondary'; // Old system was over-promoting to secondary
    }
  });
  
  // Identify changes
  const changes: Array<{section: string, from: string, to: string, reason: string}> = [];
  sections.forEach(section => {
    if (enhanced[section] !== legacy[section]) {
      let reason = '';
      if (enhanced[section] === 'neutral' && legacy[section] === 'secondary') {
        reason = 'Visual rhythm enforcement - preventing highlight fatigue';
      } else if (enhanced[section] === 'secondary' && legacy[section] === 'neutral') {
        reason = 'Conversion-critical for this user profile';
      } else if (enhanced[section] === 'primary' && legacy[section] === 'secondary') {
        reason = 'Tier 1 critical section upgrade';
      } else {
        reason = 'Baseline-first optimization';
      }
      
      changes.push({
        section,
        from: legacy[section],
        to: enhanced[section],
        reason
      });
    }
  });
  
 // console.log('📊 Background Assignment Comparison:');
 // console.log('Enhanced:', Object.entries(enhanced).map(([k,v]) => `${k}:${v}`).join(', '));
 // console.log('Legacy:', Object.entries(legacy).map(([k,v]) => `${k}:${v}`).join(', '));
 // console.log('Changes:', changes);
  
  return { enhanced, legacy, changes };
}

export function validateEnhancedAssignments(
  sections: string[],
  assignments: Record<string, string>
): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for too many consecutive highlights
  let consecutiveHighlights = 0;
  let maxConsecutive = 0;
  
  sections.forEach(section => {
    const bg = assignments[section];
    if (['primary', 'secondary'].includes(bg)) {
      consecutiveHighlights++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveHighlights);
    } else {
      consecutiveHighlights = 0;
    }
  });
  
  if (maxConsecutive > 3) {
    issues.push(`Too many consecutive highlights (${maxConsecutive}). Max recommended: 3`);
    recommendations.push('Add neutral sections between highlights for better visual rhythm');
  }
  
  // Check highlight ratio
  const highlightCount = sections.filter(s => ['primary', 'secondary'].includes(assignments[s])).length;
  const highlightRatio = (highlightCount / sections.length) * 100;
  
  if (highlightRatio > 70) {
    issues.push(`Highlight ratio too high (${Math.round(highlightRatio)}%). Recommended: 30-60%`);
    recommendations.push('Convert some secondary sections to neutral for better balance');
  } else if (highlightRatio < 20) {
    issues.push(`Highlight ratio too low (${Math.round(highlightRatio)}%). Recommended: 30-60%`);
    recommendations.push('Consider upgrading important sections to secondary');
  }
  
  // Check for required sections
  const hasHero = sections.includes('hero') && assignments['hero'] === 'primary';
  const hasCTA = sections.includes('cta') && assignments['cta'] === 'primary';
  
  if (!hasHero) {
    issues.push('Hero section should always be primary');
  }
  if (!hasCTA) {
    issues.push('CTA section should always be primary');
  }
  
  const isValid = issues.length === 0;
  
  console.log('✅ Enhanced Assignment Validation:', {
    isValid,
    highlightRatio: Math.round(highlightRatio) + '%',
    maxConsecutive,
    totalSections: sections.length,
    issues: issues.length,
    recommendations: recommendations.length
  });
  
  return { isValid, issues, recommendations };
}

// ===== EXPORT TEXT COLOR HELPERS =====
export { 
  getTextColorForBackground,
  getBodyColorForBackground,
  getMutedColorForBackground
};