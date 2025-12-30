/**
 * SegmentedFAQTabs - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Note: Tabs are static in published mode (shows first tab by default)
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';

interface SegmentedFAQTabsContent {
  headline: string;
  subheadline?: string;
  // Individual tab labels
  tab_label_1: string;
  tab_label_2: string;
  tab_label_3: string;
  // Tab 1 Q&A (up to 4 items per tab)
  tab1_question_1: string;
  tab1_answer_1: string;
  tab1_question_2: string;
  tab1_answer_2: string;
  tab1_question_3: string;
  tab1_answer_3: string;
  tab1_question_4: string;
  tab1_answer_4: string;
  // Tab 2 Q&A
  tab2_question_1: string;
  tab2_answer_1: string;
  tab2_question_2: string;
  tab2_answer_2: string;
  tab2_question_3: string;
  tab2_answer_3: string;
  tab2_question_4: string;
  tab2_answer_4: string;
  // Tab 3 Q&A
  tab3_question_1: string;
  tab3_answer_1: string;
  tab3_question_2: string;
  tab3_answer_2: string;
  tab3_question_3: string;
  tab3_answer_3: string;
  tab3_question_4: string;
  tab3_answer_4: string;
  // Legacy fields for backward compatibility
  tab_labels?: string;
  tab1_questions?: string;
  tab1_answers?: string;
  tab2_questions?: string;
  tab2_answers?: string;
  tab3_questions?: string;
  tab3_answers?: string;
}

export default function SegmentedFAQTabsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Everything You Need to Know';
  const subheadline = props.subheadline || '';

  // Static active tab (always show first tab in published mode)
  const activeTab = 0;

  // Helper function to get tab labels
  const getTabLabels = () => {
    const labels = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const label = props[`tab_label_${i}` as keyof typeof props];

      if (label && typeof label === 'string' && label.trim() !== '' && label !== '___REMOVED___') {
        labels.push(label.trim());
      }
    }

    // Fallback to legacy format if no individual labels found
    if (labels.length === 0) {
      const tabLabelsRaw = props.tab_labels;
      if (typeof tabLabelsRaw === 'string') {
        const parsed = tabLabelsRaw.split('|').map(label => label.trim()).filter(Boolean);
        if (parsed.length > 0) return parsed;
      }
    }

    // Default labels if nothing found
    if (labels.length === 0) {
      return ['General', 'Technical', 'Billing'];
    }

    return labels;
  };

  // Helper function to get FAQ items for a specific tab
  const getTabFAQItems = (tabNumber: number) => {
    const items = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 4; i++) {
      const question = props[`tab${tabNumber}_question_${i}` as keyof typeof props];
      const answer = props[`tab${tabNumber}_answer_${i}` as keyof typeof props];

      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          index: i,
          tabNumber
        });
      }
    }

    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsRaw = props[`tab${tabNumber}_questions` as keyof typeof props];
      const answersRaw = props[`tab${tabNumber}_answers` as keyof typeof props];

      const questions = (typeof questionsRaw === 'string' ? questionsRaw.split('|').map(q => q.trim()).filter(Boolean) : []);
      const answers = (typeof answersRaw === 'string' ? answersRaw.split('|').map(a => a.trim()).filter(Boolean) : []);

      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          index: index + 1,
          tabNumber
        });
      });
    }

    return items;
  };

  const tabLabels = getTabLabels();
  const tabs = [
    { items: getTabFAQItems(1) },
    { items: getTabFAQItems(2) },
    { items: getTabFAQItems(3) }
  ];

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  // Accent color
  const accentColor = theme?.colors?.accentColor || '#3B82F6';
  const ctaTextColor = '#FFFFFF';

  // Border color
  const borderColor = backgroundType === 'primary' || !backgroundType
    ? 'rgba(229, 231, 235, 1)' // gray-200
    : 'rgba(55, 65, 81, 0.3)'; // gray-700

  // Card background
  const cardBg = backgroundType === 'primary' || !backgroundType
    ? 'rgba(249, 250, 251, 1)' // gray-50
    : 'rgba(31, 41, 55, 0.5)'; // gray-800/50

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

        {/* Tab Navigation */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
          style={{
            borderBottom: `1px solid ${borderColor}`
          }}
        >
          {tabLabels.map((label, index) => (
            <div
              key={index}
              className="px-6 py-3 font-medium transition-all duration-200"
              style={{
                backgroundColor: activeTab === index ? accentColor : 'transparent',
                color: activeTab === index ? ctaTextColor : textColors.muted,
                borderBottom: activeTab === index ? '2px solid transparent' : '2px solid transparent'
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Tab Content - Show only active tab */}
        <div className="space-y-6">
          {tabs[activeTab].items.map((item) => (
            <div
              key={`${item.tabNumber}-${item.index}`}
              className="rounded-lg p-6"
              style={{
                backgroundColor: cardBg
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
