import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
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

interface CarouselContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  feature_visuals?: string;
  feature_tags?: string;
  auto_play?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Discover Amazing Features' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Creative Workflows|Visual Designer|Template Library|Team Sharing|Export Options|Version Control' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Build amazing visual content with our intuitive drag-and-drop interface and powerful design tools.|Create stunning designs with our professional-grade visual editor featuring advanced typography and effects.|Choose from thousands of professionally designed templates for every occasion and industry.|Share your work with team members and collaborate in real-time with commenting and feedback tools.|Export your creations in any format - from web-ready assets to print-quality files.|Keep track of all your design iterations with automatic version history and easy rollback options.' 
  },
  feature_visuals: { 
    type: 'string' as const, 
    default: '/feature-workflow.jpg|/feature-designer.jpg|/feature-templates.jpg|/feature-sharing.jpg|/feature-export.jpg|/feature-versions.jpg' 
  },
  feature_tags: { 
    type: 'string' as const, 
    default: 'No-Code|Professional|1000+ Templates|Real-Time|All Formats|Auto-Save' 
  },
  auto_play: { 
    type: 'string' as const, 
    default: 'false' 
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

export default function Carousel(props: LayoutComponentProps) {
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
  } = useLayoutComponent<CarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureVisuals = blockContent.feature_visuals 
    ? blockContent.feature_visuals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureTags = blockContent.feature_tags 
    ? blockContent.feature_tags.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const features = featureTitles.map((title, index) => ({
    title,
    description: featureDescriptions[index] || '',
    visual: featureVisuals[index] || '',
    tag: featureTags[index] || ''
  }));

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (blockContent.auto_play === 'true' && features.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % features.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [blockContent.auto_play, features.length]);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  const VisualPlaceholder = ({ index }: { index: number }) => (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            {features[index]?.title || 'Feature'} Visual
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Carousel"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your feature showcase..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Carousel Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_titles || ''}
                  onEdit={(value) => handleContentUpdate('feature_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_tags || ''}
                  onEdit={(value) => handleContentUpdate('feature_tags', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Feature tags/badges (pipe separated) - optional"
                  sectionId={sectionId}
                  elementKey="feature_tags"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Main Carousel */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Content Side */}
                <div className="space-y-6">
                  {features[activeSlide]?.tag && (
                    <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${colorTokens.ctaBg} text-white`}>
                      {features[activeSlide].tag}
                    </span>
                  )}
                  
                  <h3 style={h2Style} className="font-bold text-gray-900">
                    {features[activeSlide]?.title}
                  </h3>
                  
                  <p style={bodyLgStyle} className="text-gray-600 leading-relaxed">
                    {features[activeSlide]?.description}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Easy to use</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Instant results</span>
                    </div>
                  </div>
                </div>

                {/* Visual Side */}
                <div className="relative">
                  {features[activeSlide]?.visual && features[activeSlide].visual !== '' ? (
                    <img
                      src={features[activeSlide].visual}
                      alt={features[activeSlide].title}
                      className="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
                      data-image-id={`${sectionId}-carousel${activeSlide}-visual`}
                      onMouseUp={(e) => {
                        // Image toolbar is only available in edit mode
                      }}
                    />
                  ) : (
                    <VisualPlaceholder index={activeSlide} />
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevSlide}
                className={`p-3 rounded-full ${colorTokens.surfaceElevated} border border-gray-200 hover:shadow-md transition-all duration-200`}
                disabled={features.length <= 1}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Slide Indicators */}
              <div className="flex space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      activeSlide === index
                        ? `${colorTokens.ctaBg} transform scale-125`
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className={`p-3 rounded-full ${colorTokens.surfaceElevated} border border-gray-200 hover:shadow-md transition-all duration-200`}
                disabled={features.length <= 1}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature List Preview */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                    activeSlide === index
                      ? `${colorTokens.ctaBg.replace('bg-', 'border-')} ${colorTokens.surfaceElevated}`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {feature.title}
                  </div>
                  {feature.tag && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {feature.tag}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your creative features..."
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
  name: 'Carousel',
  category: 'Features',
  description: 'Interactive feature carousel with navigation. Perfect for creative tools and visual products.',
  tags: ['features', 'carousel', 'interactive', 'creative', 'visual'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_visuals', label: 'Feature Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'feature_tags', label: 'Feature Tags/Badges (pipe separated)', type: 'text', required: false },
    { key: 'auto_play', label: 'Auto-play Carousel', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive carousel with navigation',
    'Auto-play functionality option',
    'Feature preview grid',
    'Visual content support',
    'Smooth transitions and animations',
    'Perfect for creative showcases'
  ],
  
  useCases: [
    'Creative tool features',
    'Design platform capabilities',
    'Visual product showcases',
    'Friendly/playful tone products',
    'Founder and creator audiences'
  ]
};