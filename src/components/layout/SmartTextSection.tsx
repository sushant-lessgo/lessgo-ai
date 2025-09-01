// components/layout/SmartTextSection.tsx - Auto-applies smart text colors
import React from 'react';
import { useSmartTextColors } from '@/hooks/useSmartTextColors';
import type { BackgroundType } from '@/types/sectionBackground';
import { logger } from '@/lib/logger';

interface SmartTextSectionProps {
  children: React.ReactNode;
  backgroundType: BackgroundType;
  sectionBackgroundCSS: string;
  className?: string;
  sectionId?: string;
}

/**
 * Wrapper component that automatically applies smart text colors based on background
 */
export function SmartTextSection({ 
  children, 
  backgroundType, 
  sectionBackgroundCSS, 
  className = '',
  sectionId = ''
}: SmartTextSectionProps) {
  // Convert new BackgroundType to the expected theme color type
  const themeColorType = (backgroundType === 'theme' || backgroundType === 'custom') 
    ? 'primary' 
    : backgroundType as 'primary' | 'secondary' | 'neutral' | 'divider';
  
  const smartColors = useSmartTextColors(themeColorType);
  
  // Debug logging
  logger.dev(`🎨 SmartTextSection for ${sectionId}:`, () => ({
    backgroundType,
    sectionBackgroundCSS,
    smartColors
  }));
  
  return (
    <section 
      className={`${sectionBackgroundCSS} ${className}`}
      style={{
        // CSS custom properties that children can use
        '--smart-text-heading': smartColors.heading,
        '--smart-text-body': smartColors.body,
        '--smart-text-muted': smartColors.muted,
      } as React.CSSProperties}
      data-background-type={backgroundType}
      data-contrast-rating={smartColors.contrastRating}
    >
      {children}
    </section>
  );
}

/**
 * CSS classes that use the smart text color variables
 */
export const smartTextClasses = {
  heading: 'text-[var(--smart-text-heading)]',
  body: 'text-[var(--smart-text-body)]',
  muted: 'text-[var(--smart-text-muted)]',
};

/**
 * Hook to get the smart text CSS classes for use in components
 */
export function useSmartTextClasses() {
  return smartTextClasses;
}