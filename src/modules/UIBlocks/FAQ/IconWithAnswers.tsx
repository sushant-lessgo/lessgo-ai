import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface IconWithAnswersContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 5 items)
  question_1: string;
  answer_1: string;
  icon_1: string;
  question_2: string;
  answer_2: string;
  icon_2: string;
  question_3: string;
  answer_3: string;
  icon_3: string;
  question_4: string;
  answer_4: string;
  icon_4: string;
  question_5: string;
  answer_5: string;
  icon_5: string;
  // Bottom help text
  help_text: string;
  show_help_section?: boolean;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
  icons?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Common Questions Answered' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Quick visual guides to help you understand our platform' 
  },
  // Individual Q&A fields
  question_1: { type: 'string' as const, default: 'Is it really that simple to use?' },
  answer_1: { type: 'string' as const, default: 'Yes! Our interface is designed for anyone to use, regardless of technical background. Most users are creating their first automation within minutes.' },
  icon_1: { type: 'string' as const, default: '🎯' },
  question_2: { type: 'string' as const, default: 'What if I make a mistake?' },
  answer_2: { type: 'string' as const, default: 'Don\'t worry! Everything can be undone, and we provide preview mode so you can test before going live. Plus, our support team is always here to help.' },
  icon_2: { type: 'string' as const, default: '⚡' },
  question_3: { type: 'string' as const, default: 'How secure is my data?' },
  answer_3: { type: 'string' as const, default: 'Your data is protected with bank-level encryption and we\'re certified for enterprise security standards. We never share or access your private information.' },
  icon_3: { type: 'string' as const, default: '🔒' },
  question_4: { type: 'string' as const, default: 'Can I customize everything?' },
  answer_4: { type: 'string' as const, default: 'Absolutely! You can customize colors, layouts, workflows, and integrations to match your exact needs and brand.' },
  icon_4: { type: 'string' as const, default: '🎨' },
  question_5: { type: 'string' as const, default: 'Will it work with my existing tools?' },
  answer_5: { type: 'string' as const, default: 'We integrate with 200+ popular tools including Slack, Google Workspace, Salesforce, and more. If we don\'t have an integration you need, we\'ll build it.' },
  icon_5: { type: 'string' as const, default: '🔗' },
  // Bottom help section
  help_text: { type: 'string' as const, default: 'Still have questions? We\'re here to help!' },
  show_help_section: { type: 'boolean' as const, default: true },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' },
  icons: { type: 'string' as const, default: '' }
};

export default function IconWithAnswers(props: LayoutComponentProps) {
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
  } = useLayoutComponent<IconWithAnswersContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Helper function to get FAQ items
  const getFAQItems = () => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 5; i++) {
      const questionKey = `question_${i}` as keyof IconWithAnswersContent;
      const answerKey = `answer_${i}` as keyof IconWithAnswersContent;
      const iconKey = `icon_${i}` as keyof IconWithAnswersContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      const icon = blockContent[iconKey];
      
      if (question && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && answer !== '___REMOVED___') ? answer.trim() : '',
          icon: (icon && icon !== '___REMOVED___') ? icon.trim() : '💡',
          index: i
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0 && blockContent.questions) {
      const questions = blockContent.questions.split('|').map(q => q.trim()).filter(Boolean);
      const answers = blockContent.answers?.split('|').map(a => a.trim()).filter(Boolean) || [];
      const icons = blockContent.icons?.split('|').map(i => i.trim()).filter(Boolean) || [];
      
      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          icon: icons[index] || '💡',
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
      sectionType="IconWithAnswers"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
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
              placeholder="Add a description with visual elements..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Icon-based Q&As */}
        <div className="space-y-8">
          {faqItems.map((item) => (
            <div key={item.index} className="relative group/faq-item">
              <div className="flex gap-4 lg:gap-6 items-start">
                {/* Icon Container */}
                <div className="flex-shrink-0 relative group/icon">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    {mode === 'edit' ? (
                      <EditableAdaptiveText
                        mode={mode}
                        value={item.icon}
                        onEdit={(value) => handleContentUpdate(`icon_${item.index}` as keyof IconWithAnswersContent, value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-2xl text-center min-w-[2rem] min-h-[2rem] flex items-center justify-center"
                        placeholder="🎯"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`icon_${item.index}`}
                      />
                    ) : (
                      <span className="text-2xl">{item.icon}</span>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="relative group/question mb-2">
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.question}
                      onEdit={(value) => handleContentUpdate(`question_${item.index}` as keyof IconWithAnswersContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="heading"
                      className="font-semibold"
                      style={getTextStyle('h3')}
                      placeholder={`Question ${item.index}`}
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`question_${item.index}`}
                    />
                  </div>
                  
                  {(item.answer || mode === 'edit') && (
                    <div className="relative group/answer">
                      <EditableAdaptiveText
                        mode={mode}
                        value={item.answer}
                        onEdit={(value) => handleContentUpdate(`answer_${item.index}` as keyof IconWithAnswersContent, value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className={`leading-relaxed ${mutedTextColor}`}
                        placeholder={`Answer to question ${item.index}...`}
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`answer_${item.index}`}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate(`question_${item.index}` as keyof IconWithAnswersContent, '___REMOVED___');
                    handleContentUpdate(`answer_${item.index}` as keyof IconWithAnswersContent, '___REMOVED___');
                    handleContentUpdate(`icon_${item.index}` as keyof IconWithAnswersContent, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/faq-item:opacity-100 absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                  title="Remove this FAQ item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add new FAQ button */}
          {mode === 'edit' && faqItems.length < 5 && (
            <button
              onClick={() => {
                // Find the first empty slot
                for (let i = 1; i <= 5; i++) {
                  const questionKey = `question_${i}` as keyof IconWithAnswersContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, 'New question');
                    handleContentUpdate(`answer_${i}` as keyof IconWithAnswersContent, 'New answer');
                    handleContentUpdate(`icon_${i}` as keyof IconWithAnswersContent, '💡');
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ item</span>
            </button>
          )}
        </div>

        {/* Bottom Help Section */}
        {blockContent.show_help_section !== false && blockContent.help_text && blockContent.help_text !== '___REMOVED___' && (
          <div className="mt-12 flex justify-center relative group/help-section">
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-full">
              <span className="text-2xl">✨</span>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.help_text || ''}
                onEdit={(value) => handleContentUpdate('help_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className={`text-sm font-medium ${mutedTextColor}`}
                placeholder="Still have questions? We're here to help!"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="help_text"
              />
            </div>
            
            {/* Remove help section button */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('help_text', '___REMOVED___');
                }}
                className="opacity-0 group-hover/help-section:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove help section"
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
  name: 'IconWithAnswers',
  category: 'FAQ Sections',
  description: 'FAQ with icons for visual clarity and friendly appeal',
  tags: ['faq', 'icons', 'visual', 'friendly', 'creators'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '8 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'icons', label: 'Icons/Emojis (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Visual icons for each question',
    'Friendly, approachable design',
    'Clear visual hierarchy',
    'Perfect for creator-focused content',
    'Responsive layout'
  ],
  
  useCases: [
    'Creator tool FAQs',
    'Early-stage product questions',
    'User onboarding guides',
    'Simple feature explanations',
    'Friendly support content'
  ]
};