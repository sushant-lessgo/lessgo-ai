// components/layout/VisualObjectionTiles.tsx - Objection UIBlock with visual tile format
// Simple, engaging tiles for addressing common concerns in early-stage markets

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface VisualObjectionTilesContent {
  headline: string;
  subheadline?: string;
  objection_tiles: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Common Concerns? We\'ve Got You Covered'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Here are the questions we hear most often and why they shouldn\'t hold you back.'
  },
  objection_tiles: {
    type: 'string' as const,
    default: '💰|"Too expensive for small teams"|Actually starts at just $10/month with no hidden fees|⏰|"Takes too long to set up"|Most customers are up and running in under 10 minutes|🔧|"Too complex for non-technical users"|Designed with simplicity in mind - no coding required|📊|"Not enough integrations"|Works with 500+ popular tools out of the box|🔒|"Security concerns"|Enterprise-grade security with SOC 2 compliance|⚡|"Will slow down our workflow"|Actually speeds up processes by 3x on average'
  }
};

export default function VisualObjectionTiles(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<VisualObjectionTilesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse objection tiles from pipe-separated string
  const objectionTiles = blockContent.objection_tiles
    ? blockContent.objection_tiles.split('|').reduce((tiles, item, index) => {
        if (index % 3 === 0) {
          tiles.push({ icon: item.trim(), objection: '', answer: '' });
        } else if (index % 3 === 1) {
          tiles[tiles.length - 1].objection = item.trim().replace(/"/g, '');
        } else {
          tiles[tiles.length - 1].answer = item.trim();
        }
        return tiles;
      }, [] as Array<{icon: string, objection: string, answer: string}>)
    : [];

  // Helper function to add a new objection tile
  const handleAddObjectionTile = () => {
    const currentTiles = blockContent.objection_tiles.split('|');
    const newTileData = ['💡', '"New Objection"', 'Address this concern here'];
    const updatedTiles = [...currentTiles, ...newTileData].join('|');
    handleContentUpdate('objection_tiles', updatedTiles);
  };

  // Helper function to remove an objection tile
  const handleRemoveObjectionTile = (indexToRemove: number) => {
    const tiles = blockContent.objection_tiles.split('|');
    const startIndex = indexToRemove * 3;
    tiles.splice(startIndex, 3);
    handleContentUpdate('objection_tiles', tiles.join('|'));
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="VisualObjectionTiles"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a subheadline that introduces the objection handling..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Objection Tiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {objectionTiles.map((tile, index) => (
            <div
              key={index}
              className={`relative group/objection-tile-${index} bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >

              {/* Delete button - only show in edit mode and if more than 1 tile */}
              {mode === 'edit' && objectionTiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveObjectionTile(index);
                  }}
                  className={`absolute top-4 right-4 opacity-0 group-hover/objection-tile-${index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200`}
                  title="Remove this objection"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Icon */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl text-3xl group-hover:scale-110 transition-transform duration-300">
                  <IconEditableText
                    mode={mode}
                    value={tile.icon}
                    onEdit={(value) => {
                      const updatedTiles = blockContent.objection_tiles.split('|');
                      updatedTiles[index * 3] = value;
                      handleContentUpdate('objection_tiles', updatedTiles.join('|'));
                    }}
                    backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                    colorTokens={colorTokens}
                    variant="body"
                    iconSize="xl"
                    placeholder="💰"
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    elementKey={`objection_icon_${index}`}
                  />
                </div>
              </div>

              {/* Objection */}
              <div className="mb-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={tile.objection || ''}
                  onEdit={(value) => {
                    const updatedTiles = blockContent.objection_tiles.split('|');
                    updatedTiles[index * 3 + 1] = `"${value}"`;
                    handleContentUpdate('objection_tiles', updatedTiles.join('|'));
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-lg font-bold text-gray-900 mb-3 text-center"
                  placeholder="Enter objection"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`objection_${index}_text`}
                />
              </div>

              {/* Answer */}
              <div className="text-center">
                <EditableAdaptiveText
                  mode={mode}
                  value={tile.answer || ''}
                  onEdit={(value) => {
                    const updatedTiles = blockContent.objection_tiles.split('|');
                    updatedTiles[index * 3 + 2] = value;
                    handleContentUpdate('objection_tiles', updatedTiles.join('|'));
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 leading-relaxed"
                  placeholder="Enter answer"
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`objection_${index}_answer`}
                />
              </div>

              {/* Bottom accent */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Objection Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && objectionTiles.length < 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleAddObjectionTile}
              className="flex items-center space-x-2 mx-auto px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Objection</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'VisualObjectionTiles',
  category: 'Objection Sections',
  description: 'Interactive tile format for addressing common objections with add/remove functionality.',
  tags: ['objection', 'visual', 'tiles', 'interactive', 'editable'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'objection_tiles', label: 'Objection Tiles (pipe separated: icon|objection|answer)', type: 'textarea', required: true }
  ],

  features: [
    'Visual icons for each objection type',
    'Add/remove objection tiles (1-6 limit)',
    'Hover-based delete buttons in edit mode',
    'Clean, approachable tile design',
    'Hover animations and interactions'
  ],

  useCases: [
    'Early-stage products addressing basic concerns',
    'Simple SaaS tools with straightforward objections',
    'Consumer products with price/complexity concerns',
    'Freemium offerings handling upgrade hesitations'
  ]
};