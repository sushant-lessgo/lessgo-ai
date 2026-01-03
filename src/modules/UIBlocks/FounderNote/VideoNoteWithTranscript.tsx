// components/FounderNote/VideoNoteWithTranscript.tsx
// Simplified video message with transcript for high-touch sales
// Clean, focused component with essential editing fields only

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import {
  CTAButton,
  TrustIndicators
} from '@/components/layout/ComponentRegistry';
import { Input } from '@/components/ui/input';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Simplified content interface with essential fields only
interface VideoNoteWithTranscriptContent {
  headline: string;
  video_intro: string;
  video_url: string;
  transcript_text: string;
  founder_name: string;
  cta_text: string;
  trust_items: string;
}

// Simplified content schema - 7 essential fields
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
  founder_name: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Watch Demo' 
  },
  trust_items: {
    type: 'string' as const,
    default: 'Used by 10,000+ companies|30-day free trial|No credit card required'
  }
};

// Theme color mapping function
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      playIconBg: 'bg-orange-500',
      playIconText: 'text-orange-600',
      playIconBgOpacity: 'bg-opacity-20',
      avatarGradientFrom: 'from-orange-400',
      avatarGradientVia: 'via-red-500',
      avatarGradientTo: 'to-pink-600',
      transcriptBg: 'bg-orange-50',
      transcriptBorder: 'border-orange-200',
      trustCheckColor: 'text-orange-500',
    },
    cool: {
      playIconBg: 'bg-blue-500',
      playIconText: 'text-blue-600',
      playIconBgOpacity: 'bg-opacity-20',
      avatarGradientFrom: 'from-blue-400',
      avatarGradientVia: 'via-indigo-500',
      avatarGradientTo: 'to-indigo-600',
      transcriptBg: 'bg-blue-50',
      transcriptBorder: 'border-blue-200',
      trustCheckColor: 'text-blue-500',
    },
    neutral: {
      playIconBg: 'bg-gray-500',
      playIconText: 'text-gray-600',
      playIconBgOpacity: 'bg-opacity-20',
      avatarGradientFrom: 'from-gray-400',
      avatarGradientVia: 'via-gray-500',
      avatarGradientTo: 'to-gray-600',
      transcriptBg: 'bg-gray-50',
      transcriptBorder: 'border-gray-200',
      trustCheckColor: 'text-gray-500',
    }
  }[theme];
};

// Simple Video Player Placeholder Component
const VideoPlayerPlaceholder = React.memo(({
  founderName,
  themeColors
}: {
  founderName: string;
  themeColors: ReturnType<typeof getThemeColors>;
}) => (
  <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
    <div className="text-center p-8">
      <div className={`w-16 h-16 ${themeColors.playIconBg} ${themeColors.playIconBgOpacity} rounded-full flex items-center justify-center mb-4 mx-auto`}>
        <svg className={`w-8 h-8 ${themeColors.playIconText}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <p className="text-gray-600 text-sm">
        Add your video URL to display {founderName}'s message here
      </p>
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
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<VideoNoteWithTranscriptContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const colors = getThemeColors(theme);

  // Get trust items from single field
  const getTrustItems = (): string[] => {
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['Used by 10,000+ companies', '30-day free trial', 'No credit card required'];
  };
  
  // Helper function to convert YouTube/Vimeo URLs to embed format
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    
    // YouTube conversion
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo conversion
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };
  
  const trustItems = getTrustItems();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VideoNoteWithTranscript"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Section Headline */}
        <div className="text-center mb-8">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="leading-tight mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          <EditableAdaptiveText
            mode={mode}
            value={blockContent.video_intro || ''}
            onEdit={(value) => handleContentUpdate('video_intro', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="leading-relaxed text-lg max-w-3xl mx-auto"
            placeholder="Introduce the video and explain why you're sharing this personal message..."
            sectionId={sectionId}
            elementKey="video_intro"
            sectionBackground={sectionBackground}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column - Video */}
          <div className="space-y-6">
            
            {/* Video URL Input Field */}
            {mode === 'edit' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Video URL (YouTube/Vimeo embed)
                </label>
                <Input
                  type="text"
                  value={blockContent.video_url || ''}
                  onChange={(e) => {
                    const convertedUrl = convertToEmbedUrl(e.target.value);
                    handleContentUpdate('video_url', convertedUrl);
                  }}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://www.youtube.com/embed/VIDEO_ID"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Paste any YouTube or Vimeo URL - it will be automatically converted to embed format
                </p>
              </div>
            )}
            
            {/* Video Player */}
            <div className="space-y-4">
              {blockContent.video_url && blockContent.video_url !== '' ? (
                <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                  <iframe
                    src={blockContent.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <VideoPlayerPlaceholder
                  founderName={blockContent.founder_name || 'the founder'}
                  themeColors={colors}
                />
              )}
              
              {/* Founder Info and CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${colors.avatarGradientFrom} ${colors.avatarGradientVia} ${colors.avatarGradientTo} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {blockContent.founder_name?.charAt(0) || 'F'}
                    </span>
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.founder_name || ''}
                    onEdit={(value) => handleContentUpdate('founder_name', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{ fontWeight: '600' }}
                    placeholder="Founder Name"
                    sectionId={sectionId}
                    elementKey="founder_name"
                    sectionBackground={sectionBackground}
                  />
                </div>

                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
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
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clipRule="evenodd" />
                <path d="M6 8h8v2H6V8zM6 12h4v2H6v-2z" />
              </svg>
              <h3 className="text-lg font-semibold">Video Transcript</h3>
            </div>

            {/* Transcript Content */}
            <div className={`${colors.transcriptBg} rounded-lg p-6 border ${colors.transcriptBorder} max-h-80 overflow-y-auto`}>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.transcript_text || ''}
                onEdit={(value) => handleContentUpdate('transcript_text', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-line' }}
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
                colorClass="text-gray-600"
                iconColor={colors.trustCheckColor}
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
  description: 'Clean, simplified video message with transcript. Perfect for founder stories and B2B sales.',
  tags: ['founder', 'video', 'transcript', 'sales', 'accessible', 'simple'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'video_intro', label: 'Video Introduction', type: 'textarea', required: true },
    { key: 'video_url', label: 'Video URL (YouTube/Vimeo embed)', type: 'text', required: false },
    { key: 'transcript_text', label: 'Video Transcript', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Clean video embed support for YouTube/Vimeo',
    'Accessible transcript for SEO and inclusivity',
    'Simple founder identification with avatar',
    'Single focused CTA for clear action',
    'Trust indicators for credibility',
    'Streamlined editing experience'
  ],
  
  useCases: [
    'Founder personal messages',
    'Product demonstrations',
    'Company story videos',
    'B2B sales presentations',
    'Customer testimonials',
    'Educational content with accessibility'
  ]
};