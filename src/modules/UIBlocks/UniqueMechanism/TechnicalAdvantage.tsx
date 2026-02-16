// TechnicalAdvantage.tsx - V2: Clean array-based advantages
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { cn } from '@/lib/utils';
import { getCardStyles, CardStyles } from '@/modules/Design/cardStyles';

// V2: Advantage item structure - clean array item
interface Advantage {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// V2: Content interface - uses clean arrays
interface TechnicalAdvantageContent {
  headline: string;
  subheadline?: string;
  advantages: Advantage[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Technical Advantages That Set Us Apart'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  advantages: {
    type: 'array' as const,
    default: [
      { id: 'a1', title: '10x Processing Speed', description: 'Our parallel processing engine handles millions of transactions per second with sub-millisecond latency.' },
      { id: 'a2', title: 'Quantum-Resistant Security', description: 'Military-grade encryption with post-quantum cryptography ensures future-proof security.' },
      { id: 'a3', title: 'Zero-Knowledge Architecture', description: 'Complete data privacy with zero-knowledge proofs - we never see your sensitive information.' },
      { id: 'a4', title: 'Self-Healing Infrastructure', description: 'Intelligent monitoring and automated recovery systems ensure 99.999% uptime.' }
    ]
  }
};

// Theme-based gradient icon backgrounds (component-specific brand element)
const themeIconGradients = {
  warm: 'from-orange-500 to-red-600',
  cool: 'from-blue-500 to-indigo-600',
  neutral: 'from-gray-500 to-slate-600',
};

// Advantage Card component
const AdvantageCard = React.memo(({
  advantage,
  mode,
  colorTokens,
  onTitleEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemoveAdvantage,
  sectionId,
  canRemove = true,
  cardStyles,
  iconGradient,
  cardClassName
}: {
  advantage: Advantage;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onTitleEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit?: (id: string, value: string) => void;
  onRemoveAdvantage?: (id: string) => void;
  sectionId: string;
  canRemove?: boolean;
  cardStyles: CardStyles;
  iconGradient: string;
  cardClassName?: string;
}) => {
  const { getTextStyle } = useTypography();

  // Icon derivation: stored value → smart default
  const displayIcon = advantage.icon || inferIconFromText(advantage.title, advantage.description);

  return (
    <div className="group relative">
      <div className={cn(
        cardStyles.bg,
        cardStyles.blur,
        cardStyles.border,
        cardStyles.shadow,
        cardStyles.hoverEffect,
        'rounded-xl h-full transition-all duration-300 hover:-translate-y-1',
        cardClassName || 'p-6'
      )}>
        <div className="flex items-start space-x-4">
          {/* Icon Container - gradient preserved as brand element */}
          <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${iconGradient} rounded-lg flex items-center justify-center shadow-md`}>
            <IconEditableText
              mode={mode}
              value={displayIcon}
              onEdit={(value) => onIconEdit && onIconEdit(advantage.id, value)}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="lg"
              className="text-white text-2xl"
              placeholder="Sparkles"
              sectionId={sectionId}
              elementKey={`advantage_icon_${advantage.id}`}
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTitleEdit(advantage.id, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 mb-2 cursor-text font-bold text-lg ${cardStyles.textHeading}`}
              >
                {advantage.title}
              </div>
            ) : (
              <h3 className={`font-bold text-lg mb-2 ${cardStyles.textHeading}`}>{advantage.title}</h3>
            )}

            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(advantage.id, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text text-sm ${cardStyles.textBody}`}
              >
                {advantage.description}
              </div>
            ) : (
              <p className={`text-sm ${cardStyles.textBody}`}>{advantage.description}</p>
            )}
          </div>
        </div>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && canRemove && onRemoveAdvantage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveAdvantage(advantage.id);
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
});

AdvantageCard.displayName = 'AdvantageCard';

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

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Card styles from luminance-based system
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiTheme
    });
  }, [sectionBackground, uiTheme]);

  const iconGradient = themeIconGradients[uiTheme];

  // V2: Direct array access
  const advantages = blockContent.advantages || [];

  // V2: Direct array update handlers - use (handleContentUpdate as any) for array types
  const handleTitleEdit = (id: string, newTitle: string) => {
    const updated = advantages.map(a =>
      a.id === id ? { ...a, title: newTitle } : a
    );
    (handleContentUpdate as any)('advantages', updated);
  };

  const handleDescriptionEdit = (id: string, newDescription: string) => {
    const updated = advantages.map(a =>
      a.id === id ? { ...a, description: newDescription } : a
    );
    (handleContentUpdate as any)('advantages', updated);
  };

  const handleIconEdit = (id: string, newIcon: string) => {
    const updated = advantages.map(a =>
      a.id === id ? { ...a, icon: newIcon } : a
    );
    (handleContentUpdate as any)('advantages', updated);
  };

  // V2: Direct array push
  const handleAddAdvantage = () => {
    const newId = `a${Date.now()}`;
    const updated = [
      ...advantages,
      {
        id: newId,
        title: 'New Advantage',
        description: 'Describe this technical advantage.'
      }
    ];
    (handleContentUpdate as any)('advantages', updated);
  };

  // V2: Direct array filter
  const handleRemoveAdvantage = (id: string) => {
    const updated = advantages.filter(a => a.id !== id);
    (handleContentUpdate as any)('advantages', updated);
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
        {/* Header Section */}
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

        {/* Advantage Cards Grid */}
        {(() => {
          const layout = getDynamicCardLayout(advantages.length);
          const renderCard = (advantage: Advantage, cardClass: string) => (
            <AdvantageCard
              key={advantage.id}
              advantage={advantage}
              mode={mode}
              colorTokens={colorTokens}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onRemoveAdvantage={handleRemoveAdvantage}
              sectionId={sectionId}
              canRemove={advantages.length > 3}
              cardStyles={cardStyles}
              iconGradient={iconGradient}
              cardClassName={cardClass}
            />
          );
          return isSplitLayout(advantages.length) && layout.splitLayout ? (
            <div className={layout.containerClass}>
              <div className={layout.splitLayout.firstRowGrid}>
                {advantages.slice(0, layout.splitLayout.firstRowCount).map((advantage) =>
                  renderCard(advantage, layout.splitLayout!.firstRowCard)
                )}
              </div>
              <div className={layout.splitLayout.secondRowGrid}>
                {advantages.slice(layout.splitLayout.firstRowCount).map((advantage) =>
                  renderCard(advantage, layout.splitLayout!.secondRowCard)
                )}
              </div>
            </div>
          ) : (
            <div className={layout.containerClass}>
              <div className={layout.gridClass}>
                {advantages.map((advantage) => renderCard(advantage, layout.cardClass))}
              </div>
            </div>
          );
        })()}

        {/* Add Button - enforce max:6 */}
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
