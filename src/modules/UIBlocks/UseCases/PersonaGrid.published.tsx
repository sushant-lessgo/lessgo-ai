/**
 * PersonaGrid - Published Version (V2 Schema)
 *
 * Server-safe component with ZERO hook imports
 * Uses array-based personas data format
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Type
interface Persona {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function PersonaGridPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Built for Every Team Member';
  const subheadline = props.subheadline;
  const footerText = props.footer_text;

  // Get personas array (V2 format)
  const personas: Persona[] = props.personas || [];

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        avatarGradientStart: '#f97316',  // orange-500
        avatarGradientEnd: '#dc2626',    // red-600
        avatarRing: '#fed7aa',           // orange-200
        cardBorder: '#ffedd5'            // orange-100
      },
      cool: {
        avatarGradientStart: '#3b82f6',  // blue-500
        avatarGradientEnd: '#4f46e5',    // indigo-600
        avatarRing: '#bfdbfe',           // blue-200
        cardBorder: '#dbeafe'            // blue-100
      },
      neutral: {
        avatarGradientStart: '#6b7280',  // gray-500
        avatarGradientEnd: '#475569',    // slate-600
        avatarRing: '#e5e7eb',           // gray-200
        cardBorder: '#e5e7eb'            // gray-200
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'neutral', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Get grid classes based on persona count
  const getGridClasses = (count: number) => {
    if (count === 1) return 'max-w-md mx-auto';
    if (count === 2) return 'md:grid-cols-2 max-w-3xl mx-auto';
    if (count === 3) return 'md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    return 'md:grid-cols-2 lg:grid-cols-3';
  };

  const gridClasses = getGridClasses(personas.length);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: subheadline ? '1rem' : '4rem',
            marginTop: '2rem'
          }}
        />

        {/* Subheadline */}
        {subheadline && (
          <TextPublished
            value={subheadline}
            style={{
              color: textColors.body,
              fontSize: '1.125rem',
              lineHeight: '1.75rem',
              textAlign: 'center',
              maxWidth: '48rem',
              margin: '0 auto 4rem auto'
            }}
          />
        )}

        {/* Persona Grid */}
        <div className={`grid gap-8 ${gridClasses}`}>
          {personas.map((persona: Persona) => (
            <div
              key={persona.id}
              className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 group"
              style={{ border: `1px solid ${themeColors.cardBorder}` }}
            >
              {/* Avatar */}
              <div className="relative mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.avatarGradientStart} 0%, ${themeColors.avatarGradientEnd} 100%)`,
                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)',
                    border: `1px solid ${themeColors.avatarRing}`
                  }}
                >
                  {persona.icon ? (
                    <IconPublished icon={persona.icon} color="#ffffff" size={28} />
                  ) : (
                    <span className="font-bold text-lg">{getInitials(persona.name)}</span>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <TextPublished
                  value={persona.name}
                  style={{
                    fontWeight: 700,
                    textAlign: 'center',
                    color: textColors.heading
                  }}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <TextPublished
                  value={persona.description}
                  style={{
                    color: textColors.muted,
                    fontSize: '0.875rem',
                    lineHeight: '1.5rem',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Text */}
        {footerText && (
          <div className="mt-16 mb-8 text-center">
            <TextPublished
              value={footerText}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                color: textColors.body,
                maxWidth: '80rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
