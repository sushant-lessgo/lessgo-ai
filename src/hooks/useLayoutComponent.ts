// hooks/useLayoutComponent.ts - ENHANCED with Dynamic Text Colors
// Central hook that combines all common layout component patterns

import { useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStore } from '@/hooks/useEditStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';
import { getTextColorForBackground } from '@/modules/Design/background/backgroundIntegration';

export interface UseLayoutComponentProps extends LayoutComponentProps {
  contentSchema: Record<string, { type: 'string' | 'array'; default: string }>;
}

export function useLayoutComponent<T = Record<string, any>>({ 
  sectionId, 
  backgroundType = 'neutral',
  contentSchema 
}: UseLayoutComponentProps) {
  
  const { getTextStyle } = useTypography();
  const { 
    content, 
    mode, 
    theme,
    updateElementContent,
    getColorTokens
  } = useEditStore();

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = useEditStore.getState();
    updateFontsFromTone();
  }, []);

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Extract content with type safety and defaults
  const blockContent = extractLayoutContent(elements, contentSchema) as T;

  // Get color tokens from store
  const colorTokens = getColorTokens();

  // ✅ NEW: Get dynamic text colors based on background type
  const dynamicTextColors = getTextColorForBackground(backgroundType, colorTokens);

  console.log(`🎨 Dynamic text colors for ${sectionId} (${backgroundType}):`, {
    backgroundType,
    heading: dynamicTextColors.heading,
    body: dynamicTextColors.body,
    muted: dynamicTextColors.muted,
    willUseWhiteText: backgroundType === 'primary',
    willUseDarkText: backgroundType !== 'primary'
  });

  // Get section background CSS class
  const getSectionBackground = () => {
    const backgrounds = theme?.colors?.sectionBackgrounds;
    if (!backgrounds) {
      console.warn('No section backgrounds found in theme, using fallback');
      return 'bg-white';
    }

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
  };

  // Content update handler
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // ✅ ENHANCED: Create enhanced color tokens with dynamic text colors
  const enhancedColorTokens = {
    ...colorTokens,
    
    // ✅ Dynamic text colors based on background
    dynamicHeading: dynamicTextColors.heading,
    dynamicBody: dynamicTextColors.body,
    dynamicMuted: dynamicTextColors.muted,
    
    // ✅ Backwards compatibility
    textOnLight: colorTokens.textOnLight,
    textOnDark: colorTokens.textOnDark,
    textPrimary: colorTokens.textPrimary,
    textSecondary: colorTokens.textSecondary,
    textMuted: colorTokens.textMuted,
    
    // ✅ CTA colors (ensure accent colors are used)
    ctaBg: colorTokens.ctaBg || colorTokens.accent,
    ctaHover: colorTokens.ctaHover || colorTokens.accentHover,
    ctaText: colorTokens.ctaText || 'text-white',
    
    // ✅ Border and focus colors
    accentBorder: colorTokens.accentBorder,
    borderFocus: colorTokens.borderFocus
  };

  // Debug logging
  console.log(`Layout Component ${sectionId}:`, {
    backgroundType,
    sectionBackground: getSectionBackground(),
    mode,
    hasContent: Object.keys(elements).length > 0,
    backgroundCSS: getSectionBackground(),
    ctaColors: {
      bg: enhancedColorTokens.ctaBg,
      hover: enhancedColorTokens.ctaHover,
      text: enhancedColorTokens.ctaText
    }
  });

  return {
    // Core data
    sectionId,
    mode,
    blockContent,
    backgroundType, // ✅ NEW: Pass background type to components
    
    // ✅ ENHANCED: Dynamic styling based on background
    colorTokens: enhancedColorTokens,
    dynamicTextColors, // ✅ NEW: Direct access to dynamic colors
    getTextStyle,
    sectionBackground: getSectionBackground(),
    
    // Actions
    handleContentUpdate,
    
    // Theme access
    theme
  };
}