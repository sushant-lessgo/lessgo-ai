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

interface VerticalTimelineContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_durations?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'How Our Process Works' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Initial Setup|Data Import|Automation Rules|Go Live' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Connect your existing tools and configure your workspace with our guided setup wizard.|Import your data securely with our automated migration tools that preserve all your important information.|Create powerful automation rules using our visual builder - no coding required.|Launch your optimized workflows and start seeing results immediately.' 
  },
  step_durations: { 
    type: 'string' as const, 
    default: '5 minutes|10 minutes|15 minutes|Instant' 
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

const TimelineStep = React.memo(({ 
  title, 
  description, 
  duration,
  index,
  isLast,
  colorTokens,
  mutedTextColor
}: {
  title: string;
  description: string;
  duration?: string;
  index: number;
  isLast: boolean;
  colorTokens: any;
  mutedTextColor: string;
}) => {
  
  const getStepColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="relative flex items-start">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200" />
      )}
      
      {/* Step Content */}
      <div className="flex items-start space-x-6 w-full">
        {/* Step Number */}
        <div className="flex-shrink-0 relative">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStepColor(index)} shadow-lg flex items-center justify-center z-10 relative`}>
            <span className="text-white font-bold text-lg">{index + 1}</span>
          </div>
          {!isLast && (
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Step Details */}
        <div className="flex-1 pb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex-1">{title}</h3>
              {duration && (
                <span className={`text-sm font-medium ${mutedTextColor} bg-gray-100 px-3 py-1 rounded-full ml-4 flex-shrink-0`}>
                  {duration}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">
              {description}
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Guided process</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm">Support included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
TimelineStep.displayName = 'TimelineStep';

export default function VerticalTimeline(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<VerticalTimelineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDurations = blockContent.step_durations 
    ? blockContent.step_durations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || '',
    duration: stepDurations[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const totalDuration = stepDurations.length > 0 ? '30 minutes' : 'Quick setup';
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VerticalTimeline"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
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
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Timeline Steps</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_titles || ''}
                  onEdit={(value) => handleContentUpdate('step_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('step_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_durations || ''}
                  onEdit={(value) => handleContentUpdate('step_durations', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Step durations (pipe separated) - optional"
                  sectionId={sectionId}
                  elementKey="step_durations"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {steps.map((step, index) => (
              <TimelineStep
                key={index}
                title={step.title}
                description={step.description}
                duration={step.duration}
                index={index}
                isLast={index === steps.length - 1}
                colorTokens={colorTokens}
                mutedTextColor={mutedTextColor}
              />
            ))}
          </div>
        )}

        {/* Process Summary */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">{totalDuration} to complete</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">{steps.length} simple steps</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Get Started in Minutes, Not Hours
            </h3>
            
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Our streamlined onboarding process gets you up and running quickly with personalized guidance every step of the way.
            </p>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your process benefits..."
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
  name: 'VerticalTimeline',
  category: 'HowItWorks',
  description: 'Vertical timeline process layout. Perfect for workflow automation and solution-aware audiences.',
  tags: ['how-it-works', 'timeline', 'process', 'workflow', 'automation'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_durations', label: 'Step Durations (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Vertical timeline with connected steps',
    'Duration indicators for each step',
    'Process summary with total time',
    'Gradient step numbers with colors',
    'Perfect for workflow processes',
    'Guided process indicators'
  ],
  
  useCases: [
    'Workflow automation products',
    'Business process tools',
    'Marketing and sales platforms',
    'Solution-aware audiences',
    'Desire-led copy strategies'
  ]
};