// components/layout/PropertyComparisonMatrix.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        headerBg: 'bg-orange-50',
        headerBorder: 'border-orange-200',
        usColumnBg: 'bg-green-50',
        usColumnText: 'text-green-700',
        competitorText: 'text-gray-500',
        cardBorder: 'border-orange-200',
        cardShadow: 'shadow-md shadow-orange-100/50'
      },
      cool: {
        headerBg: 'bg-blue-50',
        headerBorder: 'border-blue-200',
        usColumnBg: 'bg-green-50',
        usColumnText: 'text-green-700',
        competitorText: 'text-gray-500',
        cardBorder: 'border-blue-200',
        cardShadow: 'shadow-md shadow-blue-100/50'
      },
      neutral: {
        headerBg: 'bg-gray-50',
        headerBorder: 'border-gray-200',
        usColumnBg: 'bg-green-50',
        usColumnText: 'text-green-700',
        competitorText: 'text-gray-500',
        cardBorder: 'border-gray-200',
        cardShadow: 'shadow-lg'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

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

  // Helper function to add a new property row (following StackedHighlights pattern)
  const addProperty = (properties: string, usValues: string, competitorValues: string): { newProperties: string; newUsValues: string; newCompetitorValues: string } => {
    const propertyList = parsePipeData(properties);
    const usValueList = parsePipeData(usValues);
    const competitorValueList = parsePipeData(competitorValues);

    // Add new property with default content
    propertyList.push('New Property');
    usValueList.push('Our advantage');
    competitorValueList.push('Their limitation');

    return {
      newProperties: propertyList.join('|'),
      newUsValues: usValueList.join('|'),
      newCompetitorValues: competitorValueList.join('|')
    };
  };

  // Helper function to remove a property row (following StackedHighlights pattern)
  const removeProperty = (properties: string, usValues: string, competitorValues: string, indexToRemove: number): { newProperties: string; newUsValues: string; newCompetitorValues: string } => {
    const propertyList = parsePipeData(properties);
    const usValueList = parsePipeData(usValues);
    const competitorValueList = parsePipeData(competitorValues);

    // Remove the property at the specified index
    if (indexToRemove >= 0 && indexToRemove < propertyList.length) {
      propertyList.splice(indexToRemove, 1);
    }
    if (indexToRemove >= 0 && indexToRemove < usValueList.length) {
      usValueList.splice(indexToRemove, 1);
    }
    if (indexToRemove >= 0 && indexToRemove < competitorValueList.length) {
      competitorValueList.splice(indexToRemove, 1);
    }

    return {
      newProperties: propertyList.join('|'),
      newUsValues: usValueList.join('|'),
      newCompetitorValues: competitorValueList.join('|')
    };
  };

  // Handle adding a new property
  const handleAddProperty = () => {
    const { newProperties, newUsValues, newCompetitorValues } = addProperty(blockContent.properties, blockContent.us_values, blockContent.competitors_values);
    handleContentUpdate('properties', newProperties);
    handleContentUpdate('us_values', newUsValues);
    handleContentUpdate('competitors_values', newCompetitorValues);
  };

  // Handle removing a property
  const handleRemoveProperty = (indexToRemove: number) => {
    const { newProperties, newUsValues, newCompetitorValues } = removeProperty(blockContent.properties, blockContent.us_values, blockContent.competitors_values, indexToRemove);
    handleContentUpdate('properties', newProperties);
    handleContentUpdate('us_values', newUsValues);
    handleContentUpdate('competitors_values', newCompetitorValues);
  };
  
  // Typography styles
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection sectionId={sectionId} sectionType="PropertyComparisonMatrix" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-4xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        
        <div className={`bg-white rounded-xl overflow-hidden border ${themeColors.cardBorder} ${themeColors.cardShadow}`}>
          <div className={`grid grid-cols-3 ${themeColors.headerBg} border-b ${themeColors.headerBorder}`}>
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
            <div key={index} className={`relative group/property-row-${index} grid grid-cols-3 border-b border-gray-100 last:border-b-0`}>
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
              <div style={bodyStyle} className="p-4 text-center text-gray-500 relative">
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

                {/* Delete button - only show in edit mode and if more than 1 property */}
                {mode !== 'preview' && properties.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProperty(index);
                    }}
                    className={`opacity-0 group-hover/property-row-${index}:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200`}
                    title="Remove this property"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Property Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && properties.length < 8 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAddProperty}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Property</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'PropertyComparisonMatrix', category: 'Unique Mechanism', description: 'Property comparison matrix vs competitors', defaultBackgroundType: 'neutral' as const };