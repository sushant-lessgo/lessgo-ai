// components/layout/LogoWall.tsx
// Production-ready company logo wall using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { SocialProofNumber } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';

// Content interface for type safety
interface LogoWallContent {
  headline: string;
  subheadline?: string;
  company_names: string;
  logo_urls: string; // JSON structure: {"CompanyName": "logoUrl"}
}

// Company logo structure
interface CompanyLogo {
  id: string;
  index: number;
  name: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted by Leading Companies Worldwide' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Join thousands of companies that trust us to power their success.' 
  },
  company_names: { 
    type: 'string' as const, 
    default: 'Microsoft|Google|Amazon|Tesla|Spotify|Airbnb|Netflix|Shopify|Stripe|Zoom|Slack|Dropbox|Adobe|Salesforce|HubSpot|Atlassian' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
  }
};

// Parse company data from pipe-separated strings
const parseCompanyData = (names: string): CompanyLogo[] => {
  const nameList = parsePipeData(names);
  
  return nameList.map((name, index) => ({
    id: `company-${index}`,
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
const updateLogoUrls = (logoUrlsJson: string, companyName: string, logoUrl: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  if (logoUrl === '') {
    delete logoUrls[companyName];
  } else {
    logoUrls[companyName] = logoUrl;
  }
  return JSON.stringify(logoUrls);
};

// Get logo URL for a company
const getCompanyLogoUrl = (logoUrlsJson: string, companyName: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  return logoUrls[companyName] || '';
};

// Update company names and clean up orphaned logos
const updateCompanyNames = (oldNames: string, newNames: string, logoUrlsJson: string): { names: string; logoUrls: string } => {
  const oldCompanies = parsePipeData(oldNames).map(name => name.trim());
  const newCompanies = parsePipeData(newNames).map(name => name.trim());
  const logoUrls = parseLogoUrls(logoUrlsJson);
  
  // Remove logos for companies that no longer exist
  const cleanedLogoUrls: Record<string, string> = {};
  newCompanies.forEach(company => {
    if (logoUrls[company]) {
      cleanedLogoUrls[company] = logoUrls[company];
    }
  });
  
  return {
    names: newCompanies.join('|'),
    logoUrls: JSON.stringify(cleanedLogoUrls)
  };
};

// Company Logo Placeholder Component
const CompanyLogoPlaceholder = React.memo(({ 
  company, 
  mode, 
  getTextStyle,
  onNameEdit
}: { 
  company: CompanyLogo;
  mode: 'edit' | 'preview';
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onNameEdit: (index: number, value: string) => void;
}) => {
  
  // Generate professional logo placeholder
  const getLogoPlaceholder = (companyName: string) => {
    const words = companyName.split(' ').filter(word => word.length > 0);
    let initials = '';
    
    if (words.length === 1) {
      initials = companyName.substring(0, Math.min(2, companyName.length)).toUpperCase();
    } else {
      initials = words
        .slice(0, 3)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
    
    // Professional color schemes
    const colorSchemes = [
      'from-blue-600 to-blue-700',
      'from-gray-700 to-gray-800',
      'from-green-600 to-green-700',
      'from-purple-600 to-purple-700',
      'from-red-600 to-red-700',
      'from-indigo-600 to-indigo-700'
    ];
    
    const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorScheme = colorSchemes[hash % colorSchemes.length];
    
    return { initials, colorScheme };
  };

  const { initials, colorScheme } = getLogoPlaceholder(company.name);
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
      
      {/* Logo Placeholder */}
      <div className={`w-16 h-16 bg-gradient-to-br ${colorScheme} rounded-xl flex items-center justify-center text-white font-bold mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`} style={getTextStyle('body-lg')}>
        {initials}
      </div>
      
      {/* Company Name */}
      <div className="text-center">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onNameEdit(company.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-gray-700 text-sm text-center"
          >
            {company.name}
          </div>
        ) : (
          <span 
            className="font-medium text-gray-700 text-sm group-hover:text-gray-900 transition-colors duration-300"
          >
            {company.name}
          </span>
        )}
      </div>
    </div>
  );
});
CompanyLogoPlaceholder.displayName = 'CompanyLogoPlaceholder';

export default function LogoWall(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate,
    dynamicTextColors,
    backgroundType
  } = useLayoutComponent<LogoWallContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Parse company data
  const companyLogos = parseCompanyData(blockContent.company_names);

  // Handle individual name editing
  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.company_names, index, value);
    handleContentUpdate('company_names', updatedNames);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LogoWall"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
            className="mb-4"
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
                className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context..."
            />
          )}
        </div>

        {/* Company Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {companyLogos.map((company) => {
            // Every company gets an editable logo using dynamic system
            const logoUrl = getCompanyLogoUrl(blockContent.logo_urls, company.name);
            
            return (
              // All logos are now editable with isolated hover
              <div key={company.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
                <LogoEditableComponent
                  mode={mode}
                  logoUrl={logoUrl}
                  onLogoChange={(url) => {
                    const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, company.name, url);
                    handleContentUpdate('logo_urls', updatedLogoUrls);
                  }}
                  companyName={company.name}
                  size="md"
                />
                
                {/* Company Name */}
                <div className="text-center mt-3">
                  {mode === 'edit' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleNameEdit(company.index, e.currentTarget.textContent || '')}
                        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-gray-700 text-sm text-center flex-1"
                      >
                        {company.name}
                      </div>
                      {/* Delete Company Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Delete ${company.name} completely?`)) {
                            const currentNames = parsePipeData(blockContent.company_names);
                            const updatedNames = currentNames.filter((_, idx) => idx !== company.index);
                            const updatedNamesString = updatedNames.join('|');
                            const { logoUrls } = updateCompanyNames(blockContent.company_names, updatedNamesString, blockContent.logo_urls);
                            handleContentUpdate('company_names', updatedNamesString);
                            handleContentUpdate('logo_urls', logoUrls);
                          }
                        }}
                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        title="Delete company"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-700 text-sm">
                      {company.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Add Company Button (Edit Mode Only) */}
          {mode === 'edit' && (
            <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const newCompanyName = prompt('Enter company name:');
                  if (newCompanyName && newCompanyName.trim()) {
                    const currentNames = parsePipeData(blockContent.company_names);
                    if (!currentNames.includes(newCompanyName.trim())) {
                      const updatedNames = [...currentNames, newCompanyName.trim()].join('|');
                      handleContentUpdate('company_names', updatedNames);
                    } else {
                      alert('Company already exists!');
                    }
                  }
                }}
                className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Company</span>
              </button>
            </div>
          )}
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <SocialProofNumber
            number="500+"
            label="Companies Trust Us"
            highlighted={true}
          />
          
          <SocialProofNumber
            number="50+"
            label="Countries Worldwide"
          />
          
          <SocialProofNumber
            number="15+"
            label="Industries Served"
          />
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-800">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Join thousands of satisfied customers</span>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'LogoWall',
  category: 'Social Proof',
  description: 'Company logo wall showing trusted partners and customers with adaptive text colors',
  tags: ['logos', 'companies', 'social-proof', 'trust', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // Key features
  features: [
    'Automatic text color adaptation based on background type',
    'Company logo placeholders',
    'Social proof statistics',
    'Trust reinforcement elements',
    'Professional design layout'
  ],
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'company_names', label: 'Company Names (pipe separated)', type: 'textarea', required: true }
  ],
  
  // Usage examples
  useCases: [
    'Customer showcase',
    'Partner logos',
    'Trust building section',
    'Social proof display'
  ]
};