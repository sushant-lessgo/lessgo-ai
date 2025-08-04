// components/layout/ValueStackCTA.tsx
// Production-ready benefits-stacked CTA using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface ValueStackCTAContent {
  headline: string;
  subheadline?: string;
  value_propositions: string;
  value_descriptions: string;
  cta_text: string;
  guarantee_text?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Everything You Need to Succeed' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Get all the tools, support, and resources you need to transform your business.' 
  },
  value_propositions: { 
    type: 'string' as const, 
    default: 'Save 20+ Hours Per Week|Increase Team Productivity by 40%|Automate Repetitive Tasks|Get Real-Time Analytics|24/7 Expert Support|Seamless Integrations' 
  },
  value_descriptions: { 
    type: 'string' as const, 
    default: 'Eliminate manual work with intelligent automation workflows that handle routine tasks automatically.|Boost your team\'s efficiency with streamlined processes and collaboration tools.|Set up workflows once and let them run automatically, freeing up time for strategic work.|Track performance in real-time with comprehensive dashboards and detailed reports.|Access expert help whenever you need it with our dedicated customer success team.|Connect with 1000+ apps and tools your team already uses.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Transformation' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '30-day money-back guarantee' 
  }
};

// Value Proposition Interface
interface ValueProp {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Parse value propositions
const parseValueProps = (titles: string, descriptions: string): ValueProp[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(Boolean);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(Boolean);
  
  const icons = ['⚡', '📈', '🤖', '📊', '🎯', '🔗', '💡', '🚀'];
  
  return titleList.map((title, index) => ({
    id: `value-${index}`,
    title,
    description: descriptionList[index] || 'No description provided.',
    icon: icons[index % icons.length]
  }));
};

// Value Proposition Card
const ValuePropCard = React.memo(({ 
  valueProp, 
  index,
  colorTokens,
  getTextStyle 
}: {
  valueProp: ValueProp;
  index: number;
  colorTokens: any;
  getTextStyle: any;
}) => {
  return (
    <div className="flex items-start space-x-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
      
      {/* Icon */}
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {valueProp.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-2" style={getTextStyle('h3')}>
          {valueProp.title}
        </h3>
        <p className="text-gray-600 leading-relaxed" style={getTextStyle('body-sm')}>
          {valueProp.description}
        </p>
      </div>
      
      {/* Checkmark */}
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
});
ValuePropCard.displayName = 'ValuePropCard';

export default function ValueStackCTA(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ValueStackCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse value propositions
  const valueProps = parseValueProps(blockContent.value_propositions, blockContent.value_descriptions);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ValueStackCTA"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
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

        {/* Value Propositions Grid */}
        <div className="grid gap-6 mb-12">
          {valueProps.map((valueProp, index) => (
            <ValuePropCard
              key={valueProp.id}
              valueProp={valueProp}
              index={index}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 text-center text-white">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4" style={getTextStyle('h2')}>
            Ready to Get Started?
          </h3>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto" style={getTextStyle('body-lg')}>
            Join thousands of businesses already transforming their operations with our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={{ ...colorTokens, ctaBg: 'bg-white', ctaText: 'text-blue-600', ctaHover: 'hover:bg-gray-100' }}
              textStyle={getTextStyle('body-lg')}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              size="large"
              sectionId={sectionId}
              elementKey="cta_text"
              onClick={createCTAClickHandler(sectionId)}
            />
            
            {blockContent.guarantee_text && (
              <div className="flex items-center space-x-2 text-blue-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_text}
                  onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                  backgroundType="primary"
                  colorTokens={{ ...colorTokens, textSecondary: 'text-blue-100' }}
                  variant="body"
                  textStyle={getTextStyle('body-sm')}
                  className="text-sm font-medium"
                  sectionId={sectionId}
                  elementKey="guarantee_text"
                  sectionBackground="bg-blue-600"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ValueStackCTA',
  category: 'CTA Sections',
  description: 'Benefits-stacked CTA showcasing value propositions',
  tags: ['cta', 'benefits', 'value-stack', 'features', 'conversion'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Stacked value propositions',
    'Icon-enhanced benefits',
    'Gradient CTA section',
    'Guarantee display',
    'Checkmark validation'
  ],
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'value_propositions', label: 'Value Proposition Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'value_descriptions', label: 'Value Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false }
  ],
  
  useCases: [
    'Feature-rich product CTAs',
    'Service benefits showcase',
    'Comprehensive solution pitches',
    'Value-driven conversions'
  ]
};