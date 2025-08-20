// components/layout/ProcessFlowDiagram.tsx
// Production-ready visual process flow using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface ProcessFlowDiagramContent {
  headline: string;
  subheadline?: string;
  process_steps: string;
  step_descriptions: string;
  benefits_title?: string;
  benefit_titles?: string;
  benefit_descriptions?: string;
  // Benefit icons
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  benefit_icon_3?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'How Our Unique Process Works' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Our proprietary methodology combines AI, automation, and human expertise for superior results.' 
  },
  process_steps: { 
    type: 'string' as const, 
    default: 'Data Ingestion|AI Analysis|Pattern Recognition|Automated Processing|Quality Validation|Results Delivery' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Secure data collection from multiple sources with real-time validation|Advanced machine learning algorithms analyze patterns and trends|Proprietary AI identifies unique insights and opportunities|Automated workflows execute optimized processes|Human experts validate results for accuracy and quality|Actionable insights delivered through intuitive dashboards' 
  },
  benefits_title: { 
    type: 'string' as const, 
    default: 'Why Our Process is Different' 
  },
  benefit_titles: { 
    type: 'string' as const, 
    default: '10x Faster|99% Accurate|Fully Customizable' 
  },
  benefit_descriptions: { 
    type: 'string' as const, 
    default: 'Automated processing reduces time from days to hours|AI-powered validation ensures exceptional precision|Adapts to your unique business requirements' 
  },
  // Benefit icons
  benefit_icon_1: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  benefit_icon_2: { 
    type: 'string' as const, 
    default: '🎯' 
  },
  benefit_icon_3: { 
    type: 'string' as const, 
    default: '🔧' 
  }
};

export default function ProcessFlowDiagram(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ProcessFlowDiagramContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();
  const steps = blockContent.process_steps.split('|').map(s => s.trim()).filter(Boolean);
  const descriptions = blockContent.step_descriptions.split('|').map(d => d.trim()).filter(Boolean);
  
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyStyle = getTypographyStyle('body-lg');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ProcessFlowDiagram"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="relative">
          {/* Process Flow */}
          <div className="grid lg:grid-cols-6 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Circle */}
                <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg">
                  {index + 1}
                </div>
                
                {/* Arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-8 h-1 bg-blue-300 transform -translate-y-1/2 z-0">
                    <div className="absolute right-0 top-1/2 w-0 h-0 border-l-4 border-l-blue-300 border-t-2 border-b-2 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
                  </div>
                )}
                
                {/* Step Content */}
                <div className="text-center">
                  <h3 style={h3Style} className="font-bold text-gray-900 mb-3">
                    {step}
                  </h3>
                  <p style={bodyStyle} className="text-gray-600 text-sm">
                    {descriptions[index] || 'Step description'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Benefits */}
        {(blockContent.benefits_title || blockContent.benefit_titles || mode === 'edit') && (
          <div className="mt-16 bg-blue-50 rounded-2xl p-8 border border-blue-200">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.benefits_title || ''}
              onEdit={(value) => handleContentUpdate('benefits_title', value)}
              level="h3"
              backgroundType="neutral"
              colorTokens={{ ...colorTokens, textPrimary: 'text-blue-900' }}
              className="text-center font-bold text-blue-900 mb-6"
              sectionId={sectionId}
              elementKey="benefits_title"
              sectionBackground="bg-blue-50"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {blockContent.benefit_titles && blockContent.benefit_titles.split('|').map((title, index) => {
                const descriptions = blockContent.benefit_descriptions ? blockContent.benefit_descriptions.split('|') : [];
                const iconFields = [
                  blockContent.benefit_icon_1,
                  blockContent.benefit_icon_2,
                  blockContent.benefit_icon_3
                ];
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <IconEditableText
                        mode={mode}
                        value={iconFields[index] || '✨'}
                        onEdit={(value) => handleContentUpdate(`benefit_icon_${index + 1}` as keyof ProcessFlowDiagramContent, value)}
                        backgroundType="primary"
                        colorTokens={colorTokens}
                        iconSize="lg"
                        className="text-white text-2xl"
                        placeholder="✨"
                        sectionId={sectionId}
                        elementKey={`benefit_icon_${index + 1}`}
                      />
                    </div>
                    <h4 style={h4Style} className="font-semibold text-blue-900 mb-2">{title.trim()}</h4>
                    <p style={bodyStyle} className="text-blue-700 text-sm">{descriptions[index]?.trim() || 'Benefit description'}</p>
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
  name: 'ProcessFlowDiagram',
  category: 'Unique Mechanism',
  description: 'Visual process flow diagram showing unique methodology',
  tags: ['process', 'flow', 'methodology', 'unique', 'visual'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes'
};