/**
 * Minimalist Hero - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';

export default function MinimalistPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Your Vision, Realized';
  const subheadline = props.subheadline || 'Experience clarity in simplicity';
  const imageSrc = props.minimalist_hero_image || '/Dusseldorf-event.avif';

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('hero', theme);
  const subheadlineTypography = getPublishedTypographyStyles('body-lg', theme);

  const textColor = '#FFFFFF';

  return (
    <section
      style={{ background: sectionBackgroundCSS || 'transparent' }}
      className="!py-0 !px-0 relative overflow-hidden min-h-screen"
    >
      <div className="relative min-h-screen flex flex-col justify-between">
        {/* Background Image */}
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
              value={headline}
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
              value={subheadline}
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
