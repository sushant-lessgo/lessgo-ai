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
  bottom_cta_title?: string;
  bottom_cta_text?: string;
  bottom_cta_button_1?: string;
  bottom_cta_button_2?: string;
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
  },
  bottom_cta_title: {
    type: 'string' as const,
    default: 'Still Have Questions?'
  },
  bottom_cta_text: {
    type: 'string' as const,
    default: 'We\'re here to help! Our team has handled these concerns thousands of times and would love to address any specific questions you might have.'
  },
  bottom_cta_button_1: {
    type: 'string' as const,
    default: 'Get Answers'
  },
  bottom_cta_button_2: {
    type: 'string' as const,
    default: 'View FAQ'
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
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              
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
                  variant="headline"
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

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.bottom_cta_title || ''}
            onEdit={(value) => handleContentUpdate('bottom_cta_title', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="headline"
            className="text-xl font-bold text-gray-900 mb-4"
            placeholder="Enter CTA title"
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key="bottom_cta_title"
          />
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.bottom_cta_text || ''}
            onEdit={(value) => handleContentUpdate('bottom_cta_text', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
            className="text-gray-700 mb-6 max-w-2xl mx-auto"
            placeholder="Enter CTA description"
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key="bottom_cta_text"
          />
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
            {mode === 'edit' ? (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.bottom_cta_button_1 || ''}
                onEdit={(value) => handleContentUpdate('bottom_cta_button_1', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                placeholder="Button 1 text"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="bottom_cta_button_1"
              />
            ) : (
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                {blockContent.bottom_cta_button_1 || 'Get Answers'}
              </button>
            )}
            {mode === 'edit' ? (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.bottom_cta_button_2 || ''}
                onEdit={(value) => handleContentUpdate('bottom_cta_button_2', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                placeholder="Button 2 text"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="bottom_cta_button_2"
              />
            ) : (
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                {blockContent.bottom_cta_button_2 || 'View FAQ'}
              </button>
            )}
          </div>
        </div>

        {/* Edit Mode: Instructions */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Objection Tiles:</strong> Use format "[emoji]|"[objection]"|[answer]|[next emoji]|"[next objection]"|[next answer]"
            </p>
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
  description: 'Visual tile format for addressing common objections in an engaging, approachable way.',
  tags: ['objection', 'visual', 'tiles', 'simple', 'engaging'],
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
    'Hover animations and interactions',
    'Clean, approachable design',
    'Built-in FAQ section at bottom'
  ],
  
  useCases: [
    'Early-stage products addressing basic concerns',
    'Simple SaaS tools with straightforward objections',
    'Consumer products with price/complexity concerns',
    'Freemium offerings handling upgrade hesitations'
  ]
};