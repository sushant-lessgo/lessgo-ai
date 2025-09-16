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

// Guarantee item structure
interface GuaranteeItem {
  title: string;
  description: string;
  id: string;
}

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

// Parse guarantee data from pipe-separated strings
const parseGuaranteeData = (keyGuarantees: string): GuaranteeItem[] => {
  if (!keyGuarantees) return [];

  const parts = keyGuarantees.split('|').map(t => t.trim()).filter(t => t);
  const guarantees: GuaranteeItem[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) {
      guarantees.push({
        id: `guarantee-${i / 2}`,
        title: parts[i],
        description: parts[i + 1] || 'Description not provided.'
      });
    }
  }

  return guarantees;
};

// Helper function to add a new guarantee
const addGuarantee = (keyGuarantees: string): string => {
  const parts = keyGuarantees.split('|').map(t => t.trim()).filter(t => t);

  // Add new guarantee with default content
  parts.push('New Guarantee');
  parts.push('Describe this guarantee benefit.');

  return parts.join('|');
};

// Helper function to remove a guarantee
const removeGuarantee = (keyGuarantees: string, indexToRemove: number): string => {
  const parts = keyGuarantees.split('|').map(t => t.trim()).filter(t => t);

  // Remove the guarantee at the specified index (title and description)
  const startIndex = indexToRemove * 2;
  if (startIndex >= 0 && startIndex < parts.length) {
    parts.splice(startIndex, 2); // Remove both title and description
  }

  return parts.join('|');
};

// Individual Guarantee Card Component
const GuaranteeCard = ({
  guarantee,
  index,
  mode,
  sectionId,
  onTitleEdit,
  onDescriptionEdit,
  onRemoveGuarantee,
  colorTokens,
  sectionBackground,
  backgroundType,
  canRemove = true
}: {
  guarantee: GuaranteeItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveGuarantee?: (index: number) => void;
  colorTokens: any;
  sectionBackground: any;
  backgroundType?: string;
  canRemove?: boolean;
}) => {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body');

  return (
    <div className={`group/guarantee-card-${index} text-center p-6 relative`}>
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-green-600">✓</span>
      </div>

      {/* Guarantee Title */}
      <EditableAdaptiveText
        mode={mode}
        value={guarantee.title || ''}
        onEdit={(value) => onTitleEdit(index, value)}
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
        colorTokens={colorTokens}
        variant="body"
        style={{...h3Style}}
        className="mb-2 font-semibold"
        placeholder="Enter guarantee title"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key={`key_guarantee_${index}_title`}
      />

      {/* Guarantee Description */}
      <EditableAdaptiveText
        mode={mode}
        value={guarantee.description || ''}
        onEdit={(value) => onDescriptionEdit(index, value)}
        backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
        colorTokens={colorTokens}
        variant="body"
        style={{...bodyStyle}}
        className="text-sm leading-relaxed"
        placeholder="Enter guarantee description"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key={`key_guarantee_${index}_desc`}
      />

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemoveGuarantee && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveGuarantee(index);
          }}
          className={`opacity-0 group-hover/guarantee-card-${index}:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-700 transition-opacity duration-200`}
          title="Remove this guarantee"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
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
    backgroundType,
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

  // Parse guarantee data
  const guaranteeItems = parseGuaranteeData(blockContent.key_guarantees);

  // Handle individual editing
  const handleTitleEdit = (index: number, value: string) => {
    const parts = blockContent.key_guarantees.split('|').map(t => t.trim()).filter(t => t);
    const startIndex = index * 2;
    if (startIndex < parts.length) {
      parts[startIndex] = value;
      handleContentUpdate('key_guarantees', parts.join('|'));
    }
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const parts = blockContent.key_guarantees.split('|').map(t => t.trim()).filter(t => t);
    const startIndex = index * 2 + 1;
    if (startIndex < parts.length) {
      parts[startIndex] = value;
    } else {
      // Add description if it doesn't exist
      parts.push(value);
    }
    handleContentUpdate('key_guarantees', parts.join('|'));
  };

  // Handle adding a new guarantee
  const handleAddGuarantee = () => {
    const newKeyGuarantees = addGuarantee(blockContent.key_guarantees);
    handleContentUpdate('key_guarantees', newKeyGuarantees);
  };

  // Handle removing a guarantee
  const handleRemoveGuarantee = (indexToRemove: number) => {
    const newKeyGuarantees = removeGuarantee(blockContent.key_guarantees, indexToRemove);
    handleContentUpdate('key_guarantees', newKeyGuarantees);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="BoldGuaranteePanel"
      backgroundType={(props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
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
            backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
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
              backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
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

        {/* Key Guarantees Cards */}
        {guaranteeItems.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {guaranteeItems.slice(0, 3).map((guarantee, index) => (
              <GuaranteeCard
                key={guarantee.id}
                guarantee={guarantee}
                index={index}
                mode={mode}
                sectionId={sectionId}
                onTitleEdit={handleTitleEdit}
                onDescriptionEdit={handleDescriptionEdit}
                onRemoveGuarantee={handleRemoveGuarantee}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                backgroundType={backgroundType}
                canRemove={guaranteeItems.length > 1}
              />
            ))}
          </div>
        )}

        {/* Add Guarantee Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && guaranteeItems.length < 3 && (
          <div className="mb-8 text-center">
            <button
              onClick={handleAddGuarantee}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-green-700 font-medium">Add Guarantee</span>
            </button>
          </div>
        )}

        {/* Trust Indicators - Single Line */}
        <div className="text-center">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.trust_indicators || ''}
            onEdit={(value) => handleContentUpdate('trust_indicators', value)}
            backgroundType={(backgroundType === 'custom' ? 'secondary' : (backgroundType || 'primary')) as 'custom' | 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme'}
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