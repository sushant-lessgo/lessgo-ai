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
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                              <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
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
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Proven Results</div>
                  <div className={`text-sm ${mutedTextColor}`}>Trusted by thousands</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Quick Setup</div>
                  <div className={`text-sm ${mutedTextColor}`}>Ready in minutes</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Expert Support</div>
                  <div className={`text-sm ${mutedTextColor}`}>Always here to help</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
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