// components/layout/IconGrid.tsx
// Production-ready feature grid with icons using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableHeadline, 
  EditableText 
} from '@/components/layout/EditableContent';
import { EditableList } from '@/components/layout/EditableList';
import { FeatureIcon } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface IconGridContent {
  headline: string;
  subheadline?: string;
  feature_titles: string;
  feature_descriptions: string;
}

// Feature item structure
interface FeatureItem {
  id: string;
  index: number;
  title: string;
  description: string;
  iconType: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Powerful Features Built for You' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Everything you need to streamline your workflow and boost productivity.' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Real-time Collaboration|Advanced Analytics|Smart Automation|Secure Data Protection|Custom Integrations|24/7 Support' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Work together seamlessly with your team in real-time, no matter where you are.|Get deep insights into your data with powerful analytics and reporting tools.|Automate repetitive tasks and workflows to save time and reduce errors.|Enterprise-grade security keeps your data safe with encryption and compliance.|Connect with your favorite tools through our extensive integration library.|Round-the-clock support from our expert team whenever you need help.' 
  }
};

// Parse feature data from pipe-separated strings
const parseFeatureData = (titles: string, descriptions: string): FeatureItem[] => {
  const titleList = parsePipeData(titles);
  const descriptionList = parsePipeData(descriptions);
  
  // Auto-select icon based on feature title
  const getIconType = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('collaboration') || lower.includes('team')) return 'collaboration';
    if (lower.includes('analytics') || lower.includes('reporting')) return 'chart';
    if (lower.includes('automation') || lower.includes('smart')) return 'lightning';
    if (lower.includes('security') || lower.includes('secure')) return 'shield';
    if (lower.includes('integration') || lower.includes('connect')) return 'integration';
    if (lower.includes('support') || lower.includes('help')) return 'support';
    return 'star'; // Default fallback
  };
  
  return titleList.map((title, index) => ({
    id: `feature-${index}`,
    index,
    title,
    description: descriptionList[index] || 'Feature description not provided.',
    iconType: getIconType(title)
  }));
};

// Individual Feature Card
const FeatureCard = React.memo(({ 
  item, 
  mode, 
  colorTokens,
  getTextStyle,
  onTitleEdit,
  onDescriptionEdit 
}: {
  item: FeatureItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
      {/* Icon */}
      <div className="mb-4">
        <FeatureIcon
          type={item.iconType}
          colorTokens={colorTokens}
          size="medium"
          className="group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Title */}
      <div className="mb-3">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleEdit(item.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold"
            style={getTextStyle('h4')}
          >
            {item.title}
          </div>
        ) : (
          <h3 
            className={`font-semibold ${colorTokens.textPrimary}`}
            style={getTextStyle('h4')}
          >
            {item.title}
          </h3>
        )}
      </div>

      {/* Description */}
      <div>
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(item.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 leading-relaxed"
            style={getTextStyle('body')}
          >
            {item.description}
          </div>
        ) : (
          <p 
            className={`${colorTokens.textSecondary} leading-relaxed`}
            style={getTextStyle('body')}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export default function IconGrid(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<IconGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse feature data
  const featureItems = parseFeatureData(blockContent.feature_titles, blockContent.feature_descriptions);

  // Handle individual title/description editing
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.feature_titles, index, value);
    handleContentUpdate('feature_titles', updatedTitles);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.feature_descriptions, index, value);
    handleContentUpdate('feature_descriptions', updatedDescriptions);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IconGrid"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
      editModeInfo={{
        componentName: 'IconGrid',
        description: 'Feature grid with icons, titles, and descriptions',
        tips: [
          'Icons are auto-selected based on feature titles',
          'Click on individual titles/descriptions to edit them directly',
          'Features are displayed in responsive grid layout'
        ]
      }}
    >
      <div className="max-w-7xl mx-auto">
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
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline..."
            />
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item) => (
            <FeatureCard
              key={item.id}
              item={item}
              mode={mode}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* Bulk Edit Interface */}
        <EditableList
          mode={mode}
          items={featureItems}
          onUpdateItem={(field, index, value) => {
            if (field === 'title') handleTitleEdit(index, value);
            if (field === 'description') handleDescriptionEdit(index, value);
          }}
          renderItem={() => null} // Items already rendered above
          bulkEditFields={[
            {
              key: 'feature_titles',
              label: 'Feature Titles',
              currentValue: blockContent.feature_titles,
              onUpdate: (value) => handleContentUpdate('feature_titles', value)
            },
            {
              key: 'feature_descriptions',
              label: 'Feature Descriptions',
              currentValue: blockContent.feature_descriptions,
              onUpdate: (value) => handleContentUpdate('feature_descriptions', value)
            }
          ]}
          listName="Feature Grid"
          tips={[
            'Icons are auto-selected based on feature titles',
            'You can edit individual features by clicking directly on them above'
          ]}
        />
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'IconGrid',
  category: 'Feature Sections',
  description: 'Feature grid with auto-selected icons, titles, and descriptions',
  tags: ['features', 'grid', 'icons', 'benefits'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true }
  ],
  
  // Usage examples
  useCases: [
    'Product feature showcase',
    'Service benefits section',
    'Platform capabilities',
    'Tool features overview'
  ]
};