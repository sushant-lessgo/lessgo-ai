// components/layout/BeforeAfterWorkflow.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface BeforeAfterWorkflowContent {
  headline: string;
  before_steps: string;
  after_steps: string;
  before_title?: string;
  after_title?: string;
  // Optional step icons for before workflow
  before_icon_1?: string;
  before_icon_2?: string;
  before_icon_3?: string;
  before_icon_4?: string;
  // Optional step icons for after workflow  
  after_icon_1?: string;
  after_icon_2?: string;
  after_icon_3?: string;
  after_icon_4?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Transform Your Workflow' },
  before_steps: { type: 'string' as const, default: 'Manual Data Entry|Time-Consuming Analysis|Error-Prone Processes|Delayed Reporting' },
  after_steps: { type: 'string' as const, default: 'Automated Data Collection|Instant AI Analysis|Error-Free Processing|Real-Time Insights' },
  before_title: { type: 'string' as const, default: 'Before (Manual Process)' },
  after_title: { type: 'string' as const, default: 'After (With Our Solution)' },
  // Optional step icons for before workflow (problem-focused)
  before_icon_1: { type: 'string' as const, default: '⚠️' }, // Manual
  before_icon_2: { type: 'string' as const, default: '⏰' }, // Time-consuming
  before_icon_3: { type: 'string' as const, default: '❌' }, // Error-prone
  before_icon_4: { type: 'string' as const, default: '⏳' }, // Delayed
  // Optional step icons for after workflow (solution-focused)
  after_icon_1: { type: 'string' as const, default: '🤖' }, // Automated
  after_icon_2: { type: 'string' as const, default: '⚡' }, // Instant
  after_icon_3: { type: 'string' as const, default: '✅' }, // Error-free
  after_icon_4: { type: 'string' as const, default: '📊' }  // Real-time
};

export default function BeforeAfterWorkflow(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<BeforeAfterWorkflowContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const beforeSteps = blockContent.before_steps.split('|').map(s => s.trim()).filter(Boolean);
  const afterSteps = blockContent.after_steps.split('|').map(s => s.trim()).filter(Boolean);

  // Get step icons from content fields by index
  const getBeforeIcon = (index: number) => {
    const iconFields = [
      blockContent.before_icon_1,
      blockContent.before_icon_2,
      blockContent.before_icon_3,
      blockContent.before_icon_4
    ];
    return iconFields[index];
  };

  const getAfterIcon = (index: number) => {
    const iconFields = [
      blockContent.after_icon_1,
      blockContent.after_icon_2,
      blockContent.after_icon_3,
      blockContent.after_icon_4
    ];
    return iconFields[index];
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="BeforeAfterWorkflow" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-red-50 p-8 rounded-xl border border-red-200">
            <h3 className="font-bold text-red-900 mb-6 text-center text-xl">{blockContent.before_title || 'Before (Manual Process)'}</h3>
            <div className="space-y-4">
              {beforeSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
                    {getBeforeIcon(index) && (
                      <IconEditableText
                        mode={mode}
                        value={getBeforeIcon(index) || ''}
                        onEdit={(value) => handleContentUpdate(`before_icon_${index + 1}` as keyof BeforeAfterWorkflowContent, value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        iconSize="sm"
                        className="text-xl"
                        sectionId={sectionId}
                        elementKey={`before_icon_${index + 1}`}
                      />
                    )}
                  </div>
                  <span className="text-red-800">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-50 p-8 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-900 mb-6 text-center text-xl">{blockContent.after_title || 'After (With Our Solution)'}</h3>
            <div className="space-y-4">
              {afterSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
                    {getAfterIcon(index) && (
                      <IconEditableText
                        mode={mode}
                        value={getAfterIcon(index) || ''}
                        onEdit={(value) => handleContentUpdate(`after_icon_${index + 1}` as keyof BeforeAfterWorkflowContent, value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        iconSize="sm"
                        className="text-xl"
                        sectionId={sectionId}
                        elementKey={`after_icon_${index + 1}`}
                      />
                    )}
                  </div>
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