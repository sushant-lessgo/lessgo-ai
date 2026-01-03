/**
 * VideoNoteWithTranscript - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';

type UIBlockTheme = 'warm' | 'cool' | 'neutral';

const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      playIconBg: '#F97316',
      playIconBgRgba: 'rgba(249, 115, 22, 0.2)',
      avatarGradient: 'linear-gradient(to bottom right, #FB923C, #EF4444, #EC4899)',
      transcriptBg: '#FFF7ED',
      transcriptBorder: '#FED7AA',
      trustCheckColor: '#F97316',
    },
    cool: {
      playIconBg: '#3B82F6',
      playIconBgRgba: 'rgba(59, 130, 246, 0.2)',
      avatarGradient: 'linear-gradient(to bottom right, #60A5FA, #6366F1, #4F46E5)',
      transcriptBg: '#EFF6FF',
      transcriptBorder: '#BFDBFE',
      trustCheckColor: '#3B82F6',
    },
    neutral: {
      playIconBg: '#6B7280',
      playIconBgRgba: 'rgba(107, 114, 128, 0.2)',
      avatarGradient: 'linear-gradient(to bottom right, #9CA3AF, #6B7280, #4B5563)',
      transcriptBg: '#F9FAFB',
      transcriptBorder: '#E5E7EB',
      trustCheckColor: '#6B7280',
    }
  }[theme];
};

// Server-safe video URL converter
function convertToEmbedUrl(url: string): string {
  if (!url) return '';

  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo patterns
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Already embed URL
  return url;
}

export default function VideoNoteWithTranscriptPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'A Personal Message from Our Founder';
  const video_intro = props.video_intro || '';
  const video_url = props.video_url || '';
  const transcript_text = props.transcript_text || '';
  const founder_name = props.founder_name || '';
  const cta_text = props.cta_text || 'Watch Demo';
  const trust_items = props.trust_items || '';

  // Parse trust items (pipe-separated)
  const trustList = trust_items
    ? trust_items.split('|').map(s => s.trim()).filter(Boolean)
    : [];

  // Convert video URL to embed format
  const embedUrl = convertToEmbedUrl(video_url);

  // Theme detection (server-safe - simplified for published)
  const uiBlockTheme: UIBlockTheme = 'neutral';
  const colors = getThemeColors(uiBlockTheme);

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-5xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-8">
          <HeadlinePublished
            value={headline}
            level="h2"
            className="leading-tight mb-4"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
          />
          {video_intro && (
            <TextPublished
              value={video_intro}
              className="leading-relaxed text-lg max-w-3xl mx-auto"
              style={{ color: textColors.body, ...bodyTypography }}
            />
          )}
        </div>

        {/* Two-column grid: Video + Transcript */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Video player */}
          <div className="space-y-6">
            {embedUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)'
                }}
              >
                <div className="text-center p-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                    style={{ backgroundColor: colors.playIconBgRgba }}
                  >
                    <svg
                      className="w-8 h-8"
                      style={{ color: colors.playIconBg }}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Add your video URL to display {founder_name}'s message here
                  </p>
                </div>
              </div>
            )}

            {/* Founder info and CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: colors.avatarGradient }}
                >
                  <span className="text-white text-sm font-bold">
                    {founder_name?.charAt(0) || 'F'}
                  </span>
                </div>
                <p style={{ fontWeight: 600, color: textColors.heading }}>
                  {founder_name}
                </p>
              </div>

              <CTAButtonPublished
                text={cta_text}
                backgroundColor={theme.colors?.accentColor || '#3B82F6'}
                textColor="#FFFFFF"
                className="shadow-lg hover:shadow-xl transition-all duration-200"
              />
            </div>
          </div>

          {/* Right: Transcript */}
          <div className="space-y-6">
            {/* Transcript header */}
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clipRule="evenodd" />
                <path d="M6 8h8v2H6V8zM6 12h4v2H6v-2z" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                Video Transcript
              </h3>
            </div>

            {/* Transcript content */}
            <div
              className="rounded-lg p-6 border max-h-80 overflow-y-auto"
              style={{
                backgroundColor: colors.transcriptBg,
                borderColor: colors.transcriptBorder
              }}
            >
              <p
                style={{
                  color: textColors.body,
                  lineHeight: '1.7',
                  whiteSpace: 'pre-line'
                }}
              >
                {transcript_text}
              </p>
            </div>

            {/* Trust indicators */}
            {trustList.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  {trustList.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: colors.trustCheckColor }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
