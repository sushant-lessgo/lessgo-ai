// components/layout/PropertyComparisonMatrix.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PropertyComparisonMatrixContent {
  headline: string;
  properties: string;
  us_values: string;
  competitors_values: string;
  feature_header: string;
  us_header: string;
  competitors_header: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How We Compare' },
  properties: { type: 'string' as const, default: 'Speed|Accuracy|Security|Scalability|Cost|Support' },
  us_values: { type: 'string' as const, default: 'Ultra-Fast|99.9%|Enterprise|Unlimited|Competitive|24/7' },
  competitors_values: { type: 'string' as const, default: 'Slow|95%|Basic|Limited|Expensive|Business Hours' },
  feature_header: { type: 'string' as const, default: 'Feature' },
  us_header: { type: 'string' as const, default: 'Us' },
  competitors_header: { type: 'string' as const, default: 'Competitors' }
};

export default function PropertyComparisonMatrix(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<PropertyComparisonMatrixContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Parse data using utility functions (following IconGrid pattern)
  const properties = parsePipeData(blockContent.properties);
  const usValues = parsePipeData(blockContent.us_values);
  const competitorValues = parsePipeData(blockContent.competitors_values);
  
  // Handle individual cell editing (following IconGrid pattern)
  const handlePropertyEdit = (index: number, value: string) => {
    const updatedProperties = updateListData(blockContent.properties, index, value);
    handleContentUpdate('properties', updatedProperties);
  };

  const handleUsValueEdit = (index: number, value: string) => {
    const updatedValues = updateListData(blockContent.us_values, index, value);
    handleContentUpdate('us_values', updatedValues);
  };

  const handleCompetitorValueEdit = (index: number, value: string) => {
    const updatedValues = updateListData(blockContent.competitors_values, index, value);
    handleContentUpdate('competitors_values', updatedValues);
  };
  
  // Typography styles
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection sectionId={sectionId} sectionType="PropertyComparisonMatrix" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-4xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div style={bodyStyle} className="p-4 font-bold text-gray-900">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.feature_header || ''}
                onEdit={(value) => handleContentUpdate('feature_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold"
                placeholder="Feature"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="feature_header"
              />
            </div>
            <div style={bodyStyle} className="p-4 font-bold text-green-600 text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.us_header || ''}
                onEdit={(value) => handleContentUpdate('us_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold text-center"
                placeholder="Us"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="us_header"
              />
            </div>
            <div style={bodyStyle} className="p-4 font-bold text-gray-500 text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.competitors_header || ''}
                onEdit={(value) => handleContentUpdate('competitors_header', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-bold text-center"
                placeholder="Competitors"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="competitors_header"
              />
            </div>
          </div>
          {properties.map((property, index) => (
            <div key={index} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
              <div style={bodyStyle} className="p-4 font-medium text-gray-900">
                <EditableAdaptiveText
                  mode={mode}
                  value={property}
                  onEdit={(value) => handlePropertyEdit(index, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-medium"
                  placeholder="Property name"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`property_${index}`}
                />
              </div>
              <div style={bodyStyle} className="p-4 text-center text-green-600 font-semibold">
                <EditableAdaptiveText
                  mode={mode}
                  value={usValues[index] || ''}
                  onEdit={(value) => handleUsValueEdit(index, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-center font-semibold text-green-600"
                  placeholder="Our value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`us_value_${index}`}
                />
              </div>
              <div style={bodyStyle} className="p-4 text-center text-gray-500">
                <EditableAdaptiveText
                  mode={mode}
                  value={competitorValues[index] || ''}
                  onEdit={(value) => handleCompetitorValueEdit(index, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-center text-gray-500"
                  placeholder="Competitor value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`competitor_value_${index}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'PropertyComparisonMatrix', category: 'Unique Mechanism', description: 'Property comparison matrix vs competitors', defaultBackgroundType: 'neutral' as const };