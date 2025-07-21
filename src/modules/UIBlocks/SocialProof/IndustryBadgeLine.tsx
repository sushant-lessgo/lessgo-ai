// components/layout/IndustryBadgeLine.tsx
// Industry certifications and badges - Social Proof component

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
interface IndustryBadgeLineContent {
  headline: string;
  subheadline?: string;
  certification_badges: string;
  industry_awards?: string;
  compliance_standards?: string;
}

// Badge structure
interface CertificationBadge {
  id: string;
  index: number;
  name: string;
  type: 'certification' | 'award' | 'compliance';
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted & Certified Excellence' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our commitment to quality is validated by industry-leading certifications and standards.' 
  },
  certification_badges: { 
    type: 'string' as const, 
    default: 'ISO 27001|SOC 2 Type II|GDPR Compliant|PCI DSS|HIPAA Ready|AWS Certified' 
  },
  industry_awards: { 
    type: 'string' as const, 
    default: 'Best Innovation 2024|Top Startup Award|Industry Leader|Customer Choice' 
  },
  compliance_standards: { 
    type: 'string' as const, 
    default: 'Enterprise Security|99.9% SLA|24/7 Monitoring|Data Encryption' 
  }
};

// Parse badge data from pipe-separated strings
const parseBadgeData = (badges: string, awards?: string, compliance?: string): CertificationBadge[] => {
  const badgeList = parsePipeData(badges);
  const awardList = awards ? parsePipeData(awards) : [];
  const complianceList = compliance ? parsePipeData(compliance) : [];
  
  const allBadges: CertificationBadge[] = [];
  
  // Add certifications
  badgeList.forEach((name, index) => {
    allBadges.push({
      id: `cert-${index}`,
      index,
      name: name.trim(),
      type: 'certification'
    });
  });
  
  // Add awards
  awardList.forEach((name, index) => {
    allBadges.push({
      id: `award-${index}`,
      index: badgeList.length + index,
      name: name.trim(),
      type: 'award'
    });
  });
  
  // Add compliance
  complianceList.forEach((name, index) => {
    allBadges.push({
      id: `compliance-${index}`,
      index: badgeList.length + awardList.length + index,
      name: name.trim(),
      type: 'compliance'
    });
  });
  
  return allBadges;
};

// Badge Component
const BadgeDisplay = React.memo(({ 
  badge, 
  dynamicTextColors 
}: { 
  badge: CertificationBadge;
  dynamicTextColors: any;
}) => {
  
  // Get badge styling based on type
  const getBadgeStyle = (type: CertificationBadge['type']) => {
    switch (type) {
      case 'certification':
        return {
          bgGradient: 'from-blue-500 to-blue-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'award':
        return {
          bgGradient: 'from-yellow-500 to-yellow-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )
        };
      case 'compliance':
        return {
          bgGradient: 'from-green-500 to-green-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )
        };
    }
  };

  const style = getBadgeStyle(badge.type);
  
  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <div className={`w-16 h-16 bg-gradient-to-br ${style.bgGradient} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {style.icon}
      </div>
      <span className={`text-sm font-medium text-center leading-tight ${dynamicTextColors?.body || 'text-gray-700'}`}>
        {badge.name}
      </span>
    </div>
  );
});
BadgeDisplay.displayName = 'BadgeDisplay';

// Security Feature Component
const SecurityFeature = React.memo(({ 
  feature, 
  dynamicTextColors 
}: { 
  feature: string;
  dynamicTextColors: any;
}) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.602-4.777a4.5 4.5 0 010 9.554A2.25 2.25 0 0118 15.75h.007v.008H18v-.008zm-6 0a4.5 4.5 0 00-4.5 4.5 2.25 2.25 0 002.25 2.25h.007v.008H9.75v-.008z" />
        </svg>
      </div>
      <span className={`font-medium ${dynamicTextColors?.body || 'text-gray-700'}`}>
        {feature}
      </span>
    </div>
  );
});
SecurityFeature.displayName = 'SecurityFeature';

export default function IndustryBadgeLine(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<IndustryBadgeLineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse badges from pipe-separated strings
  const badges = parseBadgeData(
    blockContent.certification_badges || '',
    blockContent.industry_awards,
    blockContent.compliance_standards
  );

  // Split badges by type for better organization
  const certifications = badges.filter(b => b.type === 'certification');
  const awards = badges.filter(b => b.type === 'award');
  const compliance = badges.filter(b => b.type === 'compliance');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IndustryBadgeLine"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a compelling subheadline about your certifications..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Certification Badges */}
        {certifications.length > 0 && (
          <div className="mb-12">
            <h3 className={`text-lg font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`}>
              Security & Compliance Certifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {certifications.slice(0, 6).map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  dynamicTextColors={dynamicTextColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Industry Awards */}
        {awards.length > 0 && (
          <div className="mb-12">
            <h3 className={`text-lg font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`}>
              Industry Recognition
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {awards.slice(0, 4).map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  dynamicTextColors={dynamicTextColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Compliance Standards */}
        {compliance.length > 0 && (
          <div>
            <h3 className={`text-lg font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`}>
              Security Standards
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {compliance.slice(0, 4).map((feature) => (
                <SecurityFeature
                  key={feature.id}
                  feature={feature.name}
                  dynamicTextColors={dynamicTextColors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trust Summary */}
        <div className="mt-16 text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.602-4.777a4.5 4.5 0 010 9.554A2.25 2.25 0 0118 15.75h.007v.008H18v-.008zm-6 0a4.5 4.5 0 00-4.5 4.5 2.25 2.25 0 002.25 2.25h.007v.008H9.75v-.008z" />
            </svg>
            <span className={`text-xl font-semibold ${dynamicTextColors?.heading || 'text-gray-900'}`}>
              Enterprise-Grade Security
            </span>
          </div>
          <p className={`text-lg ${dynamicTextColors?.body || 'text-gray-700'} max-w-2xl mx-auto`}>
            Your data is protected by the highest industry standards, ensuring complete security and compliance for your business.
          </p>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'IndustryBadgeLine',
  category: 'Social Proof',
  description: 'Industry certifications, awards, and compliance badges display for building trust and credibility',
  tags: ['social-proof', 'certifications', 'security', 'compliance', 'awards'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'certification_badges', label: 'Certification Badges (pipe separated)', type: 'text', required: true },
    { key: 'industry_awards', label: 'Industry Awards (pipe separated)', type: 'text', required: false },
    { key: 'compliance_standards', label: 'Compliance Standards (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Categorized badge displays (certifications, awards, compliance)',
    'Interactive hover effects with scaling animations',
    'Type-specific icons and color coding',
    'Trust summary section with security emphasis'
  ],
  
  useCases: [
    'Enterprise software security showcase',
    'Compliance-focused product pages',
    'B2B trust building section',
    'Industry certification display',
    'Security-first messaging'
  ]
};