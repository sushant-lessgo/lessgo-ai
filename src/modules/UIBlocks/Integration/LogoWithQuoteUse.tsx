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
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface LogoWithQuoteUseContent {
  headline: string;
  subheadline?: string;
  integration_1_name: string;
  integration_1_quote: string;
  integration_1_author: string;
  integration_1_company: string;
  integration_2_name: string;
  integration_2_quote: string;
  integration_2_author: string;
  integration_2_company: string;
  integration_3_name: string;
  integration_3_quote: string;
  integration_3_author: string;
  integration_3_company: string;
  integration_4_name: string;
  integration_4_quote: string;
  integration_4_author: string;
  integration_4_company: string;
  trusted_companies: string;
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
  integration_1_name: { 
    type: 'string' as const, 
    default: 'Salesforce Integration' 
  },
  integration_1_quote: { 
    type: 'string' as const, 
    default: 'Our sales team productivity increased by 40% after implementing this Salesforce integration. The automated lead routing alone saves us 10 hours per week.' 
  },
  integration_1_author: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  integration_1_company: { 
    type: 'string' as const, 
    default: 'VP Sales, TechFlow' 
  },
  integration_2_name: { 
    type: 'string' as const, 
    default: 'Slack Integration' 
  },
  integration_2_quote: { 
    type: 'string' as const, 
    default: 'Real-time notifications and automated status updates have transformed how our remote team stays aligned. Game-changing for distributed collaboration.' 
  },
  integration_2_author: { 
    type: 'string' as const, 
    default: 'Marcus Rodriguez' 
  },
  integration_2_company: { 
    type: 'string' as const, 
    default: 'Engineering Lead, InnovateCorp' 
  },
  integration_3_name: { 
    type: 'string' as const, 
    default: 'HubSpot Integration' 
  },
  integration_3_quote: { 
    type: 'string' as const, 
    default: 'The seamless data sync between our marketing tools has eliminated manual data entry entirely. Our campaigns are now 3x more effective.' 
  },
  integration_3_author: { 
    type: 'string' as const, 
    default: 'Emma Thompson' 
  },
  integration_3_company: { 
    type: 'string' as const, 
    default: 'Marketing Director, GrowthLabs' 
  },
  integration_4_name: { 
    type: 'string' as const, 
    default: 'GitHub Integration' 
  },
  integration_4_quote: { 
    type: 'string' as const, 
    default: 'Automated deployment workflows and issue tracking integration have reduced our release cycles from weeks to days. Incredible development velocity.' 
  },
  integration_4_author: { 
    type: 'string' as const, 
    default: 'David Park' 
  },
  integration_4_company: { 
    type: 'string' as const, 
    default: 'CTO, DevScale' 
  },
  trusted_companies: { 
    type: 'string' as const, 
    default: 'Microsoft|Google|Amazon|Meta|Stripe|Shopify|Airbnb|Uber|Netflix|Spotify' 
  }
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
  bodySmStyle
}: { 
  integration: any; 
  isActive: boolean; 
  onClick: () => void;
  colorTokens: any;
  textStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  h3Style: React.CSSProperties;
  bodySmStyle: React.CSSProperties;
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
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
        isActive ? 'bg-white bg-opacity-20' : 'bg-gradient-to-br from-blue-500 to-purple-600'
      }`}>
        <span className={`${isActive ? 'text-white' : 'text-white'}`} style={labelStyle}>
          {integration.name.substring(0, 2).toUpperCase()}
        </span>
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
  textStyle 
}: { 
  integration: any; 
  colorTokens: any;
  textStyle: React.CSSProperties;
}) => (
  <div className={`p-8 rounded-2xl ${colorTokens.bgSecondary} border-gray-200 border`}>
    {/* Quote */}
    <blockquote className={`text-xl lg:text-2xl leading-relaxed mb-6 ${colorTokens.textPrimary} ${textStyle}`}>
      "{integration.quote}"
    </blockquote>

    {/* Author Info */}
    <div className="flex items-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
        <span className="text-white font-bold">
          {integration.author.split(' ').map((n: string) => n[0]).join('')}
        </span>
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
FeaturedQuote.displayName = 'FeaturedQuote';

// Company Logo Component
const CompanyLogo = React.memo(({ name, colorTokens }: { name: string; colorTokens: any }) => (
  <div className={`flex items-center justify-center p-4 rounded-lg ${colorTokens.bgSecondary} border-gray-200 border hover:${colorTokens.bgSecondary} transition-colors duration-200`}>
    <span className={`font-semibold text-lg ${colorTokens.textSecondary}`}>
      {name}
    </span>
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

  // Parse integrations
  const integrations = [
    {
      name: blockContent.integration_1_name,
      quote: blockContent.integration_1_quote,
      author: blockContent.integration_1_author,
      company: blockContent.integration_1_company
    },
    {
      name: blockContent.integration_2_name,
      quote: blockContent.integration_2_quote,
      author: blockContent.integration_2_author,
      company: blockContent.integration_2_company
    },
    {
      name: blockContent.integration_3_name,
      quote: blockContent.integration_3_quote,
      author: blockContent.integration_3_author,
      company: blockContent.integration_3_company
    },
    {
      name: blockContent.integration_4_name,
      quote: blockContent.integration_4_quote,
      author: blockContent.integration_4_author,
      company: blockContent.integration_4_company
    }
  ];

  // Parse trusted companies
  const trustedCompanies = blockContent.trusted_companies 
    ? blockContent.trusted_companies.split('|').map(company => company.trim()) 
    : [];

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
              />
            ))}
          </div>

          {/* Featured Quote */}
          <div className="lg:sticky lg:top-8">
            <FeaturedQuote
              integration={integrations[selectedIntegration]}
              colorTokens={colorTokens}
              textStyle={{}}
            />
          </div>
        </div>

        {/* Trusted Companies Section */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-8 ${colorTokens.textPrimary}`}>
            Trusted by leading companies worldwide
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {trustedCompanies.slice(0, 10).map((company, index) => (
              <CompanyLogo
                key={index}
                name={company}
                colorTokens={colorTokens}
              />
            ))}
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
    { key: 'integration_1_name', label: 'Integration 1 Name', type: 'text', required: true },
    { key: 'integration_1_quote', label: 'Integration 1 Quote', type: 'textarea', required: true },
    { key: 'integration_1_author', label: 'Integration 1 Author', type: 'text', required: true },
    { key: 'integration_1_company', label: 'Integration 1 Company', type: 'text', required: true },
    { key: 'integration_2_name', label: 'Integration 2 Name', type: 'text', required: true },
    { key: 'integration_2_quote', label: 'Integration 2 Quote', type: 'textarea', required: true },
    { key: 'integration_2_author', label: 'Integration 2 Author', type: 'text', required: true },
    { key: 'integration_2_company', label: 'Integration 2 Company', type: 'text', required: true },
    { key: 'integration_3_name', label: 'Integration 3 Name', type: 'text', required: true },
    { key: 'integration_3_quote', label: 'Integration 3 Quote', type: 'textarea', required: true },
    { key: 'integration_3_author', label: 'Integration 3 Author', type: 'text', required: true },
    { key: 'integration_3_company', label: 'Integration 3 Company', type: 'text', required: true },
    { key: 'integration_4_name', label: 'Integration 4 Name', type: 'text', required: true },
    { key: 'integration_4_quote', label: 'Integration 4 Quote', type: 'textarea', required: true },
    { key: 'integration_4_author', label: 'Integration 4 Author', type: 'text', required: true },
    { key: 'integration_4_company', label: 'Integration 4 Company', type: 'text', required: true },
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