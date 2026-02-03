// components/layout/QuoteGrid.tsx - V2: Clean array-based testimonials
// Production-ready testimonial quote grid with adaptive text colors

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Testimonial item structure - clean array item
interface Testimonial {
  id: string;
  quote: string;
  customer_name: string;
  customer_title?: string;
  customer_company?: string;
  rating_value?: string;
}

// V2: Content interface - uses clean arrays
interface QuoteGridContent {
  headline: string;
  subheadline?: string;
  verification_message?: string;
  testimonials: Testimonial[];
}

// V2: Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'What Our Customers Are Saying'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  verification_message: {
    type: 'string' as const,
    default: 'All testimonials from verified customers'
  },
  testimonials: {
    type: 'array' as const,
    default: [
      { id: 't1', quote: 'This platform completely transformed how we handle our daily operations. What used to take hours now takes minutes.', customer_name: 'Sarah Johnson', customer_title: 'Operations Director', customer_company: 'TechFlow Inc', rating_value: '5' },
      { id: 't2', quote: 'The ROI was immediate and significant. Within the first month, we had already saved more than the annual subscription cost.', customer_name: 'Michael Chen', customer_title: 'CTO', customer_company: 'DataWorks', rating_value: '5' },
      { id: 't3', quote: 'Outstanding customer support and a product that actually delivers on its promises. Rare to find both in one solution.', customer_name: 'Emma Rodriguez', customer_title: 'Marketing Manager', customer_company: 'GrowthLab', rating_value: '5' }
    ]
  }
};

// Parse rating for star rendering
const parseRating = (rating: string | number | undefined): number => {
  if (rating === undefined || rating === null) return 5;
  if (typeof rating === 'number') return Math.min(5, Math.max(0, rating));
  const match = String(rating).match(/([\d.]+)/);
  return match ? Math.min(5, Math.max(0, parseFloat(match[1]))) : 5;
};

// Render star rating
const renderStars = (rating: string | undefined) => {
  const ratingNum = parseRating(rating);
  const stars = [];

  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(ratingNum) ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  return <div className="flex items-center space-x-0.5">{stars}</div>;
};

// Customer Avatar Component - generates initials from name with theme colors
const CustomerAvatar = React.memo(({ name, theme }: { name: string; theme: UIBlockTheme }) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (theme: UIBlockTheme) => ({
    warm: 'from-orange-500 to-orange-600',
    cool: 'from-blue-500 to-blue-600',
    neutral: 'from-gray-500 to-gray-600'
  })[theme];

  return (
    <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(theme)} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
      {getInitials(name)}
    </div>
  );
});
CustomerAvatar.displayName = 'CustomerAvatar';

// Theme color mapping
const getThemeColors = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    borderHover: 'hover:border-orange-300',
    quoteText: 'text-orange-300',
    buttonBg: 'bg-orange-50 hover:bg-orange-100',
    buttonBorder: 'border-orange-200 hover:border-orange-300',
    buttonText: 'text-orange-700',
    buttonIcon: 'text-orange-500'
  },
  cool: {
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    quoteText: 'text-blue-300',
    buttonBg: 'bg-blue-50 hover:bg-blue-100',
    buttonBorder: 'border-blue-200 hover:border-blue-300',
    buttonText: 'text-blue-700',
    buttonIcon: 'text-blue-500'
  },
  neutral: {
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    quoteText: 'text-gray-300',
    buttonBg: 'bg-gray-50 hover:bg-gray-100',
    buttonBorder: 'border-gray-200 hover:border-gray-300',
    buttonText: 'text-gray-700',
    buttonIcon: 'text-gray-500'
  }
})[theme];

// Individual Testimonial Card
const TestimonialCard = React.memo(({
  testimonial,
  mode,
  colorTokens,
  onUpdate,
  onRemove,
  canRemove,
  sectionId,
  sectionBackground,
  themeColors,
  theme
}: {
  testimonial: Testimonial;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onUpdate: (id: string, field: keyof Testimonial, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  sectionId: string;
  sectionBackground: string;
  themeColors: ReturnType<typeof getThemeColors>;
  theme: UIBlockTheme;
}) => {
  return (
    <div
      className={`group relative bg-white p-8 rounded-xl border ${themeColors.border} ${themeColors.borderHover} ${shadows.card[theme]} ${shadows.cardHover[theme]} ${cardEnhancements.hoverLift} ${cardEnhancements.transition}`}
      data-element-key={`testimonials.${testimonial.id}`}
    >
      {/* Quote Mark */}
      <div className={`absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300 text-5xl font-serif ${themeColors.quoteText}`}>
        "
      </div>

      {/* Delete Button */}
      {mode !== 'preview' && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(testimonial.id);
          }}
          className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          title="Remove this testimonial"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Testimonial Quote */}
      <div className="mb-6" data-element-key={`testimonials.${testimonial.id}.quote`}>
        <EditableAdaptiveText
          mode={mode}
          value={`"${testimonial.quote}"`}
          onEdit={(value) => onUpdate(testimonial.id, 'quote', value.replace(/^"|"$/g, ''))}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className="leading-relaxed italic text-lg"
          style={{ color: colorTokens.textSecondary }}
          placeholder="Enter testimonial quote..."
          sectionId={sectionId}
          elementKey={`testimonials.${testimonial.id}.quote`}
          sectionBackground={sectionBackground}
        />
      </div>

      {/* Customer Attribution */}
      <div className="flex items-center space-x-4">
        <CustomerAvatar name={testimonial.customer_name} theme={theme} />

        <div className="flex-1">
          {/* Customer Name */}
          <div data-element-key={`testimonials.${testimonial.id}.customer_name`}>
            <EditableAdaptiveText
              mode={mode}
              value={testimonial.customer_name}
              onEdit={(value) => onUpdate(testimonial.id, 'customer_name', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold"
              style={{ color: colorTokens.textPrimary }}
              placeholder="Customer name..."
              sectionId={sectionId}
              elementKey={`testimonials.${testimonial.id}.customer_name`}
              sectionBackground={sectionBackground}
            />
          </div>

          {/* Customer Title */}
          {(testimonial.customer_title || mode === 'edit') && (
            <div data-element-key={`testimonials.${testimonial.id}.customer_title`}>
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customer_title || ''}
                onEdit={(value) => onUpdate(testimonial.id, 'customer_title', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-sm"
                style={{ color: colorTokens.textMuted }}
                placeholder="Title..."
                sectionId={sectionId}
                elementKey={`testimonials.${testimonial.id}.customer_title`}
                sectionBackground={sectionBackground}
              />
            </div>
          )}

          {/* Customer Company */}
          {(testimonial.customer_company || mode === 'edit') && (
            <div data-element-key={`testimonials.${testimonial.id}.customer_company`}>
              <EditableAdaptiveText
                mode={mode}
                value={testimonial.customer_company || ''}
                onEdit={(value) => onUpdate(testimonial.id, 'customer_company', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-sm font-medium"
                style={{ color: colorTokens.accent }}
                placeholder="Company..."
                sectionId={sectionId}
                elementKey={`testimonials.${testimonial.id}.customer_company`}
                sectionBackground={sectionBackground}
              />
            </div>
          )}
        </div>
      </div>

      {/* Star Rating - only show number when < 5 or in edit mode */}
      <div className="mt-4 flex items-center space-x-2" data-element-key={`testimonials.${testimonial.id}.rating_value`}>
        {renderStars(testimonial.rating_value)}
        {(mode === 'edit' || parseRating(testimonial.rating_value) < 5) && (
          <EditableAdaptiveText
            mode={mode}
            value={testimonial.rating_value || '5'}
            onEdit={(value) => onUpdate(testimonial.id, 'rating_value', value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="body"
            className="text-sm font-medium"
            style={{ color: colorTokens.textSecondary }}
            placeholder="5"
            sectionId={sectionId}
            elementKey={`testimonials.${testimonial.id}.rating_value`}
            sectionBackground={sectionBackground}
          />
        )}
      </div>
    </div>
  );
});
TestimonialCard.displayName = 'TestimonialCard';

export default function QuoteGrid(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<QuoteGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(theme);

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
      quote: 'This is a new testimonial. Click to edit and add your customer\'s feedback.',
      customer_name: 'Customer Name',
      customer_title: 'Title',
      customer_company: 'Company',
      rating_value: '5'
    };
    (handleContentUpdate as any)('testimonials', [...testimonials, newTestimonial]);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="QuoteGrid"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
            className="mb-4"
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="max-w-2xl mx-auto"
              placeholder="Join 10,000+ happy customers..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${
          testimonials.length === 1 ? 'max-w-2xl mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          testimonials.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 xl:max-w-5xl xl:mx-auto'
        }`}>
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              mode={mode}
              colorTokens={colorTokens}
              onUpdate={handleTestimonialUpdate}
              onRemove={handleRemoveTestimonial}
              canRemove={testimonials.length > 2}
              sectionId={sectionId}
              sectionBackground={sectionBackground}
              themeColors={themeColors}
              theme={theme}
            />
          ))}
        </div>

        {/* Add Testimonial Button */}
        {mode !== 'preview' && testimonials.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddTestimonial}
              className={`inline-flex items-center space-x-2 px-4 py-3 ${themeColors.buttonBg} border-2 ${themeColors.buttonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.buttonIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.buttonText} font-medium`}>Add Testimonial</span>
            </button>
          </div>
        )}

        {/* Trust Reinforcement - simple line */}
        {(blockContent.verification_message || mode === 'edit') && (
          <div className="mt-12 text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.verification_message || ''}
              onEdit={(value) => handleContentUpdate('verification_message', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm"
              style={{ color: colorTokens.textSecondary }}
              placeholder="All testimonials from verified customers"
              sectionId={sectionId}
              elementKey="verification_message"
              sectionBackground={sectionBackground}
            />
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export metadata with V2 schema info
export const componentMeta = {
  name: 'QuoteGrid',
  category: 'Testimonials',
  description: 'Customer testimonial quotes with attribution, star ratings, and adaptive text colors',
  tags: ['testimonials', 'quotes', 'social-proof', 'customers', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',

  features: [
    'Automatic text color adaptation based on background type',
    'Customer testimonials with individual star ratings',
    'Editable quote cards with data-element-key support',
    'Customer attribution with auto-generated avatars',
    'V2: Clean array-based data format'
  ],

  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'text', required: false },
    { key: 'testimonials', label: 'Testimonials (array)', type: 'array', required: true }
  ],

  useCases: [
    'Customer testimonial section',
    'Social proof showcase',
    'Review highlights',
    'Success story quotes'
  ]
};
