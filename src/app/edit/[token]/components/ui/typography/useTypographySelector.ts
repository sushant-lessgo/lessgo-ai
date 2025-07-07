// /app/edit/[token]/components/ui/typography/useTypographySelector.ts
import { useState, useMemo } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { getTypographyOptions } from './typographyCompatibility';
import { applyTypographyTheme, restoreTypographyTheme } from './typographyApplication';
import type { FontTheme } from '@/types/core/index';

export function useTypographyDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<FontTheme | null>(null);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => {
    setIsOpen(false);
    setPreviewTheme(null);
  };
  
  return { isOpen, previewTheme, setPreviewTheme, toggleDropdown, closeDropdown };
}

export function useTypographySelector() {
  const { 
    theme, 
    updateTypography, 
    triggerAutoSave, 
    onboardingData 
  } = useEditStore();
  
  const currentTone = onboardingData?.hiddenInferredFields?.toneProfile || 'minimal-technical';
  
  const availableOptions = useMemo(() => 
    getTypographyOptions(currentTone), 
    [currentTone]
  );
  
  const currentTheme: FontTheme = {
    toneId: currentTone,
    headingFont: theme.typography.headingFont,
    bodyFont: theme.typography.bodyFont
  };
  
  const applyTypography = (newTheme: FontTheme) => {
    updateTypography({
      headingFont: newTheme.headingFont,
      bodyFont: newTheme.bodyFont
    });
    applyTypographyTheme(newTheme);
    triggerAutoSave();
  };
  
  const previewTypography = (theme: FontTheme) => {
    applyTypographyTheme(theme);
  };
  
  const restoreCurrentTypography = () => {
    restoreTypographyTheme(currentTheme);
  };
  
  return { 
    availableOptions, 
    currentTheme, 
    currentTone,
    applyTypography,
    previewTypography,
    restoreCurrentTypography
  };
}