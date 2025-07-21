import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TestimonialFAQsContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
  customer_names: string;
  customer_titles: string;
  customer_companies: string;
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
  questions: { 
    type: 'string' as const, 
    default: 'How quickly did you see results?|Was the learning curve steep?|How is the ROI compared to other tools?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'We started seeing improvements within the first week. Our team productivity increased by 40% in just one month, and we\'ve saved over 15 hours per week on manual tasks. The automation just works.|Not at all! I was worried about the complexity, but the onboarding was fantastic. Within 2 days, I had our main workflows automated. The interface is so intuitive that even our non-tech team members are creating their own automations now.|The ROI is incredible. We were spending $3000/month on a competitor plus countless hours on manual work. This platform costs a fraction of that and does 10x more. We\'ve already saved enough to pay for the entire year.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Alex Thompson|Maria Garcia|David Chen' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Operations Manager|CEO|VP of Engineering' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'TechFlow Inc|GrowthLabs|DataCore Systems' 
  }
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

  // Parse content
  const questions = blockContent.questions 
    ? blockContent.questions.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answers = blockContent.answers 
    ? blockContent.answers.split('|').map(a => a.trim()).filter(Boolean)
    : [];
  const customerNames = blockContent.customer_names 
    ? blockContent.customer_names.split('|').map(n => n.trim()).filter(Boolean)
    : [];
  const customerTitles = blockContent.customer_titles 
    ? blockContent.customer_titles.split('|').map(t => t.trim()).filter(Boolean)
    : [];
  const customerCompanies = blockContent.customer_companies 
    ? blockContent.customer_companies.split('|').map(c => c.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TestimonialFAQs"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
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
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a description highlighting customer success..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Testimonial-style FAQs */}
        <div className="space-y-10">
          {questions.map((question, index) => (
            <div key={index} className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-lg">
              {/* Question */}
              <h3 className={`text-xl font-semibold mb-6 ${dynamicTextColors?.heading || colorTokens.text}`}>
                "{question}"
              </h3>
              
              {/* Testimonial Answer */}
              {answers[index] && (
                <div className="mb-6">
                  <p className={`text-lg leading-relaxed italic ${mutedTextColor}`}>
                    "{answers[index]}"
                  </p>
                </div>
              )}
              
              {/* Customer Attribution */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {customerNames[index]?.split(' ').map(n => n.charAt(0)).join('') || 'C'}
                </div>
                
                {/* Customer Info */}
                <div>
                  <div className={`font-semibold text-lg ${dynamicTextColors?.heading || colorTokens.text}`}>
                    {customerNames[index] || 'Customer'}
                  </div>
                  <div className={`text-sm ${mutedTextColor}`}>
                    {customerTitles[index] || 'Customer'} at {customerCompanies[index] || 'Company'}
                  </div>
                </div>
                
                {/* Star Rating */}
                <div className="ml-auto flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-sm font-medium">Trusted by 1000+ companies</div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="text-sm">4.9/5 rating</span>
            </div>
            <div className="text-sm">99% customer satisfaction</div>
          </div>
        </div>
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