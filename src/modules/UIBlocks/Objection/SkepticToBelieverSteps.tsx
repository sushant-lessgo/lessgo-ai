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
    default: 'From Skeptic to Believer: Your Journey' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'We understand your hesitation. Here\'s how others have moved from doubt to confidence.' 
  },
  conversion_steps: { 
    type: 'string' as const, 
    default: 'Start with healthy skepticism|"This sounds too good to be true"|We get it - you\'ve been disappointed before|Try our free trial|See the results for yourself|No commitment, just experience the difference|Experience the difference|Watch your workflow transform|Most users see immediate improvements in the first session|Share with your team|Get buy-in from stakeholders|92% of teams adopt after the first demo|Become a confident advocate|Join our community of believers|Help others discover what you\'ve found' 
  },
  success_title: {
    type: 'string' as const,
    default: 'Welcome to the Believer Community!'
  },
  success_description: {
    type: 'string' as const,
    default: 'You\'ve joined thousands of others who made this same journey from skepticism to advocacy. Now you\'re part of a community that\'s transforming how work gets done.'
  },
  stat_1_value: {
    type: 'string' as const,
    default: '89%'
  },
  stat_1_label: {
    type: 'string' as const,
    default: 'Complete the journey successfully'
  },
  stat_2_value: {
    type: 'string' as const,
    default: '2.3x'
  },
  stat_2_label: {
    type: 'string' as const,
    default: 'Average productivity increase'
  },
  stat_3_value: {
    type: 'string' as const,
    default: '94%'
  },
  stat_3_label: {
    type: 'string' as const,
    default: 'Recommend to colleagues'
  },
  step_icon_1: { type: 'string' as const, default: '🤔' },
  step_icon_2: { type: 'string' as const, default: '🔍' },
  step_icon_3: { type: 'string' as const, default: '💡' },
  step_icon_4: { type: 'string' as const, default: '🤝' },
  step_icon_5: { type: 'string' as const, default: '🚀' }
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
    const defaultIcons = ['🤔', '🔍', '💡', '🤝', '🚀'];
    const fieldName = iconFields[index] as keyof SkepticToBelieverStepsContent;
    return blockContent[fieldName] || defaultIcons[index] || '✨';
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

        {/* Conversion Steps Journey */}
        <div className="relative">
          
          {/* Progress Line */}
          <div className="absolute left-8 top-16 bottom-16 w-1 bg-gradient-to-b from-red-200 via-yellow-200 to-green-300 rounded-full hidden lg:block"></div>
          
          <div className="space-y-12">
            {conversionSteps.map((step, index) => (
              <div key={index} className="relative">
                
                {/* Step Container */}
                <div className="flex items-start space-x-8">
                  
                  {/* Step Number & Icon */}
                  <div className="flex-shrink-0 relative">
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg transition-all duration-300 ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-orange-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                    >
                      <IconEditableText
                        mode={mode}
                        value={getStepIcon(index)}
                        onEdit={(value) => {
                          const iconField = `step_icon_${index + 1}` as keyof SkepticToBelieverStepsContent;
                          handleContentUpdate(iconField, value);
                        }}
                        backgroundType="custom"
                        colorTokens={{...colorTokens, primaryText: 'text-white'}}
                        iconSize="md"
                        className="text-2xl text-white"
                        sectionId={sectionId}
                        elementKey={`step_icon_${index + 1}`}
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-bold text-gray-500">
                        STEP {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      
                      {/* Step Title */}
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
                        variant="headline"
                        className="text-xl font-bold text-gray-900 mb-4"
                        placeholder="Enter step title"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`step_${index}_title`}
                      />

                      {/* Thought Bubble */}
                      {step.thought && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 relative">
                          <div className="absolute -left-2 top-4 w-4 h-4 bg-gray-50 border-l border-b border-gray-200 transform rotate-45"></div>
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
                            className="text-gray-700 italic"
                            placeholder="Enter skeptical thought"
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key={`step_${index}_thought`}
                          />
                        </div>
                      )}

                      {/* Step Description */}
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
                        className="text-gray-600 leading-relaxed"
                        placeholder="Enter step description"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`step_${index}_description`}
                      />

                      {/* Progress Indicator */}
                      <div className="mt-6 flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${((index + 1) / conversionSteps.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                          {Math.round(((index + 1) / conversionSteps.length) * 100)}%
                        </span>
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
              variant="headline"
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
                  variant="headline"
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
                  variant="headline"
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
                  variant="headline"
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
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Conversion Steps:</strong> Use format "[step title]|[skeptical thought]|[step description]|[next title]|[next thought]|[next description]"
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
  description: 'Guides skeptical prospects through a logical step-by-step conversion journey from doubt to advocacy.',
  tags: ['objection', 'conversion', 'journey', 'steps', 'psychology'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'conversion_steps', label: 'Conversion Steps (pipe separated: title|thought|description)', type: 'textarea', required: true }
  ],
  
  features: [
    'Visual progress line showing journey advancement',
    'Color-coded steps from skeptical (red) to believing (green)',
    'Thought bubbles showing internal dialogue',
    'Progress indicators and completion stats'
  ],
  
  useCases: [
    'B2B sales for sophisticated, analytical buyers',
    'High-consideration purchase decisions',
    'Converting solution-aware to product-aware prospects',
    'Enterprise software adoption journeys'
  ]
};