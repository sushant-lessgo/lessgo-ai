// ResultsGallery.tsx - V2: Clean array-based gallery items
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Gallery item structure
interface GalleryItem {
  id: string;
  image_url: string;
  caption?: string;
}

// V2: Content interface - uses clean arrays
interface ResultsGalleryContent {
  headline: string;
  subheadline?: string;
  gallery_items: GalleryItem[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'See What You Can Create'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  gallery_items: {
    type: 'array' as const,
    default: [
      { id: 'g1', image_url: '', caption: '' },
      { id: 'g2', image_url: '', caption: '' },
      { id: 'g3', image_url: '', caption: '' },
      { id: 'g4', image_url: '', caption: '' },
    ]
  }
};

// Gallery Item Component
const GalleryItemCard = React.memo(({
  item,
  index,
  sectionId,
  mode,
  colorTokens,
  onCaptionEdit,
  onRemove,
  handleImageToolbar,
  theme,
  canRemove
}: {
  item: GalleryItem;
  index: number;
  sectionId: string;
  mode: string;
  colorTokens: any;
  onCaptionEdit: (value: string) => void;
  onRemove?: () => void;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  theme: UIBlockTheme;
  canRemove: boolean;
}) => {
  // Theme-based styles
  const getPlaceholderGradient = () => {
    const gradients = {
      warm: 'from-orange-50 to-red-100',
      cool: 'from-blue-50 to-indigo-100',
      neutral: 'from-gray-50 to-slate-100'
    };
    return gradients[theme];
  };

  const getIconColor = () => {
    const colors = {
      warm: 'text-orange-400',
      cool: 'text-blue-400',
      neutral: 'text-gray-400'
    };
    return colors[theme];
  };

  const getShadowStyle = () => {
    const shadows = {
      warm: 'shadow-lg hover:shadow-xl hover:shadow-orange-200/40',
      cool: 'shadow-lg hover:shadow-xl hover:shadow-blue-200/40',
      neutral: 'shadow-lg hover:shadow-xl'
    };
    return shadows[theme];
  };

  // V2: Image ID format with item.id
  const imageId = `${sectionId}.gallery_items.${item.id}.image_url`;

  // Image placeholder component
  const ImagePlaceholder = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <div
      className={`relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-br ${getPlaceholderGradient()} cursor-pointer hover:opacity-90 transition-all`}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <svg
            className={`w-12 h-12 ${getIconColor()} mx-auto mb-2`}
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

  return (
    <div className="space-y-3 relative group">
      {/* Image or placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image_url && item.image_url !== '' ? (
          <img
            src={item.image_url}
            alt={item.caption || `Result ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center rounded-lg ${getShadowStyle()} cursor-pointer transition-all duration-300`}
            data-image-id={imageId}
            onMouseUp={(e) => {
              if (mode === 'edit') {
                e.stopPropagation();
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
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
        ) : mode === 'edit' ? (
          <ImagePlaceholder
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const position = {
                x: rect.left + rect.width / 2,
                y: rect.top - 10
              };
              handleImageToolbar(imageId, position);
            }}
          />
        ) : null}
      </div>

      {/* Caption */}
      {(item.caption || mode === 'edit') && (
        <div className="text-center">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCaptionEdit(e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 min-h-[28px] cursor-text hover:bg-gray-50/50 text-sm"
              style={{
                color: colorTokens.textSecondary,
                fontWeight: 500
              }}
              data-section-id={sectionId}
              data-element-key={`gallery_items.${item.id}.caption`}
            >
              {item.caption || 'Add caption...'}
            </div>
          ) : (
            <p
              className="text-sm font-medium"
              style={{ color: colorTokens.textSecondary }}
            >
              {item.caption}
            </p>
          )}
        </div>
      )}

      {/* Remove button in edit mode */}
      {mode === 'edit' && canRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
          title="Remove this gallery item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
GalleryItemCard.displayName = 'GalleryItemCard';

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

  // Safe background type (filter out 'custom')
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // V2: Direct array access
  const galleryItems = blockContent.gallery_items || [];

  // V2: Handle caption editing - update array item
  const handleCaptionEdit = (id: string, value: string) => {
    const updatedItems = galleryItems.map(item =>
      item.id === id ? { ...item, caption: value } : item
    );
    (handleContentUpdate as any)('gallery_items', updatedItems);
  };

  // V2: Handle adding a new gallery item
  const handleAddItem = () => {
    if (galleryItems.length < 4) {
      const newItem: GalleryItem = {
        id: `g${Date.now()}`,
        image_url: '',
        caption: ''
      };
      (handleContentUpdate as any)('gallery_items', [...galleryItems, newItem]);
    }
  };

  // V2: Handle removing a gallery item
  const handleRemoveItem = (id: string) => {
    if (galleryItems.length > 2) {
      const updatedItems = galleryItems.filter(item => item.id !== id);
      (handleContentUpdate as any)('gallery_items', updatedItems);
    }
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
          {galleryItems.map((item, idx) => (
            <GalleryItemCard
              key={item.id}
              item={item}
              index={idx}
              sectionId={sectionId}
              mode={mode}
              colorTokens={colorTokens}
              onCaptionEdit={(value) => handleCaptionEdit(item.id, value)}
              onRemove={() => handleRemoveItem(item.id)}
              handleImageToolbar={handleImageToolbar}
              theme={uiBlockTheme}
              canRemove={galleryItems.length > 2}
            />
          ))}
        </div>

        {/* Add Item Button - only in edit mode, under max limit */}
        {mode === 'edit' && galleryItems.length < 4 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleAddItem}
              className="px-6 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 transition-all duration-300 flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-2xl"
              title="Add new gallery item"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add Gallery Item</span>
            </button>
          </div>
        )}
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
    { key: 'gallery_items', label: 'Gallery Items (array)', type: 'array', required: true }
  ],

  features: [
    'Headline and subheadline support',
    'V2: Clean array-based gallery items',
    'Image toolbar integration for uploads',
    'Optional image captions with inline editing',
    'Add/remove gallery items in edit mode (2-4 items)',
    'Responsive 2x2 grid layout (1 column mobile, 2 columns desktop)',
    'Theme-aware styling (warm/cool/neutral)',
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
