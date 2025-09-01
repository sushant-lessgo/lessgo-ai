// components/layout/StackedStats.tsx
// Key metrics stacked vertically - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { SocialProofNumber } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';
import IconEditableText from '@/components/ui/IconEditableText';

// Content interface for type safety
interface StackedStatsContent {
  headline: string;
  subheadline?: string;
  metric_values: string;
  metric_labels: string;
  metric_descriptions?: string;
  progress_percentages?: string;
  metric_icon_1?: string;
  metric_icon_2?: string;
  metric_icon_3?: string;
  metric_icon_4?: string;
  metric_icon_5?: string;
  metric_icon_6?: string;
}

// Metric structure
interface StackedMetric {
  id: string;
  index: number;
  value: string;
  label: string;
  description?: string;
  progress?: number;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Proven Results That Speak for Themselves' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our platform delivers measurable impact across every key performance indicator that matters to your business.' 
  },
  metric_values: { 
    type: 'string' as const, 
    default: '10,000+|300%|99.9%|24/7|50M+|15min' 
  },
  metric_labels: { 
    type: 'string' as const, 
    default: 'Active Users|Revenue Growth|Uptime|Support|Data Points|Setup Time' 
  },
  metric_descriptions: { 
    type: 'string' as const, 
    default: 'Growing daily across 50+ countries|Average increase in first 6 months|Guaranteed service reliability|Around-the-clock customer support|Processed securely every month|Average time to get started' 
  },
  progress_percentages: { 
    type: 'string' as const, 
    default: '85|92|99|100|78|95' 
  },
  metric_icon_1: { type: 'string' as const, default: '👥' },
  metric_icon_2: { type: 'string' as const, default: '📈' },
  metric_icon_3: { type: 'string' as const, default: '✅' },
  metric_icon_4: { type: 'string' as const, default: '🛠️' },
  metric_icon_5: { type: 'string' as const, default: '💾' },
  metric_icon_6: { type: 'string' as const, default: '⏰' }
};

// Parse metric data from pipe-separated strings
const parseMetricData = (values: string, labels: string, descriptions?: string, progress?: string): StackedMetric[] => {
  const valueList = parsePipeData(values);
  const labelList = parsePipeData(labels);
  const descriptionList = descriptions ? parsePipeData(descriptions) : [];
  const progressList = progress ? parsePipeData(progress) : [];
  
  return valueList.map((value, index) => ({
    id: `metric-${index}`,
    index,
    value: value.trim(),
    label: labelList[index]?.trim() || `Metric ${index + 1}`,
    description: descriptionList[index]?.trim(),
    progress: progressList[index] ? parseInt(progressList[index]) : undefined
  }));
};

// Progress Bar Component
const ProgressBar = React.memo(({ 
  percentage, 
  color = 'blue' 
}: { 
  percentage: number;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };
  
  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-1000 ease-out`}
        style={{ 
          width: `${Math.min(percentage, 100)}%`,
          animation: 'slideIn 1.5s ease-out'
        }}
      />
      <style jsx>{`
        @keyframes slideIn {
          from { width: 0%; }
          to { width: ${Math.min(percentage, 100)}%; }
        }
      `}</style>
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// Function to get metric icon
const getMetricIcon = (index: number, blockContent: StackedStatsContent) => {
  const iconFields = ['metric_icon_1', 'metric_icon_2', 'metric_icon_3', 'metric_icon_4', 'metric_icon_5', 'metric_icon_6'];
  return blockContent[iconFields[index] as keyof StackedStatsContent] || ['👥', '📈', '✅', '🛠️', '💾', '⏰'][index] || '📊';
};

// Metric Card Component
const MetricCard = React.memo(({ 
  metric, 
  dynamicTextColors,
  getTextStyle,
  index,
  h2Style,
  bodyStyle,
  mode,
  blockContent,
  backgroundType,
  colorTokens,
  sectionId,
  handleContentUpdate
}: { 
  metric: StackedMetric;
  dynamicTextColors: any;
  getTextStyle: any;
  index: number;
  h2Style: any;
  bodyStyle: any;
  mode: 'edit' | 'preview';
  blockContent: StackedStatsContent;
  backgroundType: string;
  colorTokens: any;
  sectionId: string;
  handleContentUpdate: (key: keyof StackedStatsContent, value: string) => void;
}) => {
  
  // Color scheme for each metric
  const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
  const color = colors[index % colors.length];

  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`w-16 h-16 bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'green' ? 'from-green-500 to-green-600' :
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'orange' ? 'from-orange-500 to-orange-600' :
          color === 'red' ? 'from-red-500 to-red-600' :
          'from-indigo-500 to-indigo-600'
        } rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <IconEditableText
            mode={mode}
            value={getMetricIcon(index, blockContent)}
            onEdit={(value) => {
              const iconField = `metric_icon_${index + 1}` as keyof StackedStatsContent;
              handleContentUpdate(iconField, value);
            }}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-3xl text-white"
            sectionId={sectionId}
            elementKey={`metric_icon_${index + 1}`}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <SocialProofNumber
              number={metric.value}
              label=""
              className={`${dynamicTextColors?.heading || 'text-gray-900'}`}
            />
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              {metric.label}
            </span>
          </div>
          
          {metric.description && (
            <p className={`text-sm ${dynamicTextColors?.body || 'text-gray-700'} leading-relaxed`}>
              {metric.description}
            </p>
          )}
          
          {metric.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-xs ${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  Progress
                </span>
                <span className={`text-xs font-bold ${dynamicTextColors?.body || 'text-gray-700'}`}>
                  {metric.progress}%
                </span>
              </div>
              <ProgressBar percentage={metric.progress} color={color} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MetricCard.displayName = 'MetricCard';

export default function StackedStats(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<StackedStatsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse metrics from pipe-separated strings
  const metrics = parseMetricData(
    blockContent.metric_values || '',
    blockContent.metric_labels || '',
    blockContent.metric_descriptions,
    blockContent.progress_percentages
  );

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedStats"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a compelling subheadline about your key metrics..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Stacked Metrics */}
        <div className="space-y-6">
          {metrics.slice(0, 6).map((metric, index) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
              index={index}
              h2Style={h2Style}
              bodyStyle={bodyStyle}
              mode={mode}
              blockContent={blockContent}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              sectionId={sectionId}
              handleContentUpdate={handleContentUpdate}
            />
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-2xl border border-white/10">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{...h3Style}} className={`${dynamicTextColors?.heading || 'text-gray-900'}`}>
                Trusted by Industry Leaders
              </span>
            </div>
            <p style={{...bodyLgStyle}} className={`${dynamicTextColors?.body || 'text-gray-700'} max-w-2xl mx-auto`}>
              Join thousands of companies that have already transformed their business with our proven platform.
            </p>
            <div className="flex items-center justify-center space-x-6 pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${dynamicTextColors?.heading || 'text-gray-900'}`}>
                  98%
                </div>
                <div className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  Customer Satisfaction
                </div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${dynamicTextColors?.heading || 'text-gray-900'}`}>
                  {"<3min"}
                </div>
                <div className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
                  Average Response Time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'StackedStats',
  category: 'Social Proof',
  description: 'Vertically stacked key metrics with progress indicators and detailed descriptions',
  tags: ['social-proof', 'metrics', 'statistics', 'progress', 'kpi'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '35 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'metric_values', label: 'Metric Values (pipe separated)', type: 'text', required: true },
    { key: 'metric_labels', label: 'Metric Labels (pipe separated)', type: 'text', required: true },
    { key: 'metric_descriptions', label: 'Metric Descriptions (pipe separated)', type: 'textarea', required: false },
    { key: 'progress_percentages', label: 'Progress Percentages (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Animated progress bars with color coding',
    'Icon-based metric categorization',
    'Hover effects with scaling animations',
    'Summary section with additional trust indicators'
  ],
  
  useCases: [
    'Business performance dashboard',
    'Product KPI showcase',
    'Service quality metrics',
    'Company achievement display',
    'Performance benchmark comparison'
  ]
};