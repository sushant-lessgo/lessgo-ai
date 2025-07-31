'use client';

import React, { useEffect } from 'react';
import { sectionList } from '@/modules/sections/sectionList';
import { getComponent } from '@/modules/generatedLanding/componentRegistry';
import { 
  generateCompleteBackgroundSystem, 
  getSectionBackgroundTypeWithContext,
  assignEnhancedBackgroundsToAllSections
} from '@/modules/Design/background/backgroundIntegration';
import { SmartTextSection } from '@/components/layout/SmartTextSection';
import type { GPTOutput } from '@/modules/prompt/types';

// Load Google Fonts for published pages
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

type SectionBackground = 'neutral' | 'primary-highlight' | 'secondary-highlight' | 'divider-zone';

type OrderedSection = {
  id: string;
  order: number;
  background: SectionBackground;
  layout: string;
};

interface PublishedPageRendererProps {
  data: GPTOutput;
  themeValues: {
    primary: string;
    background: string;
    muted: string;
  };
  userId?: string;
  publishedPageId?: string;
}

export default function PublishedPageRenderer({ 
  data, 
  themeValues, 
  userId, 
  publishedPageId 
}: PublishedPageRendererProps) {
  
  // Load fonts on mount
  useEffect(() => {
    loadGoogleFonts();
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    if (themeValues) {
      const { primary, background, muted } = themeValues;
      
      // Inject CSS variables for the published page
      Object.entries({
        primary,
        background,
        muted,
        // Add computed values
        'primary-foreground': '#ffffff',
        'background-foreground': '#000000',
        'muted-foreground': '#6b7280',
      }).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, [themeValues]);

  // Generate sections from the published data
  const sections: OrderedSection[] = React.useMemo(() => {
    if (!data?.sections) return [];

    return Object.entries(data.sections)
      .map(([id, section]) => ({
        id,
        order: section.order || 0,
        background: 'neutral' as SectionBackground,
        layout: section.layout || 'default',
      }))
      .sort((a, b) => a.order - b.order);
  }, [data]);

  // Generate enhanced backgrounds
  const enhancedBackgrounds = React.useMemo(() => {
    if (!data?.meta?.theme || sections.length === 0) return {};

    const backgroundSystem = generateCompleteBackgroundSystem(
      data.meta.theme,
      data.meta.archetype || 'balanced',
      sections.length
    );

    return assignEnhancedBackgroundsToAllSections(sections, backgroundSystem);
  }, [data, sections]);

  if (!data) {
    return <div>Page not found</div>;
  }

  return (
    <div className="min-h-screen">
      {sections.map((section) => {
        const sectionContent = data.sections?.[section.id];
        if (!sectionContent) return null;

        const backgroundType = getSectionBackgroundTypeWithContext(
          section.id,
          section.order,
          sections.length,
          enhancedBackgrounds[section.id]
        );

        // Get the component for this section
        const SectionComponent = getComponent(sectionContent.type, section.layout);
        
        if (!SectionComponent) {
          // Fallback to SmartTextSection for unknown components
          return (
            <SmartTextSection
              key={section.id}
              sectionId={section.id}
              background={backgroundType}
              userId={userId}
              publishedPageId={publishedPageId}
            />
          );
        }

        return (
          <div
            key={section.id}
            data-section-id={section.id}
            data-section-type={sectionContent.type}
            data-background={backgroundType}
          >
            <SectionComponent
              content={sectionContent}
              userId={userId}
              publishedPageId={publishedPageId}
              isPublished={true}
            />
          </div>
        );
      })}
    </div>
  );
}