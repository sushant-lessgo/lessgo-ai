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

interface BeforeAfterStatsProps extends LayoutComponentProps {}

// Stat comparison item structure
interface StatComparison {
  metric: string;
  before: string;
  after: string;
  improvement: string;
  id: string;
}

// Content interface for BeforeAfterStats layout
interface BeforeAfterStatsContent {
  headline: string;
  stat_metrics: string;
  stat_before: string;
  stat_after: string;
  stat_improvements: string;
  subheadline?: string;
  time_period?: string;
  footer_text?: string;
  before_icon?: string;
  after_icon?: string;
  improvement_icon?: string;
}

// Content schema for BeforeAfterStats layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'See the Transformation Our Customers Experience' },
  stat_metrics: { type: 'string' as const, default: 'Time Spent on Tasks|Monthly Revenue|Customer Satisfaction|Team Productivity' },
  stat_before: { type: 'string' as const, default: '8 hours/day|$25K|72%|40%' },
  stat_after: { type: 'string' as const, default: '2 hours/day|$75K|96%|85%' },
  stat_improvements: { type: 'string' as const, default: '75% faster|200% increase|24% improvement|45% boost' },
  subheadline: { type: 'string' as const, default: 'Real results from companies who transformed their operations with our solution' },
  time_period: { type: 'string' as const, default: 'Results achieved within 90 days' },
  footer_text: { type: 'string' as const, default: 'Average results across 500+ implementations' },
  before_icon: { type: 'string' as const, default: '❌' },
  after_icon: { type: 'string' as const, default: '✅' },
  improvement_icon: { type: 'string' as const, default: '📈' }
};

// Parse stat comparison data from pipe-separated strings
const parseStatData = (metrics: string, before: string, after: string, improvements: string): StatComparison[] => {
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const beforeList = before.split('|').map(b => b.trim()).filter(b => b);
  const afterList = after.split('|').map(a => a.trim()).filter(a => a);
  const improvementList = improvements.split('|').map(i => i.trim()).filter(i => i);

  return metricList.map((metric, index) => ({
    id: `stat-${index}`,
    metric,
    before: beforeList[index] || '0',
    after: afterList[index] || '0',
    improvement: improvementList[index] || '+0%'
  }));
};

// Helper function to add a new stat comparison
const addStatComparison = (metrics: string, before: string, after: string, improvements: string): {
  newMetrics: string;
  newBefore: string;
  newAfter: string;
  newImprovements: string;
} => {
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const beforeList = before.split('|').map(b => b.trim()).filter(b => b);
  const afterList = after.split('|').map(a => a.trim()).filter(a => a);
  const improvementList = improvements.split('|').map(i => i.trim()).filter(i => i);

  // Add new stat with default content
  metricList.push('New Metric');
  beforeList.push('Previous Value');
  afterList.push('New Value');
  improvementList.push('Improvement');

  return {
    newMetrics: metricList.join('|'),
    newBefore: beforeList.join('|'),
    newAfter: afterList.join('|'),
    newImprovements: improvementList.join('|')
  };
};

// Helper function to remove a stat comparison
const removeStatComparison = (metrics: string, before: string, after: string, improvements: string, indexToRemove: number): {
  newMetrics: string;
  newBefore: string;
  newAfter: string;
  newImprovements: string;
} => {
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m);
  const beforeList = before.split('|').map(b => b.trim()).filter(b => b);
  const afterList = after.split('|').map(a => a.trim()).filter(a => a);
  const improvementList = improvements.split('|').map(i => i.trim()).filter(i => i);

  // Remove the stat at the specified index
  if (indexToRemove >= 0 && indexToRemove < metricList.length) {
    metricList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < beforeList.length) {
    beforeList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < afterList.length) {
    afterList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < improvementList.length) {
    improvementList.splice(indexToRemove, 1);
  }

  return {
    newMetrics: metricList.join('|'),
    newBefore: beforeList.join('|'),
    newAfter: afterList.join('|'),
    newImprovements: improvementList.join('|')
  };
};

// Individual Stat Comparison Component
const StatComparisonCard = ({
  stat,
  index,
  mode,
  sectionId,
  blockContent,
  handleContentUpdate,
  onMetricEdit,
  onBeforeEdit,
  onAfterEdit,
  onImprovementEdit,
  onRemoveStatComparison,
  canRemove = true,
  cardBorder,
  arrowGradient,
  improvementGradient
}: {
  stat: StatComparison;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  blockContent: any;
  handleContentUpdate: (key: string, value: string) => void;
  onMetricEdit: (index: number, value: string) => void;
  onBeforeEdit: (index: number, value: string) => void;
  onAfterEdit: (index: number, value: string) => void;
  onImprovementEdit: (index: number, value: string) => void;
  onRemoveStatComparison?: (index: number) => void;
  canRemove?: boolean;
  cardBorder: string;
  arrowGradient: string;
  improvementGradient: string;
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className={`relative group/stat-card-${index} p-8 bg-white rounded-2xl border ${cardBorder} hover:shadow-xl transition-all duration-300`}>
      
      {/* Metric Label */}
      <div className="mb-6 text-center">
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onMetricEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
          >
            {stat.metric}
          </div>
        ) : (
          <h3 
            className="font-semibold text-gray-900"
          >
            {stat.metric}
          </h3>
        )}
      </div>

      {/* Before/After Comparison */}
      <div className="space-y-6">
        
        {/* Before State */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <IconEditableText
                mode={mode}
                value={blockContent.before_icon || '❌'}
                onEdit={(value) => handleContentUpdate('before_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-red-600 text-lg"
                sectionId={sectionId}
                elementKey="before_icon"
              />
            </div>
            <span className="text-sm font-medium text-red-800">Before</span>
          </div>
          
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onBeforeEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-red-900"
            >
              {stat.before}
            </div>
          ) : (
            <span 
              className="font-bold text-red-900 text-xl"
            >
              {stat.before}
            </span>
          )}
        </div>

        {/* Arrow Indicator */}
        <div className="flex justify-center">
          <div className={`w-8 h-8 bg-gradient-to-br ${arrowGradient} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <IconEditableText
              mode={mode}
              value="⬇️"
              onEdit={() => {}}
              backgroundType="neutral"
              colorTokens={{}}
              iconSize="sm"
              className="text-white text-sm"
              sectionId={sectionId}
              elementKey="arrow_icon"
            />
          </div>
        </div>

        {/* After State */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <IconEditableText
                mode={mode}
                value={blockContent.after_icon || '✅'}
                onEdit={(value) => handleContentUpdate('after_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-green-600 text-lg"
                sectionId={sectionId}
                elementKey="after_icon"
              />
            </div>
            <span className="text-sm font-medium text-green-800">After</span>
          </div>
          
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onAfterEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-green-900"
            >
              {stat.after}
            </div>
          ) : (
            <span 
              className="font-bold text-green-900 text-xl"
            >
              {stat.after}
            </span>
          )}
        </div>
      </div>

      {/* Improvement Badge */}
      <div className="mt-6 text-center">
        <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${improvementGradient} rounded-full text-white font-semibold text-sm`}>
          <IconEditableText
            mode={mode}
            value={blockContent.improvement_icon || '📈'}
            onEdit={(value) => handleContentUpdate('improvement_icon', value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="sm"
            className="text-white text-sm mr-2"
            sectionId={sectionId}
            elementKey="improvement_icon"
          />
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onImprovementEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text"
            >
              {stat.improvement}
            </div>
          ) : (
            <span>{stat.improvement}</span>
          )}
        </div>
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveStatComparison && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveStatComparison(index);
          }}
          className={`absolute top-4 right-4 opacity-0 group-hover/stat-card-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this stat comparison"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function BeforeAfterStats(props: BeforeAfterStatsProps) {
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
  } = useLayoutComponent<BeforeAfterStatsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-aware colors for accents (keep before=red, after=green semantic)
  const getCardBorderColors = (theme: UIBlockTheme) => {
    return {
      warm: 'border-gray-200 hover:border-orange-300',
      cool: 'border-gray-200 hover:border-blue-300',
      neutral: 'border-gray-200 hover:border-gray-300'
    }[theme];
  };

  const getArrowGradient = (theme: UIBlockTheme) => {
    return {
      warm: 'from-orange-500 to-red-600',
      cool: 'from-blue-500 to-indigo-600',
      neutral: 'from-gray-500 to-slate-600'
    }[theme];
  };

  const getImprovementBadgeGradient = (theme: UIBlockTheme) => {
    return {
      warm: 'from-orange-500 to-red-600',
      cool: 'from-blue-500 to-indigo-600',
      neutral: 'from-gray-600 to-slate-700'
    }[theme];
  };

  const getTimePeriodColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-600'
      },
      cool: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600'
      },
      neutral: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-600'
      }
    }[theme];
  };

  const cardBorder = getCardBorderColors(theme);
  const arrowGradient = getArrowGradient(theme);
  const improvementGradient = getImprovementBadgeGradient(theme);
  const timePeriodColors = getTimePeriodColors(theme);

  // Parse stat comparison data
  const statComparisons = parseStatData(
    blockContent.stat_metrics, 
    blockContent.stat_before, 
    blockContent.stat_after,
    blockContent.stat_improvements
  );

  // Handle individual editing
  const handleMetricEdit = (index: number, value: string) => {
    const metrics = blockContent.stat_metrics.split('|');
    metrics[index] = value;
    handleContentUpdate('stat_metrics', metrics.join('|'));
  };

  const handleBeforeEdit = (index: number, value: string) => {
    const before = blockContent.stat_before.split('|');
    before[index] = value;
    handleContentUpdate('stat_before', before.join('|'));
  };

  const handleAfterEdit = (index: number, value: string) => {
    const after = blockContent.stat_after.split('|');
    after[index] = value;
    handleContentUpdate('stat_after', after.join('|'));
  };

  const handleImprovementEdit = (index: number, value: string) => {
    const improvements = blockContent.stat_improvements.split('|');
    improvements[index] = value;
    handleContentUpdate('stat_improvements', improvements.join('|'));
  };

  // Handle adding a new stat comparison
  const handleAddStatComparison = () => {
    const { newMetrics, newBefore, newAfter, newImprovements } = addStatComparison(
      blockContent.stat_metrics,
      blockContent.stat_before,
      blockContent.stat_after,
      blockContent.stat_improvements
    );
    handleContentUpdate('stat_metrics', newMetrics);
    handleContentUpdate('stat_before', newBefore);
    handleContentUpdate('stat_after', newAfter);
    handleContentUpdate('stat_improvements', newImprovements);
  };

  // Handle removing a stat comparison
  const handleRemoveStatComparison = (indexToRemove: number) => {
    const { newMetrics, newBefore, newAfter, newImprovements } = removeStatComparison(
      blockContent.stat_metrics,
      blockContent.stat_before,
      blockContent.stat_after,
      blockContent.stat_improvements,
      indexToRemove
    );
    handleContentUpdate('stat_metrics', newMetrics);
    handleContentUpdate('stat_before', newBefore);
    handleContentUpdate('stat_after', newAfter);
    handleContentUpdate('stat_improvements', newImprovements);
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="BeforeAfterStats"
    >
      <div className="max-w-7xl mx-auto">
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
              placeholder="Add optional subheadline describing the transformation results..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Time Period Badge */}
          {(blockContent.time_period || mode === 'edit') && (
            <div className={`inline-flex items-center px-4 py-2 ${timePeriodColors.bg} border ${timePeriodColors.border} rounded-full ${timePeriodColors.text}`}>
              <svg className={`w-4 h-4 mr-2 ${timePeriodColors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mode !== 'preview' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('time_period', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text font-medium"
                >
                  {blockContent.time_period}
                </div>
              ) : (
                <span className="font-medium">{blockContent.time_period}</span>
              )}
            </div>
          )}
        </div>

        {/* Stats Comparison Grid */}
        <div className={`grid gap-8 ${
          statComparisons.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          statComparisons.length === 3 ? 'md:grid-cols-3 max-w-6xl mx-auto' :
          statComparisons.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {statComparisons.map((stat, index) => (
            <StatComparisonCard
              key={stat.id}
              stat={stat}
              index={index}
              mode={mode}
              sectionId={sectionId}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              onMetricEdit={handleMetricEdit}
              onBeforeEdit={handleBeforeEdit}
              onAfterEdit={handleAfterEdit}
              onImprovementEdit={handleImprovementEdit}
              onRemoveStatComparison={handleRemoveStatComparison}
              canRemove={statComparisons.length > 1}
              cardBorder={cardBorder}
              arrowGradient={arrowGradient}
              improvementGradient={improvementGradient}
            />
          ))}
        </div>

        {/* Add Stat Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && statComparisons.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddStatComparison}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Stat Comparison</span>
            </button>
          </div>
        )}

        {/* Results Footer */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-800">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium"
                placeholder="Add footer credibility text..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="footer_text"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'BeforeAfterStats',
  category: 'Results',
  description: 'Comparison statistics showing quantifiable improvement from before to after state',
  tags: ['stats', 'comparison', 'results', 'transformation', 'proof'],
  features: [
    'Before/after state comparison with visual indicators',
    'Improvement percentage badges',
    'Flexible grid layout based on stat count',
    'Time period credibility indicator',
    'Editable metrics with individual stat editing',
    'Visual progression arrows between states'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    stat_metrics: 'Pipe-separated list of metric names',
    stat_before: 'Pipe-separated list of before values',
    stat_after: 'Pipe-separated list of after values', 
    stat_improvements: 'Pipe-separated list of improvement descriptions',
    subheadline: 'Optional subheading for context',
    time_period: 'Optional time period for credibility'
  },
  examples: [
    'ROI and efficiency improvements',
    'Performance transformation metrics',
    'Cost reduction comparisons',
    'Time savings demonstrations'
  ]
};