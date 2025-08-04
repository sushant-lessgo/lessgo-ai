// components/layout/VisualCTAWithMockup.tsx
// Production-ready visual CTA with product mockup using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { CTAButton } from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';

// Content interface for type safety
interface VisualCTAWithMockupContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  secondary_cta?: string;
  mockup_image?: string;
}

// Content schema - defines structure and defaults
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
  mockup_image: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Product Mockup Component
const ProductMockup = React.memo(() => (
  <div className="relative">
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

  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;

  // Add safe background type to prevent type errors
  const safeBackgroundType = props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary');

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
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h2"
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              textStyle={getTextStyle('h1')}
              className="mb-6"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {blockContent.subheadline && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="text-lg mb-8"
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
                textStyle={getTextStyle('body-lg')}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                variant="primary"
                size="large"
                sectionId={sectionId}
                elementKey="cta_text"
                onClick={createCTAClickHandler(sectionId)}
              />
              
              {blockContent.secondary_cta && (
                <CTAButton
                  text={blockContent.secondary_cta}
                  colorTokens={colorTokens}
                  textStyle={getTextStyle('body-lg')}
                  className="border-2 hover:shadow-lg transition-all duration-200"
                  variant="secondary"
                  size="large"
                  sectionId={sectionId}
                  elementKey="secondary_cta"
                  onClick={createCTAClickHandler(sectionId)}
                />
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                  Free 14-day trial
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
                  No credit card required
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Product Mockup */}
          <div className="relative">
            {blockContent.mockup_image && blockContent.mockup_image !== '' ? (
              <div className="relative">
                <img
                  src={blockContent.mockup_image}
                  alt="Product Demo"
                  className="w-full h-auto rounded-2xl shadow-2xl cursor-pointer"
                  data-image-id={`${sectionId}-mockup-image`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      showImageToolbar(`${sectionId}-mockup-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <ProductMockup />
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
  tags: ['cta', 'mockup', 'visual', 'demo', 'adaptive-colors'],
  defaultBackgroundType: 'secondary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  features: [
    'Automatic text color adaptation based on background type',
    'Interactive product mockup',
    'Primary and secondary CTA buttons',
    'Built-in animated demo interface',
    'Trust indicators'
  ],
  
  contentFields: [
    { key: 'headline', label: 'CTA Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'Primary Button Text', type: 'text', required: true },
    { key: 'secondary_cta', label: 'Secondary Button Text', type: 'text', required: false },
    { key: 'mockup_image', label: 'Product Mockup Image', type: 'image', required: false }
  ],
  
  useCases: [
    'Product demo sections',
    'Software landing pages',
    'App showcase CTAs',
    'Interactive trial invitations'
  ]
};