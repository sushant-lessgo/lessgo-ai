import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface LiteVsProVsEnterpriseContent {
  headline: string;
  subheadline?: string;
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  feature_categories: string;
  feature_items: string;
  tier_features: string;
  tier_ctas: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Choose the Plan That Fits Your Growth' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'From startup to enterprise, we scale with you.' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Starter|Professional|Enterprise' 
  },
  tier_prices: { 
    type: 'string' as const, 
    default: '$29/mo|$99/mo|Custom' 
  },
  tier_descriptions: { 
    type: 'string' as const, 
    default: 'Perfect for small teams getting started|For growing teams that need more power|For large organizations with complex needs' 
  },
  feature_categories: { 
    type: 'string' as const, 
    default: 'Core Features|Advanced Features|Enterprise Features' 
  },
  feature_items: { 
    type: 'string' as const, 
    default: 'Up to 5 users,Basic integrations,Email support|Unlimited users,Advanced integrations,Priority support|Custom user limits,API access,Custom integrations|SSO & SAML,Dedicated account manager,SLA guarantee' 
  },
  tier_features: { 
    type: 'string' as const, 
    default: 'y,y,y,n,n,n,n,n,n|y,y,y,y,y,y,n,n,n|y,y,y,y,y,y,y,y,y' 
  },
  tier_ctas: { 
    type: 'string' as const, 
    default: 'Start Free Trial|Start Free Trial|Contact Sales' 
  }
};

// LiteVsProVsEnterprise component - Tiered product comparison
export default function LiteVsProVsEnterprise({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: LayoutComponentProps) {
  const {
    content,
    fonts,
    colorTokens,
    mode,
    handleContentUpdate,
    handleListUpdate
  } = useLayoutComponent(sectionId);

  // Extract content with defaults
  const blockContent: LiteVsProVsEnterpriseContent = Object.entries(CONTENT_SCHEMA).reduce((acc, [key, schema]) => {
    acc[key] = content?.[key] || schema.default;
    return acc;
  }, {} as LiteVsProVsEnterpriseContent);

  // Parse data
  const tierNames = parsePipeData(blockContent.tier_names);
  const tierPrices = parsePipeData(blockContent.tier_prices);
  const tierDescriptions = parsePipeData(blockContent.tier_descriptions);
  const featureCategories = parsePipeData(blockContent.feature_categories);
  const featureItemsRaw = blockContent.feature_items.split('|');
  const tierFeatures = blockContent.tier_features.split('|').map(tier => tier.split(','));
  const tierCtas = parsePipeData(blockContent.tier_ctas);

  // Parse all feature items
  const allFeatures: string[] = [];
  featureItemsRaw.forEach(categoryFeatures => {
    allFeatures.push(...categoryFeatures.split(',').map(f => f.trim()));
  });

  // Update handlers
  const handleTierNameUpdate = (index: number, value: string) => {
    handleListUpdate(tierNames, index, value, 'tier_names');
  };

  const handleTierPriceUpdate = (index: number, value: string) => {
    handleListUpdate(tierPrices, index, value, 'tier_prices');
  };

  const handleTierDescriptionUpdate = (index: number, value: string) => {
    handleListUpdate(tierDescriptions, index, value, 'tier_descriptions');
  };

  const handleTierCtaUpdate = (index: number, value: string) => {
    handleListUpdate(tierCtas, index, value, 'tier_ctas');
  };

  // Check if tier is recommended (middle tier)
  const isRecommended = (index: number) => index === 1;

  return (
    <LayoutSection
      sectionId={sectionId}
      className={className}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            content={blockContent.headline}
            mode={mode}
            onUpdate={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            fonts={fonts}
            colorTokens={colorTokens}
            variant="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              content={blockContent.subheadline || 'Add subheadline...'}
              mode={mode}
              onUpdate={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-2xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              fonts={fonts}
              colorTokens={colorTokens}
              variant="body-lg"
            />
          )}
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tierNames.map((name, tierIndex) => (
            <div 
              key={tierIndex} 
              className={`rounded-lg ${
                isRecommended(tierIndex) 
                  ? `ring-2 ring-${colorTokens.textAccent.replace('text-', '')} shadow-xl` 
                  : 'shadow-lg'
              } ${colorTokens.bgNeutral} overflow-hidden`}
            >
              {/* Recommended Badge */}
              {isRecommended(tierIndex) && (
                <div className={`${colorTokens.bgAccent} text-white text-center py-2 text-sm font-semibold`}>
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Tier Name */}
                {mode === 'edit' ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleTierNameUpdate(tierIndex, e.target.value)}
                    className={`text-2xl font-bold bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-2 ${colorTokens.textPrimary}`}
                    style={fonts.h2}
                  />
                ) : (
                  <h3 className={`text-2xl font-bold mb-2 ${colorTokens.textPrimary}`} style={fonts.h2}>
                    {name}
                  </h3>
                )}

                {/* Price */}
                {mode === 'edit' ? (
                  <input
                    type="text"
                    value={tierPrices[tierIndex]}
                    onChange={(e) => handleTierPriceUpdate(tierIndex, e.target.value)}
                    className={`text-4xl font-bold bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-4 ${
                      isRecommended(tierIndex) ? colorTokens.textAccent : colorTokens.textPrimary
                    }`}
                  />
                ) : (
                  <div className={`text-4xl font-bold mb-4 ${
                    isRecommended(tierIndex) ? colorTokens.textAccent : colorTokens.textPrimary
                  }`}>
                    {tierPrices[tierIndex]}
                  </div>
                )}

                {/* Description */}
                {mode === 'edit' ? (
                  <textarea
                    value={tierDescriptions[tierIndex]}
                    onChange={(e) => handleTierDescriptionUpdate(tierIndex, e.target.value)}
                    className={`w-full bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-6 resize-none ${colorTokens.textSecondary}`}
                    style={fonts.body}
                    rows={2}
                  />
                ) : (
                  <p className={`mb-6 ${colorTokens.textSecondary}`} style={fonts.body}>
                    {tierDescriptions[tierIndex]}
                  </p>
                )}

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {allFeatures.map((feature, featureIndex) => {
                    const hasFeature = tierFeatures[tierIndex]?.[featureIndex] === 'y';
                    
                    return (
                      <div key={featureIndex} className="flex items-start">
                        {hasFeature ? (
                          <svg className={`w-5 h-5 ${colorTokens.textAccent} mr-3 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                        <span className={`text-sm ${hasFeature ? colorTokens.textPrimary : 'text-gray-400'}`} style={fonts.body}>
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isRecommended(tierIndex)
                    ? `${colorTokens.bgAccent} text-white hover:opacity-90`
                    : `${colorTokens.bgNeutral} border-2 ${colorTokens.borderColor} ${colorTokens.textPrimary} hover:border-${colorTokens.textAccent.replace('text-', '')}`
                }`}>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={tierCtas[tierIndex]}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTierCtaUpdate(tierIndex, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 text-center w-full"
                      style={fonts.button}
                    />
                  ) : (
                    <span style={fonts.button}>{tierCtas[tierIndex]}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}