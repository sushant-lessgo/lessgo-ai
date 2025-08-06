import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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

interface CardFlipStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_visuals?: string;
  step_actions: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Interactive Design Process' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'Choose Template|Customize Design|Preview & Test|Publish Live' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Browse our library of professionally designed templates and select the one that matches your vision.|Use our intuitive drag-and-drop editor to customize colors, fonts, images, and content to match your brand.|Preview your design on different devices and test all interactive elements before going live.|Publish your creation with one click and share it with the world instantly.' 
  },
  step_visuals: { 
    type: 'string' as const, 
    default: '/template-browser.jpg|/design-editor.jpg|/preview-mode.jpg|/publish-live.jpg' 
  },
  step_actions: { 
    type: 'string' as const, 
    default: 'Browse Templates|Start Editing|Test Design|Go Live' 
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

const FlipCard = React.memo(({ 
  title, 
  description, 
  visual,
  action,
  index,
  isFlipped,
  onFlip,
  showImageToolbar,
  sectionId,
  mode
}: {
  title: string;
  description: string;
  visual?: string;
  action: string;
  index: number;
  isFlipped: boolean;
  onFlip: () => void;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
}) => {
  
  const getColorForIndex = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600'
    ];
    return colors[index % colors.length];
  };

  const VisualPlaceholder = () => (
    <div className={`w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br ${getColorForIndex(index)} bg-opacity-10`}>
      <div className="h-full flex items-center justify-center">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getColorForIndex(index)} flex items-center justify-center`}>
          <span className="text-white font-bold text-xl">{index + 1}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="group perspective-1000">
      <div 
        className={`relative w-full h-96 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={onFlip}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col">
          <div className="flex-1">
            {visual && visual !== '' ? (
              <img
                src={visual}
                alt={title}
                className="w-full h-48 object-cover rounded-lg mb-4"
                data-image-id={`${sectionId}-step${index}-visual`}
                onMouseUp={(e) => {
                  // Image toolbar is only available in edit mode
                }}
              />
            ) : (
              <VisualPlaceholder />
            )}
            
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColorForIndex(index)} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Click to flip for details</span>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br ${getColorForIndex(index)} rounded-xl shadow-lg p-6 flex flex-col text-white`}>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
            </div>
            
            <p className="text-white/90 leading-relaxed text-lg mb-6">
              {description}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-white/80">Fast & intuitive</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white/80">No technical skills needed</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-white/20">
            <button className="w-full bg-white/20 hover:bg-white/30 transition-colors duration-200 rounded-lg py-3 px-4 text-white font-semibold">
              {action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
FlipCard.displayName = 'FlipCard';

export default function CardFlipSteps(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CardFlipStepsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepVisuals = blockContent.step_visuals 
    ? blockContent.step_visuals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepActions = blockContent.step_actions 
    ? blockContent.step_actions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || '',
    visual: stepVisuals[index] || '',
    action: stepActions[index] || 'Get Started'
  }));

  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CardFlipSteps"
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
              placeholder="Add optional subheadline to introduce your interactive process..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Card Flip Content</h4>
              
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
                  className="mb-2"
                  placeholder="Step descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_actions || ''}
                  onEdit={(value) => handleContentUpdate('step_actions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step action buttons (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_actions"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {steps.map((step, index) => (
              <FlipCard
                key={index}
                title={step.title}
                description={step.description}
                visual={step.visual}
                action={step.action}
                index={index}
                isFlipped={flippedCards.has(index)}
                onFlip={() => toggleFlip(index)}
                showImageToolbar={showImageToolbar}
                sectionId={sectionId}
                mode={mode}
              />
            ))}
          </div>
        )}

        {/* Interactive Guide */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-8 border border-purple-100 mb-12">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="text-gray-700 font-medium">Interactive</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-gray-700 font-medium">User-friendly</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-700 font-medium">Real-time</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Hands-On Creative Experience
            </h3>
            
            <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
              Try before you buy with our interactive design process - see exactly how easy it is to create amazing results
            </p>
          </div>
        </div>

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
                placeholder="Add optional supporting text to reinforce your interactive benefits..."
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
      
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'CardFlipSteps',
  category: 'HowItWorks',
  description: 'Interactive card flip steps for creative tools. Perfect for design platforms and solution-aware audiences.',
  tags: ['how-it-works', 'interactive', 'cards', 'flip', 'creative'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'text', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_visuals', label: 'Step Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'step_actions', label: 'Step Action Buttons (pipe separated)', type: 'text', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive 3D card flip animations',
    'Visual process steps with images',
    'Action buttons on card backs',
    'Creative and engaging presentation',
    'Perfect for hands-on products',
    'Solution-aware audience targeting'
  ],
  
  useCases: [
    'Design and creative tools',
    'No-code platforms',
    'Interactive products',
    'Creative workflow demonstrations',
    'Solution-aware audience engagement'
  ]
};