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

interface BeforeAfterSliderContent {
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
    default: 'See The Transformation' 
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
    default: 'Your current workflow with manual processes, inefficiencies, and time-consuming tasks.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Streamlined automation, increased productivity, and seamless workflows that save you hours daily.' 
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

const InteractiveSlider = React.memo(({ 
  beforeContent, 
  afterContent, 
  showImageToolbar, 
  sectionId, 
  mode 
}: {
  beforeContent: { label: string; description: string; visual?: string };
  afterContent: { label: string; description: string; visual?: string };
  showImageToolbar: any;
  sectionId: string;
  mode: string;
}) => {
  const [isAfter, setIsAfter] = useState(false);

  const VisualPlaceholder = ({ type }: { type: 'before' | 'after' }) => (
    <div className={`relative w-full h-80 rounded-lg overflow-hidden ${type === 'before' ? 'bg-gradient-to-br from-red-50 to-orange-100' : 'bg-gradient-to-br from-green-50 to-emerald-100'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-24 h-24 rounded-full ${type === 'before' ? 'bg-red-200' : 'bg-green-200'} flex items-center justify-center`}>
          {type === 'before' ? (
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`text-center text-lg font-semibold ${type === 'before' ? 'text-red-700' : 'text-green-700'}`}>
          {type === 'before' ? 'Current Process' : 'Optimized Solution'}
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
              {beforeContent.visual && beforeContent.visual !== '' ? (
                <img
                  src={beforeContent.visual}
                  alt="Before state"
                  className="w-full h-80 object-cover cursor-pointer"
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

            <div className="w-full flex-shrink-0">
              {afterContent.visual && afterContent.visual !== '' ? (
                <img
                  src={afterContent.visual}
                  alt="After state"
                  className="w-full h-80 object-cover cursor-pointer"
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

        <div className="p-8">
          <div className="text-center">
            <h3 className={`text-xl font-semibold mb-4 ${isAfter ? 'text-green-600' : 'text-red-600'}`}>
              {isAfter ? afterContent.label : beforeContent.label}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {isAfter ? afterContent.description : beforeContent.description}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 bg-white rounded-full shadow-lg px-6 py-3">
          <span className="text-sm text-gray-500">Drag to compare</span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
});
InteractiveSlider.displayName = 'InteractiveSlider';

export default function BeforeAfterSlider(props: LayoutComponentProps) {
  
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
              className="text-lg mb-6 max-w-3xl mx-auto"
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
              visual: blockContent.before_visual
            }}
            afterContent={{
              label: blockContent.after_label,
              description: blockContent.after_description,
              visual: blockContent.after_visual
            }}
            showImageToolbar={showImageToolbar}
            sectionId={sectionId}
            mode={mode}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full mr-3 bg-red-500 ring-4 ring-red-100" />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.before_label}
                onEdit={(value) => handleContentUpdate('before_label', value)}
                backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body')}
              className="leading-relaxed"
              sectionId={sectionId}
              elementKey="before_description"
              sectionBackground={sectionBackground}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full mr-3 bg-green-500 ring-4 ring-green-100" />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.after_label}
                onEdit={(value) => handleContentUpdate('after_label', value)}
                backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body')}
              className="leading-relaxed"
              sectionId={sectionId}
              elementKey="after_description"
              sectionBackground={sectionBackground}
            />
          </div>
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
  name: 'BeforeAfterSlider',
  category: 'Comparison',
  description: 'Interactive before/after slider for technical audiences. Perfect for product-aware builders and enterprise users.',
  tags: ['comparison', 'interactive', 'slider', 'technical', 'demo'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
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