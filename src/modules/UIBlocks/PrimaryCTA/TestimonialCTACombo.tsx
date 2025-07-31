// components/layout/TestimonialCTACombo.tsx
// Production-ready CTA with testimonial using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface TestimonialCTAComboContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_title: string;
  testimonial_company: string;
  rating?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Join Thousands of Happy Customers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See why businesses trust us to transform their operations and drive growth.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Success Story' 
  },
  testimonial_quote: { 
    type: 'string' as const, 
    default: 'This platform has completely transformed how we work. We\'ve saved over 20 hours per week and our team productivity has increased by 40%. The ROI was immediate and continues to grow.' 
  },
  testimonial_author: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  testimonial_title: { 
    type: 'string' as const, 
    default: 'VP of Operations' 
  },
  testimonial_company: { 
    type: 'string' as const, 
    default: 'TechFlow Solutions' 
  },
  rating: { 
    type: 'string' as const, 
    default: '5' 
  }
};

// Star Rating Component
const StarRating = React.memo(({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
});
StarRating.displayName = 'StarRating';

// Avatar Component
const TestimonialAvatar = React.memo(({ name, company }: { name: string, company: string }) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Generate color based on name
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600'
  ];
  const colorIndex = name.length % colors.length;

  return (
    <div className="relative">
      <div className={`w-16 h-16 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        {initials}
      </div>
      {/* Company logo placeholder */}
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
        <div className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center font-bold text-gray-600">
          {company.charAt(0)}
        </div>
      </div>
    </div>
  );
});
TestimonialAvatar.displayName = 'TestimonialAvatar';

export default function TestimonialCTACombo(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<TestimonialCTAComboContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const rating = parseInt(blockContent.rating || '5');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TestimonialCTACombo"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - CTA Content */}
          <div className="space-y-8">
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              textStyle={getTextStyle('h1')}
              className="mb-6"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType || 'primary'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="text-lg mb-8"
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              textStyle={getTextStyle('body-lg')}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              size="large"
              sectionId={sectionId}
              elementKey="cta_text"
              onClick={createCTAClickHandler(sectionId)}
            />

            {/* Social Proof Stats */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                  10,000+
                </div>
                <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                  Happy Customers
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                  4.9/5
                </div>
                <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                  Average Rating
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                  99.9%
                </div>
                <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                  Uptime
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Testimonial */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 relative">
            {/* Quote Icon */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <StarRating rating={rating} />
            </div>

            {/* Testimonial Quote */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.testimonial_quote}
              onEdit={(value) => handleContentUpdate('testimonial_quote', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-gray-700 leading-relaxed mb-6 italic"
              sectionId={sectionId}
              elementKey="testimonial_quote"
              sectionBackground="bg-white"
            />

            {/* Author Info */}
            <div className="flex items-center space-x-4">
              <TestimonialAvatar 
                name={blockContent.testimonial_author} 
                company={blockContent.testimonial_company}
              />
              
              <div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_author}
                  onEdit={(value) => handleContentUpdate('testimonial_author', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="font-semibold text-gray-900"
                  sectionId={sectionId}
                  elementKey="testimonial_author"
                  sectionBackground="bg-white"
                />
                
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.testimonial_title}
                    onEdit={(value) => handleContentUpdate('testimonial_title', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={getTextStyle('body-sm')}
                    className="text-gray-500"
                    sectionId={sectionId}
                    elementKey="testimonial_title"
                    sectionBackground="bg-white"
                  />
                  <span>at</span>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.testimonial_company}
                    onEdit={(value) => handleContentUpdate('testimonial_company', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={getTextStyle('body-sm')}
                    className="text-gray-500 font-medium"
                    sectionId={sectionId}
                    elementKey="testimonial_company"
                    sectionBackground="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Verified Badge */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 rounded-full">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-xs font-medium">Verified</span>
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
  name: 'TestimonialCTACombo',
  category: 'CTA Sections',
  description: 'CTA with featured testimonial for social proof',
  tags: ['cta', 'testimonial', 'social-proof', 'conversion', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Featured customer testimonial',
    'Star rating display',
    'Avatar with company indicator',
    'Social proof statistics',
    'Verified badge'
  ],
  
  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'testimonial_quote', label: 'Testimonial Quote', type: 'textarea', required: true },
    { key: 'testimonial_author', label: 'Author Name', type: 'text', required: true },
    { key: 'testimonial_title', label: 'Author Title', type: 'text', required: true },
    { key: 'testimonial_company', label: 'Company Name', type: 'text', required: true },
    { key: 'rating', label: 'Star Rating (1-5)', type: 'text', required: false }
  ],
  
  useCases: [
    'Trust-building CTAs',
    'Social proof sections',
    'Customer story highlights',
    'Conversion optimization'
  ]
};