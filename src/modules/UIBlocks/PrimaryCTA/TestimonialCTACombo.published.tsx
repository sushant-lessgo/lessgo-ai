/**
 * TestimonialCTACombo - Published Version
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
import { LogoPublished } from '@/components/published/LogoPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Theme colors helper (HEX VALUES for inline styles)
const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      cardGradientFrom: '#fff7ed', // orange-50
      badgeBg: '#fed7aa', // orange-200
      badgeText: '#c2410c', // orange-800
      badgeBorder: '#fdba74', // orange-300
      quoteHighlight: '#ea580c', // orange-600
      avatarGradients: [
        ['#f97316', '#dc2626'], // orange-500 to red-600
        ['#ef4444', '#f43f5e'], // red-500 to rose-600
        ['#f59e0b', '#f97316'], // amber-500 to orange-600
        ['#f43f5e', '#ec4899'], // rose-500 to pink-600
        ['#ea580c', '#d97706'], // orange-600 to amber-700
        ['#dc2626', '#ea580c'], // red-600 to orange-700
        ['#eab308', '#f97316'], // yellow-500 to orange-600
      ],
      logoBorder: '#fdba74', // orange-300
      iconColor: '#f97316' // orange-500
    },
    cool: {
      cardGradientFrom: '#eff6ff', // blue-50
      badgeBg: '#bfdbfe', // blue-200
      badgeText: '#1e3a8a', // blue-900
      badgeBorder: '#93c5fd', // blue-300
      quoteHighlight: '#2563eb', // blue-600
      avatarGradients: [
        ['#3b82f6', '#6366f1'], // blue-500 to indigo-600
        ['#10b981', '#059669'], // green-500 to emerald-600
        ['#a855f7', '#ec4899'], // purple-500 to pink-600
        ['#14b8a6', '#06b6d4'], // teal-500 to cyan-600
        ['#6366f1', '#a855f7'], // indigo-500 to purple-600
        ['#06b6d4', '#3b82f6'], // cyan-500 to blue-600
        ['#0ea5e9', '#3b82f6'], // sky-500 to blue-600
      ],
      logoBorder: '#93c5fd', // blue-300
      iconColor: '#3b82f6' // blue-500
    },
    neutral: {
      cardGradientFrom: '#f9fafb', // gray-50
      badgeBg: '#e5e7eb', // gray-200
      badgeText: '#1f2937', // gray-800
      badgeBorder: '#d1d5db', // gray-300
      quoteHighlight: '#374151', // gray-700
      avatarGradients: [
        ['#6b7280', '#4b5563'], // gray-500 to gray-600
        ['#64748b', '#4b5563'], // slate-500 to gray-600
        ['#71717a', '#4b5563'], // zinc-500 to gray-600
        ['#737373', '#4b5563'], // neutral-500 to gray-600
        ['#4b5563', '#334155'], // gray-600 to slate-700
        ['#475569', '#52525b'], // slate-600 to zinc-700
        ['#78716c', '#57534e'], // stone-500 to stone-600
      ],
      logoBorder: '#d1d5db', // gray-300
      iconColor: '#6b7280' // gray-500
    }
  }[theme];
};

// Server-safe Avatar with Logo component
const AvatarWithLogo = ({
  name,
  company,
  logoUrl,
  gradients,
  logoBorder
}: {
  name: string;
  company: string;
  logoUrl?: string;
  gradients: string[][];
  logoBorder: string;
}) => {
  const initials = name
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const companyInitials = company
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colorIndex = name.length % gradients.length;
  const [gradientFrom, gradientTo] = gradients[colorIndex];

  return (
    <div className="relative" style={{ width: '64px', height: '64px' }}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white"
        style={{
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`
        }}
      >
        {initials}
      </div>
      <div
        className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
        style={{ borderWidth: '2px', borderColor: logoBorder }}
      >
        {logoUrl ? (
          <LogoPublished logoUrl={logoUrl} companyName={company} size="sm" />
        ) : (
          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 border">
            {companyInitials}
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
export default function TestimonialCTAComboPublished(props: LayoutComponentProps) {
  // Extract props
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content fields
  const headline = props.headline || 'Join Thousands of Happy Customers';
  const subheadline = props.subheadline;
  const cta_text = props.cta_text || 'Start Your Success Story';
  const secondary_cta_text = props.secondary_cta_text;
  const testimonial_quote = props.testimonial_quote || '';
  const testimonial_author = props.testimonial_author || 'Customer Name';
  const testimonial_title = props.testimonial_title || 'Position';
  const testimonial_company = props.testimonial_company || 'Company';
  const testimonial_company_logo = props.testimonial_company_logo;
  const testimonial_date = props.testimonial_date;
  const testimonial_industry = props.testimonial_industry;
  const case_study_tag = props.case_study_tag;
  const customer_count = props.customer_count;
  const average_rating = props.average_rating;
  const uptime_percentage = props.uptime_percentage;
  const show_social_proof = props.show_social_proof !== false;

  // Detect theme
  const uiBlockTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  const colors = getThemeColors(uiBlockTheme);
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );
  const h2Typography = getPublishedTypographyStyles('h2', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Column - CTA Content */}
          <div className="space-y-8">
            <HeadlinePublished
              value={headline}
              level="h2"
              style={{
                color: textColors.heading,
                ...h2Typography,
                marginBottom: '1.5rem'
              }}
            />

            {subheadline && subheadline.trim() !== '' && (
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <CTAButtonPublished
                text={cta_text}
                backgroundColor={theme.colors?.accentColor || '#3B82F6'}
                textColor="#FFFFFF"
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg"
              />

              {secondary_cta_text && secondary_cta_text.trim() !== '' && secondary_cta_text !== '___REMOVED___' && (
                <CTAButtonPublished
                  text={secondary_cta_text}
                  backgroundColor="transparent"
                  textColor={theme.colors?.accentColor || '#3B82F6'}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg border-2"
                  style={{ borderColor: theme.colors?.accentColor || '#3B82F6' }}
                />
              )}
            </div>

            {/* Social Proof Stats */}
            {show_social_proof && (
              <div className="flex items-center space-x-8">
                {customer_count && customer_count !== '___REMOVED___' && (
                  <div className="text-center">
                    <div
                      style={{ color: textColors.heading, ...h2Typography }}
                      className="font-bold"
                    >
                      {customer_count}
                    </div>
                    <div style={{ color: textColors.muted }} className="text-sm">
                      Happy Customers
                    </div>
                  </div>
                )}

                {average_rating && average_rating !== '___REMOVED___' && (
                  <div className="text-center">
                    <div
                      style={{ color: textColors.heading, ...h2Typography }}
                      className="font-bold"
                    >
                      {average_rating}
                    </div>
                    <div style={{ color: textColors.muted }} className="text-sm">
                      Average Rating
                    </div>
                  </div>
                )}

                {uptime_percentage && uptime_percentage !== '___REMOVED___' && (
                  <div className="text-center">
                    <div
                      style={{ color: textColors.heading, ...h2Typography }}
                      className="font-bold"
                    >
                      {uptime_percentage}
                    </div>
                    <div style={{ color: textColors.muted }} className="text-sm">
                      Uptime
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Testimonial Card */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 relative overflow-hidden">
            {/* Theme gradient background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom right, ${colors.cardGradientFrom}, transparent)`
              }}
            />

            {/* Case Study Tag */}
            {case_study_tag && case_study_tag.trim() !== '' && (
              <div className="absolute top-4 right-4 z-10">
                <div
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: colors.badgeBg,
                    color: colors.badgeText,
                    borderColor: colors.badgeBorder
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{case_study_tag}</span>
                </div>
              </div>
            )}

            {/* Quote with theme highlights */}
            <div className="text-gray-700 leading-relaxed mb-8 text-lg pt-4 relative">
              <div
                className="italic"
                dangerouslySetInnerHTML={{
                  __html: testimonial_quote.replace(
                    /<strong>(.*?)<\/strong>/g,
                    `<span style="font-weight: bold; color: ${colors.quoteHighlight};">$1</span>`
                  )
                }}
              />
            </div>

            {/* Author Info */}
            <div className="flex items-center space-x-4">
              <AvatarWithLogo
                name={testimonial_author}
                company={testimonial_company}
                logoUrl={testimonial_company_logo}
                gradients={colors.avatarGradients}
                logoBorder={colors.logoBorder}
              />

              <div className="flex-1">
                <div style={{ color: '#111827' }} className="font-semibold text-base">
                  {testimonial_author}
                </div>

                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                  <span>{testimonial_title}</span>
                  <span>at</span>
                  <span className="font-semibold">{testimonial_company}</span>
                </div>

                {/* Industry and Date */}
                {(testimonial_industry || testimonial_date) && (
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                    {testimonial_industry && (
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke={colors.iconColor}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>{testimonial_industry}</span>
                      </div>
                    )}

                    {testimonial_date && (
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke={colors.iconColor}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{testimonial_date}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
