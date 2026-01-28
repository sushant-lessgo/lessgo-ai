/**
 * PersonaPanels - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * V2 Schema: Uses personas array instead of pipe-separated strings
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

// V2 Schema types
interface PersonaItem {
  id: string;
  name: string;
  problem: string;
  description: string;
  title: string;
  icon?: string;
  pain_points: string[];
  goals: string[];
}

interface TrustItem {
  id: string;
  text: string;
}

interface PersonaWithColor extends PersonaItem {
  color: {
    bg: string;
    light: string;
    border: string;
    text: string;
  };
}

export default function PersonaPanelsPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Which Business Owner Are You?';
  const subheadline = props.subheadline || '';
  const intro_text = props.intro_text || '';
  const supporting_text = props.supporting_text || '';

  // Detect UI theme
  const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');

  // Color palettes for personas
  const getPersonaColor = (index: number, theme: UIBlockTheme) => {
    const warmColors = [
      { bg: '#f97316', light: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
      { bg: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
      { bg: '#ef4444', light: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
      { bg: '#eab308', light: '#fefce8', border: '#fef08a', text: '#a16207' }
    ];

    const coolColors = [
      { bg: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
      { bg: '#06b6d4', light: '#ecfeff', border: '#a5f3fc', text: '#0e7490' },
      { bg: '#6366f1', light: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
      { bg: '#14b8a6', light: '#f0fdfa', border: '#99f6e4', text: '#0f766e' }
    ];

    const neutralColors = [
      { bg: '#6b7280', light: '#f9fafb', border: '#e5e7eb', text: '#374151' },
      { bg: '#64748b', light: '#f8fafc', border: '#e2e8f0', text: '#334155' },
      { bg: '#71717a', light: '#fafafa', border: '#e4e4e7', text: '#3f3f46' },
      { bg: '#78716c', light: '#fafaf9', border: '#e7e5e4', text: '#44403c' }
    ];

    const colorSets = { warm: warmColors, cool: coolColors, neutral: neutralColors };
    const colors = colorSets[theme];
    return colors[index % colors.length];
  };

  // V2: Get personas array directly (with legacy fallback)
  let personas: PersonaWithColor[] = [];

  if (Array.isArray(props.personas)) {
    // V2 format: personas is already an array
    personas = props.personas.map((p: PersonaItem, index: number) => ({
      ...p,
      color: getPersonaColor(index, uiTheme)
    }));
  } else if (props.persona_names) {
    // Legacy V1 format: parse pipe-separated strings
    const icons = [
      props.persona_icon_1 || '👤',
      props.persona_icon_2 || '👤',
      props.persona_icon_3 || '👤',
      props.persona_icon_4 || '👤'
    ];

    const namesList = (props.persona_names || '').split('|').map((n: string) => n.trim()).filter(Boolean);
    const problemsList = (props.persona_problems || '').split('|').map((p: string) => p.trim());
    const descriptionsList = (props.persona_descriptions || '').split('|').map((d: string) => d.trim());
    const titlesList = (props.persona_titles || '').split('|').map((t: string) => t.trim());
    const painPointsListRaw = (props.persona_pain_points || '').split('|');
    const goalsListRaw = (props.persona_goals || '').split('|');

    personas = namesList.map((name: string, index: number) => ({
      id: `legacy-${index}`,
      name,
      problem: problemsList[index] || '',
      description: descriptionsList[index] || '',
      title: titlesList[index] || '',
      icon: icons[index] || '👤',
      pain_points: painPointsListRaw[index] ? painPointsListRaw[index].split(',').map((p: string) => p.trim()).filter(Boolean) : [],
      goals: goalsListRaw[index] ? goalsListRaw[index].split(',').map((g: string) => g.trim()).filter(Boolean) : [],
      color: getPersonaColor(index, uiTheme)
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

  // First persona shown in detail (static, no state)
  const activePersona = personas[0];

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
                margin: '0 auto'
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

        {/* Persona Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {personas.map((persona, index) => (
            <div
              key={persona.id}
              className="bg-white rounded-2xl border-2 overflow-hidden"
              style={{
                borderColor: index === 0 ? persona.color.border : '#e5e7eb',
                boxShadow: index === 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
                transform: index === 0 ? 'scale(1.05)' : 'none'
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: persona.color.bg }}
                  >
                    <IconPublished
                      icon={persona.icon || '👤'}
                      size={40}
                      className="text-white"
                    />
                  </div>
                  <TextPublished
                    value={persona.name}
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
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
                      {persona.title}
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
                        textAlign: 'center'
                      }}
                    />
                  </div>
                )}

                {/* Indicator */}
                <div className="text-center">
                  <div
                    className="inline-flex items-center px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: index === 0 ? persona.color.light : '#f3f4f6',
                      color: index === 0 ? persona.color.text : '#4b5563'
                    }}
                  >
                    {index === 0 ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">This is me!</span>
                      </>
                    ) : (
                      <span className="text-sm">Click to select</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Persona Details */}
        {activePersona && (
          <div
            className="rounded-2xl p-8 border mb-16"
            style={{
              background: `linear-gradient(to bottom right, ${activePersona.color.light}, white)`,
              borderColor: activePersona.color.border
            }}
          >
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: activePersona.color.bg }}
              >
                <IconPublished
                  icon={activePersona.icon || '👤'}
                  size={40}
                  className="text-white"
                />
              </div>
              <div>
                <TextPublished
                  value={activePersona.name}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#111827'
                  }}
                />
                {activePersona.title && (
                  <TextPublished
                    value={activePersona.title}
                    style={{
                      color: activePersona.color.text,
                      fontWeight: 500
                    }}
                  />
                )}
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-8">
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                Your Current Challenge:
              </h4>
              <TextPublished
                value={activePersona.problem}
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
              <div>
                <h4 className="flex items-center" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                  <svg className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Daily Frustrations
                </h4>
                <div className="space-y-3">
                  {activePersona.pain_points.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
                      <TextPublished
                        value={point}
                        style={{ color: '#374151' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <h4 className="flex items-center" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                  <svg className="w-5 h-5 mr-2" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Goals
                </h4>
                <div className="space-y-3">
                  {activePersona.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#22c55e' }}></div>
                      <TextPublished
                        value={goal}
                        style={{ color: '#374151' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
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
                      style={{ color: '#22c55e' }}
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
