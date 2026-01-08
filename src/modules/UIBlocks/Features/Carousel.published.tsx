/**
 * Carousel - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Displays features in a responsive grid (no carousel interactivity)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface Feature {
  title: string;
  description: string;
  visual: string;
  tag: string;
}

export default function CarouselPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Discover Amazing Features';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // Extract benefit badges
  const benefit_1 = props.benefit_1 || '';
  const benefit_2 = props.benefit_2 || '';
  const benefit_icon_1 = props.benefit_icon_1 || '✅';
  const benefit_icon_2 = props.benefit_icon_2 || '⏱️';

  // Extract individual features (up to 6)
  const features: Feature[] = [];
  for (let i = 0; i < 6; i++) {
    const title = (props[`feature_title_${i}`] as string) || '';
    const description = (props[`feature_description_${i}`] as string) || '';
    const visual = (props[`feature_visual_${i}`] as string) || '';
    const tag = (props[`feature_tag_${i}`] as string) || '';

    // Only add features with content
    if (title.trim() || description.trim() || visual.trim()) {
      features.push({ title, description, visual, tag });
    }
  }

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based benefit colors
  const getBenefitColors = (index: number) => {
    const colorSets = {
      warm: [
        { text: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)' },    // orange-600
        { text: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' }     // red-600
      ],
      cool: [
        { text: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },    // blue-600
        { text: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)' }     // cyan-600
      ],
      neutral: [
        { text: '#4b5563', bg: 'rgba(75, 85, 99, 0.1)' },     // gray-600
        { text: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }   // slate-600
      ]
    };
    return colorSets[uiTheme][index % 2];
  };

  const benefit1Colors = getBenefitColors(0);
  const benefit2Colors = getBenefitColors(1);

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
  const trustList = trust_items ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean) : [];

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature: Feature, index: number) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                {/* Feature Tag */}
                {feature.tag && (
                  <div
                    className="inline-block text-sm font-semibold px-4 py-2 rounded-full mb-4"
                    style={{
                      backgroundColor: theme?.colors?.accentColor || '#3B82F6',
                      color: '#ffffff'
                    }}
                  >
                    {feature.tag}
                  </div>
                )}

                {/* Feature Image */}
                {feature.visual && (
                  <div className="mb-4">
                    <ImagePublished
                      src={feature.visual}
                      alt={feature.title || 'Feature'}
                      className="w-full h-auto rounded-xl"
                    />
                  </div>
                )}

                {/* Feature Title */}
                {feature.title && (
                  <h3
                    style={{
                      color: textColors.heading,
                      ...h3Typography,
                      marginBottom: '0.75rem'
                    }}
                    className="font-bold"
                  >
                    {feature.title}
                  </h3>
                )}

                {/* Feature Description */}
                {feature.description && (
                  <p
                    style={{
                      color: textColors.body,
                      ...bodyTypography
                    }}
                    className="leading-relaxed"
                  >
                    {feature.description}
                  </p>
                )}

                {/* Benefit Badges (only show on first feature) */}
                {index === 0 && (benefit_1 || benefit_2) && (
                  <div className="flex items-center space-x-4 mt-4">
                    {benefit_1 && benefit_1 !== '___REMOVED___' && (
                      <div className="flex items-center space-x-2">
                        <span style={{ color: benefit1Colors.text, fontSize: '1.125rem' }}>
                          {benefit_icon_1}
                        </span>
                        <span
                          style={{
                            color: benefit1Colors.text,
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {benefit_1}
                        </span>
                      </div>
                    )}
                    {benefit_2 && benefit_2 !== '___REMOVED___' && (
                      <div className="flex items-center space-x-2">
                        <span style={{ color: benefit2Colors.text, fontSize: '1.125rem' }}>
                          {benefit_icon_2}
                        </span>
                        <span
                          style={{
                            color: benefit2Colors.text,
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {benefit_2}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
                  className="shadow-xl hover:shadow-2xl px-8 py-4 text-lg"
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
