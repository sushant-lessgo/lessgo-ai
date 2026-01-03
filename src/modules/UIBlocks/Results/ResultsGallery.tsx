import React, { useRef, useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface ResultsGalleryContent {
  headline: string;
  subheadline?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  caption_1?: string;
  caption_2?: string;
  caption_3?: string;
  caption_4?: string;
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'See What You Can Create'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  image_1: {
    type: 'string' as const,
    default: ''
  },
  image_2: {
    type: 'string' as const,
    default: ''
  },
  image_3: {
    type: 'string' as const,
    default: ''
  },
  image_4: {
    type: 'string' as const,
    default: ''
  },
  caption_1: {
    type: 'string' as const,
    default: ''
  },
  caption_2: {
    type: 'string' as const,
    default: ''
  },
  caption_3: {
    type: 'string' as const,
    default: ''
  },
  caption_4: {
    type: 'string' as const,
    default: ''
  },
};

export default function ResultsGallery(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    handleContentUpdate,
    sectionBackground,
    backgroundType
  } = useLayoutComponent<ResultsGalleryContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Store for image upload
  const store = useEditStore();

  // Upload state management
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Refs for file inputs
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const fileInputRef4 = useRef<HTMLInputElement>(null);

  // Safe background type (filter out 'custom')
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-aware color functions
  const getPlaceholderColors = (theme: UIBlockTheme) => {
    return {
      warm: 'from-orange-50 to-red-100',
      cool: 'from-blue-50 to-purple-100',
      neutral: 'from-gray-50 to-slate-100'
    }[theme];
  };

  const getIconColors = (theme: UIBlockTheme) => {
    return {
      warm: 'text-orange-400',
      cool: 'text-blue-400',
      neutral: 'text-gray-400'
    }[theme];
  };

  const getShadowColors = (theme: UIBlockTheme) => {
    return {
      warm: 'shadow-lg hover:shadow-xl hover:shadow-orange-200/40',
      cool: 'shadow-lg hover:shadow-xl hover:shadow-blue-200/40',
      neutral: 'shadow-lg hover:shadow-xl'
    }[theme];
  };

  const placeholderGradient = getPlaceholderColors(theme);
  const iconColor = getIconColors(theme);
  const imageShadow = getShadowColors(theme);

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageKey: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadErrors(prev => ({ ...prev, [imageKey]: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [imageKey]: 'Image must be smaller than 5MB' }));
      return;
    }

    // Clear previous error
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[imageKey];
      return newErrors;
    });

    // Set uploading state
    setUploadingImages(prev => ({ ...prev, [imageKey]: true }));

    try {
      // Upload to server and update content
      await store.uploadImage(file, {
        sectionId,
        elementKey: imageKey
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setUploadErrors(prev => ({ ...prev, [imageKey]: errorMessage }));
    } finally {
      setUploadingImages(prev => {
        const newState = { ...prev };
        delete newState[imageKey];
        return newState;
      });
    }

    // Reset file input
    event.target.value = '';
  };

  // Image placeholder component
  const ImagePlaceholder = ({ onClick }: { onClick?: () => void }) => (
    <div
      className={`relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-br ${placeholderGradient} cursor-pointer hover:opacity-90 transition-all`}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <svg
            className={`w-12 h-12 ${iconColor} mx-auto mb-2`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="text-sm font-medium text-gray-600">Click to add image</div>
        </div>
      </div>
    </div>
  );

  // Render individual image slot
  const renderImageSlot = (
    imageKey: 'image_1' | 'image_2' | 'image_3' | 'image_4',
    captionKey: 'caption_1' | 'caption_2' | 'caption_3' | 'caption_4',
    fileInputRef: React.RefObject<HTMLInputElement>,
    index: number
  ) => {
    const imageUrl = blockContent[imageKey];
    const caption = blockContent[captionKey] || '';
    const isUploading = uploadingImages[imageKey];
    const uploadError = uploadErrors[imageKey];

    return (
      <div className="space-y-3 relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, imageKey)}
          disabled={isUploading}
        />

        {/* Image or placeholder */}
        <div className="relative">
          {imageUrl ? (
            <div
              className="relative group cursor-pointer"
              onClick={() => mode === 'edit' && !isUploading && fileInputRef.current?.click()}
            >
              <img
                src={imageUrl}
                alt={caption || `Result ${index}`}
                className={`w-full h-auto object-contain rounded-lg ${imageShadow}`}
                data-section-id={sectionId}
                data-element-key={imageKey}
              />
              {mode === 'edit' && !isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded">
                    Click to change
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'edit' ? (
            <ImagePlaceholder onClick={() => !isUploading && fileInputRef.current?.click()} />
          ) : null}

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm font-medium text-gray-700">Uploading...</div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {uploadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {uploadError}
          </div>
        )}

        {/* Caption */}
        {(caption || mode === 'edit') && (
          <div className="text-center">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleContentUpdate(captionKey, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 min-h-[28px] cursor-text hover:bg-gray-50/50 text-sm"
                style={{
                  color: colorTokens.textSecondary,
                  fontWeight: 500
                }}
                data-section-id={sectionId}
                data-element-key={captionKey}
              >
                {caption || 'Add caption...'}
              </div>
            ) : (
              <p
                className="text-sm font-medium"
                style={{ color: colorTokens.textSecondary }}
              >
                {caption}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ResultsGallery"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header section */}
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
              className="max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your results gallery..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderImageSlot('image_1', 'caption_1', fileInputRef1, 1)}
          {renderImageSlot('image_2', 'caption_2', fileInputRef2, 2)}
          {renderImageSlot('image_3', 'caption_3', fileInputRef3, 3)}
          {renderImageSlot('image_4', 'caption_4', fileInputRef4, 4)}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ResultsGallery',
  category: 'Results',
  description: 'Results section with 2x2 grid of uploadable images, ideal for showcasing visual results from image generation tools',
  tags: ['results', 'images', 'gallery', 'showcase', 'grid', 'image-tool'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'image_1', label: 'Image 1', type: 'image', required: false },
    { key: 'image_2', label: 'Image 2', type: 'image', required: false },
    { key: 'image_3', label: 'Image 3', type: 'image', required: false },
    { key: 'image_4', label: 'Image 4', type: 'image', required: false },
    { key: 'caption_1', label: 'Caption 1', type: 'text', required: false },
    { key: 'caption_2', label: 'Caption 2', type: 'text', required: false },
    { key: 'caption_3', label: 'Caption 3', type: 'text', required: false },
    { key: 'caption_4', label: 'Caption 4', type: 'text', required: false }
  ],

  features: [
    'Headline and subheadline support',
    'Four image upload areas with placeholders',
    'Optional image captions with inline editing',
    'Responsive 2x2 grid layout (1 column mobile, 2 columns desktop)',
    'Edit and preview modes',
    'Image upload validation (type and size)',
    'Smooth hover effects and transitions',
    'Perfect for showcasing AI-generated images'
  ],

  useCases: [
    'Image generation tool results',
    'AI art showcases',
    'Photo editing before/after comparisons',
    'Design tool output examples',
    'Creative tool capabilities demonstrations',
    'Portfolio or gallery sections'
  ]
};
