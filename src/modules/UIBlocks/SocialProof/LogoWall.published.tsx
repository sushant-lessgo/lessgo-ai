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

  // Parse company data
  const parseCompanyNames = (names: string): string[] => {
    return names.split('|').map(n => n.trim()).filter(n => n && n !== '___REMOVED___');
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
        statNumberColor: '#ea580c'
      },
      cool: {
        logoBorder: '#bfdbfe',
        trustBadgeBg: '#dbeafe',
        trustBadgeBorder: '#bfdbfe',
        trustBadgeText: '#1e40af',
        statNumberColor: '#2563eb'
      },
      neutral: {
        logoBorder: '#e5e7eb',
        trustBadgeBg: '#f9fafb',
        trustBadgeBorder: '#e5e7eb',
        trustBadgeText: '#1f2937',
        statNumberColor: '#374151'
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
          {companies.map((company, index) => (
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
