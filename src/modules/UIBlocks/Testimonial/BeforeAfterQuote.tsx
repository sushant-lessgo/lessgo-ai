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
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface BeforeAfterQuoteContent {
  headline: string;
  before_situations: string;
  after_outcomes: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_companies?: string;
  timeframes?: string;
  metrics?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Amazing Transformations Our Customers Have Achieved' 
  },
  before_situations: { 
    type: 'string' as const, 
    default: 'Spending 10+ hours weekly on manual data entry and struggling with constant errors|Managing inventory across multiple spreadsheets with frequent stockouts|Manually tracking customer interactions leading to missed follow-ups|Processing invoices by hand resulting in delayed payments' 
  },
  after_outcomes: { 
    type: 'string' as const, 
    default: 'Automated data processing with 99.9% accuracy and 5 hours saved weekly|Real-time inventory management with zero stockouts in 6 months|Automated customer workflow with 300% increase in conversion rates|Instant invoice processing with payments received 50% faster' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'The transformation has been incredible. We went from drowning in manual work to having systems that practically run themselves.|Our efficiency gains have been astronomical. What used to take days now happens in minutes, and our accuracy is perfect.|This solved our biggest pain point instantly. Our team can now focus on strategy instead of repetitive tasks.|The ROI was immediate and continues to grow. This investment has fundamentally changed how we operate.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Rachel Thompson|Marcus Chen|Lisa Rodriguez|David Park' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Operations Manager|CTO|Business Owner|Finance Director' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'TechFlow Solutions|DataStream Corp|Rodriguez Consulting|Park Financial Group' 
  },
  timeframes: { 
    type: 'string' as const, 
    default: 'Within 2 weeks|In 30 days|After 1 month|In just 3 weeks' 
  },
  metrics: { 
    type: 'string' as const, 
    default: '5 hours saved weekly|Zero stockouts|300% conversion increase|50% faster payments' 
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

export default function BeforeAfterQuote(props: LayoutComponentProps) {
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
  } = useLayoutComponent<BeforeAfterQuoteContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const beforeSituations = blockContent.before_situations 
    ? blockContent.before_situations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const afterOutcomes = blockContent.after_outcomes 
    ? blockContent.after_outcomes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

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

  const timeframes = blockContent.timeframes 
    ? blockContent.timeframes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const metrics = blockContent.metrics 
    ? blockContent.metrics.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const transformations = beforeSituations.map((before, index) => ({
    before,
    after: afterOutcomes[index] || '',
    quote: testimonialQuotes[index] || '',
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || '',
    timeframe: timeframes[index] || '',
    metric: metrics[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const TransformationCard = ({ transformation, index }: {
    transformation: typeof transformations[0];
    index: number;
  }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      
      {/* Before/After Comparison */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        
        {/* Before */}
        <div className="p-6 bg-red-50">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-semibold text-red-700">Before</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">
            {transformation.before}
          </p>
        </div>
        
        {/* After */}
        <div className="p-6 bg-green-50">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold text-green-700">After</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-sm">
            {transformation.after}
          </p>
        </div>
      </div>
      
      {/* Results Metrics */}
      {transformation.metric && (
        <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">{transformation.metric}</span>
            </div>
            {transformation.timeframe && (
              <span className="text-xs text-blue-600 font-medium">{transformation.timeframe}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Testimonial Quote */}
      <div className="p-6 bg-gray-50">
        <blockquote className="text-gray-800 italic mb-4 text-sm leading-relaxed">
          "{transformation.quote}"
        </blockquote>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {transformation.customerName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{transformation.customerName}</div>
            <div className="text-xs text-gray-600">{transformation.customerTitle}</div>
            {transformation.customerCompany && (
              <div className="text-xs text-blue-600 font-medium">{transformation.customerCompany}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BeforeAfterQuote"
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
              placeholder="Add optional subheadline to introduce transformation stories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Before/After Transformation Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_situations || ''}
                  onEdit={(value) => handleContentUpdate('before_situations', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Before situations (pipe separated)"
                  sectionId={sectionId}
                  elementKey="before_situations"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_outcomes || ''}
                  onEdit={(value) => handleContentUpdate('after_outcomes', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="After outcomes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="after_outcomes"
                  sectionBackground={sectionBackground}
                />
                
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
                  value={blockContent.metrics || ''}
                  onEdit={(value) => handleContentUpdate('metrics', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Results metrics (pipe separated)"
                  sectionId={sectionId}
                  elementKey="metrics"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {transformations.map((transformation, index) => (
              <TransformationCard
                key={index}
                transformation={transformation}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Transformation Summary Stats */}
        <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-green-100 mb-12">
          <div className="text-center">
            <h3 style={h3Style} className="font-semibold text-gray-900 mb-6">Average Customer Results</h3>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
                <div className={`text-sm ${mutedTextColor}`}>Time saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">300%</div>
                <div className={`text-sm ${mutedTextColor}`}>Efficiency gain</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">30 days</div>
                <div className={`text-sm ${mutedTextColor}`}>To see results</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">500%</div>
                <div className={`text-sm ${mutedTextColor}`}>ROI achieved</div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 font-medium">Guaranteed results</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-gray-700 font-medium">Fast implementation</span>
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
                placeholder="Add optional supporting text to reinforce transformation stories..."
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
  name: 'BeforeAfterQuote',
  category: 'Testimonial',
  description: 'Before/after transformation testimonials. Perfect for desire-led copy and transformation-focused problems.',
  tags: ['testimonial', 'before-after', 'transformation', 'results', 'metrics'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_situations', label: 'Before Situations (pipe separated)', type: 'textarea', required: true },
    { key: 'after_outcomes', label: 'After Outcomes (pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: false },
    { key: 'timeframes', label: 'Result Timeframes (pipe separated)', type: 'text', required: false },
    { key: 'metrics', label: 'Results Metrics (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Visual before/after comparison',
    'Transformation metrics display',
    'Customer success stories',
    'Results-focused presentation',
    'Perfect for ROI demonstration',
    'Desire-led copy support'
  ],
  
  useCases: [
    'Transformation-focused products',
    'ROI and efficiency tools',
    'Business automation platforms',
    'Process improvement solutions',
    'Results-driven testimonials'
  ]
};