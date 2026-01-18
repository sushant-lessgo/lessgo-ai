// components/layout/QuoteGrid.tsx
// Production-ready testimonial quote grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { EditableList } from '@/components/layout/EditableList';
import { StarRating } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Content interface for type safety
interface QuoteGridContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles?: string;
  customer_companies?: string;
  verification_message?: string;
  rating_value?: string;
  quote_mark_icon?: string;
  verification_icon?: string;
  testimonial_icon_1?: string;
  testimonial_icon_2?: string;
  testimonial_icon_3?: string;
  testimonial_icon_4?: string;
  testimonial_icon_5?: string;
  testimonial_icon_6?: string;
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
  },
  quote_mark_icon: {
    type: 'string' as const,
    default: '“'
  },
  verification_icon: {
    type: 'string' as const,
    default: '✅'
  },
  testimonial_icon_1: {
    type: 'string' as const,
    default: '💬'
  },
  testimonial_icon_2: {
    type: 'string' as const,
    default: '⭐'
  },
  testimonial_icon_3: {
    type: 'string' as const,
    default: '🎯'
  },
  testimonial_icon_4: {
    type: 'string' as const,
    default: '💎'
  },
  testimonial_icon_5: {
    type: 'string' as const,
    default: '🚀'
  },
  testimonial_icon_6: {
    type: 'string' as const,
    default: '✨'
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
  
  // Limit to maximum 6 testimonials
  const limitedQuoteList = quoteList.slice(0, 6);
  
  return limitedQuoteList.map((quote, index) => ({
    id: `testimonial-${index}`,
    index,
    quote,
    customerName: nameList[index] || 'Anonymous',
    customerTitle: titleList[index] || undefined,
    customerCompany: companyList[index] || undefined
  }));
};

// Helper function to remove a testimonial
const removeTestimonial = (
  quotes: string, 
  names: string, 
  titles: string, 
  companies: string, 
  indexToRemove: number
): { newQuotes: string; newNames: string; newTitles: string; newCompanies: string } => {
  const quoteList = parsePipeData(quotes);
  const nameList = parsePipeData(names);
  const titleList = parsePipeData(titles || '');
  const companyList = parsePipeData(companies || '');
  
  // Remove the testimonial at the specified index
  if (indexToRemove >= 0 && indexToRemove < quoteList.length) {
    quoteList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < nameList.length) {
    nameList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < titleList.length) {
    titleList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < companyList.length) {
    companyList.splice(indexToRemove, 1);
  }
  
  return {
    newQuotes: quoteList.join('|'),
    newNames: nameList.join('|'),
    newTitles: titleList.join('|'),
    newCompanies: companyList.join('|')
  };
};

// Helper function to add a new testimonial
const addTestimonial = (
  quotes: string, 
  names: string, 
  titles: string, 
  companies: string
): { newQuotes: string; newNames: string; newTitles: string; newCompanies: string } => {
  const quoteList = parsePipeData(quotes);
  const nameList = parsePipeData(names);
  const titleList = parsePipeData(titles || '');
  const companyList = parsePipeData(companies || '');
  
  // Add new testimonial with default content
  quoteList.push('This is a new testimonial. Click to edit and add your customer\'s feedback.');
  nameList.push('New Customer');
  titleList.push('Add Title');
  companyList.push('Add Company');
  
  return {
    newQuotes: quoteList.join('|'),
    newNames: nameList.join('|'),
    newTitles: titleList.join('|'),
    newCompanies: companyList.join('|')
  };
};

// Helper function to get testimonial icon
const getTestimonialIcon = (blockContent: QuoteGridContent, index: number) => {
  const iconFields = [
    blockContent.testimonial_icon_1,
    blockContent.testimonial_icon_2,
    blockContent.testimonial_icon_3,
    blockContent.testimonial_icon_4,
    blockContent.testimonial_icon_5,
    blockContent.testimonial_icon_6
  ];

  const icon = iconFields[index];
  if (icon && icon.trim()) {
    return icon;
  }

  // Fallback to random icon from testimonial category
  return getRandomIconFromCategory('testimonial');
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
  onRemoveTestimonial,
  canRemove,
  sectionId,
  sectionBackground,
  backgroundType,
  blockContent,
  handleContentUpdate,
  themeColors
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
  onRemoveTestimonial?: (index: number) => void;
  canRemove?: boolean;
  sectionId: string;
  sectionBackground: any;
  backgroundType: "custom" | "neutral" | "primary" | "secondary" | "divider" | "theme" | undefined;
  blockContent: any;
  handleContentUpdate: (key: string, value: string) => void;
  themeColors: ReturnType<typeof getThemeColors>;
}) => {

  return (
    <div className={`group/quote-card-${testimonial.index} bg-white p-8 rounded-xl border ${themeColors.border} ${themeColors.borderHover} hover:shadow-lg transition-all duration-300 relative`}>
      
      {/* Quote Mark */}
      <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300 group/icon-edit relative">
        <IconEditableText
          mode={mode}
          value={blockContent.quote_mark_icon || '"'}
          onEdit={(value) => handleContentUpdate('quote_mark_icon', value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          iconSize="xl"
          className={`text-4xl ${themeColors.iconText}`}
          sectionId={sectionId}
          elementKey="quote_mark_icon"
        />
      </div>

      {/* Delete Button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveTestimonial && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveTestimonial(testimonial.index);
          }}
          className={`opacity-0 group-hover/quote-card-${testimonial.index}:opacity-100 absolute top-4 left-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this testimonial"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Testimonial Icon */}
      <div className="mb-4">
        <IconEditableText
          mode={mode}
          value={getTestimonialIcon(blockContent, testimonial.index)}
          onEdit={(value) => handleContentUpdate(`testimonial_icon_${testimonial.index + 1}`, value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          iconSize="lg"
          className={`text-2xl ${themeColors.iconText}`}
          sectionId={sectionId}
          elementKey={`testimonial_icon_${testimonial.index + 1}`}
        />
      </div>

      {/* Testimonial Quote */}
      <div className="mb-6">
        {mode !== 'preview' ? (
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
            {mode !== 'preview' ? (
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
              {mode !== 'preview' ? (
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
              {mode !== 'preview' ? (
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
            backgroundType={backgroundType || "neutral"}
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

// Theme color mapping function
const getThemeColors = (theme: UIBlockTheme) => ({
  warm: {
    border: 'border-orange-200',
    borderHover: 'hover:border-orange-300',
    iconText: 'text-orange-500',
    buttonBg: 'bg-orange-50 hover:bg-orange-100',
    buttonBorder: 'border-orange-200 hover:border-orange-300',
    buttonText: 'text-orange-700'
  },
  cool: {
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    iconText: 'text-blue-500',
    buttonBg: 'bg-blue-50 hover:bg-blue-100',
    buttonBorder: 'border-blue-200 hover:border-blue-300',
    buttonText: 'text-blue-700'
  },
  neutral: {
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    iconText: 'text-gray-500',
    buttonBg: 'bg-gray-50 hover:bg-gray-100',
    buttonBorder: 'border-gray-200 hover:border-gray-300',
    buttonText: 'text-gray-700'
  }
})[theme];

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

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(uiBlockTheme);

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

  // Handle removing a testimonial
  const handleRemoveTestimonial = (indexToRemove: number) => {
    const { newQuotes, newNames, newTitles, newCompanies } = removeTestimonial(
      blockContent.testimonial_quotes,
      blockContent.customer_names,
      blockContent.customer_titles || '',
      blockContent.customer_companies || '',
      indexToRemove
    );
    
    handleContentUpdate('testimonial_quotes', newQuotes);
    handleContentUpdate('customer_names', newNames);
    handleContentUpdate('customer_titles', newTitles);
    handleContentUpdate('customer_companies', newCompanies);
  };

  // Handle adding a new testimonial
  const handleAddTestimonial = () => {
    const { newQuotes, newNames, newTitles, newCompanies } = addTestimonial(
      blockContent.testimonial_quotes,
      blockContent.customer_names,
      blockContent.customer_titles || '',
      blockContent.customer_companies || ''
    );
    
    handleContentUpdate('testimonial_quotes', newQuotes);
    handleContentUpdate('customer_names', newNames);
    handleContentUpdate('customer_titles', newTitles);
    handleContentUpdate('customer_companies', newCompanies);
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
              onRemoveTestimonial={handleRemoveTestimonial}
              canRemove={testimonials.length > 1}
              sectionId={sectionId}
              sectionBackground={sectionBackground}
              backgroundType={backgroundType || "neutral"}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              themeColors={themeColors}
            />
          ))}
        </div>

        {/* Add Testimonial Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && testimonials.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddTestimonial}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${themeColors.buttonBg} border-2 ${themeColors.buttonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.buttonText} font-medium`}>Add Testimonial</span>
            </button>
          </div>
        )}

        {/* Trust Reinforcement */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
            <div className="mr-2 group/icon-edit relative">
              <IconEditableText
                mode={mode}
                value={blockContent.verification_icon || '✅'}
                onEdit={(value) => handleContentUpdate('verification_icon', value)}
                backgroundType={backgroundType || "neutral"}
                colorTokens={colorTokens}
                iconSize="md"
                className="text-xl text-green-600"
                sectionId={sectionId}
                elementKey="verification_icon"
              />
            </div>
            {mode !== 'preview' ? (
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