// components/layout/AccordionFAQ.tsx
// Production-ready FAQ accordion component using abstraction system

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface AccordionFAQContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
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
  questions: { 
    type: 'string' as const, 
    default: 'How does the free trial work?|What payment methods do you accept?|Can I cancel anytime?|Do you offer customer support?|Is my data secure?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'Our free trial gives you full access to all features for 14 days. No credit card required to start.|We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.|Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.|We offer 24/7 customer support via chat, email, and phone. Our average response time is under 2 hours.|Absolutely. We use enterprise-grade encryption and are SOC 2 compliant. Your data is stored securely and never shared with third parties.' 
  }
};

// Parse FAQ data from pipe-separated strings
const parseFAQData = (questions: string, answers: string): FAQItem[] => {
  const questionList = parsePipeData(questions);
  const answerList = parsePipeData(answers);
  
  return questionList.map((question, index) => ({
    id: `faq-${index}`,
    index,
    question,
    answer: answerList[index] || 'Answer not provided.'
  }));
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
  onAnswerEdit 
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onQuestionEdit: (index: number, value: string) => void;
  onAnswerEdit: (index: number, value: string) => void;
}) => {
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Question Header */}
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 text-left bg-white hover:${colorTokens.surfaceElevated} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onQuestionEdit(item.index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
                style={getTextStyle('h4')}
              >
                {item.question}
              </div>
            ) : (
              <h3 
                className={`font-semibold ${colorTokens.textOnLight || colorTokens.textPrimary} hover:${colorTokens.link} transition-colors duration-200`}
                style={getTextStyle('h4')}
              >
                {item.question}
              </h3>
            )}
          </div>
          
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
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
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onAnswerEdit(item.index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-100 leading-relaxed"
              style={getTextStyle('body')}
            >
              {item.answer}
            </div>
          ) : (
            <p 
              className={`${colorTokens.textSecondary} leading-relaxed`}
              style={getTextStyle('body')}
            >
              {item.answer}
            </p>
          )}
        </div>
      </div>
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

  // Parse FAQ data
  const faqItems = parseFAQData(blockContent.questions, blockContent.answers);

  // Handle individual question/answer editing
  const handleQuestionEdit = (index: number, value: string) => {
    const updatedQuestions = updateListData(blockContent.questions, index, value);
    handleContentUpdate('questions', updatedQuestions);
  };

  const handleAnswerEdit = (index: number, value: string) => {
    const updatedAnswers = updateListData(blockContent.answers, index, value);
    handleContentUpdate('answers', updatedAnswers);
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
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
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
              backgroundType={props.backgroundType || 'neutral'}
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
            />
          ))}
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
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Answers (pipe separated)', type: 'textarea', required: true }
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