import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface ToggleableComparisonContent {
  headline: string;
  subheadline?: string;
  option_labels: string;
  feature_categories: string;
  feature_items: string;
  option_features: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Choose the Right Solution for Your Needs' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Toggle between options to see detailed feature comparisons.' 
  },
  option_labels: { 
    type: 'string' as const, 
    default: 'Basic Plan|Professional|Enterprise' 
  },
  feature_categories: { 
    type: 'string' as const, 
    default: 'Core Features|Advanced Tools|Support & Security' 
  },
  feature_items: { 
    type: 'string' as const, 
    default: 'User management,Task automation,Basic reporting|API access,Custom workflows,Advanced analytics|24/7 support,SSO & SAML,Compliance tools' 
  },
  option_features: { 
    type: 'string' as const, 
    default: 'y,y,y,n,n,n,n,n,n|y,y,y,y,y,y,y,n,n|y,y,y,y,y,y,y,y,y' 
  }
};

// ToggleableComparison component - Interactive comparison with toggle between options
export default function ToggleableComparison(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  
  const { 
    mode, 
    blockContent, 
    colorTokens, 
    getTextStyle, 
    sectionBackground, 
    handleContentUpdate 
  } = useLayoutComponent<ToggleableComparisonContent>({ 
    ...props, 
    contentSchema: CONTENT_SCHEMA 
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();
  const [activeOption, setActiveOption] = useState(0);
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

  // Parse data
  const optionLabels = parsePipeData(blockContent.option_labels);
  const featureCategories = parsePipeData(blockContent.feature_categories);
  const featureItemsRaw = blockContent.feature_items.split('|');
  const optionFeatures = blockContent.option_features.split('|').map(opt => opt.split(','));

  // Parse feature items by category
  const featuresByCategory = featureCategories.map((category, index) => ({
    category,
    items: featureItemsRaw[index]?.split(',') || []
  }));

  // Update handlers
  const handleOptionLabelUpdate = (index: number, value: string) => {
    const newLabels = [...optionLabels];
    newLabels[index] = value;
    handleContentUpdate('option_labels', newLabels.join('|'));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ToggleableComparison"
      backgroundType={backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={className}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            mode={mode}
            level="h1"
            backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
            sectionBackground={sectionBackground}
            colorTokens={colorTokens}
            className="mb-4"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              value={blockContent.subheadline || 'Add subheadline...'}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              mode={mode}
              backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
              variant="body"
              sectionBackground={sectionBackground}
              colorTokens={colorTokens}
              className={`max-w-2xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
            />
          )}
        </div>

        {/* Toggle Options */}
        <div className="flex justify-center mb-8">
          <div className={`inline-flex rounded-lg p-1 ${colorTokens.bgNeutral} border border-gray-200`}>
            {optionLabels.map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveOption(index)}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeOption === index
                    ? `bg-primary text-white`
                    : `${colorTokens.textSecondary} hover:${colorTokens.textPrimary}`
                }`}
              >
                {mode !== 'preview' ? (
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleOptionLabelUpdate(index, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                  />
                ) : (
                  label
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="space-y-8">
          {featuresByCategory.map((category, categoryIndex) => {
            let featureStartIndex = 0;
            for (let i = 0; i < categoryIndex; i++) {
              featureStartIndex += featuresByCategory[i].items.length;
            }

            return (
              <div key={categoryIndex}>
                <h3 
                  style={h3Style}
                  className={`font-semibold mb-4 ${colorTokens.textPrimary}`}
                >
                  {category.category}
                </h3>
                
                <div className={`rounded-lg ${colorTokens.bgNeutral} p-6`}>
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => {
                      const globalIndex = featureStartIndex + itemIndex;
                      const hasFeature = optionFeatures[activeOption]?.[globalIndex] === 'y';
                      
                      return (
                        <div key={itemIndex} className="flex items-center justify-between">
                          <span style={bodyStyle} className={colorTokens.textSecondary}>
                            {item}
                          </span>
                          
                          {hasFeature ? (
                            <div className="flex items-center">
                              <svg className={`w-5 h-5 text-primary mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span style={bodyStyle} className={`text-primary font-medium`}>
                                Included
                              </span>
                            </div>
                          ) : (
                            <span style={bodyStyle} className="text-gray-400">
                              Not available
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA for active option */}
        <div className="text-center mt-12">
          <button className={`bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
            <span style={bodyStyle}>
              Get Started with {optionLabels[activeOption]}
            </span>
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}