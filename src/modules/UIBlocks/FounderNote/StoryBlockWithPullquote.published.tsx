/**
 * StoryBlockWithPullquote - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

// Theme-based color function (same as base component)
const getThemeColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      quoteIconColor: '#f97316',      // orange-500
      quoteBgGradient: 'linear-gradient(to right, #fff7ed, #fee2e2)',
      quoteBorder: '#fed7aa',         // orange-200
      quoteAccentBar: 'linear-gradient(to bottom, #f97316, #dc2626)',
      trustNumberColor: '#ea580c',    // orange-600
      ctaSectionBg: 'linear-gradient(to bottom right, #fff7ed, #fee2e2)',
      avatarGradient: 'linear-gradient(to bottom right, #fb923c, #ef4444, #ec4899)'
    },
    cool: {
      quoteIconColor: '#3b82f6',      // blue-500
      quoteBgGradient: 'linear-gradient(to right, #eff6ff, #eef2ff)',
      quoteBorder: '#bfdbfe',         // blue-200
      quoteAccentBar: 'linear-gradient(to bottom, #3b82f6, #4f46e5)',
      trustNumberColor: '#2563eb',    // blue-600
      ctaSectionBg: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
      avatarGradient: 'linear-gradient(to bottom right, #60a5fa, #6366f1, #8b5cf6)'
    },
    neutral: {
      quoteIconColor: '#6b7280',      // gray-500
      quoteBgGradient: 'linear-gradient(to right, #f9fafb, #f1f5f9)',
      quoteBorder: '#e5e7eb',         // gray-200
      quoteAccentBar: 'linear-gradient(to bottom, #6b7280, #64748b)',
      trustNumberColor: '#4b5563',    // gray-600
      ctaSectionBg: 'linear-gradient(to bottom right, #f9fafb, #f1f5f9)',
      avatarGradient: 'linear-gradient(to bottom right, #9ca3af, #64748b, #6b7280)'
    }
  };
  return colorMap[theme];
};

// Founder Image Placeholder Component (server-safe)
const FounderImagePlaceholder = ({ avatarGradient }: { avatarGradient: string }) => (
  <div
    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
    style={{ background: avatarGradient }}
  >
    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  </div>
);

export default function StoryBlockWithPullquotePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Detect theme from props
  const uiBlockTheme: UIBlockTheme = (props.manualThemeOverride as UIBlockTheme) || 'neutral';
  const themeColors = getThemeColors(uiBlockTheme);

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const story_headline = props.story_headline || 'The Day I Realized Our Industry Was Broken';
  const story_intro = props.story_intro || 'It was 2 AM on a Tuesday, and I was staring at my computer screen in disbelief...';
  const story_body = props.story_body || 'That night changed everything for me...';
  const pullquote_text = props.pullquote_text || '"We don\'t need more features. We need software that gets out of our way."';
  const story_conclusion = props.story_conclusion || 'Three years later, that midnight frustration has become a platform...';
  const cta_text = props.cta_text || 'Join Our Story';
  const founder_name = props.founder_name || 'Jordan Martinez';
  const founder_title = props.founder_title || 'Founder & CEO';
  const company_name = props.company_name || 'YourCompany';
  const reading_time = props.reading_time || '3 min read';
  const founder_image = props.founder_image || '';
  const cta_section_heading = props.cta_section_heading || 'Ready to be part of the story?';
  const cta_section_description = props.cta_section_description || 'Join thousands of professionals who have already transformed their workflow.';
  const quote_icon = props.quote_icon || '"';

  // Get trust items
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter(item => item && item !== '___REMOVED___' && item.trim() !== '');

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const h1Typography = getPublishedTypographyStyles('h1', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">

        {/* Article Header */}
        <div className="text-center mb-12">

          {/* Headline */}
          <HeadlinePublished
            value={story_headline}
            level="h1"
            style={{
              ...h1Typography,
              lineHeight: '1.2',
              marginBottom: '1.5rem',
              color: textColors.heading
            }}
          />

          {/* Author Info */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* Founder Image */}
            <div className="flex-shrink-0">
              {founder_image ? (
                <img
                  src={founder_image}
                  alt="Founder"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <FounderImagePlaceholder avatarGradient={themeColors.avatarGradient} />
              )}
            </div>

            <div className="text-left">
              <TextPublished
                value={founder_name}
                style={{
                  fontWeight: 600,
                  color: '#111827'
                }}
              />
              <div className="flex items-center space-x-2 text-sm">
                <TextPublished
                  value={founder_title}
                  style={{
                    color: textColors.muted
                  }}
                />
                <span style={{ color: textColors.muted }}>•</span>
                <TextPublished
                  value={reading_time}
                  style={{
                    color: textColors.muted
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="prose prose-lg max-w-none">

          {/* Story Introduction */}
          <div className="mb-8">
            <TextPublished
              value={story_intro}
              style={{
                fontSize: '1.25rem',
                lineHeight: '1.625',
                color: '#374151',
                fontWeight: 500
              }}
            />
          </div>

          {/* Story Body */}
          <div className="mb-12">
            <TextPublished
              value={story_body}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.625',
                color: '#374151',
                whiteSpace: 'pre-line'
              }}
            />
          </div>

          {/* Pull Quote */}
          <div className="relative my-12 py-8">
            {/* Quote background */}
            <div
              className="absolute inset-0 rounded-2xl transform -rotate-1"
              style={{ background: themeColors.quoteBgGradient }}
            ></div>
            <div
              className="relative bg-white rounded-2xl shadow-lg border p-8 transform rotate-1"
              style={{ borderColor: themeColors.quoteBorder }}
            >

              {/* Quote mark */}
              <div
                className="text-6xl opacity-20 font-serif leading-none mb-4"
                style={{ color: themeColors.quoteIconColor }}
              >
                {quote_icon}
              </div>

              {/* Quote text */}
              <TextPublished
                value={pullquote_text}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: '#111827',
                  lineHeight: '1.625',
                  fontStyle: 'italic'
                }}
              />

              {/* Attribution */}
              <div className="mt-6 flex items-center space-x-3">
                <div
                  className="w-2 h-12 rounded-full"
                  style={{ background: themeColors.quoteAccentBar }}
                ></div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {founder_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {founder_title}, {company_name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Conclusion */}
          <div className="mb-12">
            <TextPublished
              value={story_conclusion}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.625',
                color: '#374151',
                whiteSpace: 'pre-line'
              }}
            />
          </div>
        </div>

        {/* Call to Action Section */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: themeColors.ctaSectionBg }}
        >
          <HeadlinePublished
            value={cta_section_heading}
            level="h3"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}
          />

          <TextPublished
            value={cta_section_description}
            style={{
              color: '#4B5563',
              marginBottom: '1.5rem'
            }}
            className="max-w-2xl mx-auto"
          />

          <CTAButtonPublished
            text={cta_text}
            backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
            textColor="#FFFFFF"
            className="shadow-xl mb-6 px-8 py-4 text-lg"
          />

          {/* Trust Stats */}
          {trustItems.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {trustItems.map((item, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="text-xl font-bold mb-1"
                      style={{ color: themeColors.trustNumberColor }}
                    >
                      {item.split(' ')[0]}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Article Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: themeColors.avatarGradient }}
              >
                {founder_name.charAt(0) || 'F'}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {founder_name}
                </div>
                <div className="text-sm text-gray-600">
                  {founder_title} at {company_name}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Published by</div>
              <div className="font-medium text-gray-900">
                {company_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
