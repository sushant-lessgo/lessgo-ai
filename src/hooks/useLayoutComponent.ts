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
import { validateTextBackgroundContrast } from '@/utils/textContrastUtils';

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
  console.log(`🔍 useLayoutComponent extracting content for ${sectionId}:`, {
    elements: elements,
    elementKeys: Object.keys(elements),
    firstElement: Object.values(elements)[0],
    contentSchema: Object.keys(contentSchema)
  });
  
  const blockContent = extractLayoutContent(elements, contentSchema) as T;
  
  console.log(`📦 Extracted blockContent for ${sectionId}:`, {
    blockContent,
    headlineType: typeof blockContent.headline,
    headlineValue: blockContent.headline
  });

  // Get color tokens from store
  const colorTokens = getColorTokens();

  // ✅ MOVED: Get section background CSS class (define before usage)
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

  // ✅ NEW: Get dynamic text colors based on background type
  const dynamicTextColors = getTextColorForBackground(backgroundType, colorTokens);

  // ✅ CONSERVATIVE: Always use safe gray text colors for maximum readability
  const sectionBackground = getSectionBackground();
  const validatedTextColors = {
    heading: backgroundType === 'primary' ? 'text-white' : 'text-gray-900',
    body: backgroundType === 'primary' ? 'text-gray-100' : 'text-gray-700',
    muted: backgroundType === 'primary' ? 'text-gray-300' : 'text-gray-500'
  };

  console.log(`🎨 Dynamic text colors for ${sectionId} (${backgroundType}):`, {
    backgroundType,
    original: dynamicTextColors,
    validated: validatedTextColors,
    background: sectionBackground,
    willUseWhiteText: backgroundType === 'primary',
    willUseDarkText: backgroundType !== 'primary'
  });

  // Content update handler
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // ✅ ENHANCED: Create enhanced color tokens with validated text colors
  const enhancedColorTokens = {
    ...colorTokens,
    
    // ✅ Validated dynamic text colors based on background
    dynamicHeading: validatedTextColors.heading,
    dynamicBody: validatedTextColors.body,
    dynamicMuted: validatedTextColors.muted,
    
    // ✅ Override primary text colors with validated ones
    textPrimary: validatedTextColors.heading,
    textSecondary: validatedTextColors.body,
    textMuted: validatedTextColors.muted,
    
    // ✅ Backwards compatibility with fallbacks
    textOnLight: colorTokens.textOnLight || validatedTextColors.heading,
    textOnDark: colorTokens.textOnDark || 'text-white',
    
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
    dynamicTextColors: validatedTextColors, // ✅ NEW: Direct access to validated dynamic colors
    getTextStyle,
    sectionBackground: getSectionBackground(),
    
    // Actions
    handleContentUpdate,
    
    // Theme access
    theme
  };
}