// components/layout/WorkflowDiagrams.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface WorkflowDiagramsContent {
  headline: string;
  workflow_steps: string;
  // Optional step icons
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  step_icon_5?: string;
  step_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Streamlined Workflow Process' },
  workflow_steps: { type: 'string' as const, default: 'Input|Process|Analyze|Optimize|Output|Monitor' },
  // Optional step icons - workflow-focused defaults
  step_icon_1: { type: 'string' as const, default: '📝' }, // Input - memo
  step_icon_2: { type: 'string' as const, default: '⚙️' }, // Process - gear
  step_icon_3: { type: 'string' as const, default: '🔍' }, // Analyze - magnifying glass
  step_icon_4: { type: 'string' as const, default: '🚀' }, // Optimize - rocket
  step_icon_5: { type: 'string' as const, default: '📤' }, // Output - outbox
  step_icon_6: { type: 'string' as const, default: '📊' }  // Monitor - chart
};

export default function WorkflowDiagrams(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<WorkflowDiagramsContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const steps = blockContent.workflow_steps.split('|').map(s => s.trim()).filter(Boolean);

  // Get step icon from content fields by index
  const getStepIcon = (index: number) => {
    const iconFields = [
      blockContent.step_icon_1,
      blockContent.step_icon_2,
      blockContent.step_icon_3,
      blockContent.step_icon_4,
      blockContent.step_icon_5,
      blockContent.step_icon_6
    ];
    return iconFields[index];
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="WorkflowDiagrams" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="flex flex-wrap justify-center items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold flex items-center space-x-2">
                {getStepIcon(index) && (
                  <IconEditableText
                    mode={mode}
                    value={getStepIcon(index) || ''}
                    onEdit={(value) => handleContentUpdate(`step_icon_${index + 1}` as keyof WorkflowDiagramsContent, value)}
                    backgroundType="primary"
                    colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                    iconSize="sm"
                    className="text-lg text-white"
                    sectionId={sectionId}
                    elementKey={`step_icon_${index + 1}`}
                  />
                )}
                <span>{step}</span>
              </div>
              {index < steps.length - 1 && <div className="text-blue-600 text-2xl">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'WorkflowDiagrams', category: 'Use Case', description: 'Process workflow diagrams', defaultBackgroundType: 'neutral' as const };