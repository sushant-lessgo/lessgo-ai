/**
 * SecretSauceReveal - Published Version
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

export default function SecretSauceRevealPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Our Secret Sauce Revealed';
  const subheadline = props.subheadline || '';
  const secret_titles = props.secret_titles || '';
  const secret_descriptions = props.secret_descriptions || '';
  const secret_icon_1 = props.secret_icon_1 || '🔬';
  const secret_icon_2 = props.secret_icon_2 || '🧠';
  const secret_icon_3 = props.secret_icon_3 || '🚀';
  const secret_icon_4 = props.secret_icon_4 || '💡';

  // Parse pipe-delimited strings
  const titles = secret_titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const descriptions = secret_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const icons = [secret_icon_1, secret_icon_2, secret_icon_3, secret_icon_4];

  // Combine into secret items
  const secrets = titles.map((title, index) => ({
    title,
    description: descriptions[index] || '',
    icon: icons[index] || '🔬'
  }));

  // Theme detection (no useMemo - direct evaluation)
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors (matching base component - note neutral uses PURPLE)
  const getSecretColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        cardBorder: '#fed7aa',           // orange-200
        iconBg: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)', // orange-400 to red-500
        iconShadow: '0 10px 15px -3px rgba(254, 215, 170, 0.5)', // shadow-lg shadow-orange-200
        titleText: '#7c2d12',            // orange-900
        accentBar: 'linear-gradient(90deg, #fb923c 0%, #ef4444 100%)', // orange-400 to red-500
      },
      cool: {
        cardBorder: '#bfdbfe',           // blue-200
        iconBg: 'linear-gradient(135deg, #60a5fa 0%, #6366f1 100%)', // blue-400 to indigo-500
        iconShadow: '0 10px 15px -3px rgba(191, 219, 254, 0.5)', // shadow-lg shadow-blue-200
        titleText: '#1e3a8a',            // blue-900
        accentBar: 'linear-gradient(90deg, #60a5fa 0%, #6366f1 100%)', // blue-400 to indigo-500
      },
      neutral: {
        cardBorder: '#e9d5ff',           // purple-200
        iconBg: 'linear-gradient(135deg, #c084fc 0%, #6366f1 100%)', // purple-400 to indigo-500
        iconShadow: '0 10px 15px -3px rgba(233, 213, 255, 0.5)', // shadow-lg shadow-purple-200
        titleText: '#581c87',            // purple-900
        accentBar: 'linear-gradient(90deg, #c084fc 0%, #6366f1 100%)', // purple-400 to indigo-500
      }
    };
    return colorMap[theme];
  };

  const secretColors = getSecretColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...h2Typography,
              marginBottom: subheadline ? '1rem' : '0',
              fontWeight: '700'
            }}
            className="text-center"
          />
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Secret Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {secrets.map((secret, index) => (
            <div key={index} className="group relative">
              <div
                style={{
                  borderColor: secretColors.cardBorder
                }}
                className="bg-white rounded-2xl p-8 text-center relative overflow-hidden h-full border-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Accent Bar */}
                <div
                  style={{
                    background: secretColors.accentBar
                  }}
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                />

                {/* Icon */}
                <div className="relative z-10">
                  <div
                    style={{
                      background: secretColors.iconBg,
                      boxShadow: secretColors.iconShadow
                    }}
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <IconPublished
                      value={secret.icon}
                      style={{
                        color: '#ffffff',
                        fontSize: '1.5rem'
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      color: secretColors.titleText
                    }}
                    className="font-bold text-xl mb-3"
                  >
                    {secret.title}
                  </h3>

                  {/* Description */}
                  {secret.description && (
                    <TextPublished
                      value={secret.description}
                      style={{
                        color: textColors.body,
                        fontSize: '1rem',
                        lineHeight: '1.625'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
