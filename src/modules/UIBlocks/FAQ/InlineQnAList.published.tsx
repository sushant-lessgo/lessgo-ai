/**
 * InlineQnAList - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

interface InlineQnAListContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 6 items)
  question_1: string;
  answer_1: string;
  question_2: string;
  answer_2: string;
  question_3: string;
  answer_3: string;
  question_4: string;
  answer_4: string;
  question_5: string;
  answer_5: string;
  question_6: string;
  answer_6: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
}

export default function InlineQnAListPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Quick Questions & Answers';
  const subheadline = props.subheadline || '';

  // Helper function to get FAQ items
  const getFAQItems = () => {
    const items = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 6; i++) {
      const question = props[`question_${i}` as keyof typeof props];
      const answer = props[`answer_${i}` as keyof typeof props];

      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          index: i
        });
      }
    }

    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsRaw = props.questions;
      const answersRaw = props.answers;

      const questions = (typeof questionsRaw === 'string' ? questionsRaw.split('|').map(q => q.trim()).filter(Boolean) : []);
      const answers = (typeof answersRaw === 'string' ? answersRaw.split('|').map(a => a.trim()).filter(Boolean) : []);

      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          index: index + 1
        });
      });
    }

    return items;
  };

  const faqItems = getFAQItems();

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

  // Border color based on background
  const borderColor = backgroundType === 'primary' || !backgroundType
    ? 'rgba(229, 231, 235, 1)' // gray-200
    : 'rgba(55, 65, 81, 0.3)'; // gray-700 with opacity

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
              key={item.index}
              className="pb-6 last:border-0"
              style={{
                borderBottom: idx === faqItems.length - 1 ? 'none' : `1px solid ${borderColor}`
              }}
            >
              <div className="mb-2">
                <TextPublished
                  value={item.question}
                  style={{
                    color: textColors.heading,
                    ...questionTypography,
                    fontWeight: 500
                  }}
                />
              </div>

              {item.answer && item.answer.trim() !== '' && (
                <TextPublished
                  value={item.answer}
                  style={{
                    color: textColors.muted,
                    lineHeight: '1.75'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
