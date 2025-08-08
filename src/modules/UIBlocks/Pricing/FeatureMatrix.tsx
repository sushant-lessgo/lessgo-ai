import React, { useState } from 'react';
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

interface FeatureMatrixContent {
  headline: string;
  tier_names: string;
  tier_prices: string;
  tier_descriptions: string;
  cta_texts: string;
  feature_categories: string;
  feature_names: string;
  feature_availability: string;
  popular_tiers?: string;
  feature_descriptions?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Compare Features Across All Plans' 
  },
  tier_names: { 
    type: 'string' as const, 
    default: 'Starter|Professional|Enterprise' 
  },
  tier_prices: { 
    type: 'string' as const, 
    default: '$29/month|$79/month|Custom Pricing' 
  },
  tier_descriptions: { 
    type: 'string' as const, 
    default: 'Perfect for small teams|For growing businesses|Enterprise solutions' 
  },
  cta_texts: { 
    type: 'string' as const, 
    default: 'Start Free Trial|Start Free Trial|Contact Sales' 
  },
  feature_categories: { 
    type: 'string' as const, 
    default: 'Core Features|Collaboration|Integrations|Security & Compliance|Support' 
  },
  feature_names: { 
    type: 'string' as const, 
    default: 'Projects|Storage|Team Members|Basic Integrations|API Access|Real-time Collaboration|Advanced Workflow|Version Control|Third-party Integrations|Custom Integrations|Zapier Integration|2FA Authentication|SSO Integration|Advanced Permissions|SOC 2 Compliance|Email Support|Priority Support|Phone Support|Dedicated Manager|Custom Training' 
  },
  feature_availability: { 
    type: 'string' as const, 
    default: 'Up to 5|10GB|Up to 5|✓|✗|✗|✗|✓|✓|✗|✗|✓|✗|✗|✗|✓|✗|✗|✗|✗;Unlimited|100GB|Up to 25|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✗|✓|✓|✗|✗|✗;Unlimited|Unlimited|Unlimited|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓|✓' 
  },
  popular_tiers: { 
    type: 'string' as const, 
    default: 'false|true|false' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'Number of active projects you can manage|Total storage space for files and assets|Maximum team members per workspace|Connect with popular tools|Advanced API for custom integrations|Work together in real-time|Advanced workflow automation|Track changes and revert|Connect 50+ popular apps|Custom API integrations|Automate with 1000+ apps|Two-factor authentication|Single sign-on integration|Role-based access control|Enterprise compliance|Standard email support|Priority customer support|Dedicated phone support|Personal account manager|Custom onboarding training' 
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

export default function FeatureMatrix(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<FeatureMatrixContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const h4Style = getTypographyStyle('h4');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const [activeCategory, setActiveCategory] = useState(0);

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

  const popularTiers = blockContent.popular_tiers 
    ? blockContent.popular_tiers.split('|').map(item => item.trim().toLowerCase() === 'true')
    : [];

  const featureCategories = blockContent.feature_categories 
    ? blockContent.feature_categories.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureNames = blockContent.feature_names 
    ? blockContent.feature_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // Parse feature availability matrix
  const featureAvailability = blockContent.feature_availability 
    ? blockContent.feature_availability.split(';').map(tierData => 
        tierData.split('|').map(item => item.trim())
      )
    : [];

  const tiers = tierNames.map((name, index) => ({
    name,
    price: tierPrices[index] || '',
    description: tierDescriptions[index] || '',
    ctaText: ctaTexts[index] || 'Get Started',
    isPopular: popularTiers[index] || false,
    features: featureAvailability[index] || []
  }));

  // Group features by category (assuming 4 features per category for demo)
  const featuresPerCategory = Math.ceil(featureNames.length / featureCategories.length);
  const categorizedFeatures = featureCategories.map((category, categoryIndex) => ({
    name: category,
    features: featureNames.slice(
      categoryIndex * featuresPerCategory,
      (categoryIndex + 1) * featuresPerCategory
    ).map((featureName, featureIndex) => ({
      name: featureName,
      description: featureDescriptions[categoryIndex * featuresPerCategory + featureIndex] || '',
      globalIndex: categoryIndex * featuresPerCategory + featureIndex
    }))
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const renderFeatureValue = (value: string) => {
    if (value === '✓' || value.toLowerCase() === 'true') {
      return (
        <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (value === '✗' || value.toLowerCase() === 'false') {
      return (
        <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return <span className="text-sm font-medium text-gray-900">{value}</span>;
  };

  const activeFeatures = categorizedFeatures[activeCategory] || { features: [] };
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FeatureMatrix"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
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
              placeholder="Add optional subheadline to introduce feature comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 style={h4Style} className="font-semibold text-gray-700 mb-4">Feature Matrix Content</h4>
              
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
                  value={blockContent.feature_categories || ''}
                  onEdit={(value) => handleContentUpdate('feature_categories', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature categories (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_categories"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_names || ''}
                  onEdit={(value) => handleContentUpdate('feature_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_availability || ''}
                  onEdit={(value) => handleContentUpdate('feature_availability', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Feature availability matrix (tiers separated by semicolon, features by pipe)"
                  sectionId={sectionId}
                  elementKey="feature_availability"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Plan Headers */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <div className="hidden lg:block"></div>
              {tiers.map((tier, index) => (
                <div key={index} className={`bg-white rounded-xl border-2 p-6 text-center ${
                  tier.isPopular 
                    ? `border-primary relative` 
                    : 'border-gray-200'
                }`}>
                  {tier.isPopular && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${colorTokens.ctaBg} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
                      Most Popular
                    </div>
                  )}
                  
                  <h3 style={h3Style} className="font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div style={getTypographyStyle('h2')} className="font-bold text-gray-900 mb-2">{tier.price}</div>
                  <p className={`text-sm ${mutedTextColor} mb-4`}>{tier.description}</p>
                  
                  <CTAButton
                    text={tier.ctaText}
                    colorTokens={colorTokens}
                    className="w-full"
                    variant={tier.isPopular ? "primary" : "secondary"}
                    sectionId={sectionId}
                    elementKey={`cta_${index}`}
                  />
                </div>
              ))}
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {featureCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(index)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeCategory === index
                      ? `${colorTokens.ctaBg} text-white shadow-lg`
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Feature Comparison Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[250px]">
                        {activeFeatures.name || featureCategories[activeCategory]}
                      </th>
                      {tiers.map((tier, index) => (
                        <th key={index} className={`text-center p-4 font-semibold ${
                          tier.isPopular ? colorTokens.ctaText : 'text-gray-900'
                        }`}>
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeFeatures.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{feature.name}</div>
                            {feature.description && (
                              <div className={`text-sm ${mutedTextColor} mt-1`}>{feature.description}</div>
                            )}
                          </div>
                        </td>
                        {tiers.map((tier, tierIndex) => (
                          <td key={tierIndex} className="text-center p-4">
                            {renderFeatureValue(tier.features[feature.globalIndex] || '✗')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Enterprise Features Highlight */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mt-12 mb-12">
          <div className="text-center">
            <h3 style={h3Style} className="font-semibold mb-6">Enterprise-Grade Features</h3>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="font-semibold text-white">Security</div>
                <div className="text-gray-300 text-sm">SOC 2, SSO, 2FA</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="font-semibold text-white">Performance</div>
                <div className="text-gray-300 text-sm">99.9% uptime SLA</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="font-semibold text-white">Support</div>
                <div className="text-gray-300 text-sm">Dedicated manager</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="font-semibold text-white">Integration</div>
                <div className="text-gray-300 text-sm">Custom APIs</div>
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
                placeholder="Add optional supporting text to reinforce feature comparison..."
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
  name: 'FeatureMatrix',
  category: 'Pricing',
  description: 'Detailed feature comparison matrix for enterprise buyers. Perfect for complex products with many features.',
  tags: ['pricing', 'comparison', 'matrix', 'enterprise', 'features'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tier_names', label: 'Tier Names (pipe separated)', type: 'text', required: true },
    { key: 'tier_prices', label: 'Tier Prices (pipe separated)', type: 'text', required: true },
    { key: 'tier_descriptions', label: 'Tier Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_texts', label: 'CTA Button Texts (pipe separated)', type: 'text', required: true },
    { key: 'feature_categories', label: 'Feature Categories (pipe separated)', type: 'text', required: true },
    { key: 'feature_names', label: 'Feature Names (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_availability', label: 'Feature Availability Matrix (semicolon for tiers, pipe for features)', type: 'textarea', required: true },
    { key: 'popular_tiers', label: 'Popular Tiers true/false (pipe separated)', type: 'text', required: false },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Categorized feature comparison',
    'Interactive category tabs',
    'Visual feature availability matrix',
    'Enterprise feature highlighting',
    'Popular plan indicators',
    'Responsive table design'
  ],
  
  useCases: [
    'Enterprise software sales',
    'Complex feature comparison',
    'Product-aware audiences',
    'Technical decision makers',
    'B2B pricing tables'
  ]
};