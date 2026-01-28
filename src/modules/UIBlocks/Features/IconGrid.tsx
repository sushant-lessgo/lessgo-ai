// components/layout/IconGrid.tsx - V2: Clean array-based features
// Production-ready feature grid with icons using unified icon system with background-aware text colors

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIcon } from '@/lib/getIcon';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Feature item structure - clean array item
interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// V2: Content interface - uses clean arrays
interface IconGridContent {
  headline: string;
  subheadline?: string;
  features: Feature[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Powerful Features Built for You'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Everything you need to streamline your workflow and boost productivity.'
  },
  features: {
    type: 'array' as const,
    default: [
      { id: 'f1', title: 'Real-time Collaboration', description: 'Work together seamlessly with your team in real-time, no matter where you are.' },
      { id: 'f2', title: 'Advanced Analytics', description: 'Get deep insights into your data with powerful analytics and reporting tools.' },
      { id: 'f3', title: 'Smart Automation', description: 'Automate repetitive tasks and workflows to save time and reduce errors.' },
      { id: 'f4', title: 'Secure Data Protection', description: 'Enterprise-grade security keeps your data safe with encryption and compliance.' },
      { id: 'f5', title: 'Custom Integrations', description: 'Connect with your favorite tools through our extensive integration library.' },
      { id: 'f6', title: '24/7 Support', description: 'Round-the-clock support from our expert team whenever you need help.' }
    ]
  }
};

// Enhanced Individual Feature Card with Adaptive Colors
const FeatureCard = React.memo(({
  feature,
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
  canRemove = true,
  theme = 'neutral'
}: {
  feature: Feature;
  mode: 'edit' | 'preview';
  colorTokens: any;
  dynamicTextColors: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onTitleEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit?: (id: string, value: string) => void;
  onRemoveFeature?: (id: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  canRemove?: boolean;
  theme?: UIBlockTheme;
}) => {
  // Get icon - use stored value or derive from title/description
  const displayIcon = feature.icon ?? getIcon(undefined, { title: feature.title, description: feature.description }) ?? '⭐';

  // Get card background based on section background
  const cardBackground = backgroundType === 'primary'
    ? 'bg-white/10 backdrop-blur-sm border-white/20'
    : 'bg-white border-gray-200';

  const cardHover = backgroundType === 'primary'
    ? 'hover:bg-white/20 hover:border-white/30'
    : `hover:border-${theme === 'warm' ? 'orange' : theme === 'cool' ? 'blue' : 'slate'}-300`;

  return (
    <div className={`group relative p-6 rounded-xl border ${cardBackground} ${cardHover} ${shadows.card[theme]} ${shadows.cardHover[theme]} ${cardEnhancements.hoverLift} ${cardEnhancements.transition}`}>
      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveFeature && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFeature(feature.id);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
          title="Remove this feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Icon */}
      <div className="mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${theme === 'warm' ? 'bg-orange-500' : theme === 'cool' ? 'bg-blue-500' : 'bg-slate-500'} bg-opacity-10 group-hover:bg-opacity-20 group-hover:scale-110 transition-all duration-300`}>
          <IconEditableText
            mode={mode}
            value={displayIcon}
            onEdit={(value) => onIconEdit && onIconEdit(feature.id, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="md"
            className="text-2xl group-hover:scale-110 transition-transform duration-300"
            placeholder="🎯"
            sectionId={sectionId}
            elementKey={`feature_icon_${feature.id}`}
          />
        </div>
      </div>

      {/* Title */}
      <EditableAdaptiveText
        mode={mode}
        value={feature.title}
        onEdit={(value) => onTitleEdit(feature.id, value)}
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
        elementKey={`feature_title_${feature.id}`}
        sectionBackground={sectionBackground}
      />

      {/* Description */}
      <EditableAdaptiveText
        mode={mode}
        value={feature.description}
        onEdit={(value) => onDescriptionEdit(feature.id, value)}
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
        colorTokens={colorTokens}
        variant="body"
        className="leading-relaxed opacity-90"
        placeholder="Describe this feature..."
        sectionId={sectionId}
        elementKey={`feature_description_${feature.id}`}
        sectionBackground={sectionBackground}
      />
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export default function IconGrid(props: LayoutComponentProps) {
  // Use the abstraction hook with background type support
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

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // V2: Direct array access
  const features = blockContent.features || [];

  // V2: Handle title editing - update array item
  const handleTitleEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, title: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle description editing - update array item
  const handleDescriptionEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, description: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle icon editing - update array item
  const handleIconEdit = (id: string, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === id ? { ...f, icon: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // V2: Handle adding a new feature - simple array push
  const handleAddFeature = () => {
    if (features.length < 9) {
      const newFeature: Feature = {
        id: `f${Date.now()}`,
        title: 'New Feature',
        description: 'Describe this feature and its benefits for your users.'
      };
      (handleContentUpdate as any)('features', [...features, newFeature]);
    }
  };

  // V2: Handle removing a feature - simple array filter
  const handleRemoveFeature = (id: string) => {
    const updatedFeatures = features.filter(f => f.id !== id);
    (handleContentUpdate as any)('features', updatedFeatures);
  };

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
          {/* Main Headline */}
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

          {/* Subheadline */}
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
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
              canRemove={features.length > 1}
              theme={theme}
            />
          ))}
        </div>

        {/* Add Feature Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && features.length < 9 && (
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

// Export metadata with V2 schema info
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
      "Edit individual feature titles and descriptions inline",
      "Modify the headline and subheadline for section introduction",
      "Icons are automatically selected based on feature content",
      "Switch to a flexible content section for custom elements"
    ]
  },

  // V2: Schema for component generation tools - uses clean arrays
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'features', label: 'Features (array)', type: 'array', required: true }
  ],

  // Features
  features: [
    'Automatic text color adaptation based on background type',
    'Icons use generated accent colors from design system',
    'Cards adapt appearance based on section background',
    'Smooth hover animations and transitions',
    'Fully editable titles and descriptions',
    'Auto-selected icons based on content keywords',
    'Responsive grid layout',
    'V2: Clean array-based data format'
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
