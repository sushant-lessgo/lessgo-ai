// components/layout/ProcessFlowDiagram.tsx
// Production-ready visual process flow using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface ProcessFlowDiagramContent {
  headline: string;
  subheadline?: string;
  process_steps: string;
  step_descriptions: string;
  benefits_title?: string;
  benefit_titles?: string;
  benefit_descriptions?: string;
  // Benefit icons
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  benefit_icon_3?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'How Our Unique Process Works' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our proprietary methodology combines AI, automation, and human expertise for superior results.' 
  },
  process_steps: { 
    type: 'string' as const, 
    default: 'Data Ingestion|AI Analysis|Pattern Recognition|Automated Processing|Quality Validation|Results Delivery' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Secure data collection from multiple sources with real-time validation|Advanced machine learning algorithms analyze patterns and trends|Proprietary AI identifies unique insights and opportunities|Automated workflows execute optimized processes|Human experts validate results for accuracy and quality|Actionable insights delivered through intuitive dashboards' 
  },
  benefits_title: { 
    type: 'string' as const, 
    default: 'Why Our Process is Different' 
  },
  benefit_titles: { 
    type: 'string' as const, 
    default: '10x Faster|99% Accurate|Fully Customizable' 
  },
  benefit_descriptions: { 
    type: 'string' as const, 
    default: 'Automated processing reduces time from days to hours|AI-powered validation ensures exceptional precision|Adapts to your unique business requirements' 
  },
  // Benefit icons
  benefit_icon_1: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  benefit_icon_2: { 
    type: 'string' as const, 
    default: '🎯' 
  },
  benefit_icon_3: { 
    type: 'string' as const, 
    default: '🔧' 
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
  const steps = blockContent.process_steps.split('|').map(s => s.trim()).filter(Boolean);
  const descriptions = blockContent.step_descriptions.split('|').map(d => d.trim()).filter(Boolean);

  // Helper function to get appropriate grid class based on step count
  const getGridCols = (stepCount: number) => {
    switch (stepCount) {
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      case 5: return 'lg:grid-cols-5';
      case 6: return 'lg:grid-cols-6';
      default: return 'lg:grid-cols-6';
    }
  };

  // Handle step deletion
  const handleDeleteStep = (index: number) => {
    if (steps.length <= 2) return; // Minimum 2 steps required
    
    const updatedSteps = [...steps];
    const updatedDescriptions = [...descriptions];
    
    updatedSteps.splice(index, 1);
    updatedDescriptions.splice(index, 1);
    
    handleContentUpdate('process_steps', updatedSteps.join('|'));
    handleContentUpdate('step_descriptions', updatedDescriptions.join('|'));
  };

  // Handle adding new step
  const handleAddStep = () => {
    if (steps.length >= 6) return; // Maximum 6 steps
    
    const updatedSteps = [...steps, 'New Step'];
    const updatedDescriptions = [...descriptions, 'Describe this step'];
    
    handleContentUpdate('process_steps', updatedSteps.join('|'));
    handleContentUpdate('step_descriptions', updatedDescriptions.join('|'));
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
            className="mb-6"
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
              className="text-lg"
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
              <div key={index} className={`relative group/process-step-${index}`}>
                {/* Step Circle */}
                <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg">
                  {index + 1}
                </div>

                {/* Delete Button */}
                {mode === 'edit' && steps.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(index);
                    }}
                    className={`opacity-0 group-hover/process-step-${index}:opacity-100 absolute top-2 right-2 z-20 text-red-500 hover:text-red-700 transition-opacity duration-200`}
                    title={`Remove step ${index + 1}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Step Content */}
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={step || ''}
                    onEdit={(value) => {
                      const updatedSteps = [...steps];
                      updatedSteps[index] = value;
                      handleContentUpdate('process_steps', updatedSteps.join('|'));
                    }}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-base font-bold mb-3"
                    formatState={{ bold: true, fontSize: '18px', textAlign: 'center' } as any}
                    placeholder={`Step ${index + 1} Name`}
                    sectionId={sectionId}
                    elementKey={`process_step_${index + 1}`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`process_step_${index + 1}`}
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={descriptions[index] || ''}
                    onEdit={(value) => {
                      const updatedDescriptions = [...descriptions];
                      updatedDescriptions[index] = value;
                      handleContentUpdate('step_descriptions', updatedDescriptions.join('|'));
                    }}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm"
                    formatState={{ fontSize: '14px', textAlign: 'center' } as any}
                    placeholder={`Step ${index + 1} description`}
                    sectionId={sectionId}
                    elementKey={`step_description_${index + 1}`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`step_description_${index + 1}`}
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Step</span>
            </button>
          </div>
        )}

        {/* Key Benefits */}
        {(blockContent.benefits_title || blockContent.benefit_titles || mode === 'edit') && (
          <div className="mt-16 bg-blue-50 rounded-2xl p-8 border border-blue-200">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.benefits_title || ''}
              onEdit={(value) => handleContentUpdate('benefits_title', value)}
              level="h3"
              backgroundType="neutral"
              colorTokens={{ ...colorTokens, textPrimary: 'text-blue-900' }}
              className="text-center font-bold text-blue-900 mb-6"
              sectionId={sectionId}
              elementKey="benefits_title"
              sectionBackground="bg-blue-50"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {blockContent.benefit_titles && blockContent.benefit_titles.split('|').map((title, index) => {
                const descriptions = blockContent.benefit_descriptions ? blockContent.benefit_descriptions.split('|') : [];
                const iconFields = [
                  blockContent.benefit_icon_1,
                  blockContent.benefit_icon_2,
                  blockContent.benefit_icon_3
                ];
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <IconEditableText
                        mode={mode}
                        value={iconFields[index] || '✨'}
                        onEdit={(value) => handleContentUpdate(`benefit_icon_${index + 1}` as keyof ProcessFlowDiagramContent, value)}
                        backgroundType="primary"
                        colorTokens={colorTokens}
                        iconSize="lg"
                        className="text-white text-2xl"
                        placeholder="✨"
                        sectionId={sectionId}
                        elementKey={`benefit_icon_${index + 1}`}
                      />
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={title.trim() || ''}
                      onEdit={(value) => {
                        const benefitTitles = blockContent.benefit_titles ? blockContent.benefit_titles.split('|') : [];
                        const updatedTitles = [...benefitTitles];
                        updatedTitles[index] = value;
                        handleContentUpdate('benefit_titles', updatedTitles.join('|'));
                      }}
                      backgroundType="neutral"
                      colorTokens={{ ...colorTokens, textPrimary: 'text-blue-900' }}
                      variant="body"
                      className="font-semibold mb-2"
                      formatState={{ textAlign: 'center' } as any}
                      placeholder={`Benefit ${index + 1} title`}
                      sectionId={sectionId}
                      elementKey={`benefit_title_${index + 1}`}
                      sectionBackground="bg-blue-50"
                      data-section-id={sectionId}
                      data-element-key={`benefit_title_${index + 1}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={descriptions[index]?.trim() || ''}
                      onEdit={(value) => {
                        const benefitDescriptions = blockContent.benefit_descriptions ? blockContent.benefit_descriptions.split('|') : [];
                        const updatedDescriptions = [...benefitDescriptions];
                        updatedDescriptions[index] = value;
                        handleContentUpdate('benefit_descriptions', updatedDescriptions.join('|'));
                      }}
                      backgroundType="neutral"
                      colorTokens={{ ...colorTokens, textSecondary: 'text-blue-700' }}
                      variant="body"
                      className="text-sm"
                      formatState={{ textAlign: 'center' } as any}
                      placeholder={`Benefit ${index + 1} description`}
                      sectionId={sectionId}
                      elementKey={`benefit_description_${index + 1}`}
                      sectionBackground="bg-blue-50"
                      data-section-id={sectionId}
                      data-element-key={`benefit_description_${index + 1}`}
                    />
                  </div>
                );
              })}
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