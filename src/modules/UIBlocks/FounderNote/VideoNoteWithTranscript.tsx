// components/FounderNote/VideoNoteWithTranscript.tsx
// Video message with transcript for high-touch sales
// Builds trust through personal video message with accessible transcript

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
interface VideoNoteWithTranscriptContent {
  headline: string;
  video_intro: string;
  video_url: string;
  transcript_text: string;
  cta_text: string;
  founder_name?: string;
  founder_title?: string;
  video_duration?: string;
  trust_items?: string;
  video_thumbnail?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'A Personal Message from Our Founder' 
  },
  video_intro: { 
    type: 'string' as const, 
    default: 'I wanted to take a few minutes to personally explain why we built this and how it can transform your business.' 
  },
  video_url: { 
    type: 'string' as const, 
    default: '' 
  },
  transcript_text: { 
    type: 'string' as const, 
    default: 'Hi, I\'m Sarah, and I want to share something important with you.\n\nThree years ago, I was managing a team of 50 people, and we were constantly drowning in manual processes. Every day felt like we were fighting fires instead of building something meaningful.\n\nThat\'s when I realized we needed to build the tool we wished existed. Not another complicated enterprise solution, but something that actually works for real teams.\n\nToday, over 10,000 companies use our platform to save 20+ hours per week. But more importantly, they\'re able to focus on what really matters - growing their business and serving their customers.\n\nI\'d love to show you how this can work for your team too.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Schedule Your Demo' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  founder_title: { 
    type: 'string' as const, 
    default: 'Founder & CEO' 
  },
  video_duration: { 
    type: 'string' as const, 
    default: '3:45' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Used by 10,000+ companies|30-day free trial|No credit card required' 
  },
  video_thumbnail: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Video Player Placeholder Component
const VideoPlayerPlaceholder = React.memo(() => (
  <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg overflow-hidden shadow-2xl">
    {/* Video overlay */}
    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      
      {/* Play button */}
      <div className="relative">
        <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-300 cursor-pointer group">
          <svg className="w-8 h-8 text-gray-900 ml-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 w-20 h-20 border-2 border-white border-opacity-30 rounded-full animate-ping"></div>
      </div>
    </div>

    {/* Mock video controls */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 bg-white bg-opacity-20 rounded-full h-1">
          <div className="bg-white rounded-full h-1 w-1/3"></div>
        </div>
        <span className="text-white text-sm font-medium">1:15 / 3:45</span>
      </div>
    </div>

    {/* Founder preview */}
    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-2">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-bold">S</span>
      </div>
      <span className="text-white text-sm font-medium">Sarah Chen, CEO</span>
    </div>

    {/* Quality indicator */}
    <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded px-2 py-1">
      <span className="text-white text-xs font-medium">HD</span>
    </div>
  </div>
));
VideoPlayerPlaceholder.displayName = 'VideoPlayerPlaceholder';

export default function VideoNoteWithTranscript(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<VideoNoteWithTranscriptContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Trusted by thousands', 'Free trial available'];

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VideoNoteWithTranscript"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column - Video */}
          <div className="space-y-6">
            
            {/* Headline */}
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              textStyle={getTextStyle('h2')}
              className="leading-tight"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {/* Video Intro */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.video_intro}
              onEdit={(value) => handleContentUpdate('video_intro', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="leading-relaxed"
              placeholder="Introduce the video and explain why you're sharing this personal message..."
              sectionId={sectionId}
              elementKey="video_intro"
              sectionBackground={sectionBackground}
            />

            {/* Video Player */}
            <div className="space-y-4">
              {blockContent.video_url && blockContent.video_url !== '' ? (
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={blockContent.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <VideoPlayerPlaceholder />
              )}
              
              {/* Video metadata */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {blockContent.founder_name?.charAt(0) || 'F'}
                      </span>
                    </div>
                    <div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.founder_name || ''}
                        onEdit={(value) => handleContentUpdate('founder_name', value)}
                        backgroundType={props.backgroundType || 'primary'}
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle="font-medium"
                        placeholder="Founder Name"
                        sectionId={sectionId}
                        elementKey="founder_name"
                        sectionBackground={sectionBackground}
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.founder_title || ''}
                        onEdit={(value) => handleContentUpdate('founder_title', value)}
                        backgroundType={props.backgroundType || 'primary'}
                        colorTokens={colorTokens}
                        variant="body"
                        textStyle={`text-xs ${mutedTextColor}`}
                        placeholder="Title"
                        sectionId={sectionId}
                        elementKey="founder_title"
                        sectionBackground={sectionBackground}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.video_duration || ''}
                      onEdit={(value) => handleContentUpdate('video_duration', value)}
                      backgroundType={props.backgroundType || 'primary'}
                      colorTokens={colorTokens}
                      variant="body"
                      textStyle={`text-xs ${mutedTextColor}`}
                      placeholder="0:00"
                      sectionId={sectionId}
                      elementKey="video_duration"
                      sectionBackground={sectionBackground}
                    />
                  </div>
                </div>

                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
                  textStyle={getTextStyle('body')}
                  className="shadow-lg hover:shadow-xl transition-all duration-200"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_text"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Transcript */}
          <div className="space-y-6">
            
            {/* Transcript Header */}
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                Video Transcript
              </h3>
            </div>

            {/* Transcript Content */}
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.transcript_text}
                onEdit={(value) => handleContentUpdate('transcript_text', value)}
                backgroundType="white"
                colorTokens={colorTokens}
                variant="body"
                textStyle="text-gray-700 leading-relaxed whitespace-pre-line"
                placeholder="Add the video transcript here for accessibility and SEO benefits..."
                sectionId={sectionId}
                elementKey="transcript_text"
                sectionBackground="bg-gray-50"
              />
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 border-t border-gray-200">
              <TrustIndicators 
                items={trustItems}
                colorClass={mutedTextColor}
                iconColor="text-green-500"
              />
            </div>

            {/* Additional CTA */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                Ready to get started?
              </h4>
              <p className="text-blue-700 text-sm mb-4">
                Book a personalized demo and see how this can work for your team.
              </p>
              <CTAButton
                text="Book Your Demo"
                colorTokens={colorTokens}
                textStyle={getTextStyle('body')}
                className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                variant="primary"
                sectionId={sectionId}
                elementKey="cta_text"
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
  name: 'VideoNoteWithTranscript',
  category: 'Founder Note',
  description: 'Video message with transcript for high-touch sales. Perfect for enterprise and B2B sales.',
  tags: ['founder', 'video', 'transcript', 'sales', 'enterprise', 'accessibility'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'video_intro', label: 'Video Introduction', type: 'textarea', required: true },
    { key: 'video_url', label: 'Video URL (YouTube/Vimeo embed)', type: 'text', required: false },
    { key: 'transcript_text', label: 'Video Transcript', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: false },
    { key: 'founder_title', label: 'Founder Title', type: 'text', required: false },
    { key: 'video_duration', label: 'Video Duration', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'video_thumbnail', label: 'Video Thumbnail', type: 'image', required: false }
  ],
  
  features: [
    'Video embed support for YouTube/Vimeo',
    'Full transcript for accessibility and SEO',
    'Founder identification with avatar',
    'Video metadata display (duration, quality)',
    'Multiple CTA placements for conversion',
    'Trust indicators with social proof'
  ],
  
  useCases: [
    'Enterprise B2B sales presentations',
    'High-ticket service demonstrations',
    'Product launch founder messages',
    'Investor pitch introductions',
    'Customer success story explanations',
    'Complex product feature walkthroughs'
  ]
};