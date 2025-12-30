/**
 * MiniCards - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Displays feature cards in a responsive grid
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface Feature {
  title: string;
  description: string;
  keyword: string;
  icon: string;
}

export default function MiniCardsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Essential Features for Modern Teams';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // Feature summary fields
  const summary_item_1 = props.summary_item_1 || '';
  const summary_item_2 = props.summary_item_2 || '';
  const summary_item_3 = props.summary_item_3 || '';
  const show_feature_summary = props.show_feature_summary !== false;

  // Parse pipe-separated fields
  const titles = (props.feature_titles || '').split('|').map(t => t.trim()).filter(Boolean);
  const descriptions = (props.feature_descriptions || '').split('|').map(d => d.trim()).filter(Boolean);
  const keywords = (props.feature_keywords || '').split('|').map(k => k.trim()).filter(Boolean);

  // Extract icons (12 slots)
  const icons = [];
  for (let i = 1; i <= 12; i++) {
    icons.push((props[`feature_icon_${i}`] as string) || '📊');
  }

  // Build features array
  const features: Feature[] = titles.map((title, idx) => ({
    title,
    description: descriptions[idx] || '',
    keyword: keywords[idx] || '',
    icon: icons[idx] || '📊'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based gradient styles (inline for SSR)
  const getGradientStyle = (index: number) => {
    const gradients = {
      warm: [
        'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
        'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
      ],
      cool: [
        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
      ],
      neutral: [
        'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
        'linear-gradient(135deg, #737373 0%, #525252 100%)',
        'linear-gradient(135deg, #78716c 0%, #57534e 100%)',
        'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
      ]
    };
    return gradients[uiTheme][index % 6];
  };

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  // Trust indicators
  const trustList = trust_items ? trust_items.split('|').map(item => item.trim()).filter(Boolean) : [];

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

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Features Grid */}
        {features.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                {/* Icon and Title */}
                <div className="flex items-start space-x-4 mb-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: getGradientStyle(index),
                      boxShadow: '0 6px 18px rgba(15,23,42,0.18)',
                      fontSize: '1.25rem'
                    }}
                  >
                    {feature.icon}
                  </div>

                  <div className="flex-1">
                    {feature.title && (
                      <h3
                        style={{
                          color: textColors.heading,
                          ...h3Typography,
                          marginBottom: '0.5rem'
                        }}
                        className="font-bold"
                      >
                        {feature.title}
                      </h3>
                    )}

                    {/* Keyword Badge */}
                    {feature.keyword && (
                      <span
                        className="inline-block text-xs font-medium px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: theme?.colors?.accentColor || '#3B82F6',
                          color: '#ffffff'
                        }}
                      >
                        {feature.keyword}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {feature.description && (
                  <div className="mt-auto">
                    <p
                      style={{
                        color: textColors.muted,
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feature Summary Section */}
        {show_feature_summary && (summary_item_1 || summary_item_2 || summary_item_3) && (
          <div className="mt-12">
            <div className="inline-flex items-center space-x-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mx-auto">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {features.length} Core Features
                </span>
              </div>

              {summary_item_1 && summary_item_1 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {summary_item_1}
                    </span>
                  </div>
                </>
              )}

              {summary_item_2 && summary_item_2 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {summary_item_2}
                    </span>
                  </div>
                </>
              )}

              {summary_item_3 && summary_item_3 !== '___REMOVED___' && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {summary_item_3}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Supporting Text and CTA */}
        {(supporting_text || cta_text || trustList.length > 0) && (
          <div className="text-center space-y-6 mt-16">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {cta_text && (
                <CTAButtonPublished
                  text={cta_text}
                  backgroundColor={theme?.colors?.accentColor || '#3B82F6'}
                  textColor="#FFFFFF"
                  className="px-8 py-4 text-lg"
                />
              )}

              {trustList.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span style={{ color: textColors.muted, fontSize: '0.875rem' }}>
                    {trustList.join(' • ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
