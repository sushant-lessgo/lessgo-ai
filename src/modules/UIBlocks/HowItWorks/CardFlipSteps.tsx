import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
  // Flip card features
  flip_feature_1_text?: string;
  flip_feature_2_text?: string;
  flip_feature_1_icon?: string;
  flip_feature_2_icon?: string;
  // Interactive Guide fields
  guide_heading?: string;
  guide_description?: string;
  guide_indicator_1_text?: string;
  guide_indicator_2_text?: string;
  guide_indicator_3_text?: string;
  guide_indicator_1_icon?: string;
  guide_indicator_2_icon?: string;
  guide_indicator_3_icon?: string;
  show_flip_features?: boolean;
  show_interactive_guide?: boolean;
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
  },
  // Flip card features
  flip_feature_1_text: { 
    type: 'string' as const, 
    default: 'Fast & intuitive' 
  },
  flip_feature_2_text: { 
    type: 'string' as const, 
    default: 'No technical skills needed' 
  },
  flip_feature_1_icon: { type: 'string' as const, default: '⚡' },
  flip_feature_2_icon: { type: 'string' as const, default: '✅' },
  // Interactive Guide fields
  guide_heading: { 
    type: 'string' as const, 
    default: 'Hands-On Creative Experience' 
  },
  guide_description: { 
    type: 'string' as const, 
    default: 'Try before you buy with our interactive design process - see exactly how easy it is to create amazing results' 
  },
  guide_indicator_1_text: { 
    type: 'string' as const, 
    default: 'Interactive' 
  },
  guide_indicator_2_text: { 
    type: 'string' as const, 
    default: 'User-friendly' 
  },
  guide_indicator_3_text: { 
    type: 'string' as const, 
    default: 'Real-time' 
  },
  guide_indicator_1_icon: { type: 'string' as const, default: '🎯' },
  guide_indicator_2_icon: { type: 'string' as const, default: '💖' },
  guide_indicator_3_icon: { type: 'string' as const, default: '⚡' },
  show_flip_features: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_interactive_guide: { 
    type: 'boolean' as const, 
    default: true 
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
  mode,
  blockContent,
  handleContentUpdate,
  backgroundType,
  colorTokens
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
  blockContent: CardFlipStepsContent;
  handleContentUpdate: (key: string, value: any) => void;
  backgroundType: any;
  colorTokens: any;
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
                <IconEditableText
                  mode={mode as 'edit' | 'preview'}
                  value={blockContent.flip_feature_1_icon || '⚡'}
                  onEdit={(value) => handleContentUpdate('flip_feature_1_icon', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-xl text-white/80"
                  sectionId={sectionId}
                  elementKey="flip_feature_1_icon"
                />
                <span className="text-white/80">{blockContent.flip_feature_1_text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <IconEditableText
                  mode={mode as 'edit' | 'preview'}
                  value={blockContent.flip_feature_2_icon || '✅'}
                  onEdit={(value) => handleContentUpdate('flip_feature_2_icon', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-xl text-white/80"
                  sectionId={sectionId}
                  elementKey="flip_feature_2_icon"
                />
                <span className="text-white/80">{blockContent.flip_feature_2_text}</span>
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
  
  const { getTextStyle: getTypographyStyle } = useTypography();

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

  // Icon edit handlers
  const handleGuideIndicatorIconEdit = (index: number, value: string) => {
    const iconField = `guide_indicator_${index + 1}_icon` as keyof CardFlipStepsContent;
    handleContentUpdate(iconField, value);
  };

  const getGuideIndicatorIcon = (index: number) => {
    const iconFields = ['guide_indicator_1_icon', 'guide_indicator_2_icon', 'guide_indicator_3_icon'];
    return blockContent[iconFields[index] as keyof CardFlipStepsContent] || ['🎯', '💖', '⚡'][index];
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CardFlipSteps"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode as 'edit' | 'preview'}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode as 'edit' | 'preview'}
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
              mode={mode as 'edit' | 'preview'}
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

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Card Flip Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode as 'edit' | 'preview'}
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
                  mode={mode as 'edit' | 'preview'}
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
                  mode={mode as 'edit' | 'preview'}
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
                mode={mode as 'edit' | 'preview'}
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
              />
            ))}
          </div>
        )}

        {/* Interactive Guide */}
        {blockContent.show_interactive_guide !== false && (
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-8 border border-purple-100 mb-12">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-6 mb-4">
                {(blockContent.guide_indicator_1_text && blockContent.guide_indicator_1_text !== '___REMOVED___') && (
                  <div className="relative group/guide-indicator-1 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode as 'edit' | 'preview'}
                      value={getGuideIndicatorIcon(0) as string || '📋'}
                      onEdit={(value) => handleGuideIndicatorIconEdit(0, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-2xl text-purple-600"
                      sectionId={sectionId}
                      elementKey="guide_indicator_1_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode as 'edit' | 'preview'}
                      value={blockContent.guide_indicator_1_text || ''}
                      onEdit={(value) => handleContentUpdate('guide_indicator_1_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Guide indicator 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="guide_indicator_1_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('guide_indicator_1_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/guide-indicator-1:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove indicator 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.guide_indicator_1_text && blockContent.guide_indicator_1_text !== '___REMOVED___') && 
                 (blockContent.guide_indicator_2_text && blockContent.guide_indicator_2_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                {(blockContent.guide_indicator_2_text && blockContent.guide_indicator_2_text !== '___REMOVED___') && (
                  <div className="relative group/guide-indicator-2 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode as 'edit' | 'preview'}
                      value={getGuideIndicatorIcon(1) as string || '🔍'}
                      onEdit={(value) => handleGuideIndicatorIconEdit(1, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-2xl text-pink-600"
                      sectionId={sectionId}
                      elementKey="guide_indicator_2_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode as 'edit' | 'preview'}
                      value={blockContent.guide_indicator_2_text || ''}
                      onEdit={(value) => handleContentUpdate('guide_indicator_2_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Guide indicator 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="guide_indicator_2_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('guide_indicator_2_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/guide-indicator-2:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove indicator 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.guide_indicator_2_text && blockContent.guide_indicator_2_text !== '___REMOVED___') && 
                 (blockContent.guide_indicator_3_text && blockContent.guide_indicator_3_text !== '___REMOVED___') && (
                  <div className="w-px h-6 bg-gray-300" />
                )}
                {(blockContent.guide_indicator_3_text && blockContent.guide_indicator_3_text !== '___REMOVED___') && (
                  <div className="relative group/guide-indicator-3 flex items-center space-x-2">
                    <IconEditableText
                      mode={mode as 'edit' | 'preview'}
                      value={getGuideIndicatorIcon(2) as string || '✅'}
                      onEdit={(value) => handleGuideIndicatorIconEdit(2, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-2xl text-orange-600"
                      sectionId={sectionId}
                      elementKey="guide_indicator_3_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode as 'edit' | 'preview'}
                      value={blockContent.guide_indicator_3_text || ''}
                      onEdit={(value) => handleContentUpdate('guide_indicator_3_text', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium"
                      placeholder="Guide indicator 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="guide_indicator_3_text"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('guide_indicator_3_text', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/guide-indicator-3:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
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
              
              {(blockContent.guide_heading || mode === 'edit') && (
                <div className="relative group/guide-heading">
                  <EditableAdaptiveText
                    mode={mode as 'edit' | 'preview'}
                    value={blockContent.guide_heading || ''}
                    onEdit={(value) => handleContentUpdate('guide_heading', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-xl font-semibold text-gray-900 mb-2"
                    placeholder="Guide heading"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="guide_heading"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('guide_heading', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/guide-heading:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Remove guide heading"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {(blockContent.guide_description || mode === 'edit') && (
                <div className="relative group/guide-desc">
                  <EditableAdaptiveText
                    mode={mode as 'edit' | 'preview'}
                    value={blockContent.guide_description || ''}
                    onEdit={(value) => handleContentUpdate('guide_description', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`${mutedTextColor} max-w-2xl mx-auto`}
                    placeholder="Guide description"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="guide_description"
                  />
                  {mode !== 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('guide_description', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/guide-desc:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Remove guide description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode as 'edit' | 'preview'}
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'flip_feature_1_text', label: 'Flip Feature 1', type: 'text', required: false },
    { key: 'flip_feature_2_text', label: 'Flip Feature 2', type: 'text', required: false },
    { key: 'guide_heading', label: 'Interactive Guide Heading', type: 'text', required: false },
    { key: 'guide_description', label: 'Interactive Guide Description', type: 'textarea', required: false },
    { key: 'guide_indicator_1_text', label: 'Guide Indicator 1', type: 'text', required: false },
    { key: 'guide_indicator_2_text', label: 'Guide Indicator 2', type: 'text', required: false },
    { key: 'guide_indicator_3_text', label: 'Guide Indicator 3', type: 'text', required: false },
    { key: 'show_flip_features', label: 'Show Flip Features', type: 'boolean', required: false },
    { key: 'show_interactive_guide', label: 'Show Interactive Guide', type: 'boolean', required: false }
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