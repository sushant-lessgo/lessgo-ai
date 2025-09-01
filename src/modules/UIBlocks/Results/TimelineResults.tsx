import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TimelineResultsProps extends LayoutComponentProps {}

// Timeline milestone structure
interface TimelineMilestone {
  timeframe: string;
  title: string;
  description: string;
  metric?: string;
  id: string;
}

// Content interface for TimelineResults layout
interface TimelineResultsContent {
  headline: string;
  timeframes: string;
  titles: string;
  descriptions: string;
  metrics?: string;
  subheadline?: string;
  timeline_period?: string;
  metric_icon?: string;
  timeline_icon?: string;
  success_icon?: string;
}

// Content schema for TimelineResults layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'See Your Progress Over Time' },
  timeframes: { type: 'string' as const, default: 'Day 1|Week 2|Month 1|Month 3|Month 6|Year 1' },
  titles: { type: 'string' as const, default: 'Setup Complete|First Wins|Momentum Building|Full Optimization|Scale Achieved|Market Leadership' },
  descriptions: { type: 'string' as const, default: 'Quick 15-minute setup gets you running immediately|See first productivity gains and time savings|Workflows optimized, team fully onboarded|Maximum efficiency reached, processes perfected|Scaling confidently with automated systems|Industry-leading performance and recognition' },
  metrics: { type: 'string' as const, default: '15 min setup|20% faster|50% efficiency|80% automation|3x growth|#1 in category' },
  subheadline: { type: 'string' as const, default: 'Track your transformation journey from day one to market leadership' },
  timeline_period: { type: 'string' as const, default: 'Typical customer journey over 12 months' },
  metric_icon: { type: 'string' as const, default: '📈' },
  timeline_icon: { type: 'string' as const, default: '⏰' },
  success_icon: { type: 'string' as const, default: '✅' }
};

// Parse timeline data from pipe-separated strings
const parseTimelineData = (
  timeframes: string, 
  titles: string, 
  descriptions: string, 
  metrics?: string
): TimelineMilestone[] => {
  const timeframeList = timeframes.split('|').map(t => t.trim()).filter(t => t);
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const metricList = metrics ? metrics.split('|').map(m => m.trim()).filter(m => m) : [];
  
  return timeframeList.map((timeframe, index) => ({
    id: `milestone-${index}`,
    timeframe,
    title: titleList[index] || 'Milestone',
    description: descriptionList[index] || 'Great progress made',
    metric: metricList[index] || undefined
  }));
};

// Individual Timeline Milestone Component
const TimelineMilestone = ({ 
  milestone, 
  index, 
  isLast,
  mode, 
  sectionId,
  onTimeframeEdit,
  onTitleEdit,
  onDescriptionEdit,
  onMetricEdit,
  metricIcon,
  onMetricIconEdit,
  colorTokens
}: {
  milestone: TimelineMilestone;
  index: number;
  isLast: boolean;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTimeframeEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onMetricEdit: (index: number, value: string) => void;
  metricIcon?: string;
  onMetricIconEdit: (value: string) => void;
  colorTokens: any;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="relative flex items-start space-x-6 pb-12">
      
      {/* Timeline Line and Node */}
      <div className="relative flex flex-col items-center">
        {/* Timeline Node */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10">
          <span className="text-white font-bold text-sm">{index + 1}</span>
        </div>
        
        {/* Timeline Line */}
        {!isLast && (
          <div className="w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-300 absolute top-12 left-1/2 transform -translate-x-1/2"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-2">
        
        {/* Timeframe Badge */}
        <div className="mb-4">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTimeframeEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 min-h-[24px] cursor-text hover:bg-gray-50 inline-block bg-blue-100 text-blue-800 font-semibold text-sm rounded-full px-3 py-1"
            >
              {milestone.timeframe}
            </div>
          ) : (
            <span className="inline-block bg-blue-100 text-blue-800 font-semibold text-sm rounded-full px-3 py-1">
              {milestone.timeframe}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-3">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
            >
              {milestone.title}
            </div>
          ) : (
            <h3 
              className="font-bold text-gray-900"
            >
              {milestone.title}
            </h3>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
            >
              {milestone.description}
            </div>
          ) : (
            <p 
              className="text-gray-600 leading-relaxed"
            >
              {milestone.description}
            </p>
          )}
        </div>

        {/* Optional Metric */}
        {(milestone.metric || mode !== 'preview') && (
          <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <IconEditableText
              mode={mode}
              value={metricIcon || '📈'}
              onEdit={onMetricIconEdit}
              backgroundType="neutral"
              colorTokens={colorTokens}
              iconSize="sm"
              className="text-green-600 text-sm mr-2"
              sectionId={sectionId}
              elementKey="metric_icon"
            />
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onMetricEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text font-semibold text-green-800 ${!milestone.metric ? 'opacity-50 italic' : ''}`}
              >
                {milestone.metric || 'Add metric...'}
              </div>
            ) : milestone.metric && (
              <span 
                className="font-semibold text-green-800"
              >
                {milestone.metric}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function TimelineResults(props: TimelineResultsProps) {
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
  } = useLayoutComponent<TimelineResultsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse timeline data
  const milestones = parseTimelineData(
    blockContent.timeframes,
    blockContent.titles,
    blockContent.descriptions,
    blockContent.metrics
  );

  // Handle individual editing
  const handleTimeframeEdit = (index: number, value: string) => {
    const timeframeList = blockContent.timeframes.split('|');
    timeframeList[index] = value;
    handleContentUpdate('timeframes', timeframeList.join('|'));
  };

  const handleTitleEdit = (index: number, value: string) => {
    const titleList = blockContent.titles.split('|');
    titleList[index] = value;
    handleContentUpdate('titles', titleList.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptionList = blockContent.descriptions.split('|');
    descriptionList[index] = value;
    handleContentUpdate('descriptions', descriptionList.join('|'));
  };

  const handleMetricEdit = (index: number, value: string) => {
    const metricList = blockContent.metrics ? blockContent.metrics.split('|') : [];
    metricList[index] = value;
    handleContentUpdate('metrics', metricList.join('|'));
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="TimelineResults"
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
          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline describing the transformation timeline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Timeline Period */}
          {(blockContent.timeline_period || mode !== 'preview') && (
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-800">
              <IconEditableText
                mode={mode}
                value={blockContent.timeline_icon || '⏰'}
                onEdit={(value) => handleContentUpdate('timeline_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-indigo-600 text-sm mr-2"
                sectionId={sectionId}
                elementKey="timeline_icon"
              />
              {mode !== 'preview' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('timeline_period', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text font-medium"
                >
                  {blockContent.timeline_period}
                </div>
              ) : (
                <span className="font-medium">{blockContent.timeline_period}</span>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {milestones.map((milestone, index) => (
            <TimelineMilestone
              key={milestone.id}
              milestone={milestone}
              index={index}
              isLast={index === milestones.length - 1}
              mode={mode}
              sectionId={sectionId}
              onTimeframeEdit={handleTimeframeEdit}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onMetricEdit={handleMetricEdit}
              metricIcon={blockContent.metric_icon}
              onMetricIconEdit={(value) => handleContentUpdate('metric_icon', value)}
              colorTokens={colorTokens}
            />
          ))}
        </div>

        {/* Success Indicator */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-4">
              <IconEditableText
                mode={mode}
                value={blockContent.success_icon || '✅'}
                onEdit={(value) => handleContentUpdate('success_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="md"
                className="text-white text-xl"
                sectionId={sectionId}
                elementKey="success_icon"
              />
            </div>
            <div className="text-left">
              <div className="font-bold text-emerald-900 text-lg">Success Guaranteed</div>
              <div className="text-emerald-700 text-sm">Follow this proven timeline to achievement</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'TimelineResults',
  category: 'Results',
  description: 'Results shown over time progression with milestone tracking',
  tags: ['timeline', 'progression', 'milestones', 'transformation', 'journey'],
  features: [
    'Visual timeline with numbered milestones',
    'Timeframe badges for each stage',
    'Optional metrics for each milestone',
    'Gradient timeline connector',
    'Success guarantee indicator',
    'Individual editing for all timeline elements'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    timeframes: 'Pipe-separated list of time periods',
    titles: 'Pipe-separated list of milestone titles',
    descriptions: 'Pipe-separated list of milestone descriptions',
    metrics: 'Optional pipe-separated list of metrics for each milestone',
    subheadline: 'Optional subheading for context',
    timeline_period: 'Optional overall timeline period description'
  },
  examples: [
    'Customer onboarding journey',
    'Product implementation timeline',
    'Business transformation stages',
    'Skill development progression'
  ]
};