// components/layout/AlgorithmExplainer.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface AlgorithmExplainerContent {
  headline: string;
  algorithm_name: string;
  algorithm_steps: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Proprietary Algorithm' },
  algorithm_name: { type: 'string' as const, default: 'SmartOptimize AI™' },
  algorithm_steps: { type: 'string' as const, default: 'Data Collection|Pattern Analysis|Optimization|Validation|Implementation|Monitoring' }
};

export default function AlgorithmExplainer(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<AlgorithmExplainerContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const steps = blockContent.algorithm_steps.split('|').map(s => s.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="AlgorithmExplainer" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="mb-4" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
          <EditableAdaptiveText mode={mode} value={blockContent.algorithm_name || ''} onEdit={(value) => handleContentUpdate('algorithm_name', value)} backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} variant="body" className="text-blue-600 font-bold" sectionId={sectionId} elementKey="algorithm_name" sectionBackground={sectionBackground} />
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">{index + 1}</div>
                <h3 className="font-semibold mb-2">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'AlgorithmExplainer', category: 'Unique Mechanism', description: 'Algorithm explanation and visualization', defaultBackgroundType: 'primary' as const };