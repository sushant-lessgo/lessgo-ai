import React, { useState } from 'react';
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

interface AccordionStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_details: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Step indicators
  step_indicator_1_text?: string;
  step_indicator_2_text?: string;
  step_indicator_3_text?: string;
  step_indicator_1_icon?: string;
  step_indicator_2_icon?: string;
  step_indicator_3_icon?: string;
  // Technical Specs Summary
  tech_specs_heading?: string;
  tech_spec_1_value?: string;
  tech_spec_1_label?: string;
  tech_spec_2_value?: string;
  tech_spec_2_label?: string;
  tech_spec_3_value?: string;
  tech_spec_3_label?: string;
  tech_specs_description?: string;
  show_step_indicators?: boolean;
  show_tech_specs?: boolean;
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
  },
  // Step indicators
  step_indicator_1_text: { 
    type: 'string' as const, 
    default: 'Enterprise Ready' 
  },
  step_indicator_2_text: { 
    type: 'string' as const, 
    default: 'Secure' 
  },
  step_indicator_3_text: { 
    type: 'string' as const, 
    default: 'API Driven' 
  },
  step_indicator_1_icon: { type: 'string' as const, default: '✅' },
  step_indicator_2_icon: { type: 'string' as const, default: '🔒' },
  step_indicator_3_icon: { type: 'string' as const, default: '💻' },
  // Technical Specs Summary
  tech_specs_heading: { 
    type: 'string' as const, 
    default: 'Enterprise-Grade Implementation' 
  },
  tech_spec_1_value: { 
    type: 'string' as const, 
    default: '99.9%' 
  },
  tech_spec_1_label: { 
    type: 'string' as const, 
    default: 'Uptime SLA' 
  },
  tech_spec_2_value: { 
    type: 'string' as const, 
    default: 'API-First' 
  },
  tech_spec_2_label: { 
    type: 'string' as const, 
    default: 'Architecture' 
  },
  tech_spec_3_value: { 
    type: 'string' as const, 
    default: 'SOC 2' 
  },
  tech_spec_3_label: { 
    type: 'string' as const, 
    default: 'Compliant' 
  },
  tech_specs_description: { 
    type: 'string' as const, 
    default: 'Built for enterprise requirements with comprehensive security, scalability, and integration capabilities' 
  },
  show_step_indicators: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_tech_specs: { 
    type: 'boolean' as const, 
    default: true 
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

  // Icon edit handlers
  const handleStepIndicatorIconEdit = (index: number, value: string) => {
    const iconField = `step_indicator_${index + 1}_icon` as keyof AccordionStepsContent;
    handleContentUpdate(iconField, value);
  };

  const getStepIndicatorIcon = (index: number) => {
    const iconFields = ['step_indicator_1_icon', 'step_indicator_2_icon', 'step_indicator_3_icon'];
    return blockContent[iconFields[index] as keyof AccordionStepsContent] || ['✅', '🔒', '💻'][index];
  };

  const AccordionStep = ({ step, index, isOpen, onToggle, blockContent, handleContentUpdate, mode, backgroundType, colorTokens, sectionId }: {
    step: { title: string; description: string; details: string };
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    blockContent: AccordionStepsContent;
    handleContentUpdate: (key: string, value: any) => void;
    mode: 'edit' | 'preview';
    backgroundType: any;
    colorTokens: any;
    sectionId: string;
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
                <IconEditableText
                  mode={mode}
                  value={getStepIndicatorIcon(0)}
                  onEdit={(value) => handleStepIndicatorIconEdit(0, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg text-green-600"
                  sectionId={sectionId}
                  elementKey="step_indicator_1_icon"
                />
                <span className="text-sm font-medium">{blockContent.step_indicator_1_text}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <IconEditableText
                  mode={mode}
                  value={getStepIndicatorIcon(1)}
                  onEdit={(value) => handleStepIndicatorIconEdit(1, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg text-blue-600"
                  sectionId={sectionId}
                  elementKey="step_indicator_2_icon"
                />
                <span className="text-sm font-medium">{blockContent.step_indicator_2_text}</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-600">
                <IconEditableText
                  mode={mode}
                  value={getStepIndicatorIcon(2)}
                  onEdit={(value) => handleStepIndicatorIconEdit(2, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-lg text-purple-600"
                  sectionId={sectionId}
                  elementKey="step_indicator_3_icon"
                />
                <span className="text-sm font-medium">{blockContent.step_indicator_3_text}</span>
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
                blockContent={blockContent}
                handleContentUpdate={handleContentUpdate}
                mode={mode}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                sectionId={sectionId}
              />
            ))}
          </div>
        )}

        {/* Technical Specs Summary */}
        {blockContent.show_tech_specs !== false && (
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mb-12">
            <div className="text-center">
              {(blockContent.tech_specs_heading || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tech_specs_heading || ''}
                  onEdit={(value) => handleContentUpdate('tech_specs_heading', value)}
                  backgroundType="dark"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xl font-semibold mb-6 text-white"
                  placeholder="Technical specs heading"
                  sectionBackground="dark"
                  data-section-id={sectionId}
                  data-element-key="tech_specs_heading"
                />
              )}
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_1_value || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_1_value', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-3xl font-bold text-blue-400 mb-2"
                    placeholder="Spec 1 value"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_1_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_1_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_1_label', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 1 label"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_1_label"
                  />
                </div>
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_2_value || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_2_value', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-3xl font-bold text-green-400 mb-2"
                    placeholder="Spec 2 value"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_2_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_2_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_2_label', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 2 label"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_2_label"
                  />
                </div>
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_3_value || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_3_value', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-3xl font-bold text-purple-400 mb-2"
                    placeholder="Spec 3 value"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_3_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_3_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_3_label', value)}
                    backgroundType="dark"
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 3 label"
                    sectionBackground="dark"
                    data-section-id={sectionId}
                    data-element-key="tech_spec_3_label"
                  />
                </div>
              </div>
              
              {(blockContent.tech_specs_description || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tech_specs_description || ''}
                  onEdit={(value) => handleContentUpdate('tech_specs_description', value)}
                  backgroundType="dark"
                  colorTokens={colorTokens}
                  variant="body"
                  className="mt-6 text-gray-300 max-w-2xl mx-auto"
                  placeholder="Technical specs description"
                  sectionBackground="dark"
                  data-section-id={sectionId}
                  data-element-key="tech_specs_description"
                />
              )}
            </div>
          </div>
        )}

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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'step_indicator_1_text', label: 'Step Indicator 1', type: 'text', required: false },
    { key: 'step_indicator_2_text', label: 'Step Indicator 2', type: 'text', required: false },
    { key: 'step_indicator_3_text', label: 'Step Indicator 3', type: 'text', required: false },
    { key: 'tech_specs_heading', label: 'Technical Specs Heading', type: 'text', required: false },
    { key: 'tech_spec_1_value', label: 'Tech Spec 1 Value', type: 'text', required: false },
    { key: 'tech_spec_1_label', label: 'Tech Spec 1 Label', type: 'text', required: false },
    { key: 'tech_spec_2_value', label: 'Tech Spec 2 Value', type: 'text', required: false },
    { key: 'tech_spec_2_label', label: 'Tech Spec 2 Label', type: 'text', required: false },
    { key: 'tech_spec_3_value', label: 'Tech Spec 3 Value', type: 'text', required: false },
    { key: 'tech_spec_3_label', label: 'Tech Spec 3 Label', type: 'text', required: false },
    { key: 'tech_specs_description', label: 'Technical Specs Description', type: 'textarea', required: false },
    { key: 'show_step_indicators', label: 'Show Step Indicators', type: 'boolean', required: false },
    { key: 'show_tech_specs', label: 'Show Technical Specs', type: 'boolean', required: false }
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