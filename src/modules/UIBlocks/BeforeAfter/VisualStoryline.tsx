import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTypography } from '@/hooks/useTypography';
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

interface VisualStorylineContent {
  headline: string;
  step1_title: string;
  step1_description: string;
  step1_visual?: string;
  step2_title: string;
  step2_description: string;
  step2_visual?: string;
  step3_title: string;
  step3_description: string;
  step3_visual?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Journey to Success' 
  },
  step1_title: { 
    type: 'string' as const, 
    default: 'Current Situation' 
  },
  step1_description: { 
    type: 'string' as const, 
    default: 'You\'re dealing with inefficient processes that consume time and create frustration in your daily workflow.' 
  },
  step1_visual: { 
    type: 'string' as const, 
    default: '/step1-placeholder.jpg' 
  },
  step2_title: { 
    type: 'string' as const, 
    default: 'Implementation' 
  },
  step2_description: { 
    type: 'string' as const, 
    default: 'Our solution seamlessly integrates into your existing workflow, automating repetitive tasks and optimizing performance.' 
  },
  step2_visual: { 
    type: 'string' as const, 
    default: '/step2-placeholder.jpg' 
  },
  step3_title: { 
    type: 'string' as const, 
    default: 'Transformation' 
  },
  step3_description: { 
    type: 'string' as const, 
    default: 'Experience dramatic improvements in productivity, efficiency, and overall satisfaction with streamlined operations.' 
  },
  step3_visual: { 
    type: 'string' as const, 
    default: '/step3-placeholder.jpg' 
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

const StorylineStep = React.memo(({ 
  stepNumber, 
  title, 
  description, 
  visual, 
  isLast,
  showImageToolbar,
  sectionId,
  mode,
  h3Style,
  bodyLgStyle,
  labelStyle
}: {
  stepNumber: number;
  title: string;
  description: string;
  visual?: string;
  isLast: boolean;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  h3Style: React.CSSProperties;
  bodyLgStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}) => {
  
  const getStepColor = (step: number) => {
    switch (step) {
      case 1: return { bg: 'bg-red-500', ring: 'ring-red-100', gradient: 'from-red-50 to-red-100' };
      case 2: return { bg: 'bg-blue-500', ring: 'ring-blue-100', gradient: 'from-blue-50 to-blue-100' };
      case 3: return { bg: 'bg-green-500', ring: 'ring-green-100', gradient: 'from-green-50 to-green-100' };
      default: return { bg: 'bg-gray-500', ring: 'ring-gray-100', gradient: 'from-gray-50 to-gray-100' };
    }
  };

  const colors = getStepColor(stepNumber);

  const VisualPlaceholder = () => (
    <div className={`relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br ${colors.gradient}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-16 h-16 rounded-full ${colors.bg.replace('bg-', 'bg-opacity-20 bg-')} flex items-center justify-center`}>
          <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
            <span className="text-white font-bold" style={labelStyle}>{stepNumber}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center text-sm font-medium text-gray-700">
          Step {stepNumber}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        <div className="flex-1 space-y-6">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.ring} ring-4 flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold" style={labelStyle}>{stepNumber}</span>
            </div>
            <h3 className="text-gray-900" style={h3Style}>{title}</h3>
          </div>
          
          <p className="text-gray-600 leading-relaxed pl-16" style={bodyLgStyle}>
            {description}
          </p>
        </div>

        <div className="flex-1 max-w-md">
          {visual && visual !== '' ? (
            <img
              src={visual}
              alt={`Step ${stepNumber}: ${title}`}
              className="w-full h-48 object-cover rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
              data-image-id={`${sectionId}-step${stepNumber}-visual`}
              onMouseUp={(e) => {
                // Image toolbar is only available in edit mode
              }}
            />
          ) : (
            <VisualPlaceholder />
          )}
        </div>
      </div>

      {!isLast && (
        <div className="flex justify-center my-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-1 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full" />
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});
StorylineStep.displayName = 'StorylineStep';

export default function VisualStoryline(props: LayoutComponentProps) {
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
  } = useLayoutComponent<VisualStorylineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const labelStyle = getTypographyStyle('label');

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  const steps = [
    {
      title: blockContent.step1_title,
      description: blockContent.step1_description,
      visual: blockContent.step1_visual,
      editKey: 'step1'
    },
    {
      title: blockContent.step2_title,
      description: blockContent.step2_description,
      visual: blockContent.step2_visual,
      editKey: 'step2'
    },
    {
      title: blockContent.step3_title,
      description: blockContent.step3_description,
      visual: blockContent.step3_visual,
      editKey: 'step3'
    }
  ];
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VisualStoryline"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
            colorTokens={colorTokens}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce your visual journey..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <div key={index}>
              {mode === 'edit' ? (
                <div className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-700">Step {index + 1}</h4>
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={step.title}
                    onEdit={(value) => handleContentUpdate(`${step.editKey}_title`, value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="font-semibold"
                    placeholder="Step title"
                    sectionId={sectionId}
                    elementKey={`${step.editKey}_title`}
                    sectionBackground={sectionBackground}
                  />
                  
                  <EditableAdaptiveText
                    mode={mode}
                    value={step.description}
                    onEdit={(value) => handleContentUpdate(`${step.editKey}_description`, value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="leading-relaxed"
                    placeholder="Step description"
                    sectionId={sectionId}
                    elementKey={`${step.editKey}_description`}
                    sectionBackground={sectionBackground}
                  />
                </div>
              ) : (
                <StorylineStep
                  stepNumber={index + 1}
                  title={step.title}
                  description={step.description}
                  visual={step.visual}
                  isLast={index === steps.length - 1}
                  showImageToolbar={showImageToolbar}
                  sectionId={sectionId}
                  mode={mode}
                  h3Style={h3Style}
                  bodyLgStyle={bodyLgStyle}
                  labelStyle={labelStyle}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center">
            <div className="flex justify-center space-x-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            
            <h3 className="text-gray-900 mb-4" style={h3Style}>
              Your Complete Transformation Journey
            </h3>
            
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Experience this same progression with our proven methodology that has helped thousands transform their operations.
            </p>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
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
  name: 'VisualStoryline',
  category: 'Comparison',
  description: 'Timeline-based visual progression layout. Perfect for desire-led copy and solution-aware audiences.',
  tags: ['comparison', 'timeline', 'visual', 'storytelling', 'progression'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step1_title', label: 'Step 1 Title', type: 'text', required: true },
    { key: 'step1_description', label: 'Step 1 Description', type: 'textarea', required: true },
    { key: 'step1_visual', label: 'Step 1 Visual', type: 'image', required: false },
    { key: 'step2_title', label: 'Step 2 Title', type: 'text', required: true },
    { key: 'step2_description', label: 'Step 2 Description', type: 'textarea', required: true },
    { key: 'step2_visual', label: 'Step 2 Visual', type: 'image', required: false },
    { key: 'step3_title', label: 'Step 3 Title', type: 'text', required: true },
    { key: 'step3_description', label: 'Step 3 Description', type: 'textarea', required: true },
    { key: 'step3_visual', label: 'Step 3 Visual', type: 'image', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Step-by-step visual journey progression',
    'Timeline-based storytelling approach',
    'Color-coded progression indicators',
    'Perfect for creative and visual tools',
    'Desire-led copy optimization',
    'Engaging visual narrative flow'
  ],
  
  useCases: [
    'Creative tool transformations',
    'Process improvement showcases',
    'User journey visualizations',
    'Solution-aware audience targeting',
    'Design and development workflows'
  ]
};