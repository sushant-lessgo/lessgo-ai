// PullQuoteStack.tsx - V2: Clean array-based testimonials
// B2C equivalent of QuoteGrid - masonry layout with color gradients

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';
import { getDynamicCardLayout } from '@/utils/dynamicCardLayout';

// V2: Testimonial item structure - clean array item
interface Testimonial {
  id: string;
  quote: string;
  customer_name: string;
  customer_title: string;
  customer_location?: string;
  avatar_url?: string;
}

// V2: Content interface - uses clean arrays
interface PullQuoteStackContent {
  headline: string;
  subheadline?: string;
  testimonials: Testimonial[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Real People, Real Results'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  testimonials: {
    type: 'array' as const,
    default: [
      { id: 't1', quote: 'I used to spend my entire Sunday meal prepping. Now I have that time back with my kids. This changed everything for our family.', customer_name: 'Sarah M.', customer_title: 'Busy Mom of 3', customer_location: 'Austin, TX', avatar_url: '' },
      { id: 't2', quote: 'Finally something that actually fits into my crazy schedule. No complicated setup, no learning curve. Just results.', customer_name: 'Mike R.', customer_title: 'Night Shift Nurse', customer_location: 'Chicago, IL', avatar_url: '' },
      { id: 't3', quote: 'I was skeptical at first but gave it a shot. Three months later and I genuinely look forward to using this every day.', customer_name: 'Jennifer L.', customer_title: 'Working Professional', customer_location: 'Seattle, WA', avatar_url: '' }
    ]
  }
};

// Theme color mapping for gradient cards
const getEmotionalColor = (index: number, theme: UIBlockTheme) => {
  const themeColors = {
    warm: {
      gradients: ['from-orange-50 to-red-50', 'from-amber-50 to-yellow-50', 'from-pink-50 to-rose-50'],
      borders: ['border-orange-200', 'border-amber-200', 'border-pink-200'],
      accents: ['text-orange-600', 'text-amber-600', 'text-pink-600']
    },
    cool: {
      gradients: ['from-blue-50 to-indigo-50', 'from-cyan-50 to-teal-50', 'from-sky-50 to-blue-50'],
      borders: ['border-blue-200', 'border-cyan-200', 'border-sky-200'],
      accents: ['text-blue-600', 'text-cyan-600', 'text-sky-600']
    },
    neutral: {
      gradients: ['from-gray-50 to-slate-50', 'from-zinc-50 to-neutral-50', 'from-stone-50 to-gray-50'],
      borders: ['border-gray-200', 'border-zinc-200', 'border-stone-200'],
      accents: ['text-gray-600', 'text-zinc-600', 'text-stone-600']
    }
  };

  const colors = themeColors[theme];
  const colorIndex = index % 3;

  return {
    bg: colors.gradients[colorIndex],
    border: colors.borders[colorIndex],
    accent: colors.accents[colorIndex]
  };
};

export default function PullQuoteStack(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<PullQuoteStackContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection with priority: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const cardStyles = React.useMemo(() => getCardStyles({
    sectionBackgroundCSS: sectionBackground || '',
    theme
  }), [sectionBackground, theme]);

  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // V2: Direct array access with JSON parse fallback
  const testimonials: Testimonial[] = React.useMemo(() => {
    const raw = blockContent.testimonials;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return raw;
  }, [blockContent.testimonials]);

  // V2: Handle testimonial field update
  const handleTestimonialUpdate = (id: string, field: keyof Testimonial, value: string) => {
    const updated = testimonials.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    (handleContentUpdate as any)('testimonials', updated);
  };

  // V2: Handle removing a testimonial
  const handleRemoveTestimonial = (id: string) => {
    const updated = testimonials.filter(t => t.id !== id);
    (handleContentUpdate as any)('testimonials', updated);
  };

  // V2: Handle adding a new testimonial
  const handleAddTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: `t${Date.now()}`,
      quote: 'This made such a difference in my daily routine. Wish I found it sooner!',
      customer_name: 'New Customer',
      customer_title: 'Happy User',
      customer_location: 'Your City',
      avatar_url: ''
    };
    (handleContentUpdate as any)('testimonials', [...testimonials, newTestimonial]);
  };

  // Quote Card Component
  const QuoteCard = ({ testimonial, index }: {
    testimonial: Testimonial;
    index: number;
  }) => {
    const color = getEmotionalColor(index, theme);
    const isLarge = index % 3 === 0; // Every third quote is larger (masonry effect)

    return (
      <div className={`${isLarge ? 'md:col-span-2' : ''}`}>
        <div
          className={`group relative ${cardStyles.bg} ${cardStyles.blur} ${cardStyles.border} ${cardStyles.shadow} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 h-full`}
          data-element-key={`testimonials.${testimonial.id}`}
        >
          {/* Quote */}
          <blockquote className="leading-relaxed mb-6 font-medium relative">
            <svg className={`w-8 h-8 ${cardStyles.textMuted} mb-2`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={testimonial.quote}
              onEdit={(value) => handleTestimonialUpdate(testimonial.id, 'quote', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={isLarge ? h3Style : bodyLgStyle}
              className={cardStyles.textHeading}
              placeholder="Customer testimonial quote..."
              sectionId={sectionId}
              elementKey={`testimonials.${testimonial.id}.quote`}
              sectionBackground={sectionBackground}
            />
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center space-x-3">
            <AvatarEditableComponent
              mode={mode}
              avatarUrl={testimonial.avatar_url || ''}
              onAvatarChange={(url) => handleTestimonialUpdate(testimonial.id, 'avatar_url', url)}
              customerName={testimonial.customer_name}
              size="md"
            />
            <div className="flex-1">
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customer_name}
                onEdit={(value) => handleTestimonialUpdate(testimonial.id, 'customer_name', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className={`font-semibold ${cardStyles.textHeading} mb-1`}
                placeholder="Customer name..."
                sectionId={sectionId}
                elementKey={`testimonials.${testimonial.id}.customer_name`}
                sectionBackground={sectionBackground}
              />
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customer_title}
                onEdit={(value) => handleTestimonialUpdate(testimonial.id, 'customer_title', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className={`text-sm ${cardStyles.textBody} mb-1`}
                placeholder="Customer title..."
                sectionId={sectionId}
                elementKey={`testimonials.${testimonial.id}.customer_title`}
                sectionBackground={sectionBackground}
              />
              {(testimonial.customer_location || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={testimonial.customer_location || ''}
                  onEdit={(value) => handleTestimonialUpdate(testimonial.id, 'customer_location', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm font-medium ${color.accent}`}
                  placeholder="Company name..."
                  sectionId={sectionId}
                  elementKey={`testimonials.${testimonial.id}.customer_location`}
                  sectionBackground={sectionBackground}
                />
              )}
            </div>
          </div>

          {/* Delete Button - Only show in edit mode and if can remove */}
          {mode === 'edit' && testimonials.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTestimonial(testimonial.id);
              }}
              className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
              title="Remove this testimonial"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Dynamic card layout for container width
  const layout = getDynamicCardLayout(testimonials.length);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PullQuoteStack"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className={layout.containerClass}>
        {/* Header */}
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Testimonial Grid - Masonry Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <QuoteCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Add Testimonial Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && testimonials.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddTestimonial}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Testimonial</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'PullQuoteStack',
  category: 'Testimonial',
  description: 'B2C testimonial grid with masonry layout and color gradients. V2 clean array format.',
  tags: ['testimonial', 'quotes', 'b2c', 'masonry', 'gradients'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonials', label: 'Testimonials (array)', type: 'array', required: true }
  ],

  features: [
    'V2: Clean array-based data format',
    'Masonry grid layout (every 3rd larger)',
    'Theme-based color gradients (warm/cool/neutral)',
    'Editable avatars with upload functionality',
    'Add/delete testimonials (2-6)',
    'Inline editing for all fields'
  ],

  useCases: [
    'B2C testimonial sections',
    'Personal story showcases',
    'Customer success stories',
    'Solo entrepreneur testimonials'
  ]
};
