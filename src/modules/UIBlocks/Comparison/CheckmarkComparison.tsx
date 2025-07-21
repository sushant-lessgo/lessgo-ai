import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface CheckmarkComparisonContent {
  headline: string;
  subheadline?: string;
  column_headers: string;
  feature_labels: string;
  column_features: string;
  highlight_column?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See How We Compare' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'A transparent look at how our solution stacks up against alternatives.' 
  },
  column_headers: { 
    type: 'string' as const, 
    default: 'DIY Solutions|Freelancers|Agencies|Our Platform' 
  },
  feature_labels: { 
    type: 'string' as const, 
    default: 'Cost-effective pricing|Instant deployment|24/7 availability|Unlimited revisions|Built-in analytics|No contracts required|Expert support|Automatic updates' 
  },
  column_features: { 
    type: 'string' as const, 
    default: 'n,n,n,n,y,y,n,n|y,n,n,n,n,n,n,n|n,y,y,n,y,n,y,n|y,y,y,y,y,y,y,y' 
  },
  highlight_column: { 
    type: 'string' as const, 
    default: '3' 
  }
};

// CheckmarkComparison component - Classic feature comparison table with checkmarks
export default function CheckmarkComparison({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: LayoutComponentProps) {
  const {
    content,
    fonts,
    colorTokens,
    mode,
    handleContentUpdate,
    handleListUpdate
  } = useLayoutComponent(sectionId);

  // Extract content with defaults
  const blockContent: CheckmarkComparisonContent = Object.entries(CONTENT_SCHEMA).reduce((acc, [key, schema]) => {
    acc[key] = content?.[key] || schema.default;
    return acc;
  }, {} as CheckmarkComparisonContent);

  // Parse comparison data
  const columnHeaders = parsePipeData(blockContent.column_headers);
  const featureLabels = parsePipeData(blockContent.feature_labels);
  const columnFeatures = blockContent.column_features.split('|').map(col => col.split(','));
  const highlightIndex = parseInt(blockContent.highlight_column || '3');

  // Update handlers for lists
  const handleColumnHeaderUpdate = (index: number, value: string) => {
    handleListUpdate(columnHeaders, index, value, 'column_headers');
  };

  const handleFeatureLabelUpdate = (index: number, value: string) => {
    handleListUpdate(featureLabels, index, value, 'feature_labels');
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      className={className}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            content={blockContent.headline}
            mode={mode}
            onUpdate={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            fonts={fonts}
            colorTokens={colorTokens}
            variant="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              content={blockContent.subheadline || 'Add subheadline...'}
              mode={mode}
              onUpdate={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-3xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              fonts={fonts}
              colorTokens={colorTokens}
              variant="body-lg"
            />
          )}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`text-left p-4 border-b ${colorTokens.borderColor}`}>
                  <span className={colorTokens.textPrimary} style={fonts.body}>Features</span>
                </th>
                {columnHeaders.map((header, index) => (
                  <th 
                    key={index} 
                    className={`text-center p-4 border-b ${colorTokens.borderColor} ${
                      index === highlightIndex ? `${colorTokens.bgAccent} rounded-t-lg` : ''
                    }`}
                  >
                    {mode === 'edit' ? (
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleColumnHeaderUpdate(index, e.target.value)}
                        className={`w-full text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${
                          index === highlightIndex ? 'text-white font-semibold' : colorTokens.textPrimary
                        }`}
                        style={fonts.body}
                      />
                    ) : (
                      <span 
                        className={index === highlightIndex ? 'text-white font-semibold' : colorTokens.textPrimary}
                        style={fonts.body}
                      >
                        {header}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureLabels.map((label, rowIndex) => (
                <tr key={rowIndex} className={`border-b ${colorTokens.borderColor}`}>
                  <td className="p-4">
                    {mode === 'edit' ? (
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleFeatureLabelUpdate(rowIndex, e.target.value)}
                        className={`w-full bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 ${colorTokens.textSecondary}`}
                        style={fonts.body}
                      />
                    ) : (
                      <span className={colorTokens.textSecondary} style={fonts.body}>
                        {label}
                      </span>
                    )}
                  </td>
                  {columnHeaders.map((_, colIndex) => {
                    const hasFeature = columnFeatures[colIndex]?.[rowIndex] === 'y';
                    return (
                      <td 
                        key={colIndex} 
                        className={`text-center p-4 ${
                          colIndex === highlightIndex ? `${colorTokens.bgAccent} bg-opacity-10` : ''
                        }`}
                      >
                        {hasFeature ? (
                          <svg className={`w-6 h-6 mx-auto ${colIndex === highlightIndex ? colorTokens.textAccent : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LayoutSection>
  );
}