// components/layout/BasicFeatureGrid.tsx
// Production-ready feature comparison grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableHeadline, 
  EditableText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface BasicFeatureGridContent {
  headline: string;
  subheadline?: string;
  feature_names: string;
  competitor_names: string;
  your_product_name: string;
}

// Feature comparison structure
interface Feature {
  id: string;
  index: number;
  name: string;
  values: Record<string, boolean>;
}

interface Competitor {
  key: string;
  name: string;
  isPrimary?: boolean;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See How We Stack Up' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Compare features side-by-side and see why customers choose us over the competition.' 
  },
  feature_names: { 
    type: 'string' as const, 
    default: 'Real-time Collaboration|Advanced Analytics|Custom Integrations|24/7 Support|Mobile App|API Access' 
  },
  competitor_names: { 
    type: 'string' as const, 
    default: 'Competitor A|Competitor B|Competitor C' 
  },
  your_product_name: { 
    type: 'string' as const, 
    default: 'YourProduct' 
  }
};

// Parse feature data from pipe-separated strings
const parseFeatureData = (
  featureNames: string,
  competitorNames: string,
  yourProductName: string
): { features: Feature[], competitors: Competitor[] } => {
  
  const names = parsePipeData(featureNames);
  const competitorList = parsePipeData(competitorNames);

  const features: Feature[] = names.map((name, index) => {
    const values: Record<string, boolean> = {
      your_product: true, // Your product always has the feature
    };

    // Generate realistic comparison data - strategic advantage
    competitorList.forEach((comp, compIndex) => {
      const key = `competitor_${compIndex + 1}`;
      values[key] = Math.random() > (0.3 + index * 0.1); // Fewer competitors have advanced features
    });

    return {
      id: `feature-${index}`,
      index,
      name: name.trim(),
      values
    };
  });

  const competitors: Competitor[] = [
    { key: 'your_product', name: yourProductName, isPrimary: true },
    ...competitorList.map((name, index) => ({
      key: `competitor_${index + 1}`,
      name: name.trim()
    }))
  ];

  return { features, competitors };
};

// Simple feature value display
const FeatureValue = React.memo(({ 
  value, 
  isPrimary, 
  colorTokens 
}: { 
  value: boolean;
  isPrimary: boolean;
  colorTokens: any;
}) => (
  <div className="flex justify-center">
    {value ? (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPrimary ? colorTokens.ctaBg + ' text-white' : 'bg-green-100 text-green-600'}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </div>
));
FeatureValue.displayName = 'FeatureValue';

export default function BasicFeatureGrid(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<BasicFeatureGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse feature data
  const { features, competitors } = parseFeatureData(
    blockContent.feature_names,
    blockContent.competitor_names,
    blockContent.your_product_name
  );

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BasicFeatureGrid"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            colorClass={colorTokens.textOnLight || colorTokens.textPrimary}
            textStyle={getTextStyle('h1')}
            className="mb-4"
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              colorClass={colorTokens.textSecondary}
              textStyle={getTextStyle('body-lg')}
              className="max-w-3xl mx-auto"
              placeholder="Add a subheadline explaining your competitive advantages..."
            />
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className={colorTokens.surfaceElevated + ' border-b border-gray-200'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${colorTokens.textPrimary} w-1/3`}>
                    Features
                  </th>
                  {competitors.map((competitor) => (
                    <th 
                      key={competitor.key}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        competitor.isPrimary 
                          ? colorTokens.ctaBg.replace('bg-', 'bg-') + '/10 ' + colorTokens.textOnLight + ' border-l-4 ' + colorTokens.ctaBg.replace('bg-', 'border-')
                          : colorTokens.textPrimary
                      }`}
                    >
                      {competitor.isPrimary && (
                        <div className="flex items-center justify-center mb-2">
                          <span className={`text-xs ${colorTokens.ctaBg} text-white px-3 py-1 rounded-full font-semibold`}>
                            Recommended
                          </span>
                        </div>
                      )}
                      <div className="font-semibold">
                        {mode === 'edit' && competitor.isPrimary ? (
                          <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleContentUpdate('your_product_name', e.currentTarget.textContent || '')}
                            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-white/50"
                          >
                            {competitor.name}
                          </div>
                        ) : (
                          competitor.name
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {features.map((feature, featureIndex) => (
                  <tr 
                    key={feature.id}
                    className={`border-b border-gray-100 hover:${colorTokens.surfaceElevated} transition-colors duration-150 ${
                      featureIndex % 2 === 0 ? 'bg-white' : colorTokens.surfaceElevated
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className={`font-medium ${colorTokens.textPrimary}`}>
                        {feature.name}
                      </div>
                    </td>
                    {competitors.map((competitor) => (
                      <td 
                        key={competitor.key}
                        className={`px-6 py-4 text-center ${
                          competitor.isPrimary ? colorTokens.ctaBg.replace('bg-', 'bg-') + '/5 border-l-4 ' + colorTokens.ctaBg.replace('bg-', 'border-') : ''
                        }`}
                      >
                        <FeatureValue 
                          value={feature.values[competitor.key]} 
                          isPrimary={competitor.isPrimary || false}
                          colorTokens={colorTokens}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center space-x-4 px-6 py-3 ${colorTokens.surfaceElevated} rounded-lg`}>
            <span className={`text-sm ${colorTokens.textSecondary}`}>
              Comparing {features.length} features across {competitors.length} solutions
            </span>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'BasicFeatureGrid',
  category: 'Comparison Sections',
  description: 'Feature comparison table showing competitive advantages',
  tags: ['comparison', 'features', 'competitive', 'table'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'your_product_name', label: 'Your Product Name', type: 'text', required: true },
    { key: 'feature_names', label: 'Feature Names (pipe separated)', type: 'textarea', required: true },
    { key: 'competitor_names', label: 'Competitor Names (pipe separated)', type: 'text', required: true }
  ],
  
  // Usage examples
  useCases: [
    'SaaS feature comparison',
    'Product specification tables',
    'Service comparison pages',
    'Competitive analysis sections'
  ]
};