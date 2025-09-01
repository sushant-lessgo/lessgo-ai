import React, { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { sectionList } from '@/modules/sections/sectionList';
import { getComponent } from '@/modules/generatedLanding/componentRegistry';
import { 
  generateCompleteBackgroundSystem, 
  getSectionBackgroundTypeWithContext,
  assignEnhancedBackgroundsToAllSections
} from '@/modules/Design/background/backgroundIntegration';
import { SmartTextSection } from '@/components/layout/SmartTextSection';
import { VariableThemeInjector } from '@/modules/Design/ColorSystem/VariableThemeInjector';
// import { VariableBackgroundRenderer } from '@/modules/Design/ColorSystem/VariableBackgroundRenderer'; // Disabled
import { CSSVariableErrorBoundary } from '@/components/CSSVariableErrorBoundary';
import { useFeatureFlags } from '@/utils/featureFlags';

import { logger } from '@/lib/logger';
// ... (font loading utility remains the same)
const loadGoogleFonts = () => {
  if (document.querySelector('#google-fonts-preload')) {
    return;
  }

  const link = document.createElement('link');
  link.id = 'google-fonts-preload';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' +
    'family=Inter:wght@400;500;600;700&' +
    'family=Bricolage+Grotesque:wght@400;500;600;700&' +
    'family=Poppins:wght@400;500;600;700&' +
    'family=Rubik:wght@400;500;600;700&' +
    'family=Manrope:wght@400;500;600;700&' +
    'family=Sora:wght@400;500;600;700&' +
    'family=Space+Grotesk:wght@400;500;600;700&' +
    'family=Plus+Jakarta+Sans:wght@400;500;600;700&' +
    'family=Outfit:wght@400;500;600;700&' +
    'family=DM+Sans:wght@400;500;600;700&' +
    'family=Open+Sans:wght@400;500;600;700&' +
    'family=Nunito:wght@400;500;600;700&' +
    'family=Playfair+Display:wght@400;500;600;700&' +
    'family=DM+Serif+Display:wght@400;500;600;700&' +
    'family=Raleway:wght@400;500;600;700&' +
    'display=swap';
  
  document.head.appendChild(link);
};

// ... (types remain the same)
type SectionBackground = 'neutral' | 'primary-highlight' | 'secondary-highlight' | 'divider-zone';

type OrderedSection = {
  id: string;
  order: number;
  background: SectionBackground;
  layout: string;
  data: any;
  // ✅ NEW: Add alternating info for debugging
  alternatingInfo?: {
    intrinsicType: string;
    previousSection?: string;
    previousType?: string;
    wasAlternated: boolean;
  };
};

// ... (MissingLayoutComponent and backgroundTypeMapping remain the same)
const MissingLayoutComponent: React.FC<{ sectionId: string; layout: string }> = ({ 
  sectionId, 
  layout 
}) => {
  const { mode } = useEditStore();
  
  return (
    <section className="py-16 px-4 bg-yellow-50 border-2 border-yellow-200">
      <div className="max-w-6xl mx-auto text-center">
        <div className="bg-yellow-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Layout Component Missing
          </h3>
          <p className="text-yellow-700 mb-4">
            Section: <code className="bg-yellow-200 px-2 py-1 rounded">{sectionId}</code>
            <br />
            Layout: <code className="bg-yellow-200 px-2 py-1 rounded">{layout}</code>
          </p>
          {mode !== 'preview' && (
            <p className="text-sm text-yellow-600">
              This layout component needs to be implemented.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const backgroundTypeMapping: Record<SectionBackground, 'primary' | 'secondary' | 'neutral' | 'divider'> = {
  'primary-highlight': 'primary',
  'secondary-highlight': 'secondary',
  'neutral': 'neutral',
  'divider-zone': 'divider',
};



interface LandingPageRendererProps {
  className?: string;
  tokenId?: string;
}

export default function LandingPageRenderer({ className = '', tokenId }: LandingPageRendererProps) {
  // Get tokenId from props or URL params
  const params = useParams();
  const effectiveTokenId = tokenId || (params?.token as string) || 'default';
  const { 
    sections,
    sectionLayouts, 
    theme,
    content,
    mode,
    errors,
    updateFontsFromTone,
    getColorTokens,
    updateFromBackgroundSystem
  } = useEditStore();

  // Get feature flags for CSS variable system
  const featureFlags = useFeatureFlags(effectiveTokenId);
  
  // Get onboarding data for dynamic backgrounds
  const { validatedFields, hiddenInferredFields } = useOnboardingStore();

  // ✅ Generate dynamic background system (unchanged)
 const dynamicBackgroundSystem = useMemo(() => {
  // Background system debug removed
  
  const hasOnboardingData = validatedFields && Object.keys(validatedFields).length > 0;
 // Onboarding data validation
  
  if (!hasOnboardingData) {
  // Using static fallbacks
    return null;
  }

  try {
   // Generating background system
    const backgroundSystem = generateCompleteBackgroundSystem({
  // Required InputVariables fields with defaults
  marketCategory: validatedFields.marketCategory || 'Work & Productivity Tools',
  marketSubcategory: validatedFields.marketSubcategory || 'Project & Task Management',
  targetAudience: validatedFields.targetAudience || 'early-stage-founders',
  keyProblem: validatedFields.keyProblem || '',
  startupStage: validatedFields.startupStage || 'mvp-development',
  landingPageGoals: validatedFields.landingPageGoals || 'signup',
  pricingModel: validatedFields.pricingModel || 'freemium',
  
  // Optional HiddenInferredFields
  ...hiddenInferredFields
});
  // Background system generation completed
    
    return backgroundSystem;
  } catch (error) {
    logger.error('=== BACKGROUND SYSTEM ERROR ===');
    logger.error('Error details:', error);
    if (error instanceof Error) {
      logger.error('Error stack:', error.stack);
    }
    return null;
  }
}, [validatedFields, hiddenInferredFields]);
  // ✅ Sync background system with store theme
  useEffect(() => {
    if (dynamicBackgroundSystem) {
     // Syncing background system with store theme
      updateFromBackgroundSystem(dynamicBackgroundSystem);
    // Background system synced with store theme
    }
  }, [dynamicBackgroundSystem, updateFromBackgroundSystem]);

  // ✅ Generate color tokens
  const colorTokens = useMemo(() => {
   // Generating color tokens
    const tokens = getColorTokens();
    logger.debug('✅ Color tokens generated:', {
      accent: tokens.accent,
      bgSecondary: tokens.bgSecondary,
      hasSophisticatedSecondary: tokens.bgSecondary?.includes('gradient')
    });
    return tokens;
  }, [getColorTokens]);

  // Initialize fonts and load Google Fonts on mount
  useEffect(() => {
    loadGoogleFonts();
    updateFontsFromTone();
  }, [updateFontsFromTone]);

  // ✅ ENHANCED: Get ordered sections with ALTERNATING background assignment
  
  logger.debug('🔍 LandingPageRenderer Debug:', {
  sectionsFromStore: sections,
  sectionsCount: sections?.length,
  sectionLayoutsFromStore: sectionLayouts,
  layoutsCount: Object.keys(sectionLayouts || {}).length,
  sectionLayouts: sectionLayouts
});
  
  const orderedSections = useMemo(() => {
    if (!sections || sections.length === 0) {
      return [];
    }

    logger.debug('🔄 Processing sections with EDIT MODE ORDER preserved:', {
      hasDynamicSystem: !!dynamicBackgroundSystem,
      totalSections: sections.length,
      editModeOrder: sections,
      preservedOrder: 'Using edit mode positions instead of sectionList metadata order'
    });

  const processedSections = sections
  .map((sectionId: string, index: number) => {
    const sectionMeta = sectionList.find((s: any) => s.id === sectionId);
    const sectionData = content[sectionId];
    const layout = sectionLayouts[sectionId] || sectionData?.layout;
    
    return {
      id: sectionId,
      order: index, // ✅ Use edit mode position instead of sectionMeta.order
      metaOrder: sectionMeta?.order ?? 999, // Keep metadata order for debugging
      layout,
      data: sectionData,
      sectionMeta
    };
  })
  .filter((section: any): section is typeof section & { layout: string } => {
    return section.layout !== undefined && typeof section.layout === 'string';
  });
  // ✅ REMOVED the sort() - preserve edit mode order

    // ✅ NOW APPLY ALTERNATING LOGIC to preserve edit mode order
    // ✅ Use batch assignment instead of individual calls
const allSectionIds = processedSections.map((s: any) => s.id);
const backgroundAssignments = assignEnhancedBackgroundsToAllSections(allSectionIds, {
  // Required InputVariables fields with defaults
  marketCategory: validatedFields.marketCategory || 'Work & Productivity Tools',
  marketSubcategory: validatedFields.marketSubcategory || 'Project & Task Management',
  targetAudience: validatedFields.targetAudience || 'early-stage-founders',
  keyProblem: validatedFields.keyProblem || '',
  startupStage: validatedFields.startupStage || 'mvp-development',
  landingPageGoals: validatedFields.landingPageGoals || 'signup',
  pricingModel: validatedFields.pricingModel || 'freemium',
  
  // Optional HiddenInferredFields
  ...hiddenInferredFields
});

const finalSections: OrderedSection[] = processedSections
.filter((section: any) => section.layout !== undefined && typeof section.layout === 'string')
.map((section: any, index: number) => {
  const { id: sectionId, order, layout, data } = section;
  
  const dynamicBackgroundType = backgroundAssignments[sectionId];
  
  // Map to SectionBackground format
  let background: SectionBackground;
  switch(dynamicBackgroundType) {
    case 'primary': background = 'primary-highlight'; break;
    case 'secondary': background = 'secondary-highlight'; break;
    case 'divider': background = 'divider-zone'; break;
    default: background = 'neutral';
  }
  
  return { id: sectionId, order, background, layout, data };
});
    // ✅ Log the final alternating pattern
    logger.debug('🎨 Final alternating background pattern:', 
      finalSections.map(s => `${s.id}: ${s.background}${s.alternatingInfo?.wasAlternated ? ' (alternated)' : ''}`).join(' → ')
    );

    return finalSections;
  }, [sections, sectionLayouts, content, dynamicBackgroundSystem, theme.colors.sectionBackgrounds.secondary]);

  // ✅ Enhanced render section with alternating debug info
  const renderSection = (section: OrderedSection) => {
    const { id: sectionId, background, layout, data, alternatingInfo } = section;
    
    // Get the appropriate component from registry
    const LayoutComponent = getComponent(sectionId, layout);

    // Use fallback if component not found
    if (!LayoutComponent) {
      logger.warn(`Layout component not found: ${sectionId}.${layout}`);
      return (
        <MissingLayoutComponent 
          key={sectionId}
          sectionId={sectionId} 
          layout={layout}
        />
      );
    }

    // Map background type
    const backgroundType = backgroundTypeMapping[background] || 'neutral';
    
    // ✅ CRITICAL FIX: Get the actual CSS class for this background type
    const sectionBackgroundCSS = (() => {
      const backgrounds = theme?.colors?.sectionBackgrounds;
      if (!backgrounds) return 'bg-white';
      
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

    // ✅ CRITICAL FIX: Convert complex gradient classes to inline styles for better compatibility
    const getInlineStyleFromTailwind = (cssClass: string): React.CSSProperties | undefined => {
      // Check if it's a complex gradient in bracket notation
      const gradientMatch = cssClass.match(/bg-\[(linear-gradient\([^)]+\))\]/);
      if (gradientMatch) {
        const gradientCSS = gradientMatch[1].replace(/\s/g, ' '); // Normalize spaces
        logger.debug('🎨 [LandingPageRenderer] Converting complex gradient to inline style:', {
          originalClass: cssClass,
          extractedGradient: gradientCSS
        });
        return { background: gradientCSS };
      }
      
      // For simple classes, let Tailwind handle it
      return undefined;
    };

    const inlineStyle = getInlineStyleFromTailwind(sectionBackgroundCSS);
    const finalClassName = inlineStyle ? '' : sectionBackgroundCSS; // Use empty class if inline style is used

    // Enhanced background logging
    if (backgroundType === 'secondary') {
      logger.debug(`🎨 Rendering secondary section ${sectionId}:`, {
        backgroundCSS: sectionBackgroundCSS,
        themeSecondary: theme.colors.sectionBackgrounds.secondary,
        isFromAccentOptions: theme.colors.sectionBackgrounds.secondary?.includes('gradient'),
        accentColor: theme.colors.accentColor,
        baseColor: theme.colors.baseColor,
        alternatingInfo
      });
    }

    // Enhanced logging for alternated sections
    if (alternatingInfo?.wasAlternated) {
      logger.debug(`🔄 Rendering alternated section ${sectionId}:`, {
        originallyWouldBe: 'secondary',
        actuallyIs: backgroundType,
        actualCSS: sectionBackgroundCSS,
        previousSection: alternatingInfo.previousSection,
        reason: 'Previous section was secondary, so this became neutral for visual break'
      });
    }
    
    logger.debug(`🎨 Section ${sectionId} CSS class:`, sectionBackgroundCSS);

    // Handle section-specific errors
    const sectionError = errors[sectionId];
    if (sectionError && mode !== 'preview') {
      return (
        <section key={sectionId} className="py-8 px-4 bg-red-50 border-l-4 border-red-400">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error in {sectionId} section
                </h3>
                <p className="text-sm text-red-700 mt-1">{sectionError}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Render the actual component with feature flag-controlled wrapper
    try {
      // Debug logging for hero section
      if (sectionId === 'hero') {
        logger.debug('🎯 Rendering hero section with data:', {
          mode,
          isEditable: mode !== 'preview',
          data,
          ctaConfig: data?.ctaConfig,
          elements: data?.elements
        });
      }
      
      // Choose rendering method based on feature flags
      if (shouldUseVariableSystem) {
        return (
          <div
            key={sectionId}
            className="relative"
          >
            <LayoutComponent
              sectionId={sectionId}
              backgroundType={backgroundType}
              sectionBackgroundCSS={sectionBackgroundCSS}
              className=""
              isEditable={mode !== 'preview'}
              {...(data || {})}
            />
          </div>
        );
      } else {
        // Legacy rendering with SmartTextSection
        return (
          <SmartTextSection
            key={sectionId}
            backgroundType={backgroundType}
            sectionId={sectionId}
            sectionBackgroundCSS={sectionBackgroundCSS}
            className=""
          >
            <LayoutComponent
              sectionId={sectionId}
              backgroundType={backgroundType}
              sectionBackgroundCSS={sectionBackgroundCSS}
              className=""
              isEditable={mode !== 'preview'}
              {...(data || {})}
            />
          </SmartTextSection>
        );
      }
    } catch (error) {
      logger.error(`Error rendering section ${sectionId}:`, error);
      
      if (mode !== 'preview') {
        return (
          <section key={sectionId} className="py-8 px-4 bg-red-50">
            <div className="max-w-6xl mx-auto text-center">
              <h3 className="text-red-800 font-semibold">Render Error</h3>
              <p className="text-red-600">Section: {sectionId}</p>
              <p className="text-red-600">Layout: {layout}</p>
              <details className="text-left text-sm text-red-500 mt-2">
                <summary>Error Details</summary>
                <pre className="whitespace-pre-wrap mt-2 p-2 bg-red-100 rounded">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            </div>
          </section>
        );
      }
      
      return null;
    }
  };

  // Handle empty state
  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2-8v14a2 2 0 002 2h-5" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections to Display</h3>
          <p className="text-gray-500">
            {mode !== 'preview' 
              ? 'Add sections to start building your landing page.' 
              : 'This landing page is empty.'
            }
          </p>
        </div>
      </div>
    );
  }

  // Handle global errors
  const globalError = errors['global'];
  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Render Landing Page</h3>
          <p className="text-red-700">{globalError}</p>
        </div>
      </div>
    );
  }

  // Prepare background system for VariableThemeInjector
  const variableBackgroundSystem = useMemo(() => {
    if (!theme?.colors?.sectionBackgrounds) return undefined;
    
    return {
      primary: theme.colors.sectionBackgrounds.primary || 'bg-white',
      secondary: theme.colors.sectionBackgrounds.secondary || 'bg-gray-50',
      neutral: theme.colors.sectionBackgrounds.neutral || 'bg-white',
      divider: theme.colors.sectionBackgrounds.divider || 'bg-gray-100/50',
      baseColor: theme.colors.baseColor || 'blue',
      accentColor: theme.colors.accentColor || 'blue',
      accentCSS: theme.colors.accentCSS || 'bg-blue-600',
    };
  }, [theme]);

  // Determine rendering approach based on feature flags
  const shouldUseVariableSystem = useMemo(() => {
    // Check if variable mode is enabled
    if (featureFlags.enableVariableMode && variableBackgroundSystem) {
      return true;
    }
    
    // Check if hybrid mode is enabled and browser supports CSS variables
    if (featureFlags.enableHybridMode && variableBackgroundSystem) {
      return true;
    }
    
    // Default to legacy mode
    return false;
  }, [featureFlags, variableBackgroundSystem]);

  // Log feature flag status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && featureFlags.enableMigrationDebug) {
      logger.debug('🚩 Feature Flags Status:', {
        tokenId: effectiveTokenId,
        enableVariableMode: featureFlags.enableVariableMode,
        enableHybridMode: featureFlags.enableHybridMode,
        enableLegacyFallbacks: featureFlags.enableLegacyFallbacks,
        shouldUseVariableSystem,
        rolloutPercentage: featureFlags.rolloutPercentage,
        staffAccess: featureFlags.staffAccess,
      });
      
      // Run CSS variable validation in development
      import('@/utils/cssVariableValidation').then(({ runCSSVariableValidation }) => {
        runCSSVariableValidation(effectiveTokenId).catch(console.error);
      });
    }
  }, [featureFlags, shouldUseVariableSystem, effectiveTokenId]);

  // Prepare business context for VariableThemeInjector
  const businessContext = useMemo(() => ({
    validatedFields,
    hiddenInferredFields,
  }), [validatedFields, hiddenInferredFields]);

  // Main renderer with conditional variable system wrapper
  const renderContent = () => (
    <main 
      className={`landing-page-renderer ${className}`}
      data-mode={mode}
      data-variable-system={shouldUseVariableSystem ? 'enabled' : 'legacy'}
      style={{
        '--font-heading': `${theme.typography.headingFont}, 'Inter', sans-serif`,
        '--font-body': `${theme.typography.bodyFont}, 'Inter', sans-serif`,
      } as React.CSSProperties}
    >
      {/* Enhanced Global CSS Variables for Color Tokens - Only when using variable system */}
      {shouldUseVariableSystem && (
        <style jsx>{`
          .landing-page-renderer {
            --color-accent: ${colorTokens.accent};
            --color-accent-hover: ${colorTokens.accentHover};
            --color-accent-border: ${colorTokens.accentBorder};
            --color-cta-bg: ${colorTokens.ctaBg};
            --color-cta-hover: ${colorTokens.ctaHover};
            --color-cta-text: ${colorTokens.ctaText};
            --color-text-on-light: ${colorTokens.textOnLight};
            --color-text-on-dark: ${colorTokens.textOnDark};
            --color-text-on-accent: ${colorTokens.textOnAccent};
            --color-link: ${colorTokens.link};
            --color-bg-primary: ${colorTokens.bgPrimary};
            --color-bg-secondary: ${colorTokens.bgSecondary};
            --color-bg-neutral: ${colorTokens.bgNeutral};
            --color-bg-divider: ${colorTokens.bgDivider};
            --color-text-primary: ${colorTokens.textPrimary};
            --color-text-secondary: ${colorTokens.textSecondary};
            --color-text-muted: ${colorTokens.textMuted};
            --color-text-inverse: ${colorTokens.textInverse};
            --color-surface-card: ${colorTokens.surfaceCard};
            --color-surface-elevated: ${colorTokens.surfaceElevated};
            --color-surface-section: ${colorTokens.surfaceSection};
            --color-surface-overlay: ${colorTokens.surfaceOverlay};
            --color-border-default: ${colorTokens.borderDefault};
            --color-border-subtle: ${colorTokens.borderSubtle};
            --color-border-focus: ${colorTokens.borderFocus};
            --color-success: ${colorTokens.success};
            --color-warning: ${colorTokens.warning};
            --color-error: ${colorTokens.error};
            --color-info: ${colorTokens.info};
          }
        `}</style>
      )}
      {/* Render all sections with ALTERNATING backgrounds */}
      {orderedSections.map(renderSection)}

      {/* ✅ Enhanced Edit Mode Indicators with Alternating Info */}
      {mode !== 'preview' && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            ✏️ Edit Mode Active
          </div>
          {/* Feature Flag Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            shouldUseVariableSystem 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white'
          }`}>
            {shouldUseVariableSystem ? '🎨 Variable System' : '🏗️ Legacy Mode'}
          </div>
          {/* Background System Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            dynamicBackgroundSystem 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
          }`}>
            {dynamicBackgroundSystem ? '🎨 Dynamic Backgrounds' : '🔧 Static Fallback'}
          </div>
          {/* Accent System Status */}
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            theme.colors.sectionBackgrounds.secondary?.includes('gradient')
              ? 'bg-purple-600 text-white' 
              : 'bg-orange-600 text-white'
          }`}>
            {theme.colors.sectionBackgrounds.secondary?.includes('gradient') ? '🎯 Accent Integrated' : '⚠️ Basic Secondary'}
          </div>
          {/* ✅ NEW: Alternating Logic Status */}
          <div className="bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            🔄 Alternating Logic Active
          </div>
        </div>
      )}

      {/* ✅ Enhanced Development Info with Alternating Pattern */}
      {mode !== 'preview' && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-white p-4 text-xs font-mono">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <div className="text-gray-400">Sections:</div>
                <div>{sections.length}</div>
              </div>
              <div>
                <div className="text-gray-400">Theme:</div>
                <div>{theme.colors.baseColor}/{theme.colors.accentColor}</div>
              </div>
              <div>
                <div className="text-gray-400">Typography:</div>
                <div>{theme.typography.scale}</div>
              </div>
              <div>
                <div className="text-gray-400">Mode:</div>
                <div className="capitalize">{mode}</div>
              </div>
              <div>
                <div className="text-gray-400">System:</div>
                <div className={shouldUseVariableSystem ? 'text-green-400' : 'text-gray-400'}>
                  {shouldUseVariableSystem ? 'Variable' : 'Legacy'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Backgrounds:</div>
                <div className={dynamicBackgroundSystem ? 'text-green-400' : 'text-yellow-400'}>
                  {dynamicBackgroundSystem ? 'Dynamic' : 'Static'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Alternating:</div>
                <div className="text-indigo-400">Active</div>
              </div>
            </div>
            
            {/* ✅ NEW: Show alternating pattern */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
              <div className="text-gray-400">Background Pattern:</div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {orderedSections.map((section, index) => (
                  <div key={section.id} className="flex justify-between">
                    <span>{section.id}</span>
                    <span className={`${
                      section.background === 'secondary-highlight' ? 'text-purple-400' :
                      section.background === 'primary-highlight' ? 'text-blue-400' :
                      section.background === 'divider-zone' ? 'text-orange-400' :
                      'text-gray-400'
                    }`}>
                      {section.background}
                      {section.alternatingInfo?.wasAlternated && (
                        <span className="text-yellow-400"> (alternated)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Feature Flag Details */}
            {featureFlags.enableMigrationDebug && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                <div className="text-gray-400">Feature Flags:</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>Variable Mode: <span className={featureFlags.enableVariableMode ? 'text-green-400' : 'text-red-400'}>{featureFlags.enableVariableMode ? 'ON' : 'OFF'}</span></div>
                  <div>Hybrid Mode: <span className={featureFlags.enableHybridMode ? 'text-green-400' : 'text-red-400'}>{featureFlags.enableHybridMode ? 'ON' : 'OFF'}</span></div>
                  <div>Rollout: <span className="text-blue-400">{featureFlags.rolloutPercentage}%</span></div>
                  <div>Staff Access: <span className={featureFlags.staffAccess ? 'text-green-400' : 'text-red-400'}>{featureFlags.staffAccess ? 'YES' : 'NO'}</span></div>
                </div>
              </div>
            )}
            
            {/* Show actual color values */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
              <div className="text-gray-400">Color Tokens:</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>CTA: <span className="text-green-400">{colorTokens.ctaBg}</span></div>
                <div>Secondary BG: <span className="text-purple-400">{colorTokens.bgSecondary}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
  );

  // Conditionally wrap with VariableThemeInjector based on feature flags
  return shouldUseVariableSystem ? (
    <CSSVariableErrorBoundary
      fallbackMode="legacy"
      onError={(error, errorInfo) => {
        logger.error('CSS Variable system failed, falling back to legacy mode:', error);
        // Could track this error in analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'css_variable_system_error', {
            tokenId: effectiveTokenId,
            error_message: error.message,
            fallback_mode: 'legacy',
          });
        }
      }}
    >
      <VariableThemeInjector
        tokenId={effectiveTokenId}
        backgroundSystem={variableBackgroundSystem}
        businessContext={businessContext}
      >
        {renderContent()}
      </VariableThemeInjector>
    </CSSVariableErrorBoundary>
  ) : (
    renderContent()
  );
}