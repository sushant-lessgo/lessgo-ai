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

interface SideBySideOfferCardsContent {
  headline: string;
  offer_titles: string;
  offer_descriptions: string;
  offer_prices: string;
  offer_features: string;
  offer_ctas: string;
  offer_badges?: string;
  offer_highlights?: string;
  comparison_note?: string;
  guarantee_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  feature_check_icon?: string;
  feature_unavailable_icon?: string;
  info_icon?: string;
  guarantee_shield_icon?: string;
  proven_icon?: string;
  setup_icon?: string;
  support_icon?: string;
  security_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Choose Your Perfect Plan' 
  },
  offer_titles: { 
    type: 'string' as const, 
    default: 'Standard Solution|Premium Package|Enterprise Suite' 
  },
  offer_descriptions: { 
    type: 'string' as const, 
    default: 'Perfect for small teams and startups getting started|Advanced features for growing businesses|Complete solution for large organizations' 
  },
  offer_prices: { 
    type: 'string' as const, 
    default: '$97/month|$297/month|Custom Pricing' 
  },
  offer_features: { 
    type: 'string' as const, 
    default: 'Up to 10 team members,Basic automation,Email support,Standard integrations|Up to 50 team members,Advanced automation,Priority support,Premium integrations,Custom workflows|Unlimited team members,Enterprise automation,Dedicated support,All integrations,White-label options,Custom development' 
  },
  offer_ctas: { 
    type: 'string' as const, 
    default: 'Start Free Trial|Start Free Trial|Contact Sales' 
  },
  offer_badges: { 
    type: 'string' as const, 
    default: '|Most Popular|Best Value' 
  },
  offer_highlights: { 
    type: 'string' as const, 
    default: 'Great for getting started|Perfect for most businesses|Maximum flexibility' 
  },
  comparison_note: { 
    type: 'string' as const, 
    default: 'All plans include 30-day free trial and can be upgraded anytime' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '60-day money-back guarantee on all plans' 
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
  feature_check_icon: { 
    type: 'string' as const, 
    default: '✅' 
  },
  feature_unavailable_icon: { 
    type: 'string' as const, 
    default: '❌' 
  },
  info_icon: { 
    type: 'string' as const, 
    default: 'ℹ️' 
  },
  guarantee_shield_icon: { 
    type: 'string' as const, 
    default: '🛡️' 
  },
  proven_icon: { 
    type: 'string' as const, 
    default: '✅' 
  },
  setup_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  support_icon: { 
    type: 'string' as const, 
    default: '💬' 
  },
  security_icon: { 
    type: 'string' as const, 
    default: '🔒' 
  }
};

export default function SideBySideOfferCards(props: LayoutComponentProps) {
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
  } = useLayoutComponent<SideBySideOfferCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  const offerTitles = blockContent.offer_titles 
    ? blockContent.offer_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const offerDescriptions = blockContent.offer_descriptions 
    ? blockContent.offer_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const offerPrices = blockContent.offer_prices 
    ? blockContent.offer_prices.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const offerFeatures = blockContent.offer_features 
    ? blockContent.offer_features.split('|').map(item => 
        item.trim().split(',').map(f => f.trim()).filter(Boolean)
      )
    : [];

  const offerCtas = blockContent.offer_ctas 
    ? blockContent.offer_ctas.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const offerBadges = blockContent.offer_badges 
    ? blockContent.offer_badges.split('|').map(item => item.trim())
    : [];

  const offerHighlights = blockContent.offer_highlights 
    ? blockContent.offer_highlights.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const offers = offerTitles.map((title, index) => ({
    title,
    description: offerDescriptions[index] || '',
    price: offerPrices[index] || '',
    features: offerFeatures[index] || [],
    cta: offerCtas[index] || 'Get Started',
    badge: offerBadges[index] || '',
    highlight: offerHighlights[index] || '',
    isPopular: offerBadges[index] && offerBadges[index].toLowerCase().includes('popular')
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getBadgeColor = (badge: string) => {
    if (badge.toLowerCase().includes('popular')) return 'bg-blue-500';
    if (badge.toLowerCase().includes('value')) return 'bg-green-500';
    if (badge.toLowerCase().includes('best')) return 'bg-purple-500';
    return 'bg-orange-500';
  };

  const OfferCard = ({ offer, index }: {
    offer: typeof offers[0];
    index: number;
  }) => (
    <div className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
      offer.isPopular 
        ? `border-primary shadow-lg scale-105` 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      
      {/* Badge */}
      {offer.badge && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${getBadgeColor(offer.badge)} text-white px-4 py-1 rounded-full text-sm font-semibold z-10`}>
          {offer.badge}
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="font-bold text-gray-900 mb-3" style={h2Style}>{offer.title}</h3>
          <p className={`text-sm ${mutedTextColor} mb-6`}>{offer.description}</p>
          
          {/* Price */}
          <div className="mb-4">
            <div className="font-bold text-gray-900 mb-2" style={{...h2Style, fontSize: 'clamp(2rem, 4vw, 2.5rem)'}}>
              {offer.price.includes('$') ? offer.price : `$${offer.price}`}
            </div>
            {offer.highlight && (
              <p className={`text-sm font-medium ${offer.isPopular ? colorTokens.ctaText : 'text-blue-600'}`}>
                {offer.highlight}
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {offer.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-start space-x-3">
              <IconEditableText
                mode={mode}
                value={blockContent.feature_check_icon || '✅'}
                onEdit={(value) => handleContentUpdate('feature_check_icon', value)}
                className="text-green-500 text-lg mt-0.5 flex-shrink-0"
              />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <CTAButton
          text={offer.cta}
          colorTokens={colorTokens}
          className={`w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ${
            offer.isPopular ? '' : 'opacity-90'
          }`}
          variant={offer.isPopular ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`cta_${index}`}
        />
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySideOfferCards"
      backgroundType={safeBackgroundType}
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
              className="mb-8 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce offer comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Side-by-Side Offers Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.offer_titles || ''}
                  onEdit={(value) => handleContentUpdate('offer_titles', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Offer titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="offer_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.offer_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('offer_descriptions', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Offer descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="offer_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.offer_prices || ''}
                  onEdit={(value) => handleContentUpdate('offer_prices', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Offer prices (pipe separated)"
                  sectionId={sectionId}
                  elementKey="offer_prices"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.offer_features || ''}
                  onEdit={(value) => handleContentUpdate('offer_features', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Offer features (pipe separated offers, comma separated features)"
                  sectionId={sectionId}
                  elementKey="offer_features"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Offer Cards Grid */}
            <div className={`grid gap-8 mb-16 ${
              offers.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
              offers.length === 3 ? 'md:grid-cols-3' :
              'md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {offers.map((offer, index) => (
                <OfferCard
                  key={index}
                  offer={offer}
                  index={index}
                />
              ))}
            </div>

            {/* Comparison Note */}
            {blockContent.comparison_note && (
              <div className="text-center mb-12">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.info_icon || 'ℹ️'}
                      onEdit={(value) => handleContentUpdate('info_icon', value)}
                      className="text-blue-600 text-lg"
                    />
                    <span className="font-semibold text-blue-900">Good to Know</span>
                  </div>
                  <p className="text-blue-800">{blockContent.comparison_note}</p>
                </div>
              </div>
            )}

            {/* Features Comparison Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg mb-16">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-center" style={h3Style}>
                  Feature Comparison
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-900">Features</th>
                      {offers.map((offer, index) => (
                        <th key={index} className={`text-center p-6 font-semibold ${
                          offer.isPopular ? colorTokens.ctaText : 'text-gray-900'
                        }`}>
                          {offer.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Get all unique features */}
                    {Array.from(new Set(offers.flatMap(offer => offer.features))).map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-6 font-medium text-gray-900">{feature}</td>
                        {offers.map((offer, offerIndex) => (
                          <td key={offerIndex} className="text-center p-6">
                            {offer.features.includes(feature) ? (
                              <IconEditableText
                                mode={mode}
                                value={blockContent.feature_check_icon || '✅'}
                                onEdit={(value) => handleContentUpdate('feature_check_icon', value)}
                                className="text-green-500 text-xl mx-auto"
                              />
                            ) : (
                              <IconEditableText
                                mode={mode}
                                value={blockContent.feature_unavailable_icon || '❌'}
                                onEdit={(value) => handleContentUpdate('feature_unavailable_icon', value)}
                                className="text-gray-300 text-xl mx-auto"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guarantee Section */}
            {blockContent.guarantee_text && (
              <div className="bg-green-50 rounded-2xl p-8 border border-green-200 text-center mb-16">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.guarantee_shield_icon || '🛡️'}
                      onEdit={(value) => handleContentUpdate('guarantee_shield_icon', value)}
                      className="text-white text-3xl"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-xl mb-2">Risk-Free Guarantee</div>
                    <div className="text-gray-700">{blockContent.guarantee_text}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="text-center bg-gray-50 rounded-xl p-8 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6" style={h3Style}>
                Why Choose Our Platform?
              </h3>
              
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.proven_icon || '✅'}
                      onEdit={(value) => handleContentUpdate('proven_icon', value)}
                      className="text-blue-600 text-xl"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Proven Results</div>
                  <div className={`text-sm ${mutedTextColor}`}>Trusted by thousands</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.setup_icon || '⚡'}
                      onEdit={(value) => handleContentUpdate('setup_icon', value)}
                      className="text-green-600 text-xl"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Quick Setup</div>
                  <div className={`text-sm ${mutedTextColor}`}>Ready in minutes</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.support_icon || '💬'}
                      onEdit={(value) => handleContentUpdate('support_icon', value)}
                      className="text-purple-600 text-xl"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Expert Support</div>
                  <div className={`text-sm ${mutedTextColor}`}>Always here to help</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.security_icon || '🔒'}
                      onEdit={(value) => handleContentUpdate('security_icon', value)}
                      className="text-orange-600 text-xl"
                    />
                  </div>
                  <div className="font-semibold text-gray-900">Secure & Reliable</div>
                  <div className={`text-sm ${mutedTextColor}`}>Bank-grade security</div>
                </div>
              </div>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce offer comparison..."
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
  name: 'SideBySideOfferCards',
  category: 'Close',
  description: 'Multiple offer comparison cards with features matrix. Perfect for presenting different pricing tiers or packages.',
  tags: ['offers', 'comparison', 'pricing', 'packages', 'cards', 'features'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'offer_titles', label: 'Offer Titles (pipe separated)', type: 'text', required: true },
    { key: 'offer_descriptions', label: 'Offer Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'offer_prices', label: 'Offer Prices (pipe separated)', type: 'text', required: true },
    { key: 'offer_features', label: 'Offer Features (pipe separated offers, comma separated features)', type: 'textarea', required: true },
    { key: 'offer_ctas', label: 'Offer CTAs (pipe separated)', type: 'text', required: true },
    { key: 'offer_badges', label: 'Offer Badges (pipe separated)', type: 'text', required: false },
    { key: 'offer_highlights', label: 'Offer Highlights (pipe separated)', type: 'text', required: false },
    { key: 'comparison_note', label: 'Comparison Note', type: 'text', required: false },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'feature_check_icon', label: 'Feature Check Icon', type: 'text', required: false },
    { key: 'feature_unavailable_icon', label: 'Feature Unavailable Icon', type: 'text', required: false },
    { key: 'info_icon', label: 'Info Icon', type: 'text', required: false },
    { key: 'guarantee_shield_icon', label: 'Guarantee Shield Icon', type: 'text', required: false },
    { key: 'proven_icon', label: 'Proven Icon', type: 'text', required: false },
    { key: 'setup_icon', label: 'Setup Icon', type: 'text', required: false },
    { key: 'support_icon', label: 'Support Icon', type: 'text', required: false },
    { key: 'security_icon', label: 'Security Icon', type: 'text', required: false }
  ],
  
  features: [
    'Multiple offer cards with badges',
    'Feature comparison matrix',
    'Popular plan highlighting',
    'Guarantee and trust sections',
    'Responsive grid layout',
    'Interactive hover effects'
  ],
  
  useCases: [
    'SaaS pricing plans',
    'Service package comparison',
    'Product tier showcase',
    'Subscription options',
    'Bundle offer presentation'
  ]
};