// components/layout/IndustryUseCaseGrid.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface IndustryUseCaseGridContent {
  headline: string;
  industries: string;
  use_cases: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Trusted Across Industries' },
  industries: { type: 'string' as const, default: 'Healthcare|Finance|Manufacturing|Retail|Education|Technology' },
  use_cases: { type: 'string' as const, default: 'Patient data management and treatment optimization|Risk assessment and fraud detection|Quality control and supply chain optimization|Customer analytics and inventory management|Student performance tracking and curriculum planning|Development workflow automation and testing' }
};

export default function IndustryUseCaseGrid(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<IndustryUseCaseGridContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const industries = blockContent.industries.split('|').map(i => i.trim()).filter(Boolean);
  const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);

  const getIndustryIcon = (industry: string) => {
    const lower = industry.toLowerCase();
    if (lower.includes('healthcare')) return '🏥';
    if (lower.includes('finance')) return '🏦';
    if (lower.includes('manufacturing')) return '🏭';
    if (lower.includes('retail')) return '🛍️';
    if (lower.includes('education')) return '🎓';
    if (lower.includes('technology')) return '💻';
    return '🏢';
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="IndustryUseCaseGrid" backgroundType={props.backgroundType || 'neutral'} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType || 'neutral'} colorTokens={colorTokens} textStyle={getTextStyle('h1')} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-6xl mb-6 text-center">{getIndustryIcon(industry)}</div>
              <h3 className="font-bold text-gray-900 mb-4 text-center" style={getTextStyle('h3')}>{industry}</h3>
              <p className="text-gray-600 text-center" style={getTextStyle('body-sm')}>{useCases[index] || 'Industry-specific use case'}</p>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center text-blue-600 text-sm font-medium">
                  Learn More →
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