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

interface AnimatedProcessLineContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  auto_animate?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
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

  const ProcessStep = ({ step, index, isActive }: {
    step: { title: string; description: string };
    index: number;
    isActive: boolean;
  }) => {
    const getStepIcon = (index: number) => {
      const icons = [
        // Input
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>,
        // Process
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>,
        // Optimize
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>,
        // Output
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V9a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2z" />
        </svg>
      ];
      return icons[index % icons.length];
    };

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
          {getStepIcon(index)}
          
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
                
                <div className="flex justify-center items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Automated</span>
                  </div>
                  <div className="w-px h-6 bg-gray-300" />
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Real-time</span>
                  </div>
                  <div className="w-px h-6 bg-gray-300" />
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Reliable</span>
                  </div>
                </div>
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
    { key: 'auto_animate', label: 'Auto-animate Process', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
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