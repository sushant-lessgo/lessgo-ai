import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

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

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Quick Questions & Answers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Get instant answers to the most common questions' 
  },
  // Individual Q&A fields
  question_1: { type: 'string' as const, default: 'What is your product?' },
  answer_1: { type: 'string' as const, default: 'We\'re a no-code automation platform that helps you streamline your business processes without writing a single line of code.' },
  question_2: { type: 'string' as const, default: 'How much does it cost?' },
  answer_2: { type: 'string' as const, default: 'We offer flexible pricing starting at $29/month. See our pricing page for detailed plans.' },
  question_3: { type: 'string' as const, default: 'Do I need technical knowledge?' },
  answer_3: { type: 'string' as const, default: 'Not at all! Our platform is designed for non-technical users. If you can use email, you can use our product.' },
  question_4: { type: 'string' as const, default: 'How quickly can I get started?' },
  answer_4: { type: 'string' as const, default: 'You can get started in under 5 minutes. Just sign up, connect your tools, and start automating.' },
  question_5: { type: 'string' as const, default: 'What if I need help?' },
  answer_5: { type: 'string' as const, default: 'We provide 24/7 support via chat and email, plus extensive documentation and video tutorials.' },
  question_6: { type: 'string' as const, default: '' },
  answer_6: { type: 'string' as const, default: '' },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' }
};

export default function InlineQnAList(props: LayoutComponentProps) {
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
  } = useLayoutComponent<InlineQnAListContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Helper function to get FAQ items
  const getFAQItems = () => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 6; i++) {
      const questionKey = `question_${i}` as keyof InlineQnAListContent;
      const answerKey = `answer_${i}` as keyof InlineQnAListContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      
      if (question && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && answer !== '___REMOVED___') ? answer.trim() : '',
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

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InlineQnAList"
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
            className="mb-3"
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
              className=""
              placeholder="Add a brief description..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Simple Q&A List */}
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.index} className="relative group/faq-item border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
              <div className="mb-2">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`question_${item.index}` as keyof InlineQnAListContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-medium ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                  placeholder={`Question ${item.index}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`question_${item.index}`}
                />
              </div>
              
              {(item.answer || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={item.answer}
                  onEdit={(value) => handleContentUpdate(`answer_${item.index}` as keyof InlineQnAListContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`leading-relaxed ${mutedTextColor}`}
                  placeholder={`Answer ${item.index}...`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`answer_${item.index}`}
                />
              )}
              
              {/* Remove button */}
              {mode !== 'preview' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate(`question_${item.index}` as keyof InlineQnAListContent, '___REMOVED___');
                    handleContentUpdate(`answer_${item.index}` as keyof InlineQnAListContent, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/faq-item:opacity-100 absolute top-0 right-0 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
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
          {mode !== 'preview' && faqItems.length < 6 && (
            <button
              onClick={() => {
                // Find the first empty slot
                for (let i = 1; i <= 6; i++) {
                  const questionKey = `question_${i}` as keyof InlineQnAListContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, 'New question');
                    handleContentUpdate(`answer_${i}` as keyof InlineQnAListContent, 'New answer');
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ item</span>
            </button>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'InlineQnAList',
  category: 'FAQ Sections',
  description: 'Simple inline list of questions and answers for low-complexity needs',
  tags: ['faq', 'simple', 'inline', 'minimal'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '5 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'question_1', label: 'Question 1', type: 'text', required: true },
    { key: 'answer_1', label: 'Answer 1', type: 'textarea', required: true },
    { key: 'question_2', label: 'Question 2', type: 'text', required: true },
    { key: 'answer_2', label: 'Answer 2', type: 'textarea', required: true },
    { key: 'question_3', label: 'Question 3', type: 'text', required: true },
    { key: 'answer_3', label: 'Answer 3', type: 'textarea', required: true },
    { key: 'question_4', label: 'Question 4', type: 'text', required: false },
    { key: 'answer_4', label: 'Answer 4', type: 'textarea', required: false },
    { key: 'question_5', label: 'Question 5', type: 'text', required: false },
    { key: 'answer_5', label: 'Answer 5', type: 'textarea', required: false },
    { key: 'question_6', label: 'Question 6', type: 'text', required: false },
    { key: 'answer_6', label: 'Answer 6', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (legacy pipe separated)', type: 'textarea', required: false },
    { key: 'answers', label: 'Answers (legacy pipe separated)', type: 'textarea', required: false }
  ],
  
  features: [
    'Simple, clean layout',
    'Easy to scan format',
    'Minimal design approach',
    'Perfect for 3-6 FAQs',
    'Mobile-friendly'
  ],
  
  useCases: [
    'Early-stage startup FAQs',
    'Simple product questions',
    'Basic pricing clarifications',
    'Getting started guides',
    'Quick reference sections'
  ]
};