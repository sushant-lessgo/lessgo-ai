import React, { useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface TierCardsProps extends LayoutComponentProps {}

// Pricing tier structure
interface PricingTier {
  name: string;
  price: string;
  description: string;
  ctaText: string;
  features: string[];
  isPopular: boolean;
  id: string;
}

// Content interface for TierCards layout
interface TierCardsContent {
  headline: string;
  tier_count?: string;
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  feature_lists?: string;
  popular_labels?: string;
  // Individual feature fields for each tier (up to 3 tiers, 8 features each)
  tier_1_feature_1?: string;
  tier_1_feature_2?: string;
  tier_1_feature_3?: string;
  tier_1_feature_4?: string;
  tier_1_feature_5?: string;
  tier_1_feature_6?: string;
  tier_1_feature_7?: string;
  tier_1_feature_8?: string;
  tier_2_feature_1?: string;
  tier_2_feature_2?: string;
  tier_2_feature_3?: string;
  tier_2_feature_4?: string;
  tier_2_feature_5?: string;
  tier_2_feature_6?: string;
  tier_2_feature_7?: string;
  tier_2_feature_8?: string;
  tier_3_feature_1?: string;
  tier_3_feature_2?: string;
  tier_3_feature_3?: string;
  tier_3_feature_4?: string;
  tier_3_feature_5?: string;
  tier_3_feature_6?: string;
  tier_3_feature_7?: string;
  tier_3_feature_8?: string;
  // Trust indicators
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  show_trust_footer?: boolean;
}

// Content schema for TierCards layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Choose Your Plan' },
  tier_count: { type: 'string' as const, default: '3' },
  tier_names: { type: 'string' as const, default: 'Starter|Professional|Enterprise' },
  tier_prices: { type: 'string' as const, default: '$29/month|$79/month|Contact Us' },
  tier_descriptions: { type: 'string' as const, default: 'Perfect for small teams getting started|For growing businesses that need more power|Custom solutions for large organizations' },
  cta_texts: { type: 'string' as const, default: 'Start Free Trial|Start Free Trial|Contact Sales' },
  feature_lists: { type: 'string' as const, default: '' },
  popular_labels: { type: 'string' as const, default: '' },
  // Tier 1 (Starter) features
  tier_1_feature_1: { type: 'string' as const, default: 'Up to 5 team members' },
  tier_1_feature_2: { type: 'string' as const, default: 'Basic analytics' },
  tier_1_feature_3: { type: 'string' as const, default: 'Email support' },
  tier_1_feature_4: { type: 'string' as const, default: 'Core integrations' },
  tier_1_feature_5: { type: 'string' as const, default: '10GB storage' },
  tier_1_feature_6: { type: 'string' as const, default: '' },
  tier_1_feature_7: { type: 'string' as const, default: '' },
  tier_1_feature_8: { type: 'string' as const, default: '' },
  // Tier 2 (Professional) features
  tier_2_feature_1: { type: 'string' as const, default: 'Up to 25 team members' },
  tier_2_feature_2: { type: 'string' as const, default: 'Advanced analytics' },
  tier_2_feature_3: { type: 'string' as const, default: 'Priority support' },
  tier_2_feature_4: { type: 'string' as const, default: 'All integrations' },
  tier_2_feature_5: { type: 'string' as const, default: '100GB storage' },
  tier_2_feature_6: { type: 'string' as const, default: 'Custom workflows' },
  tier_2_feature_7: { type: 'string' as const, default: 'API access' },
  tier_2_feature_8: { type: 'string' as const, default: '' },
  // Tier 3 (Enterprise) features  
  tier_3_feature_1: { type: 'string' as const, default: 'Unlimited team members' },
  tier_3_feature_2: { type: 'string' as const, default: 'Enterprise analytics' },
  tier_3_feature_3: { type: 'string' as const, default: 'Dedicated support' },
  tier_3_feature_4: { type: 'string' as const, default: 'Custom integrations' },
  tier_3_feature_5: { type: 'string' as const, default: 'Unlimited storage' },
  tier_3_feature_6: { type: 'string' as const, default: 'Advanced security' },
  tier_3_feature_7: { type: 'string' as const, default: 'SLA guarantee' },
  tier_3_feature_8: { type: 'string' as const, default: 'White-label options' },
  // Trust indicators
  trust_item_1: { type: 'string' as const, default: '14-day free trial' },
  trust_item_2: { type: 'string' as const, default: 'Cancel anytime' },
  trust_item_3: { type: 'string' as const, default: 'No setup fees' },
  show_trust_footer: { type: 'boolean' as const, default: true }
};

// Helper function to get tier features from individual fields
const getTierFeatures = (tierIndex: number, blockContent: TierCardsContent): string[] => {
  const features = [];
  
  for (let i = 1; i <= 8; i++) {
    const featureKey = `tier_${tierIndex + 1}_feature_${i}` as keyof TierCardsContent;
    const feature = blockContent[featureKey];
    
    if (feature && typeof feature === 'string' && feature.trim() !== '' && feature !== '___REMOVED___') {
      features.push(feature.trim());
    }
  }
  
  return features;
};

// Parse pricing data from pipe-separated strings
const parsePricingData = (
  names: string, 
  prices: string, 
  descriptions: string, 
  ctaTexts: string,
  blockContent: TierCardsContent,
  featureLists?: string,
  popularLabels?: string
): PricingTier[] => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const priceList = prices.split('|').map(p => p.trim()).filter(p => p);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const ctaList = ctaTexts.split('|').map(c => c.trim()).filter(c => c);
  const featuresList = featureLists ? featureLists.split('||').map(f => f.split('|').map(item => item.trim()).filter(item => item)) : [];
  const popularList = popularLabels ? popularLabels.split('|').map(p => p.trim().toLowerCase() === 'true') : [];
  
  // Default feature sets for common pricing tiers
  const getDefaultFeatures = (tierName: string, index: number): string[] => {
    const lower = tierName.toLowerCase();
    
    if (lower.includes('starter') || lower.includes('basic') || index === 0) {
      return [
        'Up to 5 team members',
        'Basic analytics',
        'Email support',
        'Core integrations',
        '10GB storage'
      ];
    } else if (lower.includes('professional') || lower.includes('pro') || index === 1) {
      return [
        'Up to 25 team members',
        'Advanced analytics',
        'Priority support',
        'All integrations',
        '100GB storage',
        'Custom workflows',
        'API access'
      ];
    } else if (lower.includes('enterprise') || lower.includes('business') || index === 2) {
      return [
        'Unlimited team members',
        'Enterprise analytics',
        'Dedicated support',
        'Custom integrations',
        'Unlimited storage',
        'Advanced security',
        'SLA guarantee',
        'White-label options'
      ];
    }
    
    return ['Feature 1', 'Feature 2', 'Feature 3'];
  };
  
  return nameList.map((name, index) => {
    // Try individual fields first, then featuresList, then fallback to getDefaultFeatures
    let features = getTierFeatures(index, blockContent);
    
    if (features.length === 0) {
      features = featuresList[index] || getDefaultFeatures(name, index);
    }
    
    return {
      id: `tier-${index}`,
      name,
      price: priceList[index] || 'Contact Us',
      description: descriptionList[index] || 'Tier description not provided.',
      ctaText: ctaList[index] || 'Get Started',
      features,
      isPopular: popularList[index] || (index === 1) // Default to middle tier as popular
    };
  });
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode !== 'preview' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Individual Pricing Card
const PricingCard = ({ 
  tier, 
  mode, 
  sectionId, 
  index,
  onNameEdit,
  onPriceEdit,
  onDescriptionEdit,
  onCtaEdit,
  onFeatureEdit,
  onRemove,
  showRemoveButton,
  blockContent,
  handleContentUpdate,
  colorTokens,
  sectionBackground
}: {
  tier: PricingTier;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onNameEdit: (index: number, value: string) => void;
  onPriceEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onCtaEdit: (index: number, value: string) => void;
  onFeatureEdit: (tierIndex: number, featureIndex: number, value: string) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  blockContent: TierCardsContent;
  handleContentUpdate: (key: keyof TierCardsContent, value: string) => void;
  colorTokens: any;
  sectionBackground: any;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className={`relative ${tier.isPopular ? 'transform scale-105 z-10' : ''}`}>
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-lg">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Most Popular
          </span>
        </div>
      )}
      
      {/* Card */}
      <div className={`relative h-full p-8 bg-white rounded-2xl shadow-lg border-2 ${
        tier.isPopular 
          ? 'border-blue-500 shadow-blue-100' 
          : 'border-gray-200 hover:border-blue-300'
      } transition-all duration-300 hover:shadow-xl`}>
        
        {/* Remove Button - Only in edit mode and when allowed */}
        {mode === 'edit' && showRemoveButton && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 z-30 shadow-lg"
            title="Remove this pricing tier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Tier Name */}
        <div className="text-center mb-6">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
            >
              {tier.name}
            </div>
          ) : (
            <h3 
              className="font-bold text-gray-900"
            >
              {tier.name}
            </h3>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onPriceEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-4xl font-bold text-gray-900"
            >
              {tier.price}
            </div>
          ) : (
            <div 
              className="text-4xl font-bold text-gray-900"
            >
              {tier.price}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-gray-600"
            >
              {tier.description}
            </div>
          ) : (
            <p 
              className="text-gray-600"
            >
              {tier.description}
            </p>
          )}
        </div>

        {/* Features List */}
        <div className="mb-8">
          <ul className="space-y-3">
            {mode !== 'preview' ? (
              // Edit mode: Show all 8 potential feature slots
              Array.from({ length: 8 }, (_, featureIndex) => {
                const featureKey = `tier_${index + 1}_feature_${featureIndex + 1}` as keyof TierCardsContent;
                const feature = String(blockContent[featureKey] || '');
                const isVisible = feature && feature !== '___REMOVED___' && feature.trim() !== '';
                
                return (isVisible || mode === 'edit') ? (
                  <li key={featureIndex} className={`flex items-start group/feature-item relative ${!isVisible ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                    {isVisible ? (
                      // Checkmark icon for features with content
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      // Plus icon for empty slots
                      <svg className="w-5 h-5 text-gray-400 hover:text-green-500 mr-3 mt-0.5 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0 relative">
                      <EditableAdaptiveText
                        mode={mode}
                        value={feature}
                        onEdit={(value) => onFeatureEdit(index, featureIndex + 1, value)}
                        backgroundType="neutral"
                        colorTokens={colorTokens}
                        variant="body"
                        className={isVisible ? "text-gray-700" : "text-gray-400 italic"}
                        placeholder={isVisible ? `Feature ${featureIndex + 1}` : "Click to add feature"}
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={featureKey}
                      />
                      {/* Remove button */}
                      {isVisible && mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate(featureKey, '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/feature-item:opacity-100 absolute -top-1 -right-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                          title="Remove this feature"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ) : null;
              }).filter(Boolean)
            ) : (
              // Preview mode: Show only visible features  
              tier.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">
                    {feature}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCtaEdit(index, e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-h-[24px] cursor-text w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                tier.isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {tier.ctaText}
            </div>
          ) : (
            <button 
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:transform hover:scale-105 focus:outline-none focus:ring-4 ${
                tier.isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 shadow-lg'
                  : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-300'
              }`}
            >
              {tier.ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TierCards(props: TierCardsProps) {
  // ✅ Use the standard useLayoutComponent hook
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate,
    theme
  } = useLayoutComponent<TierCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Get tier count (default to 3 for backward compatibility)
  const tierCount = parseInt(blockContent.tier_count || '3') || 3;

  // Parse pricing data
  const pricingTiers = parsePricingData(
    blockContent.tier_names,
    blockContent.tier_prices,
    blockContent.tier_descriptions,
    blockContent.cta_texts,
    blockContent,
    blockContent.feature_lists,
    blockContent.popular_labels
  ).slice(0, tierCount);

  // Helper function to get trust items
  const getTrustFooterItems = () => {
    const items = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3
    ].filter((item): item is string => 
      Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
    );
    
    return items;
  };

  const trustFooterItems = getTrustFooterItems();

  // Handle individual editing
  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.tier_names.split('|');
    names[index] = value;
    handleContentUpdate('tier_names', names.join('|'));
  };

  const handlePriceEdit = (index: number, value: string) => {
    const prices = blockContent.tier_prices.split('|');
    prices[index] = value;
    handleContentUpdate('tier_prices', prices.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.tier_descriptions.split('|');
    descriptions[index] = value;
    handleContentUpdate('tier_descriptions', descriptions.join('|'));
  };

  const handleCtaEdit = (index: number, value: string) => {
    const ctas = blockContent.cta_texts.split('|');
    ctas[index] = value;
    handleContentUpdate('cta_texts', ctas.join('|'));
  };

  const handleFeatureEdit = (tierIndex: number, featureIndex: number, value: string) => {
    const featureKey = `tier_${tierIndex + 1}_feature_${featureIndex}` as keyof TierCardsContent;
    handleContentUpdate(featureKey, value);
  };

  // Add a new tier
  const handleAddTier = () => {
    if (tierCount >= 3) return; // Max 3 tiers
    
    const newCount = tierCount + 1;
    handleContentUpdate('tier_count', newCount.toString());
    
    // Add default values for the new tier
    const names = blockContent.tier_names.split('|');
    const prices = blockContent.tier_prices.split('|');
    const descriptions = blockContent.tier_descriptions.split('|');
    const ctas = blockContent.cta_texts.split('|');
    const popularLabels = blockContent.popular_labels ? blockContent.popular_labels.split('|') : [];
    
    // Add smart defaults based on position
    if (names.length < newCount) {
      names.push(newCount === 1 ? 'Basic' : newCount === 2 ? 'Professional' : 'Enterprise');
    }
    if (prices.length < newCount) {
      prices.push(newCount === 1 ? '$19/month' : newCount === 2 ? '$49/month' : '$99/month');
    }
    if (descriptions.length < newCount) {
      descriptions.push(newCount === 1 ? 'Perfect for getting started' : newCount === 2 ? 'For growing teams' : 'For large organizations');
    }
    if (ctas.length < newCount) {
      ctas.push(newCount === 3 ? 'Contact Sales' : 'Start Free Trial');
    }
    if (popularLabels.length < newCount) {
      popularLabels.push(newCount === 2 ? 'true' : 'false'); // Make middle tier popular
    }
    
    handleContentUpdate('tier_names', names.join('|'));
    handleContentUpdate('tier_prices', prices.join('|'));
    handleContentUpdate('tier_descriptions', descriptions.join('|'));
    handleContentUpdate('cta_texts', ctas.join('|'));
    handleContentUpdate('popular_labels', popularLabels.join('|'));
  };

  // Remove a tier
  const handleRemoveTier = (indexToRemove: number) => {
    if (tierCount <= 1) return; // Keep at least 1 tier
    
    const newCount = tierCount - 1;
    handleContentUpdate('tier_count', newCount.toString());
    
    // Remove the tier from all pipe-separated fields
    const removeFromPipeList = (value: string) => {
      const items = value.split('|');
      items.splice(indexToRemove, 1);
      return items.join('|');
    };
    
    handleContentUpdate('tier_names', removeFromPipeList(blockContent.tier_names));
    handleContentUpdate('tier_prices', removeFromPipeList(blockContent.tier_prices));
    handleContentUpdate('tier_descriptions', removeFromPipeList(blockContent.tier_descriptions));
    handleContentUpdate('cta_texts', removeFromPipeList(blockContent.cta_texts));
    
    if (blockContent.popular_labels) {
      handleContentUpdate('popular_labels', removeFromPipeList(blockContent.popular_labels));
    }
    
    // Clear features for the removed tier
    for (let i = 1; i <= 8; i++) {
      const featureKey = `tier_${indexToRemove + 1}_feature_${i}` as keyof TierCardsContent;
      handleContentUpdate(featureKey, '');
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TierCards"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
        </div>

        {/* Tier Management Controls - Only in edit mode */}
        {mode === 'edit' && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Pricing Tiers: {tierCount} {tierCount === 1 ? 'tier' : 'tiers'}
                </span>
              </div>
              {tierCount < 3 && (
                <button
                  onClick={handleAddTier}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Tier</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              You can have between 1-3 pricing tiers. {tierCount === 3 ? 'Maximum tiers reached.' : `${3 - tierCount} more tier${3 - tierCount === 1 ? '' : 's'} available.`}
            </p>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${
          pricingTiers.length === 1 ? 'max-w-md mx-auto' :
          pricingTiers.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          pricingTiers.length === 3 ? 'md:grid-cols-3 max-w-6xl mx-auto' :
          'md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto'
        }`}>
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              mode={mode}
              sectionId={sectionId}
              index={index}
              onNameEdit={handleNameEdit}
              onPriceEdit={handlePriceEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onCtaEdit={handleCtaEdit}
              onFeatureEdit={handleFeatureEdit}
              onRemove={() => handleRemoveTier(index)}
              showRemoveButton={tierCount > 1}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              colorTokens={colorTokens}
              sectionBackground={sectionBackground}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        {((blockContent.show_trust_footer !== false && trustFooterItems.length > 0) || mode === 'edit') && (
          <div className="mt-12 text-center">
            {mode !== 'preview' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center items-center gap-6">
                  {[1, 2, 3].map((index) => {
                    const trustItem = blockContent[`trust_item_${index}` as keyof TierCardsContent] || '';
                    
                    return (
                      <div key={index} className="flex items-center space-x-2 relative group/trust-footer-item">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleContentUpdate(`trust_item_${index}`, e.currentTarget.textContent || '')}
                          className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-sm text-gray-500"
                          data-placeholder={`Trust item ${index}`}
                        >
                          {trustItem}
                        </div>
                        
                        {/* Remove button */}
                        {trustItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(`trust_item_${index}`, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/trust-footer-item:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
                            title="Remove this trust item"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-500">
                {trustFooterItems.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TierCards',
  category: 'Pricing',
  description: 'Flexible pricing tier cards with 1-3 tiers, adaptive text colors and popular tier highlighting',
  tags: ['pricing', 'tiers', 'cards', 'features', 'adaptive-colors', 'flexible'],
  features: [
    'Flexible tier count (1-3 tiers)',
    'Add/remove tiers dynamically in edit mode',
    'Automatic text color adaptation based on background type',
    'Editable tier names, prices, descriptions, and CTAs',
    'Intelligent feature generation based on tier names',
    'Popular tier highlighting and scaling',
    'Responsive grid layout based on tier count',
    'Trust indicators footer'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    tier_count: 'Number of pricing tiers to display (1-3)',
    tier_names: 'Pipe-separated list of tier names',
    tier_prices: 'Pipe-separated list of tier prices',
    tier_descriptions: 'Pipe-separated list of tier descriptions',
    cta_texts: 'Pipe-separated list of CTA button texts',
    feature_lists: 'Optional double-pipe separated feature lists',
    popular_labels: 'Optional pipe-separated boolean values for popular tiers',
    trust_item_1: 'Trust indicator item 1',
    trust_item_2: 'Trust indicator item 2',
    trust_item_3: 'Trust indicator item 3',
    show_trust_footer: 'Boolean to show/hide trust footer section'
  },
  examples: [
    'SaaS pricing plans',
    'Service tier comparison',
    'Product package options',
    'Subscription levels'
  ]
};