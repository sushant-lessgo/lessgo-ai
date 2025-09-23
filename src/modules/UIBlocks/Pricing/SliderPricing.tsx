import React, { useState, useEffect } from 'react';
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
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface SliderPricingContent {
  headline: string;
  pricing_type: string;
  base_price: string;
  unit_price: string;
  min_units: string;
  max_units: string;
  default_units: string;
  unit_label: string;
  tier_breakpoints?: string;
  tier_discounts?: string;
  included_features: string;
  cta_text: string;
  pricing_note?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  // Feature icons
  feature_icon_1?: string;
  feature_icon_2?: string;
  feature_icon_3?: string;
  feature_icon_4?: string;
  feature_icon_5?: string;
  feature_icon_6?: string;
  // Pricing tier icon
  pricing_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Flexible Pricing That Scales With You' 
  },
  pricing_type: { 
    type: 'string' as const, 
    default: 'per-seat' 
  },
  base_price: { 
    type: 'string' as const, 
    default: '49' 
  },
  unit_price: { 
    type: 'string' as const, 
    default: '12' 
  },
  min_units: { 
    type: 'string' as const, 
    default: '1' 
  },
  max_units: { 
    type: 'string' as const, 
    default: '100' 
  },
  default_units: { 
    type: 'string' as const, 
    default: '10' 
  },
  unit_label: { 
    type: 'string' as const, 
    default: 'team members' 
  },
  tier_breakpoints: { 
    type: 'string' as const, 
    default: '1|10|25|50' 
  },
  tier_discounts: { 
    type: 'string' as const, 
    default: '0|5|10|15' 
  },
  included_features: { 
    type: 'string' as const, 
    default: 'Unlimited projects,Advanced analytics,Priority support,Custom integrations,24/7 customer success,Enterprise security' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Free Trial' 
  },
  pricing_note: { 
    type: 'string' as const, 
    default: 'All plans include 14-day free trial. Volume discounts automatically applied.' 
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
  // Feature icons
  feature_icon_1: { type: 'string' as const, default: '⚡' },
  feature_icon_2: { type: 'string' as const, default: '📊' },
  feature_icon_3: { type: 'string' as const, default: '🔧' },
  feature_icon_4: { type: 'string' as const, default: '🛡️' },
  feature_icon_5: { type: 'string' as const, default: '📈' },
  feature_icon_6: { type: 'string' as const, default: '💬' },
  // Pricing tier icon
  pricing_icon: { type: 'string' as const, default: '💰' }
};

export default function SliderPricing(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<SliderPricingContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const basePrice = parseFloat(blockContent.base_price) || 0;
  const unitPrice = parseFloat(blockContent.unit_price) || 0;
  const minUnits = parseInt(blockContent.min_units) || 1;
  const maxUnits = parseInt(blockContent.max_units) || 100;
  const defaultUnits = parseInt(blockContent.default_units) || 10;

  const [units, setUnits] = useState(defaultUnits);

  const tierBreakpoints = blockContent.tier_breakpoints 
    ? blockContent.tier_breakpoints.split('|').map(item => parseInt(item.trim()) || 0)
    : [];

  const tierDiscounts = blockContent.tier_discounts 
    ? blockContent.tier_discounts.split('|').map(item => parseInt(item.trim()) || 0)
    : [];

  const includedFeatures = blockContent.included_features 
    ? blockContent.included_features.split(',').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Helper function to get feature icon
  const getFeatureIcon = (index: number) => {
    const iconFields = [
      blockContent.feature_icon_1,
      blockContent.feature_icon_2,
      blockContent.feature_icon_3,
      blockContent.feature_icon_4,
      blockContent.feature_icon_5,
      blockContent.feature_icon_6
    ];
    return iconFields[index] || ['⚡', '📊', '🔧', '🛡️', '📈', '💬'][index] || '✨';
  };

  // Calculate pricing with tiered discounts
  const calculatePrice = (unitCount: number) => {
    let price = basePrice;
    
    if (blockContent.pricing_type === 'per-seat' || blockContent.pricing_type === 'usage-based') {
      price = unitCount * unitPrice;
    }

    // Apply volume discounts
    let discount = 0;
    for (let i = tierBreakpoints.length - 1; i >= 0; i--) {
      if (unitCount >= tierBreakpoints[i]) {
        discount = tierDiscounts[i] || 0;
        break;
      }
    }

    const discountAmount = (price * discount) / 100;
    return Math.round((price - discountAmount) * 100) / 100;
  };

  const currentPrice = calculatePrice(units);
  const currentDiscount = getCurrentDiscount(units);

  function getCurrentDiscount(unitCount: number) {
    for (let i = tierBreakpoints.length - 1; i >= 0; i--) {
      if (unitCount >= tierBreakpoints[i]) {
        return tierDiscounts[i] || 0;
      }
    }
    return 0;
  }

  const annualPrice = currentPrice * 12;
  const annualSavings = Math.round(annualPrice * 0.17); // 17% annual discount

  // Update units when slider changes
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUnits(parseInt(event.target.value));
  };

  const getVolumeDiscountColor = (discount: number) => {
    if (discount >= 15) return 'text-green-600 bg-green-100';
    if (discount >= 10) return 'text-blue-600 bg-blue-100';
    if (discount >= 5) return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const PricingBreakdown = () => (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{units} {blockContent.unit_label}</span>
          <div className="flex items-center space-x-2">
            {mode !== 'preview' ? (
              <div className="flex items-center space-x-1">
                <span>$</span>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('unit_price', e.currentTarget.textContent || '')}
                  className="font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 min-w-[40px] text-center"
                  data-placeholder="12"
                >
                  {unitPrice}
                </div>
                <span>/user</span>
              </div>
            ) : (
              <span className="font-medium">${(units * unitPrice).toFixed(2)}</span>
            )}
          </div>
        </div>
        
        {currentDiscount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-green-600">Volume discount ({currentDiscount}%)</span>
            <span className="font-medium text-green-600">
              -${((units * unitPrice * currentDiscount) / 100).toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Monthly Total</span>
            <span className="text-2xl font-bold text-gray-900">${currentPrice}</span>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium">Annual pricing:</div>
            <div className="flex justify-between items-center mt-1">
              <span>${(annualPrice - annualSavings).toFixed(2)}/year</span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                Save ${annualSavings}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SliderPricing"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
        
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
              placeholder="Add optional subheadline to introduce flexible pricing..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
            
            {/* Pricing Calculator */}
            <div className="space-y-8">
              
              {/* Units Slider */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.pricing_icon || '💰'}
                        onEdit={(value) => handleContentUpdate('pricing_icon', value)}
                        backgroundType="primary"
                        colorTokens={colorTokens}
                        iconSize="lg"
                        className="text-white text-xl"
                        sectionId={sectionId}
                        elementKey="pricing_icon"
                      />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{units}</div>
                  {mode !== 'preview' ? (
                    <div 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentUpdate('unit_label', e.currentTarget.textContent || '')}
                      className="text-lg text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-blue-100 transition-colors"
                      data-placeholder="Unit label (e.g. team members, users)"
                    >
                      {blockContent.unit_label}
                    </div>
                  ) : (
                    <div className="text-lg text-gray-600">{blockContent.unit_label}</div>
                  )}
                </div>
                
                <div className="relative mb-6">
                  <input
                    type="range"
                    min={minUnits}
                    max={maxUnits}
                    value={units}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${colorTokens.ctaBg} 0%, ${colorTokens.ctaBg} ${((units - minUnits) / (maxUnits - minUnits)) * 100}%, #e5e7eb ${((units - minUnits) / (maxUnits - minUnits)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>{minUnits}</span>
                    <span>{maxUnits}+</span>
                  </div>
                </div>
                
                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[5, 10, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setUnits(preset)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        units === preset
                          ? `${colorTokens.ctaBg} text-white`
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Discount Info */}
              {currentDiscount > 0 && (
                <div className={`p-4 rounded-lg ${getVolumeDiscountColor(currentDiscount)}`}>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">
                      Volume discount applied: {currentDiscount}% off
                    </span>
                  </div>
                </div>
              )}

              {/* Included Features */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Everything Included</h3>
                  {mode === 'edit' && (
                    <button
                      onClick={() => {
                        const features = blockContent.included_features.split(',');
                        features.push('New feature');
                        handleContentUpdate('included_features', features.join(','));
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                      title="Add feature"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {includedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 group/feature relative">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                        <IconEditableText
                          mode={mode}
                          value={getFeatureIcon(index)}
                          onEdit={(value) => {
                            const iconField = `feature_icon_${index + 1}` as keyof SliderPricingContent;
                            handleContentUpdate(iconField, value);
                          }}
                          backgroundType="neutral"
                          colorTokens={colorTokens}
                          iconSize="sm"
                          className="text-green-600 text-sm"
                          sectionId={sectionId}
                          elementKey={`feature_icon_${index + 1}`}
                        />
                      </div>
                      {mode !== 'preview' ? (
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const features = blockContent.included_features.split(',');
                            features[index] = e.currentTarget.textContent || '';
                            handleContentUpdate('included_features', features.join(','));
                          }}
                          className="text-gray-700 flex-1 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100"
                          data-placeholder="Feature name"
                        >
                          {feature}
                        </div>
                      ) : (
                        <span className="text-gray-700 flex-1">{feature}</span>
                      )}
                      
                      {/* Remove feature button - only in edit mode */}
                      {mode === 'edit' && includedFeatures.length > 1 && (
                        <button
                          onClick={() => {
                            const features = blockContent.included_features.split(',');
                            features.splice(index, 1);
                            handleContentUpdate('included_features', features.join(','));
                          }}
                          className="opacity-0 group-hover/feature:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200 ml-2"
                          title="Remove this feature"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-6">
              <PricingBreakdown />
              
              {/* CTA Section */}
              <div className="text-center space-y-4">
                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
                  className="w-full shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_text"
                />
                
                {(blockContent.pricing_note || (mode as string) === 'edit') && (
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.pricing_note || ''}
                    onEdit={(value) => handleContentUpdate('pricing_note', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm ${mutedTextColor}`}
                    placeholder="Add pricing note..."
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="pricing_note"
                  />
                )}
              </div>
            </div>
        </div>

        {/* Volume Pricing Tiers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <h3 className="text-xl font-semibold text-gray-900">Volume Pricing Tiers</h3>
            {mode === 'edit' && (
              <button
                onClick={() => {
                  const currentBreakpoints = blockContent.tier_breakpoints || '1|10|25|50';
                  const currentDiscounts = blockContent.tier_discounts || '0|5|10|15';
                  const breakpoints = currentBreakpoints.split('|');
                  const discounts = currentDiscounts.split('|');
                  
                  // Add new tier
                  const newBreakpoint = Math.max(...breakpoints.map(b => parseInt(b) || 0)) * 2;
                  breakpoints.push(newBreakpoint.toString());
                  discounts.push('20'); // Default 20% discount for new tier
                  
                  handleContentUpdate('tier_breakpoints', breakpoints.join('|'));
                  handleContentUpdate('tier_discounts', discounts.join('|'));
                }}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors text-sm"
                title="Add pricing tier"
              >
                + Add Tier
              </button>
            )}
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {tierBreakpoints.map((breakpoint, index) => {
              const discount = tierDiscounts[index] || 0;
              return (
                <div key={index} className={`text-center p-4 rounded-lg border-2 transition-all duration-300 relative group/tier-${index} ${
                  units >= breakpoint 
                    ? `border-primary ${colorTokens.ctaBg.replace('bg-', 'bg-opacity-10 bg-')}` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div style={getTextStyle('body-lg')} className="font-bold text-gray-900">
                    {mode !== 'preview' ? (
                      <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const breakpoints = (blockContent.tier_breakpoints || '1|10|25|50').split('|');
                          breakpoints[index] = e.currentTarget.textContent || '0';
                          handleContentUpdate('tier_breakpoints', breakpoints.join('|'));
                        }}
                        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 inline-block min-w-[30px]"
                        data-placeholder="10"
                      >
                        {breakpoint}
                      </div>
                    ) : (
                      breakpoint
                    )}+ {blockContent.unit_label}
                  </div>
                  <div className={`text-sm mt-1 ${
                    discount > 0 ? 'text-green-600 font-medium' : mutedTextColor
                  }`}>
                    {mode !== 'preview' ? (
                      <div className="flex items-center justify-center space-x-1">
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const discounts = (blockContent.tier_discounts || '0|5|10|15').split('|');
                            discounts[index] = e.currentTarget.textContent || '0';
                            handleContentUpdate('tier_discounts', discounts.join('|'));
                          }}
                          className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 inline-block min-w-[20px] text-center"
                          data-placeholder="5"
                        >
                          {discount}
                        </div>
                        <span>% discount</span>
                      </div>
                    ) : (
                      discount > 0 ? `${discount}% discount` : 'Standard rate'
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ${((unitPrice * (100 - discount)) / 100).toFixed(2)}/user
                  </div>
                  
                  {/* Remove tier button - only in edit mode */}
                  {mode === 'edit' && tierBreakpoints.length > 2 && (
                    <button
                      onClick={() => {
                        const breakpoints = (blockContent.tier_breakpoints || '1|10|25|50').split('|');
                        const discounts = (blockContent.tier_discounts || '0|5|10|15').split('|');
                        breakpoints.splice(index, 1);
                        discounts.splice(index, 1);
                        handleContentUpdate('tier_breakpoints', breakpoints.join('|'));
                        handleContentUpdate('tier_discounts', discounts.join('|'));
                      }}
                      className={`opacity-0 group-hover/tier-${index}:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10`}
                      title="Remove this pricing tier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
                placeholder="Add optional supporting text to reinforce flexible pricing..."
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
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: ${colorTokens.ctaBg.replace('bg-', '')};
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: ${colorTokens.ctaBg.replace('bg-', '')};
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SliderPricing',
  category: 'Pricing',
  description: 'Interactive slider pricing for usage-based or per-seat models. Perfect for solution-aware audiences.',
  tags: ['pricing', 'slider', 'usage-based', 'per-seat', 'calculator'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'pricing_type', label: 'Pricing Type', type: 'text', required: true },
    { key: 'base_price', label: 'Base Price', type: 'text', required: true },
    { key: 'unit_price', label: 'Price Per Unit', type: 'text', required: true },
    { key: 'min_units', label: 'Minimum Units', type: 'text', required: true },
    { key: 'max_units', label: 'Maximum Units', type: 'text', required: true },
    { key: 'default_units', label: 'Default Units', type: 'text', required: true },
    { key: 'unit_label', label: 'Unit Label', type: 'text', required: true },
    { key: 'tier_breakpoints', label: 'Volume Discount Breakpoints (pipe separated)', type: 'text', required: false },
    { key: 'tier_discounts', label: 'Volume Discount Percentages (pipe separated)', type: 'text', required: false },
    { key: 'included_features', label: 'Included Features (comma separated)', type: 'textarea', required: true },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'pricing_note', label: 'Pricing Note', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive pricing slider',
    'Real-time price calculation',
    'Volume discount visualization',
    'Pricing breakdown display',
    'Annual savings calculation',
    'Quick preset selections'
  ],
  
  useCases: [
    'Usage-based pricing models',
    'Per-seat software pricing',
    'Volume discount pricing',
    'Solution-aware audiences',
    'API and service pricing'
  ]
};