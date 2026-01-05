/**
 * RoleBasedScenarios - Published Version
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

interface RoleScenario {
  role: string;
  scenario: string;
  icon: string;
  initials: string;
}

export default function RoleBasedScenariosPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract headline
  const headline = props.headline || 'Perfect for Every Role';

  // Extract roles and scenarios from pipe-separated fields
  const rolesString = props.roles || '';
  const scenariosString = props.scenarios || '';

  const roles = rolesString.split('|').map(r => r.trim()).filter(Boolean);
  const scenarios = scenariosString.split('|').map(s => s.trim()).filter(Boolean);

  // Extract role icons
  const iconFields = [
    props.role_icon_1 || '📋',
    props.role_icon_2 || '🔧',
    props.role_icon_3 || '📊',
    props.role_icon_4 || '🎯',
    props.role_icon_5 || '⚙️',
    props.role_icon_6 || '📈'
  ];

  // Build scenarios array
  const roleScenarios: RoleScenario[] = roles.map((role, idx) => ({
    role,
    scenario: scenarios[idx] || 'Role-specific scenario',
    icon: iconFields[idx] || '📋',
    initials: role.split(' ').map(w => w[0]).join('')
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        gradientStart: '#f97316',    // orange-500
        gradientEnd: '#ea580c',      // orange-600
        cardBorder: '#fed7aa',       // orange-200
        iconText: '#ffffff'          // white
      },
      cool: {
        gradientStart: '#3b82f6',    // blue-500
        gradientEnd: '#4f46e5',      // indigo-600
        cardBorder: '#e5e7eb',       // gray-200
        iconText: '#ffffff'          // white
      },
      neutral: {
        gradientStart: '#6b7280',    // gray-500
        gradientEnd: '#4b5563',      // gray-600
        cardBorder: '#e5e7eb',       // gray-200
        iconText: '#ffffff'          // white
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'secondary', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);

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
            marginBottom: '4rem'
          }}
        />

        {/* Role Scenarios */}
        <div className="space-y-8">
          {roleScenarios.map((item, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl flex items-center space-x-8 border"
              style={{ borderColor: themeColors.cardBorder }}
            >
              {/* Role Icon Circle */}
              <div
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(to bottom right, ${themeColors.gradientStart}, ${themeColors.gradientEnd})`,
                  color: themeColors.iconText
                }}
              >
                <div className="text-xs font-bold">{item.initials}</div>
                <IconPublished
                  icon={item.icon}
                  color={themeColors.iconText}
                  size={24}
                />
              </div>

              {/* Role Content */}
              <div className="flex-1">
                {/* Role Name */}
                <h3
                  className="font-bold mb-3"
                  style={{
                    color: textColors.heading,
                    fontSize: '1.125rem'
                  }}
                >
                  {item.role}
                </h3>

                {/* Scenario Description */}
                <TextPublished
                  value={item.scenario}
                  style={{
                    color: textColors.muted,
                    lineHeight: '1.5rem'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
