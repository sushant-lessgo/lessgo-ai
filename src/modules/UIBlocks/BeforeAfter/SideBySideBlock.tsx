import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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

// Content interface for type safety
interface SideBySideContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Transformation Story' 
  },
  before_label: { 
    type: 'string' as const, 
    default: 'Before' 
  },
  after_label: { 
    type: 'string' as const, 
    default: 'After' 
  },
  before_description: { 
    type: 'string' as const, 
    default: 'Describe the current state or problem your audience faces.' 
  },
  after_description: { 
    type: 'string' as const, 
    default: 'Describe the improved state or solution you provide.' 
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

export default function SideBySideBlocks(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // ✅ ENHANCED: Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens, // ✅ Now includes dynamic text colors
    dynamicTextColors, // ✅ NEW: Direct access to background-aware colors
    getTextStyle,
    sectionBackground,
    backgroundType, // ✅ NEW: Background type passed from hook
    handleContentUpdate
  } = useLayoutComponent<SideBySideContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  // ✅ ENHANCED: Get muted text color for labels and supporting text
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  // ✅ Get accent colors for visual indicators
  const accentColor = colorTokens.ctaBg || 'bg-blue-600';
  const accentHover = colorTokens.ctaHover || 'bg-blue-700';
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySideBlocks"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* ✅ ENHANCED: Main Headline with Dynamic Text Color */}
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

          {/* ✅ ENHANCED: Optional Subheadline with Dynamic Text Color */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="mb-6 max-w-3xl mx-auto"
              style={bodyLgStyle}
              placeholder="Add optional subheadline to introduce the comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Side by Side Blocks */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Before Block */}
          <div className="group">
            <div className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full`}>
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-red-500 ring-4 ring-red-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.before_label || ''}
                  onEdit={(value) => handleContentUpdate('before_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('body'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: '#ef4444' // red-500
                  }}
                  className="text-red-500"
                  sectionId={sectionId}
                  elementKey="before_label"
                  sectionBackground={sectionBackground}
                />
              </div>

              <EditableAdaptiveText
                mode={mode}
                value={blockContent.before_description || ''}
                onEdit={(value) => handleContentUpdate('before_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="leading-relaxed"
                sectionId={sectionId}
                elementKey="before_description"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>

          {/* After Block */}
          <div className="group">
            <div className={`${colorTokens.surfaceCard} rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full`}>
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 rounded-full mr-3 bg-green-500 ring-4 ring-green-100" />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.after_label || ''}
                  onEdit={(value) => handleContentUpdate('after_label', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{
                    ...getTextStyle('body'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: '#10b981' // green-500
                  }}
                  className="text-green-500"
                  sectionId={sectionId}
                  elementKey="after_label"
                  sectionBackground={sectionBackground}
                />
              </div>

              <EditableAdaptiveText
                mode={mode}
                value={blockContent.after_description || ''}
                onEdit={(value) => handleContentUpdate('after_description', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="leading-relaxed"
                sectionId={sectionId}
                elementKey="after_description"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        </div>

        {/* ✅ NEW: Optional CTA and Trust Section */}
        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {/* Optional Supporting Text */}
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your message..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {/* ✅ NEW: CTA Button and Trust Indicators */}
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

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'SideBySideBlocks',
  category: 'Comparison',
  description: 'Before/After comparison section that clearly shows transformation. Automatically adapts text colors to background.',
  tags: ['comparison', 'before-after', 'transformation', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'before_label', label: 'Before Label', type: 'text', required: true },
    { key: 'before_description', label: 'Before Description', type: 'textarea', required: true },
    { key: 'after_label', label: 'After Label', type: 'text', required: true },
    { key: 'after_description', label: 'After Description', type: 'textarea', required: true },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Visual before/after indicators with brand colors',
    'Optional CTA button using accent colors',
    'Trust indicators for social proof',
    'Hover effects for enhanced interactivity',
    'Responsive grid layout with equal height cards',
    'Full integration with design system'
  ],
  
  // Usage examples
  useCases: [
    'Product comparison showing old vs new features',
    'Service transformation highlighting improvements',
    'Process optimization showing efficiency gains',
    'Customer journey before and after using product',
    'Business metrics comparison pre/post implementation'
  ]
};