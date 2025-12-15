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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface SecretSauceRevealContent {
  headline: string;
  subheadline?: string;
  secret_titles: string;
  secret_descriptions: string;
  secret_icon_1?: string;
  secret_icon_2?: string;
  secret_icon_3?: string;
  secret_icon_4?: string;
}

interface SecretItem {
  title: string;
  description: string;
  id: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Our Secret Sauce Revealed' },
  subheadline: { type: 'string' as const, default: '' },
  secret_titles: { type: 'string' as const, default: 'Quantum-Enhanced Machine Learning|Adaptive Intelligence Framework|Predictive Optimization Engine' },
  secret_descriptions: { type: 'string' as const, default: 'We combine quantum computing principles with traditional machine learning to achieve processing speeds and accuracy levels impossible with conventional approaches.|Our system learns and adapts in real-time, continuously improving its performance based on new data and user interactions.|Advanced algorithms predict future trends and automatically optimize operations before issues arise.' },
  secret_icon_1: { type: 'string' as const, default: '🔬' },
  secret_icon_2: { type: 'string' as const, default: '🧠' },
  secret_icon_3: { type: 'string' as const, default: '🚀' },
  secret_icon_4: { type: 'string' as const, default: '💡' }
};

const parseSecretData = (titles: string, descriptions: string): SecretItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return titleList.map((title, index) => ({
    id: `secret-${index}`,
    title,
    description: descriptionList[index] || 'Description not provided.'
  }));
};

const getSecretIcon = (blockContent: SecretSauceRevealContent, index: number) => {
  const iconFields = [
    blockContent.secret_icon_1,
    blockContent.secret_icon_2,
    blockContent.secret_icon_3,
    blockContent.secret_icon_4
  ];
  return iconFields[index] || '🔬';
};

const addSecret = (titles: string, descriptions: string): { newTitles: string; newDescriptions: string } => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  titleList.push('New Secret');
  descriptionList.push('Describe this unique aspect of your solution.');

  return {
    newTitles: titleList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const removeSecret = (titles: string, descriptions: string, indexToRemove: number): { newTitles: string; newDescriptions: string } => {
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

const SecretCard = ({
  secret,
  index,
  mode,
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveSecret,
  blockContent,
  colorTokens,
  handleContentUpdate,
  canRemove = true,
  sectionBackground,
  secretColors
}: {
  secret: SecretItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveSecret?: (index: number) => void;
  blockContent: SecretSauceRevealContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof SecretSauceRevealContent, value: string) => void;
  canRemove?: boolean;
  sectionBackground?: string;
  secretColors: {
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    iconBg: string;
    iconShadow: string;
    iconText: string;
    titleText: string;
    accentBar: string;
    addButtonBg: string;
    addButtonHover: string;
    focusRing: string;
    hoverShadow: string;
  };
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className="group relative">
      <div className={`${secretColors.cardBg} rounded-2xl p-8 text-center relative overflow-hidden h-full border-2 ${secretColors.cardBorder} ${secretColors.cardHoverBorder} shadow-lg ${secretColors.hoverShadow} transition-all duration-300`}>
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${secretColors.accentBar} rounded-t-2xl`}></div>
        <div className="relative z-10">
          <div className={`w-14 h-14 ${secretColors.iconBg} ${secretColors.iconShadow} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <IconEditableText
              mode={mode}
              value={getSecretIcon(blockContent, index)}
              onEdit={(value) => {
                const iconField = `secret_icon_${index + 1}` as keyof SecretSauceRevealContent;
                handleContentUpdate(iconField, value);
              }}
              backgroundType="neutral"
              colorTokens={colorTokens}
              iconSize="lg"
              className={`${secretColors.iconText} text-2xl`}
              sectionId={sectionId}
              elementKey={`secret_icon_${index + 1}`}
            />
          </div>

          <h3 className={`${secretColors.titleText} font-bold text-xl mb-3`}>
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 ${secretColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text`}
              >
                {secret.title}
              </div>
            ) : (
              <span>{secret.title}</span>
            )}
          </h3>

          <div className="text-gray-600">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 ${secretColors.focusRing} focus:ring-opacity-50 rounded px-2 py-1 min-h-[48px] cursor-text hover:bg-gray-50 max-w-lg mx-auto`}
              >
                {secret.description}
              </div>
            ) : (
              <p className="max-w-lg mx-auto">{secret.description}</p>
            )}
          </div>
        </div>

        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSecret?.(index);
            }}
            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this secret"
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

export default function SecretSauceReveal(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<SecretSauceRevealContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Secret card colors by theme
  const getSecretColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBg: 'bg-white',
        cardBorder: 'border-orange-200',
        cardHoverBorder: 'hover:border-orange-400',
        iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
        iconShadow: 'shadow-lg shadow-orange-200',
        iconText: 'text-white',
        titleText: 'text-orange-900',
        accentBar: 'bg-gradient-to-r from-orange-400 to-red-500',
        addButtonBg: 'bg-orange-600',
        addButtonHover: 'hover:bg-orange-700',
        focusRing: 'focus:ring-orange-300',
        hoverShadow: 'hover:shadow-xl'
      },
      cool: {
        cardBg: 'bg-white',
        cardBorder: 'border-blue-200',
        cardHoverBorder: 'hover:border-blue-400',
        iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        iconShadow: 'shadow-lg shadow-blue-200',
        iconText: 'text-white',
        titleText: 'text-blue-900',
        accentBar: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        addButtonBg: 'bg-blue-600',
        addButtonHover: 'hover:bg-blue-700',
        focusRing: 'focus:ring-blue-300',
        hoverShadow: 'hover:shadow-xl'
      },
      neutral: {
        cardBg: 'bg-white',
        cardBorder: 'border-purple-200',
        cardHoverBorder: 'hover:border-purple-400',
        iconBg: 'bg-gradient-to-br from-purple-400 to-indigo-500',
        iconShadow: 'shadow-lg shadow-purple-200',
        iconText: 'text-white',
        titleText: 'text-purple-900',
        accentBar: 'bg-gradient-to-r from-purple-400 to-indigo-500',
        addButtonBg: 'bg-purple-600',
        addButtonHover: 'hover:bg-purple-700',
        focusRing: 'focus:ring-purple-300',
        hoverShadow: 'hover:shadow-xl'
      }
    }[theme];
  };

  const secretColors = getSecretColors(theme);

  // Auto-populate icons on initial generation
  useEffect(() => {
    if (mode === 'edit' && blockContent.secret_titles) {
      const secrets = parseSecretData(blockContent.secret_titles, blockContent.secret_descriptions);

      secrets.forEach((_, index) => {
        const iconField = `secret_icon_${index + 1}` as keyof SecretSauceRevealContent;
        if (!blockContent[iconField] || blockContent[iconField] === '') {
          const categories = ['innovation', 'technology', 'advanced', 'quality'];
          const icon = getRandomIconFromCategory(categories[index % categories.length]);
          handleContentUpdate(iconField, icon);
        }
      });
    }
  }, [blockContent.secret_titles]);

  const secrets = parseSecretData(
    blockContent.secret_titles || '',
    blockContent.secret_descriptions || ''
  );

  const handleTitleEdit = (index: number, newTitle: string) => {
    const titles = (blockContent.secret_titles || '').split('|').map(t => t.trim());
    titles[index] = newTitle;
    handleContentUpdate('secret_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, newDescription: string) => {
    const descriptions = (blockContent.secret_descriptions || '').split('|').map(d => d.trim());
    descriptions[index] = newDescription;
    handleContentUpdate('secret_descriptions', descriptions.join('|'));
  };

  const handleAddSecret = () => {
    const { newTitles, newDescriptions } = addSecret(
      blockContent.secret_titles || '',
      blockContent.secret_descriptions || ''
    );
    handleContentUpdate('secret_titles', newTitles);
    handleContentUpdate('secret_descriptions', newDescriptions);
  };

  const handleRemoveSecret = (index: number) => {
    const { newTitles, newDescriptions } = removeSecret(
      blockContent.secret_titles || '',
      blockContent.secret_descriptions || '',
      index
    );
    handleContentUpdate('secret_titles', newTitles);
    handleContentUpdate('secret_descriptions', newDescriptions);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SecretSauceReveal"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secrets.map((secret, index) => (
            <SecretCard
              key={secret.id}
              secret={secret}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemoveSecret={handleRemoveSecret}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              canRemove={secrets.length > 2}
              sectionBackground={sectionBackground}
              secretColors={secretColors}
            />
          ))}
        </div>

        {mode === 'edit' && secrets.length < 4 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddSecret}
              className={`inline-flex items-center gap-2 px-6 py-3 ${secretColors.addButtonBg} ${secretColors.addButtonHover} text-white rounded-lg transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Secret
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SecretSauceReveal',
  category: 'Unique Mechanism',
  description: 'Reveal multiple secret sauce features or unique differentiators',
  defaultBackgroundType: 'primary' as const
};