/**
 * RoleBasedScenarios - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

interface Scenario {
  id: string;
  role: string;
  scenario: string;
}

export default function RoleBasedScenariosPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content
  const headline = props.headline || 'Perfect for Every Role';
  const subheadline = props.subheadline || '';
  const footer_text = props.footer_text || '';

  // Parse scenarios array
  const scenarios: Scenario[] = Array.isArray(props.scenarios) ? props.scenarios : [
    { id: 'sc1', role: 'CEO', scenario: 'Get executive dashboards and strategic insights' },
    { id: 'sc2', role: 'CTO', scenario: 'Monitor system performance and technical metrics' },
    { id: 'sc3', role: 'Marketing Manager', scenario: 'Track campaign performance and lead generation' },
    { id: 'sc4', role: 'Sales Director', scenario: 'Manage pipeline and forecast revenue' }
  ];

  // Get initials from role name
  const getInitials = (role: string) => {
    return role.split(' ').map(w => w[0]).join('').toUpperCase();
  };

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get luminance from section background
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');

  // Get adaptive card styles
  const cardStyles = getPublishedCardStyles(luminance, uiTheme);

  // Get theme-specific colors for avatar gradient only
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        gradientStart: '#f97316',    // orange-500
        gradientEnd: '#ea580c',      // orange-600
      },
      cool: {
        gradientStart: '#3b82f6',    // blue-500
        gradientEnd: '#4f46e5',      // indigo-600
      },
      neutral: {
        gradientStart: '#6b7280',    // gray-500
        gradientEnd: '#4b5563',      // gray-600
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'secondary', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            textAlign: 'center',
            marginBottom: subheadline ? '1rem' : '4rem'
          }}
        />

        {/* Subheadline */}
        {subheadline && (
          <TextPublished
            value={subheadline}
            style={{
              color: textColors.muted,
              ...bodyTypography,
              textAlign: 'center',
              marginBottom: '3rem',
              maxWidth: '48rem',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          />
        )}

        {/* Role Scenarios */}
        <div className="space-y-8">
          {scenarios.map((item: Scenario) => (
            <div
              key={item.id}
              className="p-8 rounded-xl flex items-center space-x-8 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                WebkitBackdropFilter: cardStyles.backdropFilter,
                borderColor: cardStyles.borderColor,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                boxShadow: cardStyles.boxShadow
              }}
            >
              {/* Role Avatar Circle - Initials only */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(to bottom right, ${themeColors.gradientStart}, ${themeColors.gradientEnd})`,
                  color: '#ffffff'
                }}
              >
                <span className="font-bold text-lg">{getInitials(item.role)}</span>
              </div>

              {/* Role Content */}
              <div className="flex-1">
                {/* Role Name */}
                <h3
                  className="font-bold mb-3"
                  style={{
                    color: cardStyles.textHeading,
                    fontSize: '1.125rem'
                  }}
                >
                  {item.role}
                </h3>

                {/* Scenario Description */}
                <TextPublished
                  value={item.scenario}
                  style={{
                    color: cardStyles.textBody,
                    lineHeight: '1.5rem'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Text */}
        {footer_text && (
          <TextPublished
            value={footer_text}
            style={{
              color: textColors.muted,
              ...bodyTypography,
              textAlign: 'center',
              marginTop: '3rem',
              maxWidth: '48rem',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          />
        )}
      </div>
    </SectionWrapperPublished>
  );
}
