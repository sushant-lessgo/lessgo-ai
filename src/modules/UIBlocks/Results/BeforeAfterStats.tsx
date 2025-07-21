import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

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
}

// Content schema for BeforeAfterStats layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'See the Transformation Our Customers Experience' },
  stat_metrics: { type: 'string' as const, default: 'Time Spent on Tasks|Monthly Revenue|Customer Satisfaction|Team Productivity' },
  stat_before: { type: 'string' as const, default: '8 hours/day|$25K|72%|40%' },
  stat_after: { type: 'string' as const, default: '2 hours/day|$75K|96%|85%' },
  stat_improvements: { type: 'string' as const, default: '75% faster|200% increase|24% improvement|45% boost' },
  subheadline: { type: 'string' as const, default: 'Real results from companies who transformed their operations with our solution' },
  time_period: { type: 'string' as const, default: 'Results achieved within 90 days' }
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

// Individual Stat Comparison Component
const StatComparisonCard = ({ 
  stat, 
  index, 
  mode, 
  sectionId,
  onMetricEdit,
  onBeforeEdit,
  onAfterEdit,
  onImprovementEdit
}: {
  stat: StatComparison;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onMetricEdit: (index: number, value: string) => void;
  onBeforeEdit: (index: number, value: string) => void;
  onAfterEdit: (index: number, value: string) => void;
  onImprovementEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
      
      {/* Metric Label */}
      <div className="mb-6 text-center">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onMetricEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
            style={getTextStyle('h4')}
          >
            {stat.metric}
          </div>
        ) : (
          <h3 
            className="font-semibold text-gray-900"
            style={getTextStyle('h4')}
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
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-red-800">Before</span>
          </div>
          
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onBeforeEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-red-900"
              style={getTextStyle('h3')}
            >
              {stat.before}
            </div>
          ) : (
            <span 
              className="font-bold text-red-900 text-xl"
              style={getTextStyle('h3')}
            >
              {stat.before}
            </span>
          )}
        </div>

        {/* Arrow Indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* After State */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-800">After</span>
          </div>
          
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onAfterEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-green-900"
              style={getTextStyle('h3')}
            >
              {stat.after}
            </div>
          ) : (
            <span 
              className="font-bold text-green-900 text-xl"
              style={getTextStyle('h3')}
            >
              {stat.after}
            </span>
          )}
        </div>
      </div>

      {/* Improvement Badge */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white font-semibold text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {mode === 'edit' ? (
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
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h1')}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              textStyle={getTextStyle('body-lg')}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline describing the transformation results..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Time Period Badge */}
          {(blockContent.time_period || mode === 'edit') && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-800">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mode === 'edit' ? (
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
              onMetricEdit={handleMetricEdit}
              onBeforeEdit={handleBeforeEdit}
              onAfterEdit={handleAfterEdit}
              onImprovementEdit={handleImprovementEdit}
            />
          ))}
        </div>

        {/* Results Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-800">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Average results across 500+ implementations</span>
          </div>
        </div>

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