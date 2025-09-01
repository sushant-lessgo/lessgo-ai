import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TestimonialFAQsContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 3 items)
  question_1: string;
  answer_1: string;
  customer_name_1: string;
  customer_title_1: string;
  customer_company_1: string;
  rating_1: string;
  question_2: string;
  answer_2: string;
  customer_name_2: string;
  customer_title_2: string;
  customer_company_2: string;
  rating_2: string;
  question_3: string;
  answer_3: string;
  customer_name_3: string;
  customer_title_3: string;
  customer_company_3: string;
  rating_3: string;
  // Trust indicators
  trust_text: string;
  overall_rating: string;
  satisfaction_text: string;
  show_trust_section?: boolean;
  // Star icon fields
  star_icon?: string;
  overall_rating_star_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
  customer_names?: string;
  customer_titles?: string;
  customer_companies?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Real Answers from Real Customers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how our customers overcome common challenges and achieve success' 
  },
  // Individual testimonial FAQs
  question_1: { type: 'string' as const, default: 'How quickly did you see results?' },
  answer_1: { type: 'string' as const, default: 'We started seeing improvements within the first week. Our team productivity increased by 40% in just one month, and we\'ve saved over 15 hours per week on manual tasks. The automation just works.' },
  customer_name_1: { type: 'string' as const, default: 'Alex Thompson' },
  customer_title_1: { type: 'string' as const, default: 'Operations Manager' },
  customer_company_1: { type: 'string' as const, default: 'TechFlow Inc' },
  rating_1: { type: 'string' as const, default: '5' },
  question_2: { type: 'string' as const, default: 'Was the learning curve steep?' },
  answer_2: { type: 'string' as const, default: 'Not at all! I was worried about the complexity, but the onboarding was fantastic. Within 2 days, I had our main workflows automated. The interface is so intuitive that even our non-tech team members are creating their own automations now.' },
  customer_name_2: { type: 'string' as const, default: 'Maria Garcia' },
  customer_title_2: { type: 'string' as const, default: 'CEO' },
  customer_company_2: { type: 'string' as const, default: 'GrowthLabs' },
  rating_2: { type: 'string' as const, default: '5' },
  question_3: { type: 'string' as const, default: 'How is the ROI compared to other tools?' },
  answer_3: { type: 'string' as const, default: 'The ROI is incredible. We were spending $3000/month on a competitor plus countless hours on manual work. This platform costs a fraction of that and does 10x more. We\'ve already saved enough to pay for the entire year.' },
  customer_name_3: { type: 'string' as const, default: 'David Chen' },
  customer_title_3: { type: 'string' as const, default: 'VP of Engineering' },
  customer_company_3: { type: 'string' as const, default: 'DataCore Systems' },
  rating_3: { type: 'string' as const, default: '5' },
  // Trust indicators
  trust_text: { type: 'string' as const, default: 'Trusted by 1000+ companies' },
  overall_rating: { type: 'string' as const, default: '4.9/5 rating' },
  satisfaction_text: { type: 'string' as const, default: '99% customer satisfaction' },
  show_trust_section: { type: 'boolean' as const, default: true },
  // Star icon fields
  star_icon: { type: 'string' as const, default: '⭐' },
  overall_rating_star_icon: { type: 'string' as const, default: '⭐' },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' },
  customer_names: { type: 'string' as const, default: '' },
  customer_titles: { type: 'string' as const, default: '' },
  customer_companies: { type: 'string' as const, default: '' }
};

export default function TestimonialFAQs(props: LayoutComponentProps) {
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
  } = useLayoutComponent<TestimonialFAQsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Helper function to render stars using IconEditableText
  const renderStars = (rating: string | number, testimonialIndex?: number) => {
    const ratingNum = typeof rating === 'string' ? parseFloat(rating) || 5 : rating;
    const starCount = Math.round(ratingNum);
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: starCount }, (_, i) => (
          <IconEditableText
            key={i}
            mode={mode}
            value={blockContent.star_icon || '⭐'}
            onEdit={(value) => handleContentUpdate('star_icon', value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            iconSize="sm"
            className="text-yellow-400"
            sectionId={sectionId}
            elementKey={`star_icon_${testimonialIndex || 'rating'}_${i}`}
          />
        ))}
      </div>
    );
  };
  
  // Helper function to get testimonial FAQ items
  const getTestimonialFAQItems = () => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const questionKey = `question_${i}` as keyof TestimonialFAQsContent;
      const answerKey = `answer_${i}` as keyof TestimonialFAQsContent;
      const nameKey = `customer_name_${i}` as keyof TestimonialFAQsContent;
      const titleKey = `customer_title_${i}` as keyof TestimonialFAQsContent;
      const companyKey = `customer_company_${i}` as keyof TestimonialFAQsContent;
      const ratingKey = `rating_${i}` as keyof TestimonialFAQsContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      const customerName = blockContent[nameKey];
      const customerTitle = blockContent[titleKey];
      const customerCompany = blockContent[companyKey];
      const rating = blockContent[ratingKey];
      
      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          customerName: (customerName && typeof customerName === 'string' && customerName !== '___REMOVED___') ? customerName.trim() : 'Customer',
          customerTitle: (customerTitle && typeof customerTitle === 'string' && customerTitle !== '___REMOVED___') ? customerTitle.trim() : 'Customer',
          customerCompany: (customerCompany && typeof customerCompany === 'string' && customerCompany !== '___REMOVED___') ? customerCompany.trim() : 'Company',
          rating: (rating && typeof rating === 'string' && rating !== '___REMOVED___') ? rating.trim() : '5',
          index: i
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0 && blockContent.questions) {
      const questions = blockContent.questions.split('|').map(q => q.trim()).filter(Boolean);
      const answers = blockContent.answers?.split('|').map(a => a.trim()).filter(Boolean) || [];
      const customerNames = blockContent.customer_names?.split('|').map(n => n.trim()).filter(Boolean) || [];
      const customerTitles = blockContent.customer_titles?.split('|').map(t => t.trim()).filter(Boolean) || [];
      const customerCompanies = blockContent.customer_companies?.split('|').map(c => c.trim()).filter(Boolean) || [];
      
      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          customerName: customerNames[index] || 'Customer',
          customerTitle: customerTitles[index] || 'Customer',
          customerCompany: customerCompanies[index] || 'Company',
          rating: '5',
          index: index + 1
        });
      });
    }
    
    return items;
  };
  
  const testimonialItems = getTestimonialFAQItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TestimonialFAQs"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{
                ...getTextStyle('body-lg'),
                textAlign: 'center'
              }}
              className="max-w-3xl mx-auto"
              placeholder="Add a description highlighting customer success..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Testimonial-style FAQs */}
        <div className="space-y-10">
          {testimonialItems.map((item) => (
            <div key={item.index} className="relative group/testimonial-item bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-lg">
              {/* Question */}
              <div className="mb-6">
                <span className="text-3xl opacity-20">"</span>
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`question_${item.index}` as keyof TestimonialFAQsContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h2')}
                  placeholder={`Question ${item.index}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`question_${item.index}`}
                />
                <span className="text-3xl opacity-20">"</span>
              </div>
              
              {/* Testimonial Answer */}
              {(item.answer || mode === 'edit') && (
                <div className="mb-6">
                  <span className="text-2xl opacity-10">"</span>
                  <EditableAdaptiveText
                    mode={mode}
                    value={item.answer}
                    onEdit={(value) => handleContentUpdate(`answer_${item.index}` as keyof TestimonialFAQsContent, value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`leading-relaxed italic inline ${mutedTextColor}`}
                    style={getTextStyle('body-lg')}
                    placeholder={`Customer testimonial answer ${item.index}...`}
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`answer_${item.index}`}
                  />
                  <span className="text-2xl opacity-10">"</span>
                </div>
              )}
              
              {/* Customer Attribution */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {item.customerName?.split(' ').map(n => n.charAt(0)).join('') || 'C'}
                </div>
                
                {/* Customer Info */}
                <div className="flex-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={item.customerName}
                    onEdit={(value) => handleContentUpdate(`customer_name_${item.index}` as keyof TestimonialFAQsContent, value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                    style={getTextStyle('h3')}
                    placeholder="Customer Name"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`customer_name_${item.index}`}
                  />
                  <div className={`text-sm ${mutedTextColor} flex items-center gap-1`}>
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.customerTitle}
                      onEdit={(value) => handleContentUpdate(`customer_title_${item.index}` as keyof TestimonialFAQsContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Title"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`customer_title_${item.index}`}
                    />
                    <span>at</span>
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.customerCompany}
                      onEdit={(value) => handleContentUpdate(`customer_company_${item.index}` as keyof TestimonialFAQsContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="Company"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`customer_company_${item.index}`}
                    />
                  </div>
                </div>
                
                {/* Star Rating */}
                <div className="ml-auto flex items-center gap-1 relative group/rating">
                  {renderStars(item.rating, item.index)}
                  {mode === 'edit' && (
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.rating}
                      onEdit={(value) => handleContentUpdate(`rating_${item.index}` as keyof TestimonialFAQsContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="ml-2 text-sm font-medium"
                      placeholder="5"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`rating_${item.index}`}
                    />
                  )}
                </div>
              </div>
              
              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate(`question_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                    handleContentUpdate(`answer_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                    handleContentUpdate(`customer_name_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                    handleContentUpdate(`customer_title_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                    handleContentUpdate(`customer_company_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                    handleContentUpdate(`rating_${item.index}` as keyof TestimonialFAQsContent, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/testimonial-item:opacity-100 absolute top-4 right-4 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                  title="Remove this testimonial FAQ"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add new testimonial FAQ button */}
          {mode === 'edit' && testimonialItems.length < 3 && (
            <button
              onClick={() => {
                // Find the first empty slot
                for (let i = 1; i <= 3; i++) {
                  const questionKey = `question_${i}` as keyof TestimonialFAQsContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, 'New question');
                    handleContentUpdate(`answer_${i}` as keyof TestimonialFAQsContent, 'New testimonial answer');
                    handleContentUpdate(`customer_name_${i}` as keyof TestimonialFAQsContent, 'Customer Name');
                    handleContentUpdate(`customer_title_${i}` as keyof TestimonialFAQsContent, 'Title');
                    handleContentUpdate(`customer_company_${i}` as keyof TestimonialFAQsContent, 'Company');
                    handleContentUpdate(`rating_${i}` as keyof TestimonialFAQsContent, '5');
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-6 p-6 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add testimonial FAQ</span>
            </button>
          )}
        </div>

        {/* Trust Indicators */}
        {blockContent.show_trust_section !== false && (
          <div className="mt-12 text-center relative group/trust-section">
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {blockContent.trust_text && blockContent.trust_text !== '___REMOVED___' && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_text}
                  onEdit={(value) => handleContentUpdate('trust_text', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm font-medium"
                  placeholder="Trusted by 1000+ companies"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="trust_text"
                />
              )}
              
              {blockContent.overall_rating && blockContent.overall_rating !== '___REMOVED___' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <IconEditableText
                        key={i}
                        mode={mode}
                        value={blockContent.overall_rating_star_icon || '⭐'}
                        onEdit={(value) => handleContentUpdate('overall_rating_star_icon', value)}
                        backgroundType={backgroundType as any}
                        colorTokens={colorTokens}
                        iconSize="sm"
                        className="text-yellow-400"
                        sectionId={sectionId}
                        elementKey={`overall_rating_star_${i}`}
                      />
                    ))}
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.overall_rating}
                    onEdit={(value) => handleContentUpdate('overall_rating', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm"
                    placeholder="4.9/5 rating"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="overall_rating"
                  />
                </div>
              )}
              
              {blockContent.satisfaction_text && blockContent.satisfaction_text !== '___REMOVED___' && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.satisfaction_text}
                  onEdit={(value) => handleContentUpdate('satisfaction_text', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm"
                  placeholder="99% customer satisfaction"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="satisfaction_text"
                />
              )}
            </div>
            
            {/* Remove trust section button */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_trust_section', '___REMOVED___');
                }}
                className="opacity-0 group-hover/trust-section:opacity-100 absolute -top-2 right-0 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                title="Remove trust section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TestimonialFAQs',
  category: 'FAQ Sections',
  description: 'FAQs with customer testimonials for trust and social proof',
  tags: ['faq', 'testimonials', 'social-proof', 'trust', 'customers'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'moderate',
  estimatedBuildTime: '12 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Customer Testimonial Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Combines FAQs with testimonials',
    'Star ratings and social proof',
    'Customer attribution with avatars',
    'Trust-building design',
    'Perfect for established companies'
  ],
  
  useCases: [
    'Growth-stage company FAQs',
    'High-trust purchase decisions',
    'B2B software testimonials',
    'Customer success stories',
    'Social proof for conversions'
  ]
};