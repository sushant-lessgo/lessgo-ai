import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

// V2 Types (no icon - metrics draw attention on their own)
interface MetricItem {
  id: string;
  title: string;
  metric: string;
  label: string;
  description: string;
}

interface RoiMetricItem {
  id: string;
  metric: string;
  label: string;
}

interface MetricTilesContent {
  headline: string;
  subheadline?: string;
  show_roi_summary?: boolean;
  roi_summary_title?: string;
  roi_description?: string;
  metrics: MetricItem[];
  roi_metrics?: RoiMetricItem[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Quantifiable Results That Drive ROI'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  show_roi_summary: {
    type: 'boolean' as const,
    default: true
  },
  roi_summary_title: {
    type: 'string' as const,
    default: 'Proven Return on Investment'
  },
  roi_description: {
    type: 'string' as const,
    default: 'Based on independent analysis of 500+ enterprise implementations'
  },
  metrics: {
    type: 'array' as const,
    default: [
      { id: 'm1', title: 'Efficiency Boost', metric: '300%', label: 'faster processing', description: 'Automate manual processes and reduce task completion time by 300% with our intelligent workflow engine.' },
      { id: 'm2', title: 'Cost Reduction', metric: '$2.4M', label: 'annual savings', description: 'Save an average of $2.4M annually through reduced operational costs and improved resource allocation.' },
      { id: 'm3', title: 'Error Prevention', metric: '99.9%', label: 'accuracy rate', description: 'Achieve 99.9% accuracy with our AI-powered error detection and automatic correction systems.' },
      { id: 'm4', title: 'Revenue Growth', metric: '47%', label: 'revenue increase', description: 'Drive 47% revenue growth through optimized processes and improved customer satisfaction.' }
    ]
  },
  roi_metrics: {
    type: 'array' as const,
    default: [
      { id: 'r1', metric: '6 Months', label: 'Average Payback Period' },
      { id: 'r2', metric: '400%', label: 'Average ROI in Year 1' },
      { id: 'r3', metric: '$5.2M', label: 'Average 3-Year Value' }
    ]
  }
};

// Theme-based card styling (per uiBlockTheme.md)
const getCardStyles = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    shadow: shadows.card.warm,
    hover: shadows.cardHover.warm,
  },
  cool: {
    border: 'border-blue-200',
    shadow: shadows.card.cool,
    hover: shadows.cardHover.cool,
  },
  neutral: {
    border: 'border-gray-200',
    shadow: shadows.card.neutral,
    hover: shadows.cardHover.neutral,
  }
})[theme];

// Theme-based metric text color
const getMetricTextColor = (theme: UIBlockTheme) => ({
  warm: 'text-orange-600',
  cool: 'text-blue-600',
  neutral: 'text-gray-700'
})[theme];

// Theme-based ROI section colors
const getMetricTilesThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      roiBgGradient: 'from-orange-50 via-red-50 to-orange-50',
      roiBorder: 'border-orange-100',
      roiMetricColors: ['text-orange-600', 'text-red-600', 'text-orange-700']
    },
    cool: {
      roiBgGradient: 'from-blue-50 via-indigo-50 to-blue-50',
      roiBorder: 'border-blue-100',
      roiMetricColors: ['text-blue-600', 'text-indigo-600', 'text-blue-700']
    },
    neutral: {
      roiBgGradient: 'from-gray-50 via-slate-50 to-gray-50',
      roiBorder: 'border-gray-100',
      roiMetricColors: ['text-gray-600', 'text-slate-600', 'text-gray-700']
    }
  }[theme];
};

const MetricTile = React.memo(({
  item,
  colorTokens,
  mutedTextColor,
  h3Style,
  mode,
  onUpdate,
  onDelete,
  sectionId,
  backgroundType,
  sectionBackground,
  theme
}: {
  item: MetricItem;
  colorTokens: any;
  mutedTextColor: string;
  h3Style: any;
  mode: 'edit' | 'preview';
  onUpdate: (id: string, field: keyof MetricItem, value: string) => void;
  onDelete: (id: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  theme: UIBlockTheme;
}) => {
  const cardStyles = getCardStyles(theme);

  return (
    <div className={`group/metric-tile relative bg-white ${cardEnhancements.borderRadius} p-8 border ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hover} ${cardEnhancements.hoverLift} ${cardEnhancements.transition} h-full flex flex-col`}>

      {/* Delete Button */}
      {mode === 'edit' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="opacity-0 group-hover/metric-tile:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/90 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
          title="Remove this metric tile"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Title */}
      <EditableAdaptiveText
        mode={mode}
        value={item.title}
        onEdit={(value) => onUpdate(item.id, 'title', value)}
        backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType as any || 'neutral')}
        colorTokens={colorTokens}
        variant="body"
        textStyle={{
          ...h3Style,
          fontWeight: 'bold'
        }}
        className="mb-4"
        placeholder="Feature title..."
        sectionId={sectionId}
        elementKey={`metric_title_${item.id}`}
        sectionBackground={sectionBackground}
      />

      {/* Metric Box */}
      <div className="text-center bg-gray-50 rounded-lg p-4 mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={item.metric}
          onEdit={(value) => onUpdate(item.id, 'metric', value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className={`text-4xl font-bold ${getMetricTextColor(theme)}`}
          placeholder="Metric..."
          sectionId={sectionId}
          elementKey={`metric_value_${item.id}`}
          sectionBackground="bg-gray-50"
        />
        <EditableAdaptiveText
          mode={mode}
          value={item.label}
          onEdit={(value) => onUpdate(item.id, 'label', value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className={`text-sm font-medium ${mutedTextColor} uppercase tracking-wide`}
          placeholder="Metric label..."
          sectionId={sectionId}
          elementKey={`metric_label_${item.id}`}
          sectionBackground="bg-gray-50"
        />
      </div>

      {/* Description */}
      <div className="mt-auto">
        <EditableAdaptiveText
          mode={mode}
          value={item.description}
          onEdit={(value) => onUpdate(item.id, 'description', value)}
          backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType as any || 'neutral')}
          colorTokens={colorTokens}
          variant="body"
          className={`${mutedTextColor} leading-relaxed text-sm`}
          placeholder="Feature description..."
          sectionId={sectionId}
          elementKey={`metric_description_${item.id}`}
          sectionBackground={sectionBackground}
        />
      </div>
    </div>
  );
});
MetricTile.displayName = 'MetricTile';

export default function MetricTiles(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<MetricTilesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect theme
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getMetricTilesThemeColors(theme);
  const cardStyles = getCardStyles(theme);

  // Arrays from content
  const metrics: MetricItem[] = blockContent.metrics || [];
  const roiMetrics: RoiMetricItem[] = blockContent.roi_metrics || [];

  // V2: Update handlers
  const handleMetricUpdate = (id: string, field: keyof MetricItem, value: string) => {
    const updated = metrics.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    );
    (handleContentUpdate as any)('metrics', updated);
  };

  const handleMetricDelete = (id: string) => {
    const updated = metrics.filter(m => m.id !== id);
    (handleContentUpdate as any)('metrics', updated);
  };

  const handleAddMetric = () => {
    const newId = `m${Date.now()}`;
    const newMetric: MetricItem = {
      id: newId,
      title: `Metric ${metrics.length + 1}`,
      metric: '100%',
      label: 'improvement',
      description: 'Add metric description here'
    };
    (handleContentUpdate as any)('metrics', [...metrics, newMetric]);
  };

  const handleRoiUpdate = (id: string, field: keyof RoiMetricItem, value: string) => {
    const updated = roiMetrics.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    );
    (handleContentUpdate as any)('roi_metrics', updated);
  };

  const handleRoiDelete = (id: string) => {
    const updated = roiMetrics.filter(r => r.id !== id);
    (handleContentUpdate as any)('roi_metrics', updated);
  };

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Grid columns based on count
  const getGridClass = (count: number) => {
    if (count === 1) return 'md:grid-cols-1 justify-items-center';
    if (count === 2) return 'md:grid-cols-2';
    if (count === 3) return 'md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'md:grid-cols-2 lg:grid-cols-3';
    return 'md:grid-cols-2 lg:grid-cols-4';
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MetricTiles"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your quantifiable benefits..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className={`grid ${getGridClass(metrics.length)} gap-6`}>
          {metrics.map((item) => (
            <MetricTile
              key={item.id}
              item={item}
              colorTokens={colorTokens}
              mutedTextColor={mutedTextColor}
              h3Style={h3Style}
              mode={mode}
              onUpdate={handleMetricUpdate}
              onDelete={handleMetricDelete}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              theme={theme}
            />
          ))}

          {/* Add Metric Tile Button */}
          {mode === 'edit' && metrics.length < 8 && (
            <div className={`bg-white ${cardEnhancements.borderRadius} p-8 border-2 border-dashed ${cardStyles.border} ${cardStyles.hover} ${cardEnhancements.hoverLift} ${cardEnhancements.transition} h-full flex flex-col items-center justify-center min-h-[250px]`}>
              <button
                onClick={handleAddMetric}
                className="w-full h-full flex flex-col items-center justify-center space-y-4 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                title="Add new metric tile"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Metric Tile</span>
              </button>
            </div>
          )}
        </div>

        {/* ROI Summary */}
        {blockContent.show_roi_summary !== false && (blockContent.roi_summary_title || roiMetrics.length > 0 || mode === 'edit') && (
          <div className={`mt-12 bg-gradient-to-r ${themeColors.roiBgGradient} rounded-2xl p-8 border ${themeColors.roiBorder}`}>
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.roi_summary_title || ''}
                onEdit={(value) => handleContentUpdate('roi_summary_title', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...getTypographyStyle('h2'),
                  fontWeight: 700
                }}
                className="mb-4"
                placeholder="ROI section title..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="roi_summary_title"
              />

              <div className="grid md:grid-cols-3 gap-8">
                {roiMetrics.map((item, index) => (
                  <div key={item.id} className="text-center group/roi-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.metric}
                      onEdit={(value) => handleRoiUpdate(item.id, 'metric', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-4xl font-bold ${themeColors.roiMetricColors[index % 3]} mb-2`}
                      placeholder="Metric"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`roi_metric_${item.id}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.label}
                      onEdit={(value) => handleRoiUpdate(item.id, 'label', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`roi_label_${item.id}`}
                    />
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoiDelete(item.id);
                        }}
                        className="opacity-0 group-hover/roi-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove ROI metric"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(blockContent.roi_description || mode === 'edit') && (
                <div className="mt-6">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.roi_description || ''}
                    onEdit={(value) => handleContentUpdate('roi_description', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`${mutedTextColor} max-w-2xl mx-auto`}
                    placeholder="ROI description..."
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="roi_description"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'MetricTiles',
  category: 'Features',
  description: 'Data-driven metric tiles showing quantifiable benefits. Perfect for B2B audiences and ROI-focused messaging.',
  tags: ['features', 'metrics', 'data-driven', 'ROI', 'business'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'metrics', label: 'Metrics (array)', type: 'array', required: true },
    { key: 'roi_summary_title', label: 'ROI Summary Title', type: 'text', required: false },
    { key: 'roi_metrics', label: 'ROI Metrics (array)', type: 'array', required: false },
    { key: 'roi_description', label: 'ROI Description', type: 'textarea', required: false }
  ],

  features: [
    'Large metric displays with theme-based colors',
    'Theme-based card styling (warm/cool/neutral)',
    'ROI summary section',
    'Data-driven presentation',
    'Perfect for B2B decision makers',
    'Quantifiable value propositions',
    'Up to 8 metric tiles'
  ],

  useCases: [
    'Business efficiency platforms',
    'Cost reduction tools',
    'Enterprise software ROI',
    'Data analytics products',
    'Performance optimization tools'
  ]
};
