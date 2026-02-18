// MethodologyBreakdown.tsx - V2: Clean array-based principles and results
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText, EditableText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { inferIconFromText } from '@/lib/iconCategoryMap';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { cn } from '@/lib/utils';
import { getCardStyles, CardStyles } from '@/modules/Design/cardStyles';

// V2: Principle item structure - clean array item
interface Principle {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// V2: Result item structure - clean array item
interface Result {
  id: string;
  metric: string;
  label: string;
}

// V2: Content interface - uses clean arrays
interface MethodologyBreakdownContent {
  headline: string;
  methodology_name: string;
  methodology_description: string;
  subheadline?: string;
  results_title?: string;
  methodology_icon?: string;
  principles: Principle[];
  results?: Result[];
}

// CONTENT_SCHEMA removed — defaults now in layoutElementSchema.ts (MethodologyBreakdown entry)

// Theme-based extras (non-card elements: headers, results, buttons)
const getThemeExtras = (theme: UIBlockTheme) => ({
  warm: {
    headerGradient: 'from-orange-600 to-red-600',
    headerSubtext: 'text-orange-100',
    resultMetricText: 'text-orange-600',
    resultsBg: 'bg-orange-50',
    addButtonBg: 'bg-orange-600 hover:bg-orange-700',
    focusRing: 'focus:ring-orange-500'
  },
  cool: {
    headerGradient: 'from-blue-600 to-indigo-700',
    headerSubtext: 'text-blue-100',
    resultMetricText: 'text-blue-600',
    resultsBg: 'bg-blue-50',
    addButtonBg: 'bg-blue-600 hover:bg-blue-700',
    focusRing: 'focus:ring-blue-500'
  },
  neutral: {
    headerGradient: 'from-gray-700 to-gray-800',
    headerSubtext: 'text-gray-200',
    resultMetricText: 'text-gray-700',
    resultsBg: 'bg-gray-50',
    addButtonBg: 'bg-gray-600 hover:bg-gray-700',
    focusRing: 'focus:ring-gray-500'
  }
})[theme];

// Principle Card component
const PrincipleCard = React.memo(({
  principle,
  mode,
  colorTokens,
  onNameEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemovePrinciple,
  sectionId,
  backgroundType,
  sectionBackground,
  canRemove = true,
  cardStyles,
  cardClassName
}: {
  principle: Principle;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onNameEdit: (id: string, value: string) => void;
  onDescriptionEdit: (id: string, value: string) => void;
  onIconEdit?: (id: string, value: string) => void;
  onRemovePrinciple?: (id: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground?: string;
  canRemove?: boolean;
  cardStyles: CardStyles;
  cardClassName?: string;
}) => {
  // Get icon - use stored value or derive from name/description
  const displayIcon = principle.icon || inferIconFromText(principle.name, principle.description);

  return (
    <div className={cn(
      'group relative rounded-2xl',
      cardStyles.bg,
      cardStyles.blur,
      cardStyles.border,
      cardStyles.shadow,
      cardStyles.hoverEffect,
      'transition-all duration-300 hover:-translate-y-1',
      cardClassName || 'p-8'
    )}>
      {/* Delete button */}
      {mode !== 'preview' && onRemovePrinciple && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePrinciple(principle.id);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10"
          title="Remove this principle"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 ${cardStyles.iconBg} rounded-lg flex items-center justify-center mb-4`}>
        <IconEditableText
          mode={mode}
          value={displayIcon}
          onEdit={(value) => onIconEdit && onIconEdit(principle.id, value)}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="md"
          className={cardStyles.iconColor}
          placeholder="Sparkles"
          sectionId={sectionId}
          elementKey={`principle_icon_${principle.id}`}
        />
      </div>

      {/* Principle Name */}
      <div className="mb-3">
        <EditableAdaptiveText
          mode={mode}
          value={principle.name}
          onEdit={(value) => onNameEdit(principle.id, value)}
          backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary'}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{ fontWeight: 700, fontSize: '1.25rem' }}
          className={cardStyles.textHeading}
          sectionId={sectionId}
          elementKey={`principle_name_${principle.id}`}
          sectionBackground={sectionBackground}
        />
      </div>

      {/* Principle Description */}
      <EditableAdaptiveText
        mode={mode}
        value={principle.description}
        onEdit={(value) => onDescriptionEdit(principle.id, value)}
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary'}
        colorTokens={colorTokens}
        variant="body"
        className={cardStyles.textBody}
        sectionId={sectionId}
        elementKey={`principle_description_${principle.id}`}
        sectionBackground={sectionBackground}
      />
    </div>
  );
});

PrincipleCard.displayName = 'PrincipleCard';

export default function MethodologyBreakdown(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<MethodologyBreakdownContent>({
    ...props
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const themeExtras = getThemeExtras(uiTheme);

  // Card styles from luminance-based system
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiTheme
    });
  }, [sectionBackground, uiTheme]);

  // Ensure principles is always an array
  const principles: Principle[] = Array.isArray(blockContent.principles) ? blockContent.principles : [];
  const results: Result[] = Array.isArray(blockContent.results) ? blockContent.results : [];

  // Get methodology icon
  const methodologyIcon = blockContent.methodology_icon || inferIconFromText(blockContent.methodology_name, blockContent.methodology_description);

  // V2: Array-based handlers (cast to any for array updates)
  const handlePrincipleNameEdit = (id: string, value: string) => {
    const updated = principles.map(p => p.id === id ? { ...p, name: value } : p);
    (handleContentUpdate as any)('principles', updated);
  };

  const handlePrincipleDescriptionEdit = (id: string, value: string) => {
    const updated = principles.map(p => p.id === id ? { ...p, description: value } : p);
    (handleContentUpdate as any)('principles', updated);
  };

  const handlePrincipleIconEdit = (id: string, value: string) => {
    const updated = principles.map(p => p.id === id ? { ...p, icon: value } : p);
    (handleContentUpdate as any)('principles', updated);
  };

  const handleAddPrinciple = () => {
    const newId = `p${Date.now()}`;
    const newPrinciple: Principle = {
      id: newId,
      name: 'New Principle',
      description: 'Describe this methodology principle.'
    };
    (handleContentUpdate as any)('principles', [...principles, newPrinciple]);
  };

  const handleRemovePrinciple = (id: string) => {
    const updated = principles.filter(p => p.id !== id);
    (handleContentUpdate as any)('principles', updated);
  };

  const handleResultMetricEdit = (id: string, value: string) => {
    const updated = results.map(r => r.id === id ? { ...r, metric: value } : r);
    (handleContentUpdate as any)('results', updated);
  };

  const handleResultLabelEdit = (id: string, value: string) => {
    const updated = results.map(r => r.id === id ? { ...r, label: value } : r);
    (handleContentUpdate as any)('results', updated);
  };

  // Dynamic card layout
  const layout = getDynamicCardLayout(principles.length);

  // Helper to render principle card
  const renderPrincipleCard = (principle: Principle, cardClass: string) => (
    <PrincipleCard
      key={principle.id}
      principle={principle}
      mode={mode}
      colorTokens={colorTokens}
      onNameEdit={handlePrincipleNameEdit}
      onDescriptionEdit={handlePrincipleDescriptionEdit}
      onIconEdit={handlePrincipleIconEdit}
      onRemovePrinciple={handleRemovePrinciple}
      sectionId={sectionId}
      backgroundType={props.backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      canRemove={principles.length > 3}
      cardStyles={cardStyles}
      cardClassName={cardClass}
    />
  );

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MethodologyBreakdown"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}
              className="max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Methodology Header */}
        <div className={`bg-gradient-to-r ${themeExtras.headerGradient} rounded-2xl p-12 text-white text-center mb-12`}>
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconEditableText
              mode={mode}
              value={methodologyIcon}
              onEdit={(value) => handleContentUpdate('methodology_icon', value)}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="xl"
              className="text-white text-3xl"
              placeholder="Brain"
              sectionId={sectionId}
              elementKey="methodology_icon"
            />
          </div>
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.methodology_name || ''}
            onEdit={(value) => handleContentUpdate('methodology_name', value)}
            level="h2"
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            className="text-white mb-4"
            sectionId={sectionId}
            elementKey="methodology_name"
            sectionBackground="bg-gradient-primary"
          />
          <EditableText
            mode={mode}
            value={blockContent.methodology_description || ''}
            onEdit={(value) => handleContentUpdate('methodology_description', value)}
            colorClass={themeExtras.headerSubtext}
            textStyle={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}
            className="max-w-3xl mx-auto"
            sectionId={sectionId}
            elementKey="methodology_description"
            backgroundType="primary"
            colorTokens={colorTokens}
          />
        </div>

        {/* Principles Grid */}
        {principles.length > 0 && (
          isSplitLayout(principles.length) && layout.splitLayout ? (
            <div className={`mb-12 ${layout.containerClass}`}>
              <div className={layout.splitLayout.firstRowGrid}>
                {principles.slice(0, layout.splitLayout.firstRowCount).map((principle) =>
                  renderPrincipleCard(principle, layout.splitLayout!.firstRowCard)
                )}
              </div>
              <div className={layout.splitLayout.secondRowGrid}>
                {principles.slice(layout.splitLayout.firstRowCount).map((principle) =>
                  renderPrincipleCard(principle, layout.splitLayout!.secondRowCard)
                )}
              </div>
            </div>
          ) : (
            <div className={`mb-12 ${layout.containerClass}`}>
              <div className={layout.gridClass}>
                {principles.map((principle) =>
                  renderPrincipleCard(principle, layout.cardClass)
                )}
              </div>
            </div>
          )
        )}

        {/* Add Principle Button */}
        {mode === 'edit' && principles.length < 6 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddPrinciple}
              className={`inline-flex items-center gap-2 px-6 py-3 ${themeExtras.addButtonBg} text-white rounded-lg transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Principle
            </button>
          </div>
        )}

        {/* Results Section - with container background for visual separation */}
        {results.length > 0 && (
          <div className={`mt-16 ${themeExtras.resultsBg} rounded-2xl p-8`}>
            {blockContent.results_title && (
              <EditableAdaptiveHeadline
                mode={mode}
                value={blockContent.results_title}
                onEdit={(value) => handleContentUpdate('results_title', value)}
                level="h3"
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
                colorTokens={colorTokens}
                className="text-center mb-8"
                sectionId={sectionId}
                elementKey="results_title"
                sectionBackground={sectionBackground}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {results.map((result) => (
                <div key={result.id} className="text-center">
                  <div className={`text-4xl font-bold ${themeExtras.resultMetricText} mb-2`}>
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleResultMetricEdit(result.id, e.currentTarget.textContent || '')}
                        className={`outline-none focus:ring-2 ${themeExtras.focusRing} focus:ring-opacity-50 rounded px-1 cursor-text`}
                      >
                        {result.metric}
                      </div>
                    ) : (
                      <span>{result.metric}</span>
                    )}
                  </div>
                  <div className={cardStyles.textBody}>
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleResultLabelEdit(result.id, e.currentTarget.textContent || '')}
                        className={`outline-none focus:ring-2 ${themeExtras.focusRing} focus:ring-opacity-50 rounded px-1 cursor-text`}
                      >
                        {result.label}
                      </div>
                    ) : (
                      <span>{result.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'MethodologyBreakdown',
  category: 'Unique Mechanism',
  description: 'Break down your methodology with principles and proven results',
  defaultBackgroundType: 'secondary' as const
};
