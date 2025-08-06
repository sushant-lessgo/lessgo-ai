// components/layout/UseCaseCarousel.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface UseCaseCarouselContent {
  headline: string;
  use_cases: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Endless Possibilities' },
  use_cases: { type: 'string' as const, default: 'Customer Support Automation|Sales Pipeline Management|Marketing Campaign Optimization|Financial Report Generation|HR Process Streamlining|Inventory Management' }
};

export default function UseCaseCarousel(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<UseCaseCarouselContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);

  return (
    <LayoutSection sectionId={sectionId} sectionType="UseCaseCarousel" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="flex overflow-x-auto space-x-6 pb-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 min-w-[300px] flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{useCase}</h3>
              <p className="text-gray-600 text-sm">Optimize and automate this critical business process.</p>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'UseCaseCarousel', category: 'Use Case', description: 'Scrolling use case examples carousel', defaultBackgroundType: 'secondary' as const };