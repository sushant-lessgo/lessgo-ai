import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

interface StackedWinsListProps extends LayoutComponentProps {}

// Win item structure (V2 array format)
interface WinItem {
  id: string;
  win: string;
  description?: string;
  category?: string;
}

// Content interface for StackedWinsList layout (V2 format)
interface StackedWinsListContent {
  headline: string;
  subheadline?: string;
  footer_text?: string;
  win_icon?: string;
  wins: WinItem[];
}

// Content schema for StackedWinsList layout (V2 format - no icon defaults)
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Your Wins Start Adding Up Fast' },
  subheadline: { type: 'string' as const, default: '' },
  footer_text: { type: 'string' as const, default: '' },
  wins: {
    type: 'array' as const,
    default: [
      { id: 'win-1', win: 'Save 25+ hours per week on manual tasks', description: 'Focus on strategy while automation handles the routine', category: 'Time Savings' },
      { id: 'win-2', win: 'Increase team productivity by 60%', description: 'Your team works smarter, not harder', category: 'Productivity' },
      { id: 'win-3', win: 'Reduce operational costs by $50K annually', description: 'Cut expenses while improving quality', category: 'Cost Reduction' },
      { id: 'win-4', win: 'Eliminate 90% of repetitive work', description: 'Free up time for innovation and growth', category: 'Automation' },
    ]
  }
};

// Get category color scheme with theme support
const getCategoryColor = (category: string | undefined, theme: UIBlockTheme): { bg: string; text: string; border: string } => {
  if (!category) {
    const defaults = {
      warm: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      cool: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    };
    return defaults[theme];
  }

  const warmColors: Record<string, { bg: string; text: string; border: string }> = {
    'time savings': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'productivity': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'cost reduction': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'automation': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'customer success': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'scalability': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'workflow': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'analytics': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  };

  const coolColors: Record<string, { bg: string; text: string; border: string }> = {
    'time savings': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'productivity': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'cost reduction': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'automation': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'customer success': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'scalability': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    'workflow': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'analytics': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' }
  };

  const neutralColors: Record<string, { bg: string; text: string; border: string }> = {
    'time savings': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    'productivity': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    'cost reduction': { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' },
    'automation': { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
    'customer success': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    'scalability': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    'workflow': { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' },
    'analytics': { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' }
  };

  const colorSets = { warm: warmColors, cool: coolColors, neutral: neutralColors };
  const categoryKey = category.toLowerCase();
  return colorSets[theme][categoryKey] || colorSets[theme]['productivity'];
};

// Get theme-based colors for win checkmark/icon gradient only
const getWinIconGradient = (theme: UIBlockTheme) => {
  return {
    warm: 'from-orange-400 to-red-500',
    cool: 'from-blue-400 to-cyan-500',
    neutral: 'from-gray-400 to-slate-500'
  }[theme];
};

// Individual Win Item Component
const WinItemComponent = ({
  win,
  index,
  mode,
  sectionId,
  theme,
  winIcon,
  cardStyles,
  onWinUpdate,
  onRemoveWin,
  handleContentUpdate,
  canRemove = true
}: {
  win: WinItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  theme: UIBlockTheme;
  winIcon: string;
  cardStyles: CardStyles;
  onWinUpdate: (index: number, field: keyof WinItem, value: string) => void;
  onRemoveWin?: (index: number) => void;
  handleContentUpdate: (key: string, value: any) => void;
  canRemove?: boolean;
}) => {
  const categoryColors = getCategoryColor(win.category, theme);
  const iconGradient = getWinIconGradient(theme);

  return (
    <div className={`group relative flex items-start space-x-4 p-6 rounded-xl border ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hoverEffect} transition-all duration-300`}>

      {/* Checkmark Icon */}
      <div className="flex-shrink-0 mt-1">
        <div className={`w-8 h-8 bg-gradient-to-br ${iconGradient} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <IconEditableText
            mode={mode}
            value={winIcon}
            onEdit={(value) => handleContentUpdate('win_icon', value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="sm"
            className="text-white text-lg"
            sectionId={sectionId}
            elementKey="win_icon"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* Category Tag */}
        {(win.category || mode === 'edit') && (
          <div className="mb-2">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onWinUpdate(index, 'category', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded inline-block text-xs font-semibold rounded-full px-2 py-1 ${categoryColors.bg} ${categoryColors.text} border ${categoryColors.border} ${!win.category ? 'opacity-50 italic' : ''}`}
              >
                {win.category || 'Add category...'}
              </div>
            ) : win.category && (
              <span className={`inline-block text-xs font-semibold rounded-full px-2 py-1 ${categoryColors.bg} ${categoryColors.text} border ${categoryColors.border}`}>
                {win.category}
              </span>
            )}
          </div>
        )}

        {/* Win Title */}
        <div className="mb-2">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onWinUpdate(index, 'win', e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text font-bold ${cardStyles.textHeading}`}
            >
              {win.win}
            </div>
          ) : (
            <h3 className={`font-bold ${cardStyles.textHeading}`}>
              {win.win}
            </h3>
          )}
        </div>

        {/* Optional Description */}
        {(win.description || mode === 'edit') && (
          <div>
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onWinUpdate(index, 'description', e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text ${cardStyles.textBody} leading-relaxed ${!win.description ? 'opacity-50 italic' : ''}`}
              >
                {win.description || 'Add optional description...'}
              </div>
            ) : win.description && (
              <p className={`${cardStyles.textBody} leading-relaxed`}>
                {win.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveWin && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveWin(index);
          }}
          className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200"
          title="Remove this win"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function StackedWinsList(props: StackedWinsListProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<StackedWinsListContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection with priority: manual override > auto-detection > neutral
  const theme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme
    });
  }, [sectionBackground, theme]);

  // Icon default at render time (per Icon Handling Pattern)
  const winIcon = blockContent.win_icon ?? 'CheckCircle';

  // Get wins array (ensure it's always an array)
  const wins: WinItem[] = Array.isArray(blockContent.wins) ? blockContent.wins : CONTENT_SCHEMA.wins.default;

  // Handle updating a win field
  const handleWinUpdate = (index: number, field: keyof WinItem, value: string) => {
    const updatedWins = wins.map((win, i) =>
      i === index ? { ...win, [field]: value } : win
    );
    (handleContentUpdate as any)('wins', updatedWins);
  };

  // Handle adding a new win
  const handleAddWin = () => {
    const newWin: WinItem = {
      id: `win-${Date.now()}`,
      win: 'New Win',
      description: 'Describe this achievement or result',
      category: ''
    };
    (handleContentUpdate as any)('wins', [...wins, newWin]);
  };

  // Handle removing a win
  const handleRemoveWin = (indexToRemove: number) => {
    const updatedWins = wins.filter((_, index) => index !== indexToRemove);
    (handleContentUpdate as any)('wins', updatedWins);
  };

  return (
    <section
      className="py-16 px-4"
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="StackedWinsList"
    >
      <div className="max-w-4xl mx-auto">
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
              className="max-w-3xl mx-auto"
              placeholder="Add optional subheadline about accumulating wins..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Wins List */}
        <div className="space-y-4">
          {wins.map((win, index) => (
            <WinItemComponent
              key={win.id}
              win={win}
              index={index}
              mode={mode}
              sectionId={sectionId}
              theme={theme}
              winIcon={winIcon}
              cardStyles={cardStyles}
              onWinUpdate={handleWinUpdate}
              onRemoveWin={handleRemoveWin}
              handleContentUpdate={handleContentUpdate}
              canRemove={wins.length > 1}
            />
          ))}
        </div>

        {/* Add Win Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && wins.length < 8 && (() => {
          const addButtonColors = {
            warm: { bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-200 hover:border-orange-300', icon: 'text-orange-600', text: 'text-orange-700' },
            cool: { bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200 hover:border-blue-300', icon: 'text-blue-600', text: 'text-blue-700' },
            neutral: { bg: 'bg-gray-50 hover:bg-gray-100', border: 'border-gray-200 hover:border-gray-300', icon: 'text-gray-600', text: 'text-gray-700' },
          }[theme];
          return (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddWin}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${addButtonColors.bg} border-2 ${addButtonColors.border} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${addButtonColors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${addButtonColors.text} font-medium`}>Add Win</span>
            </button>
          </div>
          );
        })()}

        {/* Footer Text - simple summary/transition text */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-12 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.footer_text || ''}
              onEdit={(value) => handleContentUpdate('footer_text', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-2xl mx-auto opacity-80"
              placeholder="Add summary or transition text..."
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              elementKey="footer_text"
            />
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'StackedWinsList',
  category: 'Results',
  description: 'Stacked list of wins and achievements with checkmark indicators',
  tags: ['wins', 'achievements', 'list', 'checkmarks', 'progress'],
  features: [
    'Checkmark-indicated achievement list',
    'Optional category tags with color coding',
    'Hover animations and scale effects',
    'Optional descriptions for each win',
    'Win count social proof badge',
    'Momentum-building messaging'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    wins: 'Array of win items with id, win, description, category',
    subheadline: 'Optional subheading for context',
    win_count: 'Optional social proof about others achieving these wins'
  },
  examples: [
    'Product benefit achievements',
    'Customer success outcomes',
    'Service delivery wins',
    'Business transformation results'
  ]
};
