// components/layout/AccordionFAQ.tsx
// V2 Schema - Clean array format, no numbered fields or pipe strings

import React, { useState, useMemo } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

// FAQ item structure (V2 - clean array format)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Content interface (V2 - arrays, not numbered fields)
interface AccordionFAQContent {
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
    default: 'Find answers to common questions about our platform and services.'
  },
  faq_items: {
    type: 'array' as const,
    default: [
      { id: 'faq-1', question: 'How does the free trial work?', answer: 'Our free trial gives you full access to all features for 14 days. No credit card required to start.' },
      { id: 'faq-2', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.' },
      { id: 'faq-3', question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.' },
    ]
  },
  contact_prompt: { type: 'string' as const, default: '' },
  cta_text: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' }
};

// Theme-based accordion accent colors (decorative borders only)
const getAccordionAccents = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    borderHover: 'hover:border-orange-300',
    divider: 'border-orange-100'
  },
  cool: {
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    divider: 'border-blue-100'
  },
  neutral: {
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    divider: 'border-gray-200'
  }
})[theme];

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
  onRemove,
  themeAccents,
  cardStyles
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onQuestionEdit: (id: string, value: string) => void;
  onAnswerEdit: (id: string, value: string) => void;
  backgroundType: any;
  sectionBackground: any;
  sectionId: string;
  onRemove: (id: string) => void;
  themeAccents: ReturnType<typeof getAccordionAccents>;
  cardStyles: CardStyles;
}) => {

  return (
    <div className={`relative group/faq-item ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${themeAccents.border} ${themeAccents.borderHover} rounded-lg overflow-hidden ${cardStyles.shadow} hover:shadow-md transition-all duration-200`}>
      {/* Question Header */}
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <EditableAdaptiveText
              mode={mode}
              value={item.question}
              onEdit={(value) => onQuestionEdit(item.id, value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className={`font-semibold ${cardStyles.textHeading} transition-colors duration-200`}
              placeholder="Enter question..."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key={`faq_items.${item.id}.question`}
            />
          </div>

          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${cardStyles.textMuted}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* Answer Content - conditional render for proper collapse */}
      {isOpen && (
        <div className={`px-6 py-4 border-t ${themeAccents.divider}`}>
          <EditableAdaptiveText
            mode={mode}
            value={item.answer}
            onEdit={(value) => onAnswerEdit(item.id, value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className={`${cardStyles.textBody} leading-relaxed`}
            placeholder="Enter answer..."
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key={`faq_items.${item.id}.answer`}
          />
        </div>
      )}

      {/* Remove button */}
      {mode !== 'preview' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
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

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme = useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeAccents = getAccordionAccents(uiBlockTheme);

  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['faq-1']));

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
    // Auto-open the new item
    setOpenItems(prev => new Set([...prev, newId]));
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
              onRemove={handleRemoveItem}
              themeAccents={themeAccents}
              cardStyles={cardStyles}
            />
          ))}

          {/* Add new FAQ button */}
          {mode !== 'preview' && faqItems.length < 10 && (
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-6 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ item</span>
            </button>
          )}
        </div>

        {/* Contact CTA Footer - subtle, no big button */}
        {(blockContent.contact_prompt || blockContent.cta_text || mode === 'edit') && (
          <div className={`mt-10 pt-6 border-t ${themeAccents.divider} text-center`}>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.contact_prompt || ''}
              onEdit={(value) => handleContentUpdate('contact_prompt', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className={`font-medium ${themeAccents.border.replace('border-', 'text-').replace('-200', '-600')} hover:underline cursor-pointer`}
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
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
  name: 'AccordionFAQ',
  category: 'Content Sections',
  description: 'Interactive FAQ section with theme-aware styling and expandable accordion items',
  tags: ['faq', 'accordion', 'questions', 'support', 'theme-aware'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',

  // V2 Schema - clean array format
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'faq_items', label: 'FAQ Items', type: 'array', required: true }
  ],

  features: [
    'Theme-aware styling (warm/cool/neutral)',
    'Smooth accordion animations',
    'Array-based item management',
    'Professional styling with hover effects',
    'Responsive design',
    'Keyboard accessibility support'
  ],

  useCases: [
    'Product FAQ section',
    'Support documentation',
    'Onboarding help',
    'Pricing questions'
  ]
};
