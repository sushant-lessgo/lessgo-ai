import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getRandomIconFromCategory } from '@/utils/iconMapping';

interface TimelineContent {
  headline: string;
  step_numbers: string;
  step_titles: string;
  step_descriptions: string;
  step_durations?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Step benefit badges
  step_benefit_1?: string;
  step_benefit_2?: string;
  // Step benefit icons
  step_benefit_icon_1?: string;
  step_benefit_icon_2?: string;
  // Process Summary Fields
  process_summary_title?: string;
  process_summary_description?: string;
  show_process_summary?: boolean;
  // Timeline icons
  timeline_icon_1?: string;
  timeline_icon_2?: string;
  timeline_icon_3?: string;
  timeline_icon_4?: string;
  timeline_icon_5?: string;
  timeline_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'How Our Workflow Automation Works' 
  },
  step_numbers: { 
    type: 'string' as const, 
    default: '01|02|03|04' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Connect Your Tools|Set Up Triggers|Define Actions|Monitor & Optimize' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Integrate with your existing tools and platforms through our extensive library of pre-built connectors or custom API integrations.|Choose from dozens of event triggers or create custom conditions that initiate your automated workflows exactly when needed.|Build powerful automation sequences with our visual workflow builder. No coding required - just drag, drop, and configure.|Track performance metrics in real-time and use AI-powered insights to continuously improve your automation efficiency.' 
  },
  step_durations: { 
    type: 'string' as const, 
    default: '5 mins|10 mins|15 mins|Ongoing' 
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
  // Step benefit badges
  step_benefit_1: { 
    type: 'string' as const, 
    default: 'Automated' 
  },
  step_benefit_2: { 
    type: 'string' as const, 
    default: 'Time-saving' 
  },
  // Step benefit icons
  step_benefit_icon_1: { 
    type: 'string' as const, 
    default: '✅' 
  },
  step_benefit_icon_2: { 
    type: 'string' as const, 
    default: '⏱️' 
  },
  // Process Summary Schema
  process_summary_title: { 
    type: 'string' as const, 
    default: 'Complete Setup in Under 30 Minutes' 
  },
  process_summary_description: { 
    type: 'string' as const, 
    default: 'Get your automated workflows up and running quickly with our intuitive process' 
  },
  show_process_summary: {
    type: 'boolean' as const,
    default: true
  },
  // Timeline icons with smart defaults
  timeline_icon_1: { type: 'string' as const, default: '🔗' },
  timeline_icon_2: { type: 'string' as const, default: '⚙️' },
  timeline_icon_3: { type: 'string' as const, default: '⚡' },
  timeline_icon_4: { type: 'string' as const, default: '📊' },
  timeline_icon_5: { type: 'string' as const, default: '🎯' },
  timeline_icon_6: { type: 'string' as const, default: '🚀' }
};

// Helper function to get timeline icon
const getTimelineIcon = (blockContent: TimelineContent, index: number) => {
  const iconFields = [
    blockContent.timeline_icon_1,
    blockContent.timeline_icon_2,
    blockContent.timeline_icon_3,
    blockContent.timeline_icon_4,
    blockContent.timeline_icon_5,
    blockContent.timeline_icon_6
  ];
  return iconFields[index] || '⭐';
};

// Helper function to add a new timeline step
const addTimelineStep = (numbers: string, titles: string, descriptions: string, durations: string): {
  newNumbers: string;
  newTitles: string;
  newDescriptions: string;
  newDurations: string;
} => {
  const numberList = numbers.split('|').map(n => n.trim()).filter(n => n);
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const durationList = durations.split('|').map(d => d.trim()).filter(d => d);

  // Add new step with default content
  const nextNumber = String(numberList.length + 1).padStart(2, '0');
  numberList.push(nextNumber);
  titleList.push('New Step');
  descriptionList.push('Describe this step in your process or workflow.');
  durationList.push('5 mins');

  return {
    newNumbers: numberList.join('|'),
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newDurations: durationList.join('|')
  };
};

// Helper function to remove a timeline step
const removeTimelineStep = (numbers: string, titles: string, descriptions: string, durations: string, indexToRemove: number): {
  newNumbers: string;
  newTitles: string;
  newDescriptions: string;
  newDurations: string;
} => {
  const numberList = numbers.split('|').map(n => n.trim()).filter(n => n);
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const durationList = durations.split('|').map(d => d.trim()).filter(d => d);

  // Remove the step at the specified index
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    numberList.splice(indexToRemove, 1);
    titleList.splice(indexToRemove, 1);
    descriptionList.splice(indexToRemove, 1);
    durationList.splice(indexToRemove, 1);

    // Renumber remaining steps
    for (let i = 0; i < numberList.length; i++) {
      numberList[i] = String(i + 1).padStart(2, '0');
    }
  }

  return {
    newNumbers: numberList.join('|'),
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newDurations: durationList.join('|')
  };
};

const TimelineStep = React.memo(({ 
  number, 
  title, 
  description, 
  duration,
  isLast,
  colorTokens,
  mutedTextColor,
  h3Style,
  mode,
  blockContent,
  handleContentUpdate,
  sectionId,
  sectionBackground,
  props
}: {
  number: string;
  title: string;
  description: string;
  duration?: string;
  isLast: boolean;
  colorTokens: any;
  mutedTextColor: string;
  h3Style: React.CSSProperties;
  mode: 'edit' | 'preview';
  blockContent: any;
  handleContentUpdate: any;
  sectionId: string;
  sectionBackground: string;
  props: any;
}) => {
  
  return (
    <div className="relative flex items-start">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-30" />
      )}
      
      {/* Step Content */}
      <div className="flex items-start space-x-6">
        {/* Step Number */}
        <div className="flex-shrink-0">
          <div className={`relative w-16 h-16 rounded-2xl ${colorTokens.ctaBg} shadow-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-xl">{number}</span>
            {!isLast && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Step Details */}
        <div className="flex-1 pb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <h3 style={h3Style} className="font-bold text-gray-900">{title}</h3>
              {duration && (
                <span className={`text-sm font-medium ${mutedTextColor} bg-gray-100 px-3 py-1 rounded-full`}>
                  {duration}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              {description}
            </p>
            
            <div className="mt-4 flex items-center space-x-4">
              {(blockContent.step_benefit_1 || mode === 'edit') && blockContent.step_benefit_1 !== '___REMOVED___' && (
                <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.step_benefit_icon_1 || '✅'}
                    onEdit={(value) => handleContentUpdate('step_benefit_icon_1', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="sm"
                    className="text-green-600 text-lg"
                    sectionId={sectionId}
                    elementKey="step_benefit_icon_1"
                  />
                  {mode !== 'preview' ? (
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.step_benefit_1 || ''}
                      onEdit={(value) => handleContentUpdate('step_benefit_1', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Benefit 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="step_benefit_1"
                    />
                  ) : (
                    <span className="text-sm">{blockContent.step_benefit_1}</span>
                  )}
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('step_benefit_1', '___REMOVED___');
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
              {(blockContent.step_benefit_2 || mode === 'edit') && blockContent.step_benefit_2 !== '___REMOVED___' && (
                <div className="flex items-center space-x-2 text-blue-600 group/benefit-item relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.step_benefit_icon_2 || '⏱️'}
                    onEdit={(value) => handleContentUpdate('step_benefit_icon_2', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="sm"
                    className="text-blue-600 text-lg"
                    sectionId={sectionId}
                    elementKey="step_benefit_icon_2"
                  />
                  {mode !== 'preview' ? (
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.step_benefit_2 || ''}
                      onEdit={(value) => handleContentUpdate('step_benefit_2', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Benefit 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="step_benefit_2"
                    />
                  ) : (
                    <span className="text-sm">{blockContent.step_benefit_2}</span>
                  )}
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('step_benefit_2', '___REMOVED___');
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
      </div>
    </div>
  );
});
TimelineStep.displayName = 'TimelineStep';

export default function Timeline(props: LayoutComponentProps) {
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
  } = useLayoutComponent<TimelineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const stepNumbers = blockContent.step_numbers 
    ? blockContent.step_numbers.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDurations = blockContent.step_durations 
    ? blockContent.step_durations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepNumbers.map((number, index) => ({
    number,
    title: stepTitles[index] || '',
    description: stepDescriptions[index] || '',
    duration: stepDurations[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Timeline"
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your workflow process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Timeline Steps</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_numbers || ''}
                  onEdit={(value) => handleContentUpdate('step_numbers', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step numbers (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_numbers"
                  sectionBackground={sectionBackground}
                />
                
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
                number={step.number}
                title={step.title}
                description={step.description}
                duration={step.duration}
                isLast={index === steps.length - 1}
                colorTokens={colorTokens}
                mutedTextColor={mutedTextColor}
                h3Style={h3Style}
                mode={mode}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                sectionId={sectionId}
                sectionBackground={sectionBackground}
                props={props}
              />
            ))}
          </div>
        )}

        {/* Process Summary - Editable */}
        {blockContent.show_process_summary !== false && (blockContent.process_summary_title || mode === 'edit') && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <div className="text-center">
              <div className="flex justify-center space-x-8 mb-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full ${colorTokens.ctaBg} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{step.number}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <svg className="w-6 h-6 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.process_summary_title || ''}
                onEdit={(value) => handleContentUpdate('process_summary_title', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-xl font-semibold text-gray-900 mb-2"
                placeholder="Process summary title..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="process_summary_title"
              />
              
              {(blockContent.process_summary_description || mode === 'edit') && blockContent.process_summary_description !== '___REMOVED___' && (
                <div className="group/summary-description relative">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.process_summary_description || ''}
                    onEdit={(value) => handleContentUpdate('process_summary_description', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`${mutedTextColor} max-w-2xl mx-auto`}
                    placeholder="Process summary description..."
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="process_summary_description"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('process_summary_description', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/summary-description:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                      title="Remove summary description"
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
        )}

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
                placeholder="Add optional supporting text to reinforce your workflow benefits..."
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
  name: 'Timeline',
  category: 'Features',
  description: 'Process timeline layout for workflow features. Perfect for productivity tools and process-oriented products.',
  tags: ['features', 'timeline', 'process', 'workflow', 'productivity'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_numbers', label: 'Step Numbers (pipe separated)', type: 'text', required: true },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_durations', label: 'Step Durations (pipe separated)', type: 'text', required: false },
    { key: 'step_benefit_1', label: 'Step Benefit 1', type: 'text', required: false },
    { key: 'step_benefit_2', label: 'Step Benefit 2', type: 'text', required: false },
    { key: 'process_summary_title', label: 'Process Summary Title', type: 'text', required: false },
    { key: 'process_summary_description', label: 'Process Summary Description', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Vertical timeline with connected steps',
    'Process-oriented feature presentation',
    'Duration indicators for each step',
    'Visual flow indicators',
    'Summary section with total time',
    'Perfect for workflow automation'
  ],
  
  useCases: [
    'Workflow automation products',
    'Process management tools',
    'No-code platform features',
    'Productivity tool workflows',
    'Integration platform processes'
  ]
};