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

  // Add new problem card
  const addProblemCard = () => {
    const currentCount = Math.max(
      problemTitles.length,
      problemDescriptions.length,
      expandLabels.length,
      problemImpacts.length,
      solutionHints.length
    );
    
    if (currentCount >= 6) return; // Maximum 6 problem cards
    
    // Update all coordinated lists
    const newTitles = [...problemTitles, 'New Problem'];
    const newDescriptions = [...problemDescriptions, 'Describe this problem in detail...'];
    const newLabels = [...expandLabels, 'Learn More'];
    const newImpacts = [...problemImpacts, 'Impact of this problem...'];
    const newHints = [...solutionHints, 'How our solution helps...'];
    
    handleContentUpdate('problem_titles', newTitles.join('|'));
    
    // Use setTimeout to avoid Immer conflicts
    setTimeout(() => {
      handleContentUpdate('problem_descriptions', newDescriptions.join('|'));
      handleContentUpdate('expand_labels', newLabels.join('|'));
      handleContentUpdate('problem_impacts', newImpacts.join('|'));
      handleContentUpdate('solution_hints', newHints.join('|'));
      
      // Set default icon
      const iconNumber = newTitles.length;
      const iconField = `problem_icon_${iconNumber}` as keyof CollapsedCardsContent;
      handleContentUpdate(iconField, '⚙️');
    }, 0);
  };

  // Remove problem card
  const removeProblemCard = (index: number) => {
    const currentCount = Math.max(
      problemTitles.length,
      problemDescriptions.length,
      expandLabels.length,
      problemImpacts.length,
      solutionHints.length
    );
    
    if (currentCount <= 1) return; // Keep at least 1 card
    
    // Close expanded card if it's being removed
    if (expandedCard === index) {
      setExpandedCard(null);
    } else if (expandedCard !== null && expandedCard > index) {
      setExpandedCard(expandedCard - 1);
    }
    
    // Filter out the removed index from all lists
    const newTitles = problemTitles.filter((_, i) => i !== index);
    const newDescriptions = problemDescriptions.filter((_, i) => i !== index);
    const newLabels = expandLabels.filter((_, i) => i !== index);
    const newImpacts = problemImpacts.filter((_, i) => i !== index);
    const newHints = solutionHints.filter((_, i) => i !== index);
    
    handleContentUpdate('problem_titles', newTitles.join('|'));
    
    // Use setTimeout to avoid Immer conflicts
    setTimeout(() => {
      handleContentUpdate('problem_descriptions', newDescriptions.join('|'));
      handleContentUpdate('expand_labels', newLabels.join('|'));
      handleContentUpdate('problem_impacts', newImpacts.join('|'));
      handleContentUpdate('solution_hints', newHints.join('|'));
      
      // Shift icons down
      for (let i = index + 1; i < currentCount; i++) {
        const currentIconField = `problem_icon_${i + 1}` as keyof CollapsedCardsContent;
        const nextIconField = `problem_icon_${i}` as keyof CollapsedCardsContent;
        const iconValue = blockContent[currentIconField] || '⚙️';
        handleContentUpdate(nextIconField, iconValue);
      }
      
      // Clear the last icon slot
      const lastIconField = `problem_icon_${currentCount}` as keyof CollapsedCardsContent;
      handleContentUpdate(lastIconField, '⚙️');
    }, 0);
  };

  // Individual field edit handlers
  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.problem_titles.split('|');
    titles[index] = value;
    handleContentUpdate('problem_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.problem_descriptions?.split('|') || [];
    descriptions[index] = value;
    handleContentUpdate('problem_descriptions', descriptions.join('|'));
  };

  const handleImpactEdit = (index: number, value: string) => {
    const impacts = blockContent.problem_impacts?.split('|') || [];
    impacts[index] = value;
    handleContentUpdate('problem_impacts', impacts.join('|'));
  };

  const handleSolutionEdit = (index: number, value: string) => {
    const solutions = blockContent.solution_hints?.split('|') || [];
    solutions[index] = value;
    handleContentUpdate('solution_hints', solutions.join('|'));
  };

  const handleExpandLabelEdit = (index: number, value: string) => {
    const labels = blockContent.expand_labels?.split('|') || [];
    labels[index] = value;
    handleContentUpdate('expand_labels', labels.join('|'));
  };

  const ProblemCard = ({ problem, index, onRemove, canRemove }: {
    problem: typeof problemCards[0];
    index: number;
    onRemove: (index: number) => void;
    canRemove: boolean;
  }) => {
    const isExpanded = expandedCard === index;
    
    return (
      <div 
        className={`group bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden ${
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
                <EditableAdaptiveText
                  mode={mode}
                  value={problem.title}
                  onEdit={(value) => handleTitleEdit(index, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-lg font-semibold text-gray-900"
                  placeholder="Problem title"
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  elementKey={`problem_title_${index + 1}`}
                />
                <EditableAdaptiveText
                  mode={mode}
                  value={isExpanded ? 'Tap to collapse' : problem.expandLabel}
                  onEdit={(value) => handleExpandLabelEdit(index, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`text-sm ${mutedTextColor}`}
                  placeholder="Expand label"
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  elementKey={`expand_label_${index + 1}`}
                />
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
                    onRemove(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                  title="Remove this problem card"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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
              <EditableAdaptiveText
                mode={mode}
                value={problem.description}
                onEdit={(value) => handleDescriptionEdit(index, value)}
                backgroundType={backgroundType as any}
                colorTokens={colorTokens}
                variant="body"
                className="text-gray-700 leading-relaxed"
                placeholder="Describe this problem in detail..."
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                elementKey={`problem_description_${index + 1}`}
              />
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
                    <EditableAdaptiveText
                      mode={mode}
                      value={problem.impact}
                      onEdit={(value) => handleImpactEdit(index, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-red-800 text-sm"
                      placeholder="Impact of this problem..."
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`problem_impact_${index + 1}`}
                    />
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
                    <EditableAdaptiveText
                      mode={mode}
                      value={problem.solutionHint}
                      onEdit={(value) => handleSolutionEdit(index, value)}
                      backgroundType={backgroundType as any}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-green-800 text-sm"
                      placeholder="How our solution helps..."
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`solution_hint_${index + 1}`}
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

          {(blockContent.subheadline || (mode as string) === 'edit') && (
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

          {(blockContent.intro_text || (mode as string) === 'edit') && (
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

        {false && (mode as string) === 'edit' ? (
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
            <div className="space-y-4 mb-8">
              {problemCards.map((problem, index) => (
                <ProblemCard
                  key={index}
                  problem={problem}
                  index={index}
                  onRemove={removeProblemCard}
                  canRemove={problemCards.length > 1}
                />
              ))}
            </div>

            {/* Add Problem Card Button */}
            {mode !== 'preview' && problemCards.length < 6 && (
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
          </>
        )}

        {(blockContent.supporting_text || blockContent.trust_items || (mode as string) === 'edit') && (
          <div className="text-center space-y-6 mt-12">
            {(blockContent.supporting_text || (mode as string) === 'edit') && (
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