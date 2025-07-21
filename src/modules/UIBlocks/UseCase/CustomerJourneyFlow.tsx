// components/layout/CustomerJourneyFlow.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface CustomerJourneyFlowContent {
  headline: string;
  journey_stages: string;
  stage_descriptions: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Customer Journey Optimization' },
  journey_stages: { type: 'string' as const, default: 'Awareness|Interest|Consideration|Purchase|Onboarding|Retention' },
  stage_descriptions: { type: 'string' as const, default: 'Discover your brand and solutions|Learn about features and benefits|Compare options and evaluate fit|Make purchase decision|Get started and integrated|Ongoing success and growth' }
};

export default function CustomerJourneyFlow(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<CustomerJourneyFlowContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const stages = blockContent.journey_stages.split('|').map(s => s.trim()).filter(Boolean);
  const descriptions = blockContent.stage_descriptions.split('|').map(d => d.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="CustomerJourneyFlow" backgroundType={props.backgroundType || 'primary'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'primary'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 transform -translate-y-1/2"></div>
          <div className="grid lg:grid-cols-6 gap-8">
            {stages.map((stage, index) => (
              <div key={index} className="relative text-center">
                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="font-bold text-gray-900 mb-2" style={getTextStyle('h4')}>{stage}</h3>
                <p className="text-gray-600 text-sm" style={getTextStyle('body-sm')}>{descriptions[index] || 'Stage description'}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Optimize Every Touchpoint</h3>
          <p className="text-blue-700">Our platform helps you understand and improve each stage of the customer journey for maximum satisfaction and retention.</p>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'CustomerJourneyFlow', category: 'Use Case', description: 'Customer journey visualization and optimization', defaultBackgroundType: 'primary' as const };