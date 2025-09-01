import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SplitAlternatingContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  feature_visuals?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Feature icons
  feature_icon_1?: string;
  feature_icon_2?: string;
  feature_icon_3?: string;
  feature_icon_4?: string;
  // Benefit item fields
  benefit_1?: string;
  benefit_2?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Advanced Features for Power Users' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Intelligent Automation|Real-Time Analytics|Advanced Security|Seamless Integration' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Our AI-powered automation engine learns from your workflows and optimizes processes automatically, reducing manual work by up to 80%.|Monitor performance metrics in real-time with customizable dashboards that give you instant insights into what matters most.|Enterprise-grade security with end-to-end encryption, SOC 2 compliance, and advanced threat detection to keep your data safe.|Connect with over 1000+ tools through our robust API and pre-built integrations, creating a seamless workflow ecosystem.' 
  },
  feature_visuals: { 
    type: 'string' as const, 
    default: '/feature1.jpg|/feature2.jpg|/feature3.jpg|/feature4.jpg' 
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
  },
  // Feature icon schema
  feature_icon_1: { 
    type: 'string' as const, 
    default: '🎯' 
  },
  feature_icon_2: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  feature_icon_3: { 
    type: 'string' as const, 
    default: '📈' 
  },
  feature_icon_4: { 
    type: 'string' as const, 
    default: '🔧' 
  },
  // Benefit item schema
  benefit_1: { 
    type: 'string' as const, 
    default: 'Easy to implement' 
  },
  benefit_2: { 
    type: 'string' as const, 
    default: 'No coding required' 
  }
};

const FeatureRow = React.memo(({ 
  title, 
  description, 
  visual, 
  index,
  showImageToolbar,
  sectionId,
  mode,
  h2Style,
  bodyLgStyle,
  blockContent,
  handleContentUpdate,
  colorTokens,
  sectionBackground,
  props
}: {
  title: string;
  description: string;
  visual?: string;
  index: number;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  h2Style: React.CSSProperties;
  bodyLgStyle: React.CSSProperties;
  blockContent: SplitAlternatingContent;
  handleContentUpdate: (key: keyof SplitAlternatingContent, value: string) => void;
  colorTokens: any;
  sectionBackground: any;
  props: LayoutComponentProps;
}) => {
  const isEven = index % 2 === 0;
  
  // Get feature icon from content fields
  const getFeatureIcon = (index: number) => {
    const iconFields = [
      blockContent.feature_icon_1,
      blockContent.feature_icon_2,
      blockContent.feature_icon_3,
      blockContent.feature_icon_4
    ];
    return iconFields[index] || '🎯';
  };
  
  const VisualPlaceholder = () => (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">{index + 1}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center text-sm font-medium text-gray-700">
          Feature {index + 1} Visual
        </div>
      </div>
    </div>
  );

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:direction-rtl'}`}>
      
      <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <IconEditableText
                mode={mode as 'edit' | 'preview'}
                value={getFeatureIcon(index)}
                onEdit={(value) => {
                  const iconField = `feature_icon_${index + 1}` as keyof SplitAlternatingContent;
                  handleContentUpdate(iconField, value);
                }}
                backgroundType={props.backgroundType as any}
                colorTokens={colorTokens}
                iconSize="md"
                className="text-white text-xl"
                sectionId={sectionId}
                elementKey={`feature_icon_${index + 1}`}
              />
            </div>
            <div className="flex-1">
              <h3 style={h2Style} className="font-bold text-gray-900 mb-4">{title}</h3>
              <p style={bodyLgStyle} className="text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 pl-16">
            {(blockContent.benefit_1 || mode === 'edit') && blockContent.benefit_1 !== '___REMOVED___' && (
              <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode === 'edit' ? (
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.benefit_1 || ''}
                    onEdit={(value) => handleContentUpdate('benefit_1', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-medium"
                    placeholder="Benefit 1"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="benefit_1"
                  />
                ) : (
                  <span className="text-sm font-medium">{blockContent.benefit_1}</span>
                )}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('benefit_1', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove benefit 1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {(blockContent.benefit_2 || mode === 'edit') && blockContent.benefit_2 !== '___REMOVED___' && (
              <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode === 'edit' ? (
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.benefit_2 || ''}
                    onEdit={(value) => handleContentUpdate('benefit_2', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-medium"
                    placeholder="Benefit 2"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="benefit_2"
                  />
                ) : (
                  <span className="text-sm font-medium">{blockContent.benefit_2}</span>
                )}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('benefit_2', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove benefit 2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        {visual && visual !== '' ? (
          <img
            src={visual}
            alt={title}
            className="w-full h-auto rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow duration-300"
            data-image-id={`${sectionId}-feature${index}-visual`}
            onMouseUp={(e) => {
              // Image toolbar is only available in edit mode
            }}
          />
        ) : (
          <VisualPlaceholder />
        )}
      </div>
    </div>
  );
});
FeatureRow.displayName = 'FeatureRow';

export default function SplitAlternating(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<SplitAlternatingContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureVisuals = blockContent.feature_visuals 
    ? blockContent.feature_visuals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const features = featureTitles.map((title, index) => ({
    title,
    description: featureDescriptions[index] || '',
    visual: featureVisuals[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SplitAlternating"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode as 'preview' | 'edit'}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode as 'preview' | 'edit'}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode as 'preview' | 'edit'}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your advanced features..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-24">
          {mode === 'edit' ? (
            <div className="space-y-8">
              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-4">Feature Content</h4>
                
                <div className="space-y-4">
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.feature_titles || ''}
                    onEdit={(value) => handleContentUpdate('feature_titles', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="mb-2"
                    placeholder="Feature titles (pipe separated)"
                    sectionId={sectionId}
                    elementKey="feature_titles"
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode as 'preview' | 'edit'}
                    value={blockContent.feature_descriptions || ''}
                    onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    placeholder="Feature descriptions (pipe separated)"
                    sectionId={sectionId}
                    elementKey="feature_descriptions"
                    sectionBackground={sectionBackground}
                  />
                </div>
              </div>
            </div>
          ) : (
            features.map((feature, index) => (
              <FeatureRow
                key={index}
                title={feature.title}
                description={feature.description}
                visual={feature.visual}
                index={index}
                showImageToolbar={showImageToolbar}
                sectionId={sectionId}
                mode={mode as 'preview' | 'edit'}
                h2Style={h2Style}
                bodyLgStyle={bodyLgStyle}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                props={props}
              />
            ))
          )}
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode as 'preview' | 'edit'}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
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
  name: 'SplitAlternating',
  category: 'Features',
  description: 'Alternating left/right feature layout with visuals. Perfect for complex technical products and enterprise audiences.',
  tags: ['features', 'alternating', 'visual', 'enterprise', 'technical'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_visuals', label: 'Feature Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'benefit_1', label: 'Benefit Item 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit Item 2', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Alternating left/right layout for visual interest',
    'Large feature visuals with detailed descriptions',
    'Numbered feature indicators',
    'Perfect for complex technical explanations',
    'Enterprise-focused design',
    'Responsive grid system'
  ],
  
  useCases: [
    'Technical product feature demonstrations',
    'Enterprise software capabilities',
    'Complex workflow explanations',
    'Engineering tool features',
    'Data analytics platform features'
  ]
};