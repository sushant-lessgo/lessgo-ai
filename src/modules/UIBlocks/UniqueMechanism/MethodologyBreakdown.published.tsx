/**
 * MethodologyBreakdown - Published Version
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

// Principle item structure
interface PrincipleItem {
  name: string;
  detail: string;
  icon: string;
}

// Result item structure
interface ResultItem {
  metric: string;
  label: string;
}

// Parse principle data from pipe-separated strings
const parsePrincipleData = (
  principles: string,
  details: string,
  icons: string[]
): PrincipleItem[] => {
  const principleList = principles.split('|').map(p => p.trim()).filter(p => p && p !== '___REMOVED___');
  const detailList = details.split('|').map(d => d.trim());

  return principleList.map((name, index) => ({
    name,
    detail: detailList[index] || 'Detail not provided.',
    icon: icons[index] || '🎯'
  }));
};

// Parse result data from pipe-separated strings
const parseResultData = (metrics: string, labels: string): ResultItem[] => {
  const metricList = metrics.split('|').map(m => m.trim()).filter(m => m && m !== '___REMOVED___');
  const labelList = labels.split('|').map(l => l.trim());

  return metricList.map((metric, index) => ({
    metric,
    label: labelList[index] || 'Result'
  }));
};

export default function MethodologyBreakdownPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const headline = props.headline || 'The Science Behind Our Success';
  const methodology_name = props.methodology_name || 'Adaptive Intelligence Framework™';
  const methodology_description = props.methodology_description || '';
  const methodology_icon = props.methodology_icon || '🧠';
  const principles = props.principles || '';
  const principle_details = props.principle_details || '';
  const result_metrics = props.result_metrics || '';
  const result_labels = props.result_labels || '';
  const results_title = props.results_title || '';

  // Extract principle icons (up to 6)
  const icons = [
    props.principle_icon_1 || '🧠',
    props.principle_icon_2 || '⚙️',
    props.principle_icon_3 || '📊',
    props.principle_icon_4 || '🎯',
    props.principle_icon_5 || '🚀',
    props.principle_icon_6 || '💡'
  ];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Parse data
  const principleItems = parsePrincipleData(principles, principle_details, icons);
  const resultItems = result_metrics && result_labels
    ? parseResultData(result_metrics, result_labels)
    : [];

  // Get theme colors (HEX values for inline styles)
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        headerGradient: 'linear-gradient(to right, #ea580c 0%, #dc2626 100%)', // orange-600 to red-600
        headerIconBg: 'rgba(255, 255, 255, 0.2)',
        headerText: '#ffffff',
        headerSubtext: '#ffedd5', // orange-100
        principleIconGradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)', // orange-500 to red-600
        principleCardBorder: '#e5e7eb', // gray-200
        principleCardBorderHover: '#fed7aa', // orange-200
        resultMetricText: '#ea580c' // orange-600
      },
      cool: {
        headerGradient: 'linear-gradient(to right, #2563eb 0%, #4338ca 100%)', // blue-600 to indigo-700
        headerIconBg: 'rgba(255, 255, 255, 0.2)',
        headerText: '#ffffff',
        headerSubtext: '#dbeafe', // blue-100
        principleIconGradient: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)', // blue-500 to indigo-600
        principleCardBorder: '#e5e7eb',
        principleCardBorderHover: '#bfdbfe', // blue-200
        resultMetricText: '#2563eb' // blue-600
      },
      neutral: {
        headerGradient: 'linear-gradient(to right, #374151 0%, #1f2937 100%)', // gray-700 to gray-800
        headerIconBg: 'rgba(255, 255, 255, 0.2)',
        headerText: '#ffffff',
        headerSubtext: '#e5e7eb', // gray-200
        principleIconGradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)', // gray-500 to gray-700
        principleCardBorder: '#e5e7eb',
        principleCardBorderHover: '#d1d5db', // gray-300
        resultMetricText: '#374151' // gray-700
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors for headline
  const textColors = getPublishedTextColors(
    backgroundType || 'secondary',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);

  // Determine grid layout based on principle count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem'
            }}
          />
        </div>

        {/* Methodology Header */}
        <div
          className="rounded-2xl p-12 text-white text-center mb-12"
          style={{ background: themeColors.headerGradient }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: themeColors.headerIconBg }}
          >
            <IconPublished
              value={methodology_icon}
              size="xl"
              className="text-white text-3xl"
            />
          </div>

          <HeadlinePublished
            value={methodology_name}
            level="h2"
            style={{
              color: themeColors.headerText,
              marginBottom: '1rem',
              fontSize: '1.875rem',
              fontWeight: 700
            }}
          />

          {methodology_description && (
            <TextPublished
              value={methodology_description}
              style={{
                color: themeColors.headerSubtext,
                fontSize: '1.125rem',
                lineHeight: '1.75rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Key Principles */}
        {principleItems.length > 0 && (
          <div className={`grid gap-6 lg:gap-8 mb-12 ${getGridClass(principleItems.length)}`}>
            {principleItems.map((item, index) => {
              const [isHovered, setIsHovered] = React.useState(false);

              return (
                <div
                  key={`principle-${index}`}
                  className="relative bg-white rounded-xl p-8 border hover:shadow-lg transition-all duration-300"
                  style={{
                    borderColor: isHovered
                      ? themeColors.principleCardBorderHover
                      : themeColors.principleCardBorder
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Principle icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4"
                    style={{ background: themeColors.principleIconGradient }}
                  >
                    <IconPublished value={item.icon} size="md" />
                  </div>

                  {/* Principle name */}
                  <TextPublished
                    value={item.name}
                    style={{
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      color: '#111827',
                      marginBottom: '0.75rem'
                    }}
                  />

                  {/* Principle detail */}
                  <TextPublished
                    value={item.detail}
                    style={{
                      color: '#4b5563',
                      lineHeight: '1.5',
                      minHeight: '48px'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Proven Results Section */}
        {resultItems.length > 0 && (
          <div className="mt-16">
            {results_title && (
              <HeadlinePublished
                value={results_title}
                level="h3"
                style={{
                  color: textColors.heading,
                  textAlign: 'center',
                  marginBottom: '2rem',
                  fontSize: '1.875rem',
                  fontWeight: 700
                }}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {resultItems.map((result, index) => (
                <div key={`result-${index}`} className="text-center">
                  <TextPublished
                    value={result.metric}
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 700,
                      color: themeColors.resultMetricText,
                      marginBottom: '0.5rem'
                    }}
                  />
                  <TextPublished
                    value={result.label}
                    style={{
                      color: '#4b5563',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
