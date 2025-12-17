// components/layout/TestimonialCTACombo.tsx
// Production-ready CTA with testimonial using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface TestimonialCTAComboContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  secondary_cta_text?: string;
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_title: string;
  testimonial_company: string;
  testimonial_company_logo?: string;
  testimonial_date?: string;
  testimonial_industry?: string;
  case_study_tag?: string;
  customer_count?: string;
  average_rating?: string;
  uptime_percentage?: string;
  show_social_proof?: boolean;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Join Thousands of Happy Customers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See why businesses trust us to transform their operations and drive growth.' 
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Your Success Story'
  },
  secondary_cta_text: {
    type: 'string' as const,
    default: 'Watch Demo'
  },
  testimonial_quote: { 
    type: 'string' as const, 
    default: 'After struggling with manual processes for years, we implemented this platform and saw <strong>immediate results</strong>. Within just <strong>3 months</strong>, we reduced our operational overhead by <strong>65%</strong> and increased team efficiency by <strong>180%</strong>. The automated workflows alone save us <strong>25+ hours weekly</strong>, which we now invest in strategic growth initiatives. The ROI exceeded our projections by 40%.' 
  },
  testimonial_author: { 
    type: 'string' as const, 
    default: 'Marcus Rodriguez' 
  },
  testimonial_title: { 
    type: 'string' as const, 
    default: 'Chief Operations Officer' 
  },
  testimonial_company: { 
    type: 'string' as const, 
    default: 'Velocity Dynamics' 
  },
  testimonial_company_logo: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_date: { 
    type: 'string' as const, 
    default: 'March 2024' 
  },
  testimonial_industry: { 
    type: 'string' as const, 
    default: 'SaaS & Technology' 
  },
  case_study_tag: { 
    type: 'string' as const, 
    default: '' 
  },
  customer_count: { 
    type: 'string' as const, 
    default: '10,000+' 
  },
  average_rating: { 
    type: 'string' as const, 
    default: '4.9/5' 
  },
  uptime_percentage: { 
    type: 'string' as const, 
    default: '99.9%' 
  },
  show_social_proof: { 
    type: 'boolean' as const, 
    default: true 
  }
};


// Avatar Component
const TestimonialAvatar = React.memo(({ 
  name, 
  company, 
  mode, 
  logoUrl, 
  onLogoChange 
}: { 
  name: string, 
  company: string,
  mode: 'edit' | 'preview',
  logoUrl?: string,
  onLogoChange: (url: string) => void
}) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Generate color based on name
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600'
  ];
  const colorIndex = name.length % colors.length;

  // Generate company initials if no logo
  const companyInitials = company
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <div className={`w-16 h-16 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white`}>
        {initials}
      </div>
      {/* Company logo - editable with enhanced styling */}
      <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-full border-2 border-gray-300 shadow-md flex items-center justify-center group hover:shadow-lg transition-shadow duration-200">
        {logoUrl ? (
          <LogoEditableComponent
            mode={mode}
            logoUrl={logoUrl}
            onLogoChange={onLogoChange}
            companyName={company}
            size="sm"
            className="w-6 h-6 rounded"
          />
        ) : (
          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 border">
            {mode !== 'preview' ? (
              <LogoEditableComponent
                mode={mode}
                logoUrl={logoUrl}
                onLogoChange={onLogoChange}
                companyName={company}
                size="sm"
                className="w-full h-full rounded"
              />
            ) : (
              companyInitials
            )}
          </div>
        )}
      </div>
    </div>
  );
});
TestimonialAvatar.displayName = 'TestimonialAvatar';

export default function TestimonialCTACombo(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<TestimonialCTAComboContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TestimonialCTACombo"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - CTA Content */}
          <div className="space-y-8">
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

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="mb-8"
                style={bodyLgStyle}
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <CTAButton
                text={blockContent.cta_text}
                colorTokens={colorTokens}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                variant="primary"
                size="large"
                sectionId={sectionId}
                elementKey="cta_text"
                onClick={createCTAClickHandler(sectionId, "cta_text")}
              />

              {/* Secondary CTA */}
              {((blockContent.secondary_cta_text && blockContent.secondary_cta_text !== '___REMOVED___') || mode === 'edit') && (
                <CTAButton
                  text={blockContent.secondary_cta_text || 'Watch Demo'}
                  colorTokens={colorTokens}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  variant="outline"
                  size="large"
                  sectionId={sectionId}
                  elementKey="secondary_cta_text"
                  onClick={createCTAClickHandler(sectionId, "secondary_cta_text")}
                />
              )}
            </div>

            {/* Social Proof Stats */}
            {(blockContent.show_social_proof !== false) && (
              <div className="flex items-center space-x-8">
                {blockContent.customer_count && blockContent.customer_count !== '___REMOVED___' && (
                  <div className="text-center relative group/customer-item">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.customer_count || '10,000+'}
                      onEdit={(value) => handleContentUpdate('customer_count', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                      style={h2Style}
                      placeholder="10,000+"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="customer_count"
                    />
                    <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                      Happy Customers
                    </div>
                    
                    {/* Remove button for customer count */}
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('customer_count', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/customer-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove customer count"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {blockContent.average_rating && blockContent.average_rating !== '___REMOVED___' && (
                  <div className="text-center relative group/rating-item">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.average_rating || '4.9/5'}
                      onEdit={(value) => handleContentUpdate('average_rating', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                      style={h2Style}
                      placeholder="4.9/5"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="average_rating"
                    />
                    <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                      Average Rating
                    </div>
                    
                    {/* Remove button for average rating */}
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('average_rating', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/rating-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove average rating"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {blockContent.uptime_percentage && blockContent.uptime_percentage !== '___REMOVED___' && (
                  <div className="text-center relative group/uptime-item">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.uptime_percentage || '99.9%'}
                      onEdit={(value) => handleContentUpdate('uptime_percentage', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`font-bold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                      style={h2Style}
                      placeholder="99.9%"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="uptime_percentage"
                    />
                    <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                      Uptime
                    </div>
                    
                    {/* Remove button for uptime */}
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('uptime_percentage', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/uptime-item:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
                        title="Remove uptime percentage"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Testimonial */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none"></div>
            
            {/* Case Study Tag */}
            {blockContent.case_study_tag && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.case_study_tag || ''}
                    onEdit={(value) => handleContentUpdate('case_study_tag', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-xs font-medium"
                    sectionId={sectionId}
                    elementKey="case_study_tag"
                    sectionBackground="bg-blue-100"
                  />
                </div>
              </div>
            )}


            {/* Testimonial Quote */}
            <div className="text-gray-700 leading-relaxed mb-8 text-lg pt-4">
              {mode === 'preview' ? (
                <div 
                  className="italic"
                  dangerouslySetInnerHTML={{ 
                    __html: (blockContent.testimonial_quote || '').replace(
                      /<strong>(.*?)<\/strong>/g, 
                      '<span class="font-bold text-blue-600">$1</span>'
                    )
                  }}
                />
              ) : (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_quote || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_quote', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="italic"
                  sectionId={sectionId}
                  elementKey="testimonial_quote"
                  sectionBackground="bg-white"
                />
              )}
            </div>

            {/* Author Info */}
            <div className="flex items-center space-x-4">
              <TestimonialAvatar 
                name={blockContent.testimonial_author} 
                company={blockContent.testimonial_company}
                mode={mode}
                logoUrl={blockContent.testimonial_company_logo}
                onLogoChange={(url) => handleContentUpdate('testimonial_company_logo', url)}
              />
              
              <div className="flex-1">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_author || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_author', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold text-gray-900 text-base"
                  sectionId={sectionId}
                  elementKey="testimonial_author"
                  sectionBackground="bg-white"
                />
                
                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.testimonial_title || ''}
                    onEdit={(value) => handleContentUpdate('testimonial_title', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-600 font-medium"
                    sectionId={sectionId}
                    elementKey="testimonial_title"
                    sectionBackground="bg-white"
                  />
                  <span>at</span>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.testimonial_company || ''}
                    onEdit={(value) => handleContentUpdate('testimonial_company', value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-600 font-semibold"
                    sectionId={sectionId}
                    elementKey="testimonial_company"
                    sectionBackground="bg-white"
                  />
                </div>
                
                {/* Industry and Date */}
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                  {blockContent.testimonial_industry && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.testimonial_industry || ''}
                        onEdit={(value) => handleContentUpdate('testimonial_industry', value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-xs"
                        sectionId={sectionId}
                        elementKey="testimonial_industry"
                        sectionBackground="bg-white"
                      />
                    </div>
                  )}
                  
                  {blockContent.testimonial_date && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.testimonial_date || ''}
                        onEdit={(value) => handleContentUpdate('testimonial_date', value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-xs"
                        sectionId={sectionId}
                        elementKey="testimonial_date"
                        sectionBackground="bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'TestimonialCTACombo',
  category: 'CTA Sections',
  description: 'CTA with featured testimonial for social proof',
  tags: ['cta', 'testimonial', 'social-proof', 'conversion', 'trust'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Featured customer testimonial with metrics',
    'Professional avatar with company logo',
    'Social proof statistics',
    'Case study tag indicator',
    'Industry and date context'
  ],
  
  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'secondary_cta_text', label: 'Secondary CTA Button Text', type: 'text', required: false },
    { key: 'testimonial_quote', label: 'Testimonial Quote (supports <strong> tags)', type: 'textarea', required: true },
    { key: 'testimonial_author', label: 'Author Name', type: 'text', required: true },
    { key: 'testimonial_title', label: 'Author Title', type: 'text', required: true },
    { key: 'testimonial_company', label: 'Company Name', type: 'text', required: true },
    { key: 'testimonial_company_logo', label: 'Company Logo', type: 'image', required: false },
    { key: 'testimonial_date', label: 'Testimonial Date', type: 'text', required: false },
    { key: 'testimonial_industry', label: 'Company Industry', type: 'text', required: false },
    { key: 'case_study_tag', label: 'Case Study Tag', type: 'text', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'average_rating', label: 'Average Rating', type: 'text', required: false },
    { key: 'uptime_percentage', label: 'Uptime Percentage', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false }
  ],
  
  useCases: [
    'Trust-building CTAs',
    'Social proof sections',
    'Customer story highlights',
    'Conversion optimization'
  ]
};