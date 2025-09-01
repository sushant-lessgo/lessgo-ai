// components/layout/SocialProofStrip.tsx
// Compact social proof strip - Social Proof component

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
interface SocialProofStripContent {
  headline: string;
  proof_stats: string;
  stat_labels?: string;
  company_logos?: string;
  company_names?: string;
  logo_urls: string; // JSON structure: {"CompanyName": "logoUrl"}
}

// Proof stat structure
interface ProofStat {
  id: string;
  index: number;
  value: string;
  label: string;
}

// Company structure
interface Company {
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
  proof_stats: { 
    type: 'string' as const, 
    default: '10,000+|99.9%|24/7|50M+' 
  },
  stat_labels: { 
    type: 'string' as const, 
    default: 'Happy Customers|Uptime Guarantee|Support Available|Data Points Processed' 
  },
  company_logos: { 
    type: 'string' as const, 
    default: '' 
  },
  company_names: { 
    type: 'string' as const, 
    default: 'Google|Microsoft|Amazon|Meta|Netflix|Apple|Tesla|Shopify|Stripe|Slack|Zoom|Adobe' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
  }
};

// Parse proof stat data from pipe-separated strings
const parseProofData = (stats: string, labels: string): ProofStat[] => {
  const statList = parsePipeData(stats);
  const labelList = parsePipeData(labels);
  
  return statList.map((value, index) => ({
    id: `stat-${index}`,
    index,
    value: value.trim(),
    label: labelList[index] || `Metric ${index + 1}`
  }));
};

// Parse company data from pipe-separated strings
const parseCompanyData = (names: string): Company[] => {
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

// Stat Display Component
const StatDisplay = React.memo(({ 
  stat, 
  dynamicTextColors,
  h2Style,
  bodyStyle
}: { 
  stat: ProofStat;
  dynamicTextColors: any;
  h2Style: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}) => {
  return (
    <div className="text-center">
      <div style={{...h2Style, fontSize: 'clamp(1.5rem, 3vw, 2rem)'}} className={`${dynamicTextColors?.heading || 'text-gray-900'} mb-1`}>
        {stat.value}
      </div>
      <div style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
        {stat.label}
      </div>
    </div>
  );
});
StatDisplay.displayName = 'StatDisplay';

// Company Logo Component
const CompanyLogo = React.memo(({ 
  company, 
  dynamicTextColors,
  bodyStyle
}: { 
  company: Company;
  dynamicTextColors: any;
  bodyStyle: React.CSSProperties;
}) => {
  
  // Generate simple logo placeholder
  const getLogoInitials = (companyName: string) => {
    const words = companyName.split(' ').filter(word => word.length > 0);
    if (words.length === 1) {
      return companyName.substring(0, Math.min(2, companyName.length)).toUpperCase();
    } else {
      return words
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
  };

  const initials = getLogoInitials(company.name);
  
  return (
    <div className="flex items-center justify-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center">
          <span style={{...bodyStyle, fontSize: '0.75rem', fontWeight: 'bold'}} className="text-gray-700">
            {initials}
          </span>
        </div>
        <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.body || 'text-gray-700'}`}>
          {company.name}
        </span>
      </div>
    </div>
  );
});
CompanyLogo.displayName = 'CompanyLogo';

export default function SocialProofStrip(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SocialProofStripContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h2Style = getTypographyStyle('h2');
  const bodyStyle = getTypographyStyle('body');

  // Parse proof stats from pipe-separated strings
  const proofStats = parseProofData(
    blockContent.proof_stats || '',
    blockContent.stat_labels || ''
  );

  // Parse company data from pipe-separated strings
  const companies = parseCompanyData(blockContent.company_names || '');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SocialProofStrip"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-8"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Stats Section */}
        {proofStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {proofStats.slice(0, 4).map((stat) => (
              <StatDisplay
                key={stat.id}
                stat={stat}
                dynamicTextColors={dynamicTextColors}
                h2Style={h2Style}
                bodyStyle={bodyStyle}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-12"></div>

        {/* Company Logos */}
        {companies.length > 0 && (
          <div>
            <div style={{...bodyStyle, fontSize: '0.875rem'}} className={`text-center ${dynamicTextColors?.muted || 'text-gray-600'} mb-6`}>
              Trusted by industry leaders
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {companies.slice(0, 8).map((company) => {
                // Every company gets an editable logo using dynamic system
                const logoUrl = getCompanyLogoUrl(blockContent.logo_urls, company.name);
                
                return (
                  // All companies are now editable with isolated hover
                  <div key={company.id} className="flex items-center justify-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <LogoEditableComponent
                        mode={mode}
                        logoUrl={logoUrl}
                        onLogoChange={(url) => {
                          const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, company.name, url);
                          handleContentUpdate('logo_urls', updatedLogoUrls);
                        }}
                        companyName={company.name}
                        size="sm"
                      />
                      <span style={{...bodyStyle, fontSize: '0.875rem'}} className={`${dynamicTextColors?.body || 'text-gray-700'} flex-1`}>
                        {company.name}
                      </span>
                      {/* Delete Company Button */}
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm(`Delete ${company.name} completely?`)) {
                              const currentCompanies = parsePipeData(blockContent.company_names || '');
                              const updatedCompanies = currentCompanies.filter((_, idx) => idx !== company.index);
                              const updatedCompaniesString = updatedCompanies.join('|');
                              const { logoUrls } = updateCompanyNames(blockContent.company_names || '', updatedCompaniesString, blockContent.logo_urls);
                              handleContentUpdate('company_names', updatedCompaniesString);
                              handleContentUpdate('logo_urls', logoUrls);
                            }
                          }}
                          className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors ml-2"
                          title="Delete company"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Add Company Button (Edit Mode Only) */}
              {mode !== 'preview' && (
                <div className="flex items-center justify-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-dashed border-white/20 hover:border-white/30 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const newCompanyName = prompt('Enter company name:');
                      if (newCompanyName && newCompanyName.trim()) {
                        const currentCompanies = parsePipeData(blockContent.company_names || '');
                        if (!currentCompanies.includes(newCompanyName.trim())) {
                          const updatedCompanies = [...currentCompanies, newCompanyName.trim()].join('|');
                          handleContentUpdate('company_names', updatedCompanies);
                        } else {
                          alert('Company already exists!');
                        }
                      }
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Add Company</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
              SOC 2 Certified
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Enterprise Security
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{...bodyStyle, fontSize: '0.75rem'}} className={`${dynamicTextColors?.muted || 'text-gray-600'}`}>
              GDPR Compliant
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'} ml-1`}>
              4.9/5 Rating
            </span>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SocialProofStrip',
  category: 'Social Proof',
  description: 'Compact horizontal strip showcasing key metrics, trusted companies, and security badges',
  tags: ['social-proof', 'metrics', 'companies', 'trust', 'compact'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'proof_stats', label: 'Proof Statistics (pipe separated)', type: 'text', required: true },
    { key: 'stat_labels', label: 'Stat Labels (pipe separated)', type: 'text', required: true },
    { key: 'company_logos', label: 'Company Logos (URLs, pipe separated)', type: 'text', required: false },
    { key: 'company_names', label: 'Company Names (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Compact horizontal layout perfect for header/footer',
    'Key metrics display with labels',
    'Company logo placeholders with company names',
    'Trust badges and security indicators',
    'Responsive design for all screen sizes'
  ],
  
  useCases: [
    'Header social proof strip',
    'Footer trust indicators',
    'Landing page credibility section',
    'Enterprise sales page validation',
    'Product page trust building'
  ]
};