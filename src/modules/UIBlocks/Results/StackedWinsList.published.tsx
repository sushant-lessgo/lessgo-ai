/**
 * StackedWinsList - Published Version
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

// Win item structure
interface Win {
  win: string;
  description: string;
  category: string;
}

export default function StackedWinsListPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Your Wins Start Adding Up Fast';
  const subheadline = props.subheadline || '';
  const win_count = props.win_count || '';
  const footer_title = props.footer_title || '';
  const footer_text = props.footer_text || '';

  // Extract pipe-separated fields
  const wins = props.wins || '';
  const descriptions = props.descriptions || '';
  const categories = props.categories || '';

  // Extract icons
  const win_icon = props.win_icon || '✅';
  const badge_icon = props.badge_icon || '🏆';
  const momentum_icon = props.momentum_icon || '📈';

  // Parse all arrays
  const winList = wins.split('|').map((w: string) => w.trim()).filter((w: string) => w && w !== '___REMOVED___');
  const descriptionList = descriptions ? descriptions.split('|').map((d: string) => d.trim()) : [];
  const categoryList = categories ? categories.split('|').map((c: string) => c.trim()) : [];

  // Build wins array
  const winData: Win[] = winList.map((win: string, index: number) => ({
    win,
    description: descriptionList[index] || '',
    category: categoryList[index] || ''
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-based win icon gradient colors
  const getWinIconColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        gradientFrom: '#fb923c',
        gradientTo: '#ef4444',
        border: '#fed7aa',
        iconBg: 'linear-gradient(to bottom right, #fb923c, #ef4444)'
      },
      cool: {
        gradientFrom: '#60a5fa',
        gradientTo: '#06b6d4',
        border: '#bfdbfe',
        iconBg: 'linear-gradient(to bottom right, #60a5fa, #06b6d4)'
      },
      neutral: {
        gradientFrom: '#9ca3af',
        gradientTo: '#64748b',
        border: '#e5e7eb',
        iconBg: 'linear-gradient(to bottom right, #9ca3af, #64748b)'
      }
    }[theme];
  };

  // Get category colors with hex values
  const getCategoryColor = (category: string, theme: UIBlockTheme) => {
    if (!category) {
      const defaults = {
        warm: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
        cool: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
        neutral: { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' }
      };
      return defaults[theme];
    }

    const warmColors: Record<string, { bg: string; text: string; border: string }> = {
      'time savings': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
      'productivity': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
      'cost reduction': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
      'automation': { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
      'customer success': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
      'scalability': { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
      'workflow': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
      'analytics': { bg: '#fefce8', text: '#a16207', border: '#fef08a' }
    };

    const coolColors: Record<string, { bg: string; text: string; border: string }> = {
      'time savings': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
      'productivity': { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
      'cost reduction': { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
      'automation': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
      'customer success': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
      'scalability': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
      'workflow': { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
      'analytics': { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }
    };

    const neutralColors: Record<string, { bg: string; text: string; border: string }> = {
      'time savings': { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
      'productivity': { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
      'cost reduction': { bg: '#fafafa', text: '#3f3f46', border: '#e4e4e7' },
      'automation': { bg: '#fafaf9', text: '#44403c', border: '#e7e5e4' },
      'customer success': { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
      'scalability': { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
      'workflow': { bg: '#fafafa', text: '#3f3f46', border: '#e4e4e7' },
      'analytics': { bg: '#fafaf9', text: '#44403c', border: '#e7e5e4' }
    };

    const colorSets = { warm: warmColors, cool: coolColors, neutral: neutralColors };
    const categoryKey = category.toLowerCase();
    return colorSets[theme][categoryKey] || colorSets[theme]['productivity'];
  };

  // Get badge colors
  const getBadgeColors = (theme: UIBlockTheme) => {
    return {
      warm: { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
      cool: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
      neutral: { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
    }[theme];
  };

  const iconColors = getWinIconColors(uiTheme);
  const badgeColors = getBadgeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
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
      <div className="max-w-4xl mx-auto">
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

          {/* Win Count Badge */}
          {win_count && (
            <div
              className="inline-flex items-center px-4 py-2 border rounded-full font-medium text-sm mt-6"
              style={{
                backgroundColor: badgeColors.bg,
                borderColor: badgeColors.border,
                color: badgeColors.text
              }}
            >
              <IconPublished
                icon={badge_icon}
                size={16}
                className="text-sm mr-2"
              />
              <TextPublished
                value={win_count}
                style={{ fontWeight: 500 }}
              />
            </div>
          )}
        </div>

        {/* Wins List */}
        <div className="space-y-4">
          {winData.map((win: Win, index: number) => {
            const categoryColors = getCategoryColor(win.category, uiTheme);

            return (
              <div
                key={`win-${index}`}
                className="flex items-start space-x-4 p-6 bg-white rounded-xl border transition-all duration-300"
                style={{ borderColor: iconColors.border }}
              >
                {/* Checkmark Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: iconColors.iconBg
                    }}
                  >
                    <IconPublished
                      icon={win_icon}
                      size={16}
                      className="text-lg text-white"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Category Tag */}
                  {win.category && (
                    <div className="mb-2">
                      <span
                        className="inline-block text-xs font-semibold rounded-full px-2 py-1 border"
                        style={{
                          backgroundColor: categoryColors.bg,
                          color: categoryColors.text,
                          borderColor: categoryColors.border
                        }}
                      >
                        {win.category}
                      </span>
                    </div>
                  )}

                  {/* Win Title */}
                  <div className="mb-2">
                    <TextPublished
                      value={win.win}
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#111827',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>

                  {/* Description */}
                  {win.description && (
                    <div>
                      <TextPublished
                        value={win.description}
                        style={{
                          color: '#6b7280',
                          lineHeight: '1.75'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Momentum Footer */}
        {(footer_title || footer_text) && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <IconPublished
                icon={momentum_icon}
                size={24}
                className="text-2xl"
              />
              {footer_title && (
                <TextPublished
                  value={footer_title}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: textColors.heading
                  }}
                />
              )}
            </div>
            {footer_text && (
              <TextPublished
                value={footer_text}
                style={{
                  color: textColors.muted,
                  fontSize: '1.125rem'
                }}
              />
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
