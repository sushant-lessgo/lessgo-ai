// components/layout/StripWithReviews.tsx
// Review highlights with ratings - Social Proof component

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface StripWithReviewsContent {
  headline: string;
  subheadline?: string;
  reviews: string;
  reviewer_names?: string;
  reviewer_titles?: string;
  ratings?: string;
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
  }
};

// Parse review data from pipe-separated strings
const parseReviewData = (
  reviews: string, 
  names: string, 
  titles: string, 
  ratings: string
): Review[] => {
  const reviewList = parsePipeData(reviews);
  const nameList = parsePipeData(names);
  const titleList = parsePipeData(titles);
  const ratingList = parsePipeData(ratings).map(r => parseInt(r) || 5);
  
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

// Review Card Component
const ReviewCard = React.memo(({ 
  review, 
  dynamicTextColors 
}: { 
  review: Review;
  dynamicTextColors: any;
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={review.rating} />
      </div>
      
      {/* Review Text */}
      <blockquote className={`text-base ${dynamicTextColors?.body || 'text-gray-700'} leading-relaxed mb-4`}>
        "{review.text}"
      </blockquote>
      
      {/* Reviewer Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {review.reviewer.split(' ').map(n => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <div className={`font-medium ${dynamicTextColors?.heading || 'text-gray-900'}`}>
            {review.reviewer}
          </div>
          <div className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
            {review.title}
          </div>
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

  // Parse review data from pipe-separated strings
  const reviews = parseReviewData(
    blockContent.reviews || '',
    blockContent.reviewer_names || '',
    blockContent.reviewer_titles || '',
    blockContent.ratings || ''
  );

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 5;

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
              className="text-lg max-w-3xl mx-auto mb-8"
              placeholder="Add a compelling subheadline about your customer reviews..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Overall Rating Summary */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <StarRating rating={Math.round(averageRating)} />
            <span className={`text-lg font-semibold ${dynamicTextColors?.heading || 'text-gray-900'}`}>
              {averageRating.toFixed(1)} out of 5
            </span>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              ({reviews.length} reviews)
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.slice(0, 4).map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              dynamicTextColors={dynamicTextColors}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Verified Reviews
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Real Customers
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm ${dynamicTextColors?.muted || 'text-gray-600'}`}>
              Authentic Feedback
            </span>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'StripWithReviews',
  category: 'Social Proof',
  description: 'Review highlights with star ratings and customer testimonials for building trust',
  tags: ['social-proof', 'reviews', 'testimonials', 'ratings', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'reviews', label: 'Review Texts (pipe separated)', type: 'textarea', required: true },
    { key: 'reviewer_names', label: 'Reviewer Names (pipe separated)', type: 'text', required: true },
    { key: 'reviewer_titles', label: 'Reviewer Titles (pipe separated)', type: 'text', required: true },
    { key: 'ratings', label: 'Star Ratings 1-5 (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Star rating visualization with configurable ratings',
    'Customer avatar placeholders with initials',
    'Overall rating summary calculation',
    'Trust indicator badges',
    'Responsive grid layout for reviews'
  ],
  
  useCases: [
    'Customer testimonial showcase',
    'Product review highlights',
    'Service feedback display',
    'Trust building section',
    'Social proof for conversions'
  ]
};