// backgroundIntegration.ts
// Integration functions to connect archetype selection with actual CSS generation

import { getTopVariationWithFunnel } from './getTopVariations';
import { bgVariations } from './bgVariations';
import { accentOptions } from '../ColorSystem/accentOptions';
import { selectAccentOption } from '../ColorSystem/selectAccentFromTags';

// Types for the integration
interface OnboardingData {
  marketCategory: string;
  targetAudience: string;
  goal: string;
  stage: string;
  pricing: string;
  tone: string;
  awarenessLevel?: string; // Optional field for tag system
}

interface BackgroundResult {
  primary: string;      // Hero section background CSS
  secondary: string;    // Testimonials, features sections CSS  
  neutral: string;      // Simple sections CSS
  divider: string;      // Separator sections CSS
  baseColor: string;    // Extracted base color
  accentColor: string;  // Selected accent color
  accentCSS: string;    // Accent color CSS class
}

// 1. Select Primary Variation from Archetype System
export function selectPrimaryVariation(onboardingData: OnboardingData): {
  variationId: string;
  tailwindClass: string;
  baseColor: string;
} {
  // Map onboarding data to funnel input format
  const funnelInput = {
    marketCategoryId: onboardingData.marketCategory,
    targetAudienceId: onboardingData.targetAudience,
    goalId: onboardingData.goal,
    stageId: onboardingData.stage,
    pricingId: onboardingData.pricing,
    toneId: onboardingData.tone,
  };

  // Get top variation from the funnel
  const funnelResult = getTopVariationWithFunnel(funnelInput);
  const primaryVariationKey = funnelResult.primaryVariation;

  // Parse the variation key (format: "archetypeId::themeId::variationId")
  const [archetypeId, themeId] = primaryVariationKey.split("::");

  // Find matching variation in bgVariations
  const matchingVariation = bgVariations.find(
    variation => 
      variation.archetypeId === archetypeId && 
      variation.themeId === themeId
  );

  if (!matchingVariation) {
    console.warn(`No matching variation found for ${primaryVariationKey}, using fallback`);
    // Fallback to first variation with matching archetype
    const fallbackVariation = bgVariations.find(v => v.archetypeId === archetypeId) || bgVariations[0];
    return {
      variationId: fallbackVariation.variationId,
      tailwindClass: fallbackVariation.tailwindClass,
      baseColor: fallbackVariation.baseColor,
    };
  }

  return {
    variationId: matchingVariation.variationId,
    tailwindClass: matchingVariation.tailwindClass,
    baseColor: matchingVariation.baseColor,
  };
}

// 2. Get Accent Color from Base Color using your sophisticated tag system
export function getAccentColor(baseColor: string, onboardingData: OnboardingData): {
  accentColor: string;
  accentCSS: string;
} {
  // Prepare user context for your tag system
  const userContext = {
    marketCategory: onboardingData.marketCategory,
    targetAudienceGroups: onboardingData.targetAudience,
    landingGoalTypes: onboardingData.goal,
    startupStageGroups: onboardingData.stage,
    toneProfiles: onboardingData.tone,
    awarenessLevels: onboardingData.awarenessLevel || 'solution-aware', // fallback
    pricingModels: onboardingData.pricing,
  };

  // Use your sophisticated accent selection system
  const selectedAccent = selectAccentOption(userContext, baseColor);
  
  if (!selectedAccent) {
    console.warn(`No accent options found for base color ${baseColor} with user context, using fallback`);
    // Fallback to first available option for this base color
    const fallbackOptions = accentOptions.filter(option => option.baseColor === baseColor);
    if (fallbackOptions.length > 0) {
      return {
        accentColor: fallbackOptions[0].accentColor,
        accentCSS: fallbackOptions[0].tailwind,
      };
    }
    
    // Ultimate fallback
    return {
      accentColor: "gray",
      accentCSS: "bg-gray-600",
    };
  }

  return {
    accentColor: selectedAccent.accentColor,
    accentCSS: selectedAccent.tailwind,
  };
}

// 3. Calculate Secondary Backgrounds from Base Color
export function calculateSecondaryBackgrounds(baseColor: string): {
  secondary: string;
  neutral: string;
  divider: string;
} {
  // Base color mapping to Tailwind colors
  const colorMap: Record<string, string> = {
    blue: "blue",
    sky: "sky", 
    indigo: "indigo",
    purple: "purple",
    pink: "pink",
    red: "red",
    orange: "orange",
    amber: "amber",
    yellow: "yellow",
    lime: "lime",
    green: "green",
    emerald: "emerald",
    teal: "teal",
    cyan: "cyan",
    gray: "gray",
    slate: "slate",
    zinc: "zinc",
    neutral: "neutral",
    stone: "stone",
  };

  const tailwindColor = colorMap[baseColor] || "gray";

  return {
    // Secondary: Light version of the base color for sections like testimonials
    secondary: `bg-${tailwindColor}-50`,
    
    // Neutral: Clean white background for content sections
    neutral: "bg-white",
    
    // Divider: Subtle pattern or very light color for separators
    divider: `bg-${tailwindColor}-100/50`,
  };
}

// 4. Master Function: Generate Complete Background System
export function generateCompleteBackgroundSystem(onboardingData: OnboardingData): BackgroundResult {
  try {
    // Step 1: Select primary variation
    const primaryVariation = selectPrimaryVariation(onboardingData);
    
    // Step 2: Get accent color using your sophisticated tag system
    const accentResult = getAccentColor(primaryVariation.baseColor, onboardingData);
    
    // Step 3: Calculate secondary backgrounds
    const secondaryBackgrounds = calculateSecondaryBackgrounds(primaryVariation.baseColor);

    console.log('Background system generation:', {
      primaryVariation: primaryVariation.variationId,
      baseColor: primaryVariation.baseColor,
      selectedAccent: accentResult.accentColor,
      tagSystemUsed: true
    });

    return {
      primary: primaryVariation.tailwindClass,
      secondary: secondaryBackgrounds.secondary,
      neutral: secondaryBackgrounds.neutral,
      divider: secondaryBackgrounds.divider,
      baseColor: primaryVariation.baseColor,
      accentColor: accentResult.accentColor,
      accentCSS: accentResult.accentCSS,
    };
  } catch (error) {
    console.error('Failed to generate background system:', error);
    
    // Fallback to safe defaults
    return {
      primary: "bg-gradient-to-br from-blue-500 to-blue-600",
      secondary: "bg-gray-50",
      neutral: "bg-white", 
      divider: "bg-gray-100/50",
      baseColor: "blue",
      accentColor: "indigo",
      accentCSS: "bg-indigo-600",
    };
  }
}

// 5. Section Background Type Assignment (your existing logic, formalized)
export function getSectionBackgroundType(sectionId: string): 'primary' | 'secondary' | 'neutral' | 'divider' {
  // Primary: Hero and CTA sections (most important)
  if (sectionId.includes('hero')) return 'primary';
  if (sectionId.includes('cta')) return 'primary';
  
  // Secondary: Social proof and feature sections (medium importance)
  if (sectionId.includes('testimonials')) return 'secondary';
  if (sectionId.includes('reviews')) return 'secondary';
  if (sectionId.includes('social-proof')) return 'secondary';
  
  // Divider: FAQ and separator sections (subtle)
  if (sectionId.includes('faq')) return 'divider';
  if (sectionId.includes('divider')) return 'divider';
  
  // Neutral: Everything else (features, pricing, content)
  return 'neutral';
}

// 6. Helper: Get actual CSS class for a section
export function getSectionBackgroundCSS(sectionId: string, backgroundSystem: BackgroundResult): string {
  const backgroundType = getSectionBackgroundType(sectionId);
  return backgroundSystem[backgroundType];
}