import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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

interface SegmentedTestimonialsContent {
  headline: string;
  segment_names: string;
  segment_descriptions: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_titles: string;
  customer_companies: string;
  use_cases: string;
  ratings?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Trusted Across Industries and Use Cases' 
  },
  segment_names: { 
    type: 'string' as const, 
    default: 'Enterprise Teams|Marketing Agencies|Small Businesses|Development Teams' 
  },
  segment_descriptions: { 
    type: 'string' as const, 
    default: 'Large organizations using our platform for scalable automation and enterprise-grade security.|Marketing professionals leveraging our tools for campaign optimization and client reporting.|Growing businesses streamlining operations and reducing manual overhead.|Developer teams integrating our APIs for custom solutions and workflows.' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'The enterprise features and security compliance made this an easy choice for our Fortune 500 company. Implementation was seamless.|Our agency has improved client satisfaction dramatically. We deliver better results faster, and our team efficiency has tripled.|As a small business, we needed something powerful but affordable. This platform gave us enterprise capabilities at a fraction of the cost.|The API documentation is excellent and integration was straightforward. Our development timeline was cut in half.' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Jennifer Walsh|Carlos Rivera|Amanda Chen|David Kumar' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'VP of Operations|Agency Director|Business Owner|Lead Developer' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'Global Tech Solutions|Rivera Marketing Group|Chen Consulting|Kumar Development Studio' 
  },
  use_cases: { 
    type: 'string' as const, 
    default: 'Process automation, compliance reporting, team collaboration|Campaign management, client dashboards, performance analytics|Customer management, invoice processing, workflow automation|API integration, custom workflows, data synchronization' 
  },
  ratings: { 
    type: 'string' as const, 
    default: '5|5|4|5' 
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

export default function SegmentedTestimonials(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SegmentedTestimonialsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const segmentNames = blockContent.segment_names 
    ? blockContent.segment_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const segmentDescriptions = blockContent.segment_descriptions 
    ? blockContent.segment_descriptions.split('|').map(item => item.trim()).filter(Boolean)
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

  const useCases = blockContent.use_cases 
    ? blockContent.use_cases.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const ratings = blockContent.ratings 
    ? blockContent.ratings.split('|').map(item => parseInt(item.trim()) || 5)
    : [];

  const segments = segmentNames.map((name, index) => ({
    name,
    description: segmentDescriptions[index] || '',
    quote: testimonialQuotes[index] || '',
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || '',
    useCase: useCases[index] || '',
    rating: ratings[index] || 5
  }));

  const [activeSegment, setActiveSegment] = useState(0);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getSegmentIcon = (index: number) => {
    const icons = [
      // Enterprise
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>,
      // Marketing/Agency
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>,
      // Small Business
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>,
      // Development
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ];
    return icons[index % icons.length];
  };

  const getSegmentColor = (index: number) => {
    const colors = [
      { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-200', bgLight: 'bg-blue-50' },
      { bg: 'from-green-500 to-green-600', text: 'text-green-600', border: 'border-green-200', bgLight: 'bg-green-50' },
      { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', border: 'border-purple-200', bgLight: 'bg-purple-50' },
      { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', border: 'border-orange-200', bgLight: 'bg-orange-50' }
    ];
    return colors[index % colors.length];
  };

  const SegmentTab = ({ segment, index, isActive }: {
    segment: typeof segments[0];
    index: number;
    isActive: boolean;
  }) => {
    const color = getSegmentColor(index);
    
    return (
      <button
        onClick={() => setActiveSegment(index)}
        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left w-full ${
          isActive 
            ? `${color.border} ${color.bgLight} shadow-lg` 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center text-white`}>
            {getSegmentIcon(index)}
          </div>
          <div className="flex-1">
            <div className={`font-semibold ${isActive ? color.text : 'text-gray-900'}`}>
              {segment.name}
            </div>
            <div className={`text-sm mt-1 ${isActive ? 'text-gray-700' : 'text-gray-600'}`}>
              {segment.description}
            </div>
          </div>
        </div>
      </button>
    );
  };

  const activeSegmentData = segments[activeSegment];
  const activeColor = getSegmentColor(activeSegment);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SegmentedTestimonials"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce segmented testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Segmented Testimonial Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.segment_names}
                  onEdit={(value) => handleContentUpdate('segment_names', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Segment names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="segment_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.segment_descriptions}
                  onEdit={(value) => handleContentUpdate('segment_descriptions', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Segment descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="segment_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_quotes}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Testimonial quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_names}
                  onEdit={(value) => handleContentUpdate('customer_names', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Customer names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.use_cases}
                  onEdit={(value) => handleContentUpdate('use_cases', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Use cases (pipe separated)"
                  sectionId={sectionId}
                  elementKey="use_cases"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            
            {/* Segment Tabs */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Industry</h3>
              {segments.map((segment, index) => (
                <SegmentTab
                  key={index}
                  segment={segment}
                  index={index}
                  isActive={activeSegment === index}
                />
              ))}
            </div>

            {/* Active Testimonial */}
            {activeSegmentData && (
              <div className="lg:sticky lg:top-8">
                <div className={`bg-white rounded-2xl shadow-xl border-2 ${activeColor.border} overflow-hidden`}>
                  {/* Header */}
                  <div className={`p-6 ${activeColor.bgLight} border-b ${activeColor.border}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${activeColor.bg} flex items-center justify-center text-white`}>
                        {getSegmentIcon(activeSegment)}
                      </div>
                      <div>
                        <h4 className={`font-bold text-lg ${activeColor.text}`}>
                          {activeSegmentData.name}
                        </h4>
                        <StarRating rating={activeSegmentData.rating} size="sm" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Testimonial Content */}
                  <div className="p-6">
                    <blockquote className="text-gray-800 text-lg leading-relaxed mb-6">
                      "{activeSegmentData.quote}"
                    </blockquote>
                    
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${activeColor.bg} flex items-center justify-center text-white font-bold`}>
                        {activeSegmentData.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{activeSegmentData.customerName}</div>
                        <div className="text-sm text-gray-600">{activeSegmentData.customerTitle}</div>
                        <div className={`text-sm font-medium ${activeColor.text}`}>{activeSegmentData.customerCompany}</div>
                      </div>
                    </div>
                    
                    {/* Use Cases */}
                    {activeSegmentData.useCase && (
                      <div className={`p-4 ${activeColor.bgLight} rounded-lg border ${activeColor.border}`}>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Common Use Cases:</div>
                        <div className="text-sm text-gray-600">
                          {activeSegmentData.useCase}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Industry Trust Indicators */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Trusted Across All Segments</h3>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Fortune 500</div>
                <div className={`text-sm ${mutedTextColor}`}>Enterprise clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
                <div className={`text-sm ${mutedTextColor}`}>Marketing agencies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
                <div className={`text-sm ${mutedTextColor}`}>Small businesses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
                <div className={`text-sm ${mutedTextColor}`}>Dev teams</div>
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
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce segmented testimonials..."
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
                    textStyle={getTextStyle('body-lg')}
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
  name: 'SegmentedTestimonials',
  category: 'Testimonial',
  description: 'Segmented testimonials for diverse audiences. Perfect for businesses/marketers and solution-aware prospects.',
  tags: ['testimonial', 'segments', 'industries', 'tabbed', 'business'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'segment_names', label: 'Segment Names (pipe separated)', type: 'text', required: true },
    { key: 'segment_descriptions', label: 'Segment Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: true },
    { key: 'use_cases', label: 'Use Cases (pipe separated)', type: 'textarea', required: true },
    { key: 'ratings', label: 'Ratings (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive segment selection',
    'Industry-specific testimonials',
    'Use case highlighting',
    'Sticky testimonial display',
    'Trust indicators by segment',
    'Perfect for diverse audiences'
  ],
  
  useCases: [
    'Multi-industry platforms',
    'Business and marketing tools',
    'Solution-aware audiences',
    'Diverse customer segments',
    'B2B testimonial campaigns'
  ]
};