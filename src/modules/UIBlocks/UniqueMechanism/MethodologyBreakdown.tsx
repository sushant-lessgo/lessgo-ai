// components/layout/MethodologyBreakdown.tsx
// Production-ready methodology explanation using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface MethodologyBreakdownContent {
  headline: string;
  methodology_name: string;
  methodology_description: string;
  
  // Individual principle fields
  principle_1: string;
  principle_2: string;
  principle_3: string;
  principle_4: string;
  principle_5: string;
  principle_6: string;
  
  // Individual detail fields
  detail_1: string;
  detail_2: string;
  detail_3: string;
  detail_4: string;
  detail_5: string;
  detail_6: string;
  
  // Individual result fields
  result_metric_1: string;
  result_metric_2: string;
  result_metric_3: string;
  result_metric_4: string;
  result_label_1: string;
  result_label_2: string;
  result_label_3: string;
  result_label_4: string;
  
  results_title?: string;
  methodology_icon?: string;
  
  // Legacy fields for backward compatibility
  key_principles?: string;
  principle_details?: string;
  result_metrics?: string;
  result_labels?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'The Science Behind Our Success' 
  },
  methodology_name: { 
    type: 'string' as const, 
    default: 'Adaptive Intelligence Framework™' 
  },
  methodology_description: { 
    type: 'string' as const, 
    default: 'Our proprietary methodology combines machine learning, behavioral psychology, and real-time optimization to deliver unprecedented results.' 
  },
  
  // Individual principle fields
  principle_1: { type: 'string' as const, default: 'Continuous Learning' },
  principle_2: { type: 'string' as const, default: 'Adaptive Optimization' },
  principle_3: { type: 'string' as const, default: 'Data-Driven Decisions' },
  principle_4: { type: 'string' as const, default: 'Human-Centered Design' },
  principle_5: { type: 'string' as const, default: 'Predictive Analytics' },
  principle_6: { type: 'string' as const, default: 'Real-Time Feedback' },
  
  // Individual detail fields
  detail_1: { type: 'string' as const, default: 'System continuously learns from new data and user interactions' },
  detail_2: { type: 'string' as const, default: 'Algorithms automatically adjust strategies based on performance' },
  detail_3: { type: 'string' as const, default: 'Every decision backed by comprehensive data analysis' },
  detail_4: { type: 'string' as const, default: 'User experience optimized through behavioral insights' },
  detail_5: { type: 'string' as const, default: 'Anticipate trends and outcomes before they happen' },
  detail_6: { type: 'string' as const, default: 'Instant feedback loops enable rapid iteration and improvement' },
  
  // Individual result fields
  result_metric_1: { type: 'string' as const, default: '300%' },
  result_metric_2: { type: 'string' as const, default: '85%' },
  result_metric_3: { type: 'string' as const, default: '99.7%' },
  result_metric_4: { type: 'string' as const, default: '24/7' },
  result_label_1: { type: 'string' as const, default: 'Performance Increase' },
  result_label_2: { type: 'string' as const, default: 'Time Saved' },
  result_label_3: { type: 'string' as const, default: 'Accuracy Rate' },
  result_label_4: { type: 'string' as const, default: 'Autonomous Operation' },
  
  results_title: { 
    type: 'string' as const, 
    default: 'Proven Results' 
  },
  methodology_icon: { 
    type: 'string' as const, 
    default: '🧠' 
  }
};

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
  
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Helper functions for backward compatibility and data aggregation
  const getPrinciples = (): string[] => {
    const individualPrinciples = [
      blockContent.principle_1,
      blockContent.principle_2,
      blockContent.principle_3,
      blockContent.principle_4,
      blockContent.principle_5,
      blockContent.principle_6
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualPrinciples.length > 0) {
      return individualPrinciples;
    }
    
    return blockContent.key_principles 
      ? blockContent.key_principles.split('|').map(p => p.trim()).filter(Boolean)
      : [];
  };

  const getDetails = (): string[] => {
    const individualDetails = [
      blockContent.detail_1,
      blockContent.detail_2,
      blockContent.detail_3,
      blockContent.detail_4,
      blockContent.detail_5,
      blockContent.detail_6
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualDetails.length > 0) {
      return individualDetails;
    }
    
    return blockContent.principle_details 
      ? blockContent.principle_details.split('|').map(d => d.trim()).filter(Boolean)
      : [];
  };

  const getResultMetrics = (): string[] => {
    const individualMetrics = [
      blockContent.result_metric_1,
      blockContent.result_metric_2,
      blockContent.result_metric_3,
      blockContent.result_metric_4
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualMetrics.length > 0) {
      return individualMetrics;
    }
    
    return blockContent.result_metrics 
      ? blockContent.result_metrics.split('|').map(m => m.trim()).filter(Boolean)
      : [];
  };

  const getResultLabels = (): string[] => {
    const individualLabels = [
      blockContent.result_label_1,
      blockContent.result_label_2,
      blockContent.result_label_3,
      blockContent.result_label_4
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualLabels.length > 0) {
      return individualLabels;
    }
    
    return blockContent.result_labels 
      ? blockContent.result_labels.split('|').map(l => l.trim()).filter(Boolean)
      : [];
  };

  const principles = getPrinciples();
  const details = getDetails();
  const resultMetrics = getResultMetrics();
  const resultLabels = getResultLabels();
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

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
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Methodology Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-12 text-white text-center mb-12">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconEditableText
              mode={mode}
              value={blockContent.methodology_icon || '🧠'}
              onEdit={(value) => handleContentUpdate('methodology_icon', value)}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="xl"
              className="text-white text-3xl"
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
            sectionBackground="bg-purple-600"
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.methodology_description || ''}
            onEdit={(value) => handleContentUpdate('methodology_description', value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textSecondary: 'text-purple-100' }}
            variant="body"
            className="text-purple-100 text-lg max-w-3xl mx-auto"
            sectionId={sectionId}
            elementKey="methodology_description"
            sectionBackground="bg-purple-600"
          />
        </div>

        {/* Key Principles - Dynamic Display Like IconGrid */}
        <div className={`grid gap-6 lg:gap-8 ${
          principles.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          principles.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          principles.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          principles.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {principles.map((principle, index) => {
            // Find the actual slot number for this principle
            const slotNum = [1, 2, 3, 4, 5, 6].find((num) => {
              const principleKey = `principle_${num}` as keyof MethodologyBreakdownContent;
              return blockContent[principleKey] === principle;
            }) || index + 1;
            
            const principleKey = `principle_${slotNum}` as keyof MethodologyBreakdownContent;
            const detailKey = `detail_${slotNum}` as keyof MethodologyBreakdownContent;
            const detail = blockContent[detailKey] as string;
            
            return (
              <div key={`principle-${slotNum}`} className={`relative group/principle-${slotNum} bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300`}>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                  {index + 1}
                </div>
                
                <EditableAdaptiveText
                  mode={mode}
                  value={principle}
                  onEdit={(value) => handleContentUpdate(principleKey, value)}
                  backgroundType="secondary"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-bold text-gray-900 mb-4"
                  placeholder="Principle title"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={principleKey}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={detail || ''}
                  onEdit={(value) => handleContentUpdate(detailKey, value)}
                  backgroundType="secondary"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-600 leading-relaxed"
                  placeholder="Principle description"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={detailKey}
                />
                
                {/* Delete button with proper named group pattern */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate(principleKey, '___REMOVED___');
                      handleContentUpdate(detailKey, '___REMOVED___');
                    }}
                    className={`opacity-0 group-hover/principle-${slotNum}:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200`}
                    title="Remove this principle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Add new principle button */}
        {mode === 'edit' && principles.length < 5 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const emptyIndex = [1, 2, 3, 4, 5].find((num) => {
                  const principleKey = `principle_${num}` as keyof MethodologyBreakdownContent;
                  const principle = blockContent[principleKey] as string;
                  return !principle || principle.trim() === '' || principle === '___REMOVED___';
                });
                
                if (emptyIndex) {
                  const principleKey = `principle_${emptyIndex}` as keyof MethodologyBreakdownContent;
                  const detailKey = `detail_${emptyIndex}` as keyof MethodologyBreakdownContent;
                  handleContentUpdate(principleKey, `New Principle`);
                  handleContentUpdate(detailKey, `Describe this principle and how it contributes to your methodology.`);
                }
              }}
              className="flex items-center space-x-3 text-purple-600 hover:text-purple-800 transition-all duration-200 bg-white rounded-lg px-6 py-3 border border-purple-200 hover:border-purple-300 hover:shadow-md group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add New Principle</span>
              <span className="text-sm text-purple-400">({principles.length}/5)</span>
            </button>
          </div>
        )}
        
        {/* Limit reached message */}
        {mode === 'edit' && principles.length >= 5 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Maximum 5 principles reached</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(blockContent.results_title || resultMetrics.length > 0 || mode === 'edit') && (
          <div className="mt-16 text-center">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.results_title || ''}
              onEdit={(value) => handleContentUpdate('results_title', value)}
              level="h3"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
              colorTokens={colorTokens}
              className="font-bold text-gray-900 mb-8"
              placeholder="Results Section Title"
              sectionId={sectionId}
              elementKey="results_title"
              sectionBackground={sectionBackground}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {mode === 'edit' ? (
                // Edit mode - show all slots for editing
                [1, 2, 3, 4].map((num) => {
                  const metricKey = `result_metric_${num}` as keyof MethodologyBreakdownContent;
                  const labelKey = `result_label_${num}` as keyof MethodologyBreakdownContent;
                  const metric = blockContent[metricKey] as string;
                  const label = blockContent[labelKey] as string;
                  const isVisible = (metric && metric.trim() !== '' && metric !== '___REMOVED___') ||
                                  (label && label.trim() !== '' && label !== '___REMOVED___');
                  
                  return (
                    <div key={num} className={`relative group/result-item ${!isVisible && mode === 'edit' ? 'opacity-50' : ''}`}>
                      <div className="relative p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-200">
                        <EditableAdaptiveText
                          mode={mode}
                          value={metric || ''}
                          onEdit={(value) => handleContentUpdate(metricKey, value)}
                          backgroundType="secondary"
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-4xl font-bold text-purple-600 mb-2"
                          placeholder={`Metric ${num}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={metricKey}
                        />
                        
                        <EditableAdaptiveText
                          mode={mode}
                          value={label || ''}
                          onEdit={(value) => handleContentUpdate(labelKey, value)}
                          backgroundType="secondary"
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-gray-600"
                          placeholder={`Label ${num}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={labelKey}
                        />
                        
                        {/* Remove button */}
                        {isVisible && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(metricKey, '___REMOVED___');
                              handleContentUpdate(labelKey, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/result-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white hover:bg-red-50 text-red-500 hover:text-red-700 transition-all duration-200 shadow-md border border-red-200 z-10"
                            title="Remove this result"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // View mode - only show non-empty results
                resultMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="text-4xl font-bold text-purple-600 mb-2">{metric}</div>
                    <div className="text-gray-600">{resultLabels[index] || 'Metric'}</div>
                  </div>
                ))
              )}
            </div>
            
            {/* Add new result button */}
            {mode === 'edit' && resultMetrics.length < 4 && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    const emptyIndex = [1, 2, 3, 4].find((num) => {
                      const metricKey = `result_metric_${num}` as keyof MethodologyBreakdownContent;
                      const metric = blockContent[metricKey] as string;
                      return !metric || metric.trim() === '' || metric === '___REMOVED___';
                    });
                    
                    if (emptyIndex) {
                      const metricKey = `result_metric_${emptyIndex}` as keyof MethodologyBreakdownContent;
                      const labelKey = `result_label_${emptyIndex}` as keyof MethodologyBreakdownContent;
                      handleContentUpdate(metricKey, '95%');
                      handleContentUpdate(labelKey, `New Metric ${emptyIndex}`);
                    }
                  }}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors mx-auto bg-white rounded-lg px-4 py-2 border border-purple-200 hover:border-purple-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add New Result</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'MethodologyBreakdown',
  category: 'Unique Mechanism',
  description: 'Detailed breakdown of proprietary methodology',
  tags: ['methodology', 'framework', 'science', 'principles', 'breakdown'],
  defaultBackgroundType: 'secondary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes'
};