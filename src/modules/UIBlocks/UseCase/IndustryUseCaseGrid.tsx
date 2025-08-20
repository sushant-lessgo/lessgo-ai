// components/layout/IndustryUseCaseGrid.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface IndustryUseCaseGridContent {
  headline: string;
  industries: string;
  use_cases: string;
  // Industry icons
  industry_icon_1?: string;
  industry_icon_2?: string;
  industry_icon_3?: string;
  industry_icon_4?: string;
  industry_icon_5?: string;
  industry_icon_6?: string;
  cta_text?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Trusted Across Industries' },
  industries: { type: 'string' as const, default: 'Healthcare|Finance|Manufacturing|Retail|Education|Technology' },
  use_cases: { type: 'string' as const, default: 'Patient data management and treatment optimization|Risk assessment and fraud detection|Quality control and supply chain optimization|Customer analytics and inventory management|Student performance tracking and curriculum planning|Development workflow automation and testing' },
  // Industry icons - matching the getIndustryIcon defaults
  industry_icon_1: { type: 'string' as const, default: '🏥' },
  industry_icon_2: { type: 'string' as const, default: '🏦' },
  industry_icon_3: { type: 'string' as const, default: '🏭' },
  industry_icon_4: { type: 'string' as const, default: '🛍️' },
  industry_icon_5: { type: 'string' as const, default: '🎓' },
  industry_icon_6: { type: 'string' as const, default: '💻' },
  cta_text: { type: 'string' as const, default: 'Learn More →' }
};

export default function IndustryUseCaseGrid(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<IndustryUseCaseGridContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const industries = blockContent.industries.split('|').map(i => i.trim()).filter(Boolean);
  const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);

  // Get industry icon from content fields by index
  const getIndustryIcon = (index: number) => {
    const iconFields = [
      blockContent.industry_icon_1,
      blockContent.industry_icon_2,
      blockContent.industry_icon_3,
      blockContent.industry_icon_4,
      blockContent.industry_icon_5,
      blockContent.industry_icon_6
    ];
    return iconFields[index] || '🏢';
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="IndustryUseCaseGrid" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-6xl mb-6 text-center">
                <IconEditableText
                  mode={mode}
                  value={getIndustryIcon(index)}
                  onEdit={(value) => handleContentUpdate(`industry_icon_${index + 1}` as keyof IndustryUseCaseGridContent, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  iconSize="xl"
                  className="text-6xl"
                  placeholder="🏢"
                  sectionId={sectionId}
                  elementKey={`industry_icon_${index + 1}`}
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-center">{industry}</h3>
              <p className="text-gray-600 text-center">{useCases[index] || 'Industry-specific use case'}</p>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center text-blue-600 text-sm font-medium">
                  {blockContent.cta_text || 'Learn More →'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'IndustryUseCaseGrid', category: 'Use Case', description: 'Industry-specific use cases grid', defaultBackgroundType: 'neutral' as const };