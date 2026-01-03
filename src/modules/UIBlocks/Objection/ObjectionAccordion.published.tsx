/**
 * ObjectionAccordion - Published Version
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

// Objection item structure
interface ObjectionItem {
  title: string;
  response: string;
  icon?: string;
}

// Parse objection data from props
const parseObjectionData = (props: any): ObjectionItem[] => {
  const objections: ObjectionItem[] = [];

  // Process individual fields
  const individualFields = [
    { objection: props.objection_1, response: props.response_1, icon: props.objection_icon_1 },
    { objection: props.objection_2, response: props.response_2, icon: props.objection_icon_2 },
    { objection: props.objection_3, response: props.response_3, icon: props.objection_icon_3 },
    { objection: props.objection_4, response: props.response_4, icon: props.objection_icon_4 },
    { objection: props.objection_5, response: props.response_5, icon: props.objection_icon_5 },
    { objection: props.objection_6, response: props.response_6, icon: props.objection_icon_6 }
  ];

  individualFields.forEach((field) => {
    if (field.objection && field.objection.trim() && field.objection !== '___REMOVED___') {
      objections.push({
        title: field.objection.trim(),
        response: field.response?.trim() || 'Response not provided.',
        icon: field.icon || '❓'
      });
    }
  });

  return objections;
};

// Get theme colors based on theme prop
const getObjectionColors = (theme: 'warm' | 'cool' | 'neutral') => {
  const colorMap = {
    warm: {
      objectionBg: '#fff7ed', // orange-50
      objectionBorder: '#fed7aa', // orange-200
      objectionIconBg: '#ffedd5', // orange-100
      objectionIconText: '#ea580c', // orange-600
      responseBg: '#fffbeb', // orange-50 lighter
      responseBorder: '#fed7aa', // orange-200
      responseIconBg: '#ea580c', // orange-600
      responseIconText: '#ffffff',
      responseTextColor: '#9a3412', // orange-800
      trustBg: '#fff7ed', // orange-50
      trustText: '#c2410c' // orange-700
    },
    cool: {
      objectionBg: '#eff6ff', // blue-50
      objectionBorder: '#bfdbfe', // blue-200
      objectionIconBg: '#dbeafe', // blue-100
      objectionIconText: '#2563eb', // blue-600
      responseBg: '#f0f9ff', // blue-50 lighter
      responseBorder: '#bfdbfe', // blue-200
      responseIconBg: '#2563eb', // blue-600
      responseIconText: '#ffffff',
      responseTextColor: '#1e40af', // blue-800
      trustBg: '#eff6ff', // blue-50
      trustText: '#1d4ed8' // blue-700
    },
    neutral: {
      objectionBg: '#fffbeb', // amber-50
      objectionBorder: '#fde68a', // amber-200
      objectionIconBg: '#fef3c7', // amber-100
      objectionIconText: '#d97706', // amber-600
      responseBg: '#fefce8', // amber-50 lighter
      responseBorder: '#fde68a', // amber-200
      responseIconBg: '#d97706', // amber-600
      responseIconText: '#ffffff',
      responseTextColor: '#92400e', // amber-800
      trustBg: '#fffbeb', // amber-50
      trustText: '#b45309' // amber-700
    }
  };
  return colorMap[theme];
};

export default function ObjectionAccordionPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Common Questions & Concerns';
  const subheadline = props.subheadline || '';
  const response_icon = props.response_icon || '✅';
  const trust_icon = props.trust_icon || '✅';
  const help_text = props.help_text || '';

  // Parse objection items
  const objectionItems = parseObjectionData(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getObjectionColors(uiBlockTheme);

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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Objections List - All expanded in published mode */}
        <div className="space-y-4">
          {objectionItems.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden bg-white shadow-sm"
              style={{
                borderColor: colors.objectionBorder
              }}
            >
              {/* Objection Header */}
              <div className="px-6 py-5">
                <div className="flex items-center space-x-4">
                  {/* Objection Icon */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: colors.objectionIconBg,
                      color: colors.objectionIconText
                    }}
                  >
                    <IconPublished icon={item.icon || '❓'} size={24} color={colors.objectionIconText} />
                  </div>

                  {/* Objection Title */}
                  <h3 className="flex-1 font-semibold text-gray-900">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Response Content - Always visible in published mode */}
              <div
                className="px-6 py-5 border-t"
                style={{
                  backgroundColor: colors.responseBg,
                  borderColor: colors.responseBorder
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Response Icon */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base mt-1"
                    style={{
                      backgroundColor: colors.responseIconBg,
                      color: colors.responseIconText
                    }}
                  >
                    <IconPublished icon={response_icon} size={16} color={colors.responseIconText} />
                  </div>

                  {/* Response Text */}
                  <p
                    className="flex-1 leading-relaxed"
                    style={{ color: colors.responseTextColor }}
                  >
                    {item.response}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Reinforcement */}
        {help_text && (
          <div className="mt-12 text-center">
            <div
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm"
              style={{
                backgroundColor: colors.trustBg,
                color: colors.trustText
              }}
            >
              <IconPublished icon={trust_icon} size={16} color={colors.trustText} />
              <span>{help_text}</span>
            </div>
          </div>
        )}
      </div>
    </SectionWrapperPublished>
  );
}
