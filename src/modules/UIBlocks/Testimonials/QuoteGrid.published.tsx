/**
 * QuoteGrid - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * V2: Uses clean arrays instead of pipe-separated strings
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';

// V2: Testimonial structure - clean array item
interface Testimonial {
  id: string;
  quote: string;
  customer_name: string;
  customer_title?: string;
  customer_company?: string;
  rating_value?: string;
}

// Parse rating for star rendering
const parseRating = (rating: string | number | undefined): number => {
  if (rating === undefined || rating === null) return 5;
  if (typeof rating === 'number') return Math.min(5, Math.max(0, rating));
  const match = String(rating).match(/([\d.]+)/);
  return match ? Math.min(5, Math.max(0, parseFloat(match[1]))) : 5;
};

// Star Rating SVG Component
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? '#FBBF24' : '#D1D5DB'}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Render star rating
const renderStars = (rating: string | undefined) => {
  const ratingNum = parseRating(rating);
  const stars = [];

  for (let i = 0; i < 5; i++) {
    stars.push(<StarIcon key={i} filled={i < Math.floor(ratingNum)} />);
  }

  return <div className="flex items-center space-x-1">{stars}</div>;
};

export default function QuoteGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'What Our Customers Are Saying';
  const subheadline = props.subheadline || '';
  const verification_message = props.verification_message || '';

  // V2: Direct array access - no pipe parsing needed
  const testimonials: Testimonial[] = (() => {
    const raw = props.testimonials;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return raw;
  })();

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Theme colors for quote mark only
  const getQuoteColor = (theme: UIBlockTheme) => ({
    warm: '#fdba74',
    cool: '#93c5fd',
    neutral: '#d1d5db'
  })[theme];

  const quoteColor = getQuoteColor(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Dynamic card layout
  const layout = getDynamicCardLayout(testimonials.length);

  // Helper to render testimonial card
  const renderTestimonialCard = (testimonial: Testimonial, cardClass: string) => (
    <div
      key={testimonial.id}
      className={`rounded-xl transition-all duration-300 hover:-translate-y-1 relative ${cardClass}`}
      style={{
        backgroundColor: cardStyles.bg,
        backdropFilter: cardStyles.backdropFilter,
        WebkitBackdropFilter: cardStyles.backdropFilter,
        borderColor: cardStyles.borderColor,
        borderWidth: cardStyles.borderWidth,
        borderStyle: cardStyles.borderStyle,
        boxShadow: cardStyles.boxShadow
      }}
    >
      {/* Quote Mark */}
      <div
        className="absolute top-6 right-6 opacity-20 text-5xl font-serif"
        style={{ color: quoteColor }}
      >
        "
      </div>

      {/* Testimonial Quote */}
      <blockquote
        className="mb-6 leading-relaxed italic text-lg"
        style={{ color: cardStyles.textBody }}
      >
        "{testimonial.quote}"
      </blockquote>

      {/* Customer Attribution */}
      <div className="flex items-center space-x-4">
        {/* Customer Avatar */}
        <AvatarPublished
          name={testimonial.customer_name}
          size={48}
          theme={uiTheme}
        />

        {/* Customer Details */}
        <div className="flex-1">
          {/* Customer Name */}
          <div
            className="font-semibold mb-1"
            style={{ color: cardStyles.textHeading }}
          >
            {testimonial.customer_name}
          </div>

          {/* Customer Title */}
          {testimonial.customer_title && (
            <div
              className="text-sm mb-1"
              style={{ color: cardStyles.textMuted }}
            >
              {testimonial.customer_title}
            </div>
          )}

          {/* Customer Company */}
          {testimonial.customer_company && (
            <div
              className="text-sm font-medium"
              style={{ color: theme?.colors?.accentColor || '#3b82f6' }}
            >
              {testimonial.customer_company}
            </div>
          )}
        </div>
      </div>

      {/* Star Rating - only show number when < 5 */}
      <div className="mt-4 flex items-center space-x-2">
        {renderStars(testimonial.rating_value)}
        {parseRating(testimonial.rating_value) < 5 && (
          <span
            className="text-sm font-medium"
            style={{ color: textColors.body }}
          >
            {testimonial.rating_value}
          </span>
        )}
      </div>
    </div>
  );

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
              marginBottom: '1rem'
            }}
          />

          {/* Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '42rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Testimonials Grid */}
        {isSplitLayout(testimonials.length) && layout.splitLayout ? (
          <div className={layout.containerClass}>
            <div className={layout.splitLayout.firstRowGrid}>
              {testimonials.slice(0, layout.splitLayout.firstRowCount).map((testimonial: Testimonial) =>
                renderTestimonialCard(testimonial, layout.splitLayout!.firstRowCard)
              )}
            </div>
            <div className={layout.splitLayout.secondRowGrid}>
              {testimonials.slice(layout.splitLayout.firstRowCount).map((testimonial: Testimonial) =>
                renderTestimonialCard(testimonial, layout.splitLayout!.secondRowCard)
              )}
            </div>
          </div>
        ) : (
          <div className={layout.containerClass}>
            <div className={layout.gridClass}>
              {testimonials.map((testimonial: Testimonial) =>
                renderTestimonialCard(testimonial, layout.cardClass)
              )}
            </div>
          </div>
        )}

        {/* Trust Reinforcement - simple line */}
        {verification_message && (
          <div className="mt-12 text-center">
            <span
              className="text-sm"
              style={{ color: textColors.body }}
            >
              {verification_message}
            </span>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
