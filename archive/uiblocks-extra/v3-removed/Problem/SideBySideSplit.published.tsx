/**
 * SideBySideSplit - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * V2 Schema: Uses arrays instead of pipe-separated strings
 * Keeps semantic red/green for problem/solution, theme accents for VS divider and stats section
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Schema types
interface PointItem {
  id: string;
  text: string;
}

interface StatItem {
  id: string;
  value: string;
  label: string;
}

interface TrustItem {
  id: string;
  text: string;
}

export default function SideBySideSplitPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Two Paths: Which One Are You On?';
  const subheadline = props.subheadline || '';
  const problem_title = props.problem_title || 'The Problem Path';
  const problem_description = props.problem_description || '';
  const solution_preview = props.solution_preview || '';
  const transition_text = props.transition_text || '';
  const call_to_action = props.call_to_action || '';
  const cta_section_message = props.cta_section_message || '';
  const supporting_text = props.supporting_text || '';
  const path_1_icon = props.path_1_icon || '⚠️';
  const path_2_icon = props.path_2_icon || '✓';

  // Detect UI theme for accents
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme-based accent colors (semantic red/green stays for problem/solution)
  const getThemeAccents = (theme: UIBlockTheme) => {
    return {
      warm: {
        vsDividerBg: '#f97316',
        statSectionBg: '#fff7ed',
        statSectionBorder: '#ffedd5',
        trustIconColor: '#f97316'
      },
      cool: {
        vsDividerBg: '#3b82f6',
        statSectionBg: '#eff6ff',
        statSectionBorder: '#dbeafe',
        trustIconColor: '#3b82f6'
      },
      neutral: {
        vsDividerBg: '#6b7280',
        statSectionBg: '#f9fafb',
        statSectionBorder: '#f3f4f6',
        trustIconColor: '#6b7280'
      }
    }[theme];
  };

  const themeAccents = getThemeAccents(uiTheme);

  // V2: Get problem_points array directly (with legacy fallback)
  let problemPoints: PointItem[] = [];

  if (Array.isArray(props.problem_points)) {
    problemPoints = props.problem_points;
  } else if (typeof props.problem_points === 'string' && props.problem_points) {
    problemPoints = props.problem_points.split('|').map((text: string, index: number) => ({
      id: `legacy-pp-${index}`,
      text: text.trim()
    })).filter((p: PointItem) => p.text);
  }

  // V2: Get solution_points array directly (with legacy fallback)
  let solutionPoints: PointItem[] = [];

  if (Array.isArray(props.solution_points)) {
    solutionPoints = props.solution_points;
  } else if (typeof props.solution_points === 'string' && props.solution_points) {
    solutionPoints = props.solution_points.split('|').map((text: string, index: number) => ({
      id: `legacy-sp-${index}`,
      text: text.trim()
    })).filter((p: PointItem) => p.text);
  }

  // V2: Get bottom_stats array directly (with legacy fallback)
  let bottomStats: StatItem[] = [];

  if (Array.isArray(props.bottom_stats)) {
    bottomStats = props.bottom_stats;
  } else {
    // Legacy format: individual fields
    const legacyStats = [
      { value: props.bottom_stat_1, label: props.bottom_stat_1_label },
      { value: props.bottom_stat_2, label: props.bottom_stat_2_label },
      { value: props.bottom_stat_3, label: props.bottom_stat_3_label }
    ];

    bottomStats = legacyStats
      .filter(s => s.value && s.value !== '___REMOVED___')
      .map((s, index) => ({
        id: `legacy-stat-${index}`,
        value: s.value || '',
        label: s.label || ''
      }));
  }

  // V2: Get trust_items array directly (with legacy fallback)
  let trustItemsList: string[] = [];

  if (Array.isArray(props.trust_items)) {
    trustItemsList = props.trust_items.map((t: TrustItem) => t.text);
  } else if (typeof props.trust_items === 'string' && props.trust_items) {
    trustItemsList = props.trust_items.split('|').map((item: string) => item.trim()).filter(Boolean);
  }

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // Stat colors cycle through red, green, blue
  const getStatColor = (index: number) => {
    const colors = ['#dc2626', '#16a34a', '#2563eb'];
    return colors[index % colors.length];
  };

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
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
                fontSize: '1.125rem',
                marginBottom: '2rem',
                maxWidth: '48rem',
                margin: '0 auto'
              }}
            />
          )}
        </div>

        {/* Main Split Section */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 lg:mb-16">

          {/* Problem Side - Always Red */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div style={{ backgroundColor: '#ef4444', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                PATH 1
              </div>
            </div>

            <div
              className="rounded-2xl p-6 md:p-8 h-full"
              style={{
                background: 'linear-gradient(to bottom right, #fef2f2, #fff7ed)',
                border: '2px solid #fecaca'
              }}
            >
              <div className="text-center mb-6 md:mb-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <IconPublished
                    icon={path_1_icon}
                    size={40}
                    className="text-white"
                  />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                  {problem_title}
                </h3>
              </div>

              <div className="mb-6 md:mb-8">
                <TextPublished
                  value={problem_description}
                  style={{ color: '#374151', lineHeight: '1.75' }}
                />
              </div>

              {/* Problem Points */}
              <div className="space-y-3 md:space-y-4">
                {problemPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <TextPublished
                      value={point.text}
                      style={{ color: '#374151', fontWeight: 500 }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6 md:mt-8">
                <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Solution Side - Always Green */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div style={{ backgroundColor: '#22c55e', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                PATH 2
              </div>
            </div>

            <div
              className="rounded-2xl p-6 md:p-8 h-full"
              style={{
                background: 'linear-gradient(to bottom right, #f0fdf4, #eff6ff)',
                border: '2px solid #bbf7d0'
              }}
            >
              <div className="text-center mb-6 md:mb-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  <IconPublished
                    icon={path_2_icon}
                    size={40}
                    className="text-white"
                  />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                  The Solution Path
                </h3>
              </div>

              <div className="mb-6 md:mb-8">
                <TextPublished
                  value={solution_preview}
                  style={{ color: '#374151', lineHeight: '1.75' }}
                />
              </div>

              {/* Solution Points */}
              <div className="space-y-3 md:space-y-4">
                {solutionPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: '#22c55e' }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <TextPublished
                      value={point.text}
                      style={{ color: '#374151', fontWeight: 500 }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6 md:mt-8">
                <svg className="w-8 h-8" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Transition Section */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            {/* VS Divider - Theme accent color */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #d1d5db)' }}></div>
              <div
                className="mx-8 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeAccents.vsDividerBg }}
              >
                <span className="text-white font-bold text-lg">VS</span>
              </div>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #d1d5db)' }}></div>
            </div>

            {transition_text && (
              <div
                className="rounded-xl p-6 mb-8"
                style={{
                  backgroundColor: themeAccents.statSectionBg,
                  border: `1px solid ${themeAccents.statSectionBorder}`
                }}
              >
                <TextPublished
                  value={transition_text}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}
                />
              </div>
            )}

            {call_to_action && (
              <div
                className="rounded-2xl p-8"
                style={{ background: 'linear-gradient(to right, #16a34a, #2563eb)' }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
                  {call_to_action}
                </h3>
                {cta_section_message && (
                  <TextPublished
                    value={cta_section_message}
                    style={{
                      color: '#bbf7d0',
                      marginBottom: '2rem',
                      maxWidth: '42rem',
                      margin: '0 auto 2rem'
                    }}
                  />
                )}
                <button
                  className="px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#2563eb',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  Choose the Better Path
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Statistics - Theme accent background */}
        {bottomStats.length > 0 && (
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: themeAccents.statSectionBg,
              border: `1px solid ${themeAccents.statSectionBorder}`
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', textAlign: 'center', marginBottom: '2rem' }}>
              The Results Speak for Themselves
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {bottomStats.map((stat, index) => (
                <div key={stat.id} className="text-center">
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: getStatColor(index), marginBottom: '0.5rem' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: textColors.muted, marginBottom: '0.5rem' }}>
                    {index === 2 ? 'faster growth' : 'of businesses'}
                  </div>
                  <TextPublished
                    value={stat.label}
                    style={{ fontSize: '0.875rem', color: '#374151' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Text and Trust Items */}
        {(supporting_text || trustItemsList.length > 0) && (
          <div className="text-center space-y-6 mt-12">
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

            {trustItemsList.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {trustItemsList.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: themeAccents.trustIconColor }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ color: textColors.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
