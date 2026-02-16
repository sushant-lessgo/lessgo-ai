import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, CardStyles } from '@/modules/Design/cardStyles';

interface ThreeStepHorizontalProps extends LayoutComponentProps {}

// Step item structure (V2 array format)
interface StepItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// Content interface for ThreeStepHorizontal layout (V2)
interface ThreeStepHorizontalContent {
  headline: string;
  subheadline?: string;
  conclusion_text?: string;
  steps: StepItem[];
}

// Default steps for new sections
const DEFAULT_STEPS: StepItem[] = [
  { id: 's1', title: 'Sign Up & Connect', description: 'Create your account and connect your existing tools in just a few clicks.' },
  { id: 's2', title: 'Customize Your Setup', description: 'Tailor the platform to your specific needs with our intuitive configuration wizard.' },
  { id: 's3', title: 'Get Results', description: 'Watch as your automated workflows start delivering results immediately.' }
];

// Content schema for ThreeStepHorizontal layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How It Works' },
  subheadline: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: '' },
  steps: { type: 'array' as const, default: DEFAULT_STEPS }
};

// Generate unique ID for new steps
const generateStepId = (): string => {
  return `s${Date.now().toString(36)}`;
};

// Step colors by theme
const getStepColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      stepCircle: 'bg-orange-600',
      stepCircleShadow: 'shadow-orange-300/40',
      stepCircleRing: 'ring-orange-100',
      stepIconFrom: 'from-orange-500',
      stepIconTo: 'to-orange-600',
      iconShadow: 'shadow-orange-200/50',
      connector: 'text-orange-400',
      connectorLine: 'bg-orange-200',
      subtleBackground: 'from-orange-50/30',
      addButtonBg: 'bg-orange-50',
      addButtonHover: 'hover:bg-orange-100',
      addButtonBorder: 'border-orange-200',
      addButtonBorderHover: 'hover:border-orange-300',
      addButtonText: 'text-orange-700',
      addButtonIcon: 'text-orange-600',
      focusRing: 'focus:ring-orange-500'
    },
    cool: {
      stepCircle: 'bg-blue-600',
      stepCircleShadow: 'shadow-blue-300/40',
      stepCircleRing: 'ring-blue-100',
      stepIconFrom: 'from-blue-500',
      stepIconTo: 'to-blue-600',
      iconShadow: 'shadow-blue-200/50',
      connector: 'text-blue-400',
      connectorLine: 'bg-blue-200',
      subtleBackground: 'from-blue-50/30',
      addButtonBg: 'bg-blue-50',
      addButtonHover: 'hover:bg-blue-100',
      addButtonBorder: 'border-blue-200',
      addButtonBorderHover: 'hover:border-blue-300',
      addButtonText: 'text-blue-700',
      addButtonIcon: 'text-blue-600',
      focusRing: 'focus:ring-blue-500'
    },
    neutral: {
      stepCircle: 'bg-slate-600',
      stepCircleShadow: 'shadow-slate-300/40',
      stepCircleRing: 'ring-slate-100',
      stepIconFrom: 'from-slate-500',
      stepIconTo: 'to-slate-600',
      iconShadow: 'shadow-slate-200/50',
      connector: 'text-slate-400',
      connectorLine: 'bg-slate-200',
      subtleBackground: 'from-slate-50/30',
      addButtonBg: 'bg-slate-50',
      addButtonHover: 'hover:bg-slate-100',
      addButtonBorder: 'border-slate-200',
      addButtonBorderHover: 'hover:border-slate-300',
      addButtonText: 'text-slate-700',
      addButtonIcon: 'text-slate-600',
      focusRing: 'focus:ring-slate-500'
    }
  }[theme];
};

// Individual Step Card
const StepCard = ({
  step,
  mode,
  sectionId,
  index,
  onStepUpdate,
  onRemoveStep,
  isLast = false,
  colorTokens,
  canRemove = true,
  stepColors,
  cardStyles
}: {
  step: StepItem;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onStepUpdate: (index: number, field: keyof StepItem, value: string) => void;
  onRemoveStep?: (index: number) => void;
  isLast?: boolean;
  colorTokens: any;
  canRemove?: boolean;
  stepColors: ReturnType<typeof getStepColors>;
  cardStyles: CardStyles;
}) => {
  return (
    <div className="relative flex-1 group flex flex-col">
      {/* Card with adaptive background and border */}
      <div className={`relative p-6 rounded-xl ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${cardStyles.shadow} flex-1`}>

        {/* Step Number Circle - Larger (64px) with ring and shadow */}
        <div className="relative mb-6 flex justify-center">
          <div className={`w-16 h-16 ${stepColors.stepCircle} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ${stepColors.stepCircleShadow} ring-4 ${stepColors.stepCircleRing}`}>
            {index + 1}
          </div>
        </div>

        {/* Step Title - Centered */}
        <div className="mb-4 text-center">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onStepUpdate(index, 'title', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 ${stepColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-white/10 font-semibold ${cardStyles.textHeading}`}
            >
              {step.title}
            </div>
          ) : (
            <h3 className={`font-semibold ${cardStyles.textHeading} mb-3`}>
              {step.title}
            </h3>
          )}
        </div>

        {/* Step Description - Left aligned for readability */}
        <div className="text-left">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onStepUpdate(index, 'description', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 ${stepColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-white/10 ${cardStyles.textBody} leading-relaxed`}
            >
              {step.description}
            </div>
          ) : (
            <p className={`${cardStyles.textBody} leading-relaxed`}>
              {step.description}
            </p>
          )}
        </div>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode !== 'preview' && onRemoveStep && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveStep(index);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this step"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
};

export default function ThreeStepHorizontal(props: ThreeStepHorizontalProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<ThreeStepHorizontalContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const stepColors = getStepColors(uiBlockTheme);

  // Adaptive card styles based on section background luminance
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
      description: 'Describe this step in your process.'
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
      sectionType="ThreeStepHorizontal"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType}
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
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
              placeholder="Add a subheadline..."
            />
          )}
        </div>

        {/* Steps Container - Horizontal layout */}
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 relative">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              mode={mode}
              sectionId={sectionId}
              index={index}
              onStepUpdate={handleStepUpdate}
              onRemoveStep={handleRemoveStep}
              isLast={index === steps.length - 1}
              colorTokens={colorTokens}
              canRemove={steps.length > 3}
              stepColors={stepColors}
              cardStyles={cardStyles}
            />
          ))}
        </div>

        {/* Add Step Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && steps.length < 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleAddStep}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${stepColors.addButtonBg} ${stepColors.addButtonHover} border-2 ${stepColors.addButtonBorder} ${stepColors.addButtonBorderHover} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${stepColors.addButtonIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${stepColors.addButtonText} font-medium`}>Add Step</span>
            </button>
          </div>
        )}

        {/* Optional Conclusion Text */}
        {(blockContent.conclusion_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.conclusion_text || ''}
              onEdit={(value) => handleContentUpdate('conclusion_text', value)}
              backgroundType={backgroundType}
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
  name: 'ThreeStepHorizontal',
  category: 'Process',
  description: 'Horizontal step-by-step process with adaptive text colors and connecting arrows',
  tags: ['steps', 'process', 'horizontal', 'workflow', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable step titles and descriptions',
    'Connecting arrows on desktop layout',
    'Responsive mobile stacking',
    'Contextual step icons with smart derivation',
    'Optional conclusion text'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    subheadline: 'Optional subheadline text',
    conclusion_text: 'Optional conclusion text to summarize the process',
    steps: 'Array of step objects with id, title, description, and optional icon'
  },
  examples: [
    'How it works process',
    'Getting started guide',
    'Implementation steps',
    'Onboarding flow'
  ]
};
