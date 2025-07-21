// components/layout/SocialProofStrip.tsx
// Compact social proof strip - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface SocialProofStripContent {
  headline: string;
  proof_stats: string;
  stat_labels?: string;
  company_logos?: string;
  company_names?: string;
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

// Stat Display Component
const StatDisplay = React.memo(({ 
  stat, 
  dynamicTextColors 
}: { 
  stat: ProofStat;
  dynamicTextColors: any;
}) => {
  return (
    <div className="text-center">
      <div className={`text-2xl lg:text-3xl font-bold ${dynamicTextColors?.heading || 'text-gray-900'} mb-1`}>
        {stat.value}
      </div>
      <div className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
        {stat.label}
      </div>
    </div>
  );
});
StatDisplay.displayName = 'StatDisplay';

// Company Logo Component
const CompanyLogo = React.memo(({ 
  company, 
  dynamicTextColors 
}: { 
  company: Company;
  dynamicTextColors: any;
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
          <span className="text-gray-700 font-bold text-xs">
            {initials}
          </span>
        </div>
        <span className={`text-sm font-medium ${dynamicTextColors?.body || 'text-gray-700'}`}>
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
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-12"></div>

        {/* Company Logos */}
        {companies.length > 0 && (
          <div>
            <div className={`text-center text-sm ${dynamicTextColors?.muted || 'text-gray-600'} mb-6`}>
              Trusted by industry leaders
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {companies.slice(0, 8).map((company) => (
                <CompanyLogo
                  key={company.id}
                  company={company}
                  dynamicTextColors={dynamicTextColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              SOC 2 Certified
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Enterprise Security
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'}`}>
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