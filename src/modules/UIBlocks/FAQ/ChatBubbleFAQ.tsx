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
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
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
  // Individual Q&A fields
  question_1: { type: 'string' as const, default: 'Hey! I\'m curious about your free plan - what\'s included?' },
  answer_1: { type: 'string' as const, default: 'Hi! Great question! Our free plan includes up to 1,000 monthly actions, access to all core features, and basic integrations. It\'s perfect for getting started and many small teams stay on it forever! 🎉' },
  question_2: { type: 'string' as const, default: 'This looks awesome! How hard is it to get started?' },
  answer_2: { type: 'string' as const, default: 'Super easy! Most people are up and running in under 5 minutes. We have a guided setup that walks you through everything step by step. Want me to send you a quick demo link?' },
  question_3: { type: 'string' as const, default: 'I\'m not super technical - will I be able to figure this out?' },
  answer_3: { type: 'string' as const, default: 'Absolutely! We designed everything with non-technical users in mind. Think of it like using your favorite apps - if you can send an email or post on social media, you\'ve got this! 💪' },
  question_4: { type: 'string' as const, default: 'What if I need help along the way?' },
  answer_4: { type: 'string' as const, default: 'We\'re here 24/7! You can chat with us anytime, browse our help docs, or join our community where fellow users share tips. Plus, we have tons of video tutorials for visual learners.' },
  question_5: { type: 'string' as const, default: 'One more thing - can I really cancel anytime?' },
  answer_5: { type: 'string' as const, default: 'Yep! No contracts, no cancellation fees, no questions asked. You can downgrade or cancel right from your dashboard. We only want happy customers! ✨' },
  // Chat interface customization
  user_name: { type: 'string' as const, default: 'You' },
  support_name: { type: 'string' as const, default: 'Alex from Support' },
  support_avatar: { type: 'string' as const, default: 'A' },
  online_status_text: { type: 'string' as const, default: 'Online now' },
  chat_placeholder: { type: 'string' as const, default: 'Ask us anything...' },
  cta_text: { type: 'string' as const, default: 'Ready to start your own conversation?' },
  button_text: { type: 'string' as const, default: 'Chat with us now' },
  show_typing_indicator: { type: 'boolean' as const, default: true },
  show_cta_section: { type: 'boolean' as const, default: true },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' }
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

  // Helper function to get FAQ items
  const getFAQItems = () => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 5; i++) {
      const questionKey = `question_${i}` as keyof ChatBubbleFAQContent;
      const answerKey = `answer_${i}` as keyof ChatBubbleFAQContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      
      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          index: i
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0 && blockContent.questions) {
      const questions = blockContent.questions.split('|').map(q => q.trim()).filter(Boolean);
      const answers = blockContent.answers?.split('|').map(a => a.trim()).filter(Boolean) || [];
      
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
              {mode === 'edit' ? (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_avatar || ''}
                  onEdit={(value) => handleContentUpdate('support_avatar', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-center font-bold text-white min-w-[1rem] min-h-[1rem] flex items-center justify-center"
                  placeholder="A"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="support_avatar"
                />
              ) : (
                blockContent.support_avatar || 'A'
              )}
            </div>
            <div>
              <div className="relative group/support-name">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_name || ''}
                  onEdit={(value) => handleContentUpdate('support_name', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  placeholder="Alex from Support"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="support_name"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-green-500 relative group/status">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.online_status_text || ''}
                  onEdit={(value) => handleContentUpdate('online_status_text', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm text-green-500"
                  placeholder="Online now"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="online_status_text"
                />
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.index} className="space-y-3 relative group/chat-item">
                {/* User Question (Right aligned) */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] relative">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3">
                      <EditableAdaptiveText
                        mode={mode}
                        value={item.question}
                        onEdit={(value) => handleContentUpdate(`question_${item.index}` as keyof ChatBubbleFAQContent, value)}
                        backgroundType="primary"
                        colorTokens={{
                          ...colorTokens,
                          textPrimary: '#ffffff',
                          textOnDark: '#ffffff'
                        }}
                        variant="body"
                        className="text-sm text-white"
                        placeholder={`Question ${item.index}`}
                        sectionBackground="#3b82f6"
                        data-section-id={sectionId}
                        data-element-key={`question_${item.index}`}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right relative group/user-name">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.user_name || ''}
                        onEdit={(value) => handleContentUpdate('user_name', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-xs text-gray-400"
                        placeholder="You"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="user_name"
                      />
                    </div>
                  </div>
                </div>

                {/* Support Answer (Left aligned) */}
                {(item.answer || mode === 'edit') && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                        <EditableAdaptiveText
                          mode={mode}
                          value={item.answer}
                          onEdit={(value) => handleContentUpdate(`answer_${item.index}` as keyof ChatBubbleFAQContent, value)}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className={`text-sm ${dynamicTextColors?.body || colorTokens.textPrimary}`}
                          placeholder={`Answer ${item.index}...`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={`answer_${item.index}`}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {blockContent.support_name || 'Alex from Support'} • Just now
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Remove button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate(`question_${item.index}` as keyof ChatBubbleFAQContent, '___REMOVED___');
                      handleContentUpdate(`answer_${item.index}` as keyof ChatBubbleFAQContent, '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/chat-item:opacity-100 absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                    title="Remove this chat item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            {/* Add new chat item button */}
            {mode === 'edit' && faqItems.length < 5 && (
              <button
                onClick={() => {
                  // Find the first empty slot
                  for (let i = 1; i <= 5; i++) {
                    const questionKey = `question_${i}` as keyof ChatBubbleFAQContent;
                    if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                      handleContentUpdate(questionKey, 'New question');
                      handleContentUpdate(`answer_${i}` as keyof ChatBubbleFAQContent, 'New answer');
                      break;
                    }
                  }
                }}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add chat item</span>
              </button>
            )}

            {/* Typing Indicator */}
            {blockContent.show_typing_indicator !== false && (
              <div className="flex justify-start relative group/typing">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                
                {/* Remove typing indicator button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('show_typing_indicator', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/typing:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                    title="Remove typing indicator"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chat Input (Visual only) */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.chat_placeholder || ''}
                  onEdit={(value) => handleContentUpdate('chat_placeholder', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Ask us anything..."
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="chat_placeholder"
                />
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
        {blockContent.show_cta_section !== false && (blockContent.cta_text || blockContent.button_text || mode === 'edit') && (
          <div className="text-center mt-8 relative group/cta-section">
            {(blockContent.cta_text || mode === 'edit') && (
              <div className="mb-3 relative group/cta-text">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.cta_text || ''}
                  onEdit={(value) => handleContentUpdate('cta_text', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Ready to start your own conversation?"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="cta_text"
                />
              </div>
            )}
            
            {(blockContent.button_text || mode === 'edit') && (
              <div className="relative group/button-text inline-block">
                <button 
                  className="px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                >
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.button_text || ''}
                    onEdit={(value) => handleContentUpdate('button_text', value)}
                    backgroundType="primary"
                    colorTokens={{
                      ...colorTokens,
                      textPrimary: '#ffffff',
                      textOnDark: '#ffffff'
                    }}
                    variant="body"
                    className="font-medium text-white"
                    placeholder="Chat with us now"
                    sectionBackground={accentColor}
                    data-section-id={sectionId}
                    data-element-key="button_text"
                  />
                </button>
              </div>
            )}
            
            {/* Remove CTA section button */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_cta_section', '___REMOVED___');
                }}
                className="opacity-0 group-hover/cta-section:opacity-100 ml-4 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove CTA section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
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