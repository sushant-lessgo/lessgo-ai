// components/layout/MediaMentions.tsx
// Press and media coverage for credibility - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';

// Content interface for type safety
interface MediaMentionsContent {
  headline: string;
  subheadline?: string;
  media_outlets: string;
  testimonial_quotes?: string;
  logo_urls: string; // JSON structure: {"OutletName": "logoUrl"}
}

// Media outlet structure
interface MediaOutlet {
  id: string;
  index: number;
  name: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Featured in Leading Publications' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our innovative approach has been recognized by top industry publications and media outlets.' 
  },
  media_outlets: { 
    type: 'string' as const, 
    default: 'TechCrunch|Forbes|Wall Street Journal|Reuters|Bloomberg|Business Insider|VentureBeat|The Verge|Wired|Fast Company|Inc. Magazine|Entrepreneur' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: '"Revolutionary approach to solving complex problems"|"Game-changing innovation in the industry"|"Setting new standards for excellence"' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
  }
};

// Parse media outlet data from pipe-separated strings
const parseMediaData = (outlets: string): MediaOutlet[] => {
  const outletList = parsePipeData(outlets);
  
  return outletList.map((name, index) => ({
    id: `outlet-${index}`,
    index,
    name: name.trim()
  }));
};

// Parse logo URLs from JSON string
const parseLogoUrls = (logoUrlsJson: string): Record<string, string> => {
  try {
    return JSON.parse(logoUrlsJson || '{}');
  } catch {
    return {};
  }
};

// Update logo URLs JSON string
const updateLogoUrls = (logoUrlsJson: string, outletName: string, logoUrl: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  if (logoUrl === '') {
    delete logoUrls[outletName];
  } else {
    logoUrls[outletName] = logoUrl;
  }
  return JSON.stringify(logoUrls);
};

// Get logo URL for an outlet
const getOutletLogoUrl = (logoUrlsJson: string, outletName: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  return logoUrls[outletName] || '';
};

// Update outlet names and clean up orphaned logos
const updateOutletNames = (oldNames: string, newNames: string, logoUrlsJson: string): { names: string; logoUrls: string } => {
  const oldOutlets = parsePipeData(oldNames).map(name => name.trim());
  const newOutlets = parsePipeData(newNames).map(name => name.trim());
  const logoUrls = parseLogoUrls(logoUrlsJson);
  
  // Remove logos for outlets that no longer exist
  const cleanedLogoUrls: Record<string, string> = {};
  newOutlets.forEach(outlet => {
    if (logoUrls[outlet]) {
      cleanedLogoUrls[outlet] = logoUrls[outlet];
    }
  });
  
  return {
    names: newOutlets.join('|'),
    logoUrls: JSON.stringify(cleanedLogoUrls)
  };
};

// Media Outlet Logo Component
const MediaOutletLogo = React.memo(({ 
  outlet, 
  dynamicTextColors,
  bodyStyle
}: { 
  outlet: MediaOutlet;
  dynamicTextColors: any;
  bodyStyle: any;
}) => {
  
  // Generate professional logo placeholder
  const getLogoPlaceholder = (outletName: string) => {
    const words = outletName.split(' ').filter(word => word.length > 0);
    let initials = '';
    
    if (words.length === 1) {
      initials = outletName.substring(0, Math.min(3, outletName.length)).toUpperCase();
    } else {
      initials = words
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
    
    return initials;
  };

  const initials = getLogoPlaceholder(outlet.name);
  
  return (
    <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
        <span style={{...bodyStyle, fontSize: '0.875rem', fontWeight: 'bold'}} className="text-gray-700">
          {initials}
        </span>
      </div>
      <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`text-center ${dynamicTextColors?.body || 'text-gray-700'}`}>
        {outlet.name}
      </span>
    </div>
  );
});
MediaOutletLogo.displayName = 'MediaOutletLogo';

export default function MediaMentions(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<MediaMentionsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse media outlets from pipe-separated string
  const mediaOutlets = parseMediaData(blockContent.media_outlets || '');
  
  // Parse testimonial quotes
  const quotes = blockContent.testimonial_quotes 
    ? parsePipeData(blockContent.testimonial_quotes).slice(0, 3)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MediaMentions"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a compelling subheadline about your media coverage..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Media Outlet Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
          {mediaOutlets.slice(0, 12).map((outlet) => {
            // Every outlet gets an editable logo using dynamic system
            const logoUrl = getOutletLogoUrl(blockContent.logo_urls, outlet.name);
            
            return (
              // All outlets are now editable with isolated hover
              <div key={outlet.id} className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <LogoEditableComponent
                  mode={mode}
                  logoUrl={logoUrl}
                  onLogoChange={(url) => {
                    const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, outlet.name, url);
                    handleContentUpdate('logo_urls', updatedLogoUrls);
                  }}
                  companyName={outlet.name}
                  size="md"
                />
                {mode !== 'preview' ? (
                  <div className="flex items-center justify-center gap-2 text-center">
                    <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.body || 'text-gray-700'} flex-1`}>
                      {outlet.name}
                    </span>
                    {/* Delete Outlet Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete ${outlet.name} completely?`)) {
                          const currentOutlets = parsePipeData(blockContent.media_outlets);
                          const updatedOutlets = currentOutlets.filter((_, idx) => idx !== outlet.index);
                          const updatedOutletsString = updatedOutlets.join('|');
                          const { logoUrls } = updateOutletNames(blockContent.media_outlets, updatedOutletsString, blockContent.logo_urls);
                          handleContentUpdate('media_outlets', updatedOutletsString);
                          handleContentUpdate('logo_urls', logoUrls);
                        }
                      }}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                      title="Delete outlet"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`text-center ${dynamicTextColors?.body || 'text-gray-700'}`}>
                    {outlet.name}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Add Outlet Button (Edit Mode Only) */}
          {mode !== 'preview' && (
            <div className="flex flex-col items-center space-y-3 p-6 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-white/20 hover:border-white/30 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const newOutletName = prompt('Enter media outlet name:');
                  if (newOutletName && newOutletName.trim()) {
                    const currentOutlets = parsePipeData(blockContent.media_outlets);
                    if (!currentOutlets.includes(newOutletName.trim())) {
                      const updatedOutlets = [...currentOutlets, newOutletName.trim()].join('|');
                      handleContentUpdate('media_outlets', updatedOutlets);
                    } else {
                      alert('Outlet already exists!');
                    }
                  }
                }}
                className="flex flex-col items-center space-y-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Outlet</span>
              </button>
            </div>
          )}
        </div>

        {/* Testimonial Quotes */}
        {quotes.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8">
            {quotes.map((quote, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="mb-4">
                  <svg className="w-8 h-8 mx-auto text-blue-500 opacity-60" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/>
                  </svg>
                </div>
                <blockquote style={{...bodyLgStyle}} className={`${dynamicTextColors?.body || 'text-gray-700'} leading-relaxed`}>
                  {quote.trim()}
                </blockquote>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'MediaMentions',
  category: 'Social Proof',
  description: 'Press and media coverage display for building credibility through third-party validation',
  tags: ['social-proof', 'media', 'credibility', 'press', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'media_outlets', label: 'Media Outlets (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Grid layout for media outlet logos with hover effects',
    'Quote highlights with visual emphasis',
    'Responsive design for all screen sizes',
    'Professional placeholder logos for media outlets'
  ],
  
  useCases: [
    'Startup press coverage showcase',
    'Product launch media mentions',
    'Company credibility building',
    'Industry recognition display',
    'Third-party validation section'
  ]
};