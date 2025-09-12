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
  metric_icon_1?: string;
  metric_icon_2?: string;
  metric_icon_3?: string;
  metric_icon_4?: string;
  metric_icon_5?: string;
  metric_icon_6?: string;
  // Summary section fields
  summary_title?: string;
  summary_description?: string;
  customer_satisfaction_value?: string;
  customer_satisfaction_label?: string;
  response_time_value?: string;
  response_time_label?: string;
}

// Metric structure
interface StackedMetric {
  id: string;
  index: number;
  value: string;
  label: string;
  description?: string;
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
  metric_icon_1: { type: 'string' as const, default: '👥' },
  metric_icon_2: { type: 'string' as const, default: '📈' },
  metric_icon_3: { type: 'string' as const, default: '✅' },
  metric_icon_4: { type: 'string' as const, default: '🛠️' },
  metric_icon_5: { type: 'string' as const, default: '💾' },
  metric_icon_6: { type: 'string' as const, default: '⏰' },
  // Summary section content schema
  summary_title: {
    type: 'string' as const,
    default: 'Trusted by Industry Leaders'
  },
  summary_description: {
    type: 'string' as const,
    default: 'Join thousands of companies that have already transformed their business with our proven platform.'
  },
  customer_satisfaction_value: {
    type: 'string' as const,
    default: '98%'
  },
  customer_satisfaction_label: {
    type: 'string' as const,
    default: 'Customer Satisfaction'
  },
  response_time_value: {
    type: 'string' as const,
    default: '<3min'
  },
  response_time_label: {
    type: 'string' as const,
    default: 'Average Response Time'
  },
};

// Parse metric data from pipe-separated strings
const parseMetricData = (values: string, labels: string, descriptions?: string): StackedMetric[] => {
  const valueList = parsePipeData(values);
  const labelList = parsePipeData(labels);
  const descriptionList = descriptions ? parsePipeData(descriptions) : [];
  
  return valueList.map((value, index) => ({
    id: `metric-${index}`,
    index,
    value: value.trim(),
    label: labelList[index]?.trim() || `Metric ${index + 1}`,
    description: descriptionList[index]?.trim()
  }));
};

// Helper function to add a new metric
const addMetric = (values: string, labels: string, descriptions: string): { newValues: string; newLabels: string; newDescriptions: string } => {
  const valueList = parsePipeData(values);
  const labelList = parsePipeData(labels);
  const descriptionList = parsePipeData(descriptions);
  
  // Add new metric with default content
  valueList.push('New Value');
  labelList.push('New Metric');
  descriptionList.push('Describe this new metric and its impact.');
  
  return {
    newValues: valueList.join('|'),
    newLabels: labelList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a metric
const removeMetric = (values: string, labels: string, descriptions: string, indexToRemove: number): { newValues: string; newLabels: string; newDescriptions: string } => {
  const valueList = parsePipeData(values);
  const labelList = parsePipeData(labels);
  const descriptionList = parsePipeData(descriptions);
  
  // Remove the metric at the specified index
  if (indexToRemove >= 0 && indexToRemove < valueList.length) {
    valueList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < labelList.length) {
    labelList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }
  
  return {
    newValues: valueList.join('|'),
    newLabels: labelList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

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
  handleContentUpdate,
  sectionBackground,
  handleMetricValueEdit,
  handleMetricLabelEdit,
  handleMetricDescriptionEdit,
  handleRemoveMetric,
  canRemove = true
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
  sectionBackground: string;
  handleMetricValueEdit: (index: number, value: string) => void;
  handleMetricLabelEdit: (index: number, value: string) => void;
  handleMetricDescriptionEdit: (index: number, value: string) => void;
  handleRemoveMetric?: (index: number) => void;
  canRemove?: boolean;
}) => {
  
  // Color scheme for each metric
  const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
  const color = colors[index % colors.length];

  return (
    <div className={`relative group/metric-item-${index} p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300`}>
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
            <EditableAdaptiveText
              mode={mode}
              value={metric.value}
              onEdit={(value) => handleMetricValueEdit(index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-3xl font-bold"
              placeholder="10,000+"
              sectionId={sectionId}
              elementKey={`metric_value_${index}`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={metric.label}
              onEdit={(value) => handleMetricLabelEdit(index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              placeholder="Metric Label"
              sectionId={sectionId}
              elementKey={`metric_label_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
          
          {(metric.description || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={metric.description || ''}
              onEdit={(value) => handleMetricDescriptionEdit(index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm leading-relaxed"
              placeholder="Add metric description..."
              sectionId={sectionId}
              elementKey={`metric_description_${index}`}
              sectionBackground={sectionBackground}
            />
          )}
          
        </div>
      </div>
      
      {/* Delete button - only show in edit mode and if can remove */}
      {mode === 'edit' && handleRemoveMetric && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveMetric(index);
          }}
          className={`opacity-0 group-hover/metric-item-${index}:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200`}
          title="Remove this metric"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
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
    blockContent.metric_descriptions
  );

  // Individual metric edit handlers
  const handleMetricValueEdit = (index: number, value: string) => {
    const updatedValues = updateListData(blockContent.metric_values || '', index, value);
    handleContentUpdate('metric_values', updatedValues);
  };

  const handleMetricLabelEdit = (index: number, value: string) => {
    const updatedLabels = updateListData(blockContent.metric_labels || '', index, value);
    handleContentUpdate('metric_labels', updatedLabels);
  };

  const handleMetricDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.metric_descriptions || '', index, value);
    handleContentUpdate('metric_descriptions', updatedDescriptions);
  };

  // Handle adding a new metric
  const handleAddMetric = () => {
    const { newValues, newLabels, newDescriptions } = addMetric(
      blockContent.metric_values || '',
      blockContent.metric_labels || '',
      blockContent.metric_descriptions || ''
    );
    handleContentUpdate('metric_values', newValues);
    handleContentUpdate('metric_labels', newLabels);
    handleContentUpdate('metric_descriptions', newDescriptions);
  };

  // Handle removing a metric
  const handleRemoveMetric = (indexToRemove: number) => {
    const { newValues, newLabels, newDescriptions } = removeMetric(
      blockContent.metric_values || '',
      blockContent.metric_labels || '',
      blockContent.metric_descriptions || '',
      indexToRemove
    );
    handleContentUpdate('metric_values', newValues);
    handleContentUpdate('metric_labels', newLabels);
    handleContentUpdate('metric_descriptions', newDescriptions);
    
    // Also clear the corresponding icon if it exists
    const iconField = `metric_icon_${indexToRemove + 1}` as keyof StackedStatsContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

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

          {(blockContent.subheadline || mode === 'edit') && (
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
              sectionBackground={sectionBackground}
              handleMetricValueEdit={handleMetricValueEdit}
              handleMetricLabelEdit={handleMetricLabelEdit}
              handleMetricDescriptionEdit={handleMetricDescriptionEdit}
              handleRemoveMetric={handleRemoveMetric}
              canRemove={metrics.length > 1}
            />
          ))}
        </div>

        {/* Add Metric Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && metrics.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddMetric}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Metric</span>
            </button>
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-2xl border border-white/10">
          <div className="space-y-4">
            {(blockContent.summary_title || mode === 'edit') && (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.summary_title || ''}
                  onEdit={(value) => handleContentUpdate('summary_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...h3Style}}
                  placeholder="Add summary section title..."
                  sectionId={sectionId}
                  elementKey="summary_title"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}
            
            {(blockContent.summary_description || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.summary_description || ''}
                onEdit={(value) => handleContentUpdate('summary_description', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                style={{...bodyLgStyle}}
                className="max-w-2xl mx-auto"
                placeholder="Add summary description..."
                sectionId={sectionId}
                elementKey="summary_description"
                sectionBackground={sectionBackground}
              />
            )}
            
            <div className="flex items-center justify-center space-x-6 pt-4">
              {(blockContent.customer_satisfaction_value || mode === 'edit') && (
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.customer_satisfaction_value || ''}
                    onEdit={(value) => handleContentUpdate('customer_satisfaction_value', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-2xl font-bold`}
                    placeholder="98%"
                    sectionId={sectionId}
                    elementKey="customer_satisfaction_value"
                    sectionBackground={sectionBackground}
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.customer_satisfaction_label || ''}
                    onEdit={(value) => handleContentUpdate('customer_satisfaction_label', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm`}
                    placeholder="Customer Satisfaction"
                    sectionId={sectionId}
                    elementKey="customer_satisfaction_label"
                    sectionBackground={sectionBackground}
                  />
                </div>
              )}
              
              {((blockContent.customer_satisfaction_value || mode === 'edit') && (blockContent.response_time_value || mode === 'edit')) && (
                <div className="w-px h-12 bg-gray-300"></div>
              )}
              
              {(blockContent.response_time_value || mode === 'edit') && (
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.response_time_value || ''}
                    onEdit={(value) => handleContentUpdate('response_time_value', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-2xl font-bold`}
                    placeholder="<3min"
                    sectionId={sectionId}
                    elementKey="response_time_value"
                    sectionBackground={sectionBackground}
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.response_time_label || ''}
                    onEdit={(value) => handleContentUpdate('response_time_label', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm`}
                    placeholder="Average Response Time"
                    sectionId={sectionId}
                    elementKey="response_time_label"
                    sectionBackground={sectionBackground}
                  />
                </div>
              )}
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