import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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

// Derive icon from pain point text - maps keywords to Lucide icons
const getPainIconFromText = (point: string, description?: string): string => {
  const text = `${point} ${description || ''}`.toLowerCase();

  // Time-related pain
  if (text.includes('time') || text.includes('hour') || text.includes('slow') || text.includes('wait')) {
    return 'Clock';
  }
  // Disconnection/integration issues
  if (text.includes('disconnect') || text.includes('integration') || text.includes('sync') || text.includes('talk to each other')) {
    return 'Unlink';
  }
  // Deadlines/urgency
  if (text.includes('deadline') || text.includes('miss') || text.includes('late') || text.includes('urgent')) {
    return 'AlertTriangle';
  }
  // Burnout/fatigue
  if (text.includes('burn') || text.includes('exhaust') || text.includes('tired') || text.includes('overwhelm')) {
    return 'Battery';
  }
  // Loss/decline
  if (text.includes('losing') || text.includes('lost') || text.includes('decline') || text.includes('drop')) {
    return 'TrendingDown';
  }
  // Chaos/disorganization
  if (text.includes('chaos') || text.includes('mess') || text.includes('scattered') || text.includes('disorganiz')) {
    return 'Shuffle';
  }
  // Manual work
  if (text.includes('manual') || text.includes('repetitive') || text.includes('tedious')) {
    return 'Hand';
  }
  // Customer issues
  if (text.includes('customer') || text.includes('client') || text.includes('response')) {
    return 'Users';
  }
  // Default pain icon
  return 'AlertCircle';
};

// Individual Pain Point Item
const PainPointItem = ({
  painItem,
  index,
  mode,
  sectionId,
  colorTokens,
  dynamicTextColors,
  backgroundType,
  sectionBackground,
  onItemUpdate,
  onRemove,
  canRemove,
  painColors
}: {
  painItem: PainItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  colorTokens: any;
  dynamicTextColors?: { heading?: string; body?: string; muted?: string };
  backgroundType: any;
  sectionBackground: any;
  onItemUpdate: (index: number, field: keyof PainItem, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  painColors: {
    border: string;
    borderHover: string;
    iconBg: string;
    iconBgHover: string;
    iconText: string;
    dotColor: string;
    conclusionBg: string;
    conclusionBorder: string;
    conclusionText: string;
  };
}) => {
  return (
    <div className={`group flex items-start space-x-4 p-6 bg-white rounded-lg border ${painColors.border} ${painColors.borderHover} hover:shadow-md transition-all duration-300`}>

      {/* Pain Icon */}
      <div className={`flex-shrink-0 w-12 h-12 ${painColors.iconBg} rounded-lg flex items-center justify-center ${painColors.iconText} ${painColors.iconBgHover} transition-colors duration-300 group/icon-edit relative`}>
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
          placeholder={getPainIconFromText(painItem.point, painItem.description)}
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
            className="font-semibold text-xl leading-relaxed"
            textStyle={{ color: dynamicTextColors?.heading || '#111827' }}
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
              className={`text-base leading-relaxed ${!painItem.description && mode === 'edit' ? 'opacity-50 italic' : ''}`}
              textStyle={{ color: dynamicTextColors?.body || '#4b5563' }}
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
      <div className={`flex-shrink-0 w-2 h-2 ${painColors.dotColor} rounded-full group-hover:opacity-80 transition-colors duration-300`}></div>
    </div>
  );
};

export default function StackedPainBullets(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<StackedPainBulletsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Pain colors by theme
  const getPainColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        iconBg: 'bg-orange-100',
        iconBgHover: 'group-hover:bg-orange-200',
        iconText: 'text-orange-600',
        conclusionBg: 'bg-orange-50',
        conclusionBorder: 'border-orange-200',
        conclusionText: 'text-orange-800',
        dotColor: 'bg-orange-400'
      },
      cool: {
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        iconBg: 'bg-blue-100',
        iconBgHover: 'group-hover:bg-blue-200',
        iconText: 'text-blue-600',
        conclusionBg: 'bg-blue-50',
        conclusionBorder: 'border-blue-200',
        conclusionText: 'text-blue-800',
        dotColor: 'bg-blue-400'
      },
      neutral: {
        border: 'border-amber-200',
        borderHover: 'hover:border-amber-300',
        iconBg: 'bg-amber-100',
        iconBgHover: 'group-hover:bg-amber-200',
        iconText: 'text-amber-600',
        conclusionBg: 'bg-amber-50',
        conclusionBorder: 'border-amber-200',
        conclusionText: 'text-amber-800',
        dotColor: 'bg-amber-400'
      }
    }[theme];
  };

  const painColors = getPainColors(theme);

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
              dynamicTextColors={dynamicTextColors}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              onItemUpdate={handleItemUpdate}
              onRemove={removePainItem}
              canRemove={painItems.length > 1}
              painColors={painColors}
            />
          ))}
        </div>

        {/* Add Pain Point Button */}
        {mode === 'edit' && painItems.length < 6 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={addPainItem}
              className={`flex items-center space-x-2 px-4 py-2 text-sm ${painColors.iconText} hover:opacity-80 border ${painColors.border} ${painColors.borderHover} rounded-lg hover:${painColors.conclusionBg} transition-all duration-200`}
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
          <div className={`inline-flex items-center px-6 py-3 ${painColors.conclusionBg} border ${painColors.conclusionBorder} rounded-full ${painColors.conclusionText}`}>
            <svg className={`w-5 h-5 mr-2 ${painColors.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
