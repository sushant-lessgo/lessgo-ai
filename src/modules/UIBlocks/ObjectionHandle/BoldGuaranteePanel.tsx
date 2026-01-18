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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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
  // Individual guarantee fields (up to 3 guarantees)
  guarantee_title_1: string;
  guarantee_description_1: string;
  guarantee_title_2: string;
  guarantee_description_2: string;
  guarantee_title_3: string;
  guarantee_description_3: string;
  cta_text: string;
  trust_indicators: string;
  // Legacy field for backward compatibility
  key_guarantees?: string;
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
  // Individual guarantee fields
  guarantee_title_1: { type: 'string' as const, default: 'Setup Support' },
  guarantee_description_1: { type: 'string' as const, default: 'We handle the complete setup for you' },
  guarantee_title_2: { type: 'string' as const, default: 'Results Promise' },
  guarantee_description_2: { type: 'string' as const, default: 'See improvement in 30 days or get your money back' },
  guarantee_title_3: { type: 'string' as const, default: 'Price Lock' },
  guarantee_description_3: { type: 'string' as const, default: 'Your price never increases - locked in forever' },
  // Legacy field for backward compatibility
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

// Parse guarantee data from both individual and legacy formats
const parseGuaranteeData = (content: BoldGuaranteePanelContent): GuaranteeItem[] => {
  const guarantees: GuaranteeItem[] = [];

  // Check for individual fields first (preferred format)
  const individualGuarantees = [
    { title: content.guarantee_title_1, description: content.guarantee_description_1 },
    { title: content.guarantee_title_2, description: content.guarantee_description_2 },
    { title: content.guarantee_title_3, description: content.guarantee_description_3 }
  ];

  // Process individual fields
  individualGuarantees.forEach((guarantee, index) => {
    if (guarantee.title && guarantee.title.trim() && guarantee.description && guarantee.description.trim()) {
      guarantees.push({
        id: `guarantee-${index}`,
        title: guarantee.title.trim(),
        description: guarantee.description.trim()
      });
    }
  });

  // Fallback to legacy pipe-separated format if no individual fields
  if (guarantees.length === 0 && content.key_guarantees) {
    const parts = content.key_guarantees.split('|').map(t => t.trim()).filter(t => t);
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i]) {
        guarantees.push({
          id: `guarantee-${i / 2}`,
          title: parts[i],
          description: parts[i + 1] || 'Description not provided.'
        });
      }
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
  guaranteeColors,
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
  guaranteeColors: any;
  canRemove?: boolean;
}) => {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h3Style = getTypographyStyle('h3');
  const bodyStyle = getTypographyStyle('body');

  return (
    <div className={`group/guarantee-card-${index} text-center p-6 relative`}>
      <div className={`w-12 h-12 ${guaranteeColors.checkmarkBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
        <span className={`text-2xl ${guaranteeColors.checkmarkIcon}`}>✓</span>
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

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getGuaranteeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        mainPanelBg: 'bg-orange-500',
        mainPanelText: 'text-white',
        mainPanelMuted: 'text-orange-50',
        checkmarkBg: 'bg-orange-100',
        checkmarkIcon: 'text-orange-600',
        ctaBg: 'bg-white',
        ctaText: 'text-orange-600',
        ctaHover: 'hover:bg-gray-100',
        addButtonBg: 'bg-orange-50 hover:bg-orange-100',
        addButtonBorder: 'border-orange-200 hover:border-orange-300',
        addButtonIcon: 'text-orange-600',
        addButtonText: 'text-orange-700'
      },
      cool: {
        mainPanelBg: 'bg-blue-500',
        mainPanelText: 'text-white',
        mainPanelMuted: 'text-blue-50',
        checkmarkBg: 'bg-blue-100',
        checkmarkIcon: 'text-blue-600',
        ctaBg: 'bg-white',
        ctaText: 'text-blue-600',
        ctaHover: 'hover:bg-gray-100',
        addButtonBg: 'bg-blue-50 hover:bg-blue-100',
        addButtonBorder: 'border-blue-200 hover:border-blue-300',
        addButtonIcon: 'text-blue-600',
        addButtonText: 'text-blue-700'
      },
      neutral: {
        mainPanelBg: 'bg-gray-700',
        mainPanelText: 'text-white',
        mainPanelMuted: 'text-gray-50',
        checkmarkBg: 'bg-gray-100',
        checkmarkIcon: 'text-gray-600',
        ctaBg: 'bg-white',
        ctaText: 'text-gray-700',
        ctaHover: 'hover:bg-gray-100',
        addButtonBg: 'bg-gray-50 hover:bg-gray-100',
        addButtonBorder: 'border-gray-200 hover:border-gray-300',
        addButtonIcon: 'text-gray-600',
        addButtonText: 'text-gray-700'
      }
    }[theme];
  };

  const colors = getGuaranteeColors(theme);

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const h1Style = getTypographyStyle('h1');
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse guarantee data
  const guaranteeItems = parseGuaranteeData(blockContent);

  // Handle individual guarantee editing
  const handleTitleEdit = (index: number, value: string) => {
    const fieldName = `guarantee_title_${index + 1}` as keyof BoldGuaranteePanelContent;
    handleContentUpdate(fieldName, value);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const fieldName = `guarantee_description_${index + 1}` as keyof BoldGuaranteePanelContent;
    handleContentUpdate(fieldName, value);
  };

  // Helper function to get next available guarantee slot
  const getNextAvailableGuaranteeSlot = (content: BoldGuaranteePanelContent): number => {
    const titles = [
      content.guarantee_title_1,
      content.guarantee_title_2,
      content.guarantee_title_3
    ];

    for (let i = 0; i < titles.length; i++) {
      if (!titles[i] || titles[i].trim() === '') {
        return i + 1;
      }
    }

    return -1; // No slots available
  };

  // Handle adding a new guarantee
  const handleAddGuarantee = () => {
    const nextSlot = getNextAvailableGuaranteeSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`guarantee_title_${nextSlot}` as keyof BoldGuaranteePanelContent, 'New Guarantee');
      handleContentUpdate(`guarantee_description_${nextSlot}` as keyof BoldGuaranteePanelContent, 'Describe this guarantee benefit');
    }
  };

  // Handle removing a guarantee
  const handleRemoveGuarantee = (indexToRemove: number) => {
    const fieldNum = indexToRemove + 1;
    handleContentUpdate(`guarantee_title_${fieldNum}` as keyof BoldGuaranteePanelContent, '');
    handleContentUpdate(`guarantee_description_${fieldNum}` as keyof BoldGuaranteePanelContent, '');
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
        <div className={`${colors.mainPanelBg} rounded-2xl p-10 text-center ${colors.mainPanelText} shadow-lg mb-10`}>
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.main_guarantee || ''}
            onEdit={(value) => handleContentUpdate('main_guarantee', value)}
            backgroundType="custom"
            colorTokens={{
              ...colorTokens,
              primaryText: colors.mainPanelText,
              mutedText: colors.mainPanelMuted
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
              primaryText: colors.mainPanelMuted,
              mutedText: colors.mainPanelMuted
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
              ctaBg: colors.ctaBg,
              ctaHover: colors.ctaHover,
              ctaText: colors.ctaText
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
                guaranteeColors={colors}
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
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${colors.addButtonBg} border-2 ${colors.addButtonBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${colors.addButtonIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${colors.addButtonText} font-medium`}>Add Guarantee</span>
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
    { key: 'guarantee_title_1', label: 'Guarantee 1 Title', type: 'text', required: false },
    { key: 'guarantee_description_1', label: 'Guarantee 1 Description', type: 'textarea', required: false },
    { key: 'guarantee_title_2', label: 'Guarantee 2 Title', type: 'text', required: false },
    { key: 'guarantee_description_2', label: 'Guarantee 2 Description', type: 'textarea', required: false },
    { key: 'guarantee_title_3', label: 'Guarantee 3 Title', type: 'text', required: false },
    { key: 'guarantee_description_3', label: 'Guarantee 3 Description', type: 'textarea', required: false },
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