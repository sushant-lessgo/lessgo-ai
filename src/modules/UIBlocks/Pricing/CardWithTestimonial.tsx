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
  // Social proof metrics
  social_metric_1?: string;
  social_metric_1_label?: string;
  social_metric_2?: string;
  social_metric_2_label?: string;
  social_metric_3?: string;
  social_metric_3_label?: string;
  social_metric_4?: string;
  social_metric_4_label?: string;
  show_social_proof?: boolean;
  social_proof_title?: string;
  // Guarantee section
  guarantee_title?: string;
  guarantee_description?: string;
  show_guarantee?: boolean;
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
  },
  // Social proof metrics
  social_metric_1: { 
    type: 'string' as const, 
    default: '10,000+' 
  },
  social_metric_1_label: { 
    type: 'string' as const, 
    default: 'Happy customers' 
  },
  social_metric_2: { 
    type: 'string' as const, 
    default: '99.9%' 
  },
  social_metric_2_label: { 
    type: 'string' as const, 
    default: 'Uptime guaranteed' 
  },
  social_metric_3: { 
    type: 'string' as const, 
    default: '4.9/5' 
  },
  social_metric_3_label: { 
    type: 'string' as const, 
    default: 'Customer satisfaction' 
  },
  social_metric_4: { 
    type: 'string' as const, 
    default: '24/7' 
  },
  social_metric_4_label: { 
    type: 'string' as const, 
    default: 'Expert support' 
  },
  show_social_proof: { 
    type: 'boolean' as const, 
    default: true 
  },
  social_proof_title: { 
    type: 'string' as const, 
    default: 'Trusted by thousands of businesses' 
  },
  // Guarantee section
  guarantee_title: { 
    type: 'string' as const, 
    default: '30-Day Money-Back Guarantee' 
  },
  guarantee_description: { 
    type: 'string' as const, 
    default: 'Try risk-free. If you\'re not completely satisfied, we\'ll refund every penny.' 
  },
  show_guarantee: { 
    type: 'boolean' as const, 
    default: true 
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

  // LAYER 2: Container guards - Helper function to detect clicks from editable content
  const isFromEditable = (el: EventTarget | null): boolean => {
    return el instanceof HTMLElement && (
      el.closest('[contenteditable="true"]') !== null ||
      el.closest('[data-editable="true"]') !== null
    );
  };

  // LAYER 3: Smart blur handlers - Helper function with change detection
  const handleSmartContentUpdate = (
    newValue: string, 
    originalValue: string, 
    updateFn: () => void
  ) => {
    if (newValue !== originalValue) {
      // Only update if content actually changed, with delay to prevent mid-interaction regeneration
      setTimeout(() => updateFn(), 100);
    }
    // Skip unnecessary updates that cause regeneration
  };

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
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

  // Helper function to get social proof metrics
  const getSocialMetrics = () => {
    const metrics = [
      {
        value: blockContent.social_metric_1 || '10,000+',
        label: blockContent.social_metric_1_label || 'Happy customers',
        color: 'text-blue-600'
      },
      {
        value: blockContent.social_metric_2 || '99.9%',
        label: blockContent.social_metric_2_label || 'Uptime guaranteed',
        color: 'text-green-600'
      },
      {
        value: blockContent.social_metric_3 || '4.9/5',
        label: blockContent.social_metric_3_label || 'Customer satisfaction',
        color: 'text-purple-600'
      },
      {
        value: blockContent.social_metric_4 || '24/7',
        label: blockContent.social_metric_4_label || 'Expert support',
        color: 'text-orange-600'
      }
    ].filter(metric => 
      metric.value !== '___REMOVED___' && 
      metric.label !== '___REMOVED___' && 
      metric.value.trim() !== '' && 
      metric.label.trim() !== ''
    );
    
    return metrics;
  };

  const socialMetrics = getSocialMetrics();

  const getAvatarPlaceholder = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const PricingCardWithTestimonial = ({ tier, index }: {
    tier: typeof pricingTiers[0];
    index: number;
  }) => {
    // Store original values for smart blur handling
    const originalValues = {
      tierName: tier.name,
      tierDescription: tier.description,
      tierPrice: tier.price,
      testimonialQuote: tier.testimonial.quote,
      testimonialName: tier.testimonial.name,
      testimonialCompany: tier.testimonial.company,
      features: [...tier.features]
    };

    return (
      <div 
        className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl relative group/tier-${index} ${
          tier.isPopular 
            ? `border-primary scale-105` 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        // LAYER 2: Container guards - Block container handlers for editable content
        onFocusCapture={(e) => {
          if (isFromEditable(e.target)) return; // Block container handlers
        }}
        onMouseDownCapture={(e) => {
          if (isFromEditable(e.target)) {
            e.stopPropagation(); // Prevent container-level mouse down handling
          }
        }}
      >
      
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorTokens.ctaBg} text-white px-4 py-1 rounded-full text-sm font-semibold z-10`}>
          Most Popular
        </div>
      )}

      <div className="p-8">
        {/* Tier Header */}
        <div className="text-center mb-6">
          {/* Editable Tier Name */}
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onMouseDown={(e) => {
                e.stopPropagation(); // LAYER 3: Event prevention
              }}
              onBlur={(e) => {
                const newValue = e.currentTarget.textContent || '';
                handleSmartContentUpdate(
                  newValue,
                  originalValues.tierName,
                  () => {
                    const names = blockContent.tier_names.split('|');
                    names[index] = newValue;
                    handleContentUpdate('tier_names', names.join('|'));
                  }
                );
              }}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-gray-900 mb-2"
              style={h3Style}
            >
              {tier.name}
            </div>
          ) : (
            <h3 style={h3Style} className="font-bold text-gray-900 mb-2">{tier.name}</h3>
          )}
          
          {/* Editable Tier Description */}
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onMouseDown={(e) => {
                e.stopPropagation(); // LAYER 3: Event prevention
              }}
              onBlur={(e) => {
                const newValue = e.currentTarget.textContent || '';
                handleSmartContentUpdate(
                  newValue,
                  originalValues.tierDescription,
                  () => {
                    const descriptions = blockContent.tier_descriptions.split('|');
                    descriptions[index] = newValue;
                    handleContentUpdate('tier_descriptions', descriptions.join('|'));
                  }
                );
              }}
              className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-sm ${mutedTextColor} mb-4`}
            >
              {tier.description}
            </div>
          ) : (
            <p className={`text-sm ${mutedTextColor} mb-4`}>{tier.description}</p>
          )}
          
          {/* Price Display */}
          <div className="mb-6">
            {/* Editable Tier Price */}
            {mode !== 'preview' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onMouseDown={(e) => {
                  e.stopPropagation(); // LAYER 3: Event prevention
                }}
                onBlur={(e) => {
                  const newValue = e.currentTarget.textContent || '';
                  handleSmartContentUpdate(
                    newValue,
                    originalValues.tierPrice,
                    () => {
                      const prices = blockContent.tier_prices.split('|');
                      prices[index] = newValue;
                      handleContentUpdate('tier_prices', prices.join('|'));
                    }
                  );
                }}
                className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-gray-900 mb-2"
                style={{...getTypographyStyle('h2'), fontSize: 'clamp(2rem, 4vw, 2.5rem)'}}
              >
                {tier.price}
              </div>
            ) : (
              <div style={{...getTypographyStyle('h2'), fontSize: 'clamp(2rem, 4vw, 2.5rem)'}} className="font-bold text-gray-900 mb-2">{tier.price}</div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {tier.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-start space-x-3 group/feature relative">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onMouseDown={(e) => {
                    e.stopPropagation(); // LAYER 3: Event prevention
                  }}
                  onBlur={(e) => {
                    const newValue = e.currentTarget.textContent || '';
                    const originalFeature = originalValues.features[featureIndex] || '';
                    handleSmartContentUpdate(
                      newValue,
                      originalFeature,
                      () => {
                        const featureLists = blockContent.feature_lists.split('|');
                        const currentFeatures = featureLists[index] ? featureLists[index].split(',').map(f => f.trim()) : [];
                        currentFeatures[featureIndex] = newValue;
                        featureLists[index] = currentFeatures.join(',');
                        handleContentUpdate('feature_lists', featureLists.join('|'));
                      }
                    );
                  }}
                  className="text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100 flex-1"
                >
                  {feature}
                </div>
              ) : (
                <span className="text-gray-700 text-sm flex-1">{feature}</span>
              )}
              
              {/* Remove feature button - only in edit mode */}
              {mode === 'edit' && tier.features.length > 1 && (
                <button
                  onClick={() => {
                    const featureLists = blockContent.feature_lists.split('|');
                    const currentFeatures = featureLists[index] ? featureLists[index].split(',').map(f => f.trim()) : [];
                    currentFeatures.splice(featureIndex, 1);
                    featureLists[index] = currentFeatures.join(',');
                    handleContentUpdate('feature_lists', featureLists.join('|'));
                  }}
                  className="opacity-0 group-hover/feature:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                  title="Remove this feature"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add feature button - only in edit mode */}
          {mode === 'edit' && (
            <button
              onClick={() => {
                const featureLists = blockContent.feature_lists.split('|');
                const currentFeatures = featureLists[index] ? featureLists[index].split(',').map(f => f.trim()) : [];
                currentFeatures.push('New feature');
                featureLists[index] = currentFeatures.join(',');
                handleContentUpdate('feature_lists', featureLists.join('|'));
              }}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              title="Add new feature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add feature</span>
            </button>
          )}
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
        {((tier.testimonial.quote && tier.testimonial.quote !== '___REMOVED___') || (mode === 'edit' && tier.testimonial.quote !== '___REMOVED___')) && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group/testimonial">
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
                  getAvatarPlaceholder(tier.testimonial.name === '___REMOVED___' ? '' : (tier.testimonial.name || 'U'))
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
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onMouseDown={(e) => {
                      e.stopPropagation(); // LAYER 3: Event prevention
                    }}
                    onBlur={(e) => {
                      const newValue = e.currentTarget.textContent?.replace(/"/g, '') || '';
                      handleSmartContentUpdate(
                        newValue,
                        originalValues.testimonialQuote,
                        () => {
                          const quotes = blockContent.testimonial_quotes.split('|');
                          quotes[index] = newValue;
                          handleContentUpdate('testimonial_quotes', quotes.join('|'));
                        }
                      );
                    }}
                    className="text-gray-700 text-sm mb-3 italic outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100"
                    data-placeholder='Click to add testimonial quote...'
                  >
                    {tier.testimonial.quote && tier.testimonial.quote !== '___REMOVED___' ? `"${tier.testimonial.quote}"` : ''}
                  </div>
                ) : (
                  <blockquote className="text-gray-700 text-sm mb-3 italic">
                    "{tier.testimonial.quote}"
                  </blockquote>
                )}
                
                {/* Attribution */}
                <div>
                  {/* Editable Name */}
                  {mode !== 'preview' ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onMouseDown={(e) => {
                        e.stopPropagation(); // LAYER 3: Event prevention
                      }}
                      onBlur={(e) => {
                        const newValue = e.currentTarget.textContent || '';
                        handleSmartContentUpdate(
                          newValue,
                          originalValues.testimonialName,
                          () => {
                            const names = blockContent.testimonial_names.split('|');
                            names[index] = newValue;
                            handleContentUpdate('testimonial_names', names.join('|'));
                          }
                        );
                      }}
                      className="font-semibold text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100"
                      data-placeholder='Customer name'
                    >
                      {tier.testimonial.name === '___REMOVED___' ? '' : (tier.testimonial.name || '')}
                    </div>
                  ) : (
                    <div className="font-semibold text-gray-900 text-sm">{tier.testimonial.name}</div>
                  )}
                  
                  {/* Editable Company */}
                  {(tier.testimonial.company || mode === 'edit') && (
                    mode !== 'preview' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onMouseDown={(e) => {
                          e.stopPropagation(); // LAYER 3: Event prevention
                        }}
                        onBlur={(e) => {
                          const newValue = e.currentTarget.textContent || '';
                          handleSmartContentUpdate(
                            newValue,
                            originalValues.testimonialCompany,
                            () => {
                              const companies = blockContent.testimonial_companies.split('|');
                              companies[index] = newValue;
                              handleContentUpdate('testimonial_companies', companies.join('|'));
                            }
                          );
                        }}
                        className={`text-xs ${mutedTextColor} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-gray-100`}
                        data-placeholder='Company name'
                      >
                        {tier.testimonial.company === '___REMOVED___' ? '' : (tier.testimonial.company || '')}
                      </div>
                    ) : (
                      tier.testimonial.company && (
                        <div className={`text-xs ${mutedTextColor}`}>{tier.testimonial.company}</div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>
            
            {/* Remove testimonial button - only in edit mode */}
            {mode === 'edit' && (
              <button
                onClick={() => {
                  const quotes = blockContent.testimonial_quotes.split('|');
                  const names = blockContent.testimonial_names.split('|');
                  const companies = blockContent.testimonial_companies.split('|');
                  
                  quotes[index] = '___REMOVED___';
                  names[index] = '___REMOVED___';
                  companies[index] = '___REMOVED___';
                  
                  handleContentUpdate('testimonial_quotes', quotes.join('|'));
                  handleContentUpdate('testimonial_names', names.join('|'));
                  handleContentUpdate('testimonial_companies', companies.join('|'));
                }}
                className="opacity-0 group-hover/testimonial:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                title="Clear testimonial"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Remove tier button - only in edit mode and when we have more than 1 tier */}
        {mode === 'edit' && pricingTiers.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const removeFromPipeList = (value: string, indexToRemove: number) => {
                const items = value.split('|');
                items.splice(indexToRemove, 1);
                return items.join('|');
              };
              
              handleContentUpdate('tier_names', removeFromPipeList(blockContent.tier_names, index));
              handleContentUpdate('tier_prices', removeFromPipeList(blockContent.tier_prices, index));
              handleContentUpdate('tier_descriptions', removeFromPipeList(blockContent.tier_descriptions, index));
              handleContentUpdate('cta_texts', removeFromPipeList(blockContent.cta_texts, index));
              handleContentUpdate('testimonial_quotes', removeFromPipeList(blockContent.testimonial_quotes, index));
              handleContentUpdate('testimonial_names', removeFromPipeList(blockContent.testimonial_names, index));
              handleContentUpdate('testimonial_companies', removeFromPipeList(blockContent.testimonial_companies, index));
              handleContentUpdate('feature_lists', removeFromPipeList(blockContent.feature_lists, index));
              
              if (blockContent.popular_tiers) {
                handleContentUpdate('popular_tiers', removeFromPipeList(blockContent.popular_tiers, index));
              }
            }}
            className={`opacity-0 group-hover/tier-${index}:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-20`}
            title="Remove this pricing tier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
    );
  };
  
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
              style={bodyLgStyle}
              className="mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce pricing with testimonials..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16 relative">
          {/* Add tier button - only in edit mode and when we have less than 3 tiers */}
          {mode === 'edit' && pricingTiers.length < 3 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const names = blockContent.tier_names.split('|');
                  const prices = blockContent.tier_prices.split('|');
                  const descriptions = blockContent.tier_descriptions.split('|');
                  const ctas = blockContent.cta_texts.split('|');
                  const popularLabels = blockContent.popular_tiers ? blockContent.popular_tiers.split('|') : [];
                  const testimonialQuotesArr = blockContent.testimonial_quotes.split('|');
                  const testimonialNamesArr = blockContent.testimonial_names.split('|');
                  const testimonialCompaniesArr = blockContent.testimonial_companies.split('|');
                  const featureListsArr = blockContent.feature_lists.split('|');
                  
                  const tierNumber = names.length + 1;
                  names.push(tierNumber === 1 ? 'Starter' : tierNumber === 2 ? 'Professional' : 'Enterprise');
                  prices.push(tierNumber === 1 ? '$29/month' : tierNumber === 2 ? '$79/month' : 'Custom Pricing');
                  descriptions.push(tierNumber === 1 ? 'Perfect for getting started' : tierNumber === 2 ? 'For growing teams' : 'Enterprise solutions');
                  ctas.push(tierNumber === 3 ? 'Contact Sales' : 'Start Free Trial');
                  popularLabels.push(tierNumber === 2 ? 'true' : 'false');
                  testimonialQuotesArr.push('Great product that delivered results for our team.');
                  testimonialNamesArr.push('John Doe');
                  testimonialCompaniesArr.push('Example Co.');
                  featureListsArr.push('Basic feature,Another feature');
                  
                  handleContentUpdate('tier_names', names.join('|'));
                  handleContentUpdate('tier_prices', prices.join('|'));
                  handleContentUpdate('tier_descriptions', descriptions.join('|'));
                  handleContentUpdate('cta_texts', ctas.join('|'));
                  handleContentUpdate('popular_tiers', popularLabels.join('|'));
                  handleContentUpdate('testimonial_quotes', testimonialQuotesArr.join('|'));
                  handleContentUpdate('testimonial_names', testimonialNamesArr.join('|'));
                  handleContentUpdate('testimonial_companies', testimonialCompaniesArr.join('|'));
                  handleContentUpdate('feature_lists', featureListsArr.join('|'));
                }}
                className="px-6 py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all duration-300 border border-blue-300 hover:border-blue-400 flex items-center space-x-2"
                title="Add new pricing tier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Tier</span>
              </button>
            </div>
          )}
          
          {pricingTiers.map((tier, index) => (
            <div key={index} className="relative">
              <PricingCardWithTestimonial
                tier={tier}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Social Proof Section */}
        {((blockContent.show_social_proof !== false && socialMetrics.length > 0) || (mode === 'edit' && blockContent.social_proof_title !== '___REMOVED___' && socialMetrics.some(m => m.value && m.value !== '___REMOVED___'))) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-12 relative group/social-proof-section">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.social_proof_title === '___REMOVED___' ? '' : (blockContent.social_proof_title || '')}
                onEdit={(value) => handleContentUpdate('social_proof_title', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                style={h3Style}
                className="font-semibold text-gray-900 mb-6"
                placeholder="Trusted by thousands of businesses"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="social_proof_title"
              />
              
              {mode !== 'preview' ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((index) => {
                      const metricValue = String(blockContent[`social_metric_${index}` as keyof CardWithTestimonialContent] || '');
                      const metricLabel = String(blockContent[`social_metric_${index}_label` as keyof CardWithTestimonialContent] || '');
                      
                      return (
                        <div key={index} className="text-center relative group/social-metric">
                          <div className="space-y-2">
                            <EditableAdaptiveText
                              mode={mode}
                              value={metricValue}
                              onEdit={(value) => handleContentUpdate(`social_metric_${index}`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              className="text-2xl font-bold text-blue-600"
                              placeholder={`Metric ${index}`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`social_metric_${index}`}
                            />
                            <EditableAdaptiveText
                              mode={mode}
                              value={metricLabel}
                              onEdit={(value) => handleContentUpdate(`social_metric_${index}_label`, value)}
                              backgroundType={backgroundType}
                              colorTokens={colorTokens}
                              variant="body"
                              className={`text-sm ${mutedTextColor}`}
                              placeholder={`Label ${index}`}
                              sectionBackground={sectionBackground}
                              data-section-id={sectionId}
                              data-element-key={`social_metric_${index}_label`}
                            />
                          </div>
                          
                          {/* Remove button */}
                          {(metricValue || metricLabel) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContentUpdate(`social_metric_${index}`, '___REMOVED___');
                                handleContentUpdate(`social_metric_${index}_label`, '___REMOVED___');
                              }}
                              className="opacity-0 group-hover/social-metric:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                              title="Remove this metric"
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
                <div className="grid md:grid-cols-4 gap-8">
                  {socialMetrics.map((metric, index) => (
                    <div key={index} className="text-center">
                      <div style={{...getTypographyStyle('h2'), fontSize: 'clamp(1.8rem, 3vw, 2rem)'}} className={`font-bold ${metric.color} mb-2`}>{metric.value}</div>
                      <div className={`text-sm ${mutedTextColor}`}>{metric.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Remove social proof section button - only in edit mode */}
            {mode === 'edit' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('show_social_proof', false);
                  handleContentUpdate('social_proof_title', '___REMOVED___');
                  handleContentUpdate('social_metric_1', '___REMOVED___');
                  handleContentUpdate('social_metric_1_label', '___REMOVED___');
                  handleContentUpdate('social_metric_2', '___REMOVED___');
                  handleContentUpdate('social_metric_2_label', '___REMOVED___');
                  handleContentUpdate('social_metric_3', '___REMOVED___');
                  handleContentUpdate('social_metric_3_label', '___REMOVED___');
                  handleContentUpdate('social_metric_4', '___REMOVED___');
                  handleContentUpdate('social_metric_4_label', '___REMOVED___');
                }}
                className="opacity-0 group-hover/social-proof-section:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                title="Remove social proof section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Money-back Guarantee */}
        {((blockContent.show_guarantee !== false && (blockContent.guarantee_title && blockContent.guarantee_title !== '___REMOVED___') || (blockContent.guarantee_description && blockContent.guarantee_description !== '___REMOVED___')) || (mode === 'edit' && (blockContent.guarantee_title !== '___REMOVED___' || blockContent.guarantee_description !== '___REMOVED___'))) && (
          <div className="bg-green-50 rounded-2xl p-8 border border-green-200 mb-12 relative group/guarantee">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_title === '___REMOVED___' ? '' : (blockContent.guarantee_title || '')}
                  onEdit={(value) => handleContentUpdate('guarantee_title', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  style={bodyLgStyle}
                  className="font-semibold text-gray-900"
                  placeholder="Guarantee title"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="guarantee_title"
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_description === '___REMOVED___' ? '' : (blockContent.guarantee_description || '')}
                  onEdit={(value) => handleContentUpdate('guarantee_description', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor} mt-1`}
                  placeholder="Guarantee description"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="guarantee_description"
                />
              </div>
            </div>
            
            {/* Remove button */}
            {mode !== 'preview' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentUpdate('guarantee_title', '___REMOVED___');
                  handleContentUpdate('guarantee_description', '___REMOVED___');
                }}
                className="opacity-0 group-hover/guarantee:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10"
                title="Remove guarantee section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

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
    { key: 'social_metric_1', label: 'Social Metric 1 Value', type: 'text', required: false },
    { key: 'social_metric_1_label', label: 'Social Metric 1 Label', type: 'text', required: false },
    { key: 'social_metric_2', label: 'Social Metric 2 Value', type: 'text', required: false },
    { key: 'social_metric_2_label', label: 'Social Metric 2 Label', type: 'text', required: false },
    { key: 'social_metric_3', label: 'Social Metric 3 Value', type: 'text', required: false },
    { key: 'social_metric_3_label', label: 'Social Metric 3 Label', type: 'text', required: false },
    { key: 'social_metric_4', label: 'Social Metric 4 Value', type: 'text', required: false },
    { key: 'social_metric_4_label', label: 'Social Metric 4 Label', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof Section', type: 'boolean', required: false },
    { key: 'social_proof_title', label: 'Social Proof Section Title', type: 'text', required: false },
    { key: 'guarantee_title', label: 'Guarantee Title', type: 'text', required: false },
    { key: 'guarantee_description', label: 'Guarantee Description', type: 'text', required: false },
    { key: 'show_guarantee', label: 'Show Guarantee Section', type: 'boolean', required: false },
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