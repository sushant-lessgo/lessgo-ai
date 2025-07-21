// components/layout/ProblemToReframeBlocks.tsx - Objection UIBlock for reframing problems with solutions
// Transforms negative perceptions into positive value propositions

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface ProblemToReframeBlocksContent {
  headline: string;
  subheadline?: string;
  reframe_blocks: string;
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
  }
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
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
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
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
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
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              
              <div className="hidden lg:flex justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
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
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Instant mindset shift</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Proven approach</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Immediate results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode: Instructions */}
        {mode === 'edit' && (
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