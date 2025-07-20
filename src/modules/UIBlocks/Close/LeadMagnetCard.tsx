import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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

interface LeadMagnetCardContent {
  headline: string;
  magnet_title: string;
  magnet_description: string;
  magnet_benefits: string;
  magnet_format: string;
  cta_text: string;
  privacy_text?: string;
  social_proof?: string;
  magnet_preview?: string;
  delivery_method?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get Your Free Resource' 
  },
  magnet_title: { 
    type: 'string' as const, 
    default: 'The Complete Guide to Business Automation' 
  },
  magnet_description: { 
    type: 'string' as const, 
    default: 'Discover the exact strategies we used to automate 80% of our business processes and increase productivity by 300%.' 
  },
  magnet_benefits: { 
    type: 'string' as const, 
    default: 'Step-by-step automation roadmap|10 ready-to-use workflow templates|Productivity tools comparison chart|Case studies from real businesses|Implementation timeline and checklist' 
  },
  magnet_format: { 
    type: 'string' as const, 
    default: '47-page PDF Guide' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Download Free Guide' 
  },
  privacy_text: { 
    type: 'string' as const, 
    default: 'We respect your privacy. Unsubscribe at any time.' 
  },
  social_proof: { 
    type: 'string' as const, 
    default: 'Downloaded by 10,000+ business owners' 
  },
  magnet_preview: { 
    type: 'string' as const, 
    default: 'Chapter 1: Foundation of Automation|Chapter 2: Tools and Technology|Chapter 3: Implementation Strategy|Chapter 4: Measuring Success|Bonus: Templates & Checklists' 
  },
  delivery_method: { 
    type: 'string' as const, 
    default: 'Instant download - delivered to your email' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  }
};

export default function LeadMagnetCard(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<LeadMagnetCardContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const benefits = blockContent.magnet_benefits 
    ? blockContent.magnet_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const previewChapters = blockContent.magnet_preview 
    ? blockContent.magnet_preview.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getMagnetIcon = () => {
    const format = blockContent.magnet_format.toLowerCase();
    
    if (format.includes('pdf') || format.includes('guide') || format.includes('ebook')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    if (format.includes('video') || format.includes('course')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (format.includes('template') || format.includes('worksheet')) {
      return (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    }
    
    // Default checklist icon
    return (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LeadMagnetCard"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
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
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the lead magnet..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Lead Magnet Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_title}
                  onEdit={(value) => handleContentUpdate('magnet_title', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Lead magnet title"
                  sectionId={sectionId}
                  elementKey="magnet_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_description}
                  onEdit={(value) => handleContentUpdate('magnet_description', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Lead magnet description"
                  sectionId={sectionId}
                  elementKey="magnet_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_benefits}
                  onEdit={(value) => handleContentUpdate('magnet_benefits', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Benefits (pipe separated)"
                  sectionId={sectionId}
                  elementKey="magnet_benefits"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.magnet_format}
                  onEdit={(value) => handleContentUpdate('magnet_format', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Format (e.g., PDF, Video, Template)"
                  sectionId={sectionId}
                  elementKey="magnet_format"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            
            {/* Lead Magnet Card */}
            <div className="grid lg:grid-cols-2 gap-0">
              
              {/* Visual/Preview Side */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 lg:p-12 text-white flex flex-col justify-center">
                <div className="text-center">
                  
                  {/* Format Badge */}
                  <div className="inline-block bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                    {blockContent.magnet_format}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-8 flex justify-center opacity-90">
                    {getMagnetIcon()}
                  </div>
                  
                  {/* Social Proof */}
                  {blockContent.social_proof && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span className="text-sm font-medium">{blockContent.social_proof}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview/Chapters */}
                  {previewChapters.length > 0 && (
                    <div className="text-left bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="text-sm font-semibold mb-3 text-center">What's Inside:</div>
                      <div className="space-y-2">
                        {previewChapters.slice(0, 4).map((chapter, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold">{index + 1}</span>
                            </div>
                            <span>{chapter}</span>
                          </div>
                        ))}
                        {previewChapters.length > 4 && (
                          <div className="text-sm opacity-75 text-center pt-2">
                            +{previewChapters.length - 4} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Side */}
              <div className="p-8 lg:p-12">
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {blockContent.magnet_title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {blockContent.magnet_description}
                </p>
                
                {/* Benefits */}
                <div className="mb-8">
                  <div className="text-sm font-semibold text-gray-700 mb-4">You'll get:</div>
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* CTA */}
                <div className="mb-6">
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    textStyle={getTextStyle('body-lg')}
                    className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                </div>
                
                {/* Delivery Method */}
                {blockContent.delivery_method && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{blockContent.delivery_method}</span>
                  </div>
                )}
                
                {/* Privacy Text */}
                {blockContent.privacy_text && (
                  <div className="text-xs text-gray-500 text-center">
                    {blockContent.privacy_text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="mt-12 text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900">Instant Access</div>
              <div className={`text-sm ${mutedTextColor}`}>Download immediately</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900">100% Free</div>
              <div className={`text-sm ${mutedTextColor}`}>No hidden costs</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900">Privacy Protected</div>
              <div className={`text-sm ${mutedTextColor}`}>We never spam</div>
            </div>
          </div>
        </div>

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
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
                placeholder="Add optional supporting text to reinforce the lead magnet value..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
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
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'LeadMagnetCard',
  category: 'Close',
  description: 'Professional lead magnet card with preview and benefits. Perfect for content downloads and lead generation.',
  tags: ['lead-magnet', 'download', 'content', 'lead-generation', 'conversion'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'magnet_title', label: 'Lead Magnet Title', type: 'text', required: true },
    { key: 'magnet_description', label: 'Lead Magnet Description', type: 'textarea', required: true },
    { key: 'magnet_benefits', label: 'Benefits (pipe separated)', type: 'textarea', required: true },
    { key: 'magnet_format', label: 'Format (PDF, Video, etc.)', type: 'text', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'privacy_text', label: 'Privacy Text', type: 'text', required: false },
    { key: 'social_proof', label: 'Social Proof Text', type: 'text', required: false },
    { key: 'magnet_preview', label: 'Preview/Chapters (pipe separated)', type: 'textarea', required: false },
    { key: 'delivery_method', label: 'Delivery Method', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Dynamic format icons (PDF, video, template)',
    'Content preview with chapters/benefits',
    'Social proof and download stats',
    'Trust elements and privacy messaging',
    'Professional card design',
    'Mobile-responsive layout'
  ],
  
  useCases: [
    'Content marketing lead generation',
    'Educational resource downloads',
    'Template and tool giveaways',
    'Newsletter signup incentives',
    'Course or product lead magnets'
  ]
};