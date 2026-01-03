/**
 * SocialProofStrip - Published Version
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

interface ProofStat {
  value: string;
  label: string;
}

interface CompanyLogo {
  name: string;
  logoUrl: string;
}

export default function SocialProofStripPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Trusted by Leading Companies Worldwide';
  const proof_stats = props.proof_stats || '';
  const stat_labels = props.stat_labels || '';
  const company_names = props.company_names || '';
  const logo_urls = props.logo_urls || '{}';
  const trust_badge_1 = props.trust_badge_1 || '';
  const trust_badge_2 = props.trust_badge_2 || '';
  const trust_badge_3 = props.trust_badge_3 || '';
  const rating_display = props.rating_display || '';

  // Parse proof stats
  const parseProofStats = (stats: string, labels: string): ProofStat[] => {
    const statList = stats.split('|').map(s => s.trim()).filter(s => s && s !== '___REMOVED___');
    const labelList = labels.split('|').map(l => l.trim()).filter(l => l);
    return statList.map((value, index) => ({
      value,
      label: labelList[index] || `Metric ${index + 1}`
    }));
  };

  // Parse company names
  const parseCompanyNames = (names: string): string[] => {
    return names.split('|').map(n => n.trim()).filter(n => n && n !== '___REMOVED___');
  };

  // Parse logo URLs
  const parseLogoUrls = (urlsJson: string): Record<string, string> => {
    try {
      return JSON.parse(urlsJson || '{}');
    } catch {
      return {};
    }
  };

  const stats = parseProofStats(proof_stats, stat_labels);
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
  const getSocialProofColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        statNumberColor: '#ea580c',
        companyLogoBg: '#fed7aa',
        companyLogoBorder: '#fed7aa',
        trustBadgeBg: '#ffedd5',
        trustBadgeIcon: '#ea580c',
        ratingStarColor: '#f59e0b'
      },
      cool: {
        statNumberColor: '#2563eb',
        companyLogoBg: '#bfdbfe',
        companyLogoBorder: '#bfdbfe',
        trustBadgeBg: '#dbeafe',
        trustBadgeIcon: '#2563eb',
        ratingStarColor: '#3b82f6'
      },
      neutral: {
        statNumberColor: '#374151',
        companyLogoBg: '#e5e7eb',
        companyLogoBorder: '#e5e7eb',
        trustBadgeBg: '#f9fafb',
        trustBadgeIcon: '#374151',
        ratingStarColor: '#f59e0b'
      }
    }[theme];
  };

  const colors = getSocialProofColors(uiTheme);

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'primary',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '2rem'
            }}
          />
        </div>

        {/* Stats Section */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {stats.slice(0, 4).map((stat, index) => (
              <div key={`stat-${index}`} className="text-center">
                <div
                  className="text-3xl font-bold mb-1"
                  style={{
                    color: colors.statNumberColor,
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)'
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-sm"
                  style={{ color: textColors.muted }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div
          className="w-full h-px mb-12"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)'
          }}
        />

        {/* Company Logos */}
        {companies.length > 0 && (
          <div>
            <div
              className="text-center mb-6 text-sm"
              style={{ color: textColors.muted }}
            >
              Trusted by industry leaders
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {companies.slice(0, 8).map((company, index) => (
                <div
                  key={`company-${index}`}
                  className="flex items-center justify-center px-4 py-2 backdrop-blur-sm rounded-lg border transition-all duration-300"
                  style={{
                    backgroundColor: `${colors.companyLogoBg}0D`,
                    borderColor: `${colors.companyLogoBorder}33`
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <LogoPublished
                      logoUrl={company.logoUrl}
                      companyName={company.name}
                      size="sm"
                    />
                    <span
                      className="text-sm"
                      style={{ color: textColors.body }}
                    >
                      {company.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div
          className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Trust Badge 1 */}
          {trust_badge_1 && trust_badge_1 !== '___REMOVED___' && (
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: colors.trustBadgeBg,
                color: colors.trustBadgeIcon
              }}
            >
              <span className="text-base">✓</span>
              <span className="text-xs font-medium">{trust_badge_1}</span>
            </div>
          )}

          {/* Trust Badge 2 */}
          {trust_badge_2 && trust_badge_2 !== '___REMOVED___' && (
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: colors.trustBadgeBg,
                color: colors.trustBadgeIcon
              }}
            >
              <span className="text-base">✓</span>
              <span className="text-xs font-medium">{trust_badge_2}</span>
            </div>
          )}

          {/* Trust Badge 3 */}
          {trust_badge_3 && trust_badge_3 !== '___REMOVED___' && (
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: colors.trustBadgeBg,
                color: colors.trustBadgeIcon
              }}
            >
              <span className="text-base">✓</span>
              <span className="text-xs font-medium">{trust_badge_3}</span>
            </div>
          )}

          {/* Rating Display */}
          {rating_display && rating_display !== '___REMOVED___' && (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: colors.ratingStarColor }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span
                className="text-xs ml-2"
                style={{ color: textColors.muted }}
              >
                {rating_display}
              </span>
            </div>
          )}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
