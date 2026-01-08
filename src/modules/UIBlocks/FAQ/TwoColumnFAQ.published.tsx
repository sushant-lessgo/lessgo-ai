/**
 * TwoColumnFAQ - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

interface TwoColumnFAQContent {
  headline: string;
  subheadline?: string;
  // Left column Q&A (up to 3 items)
  left_question_1: string;
  left_answer_1: string;
  left_question_2: string;
  left_answer_2: string;
  left_question_3: string;
  left_answer_3: string;
  // Right column Q&A (up to 3 items)
  right_question_1: string;
  right_answer_1: string;
  right_question_2: string;
  right_answer_2: string;
  right_question_3: string;
  right_answer_3: string;
  // Legacy fields for backward compatibility
  questions_left?: string;
  answers_left?: string;
  questions_right?: string;
  answers_right?: string;
}

export default function TwoColumnFAQPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Frequently Asked Questions';
  const subheadline = props.subheadline || '';

  // Helper function to get column FAQ items
  const getColumnFAQItems = (column: 'left' | 'right') => {
    const items: Array<{question: string; answer: string; index: number}> = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const question = props[`${column}_question_${i}` as keyof typeof props];
      const answer = props[`${column}_answer_${i}` as keyof typeof props];

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
      const questionsKey = `questions_${column}` as keyof typeof props;
      const answersKey = `answers_${column}` as keyof typeof props;

      const questionsRaw = props[questionsKey];
      const answersRaw = props[answersKey];

      const questions = (typeof questionsRaw === 'string' ? questionsRaw.split('|').map((q: string) => q.trim()).filter(Boolean) : []);
      const answers = (typeof answersRaw === 'string' ? answersRaw.split('|').map((a: string) => a.trim()).filter(Boolean) : []);

      questions.forEach((question: string, index: number) => {
        items.push({
          question,
          answer: answers[index] || '',
          index: index + 1
        });
      });
    }

    return items;
  };

  const leftItems = getColumnFAQItems('left');
  const rightItems = getColumnFAQItems('right');

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
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-6">
            {leftItems.map((item) => (
              <div key={`left-${item.index}`} className="space-y-3">
                <TextPublished
                  value={item.question}
                  style={{
                    color: textColors.heading,
                    ...questionTypography,
                    fontWeight: 600
                  }}
                />

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

          {/* Right Column */}
          <div className="space-y-6">
            {rightItems.map((item) => (
              <div key={`right-${item.index}`} className="space-y-3">
                <TextPublished
                  value={item.question}
                  style={{
                    color: textColors.heading,
                    ...questionTypography,
                    fontWeight: 600
                  }}
                />

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
      </div>
    </SectionWrapperPublished>
  );
}
