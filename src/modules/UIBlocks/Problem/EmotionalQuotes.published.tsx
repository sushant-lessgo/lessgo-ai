/**
 * EmotionalQuotes - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Theme colors helper (HEX VALUES for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      quoteIcon: '#fb923c', // orange-400
      cardBorder: '#fed7aa', // orange-200
      cardHoverBorder: '#fdba74', // orange-300
      impactBg: '#fff7ed', // orange-50
      impactBorder: '#fed7aa', // orange-200
      impactText: '#9a3412', // orange-800
      impactIcon: '#ea580c', // orange-600
      contextBg: '#fff7ed', // orange-50
      contextBorder: '#ffedd5' // orange-100
    },
    cool: {
      quoteIcon: '#60a5fa', // blue-400
      cardBorder: '#bfdbfe', // blue-200
      cardHoverBorder: '#93c5fd', // blue-300
      impactBg: '#eff6ff', // blue-50
      impactBorder: '#bfdbfe', // blue-200
      impactText: '#1e3a8a', // blue-900
      impactIcon: '#2563eb', // blue-600
      contextBg: '#eff6ff', // blue-50
      contextBorder: '#dbeafe' // blue-100
    },
    neutral: {
      quoteIcon: '#9ca3af', // gray-400
      cardBorder: '#e5e7eb', // gray-200
      cardHoverBorder: '#d1d5db', // gray-300
      impactBg: '#fefce8', // yellow-50
      impactBorder: '#fef08a', // yellow-200
      impactText: '#854d0e', // yellow-800
      impactIcon: '#ca8a04', // yellow-600
      contextBg: '#f9fafb', // gray-50
      contextBorder: '#f3f4f6' // gray-100
    }
  }[theme];
};

// Server-safe QuoteCard component
const QuoteCardPublished = ({
  quote,
  attribution,
  category,
  icon,
  themeColors,
  backgroundType
}: {
  quote: string;
  attribution: string;
  category: string;
  icon: string;
  themeColors: ReturnType<typeof getThemeColors>;
  backgroundType: string;
}) => {
  // Card styling based on background type
  const cardStyle: React.CSSProperties = backgroundType === 'primary'
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }
    : {
        backgroundColor: '#ffffff',
        borderColor: themeColors.cardBorder
      };

  return (
    <div className="relative p-8 rounded-2xl border transition-all duration-300" style={cardStyle}>
      {/* Quote Icon */}
      <div className="mb-6">
        <svg className="w-12 h-12" fill={themeColors.quoteIcon} viewBox="0 0 32 32">
          <path d="M13.8 9.6L13.8 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L15.5 12c-0.5-1.5-1.9-2.4-3.5-2.4H13.8z"/>
          <path d="M24.2 9.6L24.2 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L25.9 12c-0.5-1.5-1.9-2.4-3.5-2.4H24.2z"/>
        </svg>
      </div>

      {/* Quote Text */}
      <blockquote className="text-lg leading-relaxed mb-6 italic text-gray-700">
        "{quote}"
      </blockquote>

      {/* Attribution and Category */}
      <div className="flex items-center space-x-3">
        {/* Icon Badge */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#3B82F6' }}>
          <IconPublished value={icon} size="md" />
        </div>

        <div className="flex-1">
          <div className="font-semibold text-gray-900">{attribution}</div>
          <div className="text-sm text-gray-600 mt-1">{category}</div>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function EmotionalQuotesPublished(props: LayoutComponentProps) {
  // Extract props
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content fields
  const headline = props.headline || "You're Not Alone in This Struggle";
  const subheadline = props.subheadline;
  const relatable_intro = props.relatable_intro;
  const emotional_quotes = props.emotional_quotes || '';
  const quote_attributions = props.quote_attributions || '';
  const quote_categories = props.quote_categories || '';
  const context_text = props.context_text;
  const emotional_impact = props.emotional_impact;
  const supporting_text = props.supporting_text;
  const trust_items = props.trust_items;

  // Parse pipe-separated values
  const quotes = emotional_quotes.split('|').map(q => q.trim()).filter(Boolean);
  const attributions = quote_attributions.split('|').map(a => a.trim()).filter(Boolean);
  const categories = quote_categories.split('|').map(c => c.trim()).filter(Boolean);
  const trustItemsList = trust_items ? trust_items.split('|').map(t => t.trim()).filter(Boolean) : [];

  // Get category icons
  const icons = [
    props.category_icon_1 || '💡',
    props.category_icon_2 || '💡',
    props.category_icon_3 || '💡',
    props.category_icon_4 || '💡',
    props.category_icon_5 || '💡',
  ];

  // Combine data
  const quoteData = quotes.map((quote, index) => ({
    text: quote,
    attribution: attributions[index] || 'Anonymous Business Owner',
    category: categories[index] || 'Business Challenge',
    icon: icons[index]
  }));

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  const colors = getThemeColors(uiBlockTheme);
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

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
              ...h2Typography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                marginBottom: '2rem',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}

          {relatable_intro && relatable_intro.trim() !== '' && (
            <div className="max-w-4xl mx-auto mb-8">
              <TextPublished
                value={relatable_intro}
                style={{
                  color: textColors.body,
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem'
                }}
              />
            </div>
          )}
        </div>

        {/* Quote Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {quoteData.map((quote, index) => (
            <QuoteCardPublished
              key={index}
              quote={quote.text}
              attribution={quote.attribution}
              category={quote.category}
              icon={quote.icon}
              themeColors={colors}
              backgroundType={backgroundType || 'neutral'}
            />
          ))}
        </div>

        {/* Context and Emotional Impact */}
        {(context_text || emotional_impact) && (
          <div
            className="rounded-2xl p-8 border mb-12"
            style={{
              backgroundColor: colors.contextBg,
              borderColor: colors.contextBorder
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              {context_text && context_text.trim() !== '' && (
                <div className="mb-6">
                  <TextPublished
                    value={context_text}
                    style={{
                      color: textColors.body,
                      fontSize: '1.125rem',
                      lineHeight: '1.75rem'
                    }}
                  />
                </div>
              )}

              {emotional_impact && emotional_impact.trim() !== '' && (
                <div
                  className="border rounded-xl p-6"
                  style={{
                    backgroundColor: colors.impactBg,
                    borderColor: colors.impactBorder
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-8 h-8" fill="none" stroke={colors.impactIcon} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-xl font-semibold" style={{ color: colors.impactText }}>
                      {emotional_impact}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supporting Text and Trust Indicators */}
        {(supporting_text || trustItemsList.length > 0) && (
          <div className="text-center space-y-6 mt-12">
            {supporting_text && supporting_text.trim() !== '' && (
              <div className="max-w-3xl mx-auto mb-8">
                <TextPublished
                  value={supporting_text}
                  style={{ color: textColors.body }}
                />
              </div>
            )}

            {trustItemsList.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 items-center text-sm">
                {trustItemsList.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ color: textColors.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
