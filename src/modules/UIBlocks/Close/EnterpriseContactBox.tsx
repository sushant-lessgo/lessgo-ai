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

interface EnterpriseContactBoxContent {
  headline: string;
  value_proposition: string;
  contact_options: string;
  contact_descriptions: string;
  response_times: string;
  enterprise_features: string;
  qualification_points: string;
  cta_primary: string;
  cta_secondary?: string;
  availability_text?: string;
  team_size_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Ready for Enterprise-Grade Solutions?' 
  },
  value_proposition: { 
    type: 'string' as const, 
    default: 'Let our enterprise specialists design a custom solution that scales with your organization.' 
  },
  contact_options: { 
    type: 'string' as const, 
    default: 'Schedule Strategy Call|Request Custom Demo|Get Enterprise Quote|Download Enterprise Brief' 
  },
  contact_descriptions: { 
    type: 'string' as const, 
    default: '30-min consultation with our solution architect|Live demo tailored to your use case|Custom pricing for your organization|Detailed technical specifications and case studies' 
  },
  response_times: { 
    type: 'string' as const, 
    default: 'Same day|Within 24 hours|Within 2 hours|Instant download' 
  },
  enterprise_features: { 
    type: 'string' as const, 
    default: 'Custom integrations and APIs|Dedicated customer success manager|White-glove onboarding|Enterprise security and compliance|Unlimited users and usage|Priority 24/7 support' 
  },
  qualification_points: { 
    type: 'string' as const, 
    default: '100+ employees|Multiple departments|Complex integration needs|Compliance requirements|High-volume usage' 
  },
  cta_primary: { 
    type: 'string' as const, 
    default: 'Schedule Strategy Call' 
  },
  cta_secondary: { 
    type: 'string' as const, 
    default: 'Request Demo' 
  },
  availability_text: { 
    type: 'string' as const, 
    default: 'Our enterprise team is available Monday-Friday, 9 AM - 6 PM EST' 
  },
  team_size_text: { 
    type: 'string' as const, 
    default: 'Trusted by 500+ enterprise customers worldwide' 
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

export default function EnterpriseContactBox(props: LayoutComponentProps) {
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
  } = useLayoutComponent<EnterpriseContactBoxContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const contactOptions = blockContent.contact_options 
    ? blockContent.contact_options.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const contactDescriptions = blockContent.contact_descriptions 
    ? blockContent.contact_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const responseTimes = blockContent.response_times 
    ? blockContent.response_times.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const enterpriseFeatures = blockContent.enterprise_features 
    ? blockContent.enterprise_features.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const qualificationPoints = blockContent.qualification_points 
    ? blockContent.qualification_points.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const getContactIcon = (index: number) => {
    const icons = [
      // Schedule Call
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>,
      // Demo
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>,
      // Quote
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>,
      // Download
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ];
    return icons[index % icons.length];
  };

  const ContactOption = ({ option, description, responseTime, index }: {
    option: string;
    description: string;
    responseTime: string;
    index: number;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center text-white flex-shrink-0`}>
          {getContactIcon(index)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{option}</h4>
          <p className={`text-sm ${mutedTextColor} mb-3`}>{description}</p>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-600">Response: {responseTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="EnterpriseContactBox"
      backgroundType={safeBackgroundType}
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
              placeholder="Add optional subheadline to introduce enterprise contact..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed" style={bodyLgStyle}>
              {blockContent.value_proposition}
            </p>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Enterprise Contact Content</h4>
              
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
                  value={blockContent.contact_options || ''}
                  onEdit={(value) => handleContentUpdate('contact_options', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Contact options (pipe separated)"
                  sectionId={sectionId}
                  elementKey="contact_options"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.contact_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('contact_descriptions', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Contact descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="contact_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.enterprise_features || ''}
                  onEdit={(value) => handleContentUpdate('enterprise_features', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Enterprise features (pipe separated)"
                  sectionId={sectionId}
                  elementKey="enterprise_features"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Contact Options Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">
              {contactOptions.map((option, index) => (
                <ContactOption
                  key={index}
                  option={option}
                  description={contactDescriptions[index] || ''}
                  responseTime={responseTimes[index] || 'Within 24 hours'}
                  index={index}
                />
              ))}
            </div>

            {/* Primary CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center mb-16">
              <h3 className="font-bold mb-4" style={h2Style}>Start Your Enterprise Journey Today</h3>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Join hundreds of enterprise customers who trust us with their mission-critical operations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTAButton
                  text={blockContent.cta_primary}
                  colorTokens={{...colorTokens, ctaBg: 'bg-white', ctaText: 'text-blue-600'}}
                  className="shadow-lg hover:shadow-xl"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_primary"
                />
                
                {blockContent.cta_secondary && (
                  <CTAButton
                    text={blockContent.cta_secondary}
                    colorTokens={{...colorTokens, ctaBg: 'bg-transparent border-2 border-white', ctaText: 'text-white'}}
                    className="hover:bg-white hover:text-blue-600 transition-all duration-300"
                    variant="secondary"
                    sectionId={sectionId}
                    elementKey="cta_secondary"
                  />
                )}
              </div>

              {blockContent.availability_text && (
                <p className="text-blue-200 text-sm mt-6">
                  {blockContent.availability_text}
                </p>
              )}
            </div>

            {/* Enterprise Features */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-16">
              <h3 className="font-semibold text-gray-900 text-center mb-8" style={h3Style}>
                Enterprise Features Included
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {enterpriseFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualification Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-16">
              <div className="text-center mb-8">
                <h3 className="font-semibold text-gray-900 mb-4" style={h3Style}>
                  Is Enterprise Right for You?
                </h3>
                <p className={`${mutedTextColor} max-w-2xl mx-auto`}>
                  Our enterprise solutions are designed for organizations with specific requirements and scale.
                </p>
              </div>
              
              <div className="grid md:grid-cols-5 gap-4">
                {qualificationPoints.map((point, index) => (
                  <div key={index} className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{point}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            {blockContent.team_size_text && (
              <div className="text-center bg-green-50 rounded-xl p-6 border border-green-100 mb-16">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{blockContent.team_size_text}</div>
                    <div className={`text-sm ${mutedTextColor}`}>
                      Join the leading enterprises who chose our platform
                    </div>
                  </div>
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
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
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
  name: 'EnterpriseContactBox',
  category: 'Close',
  description: 'Professional enterprise contact flow with multiple touchpoints. Perfect for B2B enterprise sales processes.',
  tags: ['enterprise', 'contact', 'B2B', 'sales', 'professional', 'qualification'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'value_proposition', label: 'Value Proposition', type: 'textarea', required: true },
    { key: 'contact_options', label: 'Contact Options (pipe separated)', type: 'text', required: true },
    { key: 'contact_descriptions', label: 'Contact Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'response_times', label: 'Response Times (pipe separated)', type: 'text', required: true },
    { key: 'enterprise_features', label: 'Enterprise Features (pipe separated)', type: 'textarea', required: true },
    { key: 'qualification_points', label: 'Qualification Points (pipe separated)', type: 'text', required: true },
    { key: 'cta_primary', label: 'Primary CTA Text', type: 'text', required: true },
    { key: 'cta_secondary', label: 'Secondary CTA Text', type: 'text', required: false },
    { key: 'availability_text', label: 'Availability Text', type: 'text', required: false },
    { key: 'team_size_text', label: 'Social Proof Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Multiple contact options with descriptions',
    'Response time expectations',
    'Enterprise feature highlights',
    'Qualification criteria display',
    'Professional contact flow design',
    'Social proof and trust elements'
  ],
  
  useCases: [
    'Enterprise software sales',
    'B2B service providers',
    'Custom solution offerings',
    'High-value consultative sales',
    'Enterprise SaaS platforms'
  ]
};