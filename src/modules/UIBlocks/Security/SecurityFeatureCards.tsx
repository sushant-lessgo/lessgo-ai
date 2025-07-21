// components/layout/SecurityFeatureCards.tsx
// Production-ready security feature highlights using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface SecurityFeatureCardsContent {
  headline: string;
  subheadline?: string;
  security_features: string;
  feature_descriptions: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Built with Security at the Core' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our comprehensive security framework protects your data with multiple layers of defense and industry-leading protocols.' 
  },
  security_features: { 
    type: 'string' as const, 
    default: 'End-to-End Encryption|Multi-Factor Authentication|Zero Trust Architecture|Real-time Threat Detection|Automated Backup Systems|Role-Based Access Control' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'All data is encrypted in transit and at rest using AES-256 encryption standards|Mandatory MFA for all user accounts with support for authenticator apps and hardware keys|Every request is verified and validated regardless of location or user credentials|AI-powered monitoring detects and blocks suspicious activities in real-time|Automated daily backups with geographic redundancy and point-in-time recovery|Granular permissions ensure users only access data relevant to their role' 
  }
};

// Security Feature Interface
interface SecurityFeature {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  gradient: string;
}

// Parse security features
const parseSecurityFeatures = (features: string, descriptions: string): SecurityFeature[] => {
  const featureList = features.split('|').map(f => f.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);
  
  const getIcon = (feature: string) => {
    const lower = feature.toLowerCase();
    
    if (lower.includes('encryption')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    } else if (lower.includes('authentication') || lower.includes('mfa')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    } else if (lower.includes('zero trust') || lower.includes('architecture')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (lower.includes('threat') || lower.includes('detection')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (lower.includes('backup') || lower.includes('recovery')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
    } else if (lower.includes('access') || lower.includes('role')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  };
  
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-indigo-600'
  ];
  
  return featureList.map((feature, index) => ({
    id: `security-feature-${index}`,
    title: feature,
    description: descriptionList[index] || 'Security feature description.',
    icon: getIcon(feature),
    gradient: gradients[index % gradients.length]
  }));
};

// Security Feature Card
const SecurityFeatureCard = React.memo(({ 
  feature,
  colorTokens,
  getTextStyle 
}: {
  feature: SecurityFeature;
  colorTokens: any;
  getTextStyle: any;
}) => {
  return (
    <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
      
      {/* Icon */}
      <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg`}>
        {feature.icon}
      </div>
      
      {/* Title */}
      <h3 className="font-bold text-gray-900 mb-4" style={getTextStyle('h3')}>
        {feature.title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 leading-relaxed mb-6" style={getTextStyle('body')}>
        {feature.description}
      </p>
      
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-green-600 text-sm font-medium">Active & Monitored</span>
      </div>
    </div>
  );
});
SecurityFeatureCard.displayName = 'SecurityFeatureCard';

export default function SecurityFeatureCards(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<SecurityFeatureCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse security features
  const securityFeatures = parseSecurityFeatures(
    blockContent.security_features, 
    blockContent.feature_descriptions
  );

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SecurityFeatureCards"
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

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {securityFeatures.map((feature) => (
            <SecurityFeatureCard
              key={feature.id}
              feature={feature}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
            />
          ))}
        </div>

        {/* Security Stats */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-white text-center">
          <h3 className="text-2xl lg:text-3xl font-bold mb-8" style={getTextStyle('h2')}>
            Security by the Numbers
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-gray-300">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-300">Monitoring</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-400 mb-2">256-bit</div>
              <div className="text-gray-300">Encryption</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-yellow-400 mb-2">&lt;1sec</div>
              <div className="text-gray-300">Threat Response</div>
            </div>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SecurityFeatureCards',
  category: 'Security Sections',
  description: 'Highlight security features with detailed descriptions',
  tags: ['security', 'features', 'protection', 'enterprise', 'trust'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  features: [
    'Security feature cards with icons',
    'Status indicators',
    'Security statistics section',
    'Contextual iconography',
    'Gradient backgrounds'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'security_features', label: 'Security Features (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true }
  ],
  
  useCases: [
    'Security-focused landing pages',
    'Enterprise product showcases',
    'Trust and safety pages',
    'Technical security overviews'
  ]
};