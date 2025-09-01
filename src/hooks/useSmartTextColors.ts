// hooks/useSmartTextColors.ts - Hook for smart text colors based on background
import { useMemo } from 'react';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import { getSmartTextColor, hasGoodContrast } from '@/utils/improvedTextColors';

interface SmartTextColors {
  heading: string;
  body: string;
  muted: string;
  isLightBackground: boolean;
  contrastRating: 'excellent' | 'good' | 'poor';
}

interface SmartCTAColors {
  background: string;
  text: string;
  hover: string;
}

/**
 * Hook to get smart text colors for a given background type
 */
export function useSmartTextColors(backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider'): SmartTextColors {
  const { theme } = useEditStore();
  
  return useMemo(() => {
    const backgrounds = theme?.colors?.sectionBackgrounds;
    if (!backgrounds) {
      // Fallback for when theme is not loaded
      return {
        heading: '#111827', // gray-900
        body: '#374151',    // gray-700
        muted: '#6B7280',   // gray-500
        isLightBackground: true,
        contrastRating: 'good'
      };
    }
    
    // Get the CSS class for this background type
    const backgroundCSS = (() => {
      switch(backgroundType) {
        case 'primary': 
          return backgrounds.primary || 'bg-gradient-to-br from-blue-500 to-blue-600';
        case 'secondary': 
          return backgrounds.secondary || 'bg-gray-50';
        case 'divider': 
          return backgrounds.divider || 'bg-gray-100/50';
        default: 
          return backgrounds.neutral || 'bg-white';
      }
    })();
    
    // Get smart text colors
    const headingColor = getSmartTextColor(backgroundCSS, 'heading');
    const bodyColor = getSmartTextColor(backgroundCSS, 'body');
    const mutedColor = getSmartTextColor(backgroundCSS, 'muted');
    
    // ✅ FIX: Use proper luminance calculation instead of string matching
    const { isLightBackground: calculatedIsLight } = (() => {
      // Import the background analysis function
      const { analyzeBackground } = require('@/utils/backgroundAnalysis');
      try {
        const analysis = analyzeBackground(backgroundCSS);
        return { isLightBackground: analysis.isLight };
      } catch (error) {
        // Fallback to improved string matching that includes black
        const isDark = backgroundCSS.includes('black') || 
                       backgroundCSS.includes('gray-800') || 
                       backgroundCSS.includes('gray-900') ||
                       backgroundCSS.includes('slate-800') ||
                       backgroundCSS.includes('slate-900') ||
                       backgroundCSS.includes('zinc-800') ||
                       backgroundCSS.includes('zinc-900') ||
                       (backgroundCSS.includes('gradient') && (backgroundCSS.includes('gray-') || backgroundCSS.includes('slate-')));
        return { isLightBackground: !isDark };
      }
    })();
    
    // Check contrast quality with the body text
    const contrastRating = (() => {
      if (hasGoodContrast(backgroundCSS, bodyColor, 'AAA')) return 'excellent';
      if (hasGoodContrast(backgroundCSS, bodyColor, 'AA')) return 'good';
      return 'poor';
    })();
    
    return {
      heading: headingColor,
      body: bodyColor,
      muted: mutedColor,
      isLightBackground: calculatedIsLight,
      contrastRating
    };
  }, [theme?.colors?.sectionBackgrounds, backgroundType]);
}

/**
 * Hook to get text colors for a specific section based on its assigned background
 */
export function useSmartTextColorsForSection(sectionId: string): SmartTextColors {
  const { theme } = useEditStore();
  
  // For now, we'll determine background type based on section patterns
  // In the future, this could be enhanced to track actual background assignments
  const backgroundType = useMemo(() => {
    if (sectionId.includes('hero') || sectionId.includes('cta')) return 'primary';
    if (sectionId.includes('faq')) return 'divider';
    // This is a simplified approach - in reality, we'd want to access the actual
    // background assignment from the LandingPageRenderer or store it in the store
    return 'secondary' as const;
  }, [sectionId]);
  
  return useSmartTextColors(backgroundType);
}

/**
 * Hook to get CSS custom properties for smart text colors
 */
export function useSmartTextColorVars(backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider') {
  const colors = useSmartTextColors(backgroundType);
  
  return useMemo(() => ({
    '--smart-text-heading': colors.heading,
    '--smart-text-body': colors.body,
    '--smart-text-muted': colors.muted,
  }), [colors]);
}

/**
 * Hook to get smart CTA colors that automatically update when accent colors change
 */
export function useSmartCTAColors(): SmartCTAColors {
  const { getColorTokens } = useEditStore();
  
  return useMemo(() => {
    try {
      const tokens = getColorTokens();
      
      return {
        background: tokens.ctaBg || 'bg-blue-600',
        text: tokens.ctaText || 'text-white', 
        hover: tokens.ctaHover || 'bg-blue-700'
      };
    } catch (error) {
      // Fallback colors
      return {
        background: 'bg-blue-600',
        text: 'text-white',
        hover: 'bg-blue-700'
      };
    }
  }, [getColorTokens]);
}