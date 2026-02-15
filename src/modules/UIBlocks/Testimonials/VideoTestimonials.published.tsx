/**
 * VideoTestimonials - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Types
interface VideoTestimonialItem {
  id: string;
  title: string;
  description: string;
  customer_name: string;
  customer_title: string;
  customer_company: string;
  video_url?: string;
  thumbnail?: string;
}

// Theme-based decorative accents (avatars, accent colors)
const getCardAccents = (theme: UIBlockTheme) => ({
  warm: {
    avatarGradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    accentColor: '#ea580c',
  },
  cool: {
    avatarGradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    accentColor: '#2563eb',
  },
  neutral: {
    avatarGradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    accentColor: '#374151',
  }
})[theme];

export default function VideoTestimonialsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'See What Our Customers Are Saying';
  const subheadline = props.subheadline || '';

  // V2 Arrays
  const testimonials: VideoTestimonialItem[] = props.video_testimonials || [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');
  const cardAccents = getCardAccents(uiTheme);

  // Get adaptive card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const h4Typography = getPublishedTypographyStyles('h4', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Grid columns based on count
  const getGridStyle = (count: number) => {
    if (count === 1) return '1fr';
    if (count === 2) return 'repeat(2, 1fr)';
    if (count === 3) return 'repeat(auto-fit, minmax(320px, 1fr))';
    return 'repeat(2, 1fr)';
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Video Testimonial Cards Grid */}
        {testimonials.length > 0 && (
          <div
            className="grid gap-8"
            style={{
              gridTemplateColumns: getGridStyle(testimonials.length)
            }}
          >
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: cardStyles.bg,
                  backdropFilter: cardStyles.backdropFilter,
                  boxShadow: cardStyles.boxShadow,
                  borderWidth: cardStyles.borderWidth,
                  borderStyle: cardStyles.borderStyle,
                  borderColor: cardStyles.borderColor
                }}
              >
                {/* Video Section */}
                <div className="aspect-video relative">
                  {item.video_url && item.video_url.includes('youtube') ? (
                    <iframe
                      src={item.video_url}
                      title={item.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      className="relative w-full h-full overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)' }}
                    >
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                          <svg
                            className="w-8 h-8 ml-1"
                            style={{ color: cardAccents.accentColor }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: cardAccents.avatarGradient }}
                    >
                      {item.customer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ color: cardStyles.textHeading }}>{item.customer_name}</div>
                      <div className="text-sm" style={{ color: cardStyles.textBody }}>{item.customer_title}</div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: cardAccents.accentColor }}
                      >
                        {item.customer_company}
                      </div>
                    </div>
                  </div>

                  <h3
                    style={{
                      ...h4Typography,
                      fontWeight: 700,
                      color: cardStyles.textHeading,
                      marginBottom: '0.75rem'
                    }}
                  >
                    {item.title}
                  </h3>

                  <TextPublished
                    value={item.description}
                    style={{
                      color: cardStyles.textMuted,
                      fontSize: '0.875rem',
                      lineHeight: '1.75',
                      marginBottom: '1rem'
                    }}
                  />

                  <div
                    className="pt-4 flex items-center justify-between"
                    style={{ borderTop: `1px solid ${cardStyles.borderColor}` }}
                  >
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs" style={{ color: cardStyles.textMuted }}>Verified customer</span>
                    </div>
                    <span className="text-xs" style={{ color: cardStyles.textMuted }}>3 min watch</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
