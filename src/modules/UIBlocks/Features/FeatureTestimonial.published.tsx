/**
 * FeatureTestimonial - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Feature+Testimonial structure
interface FeatureTestimonial {
  title: string;
  description: string;
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  icon: string;
}

export default function FeatureTestimonialPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Enterprise Features Trusted by Industry Leaders';
  const subheadline = props.subheadline || '';
  const supporting_text = props.supporting_text || '';
  const cta_text = props.cta_text || '';

  // Extract pipe-separated data
  const feature_titles = props.feature_titles || '';
  const feature_descriptions = props.feature_descriptions || '';
  const testimonial_quotes = props.testimonial_quotes || '';
  const testimonial_names = props.testimonial_names || '';
  const testimonial_roles = props.testimonial_roles || '';

  // Extract individual icons
  const feature_icon_1 = props.feature_icon_1 || '✨';
  const feature_icon_2 = props.feature_icon_2 || '🔒';
  const feature_icon_3 = props.feature_icon_3 || '⚡';
  const feature_icon_4 = props.feature_icon_4 || '🔗';
  const feature_icon_5 = props.feature_icon_5 || '📊';
  const feature_icon_6 = props.feature_icon_6 || '🎯';

  const icons = [feature_icon_1, feature_icon_2, feature_icon_3, feature_icon_4, feature_icon_5, feature_icon_6];

  // Extract individual avatars
  const testimonial_avatar_0 = props.testimonial_avatar_0 || '';
  const testimonial_avatar_1 = props.testimonial_avatar_1 || '';
  const testimonial_avatar_2 = props.testimonial_avatar_2 || '';
  const testimonial_avatar_3 = props.testimonial_avatar_3 || '';
  const testimonial_avatar_4 = props.testimonial_avatar_4 || '';
  const testimonial_avatar_5 = props.testimonial_avatar_5 || '';

  const avatars = [testimonial_avatar_0, testimonial_avatar_1, testimonial_avatar_2, testimonial_avatar_3, testimonial_avatar_4, testimonial_avatar_5];

  // Trust banner fields
  const trust_banner_title = props.trust_banner_title || '';
  const show_trust_banner = props.show_trust_banner !== false;
  const trust_metric_1 = props.trust_metric_1 || '';
  const trust_label_1 = props.trust_label_1 || '';
  const trust_metric_2 = props.trust_metric_2 || '';
  const trust_label_2 = props.trust_label_2 || '';
  const trust_metric_3 = props.trust_metric_3 || '';
  const trust_label_3 = props.trust_label_3 || '';
  const trust_metric_4 = props.trust_metric_4 || '';
  const trust_label_4 = props.trust_label_4 || '';

  // Trust items
  const trust_item_1 = props.trust_item_1 || '';
  const trust_item_2 = props.trust_item_2 || '';
  const trust_item_3 = props.trust_item_3 || '';
  const trust_item_4 = props.trust_item_4 || '';
  const trust_item_5 = props.trust_item_5 || '';

  // Parse pipe-separated data
  const titleList = feature_titles.split('|').map(t => t.trim()).filter(t => t && t !== '___REMOVED___');
  const descriptionList = feature_descriptions.split('|').map(d => d.trim()).filter(d => d && d !== '___REMOVED___');
  const quoteList = testimonial_quotes.split('|').map(q => q.trim()).filter(q => q && q !== '___REMOVED___');
  const nameList = testimonial_names.split('|').map(n => n.trim()).filter(n => n && n !== '___REMOVED___');
  const roleList = testimonial_roles.split('|').map(r => r.trim()).filter(r => r && r !== '___REMOVED___');

  // Build features array
  const features: FeatureTestimonial[] = titleList.map((title, index) => ({
    title,
    description: descriptionList[index] || '',
    quote: quoteList[index] || '',
    name: nameList[index] || '',
    role: roleList[index] || '',
    avatar: avatars[index] || '',
    icon: icons[index] || '✨'
  }));

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Get theme colors
  const getThemeColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        iconBg: '#f97316',
        avatarGradientStart: '#f97316',
        avatarGradientEnd: '#dc2626',
        cardBorderHover: '#fed7aa'
      },
      cool: {
        iconBg: '#3b82f6',
        avatarGradientStart: '#3b82f6',
        avatarGradientEnd: '#6366f1',
        cardBorderHover: '#bfdbfe'
      },
      neutral: {
        iconBg: '#64748b',
        avatarGradientStart: '#64748b',
        avatarGradientEnd: '#6b7280',
        cardBorderHover: '#cbd5e1'
      }
    };
    return colorMap[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);
  const bodyLgTypography = getPublishedTypographyStyles('body-lg', theme);

  // Trust items array
  const trustItems = [trust_item_1, trust_item_2, trust_item_3, trust_item_4, trust_item_5]
    .filter(item => item && item !== '___REMOVED___' && item.trim() !== '');

  // Trust metrics array
  const trustMetrics = [
    { metric: trust_metric_1, label: trust_label_1 },
    { metric: trust_metric_2, label: trust_label_2 },
    { metric: trust_metric_3, label: trust_label_3 },
    { metric: trust_metric_4, label: trust_label_4 }
  ].filter(item => item.metric && item.metric !== '___REMOVED___' && item.metric.trim() !== '');

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
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyLgTypography,
                marginBottom: '1.5rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderColor: '#f3f4f6'
              }}
            >
              {/* Feature Content */}
              <div className="mb-6">
                <div className="flex items-start space-x-4 mb-4">
                  {/* Icon with theme background */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: themeColors.iconBg }}
                  >
                    <IconPublished
                      value={feature.icon}
                      size="md"
                      className="text-white text-2xl"
                    />
                  </div>

                  {/* Feature Title */}
                  <div className="flex-1">
                    <h3
                      style={{
                        ...h3Typography,
                        color: textColors.heading,
                        marginBottom: '0.5rem',
                        fontSize: '1.25rem',
                        fontWeight: 700
                      }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                </div>

                {/* Feature Description */}
                <TextPublished
                  value={feature.description}
                  style={{
                    color: textColors.muted,
                    lineHeight: '1.75'
                  }}
                />
              </div>

              {/* Testimonial Section */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <blockquote className="mb-4">
                  <TextPublished
                    value={`"${feature.quote}"`}
                    style={{
                      color: textColors.muted,
                      fontStyle: 'italic',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}
                  />
                </blockquote>

                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  {feature.avatar && feature.avatar !== '' ? (
                    <img
                      src={feature.avatar}
                      alt={feature.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.avatarGradientStart}, ${themeColors.avatarGradientEnd})`
                      }}
                    >
                      <span className="text-white font-bold text-lg">
                        {feature.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: textColors.heading
                      }}
                    >
                      {feature.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: textColors.muted
                      }}
                    >
                      {feature.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Banner */}
        {show_trust_banner && trust_banner_title && trustMetrics.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
            <div className="text-center">
              <h3
                style={{
                  ...h3Typography,
                  fontWeight: 600,
                  color: textColors.heading,
                  marginBottom: '1rem'
                }}
              >
                {trust_banner_title}
              </h3>

              <div className="flex flex-wrap justify-center gap-8">
                {trustMetrics.map((item, index) => (
                  <div key={index} className="text-center">
                    <div
                      style={{
                        fontSize: '1.875rem',
                        fontWeight: 700,
                        color: textColors.heading
                      }}
                    >
                      {item.metric}
                    </div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: textColors.muted
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {(supporting_text || cta_text || trustItems.length > 0) && (
          <div className="text-center space-y-6 mt-16">
            {supporting_text && (
              <TextPublished
                value={supporting_text}
                style={{
                  color: textColors.body,
                  maxWidth: '48rem',
                  margin: '0 auto 2rem'
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {cta_text && (
                <button
                  style={{
                    backgroundColor: theme.colors.accentColor,
                    color: '#ffffff',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}
                  className="transition-all duration-200 hover:shadow-2xl"
                >
                  {cta_text}
                </button>
              )}

              {trustItems.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {trustItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span style={{ color: textColors.muted, fontSize: '0.875rem' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
