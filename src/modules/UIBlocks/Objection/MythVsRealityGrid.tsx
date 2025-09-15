// components/layout/MythVsRealityGrid.tsx - Objection UIBlock for debunking myths with facts
// Grid layout that contrasts myths with reality to address sophisticated market misconceptions

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface MythVsRealityGridContent {
  headline: string;
  subheadline?: string;
  myth_reality_pairs: string;
  myth_icon?: string;
  reality_icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Separating Myth from Reality' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Let\'s address the common misconceptions and show you what\'s actually true.' 
  },
  myth_reality_pairs: { 
    type: 'string' as const, 
    default: 'Myth: This is too complex for small teams|Reality: Our platform is designed for teams of any size, with setup taking less than 5 minutes|Myth: AI tools replace human creativity|Reality: Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy|Myth: Implementation takes months|Reality: Most customers see results within the first week|Myth: It\'s just another analytics tool|Reality: We provide actionable insights with automated recommendations, not just data' 
  },
  myth_icon: { type: 'string' as const, default: '❌' },
  reality_icon: { type: 'string' as const, default: '✅' }
};

export default function MythVsRealityGrid(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<MythVsRealityGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Typography hook
  const { getTextStyle: getTypographyStyle } = useTypography();
  const bodyLgStyle = getTypographyStyle('body-lg');
  const bodyStyle = getTypographyStyle('body');

  // Parse myth/reality pairs from pipe-separated string
  const parseMythRealityPairs = (pairString: string): Array<{myth: string, reality: string}> => {
    if (!pairString) return [];
    return pairString.split('|').reduce((pairs, item, index) => {
      if (index % 2 === 0) {
        pairs.push({ myth: item.replace('Myth:', '').trim(), reality: '' });
      } else {
        pairs[pairs.length - 1].reality = item.replace('Reality:', '').trim();
      }
      return pairs;
    }, [] as Array<{myth: string, reality: string}>);
  };

  const mythRealityPairs = parseMythRealityPairs(blockContent.myth_reality_pairs);

  // Helper function to add a new myth/reality pair
  const addMythRealityPair = () => {
    const titles = blockContent.myth_reality_pairs.split('|').filter(t => t.trim());
    titles.push('Myth: New myth to address', 'Reality: The actual truth about this topic');
    handleContentUpdate('myth_reality_pairs', titles.join('|'));
  };

  // Helper function to remove a myth/reality pair
  const removeMythRealityPair = (indexToRemove: number) => {
    const pairs = parseMythRealityPairs(blockContent.myth_reality_pairs);
    if (pairs.length <= 1) return; // Don't allow removing the last pair

    pairs.splice(indexToRemove, 1);
    const newPairString = pairs.map(pair => `Myth: ${pair.myth}|Reality: ${pair.reality}`).join('|');
    handleContentUpdate('myth_reality_pairs', newPairString);
  };

  // Helper function to update individual myth/reality text
  const updateMythAtIndex = (index: number, value: string) => {
    const pairs = parseMythRealityPairs(blockContent.myth_reality_pairs);
    if (pairs[index]) {
      pairs[index].myth = value;
      const newPairString = pairs.map(pair => `Myth: ${pair.myth}|Reality: ${pair.reality}`).join('|');
      handleContentUpdate('myth_reality_pairs', newPairString);
    }
  };

  const updateRealityAtIndex = (index: number, value: string) => {
    const pairs = parseMythRealityPairs(blockContent.myth_reality_pairs);
    if (pairs[index]) {
      pairs[index].reality = value;
      const newPairString = pairs.map(pair => `Myth: ${pair.myth}|Reality: ${pair.reality}`).join('|');
      handleContentUpdate('myth_reality_pairs', newPairString);
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MythVsRealityGrid"
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
              style={{...bodyLgStyle}} className="max-w-3xl mx-auto"
              placeholder="Add a subheadline that sets up the myth vs reality comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Myth vs Reality Grid */}
        <div className="space-y-8">
          {mythRealityPairs.map((pair, index) => (
            <div key={index} className={`relative group/myth-reality-${index}`}>
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {/* Myth Card */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <span style={{...bodyStyle, fontSize: '0.875rem', fontWeight: '500'}} className="bg-red-500 text-white px-3 py-1 rounded-full">
                      Myth
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mt-1">
                        <IconEditableText
                          mode={mode}
                          value={blockContent.myth_icon || '❌'}
                          onEdit={(value) => handleContentUpdate('myth_icon', value)}
                          backgroundType="custom"
                          colorTokens={{...colorTokens, primaryText: 'text-white'}}
                          iconSize="sm"
                          className="text-base text-white"
                          sectionId={sectionId}
                          elementKey="myth_icon"
                        />
                      </div>
                      {mode !== 'preview' ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMythAtIndex(index, e.currentTarget.textContent || '')}
                          className="outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-red-100 text-red-900 leading-relaxed flex-1"
                        >
                          {pair.myth}
                        </div>
                      ) : (
                        <p style={{...bodyStyle}} className="text-red-900 leading-relaxed flex-1">{pair.myth}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reality Card */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <span style={{...bodyStyle, fontSize: '0.875rem', fontWeight: '500'}} className="bg-green-500 text-white px-3 py-1 rounded-full">
                      Reality
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-1">
                        <IconEditableText
                          mode={mode}
                          value={blockContent.reality_icon || '✅'}
                          onEdit={(value) => handleContentUpdate('reality_icon', value)}
                          backgroundType="custom"
                          colorTokens={{...colorTokens, primaryText: 'text-white'}}
                          iconSize="sm"
                          className="text-base text-white"
                          sectionId={sectionId}
                          elementKey="reality_icon"
                        />
                      </div>
                      {mode !== 'preview' ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateRealityAtIndex(index, e.currentTarget.textContent || '')}
                          className="outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-green-100 text-green-900 leading-relaxed flex-1"
                        >
                          {pair.reality}
                        </div>
                      ) : (
                        <p style={{...bodyStyle}} className="text-green-900 leading-relaxed flex-1">{pair.reality}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete button - only show in edit mode and if more than 1 pair */}
              {mode !== 'preview' && mythRealityPairs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMythRealityPair(index);
                  }}
                  className={`opacity-0 group-hover/myth-reality-${index}:opacity-100 absolute -top-2 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10`}
                  title="Remove this myth vs reality pair"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Myth vs Reality Pair Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && mythRealityPairs.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={addMythRealityPair}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Myth vs Reality Pair</span>
            </button>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'MythVsRealityGrid',
  category: 'Objection Sections',
  description: 'Grid layout that contrasts myths with reality to address sophisticated market misconceptions and build credibility.',
  tags: ['objection', 'credibility', 'myth-busting', 'grid', 'comparison'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'myth_reality_pairs', label: 'Myth vs Reality Pairs', type: 'dynamic-cards', required: true }
  ],

  features: [
    'Visual contrast between myths (red) and reality (green)',
    'Add/delete myth vs reality pairs (up to 6 pairs)',
    'Individual inline editing for each myth and reality',
    'Automatic text color adaptation based on background type',
    'Responsive grid layout for optimal readability',
    'Clear iconography for myths vs reality',
    'Minimum of 1 pair enforced'
  ],
  
  useCases: [
    'Addressing technical misconceptions in sophisticated markets',
    'Correcting pricing or complexity assumptions',
    'Debunking competitor claims or market myths',
    'Educational content for solution-aware prospects'
  ]
};