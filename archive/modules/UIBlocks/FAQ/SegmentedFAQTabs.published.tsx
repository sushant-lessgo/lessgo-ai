/**
 * SegmentedFAQTabs - Published Version (V2 Schema)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Consumes nested tabs[].items[] array format
 *
 * Note: Shows all tabs content in published mode (no interactive tab switching)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// FAQ item structure (V2)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Tab structure with nested items
interface Tab {
  id: string;
  label: string;
  items: FAQItem[];
}

// Theme-based accent colors for active tab indicator (keep themed)
const getTabAccentColors = (theme: 'warm' | 'cool' | 'neutral') => ({
  warm: { activeBg: '#f97316', activeText: '#ffffff' },
  cool: { activeBg: '#3b82f6', activeText: '#ffffff' },
  neutral: { activeBg: '#374151', activeText: '#ffffff' }
})[theme];

export default function SegmentedFAQTabsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, manualThemeOverride } = props;

  // Extract content from props
  const headline = props.headline || 'Everything You Need to Know';
  const subheadline = props.subheadline || '';
  const contactPrompt = props.contact_prompt || '';
  const ctaText = props.cta_text || '';
  const supportingText = props.supporting_text || '';

  // Extract tabs array (V2 format)
  const tabs: Tab[] = props.tabs || [];

  // Determine UIBlock theme
  const uiBlockTheme: 'warm' | 'cool' | 'neutral' = manualThemeOverride || 'neutral';
  const tabAccent = getTabAccentColors(uiBlockTheme);

  // Get luminance and card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Tab Navigation - Static display for published */}
        <div
          className="flex flex-wrap justify-center gap-4 mt-12 mb-8 pb-4"
          style={{
            borderBottom: `1px solid ${cardStyles.borderColor}`
          }}
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="px-6 py-3 font-medium rounded-t-lg"
              style={{
                backgroundColor: index === 0 ? tabAccent.activeBg : 'transparent',
                color: index === 0 ? tabAccent.activeText : textColors.body
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Show all tabs content in published mode for SEO */}
        {tabs.map((tab, tabIndex) => (
          <div
            key={tab.id}
            className={tabIndex > 0 ? 'mt-12' : ''}
          >
            {/* Tab section header (for tabs after first) */}
            {tabIndex > 0 && (
              <h3
                style={{
                  color: textColors.heading,
                  ...h3Typography,
                  marginBottom: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${cardStyles.borderColor}`
                }}
              >
                {tab.label}
              </h3>
            )}

            {/* FAQ Items */}
            <div className="space-y-6">
              {tab.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: cardStyles.bg,
                    backdropFilter: cardStyles.backdropFilter,
                    borderColor: cardStyles.borderColor,
                    borderWidth: cardStyles.borderWidth,
                    borderStyle: cardStyles.borderStyle,
                    boxShadow: cardStyles.boxShadow
                  }}
                >
                  <div className="mb-3">
                    <TextPublished
                      value={item.question}
                      style={{
                        color: cardStyles.textHeading,
                        ...h3Typography,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {item.answer && (
                    <TextPublished
                      value={item.answer}
                      style={{
                        color: cardStyles.textBody,
                        lineHeight: '1.75rem'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA Footer */}
        {(contactPrompt || ctaText) && (
          <div
            className="mt-10 pt-6 text-center"
            style={{ borderTop: `1px solid ${cardStyles.borderColor}` }}
          >
            {contactPrompt && (
              <TextPublished
                value={contactPrompt}
                style={{
                  color: textColors.body,
                  marginBottom: '0.5rem'
                }}
              />
            )}
            {ctaText && (
              <TextPublished
                value={ctaText}
                style={{
                  color: cardStyles.textHeading,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              />
            )}
            {supportingText && (
              <TextPublished
                value={supportingText}
                style={{
                  color: textColors.body,
                  opacity: 0.7,
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
