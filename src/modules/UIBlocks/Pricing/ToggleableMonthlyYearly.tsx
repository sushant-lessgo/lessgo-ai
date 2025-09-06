import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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

interface ToggleableMonthlyYearlyContent {
  headline: string;
  tier_names: string;
  monthly_prices: string;
  yearly_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  feature_lists: string;
  popular_tiers?: string;
  annual_discount_label?: string;
  billing_note?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  // Platform features section
  platform_feature_1?: string;
  platform_feature_1_title?: string;
  platform_feature_1_desc?: string;
  platform_feature_2?: string;
  platform_feature_2_title?: string;
  platform_feature_2_desc?: string;
  platform_feature_3?: string;
  platform_feature_3_title?: string;
  platform_feature_3_desc?: string;
  platform_feature_4?: string;
  platform_feature_4_title?: string;
  platform_feature_4_desc?: string;
  platform_features_title?: string;
  show_platform_features?: boolean;
  // Platform feature icons
  platform_feature_1_icon?: string;
  platform_feature_2_icon?: string;
  platform_feature_3_icon?: string;
  platform_feature_4_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Choose the Perfect Plan for Your Business' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Starter|Professional|Enterprise' 
  },
  monthly_prices: { 
    type: 'string' as const, 
    default: '$29|$79|$199' 
  },
  yearly_prices: { 
    type: 'string' as const, 
    default: '$290|$790|$1990' 
  },
  tier_descriptions: { 
    type: 'string' as const, 
    default: 'Perfect for small teams getting started|For growing businesses that need more power|Custom solutions for large organizations' 
  },
  cta_texts: { 
    type: 'string' as const, 
    default: 'Start Free Trial|Start Free Trial|Contact Sales' 
  },
  feature_lists: { 
    type: 'string' as const, 
    default: 'Up to 5 team members,10GB storage,Basic integrations,Email support|Up to 25 team members,100GB storage,Advanced integrations,Priority support,Custom branding|Unlimited team members,Unlimited storage,Enterprise integrations,Dedicated support,Advanced security' 
  },
  popular_tiers: { 
    type: 'string' as const, 
    default: 'false|true|false' 
  },
  annual_discount_label: { 
    type: 'string' as const, 
    default: 'Save 17% with annual billing' 
  },
  billing_note: { 
    type: 'string' as const, 
    default: 'All plans include 14-day free trial. No credit card required.' 
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
  // Platform features section
  platform_feature_1: { 
    type: 'string' as const, 
    default: 'free-trial' 
  },
  platform_feature_1_title: { 
    type: 'string' as const, 
    default: '14-Day Free Trial' 
  },
  platform_feature_1_desc: { 
    type: 'string' as const, 
    default: 'No credit card required' 
  },
  platform_feature_2: { 
    type: 'string' as const, 
    default: 'secure-reliable' 
  },
  platform_feature_2_title: { 
    type: 'string' as const, 
    default: 'Secure & Reliable' 
  },
  platform_feature_2_desc: { 
    type: 'string' as const, 
    default: 'Enterprise-grade security' 
  },
  platform_feature_3: { 
    type: 'string' as const, 
    default: 'support' 
  },
  platform_feature_3_title: { 
    type: 'string' as const, 
    default: '24/7 Support' 
  },
  platform_feature_3_desc: { 
    type: 'string' as const, 
    default: 'Always here to help' 
  },
  platform_feature_4: { 
    type: 'string' as const, 
    default: 'easy-migration' 
  },
  platform_feature_4_title: { 
    type: 'string' as const, 
    default: 'Easy Migration' 
  },
  platform_feature_4_desc: { 
    type: 'string' as const, 
    default: 'Switch plans anytime' 
  },
  platform_features_title: { 
    type: 'string' as const, 
    default: 'Why Choose Our Platform?' 
  },
  show_platform_features: { 
    type: 'boolean' as const, 
    default: true 
  },
  // Platform feature icons
  platform_feature_1_icon: { type: 'string' as const, default: '✅' },
  platform_feature_2_icon: { type: 'string' as const, default: '🛡️' },
  platform_feature_3_icon: { type: 'string' as const, default: '💬' },
  platform_feature_4_icon: { type: 'string' as const, default: '⚡' }
};

export default function ToggleableMonthlyYearly(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<ToggleableMonthlyYearlyContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tierNames = blockContent.tier_names 
    ? blockContent.tier_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const monthlyPrices = blockContent.monthly_prices 
    ? blockContent.monthly_prices.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const yearlyPrices = blockContent.yearly_prices 
    ? blockContent.yearly_prices.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tierDescriptions = blockContent.tier_descriptions 
    ? blockContent.tier_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const ctaTexts = blockContent.cta_texts 
    ? blockContent.cta_texts.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureLists = blockContent.feature_lists 
    ? blockContent.feature_lists.split('|').map(item => item.trim().split(',').map(f => f.trim())).filter(Boolean)
    : [];

  const popularTiers = blockContent.popular_tiers 
    ? blockContent.popular_tiers.split('|').map(item => item.trim().toLowerCase() === 'true')
    : [];

  const pricingTiers = tierNames.map((name, index) => ({
    name,
    monthlyPrice: monthlyPrices[index] || '',
    yearlyPrice: yearlyPrices[index] || '',
    description: tierDescriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    features: featureLists[index] || [],
    isPopular: popularTiers[index] || false
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Helper function to get platform features
  const getPlatformFeatures = () => {
    const features = [
      {
        icon: blockContent.platform_feature_1_icon || '✅',
        title: blockContent.platform_feature_1_title || '14-Day Free Trial',
        description: blockContent.platform_feature_1_desc || 'No credit card required',
        bgColor: 'bg-green-500'
      },
      {
        icon: blockContent.platform_feature_2_icon || '🛡️',
        title: blockContent.platform_feature_2_title || 'Secure & Reliable',
        description: blockContent.platform_feature_2_desc || 'Enterprise-grade security',
        bgColor: 'bg-blue-500'
      },
      {
        icon: blockContent.platform_feature_3_icon || '💬',
        title: blockContent.platform_feature_3_title || '24/7 Support',
        description: blockContent.platform_feature_3_desc || 'Always here to help',
        bgColor: 'bg-purple-500'
      },
      {
        icon: blockContent.platform_feature_4_icon || '⚡',
        title: blockContent.platform_feature_4_title || 'Easy Migration',
        description: blockContent.platform_feature_4_desc || 'Switch plans anytime',
        bgColor: 'bg-orange-500'
      }
    ].filter(feature => 
      feature.title !== '___REMOVED___' && 
      feature.description !== '___REMOVED___' && 
      feature.icon !== '___REMOVED___' &&
      feature.title.trim() !== '' && 
      feature.description.trim() !== ''
    );
    
    return features;
  };


  const platformFeatures = getPlatformFeatures();
  
  // Check if any platform features exist (for edit mode)
  const hasAnyPlatformFeatures = () => {
    for (let i = 1; i <= 4; i++) {
      const title = blockContent[`platform_feature_${i}_title` as keyof ToggleableMonthlyYearlyContent];
      const desc = blockContent[`platform_feature_${i}_desc` as keyof ToggleableMonthlyYearlyContent];
      
      if (title !== '___REMOVED___' && title && title !== '' ||
          desc !== '___REMOVED___' && desc && desc !== '') {
        return true;
      }
    }
    return false;
  };

  const calculateSavings = (monthlyPrice: string, yearlyPrice: string) => {
    const monthly = parseFloat(monthlyPrice.replace(/[^0-9.]/g, ''));
    const yearly = parseFloat(yearlyPrice.replace(/[^0-9.]/g, ''));
    
    if (monthly && yearly) {
      const monthlyCost = monthly * 12;
      const savings = Math.round(((monthlyCost - yearly) / monthlyCost) * 100);
      return savings > 0 ? savings : 0;
    }
    return 0;
  };

  const PricingCard = ({ tier, index }: {
    tier: typeof pricingTiers[0];
    index: number;
  }) => {
    const currentPrice = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
    const savingsPercent = calculateSavings(tier.monthlyPrice, tier.yearlyPrice);
    
    return (
      <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl group/pricing-card ${
        tier.isPopular 
          ? `border-primary scale-105` 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        
        {/* Popular Badge */}
        {tier.isPopular && (
          <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorTokens.ctaBg} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
            Most Popular
          </div>
        )}
        
        {/* Annual Savings Badge */}
        {billingCycle === 'yearly' && savingsPercent > 0 && (
          <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Save {savingsPercent}%
          </div>
        )}

        {/* Remove tier button - only in edit mode and when we have at least 1 tier */}
        {mode === 'edit' && pricingTiers.length >= 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Remove this tier from all pipe-separated fields
              const removeFromPipeList = (value: string, indexToRemove: number) => {
                const items = value.split('|');
                items.splice(indexToRemove, 1);
                return items.join('|');
              };
              
              handleContentUpdate('tier_names', removeFromPipeList(blockContent.tier_names, index));
              handleContentUpdate('monthly_prices', removeFromPipeList(blockContent.monthly_prices, index));
              handleContentUpdate('yearly_prices', removeFromPipeList(blockContent.yearly_prices, index));
              handleContentUpdate('tier_descriptions', removeFromPipeList(blockContent.tier_descriptions, index));
              handleContentUpdate('cta_texts', removeFromPipeList(blockContent.cta_texts, index));
              handleContentUpdate('feature_lists', removeFromPipeList(blockContent.feature_lists, index));
              
              if (blockContent.popular_tiers) {
                handleContentUpdate('popular_tiers', removeFromPipeList(blockContent.popular_tiers, index));
              }
            }}
            className="opacity-0 group-hover/pricing-card:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
            title="Remove this pricing tier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="p-8">
          {/* Tier Header */}
          <div className="text-center mb-6">
            {/* Editable Tier Name */}
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const names = blockContent.tier_names.split('|');
                  names[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('tier_names', names.join('|'));
                }}
                className="text-xl font-bold text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
              >
                {tier.name}
              </div>
            ) : (
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
            )}
            
            {/* Editable Tier Description */}
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const descriptions = blockContent.tier_descriptions.split('|');
                  descriptions[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('tier_descriptions', descriptions.join('|'));
                }}
                className={`text-sm ${mutedTextColor} mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50`}
              >
                {tier.description}
              </div>
            ) : (
              <p className={`text-sm ${mutedTextColor} mb-4`}>{tier.description}</p>
            )}
            
            {/* Price Display */}
            <div className="mb-4">
              {mode !== 'preview' ? (
                <>
                  <div className="text-sm text-gray-500 mb-1">Monthly Price:</div>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const prices = blockContent.monthly_prices.split('|');
                      prices[index] = e.currentTarget.textContent || '';
                      handleContentUpdate('monthly_prices', prices.join('|'));
                    }}
                    className="font-bold text-gray-900 text-2xl mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                  >
                    {tier.monthlyPrice}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Yearly Price:</div>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const prices = blockContent.yearly_prices.split('|');
                      prices[index] = e.currentTarget.textContent || '';
                      handleContentUpdate('yearly_prices', prices.join('|'));
                    }}
                    className="font-bold text-gray-900 text-2xl mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                  >
                    {tier.yearlyPrice}
                  </div>
                  <div className="text-sm text-gray-400 italic">Current: {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} View</div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-center">
                    <span style={{fontSize: 'clamp(2rem, 4vw, 2.5rem)'}} className="font-bold text-gray-900">
                      {currentPrice}
                    </span>
                    {!currentPrice.toLowerCase().includes('contact') && (
                      <span className={`text-lg ${mutedTextColor} ml-1`}>
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && !currentPrice.toLowerCase().includes('contact') && (
                    <div className={`text-sm ${mutedTextColor} mt-1`}>
                      ${Math.round(parseFloat(currentPrice.replace(/[^0-9.]/g, '')) / 12)}/month billed annually
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {mode !== 'preview' ? (
              <>
                <div className="text-sm text-gray-500 mb-2">Features (comma-separated):</div>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const features = blockContent.feature_lists.split('|');
                    features[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('feature_lists', features.join('|'));
                  }}
                  className="text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded p-2 cursor-text hover:bg-gray-50 border border-gray-200 min-h-[100px]"
                >
                  {tier.features.join(', ')}
                </div>
              </>
            ) : (
              tier.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))
            )}
          </div>

          {/* CTA Button */}
          {mode !== 'preview' ? (
            <>
              <div className="text-sm text-gray-500 mb-2">Button Text:</div>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const ctas = blockContent.cta_texts.split('|');
                  ctas[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('cta_texts', ctas.join('|'));
                }}
                className="text-center font-medium py-3 px-6 rounded-lg bg-blue-500 text-white outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 cursor-text hover:bg-blue-600"
              >
                {tier.ctaText}
              </div>
              
              {/* Popular tier toggle */}
              <div className="mt-4 flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tier.isPopular}
                    onChange={(e) => {
                      const popular = blockContent.popular_tiers ? blockContent.popular_tiers.split('|') : [];
                      popular[index] = e.target.checked ? 'true' : 'false';
                      handleContentUpdate('popular_tiers', popular.join('|'));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Mark as Popular</span>
                </label>
              </div>
            </>
          ) : (
            <CTAButton
              text={tier.ctaText}
              colorTokens={colorTokens}
              className={`w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${
                tier.isPopular ? '' : 'opacity-90'
              }`}
              variant={tier.isPopular ? "primary" : "secondary"}
              sectionId={sectionId}
              elementKey={`cta_${index}`}
            />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ToggleableMonthlyYearly"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
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
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce pricing plans..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
            </div>
            
            {blockContent.annual_discount_label && (
              <div className="ml-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {blockContent.annual_discount_label}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={index}
              tier={tier}
              index={index}
            />
          ))}
          
          {/* Add tier button - only in edit mode and when we have less than 3 tiers */}
          {mode === 'edit' && pricingTiers.length < 3 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  // Add a new tier with default values
                  const names = blockContent.tier_names.split('|');
                  const monthlyPrices = blockContent.monthly_prices.split('|');
                  const yearlyPrices = blockContent.yearly_prices.split('|');
                  const descriptions = blockContent.tier_descriptions.split('|');
                  const ctas = blockContent.cta_texts.split('|');
                  const features = blockContent.feature_lists.split('|');
                  const popularLabels = blockContent.popular_tiers ? blockContent.popular_tiers.split('|') : [];
                  
                  // Add smart defaults
                  const tierNumber = names.length + 1;
                  names.push(tierNumber === 1 ? 'Starter' : tierNumber === 2 ? 'Professional' : 'Enterprise');
                  monthlyPrices.push(tierNumber === 1 ? '$29' : tierNumber === 2 ? '$79' : '$199');
                  yearlyPrices.push(tierNumber === 1 ? '$290' : tierNumber === 2 ? '$790' : '$1990');
                  descriptions.push(tierNumber === 1 ? 'Perfect for getting started' : tierNumber === 2 ? 'For growing teams' : 'Enterprise solutions');
                  ctas.push(tierNumber === 3 ? 'Contact Sales' : 'Start Free Trial');
                  features.push('Feature 1,Feature 2,Feature 3');
                  popularLabels.push(tierNumber === 2 ? 'true' : 'false');
                  
                  handleContentUpdate('tier_names', names.join('|'));
                  handleContentUpdate('monthly_prices', monthlyPrices.join('|'));
                  handleContentUpdate('yearly_prices', yearlyPrices.join('|'));
                  handleContentUpdate('tier_descriptions', descriptions.join('|'));
                  handleContentUpdate('cta_texts', ctas.join('|'));
                  handleContentUpdate('feature_lists', features.join('|'));
                  handleContentUpdate('popular_tiers', popularLabels.join('|'));
                }}
                className="px-6 py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-300 border-2 border-dashed border-blue-300 hover:border-blue-400 flex flex-col items-center justify-center space-y-2 min-h-[400px]"
                title="Add new pricing tier"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Pricing Tier</span>
              </button>
            </div>
          )}
        </div>

        {/* Billing Note */}
        {blockContent.billing_note && (
          <div className="text-center mb-8">
            <p className={`text-sm ${mutedTextColor}`}>
              {blockContent.billing_note}
            </p>
          </div>
        )}

        {/* Trust & Support */}
        {((blockContent.show_platform_features !== false && platformFeatures.length > 0) || (mode === 'edit' && blockContent.show_platform_features !== false && hasAnyPlatformFeatures())) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-12 relative group/platform-features-section">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.platform_features_title === '___REMOVED___' ? '' : (blockContent.platform_features_title || '')}
                onEdit={(value) => handleContentUpdate('platform_features_title', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg font-semibold text-gray-900 mb-6"
                placeholder="Platform features section title"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="platform_features_title"
              />
              
              {mode !== 'preview' ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((index) => {
                      const rawTitle = blockContent[`platform_feature_${index}_title` as keyof ToggleableMonthlyYearlyContent];
                      const rawDesc = blockContent[`platform_feature_${index}_desc` as keyof ToggleableMonthlyYearlyContent];
                      const rawIcon = blockContent[`platform_feature_${index}_icon` as keyof ToggleableMonthlyYearlyContent];
                      
                      const featureTitle = rawTitle === '___REMOVED___' ? '' : String(rawTitle || '');
                      const featureDesc = rawDesc === '___REMOVED___' ? '' : String(rawDesc || '');
                      const featureIcon = rawIcon === '___REMOVED___' ? '' : String(rawIcon || ['✅', '🛡️', '💬', '⚡'][index - 1] || '🎯');
                      
                      // Skip completely removed features
                      if (rawTitle === '___REMOVED___' && rawDesc === '___REMOVED___') {
                        return null;
                      }
                      
                      // Also skip if both are empty
                      if (!featureTitle && !featureDesc) {
                        return null;
                      }
                      
                      return (
                        <div key={index} className="text-center relative group/platform-feature">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center group/icon-edit">
                            <IconEditableText
                              mode={mode}
                              value={featureIcon}
                              onEdit={(value) => handleContentUpdate(`platform_feature_${index}_icon`, value)}
                              backgroundType="neutral"
                              colorTokens={colorTokens}
                              iconSize="md"
                              className="text-2xl"
                              sectionId={sectionId}
                              elementKey={`platform_feature_${index}_icon`}
                            />
                          </div>
                          <EditableAdaptiveText
                            mode={mode}
                            value={featureTitle}
                            onEdit={(value) => handleContentUpdate(`platform_feature_${index}_title`, value)}
                            backgroundType={backgroundType}
                            colorTokens={colorTokens}
                            variant="body"
                            className="font-semibold text-gray-900 mb-2"
                            placeholder={`Feature ${index} title`}
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key={`platform_feature_${index}_title`}
                          />
                          <EditableAdaptiveText
                            mode={mode}
                            value={featureDesc}
                            onEdit={(value) => handleContentUpdate(`platform_feature_${index}_desc`, value)}
                            backgroundType={backgroundType}
                            colorTokens={colorTokens}
                            variant="body"
                            className={`text-sm ${mutedTextColor}`}
                            placeholder={`Feature ${index} description`}
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key={`platform_feature_${index}_desc`}
                          />
                          
                          {/* Remove button */}
                          {(featureTitle || featureDesc) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContentUpdate(`platform_feature_${index}_title`, '___REMOVED___');
                                handleContentUpdate(`platform_feature_${index}_desc`, '___REMOVED___');
                                handleContentUpdate(`platform_feature_${index}`, '___REMOVED___');
                              }}
                              className="opacity-0 group-hover/platform-feature:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                              title="Remove this feature"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-6">
                  {platformFeatures.map((feature, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${feature.bgColor} flex items-center justify-center text-white`}>
                        <span className="text-xl">{feature.icon}</span>
                      </div>
                      <div className="font-semibold text-gray-900">{feature.title}</div>
                      <div className={`text-sm ${mutedTextColor}`}>{feature.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Remove platform features section button - only in edit mode */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_platform_features', String(false));
                  handleContentUpdate('platform_features_title', '___REMOVED___');
                  handleContentUpdate('platform_feature_1_title', '___REMOVED___');
                  handleContentUpdate('platform_feature_1_desc', '___REMOVED___');
                  handleContentUpdate('platform_feature_1_icon', '___REMOVED___');
                  handleContentUpdate('platform_feature_2_title', '___REMOVED___');
                  handleContentUpdate('platform_feature_2_desc', '___REMOVED___');
                  handleContentUpdate('platform_feature_2_icon', '___REMOVED___');
                  handleContentUpdate('platform_feature_3_title', '___REMOVED___');
                  handleContentUpdate('platform_feature_3_desc', '___REMOVED___');
                  handleContentUpdate('platform_feature_3_icon', '___REMOVED___');
                  handleContentUpdate('platform_feature_4_title', '___REMOVED___');
                  handleContentUpdate('platform_feature_4_desc', '___REMOVED___');
                  handleContentUpdate('platform_feature_4_icon', '___REMOVED___');
                }}
                className="opacity-0 group-hover/platform-features-section:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                title="Remove platform features section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
                placeholder="Add optional supporting text to reinforce pricing value..."
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
  name: 'ToggleableMonthlyYearly',
  category: 'Pricing',
  description: 'Monthly/yearly toggle pricing with automatic savings calculation. Perfect for subscription products with annual discounts.',
  tags: ['pricing', 'toggle', 'subscription', 'annual', 'discount'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tier_names', label: 'Tier Names (pipe separated)', type: 'text', required: true },
    { key: 'monthly_prices', label: 'Monthly Prices (pipe separated)', type: 'text', required: true },
    { key: 'yearly_prices', label: 'Yearly Prices (pipe separated)', type: 'text', required: true },
    { key: 'tier_descriptions', label: 'Tier Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_texts', label: 'CTA Button Texts (pipe separated)', type: 'text', required: true },
    { key: 'feature_lists', label: 'Feature Lists (pipe separated tiers, comma separated features)', type: 'textarea', required: true },
    { key: 'popular_tiers', label: 'Popular Tiers true/false (pipe separated)', type: 'text', required: false },
    { key: 'annual_discount_label', label: 'Annual Discount Label', type: 'text', required: false },
    { key: 'billing_note', label: 'Billing Note', type: 'text', required: false },
    { key: 'platform_features_title', label: 'Platform Features Section Title', type: 'text', required: false },
    { key: 'platform_feature_1_title', label: 'Platform Feature 1 Title', type: 'text', required: false },
    { key: 'platform_feature_1_desc', label: 'Platform Feature 1 Description', type: 'text', required: false },
    { key: 'platform_feature_2_title', label: 'Platform Feature 2 Title', type: 'text', required: false },
    { key: 'platform_feature_2_desc', label: 'Platform Feature 2 Description', type: 'text', required: false },
    { key: 'platform_feature_3_title', label: 'Platform Feature 3 Title', type: 'text', required: false },
    { key: 'platform_feature_3_desc', label: 'Platform Feature 3 Description', type: 'text', required: false },
    { key: 'platform_feature_4_title', label: 'Platform Feature 4 Title', type: 'text', required: false },
    { key: 'platform_feature_4_desc', label: 'Platform Feature 4 Description', type: 'text', required: false },
    { key: 'show_platform_features', label: 'Show Platform Features Section', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'platform_feature_1_icon', label: 'Platform Feature 1 Icon', type: 'text', required: false },
    { key: 'platform_feature_2_icon', label: 'Platform Feature 2 Icon', type: 'text', required: false },
    { key: 'platform_feature_3_icon', label: 'Platform Feature 3 Icon', type: 'text', required: false },
    { key: 'platform_feature_4_icon', label: 'Platform Feature 4 Icon', type: 'text', required: false }
  ],
  
  features: [
    'Monthly/yearly billing toggle',
    'Automatic savings calculation',
    'Popular plan highlighting',
    'Feature comparison lists',
    'Trust indicators and guarantees',
    'Responsive pricing cards'
  ],
  
  useCases: [
    'SaaS subscription products',
    'Tiered pricing models',
    'Annual discount promotions',
    'Feature-based differentiation',
    'Conversion-focused pricing'
  ]
};