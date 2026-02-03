// backgroundIntegration.ts - Simplified Background System
import { selectPrimaryBackground } from './backgroundSelection';
import { accentOptions } from '../ColorSystem/accentOptions';
import { selectAccentOption } from '../ColorSystem/selectAccentFromTags';
import { getSecondaryBackground } from './simpleSecondaryBackgrounds';
import { sectionList } from '@/modules/sections/sectionList';
import { logger } from '@/lib/logger';

import type {
  InputVariables,
  HiddenInferredFields
} from '@/types/core/content';

type OnboardingDataInput = InputVariables & Partial<HiddenInferredFields>;
type BackgroundType = 'primary' | 'secondary' | 'neutral' | 'divider';

export interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

// ===== SIMPLE BACKGROUND ASSIGNMENT =====

const BACKGROUND_MAP: Record<string, BackgroundType> = {
  'primary-highlight': 'primary',
  'secondary-highlight': 'secondary',
  'divider-zone': 'divider',
  'neutral': 'neutral',
};

/**
 * Simple sectionList lookup + rhythm enforcement
 * Replaces 400+ lines of profile-based logic
 */
export function assignSectionBackgrounds(
  sections: string[]
): Record<string, BackgroundType> {
  const result: Record<string, BackgroundType> = {};
  let consecutiveHighlights = 0;

  for (const sectionId of sections) {
    const sectionMeta = sectionList.find(s => s.id === sectionId);
    const baseline = sectionMeta?.background || 'neutral';
    let bg = BACKGROUND_MAP[baseline] || 'neutral';

    const isHighlight = bg === 'primary' || bg === 'secondary';

    // Rhythm: max 2 consecutive highlights (hero/cta protected)
    if (isHighlight && consecutiveHighlights >= 2) {
      if (sectionId !== 'hero' && sectionId !== 'cta') {
        bg = 'neutral';
      }
    }

    if (bg === 'primary' || bg === 'secondary') {
      consecutiveHighlights++;
    } else {
      consecutiveHighlights = 0;
    }

    result[sectionId] = bg;
  }

  return result;
}

// ===== PRIMARY BACKGROUND SELECTION =====

export function selectPrimaryVariation(onboardingData: OnboardingDataInput): {
  variationId: string;
  css: string;
  baseColor: string;
} {
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

    logger.debug('⚠️ Smart accent had low confidence, trying legacy system');

    const userContext = {
      marketCategory: onboardingData.marketCategory || '',
      targetAudience: onboardingData.targetAudience || '',
      landingPageGoals: onboardingData.landingPageGoals || '',
      startupStage: onboardingData.startupStage || '',
      toneProfile: onboardingData.toneProfile || 'friendly-helpful',
      awarenessLevel: onboardingData.awarenessLevel || 'solution-aware',
      pricingModel: onboardingData.pricingModel || '',
    };

    const selectedAccent = selectAccentOption(userContext, baseColor);

    if (selectedAccent) {
      return {
        accentColor: selectedAccent.accentColor,
        accentCSS: selectedAccent.tailwind,
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
      accentCSS: fallback.tailwind,
    };
  }

  return {
    accentColor: "gray",
    accentCSS: "bg-gray-500",
  };
}

export function calculateOtherBackgrounds(baseColor: string): {
  neutral: string;
  divider: string;
} {
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
    const primaryVariation = selectPrimaryVariation(onboardingData);
    const accentResult = getAccentColor(primaryVariation.baseColor, onboardingData);
    const secondaryBackground = getSecondaryBackground(primaryVariation.baseColor);
    const otherBackgrounds = calculateOtherBackgrounds(primaryVariation.baseColor);

    return {
      primary: primaryVariation.css,
      secondary: secondaryBackground,
      neutral: otherBackgrounds.neutral,
      divider: otherBackgrounds.divider,
      baseColor: primaryVariation.baseColor,
      accentColor: accentResult.accentColor,
      accentCSS: accentResult.accentCSS,
    };

  } catch (error) {
    logger.error('❌ Failed to generate background system:', error);

    return {
      primary: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
      secondary: "rgba(239, 246, 255, 0.7)",
      neutral: "#ffffff",
      divider: "rgba(243, 244, 246, 0.5)",
      baseColor: "blue",
      accentColor: "purple",
      accentCSS: "bg-purple-500",
    };
  }
}

// ===== SECTION BACKGROUND TYPE FUNCTIONS =====

/**
 * Get background type for a single section
 * Uses simple sectionList lookup with rhythm enforcement
 */
export function getSectionBackgroundType(
  sectionId: string,
  allSections?: string[],
  _currentIndex?: number,
  _onboardingData?: OnboardingDataInput
): BackgroundType {
  // If we have all sections, use full assignment with rhythm
  if (allSections && allSections.length > 0) {
    const assignments = assignSectionBackgrounds(allSections);
    return assignments[sectionId] || 'neutral';
  }

  // Fallback: single section lookup (no rhythm possible)
  const sectionMeta = sectionList.find(s => s.id === sectionId);
  const baseline = sectionMeta?.background || 'neutral';
  return BACKGROUND_MAP[baseline] || 'neutral';
}

export function getSectionBackgroundTypeWithContext(
  sectionId: string,
  allSections: string[],
  _onboardingData?: OnboardingDataInput
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function getEnhancedSectionBackgroundType(
  sectionId: string,
  allSections: string[],
  _onboardingData: OnboardingDataInput
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function getSectionBackgroundTypeWithEnhancedLogic(
  sectionId: string,
  allSections: string[],
  _onboardingData: OnboardingDataInput
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function assignEnhancedBackgroundsToAllSections(
  sections: string[],
  _onboardingData: OnboardingDataInput
): Record<string, BackgroundType> {
  return assignSectionBackgrounds(sections);
}

export function getSectionBackgroundCSS(
  sectionId: string,
  backgroundSystem: BackgroundSystem,
  allSections?: string[],
  _onboardingData?: OnboardingDataInput
): string {
  const backgroundType = getSectionBackgroundType(sectionId, allSections);
  return backgroundSystem[backgroundType];
}

// ===== TEXT COLOR HELPERS =====
export {
  getTextColorForBackground,
  getBodyColorForBackground,
  getMutedColorForBackground
} from '@/utils/improvedTextColors';
