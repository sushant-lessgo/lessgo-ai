import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { inferIconFromText } from '@/lib/iconCategoryMap';

interface StatBlocksProps extends LayoutComponentProps {}

// Stat item structure (V2 array format)
interface StatItem {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

// Content interface for StatBlocks layout (V2)
interface StatBlocksContent {
  headline: string;
  subheadline?: string;
  achievement_footer?: string;
  stats: StatItem[];
}

// Content schema for StatBlocks layout (V2)
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Real Results That Speak for Themselves' },
  subheadline: { type: 'string' as const, default: '' },
  achievement_footer: { type: 'string' as const, default: 'Results measured across thousands of customers' },
  stats: {
    type: 'array' as const,
    default: [
      { id: 's1', value: '10,000+', label: 'Happy Customers', description: 'And growing daily' },
      { id: 's2', value: '98%', label: 'Customer Satisfaction', description: 'Based on NPS surveys' },
      { id: 's3', value: '2.5x', label: 'Revenue Growth', description: 'Average increase' },
      { id: 's4', value: '24/7', label: 'Support Available', description: 'Always here to help' }
    ]
  }
};

// Generate unique ID for new stats
const generateStatId = (): string => `s${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


// Type definitions for color objects
type StatCardColors = {
  bg: string;
  border: string;
  borderHover: string;
  shadow: string;
};

type IconColors = {
  bg: string;
  bgHover: string;
  text: string;
};

// Individual Stat Block
const StatBlock = ({
  stat,
  index,
  mode,
  sectionId,
  theme,
  cardColors,
  iconColors,
  onValueEdit,
  onLabelEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemoveStat,
  canRemove = true
}: {
  stat: StatItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  theme: UIBlockTheme;
  cardColors: StatCardColors;
  iconColors: IconColors;
  onValueEdit: (id: string, value: string) => void;
  onLabelEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit: (id: string, value: string) => void;
  onRemoveStat?: (id: string) => void;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();

  // Get icon: user-set → derived from label
  const displayIcon = stat.icon || inferIconFromText(stat.label, stat.description);

  return (
    <div className={`group/stat-${index} relative text-center p-8 ${cardColors.bg} rounded-xl border ${cardColors.border} ${cardColors.borderHover} ${cardColors.shadow} transition-all duration-300`}>

      {/* Stat Icon */}
      <div className="mb-6">
        <div className={`w-16 h-16 ${iconColors.bg} rounded-2xl flex items-center justify-center ${iconColors.text} mx-auto ${iconColors.bgHover} group-hover:scale-110 transition-all duration-300`}>
          <IconEditableText
            mode={mode}
            value={displayIcon}
            onEdit={(value) => onIconEdit(stat.id, value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="lg"
            className={`${iconColors.text} text-2xl`}
            sectionId={sectionId}
            elementKey={`stat_icon_${stat.id}`}
          />
        </div>
      </div>

      {/* Stat Value */}
      <div className="mb-4">
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onValueEdit(stat.id, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text hover:bg-gray-50 text-4xl md:text-5xl font-bold text-gray-900"
          >
            {stat.value}
          </div>
        ) : (
          <div
            className="text-4xl md:text-5xl font-bold text-gray-900"
          >
            {stat.value}
          </div>
        )}
      </div>

      {/* Stat Label */}
      <div className="mb-3">
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onLabelEdit(stat.id, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
          >
            {stat.label}
          </div>
        ) : (
          <h3
            className="font-semibold text-gray-900"
          >
            {stat.label}
          </h3>
        )}
      </div>

      {/* Optional Description */}
      {(stat.description || mode === 'edit') && (
        <div>
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(stat.id, e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed ${!stat.description ? 'opacity-50 italic text-sm' : ''}`}
            >
              {stat.description || 'Add optional description...'}
            </div>
          ) : stat.description && (
            <p
              className="text-gray-600 leading-relaxed"
            >
              {stat.description}
            </p>
          )}
        </div>
      )}

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveStat && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveStat(stat.id);
          }}
          className={`absolute top-4 right-4 opacity-0 group-hover/stat-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this stat"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function StatBlocks(props: StatBlocksProps) {
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
  } = useLayoutComponent<StatBlocksContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get theme-based colors for stat cards
  const getStatCardColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-white',
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        shadow: 'hover:shadow-lg hover:shadow-orange-100/20'
      },
      cool: {
        bg: 'bg-white',
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        shadow: 'hover:shadow-lg hover:shadow-blue-100/20'
      },
      neutral: {
        bg: 'bg-white',
        border: 'border-gray-200',
        borderHover: 'hover:border-gray-300',
        shadow: 'hover:shadow-lg'
      }
    }[theme];
  };

  // Get theme-based colors for icon backgrounds
  const getIconColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-100',
        bgHover: 'group-hover:bg-orange-200',
        text: 'text-orange-600'
      },
      cool: {
        bg: 'bg-blue-100',
        bgHover: 'group-hover:bg-blue-200',
        text: 'text-blue-600'
      },
      neutral: {
        bg: 'bg-gray-100',
        bgHover: 'group-hover:bg-gray-200',
        text: 'text-gray-600'
      }
    }[theme];
  };

  // Get theme-based colors for add button
  const getAddButtonColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-50',
        bgHover: 'hover:bg-orange-100',
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        text: 'text-orange-700'
      },
      cool: {
        bg: 'bg-blue-50',
        bgHover: 'hover:bg-blue-100',
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        text: 'text-blue-700'
      },
      neutral: {
        bg: 'bg-gray-50',
        bgHover: 'hover:bg-gray-100',
        border: 'border-gray-200',
        borderHover: 'hover:border-gray-300',
        text: 'text-gray-700'
      }
    }[theme];
  };

  // Get theme-based colors for achievement footer
  const getFooterColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'text-orange-500'
      },
      cool: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-500'
      },
      neutral: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        icon: 'text-gray-500'
      }
    }[theme];
  };

  const cardColors = getStatCardColors(theme);
  const iconColors = getIconColors(theme);
  const addButtonColors = getAddButtonColors(theme);
  const footerColors = getFooterColors(theme);

  // Get stats array (with fallback to default)
  const stats = blockContent.stats || CONTENT_SCHEMA.stats.default;

  // Handle stat field updates
  const handleStatUpdate = (id: string, field: keyof StatItem, value: string) => {
    const updatedStats = stats.map(stat =>
      stat.id === id ? { ...stat, [field]: value } : stat
    );
    (handleContentUpdate as any)('stats', updatedStats);
  };

  const handleValueEdit = (id: string, value: string) => handleStatUpdate(id, 'value', value);
  const handleLabelEdit = (id: string, value: string) => handleStatUpdate(id, 'label', value);
  const handleDescriptionEdit = (id: string, value: string) => handleStatUpdate(id, 'description', value);
  const handleIconEdit = (id: string, value: string) => handleStatUpdate(id, 'icon', value);

  // Handle adding a new stat
  const handleAddStat = () => {
    const newStat: StatItem = {
      id: generateStatId(),
      value: '100%',
      label: 'New Metric',
      description: 'Add description for this metric'
    };
    (handleContentUpdate as any)('stats', [...stats, newStat]);
  };

  // Handle removing a stat
  const handleRemoveStat = (id: string) => {
    const updatedStats = stats.filter(stat => stat.id !== id);
    (handleContentUpdate as any)('stats', updatedStats);
  };

  return (
    <section
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="StatBlocks"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-4"
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
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className="mb-6 max-w-2xl mx-auto"
              placeholder="Add optional subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-8 ${
          stats.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          stats.length === 3 ? 'md:grid-cols-3 max-w-5xl mx-auto' :
          stats.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {stats.map((stat, index) => (
            <StatBlock
              key={stat.id}
              stat={stat}
              index={index}
              mode={mode}
              sectionId={sectionId}
              theme={theme}
              cardColors={cardColors}
              iconColors={iconColors}
              onValueEdit={handleValueEdit}
              onLabelEdit={handleLabelEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onRemoveStat={handleRemoveStat}
              canRemove={stats.length > 2}
            />
          ))}
        </div>

        {/* Add Stat Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && stats.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddStat}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${addButtonColors.bg} ${addButtonColors.bgHover} border-2 ${addButtonColors.border} ${addButtonColors.borderHover} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${addButtonColors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${addButtonColors.text} font-medium`}>Add Stat</span>
            </button>
          </div>
        )}

        {/* Achievement Footer */}
        {(blockContent.achievement_footer || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className={`relative group/achievement-footer inline-flex items-center px-6 py-3 ${footerColors.bg} border ${footerColors.border} rounded-full ${footerColors.text}`}>
              <svg className={`w-5 h-5 mr-2 ${footerColors.icon}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.achievement_footer || ''}
                onEdit={(value) => handleContentUpdate('achievement_footer', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className={`font-medium ${footerColors.text}`}
                placeholder="Add achievement footer text..."
                sectionId={sectionId}
                elementKey="achievement_footer"
              />

              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate('achievement_footer', '');
                  }}
                  className="opacity-0 group-hover/achievement-footer:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                  title="Remove achievement footer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'StatBlocks',
  category: 'Metrics',
  description: 'Statistical metrics display with adaptive text colors and optional descriptions',
  tags: ['stats', 'metrics', 'numbers', 'achievements', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable stat values, labels, and descriptions',
    'Smart grid layout based on stat count',
    'Contextual icons that match stat content',
    'Optional subheadline for context',
    'Achievement footer for credibility'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    stats: 'Array of stat objects with id, value, label, description, icon',
    subheadline: 'Optional subheading for context',
    achievement_footer: 'Optional credibility text'
  },
  examples: [
    'Company achievements',
    'Product performance metrics',
    'Customer satisfaction stats',
    'Growth indicators'
  ]
};
