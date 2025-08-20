import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import IconEditableText from '@/components/ui/IconEditableText';

// Content interface for type safety
interface AnimatedUpgradePathContent {
  headline: string;
  subheadline?: string;
  stage_titles: string;
  stage_descriptions: string;
  stage_icons?: string;
  stage_icon_1?: string;
  stage_icon_2?: string;
  stage_icon_3?: string;
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
  stage_icon_1: { 
    type: 'string' as const, 
    default: '⚠️' 
  },
  stage_icon_2: { 
    type: 'string' as const, 
    default: '🔧' 
  },
  stage_icon_3: { 
    type: 'string' as const, 
    default: '🚀' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Transformation' 
  }
};

// AnimatedUpgradePath component - Visual journey from current state to ideal state
export default function AnimatedUpgradePath(props: LayoutComponentProps) {
  const { sectionId, className = '', backgroundType = 'secondary' } = props;
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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

  // Create typography styles
  const h3Style = getTypographyStyle('h3');

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

  // Icon edit handler
  const handleStageIconEdit = (index: number, value: string) => {
    const iconField = `stage_icon_${index + 1}` as keyof AnimatedUpgradePathContent;
    handleContentUpdate(iconField, value);
  };

  // Get stage icon value
  const getStageIconValue = (index: number) => {
    const iconFields = ['stage_icon_1', 'stage_icon_2', 'stage_icon_3'];
    return blockContent[iconFields[index] as keyof AnimatedUpgradePathContent] || ['⚠️', '🔧', '🚀'][index];
  };


  // Get stage color styling
  const getStageColor = (index: number) => {
    if (index === 0) return 'text-red-500 bg-red-100';
    if (index === 1) return 'text-yellow-500 bg-yellow-100';
    return `text-primary bg-primary bg-opacity-20`;
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
            value={blockContent.headline || ''}
            mode={mode}
            onEdit={(value) => handleContentUpdate('headline', value)}
            className="mb-4"
            level="h1"
            backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
            colorTokens={colorTokens}
            sectionBackground={sectionBackground}
          />
          
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              value={blockContent.subheadline || 'Add subheadline...'}
              mode={mode}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              className={`max-w-2xl mx-auto ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
              backgroundType={backgroundType === 'custom' ? 'secondary' : (backgroundType || 'secondary')}
              colorTokens={colorTokens}
              variant="body"
              sectionBackground={sectionBackground}
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
                    ? `bg-primary bg-opacity-5 border-2 border-primary` 
                    : `${colorTokens.bgNeutral} border border-gray-200`
                }`}>
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getStageColor(index)} group/icon-edit`}>
                    <IconEditableText
                      mode={mode}
                      value={getStageIconValue(index)}
                      onEdit={(value) => handleStageIconEdit(index, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      iconSize="xl"
                      className="text-4xl"
                      sectionId={sectionId}
                      elementKey={`stage_icon_${index + 1}`}
                    />
                  </div>

                  {/* Title */}
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleStageTitleUpdate(index, e.target.value)}
                      style={h3Style}
                      className={`w-full text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mb-3 ${
                        index === stageTitles.length - 1 ? 'text-primary' : colorTokens.textPrimary
                      }`}
                    />
                  ) : (
                    <h3 style={h3Style} className={`mb-3 ${
                      index === stageTitles.length - 1 ? 'text-primary' : colorTokens.textPrimary
                    }`}>
                      {title}
                    </h3>
                  )}

                  {/* Description */}
                  {mode === 'edit' ? (
                    <textarea
                      value={stageDescriptions[index]}
                      onChange={(e) => handleStageDescriptionUpdate(index, e.target.value)}
                      className={`w-full text-center bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 resize-none ${colorTokens.textSecondary}`}
                      rows={3}
                    />
                  ) : (
                    <p className={colorTokens.textSecondary}>
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
            <button className={`bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center`}>
              <EditableAdaptiveText
                value={blockContent.cta_text || 'Add CTA text...'}
                mode={mode}
                onEdit={(value) => handleContentUpdate('cta_text', value)}
                className={!blockContent.cta_text && mode === 'edit' ? 'opacity-75' : ''}
                backgroundType="secondary"
                colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                variant="body"
                sectionBackground={sectionBackground}
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