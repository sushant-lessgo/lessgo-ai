/**
 * UserCountBar - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function UserCountBarPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Join Over 50,000+ Happy Users';
  const subheadline = props.subheadline || '';
  const user_metrics = props.user_metrics || '';
  const metric_labels = props.metric_labels || '';
  const growth_indicators = props.growth_indicators || '';
  const users_joined_text = props.users_joined_text || '';
  const rating_value = props.rating_value || '';
  const rating_text = props.rating_text || '';
  const trust_item_1 = props.trust_item_1 || '';
  const trust_item_2 = props.trust_item_2 || '';
  const trust_item_3 = props.trust_item_3 || '';
  const customer_names = props.customer_names || '';
  const avatar_urls = props.avatar_urls || '{}';

  // Parse data (inline functions, server-safe)
  const parseMetrics = (metrics: string): string[] => {
    return metrics.split('|').map((m: string) => m.trim()).filter((m: string) => m && m !== '___REMOVED___');
  };

  const parseLabels = (labels: string): string[] => {
    return labels.split('|').map((l: string) => l.trim()).filter((l: string) => l && l !== '___REMOVED___');
  };

  const parseGrowth = (growth: string): string[] => {
    return growth.split('|').map(g => g.trim()).filter(g => g && g !== '___REMOVED___');
  };

  const parseAvatars = (names: string, urls: string): { name: string; avatarUrl: string }[] => {
    const nameList = names.split('|').map((n: string) => n.trim()).filter((n: string) => n);
    const urlMap = (() => {
      try {
        return JSON.parse(urls || '{}');
      } catch {
        return {};
      }
    })();
    return nameList.slice(0, 5).map(name => ({ name, avatarUrl: urlMap[name] || '' }));
  };

  const metrics = parseMetrics(user_metrics).slice(0, 4);
  const labels = parseLabels(metric_labels).slice(0, 4);
  const growth = parseGrowth(growth_indicators);
  const avatars = parseAvatars(customer_names, avatar_urls);
  const trustItems = [trust_item_1, trust_item_2, trust_item_3].filter((i: string) => i && i !== '___REMOVED___');

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based colors for cards, borders, and icons
  const getUserCountBarColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBorder: '#fed7aa',
        growthColor: '#ea580c',
        starColor: '#f59e0b',
        trustCheckColor: '#ea580c'
      },
      cool: {
        cardBorder: '#bfdbfe',
        growthColor: '#2563eb',
        starColor: '#3b82f6',
        trustCheckColor: '#2563eb'
      },
      neutral: {
        cardBorder: '#e5e7eb',
        growthColor: '#10b981',
        starColor: '#fbbf24',
        trustCheckColor: '#10b981'
      }
    }[theme];
  };

  const colors = getUserCountBarColors(uiTheme);

  // Get text colors and typography
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );
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
        <div className="text-center mb-12">
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
                margin: '0 auto 2rem'
              }}
            />
          )}

          {/* User Avatar Group */}
          {avatars.length > 0 && (
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex -space-x-2">
                {avatars.map((customer: { name: string; avatarUrl: string }, idx: number) => (
                  <AvatarPublished
                    key={idx}
                    name={customer.name}
                    imageUrl={customer.avatarUrl}
                    size={48}
                  />
                ))}
              </div>
              <div className="text-left">
                {users_joined_text && (
                  <TextPublished
                    value={users_joined_text}
                    style={{
                      color: textColors.body,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  />
                )}
                {rating_value && (
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map(i => (
                      <svg
                        key={i}
                        className="w-4 h-4 fill-current"
                        viewBox="0 0 20 20"
                        style={{ color: colors.starColor }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span
                      style={{
                        color: textColors.body,
                        fontSize: '0.875rem',
                        marginLeft: '0.5rem'
                      }}
                    >
                      {rating_value} {rating_text}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric: string, idx: number) => (
            <div
              key={idx}
              className="text-center p-6 rounded-xl backdrop-blur-sm border hover:bg-white/10 transition-all duration-300"
              style={{
                borderColor: colors.cardBorder,
                background: 'rgba(255,255,255,0.05)'
              }}
            >
              <div className="space-y-2">
                <div
                  className="font-bold text-3xl"
                  style={{ color: textColors.heading }}
                >
                  {metric}
                </div>
                {growth[idx] && (
                  <div className="flex items-center justify-center space-x-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: colors.growthColor }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.growthColor }}
                    >
                      {growth[idx]}
                    </span>
                  </div>
                )}
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {labels[idx]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators Bar */}
        {trustItems.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {trustItems.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: colors.trustCheckColor }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm" style={{ color: textColors.body }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
