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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

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
  // Pipe-separated fields for cards
  problem_statements?: string;
  reframe_statements?: string;
  // Individual problem/reframe pairs (up to 6 pairs) - for backward compatibility
  problem_1?: string;
  reframe_1?: string;
  problem_2?: string;
  reframe_2?: string;
  problem_3?: string;
  reframe_3?: string;
  problem_4?: string;
  reframe_4?: string;
  problem_5?: string;
  reframe_5?: string;
  problem_6?: string;
  reframe_6?: string;
  // Transition and styling
  transition_text?: string;
  problem_icon?: string;
  reframe_icon?: string;
  transition_icon?: string;
  arrow_icon?: string;
  benefit_icon_1?: string;
  benefit_icon_2?: string;
  benefit_icon_3?: string;
  bottom_headline?: string;
  bottom_description?: string;
  benefit_label_1?: string;
  benefit_label_2?: string;
  benefit_label_3?: string;
  // Legacy fields for backward compatibility
  reframe_blocks?: string;
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
  // Individual problem/reframe pairs
  problem_1: { type: 'string' as const, default: 'We don\'t have time to learn new tools' },
  reframe_1: { type: 'string' as const, default: 'Think of this as investing 30 minutes to save 5 hours every week' },
  problem_2: { type: 'string' as const, default: 'Our current process works fine' },
  reframe_2: { type: 'string' as const, default: 'Every manual process is an opportunity waiting to be optimized' },
  problem_3: { type: 'string' as const, default: 'It\'s too risky to change systems' },
  reframe_3: { type: 'string' as const, default: 'The biggest risk is staying behind while competitors automate' },
  problem_4: { type: 'string' as const, default: 'We can\'t afford another subscription' },
  reframe_4: { type: 'string' as const, default: 'Can you afford to keep paying your team to do manual work?' },
  problem_5: { type: 'string' as const, default: 'This seems too complex for our team' },
  reframe_5: { type: 'string' as const, default: 'Complexity is where your competitors get stuck - simplicity is your advantage' },
  problem_6: { type: 'string' as const, default: 'We\'re not ready for this change' },
  reframe_6: { type: 'string' as const, default: 'The market won\'t wait for you to be ready - but this makes you ready for the market' },
  // Transition and styling
  transition_text: { type: 'string' as const, default: 'Instead of seeing obstacles, see opportunities' },
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
  benefit_label_3: { type: 'string' as const, default: 'Immediate results' },
  // Legacy fields for backward compatibility
  reframe_blocks: {
    type: 'string' as const,
    default: `We don't have time to learn new tools|Think of this as investing 30 minutes to save 5 hours every week|Our current process works fine|Every manual process is an opportunity waiting to be optimized|It's too risky to change systems|The biggest risk is staying behind while competitors automate|We can't afford another subscription|Can you afford to keep paying your team to do manual work?`
  }
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

  // Theme detection: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getProblemReframeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        // Problem (left) - lighter orange
        problemBg: 'bg-orange-50',
        problemBorder: 'border-orange-200',
        problemBadgeBg: 'bg-orange-500',
        problemIconBg: 'bg-orange-100',
        problemTextPrimary: 'text-orange-900',
        problemTextSecondary: 'text-orange-700',
        problemHoverBg: 'hover:bg-orange-50',
        problemFocusRing: 'focus:ring-orange-500',
        // Reframe (right) - darker orange
        reframeBg: 'from-orange-100 to-orange-50',
        reframeBorder: 'border-orange-300',
        reframeBadgeBg: 'bg-orange-600',
        reframeIconBg: 'bg-orange-200',
        reframeIconText: 'text-orange-700',
        reframeTextPrimary: 'text-orange-900',
        reframeTextSecondary: 'text-orange-800',
        reframeHoverBg: 'hover:bg-orange-100',
        reframeFocusRing: 'focus:ring-orange-600',
        // Arrow indicator
        arrowBg: 'bg-orange-500'
      },
      cool: {
        problemBg: 'bg-blue-50',
        problemBorder: 'border-blue-200',
        problemBadgeBg: 'bg-blue-500',
        problemIconBg: 'bg-blue-100',
        problemTextPrimary: 'text-blue-900',
        problemTextSecondary: 'text-blue-700',
        problemHoverBg: 'hover:bg-blue-50',
        problemFocusRing: 'focus:ring-blue-500',
        reframeBg: 'from-blue-100 to-blue-50',
        reframeBorder: 'border-blue-300',
        reframeBadgeBg: 'bg-blue-600',
        reframeIconBg: 'bg-blue-200',
        reframeIconText: 'text-blue-700',
        reframeTextPrimary: 'text-blue-900',
        reframeTextSecondary: 'text-blue-800',
        reframeHoverBg: 'hover:bg-blue-100',
        reframeFocusRing: 'focus:ring-blue-600',
        arrowBg: 'bg-blue-500'
      },
      neutral: {
        problemBg: 'bg-gray-50',
        problemBorder: 'border-gray-200',
        problemBadgeBg: 'bg-gray-500',
        problemIconBg: 'bg-gray-100',
        problemTextPrimary: 'text-gray-900',
        problemTextSecondary: 'text-gray-700',
        problemHoverBg: 'hover:bg-gray-50',
        problemFocusRing: 'focus:ring-gray-500',
        reframeBg: 'from-gray-100 to-gray-50',
        reframeBorder: 'border-gray-300',
        reframeBadgeBg: 'bg-gray-600',
        reframeIconBg: 'bg-gray-200',
        reframeIconText: 'text-gray-700',
        reframeTextPrimary: 'text-gray-900',
        reframeTextSecondary: 'text-gray-800',
        reframeHoverBg: 'hover:bg-gray-100',
        reframeFocusRing: 'focus:ring-gray-600',
        arrowBg: 'bg-gray-500'
      }
    }[theme];
  };

  const colors = getProblemReframeColors(theme);

  // Parse reframe blocks from both individual and legacy formats
  const parseReframeBlocks = (content: ProblemToReframeBlocksContent): ReframeBlock[] => {
    const blocks: ReframeBlock[] = [];

    // First check for new pipe-separated format (preferred)
    if (content.problem_statements && content.reframe_statements) {
      const problems = content.problem_statements.split('|').map(p => p.trim()).filter(p => p);
      const reframes = content.reframe_statements.split('|').map(r => r.trim()).filter(r => r);

      const maxLength = Math.min(problems.length, reframes.length);
      for (let i = 0; i < maxLength; i++) {
        blocks.push({
          id: `reframe-${i}`,
          problem: problems[i].replace(/"/g, ''),
          reframe: reframes[i]
        });
      }
    }
    // Check for individual fields (backward compatibility)
    else {
      const individualPairs = [
        { problem: content.problem_1, reframe: content.reframe_1 },
        { problem: content.problem_2, reframe: content.reframe_2 },
        { problem: content.problem_3, reframe: content.reframe_3 },
        { problem: content.problem_4, reframe: content.reframe_4 },
        { problem: content.problem_5, reframe: content.reframe_5 },
        { problem: content.problem_6, reframe: content.reframe_6 }
      ];

      // Process individual fields
      individualPairs.forEach((pair, index) => {
        if (pair.problem && pair.problem.trim() && pair.reframe && pair.reframe.trim()) {
          blocks.push({
            id: `reframe-${index}`,
            problem: pair.problem.trim().replace(/"/g, ''),
            reframe: pair.reframe.trim()
          });
        }
      });
    }

    // Fallback to legacy pipe-separated format if no blocks found
    if (blocks.length === 0 && content.reframe_blocks) {
      const legacyBlocks = content.reframe_blocks.split('|');
      for (let i = 0; i < legacyBlocks.length; i += 2) {
        if (legacyBlocks[i] && legacyBlocks[i + 1]) {
          blocks.push({
            id: `reframe-${i / 2}`,
            problem: legacyBlocks[i].trim().replace(/"/g, ''),
            reframe: legacyBlocks[i + 1].trim()
          });
        }
      }
    }

    return blocks;
  };

  const reframeBlocks = parseReframeBlocks(blockContent);

  // Helper function to get next available pair slot
  const getNextAvailablePairSlot = (content: ProblemToReframeBlocksContent): number => {
    const pairs = [
      content.problem_1,
      content.problem_2,
      content.problem_3,
      content.problem_4,
      content.problem_5,
      content.problem_6
    ];

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      if (!pair || pair.trim() === '') {
        return i + 1;
      }
    }

    return -1; // No slots available
  };

  // Handle individual problem/reframe editing
  const handleProblemEdit = (index: number, value: string) => {
    const fieldName = `problem_${index + 1}` as keyof ProblemToReframeBlocksContent;
    handleContentUpdate(fieldName, value);
  };

  const handleReframeEdit = (index: number, value: string) => {
    const fieldName = `reframe_${index + 1}` as keyof ProblemToReframeBlocksContent;
    handleContentUpdate(fieldName, value);
  };

  // Handle adding a new reframe block
  const handleAddReframeBlock = () => {
    const nextSlot = getNextAvailablePairSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`problem_${nextSlot}` as keyof ProblemToReframeBlocksContent, 'New limiting belief or concern');
      handleContentUpdate(`reframe_${nextSlot}` as keyof ProblemToReframeBlocksContent, 'Reframe this as an opportunity or benefit');
    }
  };

  // Handle removing a reframe block
  const handleRemoveReframeBlock = (indexToRemove: number) => {
    const fieldNum = indexToRemove + 1;
    handleContentUpdate(`problem_${fieldNum}` as keyof ProblemToReframeBlocksContent, '');
    handleContentUpdate(`reframe_${fieldNum}` as keyof ProblemToReframeBlocksContent, '');
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
              <div className={`${colors.problemBg} border ${colors.problemBorder} rounded-2xl p-8 relative`}>
                <div className="absolute -top-3 left-8">
                  <span className={`${colors.problemBadgeBg} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                    Old Thinking
                  </span>
                </div>

                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.problemIconBg} rounded-full flex items-center justify-center mt-1`}>
                      <IconEditableText
                        mode={mode}
                        value={blockContent.problem_icon || '⚠️'}
                        onEdit={(value) => handleContentUpdate('problem_icon', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        iconSize="md"
                        className="text-2xl"
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
                            className={`outline-none focus:ring-2 ${colors.problemFocusRing} focus:ring-opacity-50 rounded px-1 min-h-[28px] cursor-text ${colors.problemHoverBg} text-lg font-bold ${colors.problemTextPrimary} mb-2`}
                          >
                            {block.problem}
                          </div>
                          <p className={`${colors.problemTextSecondary} text-sm`}>
                            This mindset might be limiting your potential
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className={`text-lg font-bold ${colors.problemTextPrimary} mb-2`}>
                            "{block.problem}"
                          </h3>
                          <p className={`${colors.problemTextSecondary} text-sm`}>
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
                <div className={`w-12 h-12 ${colors.arrowBg} rounded-full flex items-center justify-center`}>
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
                <div className={`w-16 h-16 ${colors.arrowBg} rounded-full flex items-center justify-center`}>
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
              <div className={`lg:order-last bg-gradient-to-br ${colors.reframeBg} border ${colors.reframeBorder} rounded-2xl p-8 relative`}>
                <div className="absolute -top-3 left-8">
                  <span className={`${colors.reframeBadgeBg} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                    New Perspective
                  </span>
                </div>

                <div className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.reframeIconBg} rounded-full flex items-center justify-center mt-1`}>
                      <IconEditableText
                        mode={mode}
                        value={blockContent.reframe_icon || '💡'}
                        onEdit={(value) => handleContentUpdate('reframe_icon', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        iconSize="md"
                        className={`text-2xl ${colors.reframeIconText}`}
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
                            className={`outline-none focus:ring-2 ${colors.reframeFocusRing} focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text ${colors.reframeHoverBg} text-lg ${colors.reframeTextPrimary} leading-relaxed font-medium`}
                          >
                            {block.reframe}
                          </div>
                          <p className={`${colors.reframeTextSecondary} text-sm mt-2`}>
                            A shift in perspective opens new possibilities
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-lg ${colors.reframeTextPrimary} leading-relaxed font-medium`}>
                            {block.reframe}
                          </p>
                          <p className={`${colors.reframeTextSecondary} text-sm mt-2`}>
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
                  className={`text-base ${colors.reframeIconText}`}
                  sectionId={sectionId}
                  elementKey="benefit_icon_2"
                />
                {mode !== 'preview' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentUpdate('benefit_label_2', e.currentTarget.textContent || '')}
                    className={`outline-none focus:ring-2 ${colors.reframeFocusRing} focus:ring-opacity-50 rounded px-1 cursor-text hover:bg-white/50`}
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