/**
 * PersonaResultPanels - Published Version
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

// Persona panel structure
interface PersonaPanel {
  persona: string;
  role: string;
  result_metric: string;
  result_description: string;
  key_benefits: string;
  id: string;
}

export default function PersonaResultPanelsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Results That Matter to Every Role';
  const subheadline = props.subheadline || '';
  const footer_text = props.footer_text || '';

  // Parse pipe-separated persona data
  const personas = props.personas || '';
  const roles = props.roles || '';
  const result_metrics = props.result_metrics || '';
  const result_descriptions = props.result_descriptions || '';
  const key_benefits = props.key_benefits || '';

  const personaList = personas.split('|').map(p => p.trim()).filter(p => p && p !== '___REMOVED___');
  const roleList = roles.split('|').map(r => r.trim());
  const metricList = result_metrics.split('|').map(m => m.trim());
  const descList = result_descriptions.split('|').map(d => d.trim());
  const benefitList = key_benefits.split('|').map(b => b.trim());

  const panels: PersonaPanel[] = personaList.map((persona, idx) => ({
    id: `persona-${idx}`,
    persona,
    role: roleList[idx] || 'Team Member',
    result_metric: metricList[idx] || '100% Better',
    result_description: descList[idx] || 'Amazing results',
    key_benefits: benefitList[idx] || 'Great benefits'
  }));

  // Get persona icon
  const getPersonaIcon = (index: number): string => {
    const iconFields = ['persona_icon_1', 'persona_icon_2', 'persona_icon_3', 'persona_icon_4', 'persona_icon_5', 'persona_icon_6'];
    return props[iconFields[index]] || ['📢', '📈', '⚙️', '⚡', '👥', '👤'][index] || '👤';
  };

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
                                 (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme colors (HEX for inline styles) - 2-variant rotation
  const getPersonaColors = (index: number, theme: UIBlockTheme) => {
    const isEven = index % 2 === 0;

    const colorMap = {
      warm: {
        primary: { bg: '#fff7ed', accent: '#f97316', border: '#fed7aa', icon: '#ea580c' },
        secondary: { bg: '#fef3c7', accent: '#f59e0b', border: '#fde68a', icon: '#d97706' }
      },
      cool: {
        primary: { bg: '#eff6ff', accent: '#3b82f6', border: '#bfdbfe', icon: '#2563eb' },
        secondary: { bg: '#eef2ff', accent: '#6366f1', border: '#c7d2fe', icon: '#4f46e5' }
      },
      neutral: {
        primary: { bg: '#f9fafb', accent: '#6b7280', border: '#e5e7eb', icon: '#4b5563' },
        secondary: { bg: '#f1f5f9', accent: '#64748b', border: '#e2e8f0', icon: '#475569' }
      }
    };

    return colorMap[theme][isEven ? 'primary' : 'secondary'];
  };

  // Grid layout
  const gridCols = panels.length === 2 ? 'md:grid-cols-2 max-w-5xl' :
                   panels.length === 3 ? 'md:grid-cols-1 lg:grid-cols-3' :
                   panels.length === 4 ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4' :
                   'md:grid-cols-2 lg:grid-cols-3';

  // Text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem'
            }}
          />

          {subheadline && subheadline !== '___REMOVED___' && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '1.5rem auto 0'
              }}
            />
          )}
        </div>

        {/* Persona Panels Grid */}
        <div className={`grid gap-8 ${gridCols} mx-auto`}>
          {panels.map((panel, idx) => {
            const colors = getPersonaColors(idx, uiTheme);
            const benefits = panel.key_benefits.split(',').map(b => b.trim()).filter(b => b);

            return (
              <div
                key={panel.id}
                className="relative p-8 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border
                }}
              >
                {/* Header with Icon */}
                <div className="flex items-center space-x-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <IconPublished icon={getPersonaIcon(idx)} size={32} />
                  </div>

                  <div>
                    <h3 style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.125rem' }}>
                      {panel.persona}
                    </h3>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.icon, marginTop: '0.25rem' }}>
                      {panel.role}
                    </p>
                  </div>
                </div>

                {/* Result Metric Badge */}
                <div className="mb-6">
                  <div
                    className="inline-flex items-center px-4 py-2 rounded-lg text-white font-bold text-lg"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {panel.result_metric}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <TextPublished
                    value={panel.result_description}
                    style={{
                      color: '#4b5563',
                      lineHeight: '1.75'
                    }}
                  />
                </div>

                {/* Key Benefits */}
                {benefits.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      Key Benefits:
                    </h4>
                    <ul className="space-y-2">
                      {benefits.map((benefit, bidx) => (
                        <li key={bidx} className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: colors.icon }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Badge - Keep neutral gray per user decision */}
        {footer_text && footer_text !== '___REMOVED___' && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 border rounded-full"
              style={{
                background: 'linear-gradient(to right, #f9fafb, #f1f5f9)',
                borderColor: '#e5e7eb',
                color: '#1f2937'
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#6b7280' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontWeight: 500 }}>{footer_text}</span>
            </div>
          </div>
        )}

      </div>
    </SectionWrapperPublished>
  );
}
