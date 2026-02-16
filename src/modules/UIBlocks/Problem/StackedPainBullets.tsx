import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

// Pain item structure (V2 - array based)
interface PainItem {
  id: string;
  point: string;
  description?: string;
  icon?: string;
}

// Content interface for StackedPainBullets layout (V2)
interface StackedPainBulletsContent {
  headline: string;
  subheadline?: string;
  conclusion_text?: string;
  pain_items: PainItem[];
}

// Default pain items for new sections
const DEFAULT_PAIN_ITEMS: PainItem[] = [
  { id: 'p1', point: 'Spending hours on manual data entry that could be automated', description: '' },
  { id: 'p2', point: 'Juggling multiple tools that don\'t talk to each other', description: '' },
  { id: 'p3', point: 'Missing important deadlines because nothing is centralized', description: '' },
];

// Content schema for StackedPainBullets layout (V2)
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Are You Struggling With These Daily Frustrations?' },
  subheadline: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: 'Sound familiar? You\'re not alone.' },
  pain_items: { type: 'array' as const, default: DEFAULT_PAIN_ITEMS },
};


// Individual Pain Point Item
const PainPointItem = ({
  painItem,
  index,
  mode,
  sectionId,
  colorTokens,
  backgroundType,
  sectionBackground,
  onItemUpdate,
  onRemove,
  canRemove,
  cardStyles,
  themeColors
}: {
  painItem: PainItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  colorTokens: any;
  backgroundType: any;
  sectionBackground: any;
  onItemUpdate: (index: number, field: keyof PainItem, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  cardStyles: CardStyles;
  themeColors: {
    dotColor: string;
    conclusionBg: string;
    conclusionBorder: string;
    conclusionText: string;
  };
}) => {
  return (
    <div className={`group flex items-start space-x-4 p-6 rounded-lg ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hoverEffect} transition-all duration-300`}>

      {/* Pain Icon */}
      <div className={`flex-shrink-0 w-12 h-12 ${cardStyles.iconBg} rounded-lg flex items-center justify-center ${cardStyles.iconColor} transition-colors duration-300 group/icon-edit relative`}>
        <IconEditableText
          mode={mode}
          value={painItem.icon || ''}
          onEdit={(value) => onItemUpdate(index, 'icon', value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          iconSize="lg"
          className="text-2xl"
          sectionId={sectionId}
          elementKey={`pain_items.${index}.icon`}
          placeholder={inferIconFromText(painItem.point, painItem.description)}
        />
      </div>

      {/* Pain Content */}
      <div className="flex-1">
        {/* Pain Point */}
        <div className="mb-2">
          <EditableAdaptiveText
            mode={mode}
            value={painItem.point}
            onEdit={(value) => onItemUpdate(index, 'point', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className={`font-semibold text-xl leading-relaxed ${cardStyles.textHeading}`}
            placeholder="Enter pain point..."
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key={`pain_items.${index}.point`}
          />
        </div>

        {/* Optional Description */}
        {(painItem.description || mode === 'edit') && (
          <div>
            <EditableAdaptiveText
              mode={mode}
              value={painItem.description || ''}
              onEdit={(value) => onItemUpdate(index, 'description', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className={`text-base leading-relaxed ${cardStyles.textBody} ${!painItem.description && mode === 'edit' ? 'opacity-50 italic' : ''}`}
              placeholder="Add optional description to elaborate on this pain point..."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key={`pain_items.${index}.description`}
            />
          </div>
        )}
      </div>

      {/* Remove Button (Edit Mode Only) */}
      {mode === 'edit' && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (painItem.point.trim() && !confirm('Are you sure you want to remove this pain point?')) {
              return;
            }
            onRemove(index);
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm ml-2"
          title="Remove this pain point"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Emphasis Indicator */}
      <div className={`flex-shrink-0 w-2 h-2 ${themeColors.dotColor} rounded-full group-hover:opacity-80 transition-colors duration-300`}></div>
    </div>
  );
};

export default function StackedPainBullets(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<StackedPainBulletsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme
    });
  }, [sectionBackground, theme]);

  // Theme-specific colors for conclusion badge and dot indicator
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        conclusionBg: 'bg-orange-50',
        conclusionBorder: 'border-orange-200',
        conclusionText: 'text-orange-800',
        dotColor: 'bg-orange-400',
        iconTextForBadge: 'text-orange-600'
      },
      cool: {
        conclusionBg: 'bg-blue-50',
        conclusionBorder: 'border-blue-200',
        conclusionText: 'text-blue-800',
        dotColor: 'bg-blue-400',
        iconTextForBadge: 'text-blue-600'
      },
      neutral: {
        conclusionBg: 'bg-amber-50',
        conclusionBorder: 'border-amber-200',
        conclusionText: 'text-amber-800',
        dotColor: 'bg-amber-400',
        iconTextForBadge: 'text-amber-600'
      }
    }[theme];
  };

  const themeColors = getThemeColors(theme);

  // Get pain items from content (array-based)
  const painItems: PainItem[] = Array.isArray(blockContent.pain_items)
    ? blockContent.pain_items
    : DEFAULT_PAIN_ITEMS;

  // Handle item field update - V2: cast as any for array updates
  const handleItemUpdate = (index: number, field: keyof PainItem, value: string) => {
    const updatedItems = painItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    (handleContentUpdate as any)('pain_items', updatedItems);
  };

  // Add new pain point
  const addPainItem = () => {
    if (painItems.length >= 6) return;

    const newItem: PainItem = {
      id: `p${Date.now()}`,
      point: 'New pain point',
      description: '',
    };

    (handleContentUpdate as any)('pain_items', [...painItems, newItem]);
  };

  // Remove pain point
  const removePainItem = (index: number) => {
    if (painItems.length <= 1) return;
    const updatedItems = painItems.filter((_, i) => i !== index);
    (handleContentUpdate as any)('pain_items', updatedItems);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedPainBullets"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto mt-24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Pain Points List */}
        <div className="space-y-6">
          {painItems.map((painItem, index) => (
            <PainPointItem
              key={painItem.id}
              painItem={painItem}
              index={index}
              mode={mode}
              sectionId={sectionId}
              colorTokens={colorTokens}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              onItemUpdate={handleItemUpdate}
              onRemove={removePainItem}
              canRemove={painItems.length > 1}
              cardStyles={cardStyles}
              themeColors={themeColors}
            />
          ))}
        </div>

        {/* Add Pain Point Button */}
        {mode === 'edit' && painItems.length < 6 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={addPainItem}
              className={`flex items-center space-x-2 px-4 py-2 text-sm ${cardStyles.iconColor} hover:opacity-80 ${cardStyles.border} rounded-lg transition-all duration-200`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Pain Point</span>
            </button>
          </div>
        )}

        {/* Emotional Conclusion */}
        <div className="mt-16 text-center mb-8">
          <div className={`inline-flex items-center px-6 py-3 ${themeColors.conclusionBg} border ${themeColors.conclusionBorder} rounded-full ${themeColors.conclusionText}`}>
            <svg className={`w-5 h-5 mr-2 ${themeColors.iconTextForBadge}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.conclusion_text || ''}
              onEdit={(value) => handleContentUpdate('conclusion_text', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold"
              placeholder="Sound familiar? You're not alone."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="conclusion_text"
            />
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedPainBullets',
  category: 'Problem',
  description: 'Pain point identification with editable cards and emotional conclusion.',
  tags: ['pain-points', 'problems', 'empathy', 'bullets'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'conclusion_text', label: 'Conclusion Text', type: 'text', required: false },
    { key: 'pain_items', label: 'Pain Points', type: 'collection', required: true },
  ],

  features: [
    'Array-based pain items with add/remove',
    'Smart icon derivation from text',
    'Optional descriptions per item',
    'Theme-aware styling',
  ],

  useCases: [
    'Customer frustration identification',
    'Problem statement sections',
    'Challenge recognition',
    'Pain point validation'
  ]
};
