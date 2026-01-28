import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import {
  TrustIndicators
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// V2 Schema types - arrays instead of pipe-separated strings
interface ProblemItem {
  id: string;
  title: string;
  description: string;
  expand_label: string;
  impact: string;
  solution_hint: string;
  icon?: string;
}

interface TrustItem {
  id: string;
  text: string;
}

interface CollapsedCardsContent {
  headline: string;
  subheadline?: string;
  intro_text?: string;
  supporting_text?: string;
  // V2: Arrays instead of pipe-separated strings
  problems?: ProblemItem[];
  trust_items?: TrustItem[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'What Business Challenges Are Keeping You Up at Night?'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  intro_text: {
    type: 'string' as const,
    default: 'Every business faces challenges, but some problems compound faster than others. Click on any challenge below to see if it resonates with your experience:'
  },
  supporting_text: {
    type: 'string' as const,
    default: ''
  },
  problems: {
    type: 'array' as const,
    default: [
      { id: 'p1', title: 'Time Management Crisis', description: 'You\'re spending countless hours on tasks that should take minutes. Manual processes are eating up valuable time that could be spent growing your business.', expand_label: 'Learn More', impact: 'Lost revenue, missed opportunities, personal burnout', solution_hint: 'Automated workflows can reclaim 15+ hours per week', icon: '⏰' },
      { id: 'p2', title: 'Resource Allocation Nightmare', description: 'Your team, budget, and tools are scattered across different systems. You can\'t get a clear picture of what\'s working and what\'s not.', expand_label: 'See Details', impact: 'Poor ROI, wasted spending, competitive disadvantage', solution_hint: 'Centralized dashboards provide real-time visibility', icon: '📊' },
      { id: 'p3', title: 'Communication Breakdown', description: 'Important information gets lost in email chains, Slack threads, and forgotten meetings. Team members are working with outdated information.', expand_label: 'View Impact', impact: 'Errors increase, team morale drops, projects fail', solution_hint: 'Unified communication hubs eliminate information silos', icon: '💬' },
    ]
  },
  trust_items: {
    type: 'array' as const,
    default: []
  }
};

// Helper to generate unique ID
const generateId = () => `p${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default icons for new problems
const DEFAULT_PROBLEM_ICONS = ['🚨', '⚠️', '❌', '🔥', '💔', '😓', '⏰', '📊', '💬', '⚙️', '👥', '🎯'];

export default function CollapsedCards(props: LayoutComponentProps) {

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<CollapsedCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection with priority: manual override > auto-detection > neutral
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Color mapping for theme-based styling
  const getSolutionColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconColor: 'text-orange-500',
        textPrimary: 'text-orange-900',
        textSecondary: 'text-orange-800',
        expandedIconBg: 'bg-orange-500',
        expandedBorder: 'border-orange-300',
        trustIconColor: 'text-orange-500'
      },
      cool: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconColor: 'text-blue-500',
        textPrimary: 'text-blue-900',
        textSecondary: 'text-blue-800',
        expandedIconBg: 'bg-blue-500',
        expandedBorder: 'border-blue-300',
        trustIconColor: 'text-blue-500'
      },
      neutral: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        iconColor: 'text-gray-500',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-800',
        expandedIconBg: 'bg-gray-500',
        expandedBorder: 'border-gray-300',
        trustIconColor: 'text-gray-500'
      }
    }[theme];
  };

  const solutionColors = getSolutionColors(theme);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Get problems array from content (V2 format)
  const problems: ProblemItem[] = blockContent.problems || CONTENT_SCHEMA.problems.default;

  // Get trust items array
  const trustItems: TrustItem[] = blockContent.trust_items || [];

  // Set initial expanded card in edit mode
  React.useEffect(() => {
    if (mode !== 'preview' && problems.length > 0 && expandedCard === null) {
      setExpandedCard(problems[0].id);
    }
  }, [mode, problems, expandedCard]);

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  // Add new problem card
  const addProblemCard = () => {
    if (problems.length >= 6) return;

    const newProblem: ProblemItem = {
      id: generateId(),
      title: 'New Problem',
      description: 'Describe this problem in detail...',
      expand_label: 'Learn More',
      impact: 'Impact of this problem...',
      solution_hint: 'How our solution helps...',
      icon: DEFAULT_PROBLEM_ICONS[Math.floor(Math.random() * DEFAULT_PROBLEM_ICONS.length)]
    };

    handleContentUpdate('problems', [...problems, newProblem]);
  };

  // Remove problem card
  const removeProblemCard = (id: string) => {
    if (problems.length <= 1) return;

    // Close expanded card if it's being removed
    if (expandedCard === id) {
      setExpandedCard(null);
    }

    handleContentUpdate('problems', problems.filter(p => p.id !== id));
  };

  // Update a specific field in a problem
  const updateProblemField = (id: string, field: keyof ProblemItem, value: string) => {
    const updated = problems.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    handleContentUpdate('problems', updated);
  };

  const ProblemCard = ({ problem, onRemove, canRemove }: {
    problem: ProblemItem;
    onRemove: (id: string) => void;
    canRemove: boolean;
  }) => {
    const isExpanded = expandedCard === problem.id;

    return (
      <div
        className={`group bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden ${
          isExpanded
            ? `${solutionColors.expandedBorder} shadow-xl`
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Card Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className={`w-12 h-12 rounded-lg ${isExpanded ? solutionColors.expandedIconBg : 'bg-gray-100'} flex items-center justify-center ${isExpanded ? 'text-white' : 'text-gray-600'} transition-colors duration-300 group/icon-edit relative`}>
                <IconEditableText
                  mode={mode}
                  value={problem.icon || '⚙️'}
                  onEdit={(value) => updateProblemField(problem.id, 'icon', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="lg"
                  className="text-2xl"
                  sectionId={sectionId}
                  elementKey={`problem_icon_${problem.id}`}
                />
              </div>
              <div className="flex-1">
                <div className="mb-1">
                  <EditableAdaptiveText
                    mode={mode}
                    value={problem.title}
                    onEdit={(value) => updateProblemField(problem.id, 'title', value)}
                    backgroundType={backgroundType as any}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-lg font-semibold text-gray-900"
                    placeholder="Problem title"
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    elementKey={`problem_title_${problem.id}`}
                  />
                </div>
                <div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={isExpanded ? 'Tap to collapse' : problem.expand_label}
                    onEdit={(value) => updateProblemField(problem.id, 'expand_label', value)}
                    backgroundType={backgroundType as any}
                    colorTokens={colorTokens}
                    variant="body"
                    className={`text-sm ${mutedTextColor}`}
                    placeholder="Expand label"
                    sectionBackground={sectionBackground}
                    sectionId={sectionId}
                    elementKey={`expand_label_${problem.id}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Remove Button (Edit Mode Only) */}
              {mode !== 'preview' && canRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (problem.title.trim() && !confirm('Are you sure you want to remove this problem card?')) {
                      return;
                    }
                    onRemove(problem.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                  title="Remove this problem card"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Dedicated Toggle Button */}
              <button
                onClick={() => toggleCard(problem.id)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                title={isExpanded ? 'Collapse card' : 'Expand card'}
                aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
              >
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`${isExpanded ? '' : 'hidden'}`}>
          <div className="px-6 pb-6 border-t border-gray-100">

            {/* Problem Description */}
            <div className="mb-6 mt-4">
              <EditableAdaptiveText
                mode={mode}
                value={problem.description}
                onEdit={(value) => updateProblemField(problem.id, 'description', value)}
                backgroundType={backgroundType as any}
                colorTokens={colorTokens}
                variant="body"
                className="text-gray-700 leading-relaxed"
                placeholder="Describe this problem in detail..."
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey={`problem_description_${problem.id}`}
              />
            </div>

            {/* Impact Section */}
            {(problem.impact || mode === 'edit') && (
              <div className="mb-6 bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">The Real Impact:</h4>
                    <EditableAdaptiveText
                      mode={mode}
                      value={problem.impact}
                      onEdit={(value) => updateProblemField(problem.id, 'impact', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-red-800 text-sm"
                      placeholder="Impact of this problem..."
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`problem_impact_${problem.id}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Solution Hint */}
            {(problem.solution_hint || mode === 'edit') && (
              <div className={`${solutionColors.bg} rounded-lg p-4 border ${solutionColors.border}`}>
                <div className="flex items-start space-x-2">
                  <svg className={`w-5 h-5 ${solutionColors.iconColor} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className={`font-semibold ${solutionColors.textPrimary} mb-2`}>There's a Solution:</h4>
                    <EditableAdaptiveText
                      mode={mode}
                      value={problem.solution_hint}
                      onEdit={(value) => updateProblemField(problem.id, 'solution_hint', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`${solutionColors.textSecondary} text-sm`}
                      placeholder="How our solution helps..."
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`solution_hint_${problem.id}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CollapsedCards"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-16">
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
              placeholder="Add optional subheadline to introduce the problem cards..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {(blockContent.intro_text || mode === 'edit') && (
            <div className="max-w-3xl mx-auto mb-8">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.intro_text || ''}
                onEdit={(value) => handleContentUpdate('intro_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg leading-relaxed"
                placeholder="Add introduction text to guide users through the problem cards..."
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey="intro_text"
              />
            </div>
          )}
        </div>

        {/* Problem Cards */}
        <div className="space-y-4 mb-8">
          {problems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onRemove={removeProblemCard}
              canRemove={problems.length > 1}
            />
          ))}
        </div>

        {/* Add Problem Card Button */}
        {mode !== 'preview' && problems.length < 6 && (
          <div className="mb-16 flex justify-center">
            <button
              onClick={addProblemCard}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Problem Card</span>
            </button>
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
                placeholder="Add optional supporting text to reinforce the problem identification..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {trustItems.length > 0 && (
              <TrustIndicators
                items={trustItems.map(t => t.text)}
                colorClass={mutedTextColor}
                iconColor={solutionColors.trustIconColor}
              />
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'CollapsedCards',
  category: 'Problem',
  description: 'Interactive expandable problem cards with detailed descriptions and solution hints. Perfect for deep problem exploration.',
  tags: ['cards', 'expandable', 'interactive', 'problems', 'detailed'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'problems', label: 'Problem Cards', type: 'array', required: true },
    { key: 'trust_items', label: 'Trust Items', type: 'array', required: false }
  ],

  features: [
    'Interactive card expansion/collapse',
    'Problem impact highlighting',
    'Solution hint previews',
    'Dynamic icon system',
    'V2 array-based data format'
  ],

  useCases: [
    'Detailed problem exploration',
    'Interactive challenge assessment',
    'Problem-solution previews',
    'Educational problem identification',
    'Comprehensive pain point analysis'
  ]
};
