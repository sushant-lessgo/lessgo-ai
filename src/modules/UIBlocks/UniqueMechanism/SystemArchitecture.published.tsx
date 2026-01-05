/**
 * SystemArchitecture - Published Version
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

interface ComponentItem {
  name: string;
  icon: string;
}

export default function SystemArchitecturePublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Our Advanced System Architecture';

  // Get components - individual fields take priority
  const individualComponents = [
    props.component_1,
    props.component_2,
    props.component_3,
    props.component_4,
    props.component_5,
    props.component_6
  ].filter((c): c is string => Boolean(c && c.trim() !== '' && c !== '___REMOVED___'));

  const componentNames = individualComponents.length > 0
    ? individualComponents
    : (props.architecture_components || '').split('|').map(c => c.trim()).filter(Boolean);

  // Extract icons
  const icons = [
    props.component_icon_1 || '🧠',
    props.component_icon_2 || '📊',
    props.component_icon_3 || '🔗',
    props.component_icon_4 || '🔒',
    props.component_icon_5 || '💻',
    props.component_icon_6 || '📈'
  ];

  const components: ComponentItem[] = componentNames.map((name, index) => ({
    name,
    icon: icons[index] || '🏗️'
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme colors (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        iconBg: '#ffedd5',      // orange-100
        iconText: '#ea580c',    // orange-600
      },
      cool: {
        iconBg: '#dbeafe',      // blue-100
        iconText: '#2563eb',    // blue-600
      },
      neutral: {
        iconBg: '#f3f4f6',      // gray-100
        iconText: '#4b5563',    // gray-600
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Header */}
        <HeadlinePublished
          value={headline}
          level="h2"
          style={{
            color: textColors.heading,
            ...headlineTypography,
            marginBottom: '3rem'
          }}
        />

        {/* Component Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {components.map((component, index) => (
            <div
              key={`component-${index}`}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center"
                style={{
                  backgroundColor: themeColors.iconBg
                }}
              >
                <IconPublished
                  value={component.icon}
                  size="lg"
                  className="text-2xl"
                />
              </div>

              {/* Component Name */}
              <TextPublished
                value={component.name}
                style={{
                  fontWeight: 700,
                  color: '#111827',
                  ...bodyTypography
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
