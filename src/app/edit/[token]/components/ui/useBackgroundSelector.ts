// /app/edit/[token]/components/ui/useBackgroundSelector.ts - Enhanced with Bug Fixes
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { generateCompleteBackgroundSystem } from '@/modules/Design/background/backgroundIntegration';
import { getCompatibleBackgrounds } from './backgroundCompatibility';
import type { BackgroundSystem, BackgroundVariation, BackgroundSelectorMode } from '@/types/core';

import { logger } from '@/lib/logger';
export function useBackgroundSelector(tokenId: string) {
  // Refs for cleanup and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isUnmountedRef = useRef(false);

  // EditStore integration with selective subscriptions for performance
  const { 
    theme, 
    onboardingData, 
    updateFromBackgroundSystem, 
    triggerAutoSave, 
    resetToGenerated 
  } = useEditStore();

  // Local state
  const [mode, setMode] = useState<BackgroundSelectorMode>('recommended');
  // Custom colors state (will be implemented later)
  const [customColors, setCustomColors] = useState<any>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundSystem | null>(null);
  const [previewBackground, setPreviewBackground] = useState<BackgroundSystem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [compatibilityCache, setCompatibilityCache] = useState<Map<string, BackgroundVariation[]>>(new Map());
  const [asyncCompatibleOptions, setAsyncCompatibleOptions] = useState<BackgroundVariation[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Get current background system with error handling
  const currentBackgroundSystem = useMemo((): BackgroundSystem => {
    try {
      const sectionBgs = theme.colors.sectionBackgrounds;
      
      // Use theme data if available and complete
      if (sectionBgs.primary && sectionBgs.secondary) {
        return {
          primary: sectionBgs.primary,
          secondary: sectionBgs.secondary,
          neutral: sectionBgs.neutral || 'bg-white',
          divider: sectionBgs.divider || 'bg-gray-100/50',
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          accentCSS: theme.colors.accentCSS || `bg-${theme.colors.accentColor}-600`,
        };
      }

      // Fallback to generation with validation
      if (!onboardingData || Object.keys(onboardingData).length === 0) {
        logger.warn('No onboarding data available, using safe defaults');
        return getSafeDefaultBackground();
      }

      return generateCompleteBackgroundSystem(onboardingData as any);
    } catch (error) {
      logger.error('Failed to get current background system:', error);
      return getSafeDefaultBackground();
    }
  }, [theme, onboardingData]);

  // Safe default background
  const getSafeDefaultBackground = useCallback((): BackgroundSystem => {
    return {
      primary: 'bg-gradient-to-br from-blue-500 to-blue-600',
      secondary: 'bg-blue-50',
      neutral: 'bg-white',
      divider: 'bg-gray-100/50',
      baseColor: 'blue',
      accentColor: 'blue',
      accentCSS: 'bg-blue-600',
    };
  }, []);

  // Debounced compatibility search
  const debouncedGetCompatibleBackgrounds = useCallback(
    (searchMode: BackgroundSelectorMode, current: BackgroundSystem) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (isUnmountedRef.current) return;

        const cacheKey = `${searchMode}-${current.baseColor}`;
        
        // Check cache first
        if (compatibilityCache.has(cacheKey)) {
          const cached = compatibilityCache.get(cacheKey)!;
          if (!isUnmountedRef.current && searchMode !== 'recommended') {
            setAsyncCompatibleOptions(cached);
          }
          return cached;
        }

        setIsLoading(true);
        
        try {
          const results = getCompatibleBackgrounds(searchMode, null, current);
          
          // Update cache
          setCompatibilityCache(prev => new Map(prev).set(cacheKey, results));
          
          
          if (!isUnmountedRef.current) {
            setIsLoading(false);
            // Set the async results for custom mode (recommended is synchronous)
            if (searchMode !== 'recommended') {
              setAsyncCompatibleOptions(results);
            }
          }
          
          return results;
        } catch (error) {
          logger.error('Error getting compatible backgrounds:', error);
          if (!isUnmountedRef.current) {
            setIsLoading(false);
            setValidationErrors(prev => [...prev, 'Failed to load background options']);
            setAsyncCompatibleOptions([]);
          }
          return [];
        }
      }, 150); // Standard delay for all modes
    },
    [compatibilityCache]
  );

  // Get compatible options with performance optimization
  const compatibleOptions = useMemo((): BackgroundVariation[] => {
    try {
      // Quick return for recommended mode (same as old generated)
      if (mode === 'recommended') {
        const options = getCompatibleBackgrounds('recommended', null, currentBackgroundSystem);
        // Reset loading state when options are loaded
        if (options.length > 0 && isLoading) {
          setIsLoading(false);
        }
        return options;
      }

      // For custom mode, no compatible options needed
      if (mode === 'custom') {
        // Custom mode doesn't need background variations
        // User creates their own custom background
        if (isLoading) {
          setIsLoading(false);
        }
        return [];
      }

      // Fallback
      return asyncCompatibleOptions;
      
    } catch (error) {
      logger.error('Error in compatibleOptions:', error);
      setValidationErrors(['Failed to load background options']);
      if (isLoading) {
        setIsLoading(false);
      }
      return [];
    }
  }, [mode, currentBackgroundSystem, asyncCompatibleOptions, isLoading]);

  // Enhanced validation with debouncing
  const validateSelection = useCallback((background: BackgroundSystem | null): string[] => {
    const errors: string[] = [];

    if (!background) return errors;

    try {
      // Required field validation
      if (!background.primary?.trim()) {
        errors.push('Primary background is required');
      }

      if (!background.baseColor?.trim()) {
        errors.push('Base color is required');
      }

      // Custom mode validation will be added here later

      // Accessibility validation
      if (background.primary === background.secondary) {
        errors.push('Primary and secondary backgrounds should be different for better visual hierarchy');
      }

      // CSS value validation for both modes
      if (background.primary) {
        const trimmedPrimary = background.primary.trim();

        // Validate it's a valid CSS value (hex color, rgb, rgba, linear-gradient, radial-gradient, etc.)
        const isValidCSSValue =
          trimmedPrimary.startsWith('#') || // Hex color
          trimmedPrimary.startsWith('rgb') || // RGB/RGBA color
          trimmedPrimary.startsWith('hsl') || // HSL/HSLA color
          trimmedPrimary.includes('gradient') || // Gradient
          trimmedPrimary.startsWith('bg-'); // Legacy Tailwind class (for backward compatibility)

        if (!isValidCSSValue) {
          errors.push('Invalid background format. Expected CSS color or gradient value.');
        }
      }

    } catch (error) {
      logger.error('Validation error:', error);
      errors.push('Validation failed - please try again');
    }

    return errors;
  }, [mode]);

  // Update validation when selection changes (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        const errors = validateSelection(selectedBackground || previewBackground);
        setValidationErrors(errors);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedBackground, previewBackground, validateSelection]);

  // Enhanced mode change handler
  const handleModeChange = useCallback((newMode: BackgroundSelectorMode) => {
    
    setMode(newMode);
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationErrors([]);
    setAsyncCompatibleOptions([]); // Reset async options
    setIsLoading(false); // Reset loading state when changing modes

    // Clear cache when switching modes for fresh results
    setCompatibilityCache(new Map());
  }, [mode]);

  // Enhanced apply handler with better error handling
  const handleApplyBackground = useCallback(async (): Promise<boolean> => {
    logger.debug('🎯 handleApplyBackground called');
    // Priority: selectedBackground over previewBackground
    // selectedBackground is set when user clicks a variation
    // previewBackground is for hover preview (not currently used)
    const backgroundToApply = selectedBackground || previewBackground;
    
    logger.debug('🎯 [CRITICAL DEBUG] Background to apply:', {
      selectedBackground: selectedBackground ? {
        primary: selectedBackground.primary,
        secondary: selectedBackground.secondary,
        baseColor: selectedBackground.baseColor,
        accentColor: selectedBackground.accentColor
      } : 'null',
      previewBackground: previewBackground ? {
        primary: previewBackground.primary,
        secondary: previewBackground.secondary,
        baseColor: previewBackground.baseColor,
        accentColor: previewBackground.accentColor
      } : 'null',
      finalBackgroundToApply: backgroundToApply ? {
        primary: backgroundToApply.primary,
        secondary: backgroundToApply.secondary,
        baseColor: backgroundToApply.baseColor,
        accentColor: backgroundToApply.accentColor,
        neutral: backgroundToApply.neutral,
        divider: backgroundToApply.divider,
        accentCSS: backgroundToApply.accentCSS
      } : 'null',
      timestamp: new Date().toISOString()
    });
    
    if (!backgroundToApply) {
      logger.warn('⚠️ No background selected to apply');
      setValidationErrors(['No background selected']);
      return false;
    }

    const errors = validateSelection(backgroundToApply);
    if (errors.length > 0) {
      logger.warn('⚠️ Cannot apply background with validation errors:', errors);
      setValidationErrors(errors);
      return false;
    }

    // Prevent multiple simultaneous applies
    if (isLoading) {
      logger.warn('⚠️ Already applying background, please wait');
      return false;
    }

    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Update the store with timeout protection
      const updatePromise = new Promise<void>((resolve, reject) => {
        try {
          logger.debug('🔄 [CRITICAL DEBUG] Calling updateFromBackgroundSystem with EXACT data:', {
            primary: backgroundToApply.primary,
            secondary: backgroundToApply.secondary,
            neutral: backgroundToApply.neutral,
            divider: backgroundToApply.divider,
            baseColor: backgroundToApply.baseColor,
            accentColor: backgroundToApply.accentColor,
            accentCSS: backgroundToApply.accentCSS,
            timestamp: new Date().toISOString()
          });
          updateFromBackgroundSystem(backgroundToApply);
          logger.debug('✅ updateFromBackgroundSystem completed successfully');
          resolve();
        } catch (error) {
          logger.error('❌ updateFromBackgroundSystem failed:', error);
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update timeout')), 5000);
      });

      await Promise.race([updatePromise, timeoutPromise]);

      // Trigger auto-save with timeout protection
      logger.debug('🔄 Starting auto-save...');
      try {
        const savePromise = Promise.resolve(triggerAutoSave()).then(() => {
          logger.debug('✅ Auto-save completed');
        });
        const saveTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Save timeout')), 5000); // Reduced timeout
        });

        await Promise.race([savePromise, saveTimeoutPromise]);
        logger.debug('🔄 Auto-save race completed');
      } catch (saveError) {
        logger.warn('⚠️ Auto-save failed, but background was applied:', saveError);
        // Don't fail the whole operation if just auto-save fails
      }

      logger.debug('✅ Background system applied successfully:', {
        mode,
        baseColor: backgroundToApply.baseColor,
        accentColor: backgroundToApply.accentColor,
        timestamp: new Date().toISOString(),
      });

      return true;

    } catch (error) {
      logger.error('❌ Failed to apply background system:', error);
      
      if (!isUnmountedRef.current) {
        setValidationErrors(['Failed to apply background system. Please try again.']);
      }
      
      return false;
    } finally {
      // Always reset loading state
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        logger.debug('🔄 Loading state reset');
      }
    }
  }, [selectedBackground, previewBackground, validateSelection, updateFromBackgroundSystem, triggerAutoSave, mode, isLoading]);

  // Enhanced reset handler
  const handleResetToGenerated = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Generate original background with error handling
      let originalBackground: BackgroundSystem;
      try {
        originalBackground = generateCompleteBackgroundSystem(onboardingData as any);
      } catch (error) {
        logger.warn('Failed to generate from onboarding data, using safe defaults:', error);
        originalBackground = getSafeDefaultBackground();
      }

      // Apply with timeout protection
      const resetPromise = new Promise<void>((resolve, reject) => {
        try {
          updateFromBackgroundSystem(originalBackground);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Reset timeout')), 5000);
      });

      await Promise.race([resetPromise, timeoutPromise]);

      // Update local state
      setMode('recommended');
      setSelectedBackground(null);
      setPreviewBackground(null);
      setCompatibilityCache(new Map());

      // Trigger auto-save
      await triggerAutoSave();

      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }

    } catch (error) {
      logger.error('❌ Failed to reset to generated background:', error);
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        setValidationErrors(['Failed to reset background. Please try again.']);
      }
    }
  }, [onboardingData, updateFromBackgroundSystem, triggerAutoSave, getSafeDefaultBackground]);

  // Custom colors handler (will be implemented later)
  const handleCustomColorsChange = useCallback((colors: any) => {
    setCustomColors(colors);
    
    // Clear validation errors when colors change
    setValidationErrors([]);
    
    // Clear compatibility cache to force refresh
    setCompatibilityCache(new Map());
  }, []);

  // Can apply logic with comprehensive checks
  const canApply = useMemo(() => {
    const hasSelection = !!selectedBackground; // Only check selectedBackground
    const hasNoErrors = validationErrors.length === 0;
    const isNotLoading = !isLoading;
    const hasValidBackground = hasSelection && selectedBackground?.primary;
    
    logger.debug('🔍 [DEBUG] canApply check:', {
      hasSelection,
      hasNoErrors,
      isNotLoading,
      hasValidBackground,
      selectedPrimary: selectedBackground?.primary,
      result: hasSelection && hasNoErrors && isNotLoading && hasValidBackground
    });
    
    return hasSelection && hasNoErrors && isNotLoading && hasValidBackground;
  }, [selectedBackground, validationErrors, isLoading]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const perfData = {
        mode,
        hasSelection: !!(selectedBackground || previewBackground),
        compatibleOptionsCount: compatibleOptions.length,
        validationErrors: validationErrors.length,
        canApply,
        isLoading,
        cacheSize: compatibilityCache.size,
        customColors: !!customColors,
        timestamp: new Date().toISOString(),
      };
      
    }
  }, [mode, selectedBackground, previewBackground, compatibleOptions.length, validationErrors.length, canApply, isLoading, compatibilityCache.size]);

  return {
    // State
    mode,
    selectedBackground,
    previewBackground,
    compatibleOptions,
    isLoading,
    validationErrors,
    currentBackgroundSystem,
    canApply,

    // Actions
    setMode: handleModeChange,
    setCustomColors: handleCustomColorsChange,
    setSelectedBackground,
    setPreviewBackground,
    handleApplyBackground,
    handleResetToGenerated,

    // Utilities
    validateSelection,
    
    // Performance monitoring
    cacheSize: compatibilityCache.size,
  };
}