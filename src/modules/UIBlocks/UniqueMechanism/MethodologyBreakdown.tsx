// MethodologyBreakdown.tsx - V2: Clean array-based principles and results
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIcon } from '@/lib/getIcon';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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

// V2: Content schema
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'The Science Behind Our Success' },
  methodology_name: { type: 'string' as const, default: 'Adaptive Intelligence Framework™' },
  methodology_description: { type: 'string' as const, default: 'Our proprietary methodology combines machine learning, behavioral psychology, and real-time optimization to deliver unprecedented results.' },
  subheadline: { type: 'string' as const, default: '' },
  results_title: { type: 'string' as const, default: 'Proven Results' },
  methodology_icon: { type: 'string' as const, default: 'lucide:brain' },
  principles: {
    type: 'array' as const,
    default: [
      { id: 'p1', name: 'Continuous Learning', description: 'System continuously learns from new data and user interactions' },
      { id: 'p2', name: 'Adaptive Optimization', description: 'Algorithms automatically adjust strategies based on performance' },
      { id: 'p3', name: 'Data-Driven Decisions', description: 'Every decision backed by comprehensive data analysis' }
    ]
  },
  results: {
    type: 'array' as const,
    default: [
      { id: 'r1', metric: '300%', label: 'Performance Increase' },
      { id: 'r2', metric: '85%', label: 'Time Saved' },
      { id: 'r3', metric: '99.7%', label: 'Accuracy Rate' },
      { id: 'r4', metric: '24/7', label: 'Autonomous Operation' }
    ]
  }
};

// Theme-based color mapping (design fixes applied: stronger borders, more saturated icons)
const getThemeColors = (theme: UIBlockTheme) => ({
  warm: {
    headerGradient: 'from-orange-600 to-red-600',
    headerSubtext: 'text-orange-100',
    cardBorder: 'border-orange-300',  // Fix: increased from 200
    cardHover: 'hover:border-orange-400',
    iconBg: 'bg-gradient-to-br from-orange-600 to-red-700',  // Fix: increased saturation
    resultMetricText: 'text-orange-600',
    resultsBg: 'bg-orange-50',
    addButtonBg: 'bg-orange-600 hover:bg-orange-700',
    focusRing: 'focus:ring-orange-500'
  },
  cool: {
    headerGradient: 'from-blue-600 to-indigo-700',
    headerSubtext: 'text-blue-100',
    cardBorder: 'border-blue-300',  // Fix: increased from 200
    cardHover: 'hover:border-blue-400',
    iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',  // Fix: increased saturation
    resultMetricText: 'text-blue-600',
    resultsBg: 'bg-blue-50',
    addButtonBg: 'bg-blue-600 hover:bg-blue-700',
    focusRing: 'focus:ring-blue-500'
  },
  neutral: {
    headerGradient: 'from-gray-700 to-gray-800',
    headerSubtext: 'text-gray-200',
    cardBorder: 'border-gray-300',  // Fix: increased from 200
    cardHover: 'hover:border-gray-400',
    iconBg: 'bg-gradient-to-br from-gray-600 to-gray-800',  // Fix: increased saturation
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
  theme = 'neutral'
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
  theme?: UIBlockTheme;
}) => {
  const themeColors = getThemeColors(theme);

  // Get icon - use stored value or derive from name/description
  const displayIcon = principle.icon
    ?? getIcon(undefined, { title: principle.name, description: principle.description })
    ?? 'lucide:sparkles';

  return (
    <div className={`group relative bg-white p-8 border ${themeColors.cardBorder} ${themeColors.cardHover} ${shadows.card[theme]} ${shadows.cardHover[theme]} ${cardEnhancements.hoverLift} ${cardEnhancements.transition} ${cardEnhancements.borderRadius}`}>
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
      <div className={`w-12 h-12 ${themeColors.iconBg} rounded-lg flex items-center justify-center text-white mb-4`}>
        <IconEditableText
          mode={mode}
          value={displayIcon}
          onEdit={(value) => onIconEdit && onIconEdit(principle.id, value)}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="md"
          className="text-white"
          placeholder="lucide:sparkles"
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
          backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{ fontWeight: 700, fontSize: '1.25rem' }}
          className="text-gray-900"
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
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')) as 'neutral' | 'primary' | 'secondary' | 'divider'}
        colorTokens={colorTokens}
        variant="body"
        className="text-gray-600"
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
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(uiTheme);

  // Ensure principles is always an array
  const principles = Array.isArray(blockContent.principles) ? blockContent.principles : [];
  const results = Array.isArray(blockContent.results) ? blockContent.results : [];

  // Get methodology icon
  const methodologyIcon = blockContent.methodology_icon
    ?? getIcon(undefined, { title: blockContent.methodology_name, description: blockContent.methodology_description })
    ?? 'lucide:brain';

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

  // Determine grid layout based on principle count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

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
        <div className={`bg-gradient-to-r ${themeColors.headerGradient} rounded-2xl p-12 text-white text-center mb-12`}>
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconEditableText
              mode={mode}
              value={methodologyIcon}
              onEdit={(value) => handleContentUpdate('methodology_icon', value)}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="xl"
              className="text-white text-3xl"
              placeholder="lucide:brain"
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
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.methodology_description || ''}
            onEdit={(value) => handleContentUpdate('methodology_description', value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textSecondary: themeColors.headerSubtext }}
            variant="body"
            className={`${themeColors.headerSubtext} text-lg max-w-3xl mx-auto`}
            sectionId={sectionId}
            elementKey="methodology_description"
            sectionBackground="bg-gradient-primary"
          />
        </div>

        {/* Principles Grid */}
        {principles.length > 0 && (
          <div className={`grid gap-6 lg:gap-8 mb-12 ${getGridClass(principles.length)}`}>
            {principles.map((principle) => (
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
                theme={uiTheme}
              />
            ))}
          </div>
        )}

        {/* Add Principle Button */}
        {mode === 'edit' && principles.length < 6 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddPrinciple}
              className={`inline-flex items-center gap-2 px-6 py-3 ${themeColors.addButtonBg} text-white rounded-lg transition-colors duration-200`}
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
          <div className={`mt-16 ${themeColors.resultsBg} rounded-2xl p-8`}>
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
                  <div className={`text-4xl font-bold ${themeColors.resultMetricText} mb-2`}>
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleResultMetricEdit(result.id, e.currentTarget.textContent || '')}
                        className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 cursor-text`}
                      >
                        {result.metric}
                      </div>
                    ) : (
                      <span>{result.metric}</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    {mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleResultLabelEdit(result.id, e.currentTarget.textContent || '')}
                        className={`outline-none focus:ring-2 ${themeColors.focusRing} focus:ring-opacity-50 rounded px-1 cursor-text`}
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
