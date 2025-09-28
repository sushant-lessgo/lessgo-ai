// components/layout/IconGrid.tsx - ENHANCED with Dynamic Text Colors
// Production-ready feature grid with icons using abstraction system with background-aware text colors

import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { getRandomIconFromCategory } from '@/utils/iconMapping';

// Content interface for type safety
interface IconGridContent {
  headline: string;
  subheadline?: string;
  feature_titles: string;
  feature_descriptions: string;
  // Feature icons with smart defaults
  icon_1?: string;
  icon_2?: string;
  icon_3?: string;
  icon_4?: string;
  icon_5?: string;
  icon_6?: string;
  icon_7?: string;
  icon_8?: string;
  icon_9?: string;
}

// Feature item structure
interface FeatureItem {
  id: string;
  index: number;
  title: string;
  description: string;
  iconType: string;
  icon?: string; // Editable icon (uses auto-selected as default)
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
  },
  // Feature icons with smart defaults
  icon_1: { type: 'string' as const, default: '🤝' },
  icon_2: { type: 'string' as const, default: '📊' },
  icon_3: { type: 'string' as const, default: '⚡' },
  icon_4: { type: 'string' as const, default: '🔒' },
  icon_5: { type: 'string' as const, default: '🔗' },
  icon_6: { type: 'string' as const, default: '💬' },
  icon_7: { type: 'string' as const, default: '🎯' },
  icon_8: { type: 'string' as const, default: '✨' },
  icon_9: { type: 'string' as const, default: '🚀' }
};

// Helper function to check if a value is a valid icon (emoji or simple icon character)
const isValidIcon = (value: string): boolean => {
  // Check if it's an emoji (basic check) or common icon characters
  const iconPattern = /^[\u{1F300}-\u{1F9FF}]|^[🤝📊⚡🔒🔗💬⭐🎯✨🚀💡🔥💎🏆🎨🔧⚙️🌟💪🎪⚽🏀🎾🎳🎲🎭🎪🎨🎬🎤🎧🎼🎹🥁🎺🎸🎻💰🎉🔔✅]|^[⭐✅✨🔔🔥🚀💡💎🌟⚙️🔧]$/u;
  return iconPattern.test(value) || value.length <= 2;
};

// Auto-select emoji icon based on feature title - Enhanced with more categories
const getContextualIcon = (title: string): string => {
  const lower = title.toLowerCase();

  // Collaboration & Team
  if (lower.includes('collaboration') || lower.includes('team') || lower.includes('together') || lower.includes('shared')) return '🤝';

  // Analytics & Data
  if (lower.includes('analytics') || lower.includes('reporting') || lower.includes('data') || lower.includes('insights') || lower.includes('metrics')) return '📊';

  // Automation & AI
  if (lower.includes('automation') || lower.includes('smart') || lower.includes('ai') || lower.includes('intelligent') || lower.includes('auto')) return '⚡';

  // Security & Protection
  if (lower.includes('security') || lower.includes('secure') || lower.includes('protection') || lower.includes('safe') || lower.includes('encrypt')) return '🔒';

  // Integration & Connectivity
  if (lower.includes('integration') || lower.includes('connect') || lower.includes('api') || lower.includes('sync') || lower.includes('link')) return '🔗';

  // Support & Help
  if (lower.includes('support') || lower.includes('help') || lower.includes('assistance') || lower.includes('service') || lower.includes('care')) return '💬';

  // Performance & Speed
  if (lower.includes('fast') || lower.includes('speed') || lower.includes('performance') || lower.includes('boost') || lower.includes('quick')) return '🚀';

  // Innovation & Ideas
  if (lower.includes('innovation') || lower.includes('creative') || lower.includes('idea') || lower.includes('solution') || lower.includes('breakthrough')) return '💡';

  // Success & Achievement
  if (lower.includes('success') || lower.includes('achievement') || lower.includes('winner') || lower.includes('award') || lower.includes('best')) return '🏆';

  // Growth & Scale
  if (lower.includes('growth') || lower.includes('scale') || lower.includes('expand') || lower.includes('increase') || lower.includes('revenue')) return '📈';

  // Quality & Excellence
  if (lower.includes('quality') || lower.includes('premium') || lower.includes('excellence') || lower.includes('professional') || lower.includes('enterprise')) return '💎';

  // Efficiency & Productivity
  if (lower.includes('efficiency') || lower.includes('productivity') || lower.includes('optimize') || lower.includes('streamline') || lower.includes('workflow')) return '⚙️';

  // Communication & Messaging
  if (lower.includes('communication') || lower.includes('message') || lower.includes('chat') || lower.includes('notify') || lower.includes('alert')) return '💬';

  // Money & Finance
  if (lower.includes('money') || lower.includes('cost') || lower.includes('save') || lower.includes('profit') || lower.includes('pricing')) return '💰';

  // Time & Schedule
  if (lower.includes('time') || lower.includes('schedule') || lower.includes('calendar') || lower.includes('deadline') || lower.includes('reminder')) return '⏰';

  // Design & Customization
  if (lower.includes('design') || lower.includes('custom') || lower.includes('visual') || lower.includes('interface') || lower.includes('theme')) return '🎨';

  // Tools & Utilities
  if (lower.includes('tool') || lower.includes('utility') || lower.includes('feature') || lower.includes('function') || lower.includes('capability')) return '🔧';

  return '⭐'; // Default fallback
};

// Legacy function for backwards compatibility
const getDefaultIcon = (title: string): string => {
  return getContextualIcon(title);
};

// Parse feature data from pipe-separated strings with icon support
const parseFeatureData = (titles: string, descriptions: string, blockContent: IconGridContent): FeatureItem[] => {
  const titleList = parsePipeData(titles);
  const descriptionList = parsePipeData(descriptions);

  // Get saved icons or use smart defaults
  const icons = [
    blockContent.icon_1,
    blockContent.icon_2,
    blockContent.icon_3,
    blockContent.icon_4,
    blockContent.icon_5,
    blockContent.icon_6,
    blockContent.icon_7,
    blockContent.icon_8,
    blockContent.icon_9
  ];

  return titleList.map((title, index) => ({
    id: `feature-${index}`,
    index,
    title,
    description: descriptionList[index] || 'Feature description not provided.',
    iconType: '', // No longer needed
    icon: getValidatedIcon(icons[index], title) // Use validated icon or contextual fallback
  }));
};

// Helper function to get validated icon or contextual fallback
const getValidatedIcon = (iconValue: string | undefined, title: string): string => {
  // If we have an icon value and it's valid, use it
  if (iconValue && isValidIcon(iconValue)) {
    return iconValue;
  }

  // Otherwise, get contextual icon based on title
  return getContextualIcon(title);
};

// Helper function to add a new feature
const addFeature = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Add new feature with default content
  titleList.push('New Feature');
  descriptionList.push('Describe this feature and its benefits for your users.');

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a feature
const removeFeature = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Remove the feature at the specified index
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
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
  onIconEdit,
  onRemoveFeature,
  sectionId,
  backgroundType,
  sectionBackground,
  canRemove = true
}: {
  item: FeatureItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  dynamicTextColors: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onIconEdit?: (index: number, value: string) => void;
  onRemoveFeature?: (index: number) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  canRemove?: boolean;
}) => {
  
  // ✅ ENHANCED: Get card background based on section background
  const cardBackground = backgroundType === 'primary' 
    ? 'bg-white/10 backdrop-blur-sm border-white/20' 
    : 'bg-white border-gray-200';
    
  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : 'hover:border-blue-300 hover:shadow-lg';
  
  return (
    <div className={`group/feature-${item.index} relative p-6 rounded-xl border ${cardBackground} ${cardHover} transition-all duration-300`}>
      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveFeature && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFeature(item.index);
          }}
          className={`absolute top-4 right-4 opacity-0 group-hover/feature-${item.index}:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200`}
          title="Remove this feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* ✅ ENHANCED: Fully Editable Icon */}
      <div className="mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorTokens.ctaBg || 'bg-blue-600'} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
          <IconEditableText
            mode={mode}
            value={item.icon || '⭐'}
            onEdit={(value) => onIconEdit && onIconEdit(item.index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="md"
            className="text-2xl group-hover:scale-110 transition-transform duration-300"
            placeholder="🎯"
            sectionId={sectionId}
            elementKey={`icon_${item.index + 1}`}
          />
        </div>
      </div>

      {/* ✅ ENHANCED: Title with Adaptive Text */}
      <EditableAdaptiveText
        mode={mode}
        value={item.title}
        onEdit={(value) => onTitleEdit(item.index, value)}
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
        colorTokens={colorTokens}
        variant="body"
        textStyle={{
          ...getTextStyle('h3'),
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
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
        colorTokens={colorTokens}
        variant="body"
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
  

  // Parse feature data
  const featureItems = parseFeatureData(blockContent.feature_titles, blockContent.feature_descriptions, blockContent);

  // Handle individual title/description editing
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.feature_titles, index, value);
    handleContentUpdate('feature_titles', updatedTitles);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.feature_descriptions, index, value);
    handleContentUpdate('feature_descriptions', updatedDescriptions);
  };

  // Handle icon editing
  const handleIconEdit = (index: number, value: string) => {
    const iconField = `icon_${index + 1}` as keyof IconGridContent;
    handleContentUpdate(iconField, value);
  };

  // Handle adding a new feature
  const handleAddFeature = () => {
    const { newTitles, newDescriptions } = addFeature(blockContent.feature_titles, blockContent.feature_descriptions);
    handleContentUpdate('feature_titles', newTitles);
    handleContentUpdate('feature_descriptions', newDescriptions);

    // Add a smart icon for the new feature
    const newFeatureCount = newTitles.split('|').length;
    const iconField = `icon_${newFeatureCount}` as keyof IconGridContent;
    if (newFeatureCount <= 9) {
      // Use random icon from features category for new features
      const defaultIcon = getRandomIconFromCategory('features');
      handleContentUpdate(iconField, defaultIcon);
    }
  };

  // Handle removing a feature
  const handleRemoveFeature = (indexToRemove: number) => {
    const { newTitles, newDescriptions } = removeFeature(blockContent.feature_titles, blockContent.feature_descriptions, indexToRemove);
    handleContentUpdate('feature_titles', newTitles);
    handleContentUpdate('feature_descriptions', newDescriptions);

    // Shift icon fields to maintain order
    const icons = [
      blockContent.icon_1,
      blockContent.icon_2,
      blockContent.icon_3,
      blockContent.icon_4,
      blockContent.icon_5,
      blockContent.icon_6,
      blockContent.icon_7,
      blockContent.icon_8,
      blockContent.icon_9
    ];

    // Remove the icon at the specified index and shift remaining icons
    icons.splice(indexToRemove, 1);
    icons.push(''); // Add empty at the end

    // Update all icon fields
    icons.forEach((icon, index) => {
      const iconField = `icon_${index + 1}` as keyof IconGridContent;
      handleContentUpdate(iconField, icon || '');
    });
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
        
      } else {
      }
    }, 1000); // Longer timeout
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IconGrid"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              onIconEdit={handleIconEdit}
              onRemoveFeature={handleRemoveFeature}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              canRemove={featureItems.length > 1}
            />
          ))}
        </div>

        {/* Add Feature Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && featureItems.length < 9 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddFeature}
              className="inline-flex items-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Feature</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// ✅ ENHANCED: Export metadata with adaptive color features and element restrictions
export const componentMeta = {
  name: 'IconGrid',
  category: 'Feature Sections',
  description: 'Feature grid with auto-selected icons and adaptive text colors for any background',
  tags: ['features', 'grid', 'icons', 'benefits', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // Element restriction information
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Icon grid layouts use precise 3-column arrangements with structured feature data that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit the feature_titles and feature_descriptions using pipe-separated format",
      "Modify the headline and subheadline for section introduction",
      "Icons are automatically selected based on feature titles",
      "Switch to a flexible content section for custom elements"
    ]
  },
  
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
    'Responsive grid layout',
    'Structured content format prevents layout conflicts'
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