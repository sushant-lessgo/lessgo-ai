/**
 * AccordionFAQ - Published Version (V2 Schema)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Consumes faq_items array format
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

// Theme-based accordion colors (static for SSR)
const getAccordionColors = (theme: 'warm' | 'cool' | 'neutral') => ({
  warm: {
    border: '#fed7aa', // orange-200
    answerBg: '#fff7ed', // orange-50
    divider: '#ffedd5', // orange-100
    link: '#ea580c' // orange-600
  },
  cool: {
    border: '#bfdbfe', // blue-200
    answerBg: '#eff6ff', // blue-50
    divider: '#dbeafe', // blue-100
    link: '#2563eb' // blue-600
  },
  neutral: {
    border: '#e5e7eb', // gray-200
    answerBg: '#f9fafb', // gray-50
    divider: '#e5e7eb', // gray-200
    link: '#4b5563' // gray-600
  }
})[theme];

export default function AccordionFAQPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, manualThemeOverride } = props;

  // Extract content from props
  const headline = props.headline || 'Frequently Asked Questions';
  const subheadline = props.subheadline || '';
  const contactPrompt = props.contact_prompt || '';
  const ctaText = props.cta_text || '';
  const supportingText = props.supporting_text || '';

  // Extract faq_items array (V2 format)
  const faqItems: FAQItem[] = props.faq_items || [];

  // Determine UIBlock theme
  const uiBlockTheme: 'warm' | 'cool' | 'neutral' = manualThemeOverride || 'neutral';
  const themeColors = getAccordionColors(uiBlockTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
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

          {/* Subheadline */}
          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                maxWidth: '42rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* FAQ Items - All Expanded for Published */}
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden shadow-sm"
              style={{
                borderColor: themeColors.border
              }}
            >
              {/* Question */}
              <div
                className="px-6 py-4"
                style={{
                  backgroundColor: '#ffffff'
                }}
              >
                <TextPublished
                  value={item.question}
                  style={{
                    fontWeight: 600,
                    color: textColors.heading
                  }}
                />
              </div>

              {/* Answer */}
              <div
                className="px-6 py-4 border-t"
                style={{
                  backgroundColor: themeColors.answerBg,
                  borderTopColor: themeColors.divider
                }}
              >
                <TextPublished
                  value={item.answer}
                  style={{
                    color: textColors.body,
                    lineHeight: '1.75rem'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA Footer - subtle, no big button */}
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
