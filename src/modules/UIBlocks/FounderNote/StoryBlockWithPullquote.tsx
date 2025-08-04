// components/FounderNote/StoryBlockWithPullquote.tsx
// Story format with pull quotes
// Builds trust through narrative storytelling with highlighted insights

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface StoryBlockWithPullquoteContent {
  story_headline: string;
  story_intro: string;
  story_body: string;
  pullquote_text: string;
  story_conclusion: string;
  cta_text: string;
  founder_name?: string;
  founder_title?: string;
  company_name?: string;
  reading_time?: string;
  trust_items?: string;
  founder_image?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  story_headline: { 
    type: 'string' as const, 
    default: 'The Day I Realized Our Industry Was Broken' 
  },
  story_intro: { 
    type: 'string' as const, 
    default: 'It was 2 AM on a Tuesday, and I was staring at my computer screen in disbelief. I had just spent six hours trying to accomplish what should have taken thirty minutes. The tools we were supposed to use to make our lives easier were actually making everything harder.' 
  },
  story_body: { 
    type: 'string' as const, 
    default: 'That night changed everything for me. I realized that I wasn\'t alone in this frustration. Thousands of professionals were struggling with the same outdated, overcomplicated tools that prioritized features over user experience.\n\nI started talking to colleagues, friends in the industry, and even strangers at coffee shops. The same story emerged again and again: smart, capable people were being held back by software that didn\'t understand how they actually worked.\n\nThat\'s when I decided to do something about it. Instead of complaining, I would build the solution I wished existed.' 
  },
  pullquote_text: { 
    type: 'string' as const, 
    default: '"We don\'t need more features. We need software that gets out of our way and lets us focus on what we do best."' 
  },
  story_conclusion: { 
    type: 'string' as const, 
    default: 'Three years later, that midnight frustration has become a platform used by over 15,000 professionals worldwide. We\'ve helped teams save thousands of hours and achieve results they never thought possible.\n\nBut the best part? We\'re just getting started. Every day, we\'re working to make professional tools more human, more intuitive, and more focused on what actually matters.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Join Our Story' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Jordan Martinez' 
  },
  founder_title: { 
    type: 'string' as const, 
    default: 'Founder & CEO' 
  },
  company_name: { 
    type: 'string' as const, 
    default: 'YourCompany' 
  },
  reading_time: { 
    type: 'string' as const, 
    default: '3 min read' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '15,000+ professionals|500+ companies|99.9% uptime|24/7 support' 
  },
  founder_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Founder Image Placeholder Component
const FounderImagePlaceholder = React.memo(() => (
  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  </div>
));
FounderImagePlaceholder.displayName = 'FounderImagePlaceholder';

export default function StoryBlockWithPullquote(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
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
  } = useLayoutComponent<StoryBlockWithPullquoteContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Trusted by thousands', 'Proven results'];

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // Get showImageToolbar for handling image clicks
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StoryBlockWithPullquote"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Article Header */}
        <div className="text-center mb-12">
          
          {/* Headline */}
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.story_headline}
            onEdit={(value) => handleContentUpdate('story_headline', value)}
            level="h1"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h1')}
            className="leading-tight mb-6"
            sectionId={sectionId}
            elementKey="story_headline"
            sectionBackground={sectionBackground}
          />

          {/* Author Info */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* Founder Image */}
            <div className="flex-shrink-0">
              {blockContent.founder_image && blockContent.founder_image !== '' ? (
                <img
                  src={blockContent.founder_image}
                  alt="Founder"
                  className="w-16 h-16 rounded-full object-cover cursor-pointer border-2 border-gray-200"
                  data-image-id={`${sectionId}-founder-image`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      showImageToolbar(`${sectionId}-founder-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              ) : (
                <FounderImagePlaceholder />
              )}
            </div>

            <div className="text-left">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.founder_name || ''}
                onEdit={(value) => handleContentUpdate('founder_name', value)}
                backgroundType={props.backgroundType || 'primary'}
                colorTokens={colorTokens}
                variant="body"
                textStyle="font-semibold text-gray-900"
                placeholder="Author Name"
                sectionId={sectionId}
                elementKey="founder_name"
                sectionBackground={sectionBackground}
              />
              <div className="flex items-center space-x-2 text-sm">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.founder_title || ''}
                  onEdit={(value) => handleContentUpdate('founder_title', value)}
                  backgroundType={props.backgroundType || 'primary'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={mutedTextColor}
                  placeholder="Title"
                  sectionId={sectionId}
                  elementKey="founder_title"
                  sectionBackground={sectionBackground}
                />
                <span className={mutedTextColor}>•</span>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.reading_time || ''}
                  onEdit={(value) => handleContentUpdate('reading_time', value)}
                  backgroundType={props.backgroundType || 'primary'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={mutedTextColor}
                  placeholder="Reading time"
                  sectionId={sectionId}
                  elementKey="reading_time"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="prose prose-lg max-w-none">
          
          {/* Story Introduction */}
          <div className="mb-8">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.story_intro}
              onEdit={(value) => handleContentUpdate('story_intro', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle="text-xl leading-relaxed text-gray-700 font-medium"
              placeholder="Start with a compelling opening that hooks the reader..."
              sectionId={sectionId}
              elementKey="story_intro"
              sectionBackground={sectionBackground}
            />
          </div>

          {/* Story Body - First Part */}
          <div className="mb-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.story_body}
              onEdit={(value) => handleContentUpdate('story_body', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle="text-lg leading-relaxed text-gray-700 whitespace-pre-line"
              placeholder="Continue your story with the main narrative, challenges, and discoveries..."
              sectionId={sectionId}
              elementKey="story_body"
              sectionBackground={sectionBackground}
            />
          </div>

          {/* Pull Quote */}
          <div className="relative my-12 py-8">
            {/* Quote background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl transform -rotate-1"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transform rotate-1">
              
              {/* Quote mark */}
              <div className="text-6xl text-blue-500 opacity-20 font-serif leading-none mb-4">"</div>
              
              {/* Quote text */}
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.pullquote_text}
                onEdit={(value) => handleContentUpdate('pullquote_text', value)}
                backgroundType="white"
                colorTokens={colorTokens}
                variant="body"
                textStyle="text-2xl lg:text-3xl font-medium text-gray-900 leading-relaxed italic"
                placeholder="Add a powerful quote that captures the key insight..."
                sectionId={sectionId}
                elementKey="pullquote_text"
                sectionBackground="bg-white"
              />
              
              {/* Attribution */}
              <div className="mt-6 flex items-center space-x-3">
                <div className="w-2 h-12 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {blockContent.founder_name || 'Founder'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {blockContent.founder_title || 'CEO'}, {blockContent.company_name || 'Company'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Conclusion */}
          <div className="mb-12">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.story_conclusion}
              onEdit={(value) => handleContentUpdate('story_conclusion', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle="text-lg leading-relaxed text-gray-700 whitespace-pre-line"
              placeholder="Conclude with the outcome, current state, and future vision..."
              sectionId={sectionId}
              elementKey="story_conclusion"
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to be part of the story?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of professionals who have already transformed their workflow with our platform.
          </p>
          
          <CTAButton
            text={blockContent.cta_text}
            colorTokens={colorTokens}
            textStyle={getTextStyle('body-lg')}
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 mb-6"
            variant="primary"
            sectionId={sectionId}
            elementKey="cta_text"
          />
          
          {/* Trust Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {trustItems.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">
                  {item.split(' ')[0]}
                </div>
                <div className="text-sm text-gray-600">
                  {item.split(' ').slice(1).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Article Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {blockContent.founder_name?.charAt(0) || 'F'}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {blockContent.founder_name || 'Founder Name'}
                </div>
                <div className="text-sm text-gray-600">
                  {blockContent.founder_title || 'Title'} at {blockContent.company_name || 'Company'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Published by</div>
              <div className="font-medium text-gray-900">
                {blockContent.company_name || 'Your Company'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'StoryBlockWithPullquote',
  category: 'Founder Note',
  description: 'Story format with pull quotes perfect for long-form founder narratives and thought leadership content.',
  tags: ['founder', 'story', 'pullquote', 'narrative', 'long-form', 'article'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'story_headline', label: 'Story Headline', type: 'text', required: true },
    { key: 'story_intro', label: 'Story Introduction', type: 'textarea', required: true },
    { key: 'story_body', label: 'Story Body', type: 'textarea', required: true },
    { key: 'pullquote_text', label: 'Pull Quote', type: 'textarea', required: true },
    { key: 'story_conclusion', label: 'Story Conclusion', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: false },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: false },
    { key: 'company_name', label: 'Company Name', type: 'text', required: false },
    { key: 'reading_time', label: 'Reading Time', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Stats (pipe separated)', type: 'text', required: false },
    { key: 'founder_image', label: 'Founder Photo', type: 'image', required: false }
  ],
  
  features: [
    'Article-style layout with author byline',
    'Prominent pull quote with visual emphasis',
    'Reading time and metadata display',
    'Long-form content support with typography',
    'Trust statistics integration',
    'Professional article footer with attribution'
  ],
  
  useCases: [
    'Thought leadership founder stories',
    'Long-form origin story narratives',
    'Industry insight and opinion pieces',
    'Personal journey and transformation stories',
    'Problem-solution narrative explanations',
    'Vision and mission statement articles'
  ]
};