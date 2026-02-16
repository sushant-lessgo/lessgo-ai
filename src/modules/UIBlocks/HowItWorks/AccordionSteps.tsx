import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { cardEnhancements } from '@/modules/Design/designTokens';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import { isHexColor } from '@/utils/colorUtils';

// Step item structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  details: string;
}

interface AccordionStepsContent {
  headline: string;
  subheadline?: string;
  conclusion_text?: string;
  steps: StepItem[];
}

// Default steps for new sections
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'API Integration & Setup', description: 'Seamlessly integrate with your existing systems using our comprehensive API documentation and SDKs.', details: 'Our API supports RESTful endpoints, GraphQL, and real-time webhooks. Authentication uses OAuth 2.0 with optional SAML integration.' },
  { id: 's2', title: 'Data Migration & Validation', description: 'Migrate your data securely with automated validation and rollback capabilities.', details: 'Data migration includes schema mapping, incremental sync, and conflict resolution. All transfers use AES-256 encryption.' },
  { id: 's3', title: 'Custom Configuration', description: 'Configure custom workflows, permissions, and business rules to match your requirements.', details: 'Custom configuration includes role-based access control, workflow automation rules, and integration mappings.' },
  { id: 's4', title: 'Testing & Deployment', description: 'Run comprehensive testing and deploy to production with zero downtime.', details: 'Deployment uses blue-green deployment with automatic rollback on failure. We provide monitoring for all critical metrics.' }
];

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Technical Implementation Process' },
  subheadline: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: '' },
  steps: { type: 'array' as const, default: DEFAULT_STEPS }
};

// Generate unique ID for new steps
const generateStepId = (): string => {
  return `s${Date.now().toString(36)}`;
};

export default function AccordionSteps(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<AccordionStepsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme
    });
  }, [sectionBackground, theme]);

  // Accordion-specific theme accents (not part of card styling)
  const getAccordionAccents = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        contentBorder: 'border-orange-100',
        detailsBg: 'bg-orange-50',
        detailsBorder: 'border-l-4 border-orange-500',
        focusRing: 'focus:ring-orange-500',
        stepIndicator: 'bg-orange-500',
        stepIndicatorOpen: 'bg-white/20'
      },
      cool: {
        contentBorder: 'border-blue-100',
        detailsBg: 'bg-blue-50',
        detailsBorder: 'border-l-4 border-blue-500',
        focusRing: 'focus:ring-blue-500',
        stepIndicator: 'bg-blue-500',
        stepIndicatorOpen: 'bg-white/20'
      },
      neutral: {
        contentBorder: 'border-amber-100',
        detailsBg: 'bg-amber-50',
        detailsBorder: 'border-l-4 border-amber-500',
        focusRing: 'focus:ring-amber-500',
        stepIndicator: 'bg-slate-500',
        stepIndicatorOpen: 'bg-white/20'
      }
    };
    return colorMap[theme];
  };

  const accordionAccents = getAccordionAccents(theme);

  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

  // Get steps array (with fallback to default)
  const steps: StepItem[] = Array.isArray(blockContent.steps) && blockContent.steps.length > 0
    ? blockContent.steps
    : DEFAULT_STEPS;

  const [openStep, setOpenStep] = useState<number | null>(0);


  const toggleStep = (index: number) => {
    setOpenStep(openStep === index ? null : index);
  };

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
      details: 'Add technical details for this step.'
    };
    (handleContentUpdate as any)('steps', [...steps, newStep]);
    setOpenStep(steps.length); // Open the newly added step
  };

  // Handle removing a step
  const handleRemoveStep = (indexToRemove: number) => {
    const updatedSteps = steps.filter((_, i) => i !== indexToRemove);
    (handleContentUpdate as any)('steps', updatedSteps);
    // Reset open step if we're removing the currently open one
    if (openStep === indexToRemove) {
      setOpenStep(null);
    } else if (openStep !== null && openStep > indexToRemove) {
      setOpenStep(openStep - 1);
    }
  };

  const AccordionStep = ({ step, index, isOpen, onToggle, onStepUpdate, mode, colorTokens, onRemove, cardStyles, accordionAccents, canRemove }: {
    step: StepItem;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onStepUpdate: (index: number, field: keyof StepItem, value: string) => void;
    mode: 'edit' | 'preview';
    colorTokens: any;
    onRemove?: () => void;
    cardStyles: CardStyles;
    accordionAccents: ReturnType<typeof getAccordionAccents>;
    canRemove: boolean;
  }) => (
    <div className={`relative ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} rounded-lg overflow-hidden ${cardEnhancements.transition} ${isOpen ? 'shadow-lg' : ''} ${cardStyles.shadow} ${cardStyles.hoverEffect} group`}>
      <button
        onClick={onToggle}
        className={`w-full p-6 text-left transition-all duration-300 ${
          isOpen && mode === 'preview'
            ? `${isHexColor(colorTokens.ctaBg) ? '' : colorTokens.ctaBg} text-white`
            : `${cardStyles.textHeading}`
        }`}
        style={isOpen && mode === 'preview' && isHexColor(colorTokens.ctaBg) ? { backgroundColor: colorTokens.ctaBg } : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`${isOpen ? 'w-10 h-10 ring-4 ring-white/30' : 'w-8 h-8'} rounded-full flex items-center justify-center font-bold text-sm ${
              isOpen && mode === 'preview'
                ? accordionAccents.stepIndicatorOpen
                : accordionAccents.stepIndicator
            } text-white transition-all duration-200`}>
              {index + 1}
            </div>
            <div className="flex-1">
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => onStepUpdate(index, 'title', e.currentTarget.textContent || '')}
                  className={`text-lg font-semibold outline-none focus:ring-2 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[32px] ${cardStyles.textHeading} ${accordionAccents.focusRing}`}
                  data-placeholder="Step title"
                >
                  {step.title}
                </div>
              ) : (
                <h3 style={h3Style} className={`text-lg font-semibold ${cardStyles.textHeading}`}>{step.title}</h3>
              )}
              {!isOpen && (
                <p className={`text-sm mt-1 ${isOpen ? 'text-white/80' : cardStyles.textMuted}`}>
                  {step.description.substring(0, 80)}...
                </p>
              )}
            </div>
          </div>

          <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${cardStyles.textMuted}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className={`p-6 border-t ${accordionAccents.contentBorder}`}>
          <div className="space-y-4">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onStepUpdate(index, 'description', e.currentTarget.textContent || '')}
                className={`${cardStyles.textBody} leading-relaxed text-lg outline-none focus:ring-2 ${accordionAccents.focusRing} focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[48px]`}
                data-placeholder="Step description"
              >
                {step.description}
              </div>
            ) : (
              <p className={`${cardStyles.textBody} leading-relaxed text-lg`}>
                {step.description}
              </p>
            )}

            {(step.details || mode === 'edit') && (
              <div className={`mt-2 rounded-lg p-4 ${accordionAccents.detailsBg} ${accordionAccents.detailsBorder}`}>

                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onStepUpdate(index, 'details', e.currentTarget.textContent || '')}
                    className={`${cardStyles.textMuted} text-sm leading-relaxed outline-none focus:ring-2 ${accordionAccents.focusRing} focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[48px]`}
                    data-placeholder="Technical details for this step"
                  >
                    {step.details}
                  </div>
                ) : (
                  step.details && (
                    <p className={`${cardStyles.textMuted} text-sm leading-relaxed`}>
                      {step.details}
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Step Button - only in edit mode */}
      {mode === 'edit' && onRemove && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1.5 shadow-md"
          title="Remove this step"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AccordionSteps"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
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
              placeholder="Add optional subheadline to introduce your technical implementation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Accordion Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <AccordionStep
              key={step.id}
              step={step}
              index={index}
              isOpen={openStep === index}
              onToggle={() => toggleStep(index)}
              onStepUpdate={handleStepUpdate}
              mode={mode}
              colorTokens={colorTokens}
              cardStyles={cardStyles}
              accordionAccents={accordionAccents}
              onRemove={() => handleRemoveStep(index)}
              canRemove={steps.length > 3}
            />
          ))}

          {/* Add Step Button - only in edit mode */}
          {mode === 'edit' && steps.length < 6 && (
            <div className="flex items-center justify-center">
              <button
                onClick={handleAddStep}
                className={`w-full max-w-lg p-4 border-2 border-dashed ${cardStyles.border} ${cardStyles.textMuted} transition-all duration-300 flex items-center justify-center ${cardStyles.bg} rounded-lg`}
                title="Add new accordion step"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add New Step</span>
              </button>
            </div>
          )}
        </div>

        {/* Optional Conclusion Text */}
        {(blockContent.conclusion_text || mode === 'edit') && (
          <div className="mt-12 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.conclusion_text || ''}
              onEdit={(value) => handleContentUpdate('conclusion_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-2xl mx-auto"
              placeholder="Add optional conclusion text to summarize the process..."
              sectionId={sectionId}
              elementKey="conclusion_text"
              sectionBackground={sectionBackground}
            />
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'AccordionSteps',
  category: 'HowItWorks',
  description: 'Detailed accordion steps for complex technical processes. Perfect for builder/enterprise audiences.',
  tags: ['how-it-works', 'accordion', 'technical', 'detailed', 'enterprise'],
  defaultBackgroundType: 'neutral' as const,

  contentSchema: {
    headline: 'Main heading text',
    subheadline: 'Optional subheadline text',
    conclusion_text: 'Optional conclusion text to summarize the process',
    steps: 'Array of step objects with id, title, description, and details'
  },

  features: [
    'Interactive accordion interface',
    'Detailed technical explanations',
    'Enterprise-grade presentation',
    'Perfect for complex products',
    'Builder/developer focused'
  ],

  useCases: [
    'Technical product implementations',
    'API and integration explanations',
    'Enterprise software processes',
    'Developer tool workflows',
    'Complex system architectures'
  ]
};