// /app/edit/[token]/components/ui/useColorSystemSelector.ts
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { updateInteractiveColors, updateTextContrast, updateOverallIntensity } from './colorSemanticUpdates';
import type { 
  ColorTokens, 
  ColorIntensityLevel, 
  TextContrastLevel, 
  BackgroundSystem 
} from '@/types/core';

export function useColorSystemSelector(tokenId: string) {
  // Refs for cleanup and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isUnmountedRef = useRef(false);

  // EditStore integration with selective subscriptions
  const theme = useEditStore(state => state.theme);
  const getColorTokens = useEditStore(state => state.getColorTokens);
  const updateColorTokens = useEditStore(state => state.updateColorTokens);
  const triggerAutoSave = useEditStore(state => state.triggerAutoSave);
  const resetToGenerated = useEditStore(state => state.resetToGenerated);

  // Local state
  const [previewTokens, setPreviewTokens] = useState<ColorTokens | null>(null);
  const [selectedAccent, setSelectedAccent] = useState<string>('');
  const [textContrast, setTextContrast] = useState<TextContrastLevel>('balanced');
  const [overallIntensity, setOverallIntensity] = useState<ColorIntensityLevel>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Get current color tokens with error handling
  const currentColorTokens = useMemo((): ColorTokens => {
    try {
      return getColorTokens();
    } catch (error) {
      console.error('Failed to get current color tokens:', error);
      // Return safe defaults
      return {
        accent: 'bg-blue-600',
        accentHover: 'bg-blue-700',
        accentBorder: 'border-blue-600',
        ctaBg: 'bg-blue-600',
        ctaHover: 'bg-blue-700',
        ctaText: 'text-white',
        ctaSecondary: 'bg-gray-100',
        ctaSecondaryHover: 'bg-gray-200',
        ctaSecondaryText: 'text-gray-700',
        ctaGhost: 'text-blue-600',
        ctaGhostHover: 'bg-blue-50',
        link: 'text-blue-600',
        linkHover: 'text-blue-700',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        textOnLight: 'text-gray-900',
        textOnDark: 'text-white',
        textOnAccent: 'text-white',
        textInverse: 'text-white',
        bgPrimary: 'bg-gradient-to-r from-blue-500 to-blue-600',
        bgSecondary: 'bg-blue-50',
        bgNeutral: 'bg-white',
        bgDivider: 'bg-gray-100/50',
        surfaceCard: 'bg-white',
        surfaceElevated: 'bg-blue-50',
        surfaceSection: 'bg-blue-100',
        surfaceOverlay: 'bg-black/20',
        borderDefault: 'border-gray-200',
        borderSubtle: 'border-gray-100',
        borderFocus: 'border-blue-500',
      };
    }
  }, [getColorTokens]);

  // Get current background system with error handling
  const currentBackgroundSystem = useMemo((): BackgroundSystem | null => {
    try {
      const sectionBgs = theme.colors.sectionBackgrounds;
      
      // Check if we have a complete background system
      if (sectionBgs.primary && sectionBgs.secondary && theme.colors.accentCSS) {
        return {
          primary: sectionBgs.primary,
          secondary: sectionBgs.secondary,
          neutral: sectionBgs.neutral || 'bg-white',
          divider: sectionBgs.divider || 'bg-gray-100/50',
          baseColor: theme.colors.baseColor,
          accentColor: theme.colors.accentColor,
          accentCSS: theme.colors.accentCSS,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current background system:', error);
      return null;
    }
  }, [theme]);

  // Initialize state from current colors
  useEffect(() => {
    if (currentBackgroundSystem && !selectedAccent) {
      setSelectedAccent(currentBackgroundSystem.accentColor);
    }
    
    if (!previewTokens) {
      setPreviewTokens(currentColorTokens);
    }
  }, [currentBackgroundSystem, currentColorTokens, selectedAccent, previewTokens]);

  // Enhanced validation with debouncing
  const validateColors = useCallback((tokens: ColorTokens | null): string[] => {
    const errors: string[] = [];

    if (!tokens) {
      errors.push('No color tokens to validate');
      return errors;
    }

    if (!currentBackgroundSystem) {
      errors.push('Background system required - select background first');
      return errors;
    }

    try {
      // Required field validation
      if (!tokens.ctaBg?.trim()) {
        errors.push('Primary CTA color is required');
      }

      if (!tokens.textPrimary?.trim()) {
        errors.push('Primary text color is required');
      }

      // Basic accessibility validation
      if (tokens.ctaBg === tokens.ctaSecondary) {
        errors.push('Primary and secondary CTAs should be different');
      }

      // CSS class validation
      if (tokens.ctaBg && !tokens.ctaBg.startsWith('bg-')) {
        errors.push('Invalid CTA background CSS class format');
      }

    } catch (error) {
      console.error('Validation error:', error);
      errors.push('Validation failed - please try again');
    }

    return errors;
  }, [currentBackgroundSystem]);

  // Update validation when preview changes (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        const errors = validateColors(previewTokens);
        setValidationErrors(errors);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [previewTokens, validateColors]);

  // Accent color change handler
  const handleAccentChange = useCallback((newAccent: string) => {
    if (!currentBackgroundSystem) {
      setValidationErrors(['Background system required']);
      return;
    }

    setSelectedAccent(newAccent);
    
    try {
      const updatedTokens = updateInteractiveColors(
        newAccent, 
        currentBackgroundSystem.baseColor, 
        currentColorTokens
      );
      setPreviewTokens(updatedTokens);
      setValidationErrors([]);
    } catch (error) {
      console.error('Failed to update accent color:', error);
      setValidationErrors(['Failed to update accent color']);
    }
  }, [currentBackgroundSystem, currentColorTokens]);

  // Text contrast change handler
  const handleTextContrastChange = useCallback((level: TextContrastLevel) => {
    if (!currentBackgroundSystem) {
      setValidationErrors(['Background system required']);
      return;
    }

    setTextContrast(level);
    
    try {
      const updatedTokens = updateTextContrast(
        level, 
        currentBackgroundSystem.baseColor, 
        previewTokens || currentColorTokens
      );
      setPreviewTokens(updatedTokens);
      setValidationErrors([]);
    } catch (error) {
      console.error('Failed to update text contrast:', error);
      setValidationErrors(['Failed to update text contrast']);
    }
  }, [currentBackgroundSystem, previewTokens, currentColorTokens]);

  // Overall intensity change handler
  const handleIntensityChange = useCallback((level: ColorIntensityLevel) => {
    setOverallIntensity(level);
    
    try {
      const updatedTokens = updateOverallIntensity(
        level, 
        previewTokens || currentColorTokens
      );
      setPreviewTokens(updatedTokens);
      setValidationErrors([]);
    } catch (error) {
      console.error('Failed to update intensity:', error);
      setValidationErrors(['Failed to update intensity']);
    }
  }, [previewTokens, currentColorTokens]);

  // Apply colors handler
  const handleApplyColors = useCallback(async (): Promise<boolean> => {
    if (!previewTokens) {
      console.warn('No preview tokens to apply');
      setValidationErrors(['No color changes to apply']);
      return false;
    }

    const errors = validateColors(previewTokens);
    if (errors.length > 0) {
      console.warn('Cannot apply colors with validation errors:', errors);
      setValidationErrors(errors);
      return false;
    }

    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Update the store with timeout protection
      const updatePromise = new Promise<void>((resolve, reject) => {
        try {
          updateColorTokens(previewTokens);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update timeout')), 5000);
      });

      await Promise.race([updatePromise, timeoutPromise]);

      // Trigger auto-save
      await triggerAutoSave();

      console.log('✅ Color system applied successfully:', {
        selectedAccent,
        textContrast,
        overallIntensity,
        timestamp: new Date().toISOString(),
      });

      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }
      
      return true;

    } catch (error) {
      console.error('❌ Failed to apply color system:', error);
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        setValidationErrors(['Failed to apply color system. Please try again.']);
      }
      
      return false;
    }
  }, [previewTokens, validateColors, updateColorTokens, triggerAutoSave, selectedAccent, textContrast, overallIntensity]);

  // Reset to generated handler
  const handleResetToGenerated = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setValidationErrors([]);

      // Reset to original generated colors
      await resetToGenerated();

      // Reset local state
      setPreviewTokens(null);
      setSelectedAccent(currentBackgroundSystem?.accentColor || '');
      setTextContrast('balanced');
      setOverallIntensity('medium');

      console.log('🔄 Reset to LessGo-generated colors completed');
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Failed to reset to generated colors:', error);
      
      if (!isUnmountedRef.current) {
        setIsLoading(false);
        setValidationErrors(['Failed to reset colors. Please try again.']);
      }
    }
  }, [resetToGenerated, currentBackgroundSystem]);

  // Reset preview (for cancel)
  const resetPreview = useCallback(() => {
    setPreviewTokens(currentColorTokens);
    setSelectedAccent(currentBackgroundSystem?.accentColor || '');
    setTextContrast('balanced');
    setOverallIntensity('medium');
    setValidationErrors([]);
  }, [currentColorTokens, currentBackgroundSystem]);

  // Can apply logic
  const canApply = useMemo(() => {
    const hasPreview = !!previewTokens;
    const hasNoErrors = validationErrors.length === 0;
    const isNotLoading = !isLoading;
    const hasBackgroundSystem = !!currentBackgroundSystem;
    const hasChanges = JSON.stringify(previewTokens) !== JSON.stringify(currentColorTokens);
    
    return hasPreview && hasNoErrors && isNotLoading && hasBackgroundSystem && hasChanges;
  }, [previewTokens, validationErrors, isLoading, currentBackgroundSystem, currentColorTokens]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const perfData = {
        hasPreview: !!previewTokens,
        selectedAccent,
        textContrast,
        overallIntensity,
        validationErrors: validationErrors.length,
        canApply,
        isLoading,
        hasBackgroundSystem: !!currentBackgroundSystem,
        timestamp: new Date().toISOString(),
      };
      
      console.log('🎨 Color System Selector Performance:', perfData);
    }
  }, [previewTokens, selectedAccent, textContrast, overallIntensity, validationErrors.length, canApply, isLoading, currentBackgroundSystem]);

  return {
    // State
    currentColorTokens,
    currentBackgroundSystem,
    previewTokens: previewTokens || currentColorTokens,
    selectedAccent,
    textContrast,
    overallIntensity,
    canApply,
    isLoading,
    validationErrors,

    // Actions
    setSelectedAccent: handleAccentChange,
    setTextContrast: handleTextContrastChange,
    setOverallIntensity: handleIntensityChange,
    handleApplyColors,
    handleResetToGenerated,
    resetPreview,

    // Utilities
    validateColors,
  };
}