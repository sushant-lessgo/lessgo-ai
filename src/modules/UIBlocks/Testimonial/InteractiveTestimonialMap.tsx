import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InteractiveTestimonialMapContent {
  headline: string;
  testimonial_quotes: string;
  customer_names: string;
  customer_locations: string;
  customer_countries: string;
  customer_titles: string;
  testimonial_categories: string;
  ratings?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  community_features_title?: string;
  global_reach_title?: string;
  global_reach_stat?: string;
  currency_title?: string;
  currency_description?: string;
  support_title?: string;
  support_description?: string;
  collaboration_title?: string;
  collaboration_description?: string;
  global_reach_icon?: string;
  currency_icon?: string;
  support_icon?: string;
  collaboration_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Creators Around the World Love Our Platform' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: `This tool revolutionized my creative workflow. I can now focus on what I love most - creating amazing content for my audience.|The global community and collaboration features are incredible. I've connected with creators worldwide and learned so much.|As an international freelancer, having a platform that works seamlessly across time zones and currencies is essential.|The creative freedom this platform provides is unmatched. I've been able to express my vision in ways I never thought possible.|Building my personal brand became so much easier with these tools. The engagement from my audience has tripled.|The cultural diversity of the community inspires me daily. Every creator brings something unique to the platform.` 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Elena Martinez|Kenji Tanaka|Amara Okafor|Lars Nielsen|Priya Sharma|Mateo Silva' 
  },
  customer_locations: { 
    type: 'string' as const, 
    default: 'Barcelona, Spain|Tokyo, Japan|Lagos, Nigeria|Copenhagen, Denmark|Mumbai, India|São Paulo, Brazil' 
  },
  customer_countries: { 
    type: 'string' as const, 
    default: 'Spain|Japan|Nigeria|Denmark|India|Brazil' 
  },
  customer_titles: { 
    type: 'string' as const, 
    default: 'Digital Artist|Content Creator|Brand Designer|UX Designer|Social Media Manager|Video Producer' 
  },
  testimonial_categories: { 
    type: 'string' as const, 
    default: 'Creative Tools|Community|Global Features|Creative Freedom|Personal Branding|Cultural Diversity' 
  },
  ratings: { 
    type: 'string' as const, 
    default: '5|5|4|5|5|4' 
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
  community_features_title: {
    type: 'string' as const,
    default: 'Built for a Global Creative Community'
  },
  global_reach_title: {
    type: 'string' as const,
    default: 'Global Reach'
  },
  global_reach_stat: {
    type: 'string' as const,
    default: '150+ countries'
  },
  currency_title: {
    type: 'string' as const,
    default: 'Multi-Currency'
  },
  currency_description: {
    type: 'string' as const,
    default: 'Local payments'
  },
  support_title: {
    type: 'string' as const,
    default: '24/7 Support'
  },
  support_description: {
    type: 'string' as const,
    default: 'All time zones'
  },
  collaboration_title: {
    type: 'string' as const,
    default: 'Collaboration'
  },
  collaboration_description: {
    type: 'string' as const,
    default: 'Cross-cultural'
  },
  global_reach_icon: {
    type: 'string' as const,
    default: '🌍'
  },
  currency_icon: {
    type: 'string' as const,
    default: '💰'
  },
  support_icon: {
    type: 'string' as const,
    default: '💬'
  },
  collaboration_icon: {
    type: 'string' as const,
    default: '❤️'
  }
};

export default function InteractiveTestimonialMap(props: LayoutComponentProps) {
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
  } = useLayoutComponent<InteractiveTestimonialMapContent>({
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

  const customerLocations = blockContent.customer_locations 
    ? blockContent.customer_locations.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerCountries = blockContent.customer_countries 
    ? blockContent.customer_countries.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const customerTitles = blockContent.customer_titles 
    ? blockContent.customer_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialCategories = blockContent.testimonial_categories 
    ? blockContent.testimonial_categories.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const ratings = blockContent.ratings 
    ? blockContent.ratings.split('|').map(item => parseInt(item.trim()) || 5)
    : [];

  const testimonials = testimonialQuotes.map((quote, index) => ({
    quote,
    customerName: customerNames[index] || '',
    location: customerLocations[index] || '',
    country: customerCountries[index] || '',
    title: customerTitles[index] || '',
    category: testimonialCategories[index] || '',
    rating: ratings[index] || 5
  }));

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('all');

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Simulated world map with regions
  const regions = [
    { name: 'all', label: 'Worldwide', count: testimonials.length },
    { name: 'americas', label: 'Americas', count: testimonials.filter(t => ['Brazil', 'USA', 'Canada'].includes(t.country)).length },
    { name: 'europe', label: 'Europe', count: testimonials.filter(t => ['Spain', 'Denmark', 'Germany'].includes(t.country)).length },
    { name: 'asia', label: 'Asia', count: testimonials.filter(t => ['Japan', 'India', 'China'].includes(t.country)).length },
    { name: 'africa', label: 'Africa', count: testimonials.filter(t => ['Nigeria', 'South Africa'].includes(t.country)).length }
  ];

  const getRegionColor = (region: string) => {
    const colors = {
      all: 'from-purple-500 to-pink-500',
      americas: 'from-blue-500 to-green-500',
      europe: 'from-indigo-500 to-purple-500',
      asia: 'from-orange-500 to-red-500',
      africa: 'from-green-500 to-teal-500'
    };
    return colors[region as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getCountryFlag = (country: string) => {
    const flags = {
      'Spain': '🇪🇸',
      'Japan': '🇯🇵',
      'Nigeria': '🇳🇬',
      'Denmark': '🇩🇰',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Germany': '🇩🇪',
      'China': '🇨🇳',
      'South Africa': '🇿🇦'
    };
    return flags[country as keyof typeof flags] || '🌍';
  };

  const filteredTestimonials = selectedRegion === 'all' 
    ? testimonials 
    : testimonials.filter(t => {
        switch (selectedRegion) {
          case 'americas': return ['Brazil', 'USA', 'Canada'].includes(t.country);
          case 'europe': return ['Spain', 'Denmark', 'Germany'].includes(t.country);
          case 'asia': return ['Japan', 'India', 'China'].includes(t.country);
          case 'africa': return ['Nigeria', 'South Africa'].includes(t.country);
          default: return true;
        }
      });

  const activeTestimonialData = filteredTestimonials[activeTestimonial] || testimonials[0];
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InteractiveTestimonialMap"
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
              placeholder="Add optional subheadline to introduce global testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Interactive Testimonial Map Content</h4>
              
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
                  value={blockContent.customer_locations || ''}
                  onEdit={(value) => handleContentUpdate('customer_locations', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Customer locations (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_locations"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.customer_countries || ''}
                  onEdit={(value) => handleContentUpdate('customer_countries', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Customer countries (pipe separated)"
                  sectionId={sectionId}
                  elementKey="customer_countries"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Region Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {regions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => {
                    setSelectedRegion(region.name);
                    setActiveTestimonial(0);
                  }}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedRegion === region.name
                      ? `bg-gradient-to-r ${getRegionColor(region.name)} text-white shadow-lg`
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {region.label} ({region.count})
                </button>
              ))}
            </div>

            {/* Interactive World Map Visualization */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              
              {/* Simulated World Map */}
              <div className="relative">
                <div className={`bg-gradient-to-br ${getRegionColor(selectedRegion)} rounded-2xl p-8 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                      {/* Simplified world map paths */}
                      <path d="M20,30 L40,25 L60,35 L80,30 L100,40 L120,35 L140,45 L160,40 L180,50 L180,70 L20,70 Z" fill="currentColor" opacity="0.3"/>
                      <path d="M30,50 L50,45 L70,55 L90,50 L110,60 L130,55 L150,65 L170,60 L170,80 L30,80 Z" fill="currentColor" opacity="0.2"/>
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 style={h2Style} className="font-bold mb-4">Global Creator Community</h3>
                    <div className="space-y-4">
                      {filteredTestimonials.slice(0, 4).map((testimonial, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTestimonial(index)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                            activeTestimonial === index 
                              ? 'bg-white/20 backdrop-blur-sm' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getCountryFlag(testimonial.country)}</span>
                            <div>
                              <div className="font-semibold">{testimonial.customerName}</div>
                              <div className="text-white/80 text-sm">{testimonial.location}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Testimonial */}
              <div className="space-y-6">
                {activeTestimonialData && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                          {activeTestimonialData.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">{activeTestimonialData.customerName}</div>
                          <div className="text-gray-600">{activeTestimonialData.title}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg">{getCountryFlag(activeTestimonialData.country)}</span>
                            <span className="text-sm text-gray-500">{activeTestimonialData.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <StarRating rating={activeTestimonialData.rating} size="small" />
                        <div className="text-xs text-gray-500 mt-1">{activeTestimonialData.category}</div>
                      </div>
                    </div>
                    
                    {/* Quote */}
                    <blockquote style={h3Style} className="text-gray-800 leading-relaxed mb-6">
                      "{activeTestimonialData.quote}"
                    </blockquote>
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setActiveTestimonial(activeTestimonial > 0 ? activeTestimonial - 1 : filteredTestimonials.length - 1)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm">Previous</span>
                      </button>
                      
                      <div className="text-sm text-gray-500">
                        {activeTestimonial + 1} of {filteredTestimonials.length}
                      </div>
                      
                      <button
                        onClick={() => setActiveTestimonial(activeTestimonial < filteredTestimonials.length - 1 ? activeTestimonial + 1 : 0)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        <span className="text-sm">Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Global Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">150+</div>
                    <div className="text-sm text-blue-700">Countries</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">50K+</div>
                    <div className="text-sm text-green-700">Global Creators</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Global Community Features */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-8 border border-purple-100 mb-12">
          <div className="text-center">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.community_features_title || ''}
              onEdit={(value) => handleContentUpdate('community_features_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={h3Style}
              className="font-semibold text-gray-900 mb-6"
              placeholder="Community features section title..."
              sectionId={sectionId}
              elementKey="community_features_title"
              sectionBackground={sectionBackground}
            />
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center text-white group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.global_reach_icon || '🌍'}
                    onEdit={(value) => handleContentUpdate('global_reach_icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    sectionId={sectionId}
                    elementKey="global_reach_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.global_reach_title || ''}
                  onEdit={(value) => handleContentUpdate('global_reach_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold text-gray-900"
                  placeholder="Global reach title..."
                  sectionId={sectionId}
                  elementKey="global_reach_title"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.global_reach_stat || ''}
                  onEdit={(value) => handleContentUpdate('global_reach_stat', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Global reach statistic..."
                  sectionId={sectionId}
                  elementKey="global_reach_stat"
                  sectionBackground={sectionBackground}
                />
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500 flex items-center justify-center text-white group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.currency_icon || '💰'}
                    onEdit={(value) => handleContentUpdate('currency_icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    sectionId={sectionId}
                    elementKey="currency_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.currency_title || ''}
                  onEdit={(value) => handleContentUpdate('currency_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold text-gray-900"
                  placeholder="Currency title..."
                  sectionId={sectionId}
                  elementKey="currency_title"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.currency_description || ''}
                  onEdit={(value) => handleContentUpdate('currency_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Currency description..."
                  sectionId={sectionId}
                  elementKey="currency_description"
                  sectionBackground={sectionBackground}
                />
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center text-white group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.support_icon || '💬'}
                    onEdit={(value) => handleContentUpdate('support_icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    sectionId={sectionId}
                    elementKey="support_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_title || ''}
                  onEdit={(value) => handleContentUpdate('support_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold text-gray-900"
                  placeholder="Support title..."
                  sectionId={sectionId}
                  elementKey="support_title"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.support_description || ''}
                  onEdit={(value) => handleContentUpdate('support_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Support description..."
                  sectionId={sectionId}
                  elementKey="support_description"
                  sectionBackground={sectionBackground}
                />
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500 flex items-center justify-center text-white group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.collaboration_icon || '❤️'}
                    onEdit={(value) => handleContentUpdate('collaboration_icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    sectionId={sectionId}
                    elementKey="collaboration_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.collaboration_title || ''}
                  onEdit={(value) => handleContentUpdate('collaboration_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold text-gray-900"
                  placeholder="Collaboration title..."
                  sectionId={sectionId}
                  elementKey="collaboration_title"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.collaboration_description || ''}
                  onEdit={(value) => handleContentUpdate('collaboration_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Collaboration description..."
                  sectionId={sectionId}
                  elementKey="collaboration_description"
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
                placeholder="Add optional supporting text to reinforce global community..."
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
  name: 'InteractiveTestimonialMap',
  category: 'Testimonial',
  description: 'Interactive global testimonial map for creators. Perfect for friendly/playful tone and founder/creator audiences.',
  tags: ['testimonial', 'interactive', 'global', 'map', 'creators'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: true },
    { key: 'customer_locations', label: 'Customer Locations (pipe separated)', type: 'text', required: true },
    { key: 'customer_countries', label: 'Customer Countries (pipe separated)', type: 'text', required: true },
    { key: 'customer_titles', label: 'Customer Titles (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_categories', label: 'Testimonial Categories (pipe separated)', type: 'text', required: true },
    { key: 'ratings', label: 'Ratings (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'community_features_title', label: 'Community Features Title', type: 'text', required: false },
    { key: 'global_reach_title', label: 'Global Reach Title', type: 'text', required: false },
    { key: 'global_reach_stat', label: 'Global Reach Statistic', type: 'text', required: false },
    { key: 'currency_title', label: 'Currency Feature Title', type: 'text', required: false },
    { key: 'currency_description', label: 'Currency Feature Description', type: 'text', required: false },
    { key: 'support_title', label: 'Support Feature Title', type: 'text', required: false },
    { key: 'support_description', label: 'Support Feature Description', type: 'text', required: false },
    { key: 'collaboration_title', label: 'Collaboration Feature Title', type: 'text', required: false },
    { key: 'collaboration_description', label: 'Collaboration Feature Description', type: 'text', required: false }
  ],
  
  features: [
    'Interactive global map visualization',
    'Regional filtering system',
    'Country flag integration',
    'Global community stats',
    'Multi-cultural appeal',
    'Perfect for creator audiences'
  ],
  
  useCases: [
    'Global creator platforms',
    'International communities',
    'Founder and creator audiences',
    'Friendly/playful tone products',
    'Cross-cultural testimonials'
  ]
};