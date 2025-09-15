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
  key_guarantees: string;
  cta_text: string;
  trust_indicators: string;
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
  key_guarantees: {
    type: 'string' as const,
    default: 'Setup Support|We handle the complete setup|Results Promise|See improvement in 30 days|Price Lock|Your price never increases'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Risk-Free Today'
  },
  trust_indicators: {
    type: 'string' as const,
    default: 'SSL Secured • 100% Protected • Instant Access'
  }
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

  // Parse key guarantees from pipe-separated string
  const keyGuarantees = blockContent.key_guarantees
    ? blockContent.key_guarantees.split('|').reduce((guarantees, item, index) => {
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
      <div className="max-w-4xl mx-auto">

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

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              style={{...bodyLgStyle}}
              className="max-w-2xl mx-auto"
              placeholder="Add a subheadline that builds confidence..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Main Guarantee Panel - Simplified */}
        <div className="bg-green-500 rounded-2xl p-10 text-center text-white shadow-lg mb-10">
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
            style={{...h1Style, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)'}}
            className="mb-4 font-bold"
            placeholder="Enter main guarantee"
            sectionBackground="gradient"
            data-section-id={sectionId}
            data-element-key="main_guarantee"
          />

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
            style={{...bodyLgStyle}}
            className="leading-relaxed max-w-2xl mx-auto mb-8"
            placeholder="Enter guarantee details"
            sectionBackground="gradient"
            data-section-id={sectionId}
            data-element-key="guarantee_details"
          />

          <CTAButton
            text={blockContent.cta_text}
            colorTokens={{
              ...colorTokens,
              ctaBg: 'bg-white',
              ctaHover: 'hover:bg-gray-100',
              ctaText: 'text-green-600'
            }}
            className="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            variant="primary"
            sectionId={sectionId}
            elementKey="cta_text"
          />
        </div>

        {/* Key Guarantees - Simplified Grid */}
        {keyGuarantees.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {keyGuarantees.slice(0, 3).map((guarantee, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={guarantee.title || ''}
                  onEdit={(value) => {
                    const updatedGuarantees = blockContent.key_guarantees.split('|');
                    updatedGuarantees[index * 2] = value;
                    handleContentUpdate('key_guarantees', updatedGuarantees.join('|'));
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...h3Style}}
                  className="mb-2 font-semibold"
                  placeholder="Enter guarantee title"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`key_guarantee_${index}_title`}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={guarantee.description || ''}
                  onEdit={(value) => {
                    const updatedGuarantees = blockContent.key_guarantees.split('|');
                    updatedGuarantees[index * 2 + 1] = value;
                    handleContentUpdate('key_guarantees', updatedGuarantees.join('|'));
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  style={{...bodyStyle}}
                  className="text-sm leading-relaxed"
                  placeholder="Enter guarantee description"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`key_guarantee_${index}_desc`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Trust Indicators - Single Line */}
        <div className="text-center">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.trust_indicators || ''}
            onEdit={(value) => handleContentUpdate('trust_indicators', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            style={{...bodyStyle, fontSize: '0.875rem'}}
            className="text-gray-600"
            placeholder="Enter trust indicators (e.g., SSL Secured • Protected • Instant Access)"
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key="trust_indicators"
          />
        </div>

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p style={{...bodyStyle, fontSize: '0.875rem'}} className="text-blue-800">
              <strong>Edit Key Guarantees:</strong> Use format "[title]|[description]|[title]|[description]" (max 3)
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
  description: 'Clean, focused guarantee panel that builds confidence and removes purchase hesitation.',
  tags: ['objection', 'guarantee', 'confidence', 'conversion', 'simplified'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'low',
  estimatedBuildTime: '15 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'main_guarantee', label: 'Main Guarantee Title', type: 'text', required: true },
    { key: 'guarantee_details', label: 'Guarantee Details', type: 'textarea', required: true },
    { key: 'key_guarantees', label: 'Key Guarantees (pipe separated, max 3)', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_indicators', label: 'Trust Indicators', type: 'text', required: false }
  ],

  features: [
    'Clean main guarantee panel with solid green background',
    'Up to 3 key guarantee points with checkmarks',
    'Single trust indicator line',
    'Simplified visual hierarchy for better conversion'
  ],

  useCases: [
    'Any service or product needing trust building',
    'SaaS subscription sign-ups',
    'High-ticket purchase decisions',
    'B2B software with implementation concerns'
  ]
};