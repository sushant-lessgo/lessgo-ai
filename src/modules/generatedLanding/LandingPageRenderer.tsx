import React, { useEffect, useMemo } from 'react';
import { usePageStore } from '@/hooks/usePageStore';
import { sectionList } from '@/modules/sections/sectionList';
import { getComponent } from '@/modules/generatedLanding/componentRegistry';

// Font preloading utility


// Font preloading utility
const loadGoogleFonts = () => {
  // Check if fonts are already loaded
  if (document.querySelector('#google-fonts-preload')) {
    return;
  }

  // Create font preload link
  const link = document.createElement('link');
  link.id = 'google-fonts-preload';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' +
    // Inter (fallback font)
    'family=Inter:wght@400;500;600;700&' +
    // Confident Playful fonts
    'family=Bricolage+Grotesque:wght@400;500;600;700&' +
    'family=Poppins:wght@400;500;600;700&' +
    'family=Rubik:wght@400;500;600;700&' +
    // Minimal Technical fonts  
    'family=Manrope:wght@400;500;600;700&' +
    'family=Sora:wght@400;500;600;700&' +
    // Bold Persuasive fonts
    'family=Space+Grotesk:wght@400;500;600;700&' +
    'family=Plus+Jakarta+Sans:wght@400;500;600;700&' +
    'family=Outfit:wght@400;500;600;700&' +
    'family=DM+Sans:wght@400;500;600;700&' +
    // Friendly Helpful fonts
    'family=Open+Sans:wght@400;500;600;700&' +
    'family=Nunito:wght@400;500;600;700&' +
    // Luxury Expert fonts
    'family=Playfair+Display:wght@400;500;600;700&' +
    'family=DM+Serif+Display:wght@400;500;600;700&' +
    'family=Raleway:wght@400;500;600;700&' +
    'display=swap';
  
  document.head.appendChild(link);
};

// Types for better type safety
type SectionBackground = 'neutral' | 'primary-highlight' | 'secondary-highlight' | 'divider-zone';

type OrderedSection = {
  id: string;
  order: number;
  background: SectionBackground;
  layout: string;
  data: any;
};

// Fallback component for missing layouts
const MissingLayoutComponent: React.FC<{ sectionId: string; layout: string }> = ({ 
  sectionId, 
  layout 
}) => {
  const { ui: { mode } } = usePageStore();
  
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
          {mode === 'edit' && (
            <p className="text-sm text-yellow-600">
              This layout component needs to be implemented.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

// Background type mapping from sectionList to component props
const backgroundTypeMapping: Record<SectionBackground, 'primary' | 'secondary' | 'neutral' | 'divider'> = {
  'primary-highlight': 'primary',
  'secondary-highlight': 'secondary',
  'neutral': 'neutral',
  'divider-zone': 'divider',
};

interface LandingPageRendererProps {
  className?: string;
}

export default function LandingPageRenderer({ className = '' }: LandingPageRendererProps) {
  const { 
    layout: { sections, sectionLayouts, theme },
    content,
    ui: { mode, errors },
    updateFontsFromTone,
    getColorTokens 
  } = usePageStore();

  // Generate color tokens based on current theme
  const colorTokens = useMemo(() => getColorTokens(), [getColorTokens]);

  // Initialize fonts and load Google Fonts on mount
  useEffect(() => {
    // Load Google Fonts
    loadGoogleFonts();
    
    // Update fonts from tone
    updateFontsFromTone();
  }, [updateFontsFromTone]);

  // Get ordered sections based on sectionList priority
  const orderedSections = useMemo(() => {
    if (!sections || sections.length === 0) {
      return [];
    }

    return sections
      .map(sectionId => {
        const sectionMeta = sectionList.find(s => s.id === sectionId);
        const sectionData = content[sectionId];
        const layout = sectionLayouts[sectionId] || sectionData?.layout;
        
        return {
          id: sectionId,
          order: sectionMeta?.order ?? 999,
          background: (sectionMeta?.background ?? 'neutral') as SectionBackground,
          layout,
          data: sectionData
        };
      })
      .filter((section): section is OrderedSection => 
        section.layout !== undefined && typeof section.layout === 'string'
      )
      .sort((a, b) => a.order - b.order);
  }, [sections, sectionLayouts, content]);

  // Render individual section
  const renderSection = (section: OrderedSection) => {
    const { id: sectionId, background, layout, data } = section;
    
    // Get the appropriate component from registry
    const LayoutComponent = getComponent(sectionId, layout);

    // Use fallback if component not found
    if (!LayoutComponent) {
      console.warn(`Layout component not found: ${sectionId}.${layout}`);
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

    // Handle section-specific errors
    const sectionError = errors[sectionId];
    if (sectionError && mode === 'edit') {
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

    // Render the actual component
    try {
      return (
        <LayoutComponent
          key={sectionId}
          sectionId={sectionId}
          backgroundType={backgroundType}
          className=""
          {...(data || {})}
        />
      );
    } catch (error) {
      console.error(`Error rendering section ${sectionId}:`, error);
      
      if (mode === 'edit') {
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
      
      return null; // Hide broken sections in preview mode
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
            {mode === 'edit' 
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

  return (
    <main 
      className={`landing-page-renderer ${className}`}
      data-mode={mode}
      style={{
        '--font-heading': `${theme.typography.headingFont}, 'Inter', sans-serif`,
        '--font-body': `${theme.typography.bodyFont}, 'Inter', sans-serif`,
      } as React.CSSProperties}
    >
      {/* Global CSS Variables for Color Tokens */}
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

      {/* Render all sections in order */}
      {orderedSections.map(renderSection)}

      {/* Edit Mode Indicators */}
      {mode === 'edit' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            ✏️ Edit Mode Active
          </div>
        </div>
      )}

      {/* Development Info (only in edit mode) */}
      {mode === 'edit' && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-white p-4 text-xs font-mono">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}