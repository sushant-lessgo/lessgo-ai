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

interface StatBlocksProps extends LayoutComponentProps {}

// Stat item structure
interface StatItem {
  value: string;
  label: string;
  description?: string;
  id: string;
}

// Content interface for StatBlocks layout
interface StatBlocksContent {
  headline: string;
  stat_values: string;
  stat_labels: string;
  stat_descriptions?: string;
  subheadline?: string;
  achievement_footer?: string;
  stat_icon_1?: string;
  stat_icon_2?: string;
  stat_icon_3?: string;
  stat_icon_4?: string;
  stat_icon_5?: string;
  stat_icon_6?: string;
}

// Content schema for StatBlocks layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Real Results That Speak for Themselves' },
  stat_values: { type: 'string' as const, default: '10,000+|98%|2.5x|24/7' },
  stat_labels: { type: 'string' as const, default: 'Happy Customers|Customer Satisfaction|Revenue Growth|Support Available' },
  stat_descriptions: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  achievement_footer: { type: 'string' as const, default: 'Results measured across thousands of customers' },
  stat_icon_1: { type: 'string' as const, default: '👥' },
  stat_icon_2: { type: 'string' as const, default: '❤️' },
  stat_icon_3: { type: 'string' as const, default: '📈' },
  stat_icon_4: { type: 'string' as const, default: '⏰' }
};

// Parse stat data from pipe-separated strings
const parseStatData = (values: string, labels: string, descriptions?: string): StatItem[] => {
  const valueList = values.split('|').map(v => v.trim()).filter(v => v);
  const labelList = labels.split('|').map(l => l.trim()).filter(l => l);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];

  return valueList.map((value, index) => ({
    id: `stat-${index}`,
    value,
    label: labelList[index] || 'Metric',
    description: descriptionList[index] || undefined
  }));
};

// Helper function to add a new stat
const addStat = (values: string, labels: string, descriptions: string): { newValues: string; newLabels: string; newDescriptions: string } => {
  const valueList = values.split('|').map(v => v.trim()).filter(v => v);
  const labelList = labels.split('|').map(l => l.trim()).filter(l => l);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];

  // Add new stat with default content
  valueList.push('100%');
  labelList.push('New Metric');
  descriptionList.push('Add description for this metric');

  return {
    newValues: valueList.join('|'),
    newLabels: labelList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a stat
const removeStat = (values: string, labels: string, descriptions: string, indexToRemove: number): { newValues: string; newLabels: string; newDescriptions: string } => {
  const valueList = values.split('|').map(v => v.trim()).filter(v => v);
  const labelList = labels.split('|').map(l => l.trim()).filter(l => l);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];

  // Remove the stat at the specified index
  if (indexToRemove >= 0 && indexToRemove < valueList.length) {
    valueList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < labelList.length) {
    labelList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newValues: valueList.join('|'),
    newLabels: labelList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
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
  if (mode !== 'preview' && onEdit) {
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

// Stat Icon Component
const StatIcon = ({ label, index }: { label: string, index: number }) => {
  const getIcon = (statLabel: string, fallbackIndex: number) => {
    const lower = statLabel.toLowerCase();
    
    if (lower.includes('customer') || lower.includes('user') || lower.includes('client')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else if (lower.includes('satisfaction') || lower.includes('rating') || lower.includes('score')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    } else if (lower.includes('revenue') || lower.includes('growth') || lower.includes('sales') || lower.includes('profit')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (lower.includes('time') || lower.includes('speed') || lower.includes('fast') || lower.includes('support')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (lower.includes('efficiency') || lower.includes('productivity') || lower.includes('performance')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (lower.includes('reduction') || lower.includes('save') || lower.includes('cost')) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      );
    }
    
    // Default icons based on position
    const defaultIcons = [
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228V2.721m-2.48 5.228a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>,
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ];
    
    return defaultIcons[fallbackIndex % defaultIcons.length];
  };
  
  return getIcon(label, index);
};

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
  onStatIconEdit,
  onRemoveStat,
  getStatIcon,
  canRemove = true
}: {
  stat: StatItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  theme: UIBlockTheme;
  cardColors: StatCardColors;
  iconColors: IconColors;
  onValueEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onStatIconEdit: (index: number, value: string) => void;
  onRemoveStat?: (index: number) => void;
  getStatIcon: (index: number) => string;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className={`group/stat-${index} relative text-center p-8 ${cardColors.bg} rounded-xl border ${cardColors.border} ${cardColors.borderHover} ${cardColors.shadow} transition-all duration-300`}>

      {/* Stat Icon */}
      <div className="mb-6">
        <div className={`w-16 h-16 ${iconColors.bg} rounded-2xl flex items-center justify-center ${iconColors.text} mx-auto ${iconColors.bgHover} group-hover:scale-110 transition-all duration-300`}>
          <IconEditableText
            mode={mode}
            value={getStatIcon(index)}
            onEdit={(value) => onStatIconEdit(index, value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="lg"
            className={`${iconColors.text} text-2xl`}
            sectionId={sectionId}
            elementKey={`stat_icon_${index + 1}`}
          />
        </div>
      </div>
      
      {/* Stat Value */}
      <div className="mb-4">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onValueEdit(index, e.currentTarget.textContent || '')}
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
            onBlur={(e) => onLabelEdit(index, e.currentTarget.textContent || '')}
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
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
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
            onRemoveStat(index);
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

  const cardColors = getStatCardColors(theme);
  const iconColors = getIconColors(theme);
  const addButtonColors = getAddButtonColors(theme);

  // Parse stat data
  const statItems = parseStatData(blockContent.stat_values, blockContent.stat_labels, blockContent.stat_descriptions);

  // Handle individual editing
  const handleValueEdit = (index: number, value: string) => {
    const values = blockContent.stat_values.split('|');
    values[index] = value;
    handleContentUpdate('stat_values', values.join('|'));
  };

  const handleStatIconEdit = (index: number, value: string) => {
    const iconField = `stat_icon_${index + 1}` as keyof StatBlocksContent;
    handleContentUpdate(iconField, value);
  };

  // Get stat icon from content or default
  const getStatIcon = (index: number): string => {
    const iconFields = ['stat_icon_1', 'stat_icon_2', 'stat_icon_3', 'stat_icon_4', 'stat_icon_5', 'stat_icon_6'];
    const iconField = iconFields[index] as keyof StatBlocksContent;
    const iconValue = blockContent[iconField];

    // If the icon value looks like text/numbers (not an emoji), use contextual icon based on stat label
    if (iconValue && !isValidIcon(iconValue)) {
      return getContextualIcon(statItems[index]?.label || '', index);
    }

    return iconValue || getContextualIcon(statItems[index]?.label || '', index);
  };

  // Helper function to check if a value is a valid icon (emoji or simple icon character)
  const isValidIcon = (value: string): boolean => {
    // Check if it's an emoji (basic check) or common icon characters
    const iconPattern = /^[\u{1F300}-\u{1F9FF}]|^[👥❤️📈⏰⚡🏆📊💰🎯✨🔥💡🚀🎉🔔⭐💎🎪🎨🎮🎯⚽🏀🎾🎳🎲🎭🎪🎨🎬🎤🎧🎼🎹🥁🎺🎸🎻🎯]|^[⭐✅✨🔔🔥🚀💡💎]$/u;
    return iconPattern.test(value) || value.length <= 2;
  };

  // Helper function to get contextual icon based on stat label
  const getContextualIcon = (label: string, index: number): string => {
    const lower = label.toLowerCase();

    if (lower.includes('customer') || lower.includes('user') || lower.includes('client')) {
      return '👥';
    } else if (lower.includes('satisfaction') || lower.includes('rating') || lower.includes('score') || lower.includes('love')) {
      return '❤️';
    } else if (lower.includes('revenue') || lower.includes('growth') || lower.includes('sales') || lower.includes('profit') || lower.includes('increase')) {
      return '📈';
    } else if (lower.includes('time') || lower.includes('speed') || lower.includes('fast') || lower.includes('support') || lower.includes('24')) {
      return '⏰';
    } else if (lower.includes('efficiency') || lower.includes('productivity') || lower.includes('performance') || lower.includes('boost')) {
      return '⚡';
    } else if (lower.includes('award') || lower.includes('achievement') || lower.includes('success') || lower.includes('winner')) {
      return '🏆';
    } else if (lower.includes('money') || lower.includes('cost') || lower.includes('save') || lower.includes('dollar')) {
      return '💰';
    } else if (lower.includes('goal') || lower.includes('target') || lower.includes('hit') || lower.includes('reach')) {
      return '🎯';
    }

    // Default icons based on position
    return ['📊', '✨', '🔥', '💡', '🚀', '🎉'][index] || '📊';
  };

  const handleLabelEdit = (index: number, value: string) => {
    const labels = blockContent.stat_labels.split('|');
    labels[index] = value;
    handleContentUpdate('stat_labels', labels.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.stat_descriptions ? blockContent.stat_descriptions.split('|') : [];
    descriptions[index] = value;
    handleContentUpdate('stat_descriptions', descriptions.join('|'));
  };

  // Handle adding a new stat
  const handleAddStat = () => {
    const { newValues, newLabels, newDescriptions } = addStat(
      blockContent.stat_values,
      blockContent.stat_labels,
      blockContent.stat_descriptions || ''
    );
    handleContentUpdate('stat_values', newValues);
    handleContentUpdate('stat_labels', newLabels);
    handleContentUpdate('stat_descriptions', newDescriptions);
  };

  // Handle removing a stat
  const handleRemoveStat = (indexToRemove: number) => {
    const { newValues, newLabels, newDescriptions } = removeStat(
      blockContent.stat_values,
      blockContent.stat_labels,
      blockContent.stat_descriptions || '',
      indexToRemove
    );
    handleContentUpdate('stat_values', newValues);
    handleContentUpdate('stat_labels', newLabels);
    handleContentUpdate('stat_descriptions', newDescriptions);

    // Also clear the corresponding icon if it exists
    const iconField = `stat_icon_${indexToRemove + 1}` as keyof StatBlocksContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
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
          statItems.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          statItems.length === 3 ? 'md:grid-cols-3 max-w-5xl mx-auto' :
          statItems.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {statItems.map((stat, index) => (
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
              onStatIconEdit={handleStatIconEdit}
              onRemoveStat={handleRemoveStat}
              getStatIcon={getStatIcon}
              canRemove={statItems.length > 2}
            />
          ))}
        </div>

        {/* Add Stat Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && statItems.length < 6 && (
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
        {(blockContent.achievement_footer || mode === 'edit') && blockContent.achievement_footer !== '___REMOVED___' && (
          <div className="mt-16 text-center">
            <div className="relative group/achievement-footer inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.achievement_footer || ''}
                onEdit={(value) => handleContentUpdate('achievement_footer', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-medium text-green-800"
                placeholder="Add achievement footer text..."
                sectionId={sectionId}
                elementKey="achievement_footer"
                sectionBackground="rgb(240 253 244)"
              />

              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate('achievement_footer', '___REMOVED___');
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
    stat_values: 'Pipe-separated list of stat values (e.g., "10,000+|98%|2.5x")',
    stat_labels: 'Pipe-separated list of stat labels',
    stat_descriptions: 'Optional pipe-separated descriptions for each stat',
    subheadline: 'Optional subheading for context'
  },
  examples: [
    'Company achievements',
    'Product performance metrics',
    'Customer satisfaction stats',
    'Growth indicators'
  ]
};