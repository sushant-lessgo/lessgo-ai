// components/layout/SideBySideCTA.tsx
// Production-ready side-by-side CTA layout using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface SideBySideCTAContent {
  left_headline: string;
  left_description: string;
  left_cta_text: string;
  left_icon_type: string;
  right_headline: string;
  right_description: string;
  right_cta_text: string;
  right_icon_type: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  left_headline: { 
    type: 'string' as const, 
    default: 'Start Your Free Trial' 
  },
  left_description: { 
    type: 'string' as const, 
    default: 'Get full access to all features for 14 days. No credit card required, cancel anytime.' 
  },
  left_cta_text: { 
    type: 'string' as const, 
    default: 'Start Free Trial' 
  },
  left_icon_type: { 
    type: 'string' as const, 
    default: 'lightning' 
  },
  right_headline: { 
    type: 'string' as const, 
    default: 'Schedule a Demo' 
  },
  right_description: { 
    type: 'string' as const, 
    default: 'See how our platform works with your specific use case. Get personalized recommendations.' 
  },
  right_cta_text: { 
    type: 'string' as const, 
    default: 'Book Demo Call' 
  },
  right_icon_type: { 
    type: 'string' as const, 
    default: 'chat' 
  }
};

// Icon rendering function
const renderIcon = (iconType: string, className: string = "w-8 h-8 text-white") => {
  switch (iconType) {
    case 'lightning':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'rocket':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
};

export default function SideBySideCTA(props: LayoutComponentProps) {
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
  } = useLayoutComponent<SideBySideCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySideCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left CTA */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {renderIcon(blockContent.left_icon_type)}
              </div>
              
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.left_headline || ''}
                onEdit={(value) => handleContentUpdate('left_headline', value)}
                level="h3"
                backgroundType="neutral"
                colorTokens={colorTokens}
                className="mb-4 text-gray-900"
                sectionId={sectionId}
                elementKey="left_headline"
                sectionBackground="bg-white"
              />
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.left_description || ''}
                onEdit={(value) => handleContentUpdate('left_description', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-gray-600 mb-6"
                style={bodyLgStyle}
                sectionId={sectionId}
                elementKey="left_description"
                sectionBackground="bg-white"
              />
              
              <CTAButton
                text={blockContent.left_cta_text}
                colorTokens={colorTokens}
                className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                variant="primary"
                sectionId={sectionId}
                elementKey="left_cta_text"
                onClick={createCTAClickHandler(sectionId, "cta_text")}
              />
            </div>
          </div>

          {/* Right CTA */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center relative overflow-hidden border-2 border-gray-200">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-300 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {renderIcon(blockContent.right_icon_type)}
              </div>
              
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.right_headline || ''}
                onEdit={(value) => handleContentUpdate('right_headline', value)}
                level="h3"
                backgroundType="neutral"
                colorTokens={colorTokens}
                className="mb-4 text-gray-900"
                sectionId={sectionId}
                elementKey="right_headline"
                sectionBackground="bg-white"
              />
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.right_description || ''}
                onEdit={(value) => handleContentUpdate('right_description', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-gray-600 mb-6"
                style={bodyLgStyle}
                sectionId={sectionId}
                elementKey="right_description"
                sectionBackground="bg-white"
              />
              
              <CTAButton
                text={blockContent.right_cta_text}
                colorTokens={colorTokens}
                className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                variant="secondary"
                sectionId={sectionId}
                elementKey="right_cta_text"
                onClick={createCTAClickHandler(sectionId, "cta_text")}
              />
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SideBySideCTA',
  category: 'CTA Sections',
  description: 'Two-column CTA layout offering different conversion paths',
  tags: ['cta', 'choice', 'conversion', 'dual-option', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  features: [
    'Dual conversion paths',
    'Visual hierarchy with different styling',
    'Background decorations for visual appeal',
    'Responsive grid layout',
    'Distinct iconography for each option'
  ],
  
  contentFields: [
    { key: 'left_headline', label: 'Left CTA Headline', type: 'text', required: true },
    { key: 'left_description', label: 'Left CTA Description', type: 'textarea', required: true },
    { key: 'left_cta_text', label: 'Left Button Text', type: 'text', required: true },
    { key: 'left_icon_type', label: 'Left Icon Type', type: 'select', required: false, options: ['lightning', 'rocket', 'star', 'shield', 'users', 'chat'] },
    { key: 'right_headline', label: 'Right CTA Headline', type: 'text', required: true },
    { key: 'right_description', label: 'Right CTA Description', type: 'textarea', required: true },
    { key: 'right_cta_text', label: 'Right Button Text', type: 'text', required: true },
    { key: 'right_icon_type', label: 'Right Icon Type', type: 'select', required: false, options: ['lightning', 'rocket', 'star', 'shield', 'users', 'chat'] }
  ],
  
  useCases: [
    'Trial vs Demo choice',
    'Self-service vs Sales-assisted',
    'Different pricing tiers',
    'Multiple product offerings'
  ]
};