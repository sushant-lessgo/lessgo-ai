import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { 
  parseCustomerAvatarData, 
  getCustomerAvatarUrl, 
  updateAvatarUrls,
  parsePipeData 
} from '@/utils/dataParsingUtils';

interface AvatarCarouselContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_avatars?: string;
  customer_companies?: string;
  ratings?: string;
  auto_rotate?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  community_title?: string;
  active_creators_count?: string;
  active_creators_label?: string;
  average_rating_display?: string;
  average_rating_label?: string;
  creations_count?: string;
  creations_label?: string;
  // Dynamic avatar system
  avatar_urls?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Loved by Creators Worldwide' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: `This tool completely changed how I approach my creative projects. The interface is intuitive and the results are professional-grade every time.|As a content creator, time is everything. This platform helps me create stunning visuals in minutes, not hours.|The community and support are incredible. I've learned so much and my audience engagement has tripled.|From idea to published content in record time. This tool has become essential to my creative workflow.|The quality of output is consistently amazing. My clients are always impressed with what I can create.` 
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
    type: 'string' as const, 
    default: 'true' 
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
  community_title: {
    type: 'string' as const,
    default: 'Join the Creator Community'
  },
  active_creators_count: {
    type: 'string' as const,
    default: '50K+'
  },
  active_creators_label: {
    type: 'string' as const,
    default: 'Active creators'
  },
  average_rating_display: {
    type: 'string' as const,
    default: '4.9★'
  },
  average_rating_label: {
    type: 'string' as const,
    default: 'Average rating'
  },
  creations_count: {
    type: 'string' as const,
    default: '1M+'
  },
  creations_label: {
    type: 'string' as const,
    default: 'Creations made'
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' 
  }
};

export default function AvatarCarousel(props: LayoutComponentProps) {
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
  } = useLayoutComponent<AvatarCarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

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

  // Handle avatar URL updates
  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  // Get avatar URL for customer - prioritize dynamic system over legacy
  const getAvatarForCustomer = (customerName: string, fallbackIndex: number): string => {
    // First try dynamic avatar_urls system
    const dynamicAvatar = getCustomerAvatarUrl(blockContent.avatar_urls || '{}', customerName);
    if (dynamicAvatar) return dynamicAvatar;
    
    // Fallback to legacy customer_avatars system
    return customerAvatars[fallbackIndex] || '';
  };

  const testimonials = testimonialQuotes.map((quote, index) => ({
    quote,
    name: customerNames[index] || '',
    title: customerTitles[index] || '',
    avatar: getAvatarForCustomer(customerNames[index] || '', index),
    company: customerCompanies[index] || '',
    rating: ratings[index] || 5
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(blockContent.auto_rotate === 'true');

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
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

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
        <AvatarEditableComponent
          mode={mode}
          avatarUrl={testimonial.avatar}
          onAvatarChange={(url) => handleAvatarChange(testimonial.name, url)}
          customerName={testimonial.name}
          size="lg"
          className="border-4 border-white shadow-xl"
        />
        
        {isActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };
  
  const activeTestimonial = testimonials[activeIndex];
  
  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AvatarCarousel"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
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
                  value={blockContent.testimonial_quotes || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Testimonial quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_names || ''}
                  onEdit={(value) => handleContentUpdate('customer_names', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Customer names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_titles || ''}
                  onEdit={(value) => handleContentUpdate('customer_titles', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
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
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
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
                    <StarRating rating={activeTestimonial.rating} size="large" />
                  </div>
                  
                  <blockquote style={h3Style} className="text-gray-800 leading-relaxed mb-6 max-w-3xl mx-auto">
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
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.community_title || ''}
              onEdit={(value) => handleContentUpdate('community_title', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="h3"
              style={h3Style}
              className="font-semibold text-gray-900 mb-6"
              placeholder="Community section title..."
              sectionId={sectionId}
              elementKey="community_title"
              sectionBackground={sectionBackground}
            />
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.active_creators_count || ''}
                  onEdit={(value) => handleContentUpdate('active_creators_count', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-purple-600 mb-2"
                  placeholder="Creator count..."
                  sectionId={sectionId}
                  elementKey="active_creators_count"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.active_creators_label || ''}
                  onEdit={(value) => handleContentUpdate('active_creators_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Creator label..."
                  sectionId={sectionId}
                  elementKey="active_creators_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.average_rating_display || ''}
                  onEdit={(value) => handleContentUpdate('average_rating_display', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-pink-600 mb-2"
                  placeholder="Rating display..."
                  sectionId={sectionId}
                  elementKey="average_rating_display"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.average_rating_label || ''}
                  onEdit={(value) => handleContentUpdate('average_rating_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Rating label..."
                  sectionId={sectionId}
                  elementKey="average_rating_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.creations_count || ''}
                  onEdit={(value) => handleContentUpdate('creations_count', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-indigo-600 mb-2"
                  placeholder="Creations count..."
                  sectionId={sectionId}
                  elementKey="creations_count"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.creations_label || ''}
                  onEdit={(value) => handleContentUpdate('creations_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Creations label..."
                  sectionId={sectionId}
                  elementKey="creations_label"
                  sectionBackground={sectionBackground}
                />
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
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
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
    { key: 'customer_avatars', label: 'Customer Avatars (pipe separated) - Legacy', type: 'textarea', required: false },
    { key: 'avatar_urls', label: 'Avatar URLs (JSON format)', type: 'text', required: false },
    { key: 'customer_companies', label: 'Customer Handles/Companies (pipe separated)', type: 'text', required: false },
    { key: 'ratings', label: 'Ratings (pipe separated)', type: 'text', required: false },
    { key: 'auto_rotate', label: 'Auto-rotate Carousel', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'community_title', label: 'Community Section Title', type: 'text', required: false },
    { key: 'active_creators_count', label: 'Active Creators Count', type: 'text', required: false },
    { key: 'active_creators_label', label: 'Active Creators Label', type: 'text', required: false },
    { key: 'average_rating_display', label: 'Average Rating Display', type: 'text', required: false },
    { key: 'average_rating_label', label: 'Average Rating Label', type: 'text', required: false },
    { key: 'creations_count', label: 'Creations Count', type: 'text', required: false },
    { key: 'creations_label', label: 'Creations Label', type: 'text', required: false }
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