import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface MetricTilesContent {
  headline: string;
  feature_titles: string;
  feature_metrics: string;
  feature_descriptions: string;
  metric_labels: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
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
  }
};

const MetricTile = React.memo(({ 
  title, 
  metric, 
  label, 
  description,
  index,
  colorTokens,
  mutedTextColor
}: {
  title: string;
  metric: string;
  label: string;
  description: string;
  index: number;
  colorTokens: any;
  mutedTextColor: string;
}) => {
  
  const getIconForIndex = (index: number) => {
    const icons = [
      // Efficiency Boost
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      // Cost Reduction
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>,
      // Error Prevention
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      // Revenue Growth
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ];
    return icons[index % icons.length];
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
          {getIconForIndex(index)}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        
        <div className="text-center bg-gray-50 rounded-lg p-4 mb-4">
          <div className={`text-4xl font-bold bg-gradient-to-r ${getGradientForIndex(index)} bg-clip-text text-transparent`}>
            {metric}
          </div>
          <div className={`text-sm font-medium ${mutedTextColor} uppercase tracking-wide`}>
            {label}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-gray-600 leading-relaxed text-sm">
          {description}
        </p>
        
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

  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureMetrics = blockContent.feature_metrics 
    ? blockContent.feature_metrics.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const metricLabels = blockContent.metric_labels 
    ? blockContent.metric_labels.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const features = featureTitles.map((title, index) => ({
    title,
    metric: featureMetrics[index] || '',
    label: metricLabels[index] || '',
    description: featureDescriptions[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MetricTiles"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your quantifiable benefits..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Metric Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_titles}
                  onEdit={(value) => handleContentUpdate('feature_titles', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Feature titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_metrics}
                  onEdit={(value) => handleContentUpdate('feature_metrics', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Metrics (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_metrics"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.metric_labels}
                  onEdit={(value) => handleContentUpdate('metric_labels', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Metric labels (pipe separated)"
                  sectionId={sectionId}
                  elementKey="metric_labels"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_descriptions}
                  onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Feature descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_descriptions"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
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
              />
            ))}
          </div>
        )}

        {/* ROI Summary */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Proven Return on Investment
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">6 Months</div>
                <div className={`text-sm ${mutedTextColor}`}>Average Payback Period</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">400%</div>
                <div className={`text-sm ${mutedTextColor}`}>Average ROI in Year 1</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">$5.2M</div>
                <div className={`text-sm ${mutedTextColor}`}>Average 3-Year Value</div>
              </div>
            </div>
            
            <p className={`mt-6 ${mutedTextColor} max-w-2xl mx-auto`}>
              Based on independent analysis of 500+ enterprise implementations
            </p>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
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
                    textStyle={getTextStyle('body-lg')}
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