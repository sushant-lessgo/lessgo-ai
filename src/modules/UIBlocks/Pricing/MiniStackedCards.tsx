import React from 'react';
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

interface MiniStackedCardsContent {
  headline: string;
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  key_features: string;
  billing_cycles?: string;
  savings_labels?: string;
  feature_highlights?: string;
  popular_tiers?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  // All plans include section
  plans_feature_1?: string;
  plans_feature_1_title?: string;
  plans_feature_1_desc?: string;
  plans_feature_1_icon?: string;
  plans_feature_2?: string;
  plans_feature_2_title?: string;
  plans_feature_2_desc?: string;
  plans_feature_2_icon?: string;
  plans_feature_3?: string;
  plans_feature_3_title?: string;
  plans_feature_3_desc?: string;
  plans_feature_3_icon?: string;
  show_plans_features?: boolean;
  // FAQ section
  faq_question_1?: string;
  faq_answer_1?: string;
  faq_question_2?: string;
  faq_answer_2?: string;
  faq_question_3?: string;
  faq_answer_3?: string;
  faq_question_4?: string;
  faq_answer_4?: string;
  show_faq?: boolean;
  // Trust indicators
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  show_trust_bar?: boolean;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Simple, Transparent Pricing' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Basic|Pro|Business|Enterprise' 
  },
  tier_prices: { 
    type: 'string' as const, 
    default: '$9|$29|$79|Contact Sales' 
  },
  tier_descriptions: { 
    type: 'string' as const, 
    default: 'For individuals getting started|For small teams and projects|For growing businesses|For large organizations' 
  },
  cta_texts: { 
    type: 'string' as const, 
    default: 'Get Started|Start Free Trial|Start Free Trial|Contact Sales' 
  },
  key_features: { 
    type: 'string' as const, 
    default: '5 projects,2GB storage,Basic support|25 projects,20GB storage,Priority support,Team collaboration|Unlimited projects,100GB storage,Advanced features,Custom integrations|Enterprise features,Unlimited everything,Dedicated support,Custom deployment' 
  },
  billing_cycles: { 
    type: 'string' as const, 
    default: '/month|/month|/month|' 
  },
  savings_labels: { 
    type: 'string' as const, 
    default: '|Save 20%|Save 25%|Custom' 
  },
  feature_highlights: { 
    type: 'string' as const, 
    default: 'Perfect for trying out|Most popular choice|Best for growing teams|Maximum flexibility' 
  },
  popular_tiers: { 
    type: 'string' as const, 
    default: 'false|true|false|false' 
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
  // All plans include section
  plans_feature_1: { 
    type: 'string' as const, 
    default: 'secure-reliable' 
  },
  plans_feature_1_title: { 
    type: 'string' as const, 
    default: 'Secure & Reliable' 
  },
  plans_feature_1_desc: { 
    type: 'string' as const, 
    default: 'Enterprise-grade security with 99.9% uptime guarantee' 
  },
  plans_feature_1_icon: { 
    type: 'string' as const, 
    default: '🔒' 
  },
  plans_feature_2: { 
    type: 'string' as const, 
    default: 'expert-support' 
  },
  plans_feature_2_title: { 
    type: 'string' as const, 
    default: 'Expert Support' 
  },
  plans_feature_2_desc: { 
    type: 'string' as const, 
    default: 'Get help when you need it from our expert support team' 
  },
  plans_feature_2_icon: { 
    type: 'string' as const, 
    default: '💬' 
  },
  plans_feature_3: { 
    type: 'string' as const, 
    default: 'easy-migration' 
  },
  plans_feature_3_title: { 
    type: 'string' as const, 
    default: 'Easy Migration' 
  },
  plans_feature_3_desc: { 
    type: 'string' as const, 
    default: 'Upgrade or downgrade your plan anytime without hassle' 
  },
  plans_feature_3_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  show_plans_features: { 
    type: 'boolean' as const, 
    default: true 
  },
  // FAQ section
  faq_question_1: { 
    type: 'string' as const, 
    default: 'Can I change plans later?' 
  },
  faq_answer_1: { 
    type: 'string' as const, 
    default: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' 
  },
  faq_question_2: { 
    type: 'string' as const, 
    default: 'Is there a free trial?' 
  },
  faq_answer_2: { 
    type: 'string' as const, 
    default: 'Yes, all paid plans come with a 14-day free trial. No credit card required.' 
  },
  faq_question_3: { 
    type: 'string' as const, 
    default: 'What payment methods do you accept?' 
  },
  faq_answer_3: { 
    type: 'string' as const, 
    default: 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.' 
  },
  faq_question_4: { 
    type: 'string' as const, 
    default: 'Do you offer refunds?' 
  },
  faq_answer_4: { 
    type: 'string' as const, 
    default: 'Yes, we offer a 30-day money-back guarantee on all plans. No questions asked.' 
  },
  show_faq: { 
    type: 'boolean' as const, 
    default: true 
  },
  // Trust indicators
  trust_item_1: { 
    type: 'string' as const, 
    default: '14-day free trial' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'No setup fees' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'Cancel anytime' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '30-day money back' 
  },
  show_trust_bar: { 
    type: 'boolean' as const, 
    default: true 
  }
};

export default function MiniStackedCards(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<MiniStackedCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const tierNames = blockContent.tier_names 
    ? blockContent.tier_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tierPrices = blockContent.tier_prices 
    ? blockContent.tier_prices.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tierDescriptions = blockContent.tier_descriptions 
    ? blockContent.tier_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const ctaTexts = blockContent.cta_texts 
    ? blockContent.cta_texts.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const keyFeatures = blockContent.key_features 
    ? blockContent.key_features.split('|').map(item => item.trim().split(',').map(f => f.trim())).filter(Boolean)
    : [];

  const billingCycles = blockContent.billing_cycles 
    ? blockContent.billing_cycles.split('|').map(item => item.trim())
    : [];

  const savingsLabels = blockContent.savings_labels 
    ? blockContent.savings_labels.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureHighlights = blockContent.feature_highlights 
    ? blockContent.feature_highlights.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const popularTiers = blockContent.popular_tiers 
    ? blockContent.popular_tiers.split('|').map(item => item.trim().toLowerCase() === 'true')
    : [];

  const pricingTiers = tierNames.map((name, index) => ({
    name,
    price: tierPrices[index] || '',
    description: tierDescriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    features: keyFeatures[index] || [],
    billingCycle: billingCycles[index] || '/month',
    savingsLabel: savingsLabels[index] || '',
    highlight: featureHighlights[index] || '',
    isPopular: popularTiers[index] || false
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Helper functions to get editable content
  const getPlansFeatures = () => {
    const features = [
      {
        icon: blockContent.plans_feature_1 || 'secure-reliable',
        title: blockContent.plans_feature_1_title || 'Secure & Reliable',
        description: blockContent.plans_feature_1_desc || 'Enterprise-grade security with 99.9% uptime guarantee'
      },
      {
        icon: blockContent.plans_feature_2 || 'expert-support',
        title: blockContent.plans_feature_2_title || 'Expert Support',
        description: blockContent.plans_feature_2_desc || 'Get help when you need it from our expert support team'
      },
      {
        icon: blockContent.plans_feature_3 || 'easy-migration',
        title: blockContent.plans_feature_3_title || 'Easy Migration',
        description: blockContent.plans_feature_3_desc || 'Upgrade or downgrade your plan anytime without hassle'
      }
    ].filter(feature => 
      feature.title !== '___REMOVED___' && 
      feature.description !== '___REMOVED___' && 
      feature.title.trim() !== '' && 
      feature.description.trim() !== ''
    );
    
    return features;
  };

  const getFaqItems = () => {
    const faqs = [
      {
        question: blockContent.faq_question_1 || '',
        answer: blockContent.faq_answer_1 || ''
      },
      {
        question: blockContent.faq_question_2 || '',
        answer: blockContent.faq_answer_2 || ''
      },
      {
        question: blockContent.faq_question_3 || '',
        answer: blockContent.faq_answer_3 || ''
      },
      {
        question: blockContent.faq_question_4 || '',
        answer: blockContent.faq_answer_4 || ''
      }
    ].filter(faq => 
      faq.question !== '___REMOVED___' && 
      faq.answer !== '___REMOVED___' && 
      faq.question.trim() !== '' && 
      faq.answer.trim() !== ''
    );
    
    return faqs;
  };

  const getTrustBarItems = () => {
    const items = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3,
      blockContent.trust_item_4
    ].filter((item): item is string => 
      Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
    );
    
    return items;
  };

  const getFeatureIcon = (iconName: string) => {
    const icons = {
      'secure-reliable': (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      'expert-support': (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      'easy-migration': (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'default': (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    };
    return icons[iconName as keyof typeof icons] || icons.default;
  };

  const plansFeatures = getPlansFeatures();
  const faqItems = getFaqItems();
  const trustBarItems = getTrustBarItems();

  const MiniPricingCard = ({ tier, index, h3Style, getTypographyStyle }: {
    tier: typeof pricingTiers[0];
    index: number;
    h3Style: React.CSSProperties;
    getTypographyStyle: (variant: string) => React.CSSProperties;
  }) => (
    <div className={`relative bg-white rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group/pricing-card ${
      tier.isPopular 
        ? `border-primary shadow-lg` 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className={`absolute -top-2 -right-2 ${colorTokens.ctaBg} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
          Popular
        </div>
      )}

      {/* Savings Badge */}
      {tier.savingsLabel && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const savings = blockContent.savings_labels ? blockContent.savings_labels.split('|') : [];
                savings[index] = e.currentTarget.textContent || '';
                handleContentUpdate('savings_labels', savings.join('|'));
              }}
              className="outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-1 cursor-text min-h-[16px]"
            >
              {tier.savingsLabel}
            </div>
          ) : (
            tier.savingsLabel
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4">
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
            style={h3Style}
            className="font-bold text-gray-900 mb-1 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[24px]"
          >
            {tier.name}
          </div>
        ) : (
          <h3 style={h3Style} className="font-bold text-gray-900 mb-1">{tier.name}</h3>
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
            className={`text-xs ${mutedTextColor} mb-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[18px]`}
          >
            {tier.description}
          </div>
        ) : (
          <p className={`text-xs ${mutedTextColor} mb-3`}>{tier.description}</p>
        )}
        
        {/* Price */}
        <div className="mb-3">
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const prices = blockContent.tier_prices.split('|');
                prices[index] = e.currentTarget.textContent || '';
                handleContentUpdate('tier_prices', prices.join('|'));
              }}
              style={getTypographyStyle('h2')}
              className="font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[32px] inline-block"
            >
              {tier.price.includes('$') ? tier.price : `$${tier.price}`}
            </div>
          ) : (
            <span style={getTypographyStyle('h2')} className="font-bold text-gray-900">
              {tier.price.includes('$') ? tier.price : `$${tier.price}`}
            </span>
          )}
          {tier.billingCycle && !tier.price.toLowerCase().includes('contact') && (
            <span className={`text-sm ${mutedTextColor}`}>
              {mode !== 'preview' ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const cycles = blockContent.billing_cycles ? blockContent.billing_cycles.split('|') : [];
                    cycles[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('billing_cycles', cycles.join('|'));
                  }}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50"
                >
                  {tier.billingCycle}
                </span>
              ) : (
                tier.billingCycle
              )}
            </span>
          )}
        </div>

        {/* Editable Highlight */}
        {(tier.highlight || mode === 'edit') && (
          <div className={`text-xs ${tier.isPopular ? colorTokens.ctaText : 'text-blue-600'} font-medium mb-3`}>
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const highlights = blockContent.feature_highlights ? blockContent.feature_highlights.split('|') : [];
                  highlights[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('feature_highlights', highlights.join('|'));
                }}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[18px]"
                data-placeholder="Add highlight..."
              >
                {tier.highlight}
              </div>
            ) : (
              tier.highlight
            )}
          </div>
        )}
      </div>

      {/* Key Features */}
      <div className="space-y-2 mb-4">
        {tier.features.slice(0, 3).map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-center space-x-2 group/feature-item">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {mode !== 'preview' ? (
              <div className="flex-1 relative">
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const allFeatures = blockContent.key_features.split('|');
                    const tierFeatures = allFeatures[index] ? allFeatures[index].split(',') : [];
                    tierFeatures[featureIndex] = e.currentTarget.textContent || '';
                    allFeatures[index] = tierFeatures.join(',');
                    handleContentUpdate('key_features', allFeatures.join('|'));
                  }}
                  className="text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[20px] block"
                >
                  {feature}
                </span>
                {/* Remove feature button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const allFeatures = blockContent.key_features.split('|');
                    const tierFeatures = allFeatures[index] ? allFeatures[index].split(',') : [];
                    tierFeatures.splice(featureIndex, 1);
                    allFeatures[index] = tierFeatures.join(',');
                    handleContentUpdate('key_features', allFeatures.join('|'));
                  }}
                  className="opacity-0 group-hover/feature-item:opacity-100 absolute -top-1 -right-1 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                  title="Remove this feature"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-700">{feature}</span>
            )}
          </div>
        ))}
        
        {/* Add feature button - only in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={() => {
              const allFeatures = blockContent.key_features.split('|');
              const tierFeatures = allFeatures[index] ? allFeatures[index].split(',') : [];
              tierFeatures.push('New feature');
              allFeatures[index] = tierFeatures.join(',');
              handleContentUpdate('key_features', allFeatures.join('|'));
            }}
            className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add feature</span>
          </button>
        )}
        
        {tier.features.length > 3 && (
          <div className={`text-xs ${mutedTextColor} italic`}>
            +{tier.features.length - 3} more features
          </div>
        )}
      </div>

      {/* CTA Button */}
      <CTAButton
        text={tier.ctaText}
        colorTokens={colorTokens}
        className="w-full text-sm py-2"
        variant={tier.isPopular ? "primary" : "secondary"}
        sectionId={sectionId}
        elementKey={`cta_${index}`}
      />

      {/* Remove tier button - only in edit mode and when we have more than 2 tiers */}
      {mode === 'edit' && pricingTiers.length > 2 && (
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
            handleContentUpdate('tier_prices', removeFromPipeList(blockContent.tier_prices, index));
            handleContentUpdate('tier_descriptions', removeFromPipeList(blockContent.tier_descriptions, index));
            handleContentUpdate('cta_texts', removeFromPipeList(blockContent.cta_texts, index));
            handleContentUpdate('key_features', removeFromPipeList(blockContent.key_features, index));
            
            if (blockContent.billing_cycles) {
              handleContentUpdate('billing_cycles', removeFromPipeList(blockContent.billing_cycles, index));
            }
            if (blockContent.savings_labels) {
              handleContentUpdate('savings_labels', removeFromPipeList(blockContent.savings_labels, index));
            }
            if (blockContent.feature_highlights) {
              handleContentUpdate('feature_highlights', removeFromPipeList(blockContent.feature_highlights, index));
            }
            if (blockContent.popular_tiers) {
              handleContentUpdate('popular_tiers', removeFromPipeList(blockContent.popular_tiers, index));
            }
          }}
          className="opacity-0 group-hover/pricing-card:opacity-100 absolute -top-2 -left-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-20 bg-white rounded-full p-1 shadow-sm"
          title="Remove this pricing tier"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MiniStackedCards"
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

          {(blockContent.subheadline || (mode as string) === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce mini pricing cards..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <>
          {/* Mini Pricing Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative">
            {pricingTiers.map((tier, index) => (
              <MiniPricingCard
                key={index}
                tier={tier}
                index={index}
                h3Style={h3Style}
                getTypographyStyle={getTypographyStyle as (variant: string) => React.CSSProperties}
              />
            ))}
            
            {/* Add tier button - only in edit mode and when we have less than 4 tiers */}
            {mode === 'edit' && pricingTiers.length < 4 && (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    // Add a new tier with default values
                    const names = blockContent.tier_names.split('|');
                    const prices = blockContent.tier_prices.split('|');
                    const descriptions = blockContent.tier_descriptions.split('|');
                    const ctas = blockContent.cta_texts.split('|');
                    const features = blockContent.key_features.split('|');
                    const cycles = blockContent.billing_cycles ? blockContent.billing_cycles.split('|') : [];
                    const savings = blockContent.savings_labels ? blockContent.savings_labels.split('|') : [];
                    const highlights = blockContent.feature_highlights ? blockContent.feature_highlights.split('|') : [];
                    const popularLabels = blockContent.popular_tiers ? blockContent.popular_tiers.split('|') : [];
                    
                    // Add smart defaults
                    const tierNumber = names.length + 1;
                    names.push(tierNumber === 1 ? 'Starter' : tierNumber === 2 ? 'Pro' : tierNumber === 3 ? 'Business' : 'Enterprise');
                    prices.push(tierNumber === 1 ? '$9' : tierNumber === 2 ? '$29' : tierNumber === 3 ? '$79' : 'Contact Sales');
                    descriptions.push(tierNumber === 1 ? 'Perfect for getting started' : tierNumber === 2 ? 'For small teams' : tierNumber === 3 ? 'For growing businesses' : 'Enterprise solutions');
                    ctas.push(tierNumber === 4 ? 'Contact Sales' : 'Get Started');
                    features.push('Basic features,Standard support');
                    cycles.push(tierNumber < 4 ? '/month' : '');
                    savings.push('');
                    highlights.push('');
                    popularLabels.push(tierNumber === 2 ? 'true' : 'false');
                    
                    handleContentUpdate('tier_names', names.join('|'));
                    handleContentUpdate('tier_prices', prices.join('|'));
                    handleContentUpdate('tier_descriptions', descriptions.join('|'));
                    handleContentUpdate('cta_texts', ctas.join('|'));
                    handleContentUpdate('key_features', features.join('|'));
                    handleContentUpdate('billing_cycles', cycles.join('|'));
                    handleContentUpdate('savings_labels', savings.join('|'));
                    handleContentUpdate('feature_highlights', highlights.join('|'));
                    handleContentUpdate('popular_tiers', popularLabels.join('|'));
                  }}
                  className="h-32 w-full min-w-[200px] border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-300 bg-gray-50 hover:bg-gray-100"
                  title="Add new pricing tier"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Add Tier</span>
                </button>
              </div>
            )}
          </div>

            {/* Additional Features Comparison */}
            {((blockContent.show_plans_features !== false && plansFeatures.length > 0) || mode === 'edit') && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12 relative group/plans-features-section">
                <h3 style={h3Style} className="font-semibold text-gray-900 text-center mb-8">All plans include</h3>
                
                {/* Delete Section Button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('show_plans_features', String(false));
                      handleContentUpdate('plans_feature_1_title', '___REMOVED___');
                      handleContentUpdate('plans_feature_1_desc', '___REMOVED___');
                      handleContentUpdate('plans_feature_1_icon', '___REMOVED___');
                      handleContentUpdate('plans_feature_2_title', '___REMOVED___');
                      handleContentUpdate('plans_feature_2_desc', '___REMOVED___');
                      handleContentUpdate('plans_feature_2_icon', '___REMOVED___');
                      handleContentUpdate('plans_feature_3_title', '___REMOVED___');
                      handleContentUpdate('plans_feature_3_desc', '___REMOVED___');
                      handleContentUpdate('plans_feature_3_icon', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/plans-features-section:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                    title="Remove All Plans Include section"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((index) => {
                    const featureTitle = String(blockContent[`plans_feature_${index}_title` as keyof MiniStackedCardsContent] || '');
                    const featureDesc = String(blockContent[`plans_feature_${index}_desc` as keyof MiniStackedCardsContent] || '');
                    const featureIcon = String(blockContent[`plans_feature_${index}` as keyof MiniStackedCardsContent] || 'default');
                    
                    // Only show features that exist or in edit mode
                    if (!featureTitle && !featureDesc && mode !== 'edit') return null;
                    
                    return (
                      <div key={index} className="text-center relative group/plans-feature">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center group/icon-edit">
                          <IconEditableText
                            mode={mode}
                            value={String(blockContent[`plans_feature_${index}_icon` as keyof MiniStackedCardsContent] || '🎯')}
                            onEdit={(value) => handleContentUpdate(`plans_feature_${index}_icon`, value)}
                            backgroundType={backgroundType}
                            colorTokens={colorTokens}
                            iconSize="md"
                            className="text-2xl"
                            sectionId={sectionId}
                            elementKey={`plans_feature_${index}_icon`}
                          />
                        </div>
                        
                        {/* Editable Feature Title */}
                        {mode !== 'preview' ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleContentUpdate(`plans_feature_${index}_title`, e.currentTarget.textContent || '');
                            }}
                            style={h4Style}
                            className="font-semibold text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[24px]"
                            data-placeholder={`Feature ${index} title`}
                          >
                            {featureTitle}
                          </div>
                        ) : (
                          <h4 style={h4Style} className="font-semibold text-gray-900 mb-2">{featureTitle}</h4>
                        )}
                        
                        {/* Editable Feature Description */}
                        {mode !== 'preview' ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleContentUpdate(`plans_feature_${index}_desc`, e.currentTarget.textContent || '');
                            }}
                            className={`text-sm ${mutedTextColor} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-50 min-h-[20px]`}
                            data-placeholder={`Feature ${index} description`}
                          >
                            {featureDesc}
                          </div>
                        ) : (
                          <p className={`text-sm ${mutedTextColor}`}>{featureDesc}</p>
                        )}
                        
                        {/* Remove button */}
                        {mode === 'edit' && (featureTitle || featureDesc) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(`plans_feature_${index}_title`, '___REMOVED___');
                              handleContentUpdate(`plans_feature_${index}_desc`, '___REMOVED___');
                              handleContentUpdate(`plans_feature_${index}`, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/plans-feature:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
                            title="Remove this feature"
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
            )}

            {/* FAQ Section */}
            {((blockContent.show_faq !== false && faqItems.length > 0) || mode === 'edit') && (
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 mb-12 relative group/faq-section">
                <h3 style={h3Style} className="font-semibold text-gray-900 text-center mb-8">Frequently Asked Questions</h3>
                
                {/* Delete Section Button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('show_faq', String(false));
                      handleContentUpdate('faq_question_1', '___REMOVED___');
                      handleContentUpdate('faq_answer_1', '___REMOVED___');
                      handleContentUpdate('faq_question_2', '___REMOVED___');
                      handleContentUpdate('faq_answer_2', '___REMOVED___');
                      handleContentUpdate('faq_question_3', '___REMOVED___');
                      handleContentUpdate('faq_answer_3', '___REMOVED___');
                      handleContentUpdate('faq_question_4', '___REMOVED___');
                      handleContentUpdate('faq_answer_4', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/faq-section:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                    title="Remove FAQ section"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((index) => {
                    const question = String(blockContent[`faq_question_${index}` as keyof MiniStackedCardsContent] || '');
                    const answer = String(blockContent[`faq_answer_${index}` as keyof MiniStackedCardsContent] || '');
                    
                    // Only show FAQs that exist or in edit mode
                    if (!question && !answer && mode !== 'edit') return null;
                    
                    return (
                      <div key={index} className="relative group/faq-item">
                        {/* Editable Question */}
                        {mode !== 'preview' ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleContentUpdate(`faq_question_${index}`, e.currentTarget.textContent || '');
                            }}
                            style={h4Style}
                            className="font-semibold text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 min-h-[24px]"
                            data-placeholder={`FAQ Question ${index}`}
                          >
                            {question}
                          </div>
                        ) : (
                          <h4 style={h4Style} className="font-semibold text-gray-900 mb-2">{question}</h4>
                        )}
                        
                        {/* Editable Answer */}
                        {mode !== 'preview' ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleContentUpdate(`faq_answer_${index}`, e.currentTarget.textContent || '');
                            }}
                            className={`text-sm ${mutedTextColor} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 min-h-[20px]`}
                            data-placeholder={`FAQ Answer ${index}`}
                          >
                            {answer}
                          </div>
                        ) : (
                          <p className={`text-sm ${mutedTextColor}`}>{answer}</p>
                        )}
                        
                        {/* Remove button */}
                        {mode === 'edit' && (question || answer) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(`faq_question_${index}`, '___REMOVED___');
                              handleContentUpdate(`faq_answer_${index}`, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/faq-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
                            title="Remove this FAQ"
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
            )}

            {/* Trust Indicators */}
            {((blockContent.show_trust_bar !== false && trustBarItems.length > 0) || mode === 'edit') && (
              <div className="text-center bg-blue-50 rounded-xl p-6 border border-blue-100 relative group/trust-section">
                
                {/* Delete Section Button */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContentUpdate('show_trust_bar', String(false));
                      handleContentUpdate('trust_item_1', '___REMOVED___');
                      handleContentUpdate('trust_item_2', '___REMOVED___');
                      handleContentUpdate('trust_item_3', '___REMOVED___');
                      handleContentUpdate('trust_item_4', '___REMOVED___');
                    }}
                    className="opacity-0 group-hover/trust-section:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                    title="Remove Trust Indicators section"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <div className="flex flex-wrap justify-center items-center gap-4">
                  {[1, 2, 3, 4].map((index) => {
                    const trustItem = String(blockContent[`trust_item_${index}` as keyof MiniStackedCardsContent] || '');
                    
                    // Only show trust items that exist or in edit mode
                    if (!trustItem && mode !== 'edit') return null;
                    
                    return (
                      <div key={index} className="flex items-center space-x-2 relative group/trust-item">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        
                        {/* Editable Trust Item */}
                        {mode !== 'preview' ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleContentUpdate(`trust_item_${index}`, e.currentTarget.textContent || '');
                            }}
                            className="text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-blue-100 min-h-[20px]"
                            data-placeholder={`Trust item ${index}`}
                          >
                            {trustItem}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{trustItem}</span>
                        )}
                        
                        {/* Remove button */}
                        {mode === 'edit' && trustItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate(`trust_item_${index}`, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/trust-item:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 z-10 shadow-sm"
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
            )}
          </>

        {(blockContent.supporting_text || blockContent.trust_items || (mode as string) === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || (mode as string) === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce simple pricing..."
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
  name: 'MiniStackedCards',
  category: 'Pricing',
  description: 'Compact mini pricing cards in a clean grid layout. Perfect for simple pricing with space constraints.',
  tags: ['pricing', 'mini', 'compact', 'simple', 'grid'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tier_names', label: 'Tier Names (pipe separated)', type: 'text', required: true },
    { key: 'tier_prices', label: 'Tier Prices (pipe separated)', type: 'text', required: true },
    { key: 'tier_descriptions', label: 'Tier Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_texts', label: 'CTA Button Texts (pipe separated)', type: 'text', required: true },
    { key: 'key_features', label: 'Key Features (pipe separated tiers, comma separated features)', type: 'textarea', required: true },
    { key: 'billing_cycles', label: 'Billing Cycles (pipe separated)', type: 'text', required: false },
    { key: 'savings_labels', label: 'Savings Labels (pipe separated)', type: 'text', required: false },
    { key: 'feature_highlights', label: 'Feature Highlights (pipe separated)', type: 'text', required: false },
    { key: 'popular_tiers', label: 'Popular Tiers true/false (pipe separated)', type: 'text', required: false },
    { key: 'plans_feature_1_title', label: 'Plans Feature 1 Title', type: 'text', required: false },
    { key: 'plans_feature_1_desc', label: 'Plans Feature 1 Description', type: 'text', required: false },
    { key: 'plans_feature_1_icon', label: 'Plans Feature 1 Icon', type: 'text', required: false },
    { key: 'plans_feature_2_title', label: 'Plans Feature 2 Title', type: 'text', required: false },
    { key: 'plans_feature_2_desc', label: 'Plans Feature 2 Description', type: 'text', required: false },
    { key: 'plans_feature_2_icon', label: 'Plans Feature 2 Icon', type: 'text', required: false },
    { key: 'plans_feature_3_title', label: 'Plans Feature 3 Title', type: 'text', required: false },
    { key: 'plans_feature_3_desc', label: 'Plans Feature 3 Description', type: 'text', required: false },
    { key: 'plans_feature_3_icon', label: 'Plans Feature 3 Icon', type: 'text', required: false },
    { key: 'show_plans_features', label: 'Show Plans Features Section', type: 'boolean', required: false },
    { key: 'faq_question_1', label: 'FAQ Question 1', type: 'text', required: false },
    { key: 'faq_answer_1', label: 'FAQ Answer 1', type: 'text', required: false },
    { key: 'faq_question_2', label: 'FAQ Question 2', type: 'text', required: false },
    { key: 'faq_answer_2', label: 'FAQ Answer 2', type: 'text', required: false },
    { key: 'faq_question_3', label: 'FAQ Question 3', type: 'text', required: false },
    { key: 'faq_answer_3', label: 'FAQ Answer 3', type: 'text', required: false },
    { key: 'faq_question_4', label: 'FAQ Question 4', type: 'text', required: false },
    { key: 'faq_answer_4', label: 'FAQ Answer 4', type: 'text', required: false },
    { key: 'show_faq', label: 'Show FAQ Section', type: 'boolean', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'show_trust_bar', label: 'Show Trust Bar Section', type: 'boolean', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Compact mini pricing cards',
    'Clean grid layout',
    'Popular plan highlighting',
    'Savings badges',
    'Built-in FAQ section',
    'Trust indicators bar'
  ],
  
  useCases: [
    'Simple pricing display',
    'Space-constrained layouts',
    'Quick pricing comparison',
    'Mobile-first pricing',
    'Landing page pricing'
  ]
};