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

// Founder Image Placeholder Component (server-safe) - Portrait style
const FounderImagePlaceholder = ({ theme }: { theme: UIBlockTheme }) => {
  const themeColors = getThemeColors(theme);

  return (
    <div
      className="w-32 h-40 rounded-lg flex items-center justify-center shadow-md"
      style={{ background: themeColors.avatarGradient }}
    >
      <div
        className="w-28 h-36 rounded-md flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
      >
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const letter_greeting = props.letter_greeting || 'Dear Fellow Builder,';
  const letter_body = props.letter_body || 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.';
  const letter_signature = props.letter_signature || 'Sushant Jain';
  const founder_title = props.founder_title || 'Founder';
  const company_name = props.company_name || 'Lessgo';
  const date_text = props.date_text || 'January 2025';
  const ps_text = props.ps_text || '';
  const founder_image = props.founder_image || '/images/founder.jpg';

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

            {/* Signature Section - Full image with name below */}
            <div className="mt-12">
              {/* Founder Image - Portrait style */}
              <div className="mb-4">
                {founder_image && founder_image !== '' ? (
                  <img
                    src={founder_image}
                    alt="Founder"
                    className="w-32 h-40 rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <FounderImagePlaceholder theme={uiTheme} />
                )}
              </div>

              {/* Name and Role */}
              <div>
                <TextPublished
                  value={letter_signature}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}
                />
                {(founder_title || company_name) && (
                  <TextPublished
                    value={`${founder_title || ''}${founder_title && company_name ? ', ' : ''}${company_name || ''}`}
                    style={{
                      color: '#4B5563',
                      fontSize: '0.875rem'
                    }}
                  />
                )}
              </div>
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
