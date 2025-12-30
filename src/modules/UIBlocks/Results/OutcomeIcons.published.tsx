/**
 * OutcomeIcons - Published Version
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Outcome structure
interface Outcome {
  icon: string;
  title: string;
  description: string;
}

export default function OutcomeIconsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Powerful Outcomes You Can Expect';
  const subheadline = props.subheadline || '';
  const footer_text = props.footer_text || '';
  const titles = props.titles || '';
  const descriptions = props.descriptions || '';

  // Extract icons
  const icon_1 = props.icon_1 || '📈';
  const icon_2 = props.icon_2 || '⚡';
  const icon_3 = props.icon_3 || '🔒';
  const icon_4 = props.icon_4 || '👥';
  const icon_5 = props.icon_5 || '🤖';
  const icon_6 = props.icon_6 || '💡';
  const icon_7 = props.icon_7 || '🎯';
  const icon_8 = props.icon_8 || '⭐';

  const icons = [icon_1, icon_2, icon_3, icon_4, icon_5, icon_6, icon_7, icon_8];

  // Parse outcomes
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');

  const outcomes: Outcome[] = titleList.map((title, index) => ({
    title,
    description: descriptionList[index] || 'Amazing results await',
    icon: icons[index] || '⭐'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        iconBg: '#ffedd5',
        iconBgHover: '#fed7aa',
        iconBorder: '#fed7aa',
        cardBorder: '#e5e7eb',
        cardBorderHover: '#fdba74'
      },
      cool: {
        iconBg: '#dbeafe',
        iconBgHover: '#bfdbfe',
        iconBorder: '#bfdbfe',
        cardBorder: '#e5e7eb',
        cardBorderHover: '#93c5fd'
      },
      neutral: {
        iconBg: '#f1f5f9',
        iconBgHover: '#e2e8f0',
        iconBorder: '#e2e8f0',
        cardBorder: '#e5e7eb',
        cardBorderHover: '#cbd5e1'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Calculate grid columns based on count
  const getGridClass = (count: number): string => {
    if (count <= 3) return 'md:grid-cols-3 max-w-4xl mx-auto';
    if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    return 'md:grid-cols-2 lg:grid-cols-3';
  };

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

          {/* Optional Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Outcomes Grid */}
        <div className={`grid gap-8 ${getGridClass(outcomes.length)}`}>
          {outcomes.map((outcome, index) => (
            <div
              key={`outcome-${index}`}
              className="group text-center p-6 bg-white rounded-2xl border hover:shadow-lg transition-all duration-300"
              style={{
                borderColor: themeColors.cardBorder
              }}
            >
              {/* Icon */}
              <div className="mb-6">
                <div
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300"
                  style={{
                    backgroundColor: themeColors.iconBg,
                    borderColor: themeColors.iconBorder
                  }}
                >
                  <IconPublished
                    value={outcome.icon}
                    size="lg"
                    className="text-3xl"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <h3
                  style={{
                    fontWeight: 700,
                    color: '#111827'
                  }}
                >
                  {outcome.title}
                </h3>
              </div>

              {/* Description */}
              <div>
                <p
                  style={{
                    color: '#4b5563',
                    lineHeight: '1.75rem'
                  }}
                >
                  {outcome.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Outcome Promise Footer */}
        {footer_text && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 rounded-full border"
              style={{
                background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
                borderColor: '#bfdbfe'
              }}
            >
              <svg
                className="w-5 h-5 mr-2"
                style={{ color: '#3b82f6' }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <TextPublished
                value={footer_text}
                style={{
                  fontWeight: 500,
                  color: '#4b5563'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
