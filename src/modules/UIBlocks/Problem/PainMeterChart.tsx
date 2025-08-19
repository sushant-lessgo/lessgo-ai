import React, { useState, useEffect } from 'react';
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

interface PainMeterChartContent {
  headline: string;
  pain_categories: string;
  pain_levels: string;
  chart_labels?: string;
  category_descriptions?: string;
  total_score_text?: string;
  benchmark_text?: string;
  intro_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  action_stat_1?: string;
  action_stat_1_label?: string;
  action_stat_2?: string;
  action_stat_2_label?: string;
  action_stat_3?: string;
  action_stat_3_label?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'How Severe Are Your Business Pain Points?' 
  },
  pain_categories: { 
    type: 'string' as const, 
    default: 'Time Management|Resource Waste|Team Efficiency|Customer Experience|Process Reliability|Growth Barriers' 
  },
  pain_levels: { 
    type: 'string' as const, 
    default: '85|92|78|88|94|81' 
  },
  chart_labels: { 
    type: 'string' as const, 
    default: 'Critical|Severe|High|Moderate|Low|Minimal' 
  },
  category_descriptions: { 
    type: 'string' as const, 
    default: 'Time lost to manual processes and inefficient workflows|Budget spent on unnecessary tools and redundant systems|Team productivity hindered by poor processes|Customer satisfaction affected by slow response times|Business operations disrupted by unreliable systems|Revenue growth limited by operational constraints' 
  },
  total_score_text: { 
    type: 'string' as const, 
    default: 'Average Business Pain Score: 86/100' 
  },
  benchmark_text: { 
    type: 'string' as const, 
    default: 'Businesses scoring above 80 typically lose $50K+ annually to inefficiencies' 
  },
  intro_text: { 
    type: 'string' as const, 
    default: 'Based on data from 10,000+ businesses, here\'s how severe the most common pain points typically are:' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  action_stat_1: { type: 'string' as const, default: '$50K+' },
  action_stat_1_label: { type: 'string' as const, default: 'Annual loss estimate' },
  action_stat_2: { type: 'string' as const, default: '40%' },
  action_stat_2_label: { type: 'string' as const, default: 'Productivity impact' },
  action_stat_3: { type: 'string' as const, default: 'High' },
  action_stat_3_label: { type: 'string' as const, default: 'Team burnout risk' }
};

export default function PainMeterChart(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<PainMeterChartContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [animatedLevels, setAnimatedLevels] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const painCategories = blockContent.pain_categories 
    ? blockContent.pain_categories.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const painLevels = blockContent.pain_levels 
    ? blockContent.pain_levels.split('|').map(item => parseInt(item.trim()) || 0)
    : [];

  const categoryDescriptions = blockContent.category_descriptions 
    ? blockContent.category_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const painData = painCategories.map((category, index) => ({
    category,
    level: painLevels[index] || 0,
    description: categoryDescriptions[index] || '',
    color: getPainColor(painLevels[index] || 0)
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Animation effect
  useEffect(() => {
    if (mode === 'preview') {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setAnimatedLevels(painLevels);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAnimatedLevels(painLevels);
    }
  }, [painLevels, mode]);

  function getPainColor(level: number) {
    if (level >= 90) return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700' };
    if (level >= 80) return { bg: 'bg-red-400', light: 'bg-red-50', text: 'text-red-600' };
    if (level >= 70) return { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' };
    if (level >= 60) return { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700' };
    if (level >= 40) return { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' };
    return { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' };
  }

  function getPainLevel(score: number) {
    if (score >= 90) return 'Critical';
    if (score >= 80) return 'Severe';
    if (score >= 70) return 'High';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Low';
    return 'Minimal';
  }

  const totalScore = painLevels.length > 0 ? Math.round(painLevels.reduce((a, b) => a + b, 0) / painLevels.length) : 0;

  const PainMeter = ({ data, index }: {
    data: typeof painData[0];
    index: number;
  }) => {
    const animatedLevel = animatedLevels[index] || 0;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{data.category}</h4>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${data.color.light} ${data.color.text}`}>
            {getPainLevel(data.level)}
          </div>
        </div>

        {/* Pain Meter Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Pain Level</span>
            <span className="text-lg font-bold text-gray-900">{data.level}/100</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out ${data.color.bg}`}
              style={{ 
                width: `${animatedLevel}%`,
                transition: mode === 'preview' ? 'width 1000ms ease-out' : 'none'
              }}
            ></div>
          </div>
          
          {/* Scale markers */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className={`text-sm ${mutedTextColor} leading-relaxed`}>
            {data.description}
          </p>
        )}

        {/* Visual Pain Indicator */}
        <div className="mt-4 flex items-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < Math.floor(data.level / 20) ? data.color.bg : 'bg-gray-200'
              }`}
            ></div>
          ))}
          <span className="text-xs text-gray-500 ml-2">
            {data.level >= 80 ? 'Urgent' : data.level >= 60 ? 'Needs Attention' : 'Manageable'}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PainMeterChart"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
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
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the pain meter chart..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {(blockContent.intro_text || mode === 'edit') && (
            <div className="max-w-4xl mx-auto mb-8">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.intro_text || ''}
                onEdit={(value) => handleContentUpdate('intro_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg leading-relaxed"
                placeholder="Add introduction text to explain the pain meter data..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="intro_text"
              />
            </div>
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Pain Meter Chart Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.pain_categories || ''}
                  onEdit={(value) => handleContentUpdate('pain_categories', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Pain categories (pipe separated)"
                  sectionId={sectionId}
                  elementKey="pain_categories"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.pain_levels || ''}
                  onEdit={(value) => handleContentUpdate('pain_levels', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Pain levels (pipe separated numbers 0-100)"
                  sectionId={sectionId}
                  elementKey="pain_levels"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.category_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('category_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Category descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="category_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.total_score_text || ''}
                  onEdit={(value) => handleContentUpdate('total_score_text', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Total score text"
                  sectionId={sectionId}
                  elementKey="total_score_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Pain Meter Charts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {painData.map((data, index) => (
                <PainMeter
                  key={index}
                  data={data}
                  index={index}
                />
              ))}
            </div>

            {/* Overall Score Summary */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200 mb-16">
              <div className="text-center">
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getPainColor(totalScore).bg} text-white mb-4`}>
                    <span className="text-3xl font-bold">{totalScore}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {blockContent.total_score_text || `Overall Pain Score: ${totalScore}/100`}
                  </h3>
                  <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getPainColor(totalScore).light} ${getPainColor(totalScore).text}`}>
                    {getPainLevel(totalScore)} Level
                  </div>
                </div>

                {blockContent.benchmark_text && (
                  <div className="bg-white rounded-lg p-6 border border-red-200">
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-lg font-semibold text-red-900">
                        {blockContent.benchmark_text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pain Level Legend */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-16">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
                Pain Level Guide
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { range: '90-100', level: 'Critical', color: getPainColor(95), desc: 'Immediate action required' },
                  { range: '80-89', level: 'Severe', color: getPainColor(85), desc: 'Major impact on business' },
                  { range: '70-79', level: 'High', color: getPainColor(75), desc: 'Significant disruption' },
                  { range: '60-69', level: 'Moderate', color: getPainColor(65), desc: 'Noticeable inefficiency' },
                  { range: '40-59', level: 'Low', color: getPainColor(50), desc: 'Minor inconvenience' },
                  { range: '0-39', level: 'Minimal', color: getPainColor(30), desc: 'Well under control' }
                ].map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-4 h-4 rounded-full ${item.color.bg}`}></div>
                      <span className="font-semibold text-gray-900">{item.level}</span>
                      <span className="text-sm text-gray-600">({item.range})</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items Based on Score */}
            <div className="text-center bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                What Your Score Means
              </h3>
              
              {totalScore >= 80 ? (
                <div className="bg-red-100 border border-red-300 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-semibold text-red-900 mb-3">🚨 Urgent Action Needed</h4>
                  <p className="text-red-800 mb-4">
                    Your business is experiencing severe pain points that are likely costing you significant revenue and team productivity.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center group/action-stat relative">
                      <div className="flex items-center justify-center mb-1">
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.action_stat_1 || ''}
                          onEdit={(value) => handleContentUpdate('action_stat_1', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-2xl font-bold text-red-600"
                          placeholder="$50K+"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="action_stat_1"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('action_stat_1', '___REMOVED___');
                              handleContentUpdate('action_stat_1_label', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/action-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                            title="Remove this statistic"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.action_stat_1_label || ''}
                        onEdit={(value) => handleContentUpdate('action_stat_1_label', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-red-700"
                        placeholder="Annual loss estimate"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="action_stat_1_label"
                      />
                    </div>
                    <div className="text-center group/action-stat relative">
                      <div className="flex items-center justify-center mb-1">
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.action_stat_2 || ''}
                          onEdit={(value) => handleContentUpdate('action_stat_2', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-2xl font-bold text-red-600"
                          placeholder="40%"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="action_stat_2"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('action_stat_2', '___REMOVED___');
                              handleContentUpdate('action_stat_2_label', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/action-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                            title="Remove this statistic"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.action_stat_2_label || ''}
                        onEdit={(value) => handleContentUpdate('action_stat_2_label', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-red-700"
                        placeholder="Productivity impact"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="action_stat_2_label"
                      />
                    </div>
                    <div className="text-center group/action-stat relative">
                      <div className="flex items-center justify-center mb-1">
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.action_stat_3 || ''}
                          onEdit={(value) => handleContentUpdate('action_stat_3', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-2xl font-bold text-red-600"
                          placeholder="High"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="action_stat_3"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('action_stat_3', '___REMOVED___');
                              handleContentUpdate('action_stat_3_label', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/action-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                            title="Remove this statistic"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.action_stat_3_label || ''}
                        onEdit={(value) => handleContentUpdate('action_stat_3_label', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-red-700"
                        placeholder="Team burnout risk"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="action_stat_3_label"
                      />
                    </div>
                  </div>
                </div>
              ) : totalScore >= 60 ? (
                <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-semibold text-yellow-900 mb-3">⚠️ Room for Improvement</h4>
                  <p className="text-yellow-800">
                    You're managing okay, but there are clear opportunities to optimize your operations and reduce friction.
                  </p>
                </div>
              ) : (
                <div className="bg-green-100 border border-green-300 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-semibold text-green-900 mb-3">✅ Well Managed</h4>
                  <p className="text-green-800">
                    Your pain points are relatively under control. Focus on maintaining efficiency and preventing issues.
                  </p>
                </div>
              )}

              <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto`}>
                The good news? Every pain point measured here has proven solutions. Businesses with similar scores have successfully reduced their pain levels by 60-80% within 90 days.
              </p>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the pain measurement..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
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
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'PainMeterChart',
  category: 'Problem',
  description: 'Visual pain measurement chart with animated progress bars and severity indicators. Perfect for quantifying business challenges.',
  tags: ['chart', 'meter', 'measurement', 'data', 'animated', 'severity'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '35 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'pain_categories', label: 'Pain Categories (pipe separated)', type: 'text', required: true },
    { key: 'pain_levels', label: 'Pain Levels (pipe separated numbers 0-100)', type: 'text', required: true },
    { key: 'chart_labels', label: 'Chart Labels (pipe separated)', type: 'text', required: false },
    { key: 'category_descriptions', label: 'Category Descriptions (pipe separated)', type: 'textarea', required: false },
    { key: 'total_score_text', label: 'Total Score Text', type: 'text', required: false },
    { key: 'benchmark_text', label: 'Benchmark Text', type: 'text', required: false },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Animated progress bar charts',
    'Color-coded severity levels',
    'Overall pain score calculation',
    'Interactive visual indicators',
    'Pain level guide and legend',
    'Action recommendations based on score'
  ],
  
  useCases: [
    'Business assessment tools',
    'Pain point quantification',
    'Problem severity visualization',
    'Benchmark comparisons',
    'Data-driven problem presentation'
  ]
};