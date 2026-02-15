/**
 * TwoColumnFAQ - Published Version
 * V2 Schema - Clean array format
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

export default function TwoColumnFAQPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, manualThemeOverride } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Frequently Asked Questions';
  const subheadline = props.subheadline || '';
  const contact_prompt = props.contact_prompt as string || '';
  const cta_text = props.cta_text as string || '';
  const supporting_text = props.supporting_text as string || '';

  // Get FAQ items from props (V2 - direct array)
  const faqItems: FAQItem[] = (props.faq_items as FAQItem[]) || [];

  // Split items into two columns (first half = left, second half = right)
  const midpoint = Math.ceil(faqItems.length / 2);
  const leftItems = faqItems.slice(0, midpoint);
  const rightItems = faqItems.slice(midpoint);

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

  // Render a single FAQ item with divider
  const renderFAQItem = (item: FAQItem) => (
    <div
      key={item.id}
      className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0"
      style={{ borderBottomColor: cardStyles.borderColor }}
    >
      <TextPublished
        value={item.question}
        style={{
          color: cardStyles.textHeading,
          ...questionTypography,
          fontWeight: 600
        }}
      />

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
  );

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline.trim() !== '' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                textAlign: 'center',
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column */}
          <div className="space-y-8">
            {leftItems.map(renderFAQItem)}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {rightItems.map(renderFAQItem)}
          </div>
        </div>

        {/* Contact CTA Footer */}
        {(contact_prompt || cta_text) && (
          <div className="mt-10 pt-6 text-center">
            {contact_prompt && (
              <TextPublished
                value={contact_prompt}
                style={{
                  color: textColors.body,
                  marginBottom: '0.5rem'
                }}
              />
            )}
            {cta_text && (
              <TextPublished
                value={cta_text}
                style={{
                  color: cardStyles.textHeading,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              />
            )}
            {supporting_text && (
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
