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
  // Individual myth/reality fields (up to 6 pairs)
  myth_1: string;
  reality_1: string;
  myth_2: string;
  reality_2: string;
  myth_3: string;
  reality_3: string;
  myth_4: string;
  reality_4: string;
  myth_5: string;
  reality_5: string;
  myth_6: string;
  reality_6: string;
  // Global icons
  myth_icon?: string;
  reality_icon?: string;
  // Legacy field for backward compatibility
  myth_reality_pairs?: string;
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
  // Individual myth/reality pairs
  myth_1: { type: 'string' as const, default: 'This is too complex for small teams' },
  reality_1: { type: 'string' as const, default: 'Our platform is designed for teams of any size, with setup taking less than 5 minutes' },
  myth_2: { type: 'string' as const, default: 'AI tools replace human creativity' },
  reality_2: { type: 'string' as const, default: 'Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy' },
  myth_3: { type: 'string' as const, default: 'Implementation takes months' },
  reality_3: { type: 'string' as const, default: 'Most customers see results within the first week' },
  myth_4: { type: 'string' as const, default: 'It\'s just another analytics tool' },
  reality_4: { type: 'string' as const, default: 'We provide actionable insights with automated recommendations, not just data' },
  myth_5: { type: 'string' as const, default: 'You need technical expertise' },
  reality_5: { type: 'string' as const, default: 'Our drag-and-drop interface requires zero coding knowledge' },
  myth_6: { type: 'string' as const, default: 'It won\'t integrate with our existing tools' },
  reality_6: { type: 'string' as const, default: 'We connect seamlessly with 500+ popular business tools and platforms' },
  // Global icons
  myth_icon: { type: 'string' as const, default: '❌' },
  reality_icon: { type: 'string' as const, default: '✅' },
  // Legacy field for backward compatibility
  myth_reality_pairs: {
    type: 'string' as const,
    default: 'Myth: This is too complex for small teams|Reality: Our platform is designed for teams of any size, with setup taking less than 5 minutes|Myth: AI tools replace human creativity|Reality: Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy|Myth: Implementation takes months|Reality: Most customers see results within the first week|Myth: It\'s just another analytics tool|Reality: We provide actionable insights with automated recommendations, not just data'
  }
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

  // Parse myth/reality pairs from both individual and legacy formats
  const parseMythRealityPairs = (content: MythVsRealityGridContent): Array<{myth: string, reality: string, index: number}> => {
    const pairs: Array<{myth: string, reality: string, index: number}> = [];

    // Check for individual fields first (preferred format)
    const individualPairs = [
      { myth: content.myth_1, reality: content.reality_1 },
      { myth: content.myth_2, reality: content.reality_2 },
      { myth: content.myth_3, reality: content.reality_3 },
      { myth: content.myth_4, reality: content.reality_4 },
      { myth: content.myth_5, reality: content.reality_5 },
      { myth: content.myth_6, reality: content.reality_6 }
    ];

    // Process individual fields
    individualPairs.forEach((pair, index) => {
      if (pair.myth && pair.myth.trim() && pair.reality && pair.reality.trim()) {
        pairs.push({
          myth: pair.myth.trim(),
          reality: pair.reality.trim(),
          index
        });
      }
    });

    // Fallback to legacy pipe-separated format if no individual fields
    if (pairs.length === 0 && content.myth_reality_pairs) {
      const legacyPairs = content.myth_reality_pairs.split('|').reduce((acc, item, index) => {
        if (index % 2 === 0) {
          acc.push({ myth: item.replace('Myth:', '').trim(), reality: '', index: Math.floor(index / 2) });
        } else {
          acc[acc.length - 1].reality = item.replace('Reality:', '').trim();
        }
        return acc;
      }, [] as Array<{myth: string, reality: string, index: number}>);

      pairs.push(...legacyPairs);
    }

    return pairs;
  };

  const mythRealityPairs = parseMythRealityPairs(blockContent);

  // Helper function to get next available pair slot
  const getNextAvailablePairSlot = (content: MythVsRealityGridContent): number => {
    const pairs = [
      { myth: content.myth_1, reality: content.reality_1 },
      { myth: content.myth_2, reality: content.reality_2 },
      { myth: content.myth_3, reality: content.reality_3 },
      { myth: content.myth_4, reality: content.reality_4 },
      { myth: content.myth_5, reality: content.reality_5 },
      { myth: content.myth_6, reality: content.reality_6 }
    ];

    for (let i = 0; i < pairs.length; i++) {
      if (!pairs[i].myth || pairs[i].myth.trim() === '') {
        return i + 1;
      }
    }

    return -1; // No slots available
  };

  // Helper function to shift pairs down when removing one
  const shiftPairsDown = (content: MythVsRealityGridContent, removedIndex: number): Partial<MythVsRealityGridContent> => {
    const updates: Partial<MythVsRealityGridContent> = {};

    // Get all pairs after filtering out empty ones
    const allPairs = [
      { myth: content.myth_1, reality: content.reality_1 },
      { myth: content.myth_2, reality: content.reality_2 },
      { myth: content.myth_3, reality: content.reality_3 },
      { myth: content.myth_4, reality: content.reality_4 },
      { myth: content.myth_5, reality: content.reality_5 },
      { myth: content.myth_6, reality: content.reality_6 }
    ];

    // Filter out the removed item and empty pairs
    const validPairs = allPairs
      .map((pair, index) => ({ ...pair, originalIndex: index }))
      .filter((pair, index) => index !== removedIndex && pair.myth && pair.myth.trim())
      .slice(0, 5); // Limit to 5 since one is being removed

    // Clear all fields first
    for (let i = 1; i <= 6; i++) {
      updates[`myth_${i}` as keyof MythVsRealityGridContent] = '';
      updates[`reality_${i}` as keyof MythVsRealityGridContent] = '';
    }

    // Reassign remaining pairs
    validPairs.forEach((pair, newIndex) => {
      const fieldNum = newIndex + 1;
      updates[`myth_${fieldNum}` as keyof MythVsRealityGridContent] = pair.myth || '';
      updates[`reality_${fieldNum}` as keyof MythVsRealityGridContent] = pair.reality || '';
    });

    return updates;
  };

  // Helper function to add a new myth/reality pair
  const addMythRealityPair = () => {
    const nextSlot = getNextAvailablePairSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`myth_${nextSlot}` as keyof MythVsRealityGridContent, 'New myth to address');
      handleContentUpdate(`reality_${nextSlot}` as keyof MythVsRealityGridContent, 'The actual truth about this topic');
    }
  };

  // Helper function to remove a myth/reality pair
  const removeMythRealityPair = (indexToRemove: number) => {
    const updates = shiftPairsDown(blockContent, indexToRemove);

    // Apply all updates at once
    Object.entries(updates).forEach(([key, value]) => {
      handleContentUpdate(key as keyof MythVsRealityGridContent, value as string);
    });
  };

  // Helper function to update individual myth/reality text
  const updateMythAtIndex = (index: number, value: string) => {
    const fieldName = `myth_${index + 1}` as keyof MythVsRealityGridContent;
    handleContentUpdate(fieldName, value);
  };

  const updateRealityAtIndex = (index: number, value: string) => {
    const fieldName = `reality_${index + 1}` as keyof MythVsRealityGridContent;
    handleContentUpdate(fieldName, value);
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
    // Individual myth/reality pairs
    { key: 'myth_1', label: 'First Myth', type: 'text', required: true },
    { key: 'reality_1', label: 'First Reality', type: 'textarea', required: true },
    { key: 'myth_2', label: 'Second Myth', type: 'text', required: true },
    { key: 'reality_2', label: 'Second Reality', type: 'textarea', required: true },
    { key: 'myth_3', label: 'Third Myth', type: 'text', required: false },
    { key: 'reality_3', label: 'Third Reality', type: 'textarea', required: false },
    { key: 'myth_4', label: 'Fourth Myth', type: 'text', required: false },
    { key: 'reality_4', label: 'Fourth Reality', type: 'textarea', required: false },
    { key: 'myth_5', label: 'Fifth Myth', type: 'text', required: false },
    { key: 'reality_5', label: 'Fifth Reality', type: 'textarea', required: false },
    { key: 'myth_6', label: 'Sixth Myth', type: 'text', required: false },
    { key: 'reality_6', label: 'Sixth Reality', type: 'textarea', required: false }
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