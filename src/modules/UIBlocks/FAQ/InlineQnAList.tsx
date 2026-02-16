// components/layout/InlineQnAList.tsx
// V2 Schema - Clean array format, no numbered fields or pipe strings

import React, { useMemo } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getCardStyles } from '@/modules/Design/cardStyles';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// FAQ item structure (V2 - clean array format)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Content interface (V2 - arrays, not numbered fields)
interface InlineQnAListContent {
  headline: string;
  subheadline?: string;
  faq_items: FAQItem[];
  contact_prompt?: string;
  cta_text?: string;
  supporting_text?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Quick Questions & Answers'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Get instant answers to the most common questions'
  },
  faq_items: {
    type: 'array' as const,
    default: [
      { id: 'faq-1', question: 'What is your product?', answer: 'We\'re a no-code automation platform that helps you streamline your business processes without writing a single line of code.' },
      { id: 'faq-2', question: 'How much does it cost?', answer: 'We offer flexible pricing starting at $29/month. See our pricing page for detailed plans.' },
      { id: 'faq-3', question: 'Do I need technical knowledge?', answer: 'Not at all! Our platform is designed for non-technical users. If you can use email, you can use our product.' },
    ]
  },
  contact_prompt: { type: 'string' as const, default: '' },
  cta_text: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' }
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

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const cardStyles = useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Get FAQ items from content (direct array access)
  const faqItems: FAQItem[] = blockContent.faq_items || CONTENT_SCHEMA.faq_items.default;

  // Handle question edit
  const handleQuestionEdit = (id: string, value: string) => {
    const updatedItems = faqItems.map(item =>
      item.id === id ? { ...item, question: value } : item
    );
    (handleContentUpdate as any)('faq_items', updatedItems);
  };

  // Handle answer edit
  const handleAnswerEdit = (id: string, value: string) => {
    const updatedItems = faqItems.map(item =>
      item.id === id ? { ...item, answer: value } : item
    );
    (handleContentUpdate as any)('faq_items', updatedItems);
  };

  // Handle remove item
  const handleRemoveItem = (id: string) => {
    const updatedItems = faqItems.filter(item => item.id !== id);
    (handleContentUpdate as any)('faq_items', updatedItems);
  };

  // Handle add new item
  const handleAddItem = () => {
    const newId = `faq-${Date.now()}`;
    const updatedItems = [...faqItems, {
      id: newId,
      question: 'New question',
      answer: 'New answer'
    }];
    (handleContentUpdate as any)('faq_items', updatedItems);
  };

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
            <div key={item.id} className={`relative group/faq-item border-b pb-6 last:border-0 ${cardStyles.border}`}>
              <div className="mb-2">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleQuestionEdit(item.id, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-medium ${cardStyles.textHeading}`}
                  style={getTextStyle('h3')}
                  placeholder="Enter question..."
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`faq_items.${item.id}.question`}
                />
              </div>

              {(item.answer || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={item.answer}
                  onEdit={(value) => handleAnswerEdit(item.id, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`leading-relaxed ${cardStyles.textBody}`}
                  placeholder="Enter answer..."
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`faq_items.${item.id}.answer`}
                />
              )}

              {/* Remove button */}
              {mode !== 'preview' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.id);
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
          {mode !== 'preview' && faqItems.length < 8 && (
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ item</span>
            </button>
          )}
        </div>

        {/* Contact CTA Footer */}
        {(blockContent.contact_prompt || blockContent.cta_text || mode === 'edit') && (
          <div className="mt-10 pt-6 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.contact_prompt || ''}
              onEdit={(value) => handleContentUpdate('contact_prompt', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="mb-2"
              placeholder="Still have questions?"
              sectionId={sectionId}
              elementKey="contact_prompt"
              sectionBackground={sectionBackground}
            />
            {(blockContent.cta_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.cta_text || ''}
                onEdit={(value) => handleContentUpdate('cta_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                placeholder="Contact our support team"
                sectionId={sectionId}
                elementKey="cta_text"
                sectionBackground={sectionBackground}
              />
            )}
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="muted"
                className="mt-2 text-sm"
                placeholder="We typically respond within 24 hours"
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'InlineQnAList',
  category: 'FAQ Sections',
  description: 'Simple inline list of questions and answers for low-complexity needs',
  tags: ['faq', 'simple', 'inline', 'minimal'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '5 minutes',

  // V2 Schema - clean array format
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'faq_items', label: 'FAQ Items', type: 'array', required: true },
    { key: 'contact_prompt', label: 'Contact Prompt', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'text', required: false }
  ],

  features: [
    'Simple, clean layout',
    'Easy to scan format',
    'Minimal design approach',
    'Array-based item management',
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
