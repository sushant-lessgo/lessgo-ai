// components/layout/IconGrid.tsx - ENHANCED with Dynamic Text Colors
// Production-ready feature grid with icons using abstraction system with background-aware text colors

import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
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

// Enhanced Individual Feature Card with Adaptive Colors
const FeatureCard = React.memo(({ 
  item, 
  mode, 
  colorTokens,
  dynamicTextColors,
  getTextStyle,
  onTitleEdit,
  onDescriptionEdit,
  sectionId,
  backgroundType,
  sectionBackground
}: {
  item: FeatureItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  dynamicTextColors: any;
  getTextStyle: (variant: string) => React.CSSProperties;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
}) => {
  
  // ✅ ENHANCED: Get card background based on section background
  const cardBackground = backgroundType === 'primary' 
    ? 'bg-white/10 backdrop-blur-sm border-white/20' 
    : 'bg-white border-gray-200';
    
  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : 'hover:border-blue-300 hover:shadow-lg';
  
  return (
    <div className={`group p-6 rounded-xl border ${cardBackground} ${cardHover} transition-all duration-300`}>
      {/* ✅ ENHANCED: Icon with Accent Colors */}
      <div className="mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorTokens.ctaBg || 'bg-blue-600'} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
          <FeatureIcon
            type={item.iconType}
            colorTokens={colorTokens}
            size="medium"
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>

      {/* ✅ ENHANCED: Title with Adaptive Text */}
      <EditableAdaptiveText
        mode={mode}
        value={item.title}
        onEdit={(value) => onTitleEdit(item.index, value)}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        variant="heading"
        textStyle={{
          ...getTextStyle('h4'),
          fontWeight: 600
        }}
        className="mb-3"
        placeholder="Feature title..."
        sectionId={sectionId}
        elementKey={`feature_title_${item.index}`}
        sectionBackground={sectionBackground}
      />

      {/* ✅ ENHANCED: Description with Adaptive Text */}
      <EditableAdaptiveText
        mode={mode}
        value={item.description}
        onEdit={(value) => onDescriptionEdit(item.index, value)}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        variant="body"
        textStyle={getTextStyle('body')}
        className="leading-relaxed opacity-90"
        placeholder="Describe this feature..."
        sectionId={sectionId}
        elementKey={`feature_description_${item.index}`}
        sectionBackground={sectionBackground}
      />
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export default function IconGrid(props: LayoutComponentProps) {
  
  console.log('🎯 IconGrid component rendering with props:', props);
  
  // ✅ ENHANCED: Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<IconGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  console.log('🎯 IconGrid hook result:', { sectionId, mode });

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

  // Force center alignment for headline - DIRECT DOM TARGETING
  useEffect(() => {
    const timer = setTimeout(() => {
      // Target the exact element we saw in the DOM
      const headlineElement = document.querySelector('h2[data-section-id="features"][data-element-key="headline"]');
      
      if (headlineElement) {
        const htmlElement = headlineElement as HTMLElement;
        htmlElement.style.setProperty('text-align', 'center', 'important');
        htmlElement.style.setProperty('display', 'block', 'important');
        
        // Also set it on the parent div
        const parentDiv = htmlElement.closest('.text-center');
        if (parentDiv) {
          (parentDiv as HTMLElement).style.setProperty('text-align', 'center', 'important');
        }
        
        console.log('✅ FORCED HEADLINE TO CENTER via direct DOM targeting');
      } else {
        console.log('❌ Still could not find headline element');
      }
    }, 1000); // Longer timeout
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IconGrid"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* ✅ ENHANCED: Main Headline with Dynamic Text Color */}
          <div className="text-center">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              textStyle={{
                ...getTextStyle('h2'),
                textAlign: 'center'
              }}
              className="mb-4 !text-center"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />
          </div>

          {/* ✅ ENHANCED: Subheadline with Dynamic Text Color */}
          {(blockContent.subheadline || mode === 'edit') && (
            <div style={{ textAlign: 'center' }}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...getTextStyle('body-lg'),
                  textAlign: 'center'
                }}
                className="max-w-3xl mx-auto"
                placeholder="Add optional subheadline to describe your features..."
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
                formatState={{
                  textAlign: 'center'
                }}
              />
            </div>
          )}
        </div>

        {/* ✅ ENHANCED: Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featureItems.map((item) => (
            <FeatureCard
              key={item.id}
              item={item}
              mode={mode}
              colorTokens={colorTokens}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              sectionId={sectionId}
              backgroundType={props.backgroundType || 'neutral'}
              sectionBackground={sectionBackground}
            />
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

// ✅ ENHANCED: Export metadata with adaptive color features
export const componentMeta = {
  name: 'IconGrid',
  category: 'Feature Sections',
  description: 'Feature grid with auto-selected icons and adaptive text colors for any background',
  tags: ['features', 'grid', 'icons', 'benefits', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Icons use generated accent colors from design system',
    'Cards adapt appearance based on section background',
    'Smooth hover animations and transitions',
    'Fully editable titles and descriptions',
    'Auto-selected icons based on content keywords',
    'Responsive grid layout'
  ],
  
  // Usage examples
  useCases: [
    'Product feature showcase on dark hero sections',
    'Service benefits with light backgrounds',
    'Platform capabilities on gradient backgrounds',
    'Tool features overview with brand colors',
    'Key benefits section with any background type'
  ]
};