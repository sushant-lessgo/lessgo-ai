// components/layout/IndustryBadgeLine.tsx
// Industry certifications and badges - Social Proof component

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
import IconEditableText from '@/components/ui/IconEditableText';

// Content interface for type safety
interface IndustryBadgeLineContent {
  headline: string;
  subheadline?: string;
  certification_badges: string;
  industry_awards?: string;
  compliance_standards?: string;
  cert_icon_override?: string;
  award_icon_override?: string;
  compliance_icon_override?: string;
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
  },
  cert_icon_override: { type: 'string' as const, default: '' },
  award_icon_override: { type: 'string' as const, default: '' },
  compliance_icon_override: { type: 'string' as const, default: '' }
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
  dynamicTextColors,
  mode,
  blockContent,
  backgroundType,
  colorTokens,
  sectionId,
  handleContentUpdate
}: { 
  badge: CertificationBadge;
  dynamicTextColors: any;
  mode: 'edit' | 'preview';
  blockContent: IndustryBadgeLineContent;
  backgroundType: string;
  colorTokens: any;
  sectionId: string;
  handleContentUpdate: (key: keyof IndustryBadgeLineContent, value: string) => void;
}) => {
  
  // Get badge styling and icon override
  const getBadgeStyle = (type: CertificationBadge['type']) => {
    const baseStyles = {
      certification: { bgGradient: 'from-blue-500 to-blue-600', defaultIcon: '🛡️' },
      award: { bgGradient: 'from-yellow-500 to-yellow-600', defaultIcon: '🏆' },
      compliance: { bgGradient: 'from-green-500 to-green-600', defaultIcon: '🔒' }
    };
    return baseStyles[type];
  };

  // Get icon override field based on badge type
  const getIconOverrideField = (type: CertificationBadge['type']): keyof IndustryBadgeLineContent => {
    switch (type) {
      case 'certification': return 'cert_icon_override';
      case 'award': return 'award_icon_override';
      case 'compliance': return 'compliance_icon_override';
    }
  };

  // Get icon value (override or default)
  const getIconValue = (type: CertificationBadge['type']) => {
    const overrideField = getIconOverrideField(type);
    const override = blockContent[overrideField];
    const style = getBadgeStyle(type);
    return override || style.defaultIcon;
  };

  const style = getBadgeStyle(badge.type);
  
  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <div className={`w-16 h-16 bg-gradient-to-br ${style.bgGradient} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <IconEditableText
          mode={mode}
          value={getIconValue(badge.type)}
          onEdit={(value) => {
            const overrideField = getIconOverrideField(badge.type);
            handleContentUpdate(overrideField, value);
          }}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          iconSize="lg"
          className="text-2xl text-white"
          sectionId={sectionId}
          elementKey={`${badge.type}_icon`}
        />
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
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

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

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-3xl mx-auto"
              style={bodyLgStyle}
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
            <h3 className={`font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`} style={h3Style}>
              Security & Compliance Certifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {certifications.slice(0, 6).map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  dynamicTextColors={dynamicTextColors}
                  mode={mode}
                  blockContent={blockContent}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  sectionId={sectionId}
                  handleContentUpdate={handleContentUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Industry Awards */}
        {awards.length > 0 && (
          <div className="mb-12">
            <h3 className={`font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`} style={h3Style}>
              Industry Recognition
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {awards.slice(0, 4).map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  dynamicTextColors={dynamicTextColors}
                  mode={mode}
                  blockContent={blockContent}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  sectionId={sectionId}
                  handleContentUpdate={handleContentUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Compliance Standards */}
        {compliance.length > 0 && (
          <div>
            <h3 className={`font-semibold text-center mb-8 ${dynamicTextColors?.heading || 'text-gray-900'}`} style={h3Style}>
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
            <span className={`font-semibold ${dynamicTextColors?.heading || 'text-gray-900'}`} style={h3Style}>
              Enterprise-Grade Security
            </span>
          </div>
          <p className={`${dynamicTextColors?.body || 'text-gray-700'} max-w-2xl mx-auto`} style={bodyLgStyle}>
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