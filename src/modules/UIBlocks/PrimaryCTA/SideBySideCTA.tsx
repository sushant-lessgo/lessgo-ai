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
import IconEditableText from '@/components/ui/IconEditableText';
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
    default: '⚡' 
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
    default: '💬' 
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
                <IconEditableText
                  mode={mode}
                  value={blockContent.left_icon_type || '⚡'}
                  onEdit={(value) => handleContentUpdate('left_icon_type', value)}
                  backgroundType="primary"
                  colorTokens={colorTokens}
                  iconSize="xl"
                  className="text-4xl text-white"
                  sectionId={sectionId}
                  elementKey="left_icon_type"
                />
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
                <IconEditableText
                  mode={mode}
                  value={blockContent.right_icon_type || '💬'}
                  onEdit={(value) => handleContentUpdate('right_icon_type', value)}
                  backgroundType="secondary"
                  colorTokens={colorTokens}
                  iconSize="xl"
                  className="text-4xl text-white"
                  sectionId={sectionId}
                  elementKey="right_icon_type"
                />
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