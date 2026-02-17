// components/layout/TwoColumnFAQ.tsx
// V2 Schema - Clean array format, no numbered fields or pipe strings

import React, { useMemo } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';

// FAQ item structure (V2 - clean array format)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Content interface (V2 - arrays, not numbered fields)
interface TwoColumnFAQContent {
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
    default: 'Frequently Asked Questions'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Everything you need to know about our platform'
  },
  faq_items: {
    type: 'array' as const,
    default: [
      { id: 'faq-1', question: 'How does the pricing work?', answer: 'Our pricing is simple and transparent. Choose from monthly or annual plans, with discounts for annual billing. All plans include core features with no hidden fees.' },
      { id: 'faq-2', question: 'Is there a free trial available?', answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.' },
      { id: 'faq-3', question: 'Can I cancel my subscription anytime?', answer: 'Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or long-term commitments.' },
      { id: 'faq-4', question: 'What kind of support do you offer?', answer: 'We provide 24/7 customer support via live chat and email. Premium plans also include priority support and dedicated account managers.' },
      { id: 'faq-5', question: 'Do you integrate with other tools?', answer: 'Yes, we integrate with 50+ popular tools including Slack, Google Workspace, Microsoft Teams, and more. Custom integrations are available for enterprise plans.' },
      { id: 'faq-6', question: 'Is my data secure?', answer: 'Security is our top priority. We use bank-level encryption, regular security audits, and are SOC 2 compliant. Your data is always encrypted in transit and at rest.' },
    ]
  },
  contact_prompt: {
    type: 'string' as const,
    default: ''
  },
  cta_text: {
    type: 'string' as const,
    default: ''
  },
  supporting_text: {
    type: 'string' as const,
    default: ''
  }
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

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const cardStyles = useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Get FAQ items from content (direct array access)
  const faqItems: FAQItem[] = blockContent.faq_items || CONTENT_SCHEMA.faq_items.default;

  // Split items into two columns (first half = left, second half = right)
  const midpoint = Math.ceil(faqItems.length / 2);
  const leftItems = faqItems.slice(0, midpoint);
  const rightItems = faqItems.slice(midpoint);

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

  // Render a single FAQ item with divider
  const renderFAQItem = (item: FAQItem) => (
    <div key={item.id} className={`relative group/faq-item space-y-3 pb-6 border-b last:border-b-0 last:pb-0 ${cardStyles.border}`}>
      <EditableAdaptiveText
        mode={mode}
        value={item.question}
        onEdit={(value) => handleQuestionEdit(item.id, value)}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        variant="body"
        className={`font-semibold ${cardStyles.textHeading}`}
        style={getTextStyle('h3')}
        placeholder="Enter question..."
        sectionBackground={sectionBackground}
        sectionId={sectionId}
        elementKey={`faq_items.${item.id}.question`}
      />

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
          sectionId={sectionId}
          elementKey={`faq_items.${item.id}.answer`}
        />
      )}

      {/* Remove button */}
      {mode !== 'preview' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveItem(item.id);
          }}
          className="opacity-0 group-hover/faq-item:opacity-100 absolute -top-1 -right-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
          title="Remove this item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

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
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column */}
          <div className="space-y-8">
            {leftItems.map(renderFAQItem)}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {rightItems.map(renderFAQItem)}
          </div>
        </div>

        {/* Add new FAQ button */}
        {mode !== 'preview' && faqItems.length < 10 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ item</span>
            </button>
          </div>
        )}

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
                className="font-medium text-blue-600 hover:underline cursor-pointer"
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

export const componentMeta = {
  name: 'TwoColumnFAQ',
  category: 'FAQ Sections',
  description: 'Two-column layout for organized Q&A, ideal for technical audiences',
  tags: ['faq', 'two-column', 'organized', 'technical'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',

  // V2 Schema - clean array format
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'faq_items', label: 'FAQ Items', type: 'array', required: true }
  ],

  features: [
    'Two-column layout for better organization',
    'Automatic text color adaptation',
    'Clean, scannable format',
    'Ideal for 4-10 FAQ items',
    'Array-based item management',
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
