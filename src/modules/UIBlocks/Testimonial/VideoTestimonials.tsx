import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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

interface VideoTestimonialsContent {
  headline: string;
  video_titles: string;
  video_descriptions: string;
  video_urls?: string;
  video_thumbnails?: string;
  customer_names: string;
  customer_titles: string;
  customer_companies: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See What Our Enterprise Customers Are Saying' 
  },
  video_titles: { 
    type: 'string' as const, 
    default: 'How We Transformed Our Operations|500% ROI in First Quarter|Seamless Enterprise Integration|From Manual to Automated in 30 Days' 
  },
  video_descriptions: { 
    type: 'string' as const, 
    default: 'Learn how our platform helped this Fortune 500 company streamline their entire workflow and reduce operational costs by 60%.|Discover the strategies and implementation process that delivered immediate results for this growing enterprise.|See the technical integration process and how our API seamlessly connected with their existing enterprise systems.|Watch the complete transformation journey from manual processes to full automation with measurable outcomes.' 
  },
  video_urls: { 
    type: 'string' as const, 
    default: 'https://www.youtube.com/embed/dQw4w9WgXcQ|https://www.youtube.com/embed/dQw4w9WgXcQ|https://www.youtube.com/embed/dQw4w9WgXcQ|https://www.youtube.com/embed/dQw4w9WgXcQ' 
  },
  video_thumbnails: { 
    type: 'string' as const, 
    default: '/testimonial-video-1.jpg|/testimonial-video-2.jpg|/testimonial-video-3.jpg|/testimonial-video-4.jpg' 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Mitchell|James Rodriguez|Anna Chen|Michael Thompson' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'VP of Operations|Chief Technology Officer|Director of IT|Head of Digital Transformation' 
  },
  customer_companies: { 
    type: 'string' as const, 
    default: 'TechCorp Industries|Global Dynamics|InnovateSoft|Enterprise Solutions Inc' 
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

const VideoTestimonial = React.memo(({ 
  title, 
  description, 
  videoUrl,
  thumbnail,
  customerName,
  customerTitle,
  customerCompany,
  index,
  showImageToolbar,
  sectionId,
  mode
}: {
  title: string;
  description: string;
  videoUrl?: string;
  thumbnail?: string;
  customerName: string;
  customerTitle: string;
  customerCompany: string;
  index: number;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
}) => {
  
  const VideoPlayer = () => {
    if (videoUrl && videoUrl.includes('youtube')) {
      return (
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full rounded-xl"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl overflow-hidden group cursor-pointer">
        {thumbnail && thumbnail !== '' ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            data-image-id={`${sectionId}-video${index}-thumbnail`}
            onMouseUp={(e) => {
              // Image toolbar is only available in edit mode
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm font-medium">{customerName}</div>
              <div className="text-xs text-white/80">{customerCompany}</div>
            </div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      {/* Video Section */}
      <div className="aspect-video">
        <VideoPlayer />
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {customerName.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{customerName}</h3>
            <p className="text-sm text-gray-600">{customerTitle}</p>
            <p className="text-sm text-blue-600 font-medium">{customerCompany}</p>
          </div>
        </div>
        
        <h4 className="font-bold text-lg text-gray-900 mb-3">{title}</h4>
        <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-500">Verified customer</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">3 min watch</div>
        </div>
      </div>
    </div>
  );
});
VideoTestimonial.displayName = 'VideoTestimonial';

export default function VideoTestimonials(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<VideoTestimonialsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const videoTitles = blockContent.video_titles 
    ? blockContent.video_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const videoDescriptions = blockContent.video_descriptions 
    ? blockContent.video_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const videoUrls = blockContent.video_urls 
    ? blockContent.video_urls.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const videoThumbnails = blockContent.video_thumbnails 
    ? blockContent.video_thumbnails.split('|').map(item => item.trim()).filter(Boolean)
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

  const testimonials = videoTitles.map((title, index) => ({
    title,
    description: videoDescriptions[index] || '',
    videoUrl: videoUrls[index] || '',
    thumbnail: videoThumbnails[index] || '',
    customerName: customerNames[index] || '',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VideoTestimonials"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your video testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Video Testimonial Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_titles || ''}
                  onEdit={(value) => handleContentUpdate('video_titles', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Video titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="video_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.video_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('video_descriptions', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Video descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="video_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_names || ''}
                  onEdit={(value) => handleContentUpdate('customer_names', value)}
                  backgroundType={safeBackgroundType}
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
                  value={blockContent.customer_titles || ''}
                  onEdit={(value) => handleContentUpdate('customer_titles', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Customer titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_companies || ''}
                  onEdit={(value) => handleContentUpdate('customer_companies', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Customer companies (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_companies"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <VideoTestimonial
                key={index}
                title={testimonial.title}
                description={testimonial.description}
                videoUrl={testimonial.videoUrl}
                thumbnail={testimonial.thumbnail}
                customerName={testimonial.customerName}
                customerTitle={testimonial.customerTitle}
                customerCompany={testimonial.customerCompany}
                index={index}
                showImageToolbar={showImageToolbar}
                sectionId={sectionId}
                mode={mode}
              />
            ))}
          </div>
        )}

        {/* Enterprise Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Trusted by Industry Leaders</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className={`text-sm ${mutedTextColor}`}>Enterprise customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className={`text-sm ${mutedTextColor}`}>Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className={`text-sm ${mutedTextColor}`}>Enterprise support</div>
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
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce video testimonials..."
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
  name: 'VideoTestimonials',
  category: 'Testimonial',
  description: 'Video testimonials for enterprise sales. Perfect for high-touch sales and product-aware audiences.',
  tags: ['testimonial', 'video', 'enterprise', 'sales', 'trust'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'video_titles', label: 'Video Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'video_descriptions', label: 'Video Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'video_urls', label: 'Video URLs (pipe separated)', type: 'textarea', required: false },
    { key: 'video_thumbnails', label: 'Video Thumbnails (pipe separated)', type: 'textarea', required: false },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'customer_companies', label: 'Customer Companies (pipe separated)', type: 'text', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Professional video testimonial layout',
    'Enterprise customer showcase',
    'Video thumbnail support',
    'Customer credential display',
    'Trust indicators and metrics',
    'Perfect for high-touch sales'
  ],
  
  useCases: [
    'Enterprise software sales',
    'High-value product demonstrations',
    'B2B customer success stories',
    'Product-aware audience engagement',
    'Video testimonial campaigns'
  ]
};