// components/layout/MethodologyBreakdown.tsx
// Production-ready methodology explanation using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface MethodologyBreakdownContent {
  headline: string;
  methodology_name: string;
  methodology_description: string;
  key_principles: string;
  principle_details: string;
  results_title?: string;
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
  key_principles: { 
    type: 'string' as const, 
    default: 'Continuous Learning|Adaptive Optimization|Data-Driven Decisions|Human-Centered Design|Predictive Analytics|Real-Time Feedback' 
  },
  principle_details: { 
    type: 'string' as const, 
    default: 'System continuously learns from new data and user interactions|Algorithms automatically adjust strategies based on performance|Every decision backed by comprehensive data analysis|User experience optimized through behavioral insights|Anticipate trends and outcomes before they happen|Instant feedback loops enable rapid iteration and improvement' 
  },
  results_title: { 
    type: 'string' as const, 
    default: 'Proven Results' 
  },
  result_metrics: { 
    type: 'string' as const, 
    default: '300%|85%|99.7%|24/7' 
  },
  result_labels: { 
    type: 'string' as const, 
    default: 'Performance Increase|Time Saved|Accuracy Rate|Autonomous Operation' 
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
  const principles = blockContent.key_principles.split('|').map(p => p.trim()).filter(Boolean);
  const details = blockContent.principle_details.split('|').map(d => d.trim()).filter(Boolean);
  
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
            <span className="text-3xl">🧠</span>
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

        {/* Key Principles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {principles.map((principle, index) => (
            <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                {index + 1}
              </div>
              <h3 style={h3Style} className="font-bold text-gray-900 mb-4">
                {principle}
              </h3>
              <p style={bodyStyle} className="text-gray-600 leading-relaxed">
                {details[index] || 'Principle description'}
              </p>
            </div>
          ))}
        </div>

        {/* Results Section */}
        {(blockContent.results_title || blockContent.result_metrics || mode === 'edit') && (
          <div className="mt-16 text-center">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.results_title || ''}
              onEdit={(value) => handleContentUpdate('results_title', value)}
              level="h3"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
              colorTokens={colorTokens}
              className="font-bold text-gray-900 mb-8"
              sectionId={sectionId}
              elementKey="results_title"
              sectionBackground={sectionBackground}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {blockContent.result_metrics && blockContent.result_metrics.split('|').map((metric, index) => {
                const labels = blockContent.result_labels ? blockContent.result_labels.split('|') : [];
                return (
                  <div key={index}>
                    <div className="text-4xl font-bold text-purple-600 mb-2">{metric.trim()}</div>
                    <div className="text-gray-600">{labels[index]?.trim() || 'Metric'}</div>
                  </div>
                );
              })}
            </div>
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