/**
 * ResultsGallery - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function ResultsGalleryPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'See What You Can Create';
  const subheadline = props.subheadline || '';
  const image_1 = props.image_1 || '';
  const image_2 = props.image_2 || '';
  const image_3 = props.image_3 || '';
  const image_4 = props.image_4 || '';
  const caption_1 = props.caption_1 || '';
  const caption_2 = props.caption_2 || '';
  const caption_3 = props.caption_3 || '';
  const caption_4 = props.caption_4 || '';

  // Theme detection
  const uiTheme: UIBlockTheme =
    props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
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

  // Build images array
  const images = [
    { url: image_1, caption: caption_1 },
    { url: image_2, caption: caption_2 },
    { url: image_3, caption: caption_3 },
    { url: image_4, caption: caption_4 }
  ].filter(img => img.url && img.url !== '___REMOVED___' && img.url.trim() !== '');

  // Don't render if no images
  if (images.length === 0) return null;

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
          {images.map((img, idx) => (
            <div key={idx} className="space-y-3">
              <img
                src={img.url}
                alt={img.caption || `Result ${idx + 1}`}
                className="w-full h-auto object-contain rounded-lg"
                style={{
                  boxShadow: `0 10px 30px ${colors.shadow}`,
                  border: `1px solid ${colors.border}`
                }}
              />
              {img.caption && (
                <p
                  className="text-center text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
