/**
 * InlineQnAList - Published Version
 * V2 Schema - Clean array format, no numbered fields or pipe strings
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors, getPublishedCardStyles } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { analyzeBackground } from '@/utils/backgroundAnalysis';

// FAQ item structure (V2 - clean array format)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function InlineQnAListPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, manualThemeOverride } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Quick Questions & Answers';
  const subheadline = props.subheadline || '';
  const contact_prompt = props.contact_prompt || '';
  const cta_text = props.cta_text || '';
  const supporting_text = props.supporting_text || '';

  // Get FAQ items from props (direct array access)
  const getFAQItems = (): FAQItem[] => {
    const items = props.faq_items;
    if (Array.isArray(items)) return items;
    return [];
  };

  const faqItems = getFAQItems();

  // Determine UIBlock theme
  const uiBlockTheme: 'warm' | 'cool' | 'neutral' = manualThemeOverride || 'neutral';

  // Get luminance and card styles
  const { luminance } = analyzeBackground(sectionBackgroundCSS || '');
  const cardStyles = getPublishedCardStyles(luminance, uiBlockTheme);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const questionTypography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '0.75rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Simple Q&A List */}
        <div className="space-y-6">
          {faqItems.map((item, idx) => (
            <div
              key={item.id}
              className="pb-6 last:border-0"
              style={{
                borderBottom: idx === faqItems.length - 1 ? 'none' : `1px solid ${cardStyles.borderColor}`
              }}
            >
              <div className="mb-2">
                <TextPublished
                  value={item.question}
                  style={{
                    color: cardStyles.textHeading,
                    ...questionTypography,
                    fontWeight: 500
                  }}
                />
              </div>

              {item.answer && item.answer.trim() !== '' && (
                <TextPublished
                  value={item.answer}
                  style={{
                    color: cardStyles.textMuted,
                    lineHeight: '1.75'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA Footer */}
        {(contact_prompt || cta_text) && (
          <div
            className="mt-10 pt-6 text-center"
                      >
            {contact_prompt && contact_prompt.trim() !== '' && (
              <TextPublished
                value={contact_prompt}
                style={{
                  color: textColors.body,
                  marginBottom: '0.5rem'
                }}
              />
            )}
            {cta_text && cta_text.trim() !== '' && (
              <TextPublished
                value={cta_text}
                style={{
                  color: cardStyles.textHeading,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              />
            )}
            {supporting_text && supporting_text.trim() !== '' && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.muted,
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
