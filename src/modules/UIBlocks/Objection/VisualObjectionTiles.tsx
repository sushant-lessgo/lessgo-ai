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
  // Pipe-separated fields for cards
  objection_questions?: string;
  objection_responses?: string;
  objection_labels?: string;
  objection_icons?: string;
  // Individual tile fields (up to 6 tiles) - for backward compatibility
  tile_objection_1?: string;
  tile_response_1?: string;
  tile_label_1?: string;
  tile_objection_2?: string;
  tile_response_2?: string;
  tile_label_2?: string;
  tile_objection_3?: string;
  tile_response_3?: string;
  tile_label_3?: string;
  tile_objection_4?: string;
  tile_response_4?: string;
  tile_label_4?: string;
  tile_objection_5?: string;
  tile_response_5?: string;
  tile_label_5?: string;
  tile_objection_6?: string;
  tile_response_6?: string;
  tile_label_6?: string;
  // Tile icons
  tile_icon_1?: string;
  tile_icon_2?: string;
  tile_icon_3?: string;
  tile_icon_4?: string;
  tile_icon_5?: string;
  tile_icon_6?: string;
  // Legacy fields for backward compatibility
  objection_tiles?: string;
  objection_titles?: string;
  tile_labels?: string;
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
  // Individual tile fields
  tile_objection_1: { type: 'string' as const, default: 'Too expensive for small teams' },
  tile_response_1: { type: 'string' as const, default: 'Actually starts at just $10/month with no hidden fees' },
  tile_label_1: { type: 'string' as const, default: 'Pricing' },
  tile_objection_2: { type: 'string' as const, default: 'Takes too long to set up' },
  tile_response_2: { type: 'string' as const, default: 'Most customers are up and running in under 10 minutes' },
  tile_label_2: { type: 'string' as const, default: 'Setup' },
  tile_objection_3: { type: 'string' as const, default: 'Too complex for non-technical users' },
  tile_response_3: { type: 'string' as const, default: 'Designed with simplicity in mind - no coding required' },
  tile_label_3: { type: 'string' as const, default: 'Ease of Use' },
  tile_objection_4: { type: 'string' as const, default: 'Not enough integrations' },
  tile_response_4: { type: 'string' as const, default: 'Works with 500+ popular tools out of the box' },
  tile_label_4: { type: 'string' as const, default: 'Integrations' },
  tile_objection_5: { type: 'string' as const, default: 'Security concerns' },
  tile_response_5: { type: 'string' as const, default: 'Enterprise-grade security with SOC 2 compliance' },
  tile_label_5: { type: 'string' as const, default: 'Security' },
  tile_objection_6: { type: 'string' as const, default: 'Will slow down our workflow' },
  tile_response_6: { type: 'string' as const, default: 'Actually speeds up processes by 3x on average' },
  tile_label_6: { type: 'string' as const, default: 'Performance' },
  // Tile icons
  tile_icon_1: { type: 'string' as const, default: '💰' },
  tile_icon_2: { type: 'string' as const, default: '⏰' },
  tile_icon_3: { type: 'string' as const, default: '🔧' },
  tile_icon_4: { type: 'string' as const, default: '📊' },
  tile_icon_5: { type: 'string' as const, default: '🔒' },
  tile_icon_6: { type: 'string' as const, default: '⚡' },
  // Legacy fields for backward compatibility
  objection_tiles: {
    type: 'string' as const,
    default: '💰|Too expensive for small teams|Actually starts at just $10/month with no hidden fees|⏰|Takes too long to set up|Most customers are up and running in under 10 minutes|🔧|Too complex for non-technical users|Designed with simplicity in mind - no coding required|📊|Not enough integrations|Works with 500+ popular tools out of the box|🔒|Security concerns|Enterprise-grade security with SOC 2 compliance|⚡|Will slow down our workflow|Actually speeds up processes by 3x on average'
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

  // Parse objection tiles from both individual and legacy formats
  const parseObjectionTiles = (content: VisualObjectionTilesContent): Array<{icon: string, objection: string, answer: string, label?: string, index: number}> => {
    const tiles: Array<{icon: string, objection: string, answer: string, label?: string, index: number}> = [];

    // First check for new pipe-separated format (preferred)
    if (content.objection_questions && content.objection_responses) {
      const questions = content.objection_questions.split('|').map(q => q.trim()).filter(q => q);
      const responses = content.objection_responses.split('|').map(r => r.trim()).filter(r => r);
      const labels = content.objection_labels ? content.objection_labels.split('|').map(l => l.trim()) : [];
      const icons = content.objection_icons ? content.objection_icons.split('|').map(i => i.trim()) : [];

      const maxLength = Math.min(questions.length, responses.length);
      for (let i = 0; i < maxLength; i++) {
        tiles.push({
          icon: icons[i] || getDefaultTileIcon(questions[i]),
          objection: questions[i].replace(/"/g, ''),
          answer: responses[i],
          label: labels[i] || undefined,
          index: i
        });
      }
    }
    // Check for individual fields (backward compatibility)
    else {
      const individualTiles = [
        { objection: content.tile_objection_1, response: content.tile_response_1, label: content.tile_label_1, icon: content.tile_icon_1 },
        { objection: content.tile_objection_2, response: content.tile_response_2, label: content.tile_label_2, icon: content.tile_icon_2 },
        { objection: content.tile_objection_3, response: content.tile_response_3, label: content.tile_label_3, icon: content.tile_icon_3 },
        { objection: content.tile_objection_4, response: content.tile_response_4, label: content.tile_label_4, icon: content.tile_icon_4 },
        { objection: content.tile_objection_5, response: content.tile_response_5, label: content.tile_label_5, icon: content.tile_icon_5 },
        { objection: content.tile_objection_6, response: content.tile_response_6, label: content.tile_label_6, icon: content.tile_icon_6 }
      ];

      // Process individual fields
      individualTiles.forEach((tile, index) => {
        if (tile.objection && tile.objection.trim() && tile.response && tile.response.trim()) {
          tiles.push({
            icon: tile.icon || getDefaultTileIcon(tile.objection),
            objection: tile.objection.trim().replace(/"/g, ''),
            answer: tile.response.trim(),
            label: tile.label?.trim(),
            index
          });
        }
      });
    }

    // Fallback to legacy pipe-separated format if no tiles found
    if (tiles.length === 0 && content.objection_tiles) {
      const legacyTiles = content.objection_tiles.split('|').reduce((acc, item, index) => {
        if (index % 3 === 0) {
          acc.push({ icon: item.trim(), objection: '', answer: '', index: Math.floor(index / 3) });
        } else if (index % 3 === 1) {
          acc[acc.length - 1].objection = item.trim().replace(/"/g, '');
        } else {
          acc[acc.length - 1].answer = item.trim();
        }
        return acc;
      }, [] as Array<{icon: string, objection: string, answer: string, index: number}>);

      tiles.push(...legacyTiles);
    }

    return tiles;
  };

  // Helper function to get default tile icon based on content
  const getDefaultTileIcon = (objection: string) => {
    const lower = objection.toLowerCase();
    if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price')) return '💰';
    if (lower.includes('time') || lower.includes('setup') || lower.includes('install')) return '⏰';
    if (lower.includes('complex') || lower.includes('difficult') || lower.includes('hard')) return '🔧';
    if (lower.includes('integration') || lower.includes('connect') || lower.includes('tool')) return '📊';
    if (lower.includes('security') || lower.includes('safe') || lower.includes('privacy')) return '🔒';
    if (lower.includes('slow') || lower.includes('speed') || lower.includes('performance')) return '⚡';
    return '💡';
  };

  const objectionTiles = parseObjectionTiles(blockContent);

  // Helper function to get next available tile slot
  const getNextAvailableTileSlot = (content: VisualObjectionTilesContent): number => {
    const tiles = [
      content.tile_objection_1,
      content.tile_objection_2,
      content.tile_objection_3,
      content.tile_objection_4,
      content.tile_objection_5,
      content.tile_objection_6
    ];

    for (let i = 0; i < tiles.length; i++) {
      if (!tiles[i] || tiles[i].trim() === '') {
        return i + 1;
      }
    }

    return -1; // No slots available
  };

  // Helper function to add a new objection tile
  const handleAddObjectionTile = () => {
    const nextSlot = getNextAvailableTileSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`tile_objection_${nextSlot}` as keyof VisualObjectionTilesContent, 'New objection');
      handleContentUpdate(`tile_response_${nextSlot}` as keyof VisualObjectionTilesContent, 'Address this concern with a clear, concise response');
      handleContentUpdate(`tile_icon_${nextSlot}` as keyof VisualObjectionTilesContent, '💡');
      handleContentUpdate(`tile_label_${nextSlot}` as keyof VisualObjectionTilesContent, 'General');
    }
  };

  // Helper function to remove an objection tile
  const handleRemoveObjectionTile = (indexToRemove: number) => {
    const fieldNum = indexToRemove + 1;
    handleContentUpdate(`tile_objection_${fieldNum}` as keyof VisualObjectionTilesContent, '');
    handleContentUpdate(`tile_response_${fieldNum}` as keyof VisualObjectionTilesContent, '');
    handleContentUpdate(`tile_icon_${fieldNum}` as keyof VisualObjectionTilesContent, '');
    handleContentUpdate(`tile_label_${fieldNum}` as keyof VisualObjectionTilesContent, '');
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
                      const updatedTiles = (blockContent.objection_tiles || '').split('|');
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
                    const updatedTiles = (blockContent.objection_tiles || '').split('|');
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
                    const updatedTiles = (blockContent.objection_tiles || '').split('|');
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