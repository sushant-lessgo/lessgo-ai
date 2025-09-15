// components/layout/SkepticToBelieverSteps.tsx - Objection UIBlock for step-by-step conversion journey
// Guides skeptical prospects through logical progression to belief and action

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface SkepticToBelieverStepsContent {
  headline: string;
  subheadline?: string;
  conversion_steps: string;
  objections_summary?: string;
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  step_icon_5?: string;
  step_icon_6?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'From "This Won\'t Work" to "How Did We Live Without This?"'
  },
  subheadline: {
    type: 'string' as const,
    default: 'You\'re not the first to be skeptical. Here\'s exactly how 2,847+ professionals went from "this won\'t work" to transforming their entire workflow.'
  },
  conversion_steps: {
    type: 'string' as const,
    default: 'Sarah from TechCorp was skeptical|"Another productivity tool? We\'ve tried everything and nothing works"|Sarah had been burned by 3 failed implementations in 2 years|Marcus from DataFlow decided to test it|"I was shocked - it actually delivered on every promise"|Marcus saw 40% faster workflows within 48 hours of setup|Jennifer from ScaleUp got instant access|"My team adopted it immediately - no training needed"|Jennifer\'s team completed projects 3x faster in the first week|David from Enterprise Inc rolled it out company-wide|"Best decision we made this year - transformed our entire operation"|David\'s 200+ person team achieved 92% faster task completion|Lisa from InnovateCo became the internal champion|"I\'m the hero who found the solution that actually works"|Lisa now leads productivity initiatives and speaks at conferences'
  },
  objections_summary: {
    type: 'string' as const,
    default: 'Every objection has been addressed with real proof from customers who had the same concerns. Now it\'s your turn to join them.'
  },
  step_icon_1: { type: 'string' as const, default: '👩‍💼' },
  step_icon_2: { type: 'string' as const, default: '👨‍💻' },
  step_icon_3: { type: 'string' as const, default: '👩‍🚀' },
  step_icon_4: { type: 'string' as const, default: '👨‍💼' },
  step_icon_5: { type: 'string' as const, default: '👩‍🎓' },
  step_icon_6: { type: 'string' as const, default: '👤' }
};

export default function SkepticToBelieverSteps(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SkepticToBelieverStepsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse conversion steps from pipe-separated string
  const conversionSteps = blockContent.conversion_steps 
    ? blockContent.conversion_steps.split('|').reduce((steps, item, index) => {
        if (index % 3 === 0) {
          steps.push({ title: item.trim(), thought: '', description: '' });
        } else if (index % 3 === 1) {
          steps[steps.length - 1].thought = item.trim().replace(/"/g, '');
        } else {
          steps[steps.length - 1].description = item.trim();
        }
        return steps;
      }, [] as Array<{title: string, thought: string, description: string}>)
    : [];

  const getStepIcon = (index: number) => {
    const iconFields = ['step_icon_1', 'step_icon_2', 'step_icon_3', 'step_icon_4', 'step_icon_5', 'step_icon_6'];
    const defaultIcons = ['👩‍💼', '👨‍💻', '👩‍🚀', '👨‍💼', '👩‍🎓', '👤'];
    const fieldName = iconFields[index] as keyof SkepticToBelieverStepsContent;
    return blockContent[fieldName] || defaultIcons[index] || '👤';
  };

  // Helper function to add a new step
  const addStep = (currentSteps: string): string => {
    const stepsList = currentSteps.split('|').map(s => s.trim()).filter(s => s);

    // Add new step with default content (3 parts: title, thought, description)
    stepsList.push('New Customer', '"Add their initial thought or objection here"', 'Describe the result they achieved after overcoming their objection');

    return stepsList.join('|');
  };

  // Helper function to remove a step
  const removeStep = (currentSteps: string, indexToRemove: number): string => {
    const stepsList = currentSteps.split('|').map(s => s.trim()).filter(s => s);

    // Remove 3 consecutive items (title, thought, description) starting at the correct index
    const startIndex = indexToRemove * 3;
    if (startIndex >= 0 && startIndex < stepsList.length) {
      stepsList.splice(startIndex, 3);
    }

    return stepsList.join('|');
  };

  // Handle adding a new step
  const handleAddStep = () => {
    const newSteps = addStep(blockContent.conversion_steps);
    handleContentUpdate('conversion_steps', newSteps);
  };

  // Handle removing a step
  const handleRemoveStep = (indexToRemove: number) => {
    const newSteps = removeStep(blockContent.conversion_steps, indexToRemove);
    handleContentUpdate('conversion_steps', newSteps);

    // Also clear the corresponding icon if it exists
    const iconField = `step_icon_${indexToRemove + 1}` as keyof SkepticToBelieverStepsContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SkepticToBelieverSteps"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
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
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a subheadline that acknowledges skepticism and introduces the journey..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Customer Success Stories */}
        <div className="relative">
          
          {/* Subtle Connection Line */}
          <div className="absolute left-8 top-16 bottom-16 w-px bg-gray-200 rounded-full hidden lg:block"></div>
          
          <div className="space-y-12">
            {conversionSteps.map((step, index) => (
              <div key={index} className={`relative group/step-${index}`}>

                {/* Step Container */}
                <div className="flex items-start space-x-8">

                  {/* Profile Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 border-2 border-white shadow-lg transition-all duration-300">
                      <IconEditableText
                        mode={mode}
                        value={getStepIcon(index)}
                        onEdit={(value) => {
                          const iconField = `step_icon_${index + 1}` as keyof SkepticToBelieverStepsContent;
                          handleContentUpdate(iconField, value);
                        }}
                        backgroundType="custom"
                        colorTokens={{...colorTokens, primaryText: 'text-gray-600'}}
                        iconSize="md"
                        className="text-2xl"
                        sectionId={sectionId}
                        elementKey={`step_icon_${index + 1}`}
                      />
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <div className="flex-1 pb-8 relative">
                    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">

                      {/* Delete Button - only show in edit mode and if more than 1 step */}
                      {mode !== 'preview' && conversionSteps.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStep(index);
                          }}
                          className={`absolute top-4 right-4 opacity-0 group-hover/step-${index}:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200`}
                          title="Remove this step"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Customer Name/Title */}
                      <EditableAdaptiveText
                        mode={mode}
                        value={step.title || ''}
                        onEdit={(value) => {
                          const updatedSteps = blockContent.conversion_steps.split('|');
                          updatedSteps[index * 3] = value;
                          handleContentUpdate('conversion_steps', updatedSteps.join('|'));
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-lg font-semibold text-gray-800 mb-3"
                        placeholder="Customer name and company"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`step_${index}_title`}
                      />

                      {/* Quote */}
                      {step.thought && (
                        <div className="bg-blue-50 border-l-4 border-blue-200 p-4 mb-4 relative">
                          <EditableAdaptiveText
                            mode={mode}
                            value={step.thought || ''}
                            onEdit={(value) => {
                              const updatedSteps = blockContent.conversion_steps.split('|');
                              updatedSteps[index * 3 + 1] = `"${value}"`;
                              handleContentUpdate('conversion_steps', updatedSteps.join('|'));
                            }}
                            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                            colorTokens={colorTokens}
                            variant="body"
                            className="text-blue-900 italic text-lg font-medium"
                            placeholder="Enter customer quote"
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key={`step_${index}_thought`}
                          />
                        </div>
                      )}

                      {/* Result/Outcome */}
                      <EditableAdaptiveText
                        mode={mode}
                        value={step.description || ''}
                        onEdit={(value) => {
                          const updatedSteps = blockContent.conversion_steps.split('|');
                          updatedSteps[index * 3 + 2] = value;
                          handleContentUpdate('conversion_steps', updatedSteps.join('|'));
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-gray-700 leading-relaxed"
                        placeholder="Enter the result/outcome"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`step_${index}_description`}
                      />

                      {/* Subtle Credibility Indicator */}
                      <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
                        <span>Real customer experience</span>
                        <span>Verified result</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Step Button - only show in edit mode and if under 6 steps */}
        {mode !== 'preview' && conversionSteps.length < 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleAddStep}
              className="flex items-center space-x-2 mx-auto px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Step</span>
            </button>
          </div>
        )}

        {/* Objections Summary */}
        {(blockContent.objections_summary || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="max-w-3xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.objections_summary || ''}
                onEdit={(value) => handleContentUpdate('objections_summary', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: 'text-blue-900' }}
                variant="body"
                className="text-lg font-medium text-blue-900"
                placeholder="Add a summary of how objections have been addressed..."
                sectionId={sectionId}
                elementKey="objections_summary"
                sectionBackground="bg-blue-50"
              />
            </div>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SkepticToBelieverSteps',
  category: 'Objection Sections',
  description: 'Transforms skeptical prospects into confident buyers using psychologically-driven proof progression that addresses real objections.',
  tags: ['objection', 'conversion', 'psychology', 'social-proof', 'credibility'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'conversion_steps', label: 'Conversion Steps', type: 'textarea', required: true },
    { key: 'objections_summary', label: 'Objections Summary', type: 'textarea', required: false }
  ],
  
  features: [
    'Psychologically-driven progression from skepticism to commitment',
    'Dynamic add/delete customer story cards (up to 6 maximum)',
    'Specific objections with concrete social proof responses',
    'Inline editing with delete buttons using hover interactions',
    'Objections summary section for closing thoughts',
    'Editable customer icons and testimonial content'
  ],

  useCases: [
    'Converting burned prospects who\'ve tried failed solutions',
    'B2B enterprise sales with multiple stakeholders',
    'High-ticket offers requiring significant trust',
    'Sophisticated buyers who need extensive proof',
    'Overcoming industry-specific skepticism'
  ]
};