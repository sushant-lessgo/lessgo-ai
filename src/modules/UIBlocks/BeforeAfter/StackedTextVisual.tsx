import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStore } from '@/hooks/useEditStore';
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

interface StackedTextVisualContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  before_visual?: string;
  after_visual?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Complete Transformation' 
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
    default: 'Describe your current challenges and pain points that need addressing.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Show the improved state and benefits you achieve with our solution.' 
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
  }
};

const VisualPlaceholder = React.memo(({ type }: { type: 'before' | 'after' }) => (
  <div className={`relative w-full h-64 rounded-lg overflow-hidden ${type === 'before' ? 'bg-gradient-to-br from-red-50 to-orange-100' : 'bg-gradient-to-br from-green-50 to-emerald-100'}`}>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`w-20 h-20 rounded-full ${type === 'before' ? 'bg-red-200' : 'bg-green-200'} flex items-center justify-center`}>
        {type === 'before' ? (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <div className={`text-center text-sm font-medium ${type === 'before' ? 'text-red-700' : 'text-green-700'}`}>
        {type === 'before' ? 'Current State' : 'Desired Outcome'}
      </div>
    </div>
  </div>
));
VisualPlaceholder.displayName = 'VisualPlaceholder';

export default function StackedTextVisual(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<StackedTextVisualContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedTextVisual"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the transformation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-16">
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-red-500 ring-4 ring-red-100" />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.before_label}
                onEdit={(value) => handleContentUpdate('before_label', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...getTextStyle('h3'),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  color: '#ef4444'
                }}
                className="text-red-500"
                sectionId={sectionId}
                elementKey="before_label"
                sectionBackground={sectionBackground}
              />
            </div>

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.before_description}
              onEdit={(value) => handleContentUpdate('before_description', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="leading-relaxed text-lg mb-8 max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="before_description"
              sectionBackground={sectionBackground}
            />

            <div className="max-w-md mx-auto">
              {blockContent.before_visual && blockContent.before_visual !== '' ? (
                <img
                  src={blockContent.before_visual}
                  alt="Before state"
                  className="w-full h-64 object-cover rounded-lg shadow-lg cursor-pointer"
                  data-image-id={`${sectionId}-before-visual`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      showImageToolbar(`${sectionId}-before-visual`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              ) : (
                <VisualPlaceholder type="before" />
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-full ${colorTokens.ctaBg} flex items-center justify-center shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${mutedTextColor}`}>
                Transformation
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-3 h-3 rounded-full mr-3 bg-green-500 ring-4 ring-green-100" />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.after_label}
                onEdit={(value) => handleContentUpdate('after_label', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...getTextStyle('h3'),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  color: '#10b981'
                }}
                className="text-green-500"
                sectionId={sectionId}
                elementKey="after_label"
                sectionBackground={sectionBackground}
              />
            </div>

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.after_description}
              onEdit={(value) => handleContentUpdate('after_description', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="leading-relaxed text-lg mb-8 max-w-2xl mx-auto"
              sectionId={sectionId}
              elementKey="after_description"
              sectionBackground={sectionBackground}
            />

            <div className="max-w-md mx-auto">
              {blockContent.after_visual && blockContent.after_visual !== '' ? (
                <img
                  src={blockContent.after_visual}
                  alt="After state"
                  className="w-full h-64 object-cover rounded-lg shadow-lg cursor-pointer"
                  data-image-id={`${sectionId}-after-visual`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      showImageToolbar(`${sectionId}-after-visual`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              ) : (
                <VisualPlaceholder type="after" />
              )}
            </div>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
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
                    textStyle={getTextStyle('body-lg')}
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
  name: 'StackedTextVisual',
  category: 'Comparison',
  description: 'Stacked text and visual transformation layout. Perfect for founders, creators, and early-stage products with friendly tone.',
  tags: ['comparison', 'stacked', 'visual', 'transformation', 'friendly'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'before_visual', label: 'Before Visual', type: 'image', required: false },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'after_visual', label: 'After Visual', type: 'image', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Vertical stacked layout for storytelling flow',
    'Visual transformation with before/after images',
    'Clear transformation arrow indicator',
    'Optimized for founders and creators audience',
    'Automatic text color adaptation',
    'Optional CTA and trust indicators'
  ],
  
  useCases: [
    'Founder journey showcasing business growth',
    'Creative process before/after transformation',
    'Product development evolution story',
    'Skill development progression',
    'Lifestyle transformation narratives'
  ]
};