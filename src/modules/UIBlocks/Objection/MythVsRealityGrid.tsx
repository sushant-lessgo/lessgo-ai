// components/layout/MythVsRealityGrid.tsx - Objection UIBlock for debunking myths with facts
// Grid layout that contrasts myths with reality to address sophisticated market misconceptions

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface MythVsRealityGridContent {
  headline: string;
  subheadline?: string;
  myth_reality_pairs: string;
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

  // Parse myth/reality pairs from pipe-separated string
  const mythRealityPairs = blockContent.myth_reality_pairs 
    ? blockContent.myth_reality_pairs.split('|').reduce((pairs, item, index) => {
        if (index % 2 === 0) {
          pairs.push({ myth: item.replace('Myth:', '').trim(), reality: '' });
        } else {
          pairs[pairs.length - 1].reality = item.replace('Reality:', '').trim();
        }
        return pairs;
      }, [] as Array<{myth: string, reality: string}>)
    : [];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="MythVsRealityGrid"
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
              placeholder="Add a subheadline that sets up the myth vs reality comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Myth vs Reality Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {mythRealityPairs.map((pair, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Myth Card */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-6">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Myth
                  </span>
                </div>
                <div className="pt-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-900 leading-relaxed">{pair.myth}</p>
                  </div>
                </div>
              </div>

              {/* Reality Card */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-6">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Reality
                  </span>
                </div>
                <div className="pt-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-900 leading-relaxed">{pair.reality}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Mode: Instructions */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Myth vs Reality Pairs:</strong> Use format "Myth: [misconception]|Reality: [truth]|Myth: [next misconception]|Reality: [next truth]"
            </p>
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
    { key: 'myth_reality_pairs', label: 'Myth vs Reality Pairs (pipe separated)', type: 'textarea', required: true }
  ],
  
  features: [
    'Visual contrast between myths (red) and reality (green)',
    'Automatic text color adaptation based on background type',
    'Responsive grid layout for optimal readability',
    'Clear iconography for myths vs reality'
  ],
  
  useCases: [
    'Addressing technical misconceptions in sophisticated markets',
    'Correcting pricing or complexity assumptions',
    'Debunking competitor claims or market myths',
    'Educational content for solution-aware prospects'
  ]
};