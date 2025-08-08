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

interface AccordionStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_details: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Technical Implementation Process' 
  },
  step_titles: { 
    type: 'string' as const, 
    default: 'API Integration & Setup|Data Migration & Validation|Custom Configuration|Testing & Deployment' 
  },
  step_descriptions: { 
    type: 'string' as const, 
    default: 'Seamlessly integrate with your existing systems using our comprehensive API documentation and SDKs.|Migrate your data securely with automated validation and rollback capabilities.|Configure custom workflows, permissions, and business rules to match your requirements.|Run comprehensive testing and deploy to production with zero downtime.' 
  },
  step_details: { 
    type: 'string' as const, 
    default: 'Our API supports RESTful endpoints, GraphQL, and real-time webhooks. We provide SDKs for Python, JavaScript, Java, and .NET with comprehensive documentation and code examples. Authentication uses OAuth 2.0 with optional SAML integration.|Data migration includes schema mapping, incremental sync, and conflict resolution. All transfers use AES-256 encryption with audit logging. We support rollback to any previous state and provide data integrity verification.|Custom configuration includes role-based access control, workflow automation rules, custom fields, and integration mappings. All changes are version controlled and can be deployed across environments.|Testing includes unit tests, integration tests, and load testing. Deployment uses blue-green deployment with automatic rollback on failure. We provide monitoring and alerting for all critical metrics.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  }
};

export default function AccordionSteps(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<AccordionStepsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  const stepTitles = blockContent.step_titles 
    ? blockContent.step_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];
    
  // Typography styles
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body-lg');

  const stepDescriptions = blockContent.step_descriptions 
    ? blockContent.step_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const stepDetails = blockContent.step_details 
    ? blockContent.step_details.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const steps = stepTitles.map((title, index) => ({
    title,
    description: stepDescriptions[index] || '',
    details: stepDetails[index] || ''
  }));

  const [openStep, setOpenStep] = useState<number | null>(0);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const toggleStep = (index: number) => {
    setOpenStep(openStep === index ? null : index);
  };

  const AccordionStep = ({ step, index, isOpen, onToggle }: {
    step: { title: string; description: string; details: string };
    index: number;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <div className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg' : 'hover:shadow-md'}`}>
      <button
        onClick={onToggle}
        className={`w-full p-6 text-left transition-all duration-300 ${
          isOpen 
            ? `${colorTokens.ctaBg} text-white` 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              isOpen 
                ? 'bg-white/20 text-white' 
                : `${colorTokens.ctaBg} text-white`
            }`}>
              {index + 1}
            </div>
            <div>
              <h3 style={h3Style} className="text-lg font-semibold">{step.title}</h3>
              {!isOpen && (
                <p className={`text-sm mt-1 ${isOpen ? 'text-white/80' : mutedTextColor}`}>
                  {step.description.substring(0, 80)}...
                </p>
              )}
            </div>
          </div>
          
          <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-lg">
              {step.description}
            </p>
            
            {step.details && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h4 className="font-semibold text-gray-900 mb-2">Technical Details:</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.details}
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Enterprise Ready</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">API Driven</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AccordionSteps"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
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
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your technical implementation..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Accordion Step Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_titles || ''}
                  onEdit={(value) => handleContentUpdate('step_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('step_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Step descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.step_details || ''}
                  onEdit={(value) => handleContentUpdate('step_details', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  placeholder="Step technical details (pipe separated)"
                  sectionId={sectionId}
                  elementKey="step_details"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-12">
            {steps.map((step, index) => (
              <AccordionStep
                key={index}
                step={step}
                index={index}
                isOpen={openStep === index}
                onToggle={() => toggleStep(index)}
              />
            ))}
          </div>
        )}

        {/* Technical Specs Summary */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mb-12">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6">Enterprise-Grade Implementation</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
                <div className="text-gray-300 text-sm">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">API-First</div>
                <div className="text-gray-300 text-sm">Architecture</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">SOC 2</div>
                <div className="text-gray-300 text-sm">Compliant</div>
              </div>
            </div>
            
            <p className="mt-6 text-gray-300 max-w-2xl mx-auto">
              Built for enterprise requirements with comprehensive security, scalability, and integration capabilities
            </p>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
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
                placeholder="Add optional supporting text to reinforce technical capabilities..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
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
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'AccordionSteps',
  category: 'HowItWorks',
  description: 'Detailed accordion steps for complex technical processes. Perfect for builder/enterprise audiences.',
  tags: ['how-it-works', 'accordion', 'technical', 'detailed', 'enterprise'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'step_titles', label: 'Step Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'step_descriptions', label: 'Step Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'step_details', label: 'Technical Details (pipe separated)', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive accordion interface',
    'Detailed technical explanations',
    'Enterprise-grade presentation',
    'Technical specs summary',
    'Perfect for complex products',
    'Builder/developer focused'
  ],
  
  useCases: [
    'Technical product implementations',
    'API and integration explanations',
    'Enterprise software processes',
    'Developer tool workflows',
    'Complex system architectures'
  ]
};