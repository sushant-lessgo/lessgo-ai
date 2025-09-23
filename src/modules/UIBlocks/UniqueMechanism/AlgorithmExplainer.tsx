import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface AlgorithmExplainerContent {
  headline: string;
  algorithm_name: string;
  algorithm_description?: string;
  algorithm_steps: string;
  step_descriptions: string;
}

interface StepItem {
  step: string;
  description: string;
  id: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Proprietary Algorithm' },
  algorithm_name: { type: 'string' as const, default: 'SmartOptimize AI™' },
  algorithm_description: { type: 'string' as const, default: '' },
  algorithm_steps: { type: 'string' as const, default: 'Data Collection|Pattern Analysis|Optimization|Validation|Implementation' },
  step_descriptions: { type: 'string' as const, default: 'Gather and process massive datasets from multiple sources|Identify hidden patterns and correlations using machine learning|Apply advanced optimization algorithms to find the best solution|Test and verify results against real-world scenarios|Deploy optimized solution to production environment' }
};

const parseStepData = (steps: string, descriptions: string): StepItem[] => {
  const stepList = steps.split('|').map(s => s.trim()).filter(s => s);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return stepList.map((step, index) => ({
    id: `step-${index}`,
    step,
    description: descriptionList[index] || 'Description not provided.'
  }));
};

const addStep = (steps: string, descriptions: string): { newSteps: string; newDescriptions: string } => {
  const stepList = steps.split('|').map(s => s.trim()).filter(s => s);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  stepList.push('New Step');
  descriptionList.push('Describe this algorithm step.');

  return {
    newSteps: stepList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const removeStep = (steps: string, descriptions: string, indexToRemove: number): { newSteps: string; newDescriptions: string } => {
  const stepList = steps.split('|').map(s => s.trim()).filter(s => s);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  if (indexToRemove >= 0 && indexToRemove < stepList.length) {
    stepList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newSteps: stepList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const StepCard = ({
  stepData,
  index,
  mode,
  sectionId,
  onStepEdit,
  onDescriptionEdit,
  onRemoveStep,
  canRemove = true
}: {
  stepData: StepItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onStepEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveStep?: (index: number) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className="relative group/algorithm-step text-center">
      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
        {index + 1}
      </div>

      {mode === 'edit' ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onStepEdit(index, e.currentTarget.textContent || '')}
          className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1 min-h-[24px] cursor-text hover:bg-white hover:bg-opacity-10 font-semibold text-center mb-2"
        >
          {stepData.step}
        </div>
      ) : (
        <h3 className="font-semibold mb-2">{stepData.step}</h3>
      )}

      {stepData.description && (
        <>
          {mode === 'edit' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1 min-h-[36px] cursor-text hover:bg-white hover:bg-opacity-10 text-sm opacity-90"
            >
              {stepData.description}
            </div>
          ) : (
            <p className="text-sm opacity-90">{stepData.description}</p>
          )}
        </>
      )}

      {mode === 'edit' && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveStep?.(index);
          }}
          className="opacity-0 group-hover/algorithm-step:opacity-100 absolute top-0 right-0 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          title="Remove this step"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function AlgorithmExplainer(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<AlgorithmExplainerContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  const algorithmSteps = parseStepData(
    blockContent.algorithm_steps || '',
    blockContent.step_descriptions || ''
  );

  const handleStepEdit = (index: number, newStep: string) => {
    const steps = (blockContent.algorithm_steps || '').split('|').map(s => s.trim());
    steps[index] = newStep;
    handleContentUpdate('algorithm_steps', steps.join('|'));
  };

  const handleDescriptionEdit = (index: number, newDescription: string) => {
    const descriptions = (blockContent.step_descriptions || '').split('|').map(d => d.trim());
    descriptions[index] = newDescription;
    handleContentUpdate('step_descriptions', descriptions.join('|'));
  };

  const handleAddStep = () => {
    const { newSteps, newDescriptions } = addStep(
      blockContent.algorithm_steps || '',
      blockContent.step_descriptions || ''
    );
    handleContentUpdate('algorithm_steps', newSteps);
    handleContentUpdate('step_descriptions', newDescriptions);
  };

  const handleRemoveStep = (index: number) => {
    const { newSteps, newDescriptions } = removeStep(
      blockContent.algorithm_steps || '',
      blockContent.step_descriptions || '',
      index
    );
    handleContentUpdate('algorithm_steps', newSteps);
    handleContentUpdate('step_descriptions', newDescriptions);
  };

  // Typography styles
  const h3Style = getTypographyStyle('h3');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AlgorithmExplainer"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.algorithm_name || ''}
            onEdit={(value) => handleContentUpdate('algorithm_name', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="text-blue-600 font-bold text-lg mb-2"
            sectionId={sectionId}
            elementKey="algorithm_name"
            sectionBackground={sectionBackground}
          />
          {blockContent.algorithm_description && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.algorithm_description}
              onEdit={(value) => handleContentUpdate('algorithm_description', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-gray-600 max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="algorithm_description"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {algorithmSteps.map((stepData, displayIndex) => (
              <StepCard
                key={stepData.id}
                stepData={stepData}
                index={displayIndex}
                mode={mode}
                sectionId={sectionId}
                onStepEdit={handleStepEdit}
                onDescriptionEdit={handleDescriptionEdit}
                onRemoveStep={handleRemoveStep}
                canRemove={algorithmSteps.length > 3}
              />
            ))}
          </div>

          {mode === 'edit' && algorithmSteps.length < 5 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleAddStep}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Step
              </button>
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'AlgorithmExplainer',
  category: 'Unique Mechanism',
  description: 'Explain your algorithm with interactive step breakdown',
  defaultBackgroundType: 'primary' as const
};