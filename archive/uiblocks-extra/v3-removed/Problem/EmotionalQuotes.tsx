import React, { } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import {
  CTAButton,
  TrustIndicators
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface EmotionalQuotesContent {
  headline: string;
  emotional_quotes: string;
  quote_attributions: string;
  context_text?: string;
  quote_categories?: string;
  emotional_impact?: string;
  relatable_intro?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  category_icon_1?: string;
  category_icon_2?: string;
  category_icon_3?: string;
  category_icon_4?: string;
  category_icon_5?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'You\'re Not Alone in This Struggle' 
  },
  emotional_quotes: { 
    type: 'string' as const, 
    default: 'I spend more time fighting with our systems than actually growing the business. It feels like I\'m drowning in processes that should be helping me.|Every morning I wake up dreading the pile of manual tasks waiting for me. There has to be a better way.|I watch my competitors moving faster while I\'m stuck doing things the hard way. It\'s frustrating and exhausting.|My team is burning out from all the repetitive work. I can see the frustration in their eyes, and I feel responsible.|I started this business to build something great, not to become a slave to inefficient workflows.' 
  },
  quote_attributions: { 
    type: 'string' as const, 
    default: 'Sarah, Marketing Agency Owner|Mike, E-commerce Founder|Lisa, SaaS Startup CEO|David, Manufacturing Director|Rachel, Consulting Firm Owner' 
  },
  context_text: { 
    type: 'string' as const, 
    default: 'These are real words from business owners just like you. The pain is real, the frustration is genuine, and the impact on your life and business is significant.' 
  },
  quote_categories: { 
    type: 'string' as const, 
    default: 'Time Frustration|Competitive Pressure|Team Impact|Personal Burden|Vision Gap' 
  },
  emotional_impact: { 
    type: 'string' as const, 
    default: 'Sound familiar? You\'re experiencing what thousands of business owners face every day.' 
  },
  relatable_intro: { 
    type: 'string' as const, 
    default: 'Here\'s what we hear from business owners every single day:' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  category_icon_1: { type: 'string' as const, default: '⏰' },
  category_icon_2: { type: 'string' as const, default: '📈' },
  category_icon_3: { type: 'string' as const, default: '👥' },
  category_icon_4: { type: 'string' as const, default: '💼' },
  category_icon_5: { type: 'string' as const, default: '💡' }
};

// Helper function to add a new quote
const addQuote = (quotes: string, attributions: string, categories: string): { newQuotes: string; newAttributions: string; newCategories: string } => {
  const quoteList = quotes.split('|').map(t => t.trim()).filter(t => t);
  const attributionList = attributions.split('|').map(t => t.trim()).filter(t => t);
  const categoryList = categories.split('|').map(t => t.trim()).filter(t => t);

  // Add new quote with default content
  quoteList.push('Add your customer quote here...');
  attributionList.push('New Customer');
  categoryList.push('Challenge Category');

  return {
    newQuotes: quoteList.join('|'),
    newAttributions: attributionList.join('|'),
    newCategories: categoryList.join('|')
  };
};

// Helper function to remove a quote
const removeQuote = (quotes: string, attributions: string, categories: string, indexToRemove: number): { newQuotes: string; newAttributions: string; newCategories: string } => {
  const quoteList = quotes.split('|').map(t => t.trim()).filter(t => t);
  const attributionList = attributions.split('|').map(t => t.trim()).filter(t => t);
  const categoryList = categories.split('|').map(t => t.trim()).filter(t => t);

  // Remove the quote at the specified index
  if (indexToRemove >= 0 && indexToRemove < quoteList.length) {
    quoteList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < attributionList.length) {
    attributionList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < categoryList.length) {
    categoryList.splice(indexToRemove, 1);
  }

  return {
    newQuotes: quoteList.join('|'),
    newAttributions: attributionList.join('|'),
    newCategories: categoryList.join('|')
  };
};

export default function EmotionalQuotes(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<EmotionalQuotesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection: manual override > auto-detection > neutral
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral' as const;
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mappings
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        quoteIcon: 'text-orange-400',
        cardPrimaryBg: 'bg-white/10 backdrop-blur-sm border-white/20',
        cardPrimaryHover: 'hover:bg-white/20 hover:border-white/30',
        cardSecondaryBg: 'bg-white border-orange-200',
        cardSecondaryHover: 'hover:border-orange-300 hover:shadow-lg',
        impactBg: 'bg-orange-50',
        impactBorder: 'border-orange-200',
        impactText: 'text-orange-800',
        impactIcon: 'text-orange-600',
        contextBg: 'bg-orange-50/30',
        contextBorder: 'border-orange-100',
        addButtonBg: 'bg-orange-50 hover:bg-orange-100',
        addButtonBorder: 'border-orange-200 hover:border-orange-300',
        addButtonText: 'text-orange-700'
      },
      cool: {
        quoteIcon: 'text-blue-400',
        cardPrimaryBg: 'bg-white/10 backdrop-blur-sm border-white/20',
        cardPrimaryHover: 'hover:bg-white/20 hover:border-white/30',
        cardSecondaryBg: 'bg-white border-blue-200',
        cardSecondaryHover: 'hover:border-blue-300 hover:shadow-lg',
        impactBg: 'bg-blue-50',
        impactBorder: 'border-blue-200',
        impactText: 'text-blue-800',
        impactIcon: 'text-blue-600',
        contextBg: 'bg-blue-50/30',
        contextBorder: 'border-blue-100',
        addButtonBg: 'bg-blue-50 hover:bg-blue-100',
        addButtonBorder: 'border-blue-200 hover:border-blue-300',
        addButtonText: 'text-blue-700'
      },
      neutral: {
        quoteIcon: 'text-gray-400',
        cardPrimaryBg: 'bg-white/10 backdrop-blur-sm border-white/20',
        cardPrimaryHover: 'hover:bg-white/20 hover:border-white/30',
        cardSecondaryBg: 'bg-white border-gray-200',
        cardSecondaryHover: 'hover:border-gray-300 hover:shadow-lg',
        impactBg: 'bg-yellow-50',
        impactBorder: 'border-yellow-200',
        impactText: 'text-yellow-800',
        impactIcon: 'text-yellow-600',
        contextBg: 'bg-gray-50',
        contextBorder: 'border-gray-100',
        addButtonBg: 'bg-gray-50 hover:bg-gray-100',
        addButtonBorder: 'border-gray-200 hover:border-gray-300',
        addButtonText: 'text-gray-700'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiBlockTheme);

  const emotionalQuotes = blockContent.emotional_quotes 
    ? blockContent.emotional_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const quoteAttributions = blockContent.quote_attributions 
    ? blockContent.quote_attributions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const quoteCategories = blockContent.quote_categories 
    ? blockContent.quote_categories.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const quotes = emotionalQuotes.map((quote, index) => ({
    text: quote,
    attribution: quoteAttributions[index] || 'Anonymous Business Owner',
    category: quoteCategories[index] || 'Business Challenge'
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Get category icon for specific index (map quote index to category icon)
  const getCategoryIcon = (index: number) => {
    const iconFields = ['category_icon_1', 'category_icon_2', 'category_icon_3', 'category_icon_4', 'category_icon_5'];
    return blockContent[iconFields[index] as keyof EmotionalQuotesContent] || '💡';
  };

  // Handle adding a new quote
  const handleAddQuote = () => {
    const currentCount = (blockContent.emotional_quotes || '').split('|').filter(Boolean).length;
    if (currentCount >= 5) return; // Maximum 5 quotes

    const { newQuotes, newAttributions, newCategories } = addQuote(
      blockContent.emotional_quotes || '',
      blockContent.quote_attributions || '',
      blockContent.quote_categories || ''
    );

    handleContentUpdate('emotional_quotes', newQuotes);
    handleContentUpdate('quote_attributions', newAttributions);
    handleContentUpdate('quote_categories', newCategories);

    // Set default icon for new quote
    const iconField = `category_icon_${currentCount + 1}` as keyof EmotionalQuotesContent;
    handleContentUpdate(iconField, '💡');
  };

  // Handle removing a quote
  const handleRemoveQuote = (indexToRemove: number) => {
    const currentCount = (blockContent.emotional_quotes || '').split('|').filter(Boolean).length;
    if (currentCount <= 1) return; // Keep at least 1 quote

    const { newQuotes, newAttributions, newCategories } = removeQuote(
      blockContent.emotional_quotes || '',
      blockContent.quote_attributions || '',
      blockContent.quote_categories || '',
      indexToRemove
    );

    handleContentUpdate('emotional_quotes', newQuotes);
    handleContentUpdate('quote_attributions', newAttributions);
    handleContentUpdate('quote_categories', newCategories);

    // Clear the corresponding icon if it exists
    const iconField = `category_icon_${indexToRemove + 1}` as keyof EmotionalQuotesContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '💡');
    }

    // Shift icons down to fill gaps
    for (let i = indexToRemove + 1; i < currentCount; i++) {
      const currentIconField = `category_icon_${i + 1}` as keyof EmotionalQuotesContent;
      const nextIconField = `category_icon_${i}` as keyof EmotionalQuotesContent;
      const iconValue = blockContent[currentIconField] || '💡';
      handleContentUpdate(nextIconField, iconValue);
    }
  };

  // Handle individual editing
  const handleQuoteEdit = (index: number, value: string) => {
    const newQuotes = [...emotionalQuotes];
    newQuotes[index] = value;
    handleContentUpdate('emotional_quotes', newQuotes.join('|'));
  };

  const handleAttributionEdit = (index: number, value: string) => {
    const newAttributions = [...quoteAttributions];
    newAttributions[index] = value;
    handleContentUpdate('quote_attributions', newAttributions.join('|'));
  };

  const handleCategoryEdit = (index: number, value: string) => {
    const newCategories = [...quoteCategories];
    newCategories[index] = value;
    handleContentUpdate('quote_categories', newCategories.join('|'));
  };

  const handleIconEdit = (index: number, value: string) => {
    const iconField = `category_icon_${index + 1}` as keyof EmotionalQuotesContent;
    handleContentUpdate(iconField, value);
  };

  // WYSIWYG Quote Card - same display for edit and preview modes
  const QuoteCard = React.memo(({ quote, index, onRemove, canRemove }: {
    quote: typeof quotes[0];
    index: number;
    onRemove?: (index: number) => void;
    canRemove?: boolean;
  }) => {
    // Get card background based on section background AND theme
    const cardBackground = backgroundType === 'primary'
      ? themeColors.cardPrimaryBg
      : themeColors.cardSecondaryBg;

    const cardHover = backgroundType === 'primary'
      ? themeColors.cardPrimaryHover
      : themeColors.cardSecondaryHover;

    return (
      <div className={`group/quote-card-${index} relative p-8 rounded-2xl border ${cardBackground} ${cardHover} transition-all duration-300`}>
        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && onRemove && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (quote.text.trim() && !confirm('Are you sure you want to remove this quote?')) {
                return;
              }
              onRemove(index);
            }}
            className={`opacity-0 group-hover/quote-card-${index}:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200`}
            title="Remove this quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Quote Icon */}
        <div className="mb-6">
          <svg className={`w-12 h-12 ${themeColors.quoteIcon}`} fill="currentColor" viewBox="0 0 32 32">
            <path d="M13.8 9.6L13.8 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L15.5 12c-0.5-1.5-1.9-2.4-3.5-2.4H13.8z"/>
            <path d="M24.2 9.6L24.2 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L25.9 12c-0.5-1.5-1.9-2.4-3.5-2.4H24.2z"/>
          </svg>
        </div>

        {/* Editable Quote Text */}
        <blockquote className="text-lg leading-relaxed mb-6 italic">
          "
          <EditableAdaptiveText
            mode={mode}
            value={quote.text}
            onEdit={(value) => handleQuoteEdit(index, value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            variant="body"
            className="inline"
            placeholder="Add customer quote..."
            sectionId={sectionId}
            elementKey={`quote_text_${index}`}
            sectionBackground={sectionBackground}
          />
          "
        </blockquote>

        {/* Attribution and Category */}
        <div className="flex items-center space-x-3">
          {/* Editable Icon */}
          <div className={`w-8 h-8 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center text-white group/icon-edit relative`}>
            <IconEditableText
              mode={mode}
              value={getCategoryIcon(index)}
              onEdit={(value) => handleIconEdit(index, value)}
              backgroundType={backgroundType as any}
              colorTokens={{...colorTokens, textPrimary: 'text-white'}}
              iconSize="md"
              className="text-lg text-white"
              sectionId={sectionId}
              elementKey={`category_icon_${index + 1}`}
            />
          </div>

          <div className="flex-1">
            {/* Editable Attribution */}
            <div className="font-semibold">
              <EditableAdaptiveText
                mode={mode}
                value={quote.attribution}
                onEdit={(value) => handleAttributionEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="inline font-semibold"
                placeholder="Customer name"
                sectionId={sectionId}
                elementKey={`quote_attribution_${index}`}
                sectionBackground={sectionBackground}
              />
            </div>

            {/* Editable Category */}
            <div className={`text-sm ${mutedTextColor} mt-1`}>
              <EditableAdaptiveText
                mode={mode}
                value={quote.category}
                onEdit={(value) => handleCategoryEdit(index, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="inline text-sm"
                placeholder="Challenge category"
                sectionId={sectionId}
                elementKey={`quote_category_${index}`}
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        </div>
      </div>
    );
  });
  QuoteCard.displayName = 'QuoteCard';
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="EmotionalQuotes"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the emotional quotes..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {(blockContent.relatable_intro || mode === 'edit') && (
            <div className="max-w-4xl mx-auto mb-8">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.relatable_intro || ''}
                onEdit={(value) => handleContentUpdate('relatable_intro', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-xl leading-relaxed"
                placeholder="Add relatable introduction text..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="relatable_intro"
              />
            </div>
          )}
        </div>

        {/* WYSIWYG Quote Cards Grid - same for edit and preview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {quotes.map((quote, index) => (
            <QuoteCard
              key={index}
              quote={quote}
              index={index}
              onRemove={handleRemoveQuote}
              canRemove={quotes.length > 1}
            />
          ))}
        </div>

        {/* Add Quote Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && quotes.length < 5 && (
          <div className="mb-12 flex justify-center">
            <button
              onClick={handleAddQuote}
              className={`flex items-center space-x-2 px-4 py-3 ${themeColors.addButtonBg} border-2 ${themeColors.addButtonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addButtonText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addButtonText} font-medium`}>Add Quote</span>
            </button>
          </div>
        )}

        {/* Context and Emotional Impact */}
        {(blockContent.context_text || blockContent.emotional_impact || mode === 'edit') && (
          <div className={`${themeColors.contextBg} rounded-2xl p-8 border ${themeColors.contextBorder} mb-12`}>
            <div className="max-w-4xl mx-auto text-center">
              {(blockContent.context_text || mode === 'edit') && (
                <div className="mb-6">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.context_text || ''}
                    onEdit={(value) => handleContentUpdate('context_text', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-lg leading-relaxed"
                    placeholder="Add context about these customer quotes..."
                    sectionId={sectionId}
                    elementKey="context_text"
                    sectionBackground={sectionBackground}
                  />
                </div>
              )}

              {(blockContent.emotional_impact || mode === 'edit') && (
                <div className={`${themeColors.impactBg} border ${themeColors.impactBorder} rounded-xl p-6`}>
                  <div className="flex items-center justify-center space-x-3">
                    <svg className={`w-8 h-8 ${themeColors.impactIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className={`text-xl font-semibold ${themeColors.impactText}`}>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.emotional_impact || ''}
                        onEdit={(value) => handleContentUpdate('emotional_impact', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={{...colorTokens, textPrimary: themeColors.impactText}}
                        variant="body"
                        className={`inline font-semibold ${themeColors.impactText}`}
                        placeholder="Add emotional impact statement..."
                        sectionId={sectionId}
                        elementKey="emotional_impact"
                        sectionBackground={sectionBackground}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the emotional connection..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {trustItems.length > 0 && (
              <TrustIndicators 
                items={trustItems}
                colorClass={mutedTextColor}
                iconColor="text-green-500"
              />
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'EmotionalQuotes',
  category: 'Problem',
  description: 'WYSIWYG emotional customer quotes with inline editing. Perfect for building empathy and connection with consistent edit/preview experience.',
  tags: ['quotes', 'emotional', 'testimonials', 'empathy', 'wysiwyg', 'inline-editing'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'emotional_quotes', label: 'Emotional Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'quote_attributions', label: 'Quote Attributions (pipe separated)', type: 'text', required: true },
    { key: 'quote_categories', label: 'Quote Categories (pipe separated)', type: 'text', required: false },
    { key: 'context_text', label: 'Context Text', type: 'textarea', required: false },
    { key: 'emotional_impact', label: 'Emotional Impact Statement', type: 'text', required: false },
    { key: 'relatable_intro', label: 'Relatable Introduction', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'category_icon_1', label: 'Category Icon 1', type: 'icon', required: false },
    { key: 'category_icon_2', label: 'Category Icon 2', type: 'icon', required: false },
    { key: 'category_icon_3', label: 'Category Icon 3', type: 'icon', required: false },
    { key: 'category_icon_4', label: 'Category Icon 4', type: 'icon', required: false },
    { key: 'category_icon_5', label: 'Category Icon 5', type: 'icon', required: false }
  ],

  features: [
    'WYSIWYG inline editing - same display for edit and preview modes',
    'Direct text editing within quote cards',
    'Inline icon selection with IconEditableText',
    'Category-based quote organization with editable icons',
    'Emotional impact highlighting with inline editing',
    'Adaptive text colors based on background type',
    'Consistent card layout similar to IconGrid pattern'
  ],

  useCases: [
    'Problem empathy sections',
    'Customer pain point validation',
    'Emotional connection building',
    'Testimonial-based problem presentation',
    'Social proof for challenges',
    'User story collections with visual consistency'
  ]
};