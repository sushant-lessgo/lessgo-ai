// components/layout/ProblemToReframeBlocks.tsx - Objection UIBlock for reframing problems with solutions
// Transforms negative perceptions into positive value propositions

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Reframe block structure
interface ReframeBlock {
  id: string;
  problem: string;
  reframe: string;
}

// Content interface for type safety
interface ProblemToReframeBlocksContent {
  headline: string;
  subheadline?: string;
  reframe_blocks: string;
  problem_icon?: string;
  reframe_icon?: string;
  arrow_icon?: string;
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  benefit_icon_3?: string;
  bottom_headline?: string;
  bottom_description?: string;
  benefit_label_1?: string;
  benefit_label_2?: string;
  benefit_label_3?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Let\'s Reframe How You Think About This'
  },
  subheadline: {
    type: 'string' as const,
    default: 'What seems like a problem might actually be your biggest opportunity.'
  },
  reframe_blocks: {
    type: 'string' as const,
    default: `"We don't have time to learn new tools"|Think of this as investing 30 minutes to save 5 hours every week|"Our current process works fine"|Every manual process is an opportunity waiting to be optimized|"It's too risky to change systems"|The biggest risk is staying behind while competitors automate|"We can't afford another subscription"|Can you afford to keep paying your team to do manual work?`
  },
  problem_icon: { type: 'string' as const, default: '⚠️' },
  reframe_icon: { type: 'string' as const, default: '💡' },
  arrow_icon: { type: 'string' as const, default: '➡️' },
  benefit_icon_1: { type: 'string' as const, default: '⚡' },
  benefit_icon_2: { type: 'string' as const, default: '✅' },
  benefit_icon_3: { type: 'string' as const, default: '📈' },
  bottom_headline: { type: 'string' as const, default: 'The Power of Perspective' },
  bottom_description: { type: 'string' as const, default: 'Every limitation is actually an opportunity in disguise. When you change how you look at challenges, the challenges change how they look back at you.' },
  benefit_label_1: { type: 'string' as const, default: 'Instant mindset shift' },
  benefit_label_2: { type: 'string' as const, default: 'Proven approach' },
  benefit_label_3: { type: 'string' as const, default: 'Immediate results' }
};

// Helper function to add a new reframe block
const addReframeBlock = (reframeBlocks: string): string => {
  const blocks = reframeBlocks.split('|').filter(item => item.trim());

  // Add new block with default content (ensure even number of items)
  blocks.push('"New objection or concern"');
  blocks.push('Reframe this as an opportunity or benefit');

  return blocks.join('|');
};

// Helper function to remove a reframe block
const removeReframeBlock = (reframeBlocks: string, indexToRemove: number): string => {
  const blocks = reframeBlocks.split('|').filter(item => item.trim());
  const blockPairs: string[] = [];

  // Group into pairs
  for (let i = 0; i < blocks.length; i += 2) {
    if (blocks[i] && blocks[i + 1]) {
      blockPairs.push(blocks[i]);
      blockPairs.push(blocks[i + 1]);
    }
  }

  // Remove the pair at the specified index (multiply by 2 to get actual position)
  if (indexToRemove >= 0 && indexToRemove * 2 < blockPairs.length) {
    blockPairs.splice(indexToRemove * 2, 2);
  }

  return blockPairs.join('|');
};

export default function ProblemToReframeBlocks(props: LayoutComponentProps) {

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
  } = useLayoutComponent<ProblemToReframeBlocksContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse reframe blocks from pipe-separated string
  const parseReframeBlocks = (): ReframeBlock[] => {
    if (!blockContent.reframe_blocks) return [];

    const blocks = blockContent.reframe_blocks.split('|');
    const result: ReframeBlock[] = [];

    for (let i = 0; i < blocks.length; i += 2) {
      if (blocks[i] && blocks[i + 1]) {
        result.push({
          id: `reframe-${i / 2}`,
          problem: blocks[i].trim().replace(/"/g, ''),
          reframe: blocks[i + 1].trim()
        });
      }
    }

    return result;
  };

  const reframeBlocks = parseReframeBlocks();

  // Handle individual problem/reframe editing
  const handleProblemEdit = (index: number, value: string) => {
    const blocks = blockContent.reframe_blocks.split('|');
    blocks[index * 2] = `"${value}"`;
    handleContentUpdate('reframe_blocks', blocks.join('|'));
  };

  const handleReframeEdit = (index: number, value: string) => {
    const blocks = blockContent.reframe_blocks.split('|');
    blocks[index * 2 + 1] = value;
    handleContentUpdate('reframe_blocks', blocks.join('|'));
  };

  // Handle adding a new reframe block
  const handleAddReframeBlock = () => {
    const newBlocks = addReframeBlock(blockContent.reframe_blocks);
    handleContentUpdate('reframe_blocks', newBlocks);
  };

  // Handle removing a reframe block
  const handleRemoveReframeBlock = (indexToRemove: number) => {
    const newBlocks = removeReframeBlock(blockContent.reframe_blocks, indexToRemove);
    handleContentUpdate('reframe_blocks', newBlocks);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ProblemToReframeBlocks"
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
              placeholder="Add a subheadline that sets up the reframing approach..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Reframe Blocks */}
        <div className="space-y-8">
          {reframeBlocks.map((block, index) => (
            <div key={block.id} className="group/reframe-block relative grid lg:grid-cols-2 gap-8 items-center">
              
              {/* Problem Side */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-8">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Old Thinking
                  </span>
                </div>
                
                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.problem_icon || '⚠️'}
                        onEdit={(value) => handleContentUpdate('problem_icon', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        iconSize="md"
                        className="text-2xl text-orange-600"
                        sectionId={sectionId}
                        elementKey="problem_icon"
                      />
                    </div>
                    <div className="flex-1">
                      {mode !== 'preview' ? (
                        <div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleProblemEdit(index, e.currentTarget.textContent || '')}
                            className="outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text hover:bg-orange-50 text-lg font-bold text-orange-900 mb-2"
                          >
                            {block.problem}
                          </div>
                          <p className="text-orange-700 text-sm">
                            This mindset might be limiting your potential
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-bold text-orange-900 mb-2">
                            "{block.problem}"
                          </h3>
                          <p className="text-orange-700 text-sm">
                            This mindset might be limiting your potential
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow/Transform Indicator */}
              <div className="lg:hidden flex justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.arrow_icon || '⬇️'}
                    onEdit={(value) => handleContentUpdate('arrow_icon', value)}
                    backgroundType="custom"
                    colorTokens={{...colorTokens, primaryText: 'text-white'}}
                    iconSize="md"
                    className="text-2xl text-white"
                    sectionId={sectionId}
                    elementKey="arrow_icon_mobile"
                  />
                </div>
              </div>
              
              <div className="hidden lg:flex justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.arrow_icon || '➡️'}
                    onEdit={(value) => handleContentUpdate('arrow_icon', value)}
                    backgroundType="custom"
                    colorTokens={{...colorTokens, primaryText: 'text-white'}}
                    iconSize="lg"
                    className="text-3xl text-white"
                    sectionId={sectionId}
                    elementKey="arrow_icon_desktop"
                  />
                </div>
              </div>

              {/* Reframe Side */}
              <div className="lg:order-last bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-8">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    New Perspective
                  </span>
                </div>
                
                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.reframe_icon || '💡'}
                        onEdit={(value) => handleContentUpdate('reframe_icon', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        iconSize="md"
                        className="text-2xl text-emerald-600"
                        sectionId={sectionId}
                        elementKey="reframe_icon"
                      />
                    </div>
                    <div className="flex-1">
                      {mode !== 'preview' ? (
                        <div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleReframeEdit(index, e.currentTarget.textContent || '')}
                            className="outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-emerald-50 text-lg text-emerald-900 leading-relaxed font-medium"
                          >
                            {block.reframe}
                          </div>
                          <p className="text-emerald-700 text-sm mt-2">
                            A shift in perspective opens new possibilities
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg text-emerald-900 leading-relaxed font-medium">
                            {block.reframe}
                          </p>
                          <p className="text-emerald-700 text-sm mt-2">
                            A shift in perspective opens new possibilities
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete button - only show in edit mode and if can remove */}
              {mode !== 'preview' && reframeBlocks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveReframeBlock(index);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover/reframe-block:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10"
                  title="Remove this reframe block"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Reframe Block Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && reframeBlocks.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddReframeBlock}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Reframe Block</span>
            </button>
          </div>
        )}

        {/* Bottom Insight Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            {mode !== 'preview' ? (
              <div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('bottom_headline', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 min-h-[32px] cursor-text hover:bg-white/50 text-xl font-bold text-gray-900 mb-4 inline-block"
                  data-placeholder="The Power of Perspective"
                >
                  {blockContent.bottom_headline || 'The Power of Perspective'}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentUpdate('bottom_description', e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 min-h-[60px] cursor-text hover:bg-white/50 text-gray-700 mb-6 leading-relaxed"
                  data-placeholder="Every limitation is actually an opportunity in disguise..."
                >
                  {blockContent.bottom_description || 'Every limitation is actually an opportunity in disguise. When you change how you look at challenges, the challenges change how they look back at you.'}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {blockContent.bottom_headline || 'The Power of Perspective'}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {blockContent.bottom_description || 'Every limitation is actually an opportunity in disguise. When you change how you look at challenges, the challenges change how they look back at you.'}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <IconEditableText
                  mode={mode}
                  value={blockContent.benefit_icon_1 || '⚡'}
                  onEdit={(value) => handleContentUpdate('benefit_icon_1', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-blue-500"
                  sectionId={sectionId}
                  elementKey="benefit_icon_1"
                />
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentUpdate('benefit_label_1', e.currentTarget.textContent || '')}
                    className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-white/50"
                  >
                    {blockContent.benefit_label_1 || 'Instant mindset shift'}
                  </div>
                ) : (
                  <span>{blockContent.benefit_label_1 || 'Instant mindset shift'}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <IconEditableText
                  mode={mode}
                  value={blockContent.benefit_icon_2 || '✅'}
                  onEdit={(value) => handleContentUpdate('benefit_icon_2', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-emerald-500"
                  sectionId={sectionId}
                  elementKey="benefit_icon_2"
                />
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentUpdate('benefit_label_2', e.currentTarget.textContent || '')}
                    className="outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-white/50"
                  >
                    {blockContent.benefit_label_2 || 'Proven approach'}
                  </div>
                ) : (
                  <span>{blockContent.benefit_label_2 || 'Proven approach'}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <IconEditableText
                  mode={mode}
                  value={blockContent.benefit_icon_3 || '📈'}
                  onEdit={(value) => handleContentUpdate('benefit_icon_3', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  iconSize="sm"
                  className="text-base text-purple-500"
                  sectionId={sectionId}
                  elementKey="benefit_icon_3"
                />
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentUpdate('benefit_label_3', e.currentTarget.textContent || '')}
                    className="outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-white/50"
                  >
                    {blockContent.benefit_label_3 || 'Immediate results'}
                  </div>
                ) : (
                  <span>{blockContent.benefit_label_3 || 'Immediate results'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ProblemToReframeBlocks',
  category: 'Objection Sections',
  description: 'Reframes negative perceptions into positive value propositions through perspective shifts.',
  tags: ['objection', 'reframing', 'mindset', 'perspective', 'transformation'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'reframe_blocks', label: 'Reframe Blocks (pipe separated: problem|reframe)', type: 'textarea', required: true }
  ],
  
  features: [
    'Visual transformation flow from problem to solution',
    'Color-coded perspective blocks (orange to green)',
    'Animated transformation indicators',
    'Inspiring bottom section with key benefits'
  ],
  
  useCases: [
    'Addressing manual process automation hesitations',
    'Converting risk-averse prospects to early adopters',
    'Educational content for paradigm shifts',
    'Marketing tools overcoming change resistance'
  ]
};