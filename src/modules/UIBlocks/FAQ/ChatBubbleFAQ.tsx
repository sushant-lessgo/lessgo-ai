import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface ChatBubbleFAQContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
  user_name?: string;
  support_name?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Let\'s Chat About Your Questions' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Here\'s how real conversations with our team usually go' 
  },
  questions: { 
    type: 'string' as const, 
    default: 'Hey! I\'m curious about your free plan - what\'s included?|This looks awesome! How hard is it to get started?|I\'m not super technical - will I be able to figure this out?|What if I need help along the way?|One more thing - can I really cancel anytime?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'Hi! Great question! Our free plan includes up to 1,000 monthly actions, access to all core features, and basic integrations. It\'s perfect for getting started and many small teams stay on it forever! 🎉|Super easy! Most people are up and running in under 5 minutes. We have a guided setup that walks you through everything step by step. Want me to send you a quick demo link?|Absolutely! We designed everything with non-technical users in mind. Think of it like using your favorite apps - if you can send an email or post on social media, you\'ve got this! 💪|We\'re here 24/7! You can chat with us anytime, browse our help docs, or join our community where fellow users share tips. Plus, we have tons of video tutorials for visual learners.|Yep! No contracts, no cancellation fees, no questions asked. You can downgrade or cancel right from your dashboard. We only want happy customers! ✨' 
  },
  user_name: { 
    type: 'string' as const, 
    default: 'You' 
  },
  support_name: { 
    type: 'string' as const, 
    default: 'Alex from Support' 
  }
};

export default function ChatBubbleFAQ(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<ChatBubbleFAQContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse content
  const questions = blockContent.questions 
    ? blockContent.questions.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answers = blockContent.answers 
    ? blockContent.answers.split('|').map(a => a.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ChatBubbleFAQ"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{
                ...getTextStyle('body-lg'),
                textAlign: 'center'
              }}
              className="max-w-3xl mx-auto"
              placeholder="Add a friendly introduction to your chat..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 max-w-3xl mx-auto">
          {/* Chat Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: accentColor }}
            >
              A
            </div>
            <div>
              <div className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                {blockContent.support_name || 'Alex from Support'}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online now
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="space-y-3">
                {/* User Question (Right aligned) */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm">{question}</p>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {blockContent.user_name || 'You'}
                    </div>
                  </div>
                </div>

                {/* Support Answer (Left aligned) */}
                {answers[index] && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                        <p className={`text-sm ${dynamicTextColors?.body || colorTokens.textPrimary}`}>
                          {answers[index]}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {blockContent.support_name || 'Alex from Support'} • Just now
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input (Visual only) */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2">
                <span className={`text-sm ${mutedTextColor}`}>
                  Ask us anything...
                </span>
              </div>
              <button 
                className="p-2 rounded-full text-white"
                style={{ backgroundColor: accentColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="text-center mt-8">
          <p className={`text-sm ${mutedTextColor} mb-3`}>
            Ready to start your own conversation?
          </p>
          <button 
            className="px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accentColor }}
          >
            Chat with us now
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ChatBubbleFAQ',
  category: 'FAQ Sections',
  description: 'Conversational chat-style FAQ for friendly, approachable brands',
  tags: ['faq', 'chat', 'conversational', 'friendly', 'approachable'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'moderate',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'User Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Support Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'user_name', label: 'User Display Name', type: 'text', required: false },
    { key: 'support_name', label: 'Support Representative Name', type: 'text', required: false }
  ],
  
  features: [
    'Real chat interface design',
    'Conversational tone and flow',
    'Typing indicators and online status',
    'Perfect for friendly brands',
    'Interactive appearance'
  ],
  
  useCases: [
    'Creator tool onboarding',
    'Friendly startup FAQs',
    'Community-focused products',
    'Casual, approachable brands',
    'First-time user questions'
  ]
};