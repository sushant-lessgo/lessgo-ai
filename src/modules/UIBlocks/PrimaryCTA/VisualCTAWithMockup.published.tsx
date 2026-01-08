/**
 * VisualCTAWithMockup - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';

// Product Mockup Component (server-safe, no hooks)
const ProductMockup = () => (
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
              {[40, 60, 45, 80, 65, 90, 85].map((height: number, i: number) => (
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
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center">
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>

    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>
);

export default function VisualCTAWithMockupPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'See It in Action';
  const subheadline = props.subheadline || 'Experience the power of our platform with a live demo. No installation required.';
  const cta_text = props.cta_text || 'Start Free Trial';
  const secondary_cta = props.secondary_cta || '';
  const mockup_image = props.mockup_image || '';

  // Extract trust items
  const trust_item_1 = props.trust_item_1 || '';
  const trust_item_2 = props.trust_item_2 || '';
  const trust_item_3 = props.trust_item_3 || '';
  const trust_item_4 = props.trust_item_4 || '';
  const trust_item_5 = props.trust_item_5 || '';

  // Parse trust items
  const trustItems = [trust_item_1, trust_item_2, trust_item_3, trust_item_4, trust_item_5]
    .filter((item: string) => item && item.trim() !== '' && item !== '___REMOVED___');

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'secondary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column - CTA Content */}
          <div className="space-y-8">
            <HeadlinePublished
              value={headline}
              level="h2"
              style={{
                color: textColors.heading,
                ...headlineTypography,
                fontSize: '2.25rem',
                marginBottom: '1.5rem'
              }}
            />

            {subheadline && (
              <TextPublished
                value={subheadline}
                style={{
                  color: textColors.body,
                  ...bodyLgTypography,
                  marginBottom: '2rem'
                }}
              />
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <CTAButtonPublished
                text={cta_text}
                backgroundColor={theme.colors?.accentColor || '#3b82f6'}
                textColor="#ffffff"
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
              />

              {/* Secondary CTA */}
              {secondary_cta && secondary_cta !== '___REMOVED___' && (
                <CTAButtonPublished
                  text={secondary_cta}
                  backgroundColor="transparent"
                  textColor={theme.colors?.accentColor || '#3b82f6'}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg border-2"
                />
              )}
            </div>

            {/* Trust indicators */}
            {trustItems.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {trustItems.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckmarkIconPublished color="#10b981" size={16} />
                    <span
                      style={{
                        color: textColors.muted,
                        fontSize: '0.875rem'
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Mockup */}
          <div className="relative">
            {mockup_image && mockup_image !== '' ? (
              <img
                src={mockup_image}
                alt="Product Demo"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            ) : (
              <ProductMockup />
            )}
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
