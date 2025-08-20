// components/layout/MockupWithCTA.tsx
// Production-ready mockup with CTA section using abstraction system

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
interface MockupWithCTAContent {
  headline: string;
  subheadline?: string;
  cta_text: string;
  urgency_text?: string;
  guarantee_text?: string;
  browser_url?: string;
  device_app_icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Ready to Transform Your Business?' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how our platform can streamline your operations and boost productivity in real-time.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Free Trial' 
  },
  urgency_text: { 
    type: 'string' as const, 
    default: '' 
  },
  guarantee_text: { 
    type: 'string' as const, 
    default: '30-day money back guarantee' 
  },
  browser_url: { 
    type: 'string' as const, 
    default: 'yourapp.com' 
  },
  device_app_icon: { 
    type: 'string' as const, 
    default: '📊' 
  }
};

// Simple Device Mockup Component
const DeviceMockup = React.memo(({ type = 'laptop', browserUrl = 'yourapp.com' }: { type?: 'laptop' | 'phone'; browserUrl?: string }) => {
  if (type === 'phone') {
    return (
      <div className="relative mx-auto w-64 h-[520px] transform hover:scale-105 transition-transform duration-300">
        {/* Phone Frame */}
        <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>
            
            {/* Screen Content */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.device_app_icon || '📊'}
                    onEdit={(value) => handleContentUpdate('device_app_icon', value)}
                    className="text-white text-2xl"
                    fallback={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-24 mx-auto"></div>
                  <div className="h-2 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-96 h-64 transform hover:scale-105 transition-transform duration-300">
      {/* Laptop Frame */}
      <div className="absolute inset-0 bg-gray-800 rounded-t-xl shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-black rounded-t-xl p-3">
          <div className="w-full h-full bg-white rounded-md overflow-hidden">
            {/* Browser Chrome */}
            <div className="h-8 bg-gray-100 border-b flex items-center px-3 space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 mx-4 h-5 bg-white rounded border text-xs flex items-center px-2 text-gray-400">
                {browserUrl}
              </div>
            </div>
            
            {/* Screen Content */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.device_app_icon || '📊'}
                    onEdit={(value) => handleContentUpdate('device_app_icon', value)}
                    className="text-white text-3xl"
                    fallback={<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-40 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Laptop Base */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-80 h-4 bg-gray-700 rounded-b-xl shadow-lg"></div>
    </div>
  );
});
DeviceMockup.displayName = 'DeviceMockup';

export default function MockupWithCTA(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
  // Use the abstraction hook for all common functionality
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
  } = useLayoutComponent<MockupWithCTAContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Create typography styles
  const bodyStyle = getTypographyStyle('body');
  const labelStyle = getTypographyStyle('label');
  
  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MockupWithCTA"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Mockup Side */}
          <div className="order-1 lg:order-1 flex justify-center lg:justify-start">
            <DeviceMockup type="laptop" browserUrl={blockContent.browser_url || 'yourapp.com'} />
          </div>

          {/* CTA Content Side */}
          <div className="order-2 lg:order-2 text-center lg:text-left">
            
            {/* Headline */}
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h1"
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              className="mb-6"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {/* Subheadline */}
            {(blockContent.subheadline || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="mb-8"
                placeholder="Add optional subheadline to provide more context..."
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            {/* Primary CTA Button */}
            <div className="mb-6">
              <CTAButton
                text={blockContent.cta_text}
                colorTokens={colorTokens}
                size="large"
                className="shadow-lg hover:shadow-xl"
                sectionId={sectionId}
                elementKey="cta_text"
              />
            </div>

            {/* Urgency and Guarantee Text */}
            <div className="space-y-3">
              {/* Urgency Text */}
              {(blockContent.urgency_text || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.urgency_text || ''}
                  onEdit={(value) => handleContentUpdate('urgency_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="flex items-center justify-center lg:justify-start"
                  style={labelStyle}
                  placeholder="Add urgency text (e.g., Limited time offer...)"
                  sectionId={sectionId}
                  elementKey="urgency_text"
                  sectionBackground={sectionBackground}
                />
              )}

              {/* Guarantee Text */}
              {(blockContent.guarantee_text || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.guarantee_text || ''}
                  onEdit={(value) => handleContentUpdate('guarantee_text', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="flex items-center justify-center lg:justify-start"
                  style={labelStyle}
                  placeholder="Add guarantee text (e.g., 30-day money back guarantee)"
                  sectionId={sectionId}
                  elementKey="guarantee_text"
                  sectionBackground={sectionBackground}
                />
              )}

              {/* Browser URL - Only show in edit mode */}
              {mode === 'edit' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Browser URL (shown in mockup)</label>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.browser_url || ''}
                    onEdit={(value) => handleContentUpdate('browser_url', value)}
                    backgroundType={safeBackgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm"
                    placeholder="yourapp.com"
                    sectionId={sectionId}
                    elementKey="browser_url"
                    sectionBackground={sectionBackground}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'MockupWithCTA',
  category: 'CTA Sections',
  description: 'Device mockup with focused CTA content and adaptive text colors for product demonstrations',
  tags: ['mockup', 'cta', 'device', 'conversion', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'urgency_text', label: 'Urgency Text', type: 'text', required: false },
    { key: 'guarantee_text', label: 'Guarantee Text', type: 'text', required: false },
    { key: 'browser_url', label: 'Browser URL (mockup)', type: 'text', required: false },
    { key: 'device_app_icon', label: 'Device App Icon', type: 'text', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Professional device mockup (laptop and phone options)',
    'Focused CTA design for higher conversions',
    'Responsive layout adapting to screen sizes',
    'Urgency and guarantee messaging support'
  ],
  
  // Usage examples
  useCases: [
    'Product demo section on dark backgrounds',
    'App showcase with brand color backgrounds',
    'Software preview with adaptive styling',
    'Platform demonstration with high contrast'
  ]
};