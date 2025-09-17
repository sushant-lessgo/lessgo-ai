// components/layout/AlgorithmExplainer.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface AlgorithmExplainerContent {
  headline: string;
  algorithm_name: string;
  algorithm_steps: string; // Legacy format for backward compatibility
  algorithm_step_1: string;
  algorithm_step_2: string;
  algorithm_step_3: string;
  algorithm_step_4: string;
  algorithm_step_5: string;
  algorithm_step_6: string;
  algorithm_step_7: string;
  algorithm_step_8: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Proprietary Algorithm' },
  algorithm_name: { type: 'string' as const, default: 'SmartOptimize AI™' },
  algorithm_steps: { type: 'string' as const, default: 'Data Collection|Pattern Analysis|Optimization|Validation|Implementation|Monitoring' },
  algorithm_step_1: { type: 'string' as const, default: 'Data Collection' },
  algorithm_step_2: { type: 'string' as const, default: 'Pattern Analysis' },
  algorithm_step_3: { type: 'string' as const, default: 'Optimization' },
  algorithm_step_4: { type: 'string' as const, default: 'Validation' },
  algorithm_step_5: { type: 'string' as const, default: 'Implementation' },
  algorithm_step_6: { type: 'string' as const, default: 'Monitoring' },
  algorithm_step_7: { type: 'string' as const, default: '' },
  algorithm_step_8: { type: 'string' as const, default: '' }
};

// Helper function to get algorithm steps from individual fields with backward compatibility
const getAlgorithmSteps = (blockContent: AlgorithmExplainerContent): { step: string; index: number }[] => {
  const individualSteps = [
    blockContent.algorithm_step_1,
    blockContent.algorithm_step_2,
    blockContent.algorithm_step_3,
    blockContent.algorithm_step_4,
    blockContent.algorithm_step_5,
    blockContent.algorithm_step_6,
    blockContent.algorithm_step_7,
    blockContent.algorithm_step_8
  ];

  // Use individual fields if they have content
  const validIndividualSteps = individualSteps
    .map((step, index) => ({ step: step || '', index }))
    .filter(item => item.step.trim() !== '' && item.step !== '___REMOVED___');

  if (validIndividualSteps.length > 0) {
    return validIndividualSteps;
  }

  // Fallback to legacy format
  const legacySteps = blockContent.algorithm_steps
    ? blockContent.algorithm_steps.split('|').map(s => s.trim()).filter(Boolean)
    : [];

  return legacySteps.map((step, index) => ({ step, index }));
};

// Helper function to add a new step
const addAlgorithmStep = (blockContent: AlgorithmExplainerContent, handleContentUpdate: (field: keyof AlgorithmExplainerContent, value: string) => void) => {
  const steps = [
    blockContent.algorithm_step_1,
    blockContent.algorithm_step_2,
    blockContent.algorithm_step_3,
    blockContent.algorithm_step_4,
    blockContent.algorithm_step_5,
    blockContent.algorithm_step_6,
    blockContent.algorithm_step_7,
    blockContent.algorithm_step_8
  ];

  const emptyIndex = steps.findIndex(step => !step || step.trim() === '' || step === '___REMOVED___');

  if (emptyIndex !== -1) {
    const fieldKey = `algorithm_step_${emptyIndex + 1}` as keyof AlgorithmExplainerContent;
    handleContentUpdate(fieldKey, 'New Step');
  }
};

export default function AlgorithmExplainer(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<AlgorithmExplainerContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  const algorithmSteps = getAlgorithmSteps(blockContent);

  // Typography styles
  const h3Style = getTypographyStyle('h3');

  return (
    <LayoutSection sectionId={sectionId} sectionType="AlgorithmExplainer" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="mb-4" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
          <EditableAdaptiveText mode={mode} value={blockContent.algorithm_name || ''} onEdit={(value) => handleContentUpdate('algorithm_name', value)} backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} variant="body" className="text-blue-600 font-bold" sectionId={sectionId} elementKey="algorithm_name" sectionBackground={sectionBackground} />
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {algorithmSteps.map((stepData, displayIndex) => (
              <div key={stepData.index} className="relative group/algorithm-step text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">{displayIndex + 1}</div>

                {mode === 'edit' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const fieldKey = `algorithm_step_${stepData.index + 1}` as keyof AlgorithmExplainerContent;
                      handleContentUpdate(fieldKey, e.currentTarget.textContent || '');
                    }}
                    className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1 min-h-[24px] cursor-text hover:bg-white hover:bg-opacity-10 font-semibold text-center"
                    style={h3Style}
                  >
                    {stepData.step}
                  </div>
                ) : (
                  <h3 style={h3Style} className="font-semibold mb-2">{stepData.step}</h3>
                )}

                {/* Delete button - only show in edit mode and if more than 1 step */}
                {mode === 'edit' && algorithmSteps.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const fieldKey = `algorithm_step_${stepData.index + 1}` as keyof AlgorithmExplainerContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
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
            ))}
          </div>

          {/* Add Step Button - only show in edit mode and if under max limit */}
          {mode === 'edit' && algorithmSteps.length < 8 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => addAlgorithmStep(blockContent, handleContentUpdate)}
                className="flex items-center space-x-2 mx-auto px-4 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 border-2 border-white border-opacity-30 hover:border-opacity-50 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white font-medium">Add Step</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'AlgorithmExplainer', category: 'Unique Mechanism', description: 'Algorithm explanation and visualization', defaultBackgroundType: 'primary' as const };