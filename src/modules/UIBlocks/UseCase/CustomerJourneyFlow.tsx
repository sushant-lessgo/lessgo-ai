// components/layout/CustomerJourneyFlow.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface CustomerJourneyFlowContent {
  headline: string;
  journey_stages: string;
  stage_descriptions: string;
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
  journey_stages: { type: 'string' as const, default: 'Awareness|Interest|Consideration|Purchase|Onboarding|Retention' },
  stage_descriptions: { type: 'string' as const, default: 'Discover your brand and solutions|Learn about features and benefits|Compare options and evaluate fit|Make purchase decision|Get started and integrated|Ongoing success and growth' },
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

export default function CustomerJourneyFlow(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<CustomerJourneyFlowContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const stages = blockContent.journey_stages.split('|').map(s => s.trim()).filter(Boolean);
  const descriptions = blockContent.stage_descriptions.split('|').map(d => d.trim()).filter(Boolean);

  // Get stage icon from content fields by index
  const getStageIcon = (index: number) => {
    const iconFields = [
      blockContent.stage_icon_1,
      blockContent.stage_icon_2,
      blockContent.stage_icon_3,
      blockContent.stage_icon_4,
      blockContent.stage_icon_5,
      blockContent.stage_icon_6
    ];
    return iconFields[index];
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="CustomerJourneyFlow" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 transform -translate-y-1/2"></div>
          <div className="grid lg:grid-cols-6 gap-8">
            {stages.map((stage, index) => (
              <div key={index} className="relative text-center">
                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex flex-col items-center justify-center text-white font-bold mx-auto mb-4 shadow-lg">
                  <div className="text-sm">{index + 1}</div>
                  {getStageIcon(index) && (
                    <IconEditableText
                      mode={mode}
                      value={getStageIcon(index) || ''}
                      onEdit={(value) => handleContentUpdate(`stage_icon_${index + 1}` as keyof CustomerJourneyFlowContent, value)}
                      backgroundType="primary"
                      colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                      iconSize="sm"
                      className="text-lg text-white"
                      sectionId={sectionId}
                      elementKey={`stage_icon_${index + 1}`}
                    />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{stage}</h3>
                <p className="text-gray-600 text-sm">{descriptions[index] || 'Stage description'}</p>
              </div>
            ))}
          </div>
        </div>
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