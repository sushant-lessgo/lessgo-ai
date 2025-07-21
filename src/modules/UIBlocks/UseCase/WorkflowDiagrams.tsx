// components/layout/WorkflowDiagrams.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface WorkflowDiagramsContent {
  headline: string;
  workflow_steps: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Streamlined Workflow Process' },
  workflow_steps: { type: 'string' as const, default: 'Input|Process|Analyze|Optimize|Output|Monitor' }
};

export default function WorkflowDiagrams(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<WorkflowDiagramsContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const steps = blockContent.workflow_steps.split('|').map(s => s.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="WorkflowDiagrams" backgroundType={props.backgroundType || 'neutral'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'neutral'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="flex flex-wrap justify-center items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold">{step}</div>
              {index < steps.length - 1 && <div className="text-blue-600 text-2xl">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'WorkflowDiagrams', category: 'Use Case', description: 'Process workflow diagrams', defaultBackgroundType: 'neutral' as const };