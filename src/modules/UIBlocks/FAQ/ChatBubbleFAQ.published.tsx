/**
 * ChatBubbleFAQ - Published Version
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

interface ChatBubbleFAQContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 5 items)
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
  // Chat interface customization
  user_name?: string;
  support_name?: string;
  support_avatar?: string;
  online_status_text?: string;
  chat_placeholder?: string;
  cta_text?: string;
  button_text?: string;
  show_typing_indicator?: boolean;
  show_cta_section?: boolean;
  // Icon fields
  status_indicator_icon?: string;
  send_icon?: string;
  support_avatar_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
}

export default function ChatBubbleFAQPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || "Let's Chat About Your Questions";
  const subheadline = props.subheadline || '';

  // Chat customization
  const userName = props.user_name || 'You';
  const supportName = props.support_name || 'Alex from Support';
  const supportAvatar = props.support_avatar || 'A';
  const onlineStatusText = props.online_status_text || 'Online now';
  const chatPlaceholder = props.chat_placeholder || 'Ask us anything...';
  const ctaText = props.cta_text || '';
  const buttonText = props.button_text || '';
  const showTypingIndicator = props.show_typing_indicator !== false;
  const showCtaSection = props.show_cta_section !== false;

  // Icons
  const statusIndicatorIcon = props.status_indicator_icon || '🟢';
  const sendIcon = props.send_icon || '➤';
  const supportAvatarIcon = props.support_avatar_icon || '';

  // Helper function to get FAQ items
  const getFAQItems = () => {
    const items = [];

    // Check individual fields first (preferred)
    for (let i = 1; i <= 5; i++) {
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

  // Accent color
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  // Border color
  const borderColor = backgroundType === 'primary' || !backgroundType
    ? 'rgba(229, 231, 235, 1)' // gray-200
    : 'rgba(55, 65, 81, 0.3)'; // gray-700

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

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto">
          {/* Chat Header */}
          <div
            className="flex items-center gap-3 pb-4 mb-6"
            style={{
              borderBottom: `1px solid ${borderColor}`
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative"
              style={{ backgroundColor: accentColor }}
            >
              {supportAvatarIcon && supportAvatarIcon.trim() !== '' && supportAvatarIcon !== '👤' ? (
                <IconPublished value={supportAvatarIcon} size="md" color="#FFFFFF" />
              ) : (
                supportAvatar
              )}
            </div>
            <div>
              <TextPublished
                value={supportName}
                style={{
                  color: textColors.heading,
                  fontWeight: 600
                }}
              />
              <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
                <IconPublished value={statusIndicatorIcon} size="sm" />
                <TextPublished
                  value={onlineStatusText}
                  style={{
                    fontSize: '0.875rem',
                    color: '#10b981'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.index} className="space-y-3">
                {/* User Question (Right aligned) */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3">
                      <TextPublished
                        value={item.question}
                        style={{
                          color: '#FFFFFF',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {userName}
                    </div>
                  </div>
                </div>

                {/* Support Answer (Left aligned) */}
                {item.answer && item.answer.trim() !== '' && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <TextPublished
                          value={item.answer}
                          style={{
                            color: textColors.body,
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {supportName} • Just now
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {showTypingIndicator && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input (Visual only) */}
          <div
            className="mt-6 pt-4"
            style={{
              borderTop: `1px solid ${borderColor}`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-full px-4 py-2">
                <TextPublished
                  value={chatPlaceholder}
                  style={{
                    color: textColors.muted,
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <button
                className="p-2 rounded-full text-white flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                <IconPublished value={sendIcon} size="md" color="#FFFFFF" />
              </button>
            </div>
          </div>
        </div>

        {/* Call-to-Action */}
        {showCtaSection && (ctaText || buttonText) && (
          <div className="text-center mt-8">
            {ctaText && ctaText.trim() !== '' && (
              <div className="mb-3">
                <TextPublished
                  value={ctaText}
                  style={{
                    color: textColors.muted,
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            )}

            {buttonText && buttonText.trim() !== '' && (
              <button
                className="px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accentColor }}
              >
                {buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
