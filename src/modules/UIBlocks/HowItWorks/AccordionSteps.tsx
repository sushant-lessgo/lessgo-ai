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
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

interface AccordionStepsContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_details: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
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

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Debug theme detection
  React.useEffect(() => {
    console.log('🎨 AccordionSteps theme detection:', {
      sectionId,
      hasManualOverride: !!props.manualThemeOverride,
      manualTheme: props.manualThemeOverride,
      hasUserContext: !!props.userContext,
      userContext: props.userContext,
      finalTheme: theme
    });
  }, [theme, props.manualThemeOverride, props.userContext, sectionId]);

  const getAccordionColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        contentBorder: 'border-orange-100',
        techDetailsBg: 'bg-orange-50',
        techDetailsBorder: 'border-l-4 border-orange-500',
        techSpecGradient: 'bg-gradient-to-r from-orange-950 to-orange-900',
        spec1Color: 'text-orange-400',
        spec2Color: 'text-amber-400',
        spec3Color: 'text-yellow-400',
        focusRing: 'focus:ring-orange-500',
        stepIndicator: 'bg-orange-500',
        stepIndicatorOpen: 'bg-white/20'
      },
      cool: {
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        contentBorder: 'border-blue-100',
        techDetailsBg: 'bg-blue-50',
        techDetailsBorder: 'border-l-4 border-blue-500',
        techSpecGradient: 'bg-gradient-to-r from-blue-950 to-blue-900',
        spec1Color: 'text-blue-400',
        spec2Color: 'text-cyan-400',
        spec3Color: 'text-indigo-400',
        focusRing: 'focus:ring-blue-500',
        stepIndicator: 'bg-blue-500',
        stepIndicatorOpen: 'bg-white/20'
      },
      neutral: {
        border: 'border-amber-200',
        borderHover: 'hover:border-amber-300',
        contentBorder: 'border-amber-100',
        techDetailsBg: 'bg-amber-50',
        techDetailsBorder: 'border-l-4 border-amber-500',
        techSpecGradient: 'bg-gradient-to-r from-slate-900 to-slate-800',
        spec1Color: 'text-amber-400',
        spec2Color: 'text-slate-400',
        spec3Color: 'text-stone-400',
        focusRing: 'focus:ring-amber-500',
        stepIndicator: 'bg-slate-500',
        stepIndicatorOpen: 'bg-white/20'
      }
    };
    return colorMap[theme];
  };

  const accordionColors = getAccordionColors(theme);

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


  const AccordionStep = ({ step, index, isOpen, onToggle, blockContent, handleContentUpdate, mode, backgroundType, colorTokens, sectionId, onRemove, theme, accordionColors }: {
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
    onRemove?: () => void;
    theme: UIBlockTheme;
    accordionColors: ReturnType<typeof getAccordionColors>;
  }) => (
    <div className={`relative border ${accordionColors.border} ${accordionColors.borderHover} rounded-lg overflow-hidden ${cardEnhancements.transition} ${isOpen ? 'shadow-lg' : shadows.cardHover[theme]} ${shadows.card[theme]} group`}>
      <button
        onClick={onToggle}
        className={`w-full p-6 text-left transition-all duration-300 ${
          isOpen && mode === 'preview'
            ? `${colorTokens.ctaBg} text-white` 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              isOpen && mode === 'preview'
                ? accordionColors.stepIndicatorOpen
                : accordionColors.stepIndicator
            } text-white`}>
              {index + 1}
            </div>
            <div className="flex-1">
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                    stepTitles[index] = e.currentTarget.textContent || '';
                    handleContentUpdate('step_titles', stepTitles.join('|'));
                  }}
                  className={`text-lg font-semibold outline-none focus:ring-2 focus:ring-opacity-50 rounded px-2 py-1 cursor-text min-h-[32px] text-gray-900 ${accordionColors.focusRing} hover:bg-gray-100`}
                  data-placeholder="Step title"
                >
                  {step.title}
                </div>
              ) : (
                <h3 style={h3Style} className="text-lg font-semibold">{step.title}</h3>
              )}
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
        <div className={`p-6 bg-white border-t ${accordionColors.contentBorder}`}>
          <div className="space-y-4">
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                  stepDescriptions[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                }}
                className={`text-gray-700 leading-relaxed text-lg outline-none focus:ring-2 ${accordionColors.focusRing} focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[48px]`}
                data-placeholder="Step description"
              >
                {step.description}
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed text-lg">
                {step.description}
              </p>
            )}
            
            {(step.details || mode === 'edit') && (
              <div className={`rounded-lg p-4 ${accordionColors.techDetailsBg} ${accordionColors.techDetailsBorder}`}>
                <h4 className="font-semibold text-gray-900 mb-2">Technical Details:</h4>
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const stepDetails = blockContent.step_details ? blockContent.step_details.split('|') : [];
                      stepDetails[index] = e.currentTarget.textContent || '';
                      handleContentUpdate('step_details', stepDetails.join('|'));
                    }}
                    className={`text-gray-600 text-sm leading-relaxed outline-none focus:ring-2 ${accordionColors.focusRing} focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-white min-h-[48px]`}
                    data-placeholder="Technical details for this step"
                  >
                    {step.details}
                  </div>
                ) : (
                  step.details && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.details}
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Remove Step Button - only in edit mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1.5 shadow-md"
          title="Remove this step"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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

        {/* Accordion Steps - Always visible in both modes */}
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
              theme={theme}
              accordionColors={accordionColors}
              onRemove={steps.length > 1 ? () => {
                const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                const stepDetails = blockContent.step_details ? blockContent.step_details.split('|') : [];
                
                stepTitles.splice(index, 1);
                stepDescriptions.splice(index, 1);
                stepDetails.splice(index, 1);
                
                handleContentUpdate('step_titles', stepTitles.join('|'));
                handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                handleContentUpdate('step_details', stepDetails.join('|'));
                
                // Reset open step if we're removing the currently open one
                if (openStep === index) {
                  setOpenStep(null);
                } else if (openStep !== null && openStep > index) {
                  setOpenStep(openStep - 1);
                }
              } : undefined}
            />
          ))}
          
          {/* Add Step Button - only in edit mode */}
          {mode === 'edit' && steps.length < 6 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const stepTitles = blockContent.step_titles ? blockContent.step_titles.split('|') : [];
                  const stepDescriptions = blockContent.step_descriptions ? blockContent.step_descriptions.split('|') : [];
                  const stepDetails = blockContent.step_details ? blockContent.step_details.split('|') : [];
                  
                  stepTitles.push(`Step ${stepTitles.length + 1}`);
                  stepDescriptions.push('Add your step description here');
                  stepDetails.push('Add technical details for this step');
                  
                  handleContentUpdate('step_titles', stepTitles.join('|'));
                  handleContentUpdate('step_descriptions', stepDescriptions.join('|'));
                  handleContentUpdate('step_details', stepDetails.join('|'));
                  
                  // Open the newly added step
                  setOpenStep(stepTitles.length - 1);
                }}
                className="w-full max-w-lg p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-all duration-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg"
                title="Add new accordion step"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add New Step</span>
              </button>
            </div>
          )}
        </div>

        {/* Technical Specs Summary */}
        {blockContent.show_tech_specs !== false && (
          <div className={`${accordionColors.techSpecGradient} rounded-2xl p-8 text-white mb-12`}>
            <div className="text-center">
              {(blockContent.tech_specs_heading || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tech_specs_heading || ''}
                  onEdit={(value) => handleContentUpdate('tech_specs_heading', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xl font-semibold mb-6 text-white"
                  placeholder="Technical specs heading"
                  sectionBackground={sectionBackground}
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
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-3xl font-bold ${accordionColors.spec1Color} mb-2`}
                    placeholder="Spec 1 value"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="tech_spec_1_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_1_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_1_label', value)}
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 1 label"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="tech_spec_1_label"
                  />
                </div>
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_2_value || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_2_value', value)}
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-3xl font-bold ${accordionColors.spec2Color} mb-2`}
                    placeholder="Spec 2 value"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="tech_spec_2_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_2_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_2_label', value)}
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 2 label"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="tech_spec_2_label"
                  />
                </div>
                <div className="text-center">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_3_value || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_3_value', value)}
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-3xl font-bold ${accordionColors.spec3Color} mb-2`}
                    placeholder="Spec 3 value"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="tech_spec_3_value"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.tech_spec_3_label || ''}
                    onEdit={(value) => handleContentUpdate('tech_spec_3_label', value)}
                    backgroundType={props.backgroundType || 'neutral'}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-300 text-sm"
                    placeholder="Spec 3 label"
                    sectionBackground={sectionBackground}
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
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mt-6 text-gray-300 max-w-2xl mx-auto"
                  placeholder="Technical specs description"
                  sectionBackground={sectionBackground}
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