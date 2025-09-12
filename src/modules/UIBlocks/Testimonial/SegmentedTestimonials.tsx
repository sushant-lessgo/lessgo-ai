import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
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
  segments_trust_title?: string;
  enterprise_stat?: string;
  enterprise_label?: string;
  agencies_stat?: string;
  agencies_label?: string;
  small_business_stat?: string;
  small_business_label?: string;
  dev_teams_stat?: string;
  dev_teams_label?: string;
  segment_icon_1?: string;
  segment_icon_2?: string;
  segment_icon_3?: string;
  segment_icon_4?: string;
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
  },
  segments_trust_title: {
    type: 'string' as const,
    default: 'Trusted Across All Segments'
  },
  enterprise_stat: {
    type: 'string' as const,
    default: 'Fortune 500'
  },
  enterprise_label: {
    type: 'string' as const,
    default: 'Enterprise clients'
  },
  agencies_stat: {
    type: 'string' as const,
    default: '1000+'
  },
  agencies_label: {
    type: 'string' as const,
    default: 'Marketing agencies'
  },
  small_business_stat: {
    type: 'string' as const,
    default: '10K+'
  },
  small_business_label: {
    type: 'string' as const,
    default: 'Small businesses'
  },
  dev_teams_stat: {
    type: 'string' as const,
    default: '500+'
  },
  dev_teams_label: {
    type: 'string' as const,
    default: 'Dev teams'
  },
  segment_icon_1: {
    type: 'string' as const,
    default: '🏢'
  },
  segment_icon_2: {
    type: 'string' as const,
    default: '📈'
  },
  segment_icon_3: {
    type: 'string' as const,
    default: '📈'
  },
  segment_icon_4: {
    type: 'string' as const,
    default: '💻'
  }
};

export default function SegmentedTestimonials(props: LayoutComponentProps) {
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
  } = useLayoutComponent<SegmentedTestimonialsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

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

  // Individual editing handlers following IconGrid pattern
  const handleSegmentNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.segment_names, index, value);
    handleContentUpdate('segment_names', updatedNames);
  };

  const handleSegmentDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.segment_descriptions, index, value);
    handleContentUpdate('segment_descriptions', updatedDescriptions);
  };

  const handleTestimonialQuoteEdit = (index: number, value: string) => {
    const updatedQuotes = updateListData(blockContent.testimonial_quotes, index, value);
    handleContentUpdate('testimonial_quotes', updatedQuotes);
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

  const handleUseCaseEdit = (index: number, value: string) => {
    const updatedUseCases = updateListData(blockContent.use_cases, index, value);
    handleContentUpdate('use_cases', updatedUseCases);
  };

  const getSegmentIcon = (index: number) => {
    const iconFields = ['segment_icon_1', 'segment_icon_2', 'segment_icon_3', 'segment_icon_4'];
    const iconField = iconFields[index] as keyof SegmentedTestimonialsContent;
    return blockContent[iconField] || ['🏢', '📈', '📈', '💻'][index];
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
      <div
        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left w-full cursor-pointer ${
          isActive 
            ? `${color.border} ${color.bgLight} shadow-lg` 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={() => setActiveSegment(index)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center text-white group/icon-edit relative`}>
            <IconEditableText
              mode={mode}
              value={getSegmentIcon(index)}
              onEdit={(value) => {
                const iconFields = ['segment_icon_1', 'segment_icon_2', 'segment_icon_3', 'segment_icon_4'];
                const iconField = iconFields[index] as keyof SegmentedTestimonialsContent;
                handleContentUpdate(iconField, value);
              }}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              iconSize="lg"
              className="text-2xl"
              sectionId={sectionId}
              elementKey={`segment_icon_${index + 1}`}
            />
          </div>
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            <EditableAdaptiveText
              mode={mode}
              value={segment.name}
              onEdit={(value) => handleSegmentNameEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className={`font-semibold ${isActive ? color.text : 'text-gray-900'}`}
              placeholder="Segment name..."
              sectionId={sectionId}
              elementKey={`segment_name_${index}`}
              sectionBackground={sectionBackground}
            />
            <EditableAdaptiveText
              mode={mode}
              value={segment.description}
              onEdit={(value) => handleSegmentDescriptionEdit(index, value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className={`text-sm mt-1 ${isActive ? 'text-gray-700' : 'text-gray-600'}`}
              placeholder="Segment description..."
              sectionId={sectionId}
              elementKey={`segment_description_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        </div>
      </div>
    );
  };

  const activeSegmentData = segments[activeSegment];
  const activeColor = getSegmentColor(activeSegment);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SegmentedTestimonials"
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
              placeholder="Add optional subheadline to introduce segmented testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Segment Tabs */}
          <div className="space-y-4">
            <h3 style={h3Style} className="font-semibold text-gray-900 mb-6">Choose Your Industry</h3>
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
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${activeColor.bg} flex items-center justify-center text-white group/icon-edit relative`}>
                      <IconEditableText
                        mode={mode}
                        value={getSegmentIcon(activeSegment)}
                        onEdit={(value) => {
                          const iconFields = ['segment_icon_1', 'segment_icon_2', 'segment_icon_3', 'segment_icon_4'];
                          const iconField = iconFields[activeSegment] as keyof SegmentedTestimonialsContent;
                          handleContentUpdate(iconField, value);
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        iconSize="lg"
                        className="text-2xl"
                        sectionId={sectionId}
                        elementKey={`segment_icon_${activeSegment + 1}`}
                      />
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg ${activeColor.text}`}>
                        {activeSegmentData.name}
                      </h4>
                      <StarRating rating={activeSegmentData.rating} size="small" />
                    </div>
                  </div>
                </div>
                
                {/* Testimonial Content */}
                <div className="p-6">
                  <EditableAdaptiveText
                    mode={mode}
                    value={activeSegmentData.quote}
                    onEdit={(value) => handleTestimonialQuoteEdit(activeSegment, value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={bodyLgStyle}
                    className="text-gray-800 leading-relaxed mb-6"
                    placeholder="Testimonial quote..."
                    sectionId={sectionId}
                    elementKey={`testimonial_quote_${activeSegment}`}
                    sectionBackground={sectionBackground}
                  />
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${activeColor.bg} flex items-center justify-center text-white font-bold`}>
                      {activeSegmentData.customerName.charAt(0)}
                    </div>
                    <div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={activeSegmentData.customerName}
                        onEdit={(value) => handleCustomerNameEdit(activeSegment, value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="font-semibold text-gray-900"
                        placeholder="Customer name..."
                        sectionId={sectionId}
                        elementKey={`customer_name_${activeSegment}`}
                        sectionBackground={sectionBackground}
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={activeSegmentData.customerTitle}
                        onEdit={(value) => handleCustomerTitleEdit(activeSegment, value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-gray-600"
                        placeholder="Customer title..."
                        sectionId={sectionId}
                        elementKey={`customer_title_${activeSegment}`}
                        sectionBackground={sectionBackground}
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={activeSegmentData.customerCompany}
                        onEdit={(value) => handleCustomerCompanyEdit(activeSegment, value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className={`text-sm font-medium ${activeColor.text}`}
                        placeholder="Customer company..."
                        sectionId={sectionId}
                        elementKey={`customer_company_${activeSegment}`}
                        sectionBackground={sectionBackground}
                      />
                    </div>
                  </div>
                  
                  {/* Use Cases */}
                  {(activeSegmentData.useCase || mode === 'edit') && (
                    <div className={`p-4 ${activeColor.bgLight} rounded-lg border ${activeColor.border}`}>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Common Use Cases:</div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={activeSegmentData.useCase}
                        onEdit={(value) => handleUseCaseEdit(activeSegment, value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm text-gray-600"
                        placeholder="Describe common use cases..."
                        sectionId={sectionId}
                        elementKey={`use_case_${activeSegment}`}
                        sectionBackground={sectionBackground}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Industry Trust Indicators */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
          <div className="text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.segments_trust_title || ''}
              onEdit={(value) => handleContentUpdate('segments_trust_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={h3Style}
              className="font-semibold text-gray-900 mb-6"
              placeholder="Segments trust title..."
              sectionId={sectionId}
              elementKey="segments_trust_title"
              sectionBackground={sectionBackground}
            />
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_stat || ''}
                  onEdit={(value) => handleContentUpdate('enterprise_stat', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-blue-600 mb-2"
                  placeholder="Enterprise stat..."
                  sectionId={sectionId}
                  elementKey="enterprise_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_label || ''}
                  onEdit={(value) => handleContentUpdate('enterprise_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Enterprise label..."
                  sectionId={sectionId}
                  elementKey="enterprise_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.agencies_stat || ''}
                  onEdit={(value) => handleContentUpdate('agencies_stat', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-green-600 mb-2"
                  placeholder="Agencies stat..."
                  sectionId={sectionId}
                  elementKey="agencies_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.agencies_label || ''}
                  onEdit={(value) => handleContentUpdate('agencies_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Agencies label..."
                  sectionId={sectionId}
                  elementKey="agencies_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.small_business_stat || ''}
                  onEdit={(value) => handleContentUpdate('small_business_stat', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-purple-600 mb-2"
                  placeholder="Small business stat..."
                  sectionId={sectionId}
                  elementKey="small_business_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.small_business_label || ''}
                  onEdit={(value) => handleContentUpdate('small_business_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Small business label..."
                  sectionId={sectionId}
                  elementKey="small_business_label"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.dev_teams_stat || ''}
                  onEdit={(value) => handleContentUpdate('dev_teams_stat', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-3xl font-bold text-orange-600 mb-2"
                  placeholder="Dev teams stat..."
                  sectionId={sectionId}
                  elementKey="dev_teams_stat"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.dev_teams_label || ''}
                  onEdit={(value) => handleContentUpdate('dev_teams_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Dev teams label..."
                  sectionId={sectionId}
                  elementKey="dev_teams_label"
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
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'segments_trust_title', label: 'Segments Trust Title', type: 'text', required: false },
    { key: 'enterprise_stat', label: 'Enterprise Statistic', type: 'text', required: false },
    { key: 'enterprise_label', label: 'Enterprise Label', type: 'text', required: false },
    { key: 'agencies_stat', label: 'Agencies Statistic', type: 'text', required: false },
    { key: 'agencies_label', label: 'Agencies Label', type: 'text', required: false },
    { key: 'small_business_stat', label: 'Small Business Statistic', type: 'text', required: false },
    { key: 'small_business_label', label: 'Small Business Label', type: 'text', required: false },
    { key: 'dev_teams_stat', label: 'Dev Teams Statistic', type: 'text', required: false },
    { key: 'dev_teams_label', label: 'Dev Teams Label', type: 'text', required: false }
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