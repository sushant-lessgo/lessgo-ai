import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators,
  StarRating 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface CardWithTestimonialContent {
  headline: string;
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  feature_lists: string;
  testimonial_quotes: string;
  testimonial_names: string;
  testimonial_companies: string;
  testimonial_ratings?: string;
  testimonial_images?: string;
  popular_tiers?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Pricing That Delivers Real Results' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Starter|Professional|Enterprise' 
  },
  tier_prices: { 
    type: 'string' as const, 
    default: '$29/month|$79/month|$199/month' 
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
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'This platform transformed our workflow completely. The ROI was immediate and substantial.|The advanced features helped us scale from 10 to 100 team members seamlessly. Best investment we made.|Enterprise support is outstanding. They helped us migrate 10,000+ users without any downtime.' 
  },
  testimonial_names: { 
    type: 'string' as const, 
    default: 'Sarah Johnson|Michael Chen|David Rodriguez' 
  },
  testimonial_companies: { 
    type: 'string' as const, 
    default: 'StartupFlow Inc.|TechScale Solutions|Enterprise Corp' 
  },
  testimonial_ratings: { 
    type: 'string' as const, 
    default: '5|5|5' 
  },
  testimonial_images: { 
    type: 'string' as const, 
    default: '' 
  },
  popular_tiers: { 
    type: 'string' as const, 
    default: 'false|true|false' 
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

export default function CardWithTestimonial(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CardWithTestimonialContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

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

  const featureLists = blockContent.feature_lists 
    ? blockContent.feature_lists.split('|').map(item => item.trim().split(',').map(f => f.trim())).filter(Boolean)
    : [];

  const testimonialQuotes = blockContent.testimonial_quotes 
    ? blockContent.testimonial_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialNames = blockContent.testimonial_names 
    ? blockContent.testimonial_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialCompanies = blockContent.testimonial_companies 
    ? blockContent.testimonial_companies.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialRatings = blockContent.testimonial_ratings 
    ? blockContent.testimonial_ratings.split('|').map(item => parseInt(item.trim()) || 5)
    : [];

  const testimonialImages = blockContent.testimonial_images 
    ? blockContent.testimonial_images.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const popularTiers = blockContent.popular_tiers 
    ? blockContent.popular_tiers.split('|').map(item => item.trim().toLowerCase() === 'true')
    : [];

  const pricingTiers = tierNames.map((name, index) => ({
    name,
    price: tierPrices[index] || '',
    description: tierDescriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    features: featureLists[index] || [],
    isPopular: popularTiers[index] || false,
    testimonial: {
      quote: testimonialQuotes[index] || '',
      name: testimonialNames[index] || '',
      company: testimonialCompanies[index] || '',
      rating: testimonialRatings[index] || 5,
      image: testimonialImages[index] || ''
    }
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getAvatarPlaceholder = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const PricingCardWithTestimonial = ({ tier, index }: {
    tier: typeof pricingTiers[0];
    index: number;
  }) => (
    <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
      tier.isPopular 
        ? `border-primary scale-105` 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorTokens.ctaBg} text-white px-4 py-1 rounded-full text-sm font-semibold z-10`}>
          Most Popular
        </div>
      )}

      <div className="p-8">
        {/* Tier Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
          <p className={`text-sm ${mutedTextColor} mb-4`}>{tier.description}</p>
          
          {/* Price Display */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">{tier.price}</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {tier.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <CTAButton
            text={tier.ctaText}
            colorTokens={colorTokens}
            className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            variant={tier.isPopular ? "primary" : "secondary"}
            sectionId={sectionId}
            elementKey={`cta_${index}`}
          />
        </div>

        {/* Testimonial */}
        {tier.testimonial.quote && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full ${colorTokens.ctaBg} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                {tier.testimonial.image ? (
                  <img 
                    src={tier.testimonial.image} 
                    alt={tier.testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  getAvatarPlaceholder(tier.testimonial.name)
                )}
              </div>
              
              <div className="flex-1">
                {/* Rating */}
                {tier.testimonial.rating > 0 && (
                  <div className="mb-3">
                    <StarRating 
                      rating={tier.testimonial.rating}
                      maxRating={5}
                      size="small"
                      showNumber={false}
                    />
                  </div>
                )}
                
                {/* Quote */}
                <blockquote className="text-gray-700 text-sm mb-3 italic">
                  "{tier.testimonial.quote}"
                </blockquote>
                
                {/* Attribution */}
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{tier.testimonial.name}</div>
                  {tier.testimonial.company && (
                    <div className={`text-xs ${mutedTextColor}`}>{tier.testimonial.company}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CardWithTestimonial"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
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
              placeholder="Add optional subheadline to introduce pricing with testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Pricing with Testimonials Content</h4>
              
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
                  value={blockContent.testimonial_quotes || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Testimonial quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_names || ''}
                  onEdit={(value) => handleContentUpdate('testimonial_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Testimonial names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_lists || ''}
                  onEdit={(value) => handleContentUpdate('feature_lists', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature lists (pipe separated tiers, comma separated features)"
                  sectionId={sectionId}
                  elementKey="feature_lists"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="relative">
                <PricingCardWithTestimonial
                  tier={tier}
                  index={index}
                />
              </div>
            ))}
          </div>
        )}

        {/* Social Proof Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Trusted by thousands of businesses</h3>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className={`text-sm ${mutedTextColor}`}>Happy customers</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className={`text-sm ${mutedTextColor}`}>Uptime guaranteed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">4.9/5</div>
                <div className={`text-sm ${mutedTextColor}`}>Customer satisfaction</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                <div className={`text-sm ${mutedTextColor}`}>Expert support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Money-back Guarantee */}
        <div className="bg-green-50 rounded-2xl p-8 border border-green-200 mb-12">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-lg">30-Day Money-Back Guarantee</div>
              <div className={`text-sm ${mutedTextColor}`}>
                Try risk-free. If you're not completely satisfied, we'll refund every penny.
              </div>
            </div>
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
                placeholder="Add optional supporting text to reinforce pricing with social proof..."
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
  name: 'CardWithTestimonial',
  category: 'Pricing',
  description: 'Pricing cards with integrated customer testimonials for social proof. Perfect for building trust with potential customers.',
  tags: ['pricing', 'testimonials', 'social-proof', 'conversion', 'trust'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tier_names', label: 'Tier Names (pipe separated)', type: 'text', required: true },
    { key: 'tier_prices', label: 'Tier Prices (pipe separated)', type: 'text', required: true },
    { key: 'tier_descriptions', label: 'Tier Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_texts', label: 'CTA Button Texts (pipe separated)', type: 'text', required: true },
    { key: 'feature_lists', label: 'Feature Lists (pipe separated tiers, comma separated features)', type: 'textarea', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_names', label: 'Testimonial Names (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_companies', label: 'Testimonial Companies (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_ratings', label: 'Testimonial Ratings 1-5 (pipe separated)', type: 'text', required: false },
    { key: 'testimonial_images', label: 'Testimonial Avatar URLs (pipe separated)', type: 'text', required: false },
    { key: 'popular_tiers', label: 'Popular Tiers true/false (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Pricing cards with testimonials',
    'Customer avatars and ratings',
    'Social proof integration',
    'Popular plan highlighting',
    'Money-back guarantee section',
    'Trust metrics display'
  ],
  
  useCases: [
    'Trust-building pricing pages',
    'Social proof-driven conversions',
    'Customer testimonial showcase',
    'B2B credibility building',
    'Conversion rate optimization'
  ]
};