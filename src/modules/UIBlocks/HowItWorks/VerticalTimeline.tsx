import React, { useEffect, useRef } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface VerticalTimelineContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_durations?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  process_summary_text?: string;
  // Optional step icon overrides
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  use_step_icons?: boolean;
  // Legacy fields for migration
  process_steps_label?: string;
  process_summary_heading?: string;
  process_summary_description?: string;
  process_time_label?: string;
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
  },
  process_summary_text: {
    type: 'string' as const,
    default: 'Our streamlined process gets you results faster than you thought possible'
  },
  // Optional step icon overrides
  step_icon_1: { type: 'string' as const, default: '' },
  step_icon_2: { type: 'string' as const, default: '' },
  step_icon_3: { type: 'string' as const, default: '' },
  step_icon_4: { type: 'string' as const, default: '' },
  use_step_icons: { type: 'boolean' as const, default: false }
};

const TimelineStep = React.memo(({ 
  title, 
  description, 
  duration,
  index,
  isLast,
  colorTokens,
  mutedTextColor,
  blockContent,
  handleContentUpdate,
  mode,
  backgroundType,
  sectionId,
  getStepIcon,
  handleStepIconEdit,
  onRemove
}: {
  title: string;
  description: string;
  duration?: string;
  index: number;
  isLast: boolean;
  colorTokens: any;
  mutedTextColor: string;
  blockContent: VerticalTimelineContent;
  handleContentUpdate: (key: string, value: any) => void;
  mode: 'edit' | 'preview';
  backgroundType: any;
  sectionId: string;
  getStepIcon: (index: number) => string;
  handleStepIconEdit: (index: number, value: string) => void;
  onRemove?: () => void;
}) => {
  
  const getStepStyle = (index: number) => {
    const gradients = [
      { background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }, // blue
      { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }, // green
      { background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)' }, // purple
      { background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }, // orange
      { background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }, // pink
      { background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }  // indigo
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="relative flex items-start">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200" />
      )}
      
      {/* Step Content */}
      <div className="flex items-start space-x-6 w-full">
        {/* Step Number/Icon */}
        <div className="flex-shrink-0 relative">
          <div 
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10 relative"
            style={getStepStyle(index)}
          >
            {blockContent.use_step_icons && getStepIcon(index) ? (
              <IconEditableText
                mode={mode}
                value={getStepIcon(index) as string}
                onEdit={(value) => handleStepIconEdit(index, value)}
                backgroundType={backgroundType as any}
                colorTokens={colorTokens}
                iconSize="sm"
                className="text-xl text-white"
                sectionId={sectionId}
                elementKey={`step_icon_${index + 1}`}
              />
            ) : (
              <span className="text-white font-bold text-lg">{index + 1}</span>
            )}
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
        <div className="flex-1 pb-12 relative group">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              {/* Editable Step Title */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    handleContentUpdate('step_titles', e.currentTarget.textContent || '');
                  }}
                  className="text-xl font-bold text-gray-900 flex-1 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[32px]"
                  data-placeholder="Step title"
                >
                  {title}
                </div>
              ) : (
                <h3 className="text-xl font-bold text-gray-900 flex-1">{title}</h3>
              )}
              {/* Editable Duration */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    handleContentUpdate('step_durations', e.currentTarget.textContent || '');
                  }}
                  className={`text-sm font-medium ${mutedTextColor} bg-gray-100 px-3 py-1 rounded-full ml-4 flex-shrink-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-text hover:bg-gray-200 min-w-[60px] text-center`}
                  data-placeholder="Duration"
                >
                  {duration || 'Duration'}
                </div>
              ) : (
                duration && (
                  <span className={`text-sm font-medium ${mutedTextColor} bg-gray-100 px-3 py-1 rounded-full ml-4 flex-shrink-0`}>
                    {duration}
                  </span>
                )
              )}
            </div>
            
            {/* Editable Step Description */}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  handleContentUpdate('step_descriptions', e.currentTarget.textContent || '');
                }}
                className="text-gray-600 leading-relaxed mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[48px]"
                data-placeholder="Step description"
              >
                {description}
              </div>
            ) : (
              <p className="text-gray-600 leading-relaxed mb-4">
                {description}
              </p>
            )}
            
          </div>
          
          {/* Remove Step Button - only in edit mode */}
          {mode === 'edit' && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
              title="Remove this step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDurations = blockContent.step_durations 
    ? blockContent.step_durations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Icon edit handlers
  const handleStepIconEdit = (index: number, value: string) => {
    const iconField = `step_icon_${index + 1}` as keyof VerticalTimelineContent;
    handleContentUpdate(iconField, value);
  };

  const getStepIcon = (index: number): string => {
    const iconFields = ['step_icon_1', 'step_icon_2', 'step_icon_3', 'step_icon_4'];
    return (blockContent[iconFields[index] as keyof VerticalTimelineContent] as string) || '';
  };

  const steps = stepTitles.map((title, index) => ({
    title: title || (mode === 'edit' ? `Step ${index + 1}` : ''),
    description: stepDescriptions[index] || '',
    duration: stepDurations[index] || ''
  })).filter(step => step.title.trim() !== '' || mode === 'edit'); // Show empty steps in edit mode

  const trustItems = blockContent.trust_items
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const totalDuration = stepDurations.length > 0 ? '30 minutes' : 'Quick setup';

  // Migration: Convert old fields to new process_summary_text (only once)
  const hasMigrated = useRef(false);

  useEffect(() => {
    // Silent migration: convert old fields to process_summary_text
    if (!hasMigrated.current &&
        !blockContent.process_summary_text &&
        (blockContent.process_time_label || blockContent.process_summary_heading)) {

      const parts: string[] = [];

      if (blockContent.process_summary_heading) parts.push(blockContent.process_summary_heading);
      if (blockContent.process_summary_description) parts.push(blockContent.process_summary_description);

      const migratedText = parts.join('. ') || 'Our streamlined process gets you results quickly and efficiently';

      // Silent migration - no toast notification
      handleContentUpdate('process_summary_text', migratedText);
      hasMigrated.current = true;
    }
  }, [blockContent.process_summary_text, blockContent.process_time_label, blockContent.process_summary_heading, blockContent.process_summary_description, handleContentUpdate]);
  
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

        <div className="space-y-0">
          {steps.map((step, displayIndex) => (
            <TimelineStep
              key={displayIndex}
              title={step.title}
              description={step.description}
              duration={step.duration}
              index={displayIndex}
              isLast={displayIndex === steps.length - 1}
              colorTokens={colorTokens}
              mutedTextColor={mutedTextColor}
              blockContent={blockContent}
              handleContentUpdate={(key, value) => {
                const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                const stepDurations = blockContent.step_durations ? blockContent.step_durations.split('|') : [];
                
                if (key === 'step_titles') {
                  stepTitles[displayIndex] = value;
                  handleContentUpdate('step_titles', stepTitles.join('|'));
                } else if (key === 'step_descriptions') {
                  stepDescriptions[displayIndex] = value;
                  handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                } else if (key === 'step_durations') {
                  stepDurations[displayIndex] = value;
                  handleContentUpdate('step_durations', stepDurations.join('|'));
                } else {
                  handleContentUpdate(key, value);
                }
              }}
              mode={mode}
              backgroundType={backgroundType}
              sectionId={sectionId}
              getStepIcon={(index) => getStepIcon(displayIndex)}
              handleStepIconEdit={(index, value) => handleStepIconEdit(displayIndex, value)}
              onRemove={steps.length > 1 ? () => {
                const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                const stepDurations = blockContent.step_durations ? blockContent.step_durations.split('|') : [];
                
                stepTitles.splice(displayIndex, 1);
                stepDescriptions.splice(displayIndex, 1);
                stepDurations.splice(displayIndex, 1);
                
                handleContentUpdate('step_titles', stepTitles.join('|'));
                handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                handleContentUpdate('step_durations', stepDurations.join('|'));
              } : undefined}
            />
          ))}
          
          {/* Add Step Button - only in edit mode */}
          {mode === 'edit' && steps.length < 6 && (
            <div className="relative flex items-start">
              <div className="flex items-start space-x-6 w-full">
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-all duration-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 pb-12">
                  <button
                    onClick={() => {
                      const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                      const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                      const stepDurations = blockContent.step_durations ? blockContent.step_durations.split('|') : [];
                      
                      stepTitles.push(`Step ${stepTitles.length + 1}`);
                      stepDescriptions.push('Add step description here');
                      stepDurations.push('5 minutes');

                      handleContentUpdate('step_titles', stepTitles.join('|'));
                      handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                      handleContentUpdate('step_durations', stepDurations.join('|'));

                      // Add a smart icon for the new step
                      const newStepCount = stepTitles.length;
                      const iconField = `step_icon_${newStepCount}` as keyof VerticalTimelineContent;
                      if (newStepCount <= 4) {
                        const defaultIcon = getRandomIconFromCategory('process');
                        handleContentUpdate(iconField, defaultIcon);
                      }
                    }}
                    className="w-full bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-all duration-300 hover:bg-gray-50"
                    title="Add new step"
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium">Add Timeline Step</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Process Summary */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.process_summary_text || ''}
              onEdit={(value) => handleContentUpdate('process_summary_text', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg font-semibold text-gray-900"
              placeholder="Add process summary..."
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              elementKey="process_summary_text"
            />
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'process_summary_text', label: 'Process Summary Text', type: 'text', required: false },
    { key: 'step_feature_1_text', label: 'Step Feature 1', type: 'text', required: false },
    { key: 'step_feature_2_text', label: 'Step Feature 2', type: 'text', required: false },
    { key: 'step_icon_1', label: 'Step 1 Icon', type: 'text', required: false },
    { key: 'step_icon_2', label: 'Step 2 Icon', type: 'text', required: false },
    { key: 'step_icon_3', label: 'Step 3 Icon', type: 'text', required: false },
    { key: 'step_icon_4', label: 'Step 4 Icon', type: 'text', required: false },
    { key: 'use_step_icons', label: 'Use Custom Step Icons', type: 'boolean', required: false }
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