// hooks/useLayoutComponent.ts - ENHANCED with Dynamic Text Colors
// Central hook that combines all common layout component patterns

import { useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
  sectionBackgroundCSS, // ✅ NEW: Accept the CSS class from renderer
  contentSchema 
}: UseLayoutComponentProps) {
  
  console.log(`🔍 useLayoutComponent DEBUG for ${sectionId}:`, {
    backgroundType,
    sectionBackgroundCSS,
    hasSectionBackgroundCSS: !!sectionBackgroundCSS
  });
  
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
  // console.log(`🔍 useLayoutComponent extracting content for ${sectionId}:`, {
  //   elements: elements,
  //   elementKeys: Object.keys(elements),
  //   firstElement: Object.values(elements)[0],
  //   contentSchema: Object.keys(contentSchema)
  // });
  
  const blockContent = extractLayoutContent(elements, contentSchema) as T;
  
  // console.log(`📦 Extracted blockContent for ${sectionId}:`, {
  //   blockContent,
  //   headlineType: typeof blockContent.headline,
  //   headlineValue: blockContent.headline
  // });

  // Get color tokens from store
  const colorTokens = getColorTokens();

  // ✅ FIXED: Always use store backgroundType in edit mode for live updates
  const getSectionBackground = () => {
    // ✅ In edit mode, ALWAYS calculate from current store backgroundType
    if (mode === 'edit') {
      const currentBackgroundType = sectionContent?.backgroundType || backgroundType;
      const customBackground = sectionContent?.sectionBackground;
      const backgrounds = theme?.colors?.sectionBackgrounds;
      
      console.log(`🔍 EDIT MODE Background calc for ${sectionId}:`, {
        sectionContentExists: !!sectionContent,
        storedBackgroundType: sectionContent?.backgroundType,
        propsBackgroundType: backgroundType,
        finalBackgroundType: currentBackgroundType,
        hasCustomBackground: !!customBackground,
        customBackgroundType: customBackground?.type,
        hasSectionBackgrounds: !!backgrounds
      });
      
      // ✅ NEW: Handle custom backgrounds
      if (currentBackgroundType === 'custom' && customBackground?.type === 'custom' && customBackground.custom) {
        const custom = customBackground.custom;
        let customCSS = '';
        
        if (custom.solid) {
          // Solid color background - handle both {color: '#hex'} and '#hex' formats
          const solidColor = typeof custom.solid === 'string' ? custom.solid : custom.solid.color;
          customCSS = `bg-[${solidColor}]`;
        } else if (custom.gradient) {
          // Gradient background
          const { type, angle, stops } = custom.gradient;
          const gradientStops = stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
          
          if (type === 'linear') {
            customCSS = `bg-[linear-gradient(${angle}deg, ${gradientStops})]`;
          } else if (type === 'radial') {
            customCSS = `bg-[radial-gradient(circle, ${gradientStops})]`;
          }
        }
        
        console.log(`🎨 useLayoutComponent CUSTOM: Generated CSS for ${sectionId}:`, {
          custom,
          generatedCSS: customCSS
        });
        return customCSS;
      }
      
      if (!backgrounds) {
        console.warn('No section backgrounds found in theme, using fallback');
        return 'bg-white';
      }

      const editModeCSS = (() => {
        switch(currentBackgroundType) {
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
      
      console.log(`🎨 useLayoutComponent EDIT MODE: Recalculated CSS for ${sectionId}:`, {
        storedBackgroundType: currentBackgroundType,
        calculatedCSS: editModeCSS
      });
      return editModeCSS;
    }
    
    // ✅ In preview mode, use the CSS class from renderer for performance
    if (sectionBackgroundCSS) {
      console.log(`🎨 useLayoutComponent: Using CSS from renderer for ${sectionId}:`, sectionBackgroundCSS);
      return sectionBackgroundCSS;
    }
    
    // ✅ Fallback to local calculation (for standalone component usage)
    const customBackground = sectionContent?.sectionBackground;
    
    // ✅ Handle custom backgrounds in fallback mode too
    if (backgroundType === 'custom' && customBackground?.type === 'custom' && customBackground.custom) {
      const custom = customBackground.custom;
      let customCSS = '';
      
      if (custom.solid) {
        // Handle both {color: '#hex'} and '#hex' formats
        const solidColor = typeof custom.solid === 'string' ? custom.solid : custom.solid.color;
        customCSS = `bg-[${solidColor}]`;
      } else if (custom.gradient) {
        const { type, angle, stops } = custom.gradient;
        const gradientStops = stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
        
        if (type === 'linear') {
          customCSS = `bg-[linear-gradient(${angle}deg, ${gradientStops})]`;
        } else if (type === 'radial') {
          customCSS = `bg-[radial-gradient(circle, ${gradientStops})]`;
        }
      }
      
      console.log(`🎨 useLayoutComponent FALLBACK CUSTOM: Generated CSS for ${sectionId}:`, customCSS);
      return customCSS;
    }
    
    const backgrounds = theme?.colors?.sectionBackgrounds;
    if (!backgrounds) {
      console.warn('No section backgrounds found in theme, using fallback');
      return 'bg-white';
    }

    const fallbackCSS = (() => {
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
    
    console.log(`🎨 useLayoutComponent: Using fallback CSS for ${sectionId}:`, fallbackCSS);
    return fallbackCSS;
  };

  // ✅ NEW: Get dynamic text colors based on background type
  const currentBackgroundType = sectionContent?.backgroundType || backgroundType;
  const customBackground = sectionContent?.sectionBackground;
  
  // ✅ Determine effective background type for text color calculation
  let effectiveBackgroundType = currentBackgroundType;
  
  // ✅ For custom backgrounds, analyze if they're light or dark
  if (currentBackgroundType === 'custom' && customBackground?.type === 'custom' && customBackground.custom) {
    const custom = customBackground.custom;
    
    // Simple heuristic: analyze the primary color to determine if background is light or dark
    let primaryColor = '#ffffff'; // default to light
    
    if (custom.solid) {
      // Handle both {color: '#hex'} and '#hex' formats
      primaryColor = typeof custom.solid === 'string' ? custom.solid : custom.solid.color;
    } else if (custom.gradient && custom.gradient.stops.length > 0) {
      // Use the first color stop as primary color
      primaryColor = custom.gradient.stops[0].color;
    }
    
    // Convert hex to RGB and calculate luminance
    // Ensure primaryColor is a valid string and has # prefix
    const validColor = typeof primaryColor === 'string' && primaryColor ? primaryColor : '#ffffff';
    const normalizedColor = validColor.startsWith('#') ? validColor : `#${validColor}`;
    const hex = normalizedColor.replace('#', '');
    
    // Handle both 3-char and 6-char hex colors
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else {
      // Invalid hex, default to white
      r = 255; g = 255; b = 255;
    }
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If luminance < 0.5, it's a dark background, treat like primary
    // If luminance >= 0.5, it's a light background, treat like neutral
    effectiveBackgroundType = luminance < 0.5 ? 'primary' : 'neutral';
    
    console.log(`🎨 Custom background analysis for ${sectionId}:`, {
      primaryColor,
      rgb: { r, g, b },
      luminance,
      effectiveBackgroundType
    });
  }

  const dynamicTextColors = getTextColorForBackground(effectiveBackgroundType, colorTokens);

  // ✅ CONSERVATIVE: Always use safe gray text colors for maximum readability
  const sectionBackground = getSectionBackground();
  
  console.log(`🎨 Final sectionBackground for ${sectionId}:`, sectionBackground);
  const validatedTextColors = {
    heading: effectiveBackgroundType === 'primary' ? 'text-white' : 'text-gray-900',
    body: effectiveBackgroundType === 'primary' ? 'text-gray-100' : 'text-gray-700',
    muted: effectiveBackgroundType === 'primary' ? 'text-gray-300' : 'text-gray-500'
  };

  // console.log(`🎨 Dynamic text colors for ${sectionId} (${backgroundType}):`, {
  //   backgroundType,
  //   original: dynamicTextColors,
  //   validated: validatedTextColors,
  //   background: sectionBackground,
  //   willUseWhiteText: backgroundType === 'primary',
  //   willUseDarkText: backgroundType !== 'primary'
  // });

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
  // console.log(`Layout Component ${sectionId}:`, {
  //   backgroundType,
  //   sectionBackground: getSectionBackground(),
  //   mode,
  //   hasContent: Object.keys(elements).length > 0,
  //   backgroundCSS: getSectionBackground(),
  //   ctaColors: {
  //     bg: enhancedColorTokens.ctaBg,
  //     hover: enhancedColorTokens.ctaHover,
  //     text: enhancedColorTokens.ctaText
  //   }
  // });

  return {
    // Core data
    sectionId,
    mode,
    blockContent,
    backgroundType: effectiveBackgroundType, // ✅ UPDATED: Use effective background type for components
    
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