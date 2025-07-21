// components/layout/InteractiveUseCaseMap.tsx
import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InteractiveUseCaseMapContent {
  headline: string;
  categories: string;
  use_cases: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Explore Use Cases by Category' },
  categories: { type: 'string' as const, default: 'Marketing|Sales|Operations|Finance|HR|IT' },
  use_cases: { type: 'string' as const, default: 'Campaign automation and lead nurturing|Pipeline management and forecasting|Process optimization and workflow automation|Budget planning and expense tracking|Recruitment and employee onboarding|System monitoring and maintenance' }
};

export default function InteractiveUseCaseMap(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<InteractiveUseCaseMapContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const categories = blockContent.categories.split('|').map(c => c.trim()).filter(Boolean);
  const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);
  const [selectedCategory, setSelectedCategory] = useState(0);

  return (
    <LayoutSection sectionId={sectionId} sectionType="InteractiveUseCaseMap" backgroundType={props.backgroundType || 'neutral'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'neutral'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {categories.map((category, index) => (
              <button key={index} onClick={() => setSelectedCategory(index)} className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedCategory === index ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'}`}>
                <div className="font-semibold">{category}</div>
              </button>
            ))}
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 text-xl">{categories[selectedCategory]} Use Cases</h3>
            <p className="text-gray-600 mb-6">{useCases[selectedCategory] || 'Use case details for this category'}</p>
            <div className="inline-flex items-center text-blue-600 font-medium">
              Learn More →
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'InteractiveUseCaseMap', category: 'Use Case', description: 'Interactive use case explorer by category', defaultBackgroundType: 'neutral' as const };