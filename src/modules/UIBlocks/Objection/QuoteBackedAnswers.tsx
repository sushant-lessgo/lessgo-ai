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

// Content interface for type safety
interface QuoteBackedAnswersContent {
  headline: string;
  subheadline?: string;
  quote_blocks: string;
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
  quote_blocks: { 
    type: 'string' as const, 
    default: 'This approach is exactly what the industry has been waiting for. The implementation is both sophisticated and accessible.|Dr. Sarah Chen, CTO at TechForward|The security framework they\'ve built exceeds enterprise standards while remaining user-friendly.|Mark Rodriguez, CISO at SecureBase|I\'ve seen many solutions in this space, but this one actually delivers on its promises.|Lisa Thompson, VP Engineering at DataScale|The ROI we\'ve seen is unprecedented - this isn\'t just a tool, it\'s a competitive advantage.|James Wilson, CEO at GrowthTech' 
  },
  expert_label: {
    type: 'string' as const,
    default: 'Industry Expert'
  },
  verification_label: {
    type: 'string' as const,
    default: 'Verified'
  },
  trust_indicator_1: {
    type: 'string' as const,
    default: 'Verified Experts'
  },
  trust_indicator_2: {
    type: 'string' as const,
    default: 'Industry Recognition'
  },
  trust_indicator_3: {
    type: 'string' as const,
    default: 'Independent Reviews'
  },
  quote_icon: { type: 'string' as const, default: '💬' },
  verification_icon: { type: 'string' as const, default: '✅' },
  trust_icon_1: { type: 'string' as const, default: '🛡️' },
  trust_icon_2: { type: 'string' as const, default: '⭐' },
  trust_icon_3: { type: 'string' as const, default: '📊' }
};

// Helper function to add a new quote block
const addQuoteBlock = (quoteBlocks: string): string => {
  const blocks = quoteBlocks ? quoteBlocks.split('|') : [];
  const quotes = [];
  const authors = [];

  // Parse existing blocks
  for (let i = 0; i < blocks.length; i += 2) {
    if (blocks[i]) quotes.push(blocks[i].trim());
    if (blocks[i + 1]) authors.push(blocks[i + 1].trim());
  }

  // Add new quote
  quotes.push('Enter a compelling quote from an industry expert that validates your solution.');
  authors.push('Expert Name, Title at Company');

  // Rebuild the string
  const result = [];
  for (let i = 0; i < quotes.length; i++) {
    result.push(quotes[i]);
    result.push(authors[i] || '');
  }

  return result.join('|');
};

// Helper function to remove a quote block
const removeQuoteBlock = (quoteBlocks: string, indexToRemove: number): string => {
  const blocks = quoteBlocks ? quoteBlocks.split('|') : [];
  const quotes = [];
  const authors = [];

  // Parse existing blocks
  for (let i = 0; i < blocks.length; i += 2) {
    if (blocks[i]) quotes.push(blocks[i].trim());
    if (blocks[i + 1]) authors.push(blocks[i + 1].trim());
  }

  // Remove the quote at the specified index
  if (indexToRemove >= 0 && indexToRemove < quotes.length) {
    quotes.splice(indexToRemove, 1);
    authors.splice(indexToRemove, 1);
  }

  // Rebuild the string
  const result = [];
  for (let i = 0; i < quotes.length; i++) {
    result.push(quotes[i]);
    result.push(authors[i] || '');
  }

  return result.join('|');
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
    const newQuoteBlocks = addQuoteBlock(blockContent.quote_blocks);
    handleContentUpdate('quote_blocks', newQuoteBlocks);
  };

  // Handle removing a quote
  const handleRemoveQuote = (indexToRemove: number) => {
    const newQuoteBlocks = removeQuoteBlock(blockContent.quote_blocks, indexToRemove);
    handleContentUpdate('quote_blocks', newQuoteBlocks);
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
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                
                {/* Quote Icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
                      const updatedQuotes = blockContent.quote_blocks.split('|');
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {quoteBlock.author.split(' ').map(name => name[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={quoteBlock.author || ''}
                        onEdit={(value) => {
                          const updatedQuotes = blockContent.quote_blocks.split('|');
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
                  <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
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
                className="text-xl text-blue-500"
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
                className="text-xl text-green-500"
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
                className="text-xl text-purple-500"
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