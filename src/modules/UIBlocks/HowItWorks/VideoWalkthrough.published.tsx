/**
 * VideoWalkthrough - Published Version (V2)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getDynamicCardLayout } from '@/utils/dynamicCardLayout';
import { isHexColor } from '@/utils/colorUtils';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// V2 Types
interface DemoStatItem {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

interface VideoInfoItem {
  id: string;
  text: string;
  icon?: string;
}

// Defaults
const DEFAULT_DEMO_STATS: DemoStatItem[] = [
  { id: 'ds1', label: 'Real Data', description: 'Actual customer implementation' },
  { id: 'ds2', label: 'Live Demo', description: 'Interactive walkthrough' },
  { id: 'ds3', label: 'Q&A', description: 'Expert consultation included' }
];

const DEFAULT_VIDEO_INFO: VideoInfoItem[] = [
  { id: 'vi1', text: 'Live demonstration' },
  { id: 'vi2', text: '5 min watch' }
];

// Theme color mapping
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      accentColors: ['#ea580c', '#dc2626', '#d97706'], // orange-600, red-600, amber-600
      iconBg: '#ffedd5', // orange-100
      iconColor: '#ea580c', // orange-600
      cardBg: '#fff7ed', // orange-50
      cardBorder: '#fed7aa' // orange-200
    },
    cool: {
      accentColors: ['#2563eb', '#4f46e5', '#0891b2'], // blue-600, indigo-600, cyan-600
      iconBg: '#dbeafe', // blue-100
      iconColor: '#2563eb', // blue-600
      cardBg: '#eff6ff', // blue-50
      cardBorder: '#bfdbfe' // blue-200
    },
    neutral: {
      accentColors: ['#374151', '#475569', '#52525b'], // gray-700, slate-600, zinc-600
      iconBg: '#f3f4f6', // gray-100
      iconColor: '#4b5563', // gray-600
      cardBg: '#f9fafb', // gray-50
      cardBorder: '#e5e7eb' // gray-200
    }
  };
  return colorMap[theme];
};

export default function VideoWalkthroughPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, colorTokens } = props;

  // Extract content
  const headline = props.headline || 'See How It Works in Action';
  const subheadline = props.subheadline || '';
  const video_title = props.video_title || 'Complete Product Walkthrough';
  const video_description = props.video_description || 'Watch our comprehensive demo showing exactly how our platform works.';
  const video_url = props.video_url || '';
  const video_duration = props.video_duration || '';
  const demo_stats_heading = props.demo_stats_heading || '';

  // Get arrays (V2 format)
  const demo_stats: DemoStatItem[] = Array.isArray(props.demo_stats) && props.demo_stats.length > 0
    ? props.demo_stats
    : DEFAULT_DEMO_STATS;

  const video_info: VideoInfoItem[] = Array.isArray(props.video_info) && props.video_info.length > 0
    ? props.video_info
    : DEFAULT_VIDEO_INFO;

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const themeColors = getThemeColors(uiTheme);

  // Adaptive card styles based on section background luminance
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const subheadlineTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // CTA background color for play button
  const ctaBg = colorTokens?.ctaBg || 'bg-blue-600';
  const ctaBgIsHex = isHexColor(ctaBg);

  // Video Player Component
  const VideoPlayer = () => {
    if (video_url && video_url.includes('youtube')) {
      return (
        <iframe
          src={video_url}
          title={video_title}
          className="w-full h-full rounded-xl"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Placeholder when no video URL
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden group cursor-pointer"
        style={{ background: 'linear-gradient(to bottom right, #334155, #1e293b, #0f172a)' }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-lg font-semibold">{video_title}</div>
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div
            className={`w-20 h-20 rounded-full ${ctaBgIsHex ? '' : ctaBg} flex items-center justify-center shadow-2xl`}
            style={ctaBgIsHex ? { backgroundColor: ctaBg } : undefined}
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        {video_duration && (
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            {video_duration}
          </div>
        )}
      </div>
    );
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...subheadlineTypography,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Video + Info Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Video Player */}
          <div className="order-2 lg:order-1">
            <div className="aspect-video">
              <VideoPlayer />
            </div>
          </div>

          {/* Video Info */}
          <div className="order-1 lg:order-2 space-y-6">
            <div>
              <h3
                style={{
                  color: textColors.heading,
                  ...h3Typography,
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}
              >
                {video_title}
              </h3>

              <p
                style={{
                  color: textColors.muted,
                  ...bodyTypography,
                  fontSize: '1.125rem',
                  lineHeight: '1.75'
                }}
              >
                {video_description}
              </p>
            </div>

            {/* Video Info Items */}
            {video_info.length > 0 && (
              <div className="flex items-center gap-6">
                {video_info.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: themeColors.iconBg }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: themeColors.iconColor }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span
                      style={{
                        color: textColors.heading,
                        fontWeight: 500
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Demo Stats */}
        {demo_stats.length > 0 && (() => {
          const demoStatsLayout = getDynamicCardLayout(demo_stats.length);
          return (
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                WebkitBackdropFilter: cardStyles.backdropFilter,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                borderColor: cardStyles.borderColor,
                boxShadow: cardStyles.boxShadow
              }}
            >
              <div className="text-center">
                {demo_stats_heading && demo_stats_heading.trim() !== '' && (
                  <div
                    style={{
                      color: cardStyles.textHeading,
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      marginBottom: '2rem'
                    }}
                  >
                    {demo_stats_heading}
                  </div>
                )}

                <div className={demoStatsLayout.gridClass}>
                  {demo_stats.map((stat, index) => (
                    <div key={stat.id} className="text-center">
                      <div
                        style={{
                          color: themeColors.accentColors[index % themeColors.accentColors.length],
                          ...h3Typography,
                          fontWeight: 700,
                          marginBottom: '0.5rem'
                        }}
                      >
                        {stat.label}
                      </div>
                      <div
                        style={{
                          color: cardStyles.textMuted,
                          fontSize: '0.875rem'
                        }}
                      >
                        {stat.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </SectionWrapperPublished>
  );
}
