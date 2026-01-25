/**
 * LogoWall - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { LogoPublished } from '@/components/published/LogoPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface CompanyLogo {
  name: string;
  logoUrl: string;
}

export default function LogoWallPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Trusted by Leading Companies Worldwide';
  const subheadline = props.subheadline || '';
  const company_names = props.company_names || '';
  const logo_urls = props.logo_urls || '{}';

  // Stats
  const stat_1_number = props.stat_1_number || '';
  const stat_1_label = props.stat_1_label || '';
  const stat_2_number = props.stat_2_number || '';
  const stat_2_label = props.stat_2_label || '';
  const stat_3_number = props.stat_3_number || '';
  const stat_3_label = props.stat_3_label || '';
  const show_stats_section = props.show_stats_section !== false;

  // Trust badge
  const trust_badge_text = props.trust_badge_text || '';
  const show_trust_badge = props.show_trust_badge !== false;

  // Media mentions
  const media_mentions = props.media_mentions || '';
  const media_mention_quotes = props.media_mention_quotes || '';
  const show_media_section = props.show_media_section !== false;

  // Certifications
  const certifications = props.certifications || '';
  const certification_labels = props.certification_labels || '';
  const show_certifications_section = props.show_certifications_section !== false;

  // Parse company data
  const parseCompanyNames = (names: string): string[] => {
    return names.split('|').map((n: string) => n.trim()).filter((n: string) => n && n !== '___REMOVED___');
  };

  const parseLogoUrls = (urlsJson: string): Record<string, string> => {
    try {
      return JSON.parse(urlsJson || '{}');
    } catch {
      return {};
    }
  };

  const companyNames = parseCompanyNames(company_names);
  const logoUrlsMap = parseLogoUrls(logo_urls);

  const companies: CompanyLogo[] = companyNames.map(name => ({
    name,
    logoUrl: logoUrlsMap[name] || ''
  }));

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
    (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based colors
  const getLogoWallColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        logoBorder: '#fed7aa',
        trustBadgeBg: '#ffedd5',
        trustBadgeBorder: '#fed7aa',
        trustBadgeText: '#9a3412',
        statNumberColor: '#ea580c',
        mediaBg: '#fffbeb',
        mediaBorder: '#fde68a',
        mediaText: '#92400e',
        certBg: '#f0fdf4',
        certBorder: '#86efac',
        certText: '#166534'
      },
      cool: {
        logoBorder: '#bfdbfe',
        trustBadgeBg: '#dbeafe',
        trustBadgeBorder: '#bfdbfe',
        trustBadgeText: '#1e40af',
        statNumberColor: '#2563eb',
        mediaBg: '#f0f9ff',
        mediaBorder: '#7dd3fc',
        mediaText: '#0c4a6e',
        certBg: '#ecfeff',
        certBorder: '#67e8f9',
        certText: '#155e75'
      },
      neutral: {
        logoBorder: '#e5e7eb',
        trustBadgeBg: '#f9fafb',
        trustBadgeBorder: '#e5e7eb',
        trustBadgeText: '#1f2937',
        statNumberColor: '#374151',
        mediaBg: '#f9fafb',
        mediaBorder: '#d1d5db',
        mediaText: '#374151',
        certBg: '#f9fafb',
        certBorder: '#d1d5db',
        certText: '#374151'
      }
    }[theme];
  };

  const colors = getLogoWallColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const statNumberTypography = getPublishedTypographyStyles('h2', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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
                ...bodyTypography,
                maxWidth: '32rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Company Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {companies.map((company: CompanyLogo, index: number) => (
            <div
              key={`company-${index}`}
              className="p-6 bg-white rounded-lg border hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]"
              style={{
                borderColor: colors.logoBorder
              }}
            >
              <LogoPublished
                logoUrl={company.logoUrl}
                companyName={company.name}
                size="md"
              />

              <div className="text-center mt-3">
                <span
                  className="font-medium text-sm"
                  style={{ color: '#374151' }}
                >
                  {company.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Media Mentions Section */}
        {show_media_section && media_mentions && (
          <div className="mt-12">
            <div className="text-center mb-6">
              <span
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: colors.mediaBg,
                  borderColor: colors.mediaBorder,
                  color: colors.mediaText,
                  borderWidth: '1px'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                </svg>
                Featured In
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {media_mentions.split('|').map((m: string) => m.trim()).filter((m: string) => m && m !== '___REMOVED___').map((mention: string, index: number) => {
                const quotes = media_mention_quotes.split('|').map((q: string) => q.trim());
                const quote = quotes[index] || '';
                return (
                  <div
                    key={`media-${index}`}
                    className="px-6 py-3 rounded-lg border text-center"
                    style={{
                      backgroundColor: 'white',
                      borderColor: colors.mediaBorder
                    }}
                  >
                    <span className="font-semibold text-gray-900">{mention}</span>
                    {quote && <p className="text-sm text-gray-600 italic mt-1">"{quote}"</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {show_certifications_section && certifications && (
          <div className="mt-12">
            <div className="text-center mb-6">
              <span
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: colors.certBg,
                  borderColor: colors.certBorder,
                  color: colors.certText,
                  borderWidth: '1px'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Security & Compliance
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {certifications.split('|').map((c: string) => c.trim()).filter((c: string) => c && c !== '___REMOVED___').map((cert: string, index: number) => {
                const labels = certification_labels.split('|').map((l: string) => l.trim());
                const label = labels[index] || cert;
                return (
                  <div
                    key={`cert-${index}`}
                    className="flex items-center px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.certBg,
                      borderColor: colors.certBorder
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.certText }}>
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm" style={{ color: colors.certText }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Proof Stats */}
        {show_stats_section && (stat_1_number || stat_2_number || stat_3_number) && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            {stat_1_number && stat_1_number !== '___REMOVED___' && (
              <div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.statNumberColor }}
                >
                  {stat_1_number}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {stat_1_label}
                </div>
              </div>
            )}

            {stat_2_number && stat_2_number !== '___REMOVED___' && (
              <div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.statNumberColor }}
                >
                  {stat_2_number}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {stat_2_label}
                </div>
              </div>
            )}

            {stat_3_number && stat_3_number !== '___REMOVED___' && (
              <div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.statNumberColor }}
                >
                  {stat_3_number}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: textColors.muted }}
                >
                  {stat_3_label}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trust Badge */}
        {show_trust_badge && trust_badge_text && trust_badge_text !== '___REMOVED___' && (
          <div className="mt-12 text-center">
            <div
              className="inline-flex items-center px-6 py-3 rounded-full border"
              style={{
                backgroundColor: colors.trustBadgeBg,
                borderColor: colors.trustBadgeBorder
              }}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={{ color: colors.trustBadgeText }}
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>

              <span
                className="font-medium"
                style={{ color: colors.trustBadgeText }}
              >
                {trust_badge_text}
              </span>
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
