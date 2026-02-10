import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getCardStyles } from '@/modules/Design/cardStyles';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  visual?: string;
  tag?: string;
}

interface CarouselContent {
  headline: string;
  subheadline?: string;
  supporting_text?: string;
  auto_play?: boolean;
  benefit_1?: string;
  benefit_2?: string;
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  features: FeatureItem[];
}

// V2: Content schema for extractLayoutContent
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' },
  auto_play: { type: 'boolean' as const, default: false },
  benefit_1: { type: 'string' as const, default: '' },
  benefit_2: { type: 'string' as const, default: '' },
  benefit_icon_1: { type: 'string' as const, default: 'CheckCircle' },
  benefit_icon_2: { type: 'string' as const, default: 'Clock' },
  features: { type: 'array' as const, default: [] },
};

const CarouselSlide = React.memo(({
  feature,
  sectionId,
  mode,
  onUpdateFeature,
  colorTokens,
  handleImageToolbar,
  h2Style,
  bodyLgStyle,
  onRemove,
  getBenefitColors,
  benefit_1,
  benefit_2,
  benefit_icon_1,
  benefit_icon_2,
  onUpdateBenefit
}: {
  feature: FeatureItem;
  sectionId: string;
  mode: 'edit' | 'preview';
  onUpdateFeature: (id: string, field: keyof FeatureItem, value: string) => void;
  colorTokens: any;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  h2Style: any;
  bodyLgStyle: any;
  onRemove?: () => void;
  getBenefitColors: (index: number) => { text: string; bg: string };
  benefit_1?: string;
  benefit_2?: string;
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  onUpdateBenefit: (field: string, value: string) => void;
}) => {

  const VisualPlaceholder = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <div
      className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-100 cursor-pointer hover:bg-gradient-to-br hover:from-pink-100 hover:to-purple-150 transition-all duration-300"
      onClick={onClick}
    >
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
            {feature.title || 'Feature'} Visual
          </div>
          {mode === 'edit' && (
            <div className="text-xs text-gray-500 mt-2">
              Click to add image
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center group relative">

      {/* Content Side */}
      <div className="space-y-6">
        {(feature.tag || mode === 'edit') && (
          <div className="relative group/feature-tag">
            {feature.tag ? (
              <>
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      onUpdateFeature(feature.id, 'tag', e.currentTarget.textContent || '');
                    }}
                    className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${colorTokens.ctaBg} text-white outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 cursor-text hover:opacity-80 transition-opacity min-w-[80px] text-center`}
                    data-placeholder="Feature tag"
                  >
                    {feature.tag}
                  </div>
                ) : (
                  <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${colorTokens.ctaBg} text-white`}>
                    {feature.tag}
                  </span>
                )}

                {/* Remove button for edit mode */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateFeature(feature.id, 'tag', '');
                    }}
                    className="opacity-0 group-hover/feature-tag:opacity-100 absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all duration-200 shadow-sm z-10"
                    title="Remove tag"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </>
            ) : mode === 'edit' && (
              <button
                onClick={() => {
                  onUpdateFeature(feature.id, 'tag', 'New Tag');
                }}
                className="inline-block text-sm px-4 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 rounded-full transition-all duration-200"
              >
                + Add Tag
              </button>
            )}
          </div>
        )}

        {/* Editable Feature Title */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              onUpdateFeature(feature.id, 'title', e.currentTarget.textContent || '');
            }}
            className={`text-2xl font-bold ${colorTokens.textPrimary} outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]`}
            data-placeholder="Feature title"
          >
            {feature.title}
          </div>
        ) : (
          <h3 style={h2Style} className={`font-bold ${colorTokens.textPrimary}`}>
            {feature.title}
          </h3>
        )}

        {/* Editable Feature Description */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              onUpdateFeature(feature.id, 'description', e.currentTarget.textContent || '');
            }}
            className={`${colorTokens.textSecondary} leading-relaxed outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]`}
            data-placeholder="Feature description"
          >
            {feature.description}
          </div>
        ) : (
          <p style={bodyLgStyle} className={`${colorTokens.textSecondary} leading-relaxed`}>
            {feature.description}
          </p>
        )}

        {/* Benefits */}
        <div className="flex items-center space-x-4">
          {(benefit_1 || mode === 'edit') && (
            <div className={`flex items-center space-x-2 ${getBenefitColors(0).text} group/benefit-item relative`}>
              <IconEditableText
                mode={mode}
                value={benefit_icon_1 || 'CheckCircle'}
                onEdit={(value) => onUpdateBenefit('benefit_icon_1', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                iconSize="sm"
                className={`${getBenefitColors(0).text} text-lg`}
                sectionId={sectionId}
                elementKey="benefit_icon_1"
              />
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={benefit_1 || ''}
                  onEdit={(value) => onUpdateBenefit('benefit_1', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm font-medium"
                  placeholder="Benefit 1"
                  sectionBackground=""
                  data-section-id={sectionId}
                  data-element-key="benefit_1"
                />
              ) : (
                <span className="text-sm font-medium">{benefit_1}</span>
              )}
              {mode === 'edit' && benefit_1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBenefit('benefit_1', '');
                  }}
                  className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                  title="Remove benefit 1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {(benefit_2 || mode === 'edit') && (
            <div className={`flex items-center space-x-2 ${getBenefitColors(1).text} group/benefit-item relative`}>
              <IconEditableText
                mode={mode}
                value={benefit_icon_2 || 'Clock'}
                onEdit={(value) => onUpdateBenefit('benefit_icon_2', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                iconSize="sm"
                className={`${getBenefitColors(1).text} text-lg`}
                sectionId={sectionId}
                elementKey="benefit_icon_2"
              />
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={benefit_2 || ''}
                  onEdit={(value) => onUpdateBenefit('benefit_2', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm font-medium"
                  placeholder="Benefit 2"
                  sectionBackground=""
                  data-section-id={sectionId}
                  data-element-key="benefit_2"
                />
              ) : (
                <span className="text-sm font-medium">{benefit_2}</span>
              )}
              {mode === 'edit' && benefit_2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBenefit('benefit_2', '');
                  }}
                  className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                  title="Remove benefit 2"
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

      {/* Visual Side */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {feature.visual && feature.visual !== '' ? (
          <img
            src={feature.visual}
            alt={feature.title}
            className="absolute inset-0 w-full h-full object-cover object-center rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
            data-image-id={`${sectionId}.features.${feature.id}.visual`}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const imageId = `${sectionId}.features.${feature.id}.visual`;
                const position = {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                };
                handleImageToolbar(imageId, position);
              }
            }}
            onClick={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          />
        ) : (
          <VisualPlaceholder
            onClick={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const imageId = `${sectionId}.features.${feature.id}.visual`;
                const position = {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                };
                handleImageToolbar(imageId, position);
              }
            }}
          />
        )}
      </div>

      {/* Delete Button - only show in edit mode and when onRemove is provided */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
          title="Remove this feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
CarouselSlide.displayName = 'CarouselSlide';

export default function Carousel(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiBlockTheme
    });
  }, [sectionBackground, uiBlockTheme]);

  // Theme-based benefit colors
  const getBenefitColors = (index: number) => {
    const colorSets = {
      warm: [
        { text: 'text-orange-600', bg: 'bg-orange-50' },
        { text: 'text-red-600', bg: 'bg-red-50' }
      ],
      cool: [
        { text: 'text-blue-600', bg: 'bg-blue-50' },
        { text: 'text-cyan-600', bg: 'bg-cyan-50' }
      ],
      neutral: [
        { text: 'text-gray-600', bg: 'bg-gray-50' },
        { text: 'text-slate-600', bg: 'bg-slate-50' }
      ]
    };
    return colorSets[uiBlockTheme][index % 2];
  };

  // Get features array - ensure it's an array
  const features: FeatureItem[] = Array.isArray(blockContent.features)
    ? blockContent.features
    : [];

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (blockContent.auto_play && features.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % features.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [blockContent.auto_play, features.length]);

  const store = useEditStore();

  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  // Update a feature field
  const handleUpdateFeature = (featureId: string, field: keyof FeatureItem, value: string) => {
    const updatedFeatures = features.map(f =>
      f.id === featureId ? { ...f, [field]: value } : f
    );
    (handleContentUpdate as any)('features', updatedFeatures);
  };

  // Remove a feature
  const handleRemoveFeature = (featureId: string) => {
    const updatedFeatures = features.filter(f => f.id !== featureId);
    (handleContentUpdate as any)('features', updatedFeatures);
    // Adjust active slide if needed
    if (activeSlide >= updatedFeatures.length && activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  // Add a new feature
  const handleAddFeature = () => {
    const newFeature: FeatureItem = {
      id: `f${Date.now()}`,
      title: `Feature ${features.length + 1}`,
      description: 'Add feature description here',
      visual: '',
      tag: ''
    };
    (handleContentUpdate as any)('features', [...features, newFeature]);
  };

  // Update benefit fields
  const handleUpdateBenefit = (field: string, value: string) => {
    handleContentUpdate(field as keyof CarouselContent, value);
  };

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

          {(blockContent.subheadline || (mode as string) === 'edit') && (
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

        <div className="relative">
          {/* Main Carousel with WYSIWYG editing */}
          <div className={`${cardStyles.bg} ${cardStyles.blur} rounded-2xl ${cardStyles.shadow} p-8 ${cardStyles.border}`}>
            {features.length > 0 && features[activeSlide] && (
              <CarouselSlide
                feature={features[activeSlide]}
                sectionId={sectionId}
                mode={mode}
                onUpdateFeature={handleUpdateFeature}
                colorTokens={colorTokens}
                handleImageToolbar={handleImageToolbar}
                h2Style={h2Style}
                bodyLgStyle={bodyLgStyle}
                getBenefitColors={getBenefitColors}
                benefit_1={blockContent.benefit_1}
                benefit_2={blockContent.benefit_2}
                benefit_icon_1={blockContent.benefit_icon_1}
                benefit_icon_2={blockContent.benefit_icon_2}
                onUpdateBenefit={handleUpdateBenefit}
                onRemove={features.length > 1 ? () => handleRemoveFeature(features[activeSlide].id) : undefined}
              />
            )}
          </div>

          {/* Navigation Controls - only show if there are multiple features */}
          {features.length > 1 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevSlide}
                className={`p-3 rounded-full ${colorTokens.surfaceElevated} border border-gray-200 hover:shadow-md transition-all duration-200`}
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
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Feature List Preview */}
          {features.length > 1 && (
            <div className={`mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 ${
              features.length <= 3 ? 'lg:grid-cols-3' :
              features.length === 4 ? 'lg:grid-cols-4' :
              features.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6'
            }`}>
              {features.map((feature, index) => (
                <button
                  key={feature.id}
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
          )}

          {/* Add Feature Button - only in edit mode */}
          {mode === 'edit' && features.length < 6 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleAddFeature}
                className="px-6 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 transition-all duration-300 flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-2xl"
                title="Add new feature"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Feature</span>
              </button>
            </div>
          )}
        </div>

        {(blockContent.supporting_text || (mode as string) === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.supporting_text || ''}
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-3xl mx-auto"
              placeholder="Add optional supporting text to reinforce your creative features..."
              sectionId={sectionId}
              elementKey="supporting_text"
              sectionBackground={sectionBackground}
            />
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
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'auto_play', label: 'Auto-play Carousel', type: 'boolean', required: false },
    { key: 'benefit_1', label: 'Benefit Badge 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit Badge 2', type: 'text', required: false },
    { key: 'features', label: 'Features (array)', type: 'collection', required: true }
  ],

  features: [
    'WYSIWYG inline text editing in carousel slides',
    'Click-to-edit image replacement with proper toolbar integration',
    'Inline editable feature tags',
    'Deletable carousel features with hover-to-reveal remove buttons',
    'Add new features up to 6 maximum',
    'Interactive carousel navigation in edit mode',
    'Auto-play functionality option',
    'Feature preview grid',
    'Clean array-based data structure',
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
