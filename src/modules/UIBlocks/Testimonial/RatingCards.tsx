import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface RatingCardsContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  ratings: string;
  review_platforms: string;
  review_dates?: string;
  verified_badges?: string;
  customer_locations?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  platforms_title?: string;
  g2_rating?: string;
  g2_label?: string;
  capterra_rating?: string;
  capterra_label?: string;
  trustpilot_rating?: string;
  trustpilot_label?: string;
  producthunt_rating?: string;
  producthunt_label?: string;
  g2_icon?: string;
  capterra_icon?: string;
  trustpilot_icon?: string;
  producthunt_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See Why Thousands of Users Love Our Platform' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: `Absolutely game-changing! The interface is intuitive and the results are consistently excellent. Best tool I've used in years.|Outstanding customer support and powerful features. This platform has saved me countless hours and improved my workflow significantly.|Impressive functionality with a clean, user-friendly design. The automation features alone make this worth every penny.|Exceeded all expectations. The learning curve is minimal and the impact on productivity is immediate. Highly recommended.|Top-notch quality and reliability. Been using it for 6 months and it keeps getting better with regular updates.|Perfect for creative professionals. The templates are beautiful and the customization options are endless.` 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah K.|Michael R.|Emma L.|David C.|Jessica M.|Alex P.' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Marketing Director|Freelance Designer|Business Owner|Content Creator|Agency Founder|UX Designer' 
  },
  ratings: { 
    type: 'string' as const, 
    default: '5|5|4|5|5|4' 
  },
  review_platforms: { 
    type: 'string' as const, 
    default: 'G2|Capterra|Trustpilot|Product Hunt|G2|Capterra' 
  },
  review_dates: { 
    type: 'string' as const, 
    default: '2 days ago|1 week ago|3 days ago|1 week ago|5 days ago|4 days ago' 
  },
  verified_badges: { 
    type: 'string' as const, 
    default: 'true|true|true|false|true|true' 
  },
  customer_locations: { 
    type: 'string' as const, 
    default: 'New York, US|London, UK|Toronto, CA|Sydney, AU|Berlin, DE|San Francisco, US' 
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
  platforms_title: {
    type: 'string' as const,
    default: 'Consistently High Ratings Across Platforms'
  },
  g2_rating: {
    type: 'string' as const,
    default: '4.8'
  },
  g2_label: {
    type: 'string' as const,
    default: 'G2 Rating'
  },
  capterra_rating: {
    type: 'string' as const,
    default: '4.9'
  },
  capterra_label: {
    type: 'string' as const,
    default: 'Capterra Rating'
  },
  trustpilot_rating: {
    type: 'string' as const,
    default: '4.7'
  },
  trustpilot_label: {
    type: 'string' as const,
    default: 'Trustpilot Rating'
  },
  producthunt_rating: {
    type: 'string' as const,
    default: '4.8'
  },
  producthunt_label: {
    type: 'string' as const,
    default: 'Product Hunt Rating'
  },
  g2_icon: {
    type: 'string' as const,
    default: '🗡️'
  },
  capterra_icon: {
    type: 'string' as const,
    default: '📈'
  },
  trustpilot_icon: {
    type: 'string' as const,
    default: '✅'
  },
  producthunt_icon: {
    type: 'string' as const,
    default: '🚀'
  }
};

export default function RatingCards(props: LayoutComponentProps) {
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
  } = useLayoutComponent<RatingCardsContent>({
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

  const ratings = blockContent.ratings 
    ? blockContent.ratings.split('|').map(item => parseInt(item.trim()) || 5)
    : [];

  const reviewPlatforms = blockContent.review_platforms 
    ? blockContent.review_platforms.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const reviewDates = blockContent.review_dates 
    ? blockContent.review_dates.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const verifiedBadges = blockContent.verified_badges 
    ? blockContent.verified_badges.split('|').map(item => item.trim().toLowerCase() === 'true')
    : [];

  const customerLocations = blockContent.customer_locations 
    ? blockContent.customer_locations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const reviews = testimonialQuotes.map((quote, index) => ({
    quote,
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    rating: ratings[index] || 5,
    platform: reviewPlatforms[index] || '',
    date: reviewDates[index] || '',
    verified: verifiedBadges[index] || false,
    location: customerLocations[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getPlatformIcon = (platform: string, index: number) => {
    const platformLower = platform.toLowerCase();
    const iconFields = ['g2_icon', 'capterra_icon', 'trustpilot_icon', 'producthunt_icon'];
    const defaultIcons = ['🗡️', '📈', '✅', '🚀'];
    
    let iconField: keyof RatingCardsContent = 'g2_icon';
    if (platformLower.includes('g2')) {
      iconField = 'g2_icon';
    } else if (platformLower.includes('capterra')) {
      iconField = 'capterra_icon';
    } else if (platformLower.includes('trustpilot')) {
      iconField = 'trustpilot_icon';
    } else if (platformLower.includes('product hunt')) {
      iconField = 'producthunt_icon';
    }
    
    return (
      <div className="w-6 h-6 rounded flex items-center justify-center group/icon-edit relative">
        <IconEditableText
          mode={mode}
          value={blockContent[iconField] || defaultIcons[Math.min(index, defaultIcons.length - 1)]}
          onEdit={(value) => handleContentUpdate(iconField, value)}
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
          colorTokens={colorTokens}
          iconSize="sm"
          className="text-base"
          sectionId={sectionId}
          elementKey={iconField}
        />
      </div>
    );
  };

  const ReviewCard = ({ review, index }: {
    review: typeof reviews[0];
    index: number;
  }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {review.customerName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{review.customerName}</div>
            <div className="text-sm text-gray-600">{review.customerTitle}</div>
            {review.location && (
              <div className="text-xs text-gray-500">{review.location}</div>
            )}
          </div>
        </div>
        
        {review.verified && (
          <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-green-700 font-medium">Verified</span>
          </div>
        )}
      </div>
      
      {/* Rating */}
      <div className="flex items-center space-x-2 mb-4">
        <StarRating rating={review.rating} size="small" />
        <span className="text-sm font-semibold text-gray-700">{review.rating}/5</span>
      </div>
      
      {/* Review Text */}
      <blockquote className="text-gray-700 leading-relaxed mb-4 text-sm">
        "{review.quote}"
      </blockquote>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {getPlatformIcon(review.platform, index)}
          <span className="text-sm font-medium text-gray-600">{review.platform}</span>
        </div>
        
        {review.date && (
          <span className="text-xs text-gray-500">{review.date}</span>
        )}
      </div>
    </div>
  );

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 5;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="RatingCards"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
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
              placeholder="Add optional subheadline to introduce rating cards..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
          
          {/* Average Rating Display */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <div className="flex items-center space-x-2">
              <StarRating rating={Math.round(averageRating)} size="large" />
              <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            </div>
            <div className={`text-sm ${mutedTextColor}`}>
              Based on {reviews.length} reviews
            </div>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Rating Cards Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_quotes || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
                  value={blockContent.ratings || ''}
                  onEdit={(value) => handleContentUpdate('ratings', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Ratings 1-5 (pipe separated)"
                  sectionId={sectionId}
                  elementKey="ratings"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.review_platforms || ''}
                  onEdit={(value) => handleContentUpdate('review_platforms', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Review platforms (pipe separated)"
                  sectionId={sectionId}
                  elementKey="review_platforms"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {reviews.map((review, index) => (
              <ReviewCard
                key={index}
                review={review}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Platform Statistics */}
        <div className="bg-gradient-to-r from-orange-50 via-blue-50 to-green-50 rounded-2xl p-8 border border-orange-100 mb-12">
          <div className="text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.platforms_title || ''}
              onEdit={(value) => handleContentUpdate('platforms_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="h3"
              style={h3Style}
              className="font-semibold text-gray-900 mb-6"
              placeholder="Platforms section title..."
              sectionId={sectionId}
              elementKey="platforms_title"
              sectionBackground={sectionBackground}
            />
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-sm group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.g2_icon || '🗡️'}
                      onEdit={(value) => handleContentUpdate('g2_icon', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-xl"
                      sectionId={sectionId}
                      elementKey="g2_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.g2_rating || ''}
                    onEdit={(value) => handleContentUpdate('g2_rating', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-2xl font-bold text-orange-600"
                    placeholder="G2 rating..."
                    sectionId={sectionId}
                    elementKey="g2_rating"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.g2_label || ''}
                  onEdit={(value) => handleContentUpdate('g2_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="G2 label..."
                  sectionId={sectionId}
                  elementKey="g2_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.capterra_icon || '📈'}
                      onEdit={(value) => handleContentUpdate('capterra_icon', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-xl"
                      sectionId={sectionId}
                      elementKey="capterra_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.capterra_rating || ''}
                    onEdit={(value) => handleContentUpdate('capterra_rating', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-2xl font-bold text-blue-600"
                    placeholder="Capterra rating..."
                    sectionId={sectionId}
                    elementKey="capterra_rating"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.capterra_label || ''}
                  onEdit={(value) => handleContentUpdate('capterra_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Capterra label..."
                  sectionId={sectionId}
                  elementKey="capterra_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-sm group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.trustpilot_icon || '✅'}
                      onEdit={(value) => handleContentUpdate('trustpilot_icon', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-xl"
                      sectionId={sectionId}
                      elementKey="trustpilot_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.trustpilot_rating || ''}
                    onEdit={(value) => handleContentUpdate('trustpilot_rating', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-2xl font-bold text-green-600"
                    placeholder="Trustpilot rating..."
                    sectionId={sectionId}
                    elementKey="trustpilot_rating"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trustpilot_label || ''}
                  onEdit={(value) => handleContentUpdate('trustpilot_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Trustpilot label..."
                  sectionId={sectionId}
                  elementKey="trustpilot_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-sm group/icon-edit relative">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.producthunt_icon || '🚀'}
                      onEdit={(value) => handleContentUpdate('producthunt_icon', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      iconSize="md"
                      className="text-xl"
                      sectionId={sectionId}
                      elementKey="producthunt_icon"
                    />
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.producthunt_rating || ''}
                    onEdit={(value) => handleContentUpdate('producthunt_rating', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-2xl font-bold text-orange-600"
                    placeholder="Product Hunt rating..."
                    sectionId={sectionId}
                    elementKey="producthunt_rating"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.producthunt_label || ''}
                  onEdit={(value) => handleContentUpdate('producthunt_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Product Hunt label..."
                  sectionId={sectionId}
                  elementKey="producthunt_label"
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
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce rating testimonials..."
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
  name: 'RatingCards',
  category: 'Testimonial',
  description: 'Rating-focused testimonial cards. Perfect for review-heavy products and marketing/sales tools.',
  tags: ['testimonial', 'ratings', 'reviews', 'platforms', 'cards'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'ratings', label: 'Ratings 1-5 (pipe separated)', type: 'text', required: true },
    { key: 'review_platforms', label: 'Review Platforms (pipe separated)', type: 'text', required: true },
    { key: 'review_dates', label: 'Review Dates (pipe separated)', type: 'text', required: false },
    { key: 'verified_badges', label: 'Verified Badges true/false (pipe separated)', type: 'text', required: false },
    { key: 'customer_locations', label: 'Customer Locations (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'platforms_title', label: 'Platforms Section Title', type: 'text', required: false },
    { key: 'g2_rating', label: 'G2 Rating', type: 'text', required: false },
    { key: 'g2_label', label: 'G2 Label', type: 'text', required: false },
    { key: 'capterra_rating', label: 'Capterra Rating', type: 'text', required: false },
    { key: 'capterra_label', label: 'Capterra Label', type: 'text', required: false },
    { key: 'trustpilot_rating', label: 'Trustpilot Rating', type: 'text', required: false },
    { key: 'trustpilot_label', label: 'Trustpilot Label', type: 'text', required: false },
    { key: 'producthunt_rating', label: 'Product Hunt Rating', type: 'text', required: false },
    { key: 'producthunt_label', label: 'Product Hunt Label', type: 'text', required: false }
  ],
  
  features: [
    'Platform-specific rating cards',
    'Verified badge support',
    'Average rating calculation',
    'Platform icon display',
    'Cross-platform statistics',
    'Perfect for review-heavy products'
  ],
  
  useCases: [
    'Marketing and sales tools',
    'Design and creative platforms',
    'Work and productivity tools',
    'Review-focused testimonials',
    'Rating-driven social proof'
  ]
};