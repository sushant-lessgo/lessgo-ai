// components/layout/InteractiveUseCaseMap.tsx
import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InteractiveUseCaseMapContent {
  headline: string;
  categories: string;
  use_cases: string;
  cta_text?: string;
  // Optional category icons
  category_icon_1?: string;
  category_icon_2?: string;
  category_icon_3?: string;
  category_icon_4?: string;
  category_icon_5?: string;
  category_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Explore Use Cases by Category' },
  categories: { type: 'string' as const, default: 'Marketing|Sales|Operations|Finance|HR|IT' },
  use_cases: { type: 'string' as const, default: 'Campaign automation and lead nurturing|Pipeline management and forecasting|Process optimization and workflow automation|Budget planning and expense tracking|Recruitment and employee onboarding|System monitoring and maintenance' },
  cta_text: { type: 'string' as const, default: 'Learn More →' },
  // Optional category icons - department-specific defaults
  category_icon_1: { type: 'string' as const, default: '📊' }, // Marketing - chart
  category_icon_2: { type: 'string' as const, default: '💰' }, // Sales - money bag
  category_icon_3: { type: 'string' as const, default: '⚙️' }, // Operations - gear
  category_icon_4: { type: 'string' as const, default: '📋' }, // Finance - clipboard
  category_icon_5: { type: 'string' as const, default: '👥' }, // HR - people
  category_icon_6: { type: 'string' as const, default: '💻' }  // IT - computer
};

export default function InteractiveUseCaseMap(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<InteractiveUseCaseMapContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const categories = blockContent.categories.split('|').map(c => c.trim()).filter(Boolean);
  const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);
  const [selectedCategory, setSelectedCategory] = useState(0);

  // Get category icon from content fields by index
  const getCategoryIcon = (index: number) => {
    const iconFields = [
      blockContent.category_icon_1,
      blockContent.category_icon_2,
      blockContent.category_icon_3,
      blockContent.category_icon_4,
      blockContent.category_icon_5,
      blockContent.category_icon_6
    ];
    return iconFields[index];
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="InteractiveUseCaseMap" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {categories.map((category, index) => (
              <button key={index} onClick={() => setSelectedCategory(index)} className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedCategory === index ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(index) && (
                    <IconEditableText
                      mode={mode}
                      value={getCategoryIcon(index) || ''}
                      onEdit={(value) => handleContentUpdate(`category_icon_${index + 1}` as keyof InteractiveUseCaseMapContent, value)}
                      backgroundType={selectedCategory === index ? 'primary' : 'neutral'}
                      colorTokens={selectedCategory === index ? 
                        { ...colorTokens, textPrimary: 'text-white' } : 
                        colorTokens
                      }
                      iconSize="sm"
                      className={`text-lg ${selectedCategory === index ? 'text-white' : 'text-gray-600'}`}
                      sectionId={sectionId}
                      elementKey={`category_icon_${index + 1}`}
                    />
                  )}
                  <div className="font-semibold">{category}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 text-xl">{categories[selectedCategory]} Use Cases</h3>
            <p className="text-gray-600 mb-6">{useCases[selectedCategory] || 'Use case details for this category'}</p>
            <div className="inline-flex items-center text-blue-600 font-medium">
              {blockContent.cta_text || 'Learn More →'}
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'InteractiveUseCaseMap', category: 'Use Case', description: 'Interactive use case explorer by category', defaultBackgroundType: 'neutral' as const };