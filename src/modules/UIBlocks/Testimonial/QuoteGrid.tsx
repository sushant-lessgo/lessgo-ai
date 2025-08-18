// components/layout/QuoteGrid.tsx
// Production-ready testimonial quote grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { EditableList } from '@/components/layout/EditableList';
import { StarRating } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface QuoteGridContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles?: string;
  customer_companies?: string;
  verification_message?: string;
  rating_value?: string;
}

// Testimonial structure
interface Testimonial {
  id: string;
  index: number;
  quote: string;
  customerName: string;
  customerTitle?: string;
  customerCompany?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'What Our Customers Are Saying' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'This platform completely transformed how we handle our daily operations. What used to take hours now takes minutes, and our team can focus on what really matters.|The ROI was immediate and significant. Within the first month, we had already saved more than the annual subscription cost through improved efficiency.|Outstanding customer support and a product that actually delivers on its promises. Rare to find both in one solution.|Implementation was seamless and the results exceeded our expectations. Our productivity increased by 40% in the first quarter.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Johnson|Michael Chen|Emma Rodriguez|David Thompson' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Operations Director|CTO|Marketing Manager|CEO' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'TechFlow Inc|DataWorks|GrowthLab|Streamline Co' 
  },
  verification_message: {
    type: 'string' as const,
    default: 'All testimonials from verified customers'
  },
  rating_value: {
    type: 'string' as const,
    default: '5/5'
  }
};

// Parse rating for dynamic stars
const parseRating = (rating: string) => {
  const match = rating?.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};

const renderStars = (rating: string) => {
  const ratingNum = parseRating(rating);
  const stars = [];
  
  for (let i = 0; i < 5; i++) {
    if (i < Math.floor(ratingNum)) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }
  
  return <>{stars}</>;
};

// Parse testimonial data from pipe-separated strings
const parseTestimonialData = (
  quotes: string, 
  names: string, 
  titles?: string, 
  companies?: string
): Testimonial[] => {
  const quoteList = parsePipeData(quotes);
  const nameList = parsePipeData(names);
  const titleList = parsePipeData(titles || '');
  const companyList = parsePipeData(companies || '');
  
  return quoteList.map((quote, index) => ({
    id: `testimonial-${index}`,
    index,
    quote,
    customerName: nameList[index] || 'Anonymous',
    customerTitle: titleList[index] || undefined,
    customerCompany: companyList[index] || undefined
  }));
};

// Customer Avatar Component
const CustomerAvatar = React.memo(({ name }: { name: string }) => {
  // Generate initials and consistent color
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
      {initials}
    </div>
  );
});
CustomerAvatar.displayName = 'CustomerAvatar';

// Individual Testimonial Card
const TestimonialCard = React.memo(({ 
  testimonial, 
  mode, 
  colorTokens,
  getTextStyle,
  onQuoteEdit,
  onNameEdit,
  onTitleEdit,
  onCompanyEdit,
  ratingValue,
  onRatingEdit,
  sectionId,
  sectionBackground,
  backgroundType,
  handleContentUpdate
}: {
  testimonial: Testimonial;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onQuoteEdit: (index: number, value: string) => void;
  onNameEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onCompanyEdit: (index: number, value: string) => void;
  ratingValue: string;
  onRatingEdit: (value: string) => void;
  sectionId: string;
  sectionBackground: any;
  backgroundType: string;
  handleContentUpdate: (key: string, value: string) => void;
}) => {
  
  return (
    <div className="group bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 relative">
      
      {/* Quote Mark */}
      <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
        </svg>
      </div>
      
      {/* Testimonial Quote */}
      <div className="mb-6">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onQuoteEdit(testimonial.index, e.currentTarget.textContent?.replace(/^"|"$/g, '') || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 leading-relaxed italic"
          >
            "{testimonial.quote}"
          </div>
        ) : (
          <blockquote 
            className={`${colorTokens.textSecondary} leading-relaxed italic`}
          >
            "{testimonial.quote}"
          </blockquote>
        )}
      </div>
      
      {/* Customer Attribution */}
      <div className="flex items-center space-x-4">
        {/* Customer Avatar */}
        <CustomerAvatar name={testimonial.customerName} />
        
        {/* Customer Details */}
        <div className="flex-1">
          {/* Customer Name */}
          <div className="mb-1">
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onNameEdit(testimonial.index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-semibold"
              >
                {testimonial.customerName}
              </div>
            ) : (
              <div 
                className={`font-semibold ${colorTokens.textPrimary}`}
              >
                {testimonial.customerName}
              </div>
            )}
          </div>
          
          {/* Customer Title */}
          {(testimonial.customerTitle || mode === 'edit') && (
            <div className="mb-1">
              {mode === 'edit' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTitleEdit(testimonial.index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[16px] cursor-text hover:bg-gray-50 text-sm"
                >
                  {testimonial.customerTitle || 'Add title...'}
                </div>
              ) : testimonial.customerTitle && (
                <div 
                  className={`${colorTokens.textSecondary} text-sm`}
                >
                  {testimonial.customerTitle}
                </div>
              )}
            </div>
          )}
          
          {/* Customer Company */}
          {(testimonial.customerCompany || mode === 'edit') && (
            <div>
              {mode === 'edit' ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onCompanyEdit(testimonial.index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[16px] cursor-text hover:bg-gray-50 text-sm font-medium"
                >
                  {testimonial.customerCompany || 'Add company...'}
                </div>
              ) : testimonial.customerCompany && (
                <div 
                  className={`${colorTokens.link} text-sm font-medium`}
                >
                  {testimonial.customerCompany}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Star Rating */}
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          {renderStars(ratingValue)}
          <EditableAdaptiveText
            mode={mode}
            value={ratingValue || ''}
            onEdit={onRatingEdit}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className="text-sm font-medium"
            placeholder="5/5"
            sectionId={sectionId}
            elementKey="rating_value"
            sectionBackground={sectionBackground}
          />
        </div>
      </div>
    </div>
  );
});
TestimonialCard.displayName = 'TestimonialCard';

export default function QuoteGrid(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate,
    dynamicTextColors,
    backgroundType
  } = useLayoutComponent<QuoteGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse testimonial data
  const testimonials = parseTestimonialData(
    blockContent.testimonial_quotes,
    blockContent.customer_names,
    blockContent.customer_titles,
    blockContent.customer_companies
  );

  // Handle individual editing
  const handleQuoteEdit = (index: number, value: string) => {
    const updatedQuotes = updateListData(blockContent.testimonial_quotes, index, value);
    handleContentUpdate('testimonial_quotes', updatedQuotes);
  };

  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.customer_names, index, value);
    handleContentUpdate('customer_names', updatedNames);
  };

  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.customer_titles || '', index, value);
    handleContentUpdate('customer_titles', updatedTitles);
  };

  const handleCompanyEdit = (index: number, value: string) => {
    const updatedCompanies = updateListData(blockContent.customer_companies || '', index, value);
    handleContentUpdate('customer_companies', updatedCompanies);
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
              getTextStyle={getTextStyle}
              onQuoteEdit={handleQuoteEdit}
              onNameEdit={handleNameEdit}
              onTitleEdit={handleTitleEdit}
              onCompanyEdit={handleCompanyEdit}
              ratingValue={blockContent.rating_value || '5/5'}
              onRatingEdit={(value) => handleContentUpdate('rating_value', value)}
              sectionId={sectionId}
              sectionBackground={sectionBackground}
              backgroundType={backgroundType}
              handleContentUpdate={handleContentUpdate}
            />
          ))}
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const value = e.currentTarget.textContent || '';
                  if (value !== blockContent.verification_message) {
                    handleContentUpdate('verification_message', value);
                  }
                }}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium"
              >
                {blockContent.verification_message || 'Verification message...'}
              </div>
            ) : (
              <span className="font-medium">{blockContent.verification_message}</span>
            )}
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'QuoteGrid',
  category: 'Social Proof',
  description: 'Customer testimonial quotes with attribution, star ratings, and adaptive text colors',
  tags: ['testimonials', 'quotes', 'social-proof', 'customers', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // Key features
  features: [
    'Automatic text color adaptation based on background type',
    'Customer testimonials with star ratings',
    'Editable quote cards',
    'Customer attribution with avatars',
    'Trust reinforcement elements'
  ],
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: false },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: false },
    { key: 'verification_message', label: 'Verification Message', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating Value (e.g., 4.9/5)', type: 'text', required: false }
  ],
  
  // Usage examples
  useCases: [
    'Customer testimonial section',
    'Social proof showcase',
    'Review highlights',
    'Success story quotes'
  ]
};