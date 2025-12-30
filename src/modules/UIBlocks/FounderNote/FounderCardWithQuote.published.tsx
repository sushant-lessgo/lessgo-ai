/**
 * FounderCardWithQuote - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

// Founder Avatar Component (server-safe, no hooks)
const FounderAvatar = ({ name }: { name: string }) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-lg"
      style={{
        background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)'
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '1.5rem'
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
};

export default function FounderCardWithQuotePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const founder_name = props.founder_name || 'Sarah Johnson';
  const founder_title = props.founder_title || 'CEO & Co-Founder';
  const founder_quote = props.founder_quote || 'We built this product because we experienced the same frustrations our customers face every day. Our mission is to eliminate the complexity and give you back your time to focus on what truly matters.';
  const founder_bio = props.founder_bio || '';

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Founder Card */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#f3f4f6'
          }}
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">

              {/* Founder Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <FounderAvatar name={founder_name} />
              </div>

              {/* Quote and Details */}
              <div className="flex-1 text-center md:text-left">
                {/* Quote */}
                <div className="mb-6">
                  <svg
                    className="w-8 h-8 mb-4 mx-auto md:mx-0"
                    style={{ color: '#3b82f6' }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>

                  <TextPublished
                    value={founder_quote}
                    style={{
                      ...bodyLgTypography,
                      lineHeight: '1.75rem',
                      fontStyle: 'italic',
                      marginBottom: '1.5rem',
                      color: textColors.body
                    }}
                  />
                </div>

                {/* Founder Info */}
                <div className="space-y-2">
                  <HeadlinePublished
                    value={founder_name}
                    level="h3"
                    style={{
                      ...h3Typography,
                      color: textColors.heading
                    }}
                  />

                  <TextPublished
                    value={founder_title}
                    style={{
                      fontWeight: 500,
                      color: textColors.muted
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Optional Founder Bio */}
            {founder_bio && (
              <div
                className="mt-8 pt-8 border-t"
                style={{
                  borderTopColor: '#e5e7eb'
                }}
              >
                <TextPublished
                  value={founder_bio}
                  style={{
                    lineHeight: '1.75rem',
                    color: textColors.body,
                    textAlign: 'center'
                  }}
                  className="md:text-left"
                />
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center space-x-4" style={{ opacity: 0.6 }}>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#60a5fa' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#c084fc' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#60a5fa' }}
          />
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
