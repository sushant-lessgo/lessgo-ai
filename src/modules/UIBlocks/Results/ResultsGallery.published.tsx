/**
 * ResultsGallery - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// V2: Gallery item structure
interface GalleryItem {
  id: string;
  image_url: string;
  caption?: string;
}

export default function ResultsGalleryPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // V2: Extract content - direct array access
  const headline = props.headline || 'See What You Can Create';
  const subheadline = props.subheadline || '';
  const rawGalleryItems = (props.gallery_items || []) as GalleryItem[];

  // Filter to only show items with actual images (remove empty placeholders)
  const galleryItems = rawGalleryItems.filter(item =>
    item.image_url && item.image_url.trim() !== ''
  );

  // Don't render if no images
  if (galleryItems.length === 0) return null;

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Text colors - using colorTokens, no hard-coded hex
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Theme colors for shadows/borders
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        shadow: 'rgba(251, 146, 60, 0.15)',
        border: '#fed7aa'
      },
      cool: {
        shadow: 'rgba(96, 165, 250, 0.15)',
        border: '#bfdbfe'
      },
      neutral: {
        shadow: 'rgba(0, 0, 0, 0.1)',
        border: '#e5e7eb'
      }
    }[theme];
  };

  const colors = getThemeColors(uiTheme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            className="mb-4"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              className="max-w-3xl mx-auto"
              style={{
                color: textColors.body,
                ...bodyTypography
              }}
            />
          )}
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {galleryItems.map((item, idx) => (
            <div key={item.id} className="space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.caption || `Result ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover object-center rounded-lg"
                  style={{
                    boxShadow: `0 10px 30px ${colors.shadow}`,
                    border: `1px solid ${colors.border}`
                  }}
                />
              </div>
              {item.caption && (
                <p
                  className="text-center text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {item.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
