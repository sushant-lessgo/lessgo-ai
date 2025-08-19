import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

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

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Frequently Asked Questions' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Everything you need to know about our platform' 
  },
  // Left column Q&A
  left_question_1: { type: 'string' as const, default: 'How does the pricing work?' },
  left_answer_1: { type: 'string' as const, default: 'Our pricing is simple and transparent. Choose from monthly or annual plans, with discounts for annual billing. All plans include core features with no hidden fees.' },
  left_question_2: { type: 'string' as const, default: 'Is there a free trial available?' },
  left_answer_2: { type: 'string' as const, default: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.' },
  left_question_3: { type: 'string' as const, default: 'Can I cancel my subscription anytime?' },
  left_answer_3: { type: 'string' as const, default: 'Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or long-term commitments.' },
  // Right column Q&A
  right_question_1: { type: 'string' as const, default: 'What kind of support do you offer?' },
  right_answer_1: { type: 'string' as const, default: 'We provide 24/7 customer support via live chat and email. Premium plans also include priority support and dedicated account managers.' },
  right_question_2: { type: 'string' as const, default: 'Do you integrate with other tools?' },
  right_answer_2: { type: 'string' as const, default: 'Yes, we integrate with 50+ popular tools including Slack, Google Workspace, Microsoft Teams, and more. Custom integrations are available for enterprise plans.' },
  right_question_3: { type: 'string' as const, default: 'Is my data secure?' },
  right_answer_3: { type: 'string' as const, default: 'Security is our top priority. We use bank-level encryption, regular security audits, and are SOC 2 compliant. Your data is always encrypted in transit and at rest.' },
  // Legacy fields for backward compatibility
  questions_left: { type: 'string' as const, default: '' },
  answers_left: { type: 'string' as const, default: '' },
  questions_right: { type: 'string' as const, default: '' },
  answers_right: { type: 'string' as const, default: '' }
};

export default function TwoColumnFAQ(props: LayoutComponentProps) {
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
  } = useLayoutComponent<TwoColumnFAQContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Helper function to get column FAQ items
  const getColumnFAQItems = (column: 'left' | 'right') => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const questionKey = `${column}_question_${i}` as keyof TwoColumnFAQContent;
      const answerKey = `${column}_answer_${i}` as keyof TwoColumnFAQContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      
      if (question && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && answer !== '___REMOVED___') ? answer.trim() : '',
          index: i,
          column
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsKey = `questions_${column}` as keyof TwoColumnFAQContent;
      const answersKey = `answers_${column}` as keyof TwoColumnFAQContent;
      
      const questions = blockContent[questionsKey]?.split('|').map(q => q.trim()).filter(Boolean) || [];
      const answers = blockContent[answersKey]?.split('|').map(a => a.trim()).filter(Boolean) || [];
      
      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          index: index + 1,
          column
        });
      });
    }
    
    return items;
  };
  
  const leftItems = getColumnFAQItems('left');
  const rightItems = getColumnFAQItems('right');

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TwoColumnFAQ"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
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
              placeholder="Add a supporting description for your FAQ section..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-6">
            {leftItems.map((item) => (
              <div key={`left-${item.index}`} className="relative group/left-item space-y-3">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`left_question_${item.index}` as keyof TwoColumnFAQContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="heading"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                  placeholder={`Question ${item.index}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`left_question_${item.index}`}
                />
                
                {(item.answer || mode === 'edit') && (
                  <EditableAdaptiveText
                    mode={mode}
                    value={item.answer}
                    onEdit={(value) => handleContentUpdate(`left_answer_${item.index}` as keyof TwoColumnFAQContent, value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`leading-relaxed ${mutedTextColor}`}
                    placeholder={`Answer ${item.index}...`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`left_answer_${item.index}`}
                  />
                )}
                
                {/* Remove button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate(`left_question_${item.index}` as keyof TwoColumnFAQContent, '___REMOVED___');
                      handleContentUpdate(`left_answer_${item.index}` as keyof TwoColumnFAQContent, '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/left-item:opacity-100 absolute -top-1 -right-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                    title="Remove this item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            {/* Add button for left column */}
            {mode === 'edit' && leftItems.length < 3 && (
              <button
                onClick={() => {
                  for (let i = 1; i <= 3; i++) {
                    const questionKey = `left_question_${i}` as keyof TwoColumnFAQContent;
                    if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                      handleContentUpdate(questionKey, 'New question');
                      handleContentUpdate(`left_answer_${i}` as keyof TwoColumnFAQContent, 'New answer');
                      break;
                    }
                  }
                }}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add FAQ item</span>
              </button>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {rightItems.map((item) => (
              <div key={`right-${item.index}`} className="relative group/right-item space-y-3">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`right_question_${item.index}` as keyof TwoColumnFAQContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="heading"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                  placeholder={`Question ${item.index}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`right_question_${item.index}`}
                />
                
                {(item.answer || mode === 'edit') && (
                  <EditableAdaptiveText
                    mode={mode}
                    value={item.answer}
                    onEdit={(value) => handleContentUpdate(`right_answer_${item.index}` as keyof TwoColumnFAQContent, value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`leading-relaxed ${mutedTextColor}`}
                    placeholder={`Answer ${item.index}...`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`right_answer_${item.index}`}
                  />
                )}
                
                {/* Remove button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate(`right_question_${item.index}` as keyof TwoColumnFAQContent, '___REMOVED___');
                      handleContentUpdate(`right_answer_${item.index}` as keyof TwoColumnFAQContent, '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/right-item:opacity-100 absolute -top-1 -right-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                    title="Remove this item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            {/* Add button for right column */}
            {mode === 'edit' && rightItems.length < 3 && (
              <button
                onClick={() => {
                  for (let i = 1; i <= 3; i++) {
                    const questionKey = `right_question_${i}` as keyof TwoColumnFAQContent;
                    if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                      handleContentUpdate(questionKey, 'New question');
                      handleContentUpdate(`right_answer_${i}` as keyof TwoColumnFAQContent, 'New answer');
                      break;
                    }
                  }
                }}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add FAQ item</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TwoColumnFAQ',
  category: 'FAQ Sections',
  description: 'Two-column layout for organized Q&A, ideal for technical audiences',
  tags: ['faq', 'two-column', 'organized', 'technical'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions_left', label: 'Left Column Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers_left', label: 'Left Column Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'questions_right', label: 'Right Column Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers_right', label: 'Right Column Answers (pipe separated)', type: 'textarea', required: true }
  ],
  
  features: [
    'Two-column layout for better organization',
    'Automatic text color adaptation',
    'Clean, scannable format',
    'Ideal for 6-10 FAQ items',
    'Responsive design'
  ],
  
  useCases: [
    'Technical documentation FAQs',
    'Enterprise software questions',
    'Product feature clarifications',
    'API usage questions',
    'Integration and compatibility FAQs'
  ]
};