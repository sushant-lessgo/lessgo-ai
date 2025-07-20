import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TextListTransformationContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_list: string;
  after_list: string;
  transformation_text: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Transform Your Daily Challenges' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Current Problems' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'Your New Reality' 
  },
  before_list: { 
    type: 'string' as const, 
    default: 'Spending hours on repetitive tasks|Struggling with manual data entry|Dealing with human errors and inconsistencies|Managing multiple disconnected tools|Feeling overwhelmed by growing workload' 
  },
  after_list: { 
    type: 'string' as const, 
    default: 'Automated workflows that run 24/7|Seamless data synchronization across platforms|99.9% accuracy with intelligent error detection|Unified dashboard for all your operations|Peace of mind with reliable automation' 
  },
  transformation_text: { 
    type: 'string' as const, 
    default: 'Our solution bridges the gap between where you are and where you want to be.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  }
};

const ListItem = React.memo(({ 
  text, 
  type 
}: { 
  text: string; 
  type: 'before' | 'after' 
}) => (
  <div className="flex items-start space-x-3 group">
    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
      type === 'before' 
        ? 'bg-red-100 group-hover:bg-red-200' 
        : 'bg-green-100 group-hover:bg-green-200'
    } transition-colors duration-200`}>
      {type === 'before' ? (
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-200">
      {text}
    </p>
  </div>
));
ListItem.displayName = 'ListItem';

export default function TextListTransformation(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<TextListTransformationContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const beforeItems = blockContent.before_list 
    ? blockContent.before_list.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const afterItems = blockContent.after_list 
    ? blockContent.after_list.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TextListTransformation"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-12">
          
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-red-500 ring-4 ring-red-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_label}
                  onEdit={(value) => handleContentUpdate('before_label', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: '#ef4444'
                  }}
                  className="text-red-500 text-xl"
                  sectionId={sectionId}
                  elementKey="before_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="space-y-4">
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_list}
                  onEdit={(value) => handleContentUpdate('before_list', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="leading-relaxed"
                  placeholder="Enter before items separated by | (pipe)"
                  sectionId={sectionId}
                  elementKey="before_list"
                  sectionBackground={sectionBackground}
                />
              ) : (
                beforeItems.map((item, index) => (
                  <ListItem key={index} text={item} type="before" />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full ${colorTokens.ctaBg} flex items-center justify-center shadow-lg`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.transformation_text}
                onEdit={(value) => handleContentUpdate('transformation_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body')}
                className={`text-center ${mutedTextColor} max-w-xs`}
                sectionId={sectionId}
                elementKey="transformation_text"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-green-500 ring-4 ring-green-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_label}
                  onEdit={(value) => handleContentUpdate('after_label', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('h3'),
                    fontWeight: 600,
                    color: '#10b981'
                  }}
                  className="text-green-500 text-xl"
                  sectionId={sectionId}
                  elementKey="after_label"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>

            <div className="space-y-4">
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_list}
                  onEdit={(value) => handleContentUpdate('after_list', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="leading-relaxed"
                  placeholder="Enter after items separated by | (pipe)"
                  sectionId={sectionId}
                  elementKey="after_list"
                  sectionBackground={sectionBackground}
                />
              ) : (
                afterItems.map((item, index) => (
                  <ListItem key={index} text={item} type="after" />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center space-x-4">
              {[1,2,3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${i === 2 ? colorTokens.ctaBg : 'bg-gray-300'}`} />
              ))}
            </div>
            
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.transformation_text}
              onEdit={(value) => handleContentUpdate('transformation_text', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg font-medium max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="transformation_text"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your message..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    textStyle={getTextStyle('body-lg')}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TextListTransformation',
  category: 'Comparison',
  description: 'Text-heavy transformation layout with bullet lists. Perfect for unaware/problem-aware audiences and pain-led copy.',
  tags: ['comparison', 'text-heavy', 'lists', 'pain-led', 'awareness'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_list', label: 'Before List (pipe separated)', type: 'textarea', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_list', label: 'After List (pipe separated)', type: 'textarea', required: true },
    { key: 'transformation_text', label: 'Transformation Text', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Clear before/after bullet point lists',
    'Central transformation arrow and messaging',
    'Text-focused for detailed explanations',
    'Perfect for early awareness stages',
    'Pain-led copy approach',
    'Comprehensive problem/solution breakdown'
  ],
  
  useCases: [
    'Detailed problem awareness building',
    'Pain-led marketing campaigns',
    'Early-stage product education',
    'Complex transformation explanations',
    'Level-1 and Level-2 market sophistication'
  ]
};