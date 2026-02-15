/**
 * AccordionFAQ - Published Version (V2 Schema)
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 * Consumes faq_items array format
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

  // Get luminance and card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

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
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: cardStyles.bg,
                backdropFilter: cardStyles.backdropFilter,
                borderColor: cardStyles.borderColor,
                borderWidth: cardStyles.borderWidth,
                borderStyle: cardStyles.borderStyle,
                boxShadow: cardStyles.boxShadow
              }}
            >
              {/* Question */}
              <div className="px-6 py-4">
                <TextPublished
                  value={item.question}
                  style={{
                    fontWeight: 600,
                    color: cardStyles.textHeading
                  }}
                />
              </div>

              {/* Answer */}
              <div
                className="px-6 py-4 border-t"
                style={{
                  borderTopColor: cardStyles.borderColor
                }}
              >
                <TextPublished
                  value={item.answer}
                  style={{
                    color: cardStyles.textBody,
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
