// components/layout/ValueStackCTA.tsx
// Simplified value-stack CTA with checkmark + one-liner format (V2)

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Content interface - simplified with value_items array
interface ValueStackCTAContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  secondary_cta_text?: string;
  final_cta_headline: string;
  final_cta_description: string;
  guarantee_text?: string;
  value_items: Array<{ id: string; text: string }>;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Everything You Get With Your Account'
  },
  subheadline: {
    type: 'string' as const,
    default: 'One subscription, unlimited value'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Free Trial'
  },
  secondary_cta_text: {
    type: 'string' as const,
    default: 'Compare Plans'
  },
  final_cta_headline: {
    type: 'string' as const,
    default: 'Ready to Transform Your Workflow?'
  },
  final_cta_description: {
    type: 'string' as const,
    default: 'Join 10,000+ teams already saving time every day'
  },
  guarantee_text: {
    type: 'string' as const,
    default: '30-day money-back guarantee'
  },
  value_items: {
    type: 'array' as const,
    default: [
      { id: 'v1', text: 'Save 20+ hours per week on repetitive tasks' },
      { id: 'v2', text: 'Increase team productivity by 40%' },
      { id: 'v3', text: 'Real-time analytics and reporting' },
      { id: 'v4', text: 'Unlimited team members included' },
      { id: 'v5', text: 'Priority 24/7 customer support' },
    ]
  }
};

// Theme-aware color mappings for CTA box
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      gradientFrom: 'from-orange-600',
      gradientTo: 'to-red-700',
      ctaLightText: 'text-orange-100',
      ctaButtonText: 'text-orange-600'
    },
    cool: {
      gradientFrom: 'from-blue-600',
      gradientTo: 'to-indigo-700',
      ctaLightText: 'text-blue-100',
      ctaButtonText: 'text-blue-600'
    },
    neutral: {
      gradientFrom: 'from-gray-600',
      gradientTo: 'to-gray-800',
      ctaLightText: 'text-gray-100',
      ctaButtonText: 'text-gray-600'
    }
  }[theme];
};

export default function ValueStackCTA(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ValueStackCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography styles
  const h2Style = getTypographyStyle('h2');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Theme detection: manual override > auto-detection > neutral
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getThemeColors(uiBlockTheme);

  // Ensure value_items is always an array
  const valueItems = Array.isArray(blockContent.value_items)
    ? blockContent.value_items
    : CONTENT_SCHEMA.value_items.default;

  // Add new value item
  const handleAddItem = () => {
    const newItem = {
      id: `v${Date.now()}`,
      text: 'New value proposition'
    };
    (handleContentUpdate as any)('value_items', [...valueItems, newItem]);
  };

  // Remove value item
  const handleRemoveItem = (idToRemove: string) => {
    (handleContentUpdate as any)('value_items', valueItems.filter(item => item.id !== idToRemove));
  };

  // Update value item text
  const handleUpdateItemText = (id: string, newText: string) => {
    (handleContentUpdate as any)('value_items', valueItems.map(item =>
      item.id === id ? { ...item, text: newText } : item
    ));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ValueStackCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
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

          {blockContent.subheadline && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-3xl mx-auto"
              style={bodyLgStyle}
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Value Items - Simple checkmark list */}
        <div className="space-y-4 mb-12 max-w-3xl mx-auto">
          {valueItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-start gap-3"
            >
              {/* Green checkmark */}
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Text */}
              <EditableAdaptiveText
                mode={mode}
                value={item.text}
                onEdit={(value) => handleUpdateItemText(item.id, value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="flex-1"
                style={bodyLgStyle}
                sectionId={sectionId}
                elementKey={`value_item_${item.id}`}
                sectionBackground={sectionBackground}
                placeholder="Value proposition"
              />

              {/* Remove button - only in edit mode and if > min (3) */}
              {mode !== 'preview' && valueItems.length > 3 && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-opacity"
                  title="Remove"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add button - only in edit mode and if < max (8) */}
        {mode !== 'preview' && valueItems.length < 8 && (
          <div className="mb-12 text-center">
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Value
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className={`bg-gradient-to-r ${themeColors.gradientFrom} ${themeColors.gradientTo} rounded-2xl p-12 text-center text-white`}>
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.final_cta_headline || ''}
            onEdit={(value) => handleContentUpdate('final_cta_headline', value)}
            level="h3"
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            className="font-bold mb-4"
            style={{...h2Style, fontSize: 'clamp(1.8rem, 3vw, 2rem)'}}
            sectionId={sectionId}
            elementKey="final_cta_headline"
            sectionBackground="bg-blue-600"
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.final_cta_description || ''}
            onEdit={(value) => handleContentUpdate('final_cta_description', value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textSecondary: themeColors.ctaLightText }}
            variant="body"
            className={`${themeColors.ctaLightText} mb-8 max-w-2xl mx-auto`}
            style={bodyLgStyle}
            sectionId={sectionId}
            elementKey="final_cta_description"
            sectionBackground="bg-blue-600"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              size="large"
              sectionId={sectionId}
              elementKey="cta_text"
              onClick={createCTAClickHandler(sectionId, "cta_text")}
            />

            {/* Secondary CTA */}
            {blockContent.secondary_cta_text && blockContent.secondary_cta_text.trim() !== '' && (
              <CTAButton
                text={blockContent.secondary_cta_text}
                colorTokens={colorTokens}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                variant="secondary"
                size="large"
                sectionId={sectionId}
                elementKey="secondary_cta_text"
                onClick={createCTAClickHandler(sectionId, "secondary_cta_text")}
              />
            )}

            {blockContent.guarantee_text && (
              <div className={`flex items-center space-x-2 ${themeColors.ctaLightText}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_text || ''}
                  onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                  backgroundType="primary"
                  colorTokens={{ ...colorTokens, textSecondary: themeColors.ctaLightText }}
                  variant="body"
                  className="text-base font-medium"
                  sectionId={sectionId}
                  elementKey="guarantee_text"
                  sectionBackground="bg-blue-600"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

// Export metadata
export const componentMeta = {
  name: 'ValueStackCTA',
  category: 'CTA Sections',
  description: 'Value-reinforcement CTA with checkmark list',
  tags: ['cta', 'value-stack', 'conversion'],
  defaultBackgroundType: 'neutral' as const,
};
