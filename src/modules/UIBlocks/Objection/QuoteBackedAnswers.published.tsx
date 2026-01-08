/**
 * QuoteBackedAnswers - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

// Quote structure
interface Quote {
  objection: string;
  quote: string;
  attribution: string;
}

// Parse quote data from props
const parseQuoteData = (props: any): Quote[] => {
  const quotes: Quote[] = [];

  // Process individual fields
  for (let i = 1; i <= 6; i++) {
    const objection = props[`objection_${i}`];
    const quote = props[`quote_response_${i}`];
    const attribution = props[`quote_attribution_${i}`];

    if (objection && objection.trim() && objection !== '___REMOVED___' && quote && quote.trim()) {
      quotes.push({
        objection: objection.trim(),
        quote: quote.trim(),
        attribution: attribution?.trim() || 'Anonymous Expert'
      });
    }
  }

  return quotes;
};

// Get theme colors (hex values for inline styles)
const getQuoteColors = (theme: 'warm' | 'cool' | 'neutral') => {
  return {
    warm: {
      quoteIconBg: '#f97316', // orange-500
      quoteBg: 'rgba(255, 255, 255, 0.8)',
      quoteBorder: '#fed7aa', // orange-200
      quoteTextColor: '#1f2937', // gray-800
      avatarGradient: 'linear-gradient(to bottom right, #fb923c, #ef4444)', // orange-400 to red-500
      avatarTextColor: '#ffffff',
      verificationBg: '#ffedd5', // orange-100
      verificationText: '#c2410c', // orange-700
      trustIconColor: '#f97316' // orange-500
    },
    cool: {
      quoteIconBg: '#3b82f6', // blue-500
      quoteBg: 'rgba(255, 255, 255, 0.8)',
      quoteBorder: '#bfdbfe', // blue-200
      quoteTextColor: '#1f2937', // gray-800
      avatarGradient: 'linear-gradient(to bottom right, #60a5fa, #6366f1)', // blue-400 to indigo-500
      avatarTextColor: '#ffffff',
      verificationBg: '#dbeafe', // blue-100
      verificationText: '#1d4ed8', // blue-700
      trustIconColor: '#3b82f6' // blue-500
    },
    neutral: {
      quoteIconBg: '#6b7280', // gray-500
      quoteBg: 'rgba(255, 255, 255, 0.8)',
      quoteBorder: '#e5e7eb', // gray-200
      quoteTextColor: '#1f2937', // gray-800
      avatarGradient: 'linear-gradient(to bottom right, #9ca3af, #6b7280)', // gray-400 to gray-500
      avatarTextColor: '#ffffff',
      verificationBg: '#f3f4f6', // gray-100
      verificationText: '#374151', // gray-700
      trustIconColor: '#6b7280' // gray-500
    }
  }[theme];
};

// Get author initials (first 2 letters)
const getAuthorInitials = (authorName: string): string => {
  return authorName
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export default function QuoteBackedAnswersPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'What Industry Experts Are Saying';
  const subheadline = props.subheadline || '';
  const quote_icon = props.quote_icon || '💬';
  const verification_icon = props.verification_icon || '✅';
  const verification_label = props.verification_label || 'Verified';
  const expert_label = props.expert_label || 'Industry Expert';
  const trust_icon_1 = props.trust_icon_1 || '🛡️';
  const trust_icon_2 = props.trust_icon_2 || '⭐';
  const trust_icon_3 = props.trust_icon_3 || '📊';
  const trust_indicator_1 = props.trust_indicator_1 || 'Verified Experts';
  const trust_indicator_2 = props.trust_indicator_2 || 'Industry Recognition';
  const trust_indicator_3 = props.trust_indicator_3 || 'Independent Reviews';

  // Parse quote data
  const quotes = parseQuoteData(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getQuoteColors(uiBlockTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

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
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Quotes Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {quotes.map((quoteItem: Quote, index: number) => (
            <div key={index} className="relative">
              {/* Quote Card */}
              <div
                style={{
                  background: colors.quoteBg,
                  border: `1px solid ${colors.quoteBorder}`,
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'box-shadow 0.3s ease',
                  height: '100%',
                  backdropFilter: 'blur(4px)',
                  position: 'relative'
                }}
              >
                {/* Quote Icon */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-1rem',
                    left: '2rem',
                    width: '2rem',
                    height: '2rem',
                    background: colors.quoteIconBg,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconPublished
                    icon={quote_icon}
                    size={16}
                    color="#ffffff"
                  />
                </div>

                {/* Quote Content */}
                <div style={{ paddingTop: '1.5rem' }}>
                  <TextPublished
                    value={quoteItem.quote}
                    style={{
                      color: colors.quoteTextColor,
                      ...bodyLgTypography,
                      fontStyle: 'italic',
                      lineHeight: '1.75',
                      marginBottom: '1.5rem'
                    }}
                  />

                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '3rem',
                        height: '3rem',
                        background: colors.avatarGradient,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.avatarTextColor,
                        fontWeight: 'bold',
                        marginRight: '1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {getAuthorInitials(quoteItem.attribution)}
                    </div>
                    <div>
                      <TextPublished
                        value={quoteItem.attribution}
                        style={{
                          ...bodyTypography,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}
                      />
                      <TextPublished
                        value={expert_label}
                        style={{
                          ...bodyTypography,
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: colors.verificationBg,
                    color: colors.verificationText,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <IconPublished
                    icon={verification_icon}
                    size={12}
                    color={colors.verificationText}
                  />
                  <span>{verification_label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        {(trust_indicator_1 || trust_indicator_2 || trust_indicator_3) && (
          <div className="mt-16 text-center">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2rem',
                flexWrap: 'wrap'
              }}
            >
              {trust_indicator_1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <IconPublished
                    icon={trust_icon_1}
                    size={20}
                    color={colors.trustIconColor}
                  />
                  <TextPublished
                    value={trust_indicator_1}
                    style={{
                      ...bodyTypography,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}
                  />
                </div>
              )}
              {trust_indicator_2 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <IconPublished
                    icon={trust_icon_2}
                    size={20}
                    color={colors.trustIconColor}
                  />
                  <TextPublished
                    value={trust_indicator_2}
                    style={{
                      ...bodyTypography,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}
                  />
                </div>
              )}
              {trust_indicator_3 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <IconPublished
                    icon={trust_icon_3}
                    size={20}
                    color={colors.trustIconColor}
                  />
                  <TextPublished
                    value={trust_indicator_3}
                    style={{
                      ...bodyTypography,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
