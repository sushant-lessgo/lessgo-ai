import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import {
  parsePipeData,
  updateListData,
  parseCustomerAvatarData,
  updateAvatarUrls
} from '@/utils/dataParsingUtils';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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
  // Avatar system
  avatar_urls?: string;
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
  avatar_urls: {
    type: 'string' as const,
    default: '{}'
  }
};

// Theme color mapping function
const getThemeColors = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    borderHover: 'hover:border-orange-300',
    shadow: 'shadow-orange-100/50',
    shadowHover: 'hover:shadow-orange-200/40',
    verifiedBg: 'bg-orange-50',
    verifiedBorder: 'border-orange-200',
    verifiedText: 'text-orange-700',
    starColor: '#f97316'
  },
  cool: {
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    shadow: 'shadow-blue-100/50',
    shadowHover: 'hover:shadow-blue-200/40',
    verifiedBg: 'bg-blue-50',
    verifiedBorder: 'border-blue-200',
    verifiedText: 'text-blue-700',
    starColor: '#3b82f6'
  },
  neutral: {
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    shadow: '',
    shadowHover: 'hover:shadow-xl',
    verifiedBg: 'bg-green-50',
    verifiedBorder: 'border-green-200',
    verifiedText: 'text-green-700',
    starColor: '#10b981'
  }
}[theme]);

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

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(uiBlockTheme);

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Parse testimonial data using utilities
  const testimonialQuotes = parsePipeData(blockContent.testimonial_quotes);
  const customerNames = parsePipeData(blockContent.customer_names);
  const customerTitles = parsePipeData(blockContent.customer_titles);
  const reviewPlatforms = parsePipeData(blockContent.review_platforms);
  const reviewDates = parsePipeData(blockContent.review_dates || '');
  const customerLocations = parsePipeData(blockContent.customer_locations || '');
  
  const ratings = parsePipeData(blockContent.ratings).map(item => parseInt(item) || 5);
  const verifiedBadges = parsePipeData(blockContent.verified_badges || '').map(item => item.toLowerCase() === 'true');

  const reviews = testimonialQuotes.map((quote, index) => ({
    id: `review-${index}`,
    index,
    quote,
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    rating: ratings[index] || 5,
    platform: reviewPlatforms[index] || '',
    date: reviewDates[index] || '',
    verified: verifiedBadges[index] || false,
    location: customerLocations[index] || '',
    avatarUrl: ''
  }));

  // Individual field editing handlers
  const handleQuoteEdit = (index: number, value: string) => {
    const updatedQuotes = updateListData(blockContent.testimonial_quotes, index, value);
    handleContentUpdate('testimonial_quotes', updatedQuotes);
  };

  const handleCustomerNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.customer_names, index, value);
    handleContentUpdate('customer_names', updatedNames);
  };

  const handleCustomerTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.customer_titles, index, value);
    handleContentUpdate('customer_titles', updatedTitles);
  };

  const handlePlatformEdit = (index: number, value: string) => {
    const updatedPlatforms = updateListData(blockContent.review_platforms, index, value);
    handleContentUpdate('review_platforms', updatedPlatforms);
  };

  const handleDateEdit = (index: number, value: string) => {
    const updatedDates = updateListData(blockContent.review_dates || '', index, value);
    handleContentUpdate('review_dates', updatedDates);
  };

  const handleLocationEdit = (index: number, value: string) => {
    const updatedLocations = updateListData(blockContent.customer_locations || '', index, value);
    handleContentUpdate('customer_locations', updatedLocations);
  };

  const handleRatingEdit = (index: number, value: number) => {
    const updatedRatings = updateListData(blockContent.ratings, index, value.toString());
    handleContentUpdate('ratings', updatedRatings);
  };

  // Avatar handling
  const getCustomerAvatars = () => {
    if (blockContent.customer_names) {
      const customerData = parseCustomerAvatarData(
        blockContent.customer_names, 
        blockContent.avatar_urls || '{}'
      );
      return customerData.map(customer => ({
        name: customer.name,
        avatarUrl: customer.avatarUrl || ''
      }));
    }
    return [];
  };

  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  const customerAvatars = getCustomerAvatars();

  const trustItems = blockContent.trust_items
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Helper function to add a new review card
  const addReviewCard = () => {
    const quotes = parsePipeData(blockContent.testimonial_quotes);
    const names = parsePipeData(blockContent.customer_names);
    const titles = parsePipeData(blockContent.customer_titles);
    const ratings = parsePipeData(blockContent.ratings);
    const platforms = parsePipeData(blockContent.review_platforms);
    const dates = parsePipeData(blockContent.review_dates || '');
    const verifiedBadges = parsePipeData(blockContent.verified_badges || '');
    const locations = parsePipeData(blockContent.customer_locations || '');

    // Add new review with default content
    quotes.push('Amazing product! Has transformed our workflow completely.');
    names.push('New Customer');
    titles.push('Job Title');
    ratings.push('5');
    platforms.push('G2');
    dates.push('Recently');
    verifiedBadges.push('true');
    locations.push('City, Country');

    // Update all fields
    handleContentUpdate('testimonial_quotes', quotes.join('|'));
    handleContentUpdate('customer_names', names.join('|'));
    handleContentUpdate('customer_titles', titles.join('|'));
    handleContentUpdate('ratings', ratings.join('|'));
    handleContentUpdate('review_platforms', platforms.join('|'));
    handleContentUpdate('review_dates', dates.join('|'));
    handleContentUpdate('verified_badges', verifiedBadges.join('|'));
    handleContentUpdate('customer_locations', locations.join('|'));
  };

  // Helper function to remove a review card
  const removeReviewCard = (indexToRemove: number) => {
    const quotes = parsePipeData(blockContent.testimonial_quotes);
    const names = parsePipeData(blockContent.customer_names);
    const titles = parsePipeData(blockContent.customer_titles);
    const ratings = parsePipeData(blockContent.ratings);
    const platforms = parsePipeData(blockContent.review_platforms);
    const dates = parsePipeData(blockContent.review_dates || '');
    const verifiedBadges = parsePipeData(blockContent.verified_badges || '');
    const locations = parsePipeData(blockContent.customer_locations || '');

    // Get the name before removing for avatar cleanup
    const removedName = names[indexToRemove];

    // Remove the review at the specified index
    if (indexToRemove >= 0 && indexToRemove < quotes.length) {
      quotes.splice(indexToRemove, 1);
      names.splice(indexToRemove, 1);
      titles.splice(indexToRemove, 1);
      ratings.splice(indexToRemove, 1);
      platforms.splice(indexToRemove, 1);
      dates.splice(indexToRemove, 1);
      verifiedBadges.splice(indexToRemove, 1);
      locations.splice(indexToRemove, 1);

      // Clear avatar URL for removed customer if it exists
      if (removedName && blockContent.avatar_urls) {
        try {
          const avatarUrls = JSON.parse(blockContent.avatar_urls);
          delete avatarUrls[removedName];
          handleContentUpdate('avatar_urls', JSON.stringify(avatarUrls));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      // Update all fields
      handleContentUpdate('testimonial_quotes', quotes.join('|'));
      handleContentUpdate('customer_names', names.join('|'));
      handleContentUpdate('customer_titles', titles.join('|'));
      handleContentUpdate('ratings', ratings.join('|'));
      handleContentUpdate('review_platforms', platforms.join('|'));
      handleContentUpdate('review_dates', dates.join('|'));
      handleContentUpdate('verified_badges', verifiedBadges.join('|'));
      handleContentUpdate('customer_locations', locations.join('|'));
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('g2')) return '🗡️';
    if (platformLower.includes('capterra')) return '📈';
    if (platformLower.includes('trustpilot')) return '✅';
    if (platformLower.includes('product hunt')) return '🚀';
    if (platformLower.includes('google')) return '🔍';
    if (platformLower.includes('yelp')) return '⭐';
    return '📝'; // Default for other platforms
  };

  const ReviewCard = React.memo(({ review, canRemove, onRemove }: {
    review: typeof reviews[0];
    canRemove: boolean;
    onRemove: () => void;
  }) => {
    const avatarData = customerAvatars.find(avatar => avatar.name === review.customerName);

    return (
      <div className={`group/review-card relative bg-white rounded-xl shadow-lg border ${themeColors.border} p-6 ${themeColors.shadow} ${themeColors.shadowHover} transition-shadow duration-300`}>

        {/* Delete button - only show in edit mode and if can remove */}
        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-4 right-4 opacity-0 group-hover/review-card:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
            title="Remove this review"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AvatarEditableComponent
              mode={mode}
              avatarUrl={avatarData?.avatarUrl || ''}
              onAvatarChange={(url) => handleAvatarChange(review.customerName, url)}
              customerName={review.customerName}
              size="md"
              className="w-10 h-10"
            />
            <div>
              <EditableAdaptiveText
                mode={mode}
                value={review.customerName}
                onEdit={(value) => handleCustomerNameEdit(review.index, value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900"
                placeholder="Customer Name"
                sectionId={sectionId}
                elementKey={`customer_name_${review.index}`}
                sectionBackground="bg-white"
              />
              <EditableAdaptiveText
                mode={mode}
                value={review.customerTitle}
                onEdit={(value) => handleCustomerTitleEdit(review.index, value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                className="text-sm text-gray-600"
                placeholder="Customer Title"
                sectionId={sectionId}
                elementKey={`customer_title_${review.index}`}
                sectionBackground="bg-white"
              />
              {(review.location || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={review.location}
                  onEdit={(value) => handleLocationEdit(review.index, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xs text-gray-500"
                  placeholder="Location (optional)"
                  sectionId={sectionId}
                  elementKey={`customer_location_${review.index}`}
                  sectionBackground="bg-white"
                />
              )}
            </div>
          </div>
          
          {review.verified && (
            <div className={`flex items-center space-x-1 ${themeColors.verifiedBg} px-2 py-1 rounded-full border ${themeColors.verifiedBorder}`}>
              <svg className={`w-3 h-3 ${themeColors.verifiedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-xs ${themeColors.verifiedText} font-medium`}>Verified</span>
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
          "<EditableAdaptiveText
            mode={mode}
            value={review.quote}
            onEdit={(value) => handleQuoteEdit(review.index, value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="body"
            className="inline"
            placeholder="Customer testimonial quote..."
            sectionId={sectionId}
            elementKey={`testimonial_quote_${review.index}`}
            sectionBackground="bg-white"
          />"
        </blockquote>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="text-base">{getPlatformIcon(review.platform)}</div>
            <EditableAdaptiveText
              mode={mode}
              value={review.platform}
              onEdit={(value) => handlePlatformEdit(review.index, value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              className="text-sm font-medium text-gray-600"
              placeholder="Platform name"
              sectionId={sectionId}
              elementKey={`review_platform_${review.index}`}
              sectionBackground="bg-white"
            />
          </div>
          
          {(review.date || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={review.date}
              onEdit={(value) => handleDateEdit(review.index, value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              className="text-xs text-gray-500"
              placeholder="Review date"
              sectionId={sectionId}
              elementKey={`review_date_${review.index}`}
              sectionBackground="bg-white"
            />
          )}
        </div>
      </div>
    );
  });
  ReviewCard.displayName = 'ReviewCard';

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              canRemove={reviews.length > 1}
              onRemove={() => removeReviewCard(review.index)}
            />
          ))}
        </div>

        {/* Add Review Card Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && reviews.length < 6 && (
          <div className="mb-12 text-center">
            <button
              onClick={addReviewCard}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Review Card</span>
            </button>
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
  description: 'WYSIWYG rating-focused testimonial cards with inline editing and avatar support.',
  tags: ['testimonial', 'ratings', 'reviews', 'cards', 'wysiwyg'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
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
    { key: 'avatar_urls', label: 'Avatar URLs (JSON format)', type: 'text', required: false }
  ],
  
  features: [
    'WYSIWYG inline editing for all text fields',
    'Editable customer avatars with upload support',
    'Platform-specific icons with auto-detection',
    'Verified badge support with visual indicators',
    'Average rating calculation and display',
    'Consistent editing experience in both modes',
    'Star rating visualization'
  ],
  
  useCases: [
    'Marketing and sales tools testimonials',
    'SaaS product review showcases', 
    'E-commerce customer feedback',
    'Service-based business testimonials',
    'App store rating displays'
  ]
};