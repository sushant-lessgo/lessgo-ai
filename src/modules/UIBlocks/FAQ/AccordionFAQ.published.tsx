/**
 * AccordionFAQ - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

// FAQ item structure
interface FAQItem {
  question: string;
  answer: string;
}

export default function AccordionFAQPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Frequently Asked Questions';
  const subheadline = props.subheadline || '';

  // Extract individual Q&A fields (question_1 to question_5, answer_1 to answer_5)
  const question_1 = props.question_1 || '';
  const answer_1 = props.answer_1 || '';
  const question_2 = props.question_2 || '';
  const answer_2 = props.answer_2 || '';
  const question_3 = props.question_3 || '';
  const answer_3 = props.answer_3 || '';
  const question_4 = props.question_4 || '';
  const answer_4 = props.answer_4 || '';
  const question_5 = props.question_5 || '';
  const answer_5 = props.answer_5 || '';

  // Legacy fields for backward compatibility
  const questions_legacy = props.questions || '';
  const answers_legacy = props.answers || '';

  // Build FAQ items array
  const faqItems: FAQItem[] = [];

  // First try individual fields
  const individualQuestions = [question_1, question_2, question_3, question_4, question_5];
  const individualAnswers = [answer_1, answer_2, answer_3, answer_4, answer_5];

  for (let i = 0; i < 5; i++) {
    const question = individualQuestions[i];
    const answer = individualAnswers[i];

    if (question && question.trim() !== '' && question !== '___REMOVED___') {
      faqItems.push({
        question: question.trim(),
        answer: (answer && answer !== '___REMOVED___') ? answer.trim() : 'Answer not provided.'
      });
    }
  }

  // Fallback to legacy format if no individual items found
  if (faqItems.length === 0 && questions_legacy) {
    const questionList = questions_legacy.split('|').map(q => q.trim()).filter(q => q && q !== '___REMOVED___');
    const answerList = answers_legacy ? answers_legacy.split('|').map(a => a.trim()) : [];

    questionList.forEach((question, index) => {
      faqItems.push({
        question,
        answer: (answerList[index] && answerList[index] !== '___REMOVED___') ? answerList[index] : 'Answer not provided.'
      });
    });
  }

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

        {/* FAQ Items - All Expanded */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={`faq-${index}`}
              className="border rounded-lg overflow-hidden shadow-sm"
              style={{
                borderColor: '#e5e7eb'
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
                  backgroundColor: '#f9fafb',
                  borderTopColor: '#e5e7eb'
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
      </div>
    </SectionWrapperPublished>
  );
}
