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
            <div key={index} className="relative">
              
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

                {/* Verification Badge */}
                <div className="absolute top-4 right-4">
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

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Quote Blocks:</strong> Use format "[quote]|[author name, title]|[next quote]|[next author]"
            </p>
          </div>
        )}
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