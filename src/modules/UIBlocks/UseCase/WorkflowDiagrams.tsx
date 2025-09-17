// components/layout/WorkflowDiagrams.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface WorkflowDiagramsContent {
  headline: string;
  workflow_steps: string; // Legacy support
  // Individual workflow steps
  workflow_step_1?: string;
  workflow_step_2?: string;
  workflow_step_3?: string;
  workflow_step_4?: string;
  workflow_step_5?: string;
  workflow_step_6?: string;
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
  workflow_steps: { type: 'string' as const, default: '' }, // Legacy support
  // Individual workflow steps
  workflow_step_1: { type: 'string' as const, default: 'Input' },
  workflow_step_2: { type: 'string' as const, default: 'Process' },
  workflow_step_3: { type: 'string' as const, default: 'Analyze' },
  workflow_step_4: { type: 'string' as const, default: 'Optimize' },
  workflow_step_5: { type: 'string' as const, default: '' },
  workflow_step_6: { type: 'string' as const, default: '' },
  // Optional step icons - workflow-focused defaults
  step_icon_1: { type: 'string' as const, default: '📝' }, // Input - memo
  step_icon_2: { type: 'string' as const, default: '⚙️' }, // Process - gear
  step_icon_3: { type: 'string' as const, default: '🔍' }, // Analyze - magnifying glass
  step_icon_4: { type: 'string' as const, default: '🚀' }, // Optimize - rocket
  step_icon_5: { type: 'string' as const, default: '📤' }, // Output - outbox
  step_icon_6: { type: 'string' as const, default: '📊' }  // Monitor - chart
};

// Helper function to get workflow steps
const getWorkflowSteps = (blockContent: WorkflowDiagramsContent): string[] => {
  // Check for individual step fields first
  const individualSteps = [
    blockContent.workflow_step_1,
    blockContent.workflow_step_2,
    blockContent.workflow_step_3,
    blockContent.workflow_step_4,
    blockContent.workflow_step_5,
    blockContent.workflow_step_6
  ].filter((step): step is string => Boolean(step && step.trim() !== '' && step !== '___REMOVED___'));

  // If we have individual steps, use them
  if (individualSteps.length > 0) {
    return individualSteps;
  }

  // Fallback to legacy pipe-separated format
  if (blockContent.workflow_steps && blockContent.workflow_steps.trim() !== '') {
    return blockContent.workflow_steps.split('|').map(s => s.trim()).filter(Boolean);
  }

  // Default if no steps
  return ['Input', 'Process', 'Analyze', 'Optimize'];
};

// Helper function to add a workflow step
const addWorkflowStep = (blockContent: WorkflowDiagramsContent, handleContentUpdate: (key: string, value: string) => void) => {
  const stepFields = [
    blockContent.workflow_step_1,
    blockContent.workflow_step_2,
    blockContent.workflow_step_3,
    blockContent.workflow_step_4,
    blockContent.workflow_step_5,
    blockContent.workflow_step_6
  ];

  // Find the first empty slot
  const emptyIndex = stepFields.findIndex(step => !step || step.trim() === '' || step === '___REMOVED___');

  if (emptyIndex !== -1) {
    const fieldKey = `workflow_step_${emptyIndex + 1}` as keyof WorkflowDiagramsContent;
    handleContentUpdate(fieldKey, 'New Step');
  }
};

// Helper function to remove a workflow step
const removeWorkflowStep = (index: number, handleContentUpdate: (key: string, value: string) => void) => {
  const fieldKey = `workflow_step_${index + 1}` as keyof WorkflowDiagramsContent;
  handleContentUpdate(fieldKey, '___REMOVED___');

  // Also clear the corresponding icon
  const iconKey = `step_icon_${index + 1}` as keyof WorkflowDiagramsContent;
  handleContentUpdate(iconKey, '');
};

// Individual Workflow Card Component
const WorkflowCard = ({
  step,
  index,
  mode,
  sectionId,
  blockContent,
  colorTokens,
  handleContentUpdate,
  onRemove,
  canRemove,
  showArrow
}: {
  step: string;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  blockContent: WorkflowDiagramsContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof WorkflowDiagramsContent, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  showArrow: boolean;
}) => {
  const getStepIcon = () => {
    const iconFields = [
      blockContent.step_icon_1,
      blockContent.step_icon_2,
      blockContent.step_icon_3,
      blockContent.step_icon_4,
      blockContent.step_icon_5,
      blockContent.step_icon_6
    ];
    return iconFields[index] || '📋';
  };

  const handleStepEdit = (value: string) => {
    const fieldKey = `workflow_step_${index + 1}` as keyof WorkflowDiagramsContent;
    handleContentUpdate(fieldKey, value);
  };

  return (
    <React.Fragment>
      <div className={`relative group/workflow-step-${index} bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold flex items-center space-x-2`}>
        <IconEditableText
          mode={mode}
          value={getStepIcon()}
          onEdit={(value) => handleContentUpdate(`step_icon_${index + 1}` as keyof WorkflowDiagramsContent, value)}
          backgroundType="primary"
          colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
          iconSize="sm"
          className="text-lg text-white"
          sectionId={sectionId}
          elementKey={`step_icon_${index + 1}`}
        />

        {mode === 'edit' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleStepEdit(e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-white/50 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text text-white"
          >
            {step}
          </div>
        ) : (
          <span>{step}</span>
        )}

        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className={`opacity-0 group-hover/workflow-step-${index}:opacity-100 absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10`}
            title="Remove this step"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Arrow between steps */}
      {showArrow && <div className="text-blue-600 text-2xl">→</div>}
    </React.Fragment>
  );
};

export default function WorkflowDiagrams(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<WorkflowDiagramsContent>({ ...props, contentSchema: CONTENT_SCHEMA });

  // Get the current workflow steps
  const steps = getWorkflowSteps(blockContent);

  return (
    <LayoutSection sectionId={sectionId} sectionType="WorkflowDiagrams" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />

        {/* Workflow Steps Container */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {steps.map((step, index) => (
            <WorkflowCard
              key={index}
              step={step}
              index={index}
              mode={mode}
              sectionId={sectionId}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              onRemove={(idx) => removeWorkflowStep(idx, handleContentUpdate)}
              canRemove={steps.length > 1}
              showArrow={index < steps.length - 1}
            />
          ))}

          {/* Add Step Button - only show in edit mode and if under max limit */}
          {mode === 'edit' && steps.length < 6 && (
            <div className="group/add-workflow">
              <button
                onClick={() => addWorkflowStep(blockContent, handleContentUpdate)}
                className="flex items-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                title="Add workflow step"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-blue-700 font-medium">Add Step</span>
              </button>
            </div>
          )}
        </div>

        {/* Info text when at max capacity or minimum */}
        {mode === 'edit' && (
          <div className="mt-6 text-center text-sm text-gray-500">
            {steps.length >= 6 && (
              <p>Maximum of 6 workflow steps reached</p>
            )}
            {steps.length <= 1 && (
              <p>At least one workflow step is required</p>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'WorkflowDiagrams', category: 'Use Case', description: 'Process workflow diagrams', defaultBackgroundType: 'neutral' as const };