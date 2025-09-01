// components/layout/BoldGuaranteePanel.tsx - Objection UIBlock for strong guarantees and risk reversal
// Builds confidence through powerful guarantees and removes purchase risk

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface BoldGuaranteePanelContent {
  headline: string;
  subheadline?: string;
  main_guarantee: string;
  guarantee_details: string;
  additional_guarantees: string;
  cta_text: string;
  risk_reversal_text?: string;
  risk_section_title?: string;
  trust_badge_1?: string;
  trust_badge_2?: string;
  trust_badge_3?: string;
  shield_icon?: string;
  guarantee_icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Our Iron-Clad Guarantee to You' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'We\'re so confident in our solution that we\'re willing to put our money where our mouth is.' 
  },
  main_guarantee: { 
    type: 'string' as const, 
    default: '30-Day Money-Back Guarantee' 
  },
  guarantee_details: { 
    type: 'string' as const, 
    default: 'If you don\'t see measurable results within 30 days, we\'ll refund every penny. No questions asked, no hoops to jump through.' 
  },
  additional_guarantees: { 
    type: 'string' as const, 
    default: 'Price Protection|Your price is locked for life - no surprise increases|Setup Guarantee|We\'ll set everything up for you or your money back|Support Guarantee|Get answers within 2 hours or your next month is free|Results Guarantee|See 20% improvement in 60 days or we work for free' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Risk-Free Today' 
  },
  risk_reversal_text: { 
    type: 'string' as const, 
    default: 'The only risk is missing out on the results everyone else is getting.' 
  },
  risk_section_title: {
    type: 'string' as const,
    default: 'Let\'s Talk About Risk'
  },
  trust_badge_1: {
    type: 'string' as const,
    default: 'Secure Payment'
  },
  trust_badge_2: {
    type: 'string' as const,
    default: '100% Protected'
  },
  trust_badge_3: {
    type: 'string' as const,
    default: 'Instant Access'
  },
  shield_icon: { type: 'string' as const, default: '🛡️' },
  guarantee_icon: { type: 'string' as const, default: '✅' }
};

export default function BoldGuaranteePanel(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<BoldGuaranteePanelContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h1Style = getTypographyStyle('h1');
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse additional guarantees from pipe-separated string
  const additionalGuarantees = blockContent.additional_guarantees 
    ? blockContent.additional_guarantees.split('|').reduce((guarantees, item, index) => {
        if (index % 2 === 0) {
          guarantees.push({ title: item.trim(), description: '' });
        } else {
          guarantees[guarantees.length - 1].description = item.trim();
        }
        return guarantees;
      }, [] as Array<{title: string, description: string}>)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BoldGuaranteePanel"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a subheadline that builds confidence in the guarantee..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Main Guarantee Panel */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 text-center text-white shadow-2xl mb-12 relative overflow-hidden">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-8 w-24 h-24 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-8 right-8 w-32 h-32 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            {/* Shield Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <IconEditableText
                mode={mode}
                value={blockContent.shield_icon || '🛡️'}
                onEdit={(value) => handleContentUpdate('shield_icon', value)}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: 'text-white'}}
                iconSize="xl"
                className="text-5xl text-white"
                sectionId={sectionId}
                elementKey="shield_icon"
              />
            </div>

            {/* Main Guarantee */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.main_guarantee || ''}
              onEdit={(value) => handleContentUpdate('main_guarantee', value)}
              backgroundType="custom"
              colorTokens={{
                ...colorTokens,
                primaryText: 'text-white',
                mutedText: 'text-green-50'
              }}
              variant="body"
              style={{...h1Style, fontSize: 'clamp(2rem, 5vw, 2.5rem)'}} 
              className="mb-4"
              placeholder="Enter main guarantee"
              sectionBackground="gradient"
              data-section-id={sectionId}
              data-element-key="main_guarantee"
            />

            {/* Guarantee Details */}
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.guarantee_details || ''}
              onEdit={(value) => handleContentUpdate('guarantee_details', value)}
              backgroundType="custom"
              colorTokens={{
                ...colorTokens,
                primaryText: 'text-green-50',
                mutedText: 'text-green-100'
              }}
              variant="body"
              style={{...bodyLgStyle, fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)'}} 
              className="leading-relaxed max-w-3xl mx-auto mb-8"
              placeholder="Enter guarantee details"
              sectionBackground="gradient"
              data-section-id={sectionId}
              data-element-key="guarantee_details"
            />

            {/* CTA Button */}
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={{
                ...colorTokens,
                ctaBg: 'bg-white',
                ctaHover: 'hover:bg-gray-100',
                ctaText: 'text-green-600'
              }}
              className="px-12 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />
          </div>
        </div>

        {/* Additional Guarantees Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {additionalGuarantees.map((guarantee, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              
              {/* Guarantee Icon */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.guarantee_icon || '✅'}
                    onEdit={(value) => handleContentUpdate('guarantee_icon', value)}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    iconSize="md"
                    className="text-2xl text-blue-600"
                    sectionId={sectionId}
                    elementKey="guarantee_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={guarantee.title || ''}
                  onEdit={(value) => {
                    const updatedGuarantees = blockContent.additional_guarantees.split('|');
                    updatedGuarantees[index * 2] = value;
                    handleContentUpdate('additional_guarantees', updatedGuarantees.join('|'));
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...h3Style}}
                  className="text-gray-900"
                  placeholder="Enter guarantee title"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`additional_guarantee_${index}_title`}
                />
              </div>

              {/* Guarantee Description */}
              <EditableAdaptiveText
                mode={mode}
                value={guarantee.description || ''}
                onEdit={(value) => {
                  const updatedGuarantees = blockContent.additional_guarantees.split('|');
                  updatedGuarantees[index * 2 + 1] = value;
                  handleContentUpdate('additional_guarantees', updatedGuarantees.join('|'));
                }}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                style={{...bodyStyle}}
                className="text-gray-700 leading-relaxed"
                placeholder="Enter guarantee description"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key={`additional_guarantee_${index}_desc`}
              />
            </div>
          ))}
        </div>

        {/* Risk Reversal Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
          <div className="max-w-4xl mx-auto">
            
            {/* Risk Reversal Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <EditableAdaptiveText
              mode={mode}
              value={blockContent.risk_section_title || ''}
              onEdit={(value) => handleContentUpdate('risk_section_title', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...h2Style}}
              className="text-gray-900 mb-4"
              placeholder="Enter risk section title"
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="risk_section_title"
            />

            {(blockContent.risk_reversal_text || mode !== 'preview') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.risk_reversal_text || ''}
                onEdit={(value) => handleContentUpdate('risk_reversal_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                style={{...bodyLgStyle}} className="text-gray-700 leading-relaxed"
                placeholder="Add text about where the real risk lies..."
                sectionId={sectionId}
                elementKey="risk_reversal_text"
                sectionBackground={sectionBackground}
              />
            )}

            {/* Trust Badges */}
            <div className="flex items-center justify-center space-x-8 mt-8 flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_1 || ''}
                  onEdit={(value) => handleContentUpdate('trust_badge_1', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.875rem'}}
                  className=""
                  placeholder="Trust badge 1"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="trust_badge_1"
                />
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_2 || ''}
                  onEdit={(value) => handleContentUpdate('trust_badge_2', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.875rem'}}
                  className=""
                  placeholder="Trust badge 2"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="trust_badge_2"
                />
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.trust_badge_3 || ''}
                  onEdit={(value) => handleContentUpdate('trust_badge_3', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle, fontSize: '0.875rem'}}
                  className=""
                  placeholder="Trust badge 3"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key="trust_badge_3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p style={{...bodyStyle, fontSize: '0.875rem'}} className="text-blue-800">
              <strong>Edit Additional Guarantees:</strong> Use format "[guarantee title]|[guarantee description]|[next title]|[next description]"
            </p>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'BoldGuaranteePanel',
  category: 'Objection Sections',
  description: 'Strong guarantee and risk reversal panel that removes purchase hesitation through bold commitments.',
  tags: ['objection', 'guarantee', 'risk-reversal', 'confidence', 'conversion'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'main_guarantee', label: 'Main Guarantee Title', type: 'text', required: true },
    { key: 'guarantee_details', label: 'Guarantee Details', type: 'textarea', required: true },
    { key: 'additional_guarantees', label: 'Additional Guarantees (pipe separated)', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'risk_reversal_text', label: 'Risk Reversal Text', type: 'textarea', required: false }
  ],
  
  features: [
    'Prominent main guarantee panel with gradient background',
    'Multiple additional guarantee blocks',
    'Risk reversal psychology section',
    'Trust badges and security indicators'
  ],
  
  useCases: [
    'High-ticket purchase decisions',
    'Subscription-based services with upfront commitments',
    'B2B software with implementation concerns',
    'Services requiring trust and confidence building'
  ]
};