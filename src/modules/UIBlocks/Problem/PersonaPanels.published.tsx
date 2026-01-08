/**
 * PersonaPanels - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Note: All personas shown statically, first persona's details displayed
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getPublishedTypographyStyles, getPublishedTextColors } from '@/lib/publishedTextColors';
import { HeadlinePublished, TextPublished } from '@/components/published/TextPublished';
import { IconPublished } from '@/components/published/IconPublished';
import { SectionWrapperPublished } from '@/components/published/SectionWrapperPublished';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface Persona {
  name: string;
  problem: string;
  description: string;
  title: string;
  painPoints: string[];
  goals: string[];
  icon: string;
  color: {
    bg: string;
    light: string;
    border: string;
    text: string;
  };
}

export default function PersonaPanelsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props (flattened by LandingPagePublishedRenderer)
  const headline = props.headline || 'Which Business Owner Are You?';
  const subheadline = props.subheadline || '';
  const intro_text = props.intro_text || '';
  const supporting_text = props.supporting_text || '';
  const trust_items = props.trust_items || '';

  // Extract pipe-separated fields
  const persona_names = props.persona_names || '';
  const persona_problems = props.persona_problems || '';
  const persona_descriptions = props.persona_descriptions || '';
  const persona_titles = props.persona_titles || '';
  const persona_pain_points = props.persona_pain_points || '';
  const persona_goals = props.persona_goals || '';

  // Extract icons
  const icons = [
    props.persona_icon_1 || '💼',
    props.persona_icon_2 || '💼',
    props.persona_icon_3 || '💼',
    props.persona_icon_4 || '💼',
  ];

  // Parse all arrays
  const nameList = persona_names.split('|').map((t: string) => t.trim()).filter((t: string) => t && t !== '___REMOVED___');
  const problemList = persona_problems.split('|').map((d: string) => d.trim()).filter((d: string) => d && d !== '___REMOVED___');
  const descriptionList = persona_descriptions ? persona_descriptions.split('|').map((d: string) => d.trim()) : [];
  const titleList = persona_titles ? persona_titles.split('|').map((t: string) => t.trim()) : [];

  const painPointsList = persona_pain_points
    ? persona_pain_points.split('|').map((item: string) =>
        item.trim().split(',').map(point => point.trim()).filter(Boolean)
      )
    : [];

  const goalsList = persona_goals
    ? persona_goals.split('|').map((item: string) =>
        item.trim().split(',').map(goal => goal.trim()).filter(Boolean)
      )
    : [];

  // Parse trust items
  const trustItemsList = trust_items
    ? trust_items.split('|').map((item: string) => item.trim()).filter(Boolean)
    : [];

  // Detect theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Color mapping with hex values for each theme and persona variant
  const getPersonaColors = (index: number, theme: UIBlockTheme) => {
    const warmPersonas = [
      { bg: '#f97316', light: '#fff7ed', border: '#fed7aa', text: '#7c2d12' }, // orange
      { bg: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#78350f' }, // amber
      { bg: '#ef4444', light: '#fef2f2', border: '#fecaca', text: '#7f1d1d' }, // red
      { bg: '#eab308', light: '#fefce8', border: '#fef08a', text: '#713f12' }  // yellow
    ];

    const coolPersonas = [
      { bg: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' }, // blue
      { bg: '#06b6d4', light: '#ecfeff', border: '#a5f3fc', text: '#164e63' }, // cyan
      { bg: '#6366f1', light: '#eef2ff', border: '#c7d2fe', text: '#312e81' }, // indigo
      { bg: '#14b8a6', light: '#f0fdfa', border: '#99f6e4', text: '#134e4a' }  // teal
    ];

    const neutralPersonas = [
      { bg: '#6b7280', light: '#f9fafb', border: '#e5e7eb', text: '#374151' }, // gray
      { bg: '#64748b', light: '#f8fafc', border: '#e2e8f0', text: '#334155' }, // slate
      { bg: '#71717a', light: '#fafafa', border: '#e4e4e7', text: '#3f3f46' }, // zinc
      { bg: '#78716c', light: '#fafaf9', border: '#e7e5e4', text: '#44403c' }  // stone
    ];

    const colorSets = { warm: warmPersonas, cool: coolPersonas, neutral: neutralPersonas };
    return colorSets[theme][index % 4];
  };

  // Build personas array
  const personas: Persona[] = nameList.map((name: string, index: number) => ({
    name,
    problem: problemList[index] || '',
    description: descriptionList[index] || '',
    title: titleList[index] || '',
    painPoints: painPointsList[index] || [],
    goals: goalsList[index] || [],
    icon: icons[index] || '💼',
    color: getPersonaColors(index, uiTheme)
  }));

  // Get text colors
  const textColors = getPublishedTextColors(
    backgroundType || 'neutral',
    theme,
    sectionBackgroundCSS
  );

  // Typography styles
  const headlineTypography = getPublishedTypographyStyles('h2', theme);
  const bodyTypography = getPublishedTypographyStyles('body-lg', theme);

  // First persona for detailed view
  const firstPersona = personas[0];

  return (
    <SectionWrapperPublished
      sectionId={sectionId}
      background={sectionBackgroundCSS}
      padding="normal"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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
                margin: '0 auto 2rem'
              }}
            />
          )}

          {intro_text && (
            <div className="max-w-4xl mx-auto mb-8">
              <TextPublished
                value={intro_text}
                style={{
                  color: textColors.body,
                  ...bodyTypography,
                  fontSize: '1.125rem',
                  lineHeight: '1.75'
                }}
              />
            </div>
          )}
        </div>

        {/* Persona Selection Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {personas.map((persona: Persona, index: number) => (
            <div
              key={`persona-${index}`}
              className="bg-white rounded-2xl border-2 transition-all duration-300"
              style={{
                borderColor: index === 0 ? persona.color.border : '#e5e7eb'
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4"
                    style={{ backgroundColor: persona.color.bg }}
                  >
                    <IconPublished
                      icon={persona.icon}
                      size={48}
                      className="text-3xl"
                    />
                  </div>
                  <TextPublished
                    value={persona.name}
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                  {persona.title && (
                    <div
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: persona.color.light,
                        color: persona.color.text
                      }}
                    >
                      <TextPublished
                        value={persona.title}
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                {persona.description && (
                  <div className="text-center mb-6">
                    <TextPublished
                      value={persona.description}
                      style={{
                        color: textColors.muted,
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}

                {/* Indicator - First persona is "selected" */}
                <div className="text-center">
                  <div
                    className="inline-flex items-center px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: index === 0 ? persona.color.light : '#f3f4f6',
                      color: index === 0 ? persona.color.text : '#6b7280'
                    }}
                  >
                    {index === 0 ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Featured Profile</span>
                      </>
                    ) : (
                      <span className="text-sm">Profile {index + 1}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* First Persona Details */}
        {firstPersona && (
          <div
            className="rounded-2xl p-8 border mb-16"
            style={{
              background: `linear-gradient(to bottom right, ${firstPersona.color.light}, #ffffff)`,
              borderColor: firstPersona.color.border
            }}
          >
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: firstPersona.color.bg }}
              >
                <IconPublished
                  icon={firstPersona.icon}
                  size={48}
                  className="text-3xl"
                />
              </div>
              <div>
                <TextPublished
                  value={firstPersona.name}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '0.25rem'
                  }}
                />
                {firstPersona.title && (
                  <TextPublished
                    value={firstPersona.title}
                    style={{
                      color: firstPersona.color.text,
                      fontWeight: 500
                    }}
                  />
                )}
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-8">
              <h4
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem'
                }}
              >
                Your Current Challenge:
              </h4>
              <TextPublished
                value={firstPersona.problem}
                style={{
                  color: '#374151',
                  lineHeight: '1.75',
                  fontSize: '1.125rem'
                }}
              />
            </div>

            {/* Pain Points and Goals Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pain Points */}
              {firstPersona.painPoints.length > 0 && (
                <div>
                  <h4
                    className="flex items-center"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '1rem'
                    }}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      style={{ color: '#ef4444' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Daily Frustrations
                  </h4>
                  <div className="space-y-3">
                    {firstPersona.painPoints.map((point: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: '#ef4444' }}
                        />
                        <TextPublished
                          value={point}
                          style={{
                            color: '#374151',
                            flex: 1
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {firstPersona.goals.length > 0 && (
                <div>
                  <h4
                    className="flex items-center"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '1rem'
                    }}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      style={{ color: '#10b981' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Your Goals
                  </h4>
                  <div className="space-y-3">
                    {firstPersona.goals.map((goal: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: '#10b981' }}
                        />
                        <TextPublished
                          value={goal}
                          style={{
                            color: '#374151',
                            flex: 1
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                {trustItemsList.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: '#10b981' }}
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
