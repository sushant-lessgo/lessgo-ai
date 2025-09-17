// components/layout/CustomerJourneyFlow.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface CustomerJourneyFlowContent {
  headline: string;
  // Legacy pipe-separated format (for backwards compatibility)
  journey_stages?: string;
  stage_descriptions?: string;
  // Individual stage fields
  journey_stage_1?: string;
  journey_stage_2?: string;
  journey_stage_3?: string;
  journey_stage_4?: string;
  journey_stage_5?: string;
  journey_stage_6?: string;
  stage_description_1?: string;
  stage_description_2?: string;
  stage_description_3?: string;
  stage_description_4?: string;
  stage_description_5?: string;
  stage_description_6?: string;
  footer_title?: string;
  footer_description?: string;
  // Optional stage icons for journey visualization
  stage_icon_1?: string;
  stage_icon_2?: string;
  stage_icon_3?: string;
  stage_icon_4?: string;
  stage_icon_5?: string;
  stage_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Customer Journey Optimization' },
  // Individual stage fields with defaults
  journey_stage_1: { type: 'string' as const, default: 'Awareness' },
  journey_stage_2: { type: 'string' as const, default: 'Interest' },
  journey_stage_3: { type: 'string' as const, default: 'Consideration' },
  journey_stage_4: { type: 'string' as const, default: 'Purchase' },
  journey_stage_5: { type: 'string' as const, default: '' },
  journey_stage_6: { type: 'string' as const, default: '' },
  stage_description_1: { type: 'string' as const, default: 'Discover your brand and solutions' },
  stage_description_2: { type: 'string' as const, default: 'Learn about features and benefits' },
  stage_description_3: { type: 'string' as const, default: 'Compare options and evaluate fit' },
  stage_description_4: { type: 'string' as const, default: 'Make purchase decision' },
  stage_description_5: { type: 'string' as const, default: '' },
  stage_description_6: { type: 'string' as const, default: '' },
  footer_title: { type: 'string' as const, default: 'Optimize Every Touchpoint' },
  footer_description: { type: 'string' as const, default: 'Our platform helps you understand and improve each stage of the customer journey for maximum satisfaction and retention.' },
  // Optional stage icons for customer journey visualization
  stage_icon_1: { type: 'string' as const, default: '👀' }, // Awareness - eye
  stage_icon_2: { type: 'string' as const, default: '💫' }, // Interest - thought bubble
  stage_icon_3: { type: 'string' as const, default: '⚖️' }, // Consideration - scales
  stage_icon_4: { type: 'string' as const, default: '💳' }, // Purchase - credit card
  stage_icon_5: { type: 'string' as const, default: '🚀' }, // Onboarding - rocket
  stage_icon_6: { type: 'string' as const, default: '🤝' }  // Retention - handshake
};

// Journey stage structure
interface JourneyStage {
  title: string;
  description: string;
  icon: string;
  index: number;
}

export default function CustomerJourneyFlow(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<CustomerJourneyFlowContent>({ ...props, contentSchema: CONTENT_SCHEMA });

  // Helper function to get journey stages from individual fields or legacy format
  const getJourneyStages = (): JourneyStage[] => {
    const individualStages: JourneyStage[] = [];

    // Check for individual fields first
    for (let i = 1; i <= 6; i++) {
      const titleField = `journey_stage_${i}` as keyof CustomerJourneyFlowContent;
      const descField = `stage_description_${i}` as keyof CustomerJourneyFlowContent;
      const iconField = `stage_icon_${i}` as keyof CustomerJourneyFlowContent;

      const title = blockContent[titleField] as string;
      const description = blockContent[descField] as string;
      const icon = blockContent[iconField] as string;

      if (title && title.trim() !== '' && title !== '___REMOVED___') {
        individualStages.push({
          title: title.trim(),
          description: description?.trim() || 'Stage description',
          icon: icon || '',
          index: i - 1
        });
      }
    }

    // If we have individual stages, use them
    if (individualStages.length > 0) {
      return individualStages;
    }

    // Fallback to legacy pipe-separated format
    if (blockContent.journey_stages) {
      const stages = blockContent.journey_stages.split('|').map(s => s.trim()).filter(Boolean);
      const descriptions = blockContent.stage_descriptions?.split('|').map(d => d.trim()).filter(Boolean) || [];

      return stages.map((stage, index) => ({
        title: stage,
        description: descriptions[index] || 'Stage description',
        icon: blockContent[`stage_icon_${index + 1}` as keyof CustomerJourneyFlowContent] as string || '',
        index
      }));
    }

    return [];
  };

  const journeyStages = getJourneyStages();

  // Handle adding a new journey stage
  const handleAddStage = () => {
    // Find the first empty slot
    for (let i = 1; i <= 6; i++) {
      const titleField = `journey_stage_${i}` as keyof CustomerJourneyFlowContent;
      const currentValue = blockContent[titleField] as string;

      if (!currentValue || currentValue.trim() === '' || currentValue === '___REMOVED___') {
        handleContentUpdate(titleField, 'New Journey Stage');
        handleContentUpdate(`stage_description_${i}` as keyof CustomerJourneyFlowContent, 'Describe this stage of the customer journey');
        break;
      }
    }
  };

  // Handle removing a journey stage
  const handleRemoveStage = (stageNumber: number) => {
    handleContentUpdate(`journey_stage_${stageNumber}` as keyof CustomerJourneyFlowContent, '___REMOVED___');
    handleContentUpdate(`stage_description_${stageNumber}` as keyof CustomerJourneyFlowContent, '___REMOVED___');
    handleContentUpdate(`stage_icon_${stageNumber}` as keyof CustomerJourneyFlowContent, '___REMOVED___');
  };

  // Handle editing stage title
  const handleStageEdit = (stageNumber: number, value: string) => {
    handleContentUpdate(`journey_stage_${stageNumber}` as keyof CustomerJourneyFlowContent, value);
  };

  // Handle editing stage description
  const handleDescriptionEdit = (stageNumber: number, value: string) => {
    handleContentUpdate(`stage_description_${stageNumber}` as keyof CustomerJourneyFlowContent, value);
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="CustomerJourneyFlow" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 transform -translate-y-1/2"></div>
          <div className={`grid gap-8 ${journeyStages.length <= 3 ? 'lg:grid-cols-3' : journeyStages.length === 4 ? 'lg:grid-cols-4' : journeyStages.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6'}`}>
            {journeyStages.map((stage) => {
              const stageNumber = stage.index + 1;
              return (
                <div key={stage.index} className={`relative text-center group/journey-stage-${stage.index}`}>
                  <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex flex-col items-center justify-center text-white font-bold mx-auto mb-4 shadow-lg">
                    <div className="text-sm">{stageNumber}</div>
                    <IconEditableText
                      mode={mode}
                      value={stage.icon || ''}
                      onEdit={(value) => handleContentUpdate(`stage_icon_${stageNumber}` as keyof CustomerJourneyFlowContent, value)}
                      backgroundType="primary"
                      colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                      iconSize="sm"
                      className="text-lg text-white"
                      sectionId={sectionId}
                      elementKey={`stage_icon_${stageNumber}`}
                    />
                  </div>

                  {/* Editable stage title */}
                  {mode === 'edit' ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleStageEdit(stageNumber, e.currentTarget.textContent || '')}
                      className="font-bold text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 hover:bg-gray-50 cursor-text"
                    >
                      {stage.title}
                    </div>
                  ) : (
                    <h3 className="font-bold text-gray-900 mb-2">{stage.title}</h3>
                  )}

                  {/* Editable stage description */}
                  {mode === 'edit' ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleDescriptionEdit(stageNumber, e.currentTarget.textContent || '')}
                      className="text-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 hover:bg-gray-50 cursor-text min-h-[40px]"
                    >
                      {stage.description}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{stage.description}</p>
                  )}

                  {/* Delete button - only show in edit mode and if more than 2 stages */}
                  {mode === 'edit' && journeyStages.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStage(stageNumber);
                      }}
                      className={`opacity-0 group-hover/journey-stage-${stage.index}:opacity-100 absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 z-20`}
                      title="Remove this stage"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Stage Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && journeyStages.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddStage}
              className="inline-flex items-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Journey Stage</span>
            </button>
          </div>
        )}
        {(blockContent.footer_title || blockContent.footer_description || mode === 'edit') && (
          <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center border border-blue-200">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.footer_title || ''}
              onEdit={(value) => handleContentUpdate('footer_title', value)}
              level="h3"
              backgroundType="neutral"
              colorTokens={{ ...colorTokens, textPrimary: 'text-blue-900' }}
              className="font-bold text-blue-900 mb-4"
              sectionId={sectionId}
              elementKey="footer_title"
              sectionBackground="bg-blue-50"
            />
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.footer_description || ''}
              onEdit={(value) => handleContentUpdate('footer_description', value)}
              backgroundType="neutral"
              colorTokens={{ ...colorTokens, textPrimary: 'text-blue-700' }}
              variant="body"
              className="text-blue-700"
              placeholder="Add footer description..."
              sectionId={sectionId}
              elementKey="footer_description"
              sectionBackground="bg-blue-50"
            />
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'CustomerJourneyFlow', category: 'Use Case', description: 'Customer journey visualization and optimization', defaultBackgroundType: 'primary' as const };