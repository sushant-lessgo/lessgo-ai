import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Schema types - arrays instead of pipe-separated strings
interface PointItem {
  id: string;
  text: string;
}

interface StatItem {
  id: string;
  value: string;
  label: string;
}

interface TrustItem {
  id: string;
  text: string;
}

interface SideBySideSplitContent {
  headline: string;
  subheadline?: string;
  problem_title: string;
  problem_description: string;
  solution_preview: string;
  transition_text?: string;
  call_to_action?: string;
  cta_section_message?: string;
  supporting_text?: string;
  path_1_icon?: string;
  path_2_icon?: string;
  // V2: Arrays instead of pipe-separated strings
  problem_points?: PointItem[];
  solution_points?: PointItem[];
  bottom_stats?: StatItem[];
  trust_items?: TrustItem[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Two Paths: Which One Are You On?'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  problem_title: {
    type: 'string' as const,
    default: 'The Problem Path'
  },
  problem_description: {
    type: 'string' as const,
    default: 'You\'re stuck in a cycle of inefficiency, constantly putting out fires instead of building your business. Each day feels harder than the last.'
  },
  solution_preview: {
    type: 'string' as const,
    default: 'There\'s a better way. Successful businesses have already made the switch to automated, streamlined operations that free up time for strategic growth.'
  },
  transition_text: {
    type: 'string' as const,
    default: 'The good news? You can switch paths anytime you decide to.'
  },
  call_to_action: {
    type: 'string' as const,
    default: 'Ready to Switch Paths?'
  },
  cta_section_message: {
    type: 'string' as const,
    default: 'The choice is yours. Every day you stay on Path 1 is another day your competitors pull ahead on Path 2.'
  },
  supporting_text: {
    type: 'string' as const,
    default: ''
  },
  path_1_icon: { type: 'string' as const, default: '⚠️' },
  path_2_icon: { type: 'string' as const, default: '✓' },
  problem_points: {
    type: 'array' as const,
    default: [
      { id: 'pp1', text: 'Constant firefighting mode' },
      { id: 'pp2', text: 'Manual processes eating time' },
      { id: 'pp3', text: 'Team burnout and frustration' },
      { id: 'pp4', text: 'Missing growth opportunities' },
      { id: 'pp5', text: 'Falling behind competitors' }
    ]
  },
  solution_points: {
    type: 'array' as const,
    default: [
      { id: 'sp1', text: 'Strategic focus on growth' },
      { id: 'sp2', text: 'Automated efficient workflows' },
      { id: 'sp3', text: 'Happy and productive team' },
      { id: 'sp4', text: 'Capturing every opportunity' },
      { id: 'sp5', text: 'Leading the market' }
    ]
  },
  bottom_stats: {
    type: 'array' as const,
    default: [
      { id: 'stat1', value: '73%', label: 'Stick with Path 1 and struggle' },
      { id: 'stat2', value: '27%', label: 'Switch to Path 2 and thrive' },
      { id: 'stat3', value: '2.5x', label: 'For businesses on Path 2' }
    ]
  },
  trust_items: {
    type: 'array' as const,
    default: []
  }
};

// Helper to generate unique ID
const generateId = () => `item${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function SideBySideSplit(props: LayoutComponentProps) {

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<SideBySideSplitContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection for accents (VS divider, stat section bg)
  const theme: UIBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based accent colors (keeps semantic red/green for problem/solution)
  const getThemeAccents = (theme: UIBlockTheme) => {
    return {
      warm: {
        vsDividerBg: 'bg-orange-500',
        statSectionBg: 'bg-orange-50',
        statSectionBorder: 'border-orange-100',
        trustIconColor: 'text-orange-500'
      },
      cool: {
        vsDividerBg: 'bg-blue-500',
        statSectionBg: 'bg-blue-50',
        statSectionBorder: 'border-blue-100',
        trustIconColor: 'text-blue-500'
      },
      neutral: {
        vsDividerBg: 'bg-gray-500',
        statSectionBg: 'bg-gray-50',
        statSectionBorder: 'border-gray-100',
        trustIconColor: 'text-gray-500'
      }
    }[theme];
  };

  const themeAccents = getThemeAccents(theme);

  // Get arrays from content (V2 format)
  const problemPoints: PointItem[] = blockContent.problem_points || CONTENT_SCHEMA.problem_points.default;
  const solutionPoints: PointItem[] = blockContent.solution_points || CONTENT_SCHEMA.solution_points.default;
  const bottomStats: StatItem[] = blockContent.bottom_stats || CONTENT_SCHEMA.bottom_stats.default;
  const trustItems: TrustItem[] = blockContent.trust_items || [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Update point in array
  const updatePoint = (arrayKey: 'problem_points' | 'solution_points', id: string, newText: string) => {
    const array = arrayKey === 'problem_points' ? problemPoints : solutionPoints;
    const updated = array.map(p => p.id === id ? { ...p, text: newText } : p);
    handleContentUpdate(arrayKey, updated);
  };

  // Add point to array
  const addPoint = (arrayKey: 'problem_points' | 'solution_points') => {
    const array = arrayKey === 'problem_points' ? problemPoints : solutionPoints;
    if (array.length >= 5) return;
    const newPoint = { id: generateId(), text: 'New point...' };
    handleContentUpdate(arrayKey, [...array, newPoint]);
  };

  // Remove point from array
  const removePoint = (arrayKey: 'problem_points' | 'solution_points', id: string) => {
    const array = arrayKey === 'problem_points' ? problemPoints : solutionPoints;
    if (array.length <= 3) return;
    handleContentUpdate(arrayKey, array.filter(p => p.id !== id));
  };

  // Update stat
  const updateStat = (id: string, field: 'value' | 'label', value: string) => {
    const updated = bottomStats.map(s => s.id === id ? { ...s, [field]: value } : s);
    handleContentUpdate('bottom_stats', updated);
  };

  // Remove stat
  const removeStat = (id: string) => {
    if (bottomStats.length <= 0) return;
    handleContentUpdate('bottom_stats', bottomStats.filter(s => s.id !== id));
  };

  // Add stat
  const addStat = () => {
    if (bottomStats.length >= 3) return;
    const newStat = { id: generateId(), value: '0%', label: 'New statistic label' };
    handleContentUpdate('bottom_stats', [...bottomStats, newStat]);
  };

  // Stat colors cycle through red, green, blue
  const getStatColor = (index: number) => {
    const colors = ['text-red-600', 'text-green-600', 'text-blue-600'];
    return colors[index % colors.length];
  };

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

        {/* Main Split Section */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 lg:mb-16">

          {/* Problem Side - Always Red */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                PATH 1
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-red-200 h-full">
              <div className="text-center mb-6 md:mb-8">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.path_1_icon || '⚠️'}
                    onEdit={(value) => handleContentUpdate('path_1_icon', value)}
                    backgroundType={backgroundType as any}
                    colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                    iconSize="xl"
                    className="text-3xl text-white"
                    sectionId={sectionId}
                    elementKey="path_1_icon"
                  />
                </div>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_title || ''}
                  onEdit={(value) => handleContentUpdate('problem_title', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-2xl font-bold text-gray-900 mb-4"
                  placeholder="Problem section title"
                  sectionId={sectionId}
                  elementKey="problem_title"
                  sectionBackground={sectionBackground}
                />
              </div>

              <div className="mb-6 md:mb-8">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_description || ''}
                  onEdit={(value) => handleContentUpdate('problem_description', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 leading-relaxed"
                  placeholder="Problem description"
                  sectionId={sectionId}
                  elementKey="problem_description"
                  sectionBackground={sectionBackground}
                />
              </div>

              {/* Problem Points */}
              <div className="space-y-3 md:space-y-4">
                {problemPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-3 group">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={point.text}
                      onEdit={(value) => updatePoint('problem_points', point.id, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium flex-1"
                      placeholder="Problem point..."
                      sectionId={sectionId}
                      elementKey={`problem_point_${point.id}`}
                      sectionBackground={sectionBackground}
                    />
                    {mode !== 'preview' && problemPoints.length > 3 && (
                      <button
                        onClick={() => removePoint('problem_points', point.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                        title="Remove point"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {mode !== 'preview' && problemPoints.length < 5 && (
                <button
                  onClick={() => addPoint('problem_points')}
                  className="mt-4 text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Point
                </button>
              )}

              <div className="flex justify-center mt-6 md:mt-8">
                <div className="w-8 h-8 text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Solution Side - Always Green */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                PATH 2
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 md:p-8 border-2 border-green-200 h-full">
              <div className="text-center mb-6 md:mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group/icon-edit relative">
                  <IconEditableText
                    mode={mode}
                    value={blockContent.path_2_icon || '✓'}
                    onEdit={(value) => handleContentUpdate('path_2_icon', value)}
                    backgroundType={backgroundType as any}
                    colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                    iconSize="xl"
                    className="text-3xl text-white"
                    sectionId={sectionId}
                    elementKey="path_2_icon"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Solution Path</h3>
              </div>

              <div className="mb-6 md:mb-8">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.solution_preview || ''}
                  onEdit={(value) => handleContentUpdate('solution_preview', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 leading-relaxed"
                  placeholder="Solution preview description"
                  sectionId={sectionId}
                  elementKey="solution_preview"
                  sectionBackground={sectionBackground}
                />
              </div>

              {/* Solution Points */}
              <div className="space-y-3 md:space-y-4">
                {solutionPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-3 group">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={point.text}
                      onEdit={(value) => updatePoint('solution_points', point.id, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-700 font-medium flex-1"
                      placeholder="Solution point..."
                      sectionId={sectionId}
                      elementKey={`solution_point_${point.id}`}
                      sectionBackground={sectionBackground}
                    />
                    {mode !== 'preview' && solutionPoints.length > 3 && (
                      <button
                        onClick={() => removePoint('solution_points', point.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                        title="Remove point"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {mode !== 'preview' && solutionPoints.length < 5 && (
                <button
                  onClick={() => addPoint('solution_points')}
                  className="mt-4 text-sm text-green-600 hover:text-green-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Point
                </button>
              )}

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
            {/* VS Divider - Theme accent color */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
              <div className={`mx-8 w-16 h-16 ${themeAccents.vsDividerBg} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">VS</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>

            {(blockContent.transition_text || mode === 'edit') && (
              <div className={`${themeAccents.statSectionBg} rounded-xl p-6 ${themeAccents.statSectionBorder} border mb-8`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.transition_text || ''}
                  onEdit={(value) => handleContentUpdate('transition_text', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-xl font-semibold text-gray-900"
                  placeholder="Add transition text..."
                  sectionId={sectionId}
                  elementKey="transition_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}

            {(blockContent.call_to_action || mode === 'edit') && (
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.call_to_action || ''}
                  onEdit={(value) => handleContentUpdate('call_to_action', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                  variant="body"
                  className="text-2xl font-bold mb-4"
                  placeholder="Call to action headline..."
                  sectionId={sectionId}
                  elementKey="call_to_action"
                  sectionBackground={sectionBackground}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.cta_section_message || ''}
                  onEdit={(value) => handleContentUpdate('cta_section_message', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={{ ...colorTokens, textPrimary: 'text-green-100' }}
                  variant="body"
                  className="mb-8 max-w-2xl mx-auto text-green-100"
                  placeholder="CTA section message..."
                  sectionId={sectionId}
                  elementKey="cta_section_message"
                  sectionBackground={sectionBackground}
                />

                <CTAButton
                  text="Choose the Better Path"
                  colorTokens={{ ...colorTokens, ctaBg: 'bg-white', ctaText: 'text-blue-600' }}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="main_cta"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Statistics - Theme accent background */}
        {(bottomStats.length > 0 || mode === 'edit') && (
          <div className={`${themeAccents.statSectionBg} rounded-2xl p-8 border ${themeAccents.statSectionBorder}`}>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
              The Results Speak for Themselves
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {bottomStats.map((stat, index) => (
                <div key={stat.id} className="text-center group relative">
                  <div className="flex items-center justify-center mb-2">
                    <EditableAdaptiveText
                      mode={mode}
                      value={stat.value}
                      onEdit={(value) => updateStat(stat.id, 'value', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-3xl font-bold ${getStatColor(index)}`}
                      placeholder="0%"
                      sectionId={sectionId}
                      elementKey={`stat_value_${stat.id}`}
                      sectionBackground={sectionBackground}
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={() => removeStat(stat.id)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200"
                        title="Remove statistic"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className={`text-sm ${mutedTextColor} mb-2`}>
                    {index === 2 ? 'faster growth' : 'of businesses'}
                  </div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={stat.label}
                    onEdit={(value) => updateStat(stat.id, 'label', value)}
                    backgroundType={backgroundType as any}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-sm text-gray-700"
                    placeholder="Statistic label..."
                    sectionId={sectionId}
                    elementKey={`stat_label_${stat.id}`}
                    sectionBackground={sectionBackground}
                  />
                </div>
              ))}
            </div>

            {mode !== 'preview' && bottomStats.length < 3 && (
              <div className="mt-6 text-center">
                <button
                  onClick={addStat}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center mx-auto"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Statistic
                </button>
              </div>
            )}
          </div>
        )}

        {(blockContent.supporting_text || trustItems.length > 0 || mode === 'edit') && (
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
                placeholder="Add optional supporting text..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {trustItems.length > 0 && (
              <TrustIndicators
                items={trustItems.map(t => t.text)}
                colorClass={mutedTextColor}
                iconColor={themeAccents.trustIconColor}
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
    { key: 'solution_preview', label: 'Solution Preview', type: 'textarea', required: true },
    { key: 'problem_points', label: 'Problem Points', type: 'array', required: false },
    { key: 'solution_points', label: 'Solution Points', type: 'array', required: false },
    { key: 'bottom_stats', label: 'Bottom Statistics', type: 'array', required: false },
    { key: 'call_to_action', label: 'Call to Action', type: 'text', required: false },
    { key: 'transition_text', label: 'Transition Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Items', type: 'array', required: false }
  ],

  features: [
    'Side-by-side path comparison',
    'Semantic red/green colors',
    'Theme-based accent colors',
    'V2 array-based data format',
    'Dynamic add/remove points and stats',
    'VS divider with transition section'
  ],

  useCases: [
    'Problem/solution path comparison',
    'Choice-based decision sections',
    'Business transformation options',
    'Service approach comparisons',
    'Strategic path presentations'
  ]
};
