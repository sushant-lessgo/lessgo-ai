// components/layout/ComplianceBadgeGrid.tsx
// Production-ready compliance certifications grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface ComplianceBadgeGridContent {
  headline: string;
  subheadline?: string;
  compliance_badges: string;
  badge_descriptions?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Enterprise-Grade Compliance & Certifications' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Meet the highest industry standards with our comprehensive compliance framework and security certifications.' 
  },
  compliance_badges: { 
    type: 'string' as const, 
    default: 'SOC 2 Type II|ISO 27001|GDPR Compliant|HIPAA Ready|PCI DSS Level 1|FedRAMP Authorized|CSA STAR|NIST Framework' 
  },
  badge_descriptions: { 
    type: 'string' as const, 
    default: 'Annual third-party audits ensure robust security controls|International standard for information security management|Full European data protection regulation compliance|Healthcare data protection and privacy controls|Highest level payment card security certification|Federal government cloud computing authorization|Cloud Security Alliance certification program|Cybersecurity framework implementation' 
  }
};

// Compliance Badge Interface
interface ComplianceBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Parse compliance badges
const parseComplianceBadges = (badges: string, descriptions: string): ComplianceBadge[] => {
  const badgeList = badges.split('|').map(b => b.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);
  
  const badgeConfig = {
    'SOC 2': { icon: '🛡️', color: 'from-blue-500 to-blue-600' },
    'ISO 27001': { icon: '🔒', color: 'from-green-500 to-green-600' },
    'GDPR': { icon: '🇪🇺', color: 'from-purple-500 to-purple-600' },
    'HIPAA': { icon: '🏥', color: 'from-red-500 to-red-600' },
    'PCI DSS': { icon: '💳', color: 'from-yellow-500 to-orange-600' },
    'FedRAMP': { icon: '🏛️', color: 'from-indigo-500 to-indigo-600' },
    'CSA STAR': { icon: '⭐', color: 'from-pink-500 to-pink-600' },
    'NIST': { icon: '📊', color: 'from-teal-500 to-teal-600' }
  };
  
  return badgeList.map((badge, index) => {
    const key = Object.keys(badgeConfig).find(k => badge.includes(k)) || 'default';
    const config = badgeConfig[key as keyof typeof badgeConfig] || { icon: '🔐', color: 'from-gray-500 to-gray-600' };
    
    return {
      id: `compliance-${index}`,
      name: badge,
      description: descriptionList[index] || 'Compliance certification details.',
      icon: config.icon,
      color: config.color
    };
  });
};

// Compliance Badge Card
const ComplianceBadgeCard = React.memo(({ 
  badge,
  colorTokens,
  getTextStyle 
}: {
  badge: ComplianceBadge;
  colorTokens: any;
  getTextStyle: any;
}) => {
  return (
    <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center">
      
      {/* Badge Icon */}
      <div className={`w-20 h-20 bg-gradient-to-br ${badge.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-lg`}>
        {badge.icon}
      </div>
      
      {/* Badge Name */}
      <h3 className="font-bold text-gray-900 mb-3" style={getTextStyle('h3')}>
        {badge.name}
      </h3>
      
      {/* Badge Description */}
      <p className="text-gray-600 text-sm leading-relaxed" style={getTextStyle('body-sm')}>
        {badge.description}
      </p>
      
      {/* Verification Status */}
      <div className="mt-4 flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-600 text-xs font-medium">Verified</span>
      </div>
    </div>
  );
});
ComplianceBadgeCard.displayName = 'ComplianceBadgeCard';

export default function ComplianceBadgeGrid(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ComplianceBadgeGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse compliance badges
  const complianceBadges = parseComplianceBadges(
    blockContent.compliance_badges, 
    blockContent.badge_descriptions || ''
  );

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ComplianceBadgeGrid"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h1')}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Compliance Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {complianceBadges.map((badge) => (
            <ComplianceBadgeCard
              key={badge.id}
              badge={badge}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
            />
          ))}
        </div>

        {/* Trust Statement */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h3 className="font-bold text-blue-900 mb-3" style={getTextStyle('h3')}>
            Your Data is Protected
          </h3>
          <p className="text-blue-800 max-w-2xl mx-auto" style={getTextStyle('body')}>
            We maintain the highest security standards through continuous monitoring, 
            regular audits, and strict compliance with international regulations.
          </p>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ComplianceBadgeGrid',
  category: 'Security Sections',
  description: 'Grid of compliance certifications and security badges',
  tags: ['security', 'compliance', 'certifications', 'trust', 'enterprise'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Visual compliance badges',
    'Contextual icons and colors',
    'Verification status indicators',
    'Responsive grid layout',
    'Trust statement section'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'compliance_badges', label: 'Compliance Badges (pipe separated)', type: 'textarea', required: true },
    { key: 'badge_descriptions', label: 'Badge Descriptions (pipe separated)', type: 'textarea', required: false }
  ],
  
  useCases: [
    'Enterprise security pages',
    'Compliance showcases',
    'Trust and safety sections',
    'B2B landing pages'
  ]
};