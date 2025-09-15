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
  success_title?: string;
  success_description?: string;
  stat_1_value?: string;
  stat_1_label?: string;
  stat_2_value?: string;
  stat_2_label?: string;
  stat_3_value?: string;
  stat_3_label?: string;
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
  step_icon_4?: string;
  step_icon_5?: string;
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
  success_title: {
    type: 'string' as const,
    default: 'You\'re Now Part of the Solution Leaders'
  },
  success_description: {
    type: 'string' as const,
    default: 'You\'ve joined 2,847+ professionals who solved this problem before their competitors did. You\'re now part of an exclusive group that\'s transforming their industries while others are still struggling with outdated methods.'
  },
  stat_1_value: {
    type: 'string' as const,
    default: '7 days'
  },
  stat_1_label: {
    type: 'string' as const,
    default: 'Average time to see results'
  },
  stat_2_value: {
    type: 'string' as const,
    default: '3.2x'
  },
  stat_2_label: {
    type: 'string' as const,
    default: 'Faster project completion'
  },
  stat_3_value: {
    type: 'string' as const,
    default: '96%'
  },
  stat_3_label: {
    type: 'string' as const,
    default: 'Would choose again'
  },
  step_icon_1: { type: 'string' as const, default: '👩‍💼' },
  step_icon_2: { type: 'string' as const, default: '👨‍💻' },
  step_icon_3: { type: 'string' as const, default: '👩‍🚀' },
  step_icon_4: { type: 'string' as const, default: '👨‍💼' },
  step_icon_5: { type: 'string' as const, default: '👩‍🎓' }
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
    const iconFields = ['step_icon_1', 'step_icon_2', 'step_icon_3', 'step_icon_4', 'step_icon_5'];
    const defaultIcons = ['👩‍💼', '👨‍💻', '👩‍🚀', '👨‍💼', '👩‍🎓'];
    const fieldName = iconFields[index] as keyof SkepticToBelieverStepsContent;
    return blockContent[fieldName] || defaultIcons[index] || '👤';
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
              <div key={index} className="relative">
                
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
                  <div className="flex-1 pb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                      
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

        {/* Success Story Section */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="text-4xl mb-4">🎉</div>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.success_title || ''}
              onEdit={(value) => handleContentUpdate('success_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-2xl font-bold text-green-900 mb-4"
              placeholder="Enter success title"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="success_title"
            />
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.success_description || ''}
              onEdit={(value) => handleContentUpdate('success_description', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-green-800 mb-6 text-lg leading-relaxed"
              placeholder="Enter success description"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="success_description"
            />
            
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_1_value || ''}
                  onEdit={(value) => handleContentUpdate('stat_1_value', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-green-900 mb-2"
                  placeholder="Stat 1 value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_1_value"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_1_label || ''}
                  onEdit={(value) => handleContentUpdate('stat_1_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-green-700 text-sm"
                  placeholder="Stat 1 label"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_1_label"
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_2_value || ''}
                  onEdit={(value) => handleContentUpdate('stat_2_value', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-green-900 mb-2"
                  placeholder="Stat 2 value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_2_value"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_2_label || ''}
                  onEdit={(value) => handleContentUpdate('stat_2_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-green-700 text-sm"
                  placeholder="Stat 2 label"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_2_label"
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_3_value || ''}
                  onEdit={(value) => handleContentUpdate('stat_3_value', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-green-900 mb-2"
                  placeholder="Stat 3 value"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_3_value"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.stat_3_label || ''}
                  onEdit={(value) => handleContentUpdate('stat_3_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-green-700 text-sm"
                  placeholder="Stat 3 label"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="stat_3_label"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Customer Stories:</strong> Use format "[name & company]|[customer quote]|[result achieved]|[next customer]|[next quote]|[next result]"
            </p>
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
    { key: 'conversion_steps', label: 'Conversion Steps (pipe separated: title|thought|description)', type: 'textarea', required: true }
  ],
  
  features: [
    'Psychologically-driven progression from skepticism to commitment',
    'Specific objections with concrete social proof responses',
    'Quantified results and credible statistics',
    'Color-coded emotional journey with progress tracking',
    'Internal dialogue bubbles showing real thoughts'
  ],

  useCases: [
    'Converting burned prospects who\'ve tried failed solutions',
    'B2B enterprise sales with multiple stakeholders',
    'High-ticket offers requiring significant trust',
    'Sophisticated buyers who need extensive proof',
    'Overcoming industry-specific skepticism'
  ]
};