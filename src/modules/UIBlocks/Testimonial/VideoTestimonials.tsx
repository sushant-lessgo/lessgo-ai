import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
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
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

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
  industry_leaders_title?: string;
  enterprise_customers_stat?: string;
  enterprise_customers_label?: string;
  uptime_stat?: string;
  uptime_label?: string;
  support_stat?: string;
  support_label?: string;
}

// Video testimonial item structure
interface VideoTestimonialItem {
  id: string;
  index: number;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnail?: string;
  customerName: string;
  customerTitle: string;
  customerCompany: string;
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
  },
  industry_leaders_title: {
    type: 'string' as const,
    default: 'Trusted by Industry Leaders'
  },
  enterprise_customers_stat: {
    type: 'string' as const,
    default: '500+'
  },
  enterprise_customers_label: {
    type: 'string' as const,
    default: 'Enterprise customers'
  },
  uptime_stat: {
    type: 'string' as const,
    default: '99.9%'
  },
  uptime_label: {
    type: 'string' as const,
    default: 'Uptime SLA'
  },
  support_stat: {
    type: 'string' as const,
    default: '24/7'
  },
  support_label: {
    type: 'string' as const,
    default: 'Enterprise support'
  }
};

// Parse testimonial data from pipe-separated strings
const parseVideoTestimonialData = (blockContent: VideoTestimonialsContent): VideoTestimonialItem[] => {
  const titles = parsePipeData(blockContent.video_titles);
  const descriptions = parsePipeData(blockContent.video_descriptions);
  const videoUrls = parsePipeData(blockContent.video_urls || '');
  const thumbnails = parsePipeData(blockContent.video_thumbnails || '');
  const customerNames = parsePipeData(blockContent.customer_names);
  const customerTitles = parsePipeData(blockContent.customer_titles);
  const customerCompanies = parsePipeData(blockContent.customer_companies);
  
  return titles.map((title, index) => ({
    id: `video-testimonial-${index}`,
    index,
    title,
    description: descriptions[index] || 'Video description not provided.',
    videoUrl: videoUrls[index] || '',
    thumbnail: thumbnails[index] || '',
    customerName: customerNames[index] || 'Anonymous',
    customerTitle: customerTitles[index] || '',
    customerCompany: customerCompanies[index] || ''
  }));
};

const VideoTestimonialCard = React.memo(({ 
  item,
  mode,
  colorTokens,
  dynamicTextColors,
  getTextStyle,
  onTitleEdit,
  onDescriptionEdit,
  onVideoUrlEdit,
  onCustomerNameEdit,
  onCustomerTitleEdit,
  onCustomerCompanyEdit,
  sectionId,
  backgroundType,
  sectionBackground,
  showImageToolbar,
  h4Style
}: {
  item: VideoTestimonialItem;
  mode: 'edit' | 'preview';
  colorTokens: any;
  dynamicTextColors: any;
  getTextStyle: any;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onVideoUrlEdit: (index: number, value: string) => void;
  onCustomerNameEdit: (index: number, value: string) => void;
  onCustomerTitleEdit: (index: number, value: string) => void;
  onCustomerCompanyEdit: (index: number, value: string) => void;
  sectionId: string;
  backgroundType: string;
  sectionBackground: string;
  showImageToolbar: any;
  h4Style: any;
}) => {
  
  const VideoPlayer = () => {
    if (item.videoUrl && item.videoUrl.includes('youtube')) {
      return (
        <iframe
          src={item.videoUrl}
          title={item.title}
          className="w-full h-full rounded-xl"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl overflow-hidden group cursor-pointer">
        {item.thumbnail && item.thumbnail !== '' ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            data-image-id={`${sectionId}-video${item.index}-thumbnail`}
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
              <div className="text-sm font-medium">{item.customerName}</div>
              <div className="text-xs text-white/80">{item.customerCompany}</div>
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
            {item.customerName.charAt(0)}
          </div>
          <div className="flex-1">
            <EditableAdaptiveText
              mode={mode}
              value={item.customerName}
              onEdit={(value) => onCustomerNameEdit(item.index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="font-semibold text-gray-900"
              placeholder="Customer name..."
              sectionId={sectionId}
              elementKey={`customer_name_${item.index}`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={item.customerTitle}
              onEdit={(value) => onCustomerTitleEdit(item.index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm text-gray-600"
              placeholder="Customer title..."
              sectionId={sectionId}
              elementKey={`customer_title_${item.index}`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={item.customerCompany}
              onEdit={(value) => onCustomerCompanyEdit(item.index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm text-blue-600 font-medium"
              placeholder="Customer company..."
              sectionId={sectionId}
              elementKey={`customer_company_${item.index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        </div>
        
        <EditableAdaptiveText
          mode={mode}
          value={item.title}
          onEdit={(value) => onTitleEdit(item.index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          textStyle={{
            ...h4Style,
            fontWeight: 700
          }}
          className="font-bold text-gray-900 mb-3"
          placeholder="Video testimonial title..."
          sectionId={sectionId}
          elementKey={`video_title_${item.index}`}
          sectionBackground={sectionBackground}
        />
        
        <EditableAdaptiveText
          mode={mode}
          value={item.description}
          onEdit={(value) => onDescriptionEdit(item.index, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-600 leading-relaxed text-sm mb-4"
          placeholder="Video testimonial description..."
          sectionId={sectionId}
          elementKey={`video_description_${item.index}`}
          sectionBackground={sectionBackground}
        />
        
        {/* Video URL Input for Edit Mode */}
        {mode === 'edit' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="block text-xs font-medium text-gray-600 mb-1">Video URL</label>
            <EditableAdaptiveText
              mode={mode}
              value={item.videoUrl || ''}
              onEdit={(value) => onVideoUrlEdit(item.index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-sm text-gray-700"
              placeholder="https://www.youtube.com/embed/..."
              sectionId={sectionId}
              elementKey={`video_url_${item.index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        )}
        
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
VideoTestimonialCard.displayName = 'VideoTestimonialCard';

// Parse video testimonial data from pipe-separated strings

export default function VideoTestimonials(props: LayoutComponentProps) {
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
  } = useLayoutComponent<VideoTestimonialsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Parse testimonial data using the new utility function
  const testimonialItems = parseVideoTestimonialData(blockContent);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Individual edit handlers for testimonial fields
  const handleTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.video_titles, index, value);
    handleContentUpdate('video_titles', updatedTitles);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.video_descriptions, index, value);
    handleContentUpdate('video_descriptions', updatedDescriptions);
  };

  const handleVideoUrlEdit = (index: number, value: string) => {
    const updatedUrls = updateListData(blockContent.video_urls || '', index, value);
    handleContentUpdate('video_urls', updatedUrls);
  };

  const handleCustomerNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.customer_names, index, value);
    handleContentUpdate('customer_names', updatedNames);
  };

  const handleCustomerTitleEdit = (index: number, value: string) => {
    const updatedTitles = updateListData(blockContent.customer_titles, index, value);
    handleContentUpdate('customer_titles', updatedTitles);
  };

  const handleCustomerCompanyEdit = (index: number, value: string) => {
    const updatedCompanies = updateListData(blockContent.customer_companies, index, value);
    handleContentUpdate('customer_companies', updatedCompanies);
  };
  
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
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your video testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* WYSIWYG Video Testimonial Cards - Always visible in both edit and preview modes */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {testimonialItems.map((item) => (
            <VideoTestimonialCard
              key={item.id}
              item={item}
              mode={mode}
              colorTokens={colorTokens}
              dynamicTextColors={dynamicTextColors}
              getTextStyle={getTextStyle}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onVideoUrlEdit={handleVideoUrlEdit}
              onCustomerNameEdit={handleCustomerNameEdit}
              onCustomerTitleEdit={handleCustomerTitleEdit}
              onCustomerCompanyEdit={handleCustomerCompanyEdit}
              sectionId={sectionId}
              backgroundType={safeBackgroundType}
              sectionBackground={sectionBackground}
              showImageToolbar={showImageToolbar}
              h4Style={h4Style}
            />
          ))}
        </div>

        {/* Enterprise Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.industry_leaders_title || ''}
              onEdit={(value) => handleContentUpdate('industry_leaders_title', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              style={h3Style}
              className="font-semibold text-gray-900 mb-6"
              placeholder="Industry leaders title..."
              sectionId={sectionId}
              elementKey="industry_leaders_title"
              sectionBackground={sectionBackground}
            />
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_customers_stat || ''}
                  onEdit={(value) => handleContentUpdate('enterprise_customers_stat', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-blue-600 mb-2"
                  placeholder="Enterprise customers stat..."
                  sectionId={sectionId}
                  elementKey="enterprise_customers_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_customers_label || ''}
                  onEdit={(value) => handleContentUpdate('enterprise_customers_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Enterprise customers label..."
                  sectionId={sectionId}
                  elementKey="enterprise_customers_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.uptime_stat || ''}
                  onEdit={(value) => handleContentUpdate('uptime_stat', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-green-600 mb-2"
                  placeholder="Uptime stat..."
                  sectionId={sectionId}
                  elementKey="uptime_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.uptime_label || ''}
                  onEdit={(value) => handleContentUpdate('uptime_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Uptime label..."
                  sectionId={sectionId}
                  elementKey="uptime_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_stat || ''}
                  onEdit={(value) => handleContentUpdate('support_stat', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-purple-600 mb-2"
                  placeholder="Support stat..."
                  sectionId={sectionId}
                  elementKey="support_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_label || ''}
                  onEdit={(value) => handleContentUpdate('support_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Support label..."
                  sectionId={sectionId}
                  elementKey="support_label"
                  sectionBackground={sectionBackground}
                />
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
  description: 'WYSIWYG video testimonials with direct inline editing. Enterprise-focused with individual card editing and video URL input.',
  tags: ['testimonial', 'video', 'enterprise', 'sales', 'trust', 'wysiwyg', 'inline-editing'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  // Element restriction information - based on IconGrid pattern
  elementRestrictions: {
    allowsUniversalElements: false,
    restrictionLevel: 'strict' as const,
    reason: "Video testimonial layouts use precise card arrangements with structured testimonial data that additional elements would disrupt",
    alternativeSuggestions: [
      "Edit testimonial titles, descriptions, and customer details directly on each card",
      "Add video URLs through the textbox input in edit mode",
      "Modify the headline and subheadline for section introduction",
      "Edit enterprise trust indicators and statistics inline",
      "Switch to a flexible content section for custom elements"
    ]
  },
  
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'industry_leaders_title', label: 'Industry Leaders Title', type: 'text', required: false },
    { key: 'enterprise_customers_stat', label: 'Enterprise Customers Statistic', type: 'text', required: false },
    { key: 'enterprise_customers_label', label: 'Enterprise Customers Label', type: 'text', required: false },
    { key: 'uptime_stat', label: 'Uptime Statistic', type: 'text', required: false },
    { key: 'uptime_label', label: 'Uptime Label', type: 'text', required: false },
    { key: 'support_stat', label: 'Support Statistic', type: 'text', required: false },
    { key: 'support_label', label: 'Support Label', type: 'text', required: false }
  ],
  
  features: [
    '✅ WYSIWYG editing - same view in edit and preview modes',
    '✅ Direct inline editing of all testimonial text fields',
    '✅ Individual video URL input through textboxes',
    '✅ Real-time editable customer names, titles, and companies',
    '✅ Professional video testimonial card layout',
    '✅ Enterprise customer showcase with trust indicators',
    '✅ Video thumbnail support with image toolbar integration',
    '✅ Responsive grid layout (2 columns on desktop)',
    '✅ Consistent editing experience like IconGrid component'
  ],
  
  useCases: [
    'Enterprise software sales with video testimonials',
    'High-value product demonstrations requiring social proof',
    'B2B customer success story showcases',
    'Product-aware audience engagement campaigns',
    'Video testimonial campaigns with inline editing needs',
    'Sales pages requiring credible customer validation'
  ]
};