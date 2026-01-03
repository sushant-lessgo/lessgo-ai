// components/layout/QuoteBackedAnswers.tsx - Objection UIBlock with authoritative expert quotes
// Builds credibility through expert testimonials and authoritative sources

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Content interface for type safety
interface QuoteBackedAnswersContent {
  headline: string;
  subheadline?: string;
  // Individual quote/objection fields (up to 6 items)
  objection_1: string;
  quote_response_1: string;
  quote_attribution_1: string;
  objection_2: string;
  quote_response_2: string;
  quote_attribution_2: string;
  objection_3: string;
  quote_response_3: string;
  quote_attribution_3: string;
  objection_4: string;
  quote_response_4: string;
  quote_attribution_4: string;
  objection_5: string;
  quote_response_5: string;
  quote_attribution_5: string;
  objection_6: string;
  quote_response_6: string;
  quote_attribution_6: string;
  // Optional source credential fields
  source_credentials?: string;
  expert_label?: string;
  verification_label?: string;
  trust_indicator_1?: string;
  trust_indicator_2?: string;
  trust_indicator_3?: string;
  quote_icon?: string;
  verification_icon?: string;
  trust_icon_1?: string;
  trust_icon_2?: string;
  trust_icon_3?: string;
  // Legacy field for backward compatibility
  quote_blocks?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'What Industry Experts Are Saying'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Don\'t just take our word for it. Here\'s what leading authorities in the field have to say.'
  },
  // Individual objection/quote/attribution triplets
  objection_1: { type: 'string' as const, default: 'Is this really better than existing solutions?' },
  quote_response_1: { type: 'string' as const, default: 'This approach is exactly what the industry has been waiting for. The implementation is both sophisticated and accessible.' },
  quote_attribution_1: { type: 'string' as const, default: 'Dr. Sarah Chen, CTO at TechForward' },
  objection_2: { type: 'string' as const, default: 'How secure is this platform really?' },
  quote_response_2: { type: 'string' as const, default: 'The security framework they\'ve built exceeds enterprise standards while remaining user-friendly.' },
  quote_attribution_2: { type: 'string' as const, default: 'Mark Rodriguez, CISO at SecureBase' },
  objection_3: { type: 'string' as const, default: 'Does it actually deliver on its promises?' },
  quote_response_3: { type: 'string' as const, default: 'I\'ve seen many solutions in this space, but this one actually delivers on its promises.' },
  quote_attribution_3: { type: 'string' as const, default: 'Lisa Thompson, VP Engineering at DataScale' },
  objection_4: { type: 'string' as const, default: 'What about the return on investment?' },
  quote_response_4: { type: 'string' as const, default: 'The ROI we\'ve seen is unprecedented - this isn\'t just a tool, it\'s a competitive advantage.' },
  quote_attribution_4: { type: 'string' as const, default: 'James Wilson, CEO at GrowthTech' },
  objection_5: { type: 'string' as const, default: 'Is this suitable for our industry?' },
  quote_response_5: { type: 'string' as const, default: 'We\'ve implemented this across multiple verticals, and the results are consistently exceptional.' },
  quote_attribution_5: { type: 'string' as const, default: 'Amanda Foster, Solutions Architect at IndustryTech' },
  objection_6: { type: 'string' as const, default: 'What about support and maintenance?' },
  quote_response_6: { type: 'string' as const, default: 'Their support team is incredibly responsive, and the platform practically maintains itself.' },
  quote_attribution_6: { type: 'string' as const, default: 'Michael Thompson, Operations Director at ScaleUp' },
  // Source credibility settings
  source_credentials: { type: 'string' as const, default: 'All quotes from verified industry professionals with 10+ years experience' },
  expert_label: { type: 'string' as const, default: 'Industry Expert' },
  verification_label: { type: 'string' as const, default: 'Verified' },
  trust_indicator_1: { type: 'string' as const, default: 'Verified Experts' },
  trust_indicator_2: { type: 'string' as const, default: 'Industry Recognition' },
  trust_indicator_3: { type: 'string' as const, default: 'Independent Reviews' },
  // Icons
  quote_icon: { type: 'string' as const, default: '💬' },
  verification_icon: { type: 'string' as const, default: '✅' },
  trust_icon_1: { type: 'string' as const, default: '🛡️' },
  trust_icon_2: { type: 'string' as const, default: '⭐' },
  trust_icon_3: { type: 'string' as const, default: '📊' },
  // Legacy field for backward compatibility
  quote_blocks: {
    type: 'string' as const,
    default: 'This approach is exactly what the industry has been waiting for. The implementation is both sophisticated and accessible.|Dr. Sarah Chen, CTO at TechForward|The security framework they\'ve built exceeds enterprise standards while remaining user-friendly.|Mark Rodriguez, CISO at SecureBase|I\'ve seen many solutions in this space, but this one actually delivers on its promises.|Lisa Thompson, VP Engineering at DataScale|The ROI we\'ve seen is unprecedented - this isn\'t just a tool, it\'s a competitive advantage.|James Wilson, CEO at GrowthTech'
  }
};

// Parse quote data from both individual and legacy formats
const parseQuoteData = (content: QuoteBackedAnswersContent): Array<{objection: string, quote: string, attribution: string, index: number}> => {
  const quotes: Array<{objection: string, quote: string, attribution: string, index: number}> = [];

  // Check for individual fields first (preferred format)
  const individualQuotes = [
    { objection: content.objection_1, quote: content.quote_response_1, attribution: content.quote_attribution_1 },
    { objection: content.objection_2, quote: content.quote_response_2, attribution: content.quote_attribution_2 },
    { objection: content.objection_3, quote: content.quote_response_3, attribution: content.quote_attribution_3 },
    { objection: content.objection_4, quote: content.quote_response_4, attribution: content.quote_attribution_4 },
    { objection: content.objection_5, quote: content.quote_response_5, attribution: content.quote_attribution_5 },
    { objection: content.objection_6, quote: content.quote_response_6, attribution: content.quote_attribution_6 }
  ];

  // Process individual fields
  individualQuotes.forEach((item, index) => {
    if (item.objection && item.objection.trim() && item.quote && item.quote.trim()) {
      quotes.push({
        objection: item.objection.trim(),
        quote: item.quote.trim(),
        attribution: item.attribution?.trim() || 'Anonymous Expert',
        index
      });
    }
  });

  // Fallback to legacy format if no individual fields
  if (quotes.length === 0 && content.quote_blocks) {
    const blocks = content.quote_blocks.split('|');
    for (let i = 0; i < blocks.length; i += 2) {
      if (blocks[i] && blocks[i].trim()) {
        quotes.push({
          objection: `Expert perspective ${Math.floor(i / 2) + 1}`, // Generate generic objection
          quote: blocks[i].trim(),
          attribution: blocks[i + 1]?.trim() || 'Anonymous Expert',
          index: Math.floor(i / 2)
        });
      }
    }
  }

  return quotes;
};

// Helper function to get next available quote slot
const getNextAvailableQuoteSlot = (content: QuoteBackedAnswersContent): number => {
  const quotes = [
    content.objection_1,
    content.objection_2,
    content.objection_3,
    content.objection_4,
    content.objection_5,
    content.objection_6
  ];

  for (let i = 0; i < quotes.length; i++) {
    if (!quotes[i] || quotes[i].trim() === '') {
      return i + 1;
    }
  }

  return -1; // No slots available
};

// Helper function to shift quotes down when removing one
const shiftQuotesDown = (content: QuoteBackedAnswersContent, removedIndex: number): Partial<QuoteBackedAnswersContent> => {
  const updates: Partial<QuoteBackedAnswersContent> = {};

  // Get all quotes after filtering out empty ones
  const allQuotes = [
    { objection: content.objection_1, quote: content.quote_response_1, attribution: content.quote_attribution_1 },
    { objection: content.objection_2, quote: content.quote_response_2, attribution: content.quote_attribution_2 },
    { objection: content.objection_3, quote: content.quote_response_3, attribution: content.quote_attribution_3 },
    { objection: content.objection_4, quote: content.quote_response_4, attribution: content.quote_attribution_4 },
    { objection: content.objection_5, quote: content.quote_response_5, attribution: content.quote_attribution_5 },
    { objection: content.objection_6, quote: content.quote_response_6, attribution: content.quote_attribution_6 }
  ];

  // Filter out the removed item and empty quotes
  const validQuotes = allQuotes
    .map((quote, index) => ({ ...quote, originalIndex: index }))
    .filter((quote, index) => index !== removedIndex && quote.objection && quote.objection.trim())
    .slice(0, 5); // Limit to 5 since one is being removed

  // Clear all fields first
  for (let i = 1; i <= 6; i++) {
    updates[`objection_${i}` as keyof QuoteBackedAnswersContent] = '';
    updates[`quote_response_${i}` as keyof QuoteBackedAnswersContent] = '';
    updates[`quote_attribution_${i}` as keyof QuoteBackedAnswersContent] = '';
  }

  // Reassign remaining quotes
  validQuotes.forEach((quote, newIndex) => {
    const fieldNum = newIndex + 1;
    updates[`objection_${fieldNum}` as keyof QuoteBackedAnswersContent] = quote.objection || '';
    updates[`quote_response_${fieldNum}` as keyof QuoteBackedAnswersContent] = quote.quote || '';
    updates[`quote_attribution_${fieldNum}` as keyof QuoteBackedAnswersContent] = quote.attribution || '';
  });

  return updates;
};

export default function QuoteBackedAnswers(props: LayoutComponentProps) {

  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<QuoteBackedAnswersContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getQuoteColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        quoteIconBg: 'bg-orange-500',
        quoteBg: 'bg-white/80',
        quoteBorder: 'border-orange-200',
        quoteHoverShadow: 'hover:shadow-orange-200/30',
        avatarGradient: 'from-orange-400 to-red-500',
        verificationBg: 'bg-orange-100',
        verificationText: 'text-orange-700',
        trustIcons: ['text-orange-500', 'text-orange-600', 'text-orange-500']
      },
      cool: {
        quoteIconBg: 'bg-blue-500',
        quoteBg: 'bg-white/80',
        quoteBorder: 'border-blue-200',
        quoteHoverShadow: 'hover:shadow-blue-200/30',
        avatarGradient: 'from-blue-400 to-indigo-500',
        verificationBg: 'bg-blue-100',
        verificationText: 'text-blue-700',
        trustIcons: ['text-blue-500', 'text-blue-600', 'text-blue-500']
      },
      neutral: {
        quoteIconBg: 'bg-gray-500',
        quoteBg: 'bg-white/80',
        quoteBorder: 'border-gray-200',
        quoteHoverShadow: 'hover:shadow-gray-200/30',
        avatarGradient: 'from-gray-400 to-gray-500',
        verificationBg: 'bg-gray-100',
        verificationText: 'text-gray-700',
        trustIcons: ['text-gray-500', 'text-gray-600', 'text-gray-500']
      }
    }[theme];
  };

  const colors = getQuoteColors(theme);

  // Parse quote blocks from pipe-separated string
  const quoteBlocks = blockContent.quote_blocks
    ? blockContent.quote_blocks.split('|').reduce((quotes, item, index) => {
        if (index % 2 === 0) {
          quotes.push({ quote: item.trim(), author: '' });
        } else {
          quotes[quotes.length - 1].author = item.trim();
        }
        return quotes;
      }, [] as Array<{quote: string, author: string}>)
    : [];

  // Handle adding a new quote
  const handleAddQuote = () => {
    const nextSlot = getNextAvailableQuoteSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`objection_${nextSlot}` as keyof QuoteBackedAnswersContent, 'New objection or concern');
      handleContentUpdate(`quote_response_${nextSlot}` as keyof QuoteBackedAnswersContent, 'Response backed by credible quote');
      handleContentUpdate(`quote_attribution_${nextSlot}` as keyof QuoteBackedAnswersContent, 'Expert Name, Title');
    }
  };

  // Handle removing a quote
  const handleRemoveQuote = (indexToRemove: number) => {
    const fieldNum = indexToRemove + 1;
    handleContentUpdate(`objection_${fieldNum}` as keyof QuoteBackedAnswersContent, '');
    handleContentUpdate(`quote_response_${fieldNum}` as keyof QuoteBackedAnswersContent, '');
    handleContentUpdate(`quote_attribution_${fieldNum}` as keyof QuoteBackedAnswersContent, '');
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="QuoteBackedAnswers"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
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
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a subheadline that introduces the expert validation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Quotes Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {quoteBlocks.map((quoteBlock, index) => (
            <div key={index} className={`relative group/quote-card-${index}`}>
              
              {/* Quote Card */}
              <div className={`${colors.quoteBg} backdrop-blur-sm border ${colors.quoteBorder} rounded-2xl p-8 shadow-lg ${colors.quoteHoverShadow} hover:shadow-xl transition-shadow duration-300 h-full`}>

                {/* Quote Icon */}
                <div className="absolute -top-4 left-8">
                  <div className={`w-8 h-8 ${colors.quoteIconBg} rounded-full flex items-center justify-center`}>
                    <IconEditableText
                      mode={mode}
                      value={blockContent.quote_icon || '💬'}
                      onEdit={(value) => handleContentUpdate('quote_icon', value)}
                      backgroundType="custom"
                      colorTokens={{...colorTokens, primaryText: 'text-white'}}
                      iconSize="sm"
                      className="text-base text-white"
                      sectionId={sectionId}
                      elementKey="quote_icon"
                    />
                  </div>
                </div>

                {/* Quote Content */}
                <div className="pt-6">
                  <EditableAdaptiveText
                    mode={mode}
                    value={quoteBlock.quote || ''}
                    onEdit={(value) => {
                      const updatedQuotes = (blockContent.quote_blocks || '').split('|');
                      updatedQuotes[index * 2] = value;
                      handleContentUpdate('quote_blocks', updatedQuotes.join('|'));
                    }}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-800 text-lg leading-relaxed mb-6 italic"
                    placeholder="Enter quote text"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`quote_${index}_text`}
                  />

                  {/* Author */}
                  <div className="flex items-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${colors.avatarGradient} rounded-full flex items-center justify-center text-white font-bold mr-4`}>
                      {quoteBlock.author.split(' ').map(name => name[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={quoteBlock.author || ''}
                        onEdit={(value) => {
                          const updatedQuotes = (blockContent.quote_blocks || '').split('|');
                          updatedQuotes[index * 2 + 1] = value;
                          handleContentUpdate('quote_blocks', updatedQuotes.join('|'));
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="font-semibold text-gray-900"
                        placeholder="Enter author name"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`quote_${index}_author`}
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.expert_label || ''}
                        onEdit={(value) => handleContentUpdate('expert_label', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-gray-600"
                        placeholder="Expert label"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="expert_label"
                      />
                    </div>
                  </div>
                </div>

                {/* Delete button - only show in edit mode and if can remove */}
                {mode === 'edit' && quoteBlocks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveQuote(index);
                    }}
                    className={`absolute top-4 right-4 opacity-0 group-hover/quote-card-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10`}
                    title="Remove this quote"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Verification Badge */}
                <div className={`absolute top-4 ${mode === 'edit' && quoteBlocks.length > 1 ? 'right-12' : 'right-4'}`}>
                  <div className={`flex items-center space-x-1 ${colors.verificationBg} ${colors.verificationText} px-2 py-1 rounded-full text-xs font-medium`}>
                    <IconEditableText
                      mode={mode}
                      value={blockContent.verification_icon || '✅'}
                      onEdit={(value) => handleContentUpdate('verification_icon', value)}
                      backgroundType="custom"
                      colorTokens={{...colorTokens, primaryText: 'text-green-700'}}
                      iconSize="sm"
                      className="text-xs"
                      sectionId={sectionId}
                      elementKey="verification_icon"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.verification_label || ''}
                      onEdit={(value) => handleContentUpdate('verification_label', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-xs font-medium"
                      placeholder="Verification text"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="verification_label"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Quote Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && quoteBlocks.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddQuote}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Quote</span>
            </button>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 flex-wrap gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <IconEditableText
                mode={mode}
                value={blockContent.trust_icon_1 || '🛡️'}
                onEdit={(value) => handleContentUpdate('trust_icon_1', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="sm"
                className={`text-xl ${colors.trustIcons[0]}`}
                sectionId={sectionId}
                elementKey="trust_icon_1"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.trust_indicator_1 || ''}
                onEdit={(value) => handleContentUpdate('trust_indicator_1', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm font-medium"
                placeholder="Trust indicator 1"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="trust_indicator_1"
              />
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <IconEditableText
                mode={mode}
                value={blockContent.trust_icon_2 || '⭐'}
                onEdit={(value) => handleContentUpdate('trust_icon_2', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="sm"
                className={`text-xl ${colors.trustIcons[1]}`}
                sectionId={sectionId}
                elementKey="trust_icon_2"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.trust_indicator_2 || ''}
                onEdit={(value) => handleContentUpdate('trust_indicator_2', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm font-medium"
                placeholder="Trust indicator 2"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="trust_indicator_2"
              />
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <IconEditableText
                mode={mode}
                value={blockContent.trust_icon_3 || '📊'}
                onEdit={(value) => handleContentUpdate('trust_icon_3', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                iconSize="sm"
                className={`text-xl ${colors.trustIcons[2]}`}
                sectionId={sectionId}
                elementKey="trust_icon_3"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.trust_indicator_3 || ''}
                onEdit={(value) => handleContentUpdate('trust_indicator_3', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm font-medium"
                placeholder="Trust indicator 3"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="trust_indicator_3"
              />
            </div>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'QuoteBackedAnswers',
  category: 'Objection Sections',
  description: 'Authoritative answers backed by expert quotes and testimonials to build credibility and trust.',
  tags: ['objection', 'credibility', 'testimonials', 'expert-quotes', 'authority'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'quote_blocks', label: 'Quote Blocks (pipe separated: quote|author|quote|author)', type: 'textarea', required: true }
  ],
  
  features: [
    'Expert quote cards with author attribution',
    'Verification badges for credibility',
    'Trust indicators at the bottom',
    'Automatic text color adaptation based on background'
  ],
  
  useCases: [
    'Enterprise sales pages requiring authority validation',
    'High-stakes B2B decision making',
    'Complex technical products needing expert endorsement',
    'Compliance-heavy industries requiring third-party validation'
  ]
};