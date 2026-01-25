import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';

interface MinimalistContent {
  headline: string;
  subheadline: string;
  minimalist_hero_image: string;
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Your Vision, Realized'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Experience clarity in simplicity'
  },
  minimalist_hero_image: {
    type: 'string' as const,
    default: '/Dusseldorf-event.avif'
  }
};

// Published-safe component for server-side rendering
function MinimalistPublished(props: LayoutComponentProps) {
  const { sectionId, mode, theme, sectionBackgroundCSS, backgroundType } = props;

  // Extract content directly from props (no hooks)
  const blockContent = {
    headline: props.headline || 'Your Vision, Realized',
    subheadline: props.subheadline || 'Experience clarity in simplicity',
    minimalist_hero_image: props.minimalist_hero_image || '/Dusseldorf-event.avif'
  };

  // Image validation - static (no event handlers)
  const imageValue = blockContent.minimalist_hero_image || '';
  const isValidImagePath =
    imageValue.startsWith('/') ||
    imageValue.startsWith('http://') ||
    imageValue.startsWith('https://') ||
    imageValue.startsWith('blob:') ||
    imageValue.startsWith('data:') ||
    imageValue === '';
  const imageSrc = isValidImagePath && imageValue !== ''
    ? imageValue
    : '/Dusseldorf-event.avif';

  // Fixed white text (minimalist has dark overlay)
  const textColor = '#FFFFFF';

  // Typography styles from theme
  const headlineTypography = getPublishedTypographyStyles('h1', theme);
  const subheadlineTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <section
      style={{ background: sectionBackgroundCSS || 'transparent' }}
      className="!py-0 !px-0 relative overflow-hidden min-h-screen"
    >
      <div className="relative min-h-screen flex flex-col justify-between">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 w-full h-full"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Mist effect */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 42%, transparent 55%)"
            }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-black/70" />
        </div>

        {/* Headline at Top */}
        <div className="relative z-30 p-6 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto pt-10">
            <HeadlinePublished
              value={blockContent.headline}
              level="h1"
              className="text-center leading-[1.1]"
              style={{
                textAlign: 'center',
                color: textColor,
                ...headlineTypography
              }}
            />
          </div>
        </div>

        {/* Subheadline at Bottom */}
        <div className="relative z-30 pb-20">
          <div className="max-w-[50rem] mx-auto pb-20">
            <TextPublished
              value={blockContent.subheadline}
              element="p"
              className="text-justify text-2xl md:text-4xl"
              style={{
                textAlign: 'center',
                color: textColor,
                ...subheadlineTypography
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Minimalist(props: LayoutComponentProps) {
  // PUBLISHED MODE: Use published-safe component
  if (props.mode === 'published') {
    return <MinimalistPublished {...props} />;
  }

  const { getTextStyle: getTypographyStyle } = useTypography();
  const { content } = useEditStore();

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
  } = useLayoutComponent<MinimalistContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const handleImageToolbar = useImageToolbar();

  // Image validation
  const imageValue = blockContent.minimalist_hero_image || '';
  const isValidImagePath =
    imageValue.startsWith('/') ||
    imageValue.startsWith('http://') ||
    imageValue.startsWith('https://') ||
    imageValue.startsWith('blob:') ||
    imageValue.startsWith('data:') ||
    imageValue === '';
  const imageSrc = isValidImagePath && imageValue !== ''
    ? imageValue
    : '/Dusseldorf-event.avif';

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Minimalist"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground="transparent"
      mode={mode}
      noPadding={true}
      className={`!py-0 !px-0 relative overflow-hidden ${props.className || ''}`}
    >
      <div className="relative min-h-screen flex flex-col justify-between">



        {/* Background Image with Overlay */}
        <div
          className={`absolute inset-0 z-0 w-full h-full cursor-pointer ${mode !== 'preview' ? 'hover:ring-2 hover:ring-blue-400' : ''} transition-all`}
          onMouseUp={(e) => {
            if (mode !== 'preview') {
              e.stopPropagation();
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              handleImageToolbar(`${sectionId}-minimalist-hero-image`, {
                x: rect.left + rect.width / 2,
                y: rect.top - 10
              });
            }
          }}
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Optional polish: top light source bloom */}

{/* Optional polish: subtle stage mist */}
<div
  className="absolute inset-0 z-20 pointer-events-none"
  style={{
    background:
      "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 42%, transparent 55%)"
  }}
/>

          {/* Dark gradient overlay for text readability */}
           <div className="absolute inset-0 z-10 pointer-events-none bg-black/70" />
        </div>
        




        {/* Headline at Top */}
        <div className="relative z-30 p-6 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto pt-10">




            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h1"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              className="text-white text-center leading-[1.1]"
              textStyle={{
                textAlign: 'center',
                color: '#FFFFFF'
              }}
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {/* Subheadline at Bottom */}
        <div className="relative z-30 pb-20">
          <div className="max-w-[50rem] mx-auto pb-20">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-white text-justify text-2xl md:text-4xl"
              textStyle={{
                textAlign: 'center',
                color: '#FFFFFF'
              }}
              placeholder="Add your subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'Minimalist',
  category: 'Hero Sections',
  description: 'Minimalist full-background hero with headline at top and subheadline at bottom. Perfect for brand-focused, visual-first experiences with minimal distraction.',
  tags: ['hero', 'minimalist', 'image-background', 'full-screen', 'brand-focused'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '5 minutes',

  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Minimalist hero maintains visual purity with only headline and subheadline",
    alternativeSuggestions: [
      "Edit headline for primary message",
      "Edit subheadline for supporting copy",
      "Change background image for visual impact",
      "Switch to a different hero variant for CTAs or social proof"
    ]
  },

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'text', required: true },
    { key: 'minimalist_hero_image', label: 'Background Image', type: 'image', required: true }
  ],

  features: [
    'Full-screen background image with dark overlay',
    'Headline positioned at top for immediate impact',
    'Subheadline at bottom for balanced composition',
    'Minimalist design with zero distractions',
    'High-contrast white text on dark overlay',
    'Responsive padding and typography',
    'Click-to-edit background image',
    'Hover indicator in edit mode'
  ],

  useCases: [
    'Brand-focused landing pages emphasizing visual identity',
    'Portfolio or creative showcase pages',
    'Product launches with strong visual assets',
    'Luxury or premium positioning',
    'Awareness-building campaigns (unaware to problem-aware)',
    'Visual storytelling without call-to-action pressure'
  ]
};
