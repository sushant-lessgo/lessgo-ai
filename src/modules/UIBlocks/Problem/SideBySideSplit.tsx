import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { RESPONSIVE_GAP } from '@/config/spacingConfig';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SideBySideSplitContent {
  headline: string;
  problem_title: string;
  problem_description: string;
  solution_preview: string;
  problem_points?: string;
  solution_points?: string;
  call_to_action?: string;
  transition_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  bottom_stat_1?: string;
  bottom_stat_1_label?: string;
  bottom_stat_2?: string;
  bottom_stat_2_label?: string;
  bottom_stat_3?: string;
  bottom_stat_3_label?: string;
  cta_section_message?: string;
  path_1_icon?: string;
  path_2_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Two Paths: Which One Are You On?' 
  },
  problem_title: { 
    type: 'string' as const, 
    default: 'The Problem Path' 
  },
  problem_description: { 
    type: 'string' as const, 
    default: 'You\'re stuck in a cycle of inefficiency, constantly putting out fires instead of building your business. Each day feels harder than the last, and you\'re losing ground to competitors who have figured out what you\'re still struggling with.' 
  },
  solution_preview: { 
    type: 'string' as const, 
    default: 'There\'s a better way. Successful businesses have already made the switch to automated, streamlined operations that free up time for strategic growth. They\'re not working harder—they\'re working smarter.' 
  },
  problem_points: { 
    type: 'string' as const, 
    default: 'Constant firefighting mode|Manual processes eating time|Team burnout and frustration|Missing growth opportunities|Falling behind competitors' 
  },
  solution_points: { 
    type: 'string' as const, 
    default: 'Strategic focus on growth|Automated efficient workflows|Happy and productive team|Capturing every opportunity|Leading the market' 
  },
  call_to_action: { 
    type: 'string' as const, 
    default: 'Ready to Switch Paths?' 
  },
  transition_text: { 
    type: 'string' as const, 
    default: 'The good news? You can switch paths anytime you decide to.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  bottom_stat_1: { type: 'string' as const, default: '73%' },
  bottom_stat_1_label: { type: 'string' as const, default: 'Stick with Path 1 and struggle' },
  bottom_stat_2: { type: 'string' as const, default: '27%' },
  bottom_stat_2_label: { type: 'string' as const, default: 'Switch to Path 2 and thrive' },
  bottom_stat_3: { type: 'string' as const, default: '2.5x' },
  bottom_stat_3_label: { type: 'string' as const, default: 'For businesses on Path 2' },
  cta_section_message: { type: 'string' as const, default: 'The choice is yours. Every day you stay on Path 1 is another day your competitors pull ahead on Path 2.' },
  path_1_icon: { type: 'string' as const, default: '⚠️' },
  path_2_icon: { type: 'string' as const, default: '✓' }
};

export default function SideBySideSplit(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<SideBySideSplitContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const problemPoints = blockContent.problem_points 
    ? blockContent.problem_points.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const solutionPoints = blockContent.solution_points 
    ? blockContent.solution_points.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SideBySideSplit"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the path comparison..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Side-by-Side Split Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_title || ''}
                  onEdit={(value) => handleContentUpdate('problem_title', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem section title"
                  sectionId={sectionId}
                  elementKey="problem_title"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_description || ''}
                  onEdit={(value) => handleContentUpdate('problem_description', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem description"
                  sectionId={sectionId}
                  elementKey="problem_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.solution_preview || ''}
                  onEdit={(value) => handleContentUpdate('solution_preview', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Solution preview description"
                  sectionId={sectionId}
                  elementKey="solution_preview"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_points || ''}
                  onEdit={(value) => handleContentUpdate('problem_points', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem points (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_points"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.solution_points || ''}
                  onEdit={(value) => handleContentUpdate('solution_points', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Solution points (pipe separated)"
                  sectionId={sectionId}
                  elementKey="solution_points"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Split Section */}
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 lg:mb-16">
              
              {/* Problem Side */}
              <div className="relative">
                {/* Path Indicator */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    PATH 1
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-red-200 h-full">
                  {/* Problem Header */}
                  <div className="text-center mb-6 md:mb-8">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group/icon-edit relative">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.path_1_icon || '⚠️'}
                        onEdit={(value) => handleContentUpdate('path_1_icon', value)}
                        backgroundType={backgroundType as any}
                        colorTokens={{...colorTokens, textPrimary: 'text-white'}}
                        iconSize="xl"
                        className="text-3xl text-white"
                        sectionId={sectionId}
                        elementKey="path_1_icon"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{blockContent.problem_title}</h3>
                  </div>
                  
                  {/* Problem Description */}
                  <div className="mb-6 md:mb-8">
                    <p className="text-gray-700 leading-relaxed">
                      {blockContent.problem_description}
                    </p>
                  </div>
                  
                  {/* Problem Points */}
                  <div className="space-y-3 md:space-y-4">
                    {problemPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Downward Arrow */}
                  <div className="flex justify-center mt-6 md:mt-8">
                    <div className="w-8 h-8 text-red-500">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Solution Side */}
              <div className="relative">
                {/* Path Indicator */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    PATH 2
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 md:p-8 border-2 border-green-200 h-full">
                  {/* Solution Header */}
                  <div className="text-center mb-6 md:mb-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group/icon-edit relative">
                      <IconEditableText
                        mode={mode}
                        value={blockContent.path_2_icon || '✓'}
                        onEdit={(value) => handleContentUpdate('path_2_icon', value)}
                        backgroundType={backgroundType as any}
                        colorTokens={{...colorTokens, textPrimary: 'text-white'}}
                        iconSize="xl"
                        className="text-3xl text-white"
                        sectionId={sectionId}
                        elementKey="path_2_icon"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">The Solution Path</h3>
                  </div>
                  
                  {/* Solution Description */}
                  <div className="mb-6 md:mb-8">
                    <p className="text-gray-700 leading-relaxed">
                      {blockContent.solution_preview}
                    </p>
                  </div>
                  
                  {/* Solution Points */}
                  <div className="space-y-3 md:space-y-4">
                    {solutionPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upward Arrow */}
                  <div className="flex justify-center mt-6 md:mt-8">
                    <div className="w-8 h-8 text-green-500">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transition Section */}
            <div className="text-center mb-16">
              <div className="max-w-4xl mx-auto">
                {/* VS Divider */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
                  <div className="mx-8 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">VS</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
                </div>
                
                {blockContent.transition_text && (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
                    <p className="text-xl font-semibold text-blue-900 mb-4">
                      {blockContent.transition_text}
                    </p>
                  </div>
                )}
                
                {blockContent.call_to_action && (
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">{blockContent.call_to_action}</h3>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.cta_section_message || ''}
                      onEdit={(value) => handleContentUpdate('cta_section_message', value)}
                      backgroundType={backgroundType}
                      colorTokens={{...colorTokens, textPrimary: 'text-green-100'}}
                      variant="body"
                      className="mb-8 max-w-2xl mx-auto"
                      placeholder="The choice is yours. Every day you stay on Path 1 is another day your competitors pull ahead on Path 2."
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="cta_section_message"
                    />
                    
                    <CTAButton
                      text="Choose the Better Path"
                      colorTokens={{...colorTokens, ctaBg: 'bg-white', ctaText: 'text-blue-600'}}
                      className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                      variant="primary"
                      sectionId={sectionId}
                      elementKey="main_cta"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Statistics */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
                The Results Speak for Themselves
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group/bottom-stat relative">
                  <div className="flex items-center justify-center mb-2">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.bottom_stat_1 || ''}
                      onEdit={(value) => handleContentUpdate('bottom_stat_1', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-red-600"
                      placeholder="73%"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="bottom_stat_1"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('bottom_stat_1', '___REMOVED___');
                          handleContentUpdate('bottom_stat_1_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/bottom-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                        title="Remove this statistic"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className={`text-sm ${mutedTextColor} mb-2`}>of businesses</div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.bottom_stat_1_label || ''}
                    onEdit={(value) => handleContentUpdate('bottom_stat_1_label', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm text-gray-700"
                    placeholder="Stick with Path 1 and struggle"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="bottom_stat_1_label"
                  />
                </div>
                
                <div className="text-center group/bottom-stat relative">
                  <div className="flex items-center justify-center mb-2">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.bottom_stat_2 || ''}
                      onEdit={(value) => handleContentUpdate('bottom_stat_2', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-green-600"
                      placeholder="27%"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="bottom_stat_2"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('bottom_stat_2', '___REMOVED___');
                          handleContentUpdate('bottom_stat_2_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/bottom-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                        title="Remove this statistic"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className={`text-sm ${mutedTextColor} mb-2`}>of businesses</div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.bottom_stat_2_label || ''}
                    onEdit={(value) => handleContentUpdate('bottom_stat_2_label', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm text-gray-700"
                    placeholder="Switch to Path 2 and thrive"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="bottom_stat_2_label"
                  />
                </div>
                
                <div className="text-center group/bottom-stat relative">
                  <div className="flex items-center justify-center mb-2">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.bottom_stat_3 || ''}
                      onEdit={(value) => handleContentUpdate('bottom_stat_3', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-blue-600"
                      placeholder="2.5x"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="bottom_stat_3"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('bottom_stat_3', '___REMOVED___');
                          handleContentUpdate('bottom_stat_3_label', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/bottom-stat:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                        title="Remove this statistic"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className={`text-sm ${mutedTextColor} mb-2`}>faster growth</div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.bottom_stat_3_label || ''}
                    onEdit={(value) => handleContentUpdate('bottom_stat_3_label', value)}
                    backgroundType={backgroundType}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm text-gray-700"
                    placeholder="For businesses on Path 2"
                    sectionBackground={sectionBackground}
                    data-section-id={sectionId}
                    data-element-key="bottom_stat_3_label"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the path choice..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {trustItems.length > 0 && (
              <TrustIndicators 
                items={trustItems}
                colorClass={mutedTextColor}
                iconColor="text-green-500"
              />
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SideBySideSplit',
  category: 'Problem',
  description: 'Side-by-side path comparison showing problem vs solution routes. Perfect for choice-driven problem presentation.',
  tags: ['comparison', 'paths', 'choice', 'problem-solution', 'split-screen'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'problem_title', label: 'Problem Section Title', type: 'text', required: true },
    { key: 'problem_description', label: 'Problem Description', type: 'textarea', required: true },
    { key: 'solution_preview', label: 'Solution Preview Description', type: 'textarea', required: true },
    { key: 'problem_points', label: 'Problem Points (pipe separated)', type: 'textarea', required: false },
    { key: 'solution_points', label: 'Solution Points (pipe separated)', type: 'textarea', required: false },
    { key: 'call_to_action', label: 'Call to Action Text', type: 'text', required: false },
    { key: 'transition_text', label: 'Transition Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'bottom_stat_1', label: 'Bottom Statistic 1', type: 'text', required: false },
    { key: 'bottom_stat_1_label', label: 'Bottom Statistic 1 Label', type: 'text', required: false },
    { key: 'bottom_stat_2', label: 'Bottom Statistic 2', type: 'text', required: false },
    { key: 'bottom_stat_2_label', label: 'Bottom Statistic 2 Label', type: 'text', required: false },
    { key: 'bottom_stat_3', label: 'Bottom Statistic 3', type: 'text', required: false },
    { key: 'bottom_stat_3_label', label: 'Bottom Statistic 3 Label', type: 'text', required: false },
    { key: 'cta_section_message', label: 'CTA Section Message', type: 'text', required: false },
    { key: 'path_1_icon', label: 'Problem Path Icon', type: 'icon', required: false },
    { key: 'path_2_icon', label: 'Solution Path Icon', type: 'icon', required: false }
  ],
  
  features: [
    'Side-by-side path comparison',
    'Visual path indicators and arrows',
    'Problem vs solution point lists',
    'VS divider with transition section',
    'Results statistics display',
    'Choice-driven CTA section'
  ],
  
  useCases: [
    'Problem/solution path comparison',
    'Choice-based decision sections',
    'Business transformation options',
    'Service approach comparisons',
    'Strategic path presentations'
  ]
};