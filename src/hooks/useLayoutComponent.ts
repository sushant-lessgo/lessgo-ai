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
import { getSmartTextColor } from '@/utils/improvedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
// ARCHIVED: selectOptionalElements.ts moved to archive/sections/
// AI now decides optional elements at generation time, stored in aiMetadata.excludedElements

import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';
export interface UseLayoutComponentProps extends LayoutComponentProps {
  contentSchema?: Record<string, { type: 'string' | 'array' | 'boolean' | 'number'; default: string | boolean | number | any[] }>;
}

export function useLayoutComponent<T = Record<string, any>>({ 
  sectionId, 
  backgroundType = 'neutral',
  sectionBackgroundCSS, // ✅ NEW: Accept the CSS class from renderer
  contentSchema 
}: UseLayoutComponentProps) {
  
  //   backgroundType,
  //   sectionBackgroundCSS,
  //   hasSectionBackgroundCSS: !!sectionBackgroundCSS
  // });
  
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
  const layout = sectionContent?.layout;

  // Get excluded optional elements for this section
  // AI decides optional elements at generation time, stored in aiMetadata.excludedElements
  // If no stored exclusions, default to empty array (all optional elements shown)
  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = (storedExclusions && Array.isArray(storedExclusions))
    ? storedExclusions
    : [];

  if (excludedElements.length > 0) {
    logger.dev(`💾 [STORED_EXCLUSION] ${sectionId} using ${excludedElements.length} stored exclusions from AI generation:`, {
      excludedCount: excludedElements.length,
      excludedElements: excludedElements
    });
  }

  // Extract content with type safety and defaults
  //   elements: elements,
  //   elementKeys: Object.keys(elements),
  //   firstElement: Object.values(elements)[0],
  //   contentSchema: Object.keys(contentSchema),
  //   excludedElements
  // });
  
  // DEBUG: Log what exclusions are being passed to extractLayoutContent
  logger.dev(`🔄 [EXTRACT_CONTENT] ${sectionId} passing exclusions to extractLayoutContent:`, {
    layout,
    excludedElementsLength: excludedElements.length,
    excludedElements: excludedElements,
    hasExclusions: excludedElements.length > 0
  });

  // Resolve schema: prop > central schema fallback
  const resolvedSchema = contentSchema || (layout ? getSchemaDefaults(layout) : null);
  if (!resolvedSchema) {
    logger.error(`No schema for section ${sectionId}, layout ${layout}`);
    return {} as any;
  }

  const blockContent = extractLayoutContent(elements, resolvedSchema, layout, excludedElements) as T;
  
  //   blockContent,
  //   headlineType: typeof blockContent.headline,
  //   headlineValue: blockContent.headline
  // });

  // Get color tokens from store
  const colorTokens = getColorTokens();

  // ✅ FIXED: Always use store backgroundType in edit mode for live updates
  const getSectionBackground = () => {
    // ✅ In edit mode, ALWAYS calculate from current store backgroundType
    if (mode !== 'preview') {
      const currentBackgroundType = sectionContent?.backgroundType || backgroundType;
      const customBackground = sectionContent?.sectionBackground;
      const backgrounds = theme?.colors?.sectionBackgrounds;
      
      //   sectionContentExists: !!sectionContent,
      //   storedBackgroundType: sectionContent?.backgroundType,
      //   propsBackgroundType: backgroundType,
      //   finalBackgroundType: currentBackgroundType,
      //   hasCustomBackground: !!customBackground,
      //   customBackgroundType: customBackground?.type,
      //   hasSectionBackgrounds: !!backgrounds
      // });
      
      // ✅ NEW: Handle custom backgrounds
      if (currentBackgroundType === 'custom' && customBackground?.type === 'custom' && customBackground.custom) {
        const custom = customBackground.custom;
        let customCSS = '';
        
        if (custom.solid) {
          // Solid color background - handle both {color: '#hex'} and '#hex' formats
          const solidColor = typeof custom.solid === 'string' ? custom.solid : (custom.solid as any).color;
          customCSS = solidColor;
        } else if (custom.gradient) {
          // Gradient background
          const { type, angle, stops } = custom.gradient as any;
          const gradientStops = stops.map((stop: any) => `${stop.color} ${stop.position}%`).join(', ');

          if (type === 'linear') {
            customCSS = `linear-gradient(${angle}deg, ${gradientStops})`;
          } else if (type === 'radial') {
            customCSS = `radial-gradient(circle, ${gradientStops})`;
          }
        }

        //   custom,
        //   generatedCSS: customCSS
        // });
        return customCSS;
      }

      if (!backgrounds) {
        logger.warn('No section backgrounds found in theme, using fallback');
        return '#ffffff';
      }

      const editModeCSS = (() => {
        switch(currentBackgroundType) {
          case 'primary': 
            return backgrounds.primary || 'linear-gradient(135deg, #3b82f6, #2563eb)';
          case 'secondary':
            return backgrounds.secondary || '#f9fafb';
          default:
            return backgrounds.neutral || '#ffffff';
        }
      })();

      //   storedBackgroundType: currentBackgroundType,
      //   calculatedCSS: editModeCSS
      // });
      return editModeCSS;
    }

    // ✅ In preview mode, use the CSS class from renderer for performance
    if (sectionBackgroundCSS) {
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
        const solidColor = typeof custom.solid === 'string' ? custom.solid : (custom.solid as any).color;
        customCSS = solidColor;
      } else if (custom.gradient) {
        const { type, angle, stops } = custom.gradient as any;
        const gradientStops = stops.map((stop: any) => `${stop.color} ${stop.position}%`).join(', ');

        if (type === 'linear') {
          customCSS = `linear-gradient(${angle}deg, ${gradientStops})`;
        } else if (type === 'radial') {
          customCSS = `radial-gradient(circle, ${gradientStops})`;
        }
      }
      
      return customCSS;
    }
    
    const backgrounds = theme?.colors?.sectionBackgrounds;
    if (!backgrounds) {
      logger.warn('No section backgrounds found in theme, using fallback');
      return '#ffffff';
    }

    const fallbackCSS = (() => {
      switch(backgroundType) {
        case 'primary':
          return backgrounds.primary || 'linear-gradient(135deg, #3b82f6, #2563eb)';
        case 'secondary':
          return backgrounds.secondary || '#f9fafb';
        default:
          return backgrounds.neutral || '#ffffff';
      }
    })();

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
      primaryColor = typeof custom.solid === 'string' ? custom.solid : (custom.solid as any).color;
    } else if (custom.gradient && (custom.gradient as any).stops?.length > 0) {
      // Use the first color stop as primary color
      primaryColor = (custom.gradient as any).stops[0].color;
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
    
    logger.debug(`🎨 Custom background analysis for ${sectionId}:`, {
      primaryColor,
      rgb: { r, g, b },
      luminance,
      effectiveBackgroundType
    });
  }

  // ✅ ENHANCED: Use new smart text color system with WCAG validation
  const sectionBackground = getSectionBackground();

  // Map background types to storage keys
  const mapBackgroundTypeToStorageKey = (bgType: string): string => {
    const mapping: Record<string, string> = {
      'primary-highlight': 'primary',
      'secondary-highlight': 'secondary',
      'neutral': 'neutral',
      'primary': 'primary',
      'secondary': 'secondary'
    };
    return mapping[bgType] || bgType;
  };

  // Get smart text colors - prioritize stored colors over recalculation
  // ✅ ENHANCED: Check stored text colors first, then theme overrides, finally calculate
  const getEffectiveTextColor = (type: 'heading' | 'body' | 'muted') => {
    // First priority: Check for stored text colors from generation
    if (theme?.colors?.textColors && currentBackgroundType !== 'custom') {
      // Map the background type to the storage key
      const storageKey = mapBackgroundTypeToStorageKey(currentBackgroundType);
      const storedColors = theme.colors.textColors[storageKey as keyof typeof theme.colors.textColors];
      if (storedColors && storedColors[type]) {
        return storedColors[type];
      }
    }
    
    // Second priority: Check for manual overrides
    if ((theme as any)?.textColorMode === 'manual' && (theme as any)?.textColorOverrides?.[type]) {
      return (theme as any).textColorOverrides[type];
    }
    
    // Last resort: Calculate from RAW palette (not compiled CSS with textures)
    // Texture rgba overlays poison luminance when parsed without alpha
    const { getPaletteById } = require('@/modules/Design/background/palettes');
    const { getSmartTextColor } = require('@/utils/improvedTextColors');
    const palette = getPaletteById(theme?.colors?.paletteId);
    const bgKey = mapBackgroundTypeToStorageKey(currentBackgroundType) as 'primary' | 'secondary' | 'neutral';
    const rawBg = palette?.[bgKey] || sectionBackground;
    const baseColor = getSmartTextColor(rawBg, type);
    
    // Apply contrast level adjustment if specified
    const contrastLevel = (theme as any)?.textContrastLevel || 50;
    if (contrastLevel !== 50) {
      // TODO: Implement contrast adjustment logic
      // For now, just return the base color
      return baseColor;
    }
    
    return baseColor;
  };

  const smartTextColors = {
    heading: getEffectiveTextColor('heading'),
    body: getEffectiveTextColor('body'),
    muted: getEffectiveTextColor('muted')
  };
  
  // Debug log for text color mode
  if ((theme as any)?.textColorMode === 'manual') {
    //   mode: (theme as any).textColorMode,
    //   overrides: (theme as any).textColorOverrides,
    //   contrastLevel: (theme as any).textContrastLevel,
    //   effectiveColors: smartTextColors
    // });
  }
  
  // Convert hex colors to Tailwind classes for backwards compatibility
  const hexToTailwindClass = (hexColor: string): string => {
    switch (hexColor) {
      case '#ffffff': return 'text-white';
      case '#f9fafb': return 'text-gray-50';
      case '#f3f4f6': return 'text-gray-100';
      case '#e5e7eb': return 'text-gray-200';
      case '#d1d5db': return 'text-gray-300';
      case '#9ca3af': return 'text-gray-400';
      case '#6b7280': return 'text-gray-500';
      case '#4b5563': return 'text-gray-600';
      case '#374151': return 'text-gray-700';
      case '#1f2937': return 'text-gray-800';
      case '#111827': return 'text-gray-900';
      default: return 'text-gray-900'; // Safe fallback
    }
  };
  
  const validatedTextColors = {
    heading: hexToTailwindClass(smartTextColors.heading),
    body: hexToTailwindClass(smartTextColors.body),
    muted: hexToTailwindClass(smartTextColors.muted)
  };

  // Legacy compatibility - keep old approach as fallback
  // Map BackgroundType to ThemeColorType for the legacy function
  const legacyBackgroundType = effectiveBackgroundType === 'theme' ? 'primary' : 
                               effectiveBackgroundType === 'custom' ? 'neutral' : 
                               effectiveBackgroundType;
  const dynamicTextColors = getTextColorForBackground(legacyBackgroundType, colorTokens);

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