import React from 'react';
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
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';

interface BonusStackCTAContent {
  headline: string;
  value_proposition: string;
  main_offer: string;
  bonus_items: string;
  bonus_values: string;
  total_value: string;
  discount_amount?: string;
  cta_text: string;
  urgency_text?: string;
  guarantee_text?: string;
  scarcity_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  social_proof_footer_text?: string;
  main_offer_badge?: string;
  bonus_badge?: string;
  bonus_description?: string;
  total_value_label?: string;
  final_cta_title?: string;
  final_cta_description?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Get Everything You Need to Succeed' 
  },
  value_proposition: { 
    type: 'string' as const, 
    default: 'Transform your business with our complete solution package' 
  },
  main_offer: { 
    type: 'string' as const, 
    default: 'Complete Business Automation Platform' 
  },
  bonus_items: { 
    type: 'string' as const, 
    default: 'Premium Templates Library|1-on-1 Strategy Call|Advanced Analytics Dashboard|Priority Email Support|Exclusive Community Access' 
  },
  bonus_values: { 
    type: 'string' as const, 
    default: '$297|$497|$197|$97|$197' 
  },
  total_value: { 
    type: 'string' as const, 
    default: '$1,285' 
  },
  discount_amount: { 
    type: 'string' as const, 
    default: '$786' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Get Complete Package Now' 
  },
  urgency_text: { 
    type: 'string' as const, 
    default: 'Limited time offer - expires in 48 hours' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '60-day money-back guarantee' 
  },
  scarcity_text: { 
    type: 'string' as const, 
    default: 'Only 50 packages available at this price' 
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
  trust_item_1: { 
    type: 'string' as const, 
    default: '60-day money back guarantee' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'Instant access after purchase' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'Secure payment processing' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  social_proof_footer_text: { 
    type: 'string' as const, 
    default: 'Join the leading enterprises who chose our platform' 
  },
  main_offer_badge: { 
    type: 'string' as const, 
    default: '🎯 MAIN OFFER' 
  },
  bonus_badge: { 
    type: 'string' as const, 
    default: '🎁 EXCLUSIVE BONUSES INCLUDED' 
  },
  bonus_description: { 
    type: 'string' as const, 
    default: 'When you order today, you\'ll also receive these valuable bonuses absolutely FREE:' 
  },
  total_value_label: { 
    type: 'string' as const, 
    default: 'Total Package Value:' 
  },
  final_cta_title: { 
    type: 'string' as const, 
    default: 'Ready to Get Started?' 
  },
  final_cta_description: { 
    type: 'string' as const, 
    default: 'Join thousands of users who have transformed their workflow with our simple 3-step process.' 
  }
};

export default function BonusStackCTA(props: LayoutComponentProps) {
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
  } = useLayoutComponent<BonusStackCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const bonusItems = blockContent.bonus_items 
    ? blockContent.bonus_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const bonusValues = blockContent.bonus_values 
    ? blockContent.bonus_values.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    // Check if individual trust item fields exist
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // If individual items exist, use them; otherwise fall back to legacy format
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    // Legacy format fallback
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : [];
  };
  
  const trustItems = getTrustItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const parseValue = (value: string) => {
    return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  };

  const totalValue = parseValue(blockContent.total_value);
  const discountAmount = parseValue(blockContent.discount_amount || '0');
  const finalPrice = totalValue - discountAmount;

  const BonusItem = ({ item, value, index }: { 
    item: string; 
    value: string; 
    index: number; 
  }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{item}</div>
          <div className="text-sm text-green-600 font-medium">BONUS #{index + 1}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">Value</div>
      </div>
    </div>
  );
  
  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BonusStackCTA"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the bonus offer..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-2xl mx-auto">
            <p className="text-gray-700 leading-relaxed" style={bodyLgStyle}>
              {blockContent.value_proposition}
            </p>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Bonus Stack CTA Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.value_proposition || ''}
                  onEdit={(value) => handleContentUpdate('value_proposition', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Value proposition"
                  sectionId={sectionId}
                  elementKey="value_proposition"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.main_offer || ''}
                  onEdit={(value) => handleContentUpdate('main_offer', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Main offer name"
                  sectionId={sectionId}
                  elementKey="main_offer"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.bonus_items || ''}
                  onEdit={(value) => handleContentUpdate('bonus_items', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Bonus items (pipe separated)"
                  sectionId={sectionId}
                  elementKey="bonus_items"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.bonus_values || ''}
                  onEdit={(value) => handleContentUpdate('bonus_values', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Bonus values (pipe separated)"
                  sectionId={sectionId}
                  elementKey="bonus_values"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Offer Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8 shadow-2xl">
              <div className="text-center">
                <div className="inline-block bg-yellow-400 text-blue-900 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.main_offer_badge || ''}
                    onEdit={(value) => handleContentUpdate('main_offer_badge', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm font-bold text-blue-900"
                    placeholder="🎯 MAIN OFFER"
                    sectionId={sectionId}
                    elementKey="main_offer_badge"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <h3 className="font-bold mb-6" style={h2Style}>{blockContent.main_offer}</h3>
                
                {/* Pricing */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {discountAmount > 0 && (
                    <div className="text-right">
                      <div className="text-lg line-through text-blue-200">
                        ${totalValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-200">Regular Price</div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="font-bold" style={{...h2Style, fontSize: 'clamp(2rem, 4vw, 2.5rem)'}}>
                      ${finalPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-200">Today Only</div>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="bg-red-500 text-white px-3 py-2 rounded-lg">
                      <div className="font-bold">Save</div>
                      <div className="text-sm">${discountAmount.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bonus Stack */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 mb-8">
              <div className="text-center mb-8">
                <div className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg mb-4">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.bonus_badge || ''}
                    onEdit={(value) => handleContentUpdate('bonus_badge', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="font-bold text-lg text-white"
                    placeholder="🎁 EXCLUSIVE BONUSES INCLUDED"
                    sectionId={sectionId}
                    elementKey="bonus_badge"
                    sectionBackground={sectionBackground}
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.bonus_description || ''}
                  onEdit={(value) => handleContentUpdate('bonus_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700"
                  placeholder="When you order today, you'll also receive these valuable bonuses absolutely FREE:"
                  sectionId={sectionId}
                  elementKey="bonus_description"
                  sectionBackground={sectionBackground}
                />
              </div>

              <div className="space-y-4 mb-8">
                {bonusItems.map((item, index) => (
                  <BonusItem 
                    key={index}
                    item={item}
                    value={bonusValues[index] || '$97'}
                    index={index}
                  />
                ))}
              </div>

              {/* Total Value Summary */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-300">
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.total_value_label || ''}
                    onEdit={(value) => handleContentUpdate('total_value_label', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-lg text-gray-600 mb-2"
                    placeholder="Total Package Value:"
                    sectionId={sectionId}
                    elementKey="total_value_label"
                    sectionBackground={sectionBackground}
                  />
                  <div className="font-bold text-green-600 mb-4" style={{...h2Style, fontSize: 'clamp(1.5rem, 3vw, 2rem)'}}>
                    {blockContent.total_value}
                  </div>
                  {discountAmount > 0 && (
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg inline-block">
                      <span className="font-bold">You Save: ${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gray-900 rounded-2xl p-8 text-white mb-8">
              <div className="mb-6">
                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
                  className="shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 text-lg py-4 px-8"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_text"
                />
              </div>

              {/* Urgency, Scarcity, Guarantee */}
              <div className="space-y-3">
                {blockContent.urgency_text && (
                  <div className="flex items-center justify-center space-x-2 text-yellow-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{blockContent.urgency_text}</span>
                  </div>
                )}

                {blockContent.scarcity_text && (
                  <div className="flex items-center justify-center space-x-2 text-red-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    <span className="font-semibold">{blockContent.scarcity_text}</span>
                  </div>
                )}

                {blockContent.guarantee_text && (
                  <div className="flex items-center justify-center space-x-2 text-green-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-semibold">{blockContent.guarantee_text}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the bonus offer..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(trustItems.length > 0 || mode === 'edit') && (
              <div className="mt-6">
                {mode === 'edit' ? (
                  <EditableTrustIndicators
                    mode={mode}
                    trustItems={[
                      blockContent.trust_item_1 || '',
                      blockContent.trust_item_2 || '',
                      blockContent.trust_item_3 || '',
                      blockContent.trust_item_4 || '',
                      blockContent.trust_item_5 || ''
                    ]}
                    onTrustItemChange={(index, value) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof BonusStackCTAContent;
                      handleContentUpdate(fieldKey, value);
                    }}
                    onAddTrustItem={() => {
                      // Find first empty slot and add placeholder
                      const emptyIndex = [
                        blockContent.trust_item_1,
                        blockContent.trust_item_2,
                        blockContent.trust_item_3,
                        blockContent.trust_item_4,
                        blockContent.trust_item_5
                      ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                      
                      if (emptyIndex !== -1) {
                        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof BonusStackCTAContent;
                        handleContentUpdate(fieldKey, 'New trust item');
                      }
                    }}
                    onRemoveTrustItem={(index) => {
                      const fieldKey = `trust_item_${index + 1}` as keyof BonusStackCTAContent;
                      handleContentUpdate(fieldKey, '___REMOVED___');
                    }}
                    colorTokens={colorTokens}
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    backgroundType={safeBackgroundType}
                    iconColor="text-green-500"
                    colorClass={mutedTextColor}
                  />
                ) : (
                  trustItems.length > 0 && (
                    <TrustIndicators 
                      items={trustItems}
                      colorClass={mutedTextColor}
                      iconColor="text-green-500"
                    />
                  )
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
  name: 'BonusStackCTA',
  category: 'Close',
  description: 'High-value bonus stack with urgency and scarcity elements. Perfect for conversion-focused offers with multiple incentives.',
  tags: ['bonus', 'stack', 'urgency', 'scarcity', 'conversion', 'offer'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'value_proposition', label: 'Value Proposition', type: 'textarea', required: true },
    { key: 'main_offer', label: 'Main Offer Name', type: 'text', required: true },
    { key: 'bonus_items', label: 'Bonus Items (pipe separated)', type: 'textarea', required: true },
    { key: 'bonus_values', label: 'Bonus Values (pipe separated)', type: 'text', required: true },
    { key: 'total_value', label: 'Total Package Value', type: 'text', required: true },
    { key: 'discount_amount', label: 'Discount Amount', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false },
    { key: 'scarcity_text', label: 'Scarcity Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Item 5', type: 'text', required: false },
    { key: 'main_offer_badge', label: 'Main Offer Badge', type: 'text', required: false },
    { key: 'bonus_badge', label: 'Bonus Badge', type: 'text', required: false },
    { key: 'bonus_description', label: 'Bonus Description', type: 'textarea', required: false },
    { key: 'total_value_label', label: 'Total Value Label', type: 'text', required: false }
  ],
  
  features: [
    'Visual bonus stack with values',
    'Main offer with pricing display',
    'Urgency and scarcity messaging',
    'Value calculation and savings display',
    'Trust indicators and guarantees',
    'High-conversion CTA design'
  ],
  
  useCases: [
    'High-ticket offer launches',
    'Course and program sales',
    'Bundle and package offers',
    'Limited-time promotions',
    'Conversion-focused landing pages'
  ]
};