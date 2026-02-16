/**
 * SplitAlternating - Published Version (V2)
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
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// V2: Feature item structure
interface Feature {
  id: string;
  title: string;
  description: string;
  visual?: string;
  icon?: string;
}

export default function SplitAlternatingPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Advanced Features for Power Users';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';

  // V2: Direct array access - only show features with visuals in published mode
  const rawFeatures = (props.features || []) as Feature[];
  const features = rawFeatures.filter(f => f.visual && f.visual.trim() !== '');

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Theme-based gradient styles (inline for SSR)
  const getIconGradientStyle = () => {
    const gradients = {
      warm: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      cool: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      neutral: 'linear-gradient(135deg, #6b7280 0%, #64748b 100%)'
    };
    return gradients[uiTheme];
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
              const displayIcon = feature.icon || 'Target';

              return (
                <div
                  key={feature.id}
                  className="grid lg:grid-cols-2 gap-12 items-center"
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
                          {displayIcon}
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
                    </div>
                  </div>

                  {/* Visual Side */}
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <ImagePublished
                      src={feature.visual || ''}
                      alt={feature.title || 'Feature visual'}
                      className="w-full h-80 object-cover rounded-xl shadow-2xl"
                      paletteMode={theme?.colors?.paletteMode}
                      paletteTemperature={theme?.colors?.paletteTemperature}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Supporting Text */}
        {supporting_text && (
          <div className="text-center mt-16">
            <TextPublished
              value={supporting_text}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
