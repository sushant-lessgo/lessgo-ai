/**
 * MediaMentions - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { LogoPublished } from '@/components/published/LogoPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function MediaMentionsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Featured in Leading Publications';
  const subheadline = props.subheadline || '';
  const media_outlets = props.media_outlets || '';
  const testimonial_quotes = props.testimonial_quotes || '';
  const logo_urls = props.logo_urls || '{}';

  // Parse data (inline functions, no hooks)
  const parseOutlets = (outlets: string): string[] => {
    return outlets.split('|').map((n: string) => n.trim()).filter((n: string) => n && n !== '___REMOVED___');
  };

  const parseQuotes = (quotes: string): string[] => {
    return quotes.split('|').map((q: string) => q.trim()).filter((q: string) => q && q !== '___REMOVED___');
  };

  const parseLogoUrls = (urlsJson: string): Record<string, string> => {
    try {
      return JSON.parse(urlsJson || '{}');
    } catch {
      return {};
    }
  };

  const outlets = parseOutlets(media_outlets).slice(0, 12); // max 12
  const quotes = parseQuotes(testimonial_quotes).slice(0, 3); // max 3
  const logoUrlsMap = parseLogoUrls(logo_urls);

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based colors for cards, borders, and icons
  const getMediaMentionsColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',
        quoteIconColor: '#ea580c'
      },
      cool: {
        cardBorder: '#bfdbfe',
        quoteIconColor: '#2563eb'
      },
      neutral: {
        cardBorder: '#e5e7eb',
        quoteIconColor: '#6b7280'
      }
    }[theme];
  };

  const colors = getMediaMentionsColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Media Outlet Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
          {outlets.map((outletName: string, index: number) => (
            <div
              key={`outlet-${index}`}
              className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
              style={{ borderColor: colors.cardBorder }}
            >
              <LogoPublished
                logoUrl={logoUrlsMap[outletName] || ''}
                companyName={outletName}
                size="md"
              />
              <span
                style={{
                  color: textColors.body,
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              >
                {outletName}
              </span>
            </div>
          ))}
        </div>

        {/* Testimonial Quotes */}
        {quotes.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8">
            {quotes.map((quote: string, index: number) => (
              <div
                key={`quote-${index}`}
                className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                style={{ borderColor: colors.cardBorder }}
              >
                {/* Quote Icon (SVG inline) */}
                <div className="mb-4">
                  <svg
                    className="w-8 h-8 mx-auto opacity-60"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                    style={{ color: colors.quoteIconColor }}
                  >
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/>
                  </svg>
                </div>

                <TextPublished
                  value={quote}
                  style={{
                    color: textColors.body,
                    ...bodyTypography,
                    lineHeight: '1.75'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
