import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import { isHexColor } from '@/utils/colorUtils';
import * as LucideIcons from 'lucide-react';
import { getDynamicCardLayout } from '@/utils/dynamicCardLayout';

// V2 Types
interface DemoStatItem {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

interface VideoInfoItem {
  id: string;
  text: string;
  icon?: string;
}

interface VideoWalkthroughContent {
  headline: string;
  video_title: string;
  video_description: string;
  video_url?: string;
  video_duration?: string;
  subheadline?: string;
  demo_stats_heading?: string;
  demo_stats: DemoStatItem[];
  video_info: VideoInfoItem[];
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
    default: ''
  },
  video_duration: {
    type: 'string' as const,
    default: '4:32'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  demo_stats_heading: {
    type: 'string' as const,
    default: 'Enterprise Demo Highlights'
  },
  demo_stats: {
    type: 'array' as const,
    default: [
      { id: 'ds-1', label: 'Real Data', description: 'Actual customer implementation', icon: '' },
      { id: 'ds-2', label: 'Live Demo', description: 'Interactive walkthrough', icon: '' },
      { id: 'ds-3', label: 'Q&A', description: 'Expert consultation included', icon: '' }
    ]
  },
  video_info: {
    type: 'array' as const,
    default: [
      { id: 'vi-1', text: 'Live demonstration', icon: '' },
      { id: 'vi-2', text: '5 min watch', icon: '' }
    ]
  }
};

// Theme-based styling
const getThemeStyles = (theme: UIBlockTheme) => ({
  warm: {
    cardBorder: 'border-orange-200',
    cardShadow: shadows.card.warm,
    accentColors: ['text-orange-600', 'text-red-600', 'text-amber-600'],
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  cool: {
    cardBorder: 'border-blue-200',
    cardShadow: shadows.card.cool,
    accentColors: ['text-blue-600', 'text-indigo-600', 'text-cyan-600'],
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  neutral: {
    cardBorder: 'border-gray-200',
    cardShadow: shadows.card.neutral,
    accentColors: ['text-gray-700', 'text-slate-600', 'text-zinc-600'],
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  }
})[theme];

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

  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Theme - using useMemo pattern from ThreeStepHorizontal
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  const themeStyles = getThemeStyles(uiBlockTheme);

  // Adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme: uiBlockTheme
  }), [sectionBackground, uiBlockTheme]);

  // Ensure arrays exist
  const demoStats = Array.isArray(blockContent.demo_stats) ? blockContent.demo_stats : [];
  const videoInfo = Array.isArray(blockContent.video_info) ? blockContent.video_info : [];

  // Array handlers - cast to any for array values
  const handleDemoStatUpdate = (id: string, field: keyof DemoStatItem, value: string) => {
    const updated = demoStats.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    (handleContentUpdate as any)('demo_stats', updated);
  };

  const handleDemoStatDelete = (id: string) => {
    const updated = demoStats.filter(item => item.id !== id);
    (handleContentUpdate as any)('demo_stats', updated);
  };

  const handleVideoInfoUpdate = (id: string, field: keyof VideoInfoItem, value: string) => {
    const updated = videoInfo.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    (handleContentUpdate as any)('video_info', updated);
  };

  const handleVideoInfoDelete = (id: string) => {
    const updated = videoInfo.filter(item => item.id !== id);
    (handleContentUpdate as any)('video_info', updated);
  };

  // Get icon component - fallback to CheckCircle for video info
  const getIconComponent = (iconName: string | undefined) => {
    if (iconName) {
      const Icon = (LucideIcons as any)[iconName];
      if (Icon) return Icon;
    }
    return LucideIcons.CheckCircle;
  };

  const VideoPlayer = () => {
    // YouTube embed
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

    // Placeholder when no video URL
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl overflow-hidden group cursor-pointer">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-lg font-semibold">{blockContent.video_title}</div>
            {!blockContent.video_url && isEditMode && (
              <div className="text-sm text-white/60 mt-2">Add YouTube URL below</div>
            )}
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
          <div
            className={`w-20 h-20 rounded-full ${isHexColor(colorTokens.ctaBg) ? '' : colorTokens.ctaBg} flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300`}
            style={isHexColor(colorTokens.ctaBg) ? { backgroundColor: colorTokens.ctaBg } : undefined}
          >
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

  const isEditMode = mode === 'edit';

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

        {/* Header */}
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

          {(blockContent.subheadline || isEditMode) && (
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

        {/* Video + Info Grid - WYSIWYG in both edit and preview */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">

          {/* Video Player */}
          <div className="order-2 lg:order-1">
            <div className="aspect-video">
              <VideoPlayer />
            </div>
            {/* Video URL Input - edit mode only */}
            {isEditMode && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Video URL</div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_url || ''}
                  onEdit={(value) => handleContentUpdate('video_url', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm text-gray-700"
                  placeholder="https://www.youtube.com/embed/..."
                  sectionId={sectionId}
                  elementKey="video_url"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="order-1 lg:order-2 space-y-6">
            <div>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.video_title || ''}
                onEdit={(value) => handleContentUpdate('video_title', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className={`text-2xl font-bold mb-4 ${dynamicTextColors?.heading || cardStyles.textHeading}`}
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
                className={`leading-relaxed text-lg ${dynamicTextColors?.muted || cardStyles.textMuted}`}
                placeholder="Video description"
                sectionId={sectionId}
                elementKey="video_description"
                sectionBackground={sectionBackground}
              />
            </div>

            {/* Video Info Items */}
            {videoInfo.length > 0 && (
              <div className="flex items-center space-x-6">
                {videoInfo.map((item) => {
                  const Icon = getIconComponent(item.icon);
                  return (
                    <div
                      key={item.id}
                      className="relative group flex items-center space-x-2"
                    >
                      <div className={`w-8 h-8 rounded-full ${themeStyles.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${themeStyles.iconColor}`} />
                      </div>
                      <span
                        className={`font-medium ${dynamicTextColors?.heading || cardStyles.textHeading}`}
                      >
                        {item.text}
                      </span>
                      {isEditMode && videoInfo.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoInfoDelete(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Demo Stats */}
        {demoStats.length > 0 && (() => {
          const demoStatsLayout = getDynamicCardLayout(demoStats.length);
          return (
          <div className={`${cardStyles.bg} ${cardStyles.blur} ${cardEnhancements.borderRadius} p-8 ${cardStyles.border} ${cardStyles.shadow}`}>
            <div className="text-center">
              {(blockContent.demo_stats_heading || isEditMode) && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.demo_stats_heading || ''}
                  onEdit={(value) => handleContentUpdate('demo_stats_heading', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xl font-semibold mb-8"
                  placeholder="Demo stats heading"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="demo_stats_heading"
                />
              )}

              <div className={demoStatsLayout.gridClass}>
                {demoStats.map((stat, index) => {
                  const accentColor = themeStyles.accentColors[index % themeStyles.accentColors.length];

                  return (
                    <div key={stat.id} className="relative group text-center">
                      <EditableAdaptiveText
                        mode={mode}
                        value={stat.label || ''}
                        onEdit={(value) => handleDemoStatUpdate(stat.id, 'label', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className={`mb-2 ${accentColor}`}
                        style={{
                          fontSize: h3Style.fontSize,
                          fontWeight: h3Style.fontWeight,
                          lineHeight: h3Style.lineHeight,
                          letterSpacing: h3Style.letterSpacing,
                          fontFamily: h3Style.fontFamily
                        }}
                        placeholder="Stat label"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`demo_stat_${stat.id}_label`}
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={stat.description || ''}
                        onEdit={(value) => handleDemoStatUpdate(stat.id, 'description', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className={`text-sm ${cardStyles.textMuted}`}
                        placeholder="Stat description"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`demo_stat_${stat.id}_description`}
                      />
                      {isEditMode && demoStats.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoStatDelete(stat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white hover:bg-gray-50 text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                          title="Remove stat"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}
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
    { key: 'demo_stats_heading', label: 'Demo Stats Heading', type: 'text', required: false },
    { key: 'demo_stats', label: 'Demo Stats', type: 'array', required: false },
    { key: 'video_info', label: 'Video Info', type: 'array', required: false }
  ],

  features: [
    'Professional video player interface',
    'Video thumbnail support',
    'Duration display and controls',
    'Enterprise demo statistics',
    'Theme-aware styling',
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
