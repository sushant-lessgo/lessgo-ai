/**
 * LetterStyleBlock - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Theme color function (inline styles for SSR)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      avatarGradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)',
      letterBorder: '#fed7aa',
      headerBg: '#fff7ed',
      headerBorder: '#fed7aa',
      avatarBorder: '#fed7aa',
      psDivider: '#fed7aa'
    },
    cool: {
      avatarGradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
      letterBorder: '#bfdbfe',
      headerBg: '#eff6ff',
      headerBorder: '#bfdbfe',
      avatarBorder: '#bfdbfe',
      psDivider: '#bfdbfe'
    },
    neutral: {
      avatarGradient: 'linear-gradient(135deg, #9ca3af 0%, #64748b 50%, #6b7280 100%)',
      letterBorder: '#e5e7eb',
      headerBg: '#f9fafb',
      headerBorder: '#e5e7eb',
      avatarBorder: '#e5e7eb',
      psDivider: '#e5e7eb'
    }
  };
  return colorMap[theme];
};

// Founder Image Placeholder Component (server-safe)
const FounderImagePlaceholder = ({ theme }: { theme: UIBlockTheme }) => {
  const themeColors = getThemeColors(theme);

  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
      style={{ background: themeColors.avatarGradient }}
    >
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  );
};

export default function LetterStyleBlockPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const letter_header = props.letter_header || 'A Personal Note from Our Founder';
  const letter_greeting = props.letter_greeting || 'Dear Fellow Entrepreneur,';
  const letter_body = props.letter_body || 'Five years ago, I was exactly where you are now...';
  const letter_signature = props.letter_signature || 'Sarah Chen';
  const founder_title = props.founder_title || 'Founder & CEO';
  const company_name = props.company_name || 'YourCompany';
  const date_text = props.date_text || 'January 2024';
  const ps_text = props.ps_text || '';
  const founder_image = props.founder_image || '';
  const cta_text = props.cta_text || 'Try It Free Today';

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');
  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Letter Container */}
        <div
          className="shadow-2xl rounded-lg overflow-hidden border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: themeColors.letterBorder
          }}
        >

          {/* Letter Header */}
          <div
            className="px-8 py-6 border-b"
            style={{
              backgroundColor: themeColors.headerBg,
              borderColor: themeColors.headerBorder
            }}
          >
            <HeadlinePublished
              value={letter_header}
              level="h2"
              style={{
                ...headlineTypography,
                color: '#111827',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            />

            {/* Date */}
            {date_text && (
              <div className="text-center mt-2">
                <TextPublished
                  value={date_text}
                  style={{
                    fontSize: '0.875rem',
                    color: '#6B7280'
                  }}
                />
              </div>
            )}
          </div>

          {/* Letter Body */}
          <div className="px-8 py-8">

            {/* Greeting */}
            <TextPublished
              value={letter_greeting}
              style={{
                fontSize: '1.125rem',
                color: '#111827',
                marginBottom: '1.5rem'
              }}
            />

            {/* Letter Body */}
            <div className="prose prose-lg max-w-none mb-8">
              <TextPublished
                value={letter_body}
                style={{
                  color: '#374151',
                  lineHeight: '1.625',
                  whiteSpace: 'pre-line'
                }}
              />
            </div>

            {/* Signature Section */}
            <div className="flex items-end justify-between mt-12">
              <div className="flex items-center space-x-4">
                {/* Founder Image */}
                {founder_image && founder_image !== '' ? (
                  <img
                    src={founder_image}
                    alt="Founder"
                    className="w-16 h-16 rounded-full object-cover border-2"
                    style={{ borderColor: themeColors.avatarBorder }}
                  />
                ) : (
                  <FounderImagePlaceholder theme={uiTheme} />
                )}

                <div>
                  <TextPublished
                    value={letter_signature}
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#111827'
                    }}
                  />
                  {founder_title && (
                    <TextPublished
                      value={founder_title}
                      style={{
                        color: '#4B5563',
                        fontSize: '0.875rem'
                      }}
                    />
                  )}
                  {company_name && (
                    <TextPublished
                      value={company_name}
                      style={{
                        color: '#4B5563',
                        fontSize: '0.875rem'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* CTA Button */}
              {cta_text && (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
                  textColor="#FFFFFF"
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                />
              )}
            </div>

            {/* P.S. Section */}
            {ps_text && ps_text.trim() !== '' && (
              <div
                className="mt-8 pt-6 border-t"
                style={{ borderColor: themeColors.psDivider }}
              >
                <TextPublished
                  value={ps_text}
                  style={{
                    color: '#4B5563',
                    fontStyle: 'italic'
                  }}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
