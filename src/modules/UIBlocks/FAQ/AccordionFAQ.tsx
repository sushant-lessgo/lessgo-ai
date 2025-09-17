// components/layout/AccordionFAQ.tsx
// Production-ready FAQ accordion component using abstraction system

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface AccordionFAQContent {
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
  // Icon fields
  expand_icon?: string;
  collapse_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
}

// FAQ item structure
interface FAQItem {
  id: string;
  index: number;
  question: string;
  answer: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Frequently Asked Questions' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Find answers to common questions about our platform and services.' 
  },
  // Individual Q&A fields
  question_1: { type: 'string' as const, default: 'How does the free trial work?' },
  answer_1: { type: 'string' as const, default: 'Our free trial gives you full access to all features for 14 days. No credit card required to start.' },
  question_2: { type: 'string' as const, default: 'What payment methods do you accept?' },
  answer_2: { type: 'string' as const, default: 'We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.' },
  question_3: { type: 'string' as const, default: 'Can I cancel anytime?' },
  answer_3: { type: 'string' as const, default: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.' },
  question_4: { type: 'string' as const, default: 'Do you offer customer support?' },
  answer_4: { type: 'string' as const, default: 'We offer 24/7 customer support via chat, email, and phone. Our average response time is under 2 hours.' },
  question_5: { type: 'string' as const, default: 'Is my data secure?' },
  answer_5: { type: 'string' as const, default: 'Absolutely. We use enterprise-grade encryption and are SOC 2 compliant. Your data is stored securely and never shared with third parties.' },
  // Icon fields
  expand_icon: { type: 'string' as const, default: '➕' },
  collapse_icon: { type: 'string' as const, default: '➖' },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' }
};

// Helper function to get FAQ items
const getFAQItems = (blockContent: AccordionFAQContent): FAQItem[] => {
  const items: FAQItem[] = [];
  
  // Check individual fields first (preferred)
  for (let i = 1; i <= 5; i++) {
    const questionKey = `question_${i}` as keyof AccordionFAQContent;
    const answerKey = `answer_${i}` as keyof AccordionFAQContent;
    
    const question = blockContent[questionKey];
    const answer = blockContent[answerKey];
    
    if (question && question.trim() !== '' && question !== '___REMOVED___') {
      items.push({
        id: `faq-${i}`,
        index: i,
        question: question.trim(),
        answer: (answer && answer !== '___REMOVED___') ? answer.trim() : 'Answer not provided.'
      });
    }
  }
  
  // Fallback to legacy format if no individual items found
  if (items.length === 0 && blockContent.questions) {
    const questionList = parsePipeData(blockContent.questions);
    const answerList = parsePipeData(blockContent.answers || '');
    
    questionList.forEach((question, index) => {
      items.push({
        id: `faq-${index}`,
        index: index + 1,
        question,
        answer: answerList[index] || 'Answer not provided.'
      });
    });
  }
  
  return items;
};

// Individual FAQ Accordion Item Component
const FAQAccordionItem = React.memo(({ 
  item, 
  isOpen, 
  onToggle, 
  mode, 
  colorTokens,
  getTextStyle,
  onQuestionEdit,
  onAnswerEdit,
  backgroundType,
  sectionBackground,
  sectionId,
  blockContent,
  handleContentUpdate,
  onRemove
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onQuestionEdit: (index: number, value: string) => void;
  onAnswerEdit: (index: number, value: string) => void;
  backgroundType: any;
  sectionBackground: any;
  sectionId: string;
  blockContent: AccordionFAQContent;
  handleContentUpdate: (key: keyof AccordionFAQContent, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  
  return (
    <div className="relative group/faq-item border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Question Header */}
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 text-left bg-white hover:${colorTokens.surfaceElevated} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <EditableAdaptiveText
              mode={mode}
              value={item.question}
              onEdit={(value) => onQuestionEdit(item.index, value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className={`font-semibold ${colorTokens.textOnLight || colorTokens.textPrimary} hover:${colorTokens.link} transition-colors duration-200`}
              placeholder={`Question ${item.index}`}
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key={`question_${item.index}`}
            />
          </div>
          
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <IconEditableText
              mode={mode}
              value={isOpen ? (blockContent.collapse_icon || '➖') : (blockContent.expand_icon || '➕')}
              onEdit={(value) => handleContentUpdate(isOpen ? 'collapse_icon' : 'expand_icon', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              iconSize="md"
              className="text-gray-500"
              sectionId={sectionId}
              elementKey={isOpen ? `collapse_icon_${item.index}` : `expand_icon_${item.index}`}
            />
          </div>
        </div>
      </button>

      {/* Answer Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`px-6 py-4 ${colorTokens.surfaceElevated} border-t border-gray-200`}>
          <EditableAdaptiveText
            mode={mode}
            value={item.answer}
            onEdit={(value) => onAnswerEdit(item.index, value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className={`${colorTokens.textSecondary} leading-relaxed`}
            placeholder={`Answer ${item.index}...`}
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key={`answer_${item.index}`}
          />
        </div>
      </div>
      
      {/* Remove button */}
      {mode !== 'preview' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.index);
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
  );
});
FAQAccordionItem.displayName = 'FAQAccordionItem';

export default function AccordionFAQ(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
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
  } = useLayoutComponent<AccordionFAQContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['faq-0'])); // First item open by default

  // Get FAQ items
  const faqItems = getFAQItems(blockContent);

  // Handle individual question/answer editing
  const handleQuestionEdit = (index: number, value: string) => {
    const questionKey = `question_${index}` as keyof AccordionFAQContent;
    handleContentUpdate(questionKey, value);
  };

  const handleAnswerEdit = (index: number, value: string) => {
    const answerKey = `answer_${index}` as keyof AccordionFAQContent;
    handleContentUpdate(answerKey, value);
  };

  // Toggle accordion item
  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AccordionFAQ"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            textStyle={{
              ...getTextStyle('h1'),
              textAlign: 'center'
            }}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                ...getTextStyle('body-lg'),
                textAlign: 'center'
              }}
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context for your FAQ section..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqItems.map((item) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              mode={mode}
              colorTokens={colorTokens}
              getTextStyle={getTextStyle}
              onQuestionEdit={handleQuestionEdit}
              onAnswerEdit={handleAnswerEdit}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              onRemove={(index) => {
                handleContentUpdate(`question_${index}` as keyof AccordionFAQContent, '___REMOVED___');
                handleContentUpdate(`answer_${index}` as keyof AccordionFAQContent, '___REMOVED___');
              }}
            />
          ))}
          
          {/* Add new FAQ button */}
          {mode !== 'preview' && faqItems.length < 5 && (
            <button
              onClick={() => {
                // Find the first empty slot
                for (let i = 1; i <= 5; i++) {
                  const questionKey = `question_${i}` as keyof AccordionFAQContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, 'New question');
                    handleContentUpdate(`answer_${i}` as keyof AccordionFAQContent, 'New answer');
                    // Auto-open the new item
                    setOpenItems(prev => new Set([...prev, `faq-${i}`]));
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-6 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
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

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'AccordionFAQ',
  category: 'Content Sections',
  description: 'Interactive FAQ section with adaptive text colors and expandable accordion items',
  tags: ['faq', 'accordion', 'questions', 'support', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools - Updated for individual Q&A fields
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
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
    { key: 'expand_icon', label: 'Expand Icon', type: 'text', required: false },
    { key: 'collapse_icon', label: 'Collapse Icon', type: 'text', required: false },
    // Legacy fields for backward compatibility
    { key: 'questions', label: 'Questions (legacy pipe separated)', type: 'textarea', required: false },
    { key: 'answers', label: 'Answers (legacy pipe separated)', type: 'textarea', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Smooth accordion animations and transitions',
    'Individual item editing in edit mode',
    'Professional styling with hover effects',
    'Responsive design for all screen sizes',
    'Keyboard accessibility support'
  ],
  
  // Usage examples
  useCases: [
    'Product FAQ section on branded backgrounds',
    'Support documentation with dark themes',
    'Onboarding help with custom styling',
    'Pricing questions on gradient backgrounds'
  ]
};