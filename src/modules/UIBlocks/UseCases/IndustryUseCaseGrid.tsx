// components/layout/IndustryUseCaseGrid.tsx - V2: Clean array-based industries
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIcon } from '@/lib/getIcon';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Industry item structure - clean array item
interface Industry {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// V2: Content interface - uses clean arrays
interface IndustryUseCaseGridContent {
  headline: string;
  subheadline?: string;
  industries: Industry[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Trusted Across Industries'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  industries: {
    type: 'array' as const,
    default: [
      { id: 'ind1', name: 'Healthcare', description: 'Patient data management and treatment optimization' },
      { id: 'ind2', name: 'Finance', description: 'Risk assessment and fraud detection' },
      { id: 'ind3', name: 'Manufacturing', description: 'Quality control and supply chain optimization' },
      { id: 'ind4', name: 'Retail', description: 'Customer analytics and inventory management' }
    ]
  }
};

// Industry Card component
const IndustryCard = React.memo(({
  industry,
  mode,
  colorTokens,
  getTextStyle,
  onNameEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemoveIndustry,
  sectionId,
  backgroundType,
  sectionBackground,
  canRemove = true,
  theme = 'neutral'
}: {
  industry: Industry;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onNameEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit?: (id: string, value: string) => void;
  onRemoveIndustry?: (id: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  canRemove?: boolean;
  theme?: UIBlockTheme;
}) => {
  // Get icon - use stored value or derive from name/description
  const displayIcon = industry.icon ?? getIcon(undefined, { title: industry.name, description: industry.description }) ?? 'lucide:building-2';

  // Theme-based color mapping
  const themeColors = {
    warm: {
      cardBorder: 'border-orange-200',
      cardHover: 'hover:border-orange-300',
      iconBg: 'bg-orange-50',
      iconText: 'text-orange-600'
    },
    cool: {
      cardBorder: 'border-blue-200',
      cardHover: 'hover:border-blue-300',
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600'
    },
    neutral: {
      cardBorder: 'border-gray-200',
      cardHover: 'hover:border-gray-300',
      iconBg: 'bg-gray-50',
      iconText: 'text-gray-600'
    }
  }[theme];

  return (
    <div className={`group relative bg-white p-8 rounded-xl border ${themeColors.cardBorder} ${themeColors.cardHover} ${shadows.card[theme]} ${shadows.cardHover[theme]} ${cardEnhancements.hoverLift} ${cardEnhancements.transition}`}>
      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveIndustry && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveIndustry(industry.id);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
          title="Remove this industry"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Icon Container - Circular */}
      <div className={`${themeColors.iconBg} ${themeColors.iconText} p-6 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-6`}>
        <IconEditableText
          mode={mode}
          value={displayIcon}
          onEdit={(value) => onIconEdit && onIconEdit(industry.id, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          iconSize="xl"
          className="text-6xl"
          placeholder="lucide:building-2"
          sectionId={sectionId}
          elementKey={`industry_icon_${industry.id}`}
        />
      </div>

      {/* Industry Name */}
      <div className="mb-4 text-center">
        <EditableAdaptiveText
          mode={mode}
          value={industry.name}
          onEdit={(value) => onNameEdit(industry.id, value)}
          backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'neutral')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{
            ...getTextStyle('h3'),
            fontWeight: 700,
            textAlign: 'center'
          }}
          placeholder="Industry name"
          sectionBackground={sectionBackground}
          sectionId={sectionId}
          elementKey={`industry_name_${industry.id}`}
        />
      </div>

      {/* Use Case Description */}
      <div className="text-center">
        <EditableAdaptiveText
          mode={mode}
          value={industry.description}
          onEdit={(value) => onDescriptionEdit(industry.id, value)}
          backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'neutral')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{
            ...getTextStyle('body'),
            textAlign: 'center'
          }}
          className="opacity-80"
          placeholder="Describe how your solution helps this industry"
          sectionBackground={sectionBackground}
          sectionId={sectionId}
          elementKey={`industry_description_${industry.id}`}
        />
      </div>
    </div>
  );
});
IndustryCard.displayName = 'IndustryCard';

export default function IndustryUseCaseGrid(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<IndustryUseCaseGridContent>({
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
  const industries = blockContent.industries || [];

  // V2: Handle name editing - update array item
  const handleNameEdit = (id: string, value: string) => {
    const updatedIndustries = industries.map(ind =>
      ind.id === id ? { ...ind, name: value } : ind
    );
    (handleContentUpdate as any)('industries', updatedIndustries);
  };

  // V2: Handle description editing - update array item
  const handleDescriptionEdit = (id: string, value: string) => {
    const updatedIndustries = industries.map(ind =>
      ind.id === id ? { ...ind, description: value } : ind
    );
    (handleContentUpdate as any)('industries', updatedIndustries);
  };

  // V2: Handle icon editing - update array item
  const handleIconEdit = (id: string, value: string) => {
    const updatedIndustries = industries.map(ind =>
      ind.id === id ? { ...ind, icon: value } : ind
    );
    (handleContentUpdate as any)('industries', updatedIndustries);
  };

  // V2: Handle adding a new industry - simple array push
  const handleAddIndustry = () => {
    if (industries.length < 6) {
      const newIndustry: Industry = {
        id: `ind${Date.now()}`,
        name: 'New Industry',
        description: 'Describe how your solution helps this industry'
      };
      (handleContentUpdate as any)('industries', [...industries, newIndustry]);
    }
  };

  // V2: Handle removing an industry - simple array filter
  const handleRemoveIndustry = (id: string) => {
    const updatedIndustries = industries.filter(ind => ind.id !== id);
    (handleContentUpdate as any)('industries', updatedIndustries);
  };

  // Theme-based add button styles
  const addButtonStyles = {
    warm: { bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-200 hover:border-orange-300', icon: 'text-orange-600', text: 'text-orange-700' },
    cool: { bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200 hover:border-blue-300', icon: 'text-blue-600', text: 'text-blue-700' },
    neutral: { bg: 'bg-gray-50 hover:bg-gray-100', border: 'border-gray-200 hover:border-gray-300', icon: 'text-gray-600', text: 'text-gray-700' }
  }[theme];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IndustryUseCaseGrid"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Headline */}
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
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Subheadline - optional */}
          {(blockContent.subheadline || mode === 'edit') && (
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
              className="max-w-3xl mx-auto opacity-80"
              placeholder="Add optional subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Industry Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry) => (
            <IndustryCard
              key={industry.id}
              industry={industry}
              mode={mode}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
              onNameEdit={handleNameEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onRemoveIndustry={handleRemoveIndustry}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              canRemove={industries.length > 4}
              theme={theme}
            />
          ))}
        </div>

        {/* Add Industry Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && industries.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddIndustry}
              className={`inline-flex items-center space-x-2 px-4 py-3 ${addButtonStyles.bg} border-2 ${addButtonStyles.border} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${addButtonStyles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${addButtonStyles.text} font-medium`}>Add Industry</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'IndustryUseCaseGrid',
  category: 'Use Case',
  description: 'Industry-specific use cases grid with icons',
  defaultBackgroundType: 'neutral' as const
};
