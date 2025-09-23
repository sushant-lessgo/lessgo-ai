import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface TechnicalAdvantageContent {
  headline: string;
  subheadline?: string;
  advantage_titles: string;
  advantage_descriptions: string;
  advantage_icon_1?: string;
  advantage_icon_2?: string;
  advantage_icon_3?: string;
  advantage_icon_4?: string;
  advantage_icon_5?: string;
  advantage_icon_6?: string;
}

interface AdvantageItem {
  title: string;
  description: string;
  id: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Technical Advantages That Set Us Apart' },
  subheadline: { type: 'string' as const, default: '' },
  advantage_titles: { type: 'string' as const, default: '10x Processing Speed|Quantum-Resistant Security|Zero-Knowledge Architecture|Self-Healing Infrastructure' },
  advantage_descriptions: { type: 'string' as const, default: 'Our parallel processing engine handles millions of transactions per second with sub-millisecond latency.|Military-grade encryption with post-quantum cryptography ensures future-proof security.|Complete data privacy with zero-knowledge proofs - we never see your sensitive information.|Intelligent monitoring and automated recovery systems ensure 99.999% uptime.' },
  advantage_icon_1: { type: 'string' as const, default: '⚡' },
  advantage_icon_2: { type: 'string' as const, default: '🔒' },
  advantage_icon_3: { type: 'string' as const, default: '🛡️' },
  advantage_icon_4: { type: 'string' as const, default: '🔧' },
  advantage_icon_5: { type: 'string' as const, default: '🚀' },
  advantage_icon_6: { type: 'string' as const, default: '💫' }
};

const parseAdvantageData = (titles: string, descriptions: string): AdvantageItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return titleList.map((title, index) => ({
    id: `advantage-${index}`,
    title,
    description: descriptionList[index] || 'Description not provided.'
  }));
};

const getAdvantageIcon = (blockContent: TechnicalAdvantageContent, index: number) => {
  const iconFields = [
    blockContent.advantage_icon_1,
    blockContent.advantage_icon_2,
    blockContent.advantage_icon_3,
    blockContent.advantage_icon_4,
    blockContent.advantage_icon_5,
    blockContent.advantage_icon_6
  ];
  return iconFields[index] || '⚡';
};

const addAdvantage = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  titleList.push('New Advantage');
  descriptionList.push('Describe this technical advantage.');

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const removeAdvantage = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const AdvantageCard = ({
  advantage,
  index,
  mode,
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveAdvantage,
  blockContent,
  colorTokens,
  handleContentUpdate,
  canRemove = true,
  sectionBackground
}: {
  advantage: AdvantageItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveAdvantage?: (index: number) => void;
  blockContent: TechnicalAdvantageContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof TechnicalAdvantageContent, value: string) => void;
  canRemove?: boolean;
  sectionBackground?: string;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className="group relative">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 h-full">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <IconEditableText
              mode={mode}
              value={getAdvantageIcon(blockContent, index)}
              onEdit={(value) => {
                const iconField = `advantage_icon_${index + 1}` as keyof TechnicalAdvantageContent;
                handleContentUpdate(iconField, value);
              }}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="lg"
              className="text-white text-2xl"
              sectionId={sectionId}
              elementKey={`advantage_icon_${index + 1}`}
            />
          </div>

          <div className="flex-1">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 mb-2 cursor-text hover:bg-white hover:bg-opacity-50 font-bold text-gray-900 text-lg"
              >
                {advantage.title}
              </div>
            ) : (
              <h3 className="font-bold text-gray-900 text-lg mb-2">{advantage.title}</h3>
            )}

            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text hover:bg-white hover:bg-opacity-50 text-gray-600 text-sm"
              >
                {advantage.description}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">{advantage.description}</p>
            )}
          </div>
        </div>

        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveAdvantage?.(index);
            }}
            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this advantage"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default function TechnicalAdvantage(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<TechnicalAdvantageContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Auto-populate icons on initial generation
  useEffect(() => {
    if (mode === 'edit' && blockContent.advantage_titles) {
      const advantages = parseAdvantageData(blockContent.advantage_titles, blockContent.advantage_descriptions);

      advantages.forEach((_, index) => {
        const iconField = `advantage_icon_${index + 1}` as keyof TechnicalAdvantageContent;
        if (!blockContent[iconField] || blockContent[iconField] === '') {
          const categories = ['speed', 'security', 'technology', 'performance', 'optimization', 'advanced'];
          const icon = getRandomIconFromCategory(categories[index % categories.length]);
          handleContentUpdate(iconField, icon);
        }
      });
    }
  }, [blockContent.advantage_titles]);

  const advantages = parseAdvantageData(
    blockContent.advantage_titles || '',
    blockContent.advantage_descriptions || ''
  );

  const handleTitleEdit = (index: number, newTitle: string) => {
    const titles = (blockContent.advantage_titles || '').split('|').map(t => t.trim());
    titles[index] = newTitle;
    handleContentUpdate('advantage_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, newDescription: string) => {
    const descriptions = (blockContent.advantage_descriptions || '').split('|').map(d => d.trim());
    descriptions[index] = newDescription;
    handleContentUpdate('advantage_descriptions', descriptions.join('|'));
  };

  const handleAddAdvantage = () => {
    const { newTitles, newDescriptions } = addAdvantage(
      blockContent.advantage_titles || '',
      blockContent.advantage_descriptions || ''
    );
    handleContentUpdate('advantage_titles', newTitles);
    handleContentUpdate('advantage_descriptions', newDescriptions);
  };

  const handleRemoveAdvantage = (index: number) => {
    const { newTitles, newDescriptions } = removeAdvantage(
      blockContent.advantage_titles || '',
      blockContent.advantage_descriptions || '',
      index
    );
    handleContentUpdate('advantage_titles', newTitles);
    handleContentUpdate('advantage_descriptions', newDescriptions);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TechnicalAdvantage"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className={`grid gap-6 ${
          advantages.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          advantages.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          advantages.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
          advantages.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {advantages.map((advantage, index) => (
            <AdvantageCard
              key={advantage.id}
              advantage={advantage}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemoveAdvantage={handleRemoveAdvantage}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              canRemove={advantages.length > 3}
              sectionBackground={sectionBackground}
            />
          ))}
        </div>

        {mode === 'edit' && advantages.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddAdvantage}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Advantage
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TechnicalAdvantage',
  category: 'Unique Mechanism',
  description: 'Showcase multiple technical advantages of your solution',
  defaultBackgroundType: 'primary' as const
};