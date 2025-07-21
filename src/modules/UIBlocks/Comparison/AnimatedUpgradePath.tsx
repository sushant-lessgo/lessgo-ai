import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface AnimatedUpgradePathContent {
  headline: string;
  subheadline?: string;
  stage_titles: string;
  stage_descriptions: string;
  stage_icons?: string;
  cta_text?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Journey from Chaos to Control' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how teams transform their workflow in just 3 stages.' 
  },
  stage_titles: { 
    type: 'string' as const, 
    default: 'Current State|With Basic Tools|With Our Platform' 
  },
  stage_descriptions: { 
    type: 'string' as const, 
    default: 'Manual processes, scattered data, constant firefighting|Some automation, but still switching between 5+ tools|Everything unified, automated workflows, team in sync' 
  },
  stage_icons: { 
    type: 'string' as const, 
    default: 'chaos|tools|rocket' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Transformation' 
  }
};

// AnimatedUpgradePath component - Visual journey from current state to ideal state
export default function AnimatedUpgradePath(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  
  const { 
    mode, 
    blockContent, 
    colorTokens, 
    getTextStyle, 
    sectionBackground, 
    handleContentUpdate 
  } = useLayoutComponent<AnimatedUpgradePathContent>({ 
    ...props, 
    contentSchema: CONTENT_SCHEMA 
  });

  // Parse data
  const stageTitles = parsePipeData(blockContent.stage_titles);
  const stageDescriptions = parsePipeData(blockContent.stage_descriptions);
  const stageIcons = parsePipeData(blockContent.stage_icons || '');

  // Update handlers
  const handleStageTitleUpdate = (index: number, value: string) => {
    const newTitles = [...stageTitles];
    newTitles[index] = value;
    handleContentUpdate('stage_titles', newTitles.join('|'));
  };

  const handleStageDescriptionUpdate = (index: number, value: string) => {
    const newDescriptions = [...stageDescriptions];
    newDescriptions[index] = value;
    handleContentUpdate('stage_descriptions', newDescriptions.join('|'));
  };

  // Get icon based on stage
  const getStageIcon = (iconType: string, index: number) => {
    switch (index) {
      case 0: // Current state - chaos
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 1: // Basic tools
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 2: // With our platform - rocket
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get stage color styling
  const getStageColor = (index: number) => {
    if (index === 0) return 'text-red-500 bg-red-100';
    if (index === 1) return 'text-yellow-500 bg-yellow-100';
    return `${colorTokens.textAccent} ${colorTokens.bgAccent} bg-opacity-20`;
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="AnimatedUpgradePath"
      backgroundType={backgroundType || 'secondary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            content={blockContent.headline}
            mode={mode}
            onUpdate={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            fonts={fonts}
            colorTokens={colorTokens}
            variant="h1"
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              content={blockContent.subheadline || 'Add subheadline...'}
              mode={mode}
              onUpdate={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-2xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              fonts={fonts}
              colorTokens={colorTokens}
              variant="body-lg"
            />
          )}
        </div>

        {/* Upgrade Path */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 hidden md:block" />
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {stageTitles.map((title, index) => (
              <div key={index} className="relative">
                {/* Stage Card */}
                <div className={`rounded-lg p-6 text-center ${
                  index === stageTitles.length - 1 
                    ? `${colorTokens.bgAccent || 'bg-blue-500'} bg-opacity-5 border-2 border-${(colorTokens.textAccent || 'text-blue-600').replace('text-', '')}` 
                    : `${colorTokens.bgNeutral} border ${colorTokens.borderColor}`
                }`}>
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getStageColor(index)}`}>
                    {getStageIcon(stageIcons[index], index)}
                  </div>

                  {/* Title */}
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleStageTitleUpdate(index, e.target.value)}
                      className={`w-full text-center text-xl font-semibold bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-3 ${
                        index === stageTitles.length - 1 ? colorTokens.textAccent : colorTokens.textPrimary
                      }`}
                      style={fonts.h3}
                    />
                  ) : (
                    <h3 className={`text-xl font-semibold mb-3 ${
                      index === stageTitles.length - 1 ? colorTokens.textAccent : colorTokens.textPrimary
                    }`} style={fonts.h3}>
                      {title}
                    </h3>
                  )}

                  {/* Description */}
                  {mode === 'edit' ? (
                    <textarea
                      value={stageDescriptions[index]}
                      onChange={(e) => handleStageDescriptionUpdate(index, e.target.value)}
                      className={`w-full text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textSecondary}`}
                      style={getTextStyle('body')}
                      rows={3}
                    />
                  ) : (
                    <p className={colorTokens.textSecondary} style={getTextStyle('body')}>
                      {stageDescriptions[index]}
                    </p>
                  )}

                  {/* Progress Indicator */}
                  {index < stageTitles.length - 1 && (
                    <div className="hidden md:flex absolute -right-4 top-16 z-10">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Mobile Progress Arrow */}
                {index < stageTitles.length - 1 && (
                  <div className="flex justify-center mt-4 md:hidden">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {(blockContent.cta_text || mode === 'edit') && (
          <div className="text-center mt-12">
            <button className={`${colorTokens.bgAccent} text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center`}>
              <EditableAdaptiveText
                content={blockContent.cta_text || 'Add CTA text...'}
                mode={mode}
                onUpdate={(value) => handleContentUpdate('cta_text', value)}
                className={!blockContent.cta_text && mode === 'edit' ? 'opacity-75' : ''}
                fonts={fonts}
                colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                variant="button"
              />
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}