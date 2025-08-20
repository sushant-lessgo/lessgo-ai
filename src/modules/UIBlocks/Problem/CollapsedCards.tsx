import React, { useState } from 'react';
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

interface CollapsedCardsContent {
  headline: string;
  problem_titles: string;
  problem_descriptions: string;
  expand_labels?: string;
  problem_impacts?: string;
  solution_hints?: string;
  intro_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  problem_icon_1?: string;
  problem_icon_2?: string;
  problem_icon_3?: string;
  problem_icon_4?: string;
  problem_icon_5?: string;
  problem_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'What Business Challenges Are Keeping You Up at Night?' 
  },
  problem_titles: { 
    type: 'string' as const, 
    default: 'Time Management Crisis|Resource Allocation Nightmare|Communication Breakdown|Process Inefficiencies|Team Productivity Issues|Customer Service Delays' 
  },
  problem_descriptions: { 
    type: 'string' as const, 
    default: 'You\'re spending countless hours on tasks that should take minutes. Manual processes are eating up valuable time that could be spent growing your business, leaving you working late nights and weekends just to keep up.|Your team, budget, and tools are scattered across different systems. You can\'t get a clear picture of what\'s working and what\'s not, making it impossible to make informed decisions about where to invest your resources.|Important information gets lost in email chains, Slack threads, and forgotten meetings. Team members are working with outdated information, leading to mistakes, missed deadlines, and frustrated customers.|Your current workflows are a patchwork of band-aid solutions. What worked when you were smaller is now creating bottlenecks, errors, and endless frustration for everyone involved.|Your team is capable of so much more, but they\'re bogged down by repetitive tasks and inefficient processes. You can see the potential, but the current system is holding everyone back from doing their best work.|Customers are waiting too long for responses, updates, and resolutions. You know this is hurting your reputation and losing potential business, but you can\'t seem to get ahead of the demand.' 
  },
  expand_labels: { 
    type: 'string' as const, 
    default: 'Learn More|See Details|View Impact|Read More|Expand|Show Details' 
  },
  problem_impacts: { 
    type: 'string' as const, 
    default: 'Lost revenue, missed opportunities, personal burnout|Poor ROI, wasted spending, competitive disadvantage|Errors increase, team morale drops, projects fail|Quality suffers, costs rise, reputation damaged|Talent leaves, innovation stops, growth stagnates|Customer churn, negative reviews, market share loss' 
  },
  solution_hints: { 
    type: 'string' as const, 
    default: 'Automated workflows can reclaim 15+ hours per week|Centralized dashboards provide real-time visibility|Unified communication hubs eliminate information silos|Streamlined processes reduce errors by 80%|Smart automation frees teams for strategic work|Automated customer service reduces response time to minutes' 
  },
  intro_text: { 
    type: 'string' as const, 
    default: 'Every business faces challenges, but some problems compound faster than others. Click on any challenge below to see if it resonates with your experience:' 
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
  problem_icon_1: { type: 'string' as const, default: '⏰' },
  problem_icon_2: { type: 'string' as const, default: '📊' },
  problem_icon_3: { type: 'string' as const, default: '💬' },
  problem_icon_4: { type: 'string' as const, default: '⚙️' },
  problem_icon_5: { type: 'string' as const, default: '👥' },
  problem_icon_6: { type: 'string' as const, default: '🎯' }
};

export default function CollapsedCards(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CollapsedCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const problemTitles = blockContent.problem_titles 
    ? blockContent.problem_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problemDescriptions = blockContent.problem_descriptions 
    ? blockContent.problem_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const expandLabels = blockContent.expand_labels 
    ? blockContent.expand_labels.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problemImpacts = blockContent.problem_impacts 
    ? blockContent.problem_impacts.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const solutionHints = blockContent.solution_hints 
    ? blockContent.solution_hints.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problemCards = problemTitles.map((title, index) => ({
    title,
    description: problemDescriptions[index] || '',
    expandLabel: expandLabels[index] || 'Learn More',
    impact: problemImpacts[index] || '',
    solutionHint: solutionHints[index] || ''
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Get problem icon for specific index
  const getProblemIcon = (index: number) => {
    const iconFields = ['problem_icon_1', 'problem_icon_2', 'problem_icon_3', 'problem_icon_4', 'problem_icon_5', 'problem_icon_6'];
    return blockContent[iconFields[index] as keyof CollapsedCardsContent] || '⚙️';
  };

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const ProblemCard = ({ problem, index }: {
    problem: typeof problemCards[0];
    index: number;
  }) => {
    const isExpanded = expandedCard === index;
    
    return (
      <div 
        className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden ${
          isExpanded 
            ? 'border-red-300 shadow-xl' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Card Header */}
        <div 
          className="p-6 cursor-pointer"
          onClick={() => toggleCard(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg ${isExpanded ? 'bg-red-500' : 'bg-gray-100'} flex items-center justify-center ${isExpanded ? 'text-white' : 'text-gray-600'} transition-colors duration-300 group/icon-edit relative`}>
                <IconEditableText
                  mode={mode}
                  value={getProblemIcon(index)}
                  onEdit={(value) => {
                    const iconField = `problem_icon_${index + 1}` as keyof CollapsedCardsContent;
                    handleContentUpdate(iconField, value);
                  }}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  iconSize="lg"
                  className="text-2xl"
                  sectionId={sectionId}
                  elementKey={`problem_icon_${index + 1}`}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                <span className={`text-sm ${mutedTextColor}`}>
                  {isExpanded ? 'Tap to collapse' : problem.expandLabel}
                </span>
              </div>
            </div>
            
            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="px-6 pb-6 border-t border-gray-100">
            
            {/* Problem Description */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {problem.description}
              </p>
            </div>

            {/* Impact Section */}
            {problem.impact && (
              <div className="mb-6 bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">The Real Impact:</h4>
                    <p className="text-red-800 text-sm">{problem.impact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Solution Hint */}
            {problem.solutionHint && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">There's a Solution:</h4>
                    <p className="text-green-800 text-sm">{problem.solutionHint}</p>
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
                data-section-id={sectionId}
                data-element-key="intro_text"
              />
            </div>
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Collapsed Cards Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_titles || ''}
                  onEdit={(value) => handleContentUpdate('problem_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_descriptions || ''}
                  onEdit={(value) => handleContentUpdate('problem_descriptions', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_impacts || ''}
                  onEdit={(value) => handleContentUpdate('problem_impacts', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem impacts (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_impacts"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.solution_hints || ''}
                  onEdit={(value) => handleContentUpdate('solution_hints', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Solution hints (pipe separated)"
                  sectionId={sectionId}
                  elementKey="solution_hints"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Problem Cards */}
            <div className="space-y-4 mb-16">
              {problemCards.map((problem, index) => (
                <ProblemCard
                  key={index}
                  problem={problem}
                  index={index}
                />
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 mb-16">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Recognize Any of These Challenges?
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
                  If you found yourself nodding along to any of these problems, you're not alone. These are the most common challenges we hear from business owners every day.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-orange-200 group/stat-item relative">
                    <div className="flex items-center justify-between mb-2">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_stat_1 || ''}
                        onEdit={(value) => handleContentUpdate('summary_stat_1', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-3xl font-bold text-orange-600"
                        placeholder="73%"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_stat_1"
                      />
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('summary_stat_1', '___REMOVED___');
                            handleContentUpdate('summary_stat_1_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/stat-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_1_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_1_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="of businesses struggle with at least 3 of these issues"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_1_label"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-orange-200 group/stat-item relative">
                    <div className="flex items-center justify-between mb-2">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_stat_2 || ''}
                        onEdit={(value) => handleContentUpdate('summary_stat_2', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-3xl font-bold text-red-600"
                        placeholder="$47K"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_stat_2"
                      />
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('summary_stat_2', '___REMOVED___');
                            handleContentUpdate('summary_stat_2_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/stat-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_2_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_2_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="average annual cost of inefficient processes"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_2_label"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-orange-200 group/stat-item relative">
                    <div className="flex items-center justify-between mb-2">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.summary_stat_3 || ''}
                        onEdit={(value) => handleContentUpdate('summary_stat_3', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-3xl font-bold text-green-600"
                        placeholder="2.5x"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="summary_stat_3"
                      />
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('summary_stat_3', '___REMOVED___');
                            handleContentUpdate('summary_stat_3_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/stat-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.summary_stat_3_label || ''}
                      onEdit={(value) => handleContentUpdate('summary_stat_3_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="faster growth when these problems are solved"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="summary_stat_3_label"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Resolution */}
            <div className="text-center bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                The Good News: These Problems Have Solutions
              </h3>
              <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto mb-8`}>
                Every challenge you just read about has been solved by businesses just like yours. The tools, processes, and strategies exist—you just need to know where to find them.
              </p>
              
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Identify</div>
                  <div className={`text-sm ${mutedTextColor}`}>The core issues</div>
                </div>
                
                <div className="text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Solve</div>
                  <div className={`text-sm ${mutedTextColor}`}>With proven solutions</div>
                </div>
                
                <div className="text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">Thrive</div>
                  <div className={`text-sm ${mutedTextColor}`}>Beyond the problems</div>
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
                placeholder="Add optional supporting text to reinforce the problem identification..."
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
    { key: 'problem_titles', label: 'Problem Titles (pipe separated)', type: 'text', required: true },
    { key: 'problem_descriptions', label: 'Problem Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'expand_labels', label: 'Expand Labels (pipe separated)', type: 'text', required: false },
    { key: 'problem_impacts', label: 'Problem Impacts (pipe separated)', type: 'textarea', required: false },
    { key: 'solution_hints', label: 'Solution Hints (pipe separated)', type: 'textarea', required: false },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive card expansion/collapse',
    'Problem impact highlighting',
    'Solution hint previews',
    'Dynamic icon system',
    'Progress pathway visualization',
    'Statistical summary section'
  ],
  
  useCases: [
    'Detailed problem exploration',
    'Interactive challenge assessment',
    'Problem-solution previews',
    'Educational problem identification',
    'Comprehensive pain point analysis'
  ]
};