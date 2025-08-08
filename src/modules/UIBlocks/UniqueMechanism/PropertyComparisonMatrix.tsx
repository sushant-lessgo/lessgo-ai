// components/layout/PropertyComparisonMatrix.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PropertyComparisonMatrixContent {
  headline: string;
  properties: string;
  us_values: string;
  competitors_values: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How We Compare' },
  properties: { type: 'string' as const, default: 'Speed|Accuracy|Security|Scalability|Cost|Support' },
  us_values: { type: 'string' as const, default: 'Ultra-Fast|99.9%|Enterprise|Unlimited|Competitive|24/7' },
  competitors_values: { type: 'string' as const, default: 'Slow|95%|Basic|Limited|Expensive|Business Hours' }
};

export default function PropertyComparisonMatrix(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<PropertyComparisonMatrixContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  const properties = blockContent.properties.split('|').map(p => p.trim()).filter(Boolean);
  const usValues = blockContent.us_values.split('|').map(v => v.trim()).filter(Boolean);
  const competitorValues = blockContent.competitors_values.split('|').map(v => v.trim()).filter(Boolean);
  
  // Typography styles
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection sectionId={sectionId} sectionType="PropertyComparisonMatrix" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-4xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div style={bodyStyle} className="p-4 font-bold text-gray-900">Feature</div>
            <div style={bodyStyle} className="p-4 font-bold text-green-600 text-center">Us</div>
            <div style={bodyStyle} className="p-4 font-bold text-gray-500 text-center">Competitors</div>
          </div>
          {properties.map((property, index) => (
            <div key={index} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
              <div style={bodyStyle} className="p-4 font-medium text-gray-900">{property}</div>
              <div style={bodyStyle} className="p-4 text-center text-green-600 font-semibold">{usValues[index] || 'N/A'}</div>
              <div style={bodyStyle} className="p-4 text-center text-gray-500">{competitorValues[index] || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'PropertyComparisonMatrix', category: 'Unique Mechanism', description: 'Property comparison matrix vs competitors', defaultBackgroundType: 'neutral' as const };