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
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import IconEditableText from '@/components/ui/IconEditableText';
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
  // Benefit badge fields
  benefit_1?: string;
  benefit_2?: string;
  // Benefit icons
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  // Individual feature fields for WYSIWYG editing
  feature_title_0?: string;
  feature_title_1?: string;
  feature_title_2?: string;
  feature_title_3?: string;
  feature_title_4?: string;
  feature_title_5?: string;
  feature_description_0?: string;
  feature_description_1?: string;
  feature_description_2?: string;
  feature_description_3?: string;
  feature_description_4?: string;
  feature_description_5?: string;
  feature_visual_0?: string;
  feature_visual_1?: string;
  feature_visual_2?: string;
  feature_visual_3?: string;
  feature_visual_4?: string;
  feature_visual_5?: string;
  feature_tag_0?: string;
  feature_tag_1?: string;
  feature_tag_2?: string;
  feature_tag_3?: string;
  feature_tag_4?: string;
  feature_tag_5?: string;
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
  },
  // Benefit badge schema
  benefit_1: { 
    type: 'string' as const, 
    default: 'Easy to use' 
  },
  benefit_2: { 
    type: 'string' as const, 
    default: 'Instant results' 
  },
  // Benefit icon schema
  benefit_icon_1: { 
    type: 'string' as const, 
    default: '✅' 
  },
  benefit_icon_2: { 
    type: 'string' as const, 
    default: '⏱️' 
  },
  // Individual feature fields for WYSIWYG editing
  feature_title_0: { type: 'string' as const, default: '' },
  feature_title_1: { type: 'string' as const, default: '' },
  feature_title_2: { type: 'string' as const, default: '' },
  feature_title_3: { type: 'string' as const, default: '' },
  feature_title_4: { type: 'string' as const, default: '' },
  feature_title_5: { type: 'string' as const, default: '' },
  feature_description_0: { type: 'string' as const, default: '' },
  feature_description_1: { type: 'string' as const, default: '' },
  feature_description_2: { type: 'string' as const, default: '' },
  feature_description_3: { type: 'string' as const, default: '' },
  feature_description_4: { type: 'string' as const, default: '' },
  feature_description_5: { type: 'string' as const, default: '' },
  feature_visual_0: { type: 'string' as const, default: '' },
  feature_visual_1: { type: 'string' as const, default: '' },
  feature_visual_2: { type: 'string' as const, default: '' },
  feature_visual_3: { type: 'string' as const, default: '' },
  feature_visual_4: { type: 'string' as const, default: '' },
  feature_visual_5: { type: 'string' as const, default: '' },
  feature_tag_0: { type: 'string' as const, default: '' },
  feature_tag_1: { type: 'string' as const, default: '' },
  feature_tag_2: { type: 'string' as const, default: '' },
  feature_tag_3: { type: 'string' as const, default: '' },
  feature_tag_4: { type: 'string' as const, default: '' },
  feature_tag_5: { type: 'string' as const, default: '' }
};

const CarouselSlide = React.memo(({ 
  title, 
  description, 
  visual,
  tag,
  index,
  sectionId,
  mode,
  handleContentUpdate,
  blockContent,
  colorTokens,
  handleImageToolbar,
  h2Style,
  bodyLgStyle,
  onRemove
}: {
  title: string;
  description: string;
  visual?: string;
  tag?: string;
  index: number;
  sectionId: string;
  mode: 'edit' | 'preview';
  handleContentUpdate: (key: keyof CarouselContent, value: any) => void;
  blockContent: CarouselContent;
  colorTokens: any;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  h2Style: any;
  bodyLgStyle: any;
  onRemove?: () => void;
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
            {title || 'Feature'} Visual
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
        {(tag || mode === 'edit') && (
          <div className="relative group/feature-tag">
            {tag ? (
              <>
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const fieldName = `feature_tag_${index}` as keyof CarouselContent;
                      handleContentUpdate(fieldName, e.currentTarget.textContent || '');
                    }}
                    className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${colorTokens.ctaBg} text-white outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 cursor-text hover:opacity-80 transition-opacity min-w-[80px] text-center`}
                    data-placeholder="Feature tag"
                  >
                    {tag}
                  </div>
                ) : (
                  <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${colorTokens.ctaBg} text-white`}>
                    {tag}
                  </span>
                )}
                
                {/* Remove button for edit mode */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const fieldName = `feature_tag_${index}` as keyof CarouselContent;
                      handleContentUpdate(fieldName, '');
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
                  const fieldName = `feature_tag_${index}` as keyof CarouselContent;
                  handleContentUpdate(fieldName, 'New Tag');
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
              const fieldName = `feature_title_${index}` as keyof CarouselContent;
              handleContentUpdate(fieldName, e.currentTarget.textContent || '');
            }}
            className="text-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]"
            data-placeholder="Feature title"
          >
            {title}
          </div>
        ) : (
          <h3 style={h2Style} className="font-bold text-gray-900">
            {title}
          </h3>
        )}
        
        {/* Editable Feature Description */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const fieldName = `feature_description_${index}` as keyof CarouselContent;
              handleContentUpdate(fieldName, e.currentTarget.textContent || '');
            }}
            className="text-gray-600 leading-relaxed outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]"
            data-placeholder="Feature description"
          >
            {description}
          </div>
        ) : (
          <p style={bodyLgStyle} className="text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
        
        <div className="flex items-center space-x-4">
          {((blockContent.benefit_1 && blockContent.benefit_1 !== '___REMOVED___') || mode === 'edit') && (
            <div className="flex items-center space-x-2 text-green-600 group/benefit-item relative">
              <IconEditableText
                mode={mode}
                value={blockContent.benefit_icon_1 || '✅'}
                onEdit={(value) => handleContentUpdate('benefit_icon_1', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                iconSize="sm"
                className="text-green-600 text-lg"
                sectionId={sectionId}
                elementKey="benefit_icon_1"
              />
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.benefit_1 || ''}
                  onEdit={(value) => handleContentUpdate('benefit_1', value)}
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
                <span className="text-sm font-medium">{blockContent.benefit_1}</span>
              )}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate('benefit_1', '___REMOVED___');
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
          {(blockContent.benefit_2 || mode === 'edit') && blockContent.benefit_2 !== '___REMOVED___' && (
            <div className="flex items-center space-x-2 text-blue-600 group/benefit-item relative">
              <IconEditableText
                mode={mode}
                value={blockContent.benefit_icon_2 || '⏱️'}
                onEdit={(value) => handleContentUpdate('benefit_icon_2', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                iconSize="sm"
                className="text-blue-600 text-lg"
                sectionId={sectionId}
                elementKey="benefit_icon_2"
              />
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.benefit_2 || ''}
                  onEdit={(value) => handleContentUpdate('benefit_2', value)}
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
                <span className="text-sm font-medium">{blockContent.benefit_2}</span>
              )}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate('benefit_2', '___REMOVED___');
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
      <div className="relative">
        {visual && visual !== '' ? (
          <img
            src={visual}
            alt={title}
            className="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
            data-image-id={`${sectionId}.feature_visual_${index}`}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const imageId = `${sectionId}.feature_visual_${index}`;
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
                const imageId = `${sectionId}.feature_visual_${index}`;
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

  // Helper function to get individual feature field
  const getIndividualFeature = (field: 'title' | 'description' | 'visual' | 'tag', index: number): string => {
    const fieldName = `feature_${field}_${index}` as keyof CarouselContent;
    return (blockContent[fieldName] as string) || '';
  };

  // Migration logic: Convert pipe-separated fields to individual fields
  React.useEffect(() => {
    if (blockContent.feature_titles && !blockContent.feature_title_0) {
      const featureTitles = blockContent.feature_titles.split('|').map(item => item.trim());
      const featureDescriptions = blockContent.feature_descriptions 
        ? blockContent.feature_descriptions.split('|').map(item => item.trim())
        : [];
      const featureVisuals = blockContent.feature_visuals 
        ? blockContent.feature_visuals.split('|').map(item => item.trim())
        : [];
      const featureTags = blockContent.feature_tags 
        ? blockContent.feature_tags.split('|').map(item => item.trim())
        : [];
      
      const updates: Partial<CarouselContent> = {};
      
      featureTitles.forEach((title, index) => {
        if (index < 6) { // Max 6 features
          const titleField = `feature_title_${index}` as keyof CarouselContent;
          const descField = `feature_description_${index}` as keyof CarouselContent;
          const visualField = `feature_visual_${index}` as keyof CarouselContent;
          const tagField = `feature_tag_${index}` as keyof CarouselContent;
          
          updates[titleField] = title as any;
          updates[descField] = (featureDescriptions[index] || '') as any;
          updates[visualField] = (featureVisuals[index] || '') as any;
          updates[tagField] = (featureTags[index] || '') as any;
        }
      });
      
      // Apply all updates at once
      Object.entries(updates).forEach(([key, value]) => {
        handleContentUpdate(key as keyof CarouselContent, value);
      });
    }
  }, [blockContent.feature_titles, blockContent.feature_title_0, handleContentUpdate]);

  // Create features array from individual fields
  const features: Array<{
    title: string;
    description: string;
    visual: string;
    tag: string;
    originalIndex: number;
  }> = [];
  for (let i = 0; i < 6; i++) {
    const title = getIndividualFeature('title', i);
    const description = getIndividualFeature('description', i);
    const visual = getIndividualFeature('visual', i);
    const tag = getIndividualFeature('tag', i);
    
    // In edit mode: show empty features for editing, in preview mode: only show features with content
    if (mode === 'edit' || title.trim() !== '' || description.trim() !== '' || visual.trim() !== '') {
      features.push({
        title: title || (mode === 'edit' ? `Feature ${i + 1}` : ''),
        description,
        visual,
        tag,
        originalIndex: i
      });
    }
  }

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
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {features.length > 0 && features[activeSlide] && (
              <CarouselSlide
                title={features[activeSlide].title}
                description={features[activeSlide].description}
                visual={features[activeSlide].visual}
                tag={features[activeSlide].tag}
                index={features[activeSlide].originalIndex}
                sectionId={sectionId}
                mode={mode}
                handleContentUpdate={handleContentUpdate}
                blockContent={blockContent}
                colorTokens={colorTokens}
                handleImageToolbar={handleImageToolbar}
                h2Style={h2Style}
                bodyLgStyle={bodyLgStyle}
                onRemove={features.length > 1 ? () => {
                  const currentSlideIndex = features[activeSlide].originalIndex;
                  
                  // Clear individual fields for the deleted feature
                  const titleField = `feature_title_${currentSlideIndex}` as keyof CarouselContent;
                  const descField = `feature_description_${currentSlideIndex}` as keyof CarouselContent;
                  const visualField = `feature_visual_${currentSlideIndex}` as keyof CarouselContent;
                  const tagField = `feature_tag_${currentSlideIndex}` as keyof CarouselContent;
                  
                  // Clear the fields by setting them to empty strings
                  handleContentUpdate(titleField, '');
                  handleContentUpdate(descField, '');
                  handleContentUpdate(visualField, '');
                  handleContentUpdate(tagField, '');
                  
                  // Shift remaining features to fill the gap
                  for (let i = currentSlideIndex + 1; i < 6; i++) {
                    const nextTitleField = `feature_title_${i}` as keyof CarouselContent;
                    const nextDescField = `feature_description_${i}` as keyof CarouselContent;
                    const nextVisualField = `feature_visual_${i}` as keyof CarouselContent;
                    const nextTagField = `feature_tag_${i}` as keyof CarouselContent;
                    
                    const prevTitleField = `feature_title_${i - 1}` as keyof CarouselContent;
                    const prevDescField = `feature_description_${i - 1}` as keyof CarouselContent;
                    const prevVisualField = `feature_visual_${i - 1}` as keyof CarouselContent;
                    const prevTagField = `feature_tag_${i - 1}` as keyof CarouselContent;
                    
                    // Move data from current position to previous position
                    handleContentUpdate(prevTitleField, blockContent[nextTitleField] || '');
                    handleContentUpdate(prevDescField, blockContent[nextDescField] || '');
                    handleContentUpdate(prevVisualField, blockContent[nextVisualField] || '');
                    handleContentUpdate(prevTagField, blockContent[nextTagField] || '');
                  }
                  
                  // Clear the last position since we shifted everything down
                  const lastTitleField = `feature_title_5` as keyof CarouselContent;
                  const lastDescField = `feature_description_5` as keyof CarouselContent;
                  const lastVisualField = `feature_visual_5` as keyof CarouselContent;
                  const lastTagField = `feature_tag_5` as keyof CarouselContent;
                  
                  handleContentUpdate(lastTitleField, '');
                  handleContentUpdate(lastDescField, '');
                  handleContentUpdate(lastVisualField, '');
                  handleContentUpdate(lastTagField, '');
                  
                  // Adjust active slide if necessary
                  if (activeSlide >= features.length - 1 && activeSlide > 0) {
                    setActiveSlide(activeSlide - 1);
                  }
                } : undefined}
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
          )}

          {/* Add Feature Button - only in edit mode */}
          {mode === 'edit' && features.length < 6 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  const nextIndex = features.length;
                  const titleField = `feature_title_${nextIndex}` as keyof CarouselContent;
                  const descField = `feature_description_${nextIndex}` as keyof CarouselContent;
                  
                  handleContentUpdate(titleField, `Feature ${nextIndex + 1}`);
                  handleContentUpdate(descField, 'Add feature description here');
                }}
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

        {(blockContent.cta_text || blockContent.trust_items || (mode as string) === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || (mode as string) === 'edit') && (
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
    { key: 'feature_titles', label: 'Feature Titles (pipe separated - legacy)', type: 'textarea', required: false },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated - legacy)', type: 'textarea', required: false },
    { key: 'feature_visuals', label: 'Feature Visuals (pipe separated - legacy)', type: 'textarea', required: false },
    { key: 'feature_tags', label: 'Feature Tags/Badges (pipe separated - legacy)', type: 'text', required: false },
    { key: 'feature_title_0', label: 'Feature 1 Title', type: 'text', required: false },
    { key: 'feature_title_1', label: 'Feature 2 Title', type: 'text', required: false },
    { key: 'feature_title_2', label: 'Feature 3 Title', type: 'text', required: false },
    { key: 'feature_title_3', label: 'Feature 4 Title', type: 'text', required: false },
    { key: 'feature_title_4', label: 'Feature 5 Title', type: 'text', required: false },
    { key: 'feature_title_5', label: 'Feature 6 Title', type: 'text', required: false },
    { key: 'feature_visual_0', label: 'Feature 1 Visual', type: 'image', required: false },
    { key: 'feature_visual_1', label: 'Feature 2 Visual', type: 'image', required: false },
    { key: 'feature_visual_2', label: 'Feature 3 Visual', type: 'image', required: false },
    { key: 'feature_visual_3', label: 'Feature 4 Visual', type: 'image', required: false },
    { key: 'feature_visual_4', label: 'Feature 5 Visual', type: 'image', required: false },
    { key: 'feature_visual_5', label: 'Feature 6 Visual', type: 'image', required: false },
    { key: 'auto_play', label: 'Auto-play Carousel', type: 'boolean', required: false },
    { key: 'benefit_1', label: 'Benefit Badge 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit Badge 2', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'WYSIWYG inline text editing in carousel slides',
    'Click-to-edit image replacement with proper toolbar integration',
    'Inline editable feature tags (No-Code, Professional, etc.)',
    'Deletable carousel features with hover-to-reveal remove buttons',
    'Add new features up to 6 maximum with proper field management',
    'Interactive carousel navigation in edit mode',
    'Auto-play functionality option',
    'Feature preview grid',
    'Individual field storage for proper editing',
    'Hover-based remove controls for tags and entire features',
    'Smart field shifting when features are deleted',
    'Seamless image toolbar integration matching field names',
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