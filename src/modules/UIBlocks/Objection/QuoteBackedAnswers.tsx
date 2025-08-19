// components/layout/QuoteBackedAnswers.tsx - Objection UIBlock with authoritative expert quotes
// Builds credibility through expert testimonials and authoritative sources

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
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
  }
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
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
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
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
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
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
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
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
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
        {mode === 'edit' && (
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