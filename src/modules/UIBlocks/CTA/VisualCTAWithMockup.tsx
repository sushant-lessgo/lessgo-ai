// components/layout/VisualCTAWithMockup.tsx
// Production-ready visual CTA with product mockup using abstraction system
// V2: Clean array format for trust_items

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText,
  EditableBadge
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2: Trust item type
interface TrustItem {
  id: string;
  text: string;
}

// Content interface for type safety (V2)
interface VisualCTAWithMockupContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  secondary_cta?: string;
  urgency_text?: string;
  mockup_image?: string;
  trust_items?: TrustItem[];
}

// V2 Content schema - uses clean arrays
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'See It in Action'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Experience the power of our platform with a live demo. No installation required.'
  },
  cta_text: {
    type: 'string' as const,
    default: 'Start Free Trial'
  },
  secondary_cta: {
    type: 'string' as const,
    default: 'Watch Demo'
  },
  urgency_text: {
    type: 'string' as const,
    default: ''
  },
  mockup_image: {
    type: 'string' as const,
    default: ''
  },
  // V2: Array format - empty by default
  trust_items: {
    type: 'array' as const,
    default: []
  }
};

// Product Mockup Component
const ProductMockup = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <div className="relative cursor-pointer" onClick={onClick}>
    {/* Main device mockup */}
    <div className="relative bg-gray-900 rounded-2xl shadow-2xl p-2 mx-auto max-w-lg">
      {/* Screen */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 mx-4">
            <div className="text-xs text-gray-400">app.yourproduct.com</div>
          </div>
        </div>
        
        {/* App content */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <div className="text-sm font-semibold text-gray-900">Dashboard</div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">2.4k</div>
              <div className="text-xs text-gray-500">Users</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">$45k</div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">98%</div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
          </div>
          
          {/* Chart area */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-900">Growth</div>
              <div className="w-12 h-6 bg-green-100 rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-end justify-between h-16">
              {[40, 60, 45, 80, 65, 90, 85].map((height, i) => (
                <div 
                  key={i} 
                  className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-6"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Floating elements */}
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
    
    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center animate-pulse">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>
));
ProductMockup.displayName = 'ProductMockup';

export default function VisualCTAWithMockup(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<VisualCTAWithMockupContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // V2: Theme detection with priority
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based colors for urgency badge
  const themeColors = React.useMemo(() => ({
    urgencyBadge: {
      warm: 'bg-orange-100 text-orange-700 border border-orange-200',
      cool: 'bg-blue-100 text-blue-700 border border-blue-200',
      neutral: 'bg-gray-100 text-gray-700 border border-gray-200'
    }[uiBlockTheme]
  }), [uiBlockTheme]);

  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary');

  // V2: Direct array access
  const trustItems = blockContent.trust_items || [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VisualCTAWithMockup"
      backgroundType={safeBackgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - CTA Content */}
          <div className="space-y-8">
            {/* Urgency Badge */}
            {(blockContent.urgency_text || mode === 'edit') && (
              <div className="mb-4">
                <EditableBadge
                  mode={mode}
                  value={blockContent.urgency_text || ''}
                  onEdit={(value) => handleContentUpdate('urgency_text', value)}
                  colorTokens={{ accent: themeColors.urgencyBadge }}
                  placeholder="🔥 Limited Time: 50% Off"
                  className="animate-pulse"
                  sectionId={sectionId}
                  elementKey="urgency_text"
                />
              </div>
            )}

            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              className="mb-6 text-4xl"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="mb-8 text-base"
                style={bodyLgStyle}
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
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

              {/* Secondary CTA - V2: no ___REMOVED___ check */}
              {blockContent.secondary_cta && blockContent.secondary_cta.trim() !== '' && (
                <CTAButton
                  text={blockContent.secondary_cta || 'Watch Demo'}
                  colorTokens={colorTokens}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  variant="outline"
                  size="large"
                  sectionId={sectionId}
                  elementKey="secondary_cta"
                  onClick={createCTAClickHandler(sectionId, "secondary_cta")}
                />
              )}
            </div>

            {/* Trust indicators - V2: array format */}
            <div>
              <EditableTrustIndicators
                mode={mode}
                trustItems={trustItems.map(item => item.text)}
                onTrustItemChange={(index, value) => {
                  const updated = trustItems.map((item, i) =>
                    i === index ? { ...item, text: value } : item
                  );
                  (handleContentUpdate as any)('trust_items', updated);
                }}
                onAddTrustItem={() => {
                  if (trustItems.length < 5) {
                    const newItem: TrustItem = {
                      id: `t${Date.now()}`,
                      text: 'New trust item'
                    };
                    (handleContentUpdate as any)('trust_items', [...trustItems, newItem]);
                  }
                }}
                onRemoveTrustItem={(index) => {
                  const updated = trustItems.filter((_, i) => i !== index);
                  (handleContentUpdate as any)('trust_items', updated);
                }}
                colorTokens={colorTokens}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                backgroundType={safeBackgroundType}
                iconColor="text-green-500"
                colorClass={dynamicTextColors?.muted || colorTokens.textMuted}
              />
            </div>
          </div>

          {/* Right Column - Product Mockup */}
          <div className="relative">
            {blockContent.mockup_image && blockContent.mockup_image !== '' ? (
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={blockContent.mockup_image}
                  alt="Product Demo"
                  className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl shadow-2xl cursor-pointer"
                  data-image-id={`${sectionId}-mockup_image`}
                  onMouseUp={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const imageId = `${sectionId}-mockup_image`;
                      const position = {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      };
                      handleImageToolbar(imageId, position);
                    }
                  }}
                  onClick={(e) => {
                    if (mode !== 'preview') {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            ) : (
              <ProductMockup 
                onClick={(e) => {
                  if (mode !== 'preview') {
                    e.stopPropagation();
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const imageId = `${sectionId}-mockup_image`;
                    const position = {
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10
                    };
                    handleImageToolbar(imageId, position);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'VisualCTAWithMockup',
  category: 'CTA Sections',
  description: 'Visual CTA with product mockup for demonstrating value',
  tags: ['cta', 'mockup', 'visual', 'demo', 'adaptive-colors', 'v2'],
  defaultBackgroundType: 'secondary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',

  features: [
    'Automatic text color adaptation based on background type',
    'Interactive product mockup',
    'Primary and secondary CTA buttons',
    'Built-in animated demo interface',
    'Trust indicators (V2 array format)',
    'Urgency badge for conversions',
    'UIBlockTheme support'
  ],

  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'Primary Button Text', type: 'text', required: true },
    { key: 'secondary_cta', label: 'Secondary Button Text', type: 'text', required: false },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'mockup_image', label: 'Product Mockup Image', type: 'image', required: false },
    { key: 'trust_items', label: 'Trust Items (array)', type: 'array', required: false }
  ],

  useCases: [
    'Product demo sections',
    'Software landing pages',
    'App showcase CTAs',
    'Interactive trial invitations'
  ]
};