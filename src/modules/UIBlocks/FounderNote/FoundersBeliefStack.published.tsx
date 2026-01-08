/**
 * FoundersBeliefStack - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { ImagePublished } from '@/components/published/ImagePublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';

type UIBlockTheme = 'warm' | 'cool' | 'neutral';

const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      iconContainerBg: 'bg-orange-600',
      valueBadgeBg: 'bg-orange-100',
      valueBadgeText: '#C2410C',
      valueBadgeBorder: 'border-orange-200',
      commitmentGradientFrom: 'from-orange-50',
      commitmentGradientTo: 'to-orange-100',
    },
    cool: {
      iconContainerBg: 'bg-blue-600',
      valueBadgeBg: 'bg-blue-100',
      valueBadgeText: '#1D4ED8',
      valueBadgeBorder: 'border-blue-200',
      commitmentGradientFrom: 'from-blue-50',
      commitmentGradientTo: 'to-blue-100',
    },
    neutral: {
      iconContainerBg: 'bg-gray-600',
      valueBadgeBg: 'bg-gray-100',
      valueBadgeText: '#374151',
      valueBadgeBorder: 'border-gray-200',
      commitmentGradientFrom: 'from-gray-50',
      commitmentGradientTo: 'to-gray-100',
    }
  }[theme];
};

// Helper: Parse pipe-separated belief items
// Format: "Title with emoji|Description|Title with emoji|Description"
// Also uses individual belief_icon_1-6 fields for icons
function parseBeliefItems(
  beliefItems: string,
  beliefIcons: string[]
): Array<{ icon: string; title: string; description: string }> {
  if (!beliefItems || beliefItems === '___REMOVED___') return [];

  const parts = beliefItems.split('|').map((s: string) => s.trim());
  const beliefs: Array<{ icon: string; title: string; description: string }> = [];

  // Parse pairs of title|description
  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      const titleWithIcon = parts[i] || '';
      const description = parts[i + 1] || '';
      const index = beliefs.length;

      // Extract title (remove emoji prefix if present)
      const titleParts = titleWithIcon.split(' ');
      const title = titleParts.slice(1).join(' ') || titleWithIcon;

      // Use individual icon field, or fallback to icon from title
      const icon = beliefIcons[index] || titleParts[0] || '💡';

      beliefs.push({ icon, title, description });
    }
  }

  return beliefs;
}

export default function FoundersBeliefStackPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from flattened props
  const beliefs_headline = props.beliefs_headline || 'What We Believe';
  const beliefs_intro = props.beliefs_intro || '';
  const belief_items = props.belief_items || '';
  const founder_name = props.founder_name || '';
  const founder_title = props.founder_title || '';
  const founder_image = props.founder_image;
  const commitment_text = props.commitment_text || '';
  const cta_text = props.cta_text || 'Join Our Mission';
  const values_heading = props.values_heading || 'Our Core Values';
  const show_company_values = props.show_company_values !== '___REMOVED___';

  // Company values (filter removed)
  const companyValues = [
    props.company_value_1,
    props.company_value_2,
    props.company_value_3,
    props.company_value_4,
    props.company_value_5,
  ].filter((v: string) => v && v !== '___REMOVED___' && v.trim() !== '');

  // Trust items (filter removed)
  const trustItems = [
    props.trust_item_1,
    props.trust_item_2,
    props.trust_item_3,
    props.trust_item_4,
    props.trust_item_5,
  ].filter((t: string) => t && t !== '___REMOVED___' && t.trim() !== '');

  // Individual belief icons
  const beliefIcons = [
    props.belief_icon_1 || '🎯',
    props.belief_icon_2 || '🚀',
    props.belief_icon_3 || '🌱',
    props.belief_icon_4 || '🔒',
    props.belief_icon_5 || '⚡',
    props.belief_icon_6 || '🌍',
  ];

  // Parse belief items (pipe-separated: "Title|Description|Title|Description")
  const parsedBeliefs = parseBeliefItems(belief_items, beliefIcons);

  // Theme detection (server-safe - simplified for published)
  const uiBlockTheme: UIBlockTheme = 'neutral';
  const colors = getThemeColors(uiBlockTheme);

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={beliefs_headline}
            level="h2"
            className="leading-tight mb-6"
            style={{
              color: textColors.heading,
              ...headlineTypography
            }}
          />

          {beliefs_intro && (
            <TextPublished
              value={beliefs_intro}
              className="leading-relaxed max-w-3xl mx-auto"
              style={{ color: textColors.body, ...bodyTypography }}
            />
          )}
        </div>

        {/* Belief cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {parsedBeliefs.map((belief: { icon: string; title: string; description: string }, idx: number) => {
            // Adapt card background to section background (like base component)
            const cardBg = backgroundType === 'primary'
              ? 'bg-white/10 backdrop-blur-sm border-white/20'
              : 'bg-white border-gray-100';
            const cardHover = backgroundType === 'primary'
              ? 'hover:bg-white/20 hover:border-white/30'
              : 'hover:border-blue-300 hover:shadow-xl';

            return (
              <div
                key={idx}
                className={`${cardBg} ${cardHover} rounded-xl shadow-lg p-6 transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colors.iconContainerBg} bg-opacity-10`}
                  >
                    <span className="text-2xl">{belief.icon}</span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{ color: textColors.heading, fontWeight: 600 }}
                  className="text-lg mb-3"
                >
                  {belief.title}
                </h3>

                {/* Description */}
                <p
                  style={{ color: textColors.muted }}
                  className="text-sm leading-relaxed opacity-90"
                >
                  {belief.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Founder commitment section */}
        <div className={`bg-gradient-to-br ${colors.commitmentGradientFrom} ${colors.commitmentGradientTo} rounded-2xl p-8 lg:p-12 mb-12`}>
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Founder image */}
            <div className="text-center lg:text-left">
              {founder_image ? (
                <ImagePublished
                  src={founder_image}
                  alt={founder_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto lg:mx-0"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg mx-auto lg:mx-0">
                  <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p style={{ fontWeight: 600, color: '#111827' }}>{founder_name}</p>
                {founder_title && (
                  <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{founder_title}</p>
                )}
              </div>
            </div>

            {/* Commitment text */}
            <div className="lg:col-span-2">
              <p style={{ fontSize: '1.125rem', lineHeight: '1.75', color: '#374151' }}>
                {commitment_text}
              </p>
            </div>
          </div>
        </div>

        {/* Company values */}
        {show_company_values && companyValues.length > 0 && (
          <div className="text-center mb-12">
            <h3
              style={{ color: textColors.heading, ...h3Typography }}
              className="mb-6"
            >
              {values_heading}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {companyValues.map((value: string, idx: number) => (
                <span
                  key={idx}
                  className={`${colors.valueBadgeBg} rounded-full px-6 py-3 shadow-md border ${colors.valueBadgeBorder} font-medium text-sm`}
                  style={{ color: colors.valueBadgeText }}
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA and trust indicators */}
        <div className="text-center">
          <CTAButtonPublished
            text={cta_text}
            backgroundColor={theme.colors?.accentColor || '#3B82F6'}
            textColor="#FFFFFF"
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 mb-8"
          />

          {/* Trust indicators */}
          {trustItems.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {trustItems.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: textColors.muted, fontSize: '0.875rem' }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
