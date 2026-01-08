/**
 * BeforeImageAfterText - Published Version
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

export default function BeforeImageAfterTextPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Transform Your Workflow';
  const subheadline = props.subheadline || '';
  const before_description = props.before_description || '';
  const after_description = props.after_description || '';
  const before_after_image = props.before_after_image || '';
  const image_caption = props.image_caption || '';
  const supporting_text = props.supporting_text || '';
  const trust_items = props.trust_items || '';

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Color mapping based on theme - Before is always red (problem), After varies by theme
  const getAfterColors = (theme: UIBlockTheme) => {
    const colorMap = {
      warm: {
        bg: '#fff7ed',
        badgeBg: '#ffedd5',
        badgeText: '#9a3412',
        border: '#f97316',
        dot: '#f97316',
        accent: '#ea580c',
        iconColor: '#f97316'
      },
      cool: {
        bg: '#eff6ff',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af',
        border: '#3b82f6',
        dot: '#3b82f6',
        accent: '#2563eb',
        iconColor: '#3b82f6'
      },
      neutral: {
        bg: '#f9fafb',
        badgeBg: '#f3f4f6',
        badgeText: '#374151',
        border: '#6b7280',
        dot: '#6b7280',
        accent: '#4b5563',
        iconColor: '#6b7280'
      }
    };
    return colorMap[theme];
  };

  const afterColors = getAfterColors(uiTheme);

  // Parse trust items
  const trustItemsList = trust_items
    ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean)
    : [];

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);
  const h3Typography = getPublishedTypographyStyles('h3', theme);

  // Default Before/After mockup component (when no image uploaded)
  const BeforeAfterMockup = () => (
    <div className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
      {/* Browser/App Interface Mockup */}
      <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-gray-300 text-sm text-center">
          Before vs After
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="grid grid-cols-2 min-h-[400px]">
        {/* Before Side - Chaotic (always red for problem) */}
        <div className="bg-red-50 p-6 border-r-2 border-gray-300">
          <div className="h-full flex flex-col">
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                BEFORE
              </div>
            </div>

            {/* Chaotic Elements */}
            <div className="space-y-4 flex-1">
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">Urgent Tasks</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">24</span>
                </div>
                <div className="text-xs text-gray-600">Overdue items pile up daily</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Team Productivity</span>
                  <span className="text-red-600 font-bold">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">Communication</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Email chains</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Slack chaos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Missed messages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* After Side - Organized (theme-based colors) */}
        <div className="p-6" style={{ backgroundColor: afterColors.bg }}>
          <div className="h-full flex flex-col">
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: afterColors.badgeBg,
                  color: afterColors.badgeText
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AFTER
              </div>
            </div>

            {/* Organized Elements */}
            <div className="space-y-4 flex-1">
              <div className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `4px solid ${afterColors.border}` }}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: afterColors.dot }}></div>
                  <span className="text-sm font-medium text-gray-900">Tasks Completed</span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: afterColors.badgeBg,
                      color: afterColors.badgeText
                    }}
                  >
                    87%
                  </span>
                </div>
                <div className="text-xs text-gray-600">Automated prioritization</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Team Productivity</span>
                  <span className="font-bold" style={{ color: afterColors.accent }}>94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ backgroundColor: afterColors.dot, width: '92%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">Communication</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: afterColors.dot }}></div>
                    <span className="text-xs text-gray-600">Centralized hub</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: afterColors.dot }}></div>
                    <span className="text-xs text-gray-600">Auto notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: afterColors.dot }}></div>
                    <span className="text-xs text-gray-600">Clear visibility</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      {image_caption && (
        <div className="bg-gray-800 px-4 py-2 text-center">
          <p className="text-gray-300 text-sm">{image_caption}</p>
        </div>
      )}
    </div>
  );

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

        <div className="space-y-12">
          {/* Visual Before/After Comparison */}
          {before_after_image && before_after_image !== '' ? (
            <div className="relative w-full">
              <ImagePublished
                src={before_after_image}
                alt={image_caption || 'Before and After Comparison'}
                className="w-full h-auto rounded-2xl shadow-lg"
              />
              {image_caption && (
                <div className="mt-4 text-center">
                  <TextPublished
                    value={image_caption}
                    style={{
                      color: textColors.muted,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <BeforeAfterMockup />
          )}

          {/* Before/After Descriptions */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Before Description */}
            <div className="space-y-4">
              <h3
                style={{
                  color: textColors.heading,
                  ...h3Typography,
                  fontSize: '1.125rem',
                  fontWeight: 600
                }}
              >
                Before
              </h3>
              <TextPublished
                value={before_description}
                style={{
                  color: textColors.body,
                  lineHeight: '1.75'
                }}
              />
            </div>

            {/* After Description */}
            <div className="space-y-4">
              <h3
                style={{
                  color: textColors.heading,
                  ...h3Typography,
                  fontSize: '1.125rem',
                  fontWeight: 600
                }}
              >
                After
              </h3>
              <TextPublished
                value={after_description}
                style={{
                  color: textColors.body,
                  lineHeight: '1.75'
                }}
              />
            </div>
          </div>
        </div>

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
                {trustItemsList.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: afterColors.iconColor }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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
