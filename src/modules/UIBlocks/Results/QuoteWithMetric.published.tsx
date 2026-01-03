/**
 * QuoteWithMetric - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { AvatarPublished } from '@/components/published/AvatarPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Quote with metric structure
interface QuoteMetric {
  quote: string;
  author: string;
  company: string;
  role: string;
  metric_label: string;
  metric_value: string;
  id: string;
}

export default function QuoteWithMetricPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'What Industry Leaders Say About Our Impact';
  const subheadline = props.subheadline || '';
  const footer_text = props.footer_text || '';

  // Parse pipe-separated quote data
  const quotes = props.quotes || '';
  const authors = props.authors || '';
  const companies = props.companies || '';
  const roles = props.roles || '';
  const metric_labels = props.metric_labels || '';
  const metric_values = props.metric_values || '';

  const quoteList = quotes.split('|').map(q => q.trim()).filter(q => q && q !== '___REMOVED___');
  const authorList = authors.split('|').map(a => a.trim());
  const companyList = companies.split('|').map(c => c.trim());
  const roleList = roles.split('|').map(r => r.trim());
  const metricLabelList = metric_labels.split('|').map(m => m.trim());
  const metricValueList = metric_values.split('|').map(m => m.trim());

  const quoteMetrics: QuoteMetric[] = quoteList.map((quote, idx) => ({
    id: `quote-${idx}`,
    quote,
    author: authorList[idx] || 'Anonymous',
    company: companyList[idx] || 'Company',
    role: roleList[idx] || 'Team Member',
    metric_label: metricLabelList[idx] || 'Result',
    metric_value: metricValueList[idx] || '0%'
  }));

  // Get avatar initials
  const getAvatarInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get avatar color (consistent with base component)
  const getAvatarColor = (name: string): string => {
    const colors = [
      { from: '#60a5fa', to: '#2563eb' }, // blue
      { from: '#34d399', to: '#059669' }, // emerald
      { from: '#a78bfa', to: '#7c3aed' }, // violet
      { from: '#fb923c', to: '#ea580c' }, // orange
      { from: '#f472b6', to: '#db2777' }, // pink
      { from: '#818cf8', to: '#4f46e5' }  // indigo
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length].from; // Use 'from' color for solid background
  };

  // Quote icon
  const quote_icon = props.quote_icon || '💬';
  const credibility_icon = props.credibility_icon || '🔒';

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride ||
                                 (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Theme colors (HEX for inline styles)
  const getCardColors = (theme: UIBlockTheme) => {
    return {
      warm: { border: '#fed7aa', shadow: '0 4px 20px rgba(249,115,22,0.15)' },
      cool: { border: '#bfdbfe', shadow: '0 4px 20px rgba(37,99,235,0.15)' },
      neutral: { border: '#e5e7eb', shadow: '0 4px 20px rgba(100,116,139,0.15)' }
    }[theme];
  };

  const getMetricColors = (theme: UIBlockTheme) => {
    return {
      warm: { bgFrom: '#fff7ed', bgTo: '#fef3c7', value: '#7c2d12', label: '#c2410c' },
      cool: { bgFrom: '#eff6ff', bgTo: '#eef2ff', value: '#1e3a8a', label: '#1d4ed8' },
      neutral: { bgFrom: '#f9fafb', bgTo: '#f1f5f9', value: '#111827', label: '#374151' }
    }[theme];
  };

  const getAccentColors = (theme: UIBlockTheme) => {
    return {
      warm: { quoteIcon: '#f97316' },
      cool: { quoteIcon: '#3b82f6' },
      neutral: { quoteIcon: '#6b7280' }
    }[theme];
  };

  const cardColors = getCardColors(uiTheme);
  const metricColors = getMetricColors(uiTheme);
  const accentColors = getAccentColors(uiTheme);

  // Grid layout
  const gridCols = quoteMetrics.length === 1 ? 'max-w-2xl mx-auto' :
                   quoteMetrics.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' :
                   quoteMetrics.length === 3 ? 'md:grid-cols-1 lg:grid-cols-3' :
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

        {/* Quotes Grid */}
        <div className={`grid gap-8 ${gridCols}`}>
          {quoteMetrics.map((quoteMetric, idx) => (
            <div
              key={quoteMetric.id}
              className="relative bg-white rounded-2xl border overflow-hidden transition-all duration-300"
              style={{
                borderColor: cardColors.border,
                boxShadow: cardColors.shadow
              }}
            >
              {/* Quote Section */}
              <div className="p-8 pb-6">
                {/* Quote Icon */}
                <div className="mb-6">
                  <IconPublished
                    icon={quote_icon}
                    size={40}
                    style={{
                      color: accentColors.quoteIcon,
                      opacity: 0.2
                    }}
                  />
                </div>

                {/* Quote Text */}
                <blockquote style={{ color: '#111827', lineHeight: '1.75', marginBottom: '1.5rem' }}>
                  "{quoteMetric.quote}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center space-x-4 mb-6">
                  {/* Avatar */}
                  <AvatarPublished
                    name={quoteMetric.author}
                    size={48}
                    style={{
                      backgroundColor: getAvatarColor(quoteMetric.author),
                      color: '#ffffff'
                    }}
                  />

                  {/* Author Details */}
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {quoteMetric.author}
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      {quoteMetric.role}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {quoteMetric.company}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Section */}
              <div
                className="px-8 py-6 border-t"
                style={{
                  background: `linear-gradient(to right, ${metricColors.bgFrom}, ${metricColors.bgTo})`,
                  borderColor: '#f3f4f6'
                }}
              >
                <div className="text-center">
                  {/* Metric Value */}
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: metricColors.value,
                      marginBottom: '0.5rem',
                      fontSize: '1.875rem'
                    }}
                  >
                    {quoteMetric.metric_value}
                  </div>

                  {/* Metric Label */}
                  <div
                    style={{
                      fontWeight: 500,
                      color: metricColors.label
                    }}
                  >
                    {quoteMetric.metric_label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credibility Footer - Keep neutral green per user decision */}
        {footer_text && footer_text !== '___REMOVED___' && (
          <div className="mt-16 text-center">
            <div
              className="inline-flex items-center px-6 py-3 border rounded-full"
              style={{
                background: 'linear-gradient(to right, #d1fae5, #a7f3d0)',
                borderColor: '#a7f3d0',
                color: '#065f46'
              }}
            >
              <IconPublished
                icon={credibility_icon}
                size={18}
                style={{
                  color: '#059669',
                  marginRight: '0.5rem'
                }}
              />
              <span style={{ fontWeight: 500 }}>{footer_text}</span>
            </div>
          </div>
        )}

      </div>
    </SectionWrapperPublished>
  );
}
