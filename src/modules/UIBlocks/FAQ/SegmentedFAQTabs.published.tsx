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
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

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

// Theme-based tab colors (static for SSR)
const getTabColors = (theme: 'warm' | 'cool' | 'neutral') => ({
  warm: {
    activeBg: '#f97316', // orange-500
    activeText: '#ffffff',
    cardBg: '#fff7ed', // orange-50
    border: '#fed7aa', // orange-200
    divider: '#ffedd5', // orange-100
    link: '#ea580c' // orange-600
  },
  cool: {
    activeBg: '#3b82f6', // blue-500
    activeText: '#ffffff',
    cardBg: '#eff6ff', // blue-50
    border: '#bfdbfe', // blue-200
    divider: '#dbeafe', // blue-100
    link: '#2563eb' // blue-600
  },
  neutral: {
    activeBg: '#374151', // gray-700
    activeText: '#ffffff',
    cardBg: '#f9fafb', // gray-50
    border: '#e5e7eb', // gray-200
    divider: '#e5e7eb', // gray-200
    link: '#4b5563' // gray-600
  }
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
  const themeColors = getTabColors(uiBlockTheme);

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
            borderBottom: `1px solid ${themeColors.border}`
          }}
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="px-6 py-3 font-medium rounded-t-lg"
              style={{
                backgroundColor: index === 0 ? themeColors.activeBg : 'transparent',
                color: index === 0 ? themeColors.activeText : textColors.body
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
                  borderTop: `1px solid ${themeColors.divider}`
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
                    backgroundColor: themeColors.cardBg
                  }}
                >
                  <div className="mb-3">
                    <TextPublished
                      value={item.question}
                      style={{
                        color: textColors.heading,
                        ...h3Typography,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {item.answer && (
                    <TextPublished
                      value={item.answer}
                      style={{
                        color: textColors.body,
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
            style={{ borderTop: `1px solid ${themeColors.divider}` }}
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
                  color: themeColors.link,
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
