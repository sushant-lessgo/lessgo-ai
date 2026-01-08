/**
 * SplitAlternating - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Displays features in alternating left/right layout
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
  icon: string;
}

export default function SplitAlternatingPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Advanced Features for Power Users';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';
  const trust_items = props.trust_items || '';

  // Extract benefit items
  const benefit_1 = props.benefit_1 || '';
  const benefit_2 = props.benefit_2 || '';

  // Parse pipe-separated fields
  const titles = (props.feature_titles || '').split('|').map((t: string) => t.trim()).filter(Boolean);
  const descriptions = (props.feature_descriptions || '').split('|').map((d: string) => d.trim()).filter(Boolean);

  // Extract icons (6 slots)
  const icons: string[] = [];
  for (let i = 1; i <= 6; i++) {
    icons.push((props[`feature_icon_${i}`] as string) || '🎯');
  }

  // Extract visuals (6 slots - individual fields)
  const visuals: string[] = [];
  for (let i = 0; i < 6; i++) {
    visuals.push((props[`feature_visual_${i}`] as string) || '');
  }

  // Build features array - only include features with visuals
  const features: Feature[] = titles.map((title: string, idx: number) => ({
    title,
    description: descriptions[idx] || '',
    visual: visuals[idx] || '',
    icon: icons[idx] || '🎯'
  })).filter((feature: Feature) => feature.visual.trim() !== ''); // Only show features with images in published mode

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based gradient styles (inline for SSR)
  const getIconGradientStyle = () => {
    const gradients = {
      warm: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      cool: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      neutral: 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)'
    };
    return gradients[uiTheme];
  };

  // Benefit checkmark colors
  const getBenefitColor = (index: number) => {
    const colors = {
      warm: ['#ea580c', '#dc2626'],
      cool: ['#2563eb', '#0891b2'],
      neutral: ['#4b5563', '#64748b']
    };
    return colors[uiTheme][index % 2];
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
  const h2Typography = getPublishedTypographyStyles('h2', theme);

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

        {/* Features - Alternating Layout */}
        {features.length > 0 && (
          <div className="space-y-24">
            {features.map((feature: Feature, idx: number) => {
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={idx}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
                >
                  {/* Content Side */}
                  <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="space-y-6">
                      {/* Icon Badge + Title */}
                      <div className="flex items-start space-x-4">
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: getIconGradientStyle(),
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
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
                                ...h2Typography,
                                marginBottom: '0.5rem'
                              }}
                              className="font-bold"
                            >
                              {feature.title}
                            </h3>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {feature.description && (
                        <p
                          style={{
                            color: textColors.body,
                            ...bodyTypography,
                            lineHeight: '1.75'
                          }}
                        >
                          {feature.description}
                        </p>
                      )}

                      {/* Benefit Badges (only on first feature) */}
                      {idx === 0 && (benefit_1 || benefit_2) && (
                        <div className="flex items-center space-x-4 mt-4">
                          {benefit_1 && benefit_1 !== '___REMOVED___' && (
                            <div className="flex items-center space-x-2">
                              <span style={{ color: getBenefitColor(0), fontSize: '1.125rem', fontWeight: 'bold' }}>
                                ✓
                              </span>
                              <span
                                style={{
                                  color: textColors.body,
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
                              <span style={{ color: getBenefitColor(1), fontSize: '1.125rem', fontWeight: 'bold' }}>
                                ✓
                              </span>
                              <span
                                style={{
                                  color: textColors.body,
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
                  </div>

                  {/* Visual Side */}
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <ImagePublished
                      src={feature.visual}
                      alt={feature.title || 'Feature visual'}
                      className="w-full h-80 object-cover rounded-xl shadow-2xl"
                    />
                  </div>
                </div>
              );
            })}
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
                  className="shadow-xl px-8 py-4 text-lg"
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
