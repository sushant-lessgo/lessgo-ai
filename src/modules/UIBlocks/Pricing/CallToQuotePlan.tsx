import React from 'react';
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

interface CallToQuotePlanContent {
  headline: string;
  value_proposition: string;
  enterprise_features: string;
  compliance_badges: string;
  sales_benefits: string;
  contact_options: string;
  contact_ctas: string;
  implementation_timeline?: string;
  pricing_factors?: string;
  success_metrics?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Enterprise Solutions Tailored to Your Needs' 
  },
  value_proposition: { 
    type: 'string' as const, 
    default: `Get a custom solution designed specifically for your organization's unique requirements, complete with dedicated support and enterprise-grade security.` 
  },
  enterprise_features: { 
    type: 'string' as const, 
    default: 'Custom integrations and APIs|Dedicated customer success manager|White-glove onboarding and training|Enterprise-grade security and compliance|Unlimited users and storage|Priority 24/7 support|Custom SLA agreements|Advanced analytics and reporting' 
  },
  compliance_badges: { 
    type: 'string' as const, 
    default: 'SOC 2 Type II|GDPR Compliant|HIPAA Ready|ISO 27001|Enterprise SSO' 
  },
  sales_benefits: { 
    type: 'string' as const, 
    default: 'Free consultation with our solution architects|Custom pricing based on your specific needs|Flexible deployment options (cloud, on-premise, hybrid)|Dedicated implementation team|90-day success guarantee' 
  },
  contact_options: { 
    type: 'string' as const, 
    default: 'Schedule a Demo|Request a Quote|Talk to Sales|Download Enterprise Brief' 
  },
  contact_ctas: { 
    type: 'string' as const, 
    default: 'Book Demo|Get Quote|Contact Sales|Download PDF' 
  },
  implementation_timeline: { 
    type: 'string' as const, 
    default: 'Initial consultation: 1-2 weeks|Custom solution design: 2-4 weeks|Implementation and testing: 4-8 weeks|Go-live and training: 1-2 weeks' 
  },
  pricing_factors: { 
    type: 'string' as const, 
    default: 'Number of users and departments|Integration complexity|Compliance requirements|Support level needed|Deployment preferences' 
  },
  success_metrics: { 
    type: 'string' as const, 
    default: '99.9%|50+|24/7|90%' 
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

export default function CallToQuotePlan(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CallToQuotePlanContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const enterpriseFeatures = blockContent.enterprise_features 
    ? blockContent.enterprise_features.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const complianceBadges = blockContent.compliance_badges 
    ? blockContent.compliance_badges.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const salesBenefits = blockContent.sales_benefits 
    ? blockContent.sales_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactOptions = blockContent.contact_options 
    ? blockContent.contact_options.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactCtas = blockContent.contact_ctas 
    ? blockContent.contact_ctas.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const implementationTimeline = blockContent.implementation_timeline 
    ? blockContent.implementation_timeline.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const pricingFactors = blockContent.pricing_factors 
    ? blockContent.pricing_factors.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const successMetrics = blockContent.success_metrics 
    ? blockContent.success_metrics.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactOptionsList = contactOptions.map((option, index) => ({
    title: option,
    cta: contactCtas[index] || 'Contact Us'
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getContactIcon = (index: number) => {
    const icons = [
      // Demo
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>,
      // Quote  
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>,
      // Sales
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>,
      // Download
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ];
    return icons[index % icons.length];
  };

  const ContactCard = ({ option, index }: {
    option: typeof contactOptionsList[0];
    index: number;
  }) => (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${colorTokens.ctaBg} flex items-center justify-center text-white`}>
          {getContactIcon(index)}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{option.title}</h3>
        <CTAButton
          text={option.cta}
          colorTokens={colorTokens}
          textStyle={getTextStyle('body')}
          className="w-full"
          variant={index === 0 ? "primary" : "secondary"}
          sectionId={sectionId}
          elementKey={`contact_${index}`}
        />
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CallToQuotePlan"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce enterprise solutions..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed">
              {blockContent.value_proposition}
            </p>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Enterprise Pricing Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.value_proposition}
                  onEdit={(value) => handleContentUpdate('value_proposition', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Value proposition"
                  sectionId={sectionId}
                  elementKey="value_proposition"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_features}
                  onEdit={(value) => handleContentUpdate('enterprise_features', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Enterprise features (pipe separated)"
                  sectionId={sectionId}
                  elementKey="enterprise_features"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.contact_options}
                  onEdit={(value) => handleContentUpdate('contact_options', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Contact options (pipe separated)"
                  sectionId={sectionId}
                  elementKey="contact_options"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.contact_ctas}
                  onEdit={(value) => handleContentUpdate('contact_ctas', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Contact CTAs (pipe separated)"
                  sectionId={sectionId}
                  elementKey="contact_ctas"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Contact Options */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactOptionsList.map((option, index) => (
                <ContactCard
                  key={index}
                  option={option}
                  index={index}
                />
              ))}
            </div>

            {/* Enterprise Features */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mb-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Enterprise Features Included</h3>
                <p className="text-gray-300 max-w-3xl mx-auto">
                  Every enterprise solution comes with premium features designed for large-scale operations
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {enterpriseFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-100">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Process */}
            {implementationTimeline.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200 mb-16">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">Implementation Timeline</h3>
                
                <div className="grid md:grid-cols-4 gap-6">
                  {implementationTimeline.map((phase, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="text-sm text-gray-700">{phase}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Metrics */}
            {successMetrics.length >= 4 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-16">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">Enterprise Success Metrics</h3>
                
                <div className="grid md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{successMetrics[0]}</div>
                    <div className={`text-sm ${mutedTextColor}`}>Uptime SLA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{successMetrics[1]}</div>
                    <div className={`text-sm ${mutedTextColor}`}>Enterprise customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">{successMetrics[2]}</div>
                    <div className={`text-sm ${mutedTextColor}`}>Support availability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">{successMetrics[3]}</div>
                    <div className={`text-sm ${mutedTextColor}`}>Customer satisfaction</div>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance & Security */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 mb-16">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Enterprise Security & Compliance</h3>
                
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  {complianceBadges.map((badge, index) => (
                    <div key={index} className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                      {badge}
                    </div>
                  ))}
                </div>
                
                <p className={`${mutedTextColor} max-w-3xl mx-auto`}>
                  Your data security is our top priority. We maintain the highest standards of compliance and security.
                </p>
              </div>
            </div>

            {/* Sales Benefits */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-16">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">What's Included in Your Consultation</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {salesBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Factors */}
            {pricingFactors.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mb-16">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Pricing Based On</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {pricingFactors.map((factor, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-sm text-gray-700">{factor}</div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <p className={`text-sm ${mutedTextColor}`}>
                    Custom pricing ensures you only pay for what you need
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce enterprise value..."
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
  name: 'CallToQuotePlan',
  category: 'Pricing',
  description: 'Enterprise custom pricing with sales contact options. Perfect for high-value B2B sales.',
  tags: ['pricing', 'enterprise', 'custom', 'sales', 'B2B'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'value_proposition', label: 'Value Proposition', type: 'textarea', required: true },
    { key: 'enterprise_features', label: 'Enterprise Features (pipe separated)', type: 'textarea', required: true },
    { key: 'compliance_badges', label: 'Compliance Badges (pipe separated)', type: 'text', required: true },
    { key: 'sales_benefits', label: 'Sales Benefits (pipe separated)', type: 'textarea', required: true },
    { key: 'contact_options', label: 'Contact Options (pipe separated)', type: 'text', required: true },
    { key: 'contact_ctas', label: 'Contact CTAs (pipe separated)', type: 'text', required: true },
    { key: 'implementation_timeline', label: 'Implementation Timeline (pipe separated)', type: 'textarea', required: false },
    { key: 'pricing_factors', label: 'Pricing Factors (pipe separated)', type: 'textarea', required: false },
    { key: 'success_metrics', label: 'Success Metrics (pipe separated)', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Multiple contact option cards',
    'Enterprise feature showcase',
    'Implementation timeline display',
    'Compliance and security badges',
    'Custom pricing factor explanation',
    'Sales consultation benefits'
  ],
  
  useCases: [
    'Enterprise software sales',
    'Custom solution pricing',
    'High-value B2B products',
    'Complex implementation projects',
    'Sales-driven pricing models'
  ]
};