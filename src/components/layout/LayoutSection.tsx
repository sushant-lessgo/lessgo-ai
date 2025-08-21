import React, { forwardRef } from 'react';
import type { BackgroundType } from '@/types/sectionBackground';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface LayoutSectionProps {
  sectionId: string;
  sectionType: string;
  backgroundType: BackgroundType;
  sectionBackground: string;
  mode: 'edit' | 'preview';
  className?: string;
  children: React.ReactNode;
  editModeInfo?: {
    componentName: string;
    description?: string;
    tips?: string[];
  };
}

export const LayoutSection = forwardRef<HTMLElement, LayoutSectionProps>(({
  sectionId,
  sectionType,
  backgroundType,
  sectionBackground,
  mode,
  className = '',
  children,
  editModeInfo,
}, ref) => {
  
  // Get section-specific spacing from store
  const store = useEditStore();
  const sectionSpacing = store.sectionSpacing;
  const spacingValue = sectionSpacing?.[sectionId];
  
  // Map spacing values to Tailwind classes
  const getSpacingClass = (spacing?: string): string => {
    switch (spacing) {
      case 'compact':
        return 'py-12'; // 48px
      case 'spacious':
        return 'py-24'; // 96px
      case 'extra':
        return 'py-32'; // 128px
      case 'normal':
      default:
        return 'py-16'; // 64px (default)
    }
  };
  
  const spacingClass = getSpacingClass(spacingValue);
  
  // ✅ CRITICAL FIX: Extract inline style for complex gradients that Tailwind may not process
  const getInlineStyleFromTailwind = (cssClass: string): React.CSSProperties | undefined => {
    // Check if it's a complex gradient in bracket notation
    const gradientMatch = cssClass.match(/bg-\[(linear-gradient\([^)]+\))\]/);
    if (gradientMatch) {
      const gradientCSS = gradientMatch[1];
      console.log('🎨 [LayoutSection] Converting complex gradient to inline style:', {
        sectionId,
        originalClass: cssClass,
        extractedGradient: gradientCSS
      });
      return { background: gradientCSS };
    }
    
    // Also handle radial gradients
    const radialMatch = cssClass.match(/bg-\[(radial-gradient\([^)]+\))\]/);
    if (radialMatch) {
      const gradientCSS = radialMatch[1];
      console.log('🎨 [LayoutSection] Converting radial gradient to inline style:', {
        sectionId,
        originalClass: cssClass,
        extractedGradient: gradientCSS
      });
      return { background: gradientCSS };
    }
    
    // For simple classes, let Tailwind handle it
    return undefined;
  };

  const inlineStyle = getInlineStyleFromTailwind(sectionBackground);
  const finalClassName = inlineStyle ? '' : sectionBackground; // Use empty class if inline style is used
  
  return (
    <>
      <section 
        ref={ref}
        className={`${spacingClass} px-4 ${finalClassName} ${className}`}
        style={inlineStyle}
        data-section-id={sectionId}
        data-section-type={sectionType}
        data-background-type={backgroundType}
        data-spacing={spacingValue || 'normal'}
      >
        {children}
      </section>

      {/* Edit Mode Indicators */}
      {mode === 'edit' && editModeInfo && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start text-blue-700">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-sm font-medium mb-1">
                  {editModeInfo.componentName} - Background: {sectionBackground}
                </div>
                {editModeInfo.description && (
                  <div className="text-xs text-blue-600 mb-2">
                    {editModeInfo.description}
                  </div>
                )}
                {editModeInfo.tips && editModeInfo.tips.length > 0 && (
                  <div className="text-xs text-blue-600">
                    {editModeInfo.tips.map((tip, index) => (
                      <div key={index} className="flex items-start mb-1">
                        <span className="mr-1">💡</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-blue-500 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Use section toolbar to reorder
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

LayoutSection.displayName = 'LayoutSection';