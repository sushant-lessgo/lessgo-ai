import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface StackedWinsListProps extends LayoutComponentProps {}

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

// Get category color scheme
const getCategoryColor = (category?: string): { bg: string; text: string; border: string } => {
  if (!category) return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  
  const colors = {
    'time savings': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'productivity': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'cost reduction': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'automation': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'customer success': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'scalability': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'workflow': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'analytics': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  };
  
  return colors[category.toLowerCase() as keyof typeof colors] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
};

// Individual Win Item Component
const WinItem = ({ 
  win, 
  index, 
  mode, 
  sectionId,
  onWinEdit,
  onDescriptionEdit,
  onCategoryEdit
}: {
  win: WinItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onWinEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onCategoryEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  const categoryColors = getCategoryColor(win.category);
  
  return (
    <div className="group flex items-start space-x-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300">
      
      {/* Checkmark Icon */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <IconEditableText
            mode={mode}
            value={blockContent.win_icon || '✅'}
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
            {mode === 'edit' ? (
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
          {mode === 'edit' ? (
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
            {mode === 'edit' ? (
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
            <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-800">
              <IconEditableText
                mode={mode}
                value={blockContent.badge_icon || '🏆'}
                onEdit={(value) => handleContentUpdate('badge_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-green-600 text-sm mr-2"
                sectionId={sectionId}
                elementKey="badge_icon"
              />
              {mode === 'edit' ? (
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
              onWinEdit={handleWinEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onCategoryEdit={handleCategoryEdit}
            />
          ))}
        </div>

        {/* Momentum Footer */}
        {(blockContent.footer_title || blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <IconEditableText
                  mode={mode}
                  value={blockContent.momentum_icon || '📈'}
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