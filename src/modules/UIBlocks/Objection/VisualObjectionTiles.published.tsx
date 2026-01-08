/**
 * VisualObjectionTiles - Published Version
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

// Tile structure
interface ObjectionTile {
  icon: string;
  objection: string;
  answer: string;
  label?: string;
}

// Parse objection tiles from props
const parseObjectionTiles = (props: any): ObjectionTile[] => {
  const tiles: ObjectionTile[] = [];

  // Process individual fields
  const individualTiles = [
    { objection: props.tile_objection_1, response: props.tile_response_1, label: props.tile_label_1, icon: props.tile_icon_1 },
    { objection: props.tile_objection_2, response: props.tile_response_2, label: props.tile_label_2, icon: props.tile_icon_2 },
    { objection: props.tile_objection_3, response: props.tile_response_3, label: props.tile_label_3, icon: props.tile_icon_3 },
    { objection: props.tile_objection_4, response: props.tile_response_4, label: props.tile_label_4, icon: props.tile_icon_4 },
    { objection: props.tile_objection_5, response: props.tile_response_5, label: props.tile_label_5, icon: props.tile_icon_5 },
    { objection: props.tile_objection_6, response: props.tile_response_6, label: props.tile_label_6, icon: props.tile_icon_6 }
  ];

  individualTiles.forEach((tile) => {
    if (tile.objection && tile.objection.trim() && tile.objection !== '___REMOVED___' &&
        tile.response && tile.response.trim() && tile.response !== '___REMOVED___') {
      tiles.push({
        icon: tile.icon || '💡',
        objection: tile.objection.trim().replace(/"/g, ''),
        answer: tile.response.trim(),
        label: tile.label?.trim()
      });
    }
  });

  return tiles;
};

// Get theme colors based on theme prop
const getTileColors = (theme: 'warm' | 'cool' | 'neutral') => {
  const colorMap = {
    warm: {
      iconBg: { from: '#fff7ed', to: '#ffedd5' }, // orange-50 to orange-100
      border: '#fed7aa', // orange-200
      accent: { from: '#fb923c', to: '#f97316' } // orange-400 to orange-500
    },
    cool: {
      iconBg: { from: '#eff6ff', to: '#dbeafe' }, // blue-50 to indigo-100
      border: '#bfdbfe', // blue-200
      accent: { from: '#60a5fa', to: '#6366f1' } // blue-400 to indigo-500
    },
    neutral: {
      iconBg: { from: '#f9fafb', to: '#f3f4f6' }, // gray-50 to gray-100
      border: '#e5e7eb', // gray-200
      accent: { from: '#9ca3af', to: '#6b7280' } // gray-400 to gray-500
    }
  };
  return colorMap[theme];
};

export default function VisualObjectionTilesPublished(props: LayoutComponentProps) {
  const { sectionId, sectionBackgroundCSS, theme, backgroundType } = props;

  // Extract content from props
  const headline = props.headline || 'Common Concerns? We\'ve Got You Covered';
  const subheadline = props.subheadline || '';

  // Parse objection tiles
  const objectionTiles = parseObjectionTiles(props);

  // Determine theme
  const uiBlockTheme = (props.manualThemeOverride || 'neutral') as 'warm' | 'cool' | 'neutral';
  const colors = getTileColors(uiBlockTheme);

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
        {/* Header Section */}
        <div className="text-center mb-16">
          <HeadlinePublished
            value={headline}
            level="h2"
            style={{
              color: textColors.heading,
              ...headlineTypography,
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          />

          {subheadline && (
            <TextPublished
              value={subheadline}
              style={{
                color: textColors.body,
                ...bodyTypography,
                fontSize: '1.125rem',
                maxWidth: '48rem',
                margin: '0 auto',
                textAlign: 'center'
              }}
            />
          )}
        </div>

        {/* Objection Tiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {objectionTiles.map((tile: ObjectionTile, index: number) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm border rounded-2xl p-8 shadow-lg"
              style={{
                borderColor: colors.border
              }}
            >
              {/* Icon */}
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.iconBg.from}, ${colors.iconBg.to})`
                  }}
                >
                  <IconPublished icon={tile.icon} size={32} />
                </div>
              </div>

              {/* Objection */}
              <div className="mb-4">
                <h3
                  className="text-lg font-bold text-gray-900 mb-3 text-center"
                >
                  {tile.objection}
                </h3>
              </div>

              {/* Answer */}
              <div className="text-center">
                <p className="text-gray-700 leading-relaxed">
                  {tile.answer}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <div
                    className="w-8 h-1 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${colors.accent.from}, ${colors.accent.to})`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapperPublished>
  );
}
