// components/layout/ProcessFlowDiagram.tsx
// V2 Schema: Uses steps[] and benefits[] arrays instead of pipe-separated strings

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface ProcessFlowDiagramContent {
  headline: string;
  subheadline?: string;
  benefits_title?: string;
  steps: Step[];
  benefits?: Benefit[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'How Our Unique Process Works'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Our proprietary methodology delivers results in simple steps.'
  },
  benefits_title: {
    type: 'string' as const,
    default: 'Why This Process Works'
  },
  steps: {
    type: 'array' as const,
    default: [
      { id: 's1', title: 'Data Ingestion', description: 'Secure data collection from multiple sources.' },
      { id: 's2', title: 'AI Analysis', description: 'Advanced algorithms analyze patterns and trends.' },
      { id: 's3', title: 'Results Delivery', description: 'Actionable insights via intuitive dashboards.' },
    ]
  },
  benefits: {
    type: 'array' as const,
    default: [
      { id: 'b1', title: '10x Faster', description: 'Automated processing reduces time.' },
      { id: 'b2', title: '99% Accurate', description: 'AI-powered validation ensures precision.' },
      { id: 'b3', title: 'Fully Customizable', description: 'Adapts to your requirements.' },
    ]
  }
};

export default function ProcessFlowDiagram(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ProcessFlowDiagramContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();

  // Ensure steps is always an array
  const steps: Step[] = Array.isArray(blockContent.steps) ? blockContent.steps : CONTENT_SCHEMA.steps.default;
  const benefits: Benefit[] = Array.isArray(blockContent.benefits) ? blockContent.benefits : [];

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping (flat design)
  const getProcessColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        circleBg: 'bg-orange-500',
        benefitsBg: 'bg-orange-50',
        benefitsBorder: 'border-orange-200',
        benefitsTextPrimary: 'text-orange-900',
        benefitsTextSecondary: 'text-orange-700',
        benefitIconBg: 'bg-orange-500',
        addButtonBg: 'bg-orange-600',
        addButtonHover: 'hover:bg-orange-700',
        connectorColor: 'border-orange-300'
      },
      cool: {
        circleBg: 'bg-blue-600',
        benefitsBg: 'bg-blue-50',
        benefitsBorder: 'border-blue-200',
        benefitsTextPrimary: 'text-blue-900',
        benefitsTextSecondary: 'text-blue-700',
        benefitIconBg: 'bg-blue-600',
        addButtonBg: 'bg-blue-600',
        addButtonHover: 'hover:bg-blue-700',
        connectorColor: 'border-blue-300'
      },
      neutral: {
        circleBg: 'bg-gray-600',
        benefitsBg: 'bg-gray-50',
        benefitsBorder: 'border-gray-200',
        benefitsTextPrimary: 'text-gray-900',
        benefitsTextSecondary: 'text-gray-700',
        benefitIconBg: 'bg-gray-600',
        addButtonBg: 'bg-gray-600',
        addButtonHover: 'hover:bg-gray-700',
        connectorColor: 'border-slate-300'
      }
    }[theme];
  };

  const processColors = getProcessColors(uiTheme);

  // Helper function to get appropriate grid class based on step count
  const getGridCols = (stepCount: number) => {
    switch (stepCount) {
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      case 5: return 'lg:grid-cols-5';
      case 6: return 'lg:grid-cols-6';
      default: return 'lg:grid-cols-3';
    }
  };

  // Handle step deletion
  const handleDeleteStep = (stepId: string) => {
    if (steps.length <= 2) return; // Enforce minimum
    const updated = steps.filter(s => s.id !== stepId);
    (handleContentUpdate as any)('steps', updated);
  };

  // Handle adding new step
  const handleAddStep = () => {
    if (steps.length >= 6) return; // Enforce maximum
    const newStep: Step = {
      id: `s${Date.now()}`,
      title: 'New Step',
      description: 'Describe this step'
    };
    (handleContentUpdate as any)('steps', [...steps, newStep]);
  };

  // Handle step field update
  const handleStepUpdate = (stepId: string, field: keyof Step, value: string) => {
    const updated = steps.map(s =>
      s.id === stepId ? { ...s, [field]: value } : s
    );
    (handleContentUpdate as any)('steps', updated);
  };

  // Handle benefit field update
  const handleBenefitUpdate = (benefitId: string, field: keyof Benefit, value: string) => {
    const updated = benefits.map(b =>
      b.id === benefitId ? { ...b, [field]: value } : b
    );
    (handleContentUpdate as any)('benefits', updated);
  };

  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ProcessFlowDiagram"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-6 mt-16 text-center font-extrabold"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg text-center"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="relative">
          {/* Process Flow */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols(steps.length)} gap-12`}>

            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`
                  relative group
                  flex flex-col items-center
                  px-4 pt-10 pb-6
                  rounded-3xl
                  bg-white/80
                  ring-1 ring-slate-200
                  ${shadows.card[uiTheme]}
                  ${shadows.cardHover[uiTheme]}
                  backdrop-blur-xl
                  ${cardEnhancements.transition}
                  ${cardEnhancements.hoverLift}
                `}
              >
                {/* Connector line to next step */}
                {index < steps.length - 1 && (
                  <div className={`hidden lg:block absolute top-1/2 -right-6 w-12 border-t-2 border-dashed ${processColors.connectorColor}`} />
                )}

                {/* Step Circle - Flat design */}
                <div className="relative mb-5">
                  <div
                    className={`
                      relative z-10 w-20 h-20
                      rounded-full flex items-center justify-center
                      text-white font-semibold text-xl
                      ${processColors.circleBg}
                      shadow-md
                    `}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Delete Button */}
                {mode === 'edit' && steps.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                    className={`
                      opacity-0
                      group-hover:opacity-100
                      absolute top-3 right-3 z-20
                      text-red-500 hover:text-red-700
                      transition-opacity duration-200
                    `}
                    title={`Remove step ${index + 1}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Step Content */}
                <div className="text-center max-w-xs mx-auto">
                  <EditableAdaptiveText
                    mode={mode}
                    value={step.title || ''}
                    onEdit={(value) => handleStepUpdate(step.id, 'title', value)}
                    backgroundType={
                      props.backgroundType === 'custom'
                        ? 'secondary'
                        : (props.backgroundType || 'neutral')
                    }
                    colorTokens={colorTokens}
                    variant="body"
                    className="mb-2 text-[17px] font-semibold leading-snug tracking-tight text-slate-900"
                    formatState={{
                      bold: true,
                      fontSize: '17px',
                      textAlign: 'center',
                    } as any}
                    placeholder={`Step ${index + 1} Name`}
                    sectionId={sectionId}
                    elementKey={`step_title_${step.id}`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`step_title_${step.id}`}
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={step.description || ''}
                    onEdit={(value) => handleStepUpdate(step.id, 'description', value)}
                    backgroundType={
                      props.backgroundType === 'custom'
                        ? 'secondary'
                        : (props.backgroundType || 'neutral')
                    }
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-[14px] leading-relaxed text-slate-600"
                    formatState={{
                      fontSize: '14px',
                      textAlign: 'center',
                    } as any}
                    placeholder={`Step ${index + 1} description`}
                    sectionId={sectionId}
                    elementKey={`step_description_${step.id}`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`step_description_${step.id}`}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Add Step Button */}
        {mode === 'edit' && steps.length < 6 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleAddStep}
              className={`flex items-center space-x-2 px-4 py-2 ${processColors.addButtonBg} text-white rounded-lg ${processColors.addButtonHover} transition-colors duration-200`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Step</span>
            </button>
          </div>
        )}

        {/* Key Benefits */}
        {(blockContent.benefits_title || benefits.length > 0 || mode === 'edit') && (
          <div className={`mt-16 ${processColors.benefitsBg} rounded-2xl p-8 border ${processColors.benefitsBorder}`}>
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.benefits_title || ''}
              onEdit={(value) => handleContentUpdate('benefits_title', value)}
              level="h3"
              backgroundType="neutral"
              colorTokens={{ ...colorTokens, textPrimary: processColors.benefitsTextPrimary }}
              className={`text-center font-bold ${processColors.benefitsTextPrimary} mb-6`}
              sectionId={sectionId}
              elementKey="benefits_title"
              sectionBackground={processColors.benefitsBg}
            />
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                  <div key={benefit.id} className="text-center">
                    <div className={`w-14 h-14 rounded-xl
                        flex items-center justify-center mx-auto mb-4
                        ${processColors.benefitIconBg}
                        shadow-md
                        text-white`}>
                      <IconEditableText
                        mode={mode}
                        value={benefit.icon || ''}
                        onEdit={(value) => handleBenefitUpdate(benefit.id, 'icon', value)}
                        backgroundType="primary"
                        colorTokens={colorTokens}
                        iconSize="lg"
                        className="text-white text-2xl"
                        placeholder="✨"
                        sectionId={sectionId}
                        elementKey={`benefit_icon_${benefit.id}`}
                      />
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={benefit.title || ''}
                      onEdit={(value) => handleBenefitUpdate(benefit.id, 'title', value)}
                      backgroundType="neutral"
                      colorTokens={{ ...colorTokens, textPrimary: processColors.benefitsTextPrimary }}
                      variant="body"
                      className="font-semibold mb-2"
                      formatState={{ textAlign: 'center' } as any}
                      placeholder={`Benefit ${index + 1} title`}
                      sectionId={sectionId}
                      elementKey={`benefit_title_${benefit.id}`}
                      sectionBackground={processColors.benefitsBg}
                      data-section-id={sectionId}
                      data-element-key={`benefit_title_${benefit.id}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={benefit.description || ''}
                      onEdit={(value) => handleBenefitUpdate(benefit.id, 'description', value)}
                      backgroundType="neutral"
                      colorTokens={{ ...colorTokens, textSecondary: processColors.benefitsTextSecondary }}
                      variant="body"
                      className="text-sm"
                      formatState={{ textAlign: 'center' } as any}
                      placeholder={`Benefit ${index + 1} description`}
                      sectionId={sectionId}
                      elementKey={`benefit_description_${benefit.id}`}
                      sectionBackground={processColors.benefitsBg}
                      data-section-id={sectionId}
                      data-element-key={`benefit_description_${benefit.id}`}
                    />
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ProcessFlowDiagram',
  category: 'Unique Mechanism',
  description: 'Visual process flow diagram showing unique methodology',
  tags: ['process', 'flow', 'methodology', 'unique', 'visual'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes'
};
