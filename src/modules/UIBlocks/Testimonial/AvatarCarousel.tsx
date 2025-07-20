import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStore } from '@/hooks/useEditStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface AvatarCarouselContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_avatars?: string;
  customer_companies?: string;
  ratings?: string;
  auto_rotate?: boolean;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Loved by Creators Worldwide' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'This tool completely changed how I approach my creative projects. The interface is intuitive and the results are professional-grade every time.|As a content creator, time is everything. This platform helps me create stunning visuals in minutes, not hours.|The community and support are incredible. I\\'ve learned so much and my audience engagement has tripled.|From idea to published content in record time. This tool has become essential to my creative workflow.|The quality of output is consistently amazing. My clients are always impressed with what I can create.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Alex Rivera|Maya Patel|Jordan Kim|Sam Thompson|Casey Martinez' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Content Creator|Digital Artist|YouTuber|Brand Designer|Social Media Manager' 
  },
  customer_avatars: { 
    type: 'string' as const, 
    default: '/avatar-1.jpg|/avatar-2.jpg|/avatar-3.jpg|/avatar-4.jpg|/avatar-5.jpg' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: '@alexcreates|@mayaartistry|@jordanvlogs|@samdesigns|@caseydigital' 
  },
  ratings: { 
    type: 'string' as const, 
    default: '5|5|5|4|5' 
  },
  auto_rotate: { 
    type: 'boolean' as const, 
    default: true 
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
  }
};

export default function AvatarCarousel(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<AvatarCarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const testimonialQuotes = blockContent.testimonial_quotes 
    ? blockContent.testimonial_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerNames = blockContent.customer_names 
    ? blockContent.customer_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerTitles = blockContent.customer_titles 
    ? blockContent.customer_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerAvatars = blockContent.customer_avatars 
    ? blockContent.customer_avatars.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerCompanies = blockContent.customer_companies 
    ? blockContent.customer_companies.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const ratings = blockContent.ratings 
    ? blockContent.ratings.split('|').map(item => parseInt(item.trim()) || 5)
    : [];

  const testimonials = testimonialQuotes.map((quote, index) => ({
    quote,
    name: customerNames[index] || '',
    title: customerTitles[index] || '',
    avatar: customerAvatars[index] || '',
    company: customerCompanies[index] || '',
    rating: ratings[index] || 5
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(blockContent.auto_rotate);

  // Auto-rotation logic
  useEffect(() => {
    if (isAutoRotating && testimonials.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isAutoRotating, testimonials.length]);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);

  const AvatarItem = ({ testimonial, index, isActive, isAdjacent }: {
    testimonial: typeof testimonials[0];
    index: number;
    isActive: boolean;
    isAdjacent: boolean;
  }) => {
    const getPositionClass = () => {
      if (isActive) return 'scale-100 z-20 opacity-100';
      if (isAdjacent) return 'scale-90 z-10 opacity-70';
      return 'scale-75 z-0 opacity-40';
    };

    return (
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-500 cursor-pointer ${getPositionClass()}`}
        style={{
          transform: `translateX(-50%) translateX(${(index - activeIndex) * 120}px)`
        }}
        onClick={() => {
          setActiveIndex(index);
          setIsAutoRotating(false);
        }}
      >
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
          {testimonial.avatar && testimonial.avatar !== '' ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-full h-full object-cover"
              data-image-id={`${sectionId}-avatar${index}`}
              onMouseUp={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  showImageToolbar(`${sectionId}-avatar${index}`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>
        
        {isActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };
  
  const activeTestimonial = testimonials[activeIndex];
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AvatarCarousel"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your creator testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Avatar Carousel Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_quotes}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Testimonial quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_names}
                  onEdit={(value) => handleContentUpdate('customer_names', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Customer names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_titles}
                  onEdit={(value) => handleContentUpdate('customer_titles', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Customer titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_companies || ''}
                  onEdit={(value) => handleContentUpdate('customer_companies', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Customer handles/companies (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_companies"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Avatar Carousel */}
            <div className="relative h-32 mb-12">
              <div className="relative h-full flex items-center justify-center">
                {testimonials.map((testimonial, index) => {
                  const isActive = index === activeIndex;
                  const isAdjacent = Math.abs(index - activeIndex) === 1 || 
                    (activeIndex === 0 && index === testimonials.length - 1) ||
                    (activeIndex === testimonials.length - 1 && index === 0);
                  
                  return (
                    <AvatarItem
                      key={index}
                      testimonial={testimonial}
                      index={index}
                      isActive={isActive}
                      isAdjacent={isAdjacent}
                    />
                  );
                })}
              </div>
            </div>

            {/* Active Testimonial */}
            {activeTestimonial && (
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-8 border border-purple-100 mb-12">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <StarRating rating={activeTestimonial.rating} size="lg" />
                  </div>
                  
                  <blockquote className="text-xl text-gray-800 leading-relaxed mb-6 max-w-3xl mx-auto">
                    "{activeTestimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center space-x-3">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{activeTestimonial.name}</div>
                      <div className="text-sm text-gray-600">{activeTestimonial.title}</div>
                      {activeTestimonial.company && (
                        <div className="text-sm text-purple-600 font-medium">{activeTestimonial.company}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Carousel Controls */}
            <div className="flex items-center justify-center space-x-6 mb-12">
              <button
                onClick={() => {
                  setActiveIndex(activeIndex > 0 ? activeIndex - 1 : testimonials.length - 1);
                  setIsAutoRotating(false);
                }}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 shadow-md"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveIndex(index);
                      setIsAutoRotating(false);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                      index === activeIndex 
                        ? 'bg-purple-500' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => {
                  setActiveIndex(activeIndex < testimonials.length - 1 ? activeIndex + 1 : 0);
                  setIsAutoRotating(false);
                }}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 shadow-md"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Creator Community Stats */}
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-pink-100 mb-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Join the Creator Community</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
                <div className={`text-sm ${mutedTextColor}`}>Active creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">4.9★</div>
                <div className={`text-sm ${mutedTextColor}`}>Average rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">1M+</div>
                <div className={`text-sm ${mutedTextColor}`}>Creations made</div>
              </div>
            </div>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce creator testimonials..."
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
                    textStyle={getTextStyle('body-lg')}
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
  name: 'AvatarCarousel',
  category: 'Testimonial',
  description: 'Interactive avatar carousel for creator testimonials. Perfect for friendly tone and founder/creator audiences.',
  tags: ['testimonial', 'carousel', 'avatar', 'creator', 'interactive'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_avatars', label: 'Customer Avatars (pipe separated)', type: 'textarea', required: false },
    { key: 'customer_companies', label: 'Customer Handles/Companies (pipe separated)', type: 'text', required: false },
    { key: 'ratings', label: 'Ratings (pipe separated)', type: 'text', required: false },
    { key: 'auto_rotate', label: 'Auto-rotate Carousel', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive avatar carousel',
    'Auto-rotating testimonials',
    'Star rating display',
    'Creator community stats',
    'Friendly and engaging design',
    'Perfect for creator audiences'
  ],
  
  useCases: [
    'Creator and content platforms',
    'Design and creative tools',
    'Founder and creator audiences',
    'Community-driven products',
    'Visual testimonial showcases'
  ]
};