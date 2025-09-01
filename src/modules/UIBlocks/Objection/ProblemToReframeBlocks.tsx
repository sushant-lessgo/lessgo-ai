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
  benefit_icon_3: { type: 'string' as const, default: '📈' }
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
  const reframeBlocks = blockContent.reframe_blocks 
    ? blockContent.reframe_blocks.split('|').reduce((blocks, item, index) => {
        if (index % 2 === 0) {
          blocks.push({ problem: item.trim().replace(/"/g, ''), reframe: '' });
        } else {
          blocks[blocks.length - 1].reframe = item.trim();
        }
        return blocks;
      }, [] as Array<{problem: string, reframe: string}>)
    : [];

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
            <div key={index} className="grid lg:grid-cols-2 gap-8 items-center">
              
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
                      <h3 className="text-lg font-bold text-orange-900 mb-2">
                        "{block.problem}"
                      </h3>
                      <p className="text-orange-700 text-sm">
                        This mindset might be limiting your potential
                      </p>
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
                      <p className="text-lg text-emerald-900 leading-relaxed font-medium">
                        {block.reframe}
                      </p>
                      <p className="text-emerald-700 text-sm mt-2">
                        A shift in perspective opens new possibilities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Insight Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              The Power of Perspective
            </h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Every limitation is actually an opportunity in disguise. When you change how you look at challenges, 
              the challenges change how they look back at you.
            </p>
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
                <span>Instant mindset shift</span>
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
                <span>Proven approach</span>
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
                <span>Immediate results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Reframe Blocks:</strong> Use format '"[problem statement]"|[reframed perspective]|"[next problem]"|[next reframe]'
            </p>
          </div>
        )}
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