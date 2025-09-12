// components/layout/StripWithReviews.tsx
// Review highlights with ratings - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { 
  parsePipeData, 
  parseCustomerAvatarData, 
  getCustomerAvatarUrl, 
  updateAvatarUrls 
} from '@/utils/dataParsingUtils';

// Content interface for type safety
interface StripWithReviewsContent {
  headline: string;
  subheadline?: string;
  reviews: string;
  reviewer_names?: string;
  reviewer_titles?: string;
  ratings?: string;
  // Individual editable review fields
  review_text_1?: string;
  review_text_2?: string;
  review_text_3?: string;
  review_text_4?: string;
  reviewer_name_1?: string;
  reviewer_name_2?: string;
  reviewer_name_3?: string;
  reviewer_name_4?: string;
  reviewer_title_1?: string;
  reviewer_title_2?: string;
  reviewer_title_3?: string;
  reviewer_title_4?: string;
  rating_1?: string;
  rating_2?: string;
  rating_3?: string;
  rating_4?: string;
  // Social proof elements
  overall_rating_value?: string;
  overall_rating_text?: string;
  total_reviews_text?: string;
  // Trust indicators
  trust_indicator_1?: string;
  trust_indicator_2?: string;
  trust_indicator_3?: string;
  // Trust indicator icons
  trust_icon_1?: string;
  trust_icon_2?: string;
  trust_icon_3?: string;
  // Avatar system
  customer_names?: string;
  avatar_urls?: string;
  avatar_count?: number;
  show_customer_avatars?: boolean;
}

// Review structure
interface Review {
  id: string;
  index: number;
  text: string;
  reviewer: string;
  title: string;
  rating: number;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Loved by Thousands of Users' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See what our customers have to say about their experience with our platform.' 
  },
  reviews: { 
    type: 'string' as const, 
    default: 'This platform has completely transformed how we work. The automation features save us hours every day.|Amazing customer support and intuitive interface. Highly recommend to any team looking to streamline their workflow.|Best investment we\'ve made for our business. The ROI was evident within the first month of using it.|Simple to use yet powerful. Our team was up and running in minutes, not hours.' 
  },
  reviewer_names: { 
    type: 'string' as const, 
    default: 'Sarah Johnson|Mike Chen|Rachel Davis|Alex Thompson' 
  },
  reviewer_titles: { 
    type: 'string' as const, 
    default: 'Marketing Director, TechCorp|Product Manager, StartupXYZ|CEO, Creative Agency|Operations Lead, Scale Inc' 
  },
  ratings: { 
    type: 'string' as const, 
    default: '5|5|4|5' 
  },
  // Individual editable review fields
  review_text_1: { 
    type: 'string' as const, 
    default: 'This platform has completely transformed how we work. The automation features save us hours every day.' 
  },
  review_text_2: { 
    type: 'string' as const, 
    default: 'Amazing customer support and intuitive interface. Highly recommend to any team looking to streamline their workflow.' 
  },
  review_text_3: { 
    type: 'string' as const, 
    default: 'Best investment we\'ve made for our business. The ROI was evident within the first month of using it.' 
  },
  review_text_4: { 
    type: 'string' as const, 
    default: 'Simple to use yet powerful. Our team was up and running in minutes, not hours.' 
  },
  reviewer_name_1: { 
    type: 'string' as const, 
    default: 'Sarah Johnson' 
  },
  reviewer_name_2: { 
    type: 'string' as const, 
    default: 'Mike Chen' 
  },
  reviewer_name_3: { 
    type: 'string' as const, 
    default: 'Rachel Davis' 
  },
  reviewer_name_4: { 
    type: 'string' as const, 
    default: 'Alex Thompson' 
  },
  reviewer_title_1: { 
    type: 'string' as const, 
    default: 'Marketing Director, TechCorp' 
  },
  reviewer_title_2: { 
    type: 'string' as const, 
    default: 'Product Manager, StartupXYZ' 
  },
  reviewer_title_3: { 
    type: 'string' as const, 
    default: 'CEO, Creative Agency' 
  },
  reviewer_title_4: { 
    type: 'string' as const, 
    default: 'Operations Lead, Scale Inc' 
  },
  rating_1: { 
    type: 'string' as const, 
    default: '5' 
  },
  rating_2: { 
    type: 'string' as const, 
    default: '5' 
  },
  rating_3: { 
    type: 'string' as const, 
    default: '4' 
  },
  rating_4: { 
    type: 'string' as const, 
    default: '5' 
  },
  // Social proof elements
  overall_rating_value: { 
    type: 'string' as const, 
    default: '4.9' 
  },
  overall_rating_text: { 
    type: 'string' as const, 
    default: 'out of 5' 
  },
  total_reviews_text: { 
    type: 'string' as const, 
    default: '4 reviews' 
  },
  // Trust indicators
  trust_indicator_1: { 
    type: 'string' as const, 
    default: 'Verified Reviews' 
  },
  trust_indicator_2: { 
    type: 'string' as const, 
    default: 'Real Customers' 
  },
  trust_indicator_3: { 
    type: 'string' as const, 
    default: 'Authentic Feedback' 
  },
  // Trust indicator icons
  trust_icon_1: { 
    type: 'string' as const, 
    default: '✅' 
  },
  trust_icon_2: { 
    type: 'string' as const, 
    default: 'ℹ️' 
  },
  trust_icon_3: { 
    type: 'string' as const, 
    default: '🛡️' 
  },
  // Avatar system
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Johnson|Mike Chen|Rachel Davis|Alex Thompson' 
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' 
  },
  avatar_count: { 
    type: 'number' as const, 
    default: 4 
  },
  show_customer_avatars: { 
    type: 'boolean' as const, 
    default: true 
  }
};

// Parse review data from individual fields with fallback to pipe-separated strings
const parseReviewData = (
  blockContent: StripWithReviewsContent
): Review[] => {
  // Get individual fields first
  const individualReviews = [
    {
      text: blockContent.review_text_1,
      reviewer: blockContent.reviewer_name_1,
      title: blockContent.reviewer_title_1,
      rating: blockContent.rating_1
    },
    {
      text: blockContent.review_text_2,
      reviewer: blockContent.reviewer_name_2,
      title: blockContent.reviewer_title_2,
      rating: blockContent.rating_2
    },
    {
      text: blockContent.review_text_3,
      reviewer: blockContent.reviewer_name_3,
      title: blockContent.reviewer_title_3,
      rating: blockContent.rating_3
    },
    {
      text: blockContent.review_text_4,
      reviewer: blockContent.reviewer_name_4,
      title: blockContent.reviewer_title_4,
      rating: blockContent.rating_4
    }
  ].filter(review => 
    review.text && 
    review.text.trim() !== '' && 
    review.text !== '___REMOVED___'
  );
  
  // If we have individual reviews, use them
  if (individualReviews.length > 0) {
    return individualReviews.map((review, index) => ({
      id: `review-${index}`,
      index,
      text: review.text!.trim(),
      reviewer: review.reviewer || `Reviewer ${index + 1}`,
      title: review.title || 'Customer',
      rating: parseInt(review.rating || '5') || 5
    }));
  }
  
  // Fallback to legacy pipe-separated format
  const reviewList = parsePipeData(blockContent.reviews || '');
  const nameList = parsePipeData(blockContent.reviewer_names || '');
  const titleList = parsePipeData(blockContent.reviewer_titles || '');
  const ratingList = parsePipeData(blockContent.ratings || '').map(r => parseInt(r) || 5);
  
  return reviewList.map((text, index) => ({
    id: `review-${index}`,
    index,
    text: text.trim(),
    reviewer: nameList[index] || `Reviewer ${index + 1}`,
    title: titleList[index] || 'Customer',
    rating: ratingList[index] || 5
  }));
};

// Star Rating Component
const StarRating = React.memo(({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
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

// Editable Review Card Component
const ReviewCard = React.memo(({ 
  review, 
  mode,
  dynamicTextColors,
  bodyStyle,
  backgroundType,
  colorTokens,
  sectionBackground,
  sectionId,
  onReviewUpdate,
  onRemoveReview,
  customerAvatars
}: { 
  review: Review;
  mode: 'edit' | 'preview';
  dynamicTextColors: any;
  bodyStyle: React.CSSProperties;
  backgroundType: any;
  colorTokens: any;
  sectionBackground: string;
  sectionId: string;
  onReviewUpdate: (index: number, field: 'text' | 'reviewer' | 'title' | 'rating', value: string) => void;
  onRemoveReview: (index: number) => void;
  customerAvatars: any[];
}) => {
  const customerAvatar = customerAvatars[review.index];
  
  return (
    <div className="relative group/review-card bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
      {/* Remove button */}
      {mode === 'edit' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveReview(review.index);
          }}
          className="absolute top-3 right-3 opacity-0 group-hover/review-card:opacity-100 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
          title="Remove review"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Rating */}
      <div className="mb-4 flex items-center space-x-2">
        <StarRating rating={review.rating} />
        {mode === 'edit' && (
          <EditableAdaptiveText
            mode={mode}
            value={review.rating.toString()}
            onEdit={(value) => onReviewUpdate(review.index, 'rating', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className="text-sm w-8"
            placeholder="5"
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            elementKey={`rating_${review.index + 1}`}
          />
        )}
      </div>
      
      {/* Review Text */}
      <blockquote className="mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={review.text}
          onEdit={(value) => onReviewUpdate(review.index, 'text', value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{...bodyStyle}}
          className={`${dynamicTextColors?.body || 'text-gray-700'} leading-relaxed`}
          placeholder="Enter review text..."
          sectionBackground={sectionBackground}
          sectionId={sectionId}
          elementKey={`review_text_${review.index + 1}`}
        />
      </blockquote>
      
      {/* Reviewer Info */}
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        {customerAvatar ? (
          <AvatarEditableComponent
            mode={mode}
            avatarUrl={customerAvatar.avatarUrl}
            onAvatarChange={(url) => {}}
            customerName={review.reviewer}
            size="sm"
            className="cursor-default"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
            <span style={{...bodyStyle, fontSize: '0.875rem', fontWeight: '600'}} className="text-white">
              {review.reviewer.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <EditableAdaptiveText
            mode={mode}
            value={review.reviewer}
            onEdit={(value) => onReviewUpdate(review.index, 'reviewer', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{...bodyStyle, fontWeight: '500'}}
            className={`${dynamicTextColors?.heading || 'text-gray-900'}`}
            placeholder="Reviewer name..."
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            elementKey={`reviewer_name_${review.index + 1}`}
          />
          <EditableAdaptiveText
            mode={mode}
            value={review.title}
            onEdit={(value) => onReviewUpdate(review.index, 'title', value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            textStyle={{...bodyStyle, fontSize: '0.875rem'}}
            className={`${dynamicTextColors?.muted || 'text-gray-600'}`}
            placeholder="Reviewer title..."
            sectionBackground={sectionBackground}
            sectionId={sectionId}
            elementKey={`reviewer_title_${review.index + 1}`}
          />
        </div>
      </div>
    </div>
  );
});
ReviewCard.displayName = 'ReviewCard';

export default function StripWithReviews(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<StripWithReviewsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse review data from individual fields
  const reviews = parseReviewData(blockContent);
  
  // Parse customer avatar data
  const customerAvatars = parseCustomerAvatarData(
    blockContent.customer_names || '',
    blockContent.avatar_urls || '{}',
    blockContent.avatar_count || 4
  );
  
  // Handle avatar changes
  const handleAvatarChange = (customerName: string, newUrl: string) => {
    const updatedUrls = updateAvatarUrls(
      blockContent.avatar_urls || '{}',
      customerName,
      newUrl
    );
    handleContentUpdate('avatar_urls', updatedUrls);
  };
  
  // Handle individual review field updates
  const handleReviewUpdate = (index: number, field: 'text' | 'reviewer' | 'title' | 'rating', value: string) => {
    const fieldMap = {
      text: `review_text_${index + 1}`,
      reviewer: `reviewer_name_${index + 1}`,
      title: `reviewer_title_${index + 1}`,
      rating: `rating_${index + 1}`
    };
    
    const fieldKey = fieldMap[field] as keyof StripWithReviewsContent;
    handleContentUpdate(fieldKey, value);
  };
  
  // Get trust indicators
  const getTrustIndicators = (): string[] => {
    const indicators = [
      blockContent.trust_indicator_1,
      blockContent.trust_indicator_2,
      blockContent.trust_indicator_3
    ].filter((item): item is string => 
      Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
    );
    
    return indicators;
  };
  
  // Handle trust indicator updates
  const handleTrustIndicatorUpdate = (index: number, value: string) => {
    const fieldKey = `trust_indicator_${index + 1}` as keyof StripWithReviewsContent;
    handleContentUpdate(fieldKey, value);
  };
  
  // Handle adding new trust indicator
  const handleAddTrustIndicator = () => {
    const emptyIndex = [
      blockContent.trust_indicator_1,
      blockContent.trust_indicator_2,
      blockContent.trust_indicator_3
    ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
    
    if (emptyIndex !== -1) {
      const textFieldKey = `trust_indicator_${emptyIndex + 1}` as keyof StripWithReviewsContent;
      const iconFieldKey = `trust_icon_${emptyIndex + 1}` as keyof StripWithReviewsContent;
      const defaultIcons = ['✅', 'ℹ️', '🛡️'];
      
      handleContentUpdate(textFieldKey, 'New indicator');
      handleContentUpdate(iconFieldKey, defaultIcons[emptyIndex] || '✅');
    }
  };
  
  // Handle trust icon updates
  const handleTrustIconUpdate = (index: number, value: string) => {
    const fieldKey = `trust_icon_${index + 1}` as keyof StripWithReviewsContent;
    handleContentUpdate(fieldKey, value);
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : parseFloat(blockContent.overall_rating_value || '4.9');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StripWithReviews"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto mb-8"
              placeholder="Add a compelling subheadline about your customer reviews..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Overall Rating Summary */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <StarRating rating={Math.round(averageRating)} />
            <div className="flex items-center space-x-1">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.overall_rating_value || ''}
                onEdit={(value) => handleContentUpdate('overall_rating_value', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{...h3Style}}
                className={`${dynamicTextColors?.heading || 'text-gray-900'}`}
                placeholder="4.9"
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey="overall_rating_value"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.overall_rating_text || ''}
                onEdit={(value) => handleContentUpdate('overall_rating_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{...h3Style}}
                className={`${dynamicTextColors?.heading || 'text-gray-900'}`}
                placeholder="out of 5"
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey="overall_rating_text"
              />
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.total_reviews_text || ''}
              onEdit={(value) => handleContentUpdate('total_reviews_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{...bodyStyle, fontSize: '0.875rem'}}
              className={`${dynamicTextColors?.muted || 'text-gray-600'}`}
              placeholder="4 reviews"
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              elementKey="total_reviews_text"
            />
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.slice(0, 4).map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              mode={mode}
              dynamicTextColors={dynamicTextColors}
              bodyStyle={bodyStyle}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              onReviewUpdate={handleReviewUpdate}
              onRemoveReview={(index) => {
                handleContentUpdate(`review_text_${index + 1}`, '___REMOVED___');
                handleContentUpdate(`reviewer_name_${index + 1}`, '___REMOVED___');
                handleContentUpdate(`reviewer_title_${index + 1}`, '___REMOVED___');
                handleContentUpdate(`rating_${index + 1}`, '___REMOVED___');
              }}
              customerAvatars={customerAvatars}
            />
          ))}
          
          {/* Add Review Card */}
          {mode === 'edit' && reviews.length < 4 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 border-dashed p-6 hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
              <button
                onClick={() => {
                  const emptyIndex = [
                    blockContent.review_text_1,
                    blockContent.review_text_2,
                    blockContent.review_text_3,
                    blockContent.review_text_4
                  ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                  
                  if (emptyIndex !== -1) {
                    handleContentUpdate(`review_text_${emptyIndex + 1}`, 'New review text...');
                    handleContentUpdate(`reviewer_name_${emptyIndex + 1}`, 'New Reviewer');
                    handleContentUpdate(`reviewer_title_${emptyIndex + 1}`, 'Customer');
                    handleContentUpdate(`rating_${emptyIndex + 1}`, '5');
                  }
                }}
                className="flex flex-col items-center space-y-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Add Review</span>
              </button>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        {(getTrustIndicators().length > 0 || mode === 'edit') && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {getTrustIndicators().map((indicator, index) => {
                const actualIndex = [
                  blockContent.trust_indicator_1,
                  blockContent.trust_indicator_2,
                  blockContent.trust_indicator_3
                ].findIndex(item => item === indicator);
                
                // Get the corresponding icon value
                const iconFields = ['trust_icon_1', 'trust_icon_2', 'trust_icon_3'];
                const iconValue = blockContent[iconFields[actualIndex] as keyof StripWithReviewsContent] || '✅';
                
                return (
                  <div key={actualIndex} className="relative group/trust-indicator flex items-center space-x-2">
                    <IconEditableText
                      mode={mode}
                      value={iconValue}
                      onEdit={(value) => handleTrustIconUpdate(actualIndex, value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      iconSize="sm"
                      className="text-lg"
                      placeholder="✅"
                      sectionId={sectionId}
                      elementKey={`trust_icon_${actualIndex + 1}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={indicator}
                      onEdit={(value) => handleTrustIndicatorUpdate(actualIndex, value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      textStyle={{...bodyStyle, fontSize: '0.875rem'}}
                      className={`${dynamicTextColors?.muted || 'text-gray-600'}`}
                      placeholder="Trust indicator..."
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`trust_indicator_${actualIndex + 1}`}
                    />
                    
                    {/* Remove button */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrustIndicatorUpdate(actualIndex, '___REMOVED___');
                          handleTrustIconUpdate(actualIndex, '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/trust-indicator:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove trust indicator"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* Add trust indicator button */}
              {mode === 'edit' && getTrustIndicators().length < 3 && (
                <button
                  onClick={handleAddTrustIndicator}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  title="Add trust indicator"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add indicator</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'StripWithReviews',
  category: 'Social Proof',
  description: 'Fully editable review highlights with star ratings, customer testimonials, and trust indicators',
  tags: ['social-proof', 'reviews', 'testimonials', 'ratings', 'trust', 'editable'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'high',
  estimatedBuildTime: '35 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    
    // Individual review fields
    { key: 'review_text_1', label: 'Review 1 Text', type: 'textarea', required: false },
    { key: 'reviewer_name_1', label: 'Reviewer 1 Name', type: 'text', required: false },
    { key: 'reviewer_title_1', label: 'Reviewer 1 Title', type: 'text', required: false },
    { key: 'rating_1', label: 'Rating 1 (1-5)', type: 'text', required: false },
    
    { key: 'review_text_2', label: 'Review 2 Text', type: 'textarea', required: false },
    { key: 'reviewer_name_2', label: 'Reviewer 2 Name', type: 'text', required: false },
    { key: 'reviewer_title_2', label: 'Reviewer 2 Title', type: 'text', required: false },
    { key: 'rating_2', label: 'Rating 2 (1-5)', type: 'text', required: false },
    
    { key: 'review_text_3', label: 'Review 3 Text', type: 'textarea', required: false },
    { key: 'reviewer_name_3', label: 'Reviewer 3 Name', type: 'text', required: false },
    { key: 'reviewer_title_3', label: 'Reviewer 3 Title', type: 'text', required: false },
    { key: 'rating_3', label: 'Rating 3 (1-5)', type: 'text', required: false },
    
    { key: 'review_text_4', label: 'Review 4 Text', type: 'textarea', required: false },
    { key: 'reviewer_name_4', label: 'Reviewer 4 Name', type: 'text', required: false },
    { key: 'reviewer_title_4', label: 'Reviewer 4 Title', type: 'text', required: false },
    { key: 'rating_4', label: 'Rating 4 (1-5)', type: 'text', required: false },
    
    // Social proof elements
    { key: 'overall_rating_value', label: 'Overall Rating Value', type: 'text', required: false },
    { key: 'overall_rating_text', label: 'Overall Rating Text', type: 'text', required: false },
    { key: 'total_reviews_text', label: 'Total Reviews Text', type: 'text', required: false },
    
    // Trust indicators
    { key: 'trust_indicator_1', label: 'Trust Indicator 1', type: 'text', required: false },
    { key: 'trust_indicator_2', label: 'Trust Indicator 2', type: 'text', required: false },
    { key: 'trust_indicator_3', label: 'Trust Indicator 3', type: 'text', required: false },
    { key: 'trust_icon_1', label: 'Trust Icon 1', type: 'text', required: false },
    { key: 'trust_icon_2', label: 'Trust Icon 2', type: 'text', required: false },
    { key: 'trust_icon_3', label: 'Trust Icon 3', type: 'text', required: false },
    
    // Avatar system
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: false },
    { key: 'avatar_urls', label: 'Avatar URLs (JSON)', type: 'text', required: false },
    { key: 'avatar_count', label: 'Avatar Count', type: 'number', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false }
  ],
  
  features: [
    'Fully editable individual review cards with remove functionality',
    'Editable star ratings for each review',
    'Editable reviewer names and titles',
    'Editable social proof elements (overall rating, review count)',
    'Editable trust indicators with customizable icons and add/remove functionality',
    'Avatar system with customer name management',
    'Add new review functionality in edit mode',
    'Automatic text color adaptation based on background type',
    'Responsive grid layout for reviews',
    'Hover-based edit controls',
    'Remove markers (___REMOVED___) for deleted items',
    'Visual icon picker for trust indicator icons with 80+ emoji options'
  ],
  
  useCases: [
    'Customer testimonial showcase with full editing capabilities',
    'Product review highlights with individual review management',
    'Service feedback display with editable trust indicators',
    'Trust building section with customizable social proof',
    'Social proof for conversions with dynamic content management'
  ],
  
  editingCapabilities: [
    'Individual review text editing',
    'Reviewer name and title editing',
    'Star rating modification',
    'Add/remove individual reviews (up to 4)',
    'Trust indicator management with custom icons (up to 3)',
    'Social proof text customization',
    'Avatar system integration'
  ]
};