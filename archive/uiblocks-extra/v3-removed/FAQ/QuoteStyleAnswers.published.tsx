/**
 * QuoteStyleAnswers - Published Version
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

interface QuoteStyleAnswersContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 3 items)
  question_1: string;
  answer_1: string;
  expert_name_1: string;
  expert_title_1: string;
  question_2: string;
  answer_2: string;
  expert_name_2: string;
  expert_title_2: string;
  question_3: string;
  answer_3: string;
  expert_name_3: string;
  expert_title_3: string;
  // Customization
  show_quote_mark?: boolean;
  quote_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
  expert_names?: string;
  expert_titles?: string;
}

export default function QuoteStyleAnswersPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Expert Insights & Answers';
  const subheadline = props.subheadline || '';
  const showQuoteMark = props.show_quote_mark !== false; // default true
  const quoteIcon = props.quote_icon || '💬';

  // Helper function to get FAQ items with expert info
  const getFAQItems = (): Array<{question: string; answer: string; expertName: string; expertTitle: string; index: number}> => {
    const items: Array<{question: string; answer: string; expertName: string; expertTitle: string; index: number}> = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const question = props[`question_${i}` as keyof typeof props];
      const answer = props[`answer_${i}` as keyof typeof props];
      const expertName = props[`expert_name_${i}` as keyof typeof props];
      const expertTitle = props[`expert_title_${i}` as keyof typeof props];

      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          expertName: (expertName && typeof expertName === 'string' && expertName !== '___REMOVED___') ? expertName.trim() : 'Expert',
          expertTitle: (expertTitle && typeof expertTitle === 'string' && expertTitle !== '___REMOVED___') ? expertTitle.trim() : 'Senior Executive',
          index: i
        });
      }
    }

    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsRaw = props.questions;
      const answersRaw = props.answers;
      const expertNamesRaw = props.expert_names;
      const expertTitlesRaw = props.expert_titles;

      const questions = (typeof questionsRaw === 'string' ? questionsRaw.split('|').map((q: string) => q.trim()).filter(Boolean) : []);
      const answers = (typeof answersRaw === 'string' ? answersRaw.split('|').map((a: string) => a.trim()).filter(Boolean) : []);
      const expertNames = (typeof expertNamesRaw === 'string' ? expertNamesRaw.split('|').map((n: string) => n.trim()).filter(Boolean) : []);
      const expertTitles = (typeof expertTitlesRaw === 'string' ? expertTitlesRaw.split('|').map((t: string) => t.trim()).filter(Boolean) : []);

      questions.forEach((question: string, index: number) => {
        items.push({
          question,
          answer: answers[index] || '',
          expertName: expertNames[index] || 'Expert',
          expertTitle: expertTitles[index] || 'Senior Executive',
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
  const questionTypography = getPublishedTypographyStyles('h2', theme);

  // Accent color
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-5xl mx-auto">
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

        {/* Quote-style Q&As */}
        <div className="space-y-10">
          {faqItems.map((item) => (
            <div key={item.index} className="relative">
              {/* Question */}
              <div className="mb-4">
                <TextPublished
                  value={item.question}
                  style={{
                    color: textColors.heading,
                    ...questionTypography,
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Quote Block */}
              <div
                className="relative pl-8"
                style={{
                  borderLeft: `4px solid ${accentColor}`
                }}
              >
                {/* Large Quote Icon */}
                {showQuoteMark && (
                  <div
                    className="absolute text-5xl"
                    style={{
                      left: '-1rem',
                      top: '-0.5rem',
                      opacity: 0.3,
                      color: accentColor
                    }}
                  >
                    <IconPublished icon={quoteIcon} size={48} />
                  </div>
                )}

                {/* Answer */}
                {item.answer && item.answer.trim() !== '' && (
                  <blockquote className="mb-4">
                    <TextPublished
                      value={item.answer}
                      style={{
                        color: textColors.muted,
                        ...bodyTypography,
                        fontStyle: 'italic',
                        lineHeight: '1.75'
                      }}
                    />
                  </blockquote>
                )}

                {/* Expert Attribution */}
                <div className="flex items-center gap-3">
                  {/* Avatar Circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor: accentColor
                    }}
                  >
                    {item.expertName?.charAt(0) || 'E'}
                  </div>

                  <div>
                    <TextPublished
                      value={item.expertName}
                      style={{
                        color: textColors.heading,
                        fontWeight: 600
                      }}
                    />
                    <TextPublished
                      value={item.expertTitle}
                      style={{
                        color: textColors.muted,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
