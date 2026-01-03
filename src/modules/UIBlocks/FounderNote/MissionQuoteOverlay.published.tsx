/**
 * MissionQuoteOverlay - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Full-screen overlay with mission quote, founder, stats, and CTA
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles } from '@/lib/publishedTextColors';
import { CTAButtonPublished } from '@/components/published/CTAButtonPublished';
import { ImagePublished } from '@/components/published/ImagePublished';

type UIBlockTheme = 'warm' | 'cool' | 'neutral';

const getThemeColors = (theme: UIBlockTheme) => {
  return {
    warm: {
      bgGradient: 'linear-gradient(to bottom right, #7C2D12, #991B1B, #78350F)', // orange-900, red-800, amber-900
      badgeBg: 'rgba(249, 115, 22, 0.2)', // orange-500 with opacity
      badgeText: '#FFEDD5', // orange-100
      ctaBg: '#F97316', // orange-500
      ctaBgHover: '#FB923C', // orange-400
      ctaText: '#FFFFFF',
      statsBg: 'rgba(124, 45, 18, 0.4)', // orange-900 with opacity
      floatingBg: 'rgba(249, 115, 22, 0.05)', // orange-500 very subtle
    },
    cool: {
      bgGradient: 'linear-gradient(to bottom right, #1E3A8A, #3730A3, #581C87)', // blue-900, indigo-800, purple-900
      badgeBg: 'rgba(59, 130, 246, 0.2)',
      badgeText: '#DBEAFE',
      ctaBg: '#3B82F6',
      ctaBgHover: '#60A5FA',
      ctaText: '#FFFFFF',
      statsBg: 'rgba(30, 58, 138, 0.4)',
      floatingBg: 'rgba(59, 130, 246, 0.05)',
    },
    neutral: {
      bgGradient: 'linear-gradient(to bottom right, #111827, #1E293B, #111827)', // gray-900, slate-800, gray-900
      badgeBg: 'rgba(107, 114, 128, 0.2)',
      badgeText: '#F3F4F6',
      ctaBg: '#4B5563',
      ctaBgHover: '#6B7280',
      ctaText: '#FFFFFF',
      statsBg: 'rgba(17, 24, 39, 0.4)',
      floatingBg: 'rgba(107, 114, 128, 0.05)',
    }
  }[theme];
};

// Parse mission stats from individual fields or legacy pipe-separated
function parseMissionStats(props: LayoutComponentProps): Array<{ value: string; label: string }> {
  const stats: Array<{ value: string; label: string }> = [];

  // Try individual fields first (mission_stat_1 to mission_stat_4)
  for (let i = 1; i <= 4; i++) {
    const statField = props[`mission_stat_${i}`];
    if (statField && statField !== '___REMOVED___' && statField.trim() !== '') {
      // Parse "Value|Label" or "Value Label" format
      const parts = statField.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        stats.push({ value: parts[0], label: parts[1] });
      } else {
        // Fallback: split by first space to separate value from label
        const words = statField.split(' ');
        if (words.length >= 2) {
          stats.push({ value: words[0], label: words.slice(1).join(' ') });
        } else {
          stats.push({ value: statField, label: '' });
        }
      }
    }
  }

  // Fallback to legacy mission_stats field (pipe-separated)
  if (stats.length === 0 && props.mission_stats) {
    const legacyStats = props.mission_stats.split('|').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < legacyStats.length; i++) {
      const stat = legacyStats[i];
      const words = stat.split(' ');
      if (words.length >= 2) {
        stats.push({ value: words[0], label: words.slice(1).join(' ') });
      } else {
        stats.push({ value: stat, label: '' });
      }
    }
  }

  return stats;
}

export default function MissionQuoteOverlayPublished(props: LayoutComponentProps) {
  const { sectionId, theme } = props;

  // Extract content from flattened props
  const mission_quote = props.mission_quote || 'Our mission is to empower every person to achieve more.';
  const founder_name = props.founder_name || '';
  const founder_title = props.founder_title || 'Founder & CEO';
  const mission_year = props.mission_year || '';
  const cta_text = props.cta_text || 'Join Our Mission';
  const badge_text = props.badge_text || 'Our Mission';
  const badge_icon = props.badge_icon || '🌟';
  const background_image = props.background_image;

  // Parse mission stats
  const missionStats = parseMissionStats(props);

  // Theme detection (server-safe - simplified)
  const uiBlockTheme: UIBlockTheme = 'neutral';
  const colors = getThemeColors(uiBlockTheme);

  // Typography
  const quoteTypography = getPublishedTypographyStyles('h1', theme);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ padding: '4rem 1rem' }}>
      {/* Background layer */}
      <div className="absolute inset-0" style={{ background: colors.bgGradient }}>
        {/* Background image overlay */}
        {background_image && (
          <div className="absolute inset-0">
            <ImagePublished
              src={background_image}
              alt="Mission background"
              className="w-full h-full object-cover"
              style={{ opacity: 0.2 }}
            />
          </div>
        )}

        {/* Decorative pattern overlay */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
          <defs>
            <pattern id="mission-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="white" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mission-pattern)" />
        </svg>

        {/* Floating decorative elements */}
        <div style={{
          position: 'absolute',
          top: '5rem',
          left: '5rem',
          width: '6rem',
          height: '6rem',
          background: colors.floatingBg,
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '8rem',
          right: '10rem',
          width: '8rem',
          height: '8rem',
          background: colors.floatingBg,
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '5rem',
          width: '5rem',
          height: '5rem',
          background: colors.floatingBg,
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}></div>

        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.4)' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full mb-6"
             style={{
               background: colors.badgeBg,
               backdropFilter: 'blur(10px)'
             }}>
          <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{badge_icon}</span>
          <span style={{ color: colors.badgeText, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {badge_text}
          </span>
        </div>

        {/* Mission Quote */}
        <blockquote style={{ marginBottom: '3rem' }}>
          <p style={{
            color: '#ffffff',
            fontSize: '3rem',
            lineHeight: '1.2',
            fontWeight: 700,
            marginBottom: '2rem',
            fontStyle: 'italic',
            ...quoteTypography
          }}>
            {mission_quote}
          </p>
        </blockquote>

        {/* Founder Attribution */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
              {founder_name?.charAt(0) || 'F'}
            </span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: '#ffffff', fontWeight: 600 }}>{founder_name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {founder_title && <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>{founder_title}</p>}
              {founder_title && mission_year && <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>•</span>}
              {mission_year && <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>{mission_year}</p>}
            </div>
          </div>
        </div>

        {/* Mission Stats */}
        {missionStats.length > 0 && (
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl p-6 mb-12"
            style={{ background: colors.statsBg, backdropFilter: 'blur(10px)' }}
          >
            {missionStats.map((stat, idx) => (
              <div key={idx}>
                <div style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {stat.value}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <CTAButtonPublished
          text={cta_text}
          backgroundColor={colors.ctaBg}
          textColor={colors.ctaText}
          className="shadow-2xl hover:shadow-3xl transform hover:-translate-y-0.5 transition-all duration-300"
        />
      </div>
    </div>
  );
}
