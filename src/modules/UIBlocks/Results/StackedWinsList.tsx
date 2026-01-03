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

interface StackedWinsListProps extends LayoutComponentProps {}

// Helper function to check if a value is a valid icon (emoji or simple icon character)
const isValidIcon = (value: string): boolean => {
  // Check if it's an emoji (basic check) or common icon characters
  const iconPattern = /^[\u{1F300}-\u{1F9FF}]|^[✅📈🏆⭐🎯💡🔥💎🌟💪🎪⚽🏀🎾🎳🎲🎭🎪🎨🎬🎤🎧🎼🎹🥁🎺🎸🎻💰🎉🔔✨🚀⚡]|^[⭐✅✨🔔🔥🚀💡💎🌟⚙️🔧]$/u;
  return iconPattern.test(value) || value.length <= 2;
};

// Helper function to get validated icon with contextual fallback
const getValidatedIcon = (iconValue: string | undefined, defaultIcon: string, iconType: 'win' | 'badge' | 'momentum'): string => {
  // If we have an icon value and it's valid, use it
  if (iconValue && isValidIcon(iconValue)) {
    return iconValue;
  }

  // Get contextual icon based on type
  switch (iconType) {
    case 'win':
      return '✅'; // Checkmark for wins/achievements
    case 'badge':
      return '🏆'; // Trophy for badges/social proof
    case 'momentum':
      return '📈'; // Growth chart for momentum
    default:
      return defaultIcon;
  }
};

// Win item structure
interface WinItem {
  win: string;
  description?: string;
  category?: string;
  id: string;
}

// Content interface for StackedWinsList layout
interface StackedWinsListContent {
  headline: string;
  wins: string;
  descriptions?: string;
  categories?: string;
  subheadline?: string;
  win_count?: string;
  footer_title?: string;
  footer_text?: string;
  win_icon?: string;
  momentum_icon?: string;
  badge_icon?: string;
}

// Content schema for StackedWinsList layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Your Wins Start Adding Up Fast' },
  wins: { type: 'string' as const, default: 'Save 25+ hours per week on manual tasks|Increase team productivity by 60%|Reduce operational costs by $50K annually|Eliminate 90% of repetitive work|Boost customer satisfaction to 98%|Scale operations without hiring|Automate complex workflows in minutes|Get real-time insights on everything' },
  descriptions: { type: 'string' as const, default: 'Focus on strategy while automation handles the routine|Your team works smarter, not harder|Cut expenses while improving quality|Free up time for innovation and growth|Delight customers with faster, better service|Growth without the growing pains|Complex becomes simple with smart automation|Data-driven decisions at your fingertips' },
  categories: { type: 'string' as const, default: 'Time Savings|Productivity|Cost Reduction|Automation|Customer Success|Scalability|Workflow|Analytics' },
  subheadline: { type: 'string' as const, default: 'Every win builds momentum toward your bigger goals' },
  win_count: { type: 'string' as const, default: 'Join 10,000+ achieving these wins daily' },
  footer_title: { type: 'string' as const, default: 'Momentum Builds Quickly' },
  footer_text: { type: 'string' as const, default: 'Each win makes the next one easier to achieve' },
  win_icon: { type: 'string' as const, default: '✅' },
  momentum_icon: { type: 'string' as const, default: '📈' },
  badge_icon: { type: 'string' as const, default: '🏆' }
};

// Parse wins data from pipe-separated strings
const parseWinsData = (wins: string, descriptions?: string, categories?: string): WinItem[] => {
  const winList = wins.split('|').map(w => w.trim()).filter(w => w);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  const categoryList = categories ? categories.split('|').map(c => c.trim()).filter(c => c) : [];

  return winList.map((win, index) => ({
    id: `win-${index}`,
    win,
    description: descriptionList[index] || undefined,
    category: categoryList[index] || undefined
  }));
};

// Helper function to add a new win
const addWin = (wins: string, descriptions?: string, categories?: string): { newWins: string; newDescriptions: string; newCategories: string } => {
  const winList = wins.split('|').map(w => w.trim()).filter(w => w);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  const categoryList = categories ? categories.split('|').map(c => c.trim()).filter(c => c) : [];

  // Add new win with default content
  winList.push('New Win');
  descriptionList.push('Describe this achievement or result');
  categoryList.push(''); // Empty category by default

  return {
    newWins: winList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newCategories: categoryList.join('|')
  };
};

// Helper function to remove a win
const removeWin = (wins: string, descriptions: string, categories: string, indexToRemove: number): { newWins: string; newDescriptions: string; newCategories: string } => {
  const winList = wins.split('|').map(w => w.trim()).filter(w => w);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  const categoryList = categories ? categories.split('|').map(c => c.trim()).filter(c => c) : [];

  // Remove the win at the specified index
  if (indexToRemove >= 0 && indexToRemove < winList.length) {
    winList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < categoryList.length) {
    categoryList.splice(indexToRemove, 1);
  }

  return {
    newWins: winList.join('|'),
    newDescriptions: descriptionList.join('|'),
    newCategories: categoryList.join('|')
  };
};

// Get category color scheme with theme support
const getCategoryColor = (category: string | undefined, theme: UIBlockTheme): { bg: string; text: string; border: string } => {
  if (!category) {
    // Default colors based on theme
    const defaults = {
      warm: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      cool: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    };
    return defaults[theme];
  }

  // Theme-based category colors
  const warmColors = {
    'time savings': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'productivity': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'cost reduction': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'automation': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'customer success': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'scalability': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'workflow': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'analytics': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  };

  const coolColors = {
    'time savings': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'productivity': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'cost reduction': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'automation': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'customer success': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'scalability': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    'workflow': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'analytics': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' }
  };

  const neutralColors = {
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
  const categoryKey = category.toLowerCase() as keyof typeof warmColors;
  return colorSets[theme][categoryKey] || colorSets[theme]['productivity'];
};

// Get theme-based colors for win checkmark/icon
const getWinIconColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      gradient: 'from-orange-400 to-red-500',
      border: 'border-orange-200',
      borderHover: 'hover:border-orange-300'
    },
    cool: {
      gradient: 'from-blue-400 to-cyan-500',
      border: 'border-blue-200',
      borderHover: 'hover:border-blue-300'
    },
    neutral: {
      gradient: 'from-gray-400 to-slate-500',
      border: 'border-gray-200',
      borderHover: 'hover:border-gray-300'
    }
  }[theme];
};

// Individual Win Item Component
const WinItem = ({
  win,
  index,
  mode,
  sectionId,
  theme,
  onWinEdit,
  onDescriptionEdit,
  onCategoryEdit,
  onRemoveWin,
  blockContent,
  handleContentUpdate,
  backgroundType,
  colorTokens,
  canRemove = true
}: {
  win: WinItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  theme: UIBlockTheme;
  onWinEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onCategoryEdit: (index: number, value: string) => void;
  onRemoveWin?: (index: number) => void;
  blockContent: StackedWinsListContent;
  handleContentUpdate: (key: string, value: any) => void;
  backgroundType: string;
  colorTokens: any;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();
  const categoryColors = getCategoryColor(win.category, theme);
  const iconColors = getWinIconColors(theme);

  return (
    <div className={`group/win-item-${index} relative flex items-start space-x-4 p-6 bg-white rounded-xl border ${iconColors.border} ${iconColors.borderHover} hover:shadow-lg transition-all duration-300`}>
      
      {/* Checkmark Icon */}
      <div className="flex-shrink-0 mt-1">
        <div className={`w-8 h-8 bg-gradient-to-br ${iconColors.gradient} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <IconEditableText
            mode={mode}
            value={getValidatedIcon(blockContent.win_icon, '✅', 'win')}
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
                onBlur={(e) => onCategoryEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 min-h-[24px] cursor-text hover:bg-gray-50 inline-block text-xs font-semibold rounded-full px-2 py-1 ${categoryColors.bg} ${categoryColors.text} border ${categoryColors.border} ${!win.category ? 'opacity-50 italic' : ''}`}
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
              onBlur={(e) => onWinEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
            >
              {win.win}
            </div>
          ) : (
            <h3 
              className="font-bold text-gray-900"
            >
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
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed ${!win.description ? 'opacity-50 italic' : ''}`}
              >
                {win.description || 'Add optional description...'}
              </div>
            ) : win.description && (
              <p 
                className="text-gray-600 leading-relaxed"
              >
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
          className={`opacity-0 group-hover/win-item-${index}:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200`}
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
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<StackedWinsListContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection with priority: manual override > auto-detection > neutral
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get theme-based badge colors
  const getBadgeColors = (theme: UIBlockTheme) => {
    return {
      warm: 'bg-orange-100 text-orange-700 border-orange-200',
      cool: 'bg-blue-100 text-blue-700 border-blue-200',
      neutral: 'bg-gray-100 text-gray-700 border-gray-200'
    }[theme];
  };

  // Parse wins data
  const wins = parseWinsData(
    blockContent.wins,
    blockContent.descriptions,
    blockContent.categories
  );

  // Handle individual editing
  const handleWinEdit = (index: number, value: string) => {
    const winList = blockContent.wins.split('|');
    winList[index] = value;
    handleContentUpdate('wins', winList.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptionList = blockContent.descriptions ? blockContent.descriptions.split('|') : [];
    descriptionList[index] = value;
    handleContentUpdate('descriptions', descriptionList.join('|'));
  };

  const handleCategoryEdit = (index: number, value: string) => {
    const categoryList = blockContent.categories ? blockContent.categories.split('|') : [];
    categoryList[index] = value;
    handleContentUpdate('categories', categoryList.join('|'));
  };

  // Handle adding a new win
  const handleAddWin = () => {
    const { newWins, newDescriptions, newCategories } = addWin(
      blockContent.wins,
      blockContent.descriptions,
      blockContent.categories
    );
    handleContentUpdate('wins', newWins);
    handleContentUpdate('descriptions', newDescriptions);
    handleContentUpdate('categories', newCategories);
  };

  // Handle removing a win
  const handleRemoveWin = (indexToRemove: number) => {
    const { newWins, newDescriptions, newCategories } = removeWin(
      blockContent.wins,
      blockContent.descriptions || '',
      blockContent.categories || '',
      indexToRemove
    );
    handleContentUpdate('wins', newWins);
    handleContentUpdate('descriptions', newDescriptions);
    handleContentUpdate('categories', newCategories);
  };

  return (
    <section 
      className={`py-16 px-4`}
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
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline about accumulating wins..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Win Count Badge */}
          {(blockContent.win_count || mode === 'edit') && (
            <div className={`inline-flex items-center px-4 py-2 ${getBadgeColors(theme)} border rounded-full font-medium text-sm`}>
              <IconEditableText
                mode={mode}
                value={getValidatedIcon(blockContent.badge_icon, '🏆', 'badge')}
                onEdit={(value) => handleContentUpdate('badge_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-green-600 text-sm mr-2"
                sectionId={sectionId}
                elementKey="badge_icon"
              />
              {mode !== 'preview' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('win_count', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text font-medium"
                >
                  {blockContent.win_count}
                </div>
              ) : (
                <span className="font-medium">{blockContent.win_count}</span>
              )}
            </div>
          )}
        </div>

        {/* Wins List */}
        <div className="space-y-4">
          {wins.map((win, index) => (
            <WinItem
              key={win.id}
              win={win}
              index={index}
              mode={mode}
              sectionId={sectionId}
              theme={theme}
              onWinEdit={handleWinEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onCategoryEdit={handleCategoryEdit}
              onRemoveWin={handleRemoveWin}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              canRemove={wins.length > 1}
            />
          ))}
        </div>

        {/* Add Win Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && wins.length < 8 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddWin}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-green-700 font-medium">Add Win</span>
            </button>
          </div>
        )}

        {/* Momentum Footer */}
        {(blockContent.footer_title || blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <IconEditableText
                  mode={mode}
                  value={getValidatedIcon(blockContent.momentum_icon, '📈', 'momentum')}
                  onEdit={(value) => handleContentUpdate('momentum_icon', value)}
                  backgroundType="neutral"
                  colorTokens={{}}
                  iconSize="md"
                  className="text-white text-xl"
                  sectionId={sectionId}
                  elementKey="momentum_icon"
                />
              </div>
              <div className="text-left">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.footer_title || ''}
                  onEdit={(value) => handleContentUpdate('footer_title', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-bold text-green-900 text-lg"
                  placeholder="Add footer title..."
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="footer_title"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.footer_text || ''}
                  onEdit={(value) => handleContentUpdate('footer_text', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-green-700 text-sm"
                  placeholder="Add footer description..."
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="footer_text"
                />
              </div>
            </div>
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
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    wins: 'Pipe-separated list of wins/achievements',
    descriptions: 'Optional pipe-separated list of win descriptions',
    categories: 'Optional pipe-separated list of win categories',
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