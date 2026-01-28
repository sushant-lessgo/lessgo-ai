import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

// V2 Types
interface VideoTestimonialItem {
  id: string;
  title: string;
  description: string;
  customer_name: string;
  customer_title: string;
  customer_company: string;
  video_url?: string;
  thumbnail?: string;
}

interface VideoTestimonialsContent {
  headline: string;
  subheadline?: string;
  video_testimonials: VideoTestimonialItem[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'See What Our Customers Are Saying'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  video_testimonials: {
    type: 'array' as const,
    default: [
      {
        id: 'vt-1',
        title: 'How We Transformed Our Operations',
        description: 'Learn how our platform helped streamline their entire workflow and reduce operational costs by 60%.',
        customer_name: 'Sarah Mitchell',
        customer_title: 'VP of Operations',
        customer_company: 'TechCorp Industries',
        video_url: '',
        thumbnail: ''
      },
      {
        id: 'vt-2',
        title: '500% ROI in First Quarter',
        description: 'Discover the strategies and implementation process that delivered immediate results for this growing enterprise.',
        customer_name: 'James Rodriguez',
        customer_title: 'Chief Technology Officer',
        customer_company: 'Global Dynamics',
        video_url: '',
        thumbnail: ''
      },
      {
        id: 'vt-3',
        title: 'Seamless Enterprise Integration',
        description: 'See the technical integration process and how our API seamlessly connected with their existing systems.',
        customer_name: 'Anna Chen',
        customer_title: 'Director of IT',
        customer_company: 'InnovateSoft',
        video_url: '',
        thumbnail: ''
      },
      {
        id: 'vt-4',
        title: 'From Manual to Automated in 30 Days',
        description: 'Watch the complete transformation journey from manual processes to full automation with measurable outcomes.',
        customer_name: 'Michael Thompson',
        customer_title: 'Head of Digital Transformation',
        customer_company: 'Enterprise Solutions Inc',
        video_url: '',
        thumbnail: ''
      }
    ]
  }
};

// Theme-based card styling (per uiBlockTheme.md)
const getCardStyles = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    shadow: shadows.card.warm,
    hover: shadows.cardHover.warm,
    avatarGradient: 'from-orange-500 to-red-600',
    accentColor: 'text-orange-600',
  },
  cool: {
    border: 'border-blue-200',
    shadow: shadows.card.cool,
    hover: shadows.cardHover.cool,
    avatarGradient: 'from-blue-500 to-indigo-600',
    accentColor: 'text-blue-600',
  },
  neutral: {
    border: 'border-gray-200',
    shadow: shadows.card.neutral,
    hover: shadows.cardHover.neutral,
    avatarGradient: 'from-gray-500 to-gray-700',
    accentColor: 'text-gray-700',
  }
})[theme];

const VideoTestimonialCard = React.memo(({
  item,
  mode,
  colorTokens,
  mutedTextColor,
  onUpdate,
  onDelete,
  sectionId,
  backgroundType,
  sectionBackground,
  h4Style,
  theme,
  canDelete
}: {
  item: VideoTestimonialItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  mutedTextColor: string;
  onUpdate: (id: string, field: keyof VideoTestimonialItem, value: string) => void;
  onDelete: (id: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  h4Style: any;
  theme: UIBlockTheme;
  canDelete: boolean;
}) => {
  const cardStyles = getCardStyles(theme);

  const VideoPlayer = () => {
    if (item.video_url && item.video_url.includes('youtube')) {
      return (
        <iframe
          src={item.video_url}
          title={item.title}
          className="w-full h-full rounded-t-xl"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-t-xl overflow-hidden group cursor-pointer">
        {item.thumbnail && item.thumbnail !== '' ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            data-image-id={`${sectionId}-video-${item.id}-thumbnail`}
          />
        ) : null}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <svg className={`w-8 h-8 ${cardStyles.accentColor} ml-1`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`group relative bg-white ${cardEnhancements.borderRadius} border ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hover} ${cardEnhancements.hoverLift} ${cardEnhancements.transition} overflow-hidden`}>

      {/* Delete Button */}
      {mode === 'edit' && canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
          title="Remove this testimonial"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Video Section */}
      <div className="aspect-video">
        <VideoPlayer />
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cardStyles.avatarGradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {item.customer_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <EditableAdaptiveText
              mode={mode}
              value={item.customer_name}
              onEdit={(value) => onUpdate(item.id, 'customer_name', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold text-gray-900"
              placeholder="Customer name..."
              sectionId={sectionId}
              elementKey={`video_testimonials.${item.id}.customer_name`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={item.customer_title}
              onEdit={(value) => onUpdate(item.id, 'customer_title', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm text-gray-600"
              placeholder="Customer title..."
              sectionId={sectionId}
              elementKey={`video_testimonials.${item.id}.customer_title`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={item.customer_company}
              onEdit={(value) => onUpdate(item.id, 'customer_company', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className={`text-sm ${cardStyles.accentColor} font-medium`}
              placeholder="Customer company..."
              sectionId={sectionId}
              elementKey={`video_testimonials.${item.id}.customer_company`}
              sectionBackground={sectionBackground}
            />
          </div>
        </div>

        <EditableAdaptiveText
          mode={mode}
          value={item.title}
          onEdit={(value) => onUpdate(item.id, 'title', value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{
            ...h4Style,
            fontWeight: 700
          }}
          className="font-bold text-gray-900 mb-3"
          placeholder="Video testimonial title..."
          sectionId={sectionId}
          elementKey={`video_testimonials.${item.id}.title`}
          sectionBackground={sectionBackground}
        />

        <EditableAdaptiveText
          mode={mode}
          value={item.description}
          onEdit={(value) => onUpdate(item.id, 'description', value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className={`${mutedTextColor} leading-relaxed text-sm mb-4`}
          placeholder="Video testimonial description..."
          sectionId={sectionId}
          elementKey={`video_testimonials.${item.id}.description`}
          sectionBackground={sectionBackground}
        />

        {/* Video URL Input for Edit Mode */}
        {mode === 'edit' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
            <EditableAdaptiveText
              mode={mode}
              value={item.video_url || ''}
              onEdit={(value) => onUpdate(item.id, 'video_url', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              className="text-sm text-gray-700"
              placeholder="https://www.youtube.com/embed/..."
              sectionId={sectionId}
              elementKey={`video_testimonials.${item.id}.video_url`}
              sectionBackground="bg-gray-50"
            />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-500">Verified customer</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">3 min watch</div>
        </div>
      </div>
    </div>
  );
});
VideoTestimonialCard.displayName = 'VideoTestimonialCard';

export default function VideoTestimonials(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<VideoTestimonialsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Detect theme
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const cardStyles = getCardStyles(theme);

  // V2: Arrays from content
  const testimonials: VideoTestimonialItem[] = blockContent.video_testimonials || [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Safe background type
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  // V2: Update handlers with constraints
  const handleTestimonialUpdate = (id: string, field: keyof VideoTestimonialItem, value: string) => {
    const updated = testimonials.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    (handleContentUpdate as any)('video_testimonials', updated);
  };

  const handleTestimonialDelete = (id: string) => {
    // Enforce min constraint
    if (testimonials.length <= 1) return;
    const updated = testimonials.filter(t => t.id !== id);
    (handleContentUpdate as any)('video_testimonials', updated);
  };

  const handleAddTestimonial = () => {
    // Enforce max constraint
    if (testimonials.length >= 6) return;
    const newId = `vt-${Date.now()}`;
    const newItem: VideoTestimonialItem = {
      id: newId,
      title: `Testimonial ${testimonials.length + 1}`,
      description: 'Add testimonial description here',
      customer_name: 'Customer Name',
      customer_title: 'Title',
      customer_company: 'Company',
      video_url: '',
      thumbnail: ''
    };
    (handleContentUpdate as any)('video_testimonials', [...testimonials, newItem]);
  };

  // Grid columns based on count
  const getGridClass = (count: number) => {
    if (count === 1) return 'md:grid-cols-1 max-w-xl mx-auto';
    if (count === 2) return 'lg:grid-cols-2';
    if (count === 3) return 'lg:grid-cols-2 xl:grid-cols-3';
    return 'lg:grid-cols-2';
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VideoTestimonials"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your video testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Video Testimonial Cards Grid */}
        <div className={`grid ${getGridClass(testimonials.length)} gap-8`}>
          {testimonials.map((item) => (
            <VideoTestimonialCard
              key={item.id}
              item={item}
              mode={mode}
              colorTokens={colorTokens}
              mutedTextColor={mutedTextColor}
              onUpdate={handleTestimonialUpdate}
              onDelete={handleTestimonialDelete}
              sectionId={sectionId}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              h4Style={h4Style}
              theme={theme}
              canDelete={testimonials.length > 1}
            />
          ))}

          {/* Add Testimonial Button */}
          {mode === 'edit' && testimonials.length < 6 && (
            <div className={`bg-white ${cardEnhancements.borderRadius} border-2 border-dashed ${cardStyles.border} ${cardStyles.hover} ${cardEnhancements.hoverLift} ${cardEnhancements.transition} flex flex-col items-center justify-center min-h-[400px]`}>
              <button
                onClick={handleAddTestimonial}
                className="w-full h-full flex flex-col items-center justify-center space-y-4 text-gray-400 hover:text-gray-600 transition-colors duration-300 p-8"
                title="Add new video testimonial"
              >
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Video Testimonial</span>
                <span className="text-xs text-gray-400">{testimonials.length}/6 testimonials</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'VideoTestimonials',
  category: 'Testimonial',
  description: 'Video testimonials with theme-based card styling. Features inline editing and add/remove capabilities.',
  tags: ['testimonial', 'video', 'enterprise', 'sales', 'trust', 'wysiwyg', 'inline-editing'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',

  // Element restriction information
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Video testimonial layouts use precise card arrangements with structured testimonial data that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit testimonial titles, descriptions, and customer details directly on each card",
      "Add video URLs through the textbox input in edit mode",
      "Modify the headline and subheadline for section introduction",
      "Switch to a flexible content section for custom elements"
    ]
  },

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'video_testimonials', label: 'Video Testimonials (array)', type: 'array', required: true }
  ],

  features: [
    'V2 schema with array-based data',
    'Theme-based card styling (warm/cool/neutral)',
    'Add/remove testimonials with constraints (2-6)',
    'Direct inline editing of all testimonial fields',
    'Individual video URL input through textboxes',
    'Real-time editable customer names, titles, and companies',
    'Professional video testimonial card layout',
    'Video thumbnail support',
    'Responsive grid layout'
  ],

  useCases: [
    'Enterprise software sales with video testimonials',
    'High-value product demonstrations requiring social proof',
    'B2B customer success story showcases',
    'Product-aware audience engagement campaigns',
    'Video testimonial campaigns with inline editing needs',
    'Sales pages requiring credible customer validation'
  ]
};
