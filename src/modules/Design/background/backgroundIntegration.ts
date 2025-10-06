// backgroundIntegration.ts - MIGRATED: Phase 5.2 + Phase 2 - Simplified Background System
import { selectPrimaryBackground } from './backgroundSelection';
import { accentOptions } from '../ColorSystem/accentOptions';
import { selectAccentOption } from '../ColorSystem/selectAccentFromTags';
import { getSecondaryBackground } from './simpleSecondaryBackgrounds';
import { logger } from '@/lib/logger';
import {
  assignEnhancedBackgroundsToSections,
  getEnhancedSectionBackground
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

// ===== SIMPLIFIED FUNCTIONS (Phase 2 - New Background System) =====

/**
 * Select primary background variation using simplified category-based system
 * Replaces complex funnel system with simple category mapping
 */
export function selectPrimaryVariation(onboardingData: OnboardingDataInput): {
  variationId: string;
  css: string;
  baseColor: string;
} {
  // Use new simplified selection system
  const selected = selectPrimaryBackground(onboardingData);

  logger.debug('✅ Selected primary background:', {
    id: selected.id,
    label: selected.label,
    baseColor: selected.baseColor,
    category: selected.category,
  });

  return {
    variationId: selected.id,
    css: selected.css,
    baseColor: selected.baseColor,
  };
}

export function getAccentColor(baseColor: string, onboardingData: OnboardingDataInput): {
  accentColor: string;
  accentCSS: string;
} {
  try {
    // 🎨 NEW: Use smart color harmony system
    const { getSmartAccentColor } = require('@/utils/colorHarmony');
    
    const businessContext = {
      marketCategory: onboardingData.marketCategory,
      targetAudience: onboardingData.targetAudience,
      landingPageGoals: onboardingData.landingPageGoals,
      toneProfile: onboardingData.toneProfile,
      awarenessLevel: onboardingData.awarenessLevel,
      marketSophisticationLevel: onboardingData.marketSophisticationLevel
    };

    logger.debug('🎨 Using smart color harmony accent selection system');
    const smartAccent = getSmartAccentColor(baseColor, businessContext);
    
    if (smartAccent && smartAccent.confidence > 0.5) {
      logger.debug('✅ Smart accent selection successful:', smartAccent);
      return {
        accentColor: smartAccent.accentColor,
        accentCSS: smartAccent.accentCSS,
      };
    }
    
    // Fallback to old system if smart selection has low confidence
    logger.debug('⚠️ Smart accent had low confidence, trying legacy system');
    
    // ✅ PHASE 5.2: Map canonical field names to selectAccentOption context
    const userContext = {
      marketCategory: onboardingData.marketCategory || '',
      targetAudience: onboardingData.targetAudience || '',
      landingPageGoals: onboardingData.landingPageGoals || '', // ✅ FIXED: landingPageGoals
      startupStage: onboardingData.startupStage || '',
      toneProfile: onboardingData.toneProfile || 'friendly-helpful', // ✅ FIXED: toneProfile
      awarenessLevel: onboardingData.awarenessLevel || 'solution-aware',
      pricingModel: onboardingData.pricingModel || '',
    };

    const selectedAccent = selectAccentOption(userContext, baseColor);
    
    if (selectedAccent) {
      return {
        accentColor: selectedAccent.accentColor,
        accentCSS: selectedAccent.tailwind, // ✅ Use optimized tailwind from accentOptions
      };
    }
  } catch (error) {
    logger.warn('Error in accent selection systems:', error);
  }
  
  logger.warn(`No accent options found for base color ${baseColor}, using fallback`);
  const fallbackOptions = accentOptions?.filter(option => option.baseColor === baseColor);
  if (fallbackOptions && fallbackOptions.length > 0) {
    const fallback = fallbackOptions[0];
    return {
      accentColor: fallback.accentColor,
      accentCSS: fallback.tailwind, // ✅ Use optimized tailwind from accentOptions
    };
  }
  
  return {
    accentColor: "gray",
    accentCSS: "bg-gray-500", // ✅ Use 500 shade for final fallback
  };
}

export function calculateOtherBackgrounds(baseColor: string): {
  neutral: string;
  divider: string;
} {
  // ✅ Map base colors to their light tint CSS values (100 shade with 50% opacity)
  const dividerColorMap: Record<string, string> = {
    blue: "rgba(219, 234, 254, 0.5)",
    sky: "rgba(224, 242, 254, 0.5)",
    indigo: "rgba(224, 231, 255, 0.5)",
    purple: "rgba(243, 232, 255, 0.5)",
    pink: "rgba(252, 231, 243, 0.5)",
    red: "rgba(254, 226, 226, 0.5)",
    orange: "rgba(255, 237, 213, 0.5)",
    amber: "rgba(254, 243, 199, 0.5)",
    yellow: "rgba(254, 249, 195, 0.5)",
    lime: "rgba(236, 252, 203, 0.5)",
    green: "rgba(220, 252, 231, 0.5)",
    emerald: "rgba(209, 250, 229, 0.5)",
    teal: "rgba(204, 251, 241, 0.5)",
    cyan: "rgba(207, 250, 254, 0.5)",
    gray: "rgba(243, 244, 246, 0.5)",
    slate: "rgba(241, 245, 249, 0.5)",
    zinc: "rgba(244, 244, 245, 0.5)",
    neutral: "rgba(245, 245, 245, 0.5)",
    stone: "rgba(245, 245, 244, 0.5)",
  };

  return {
    neutral: "#ffffff",
    divider: dividerColorMap[baseColor] || "rgba(243, 244, 246, 0.5)",
  };
}

export function generateCompleteBackgroundSystem(onboardingData: OnboardingDataInput): BackgroundSystem {
  
  try {
    // Step 1: Select primary variation (hero sections)
    const primaryVariation = selectPrimaryVariation(onboardingData);
    
    // Step 2: Get accent color (for CTAs, buttons, highlights)
    const accentResult = getAccentColor(primaryVariation.baseColor, onboardingData);
    
    // Step 3: Get simple secondary background (one-to-one mapping)
    const secondaryBackground = getSecondaryBackground(primaryVariation.baseColor);
    
    // Step 4: Calculate other backgrounds
    const otherBackgrounds = calculateOtherBackgrounds(primaryVariation.baseColor);

    const result = {
      primary: primaryVariation.css,                   // ✅ CSS value from new system
      secondary: secondaryBackground,                   // Simple one-to-one mapping (subtle tints)
      neutral: otherBackgrounds.neutral,               // Clean white
      divider: otherBackgrounds.divider,               // Light separator
      baseColor: primaryVariation.baseColor,           // Base color name
      accentColor: accentResult.accentColor,           // For CTAs/highlights
      accentCSS: accentResult.accentCSS,               // For CTAs/highlights
    };

    return result;
    
  } catch (error) {
    logger.error('❌ Failed to generate background system:', error);
    
    const safeDefaults = {
      primary: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
      secondary: "rgba(239, 246, 255, 0.7)",
      neutral: "#ffffff",
      divider: "rgba(243, 244, 246, 0.5)",
      baseColor: "blue",
      accentColor: "purple",
      accentCSS: "bg-purple-500", // ✅ Use 500 shade for safe defaults
    };
    
    return safeDefaults;
  }
}

// ===== ✅ NEW ENHANCED SECTION BACKGROUND LOGIC =====

export function getEnhancedSectionBackgroundType(
  sectionId: string, 
  allSections: string[], 
  onboardingData: OnboardingDataInput
): 'primary' | 'secondary' | 'neutral' | 'divider' {
  
  
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
  
  logger.debug('✅ Enhanced Assignment Validation:', {
    isValid,
    highlightRatio: Math.round(highlightRatio) + '%',
    maxConsecutive,
    totalSections: sections.length,
    issues: issues.length,
    recommendations: recommendations.length
  });
  
  return { isValid, issues, recommendations };
}

// ===== EXPORT TEXT COLOR HELPERS (Updated to use improved system) =====
export { 
  getTextColorForBackground,
  getBodyColorForBackground,
  getMutedColorForBackground
} from '@/utils/improvedTextColors';