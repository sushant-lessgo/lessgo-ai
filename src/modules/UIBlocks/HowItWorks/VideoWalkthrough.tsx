import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
import { LayoutComponentProps } from '@/types/storeTypes';

interface VideoWalkthroughContent {
  headline: string;
  video_title: string;
  video_description: string;
  video_url?: string;
  video_thumbnail?: string;
  video_duration?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Demo Stats fields
  demo_stats_heading?: string;
  demo_stat_1_label?: string;
  demo_stat_1_description?: string;
  demo_stat_2_label?: string;
  demo_stat_2_description?: string;
  demo_stat_3_label?: string;
  demo_stat_3_description?: string;
  // Video Info indicators
  video_info_1_text?: string;
  video_info_2_text?: string;
  show_demo_stats?: boolean;
  show_video_info?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See How It Works in Action' 
  },
  video_title: { 
    type: 'string' as const, 
    default: 'Complete Product Walkthrough' 
  },
  video_description: { 
    type: 'string' as const, 
    default: 'Watch our comprehensive demo showing exactly how our platform integrates with your existing workflow, processes your data, and delivers measurable results for your enterprise.' 
  },
  video_url: { 
    type: 'string' as const, 
    default: 'https://www.youtube.com/embed/dQw4w9WgXcQ' 
  },
  video_thumbnail: { 
    type: 'string' as const, 
    default: '/video-thumbnail.jpg' 
  },
  video_duration: { 
    type: 'string' as const, 
    default: '4:32' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  // Demo Stats fields
  demo_stats_heading: { 
    type: 'string' as const, 
    default: 'Enterprise Demo Highlights' 
  },
  demo_stat_1_label: { 
    type: 'string' as const, 
    default: 'Real Data' 
  },
  demo_stat_1_description: { 
    type: 'string' as const, 
    default: 'Actual customer implementation' 
  },
  demo_stat_2_label: { 
    type: 'string' as const, 
    default: 'Live Demo' 
  },
  demo_stat_2_description: { 
    type: 'string' as const, 
    default: 'Interactive walkthrough' 
  },
  demo_stat_3_label: { 
    type: 'string' as const, 
    default: 'Q&A' 
  },
  demo_stat_3_description: { 
    type: 'string' as const, 
    default: 'Expert consultation included' 
  },
  demo_stat_1_icon: { type: 'string' as const, default: '' },
  demo_stat_2_icon: { type: 'string' as const, default: '' },
  demo_stat_3_icon: { type: 'string' as const, default: '' },
  // Video Info indicators
  video_info_1_text: { 
    type: 'string' as const, 
    default: 'Live demonstration' 
  },
  video_info_2_text: { 
    type: 'string' as const, 
    default: '5 min watch' 
  },
  video_info_1_icon: { type: 'string' as const, default: '' },
  video_info_2_icon: { type: 'string' as const, default: '' },
  show_demo_stats: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_video_info: { 
    type: 'boolean' as const, 
    default: true 
  }
};

export default function VideoWalkthrough(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<VideoWalkthroughContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  // Icon edit handlers
  const handleDemoStatIconEdit = (index: number, value: string) => {
    const iconField = `demo_stat_${index + 1}_icon` as keyof VideoWalkthroughContent;
    handleContentUpdate(iconField, value);
  };

  const handleVideoInfoIconEdit = (index: number, value: string) => {
    const iconField = `video_info_${index + 1}_icon` as keyof VideoWalkthroughContent;
    handleContentUpdate(iconField, value);
  };

  const getDemoStatIcon = (index: number) => {
    const iconFields = ['demo_stat_1_icon', 'demo_stat_2_icon', 'demo_stat_3_icon'];
    return blockContent[iconFields[index] as keyof VideoWalkthroughContent] || '';
  };

  const getVideoInfoIcon = (index: number) => {
    const iconFields = ['video_info_1_icon', 'video_info_2_icon'];
    return blockContent[iconFields[index] as keyof VideoWalkthroughContent] || '';
  };

  const VideoPlayer = () => {
    if (blockContent.video_url && blockContent.video_url.includes('youtube')) {
      return (
        <iframe
          src={blockContent.video_url}
          title={blockContent.video_title}
          className="w-full h-full rounded-xl"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden group cursor-pointer">
        {blockContent.video_thumbnail && blockContent.video_thumbnail !== '' ? (
          <img
            src={blockContent.video_thumbnail}
            alt={blockContent.video_title}
            className="w-full h-full object-cover"
            data-image-id={`${sectionId}-video-thumbnail`}
            onMouseUp={(e) => {
                        // Image toolbar is only available in edit mode
                      }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-lg font-semibold">{blockContent.video_title}</div>
            </div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
          <div className={`w-20 h-20 rounded-full ${colorTokens.ctaBg} flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300`}>
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        {blockContent.video_duration && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {blockContent.video_duration}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VideoWalkthrough"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
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
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your video demonstration..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Video Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_title || ''}
                  onEdit={(value) => handleContentUpdate('video_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Video title"
                  sectionId={sectionId}
                  elementKey="video_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_description || ''}
                  onEdit={(value) => handleContentUpdate('video_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Video description"
                  sectionId={sectionId}
                  elementKey="video_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_url || ''}
                  onEdit={(value) => handleContentUpdate('video_url', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Video URL (YouTube embed link)"
                  sectionId={sectionId}
                  elementKey="video_url"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_duration || ''}
                  onEdit={(value) => handleContentUpdate('video_duration', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Video duration (e.g., 4:32)"
                  sectionId={sectionId}
                  elementKey="video_duration"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            
            {/* Video Player */}
            <div className="order-2 lg:order-1">
              <div className="aspect-video">
                <VideoPlayer />
              </div>
            </div>

            {/* Video Info */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {blockContent.video_title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed text-lg">
                  {blockContent.video_description}
                </p>
              </div>
              
              {blockContent.show_video_info !== false && (
                <div className="flex items-center space-x-6">
                  {(blockContent.video_info_1_text && blockContent.video_info_1_text !== '___REMOVED___') && (
                    <div className="relative group/video-info-1 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.video_info_1_text || ''}
                        onEdit={(value) => handleContentUpdate('video_info_1_text', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-gray-700 font-medium"
                        placeholder="Video info 1"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="video_info_1_text"
                      />
                      {(mode as string) === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('video_info_1_text', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/video-info-1:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                          title="Remove video info 1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  {(blockContent.video_info_2_text && blockContent.video_info_2_text !== '___REMOVED___') && (
                    <div className="relative group/video-info-2 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.video_info_2_text || ''}
                        onEdit={(value) => handleContentUpdate('video_info_2_text', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-gray-700 font-medium"
                        placeholder="Video info 2"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="video_info_2_text"
                      />
                      {(mode as string) === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('video_info_2_text', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/video-info-2:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                          title="Remove video info 2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">What you'll see:</h4>
                    <p className="text-blue-800 text-sm">Real enterprise data, actual workflows, and measurable results from our implementation process.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Stats */}
        {blockContent.show_demo_stats !== false && (
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
            <div className="text-center">
              {(blockContent.demo_stats_heading || mode === 'edit') && (
                <div className="relative group/demo-heading">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.demo_stats_heading || ''}
                    onEdit={(value) => handleContentUpdate('demo_stats_heading', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-xl font-semibold text-gray-900 mb-6"
                    placeholder="Demo stats heading"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="demo_stats_heading"
                  />
                  {mode === 'edit' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentUpdate('demo_stats_heading', '___REMOVED___');
                      }}
                      className="opacity-0 group-hover/demo-heading:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Remove demo heading"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-8">
                {(blockContent.demo_stat_1_label && blockContent.demo_stat_1_label !== '___REMOVED___') && (
                  <div className="relative group/demo-stat-1 text-center">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_1_label || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_1_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-blue-600 mb-2"
                      style={{
                        fontSize: h3Style.fontSize,
                        fontWeight: h3Style.fontWeight,
                        lineHeight: h3Style.lineHeight,
                        letterSpacing: h3Style.letterSpacing,
                        fontFamily: h3Style.fontFamily
                      }}
                      placeholder="Stat 1 label"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_1_label"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_1_description || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_1_description', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Stat 1 description"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_1_description"
                    />
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('demo_stat_1_label', '___REMOVED___');
                          handleContentUpdate('demo_stat_1_description', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/demo-stat-1:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                        title="Remove stat 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.demo_stat_2_label && blockContent.demo_stat_2_label !== '___REMOVED___') && (
                  <div className="relative group/demo-stat-2 text-center">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_2_label || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_2_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-green-600 mb-2"
                      style={{
                        fontSize: h3Style.fontSize,
                        fontWeight: h3Style.fontWeight,
                        lineHeight: h3Style.lineHeight,
                        letterSpacing: h3Style.letterSpacing,
                        fontFamily: h3Style.fontFamily
                      }}
                      placeholder="Stat 2 label"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_2_label"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_2_description || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_2_description', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Stat 2 description"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_2_description"
                    />
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('demo_stat_2_label', '___REMOVED___');
                          handleContentUpdate('demo_stat_2_description', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/demo-stat-2:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                        title="Remove stat 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {(blockContent.demo_stat_3_label && blockContent.demo_stat_3_label !== '___REMOVED___') && (
                  <div className="relative group/demo-stat-3 text-center">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_3_label || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_3_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-purple-600 mb-2"
                      style={{
                        fontSize: h3Style.fontSize,
                        fontWeight: h3Style.fontWeight,
                        lineHeight: h3Style.lineHeight,
                        letterSpacing: h3Style.letterSpacing,
                        fontFamily: h3Style.fontFamily
                      }}
                      placeholder="Stat 3 label"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_3_label"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.demo_stat_3_description || ''}
                      onEdit={(value) => handleContentUpdate('demo_stat_3_description', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Stat 3 description"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="demo_stat_3_description"
                    />
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('demo_stat_3_label', '___REMOVED___');
                          handleContentUpdate('demo_stat_3_description', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/demo-stat-3:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                        title="Remove stat 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your video content..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
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
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'VideoWalkthrough',
  category: 'HowItWorks',
  description: 'Video demonstration layout for enterprise sales. Perfect for high-touch sales and product-aware audiences.',
  tags: ['how-it-works', 'video', 'demo', 'enterprise', 'walkthrough'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'video_title', label: 'Video Title', type: 'text', required: true },
    { key: 'video_description', label: 'Video Description', type: 'textarea', required: true },
    { key: 'video_url', label: 'Video URL (YouTube embed)', type: 'text', required: false },
    { key: 'video_thumbnail', label: 'Video Thumbnail', type: 'image', required: false },
    { key: 'video_duration', label: 'Video Duration', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'demo_stats_heading', label: 'Demo Stats Heading', type: 'text', required: false },
    { key: 'demo_stat_1_label', label: 'Demo Stat 1 Label', type: 'text', required: false },
    { key: 'demo_stat_1_description', label: 'Demo Stat 1 Description', type: 'text', required: false },
    { key: 'demo_stat_2_label', label: 'Demo Stat 2 Label', type: 'text', required: false },
    { key: 'demo_stat_2_description', label: 'Demo Stat 2 Description', type: 'text', required: false },
    { key: 'demo_stat_3_label', label: 'Demo Stat 3 Label', type: 'text', required: false },
    { key: 'demo_stat_3_description', label: 'Demo Stat 3 Description', type: 'text', required: false },
    { key: 'video_info_1_text', label: 'Video Info 1 Text', type: 'text', required: false },
    { key: 'video_info_2_text', label: 'Video Info 2 Text', type: 'text', required: false },
    { key: 'show_demo_stats', label: 'Show Demo Stats', type: 'boolean', required: false },
    { key: 'show_video_info', label: 'Show Video Info', type: 'boolean', required: false }
  ],
  
  features: [
    'Professional video player interface',
    'Video thumbnail support',
    'Duration display and controls',
    'Enterprise demo statistics',
    'Perfect for sales demonstrations',
    'High-touch customer engagement'
  ],
  
  useCases: [
    'Enterprise software demos',
    'Product walkthrough videos',
    'Sales presentation tools',
    'Complex system demonstrations',
    'High-value customer engagement'
  ]
};