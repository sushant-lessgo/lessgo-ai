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
    default: '🏢|📈|🛡️|👥' 
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
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left w-full relative group/segment-tab cursor-pointer ${
          isActive 
            ? `${color.border} ${color.light} shadow-lg` 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={() => setActiveSegment(index)}
      >
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center text-white`}>
            <IconEditableText
              mode={mode}
              value={segment.icon}
              onEdit={(value) => {
                const updatedIcons = segmentIcons.slice();
                updatedIcons[index] = value;
                handleContentUpdate('segment_icons', updatedIcons.join('|'));
              }}
              backgroundType="primary"
              colorTokens={colorTokens}
              iconSize="md"
              className="text-white text-xl"
              placeholder="🏢"
              sectionId={sectionId}
              elementKey={`segment_icon_${index}`}
            />
          </div>
          <div className="flex-1">
            {mode !== 'preview' ? (
              <>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const names = blockContent.segment_names.split('|');
                    names[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('segment_names', names.join('|'));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 ${isActive ? color.text : 'text-gray-900'}`}
                  style={h3Style}
                >
                  {segment.name}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const descriptions = blockContent.segment_descriptions.split('|');
                    descriptions[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('segment_descriptions', descriptions.join('|'));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-sm mt-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 ${isActive ? 'text-gray-700' : 'text-gray-600'}`}
                >
                  {segment.description}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const useCases = blockContent.segment_use_cases.split('|');
                    useCases[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('segment_use_cases', useCases.join('|'));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs mt-3 italic outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 ${mutedTextColor}`}
                >
                  Common uses: {segment.useCases}
                </div>
              </>
            ) : (
              <>
                <h3 style={h3Style} className={`font-bold ${isActive ? color.text : 'text-gray-900'}`}>
                  {segment.name}
                </h3>
                <p className={`text-sm mt-2 ${isActive ? 'text-gray-700' : 'text-gray-600'}`}>
                  {segment.description}
                </p>
                <div className={`text-xs mt-3 ${mutedTextColor} italic`}>
                  Common uses: {segment.useCases}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Remove segment button - only in edit mode and when we have more than 1 segment */}
        {mode === 'edit' && segments.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const removeFromPipeList = (value: string, indexToRemove: number) => {
                const items = value.split('|');
                items.splice(indexToRemove, 1);
                return items.join('|');
              };
              
              handleContentUpdate('segment_names', removeFromPipeList(blockContent.segment_names, index));
              handleContentUpdate('segment_descriptions', removeFromPipeList(blockContent.segment_descriptions, index));
              handleContentUpdate('segment_use_cases', removeFromPipeList(blockContent.segment_use_cases, index));
              handleContentUpdate('segment_icons', removeFromPipeList(blockContent.segment_icons || '', index));
              
              if (blockContent.recommended_tiers) {
                handleContentUpdate('recommended_tiers', removeFromPipeList(blockContent.recommended_tiers, index));
              }
              
              // Remove corresponding tier data
              const tierNames = blockContent.tier_names.split(';');
              const tierPrices = blockContent.tier_prices.split(';');
              const tierFeatures = blockContent.tier_features.split(';');
              const ctaTexts = blockContent.cta_texts.split(';');
              
              tierNames.splice(index, 1);
              tierPrices.splice(index, 1);
              tierFeatures.splice(index, 1);
              ctaTexts.splice(index, 1);
              
              handleContentUpdate('tier_names', tierNames.join(';'));
              handleContentUpdate('tier_prices', tierPrices.join(';'));
              handleContentUpdate('tier_features', tierFeatures.join(';'));
              handleContentUpdate('cta_texts', ctaTexts.join(';'));
              
              // Adjust active segment if needed
              if (activeSegment >= segments.length - 1) {
                setActiveSegment(Math.max(0, segments.length - 2));
              }
            }}
            className="opacity-0 group-hover/segment-tab:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
            title="Remove this segment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const PricingCard = ({ tier, index, isRecommended }: {
    tier: typeof activeSegmentData.tiers[0];
    index: number;
    isRecommended: boolean;
  }) => {
    const updateTierData = (field: 'name' | 'price', value: string) => {
      const fieldKey = `tier_${field}s` as keyof SegmentBasedPricingContent;
      const fieldValue = blockContent[fieldKey];
      const allTierData = typeof fieldValue === 'string' ? fieldValue.split(';') : [];
      const segmentTiers = allTierData[activeSegment]?.split('|') || [];
      segmentTiers[index] = value;
      allTierData[activeSegment] = segmentTiers.join('|');
      handleContentUpdate(`tier_${field}s`, allTierData.join(';'));
    };

    const updateTierFeature = (featureIndex: number, value: string) => {
      const allTierFeatures = blockContent.tier_features?.split(';') || [];
      const segmentTiers = allTierFeatures[activeSegment]?.split('|') || [];
      const tierFeatures = segmentTiers[index]?.split(',') || [];
      tierFeatures[featureIndex] = value;
      segmentTiers[index] = tierFeatures.join(',');
      allTierFeatures[activeSegment] = segmentTiers.join('|');
      handleContentUpdate('tier_features', allTierFeatures.join(';'));
    };

    const addFeature = () => {
      const allTierFeatures = blockContent.tier_features?.split(';') || [];
      const segmentTiers = allTierFeatures[activeSegment]?.split('|') || [];
      const tierFeatures = segmentTiers[index]?.split(',') || [];
      
      // Add meaningful default feature based on tier position
      const featureDefaults = [
        'Priority onboarding',
        'Advanced analytics',
        'API access',
        'Custom branding',
        'Dedicated support',
        'SSO integration',
        'Audit logs',
        'Custom workflows'
      ];
      
      const newFeature = featureDefaults[tierFeatures.length] || `Feature ${tierFeatures.length + 1}`;
      tierFeatures.push(newFeature);
      segmentTiers[index] = tierFeatures.join(',');
      allTierFeatures[activeSegment] = segmentTiers.join('|');
      handleContentUpdate('tier_features', allTierFeatures.join(';'));
    };

    const removeFeature = (featureIndex: number) => {
      const allTierFeatures = blockContent.tier_features?.split(';') || [];
      const segmentTiers = allTierFeatures[activeSegment]?.split('|') || [];
      const tierFeatures = segmentTiers[index]?.split(',') || [];
      tierFeatures.splice(featureIndex, 1);
      segmentTiers[index] = tierFeatures.join(',');
      allTierFeatures[activeSegment] = segmentTiers.join('|');
      handleContentUpdate('tier_features', allTierFeatures.join(';'));
    };

    return (
      <div className={`relative bg-white rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg group/pricing-card ${
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
          {mode !== 'preview' ? (
            <>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateTierData('name', e.currentTarget.textContent || '')}
                className="font-bold text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                style={h3Style}
              >
                {tier.name}
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateTierData('price', e.currentTarget.textContent || '')}
                className="font-bold text-gray-900 mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                style={{...getTypographyStyle('h2'), fontSize: 'clamp(1.8rem, 3vw, 2rem)'}}
              >
                {tier.price}
              </div>
            </>
          ) : (
            <>
              <h4 style={h3Style} className="font-bold text-gray-900 mb-2">{tier.name}</h4>
              <div style={{...getTypographyStyle('h2'), fontSize: 'clamp(1.8rem, 3vw, 2rem)'}} className="font-bold text-gray-900 mb-4">{tier.price}</div>
            </>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {tier.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-start space-x-3 group/feature-item relative">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {mode !== 'preview' ? (
                <>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateTierFeature(featureIndex, e.currentTarget.textContent || '')}
                    className="text-gray-700 text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                  >
                    {feature}
                  </div>
                  {tier.features.length > 1 && (
                    <button
                      onClick={() => removeFeature(featureIndex)}
                      className="opacity-0 group-hover/feature-item:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                      title="Remove feature"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-gray-700 text-sm">{feature}</span>
              )}
            </div>
          ))}
          
          {mode === 'edit' && (
            <button
              onClick={addFeature}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add feature</span>
            </button>
          )}
        </div>

        <CTAButton
          text={tier.ctaText}
          colorTokens={colorTokens}
          className="w-full"
          variant={isRecommended ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`cta_${activeSegment}_${index}`}
        />
        
        {/* Remove tier button - only in edit mode and when we have more than 1 tier */}
        {mode === 'edit' && activeSegmentData.tiers.length > 1 && (
          <button
            onClick={() => {
              // Remove this tier from the active segment
              const allTierNames = blockContent.tier_names?.split(';') || [];
              const allTierPrices = blockContent.tier_prices?.split(';') || [];
              const allTierFeatures = blockContent.tier_features?.split(';') || [];
              const allCtaTexts = blockContent.cta_texts?.split(';') || [];
              
              const segmentTierNames = allTierNames[activeSegment]?.split('|') || [];
              const segmentTierPrices = allTierPrices[activeSegment]?.split('|') || [];
              const segmentTierFeatures = allTierFeatures[activeSegment]?.split('|') || [];
              const segmentCtaTexts = allCtaTexts[activeSegment]?.split('|') || [];
              
              segmentTierNames.splice(index, 1);
              segmentTierPrices.splice(index, 1);
              segmentTierFeatures.splice(index, 1);
              segmentCtaTexts.splice(index, 1);
              
              allTierNames[activeSegment] = segmentTierNames.join('|');
              allTierPrices[activeSegment] = segmentTierPrices.join('|');
              allTierFeatures[activeSegment] = segmentTierFeatures.join('|');
              allCtaTexts[activeSegment] = segmentCtaTexts.join('|');
              
              handleContentUpdate('tier_names', allTierNames.join(';'));
              handleContentUpdate('tier_prices', allTierPrices.join(';'));
              handleContentUpdate('tier_features', allTierFeatures.join(';'));
              handleContentUpdate('cta_texts', allCtaTexts.join(';'));
            }}
            className="opacity-0 group-hover/pricing-card:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
            title="Remove this tier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };
  
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
              
              {/* Add segment button - only in edit mode */}
              {mode === 'edit' && (
                <button
                  onClick={() => {
                    const names = blockContent.segment_names.split('|');
                    const descriptions = blockContent.segment_descriptions.split('|');
                    const useCases = blockContent.segment_use_cases.split('|');
                    const icons = blockContent.segment_icons ? blockContent.segment_icons.split('|') : [];
                    const recommendedTiers = blockContent.recommended_tiers ? blockContent.recommended_tiers.split('|') : [];
                    
                    // Add new segment with smart defaults based on common business segments
                    const segmentDefaults = [
                      { name: 'Startup', desc: 'Perfect for new businesses just getting started', useCase: 'MVP development, basic analytics, small team collaboration', icon: '🚀' },
                      { name: 'Scale-up', desc: 'For rapidly growing companies expanding their operations', useCase: 'Advanced automation, team scaling, performance tracking', icon: '📊' },
                      { name: 'Non-profit', desc: 'Tailored solutions for non-profit organizations', useCase: 'Donor management, volunteer coordination, impact reporting', icon: '❤️' },
                      { name: 'Education', desc: 'Designed for educational institutions and teams', useCase: 'Student management, curriculum planning, collaborative learning', icon: '🎓' },
                      { name: 'Healthcare', desc: 'Compliant solutions for healthcare providers', useCase: 'HIPAA compliance, patient management, secure communications', icon: '🏥' }
                    ];
                    
                    const segmentNumber = names.length + 1;
                    const defaultSegment = segmentDefaults[names.length - 4] || {
                      name: `Custom Segment ${segmentNumber - 4}`,
                      desc: `Description for your custom segment ${segmentNumber - 4}`,
                      useCase: `Define use cases for this segment`,
                      icon: '🔧'
                    };
                    
                    names.push(defaultSegment.name);
                    descriptions.push(defaultSegment.desc);
                    useCases.push(defaultSegment.useCase);
                    icons.push(defaultSegment.icon);
                    recommendedTiers.push('1');
                    
                    handleContentUpdate('segment_names', names.join('|'));
                    handleContentUpdate('segment_descriptions', descriptions.join('|'));
                    handleContentUpdate('segment_use_cases', useCases.join('|'));
                    handleContentUpdate('segment_icons', icons.join('|'));
                    handleContentUpdate('recommended_tiers', recommendedTiers.join('|'));
                    
                    // Add default tier data for new segment with meaningful defaults
                    const tierNames = blockContent.tier_names.split(';');
                    const tierPrices = blockContent.tier_prices.split(';');
                    const tierFeatures = blockContent.tier_features.split(';');
                    const ctaTexts = blockContent.cta_texts.split(';');
                    
                    // Create tier defaults based on the segment type
                    const isStartup = defaultSegment.name === 'Startup';
                    const isNonProfit = defaultSegment.name === 'Non-profit';
                    const isEducation = defaultSegment.name === 'Education';
                    
                    if (isStartup) {
                      tierNames.push('Bootstrap|Growth|Scale');
                      tierPrices.push('$9/month|$39/month|$99/month');
                      tierFeatures.push('Up to 3 users,Core features,Community support|Up to 10 users,Advanced features,Email support|Unlimited users,All features,Priority support');
                    } else if (isNonProfit) {
                      tierNames.push('Volunteer|Organization|Foundation');
                      tierPrices.push('Free|$29/month|Custom');
                      tierFeatures.push('Up to 10 volunteers,Basic tools,Self-service|Up to 100 members,Donation tracking,Email support|Unlimited members,Grant management,Dedicated support');
                    } else if (isEducation) {
                      tierNames.push('Classroom|School|District');
                      tierPrices.push('$19/month|$99/month|Contact Sales');
                      tierFeatures.push('Up to 30 students,Basic LMS,Teacher tools|Up to 500 students,Advanced analytics,Parent portal|Unlimited students,Custom integrations,Training included');
                    } else {
                      tierNames.push('Essential|Professional|Enterprise');
                      tierPrices.push('$29/month|$79/month|Custom Pricing');
                      tierFeatures.push('Core features,5 users,Email support|Advanced features,25 users,Priority support|All features,Unlimited users,24/7 support');
                    }
                    
                    ctaTexts.push('Start Free Trial|Start Free Trial|Contact Sales');
                    
                    handleContentUpdate('tier_names', tierNames.join(';'));
                    handleContentUpdate('tier_prices', tierPrices.join(';'));
                    handleContentUpdate('tier_features', tierFeatures.join(';'));
                    handleContentUpdate('cta_texts', ctaTexts.join(';'));
                  }}
                  className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-300 border-2 border-dashed border-blue-300 hover:border-blue-400 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Segment</span>
                </button>
              )}
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
                
                {/* Add tier button - only in edit mode */}
                {mode === 'edit' && (
                  <button
                    onClick={() => {
                      const allTierNames = blockContent.tier_names?.split(';') || [];
                      const allTierPrices = blockContent.tier_prices?.split(';') || [];
                      const allTierFeatures = blockContent.tier_features?.split(';') || [];
                      const allCtaTexts = blockContent.cta_texts?.split(';') || [];
                      
                      const segmentTierNames = allTierNames[activeSegment]?.split('|') || [];
                      const segmentTierPrices = allTierPrices[activeSegment]?.split('|') || [];
                      const segmentTierFeatures = allTierFeatures[activeSegment]?.split('|') || [];
                      const segmentCtaTexts = allCtaTexts[activeSegment]?.split('|') || [];
                      
                      // Add new tier with smart defaults based on tier position
                      const tierNumber = segmentTierNames.length + 1;
                      const tierDefaults = [
                        { name: 'Starter', price: '$29/month', features: 'Up to 10 users,10GB storage,Email support', cta: 'Start Free Trial' },
                        { name: 'Professional', price: '$79/month', features: 'Up to 50 users,100GB storage,Priority support,Advanced features', cta: 'Start Free Trial' },
                        { name: 'Enterprise', price: 'Custom Pricing', features: 'Unlimited users,Unlimited storage,24/7 phone support,Custom integrations', cta: 'Contact Sales' },
                        { name: 'Ultimate', price: '$299/month', features: 'Everything in Enterprise,White-label options,Dedicated account manager,SLA guarantee', cta: 'Contact Sales' }
                      ];
                      
                      const defaultTier = tierDefaults[tierNumber - 1] || {
                        name: `Custom Tier ${tierNumber}`,
                        price: `$${(tierNumber * 50) + 49}/month`,
                        features: 'Define features,Add capabilities,Set limits',
                        cta: tierNumber > 3 ? 'Contact Sales' : 'Start Free Trial'
                      };
                      
                      segmentTierNames.push(defaultTier.name);
                      segmentTierPrices.push(defaultTier.price);
                      segmentTierFeatures.push(defaultTier.features);
                      segmentCtaTexts.push(defaultTier.cta);
                      
                      allTierNames[activeSegment] = segmentTierNames.join('|');
                      allTierPrices[activeSegment] = segmentTierPrices.join('|');
                      allTierFeatures[activeSegment] = segmentTierFeatures.join('|');
                      allCtaTexts[activeSegment] = segmentCtaTexts.join('|');
                      
                      handleContentUpdate('tier_names', allTierNames.join(';'));
                      handleContentUpdate('tier_prices', allTierPrices.join(';'));
                      handleContentUpdate('tier_features', allTierFeatures.join(';'));
                      handleContentUpdate('cta_texts', allCtaTexts.join(';'));
                    }}
                    className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-300 border-2 border-dashed border-blue-300 hover:border-blue-400 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Tier</span>
                  </button>
                )}
              </div>
            </div>
          </div>

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
                        <IconEditableText
                          mode={mode}
                          value={segment.icon}
                          onEdit={(value) => {
                            const updatedIcons = segmentIcons.slice();
                            updatedIcons[index] = value;
                            handleContentUpdate('segment_icons', updatedIcons.join('|'));
                          }}
                          backgroundType="primary"
                          colorTokens={colorTokens}
                          iconSize="lg"
                          className="text-white text-2xl"
                          placeholder="🏢"
                          sectionId={sectionId}
                          elementKey={`segment_comparison_icon_${index}`}
                        />
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