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
  plans_feature_2?: string;
  plans_feature_2_title?: string;
  plans_feature_2_desc?: string;
  plans_feature_3?: string;
  plans_feature_3_title?: string;
  plans_feature_3_desc?: string;
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
    <div className={`relative bg-white rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
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
          {tier.savingsLabel}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h3 style={h3Style} className="font-bold text-gray-900 mb-1">{tier.name}</h3>
        <p className={`text-xs ${mutedTextColor} mb-3`}>{tier.description}</p>
        
        {/* Price */}
        <div className="mb-3">
          <span style={getTypographyStyle('h2')} className="font-bold text-gray-900">
            {tier.price.includes('$') ? tier.price : `$${tier.price}`}
          </span>
          {tier.billingCycle && !tier.price.toLowerCase().includes('contact') && (
            <span className={`text-sm ${mutedTextColor}`}>{tier.billingCycle}</span>
          )}
        </div>

        {/* Highlight */}
        {tier.highlight && (
          <div className={`text-xs ${tier.isPopular ? colorTokens.ctaText : 'text-blue-600'} font-medium mb-3`}>
            {tier.highlight}
          </div>
        )}
      </div>

      {/* Key Features */}
      <div className="space-y-2 mb-4">
        {tier.features.slice(0, 3).map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
        
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
              placeholder="Add optional subheadline to introduce mini pricing cards..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 style={h4Style} className="font-semibold text-gray-700 mb-4">Mini Stacked Cards Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tier_names || ''}
                  onEdit={(value) => handleContentUpdate('tier_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Tier names (pipe separated)"
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
                  placeholder="Tier prices (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tier_prices"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.key_features || ''}
                  onEdit={(value) => handleContentUpdate('key_features', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Key features (pipe separated tiers, comma separated features)"
                  sectionId={sectionId}
                  elementKey="key_features"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_highlights || ''}
                  onEdit={(value) => handleContentUpdate('feature_highlights', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature highlights (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_highlights"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mini Pricing Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {pricingTiers.map((tier, index) => (
                <MiniPricingCard
                  key={index}
                  tier={tier}
                  index={index}
                  h3Style={h3Style}
                  getTypographyStyle={getTypographyStyle as (variant: string) => React.CSSProperties}
                />
              ))}
            </div>

            {/* Additional Features Comparison */}
            {((blockContent.show_plans_features !== false && plansFeatures.length > 0) || mode === 'edit') && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
                <h3 style={h3Style} className="font-semibold text-gray-900 text-center mb-8">All plans include</h3>
                
                {mode === 'edit' ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((index) => {
                        const featureTitle = blockContent[`plans_feature_${index}_title` as keyof MiniStackedCardsContent] || '';
                        const featureDesc = blockContent[`plans_feature_${index}_desc` as keyof MiniStackedCardsContent] || '';
                        const featureIcon = blockContent[`plans_feature_${index}` as keyof MiniStackedCardsContent] || 'default';
                        
                        return (
                          <div key={index} className="text-center relative group/plans-feature">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                              {getFeatureIcon(featureIcon)}
                            </div>
                            <EditableAdaptiveText
                              mode={mode}
                              value={featureTitle}
                              onEdit={(value) => handleContentUpdate(`plans_feature_${index}_title`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              style={h4Style}
                              className="font-semibold text-gray-900 mb-2"
                              placeholder={`Feature ${index} title`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`plans_feature_${index}_title`}
                            />
                            <EditableAdaptiveText
                              mode={mode}
                              value={featureDesc}
                              onEdit={(value) => handleContentUpdate(`plans_feature_${index}_desc`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              className={`text-sm ${mutedTextColor}`}
                              placeholder={`Feature ${index} description`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`plans_feature_${index}_desc`}
                            />
                            
                            {/* Remove button */}
                            {(featureTitle || featureDesc) && (
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
                ) : (
                  <div className="grid md:grid-cols-3 gap-8">
                    {plansFeatures.map((feature, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          {getFeatureIcon(feature.icon)}
                        </div>
                        <h4 style={h4Style} className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                        <p className={`text-sm ${mutedTextColor}`}>
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAQ Section */}
            {((blockContent.show_faq !== false && faqItems.length > 0) || mode === 'edit') && (
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 mb-12">
                <h3 style={h3Style} className="font-semibold text-gray-900 text-center mb-8">Frequently Asked Questions</h3>
                
                {mode === 'edit' ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((index) => {
                        const question = blockContent[`faq_question_${index}` as keyof MiniStackedCardsContent] || '';
                        const answer = blockContent[`faq_answer_${index}` as keyof MiniStackedCardsContent] || '';
                        
                        return (
                          <div key={index} className="relative group/faq-item">
                            <EditableAdaptiveText
                              mode={mode}
                              value={question}
                              onEdit={(value) => handleContentUpdate(`faq_question_${index}`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              style={h4Style}
                              className="font-semibold text-gray-900 mb-2"
                              placeholder={`FAQ Question ${index}`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`faq_question_${index}`}
                            />
                            <EditableAdaptiveText
                              mode={mode}
                              value={answer}
                              onEdit={(value) => handleContentUpdate(`faq_answer_${index}`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              className={`text-sm ${mutedTextColor}`}
                              placeholder={`FAQ Answer ${index}`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`faq_answer_${index}`}
                            />
                            
                            {/* Remove button */}
                            {(question || answer) && (
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
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {faqItems.map((faq, index) => (
                      <div key={index}>
                        <h4 style={h4Style} className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                        <p className={`text-sm ${mutedTextColor}`}>
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trust Indicators */}
            {((blockContent.show_trust_bar !== false && trustBarItems.length > 0) || mode === 'edit') && (
              <div className="text-center bg-blue-50 rounded-xl p-6 border border-blue-100">
                {mode === 'edit' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((index) => {
                        const trustItem = blockContent[`trust_item_${index}` as keyof MiniStackedCardsContent] || '';
                        
                        return (
                          <div key={index} className="flex items-center space-x-2 relative group/trust-item justify-center">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <EditableAdaptiveText
                              mode={mode}
                              value={trustItem}
                              onEdit={(value) => handleContentUpdate(`trust_item_${index}`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              className="text-sm font-medium text-gray-700"
                              placeholder={`Trust item ${index}`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`trust_item_${index}`}
                            />
                            
                            {/* Remove button */}
                            {trustItem && (
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
                ) : (
                  <div className="flex flex-wrap justify-center items-center gap-8">
                    {trustBarItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
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
    { key: 'plans_feature_2_title', label: 'Plans Feature 2 Title', type: 'text', required: false },
    { key: 'plans_feature_2_desc', label: 'Plans Feature 2 Description', type: 'text', required: false },
    { key: 'plans_feature_3_title', label: 'Plans Feature 3 Title', type: 'text', required: false },
    { key: 'plans_feature_3_desc', label: 'Plans Feature 3 Description', type: 'text', required: false },
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