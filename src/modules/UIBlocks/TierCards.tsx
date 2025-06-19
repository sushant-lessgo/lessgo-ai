import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
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
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  feature_lists?: string;
  popular_labels?: string;
}

// Content schema for TierCards layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Choose Your Plan' },
  tier_names: { type: 'string' as const, default: 'Starter|Professional|Enterprise' },
  tier_prices: { type: 'string' as const, default: '$29/month|$79/month|Contact Us' },
  tier_descriptions: { type: 'string' as const, default: 'Perfect for small teams getting started|For growing businesses that need more power|Custom solutions for large organizations' },
  cta_texts: { type: 'string' as const, default: 'Start Free Trial|Start Free Trial|Contact Sales' },
  feature_lists: { type: 'string' as const, default: '' },
  popular_labels: { type: 'string' as const, default: '' }
};

// Parse pricing data from pipe-separated strings
const parsePricingData = (
  names: string, 
  prices: string, 
  descriptions: string, 
  ctaTexts: string,
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
  
  return nameList.map((name, index) => ({
    id: `tier-${index}`,
    name,
    price: priceList[index] || 'Contact Us',
    description: descriptionList[index] || 'Tier description not provided.',
    ctaText: ctaList[index] || 'Get Started',
    features: featuresList[index] || getDefaultFeatures(name, index),
    isPopular: popularList[index] || (index === 1) // Default to middle tier as popular
  }));
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
  if (mode === 'edit' && onEdit) {
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
  onCtaEdit
}: {
  tier: PricingTier;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onNameEdit: (index: number, value: string) => void;
  onPriceEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onCtaEdit: (index: number, value: string) => void;
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
        
        {/* Tier Name */}
        <div className="text-center mb-6">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
              style={getTextStyle('h3')}
            >
              {tier.name}
            </div>
          ) : (
            <h3 
              className="font-bold text-gray-900"
              style={getTextStyle('h3')}
            >
              {tier.name}
            </h3>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onPriceEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-4xl font-bold text-gray-900"
              style={getTextStyle('h1')}
            >
              {tier.price}
            </div>
          ) : (
            <div 
              className="text-4xl font-bold text-gray-900"
              style={getTextStyle('h1')}
            >
              {tier.price}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-gray-600"
              style={getTextStyle('body')}
            >
              {tier.description}
            </div>
          ) : (
            <p 
              className="text-gray-600"
              style={getTextStyle('body')}
            >
              {tier.description}
            </p>
          )}
        </div>

        {/* Features List */}
        <div className="mb-8">
          <ul className="space-y-3">
            {tier.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span 
                  className="text-gray-700"
                  style={getTextStyle('body-sm')}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onCtaEdit(index, e.currentTarget.textContent || '')}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-h-[24px] cursor-text w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                tier.isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              style={getTextStyle('body')}
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
              style={getTextStyle('body')}
            >
              {tier.ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TierCards({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: TierCardsProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: TierCardsContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse pricing data
  const pricingTiers = parsePricingData(
    blockContent.tier_names,
    blockContent.tier_prices,
    blockContent.tier_descriptions,
    blockContent.cta_texts,
    blockContent.feature_lists,
    blockContent.popular_labels
  );

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

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="TierCards"
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
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${
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
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              14-day free trial
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No setup fees
            </div>
          </div>
        </div>

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  TierCards - Edit pricing content or click individual elements above
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Tier Names (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="tier_names"
                    onEdit={(value) => handleContentUpdate('tier_names', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs">
                      {blockContent.tier_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Tier Prices (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="tier_prices"
                    onEdit={(value) => handleContentUpdate('tier_prices', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs">
                      {blockContent.tier_prices}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Descriptions (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="tier_descriptions"
                    onEdit={(value) => handleContentUpdate('tier_descriptions', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs max-h-20 overflow-y-auto">
                      {blockContent.tier_descriptions}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">CTA Texts (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="cta_texts"
                    onEdit={(value) => handleContentUpdate('cta_texts', value)}
                  >
                    <div className="bg-white p-2 rounded border text-gray-800 text-xs">
                      {blockContent.cta_texts}
                    </div>
                  </ModeWrapper>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 Tip: Middle tier is automatically marked as "Most Popular". Features are auto-generated based on tier names. You can edit individual elements by clicking directly on them above.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}