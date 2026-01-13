/**
 * ImageFirst Hero - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Layout: Image on top (full-width), content centered below
 *
 * Features:
 * - Large hero image at top with min-height constraints
 * - Content centered below in vertical flow
 * - Badge, headline, subheadline, supporting text
 * - Primary and secondary CTA buttons
 * - Trust indicators (up to 5 items)
 * - Social proof: customer avatars, star ratings
 * - Dashboard placeholder when no image provided
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { FormMarkupPublished } from '@/components/published/FormMarkupPublished';
import { InlineFormMarkupPublished } from '@/components/published/InlineFormMarkupPublished';
import { determineFormPlacement } from '@/utils/formPlacement';

// ============================================================================
// Helper Functions (server-safe, no hooks)
// ============================================================================

/**
 * Parse customer avatar data from pipe-separated names and JSON URL mapping
 */
function parseCustomerAvatarData(names: string, urls: string): Array<{ name: string; avatarUrl: string }> {
  const nameArray = names.split('|').map((n: string) => n.trim()).filter(Boolean);
  let urlMap: Record<string, string> = {};

  try {
    urlMap = JSON.parse(urls);
  } catch {
    // Invalid JSON, use empty map
  }

  return nameArray.map(name => ({
    name,
    avatarUrl: urlMap[name] || ''
  }));
}

/**
 * Render star rating SVGs (server-safe)
 * Supports filled and empty stars (no half-stars in this variant)
 */
function renderStars(rating: string) {
  const ratingNum = parseFloat(rating.match(/([\d.]+)/)?.[1] || '0');
  const fullStars = Math.floor(ratingNum);
  const emptyStars = 5 - fullStars;

  return (
    <>
      {/* Filled stars (yellow) */}
      {Array.from({ length: fullStars }, (_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}

      {/* Empty stars (gray) */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </>
  );
}

/**
 * Dashboard Placeholder - Server-safe static component
 * Shows dashboard mockup with stats cards and chart when no hero image provided
 */
function DashboardPlaceholder() {
  return (
    <div className="w-full min-h-[500px] lg:min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-900">$45.2K</div>
            <div className="text-sm text-gray-500">Revenue</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-900">1,234</div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-900">98%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-end justify-between h-32 gap-2">
            {[60, 80, 45, 90, 75, 95, 70].map((height: number, i: number) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ImageFirstPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType, publishedPageId, pageOwnerId } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Business with Smart Automation';
  const subheadline = props.subheadline || 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent automation platform.';
  const supporting_text = props.supporting_text || 'Save 20+ hours per week with automated workflows that just work.';
  const badge_text = props.badge_text || '';
  const cta_text = props.cta_text || 'Start Free Trial';
  const secondary_cta_text = props.secondary_cta_text || 'Watch Demo';
  const image_first_hero_image = props.image_first_hero_image || '/hero-placeholder.jpg';
  const customer_count = props.customer_count || '500+ happy customers';
  const rating_value = props.rating_value || '4.9/5';
  const rating_count = props.rating_count || 'from 127 reviews';
  const show_social_proof = props.show_social_proof !== false;
  const show_customer_avatars = props.show_customer_avatars !== false;
  const customer_names = props.customer_names || 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel';
  const avatar_urls = props.avatar_urls || '{}';

  // Build trust items array (filter ___REMOVED___)
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5
  ].filter((item: string) => item && item !== '___REMOVED___' && item.trim() !== '');

  // Parse customer avatar data
  const customerAvatars = parseCustomerAvatarData(customer_names, avatar_urls);

  // Get text colors based on background
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Get typography styles
  const h1Typography = getPublishedTypographyStyles('h1', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  // Accent color for badge and buttons
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  // Image validation
  const imageValue = image_first_hero_image || '';
  const isValidImagePath = imageValue.startsWith('/') ||
                          imageValue.startsWith('http://') ||
                          imageValue.startsWith('https://') ||
                          imageValue.startsWith('blob:') ||
                          imageValue.startsWith('data:');
  const imageSrc = isValidImagePath && imageValue !== '' ? imageValue : '';

  // Extract button metadata for form detection
  const sectionData = props.content?.[sectionId];
  const ctaElement = sectionData?.elements?.cta_text;
  const buttonConfig = ctaElement?.metadata?.buttonConfig;

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-12 min-h-[700px]">

          {/* 1. HERO IMAGE FIRST - Full width at top */}
          <div className="w-full">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Hero"
                className="w-full min-h-[500px] lg:min-h-[600px] object-cover rounded-2xl shadow-2xl"
              />
            ) : (
              <DashboardPlaceholder />
            )}
          </div>

          {/* 2. CONTENT BELOW - Centered */}
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            {badge_text && badge_text !== '___REMOVED___' && badge_text.trim() !== '' && (
              <div className="mb-4">
                <span
                  style={{
                    color: accentColor,
                    backgroundColor: `${accentColor}15`,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em'
                  }}
                  className="inline-block px-4 py-2 rounded-full font-medium"
                >
                  {badge_text}
                </span>
              </div>
            )}

            {/* Headline */}
            <HeadlinePublished
              value={headline}
              level="h1"
              className="text-center leading-[1.1] mb-6"
              style={{
                color: textColors.heading,
                ...h1Typography,
                textAlign: 'center'
              }}
            />

            {/* Subheadline */}
            {subheadline && subheadline !== '___REMOVED___' && (
              <TextPublished
                value={subheadline}
                element="p"
                className="leading-relaxed mb-6"
                style={{
                  color: textColors.body,
                  ...bodyLgTypography,
                  textAlign: 'center'
                }}
              />
            )}

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
              {/* Primary CTA - Form or Button */}
              {(() => {
                // Check if button is form-connected
                if (!buttonConfig || buttonConfig.type !== 'form') {
                  return (
                    <CTAButtonPublished
                      text={cta_text}
                      backgroundColor={accentColor}
                      textColor="#FFFFFF"
                      className="px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    />
                  );
                }

                // Get form from content
                const form = props.content?.forms?.[buttonConfig.formId];
                if (!form) {
                  console.warn(`Form not found: ${buttonConfig.formId}`);
                  return (
                    <CTAButtonPublished
                      text={cta_text}
                      backgroundColor={accentColor}
                      textColor="#FFFFFF"
                      className="px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    />
                  );
                }

                // Determine placement
                const placement = determineFormPlacement(
                  form,
                  buttonConfig.ctaType || 'primary',
                  'hero',
                  props.sections || []
                );

                // Render inline form (single-field)
                if (placement.placement === 'inline') {
                  return (
                    <InlineFormMarkupPublished
                      form={form}
                      publishedPageId={publishedPageId || ''}
                      pageOwnerId={pageOwnerId || ''}
                      size="large"
                      variant="primary"
                      colorTokens={{
                        bg: accentColor,
                        text: '#FFFFFF'
                      }}
                      className="w-full sm:w-auto"
                    />
                  );
                }

                // Multi-field: render button (form renders in CTA section)
                return (
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={accentColor}
                    textColor="#FFFFFF"
                    href={buttonConfig.behavior === 'scrollTo' ? '#form-section' : undefined}
                    className="px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  />
                );
              })()}

              {/* Secondary CTA */}
              {secondary_cta_text && secondary_cta_text !== '___REMOVED___' && (
                <CTAButtonPublished
                  text={secondary_cta_text}
                  backgroundColor="transparent"
                  textColor={textColors.body}
                  className="px-8 py-4 font-semibold rounded-xl border-2 hover:bg-opacity-5 transition-all"
                />
              )}

              {/* Trust Indicators */}
              {trustItems.length > 0 && (
                <div className="flex items-center space-x-4 flex-wrap justify-center mt-2 sm:mt-0">
                  {trustItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <CheckmarkIconPublished color="#10b981" size={16} />
                      <span style={{ color: textColors.muted }} className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supporting Text */}
            {supporting_text && supporting_text !== '___REMOVED___' && (
              <TextPublished
                value={supporting_text}
                element="p"
                className="leading-relaxed mb-8"
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  textAlign: 'center'
                }}
              />
            )}

            {/* Social Proof Section */}
            {show_social_proof && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
                {/* Customer Count with Avatars */}
                {customer_count && customer_count !== '___REMOVED___' && (
                  <div className="flex items-center space-x-2">
                    {show_customer_avatars && customerAvatars.length > 0 && (
                      <div className="flex -space-x-2">
                        {customerAvatars.map((customer: { name: string; avatarUrl: string }, i: number) => (
                          <AvatarPublished
                            key={customer.name}
                            imageUrl={customer.avatarUrl}
                            name={customer.name}
                            size={40}
                          />
                        ))}
                      </div>
                    )}
                    <TextPublished
                      value={customer_count}
                      element="span"
                      className="text-sm"
                      style={{
                        color: textColors.body,
                        textAlign: 'center'
                      }}
                    />
                  </div>
                )}

                {/* Rating Section */}
                {rating_value && rating_value !== '___REMOVED___' && (
                  <div className="flex items-center space-x-1">
                    {renderStars(rating_value)}
                    <div className="flex items-center space-x-1 ml-2">
                      <TextPublished
                        value={rating_value}
                        element="span"
                        className="text-sm"
                        style={{
                          color: textColors.body,
                          textAlign: 'center'
                        }}
                      />
                      {rating_count && rating_count !== '___REMOVED___' && (
                        <TextPublished
                          value={rating_count}
                          element="span"
                          className="text-sm"
                          style={{
                            color: textColors.muted,
                            textAlign: 'center'
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
