import React, { useState } from 'react';
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

interface SegmentBasedPricingContent {
  headline: string;
  segment_names: string;
  segment_descriptions: string;
  segment_use_cases: string;
  tier_names: string;
  tier_prices: string;
  tier_features: string;
  cta_texts: string;
  recommended_tiers?: string;
  segment_icons?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  // Segment comparison section
  segment_comparison_title?: string;
  segment_comparison_desc?: string;
  show_segment_comparison?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Pricing Tailored to Your Business Type' 
  },
  segment_names: { 
    type: 'string' as const, 
    default: 'Small Business|Growing Company|Enterprise|Agency' 
  },
  segment_descriptions: { 
    type: 'string' as const, 
    default: 'Perfect for small teams and startups getting organized|Ideal for growing businesses that need more power|Enterprise solutions for large organizations|Specialized tools for agencies and service providers' 
  },
  segment_use_cases: { 
    type: 'string' as const, 
    default: 'Project management, team collaboration, basic reporting|Advanced workflows, custom integrations, detailed analytics|Enterprise security, compliance, dedicated support|Client management, white-label solutions, multi-client reporting' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Basic|Professional|Enterprise;Starter|Business|Premium;Corporate|Enterprise|Ultimate;Agency|Pro Agency|Enterprise Agency' 
  },
  tier_prices: { 
    type: 'string' as const, 
    default: '$19/month|$49/month|$99/month;$39/month|$89/month|$179/month;Contact Sales|Contact Sales|Contact Sales;$59/month|$129/month|$249/month' 
  },
  tier_features: { 
    type: 'string' as const, 
    default: 'Up to 10 projects,5GB storage,Basic support|Up to 50 projects,50GB storage,Priority support,Basic integrations|Unlimited projects,Unlimited storage,24/7 support,Advanced integrations;Up to 25 projects,25GB storage,Advanced workflows|Up to 100 projects,100GB storage,Custom integrations,Analytics|Unlimited everything,Advanced security,Dedicated manager;Custom implementation,Enterprise security,SSO integration|Advanced compliance,Audit logs,Custom training|Ultimate customization,White-glove onboarding,Dedicated infrastructure;Up to 10 clients,Client portals,Basic branding|Up to 50 clients,White-label solutions,Advanced reporting|Unlimited clients,Custom branding,Multi-client dashboards' 
  },
  cta_texts: { 
    type: 'string' as const, 
    default: 'Start Free Trial|Start Free Trial|Contact Sales;Start Free Trial|Start Free Trial|Contact Sales;Contact Sales|Contact Sales|Contact Sales;Start Free Trial|Start Free Trial|Contact Sales' 
  },
  recommended_tiers: { 
    type: 'string' as const, 
    default: '1|1|2|1' 
  },
  segment_icons: { 
    type: 'string' as const, 
    default: 'building|trending-up|shield|users' 
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
  },
  // Segment comparison section
  segment_comparison_title: { 
    type: 'string' as const, 
    default: 'Why Segment-Specific Pricing?' 
  },
  segment_comparison_desc: { 
    type: 'string' as const, 
    default: 'Tailored for your specific needs and budget' 
  },
  show_segment_comparison: { 
    type: 'boolean' as const, 
    default: true 
  }
};

export default function SegmentBasedPricing(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SegmentBasedPricingContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const [activeSegment, setActiveSegment] = useState(0);

  const segmentNames = blockContent.segment_names 
    ? blockContent.segment_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const segmentDescriptions = blockContent.segment_descriptions 
    ? blockContent.segment_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const segmentUseCases = blockContent.segment_use_cases 
    ? blockContent.segment_use_cases.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const segmentIcons = blockContent.segment_icons 
    ? blockContent.segment_icons.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const recommendedTiers = blockContent.recommended_tiers 
    ? blockContent.recommended_tiers.split('|').map(item => parseInt(item.trim()) || 0)
    : [];

  // Parse segment-specific pricing
  const tierNamesBySegment = blockContent.tier_names 
    ? blockContent.tier_names.split(';').map(segment => 
        segment.split('|').map(item => item.trim()).filter(Boolean)
      )
    : [];

  const tierPricesBySegment = blockContent.tier_prices 
    ? blockContent.tier_prices.split(';').map(segment => 
        segment.split('|').map(item => item.trim()).filter(Boolean)
      )
    : [];

  const tierFeaturesBySegment = blockContent.tier_features 
    ? blockContent.tier_features.split(';').map(segment => 
        segment.split('|').map(item => 
          item.split(',').map(feature => feature.trim()).filter(Boolean)
        )
      )
    : [];

  const ctaTextsBySegment = blockContent.cta_texts 
    ? blockContent.cta_texts.split(';').map(segment => 
        segment.split('|').map(item => item.trim()).filter(Boolean)
      )
    : [];

  const segments = segmentNames.map((name, index) => ({
    name,
    description: segmentDescriptions[index] || '',
    useCases: segmentUseCases[index] || '',
    icon: segmentIcons[index] || 'building',
    recommendedTier: recommendedTiers[index] || 0,
    tiers: (tierNamesBySegment[index] || []).map((tierName, tierIndex) => ({
      name: tierName,
      price: (tierPricesBySegment[index] || [])[tierIndex] || '',
      features: (tierFeaturesBySegment[index] || [])[tierIndex] || [],
      ctaText: (ctaTextsBySegment[index] || [])[tierIndex] || 'Get Started'
    }))
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getSegmentIcon = (iconName: string) => {
    const icons = {
      building: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'trending-up': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      shield: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      users: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    };
    return icons[iconName as keyof typeof icons] || icons.building;
  };

  const getSegmentColor = (index: number) => {
    const colors = [
      { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      { bg: 'from-green-500 to-green-600', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }
    ];
    return colors[index % colors.length];
  };

  const activeSegmentData = segments[activeSegment] || { tiers: [] };
  const activeColor = getSegmentColor(activeSegment);

  const SegmentTab = ({ segment, index, isActive }: {
    segment: typeof segments[0];
    index: number;
    isActive: boolean;
  }) => {
    const color = getSegmentColor(index);
    
    return (
      <button
        onClick={() => setActiveSegment(index)}
        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left w-full ${
          isActive 
            ? `${color.border} ${color.light} shadow-lg` 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center text-white`}>
            {getSegmentIcon(segment.icon)}
          </div>
          <div className="flex-1">
            <h3 style={h3Style} className={`font-bold ${isActive ? color.text : 'text-gray-900'}`}>
              {segment.name}
            </h3>
            <p className={`text-sm mt-2 ${isActive ? 'text-gray-700' : 'text-gray-600'}`}>
              {segment.description}
            </p>
            <div className={`text-xs mt-3 ${mutedTextColor} italic`}>
              Common uses: {segment.useCases}
            </div>
          </div>
        </div>
      </button>
    );
  };

  const PricingCard = ({ tier, index, isRecommended }: {
    tier: typeof activeSegmentData.tiers[0];
    index: number;
    isRecommended: boolean;
  }) => (
    <div className={`relative bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
      isRecommended 
        ? `${activeColor.border} scale-105` 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      
      {isRecommended && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${activeColor.bg} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
          Recommended
        </div>
      )}

      <div className="text-center mb-6">
        <h4 style={h3Style} className="font-bold text-gray-900 mb-2">{tier.name}</h4>
        <div style={{...getTypographyStyle('h2'), fontSize: 'clamp(1.8rem, 3vw, 2rem)'}} className="font-bold text-gray-900 mb-4">{tier.price}</div>
      </div>

      <div className="space-y-3 mb-8">
        {tier.features.map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <CTAButton
        text={tier.ctaText}
        colorTokens={colorTokens}
        className="w-full"
        variant={isRecommended ? "primary" : "secondary"}
        sectionId={sectionId}
        elementKey={`cta_${activeSegment}_${index}`}
      />
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SegmentBasedPricing"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              className="mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce segment-based pricing..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 style={h4Style} className="font-semibold text-gray-700 mb-4">Segment-Based Pricing Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.segment_names || ''}
                  onEdit={(value) => handleContentUpdate('segment_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Segment names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="segment_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_names || ''}
                  onEdit={(value) => handleContentUpdate('tier_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Tier names by segment (semicolon for segments, pipe for tiers)"
                  sectionId={sectionId}
                  elementKey="tier_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_prices || ''}
                  onEdit={(value) => handleContentUpdate('tier_prices', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Tier prices by segment (semicolon for segments, pipe for tiers)"
                  sectionId={sectionId}
                  elementKey="tier_prices"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_features || ''}
                  onEdit={(value) => handleContentUpdate('tier_features', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Tier features by segment (semicolon for segments, pipe for tiers, comma for features)"
                  sectionId={sectionId}
                  elementKey="tier_features"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            
            {/* Segment Selection */}
            <div className="space-y-6">
              <h3 style={h3Style} className="font-semibold text-gray-900 mb-6">Choose Your Business Type</h3>
              {segments.map((segment, index) => (
                <SegmentTab
                  key={index}
                  segment={segment}
                  index={index}
                  isActive={activeSegment === index}
                />
              ))}
            </div>

            {/* Pricing for Active Segment */}
            <div className="lg:sticky lg:top-8">
              <div className={`p-6 rounded-2xl ${activeColor.light} border-2 ${activeColor.border} mb-8`}>
                <h3 style={{...h2Style, fontSize: 'clamp(1.5rem, 3vw, 2rem)'}} className={`font-bold ${activeColor.text} mb-4`}>
                  {activeSegmentData.name} Pricing
                </h3>
                <p className="text-gray-700">
                  {activeSegmentData.description}
                </p>
              </div>

              <div className="space-y-6">
                {activeSegmentData.tiers.map((tier, index) => (
                  <PricingCard
                    key={index}
                    tier={tier}
                    index={index}
                    isRecommended={index === activeSegmentData.recommendedTier}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Segment Comparison Summary */}
        {((blockContent.show_segment_comparison !== false && (blockContent.segment_comparison_title || blockContent.segment_comparison_desc)) || mode === 'edit') && (
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100 mb-12">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.segment_comparison_title || ''}
                onEdit={(value) => handleContentUpdate('segment_comparison_title', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                style={h3Style}
                className="font-semibold text-gray-900 mb-8"
                placeholder="Segment comparison section title"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="segment_comparison_title"
              />
              
              <div className="grid md:grid-cols-4 gap-8">
                {segments.map((segment, index) => {
                  const color = getSegmentColor(index);
                  return (
                    <div key={index} className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-white`}>
                        {getSegmentIcon(segment.icon)}
                      </div>
                      <div className="font-semibold text-gray-900 mb-2">{segment.name}</div>
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.segment_comparison_desc || ''}
                        onEdit={(value) => handleContentUpdate('segment_comparison_desc', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className={`text-sm ${mutedTextColor}`}
                        placeholder="Segment description"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="segment_comparison_desc"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
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
                placeholder="Add optional supporting text to reinforce segment-based value..."
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
  name: 'SegmentBasedPricing',
  category: 'Pricing',
  description: 'Segment-specific pricing for diverse business types. Perfect for businesses/marketers and varied target audiences.',
  tags: ['pricing', 'segments', 'business-types', 'targeted', 'B2B'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'segment_names', label: 'Segment Names (pipe separated)', type: 'text', required: true },
    { key: 'segment_descriptions', label: 'Segment Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'segment_use_cases', label: 'Segment Use Cases (pipe separated)', type: 'textarea', required: true },
    { key: 'tier_names', label: 'Tier Names by Segment (semicolon for segments, pipe for tiers)', type: 'textarea', required: true },
    { key: 'tier_prices', label: 'Tier Prices by Segment (semicolon for segments, pipe for tiers)', type: 'textarea', required: true },
    { key: 'tier_features', label: 'Tier Features by Segment (semicolon for segments, pipe for tiers, comma for features)', type: 'textarea', required: true },
    { key: 'cta_texts', label: 'CTA Texts by Segment (semicolon for segments, pipe for tiers)', type: 'textarea', required: true },
    { key: 'recommended_tiers', label: 'Recommended Tier Index per Segment (pipe separated)', type: 'text', required: false },
    { key: 'segment_icons', label: 'Segment Icons (pipe separated)', type: 'text', required: false },
    { key: 'segment_comparison_title', label: 'Segment Comparison Section Title', type: 'text', required: false },
    { key: 'segment_comparison_desc', label: 'Segment Comparison Description', type: 'text', required: false },
    { key: 'show_segment_comparison', label: 'Show Segment Comparison Section', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive segment selection',
    'Segment-specific pricing tiers',
    'Recommended plan highlighting',
    'Business type categorization',
    'Use case explanations',
    'Visual segment comparison'
  ],
  
  useCases: [
    'Multi-segment B2B products',
    'Business/marketing tools',
    'Diverse target audiences',
    'Industry-specific solutions',
    'Role-based pricing models'
  ]
};