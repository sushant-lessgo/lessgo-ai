// components/layout/InnovationTimeline.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InnovationTimelineContent {
  headline: string;
  timeline_items: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Innovation Timeline' },
  timeline_items: { type: 'string' as const, default: '2020: Initial Research|2021: First Prototype|2022: Beta Testing|2023: Market Launch|2024: AI Integration|2025: Global Expansion' }
};

export default function InnovationTimeline(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<InnovationTimelineContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const items = blockContent.timeline_items.split('|').map(i => i.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="InnovationTimeline" backgroundType={props.backgroundType || 'neutral'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-4xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'neutral'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="space-y-8">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{index + 1}</div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1">
                <h3 className="font-bold text-gray-900">{item}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'InnovationTimeline', category: 'Unique Mechanism', description: 'Innovation and development timeline', defaultBackgroundType: 'neutral' as const };