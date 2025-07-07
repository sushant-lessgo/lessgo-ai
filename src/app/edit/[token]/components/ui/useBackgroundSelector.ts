// /app/edit/[token]/components/ui/useBackgroundSelector.ts - Enhanced with Bug Fixes
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { generateCompleteBackgroundSystem } from '@/modules/Design/background/backgroundIntegration';
import { getCompatibleBackgrounds, validateBrandColor } from './backgroundCompatibility';
import type { BackgroundSystem, BrandColors, BackgroundVariation, BackgroundSelectorMode } from '@/types/core';

export function useBackgroundSelector(tokenId: string) {
  // Refs for cleanup and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isUnmountedRef = useRef(false);

  // EditStore integration with selective subscriptions for performance
  const theme = useEditStore(state => state.theme);
  const onboardingData = useEditStore(state => state.onboardingData);
  const updateFromBackgroundSystem = useEditStore(state => state.updateFromBackgroundSystem);
  const triggerAutoSave = useEditStore(state => state.triggerAutoSave);
  const resetToGenerated = useEditStore(state => state.resetToGenerated);

  // Local state
  const [mode, setMode] = useState<BackgroundSelectorMode>('generated');
  const [brandColors, setBrandColors] = useState<BrandColors | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundSystem | null>(null);
  const [previewBackground, setPreviewBackground] = useState<BackgroundSystem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [compatibilityCache, setCompatibilityCache] = useState<Map<string, BackgroundVariation[]>>(new Map());

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
        console.warn('No onboarding data available, using safe defaults');
        return getSafeDefaultBackground();
      }

      return generateCompleteBackgroundSystem(onboardingData);
    } catch (error) {
      console.error('Failed to get current background system:', error);
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
    (searchMode: BackgroundSelectorMode, colors: BrandColors | null, current: BackgroundSystem) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (isUnmountedRef.current) return;

        const cacheKey = `${searchMode}-${JSON.stringify(colors)}-${current.baseColor}`;
        
        // Check cache first
        if (compatibilityCache.has(cacheKey)) {
          const cached = compatibilityCache.get(cacheKey)!;
          console.log('📦 Using cached compatibility results:', cached.length);
          return cached;
        }

        setIsLoading(true);
        
        try {
          const results = getCompatibleBackgrounds(searchMode, colors, current);
          
          // Update cache
          setCompatibilityCache(prev => new Map(prev).set(cacheKey, results));
          
          console.log('🔍 Found compatible backgrounds:', results.length);
          
          if (!isUnmountedRef.current) {
            setIsLoading(false);
          }
          
          return results;
        } catch (error) {
          console.error('Error getting compatible backgrounds:', error);
          if (!isUnmountedRef.current) {
            setIsLoading(false);
            setValidationErrors(prev => [...prev, 'Failed to load background options']);
          }
          return [];
        }
      }, searchMode === 'brand' ? 500 : 150); // Longer delay for brand mode
    },
    [compatibilityCache]
  );

  // Get compatible options with performance optimization
  const compatibleOptions = useMemo((): BackgroundVariation[] => {
    try {
      // Quick return for generated mode
      if (mode === 'generated') {
        return getCompatibleBackgrounds('generated', null, currentBackgroundSystem);
      }

      // Validate brand colors before processing
      if (mode === 'brand') {
        if (!brandColors?.primary) {
          return [];
        }

        const validation = validateBrandColor(brandColors.primary);
        if (!validation.isValid) {
          setValidationErrors([validation.error || 'Invalid brand color']);
          return [];
        }

        // Clear validation errors if color is valid
        setValidationErrors([]);
      }

      // Use debounced search for brand and custom modes
      return debouncedGetCompatibleBackgrounds(mode, brandColors, currentBackgroundSystem) || [];
      
    } catch (error) {
      console.error('Error in compatibleOptions:', error);
      setValidationErrors(['Failed to load background options']);
      return [];
    }
  }, [mode, brandColors, currentBackgroundSystem, debouncedGetCompatibleBackgrounds]);

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

      // Brand color validation for brand mode
      if (mode === 'brand' && brandColors?.primary) {
        const validation = validateBrandColor(brandColors.primary);
        if (!validation.isValid) {
          errors.push(validation.error || 'Invalid primary brand color');
        }

        if (brandColors.secondary) {
          const secondaryValidation = validateBrandColor(brandColors.secondary);
          if (!secondaryValidation.isValid) {
            errors.push('Invalid secondary brand color');
          }
        }
      }

      // Accessibility validation
      if (background.primary === background.secondary) {
        errors.push('Primary and secondary backgrounds should be different for better visual hierarchy');
      }

      // CSS class validation
      if (background.primary && !background.primary.startsWith('bg-')) {
        errors.push('Invalid background CSS class format');
      }

    } catch (error) {
      console.error('Validation error:', error);
      errors.push('Validation failed - please try again');
    }

    return errors;
  }, [mode, brandColors]);

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
    console.log('🎨 Background selector mode changing:', mode, '->', newMode);
    
    setMode(newMode);
    setSelectedBackground(null);
    setPreviewBackground(null);
    setValidationErrors([]);

    // Reset brand colors when leaving brand mode
    if (newMode !== 'brand') {
      setBrandColors(null);
    } else if (!brandColors) {
      // Initialize with default brand colors
      setBrandColors({
        primary: '#3B82F6',
        secondary: '#6B7280',
      });
    }

    // Clear cache when switching modes for fresh results
    setCompatibilityCache(new Map());
  }, [mode, brandColors]);

  // Enhanced apply handler with better error handling
  const handleApplyBackground = useCallback(async (): Promise<boolean> => {
    const backgroundToApply = selectedBackground || previewBackground;
    
    if (!backgroundToApply) {
      console.warn('⚠️ No background selected to apply');
      setValidationErrors(['No background selected']);
      return false;
    }

    const errors = validateSelection(backgroundToApply);
    if (errors.length > 0) {
      console.warn('⚠️ Cannot apply background with validation errors:', errors);
      setValidationErrors(errors);
      return false;
    }

    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Update the store with timeout protection
      const updatePromise = new Promise<void>((resolve, reject) => {
        try {
          updateFromBackgroundSystem(backgroundToApply);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update timeout')), 5000);
      });

      await Promise.race([updatePromise, timeoutPromise]);

      // Trigger auto-save with timeout protection
      const savePromise = triggerAutoSave();
      const saveTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save timeout')), 10000);
      });

      await Promise.race([savePromise, saveTimeoutPromise]);

      console.log('✅ Background system applied successfully:', {
        mode,
        baseColor: backgroundToApply.baseColor,
        accentColor: backgroundToApply.accentColor,
        timestamp: new Date().toISOString(),
      });

      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }
      
      return true;

    } catch (error) {
      console.error('❌ Failed to apply background system:', error);
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        setValidationErrors(['Failed to apply background system. Please try again.']);
      }
      
      return false;
    }
  }, [selectedBackground, previewBackground, validateSelection, updateFromBackgroundSystem, triggerAutoSave, mode]);

  // Enhanced reset handler
  const handleResetToGenerated = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Generate original background with error handling
      let originalBackground: BackgroundSystem;
      try {
        originalBackground = generateCompleteBackgroundSystem(onboardingData);
      } catch (error) {
        console.warn('Failed to generate from onboarding data, using safe defaults:', error);
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
      setMode('generated');
      setSelectedBackground(null);
      setPreviewBackground(null);
      setBrandColors(null);
      setCompatibilityCache(new Map());

      // Trigger auto-save
      await triggerAutoSave();

      console.log('🔄 Reset to LessGo-generated background completed');
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Failed to reset to generated background:', error);
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        setValidationErrors(['Failed to reset background. Please try again.']);
      }
    }
  }, [onboardingData, updateFromBackgroundSystem, triggerAutoSave, getSafeDefaultBackground]);

  // Enhanced brand colors handler with validation
  const handleBrandColorsChange = useCallback((colors: BrandColors | null) => {
    setBrandColors(colors);
    
    // Clear validation errors when colors change
    setValidationErrors([]);
    
    // Clear compatibility cache to force refresh
    setCompatibilityCache(new Map());
  }, []);

  // Can apply logic with comprehensive checks
  const canApply = useMemo(() => {
    const hasSelection = !!(selectedBackground || previewBackground);
    const hasNoErrors = validationErrors.length === 0;
    const isNotLoading = !isLoading;
    const hasValidBackground = hasSelection && (selectedBackground?.primary || previewBackground?.primary);
    
    return hasSelection && hasNoErrors && isNotLoading && hasValidBackground;
  }, [selectedBackground, previewBackground, validationErrors, isLoading]);

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
        brandColors: !!brandColors,
        timestamp: new Date().toISOString(),
      };
      
      console.log('🎨 Background Selector Performance:', perfData);
    }
  }, [mode, selectedBackground, previewBackground, compatibleOptions.length, validationErrors.length, canApply, isLoading, compatibilityCache.size, brandColors]);

  return {
    // State
    mode,
    brandColors,
    selectedBackground,
    previewBackground,
    compatibleOptions,
    isLoading,
    validationErrors,
    currentBackgroundSystem,
    canApply,

    // Actions
    setMode: handleModeChange,
    setBrandColors: handleBrandColorsChange,
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