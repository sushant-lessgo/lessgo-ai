/**
 * CustomerJourneyFlow - Published Version
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

interface JourneyStage {
  title: string;
  description: string;
  icon: string;
  stageNumber: number;
}

export default function CustomerJourneyFlowPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract headline
  const headline = props.headline || 'Customer Journey Optimization';

  // Extract footer content
  const footerTitle = props.footer_title || '';
  const footerDescription = props.footer_description || '';

  // Extract journey stages - filter out empty and removed
  const stageFields = [
    { title: props.journey_stage_1, desc: props.stage_description_1, icon: props.stage_icon_1 || '👀' },
    { title: props.journey_stage_2, desc: props.stage_description_2, icon: props.stage_icon_2 || '💫' },
    { title: props.journey_stage_3, desc: props.stage_description_3, icon: props.stage_icon_3 || '⚖️' },
    { title: props.journey_stage_4, desc: props.stage_description_4, icon: props.stage_icon_4 || '💳' },
    { title: props.journey_stage_5, desc: props.stage_description_5, icon: props.stage_icon_5 || '🚀' },
    { title: props.journey_stage_6, desc: props.stage_description_6, icon: props.stage_icon_6 || '🤝' }
  ];

  // Build stages array - filter out empty/removed
  const stages: JourneyStage[] = stageFields
    .map((stage, idx) => ({
      title: stage.title || '',
      description: stage.desc || '',
      icon: stage.icon,
      stageNumber: idx + 1
    }))
    .filter(stage => stage.title && stage.title.trim() !== '' && stage.title !== '___REMOVED___');

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme-specific colors (HEX for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        connectingLine: '#fed7aa',      // orange-200
        gradientStart: '#f97316',       // orange-500
        gradientEnd: '#ea580c',         // orange-600
        stageText: '#ffffff',           // white
        footerBg: '#fff7ed',            // orange-50
        footerBorder: '#fed7aa',        // orange-200
        footerTitle: '#7c2d12',         // orange-900
        footerDesc: '#c2410c'           // orange-700
      },
      cool: {
        connectingLine: '#bfdbfe',      // blue-200
        gradientStart: '#3b82f6',       // blue-500
        gradientEnd: '#4f46e5',         // indigo-600
        stageText: '#ffffff',           // white
        footerBg: '#eff6ff',            // blue-50
        footerBorder: '#bfdbfe',        // blue-200
        footerTitle: '#1e3a8a',         // blue-900
        footerDesc: '#1d4ed8'           // blue-700
      },
      neutral: {
        connectingLine: '#e5e7eb',      // gray-200
        gradientStart: '#6b7280',       // gray-500
        gradientEnd: '#4b5563',         // gray-600
        stageText: '#ffffff',           // white
        footerBg: '#f9fafb',            // gray-50
        footerBorder: '#e5e7eb',        // gray-200
        footerTitle: '#111827',         // gray-900
        footerDesc: '#374151'           // gray-700
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);
  const textColors = getPublishedTextColors(backgroundType || 'primary', theme, sectionBackgroundCSS);
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const titleTypography = getPublishedTypographyStyles('h3', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Determine grid columns based on stage count
  const getGridCols = (count: number) => {
    if (count <= 3) return 'lg:grid-cols-3';
    if (count === 4) return 'lg:grid-cols-4';
    if (count === 5) return 'lg:grid-cols-5';
    return 'lg:grid-cols-6';
  };

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
            marginBottom: '4rem'
          }}
        />

        {/* Journey Stages Container */}
        <div className="relative">
          {/* Connecting Line */}
          <div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2"
            style={{ backgroundColor: themeColors.connectingLine }}
          />

          {/* Stages Grid */}
          <div className={`grid gap-8 ${getGridCols(stages.length)}`}>
            {stages.map((stage, index) => (
              <div key={index} className="relative text-center">
                {/* Stage Circle */}
                <div
                  className="relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold mx-auto mb-4 shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${themeColors.gradientStart}, ${themeColors.gradientEnd})`,
                    color: themeColors.stageText
                  }}
                >
                  <div className="text-sm">{stage.stageNumber}</div>
                  <IconPublished
                    icon={stage.icon}
                    color={themeColors.stageText}
                    size={20}
                  />
                </div>

                {/* Stage Title */}
                <h3
                  className="font-bold mb-2"
                  style={{
                    color: textColors.heading,
                    fontSize: '1.125rem'
                  }}
                >
                  {stage.title}
                </h3>

                {/* Stage Description */}
                <TextPublished
                  value={stage.description}
                  style={{
                    color: textColors.muted,
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        {(footerTitle || footerDescription) && (
          <div
            className="mt-16 rounded-2xl p-8 text-center border"
            style={{
              backgroundColor: themeColors.footerBg,
              borderColor: themeColors.footerBorder
            }}
          >
            {footerTitle && (
              <HeadlinePublished
                value={footerTitle}
                level="h3"
                style={{
                  color: themeColors.footerTitle,
                  ...titleTypography,
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}
              />
            )}
            {footerDescription && (
              <TextPublished
                value={footerDescription}
                style={{
                  color: themeColors.footerDesc,
                  ...bodyTypography
                }}
              />
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
