import React, { useState } from 'react';
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

  const [activeQuote, setActiveQuote] = useState(0);

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

  const QuoteCard = ({ quote, index, isActive }: {
    quote: typeof quotes[0];
    index: number;
    isActive: boolean;
  }) => (
    <div 
      className={`bg-white rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer ${
        isActive 
          ? 'border-blue-300 shadow-xl scale-105' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
      onClick={() => setActiveQuote(index)}
    >
      {/* Quote Icon */}
      <div className="mb-6">
        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 32 32">
          <path d="M13.8 9.6L13.8 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L15.5 12c-0.5-1.5-1.9-2.4-3.5-2.4H13.8z"/>
          <path d="M24.2 9.6L24.2 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L25.9 12c-0.5-1.5-1.9-2.4-3.5-2.4H24.2z"/>
        </svg>
      </div>

      {/* Quote Text */}
      <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic">
        "{quote.text}"
      </blockquote>

      {/* Attribution */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900">{quote.attribution}</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-8 h-8 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center text-white group/icon-edit relative`}>
              <IconEditableText
                mode={mode}
                value={getCategoryIcon(index)}
                onEdit={(value) => {
                  const iconField = `category_icon_${index + 1}` as keyof EmotionalQuotesContent;
                  handleContentUpdate(iconField, value);
                }}
                backgroundType={backgroundType as any}
                colorTokens={{...colorTokens, textPrimary: 'text-white'}}
                iconSize="md"
                className="text-lg text-white"
                sectionId={sectionId}
                elementKey={`category_icon_${index + 1}`}
              />
            </div>
            <span className={`text-sm ${mutedTextColor}`}>{quote.category}</span>
          </div>
        </div>
        
        {isActive && (
          <div className="text-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
  
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

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Emotional Quotes Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.emotional_quotes || ''}
                  onEdit={(value) => handleContentUpdate('emotional_quotes', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Emotional quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="emotional_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.quote_attributions || ''}
                  onEdit={(value) => handleContentUpdate('quote_attributions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Quote attributions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="quote_attributions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.quote_categories || ''}
                  onEdit={(value) => handleContentUpdate('quote_categories', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Quote categories (pipe separated)"
                  sectionId={sectionId}
                  elementKey="quote_categories"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.context_text || ''}
                  onEdit={(value) => handleContentUpdate('context_text', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Context text"
                  sectionId={sectionId}
                  elementKey="context_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quote Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {quotes.map((quote, index) => (
                <QuoteCard
                  key={index}
                  quote={quote}
                  index={index}
                  isActive={activeQuote === index}
                />
              ))}
            </div>

            {/* Featured Quote Display */}
            {quotes[activeQuote] && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 mb-16">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="mb-6">
                    <svg className="w-16 h-16 text-orange-400 mx-auto" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M13.8 9.6L13.8 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L15.5 12c-0.5-1.5-1.9-2.4-3.5-2.4H13.8z"/>
                      <path d="M24.2 9.6L24.2 9.6c-1.6 0-3.2 0.6-4.4 1.8s-1.8 2.8-1.8 4.4c0 1.6 0.6 3.2 1.8 4.4s2.8 1.8 4.4 1.8c1.6 0 3.2-0.6 4.4-1.8 1.2-1.2 1.8-2.8 1.8-4.4 0-0.4 0-0.8-0.1-1.2l1.8-5.8h-4.4L25.9 12c-0.5-1.5-1.9-2.4-3.5-2.4H24.2z"/>
                    </svg>
                  </div>
                  
                  <blockquote className="text-2xl text-gray-800 leading-relaxed mb-6 italic font-medium">
                    "{quotes[activeQuote].text}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${colorTokens.ctaBg} flex items-center justify-center text-white group/icon-edit relative`}>
                      <IconEditableText
                        mode={mode}
                        value={getCategoryIcon(activeQuote)}
                        onEdit={(value) => {
                          const iconField = `category_icon_${activeQuote + 1}` as keyof EmotionalQuotesContent;
                          handleContentUpdate(iconField, value);
                        }}
                        backgroundType={backgroundType as any}
                        colorTokens={{...colorTokens, textPrimary: 'text-white'}}
                        iconSize="lg"
                        className="text-2xl text-white"
                        sectionId={sectionId}
                        elementKey={`featured_category_icon_${activeQuote + 1}`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{quotes[activeQuote].attribution}</div>
                      <div className={`text-sm ${mutedTextColor}`}>{quotes[activeQuote].category}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context and Emotional Impact */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-16">
              <div className="max-w-4xl mx-auto text-center">
                {blockContent.context_text && (
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    {blockContent.context_text}
                  </p>
                )}
                
                {blockContent.emotional_impact && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-6">
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-xl font-semibold text-yellow-800">
                        {blockContent.emotional_impact}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Preview */}
            <div className="text-center bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                The Good News: You Don't Have to Stay Stuck
              </h3>
              <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto mb-8`}>
                Every business owner quoted above found a way out of their struggle. They discovered solutions that transformed their daily experience from frustration to fulfillment.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-blue-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recognition</h4>
                  <p className="text-sm text-gray-600">Acknowledging the problem is the first step</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-blue-200">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Solution</h4>
                  <p className="text-sm text-gray-600">Finding the right tools and approach</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-blue-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Transformation</h4>
                  <p className="text-sm text-gray-600">Experiencing the relief and growth</p>
                </div>
              </div>
            </div>
          </>
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
  description: 'Emotional customer quotes with interactive selection and categorization. Perfect for building empathy and connection.',
  tags: ['quotes', 'emotional', 'testimonials', 'empathy', 'interactive'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive quote card selection',
    'Featured quote display area',
    'Category-based quote organization',
    'Emotional impact highlighting',
    'Resolution pathway preview',
    'Dynamic icon system for categories'
  ],
  
  useCases: [
    'Problem empathy sections',
    'Customer pain point validation',
    'Emotional connection building',
    'Testimonial-based problem presentation',
    'Social proof for challenges'
  ]
};