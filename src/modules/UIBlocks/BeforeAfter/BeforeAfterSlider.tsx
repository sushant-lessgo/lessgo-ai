import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface BeforeAfterSliderContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  before_visual?: string;
  after_visual?: string;
  before_placeholder_text: string;
  after_placeholder_text: string;
  interaction_hint_text: string;
  show_interaction_hint?: string;
  before_icon?: string;
  after_icon?: string;
  hint_icon?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Transform Your Workflow in Minutes' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Before' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'After' 
  },
  before_description: { 
    type: 'string' as const, 
    default: 'Manual processes taking 3+ hours daily with spreadsheets, repetitive data entry, and constant context switching between tools.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Automated workflow completed in minutes with AI-powered tools, seamless integrations, and real-time collaboration features.' 
  },
  before_visual: { 
    type: 'string' as const, 
    default: '/before-placeholder.jpg' 
  },
  after_visual: { 
    type: 'string' as const, 
    default: '/after-placeholder.jpg' 
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
  before_placeholder_text: {
    type: 'string' as const,
    default: 'Time-consuming manual workflow'
  },
  after_placeholder_text: {
    type: 'string' as const,
    default: 'Efficient automated system'
  },
  interaction_hint_text: {
    type: 'string' as const,
    default: 'Click buttons above to switch views'
  },
  show_interaction_hint: {
    type: 'string' as const,
    default: 'true'
  },
  before_icon: {
    type: 'string' as const,
    default: '⚠️'
  },
  after_icon: {
    type: 'string' as const,
    default: '✅'
  },
  hint_icon: {
    type: 'string' as const,
    default: '👆'
  }
};

const InteractiveSlider = React.memo(({ 
  beforeContent, 
  afterContent, 
  showImageToolbar, 
  sectionId, 
  mode,
  h3Style,
  bodyLgStyle,
  beforePlaceholderText,
  afterPlaceholderText,
  interactionHintText,
  showInteractionHint,
  handleContentUpdate,
  colorTokens,
  backgroundType,
  sectionBackground,
  blockContent
}: {
  beforeContent: { label: string; description: string; visual?: string; before_icon?: string };
  afterContent: { label: string; description: string; visual?: string; after_icon?: string };
  showImageToolbar: any;
  sectionId: string;
  mode: 'preview' | 'edit';
  h3Style: React.CSSProperties;
  bodyLgStyle: React.CSSProperties;
  beforePlaceholderText: string;
  afterPlaceholderText: string;
  interactionHintText: string;
  showInteractionHint?: string;
  handleContentUpdate: (key: string, value: string) => void;
  colorTokens: any;
  backgroundType: 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme';
  sectionBackground: any;
  blockContent: BeforeAfterSliderContent;
}) => {
  const [isAfter, setIsAfter] = useState(false);

  const VisualPlaceholder = ({ type }: { type: 'before' | 'after' }) => (
    <div className={`relative w-full h-80 rounded-lg overflow-hidden ${type === 'before' ? 'bg-gradient-to-br from-red-50 to-orange-100' : 'bg-gradient-to-br from-green-50 to-emerald-100'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-24 h-24 rounded-full ${type === 'before' ? 'bg-red-200' : 'bg-green-200'} flex items-center justify-center`}>
          <IconEditableText
            mode={mode}
            value={type === 'before' ? 
              (beforeContent.before_icon || '⚠️') : 
              (afterContent.after_icon || '✅')
            }
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_icon' : 'after_icon', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            iconSize="xl"
            className="text-4xl"
            sectionId={sectionId}
            elementKey={type === 'before' ? 'before_icon' : 'after_icon'}
          />
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`text-center ${type === 'before' ? 'text-red-700' : 'text-green-700'}`} style={bodyLgStyle}>
          <EditableAdaptiveText
            mode={mode}
            value={type === 'before' ? beforePlaceholderText : afterPlaceholderText}
            onEdit={(value) => handleContentUpdate(type === 'before' ? 'before_placeholder_text' : 'after_placeholder_text', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{
              ...bodyLgStyle,
              color: type === 'before' ? '#b91c1c' : '#15803d'
            }}
            className={`text-center ${type === 'before' ? 'text-red-700' : 'text-green-700'}`}
            sectionId={sectionId}
            elementKey={type === 'before' ? 'before_placeholder_text' : 'after_placeholder_text'}
            sectionBackground={sectionBackground}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsAfter(false)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isAfter 
                  ? 'bg-red-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {beforeContent.label}
            </button>
            <button
              onClick={() => setIsAfter(true)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                isAfter 
                  ? 'bg-green-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {afterContent.label}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${isAfter ? '-50%' : '0%'})` }}
          >
            
            <div className="w-full flex-shrink-0">
              <VisualPlaceholder type="before" />
            </div>

            <div className="w-full flex-shrink-0">
              <VisualPlaceholder type="after" />
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center">
            <h3 className={`mb-4 ${isAfter ? 'text-green-600' : 'text-red-600'}`} style={h3Style}>
              {isAfter ? afterContent.label : beforeContent.label}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {isAfter ? afterContent.description : beforeContent.description}
            </p>
          </div>
        </div>
      </div>

      {showInteractionHint !== 'false' && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 bg-white rounded-full shadow-lg px-6 py-3 relative group/hint-item">
            <EditableAdaptiveText
              mode={mode}
              value={interactionHintText || ''}
              onEdit={(value) => handleContentUpdate('interaction_hint_text', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}
              className="text-sm text-gray-500"
              sectionId={sectionId}
              elementKey="interaction_hint_text"
              sectionBackground={sectionBackground}
            />
            <IconEditableText
              mode={mode}
              value={blockContent.hint_icon || '🔼'}
              onEdit={(value) => handleContentUpdate('hint_icon', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              iconSize="sm"
              className="text-lg text-gray-400"
              sectionId={sectionId}
              elementKey="hint_icon"
            />
            
            {/* Remove button */}
            {mode !== 'preview' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_interaction_hint', 'false');
                }}
                className="opacity-0 group-hover/hint-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove interaction hint"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
InteractiveSlider.displayName = 'InteractiveSlider';

export default function BeforeAfterSlider(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<BeforeAfterSliderContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BeforeAfterSlider"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the interactive comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="mb-16">
          <InteractiveSlider
            beforeContent={{
              label: blockContent.before_label,
              description: blockContent.before_description,
              visual: blockContent.before_visual,
              before_icon: blockContent.before_icon
            }}
            afterContent={{
              label: blockContent.after_label,
              description: blockContent.after_description,
              visual: blockContent.after_visual,
              after_icon: blockContent.after_icon
            }}
            showImageToolbar={showImageToolbar}
            sectionId={sectionId}
            mode={mode}
            h3Style={h3Style}
            bodyLgStyle={bodyLgStyle}
            beforePlaceholderText={blockContent.before_placeholder_text}
            afterPlaceholderText={blockContent.after_placeholder_text}
            interactionHintText={blockContent.interaction_hint_text}
            showInteractionHint={blockContent.show_interaction_hint}
            handleContentUpdate={handleContentUpdate}
            colorTokens={colorTokens}
            backgroundType={safeBackgroundType}
            sectionBackground={sectionBackground}
            blockContent={blockContent}
          />
          
          {/* Add interaction hint back button */}
          {mode !== 'preview' && blockContent.show_interaction_hint === 'false' && (
            <div className="text-center mt-4">
              <button
                onClick={() => handleContentUpdate('show_interaction_hint', 'true')}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add interaction hint</span>
              </button>
            </div>
          )}
        </div>


        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your message..."
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
  name: 'BeforeAfterSlider',
  category: 'Comparison',
  description: 'Interactive before/after slider for technical audiences. Perfect for product-aware builders and enterprise users.',
  tags: ['comparison', 'interactive', 'slider', 'technical', 'demo'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'before_visual', label: 'Before Visual', type: 'image', required: false },
    { key: 'after_visual', label: 'After Visual', type: 'image', required: false },
    { key: 'before_placeholder_text', label: 'Before Placeholder Text', type: 'text', required: false },
    { key: 'after_placeholder_text', label: 'After Placeholder Text', type: 'text', required: false },
    { key: 'interaction_hint_text', label: 'Interaction Hint Text', type: 'text', required: false },
    { key: 'show_interaction_hint', label: 'Show Interaction Hint', type: 'boolean', required: false },
    { key: 'before_icon', label: 'Before Icon', type: 'icon', required: false },
    { key: 'after_icon', label: 'After Icon', type: 'icon', required: false },
    { key: 'hint_icon', label: 'Hint Icon', type: 'icon', required: false },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'slider_instruction', label: 'Slider Instruction', type: 'text', required: false }
  ],
  
  features: [
    'Interactive slider for engaging comparison',
    'Toggle buttons for easy switching',
    'Smooth transitions and animations',
    'Perfect for technical demonstrations',
    'Optimized for product-aware audiences',
    'Visual feedback and interaction cues'
  ],
  
  useCases: [
    'Software before/after interface comparisons',
    'AI tool input/output demonstrations',
    'Development workflow optimizations',
    'Performance metric improvements',
    'Technical process transformations'
  ]
};