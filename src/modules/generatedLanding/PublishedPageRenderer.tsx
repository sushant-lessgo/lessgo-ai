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
    if (!data) return [];

    // Create sections from GPTOutput structure
    const sectionMapping = [
      { id: 'hero', order: 0, visible: data.visibleSections?.hero },
      { id: 'before_after', order: 1, visible: data.visibleSections?.before_after },
      { id: 'how_it_works', order: 2, visible: data.visibleSections?.how_it_works },
      { id: 'testimonials', order: 3, visible: data.visibleSections?.testimonials },
      { id: 'offer', order: 4, visible: data.visibleSections?.offer },
      { id: 'faq', order: 5, visible: data.visibleSections?.faq },
    ];

    return sectionMapping
      .filter(section => section.visible)
      .map(section => ({
        id: section.id,
        order: section.order,
        background: 'neutral' as SectionBackground,
        layout: 'default',
      }));
  }, [data]);

  // Generate enhanced backgrounds
  const enhancedBackgrounds = React.useMemo(() => {
    if (!data?.theme || sections.length === 0) return {};

    // Create minimal onboarding data from GPTOutput with required fields
    const onboardingData = {
      marketCategory: data.meta.marketCategory,
      marketSubcategory: data.meta.marketSubcategory,
      targetAudience: data.meta.targetAudience,
      keyProblem: data.meta.problemBeingSolved,
      problemBeingSolved: data.meta.problemBeingSolved,
      startupStage: 'MVP & Early Customers', // Default value
      landingPageGoals: 'Generate Leads', // Default value
      pricingModel: 'subscription', // Default value
      theme: data.theme
    };
    
    const backgroundSystem = generateCompleteBackgroundSystem(onboardingData);

    // Map section IDs for the background assignment
    const sectionIds = sections.map(s => s.id);
    return assignEnhancedBackgroundsToAllSections(sectionIds, onboardingData);
  }, [data, sections]);

  // Create onboarding data in component scope
  const onboardingData = React.useMemo(() => ({
    marketCategory: data?.meta?.marketCategory || 'Work & Productivity Tools',
    marketSubcategory: data?.meta?.marketSubcategory || 'Project Management',
    targetAudience: data?.meta?.targetAudience || 'Business Owners',
    keyProblem: data?.meta?.problemBeingSolved || 'Productivity issues',
    problemBeingSolved: data?.meta?.problemBeingSolved || 'Productivity issues',
    startupStage: 'MVP & Early Customers' as const,
    landingPageGoals: 'Generate Leads' as const,
    pricingModel: 'subscription' as const,
    theme: data?.theme || 'modern'
  }), [data]);

  if (!data) {
    return <div>Page not found</div>;
  }

  return (
    <div className="min-h-screen">
      {sections.map((section) => {
        // Get section content from the specific GPTOutput properties
        const sectionContent = (data as any)[section.id];
        if (!sectionContent) return null;

        const sectionIds = sections.map(s => s.id);
        const backgroundType = getSectionBackgroundTypeWithContext(
          section.id,
          sectionIds,
          onboardingData
        );
        
        // Use simple background for now
        const sectionBackground = 'bg-white';

        // Get the component for this section
        const SectionComponent = getComponent(sectionContent.type, section.layout);
        
        if (!SectionComponent) {
          // Fallback to SmartTextSection for unknown components
          return (
            <SmartTextSection
              key={section.id}
              sectionId={section.id}
              backgroundType={backgroundType}
              sectionBackgroundCSS={sectionBackground}
            >
              <div>Section: {section.id}</div>
            </SmartTextSection>
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