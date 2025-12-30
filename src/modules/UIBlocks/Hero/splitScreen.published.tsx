/**
 * SplitScreen Hero - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - 50/50 split layout (left: content, right: image)
 * - Badge, headline, subheadline, supporting text
 * - Primary and secondary CTA buttons
 * - Trust indicators (up to 5 items)
 * - Social proof: customer avatars, star ratings
 * - Hero image with animated dashboard placeholder
 * - 23 configurable content fields
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { CheckmarkIconPublished } from '@/components/published/CheckmarkIconPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { getPublishedTextColors, getPublishedTypographyStyles } from '@/lib/publishedTextColors';

// ============================================================================
// Helper Functions (server-safe, no hooks)
// ============================================================================

/**
 * Parse customer avatar data from pipe-separated names and JSON URL mapping
 */
function parseCustomerAvatarData(names: string, urls: string): Array<{ name: string; avatarUrl: string }> {
  const nameArray = names.split('|').map(n => n.trim()).filter(Boolean);
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
 */
function renderStars(rating: string) {
  const ratingNum = parseFloat(rating.match(/([\d.]+)/)?.[1] || '0');
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < Math.floor(ratingNum)) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }

  return <>{stars}</>;
}

/**
 * Hero Image Placeholder - Server-safe animated dashboard mockup
 */
const HeroImagePlaceholder = React.memo(() => (
  <div className="relative w-full h-full min-h-[700px]">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl shadow-2xl overflow-hidden">

      <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">

        <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center px-6">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-6 flex-1 flex items-center">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 border">
              dashboard.yourapp.com
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full">

          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">2.4k</div>
              <div className="text-xs text-gray-600 mb-1">Active Users</div>
              <div className="text-xs text-blue-600 font-medium">+12%</div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-emerald-900 mb-1">$45k</div>
              <div className="text-xs text-gray-600 mb-1">Revenue</div>
              <div className="text-xs text-emerald-600 font-medium">+8%</div>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
              <div className="w-10 h-10 bg-violet-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-violet-900 mb-1">98.2%</div>
              <div className="text-xs text-gray-600 mb-1">Uptime</div>
              <div className="text-xs text-violet-600 font-medium">+0.1%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Performance Overview</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-end justify-between h-40 space-x-2">
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-24"></div>
                <div className="text-xs text-gray-400">1</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-32"></div>
                <div className="text-xs text-gray-400">2</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">3</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-36"></div>
                <div className="text-xs text-gray-400">4</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-28"></div>
                <div className="text-xs text-gray-400">5</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-40"></div>
                <div className="text-xs text-gray-400">6</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">🚀</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">New workflow deployed</div>
                <div className="text-xs text-gray-500">2 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">📊</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Report generated</div>
                <div className="text-xs text-gray-500">5 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">⚡</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Automation triggered</div>
                <div className="text-xs text-gray-500">8 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="absolute bottom-8 left-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center animate-bounce">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  </div>
));
HeroImagePlaceholder.displayName = 'HeroImagePlaceholder';

// ============================================================================
// Main Component
// ============================================================================

export default function SplitScreenPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Business with Smart Automation';
  const subheadline = props.subheadline || 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent automation platform.';
  const supporting_text = props.supporting_text || 'Save 20+ hours per week with automated workflows that just work.';
  const badge_text = props.badge_text || '';
  const cta_text = props.cta_text || 'Start Free Trial';
  const secondary_cta_text = props.secondary_cta_text || 'Watch Demo';
  const split_hero_image = props.split_hero_image || '/hero-placeholder.jpg';
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
  ].filter(item => item && item !== '___REMOVED___' && item.trim() !== '');

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

  // Accent color for badge and buttons
  const accentColor = theme?.colors?.accentColor || '#3B82F6';

  // Image validation
  const imageValue = split_hero_image || '';
  const isValidImagePath = imageValue.startsWith('/') ||
                          imageValue.startsWith('http://') ||
                          imageValue.startsWith('https://') ||
                          imageValue.startsWith('blob:') ||
                          imageValue.startsWith('data:');
  const imageSrc = isValidImagePath && imageValue !== '' ? imageValue : '/hero-placeholder.jpg';

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="min-h-screen flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 min-h-[700px]">

          {/* Left Column: Content */}
          <div className="flex items-center justify-center p-8 md:p-10 lg:p-16">
            <div className="max-w-lg space-y-8 md:space-y-10 lg:space-y-12">

              {/* Badge */}
              {badge_text && badge_text !== '___REMOVED___' && badge_text.trim() !== '' && (
                <div>
                  <span
                    style={{
                      color: accentColor,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                      backgroundColor: `${accentColor}15`
                    }}
                    className="inline-block px-4 py-2 rounded-full font-medium"
                  >
                    {badge_text}
                  </span>
                </div>
              )}

              {/* Headline */}
              <div className="mb-2">
                <HeadlinePublished
                  value={headline}
                  level="h1"
                  style={{
                    color: textColors.heading,
                    ...h1Typography
                  }}
                />
              </div>

              {/* Subheadline */}
              {subheadline && subheadline !== '___REMOVED___' && (
                <TextPublished
                  value={subheadline}
                  element="p"
                  className="text-xl leading-relaxed"
                  style={{
                    color: textColors.body,
                    ...bodyLgTypography
                  }}
                />
              )}

              {/* Supporting Text */}
              {supporting_text && supporting_text !== '___REMOVED___' && (
                <TextPublished
                  value={supporting_text}
                  element="p"
                  className="leading-relaxed"
                  style={{
                    color: textColors.body
                  }}
                />
              )}

              {/* CTA Buttons & Trust Indicators */}
              <div className="flex flex-col gap-6 mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                  {/* Primary CTA */}
                  <CTAButtonPublished
                    text={cta_text}
                    backgroundColor={accentColor}
                    textColor="#FFFFFF"
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4"
                  />

                  {/* Secondary CTA */}
                  {secondary_cta_text && secondary_cta_text !== '___REMOVED___' && (
                    <CTAButtonPublished
                      text={secondary_cta_text}
                      backgroundColor="transparent"
                      textColor={textColors.body}
                      className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4 border-2"
                      style={{ borderColor: textColors.body }}
                    />
                  )}
                </div>

                {/* Trust Indicators */}
                {trustItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {trustItems.map((item, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <CheckmarkIconPublished color="#10b981" size={16} />
                        <span style={{ color: textColors.muted }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Proof */}
              {show_social_proof && (
                <div className="flex flex-col space-y-6 pt-8 md:pt-10">
                  {/* Customer Count with Avatars */}
                  {customer_count && customer_count !== '___REMOVED___' && (
                    <div className="flex items-center space-x-3">
                      {show_customer_avatars && customerAvatars.length > 0 && (
                        <div className="flex -space-x-2">
                          {customerAvatars.map((customer, i) => (
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
                        style={{ color: textColors.body }}
                      />
                    </div>
                  )}

                  {/* Rating with Stars */}
                  {rating_value && rating_value !== '___REMOVED___' && (
                    <div className="flex items-center space-x-2">
                      {renderStars(rating_value)}
                      <div className="flex items-center space-x-2 ml-3">
                        <TextPublished
                          value={rating_value}
                          element="span"
                          className="text-sm"
                          style={{ color: textColors.body }}
                        />
                        {rating_count && rating_count !== '___REMOVED___' && (
                          <TextPublished
                            value={rating_count}
                            element="span"
                            className="text-sm"
                            style={{ color: textColors.muted }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="flex items-center justify-center p-4 md:p-6 lg:p-8">
            {imageSrc && imageSrc !== '/hero-placeholder.jpg' ? (
              <div className="relative w-full h-full min-h-[600px]">
                <img
                  src={imageSrc}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
              </div>
            ) : (
              <HeroImagePlaceholder />
            )}
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
