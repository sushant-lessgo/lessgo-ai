import React, { useState } from 'react';
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

interface MultistepCTAStackContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_details: string;
  step_ctas: string;
  completion_times?: string;
  step_benefits?: string;
  final_cta: string;
  process_note?: string;
  guarantee_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get Started in 3 Simple Steps' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Sign Up Free|Customize Setup|Go Live' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Create your account with just an email address|Personalize your workspace and connect your tools|Launch your optimized workflow and see results' 
  },
  step_details: { 
    type: 'string' as const, 
    default: 'No credit card required,Instant access,Email verification only|Import existing data,Choose your integrations,Set up team permissions|Start automating processes,Monitor performance,Get expert guidance' 
  },
  step_ctas: { 
    type: 'string' as const, 
    default: 'Create Free Account|Start Setup|Launch Now' 
  },
  completion_times: { 
    type: 'string' as const, 
    default: '30 seconds|5 minutes|2 minutes' 
  },
  step_benefits: { 
    type: 'string' as const, 
    default: 'Immediate access to all features|Tailored to your specific needs|Ready to transform your workflow' 
  },
  final_cta: { 
    type: 'string' as const, 
    default: 'Start Your Free Account Now' 
  },
  process_note: { 
    type: 'string' as const, 
    default: 'You can pause and resume the setup process anytime. No pressure, no rush.' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '30-day free trial with full access to all features' 
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
  }
};

export default function MultistepCTAStack(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<MultistepCTAStackContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [activeStep, setActiveStep] = useState(0);

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDetails = blockContent.step_details 
    ? blockContent.step_details.split('|').map(item => 
        item.trim().split(',').map(detail => detail.trim()).filter(Boolean)
      )
    : [];

  const stepCtas = blockContent.step_ctas 
    ? blockContent.step_ctas.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const completionTimes = blockContent.completion_times 
    ? blockContent.completion_times.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepBenefits = blockContent.step_benefits 
    ? blockContent.step_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || '',
    details: stepDetails[index] || [],
    cta: stepCtas[index] || 'Continue',
    time: completionTimes[index] || '2 minutes',
    benefit: stepBenefits[index] || '',
    number: index + 1
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  const getStepIcon = (stepIndex: number) => {
    const icons = [
      // Sign Up
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>,
      // Setup
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>,
      // Launch
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ];
    return icons[stepIndex % icons.length];
  };

  const StepCard = ({ step, index, isActive }: {
    step: typeof steps[0];
    index: number;
    isActive: boolean;
  }) => (
    <div 
      className={`relative bg-white rounded-2xl border-2 p-8 transition-all duration-300 cursor-pointer ${
        isActive 
          ? `${colorTokens.ctaBorder} shadow-xl scale-105` 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
      onClick={() => setActiveStep(index)}
    >
      {/* Step Number Badge */}
      <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full ${
        isActive ? colorTokens.ctaBg : 'bg-gray-400'
      } text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
        {step.number}
      </div>

      {/* Step Content */}
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className={`text-sm ${mutedTextColor} mb-4`}>{step.description}</p>
            
            {/* Time Estimate */}
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-600">Takes {step.time}</span>
            </div>
          </div>
          
          {/* Icon */}
          <div className={`w-16 h-16 rounded-xl ${
            isActive ? colorTokens.ctaBg : 'bg-gray-100'
          } flex items-center justify-center ${
            isActive ? 'text-white' : 'text-gray-600'
          }`}>
            {getStepIcon(index)}
          </div>
        </div>

        {/* Step Details */}
        <div className="space-y-3 mb-6">
          {step.details.map((detail, detailIndex) => (
            <div key={detailIndex} className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 text-sm">{detail}</span>
            </div>
          ))}
        </div>

        {/* Benefit */}
        {step.benefit && (
          <div className={`bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200`}>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 text-sm font-medium">{step.benefit}</p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <CTAButton
          text={step.cta}
          colorTokens={colorTokens}
          textStyle={getTextStyle('body')}
          className={`w-full transition-all duration-300 ${
            isActive ? 'shadow-lg hover:shadow-xl' : 'opacity-75'
          }`}
          variant={isActive ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`step_cta_${index}`}
        />
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MultistepCTAStack"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the signup process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Multistep CTA Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_titles}
                  onEdit={(value) => handleContentUpdate('step_titles', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Step titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_descriptions}
                  onEdit={(value) => handleContentUpdate('step_descriptions', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Step descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_details}
                  onEdit={(value) => handleContentUpdate('step_details', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Step details (pipe separated steps, comma separated details)"
                  sectionId={sectionId}
                  elementKey="step_details"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_ctas}
                  onEdit={(value) => handleContentUpdate('step_ctas', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Step CTAs (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_ctas"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Indicator */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <button
                      onClick={() => setActiveStep(index)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        activeStep >= index 
                          ? `${colorTokens.ctaBg} text-white shadow-lg` 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 rounded transition-all duration-300 ${
                        activeStep > index ? colorTokens.ctaBg : 'bg-gray-200'
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {steps.map((step, index) => (
                <StepCard
                  key={index}
                  step={step}
                  index={index}
                  isActive={activeStep === index}
                />
              ))}
            </div>

            {/* Process Note */}
            {blockContent.process_note && (
              <div className="text-center mb-12">
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-yellow-900">Flexible Process</span>
                  </div>
                  <p className="text-yellow-800">{blockContent.process_note}</p>
                </div>
              </div>
            )}

            {/* Final CTA Section */}
            <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-16">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of users who have transformed their workflow with our simple 3-step process.
              </p>
              
              <CTAButton
                text={blockContent.final_cta}
                colorTokens={{...colorTokens, ctaBg: 'bg-white', ctaText: 'text-blue-600'}}
                textStyle={getTextStyle('body-lg')}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                variant="primary"
                sectionId={sectionId}
                elementKey="final_cta"
              />

              {blockContent.guarantee_text && (
                <p className="text-blue-200 text-sm mt-6 flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{blockContent.guarantee_text}</span>
                </p>
              )}
            </div>

            {/* Trust Elements */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-8">
                Why Our Process Works
              </h3>
              
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Quick Setup</div>
                  <div className={`text-sm ${mutedTextColor}`}>Average: 7 minutes</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Guided Process</div>
                  <div className={`text-sm ${mutedTextColor}`}>Step-by-step help</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">User-Friendly</div>
                  <div className={`text-sm ${mutedTextColor}`}>No tech skills needed</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Support Ready</div>
                  <div className={`text-sm ${mutedTextColor}`}>Help when needed</div>
                </div>
              </div>
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
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the signup process..."
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
  name: 'MultistepCTAStack',
  category: 'Close',
  description: 'Interactive multistep signup process with progress tracking. Perfect for complex onboarding flows and reducing friction.',
  tags: ['multistep', 'signup', 'onboarding', 'process', 'interactive', 'progress'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'text', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_details', label: 'Step Details (pipe separated steps, comma separated details)', type: 'textarea', required: true },
    { key: 'step_ctas', label: 'Step CTAs (pipe separated)', type: 'text', required: true },
    { key: 'completion_times', label: 'Completion Times (pipe separated)', type: 'text', required: false },
    { key: 'step_benefits', label: 'Step Benefits (pipe separated)', type: 'textarea', required: false },
    { key: 'final_cta', label: 'Final CTA Text', type: 'text', required: true },
    { key: 'process_note', label: 'Process Note', type: 'text', required: false },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive step progression',
    'Progress indicator with navigation',
    'Time estimates for each step',
    'Benefit highlighting per step',
    'Clickable step cards',
    'Trust and support messaging'
  ],
  
  useCases: [
    'Complex signup processes',
    'SaaS onboarding flows',
    'Multi-step form breakdown',
    'Service setup processes',
    'Educational course enrollment'
  ]
};