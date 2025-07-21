// components/layout/SkepticToBelieverSteps.tsx - Objection UIBlock for step-by-step conversion journey
// Guides skeptical prospects through logical progression to belief and action

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface SkepticToBelieverStepsContent {
  headline: string;
  subheadline?: string;
  conversion_steps: string;
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
  }
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

  const stepIcons = ['🤔', '🔍', '💡', '🤝', '🚀'];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SkepticToBelieverSteps"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
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
                      <span className="text-2xl">
                        {stepIcons[index] || '✨'}
                      </span>
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
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {step.title}
                      </h3>

                      {/* Thought Bubble */}
                      {step.thought && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 relative">
                          <div className="absolute -left-2 top-4 w-4 h-4 bg-gray-50 border-l border-b border-gray-200 transform rotate-45"></div>
                          <p className="text-gray-700 italic">
                            "{step.thought}"
                          </p>
                        </div>
                      )}

                      {/* Step Description */}
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>

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
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              Welcome to the Believer Community!
            </h3>
            <p className="text-green-800 mb-6 text-lg leading-relaxed">
              You've joined thousands of others who made this same journey from skepticism to advocacy. 
              Now you're part of a community that's transforming how work gets done.
            </p>
            
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-900 mb-2">89%</div>
                <div className="text-green-700 text-sm">Complete the journey successfully</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-900 mb-2">2.3x</div>
                <div className="text-green-700 text-sm">Average productivity increase</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-900 mb-2">94%</div>
                <div className="text-green-700 text-sm">Recommend to colleagues</div>
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