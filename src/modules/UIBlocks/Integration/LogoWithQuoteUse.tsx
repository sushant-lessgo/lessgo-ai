// Integration/LogoWithQuoteUse.tsx - Integration logos with customer quotes
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface LogoWithQuoteUseContent {
  headline: string;
  subheadline?: string;
  integration_names: string;        // Pipe-separated integration names
  integration_quotes: string;       // Pipe-separated quotes
  integration_authors: string;      // Pipe-separated author names
  integration_companies: string;    // Pipe-separated author companies
  trusted_companies: string;        // Pipe-separated trusted company names
  logo_urls: string;               // JSON: {"CompanyName": "logoUrl"}
  avatar_urls: string;             // JSON: {"AuthorName": "avatarUrl"}
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted by Leading Companies Worldwide' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how industry leaders use our integrations to transform their workflows and achieve remarkable results.' 
  },
  integration_names: { 
    type: 'string' as const, 
    default: 'Salesforce Integration|Slack Integration|HubSpot Integration|GitHub Integration' 
  },
  integration_quotes: { 
    type: 'string' as const, 
    default: 'Our sales team productivity increased by 40% after implementing this Salesforce integration. The automated lead routing alone saves us 10 hours per week.|Real-time notifications and automated status updates have transformed how our remote team stays aligned. Game-changing for distributed collaboration.|The seamless data sync between our marketing tools has eliminated manual data entry entirely. Our campaigns are now 3x more effective.|Automated deployment workflows and issue tracking integration have reduced our release cycles from weeks to days. Incredible development velocity.' 
  },
  integration_authors: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Marcus Rodriguez|Emma Thompson|David Park' 
  },
  integration_companies: { 
    type: 'string' as const, 
    default: 'VP Sales, TechFlow|Engineering Lead, InnovateCorp|Marketing Director, GrowthLabs|CTO, DevScale' 
  },
  trusted_companies: { 
    type: 'string' as const, 
    default: 'Microsoft|Google|Amazon|Meta|Stripe|Shopify|Airbnb|Uber|Netflix|Spotify' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for avatar URLs
  }
};

// Integration structure
interface Integration {
  id: string;
  index: number;
  name: string;
  quote: string;
  author: string;
  company: string;
}

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

// Parse avatar URLs from JSON string
const parseAvatarUrls = (avatarUrlsJson: string): Record<string, string> => {
  try {
    return JSON.parse(avatarUrlsJson || '{}');
  } catch {
    return {};
  }
};

// Update avatar URLs JSON string
const updateAvatarUrls = (avatarUrlsJson: string, authorName: string, avatarUrl: string): string => {
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  if (avatarUrl === '') {
    delete avatarUrls[authorName];
  } else {
    avatarUrls[authorName] = avatarUrl;
  }
  return JSON.stringify(avatarUrls);
};

// Get avatar URL for an author
const getAuthorAvatarUrl = (avatarUrlsJson: string, authorName: string): string => {
  const avatarUrls = parseAvatarUrls(avatarUrlsJson);
  return avatarUrls[authorName] || '';
};

// Parse integration data from pipe-separated strings
const parseIntegrationData = (names: string, quotes: string, authors: string, companies: string): Integration[] => {
  const nameList = parsePipeData(names);
  const quoteList = parsePipeData(quotes);
  const authorList = parsePipeData(authors);
  const companyList = parsePipeData(companies);
  
  return nameList.map((name, index) => ({
    id: `integration-${index}`,
    index,
    name: name.trim(),
    quote: quoteList[index] || '',
    author: authorList[index] || '',
    company: companyList[index] || ''
  }));
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

// Integration Card Component
const IntegrationCard = React.memo(({ 
  integration, 
  isActive, 
  onClick, 
  colorTokens, 
  textStyle,
  labelStyle,
  h3Style,
  bodySmStyle,
  mode,
  onLogoEdit,
  sectionId,
  integrationIndex,
  logoUrl
}: { 
  integration: Integration; 
  isActive: boolean; 
  onClick: () => void;
  colorTokens: any;
  textStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  h3Style: React.CSSProperties;
  bodySmStyle: React.CSSProperties;
  mode: 'edit' | 'preview';
  onLogoEdit: (value: string) => void;
  sectionId: string;
  integrationIndex: number;
  logoUrl: string;
}) => (
  <div 
    className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
      isActive 
        ? `${colorTokens.ctaBg} ${colorTokens.ctaBgText} border-current shadow-lg scale-105` 
        : `${colorTokens.bgSecondary} border-gray-200 hover:${colorTokens.bgSecondary} hover:shadow-md`
    }`}
    onClick={onClick}
  >
    {/* Integration Logo */}
    <div className="flex items-center mb-4">
      <div className="mr-4">
        <LogoEditableComponent
          mode={mode}
          logoUrl={logoUrl}
          onLogoChange={onLogoEdit}
          companyName={integration.name}
          size="md"
        />
      </div>
      <h3 className={`${isActive ? 'text-current' : colorTokens.textPrimary}`} style={h3Style}>
        {integration.name}
      </h3>
    </div>

    {/* Quote Preview */}
    <p className={`leading-relaxed ${
      isActive ? 'text-current opacity-90' : colorTokens.textSecondary
    } line-clamp-3`} style={bodySmStyle}>
      "{integration.quote.substring(0, 100)}..."
    </p>

    {/* Author */}
    <div className="mt-4 pt-4 border-t border-current border-opacity-20">
      <p className={`${isActive ? 'text-current' : colorTokens.textPrimary}`} style={labelStyle}>
        {integration.author}
      </p>
      <p className={`text-xs ${isActive ? 'text-current opacity-75' : colorTokens.textMuted}`}>
        {integration.company}
      </p>
    </div>
  </div>
));
IntegrationCard.displayName = 'IntegrationCard';

// Featured Quote Component
const FeaturedQuote = React.memo(({ 
  integration, 
  colorTokens, 
  textStyle,
  mode,
  onAvatarEdit,
  sectionId,
  integrationIndex
}: { 
  integration: Integration; 
  colorTokens: any;
  textStyle: React.CSSProperties;
  mode: 'edit' | 'preview';
  onAvatarEdit: (value: string) => void;
  sectionId: string;
  integrationIndex: number;
  avatarUrl: string;
}) => (
  <div className={`p-8 rounded-2xl ${colorTokens.bgSecondary} border-gray-200 border`}>
    {/* Quote */}
    <blockquote className={`text-xl lg:text-2xl leading-relaxed mb-6 ${colorTokens.textPrimary} ${textStyle}`}>
      "{integration.quote}"
    </blockquote>

    {/* Author Info */}
    <div className="flex items-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
        <IconEditableText
          mode={mode}
          value={avatarUrl || integration.author.split(' ').map((n: string) => n[0]).join('')}
          onEdit={onAvatarEdit}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="md"
          className="text-xl text-white"
          placeholder={integration.author.split(' ').map((n: string) => n[0]).join('')}
          sectionId={sectionId}
          elementKey={`integration_${integrationIndex + 1}_avatar`}
        />
      </div>
      <div>
        <p className={`font-semibold ${colorTokens.textPrimary}`}>{integration.author}</p>
        <p className={`text-sm ${colorTokens.textMuted}`}>{integration.company}</p>
      </div>
    </div>

    {/* Integration Badge */}
    <div className="mt-6 pt-6 border-t border-border-gray-200">
      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${colorTokens.ctaBg} ${colorTokens.ctaBgText}`}>
        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
        {integration.name}
      </div>
    </div>
  </div>
));
IntegrationCard.displayName = 'IntegrationCard';

// Company Logo Component
const CompanyLogo = React.memo(({ 
  company, 
  mode, 
  onLogoChange, 
  onNameEdit, 
  onDelete, 
  logoUrl, 
  colorTokens 
}: { 
  company: { id: string; index: number; name: string };
  mode: 'edit' | 'preview';
  onLogoChange: (url: string) => void;
  onNameEdit: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  logoUrl: string;
  colorTokens: any;
}) => (
  <div className={`flex flex-col items-center space-y-3 p-4 rounded-lg ${colorTokens.bgSecondary} border-gray-200 border hover:${colorTokens.bgSecondary} transition-colors duration-200`}>
    <LogoEditableComponent
      mode={mode}
      logoUrl={logoUrl}
      onLogoChange={onLogoChange}
      companyName={company.name}
      size="md"
    />
    <div className="text-center w-full">
      {mode === 'edit' ? (
        <div className="flex items-center justify-center gap-2">
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onNameEdit(company.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-semibold text-center flex-1"
          >
            {company.name}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (confirm(`Delete ${company.name} completely?`)) {
                onDelete(company.index);
              }
            }}
            className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Delete company"
          >
            ×
          </button>
        </div>
      ) : (
        <span className={`font-semibold text-sm ${colorTokens.textSecondary}`}>
          {company.name}
        </span>
      )}
    </div>
  </div>
));
CompanyLogo.displayName = 'CompanyLogo';

export default function LogoWithQuoteUse(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<LogoWithQuoteUseContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [selectedIntegration, setSelectedIntegration] = useState(0);
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body');
  const bodySmStyle = getTypographyStyle('body-sm');
  const labelStyle = getTypographyStyle('label');

  // Parse integrations using dynamic system
  const integrations = parseIntegrationData(
    blockContent.integration_names,
    blockContent.integration_quotes,
    blockContent.integration_authors,
    blockContent.integration_companies
  );

  // Parse trusted companies
  const trustedCompanies = parsePipeData(blockContent.trusted_companies || '');
  const trustedCompanyData = trustedCompanies.map((name, index) => ({
    id: `company-${index}`,
    index,
    name: name.trim()
  }));

  // Edit handlers for integrations
  const handleIntegrationLogoEdit = (index: number, logoUrl: string) => {
    const integration = integrations[index];
    if (integration) {
      const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, integration.name, logoUrl);
      handleContentUpdate('logo_urls', updatedLogoUrls);
    }
  };

  const handleIntegrationAvatarEdit = (index: number, avatarUrl: string) => {
    const integration = integrations[index];
    if (integration) {
      const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls, integration.author, avatarUrl);
      handleContentUpdate('avatar_urls', updatedAvatarUrls);
    }
  };

  // Edit handlers for trusted companies
  const handleCompanyLogoEdit = (company: string, logoUrl: string) => {
    const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, company, logoUrl);
    handleContentUpdate('logo_urls', updatedLogoUrls);
  };

  const handleCompanyNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.trusted_companies, index, value);
    handleContentUpdate('trusted_companies', updatedNames);
  };

  const handleCompanyDelete = (index: number) => {
    const currentCompanies = parsePipeData(blockContent.trusted_companies);
    const updatedCompanies = currentCompanies.filter((_, idx) => idx !== index);
    const updatedCompaniesString = updatedCompanies.join('|');
    const { logoUrls } = updateCompanyNames(blockContent.trusted_companies, updatedCompaniesString, blockContent.logo_urls);
    handleContentUpdate('trusted_companies', updatedCompaniesString);
    handleContentUpdate('logo_urls', logoUrls);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LogoWithQuoteUse"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg leading-relaxed max-w-4xl mx-auto"
              placeholder="Add a description of customer success stories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          
          {/* Integration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrations.map((integration, index) => (
              <IntegrationCard
                key={index}
                integration={integration}
                isActive={selectedIntegration === index}
                onClick={() => setSelectedIntegration(index)}
                colorTokens={colorTokens}
                textStyle={{}}
                labelStyle={labelStyle}
                h3Style={h3Style}
                bodySmStyle={bodySmStyle}
                mode={mode}
                onLogoEdit={(logoUrl) => handleIntegrationLogoEdit(index, logoUrl)}
                sectionId={sectionId}
                integrationIndex={index}
                logoUrl={getCompanyLogoUrl(blockContent.logo_urls, integration.name)}
              />
            ))}
          </div>

          {/* Featured Quote */}
          <div className="lg:sticky lg:top-8">
            <FeaturedQuote
              integration={integrations[selectedIntegration]}
              colorTokens={colorTokens}
              textStyle={{}}
              mode={mode}
              onAvatarEdit={(avatarUrl) => handleIntegrationAvatarEdit(selectedIntegration, avatarUrl)}
              sectionId={sectionId}
              integrationIndex={selectedIntegration}
              avatarUrl={getAuthorAvatarUrl(blockContent.avatar_urls, integrations[selectedIntegration]?.author || '')}
            />
          </div>
        </div>

        {/* Trusted Companies Section */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-8 ${colorTokens.textPrimary}`}>
            Trusted by leading companies worldwide
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {trustedCompanyData.slice(0, 10).map((company) => (
              <CompanyLogo
                key={company.id}
                company={company}
                mode={mode}
                onLogoChange={(logoUrl) => handleCompanyLogoEdit(company.name, logoUrl)}
                onNameEdit={handleCompanyNameEdit}
                onDelete={handleCompanyDelete}
                logoUrl={getCompanyLogoUrl(blockContent.logo_urls, company.name)}
                colorTokens={colorTokens}
              />
            ))}
            
            {/* Add Company Button (Edit Mode Only) */}
            {mode === 'edit' && (
              <div className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 ${colorTokens.bgSecondary}`}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const newCompanyName = prompt('Enter company name:');
                    if (newCompanyName && newCompanyName.trim()) {
                      const currentCompanies = parsePipeData(blockContent.trusted_companies);
                      if (!currentCompanies.includes(newCompanyName.trim())) {
                        const updatedCompanies = [...currentCompanies, newCompanyName.trim()].join('|');
                        handleContentUpdate('trusted_companies', updatedCompanies);
                      } else {
                        alert('Company already exists!');
                      }
                    }
                  }}
                  className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Add Company</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-border-gray-200">
            <div className="text-center">
              <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>500+</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Enterprise Customers</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>99.99%</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>2M+</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>API Calls/Day</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${colorTokens.textPrimary} mb-2`}>150+</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Countries</div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'LogoWithQuoteUse',
  category: 'Integration Sections',
  description: 'Integration showcase with customer testimonials and company logos for social proof',
  tags: ['integration', 'testimonials', 'social-proof', 'enterprise', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '35 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'integration_names', label: 'Integration Names (pipe separated)', type: 'text', required: true },
    { key: 'integration_quotes', label: 'Integration Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'integration_authors', label: 'Integration Authors (pipe separated)', type: 'text', required: true },
    { key: 'integration_companies', label: 'Integration Companies (pipe separated)', type: 'text', required: true },
    { key: 'trusted_companies', label: 'Trusted Companies (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Interactive integration selection',
    'Detailed customer testimonials',
    'Company logo trust indicators',
    'Enterprise statistics display',
    'Professional social proof layout'
  ],
  
  useCases: [
    'Build enterprise credibility and trust',
    'Showcase successful integration stories',
    'Demonstrate real customer value',
    'Support sales conversations with proof'
  ]
};