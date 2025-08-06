// components/layout/BeforeAfterWorkflow.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface BeforeAfterWorkflowContent {
  headline: string;
  before_steps: string;
  after_steps: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Workflow' },
  before_steps: { type: 'string' as const, default: 'Manual Data Entry|Time-Consuming Analysis|Error-Prone Processes|Delayed Reporting' },
  after_steps: { type: 'string' as const, default: 'Automated Data Collection|Instant AI Analysis|Error-Free Processing|Real-Time Insights' }
};

export default function BeforeAfterWorkflow(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<BeforeAfterWorkflowContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const beforeSteps = blockContent.before_steps.split('|').map(s => s.trim()).filter(Boolean);
  const afterSteps = blockContent.after_steps.split('|').map(s => s.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="BeforeAfterWorkflow" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-red-50 p-8 rounded-xl border border-red-200">
            <h3 className="font-bold text-red-900 mb-6 text-center text-xl">Before (Manual Process)</h3>
            <div className="space-y-4">
              {beforeSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
                  <span className="text-red-800">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-50 p-8 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-900 mb-6 text-center text-xl">After (With Our Solution)</h3>
            <div className="space-y-4">
              {afterSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
                  <span className="text-green-800">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'BeforeAfterWorkflow', category: 'Use Case', description: 'Before and after workflow transformation', defaultBackgroundType: 'primary' as const };