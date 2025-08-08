import React, { useState, useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
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
  }
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
          <span className="font-medium">${(units * unitPrice).toFixed(2)}</span>
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

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Slider Pricing Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.pricing_type || ''}
                  onEdit={(value) => handleContentUpdate('pricing_type', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Pricing type (per-seat, usage-based, etc.)"
                  sectionId={sectionId}
                  elementKey="pricing_type"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.unit_price || ''}
                  onEdit={(value) => handleContentUpdate('unit_price', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Price per unit"
                  sectionId={sectionId}
                  elementKey="unit_price"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.unit_label || ''}
                  onEdit={(value) => handleContentUpdate('unit_label', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Unit label (team members, API calls, etc.)"
                  sectionId={sectionId}
                  elementKey="unit_label"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_breakpoints || ''}
                  onEdit={(value) => handleContentUpdate('tier_breakpoints', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Volume discount breakpoints (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tier_breakpoints"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_discounts || ''}
                  onEdit={(value) => handleContentUpdate('tier_discounts', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Volume discount percentages (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tier_discounts"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            
            {/* Pricing Calculator */}
            <div className="space-y-8">
              
              {/* Units Slider */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{units}</div>
                  <div className="text-lg text-gray-600">{blockContent.unit_label}</div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Everything Included</h3>
                <div className="space-y-3">
                  {includedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
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
                
                {blockContent.pricing_note && (
                  <p className={`text-sm ${mutedTextColor}`}>
                    {blockContent.pricing_note}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Volume Pricing Tiers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">Volume Pricing Tiers</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {tierBreakpoints.map((breakpoint, index) => {
              const discount = tierDiscounts[index] || 0;
              return (
                <div key={index} className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                  units >= breakpoint 
                    ? `border-primary ${colorTokens.ctaBg.replace('bg-', 'bg-opacity-10 bg-')}` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div style={bodyLgStyle} className="font-bold text-gray-900">
                    {breakpoint}+ {blockContent.unit_label}
                  </div>
                  <div className={`text-sm mt-1 ${
                    discount > 0 ? 'text-green-600 font-medium' : mutedTextColor
                  }`}>
                    {discount > 0 ? `${discount}% discount` : 'Standard rate'}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ${((unitPrice * (100 - discount)) / 100).toFixed(2)}/user
                  </div>
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