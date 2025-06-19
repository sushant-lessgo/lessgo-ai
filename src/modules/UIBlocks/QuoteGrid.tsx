import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface QuoteGridProps extends LayoutComponentProps {}

// Testimonial structure
interface Testimonial {
  quote: string;
  customerName: string;
  customerTitle?: string;
  customerCompany?: string;
  id: string;
}

// Content interface for QuoteGrid layout
interface QuoteGridContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles?: string;
  customer_companies?: string;
}

// Content schema for QuoteGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'What Our Customers Are Saying' },
  testimonial_quotes: { type: 'string' as const, default: 'This platform completely transformed how we handle our daily operations. What used to take hours now takes minutes, and our team can focus on what really matters.|The ROI was immediate and significant. Within the first month, we had already saved more than the annual subscription cost through improved efficiency.|Outstanding customer support and a product that actually delivers on its promises. Rare to find both in one solution.|Implementation was seamless and the results exceeded our expectations. Our productivity increased by 40% in the first quarter.' },
  customer_names: { type: 'string' as const, default: 'Sarah Johnson|Michael Chen|Emma Rodriguez|David Thompson' },
  customer_titles: { type: 'string' as const, default: '' },
  customer_companies: { type: 'string' as const, default: '' }
};

// Parse testimonial data from pipe-separated strings
const parseTestimonialData = (
  quotes: string, 
  names: string, 
  titles?: string, 
  companies?: string
): Testimonial[] => {
  const quoteList = quotes.split('|').map(q => q.trim()).filter(q => q);
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const titleList = titles ? titles.split('|').map(t => t.trim()).filter(t => t) : [];
  const companyList = companies ? companies.split('|').map(c => c.trim()).filter(c => c) : [];
  
  return quoteList.map((quote, index) => ({
    id: `testimonial-${index}`,
    quote,
    customerName: nameList[index] || 'Anonymous',
    customerTitle: titleList[index] || undefined,
    customerCompany: companyList[index] || undefined
  }));
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Customer Avatar Component
const CustomerAvatar = ({ name }: { name: string }) => {
  // Generate initials from customer name
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
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
};

// Individual Testimonial Card
const TestimonialCard = ({ 
  testimonial, 
  index, 
  mode, 
  sectionId,
  onQuoteEdit,
  onNameEdit,
  onTitleEdit,
  onCompanyEdit
}: {
  testimonial: Testimonial;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onQuoteEdit: (index: number, value: string) => void;
  onNameEdit: (index: number, value: string) => void;
  onTitleEdit: (index: number, value: string) => void;
  onCompanyEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
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
            onBlur={(e) => onQuoteEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-700 leading-relaxed italic"
            style={getTextStyle('body-lg')}
          >
            "{testimonial.quote}"
          </div>
        ) : (
          <blockquote 
            className="text-gray-700 leading-relaxed italic"
            style={getTextStyle('body-lg')}
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
                onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
                style={getTextStyle('body')}
              >
                {testimonial.customerName}
              </div>
            ) : (
              <div 
                className="font-semibold text-gray-900"
                style={getTextStyle('body')}
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
                  onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[16px] cursor-text hover:bg-gray-50 text-gray-600 text-sm ${!testimonial.customerTitle ? 'opacity-50 italic' : ''}`}
                  style={getTextStyle('body-sm')}
                >
                  {testimonial.customerTitle || 'Add title...'}
                </div>
              ) : testimonial.customerTitle && (
                <div 
                  className="text-gray-600 text-sm"
                  style={getTextStyle('body-sm')}
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
                  onBlur={(e) => onCompanyEdit(index, e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[16px] cursor-text hover:bg-gray-50 text-blue-600 text-sm font-medium ${!testimonial.customerCompany ? 'opacity-50 italic' : ''}`}
                  style={getTextStyle('body-sm')}
                >
                  {testimonial.customerCompany || 'Add company...'}
                </div>
              ) : testimonial.customerCompany && (
                <div 
                  className="text-blue-600 text-sm font-medium"
                  style={getTextStyle('body-sm')}
                >
                  {testimonial.customerCompany}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Star Rating */}
      <div className="mt-4 flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-500">5.0</span>
      </div>
    </div>
  );
};

export default function QuoteGrid({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: QuoteGridProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: QuoteGridContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse testimonial data
  const testimonials = parseTestimonialData(
    blockContent.testimonial_quotes,
    blockContent.customer_names,
    blockContent.customer_titles,
    blockContent.customer_companies
  );

  // Handle individual editing
  const handleQuoteEdit = (index: number, value: string) => {
    const quotes = blockContent.testimonial_quotes.split('|');
    quotes[index] = value.replace(/^"|"$/g, ''); // Remove quotes if user adds them
    handleContentUpdate('testimonial_quotes', quotes.join('|'));
  };

  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.customer_names.split('|');
    names[index] = value;
    handleContentUpdate('customer_names', names.join('|'));
  };

  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.customer_titles ? blockContent.customer_titles.split('|') : [];
    titles[index] = value;
    handleContentUpdate('customer_titles', titles.join('|'));
  };

  const handleCompanyEdit = (index: number, value: string) => {
    const companies = blockContent.customer_companies ? blockContent.customer_companies.split('|') : [];
    companies[index] = value;
    handleContentUpdate('customer_companies', companies.join('|'));
  };

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="QuoteGrid"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
        </div>

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${
          testimonials.length === 1 ? 'max-w-2xl mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          testimonials.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 xl:max-w-5xl xl:mx-auto'
        }`}>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onQuoteEdit={handleQuoteEdit}
              onNameEdit={handleNameEdit}
              onTitleEdit={handleTitleEdit}
              onCompanyEdit={handleCompanyEdit}
            />
          ))}
        </div>

        {/* Trust Reinforcement */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-800">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">All testimonials from verified customers</span>
          </div>
        </div>

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  QuoteGrid - Edit testimonial content or click individual elements above
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Testimonial Quotes (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="testimonial_quotes"
                    onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.testimonial_quotes}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Customer Names (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="customer_names"
                    onEdit={(value) => handleContentUpdate('customer_names', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {blockContent.customer_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Titles (optional, |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="customer_titles"
                    onEdit={(value) => handleContentUpdate('customer_titles', value)}
                  >
                    <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-20 overflow-y-auto ${!blockContent.customer_titles ? 'opacity-50 italic' : ''}`}>
                      {blockContent.customer_titles || 'Add customer titles...'}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Companies (optional, |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="customer_companies"
                    onEdit={(value) => handleContentUpdate('customer_companies', value)}
                  >
                    <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-20 overflow-y-auto ${!blockContent.customer_companies ? 'opacity-50 italic' : ''}`}>
                      {blockContent.customer_companies || 'Add customer companies...'}
                    </div>
                  </ModeWrapper>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 Tip: Customer avatars are auto-generated from names. Grid adapts automatically to 1-4+ testimonials. You can edit individual elements by clicking directly on them above.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}