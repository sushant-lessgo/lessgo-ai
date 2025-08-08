import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface PullQuoteStackContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_companies?: string;
  problem_contexts: string;
  emotional_hooks: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Real Stories from People Just Like You' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'I was drowning in manual tasks and working 12-hour days just to stay afloat. This solution gave me my life back.|The frustration of losing potential customers due to slow response times was killing our growth. Now we respond instantly.|I felt completely overwhelmed trying to manage everything myself. Finally found something that actually works for solo entrepreneurs.|The constant worry about making mistakes with important data was consuming me. Now I sleep peacefully knowing everything is automated.|Watching competitors pull ahead while we struggled with outdated processes was heartbreaking. This leveled the playing field.|The isolation of working alone without proper tools was affecting my mental health. This platform became my virtual team.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Maria Santos|Jake Thompson|Lisa Chen|Robert Kim|Nina Patel|Alex Rodriguez' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Solo Entrepreneur|Startup Founder|Freelance Consultant|Small Business Owner|Online Coach|Independent Creator' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'Santos Marketing|TechStart Solutions|Chen Consulting|Kim Design Studio|Patel Coaching|Rodriguez Creative' 
  },
  problem_contexts: { 
    type: 'string' as const, 
    default: 'Running a one-person marketing agency|Building a tech startup with limited resources|Managing multiple client projects alone|Growing a design business without a team|Scaling an online coaching practice|Creating content while handling business operations' 
  },
  emotional_hooks: { 
    type: 'string' as const, 
    default: 'Burnout and overwhelm|Fear of losing customers|Isolation and stress|Anxiety about mistakes|Frustration with competition|Mental health struggles' 
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
  }
};

export default function PullQuoteStack(props: LayoutComponentProps) {
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
  } = useLayoutComponent<PullQuoteStackContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h2Style = getTypographyStyle('h2');
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

  const customerCompanies = blockContent.customer_companies 
    ? blockContent.customer_companies.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problemContexts = blockContent.problem_contexts 
    ? blockContent.problem_contexts.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const emotionalHooks = blockContent.emotional_hooks 
    ? blockContent.emotional_hooks.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonials = testimonialQuotes.map((quote, index) => ({
    quote,
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || '',
    problemContext: problemContexts[index] || '',
    emotionalHook: emotionalHooks[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getEmotionalColor = (index: number) => {
    const colors = [
      { bg: 'from-red-50 to-orange-50', border: 'border-red-200', accent: 'text-red-600' },
      { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', accent: 'text-blue-600' },
      { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', accent: 'text-purple-600' },
      { bg: 'from-green-50 to-teal-50', border: 'border-green-200', accent: 'text-green-600' },
      { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', accent: 'text-yellow-600' },
      { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', accent: 'text-gray-600' }
    ];
    return colors[index % colors.length];
  };

  const QuoteCard = ({ testimonial, index, h3Style, bodyLgStyle }: {
    testimonial: typeof testimonials[0];
    index: number;
    h3Style: React.CSSProperties;
    bodyLgStyle: React.CSSProperties;
  }) => {
    const color = getEmotionalColor(index);
    const isLarge = index % 3 === 0; // Every third quote is larger
    
    return (
      <div className={`${isLarge ? 'md:col-span-2' : ''}`}>
        <div className={`bg-gradient-to-br ${color.bg} rounded-2xl p-6 border-2 ${color.border} hover:shadow-xl transition-all duration-300 h-full`}>
          
          {/* Emotional Context */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className={`text-sm font-medium ${color.accent}`}>
              {testimonial.emotionalHook}
            </span>
          </div>
          
          {/* Problem Context */}
          <div className={`text-xs ${mutedTextColor} mb-4 italic`}>
            {testimonial.problemContext}
          </div>
          
          {/* Quote */}
          <blockquote style={isLarge ? h3Style : bodyLgStyle} className="text-gray-800 leading-relaxed mb-6 font-medium">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            "{testimonial.quote}"
          </blockquote>
          
          {/* Attribution */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-gray-700 font-bold">
              {testimonial.customerName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{testimonial.customerName}</div>
              <div className="text-sm text-gray-600">{testimonial.customerTitle}</div>
              {testimonial.customerCompany && (
                <div className={`text-sm font-medium ${color.accent}`}>{testimonial.customerCompany}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PullQuoteStack"
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
              placeholder="Add optional subheadline to introduce emotional testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Pull Quote Stack Content</h4>
              
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
                  value={blockContent.problem_contexts || ''}
                  onEdit={(value) => handleContentUpdate('problem_contexts', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem contexts (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_contexts"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.emotional_hooks || ''}
                  onEdit={(value) => handleContentUpdate('emotional_hooks', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Emotional hooks (pipe separated)"
                  sectionId={sectionId}
                  elementKey="emotional_hooks"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Masonry-style Quote Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {testimonials.map((testimonial, index) => (
                <QuoteCard
                  key={index}
                  testimonial={testimonial}
                  index={index}
                  h3Style={h3Style}
                  bodyLgStyle={bodyLgStyle}
                />
              ))}
            </div>

            {/* Emotional Connection Summary */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mb-12">
              <div className="text-center">
                <h3 style={h2Style} className="font-bold mb-6">You're Not Alone in This Struggle</h3>
                
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-red-400 mb-2">The Pain</div>
                    <div className="text-gray-300 text-sm">Overwhelm, burnout, and constant stress from trying to do everything manually</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-yellow-400 mb-2">The Solution</div>
                    <div className="text-gray-300 text-sm">Automated systems that work while you focus on what truly matters</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-green-400 mb-2">The Result</div>
                    <div className="text-gray-300 text-sm">Peace of mind, work-life balance, and sustainable business growth</div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-gray-200">
                    "Every story above started with the same frustration you're feeling right now. 
                    The difference? They found a solution that actually works."
                  </p>
                </div>
              </div>
            </div>
          </>
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
                placeholder="Add optional supporting text to reinforce emotional connection..."
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
  name: 'PullQuoteStack',
  category: 'Testimonial',
  description: 'Emotional pull quote stack for pain-led copy. Perfect for early-stage startups and burnout/overload problems.',
  tags: ['testimonial', 'emotional', 'pain-led', 'quotes', 'stack'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: false },
    { key: 'problem_contexts', label: 'Problem Contexts (pipe separated)', type: 'textarea', required: true },
    { key: 'emotional_hooks', label: 'Emotional Hooks (pipe separated)', type: 'text', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Emotional pain-point focus',
    'Masonry-style quote layout',
    'Problem context highlighting',
    'Emotional connection building',
    'Perfect for pain-led copy',
    'Early-stage startup friendly'
  ],
  
  useCases: [
    'Pain-led copy campaigns',
    'Burnout and overload problems',
    'Early-stage startup testimonials',
    'Solo entrepreneur challenges',
    'Emotional connection building'
  ]
};