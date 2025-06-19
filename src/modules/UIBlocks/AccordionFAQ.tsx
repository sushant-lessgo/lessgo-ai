import React, { useEffect, useState } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface AccordionFAQProps extends LayoutComponentProps {}

// FAQ item structure
interface FAQItem {
  question: string;
  answer: string;
  id: string;
}

// Content interface for AccordionFAQ layout
interface AccordionFAQContent {
  headline: string;
  questions: string;
  answers: string;
  subheadline?: string;
}

// Content schema for AccordionFAQ layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Frequently Asked Questions' },
  questions: { type: 'string' as const, default: 'How does the free trial work?|What payment methods do you accept?|Can I cancel anytime?|Do you offer customer support?|Is my data secure?' },
  answers: { type: 'string' as const, default: 'Our free trial gives you full access to all features for 14 days. No credit card required to start.|We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.|Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.|We offer 24/7 customer support via chat, email, and phone. Our average response time is under 2 hours.|Absolutely. We use enterprise-grade encryption and are SOC 2 compliant. Your data is stored securely and never shared with third parties.' },
  subheadline: { type: 'string' as const, default: '' }
};

// Parse FAQ data from pipe-separated strings
const parseFAQData = (questions: string, answers: string): FAQItem[] => {
  const questionList = questions.split('|').map(q => q.trim()).filter(q => q);
  const answerList = answers.split('|').map(a => a.trim()).filter(a => a);
  
  return questionList.map((question, index) => ({
    id: `faq-${index}`,
    question,
    answer: answerList[index] || 'Answer not provided.'
  }));
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Individual FAQ Accordion Item
const FAQAccordionItem = ({ 
  item, 
  isOpen, 
  onToggle, 
  mode, 
  sectionId, 
  index,
  onQuestionEdit,
  onAnswerEdit 
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onQuestionEdit: (index: number, value: string) => void;
  onAnswerEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Question Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onQuestionEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
                style={getTextStyle('h4')}
              >
                {item.question}
              </div>
            ) : (
              <h3 
                className="font-semibold text-gray-900"
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onAnswerEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-100 text-gray-700 leading-relaxed"
              style={getTextStyle('body')}
            >
              {item.answer}
            </div>
          ) : (
            <p 
              className="text-gray-700 leading-relaxed"
              style={getTextStyle('body')}
            >
              {item.answer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AccordionFAQ({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: AccordionFAQProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: AccordionFAQContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse FAQ data
  const faqItems = parseFAQData(blockContent.questions, blockContent.answers);

  // Handle individual question/answer editing
  const handleQuestionEdit = (index: number, value: string) => {
    const questions = blockContent.questions.split('|');
    questions[index] = value;
    handleContentUpdate('questions', questions.join('|'));
  };

  const handleAnswerEdit = (index: number, value: string) => {
    const answers = blockContent.answers.split('|');
    answers[index] = value;
    handleContentUpdate('answers', answers.join('|'));
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

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="AccordionFAQ"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p 
                className={`mb-6 max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              mode={mode}
              sectionId={sectionId}
              index={index}
              onQuestionEdit={handleQuestionEdit}
              onAnswerEdit={handleAnswerEdit}
            />
          ))}
        </div>

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  AccordionFAQ - Edit FAQ content or click individual questions/answers above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Questions (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="questions"
                    onEdit={(value) => handleContentUpdate('questions', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto">
                      {blockContent.questions}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Answers (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="answers"
                    onEdit={(value) => handleContentUpdate('answers', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.answers}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: You can edit individual questions and answers by clicking directly on them in the accordion above, or edit the bulk data here.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}