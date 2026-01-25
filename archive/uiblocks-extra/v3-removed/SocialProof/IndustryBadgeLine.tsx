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
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
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
  // Section titles
  cert_section_title?: string;
  award_section_title?: string;
  compliance_section_title?: string;
  // Trust summary
  trust_summary_title?: string;
  trust_summary_description?: string;
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
  compliance_icon_override: { type: 'string' as const, default: '' },
  // Section titles
  cert_section_title: { 
    type: 'string' as const, 
    default: 'Security & Compliance Certifications' 
  },
  award_section_title: { 
    type: 'string' as const, 
    default: 'Industry Recognition' 
  },
  compliance_section_title: { 
    type: 'string' as const, 
    default: 'Security Standards' 
  },
  // Trust summary
  trust_summary_title: { 
    type: 'string' as const, 
    default: 'Enterprise-Grade Security' 
  },
  trust_summary_description: { 
    type: 'string' as const, 
    default: 'Your data is protected by the highest industry standards, ensuring complete security and compliance for your business.' 
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
  dynamicTextColors,
  mode,
  blockContent,
  backgroundType,
  colorTokens,
  sectionId,
  sectionBackground,
  handleContentUpdate,
  onBadgeEdit
}: { 
  badge: CertificationBadge;
  dynamicTextColors: any;
  mode: 'edit' | 'preview';
  blockContent: IndustryBadgeLineContent;
  backgroundType: string;
  colorTokens: any;
  sectionId: string;
  sectionBackground: string;
  handleContentUpdate: (key: keyof IndustryBadgeLineContent, value: string) => void;
  onBadgeEdit: (badge: CertificationBadge, value: string) => void;
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
    <div className="relative group/badge-item flex flex-col items-center space-y-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
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
      <EditableAdaptiveText
        mode={mode}
        value={badge.name}
        onEdit={(value) => onBadgeEdit(badge, value)}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        variant="body"
        className="text-sm font-medium text-center leading-tight"
        placeholder="Badge name"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key={`badge_${badge.id}`}
      />
      
      {/* Remove button */}
      {mode === 'edit' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBadgeEdit(badge, '___REMOVED___');
          }}
          className="absolute -top-2 -right-2 opacity-0 group-hover/badge-item:opacity-100 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
          title="Remove badge"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
BadgeDisplay.displayName = 'BadgeDisplay';

// Security Feature Component
const SecurityFeature = React.memo(({ 
  feature,
  index,
  mode,
  dynamicTextColors,
  backgroundType,
  colorTokens,
  sectionId,
  sectionBackground,
  onFeatureEdit
}: { 
  feature: string;
  index: number;
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  backgroundType: string;
  colorTokens: any;
  sectionId: string;
  sectionBackground: string;
  onFeatureEdit: (index: number, value: string) => void;
}) => {
  return (
    <div className="relative group/feature-item flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.602-4.777a4.5 4.5 0 010 9.554A2.25 2.25 0 0118 15.75h.007v.008H18v-.008zm-6 0a4.5 4.5 0 00-4.5 4.5 2.25 2.25 0 002.25 2.25h.007v.008H9.75v-.008z" />
        </svg>
      </div>
      <EditableAdaptiveText
        mode={mode}
        value={feature}
        onEdit={(value) => onFeatureEdit(index, value)}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        variant="body"
        className="font-medium flex-1"
        placeholder="Security feature"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key={`compliance_${index}`}
      />
      
      {/* Remove button */}
      {mode === 'edit' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFeatureEdit(index, '___REMOVED___');
          }}
          className="opacity-0 group-hover/feature-item:opacity-100 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
          title="Remove feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
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

  // Helper function to handle badge editing
  const handleBadgeEdit = (badge: CertificationBadge, value: string) => {
    let fieldKey: keyof IndustryBadgeLineContent;
    let currentData: string;
    
    switch (badge.type) {
      case 'certification':
        fieldKey = 'certification_badges';
        currentData = blockContent.certification_badges || '';
        break;
      case 'award':
        fieldKey = 'industry_awards';
        currentData = blockContent.industry_awards || '';
        break;
      case 'compliance':
        fieldKey = 'compliance_standards';
        currentData = blockContent.compliance_standards || '';
        break;
    }
    
    const updatedData = updateListData(currentData, badge.index, value);
    handleContentUpdate(fieldKey, updatedData);
  };

  // Helper function to handle compliance feature editing  
  const handleComplianceFeatureEdit = (index: number, value: string) => {
    const updatedData = updateListData(blockContent.compliance_standards || '', index, value);
    handleContentUpdate('compliance_standards', updatedData);
  };

  // Parse badges from pipe-separated strings
  const badges = parseBadgeData(
    blockContent.certification_badges || '',
    blockContent.industry_awards,
    blockContent.compliance_standards
  );

  // Split badges by type for better organization
  const certifications = badges.filter(b => b.type === 'certification' && b.name !== '___REMOVED___');
  const awards = badges.filter(b => b.type === 'award' && b.name !== '___REMOVED___');
  const compliance = badges.filter(b => b.type === 'compliance' && b.name !== '___REMOVED___');

  // Parse compliance features for SecurityFeature component
  const complianceFeatures = parsePipeData(blockContent.compliance_standards || '').filter(f => f !== '___REMOVED___');

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
        {(certifications.length > 0 || mode === 'edit') && (
          <div className="mb-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.cert_section_title || ''}
              onEdit={(value) => handleContentUpdate('cert_section_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold text-center mb-8"
              style={h3Style}
              placeholder="Section title for certifications"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="cert_section_title"
            />
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
                  sectionBackground={sectionBackground}
                  handleContentUpdate={handleContentUpdate}
                  onBadgeEdit={handleBadgeEdit}
                />
              ))}
            </div>
            
            {/* Add certification button */}
            {mode === 'edit' && certifications.length < 6 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    const currentData = blockContent.certification_badges || '';
                    const updatedData = currentData ? `${currentData}|New Certification` : 'New Certification';
                    handleContentUpdate('certification_badges', updatedData);
                  }}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add certification</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Industry Awards */}
        {(awards.length > 0 || mode === 'edit') && (
          <div className="mb-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.award_section_title || ''}
              onEdit={(value) => handleContentUpdate('award_section_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold text-center mb-8"
              style={h3Style}
              placeholder="Section title for awards"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="award_section_title"
            />
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
                  sectionBackground={sectionBackground}
                  handleContentUpdate={handleContentUpdate}
                  onBadgeEdit={handleBadgeEdit}
                />
              ))}
            </div>
            
            {/* Add award button */}
            {mode === 'edit' && awards.length < 4 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    const currentData = blockContent.industry_awards || '';
                    const updatedData = currentData ? `${currentData}|New Award` : 'New Award';
                    handleContentUpdate('industry_awards', updatedData);
                  }}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add award</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compliance Standards */}
        {(complianceFeatures.length > 0 || mode === 'edit') && (
          <div>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.compliance_section_title || ''}
              onEdit={(value) => handleContentUpdate('compliance_section_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold text-center mb-8"
              style={h3Style}
              placeholder="Section title for compliance standards"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="compliance_section_title"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {complianceFeatures.slice(0, 4).map((feature, index) => (
                <SecurityFeature
                  key={`compliance-${index}`}
                  feature={feature}
                  index={index}
                  mode={mode}
                  dynamicTextColors={dynamicTextColors}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  sectionId={sectionId}
                  sectionBackground={sectionBackground}
                  onFeatureEdit={handleComplianceFeatureEdit}
                />
              ))}
            </div>
            
            {/* Add compliance feature button */}
            {mode === 'edit' && complianceFeatures.length < 4 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    const currentData = blockContent.compliance_standards || '';
                    const updatedData = currentData ? `${currentData}|New Security Standard` : 'New Security Standard';
                    handleContentUpdate('compliance_standards', updatedData);
                  }}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add security standard</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trust Summary */}
        <div className="mt-16 text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.602-4.777a4.5 4.5 0 010 9.554A2.25 2.25 0 0118 15.75h.007v.008H18v-.008zm-6 0a4.5 4.5 0 00-4.5 4.5 2.25 2.25 0 002.25 2.25h.007v.008H9.75v-.008z" />
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.trust_summary_title || ''}
              onEdit={(value) => handleContentUpdate('trust_summary_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold"
              style={h3Style}
              placeholder="Trust summary title"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="trust_summary_title"
            />
          </div>
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.trust_summary_description || ''}
            onEdit={(value) => handleContentUpdate('trust_summary_description', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="max-w-2xl mx-auto"
            style={bodyLgStyle}
            placeholder="Describe your security and compliance commitment..."
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key="trust_summary_description"
          />
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
    { key: 'compliance_standards', label: 'Compliance Standards (pipe separated)', type: 'text', required: false },
    { key: 'cert_section_title', label: 'Certifications Section Title', type: 'text', required: false },
    { key: 'award_section_title', label: 'Awards Section Title', type: 'text', required: false },
    { key: 'compliance_section_title', label: 'Compliance Section Title', type: 'text', required: false },
    { key: 'trust_summary_title', label: 'Trust Summary Title', type: 'text', required: false },
    { key: 'trust_summary_description', label: 'Trust Summary Description', type: 'textarea', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Categorized badge displays (certifications, awards, compliance)',
    'Interactive hover effects with scaling animations',
    'Type-specific icons and color coding',
    'Trust summary section with security emphasis',
    'Fully editable badge names, section titles, and descriptions',
    'Add/remove badges with hover-based controls',
    'Individual icon customization for each badge type'
  ],
  
  useCases: [
    'Enterprise software security showcase',
    'Compliance-focused product pages',
    'B2B trust building section',
    'Industry certification display',
    'Security-first messaging'
  ]
};