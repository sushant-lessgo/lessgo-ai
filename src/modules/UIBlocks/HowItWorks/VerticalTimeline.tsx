'use client';

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

// Step item structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon?: string;
}

// Content interface for VerticalTimeline (V2)
interface VerticalTimelineContent {
  headline: string;
  subheadline?: string;
  process_summary_text?: string;
  steps: StepItem[];
}

// Default steps for new sections
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'Create Your Account', description: 'Sign up with your email in under a minute. No credit card required.', duration: '1 min' },
  { id: 's2', title: 'Connect Your Tools', description: 'Link your existing apps with our one-click integrations.', duration: '5 min' },
  { id: 's3', title: 'Configure Workflows', description: 'Set up automated workflows using our visual builder.', duration: '10 min' },
  { id: 's4', title: 'Go Live', description: 'Launch your optimized workflows and start seeing results.', duration: 'Instant' },
];

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How It Works' },
  subheadline: { type: 'string' as const, default: '' },
  process_summary_text: { type: 'string' as const, default: '' },
  steps: { type: 'array' as const, default: DEFAULT_STEPS }
};

// Generate unique ID for new steps
const generateStepId = (): string => `s${Date.now().toString(36)}`;

// Theme-based color mappings (non-card elements only)
const getThemeAccents = (theme: UIBlockTheme) => {
  return {
    warm: {
      stepGradients: [
        'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
        'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
        'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
      ],
      timelineLine: 'bg-gradient-to-b from-orange-300 to-orange-200',
      durationBg: 'bg-orange-100',
      durationText: 'text-orange-700',
      processSummaryBg: 'bg-gradient-to-r from-orange-50 via-amber-50 to-red-50',
      processSummaryBorder: 'border-orange-100',
      focusRing: 'focus:ring-orange-500'
    },
    cool: {
      stepGradients: [
        'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
      ],
      timelineLine: 'bg-gradient-to-b from-blue-300 to-blue-200',
      durationBg: 'bg-blue-100',
      durationText: 'text-blue-700',
      processSummaryBg: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50',
      processSummaryBorder: 'border-blue-100',
      focusRing: 'focus:ring-blue-500'
    },
    neutral: {
      stepGradients: [
        'linear-gradient(135deg, #64748B 0%, #475569 100%)',
        'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
        'linear-gradient(135deg, #71717A 0%, #52525B 100%)',
        'linear-gradient(135deg, #78716C 0%, #57534E 100%)',
        'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
        'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
      ],
      timelineLine: 'bg-gradient-to-b from-gray-300 to-gray-200',
      durationBg: 'bg-gray-100',
      durationText: 'text-gray-700',
      processSummaryBg: 'bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50',
      processSummaryBorder: 'border-gray-100',
      focusRing: 'focus:ring-gray-500'
    }
  }[theme];
};

// Timeline Step Card component
const TimelineStep = React.memo(({
  step,
  index,
  isLast,
  mode,
  themeAccents,
  cardStyles,
  onStepUpdate,
  onRemove,
  canRemove
}: {
  step: StepItem;
  index: number;
  isLast: boolean;
  mode: 'edit' | 'preview';
  themeAccents: ReturnType<typeof getThemeAccents>;
  cardStyles: CardStyles;
  onStepUpdate: (index: number, field: keyof StepItem, value: string) => void;
  onRemove?: () => void;
  canRemove: boolean;
}) => {
  const stepGradient = themeAccents.stepGradients[index % themeAccents.stepGradients.length];

  return (
    <div className="relative flex items-start">
      {/* Step Content */}
      <div className="flex items-start space-x-6 w-full">
        {/* Step Number */}
        <div className="flex-shrink-0 relative">
          <div
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10 relative"
            style={{ background: stepGradient }}
          >
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
        <div className="flex-1 pb-6 relative group">
          <div className={`${cardStyles.bg} ${cardStyles.blur} rounded-xl px-6 py-4 ${cardStyles.shadow} ${cardStyles.border} ${cardStyles.hoverEffect} transition-all duration-300`}>
            <div className="flex items-start justify-between">
              {/* Editable Step Title */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onStepUpdate(index, 'title', e.currentTarget.textContent || '')}
                  className={`text-xl font-bold ${cardStyles.textHeading} flex-1 outline-none ${themeAccents.focusRing} focus:ring-2 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[32px]`}
                  data-placeholder="Step title"
                >
                  {step.title}
                </div>
              ) : (
                <h3 className={`text-xl font-bold ${cardStyles.textHeading} flex-1`}>{step.title}</h3>
              )}

              {/* Editable Duration */}
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onStepUpdate(index, 'duration', e.currentTarget.textContent || '')}
                  className={`text-sm font-semibold ${themeAccents.durationText} ${themeAccents.durationBg} px-3 py-1 rounded-full ml-4 flex-shrink-0 outline-none ${themeAccents.focusRing} focus:ring-2 focus:ring-opacity-50 cursor-text min-w-[60px] text-center shadow-sm border border-current/10`}
                  data-placeholder="Duration"
                >
                  {step.duration || 'Duration'}
                </div>
              ) : (
                step.duration && (
                  <span className={`text-sm font-semibold ${themeAccents.durationText} ${themeAccents.durationBg} px-3 py-1 rounded-full ml-4 flex-shrink-0 shadow-sm border border-current/10`}>
                    {step.duration}
                  </span>
                )
              )}
            </div>

            {/* Editable Step Description */}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onStepUpdate(index, 'description', e.currentTarget.textContent || '')}
                className={`${cardStyles.textBody} leading-relaxed mt-2 outline-none ${themeAccents.focusRing} focus:ring-2 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[48px]`}
                data-placeholder="Step description"
              >
                {step.description}
              </div>
            ) : (
              <p className={`${cardStyles.textBody} text-base leading-relaxed mt-2`}>
                {step.description}
              </p>
            )}
          </div>

          {/* Remove Step Button - only in edit mode */}
          {mode === 'edit' && onRemove && canRemove && (
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
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<VerticalTimelineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeAccents = getThemeAccents(uiBlockTheme);

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiBlockTheme
    });
  }, [sectionBackground, uiBlockTheme]);

  // Get steps array (with fallback to default)
  const steps: StepItem[] = Array.isArray(blockContent.steps) && blockContent.steps.length > 0
    ? blockContent.steps
    : DEFAULT_STEPS;

  // Handle step field update
  const handleStepUpdate = (index: number, field: keyof StepItem, value: string) => {
    const updatedSteps = steps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    );
    (handleContentUpdate as any)('steps', updatedSteps);
  };

  // Handle adding a new step
  const handleAddStep = () => {
    const newStep: StepItem = {
      id: generateStepId(),
      title: 'New Step',
      description: 'Describe this step in your process.',
      duration: '5 min'
    };
    (handleContentUpdate as any)('steps', [...steps, newStep]);
  };

  // Handle removing a step
  const handleRemoveStep = (indexToRemove: number) => {
    const updatedSteps = steps.filter((_, i) => i !== indexToRemove);
    (handleContentUpdate as any)('steps', updatedSteps);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VerticalTimeline"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto mt-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className=""
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

        {/* Timeline Steps */}
        <div className="space-y-0 relative">
          {/* Continuous Timeline Line - runs behind all step circles */}
          {steps.length > 1 && (
            <div
              className={`absolute left-6 top-6 w-0.5 -translate-x-1/2 ${themeAccents.timelineLine}`}
              style={{ height: `calc(100% - 3rem)` }}
            />
          )}
          {steps.map((step, index) => (
            <TimelineStep
              key={step.id}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
              mode={mode}
              themeAccents={themeAccents}
              cardStyles={cardStyles}
              onStepUpdate={handleStepUpdate}
              onRemove={() => handleRemoveStep(index)}
              canRemove={steps.length > 3}
            />
          ))}

          {/* Add Step Button - only in edit mode and under max limit */}
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
                    onClick={handleAddStep}
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
        {(blockContent.process_summary_text || mode === 'edit') && (
          <div className={`mt-6 ${themeAccents.processSummaryBg} rounded-2xl px-8 py-2 border ${themeAccents.processSummaryBorder}`}>
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.process_summary_text || ''}
                onEdit={(value) => handleContentUpdate('process_summary_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-base font-semibold underline text-gray-900"
                placeholder="Add process summary (e.g., 'Total setup time: under 20 minutes')..."
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey="process_summary_text"
              />
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'VerticalTimeline',
  category: 'HowItWorks',
  description: 'Vertical timeline process layout with step-by-step progression.',
  tags: ['how-it-works', 'timeline', 'process', 'workflow', 'steps'],
  defaultBackgroundType: 'neutral' as const,

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'process_summary_text', label: 'Process Summary', type: 'text', required: false },
    { key: 'steps', label: 'Timeline Steps', type: 'array', required: true },
  ],

  features: [
    'Vertical timeline with connected steps',
    'Duration indicators for each step',
    'Process summary section',
    'Gradient step numbers with theme colors',
    'Add/remove steps in editor',
    'Warm/cool/neutral theme support'
  ],

  useCases: [
    'Onboarding flows',
    'Product setup guides',
    'Workflow processes',
    'Getting started tutorials'
  ]
};
