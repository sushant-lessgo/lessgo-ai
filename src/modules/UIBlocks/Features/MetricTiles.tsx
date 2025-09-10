import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

interface MetricTilesContent {
  headline: string;
  feature_titles: string;
  feature_metrics: string;
  feature_descriptions: string;
  metric_labels: string;
  // Metric icons
  metric_icon_1?: string;
  metric_icon_2?: string;
  metric_icon_3?: string;
  metric_icon_4?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // ROI Summary Fields
  roi_summary_title?: string;
  roi_metric_1?: string;
  roi_label_1?: string;
  roi_metric_2?: string;
  roi_label_2?: string;
  roi_metric_3?: string;
  roi_label_3?: string;
  roi_description?: string;
  show_roi_summary?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Quantifiable Results That Drive ROI' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Efficiency Boost|Cost Reduction|Error Prevention|Revenue Growth' 
  },
  feature_metrics: { 
    type: 'string' as const, 
    default: '300%|$2.4M|99.9%|47%' 
  },
  metric_labels: { 
    type: 'string' as const, 
    default: 'faster processing|annual savings|accuracy rate|revenue increase' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Automate manual processes and reduce task completion time by 300% with our intelligent workflow engine.|Save an average of $2.4M annually through reduced operational costs and improved resource allocation.|Achieve 99.9% accuracy with our AI-powered error detection and automatic correction systems.|Drive 47% revenue growth through optimized processes and improved customer satisfaction.' 
  },
  // Metric icons - matching the themes
  metric_icon_1: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  metric_icon_2: { 
    type: 'string' as const, 
    default: '💰' 
  },
  metric_icon_3: { 
    type: 'string' as const, 
    default: '✅' 
  },
  metric_icon_4: { 
    type: 'string' as const, 
    default: '📈' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  // ROI Summary Schema
  roi_summary_title: { 
    type: 'string' as const, 
    default: 'Proven Return on Investment' 
  },
  roi_metric_1: { 
    type: 'string' as const, 
    default: '6 Months' 
  },
  roi_label_1: { 
    type: 'string' as const, 
    default: 'Average Payback Period' 
  },
  roi_metric_2: { 
    type: 'string' as const, 
    default: '400%' 
  },
  roi_label_2: { 
    type: 'string' as const, 
    default: 'Average ROI in Year 1' 
  },
  roi_metric_3: { 
    type: 'string' as const, 
    default: '$5.2M' 
  },
  roi_label_3: { 
    type: 'string' as const, 
    default: 'Average 3-Year Value' 
  },
  roi_description: { 
    type: 'string' as const, 
    default: 'Based on independent analysis of 500+ enterprise implementations' 
  },
  show_roi_summary: { 
    type: 'boolean' as const, 
    default: true 
  }
};

const MetricTile = React.memo(({ 
  title, 
  metric, 
  label, 
  description,
  index,
  colorTokens,
  mutedTextColor,
  h3Style,
  mode,
  handleContentUpdate,
  blockContent,
  sectionId,
  backgroundType,
  sectionBackground,
  onTitleEdit,
  onMetricEdit,
  onLabelEdit,
  onDescriptionEdit
}: {
  title: string;
  metric: string;
  label: string;
  description: string;
  index: number;
  colorTokens: any;
  mutedTextColor: string;
  h3Style: any;
  mode: 'edit' | 'preview';
  handleContentUpdate: (key: keyof MetricTilesContent, value: any) => void;
  blockContent: MetricTilesContent;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  onTitleEdit: (index: number, value: string) => void;
  onMetricEdit: (index: number, value: string) => void;
  onLabelEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  
  // Get metric icon from content fields
  const getMetricIcon = (index: number) => {
    const iconFields = [
      blockContent.metric_icon_1,
      blockContent.metric_icon_2,
      blockContent.metric_icon_3,
      blockContent.metric_icon_4
    ];
    return iconFields[index] || '📊';
  };

  const getGradientForIndex = (index: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600', 
      'from-purple-500 to-violet-600',
      'from-orange-500 to-red-600'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      
      <div className="mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradientForIndex(index)} shadow-lg mb-4`}>
          <IconEditableText
            mode={mode}
            value={getMetricIcon(index)}
            onEdit={(value) => handleContentUpdate(`metric_icon_${index + 1}` as keyof MetricTilesContent, value)}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-white text-2xl"
            placeholder="📊"
            sectionId={sectionId}
            elementKey={`metric_icon_${index + 1}`}
          />
        </div>
        
        <EditableAdaptiveText
          mode={mode}
          value={title}
          onEdit={(value) => onTitleEdit(index, value)}
          backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType as any || 'neutral')}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{
            ...h3Style,
            fontWeight: 'bold'
          }}
          className="mb-2"
          placeholder="Feature title..."
          sectionId={sectionId}
          elementKey={`feature_title_${index}`}
          sectionBackground={sectionBackground}
        />
        
        <div className="text-center bg-gray-50 rounded-lg p-4 mb-4">
          <EditableAdaptiveText
            mode={mode}
            value={metric}
            onEdit={(value) => onMetricEdit(index, value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="body"
            className={`text-4xl font-bold bg-gradient-to-r ${getGradientForIndex(index)} bg-clip-text text-transparent`}
            placeholder="Metric..."
            sectionId={sectionId}
            elementKey={`feature_metric_${index}`}
            sectionBackground="bg-gray-50"
          />
          <EditableAdaptiveText
            mode={mode}
            value={label}
            onEdit={(value) => onLabelEdit(index, value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="body"
            className={`text-sm font-medium ${mutedTextColor} uppercase tracking-wide`}
            placeholder="Metric label..."
            sectionId={sectionId}
            elementKey={`metric_label_${index}`}
            sectionBackground="bg-gray-50"
          />
        </div>
      </div>

      <div className="mt-auto">
        <EditableAdaptiveText
          mode={mode}
          value={description}
          onEdit={(value) => onDescriptionEdit(index, value)}
          backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType as any || 'neutral')}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-600 leading-relaxed text-sm"
          placeholder="Feature description..."
          sectionId={sectionId}
          elementKey={`feature_description_${index}`}
          sectionBackground={sectionBackground}
        />
        
        <div className="mt-4 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradientForIndex(index)}`} />
          <span className="text-xs font-medium text-gray-500">Measured impact</span>
        </div>
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
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<MetricTilesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Parse feature data using utility functions
  const featureTitles = parsePipeData(blockContent.feature_titles);
  const featureMetrics = parsePipeData(blockContent.feature_metrics);
  const metricLabels = parsePipeData(blockContent.metric_labels);
  const featureDescriptions = parsePipeData(blockContent.feature_descriptions);

  const features = featureTitles.map((title, index) => ({
    title,
    metric: featureMetrics[index] || '',
    label: metricLabels[index] || '',
    description: featureDescriptions[index] || ''
  }));

  // Individual field edit handlers (following IconGrid pattern)
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.feature_titles, index, value);
    handleContentUpdate('feature_titles', updatedTitles);
  };

  const handleMetricEdit = (index: number, value: string) => {
    const updatedMetrics = updateListData(blockContent.feature_metrics, index, value);
    handleContentUpdate('feature_metrics', updatedMetrics);
  };

  const handleLabelEdit = (index: number, value: string) => {
    const updatedLabels = updateListData(blockContent.metric_labels, index, value);
    handleContentUpdate('metric_labels', updatedLabels);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.feature_descriptions, index, value);
    handleContentUpdate('feature_descriptions', updatedDescriptions);
  };

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <MetricTile
              key={index}
              title={feature.title}
              metric={feature.metric}
              label={feature.label}
              description={feature.description}
              index={index}
              colorTokens={colorTokens}
              mutedTextColor={mutedTextColor}
              h3Style={h3Style}
              mode={mode}
              handleContentUpdate={handleContentUpdate}
              blockContent={blockContent}
              sectionId={sectionId}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              onTitleEdit={handleTitleEdit}
              onMetricEdit={handleMetricEdit}
              onLabelEdit={handleLabelEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* ROI Summary - Editable */}
        {blockContent.show_roi_summary !== false && (blockContent.roi_summary_title || mode === 'edit') && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
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
                {/* ROI Metric 1 */}
                {(blockContent.roi_metric_1 || mode === 'edit') && blockContent.roi_metric_1 !== '___REMOVED___' && (
                  <div className="text-center group/roi-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_metric_1 || ''}
                      onEdit={(value) => handleContentUpdate('roi_metric_1', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-4xl font-bold text-blue-600 mb-2"
                      placeholder="Metric 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_metric_1"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_label_1 || ''}
                      onEdit={(value) => handleContentUpdate('roi_label_1', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_label_1"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('roi_metric_1', '___REMOVED___');
                          handleContentUpdate('roi_label_1', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/roi-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove ROI metric 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* ROI Metric 2 */}
                {(blockContent.roi_metric_2 || mode === 'edit') && blockContent.roi_metric_2 !== '___REMOVED___' && (
                  <div className="text-center group/roi-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_metric_2 || ''}
                      onEdit={(value) => handleContentUpdate('roi_metric_2', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-4xl font-bold text-green-600 mb-2"
                      placeholder="Metric 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_metric_2"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_label_2 || ''}
                      onEdit={(value) => handleContentUpdate('roi_label_2', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_label_2"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('roi_metric_2', '___REMOVED___');
                          handleContentUpdate('roi_label_2', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/roi-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove ROI metric 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* ROI Metric 3 */}
                {(blockContent.roi_metric_3 || mode === 'edit') && blockContent.roi_metric_3 !== '___REMOVED___' && (
                  <div className="text-center group/roi-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_metric_3 || ''}
                      onEdit={(value) => handleContentUpdate('roi_metric_3', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-4xl font-bold text-purple-600 mb-2"
                      placeholder="Metric 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_metric_3"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.roi_label_3 || ''}
                      onEdit={(value) => handleContentUpdate('roi_label_3', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="roi_label_3"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('roi_metric_3', '___REMOVED___');
                          handleContentUpdate('roi_label_3', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/roi-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove ROI metric 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {(blockContent.roi_description || mode === 'edit') && blockContent.roi_description !== '___REMOVED___' && (
                <div className="mt-6 group/roi-description relative">
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
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('roi_description', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/roi-description:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                      title="Remove ROI description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your quantifiable value..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
                  />
                )}
              </div>
            )}
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
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'text', required: true },
    { key: 'feature_metrics', label: 'Metrics (pipe separated)', type: 'text', required: true },
    { key: 'metric_labels', label: 'Metric Labels (pipe separated)', type: 'text', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'roi_summary_title', label: 'ROI Summary Title', type: 'text', required: false },
    { key: 'roi_metric_1', label: 'ROI Metric 1', type: 'text', required: false },
    { key: 'roi_label_1', label: 'ROI Label 1', type: 'text', required: false },
    { key: 'roi_metric_2', label: 'ROI Metric 2', type: 'text', required: false },
    { key: 'roi_label_2', label: 'ROI Label 2', type: 'text', required: false },
    { key: 'roi_metric_3', label: 'ROI Metric 3', type: 'text', required: false },
    { key: 'roi_label_3', label: 'ROI Label 3', type: 'text', required: false },
    { key: 'roi_description', label: 'ROI Description', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Large metric displays with gradient styling',
    'Color-coded feature tiles',
    'ROI summary section',
    'Data-driven presentation',
    'Perfect for B2B decision makers',
    'Quantifiable value propositions'
  ],
  
  useCases: [
    'Business efficiency platforms',
    'Cost reduction tools',
    'Enterprise software ROI',
    'Data analytics products',
    'Performance optimization tools'
  ]
};