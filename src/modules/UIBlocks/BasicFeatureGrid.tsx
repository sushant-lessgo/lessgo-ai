import React, { useEffect, useState } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface BasicFeatureGridProps extends LayoutComponentProps {}

// Feature comparison structure
interface Feature {
  name: string;
  description?: string;
  category: string;
  values: Record<string, boolean | string>;
}

interface Competitor {
  key: string;
  name: string;
  isPrimary?: boolean;
}

// Content interface for BasicFeatureGrid layout
interface BasicFeatureGridContent {
  headline: string;
  feature_names: string;
  competitor_names: string;
  your_product_name: string;
  subheadline?: string;
}

// Content schema for BasicFeatureGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'See How We Compare' },
  feature_names: { type: 'string' as const, default: 'Real-time Collaboration|Advanced Analytics|Custom Integrations|24/7 Support|Mobile App|API Access|White-label Options|Enterprise SSO' },
  competitor_names: { type: 'string' as const, default: 'Competitor A|Competitor B|Competitor C' },
  your_product_name: { type: 'string' as const, default: 'YourProduct' },
  subheadline: { type: 'string' as const, default: '' }
};

// Default feature categories and data structure
const parseFeatureData = (
  featureNames: string,
  competitorNames: string,
  yourProductName: string
): { features: Feature[], competitors: Competitor[] } => {
  const features = featureNames.split('|').map((name, index) => {
    // Default categories for common features
    const getCategory = (featureName: string) => {
      const lower = featureName.toLowerCase();
      if (lower.includes('collaboration') || lower.includes('team')) return 'Collaboration';
      if (lower.includes('analytics') || lower.includes('reporting')) return 'Analytics';
      if (lower.includes('integration') || lower.includes('api')) return 'Integrations';
      if (lower.includes('support') || lower.includes('help')) return 'Support';
      if (lower.includes('mobile') || lower.includes('app')) return 'Mobile';
      if (lower.includes('enterprise') || lower.includes('sso')) return 'Enterprise';
      if (lower.includes('custom') || lower.includes('white')) return 'Customization';
      return 'Core Features';
    };

    // Generate realistic comparison data
    const competitors = competitorNames.split('|');
    const values: Record<string, boolean | string> = {
      your_product: true, // Your product always has the feature
    };

    competitors.forEach((comp, compIndex) => {
      const key = `competitor_${compIndex + 1}`;
      // Vary the competition to show advantages
      if (index < 3) {
        values[key] = Math.random() > 0.3; // Most have basic features
      } else if (index < 6) {
        values[key] = Math.random() > 0.6; // Fewer have advanced features
      } else {
        values[key] = Math.random() > 0.8; // Very few have premium features
      }
    });

    return {
      name: name.trim(),
      category: getCategory(name),
      values
    };
  });

  const competitors: Competitor[] = [
    { key: 'your_product', name: yourProductName, isPrimary: true },
    ...competitorNames.split('|').map((name, index) => ({
      key: `competitor_${index + 1}`,
      name: name.trim()
    }))
  ];

  return { features, competitors };
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Feature value display component
const FeatureValue = ({ value, isPrimary }: { value: boolean | string, isPrimary: boolean }) => {
  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-center">
        {value ? (
          <svg 
            className={`w-5 h-5 ${isPrimary ? 'text-green-600' : 'text-green-500'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${isPrimary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
};

export default function BasicFeatureGrid({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: BasicFeatureGridProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: BasicFeatureGridContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse feature data
  const { features, competitors } = parseFeatureData(
    blockContent.feature_names,
    blockContent.competitor_names,
    blockContent.your_product_name
  );

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="BasicFeatureGrid"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p 
                className={`mb-6 max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">
                    Features
                  </th>
                  {competitors.map((competitor) => (
                    <th 
                      key={competitor.key}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        competitor.isPrimary 
                          ? 'bg-blue-50 text-blue-900 border-l-2 border-blue-500' 
                          : 'text-gray-900'
                      }`}
                    >
                      {competitor.isPrimary && (
                        <div className="inline-flex items-center mb-1">
                          <svg className="w-4 h-4 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Best</span>
                        </div>
                      )}
                      <div>
                        {mode === 'edit' && competitor.isPrimary ? (
                          <ModeWrapper
                            mode={mode}
                            sectionId={sectionId}
                            elementKey="your_product_name"
                            onEdit={(value) => handleContentUpdate('your_product_name', value)}
                          >
                            <span>{competitor.name}</span>
                          </ModeWrapper>
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
                {Object.entries(featuresByCategory).map(([category, categoryFeatures], categoryIndex) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="bg-gray-25">
                      <td 
                        colSpan={competitors.length + 1} 
                        className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border-t"
                      >
                        {category}
                      </td>
                    </tr>
                    
                    {/* Category Features */}
                    {categoryFeatures.map((feature, featureIndex) => (
                      <tr 
                        key={feature.name}
                        className={`border-b hover:bg-gray-50 ${featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{feature.name}</div>
                          {feature.description && (
                            <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                          )}
                        </td>
                        {competitors.map((competitor) => (
                          <td 
                            key={competitor.key}
                            className={`px-6 py-4 text-center ${
                              competitor.isPrimary ? 'bg-blue-25 border-l-2 border-blue-500' : ''
                            }`}
                          >
                            <FeatureValue 
                              value={feature.values[competitor.key]} 
                              isPrimary={competitor.isPrimary || false}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  BasicFeatureGrid - Edit comparison data
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Feature Names (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="feature_names"
                    onEdit={(value) => handleContentUpdate('feature_names', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs">
                      {blockContent.feature_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Competitor Names (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="competitor_names"
                    onEdit={(value) => handleContentUpdate('competitor_names', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs">
                      {blockContent.competitor_names}
                    </div>
                  </ModeWrapper>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}