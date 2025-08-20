import React, { useState, useEffect } from 'react';
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

interface AnimatedProcessLineContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  auto_animate?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Step icons
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  // Process indicators
  process_indicator_1_text?: string;
  process_indicator_2_text?: string;
  process_indicator_3_text?: string;
  process_indicator_1_icon?: string;
  process_indicator_2_icon?: string;
  process_indicator_3_icon?: string;
  show_process_indicators?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Automated Process Made Simple' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Input|Process|Optimize|Output' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Simply upload your data or connect your existing systems to get started.|Our AI processes your information and identifies optimization opportunities.|Advanced algorithms fine-tune your workflows for maximum efficiency.|Get instant results with detailed reports and actionable insights.' 
  },
  auto_animate: { 
    type: 'string' as const, 
    default: 'true' 
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
  // Step icons
  step_icon_1: { type: 'string' as const, default: '📥' },
  step_icon_2: { type: 'string' as const, default: '⚙️' },
  step_icon_3: { type: 'string' as const, default: '⚡' },
  step_icon_4: { type: 'string' as const, default: '📊' },
  // Process indicators
  process_indicator_1_text: { 
    type: 'string' as const, 
    default: 'Automated' 
  },
  process_indicator_1_icon: { type: 'string' as const, default: '⚡' },
  process_indicator_2_icon: { type: 'string' as const, default: '🕒' },
  process_indicator_3_icon: { type: 'string' as const, default: '✅' },
  process_indicator_2_text: { 
    type: 'string' as const, 
    default: 'Real-time' 
  },
  process_indicator_3_text: { 
    type: 'string' as const, 
    default: 'Reliable' 
  },
  show_process_indicators: { 
    type: 'boolean' as const, 
    default: true 
  }
};

export default function AnimatedProcessLine(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<AnimatedProcessLineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || ''
  }));

  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-animation logic
  useEffect(() => {
    if (blockContent.auto_animate === 'true' && steps.length > 1) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
        setProgress(0);
      }, 3000);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 60);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [blockContent.auto_animate, steps.length]);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Icon edit handlers
  const handleStepIconEdit = (index: number, value: string) => {
    const iconField = `step_icon_${index + 1}` as keyof AnimatedProcessLineContent;
    handleContentUpdate(iconField, value);
  };

  const handleProcessIndicatorIconEdit = (index: number, value: string) => {
    const iconField = `process_indicator_${index + 1}_icon` as keyof AnimatedProcessLineContent;
    handleContentUpdate(iconField, value);
  };

  const getStepIcon = (index: number) => {
    const iconFields = ['step_icon_1', 'step_icon_2', 'step_icon_3', 'step_icon_4'];
    return blockContent[iconFields[index] as keyof AnimatedProcessLineContent] || ['📥', '⚙️', '⚡', '📊'][index];
  };

  const getProcessIndicatorIcon = (index: number) => {
    const iconFields = ['process_indicator_1_icon', 'process_indicator_2_icon', 'process_indicator_3_icon'];
    return blockContent[iconFields[index] as keyof AnimatedProcessLineContent] || ['⚡', '🕒', '✅'][index];
  };

  const ProcessStep = ({ step, index, isActive }: {
    step: { title: string; description: string };
    index: number;
    isActive: boolean;
  }) => {

    return (
      <div 
        className={`relative cursor-pointer transition-all duration-300 ${
          isActive ? 'transform scale-105' : 'hover:scale-102'
        }`}
        onClick={() => setActiveStep(index)}
      >
        {/* Step Circle */}
        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          isActive 
            ? `${colorTokens.ctaBg} shadow-xl` 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}>
          <IconEditableText
            mode={mode}
            value={getStepIcon(index)}
            onEdit={(value) => handleStepIconEdit(index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="lg"
            className="text-3xl text-white"
            sectionId={sectionId}
            elementKey={`step_icon_${index + 1}`}
          />
          
          {/* Pulse animation for active step */}
          {isActive && (
            <div className={`absolute inset-0 rounded-full ${colorTokens.ctaBg} opacity-30 animate-ping`} />
          )}
        </div>

        {/* Step Label */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center min-w-max">
          <div className={`font-semibold text-sm transition-colors duration-300 ${
            isActive ? 'text-gray-900' : 'text-gray-600'
          }`}>
            {step.title}
          </div>
        </div>
      </div>
    );
  };

  const ConnectionLine = ({ index, isActive, isCompleted }: {
    index: number;
    isActive: boolean;
    isCompleted: boolean;
  }) => (
    <div className="flex-1 relative h-0.5 bg-gray-200 mx-4">
      <div 
        className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
          isCompleted ? colorTokens.ctaBg : isActive ? colorTokens.ctaBg : 'bg-gray-200'
        }`}
        style={{
          width: isActive ? `${progress}%` : isCompleted ? '100%' : '0%'
        }}
      />
      
      {/* Animated dot for active line */}
      {isActive && (
        <div 
          className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${colorTokens.ctaBg} transition-all duration-100`}
          style={{ left: `${Math.min(progress, 95)}%` }}
        />
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AnimatedProcessLine"
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
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your automated process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Process Step Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_titles || ''}
                  onEdit={(value) => handleContentUpdate('step_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('step_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Step descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_descriptions"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Animated Process Line */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-12">
              <div className="flex items-center justify-center">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <ProcessStep
                      step={step}
                      index={index}
                      isActive={activeStep === index}
                    />
                    {index < steps.length - 1 && (
                      <ConnectionLine
                        index={index}
                        isActive={activeStep === index}
                        isCompleted={activeStep > index}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Active Step Details */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 mb-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full ${colorTokens.ctaBg} flex items-center justify-center`}>
                    <span className="text-white font-bold">{activeStep + 1}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {steps[activeStep]?.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto mb-6">
                  {steps[activeStep]?.description}
                </p>
                
                {blockContent.show_process_indicators !== false && (
                  <div className="flex justify-center items-center space-x-6">
                    {(blockContent.process_indicator_1_text && blockContent.process_indicator_1_text !== '___REMOVED___') && (
                      <div className="relative group/process-indicator-1 flex items-center space-x-2">
                        <IconEditableText
                          mode={mode}
                          value={getProcessIndicatorIcon(0)}
                          onEdit={(value) => handleProcessIndicatorIconEdit(0, value)}
                          backgroundType={backgroundType as any}
                          colorTokens={colorTokens}
                          iconSize="sm"
                          className="text-xl text-green-600"
                          sectionId={sectionId}
                          elementKey="process_indicator_1_icon"
                        />
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.process_indicator_1_text || ''}
                          onEdit={(value) => handleContentUpdate('process_indicator_1_text', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-gray-700 font-medium"
                          placeholder="Process indicator 1"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="process_indicator_1_text"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('process_indicator_1_text', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/process-indicator-1:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                            title="Remove indicator 1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {(blockContent.process_indicator_1_text && blockContent.process_indicator_1_text !== '___REMOVED___') && 
                     (blockContent.process_indicator_2_text && blockContent.process_indicator_2_text !== '___REMOVED___') && (
                      <div className="w-px h-6 bg-gray-300" />
                    )}
                    {(blockContent.process_indicator_2_text && blockContent.process_indicator_2_text !== '___REMOVED___') && (
                      <div className="relative group/process-indicator-2 flex items-center space-x-2">
                        <IconEditableText
                          mode={mode}
                          value={getProcessIndicatorIcon(1)}
                          onEdit={(value) => handleProcessIndicatorIconEdit(1, value)}
                          backgroundType={backgroundType as any}
                          colorTokens={colorTokens}
                          iconSize="sm"
                          className="text-xl text-blue-600"
                          sectionId={sectionId}
                          elementKey="process_indicator_2_icon"
                        />
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.process_indicator_2_text || ''}
                          onEdit={(value) => handleContentUpdate('process_indicator_2_text', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-gray-700 font-medium"
                          placeholder="Process indicator 2"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="process_indicator_2_text"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('process_indicator_2_text', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/process-indicator-2:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                            title="Remove indicator 2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {(blockContent.process_indicator_2_text && blockContent.process_indicator_2_text !== '___REMOVED___') && 
                     (blockContent.process_indicator_3_text && blockContent.process_indicator_3_text !== '___REMOVED___') && (
                      <div className="w-px h-6 bg-gray-300" />
                    )}
                    {(blockContent.process_indicator_3_text && blockContent.process_indicator_3_text !== '___REMOVED___') && (
                      <div className="relative group/process-indicator-3 flex items-center space-x-2">
                        <IconEditableText
                          mode={mode}
                          value={getProcessIndicatorIcon(2)}
                          onEdit={(value) => handleProcessIndicatorIconEdit(2, value)}
                          backgroundType={backgroundType as any}
                          colorTokens={colorTokens}
                          iconSize="sm"
                          className="text-xl text-purple-600"
                          sectionId={sectionId}
                          elementKey="process_indicator_3_icon"
                        />
                        <EditableAdaptiveText
                          mode={mode}
                          value={blockContent.process_indicator_3_text || ''}
                          onEdit={(value) => handleContentUpdate('process_indicator_3_text', value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="text-gray-700 font-medium"
                          placeholder="Process indicator 3"
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key="process_indicator_3_text"
                        />
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('process_indicator_3_text', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/process-indicator-3:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                            title="Remove indicator 3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your automated benefits..."
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
  name: 'AnimatedProcessLine',
  category: 'HowItWorks',
  description: 'Animated horizontal process line with auto-progression. Perfect for automated tools and playful interfaces.',
  tags: ['how-it-works', 'animated', 'process', 'automation', 'playful'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'text', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_icon_1', label: 'Step 1 Icon', type: 'text', required: false },
    { key: 'step_icon_2', label: 'Step 2 Icon', type: 'text', required: false },
    { key: 'step_icon_3', label: 'Step 3 Icon', type: 'text', required: false },
    { key: 'step_icon_4', label: 'Step 4 Icon', type: 'text', required: false },
    { key: 'auto_animate', label: 'Auto-animate Process', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'process_indicator_1_text', label: 'Process Indicator 1', type: 'text', required: false },
    { key: 'process_indicator_1_icon', label: 'Process Indicator 1 Icon', type: 'text', required: false },
    { key: 'process_indicator_2_text', label: 'Process Indicator 2', type: 'text', required: false },
    { key: 'process_indicator_2_icon', label: 'Process Indicator 2 Icon', type: 'text', required: false },
    { key: 'process_indicator_3_text', label: 'Process Indicator 3', type: 'text', required: false },
    { key: 'process_indicator_3_icon', label: 'Process Indicator 3 Icon', type: 'text', required: false },
    { key: 'show_process_indicators', label: 'Show Process Indicators', type: 'boolean', required: false }
  ],
  
  features: [
    'Animated progress line with dots',
    'Auto-advancing step progression',
    'Interactive step selection',
    'Real-time progress indicators',
    'Perfect for automation tools',
    'Playful and engaging animations'
  ],
  
  useCases: [
    'Automation platform processes',
    'No-code tool workflows',
    'Creative empowerment tools',
    'Playful/confident tone products',
    'Early awareness building'
  ]
};