// components/layout/TechnicalAdvantage.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { Trash2, Plus } from 'lucide-react';

interface TechnicalAdvantageContent {
  headline: string;
  advantages: string;
  advantage_descriptions?: string;
  advantage_icon_1?: string;
  advantage_icon_2?: string;
  advantage_icon_3?: string;
  advantage_icon_4?: string;
  advantage_icon_5?: string;
  advantage_icon_6?: string;
}

interface AdvantageItem {
  id: string;
  index: number;
  title: string;
  description: string;
  icon: string;
  isRemoved?: boolean;
}

const MAX_ADVANTAGES = 6;
const REMOVED_MARKER = '___REMOVED___';

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Technical Advantages That Set Us Apart' },
  advantages: { type: 'string' as const, default: 'Proprietary AI Engine|Real-time Processing|Scalable Architecture' },
  advantage_descriptions: { type: 'string' as const, default: 'Advanced machine learning models custom-built for your industry|Process millions of data points in milliseconds|Seamlessly scale from startup to enterprise without rebuilding' },
  advantage_icon_1: { type: 'string' as const, default: '🤖' },
  advantage_icon_2: { type: 'string' as const, default: '⚡' },
  advantage_icon_3: { type: 'string' as const, default: '💯' },
  advantage_icon_4: { type: 'string' as const, default: '🔒' },
  advantage_icon_5: { type: 'string' as const, default: '🚀' },
  advantage_icon_6: { type: 'string' as const, default: '🔮' }
};

// Parse advantage data into structured format
const parseAdvantageData = (advantages: string, descriptions: string, blockContent: TechnicalAdvantageContent): AdvantageItem[] => {
  const titleList = parsePipeData(advantages);
  const descriptionList = parsePipeData(descriptions);
  
  const icons = [
    blockContent.advantage_icon_1,
    blockContent.advantage_icon_2,
    blockContent.advantage_icon_3,
    blockContent.advantage_icon_4,
    blockContent.advantage_icon_5,
    blockContent.advantage_icon_6
  ];
  
  return titleList.map((title, index) => ({
    id: `advantage-${index}`,
    index,
    title,
    description: descriptionList[index] || 'Advanced technical capability that provides competitive advantage.',
    icon: icons[index] || getDefaultIcon(title),
    isRemoved: title === REMOVED_MARKER
  })).filter(item => !item.isRemoved);
};

// Auto-select default icon based on title
const getDefaultIcon = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('ai') || lower.includes('engine')) return '🤖';
  if (lower.includes('real-time') || lower.includes('processing')) return '⚡';
  if (lower.includes('scalable') || lower.includes('architecture')) return '💯';
  if (lower.includes('security') || lower.includes('secure')) return '🔒';
  if (lower.includes('edge') || lower.includes('computing')) return '🚀';
  if (lower.includes('quantum') || lower.includes('ready')) return '🔮';
  return '⭐';
};

// Individual Advantage Card Component
const AdvantageCard = React.memo(({
  item,
  mode,
  colorTokens,
  getTextStyle,
  sectionId,
  sectionBackground,
  backgroundType,
  onTitleEdit,
  onDescriptionEdit,
  onIconEdit,
  onDelete
}: {
  item: AdvantageItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: string) => React.CSSProperties;
  sectionId: string;
  sectionBackground: string;
  backgroundType: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onIconEdit: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}) => {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <div className="group relative bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-green-200 transition-all duration-300">
      {/* Delete Button - Only visible in edit mode */}
      {mode === 'edit' && (
        <button
          onClick={() => onDelete(item.index)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-200"
          title="Delete advantage"
        >
          <Trash2 size={16} />
        </button>
      )}
      
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
        <IconEditableText
          mode={mode}
          value={item.icon}
          onEdit={(value) => onIconEdit(item.index, value)}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="lg"
          className="text-white text-2xl"
          sectionId={sectionId}
          elementKey={`advantage_icon_${item.index + 1}`}
        />
      </div>
      
      <EditableAdaptiveText
        mode={mode}
        value={item.title}
        onEdit={(value) => onTitleEdit(item.index, value)}
        backgroundType="secondary"
        colorTokens={colorTokens}
        variant="body"
        textStyle={{
          ...h3Style,
          fontWeight: 'bold'
        }}
        className="text-gray-900 mb-4"
        placeholder="Advantage title..."
        sectionId={sectionId}
        elementKey={`advantage_title_${item.index}`}
        sectionBackground={sectionBackground}
      />
      
      <EditableAdaptiveText
        mode={mode}
        value={item.description}
        onEdit={(value) => onDescriptionEdit(item.index, value)}
        backgroundType="secondary"
        colorTokens={colorTokens}
        variant="body"
        textStyle={bodyStyle}
        className="text-gray-600"
        placeholder="Describe this advantage..."
        sectionId={sectionId}
        elementKey={`advantage_description_${item.index}`}
        sectionBackground={sectionBackground}
      />
    </div>
  );
});
AdvantageCard.displayName = 'AdvantageCard';

export default function TechnicalAdvantage(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<TechnicalAdvantageContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Parse advantage data
  const advantageItems = parseAdvantageData(blockContent.advantages, blockContent.advantage_descriptions || '', blockContent);
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');
  
  // Handle individual field edits
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.advantages, index, value);
    handleContentUpdate('advantages', updatedTitles);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.advantage_descriptions || '', index, value);
    handleContentUpdate('advantage_descriptions', updatedDescriptions);
  };

  const handleIconEdit = (index: number, value: string) => {
    const iconField = `advantage_icon_${index + 1}` as keyof TechnicalAdvantageContent;
    handleContentUpdate(iconField, value);
  };
  
  // Handle delete advantage with confirmation
  const handleDelete = (index: number) => {
    // Simple confirmation - in a real app you might use a proper modal
    const advantageTitle = advantageItems[index]?.title || 'this advantage';
    if (!confirm(`Are you sure you want to delete "${advantageTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    const updatedTitles = updateListData(blockContent.advantages, index, REMOVED_MARKER);
    const updatedDescriptions = updateListData(blockContent.advantage_descriptions || '', index, REMOVED_MARKER);
    
    // Filter out removed items
    const titleList = parsePipeData(updatedTitles).filter(t => t !== REMOVED_MARKER);
    const descriptionList = parsePipeData(updatedDescriptions).filter(d => d !== REMOVED_MARKER);
    
    handleContentUpdate('advantages', titleList.join('|'));
    handleContentUpdate('advantage_descriptions', descriptionList.join('|'));
  };
  
  // Handle add new advantage
  const handleAddAdvantage = () => {
    if (advantageItems.length >= MAX_ADVANTAGES) return;
    
    const newTitle = 'New Advantage';
    const newDescription = 'Describe your competitive advantage here.';
    
    const updatedTitles = blockContent.advantages ? `${blockContent.advantages}|${newTitle}` : newTitle;
    const updatedDescriptions = blockContent.advantage_descriptions 
      ? `${blockContent.advantage_descriptions}|${newDescription}` 
      : newDescription;
    
    handleContentUpdate('advantages', updatedTitles);
    handleContentUpdate('advantage_descriptions', updatedDescriptions);
    
    // Set default icon for new advantage
    const nextIndex = advantageItems.length;
    const iconField = `advantage_icon_${nextIndex + 1}` as keyof TechnicalAdvantageContent;
    handleContentUpdate(iconField, getDefaultIcon(newTitle));
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="TechnicalAdvantage" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} colorTokens={colorTokens} className="text-center mb-12" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantageItems.map((item) => (
            <AdvantageCard
              key={item.id}
              item={item}
              mode={mode}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
              sectionId={sectionId}
              sectionBackground={sectionBackground}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onDelete={handleDelete}
            />
          ))}
          
          {/* Add New Advantage Button - Only in edit mode */}
          {mode === 'edit' && advantageItems.length < MAX_ADVANTAGES && (
            <button
              onClick={handleAddAdvantage}
              className="group flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50/50 transition-all duration-300 min-h-[200px]"
            >
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-green-100 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors duration-300" />
              </div>
              <span className="text-gray-500 group-hover:text-green-600 font-medium transition-colors duration-300">
                Add New Advantage
              </span>
              <span className="text-xs text-gray-400 group-hover:text-green-500 mt-1 transition-colors duration-300">
                {advantageItems.length}/{MAX_ADVANTAGES} advantages
              </span>
            </button>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TechnicalAdvantage',
  category: 'Unique Mechanism',
  description: 'Technical advantages showcase with add/delete functionality',
  defaultBackgroundType: 'secondary' as const,
  features: [
    'Dynamic add/delete advantages (up to 6)',
    'Editable titles, descriptions, and icons',
    'Auto-selected icons based on content',
    'Hover-to-delete functionality',
    'Responsive grid layout'
  ]
};