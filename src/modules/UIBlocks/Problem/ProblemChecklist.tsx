import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface ProblemChecklistContent {
  headline: string;
  problem_statements: string;
  checklist_items: string;
  conclusion_text?: string;
  scoring_labels?: string;
  action_thresholds?: string;
  intro_text?: string;
  cta_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  result_stat_1?: string;
  result_stat_1_label?: string;
  result_stat_2?: string;
  result_stat_2_label?: string;
  result_stat_3?: string;
  result_stat_3_label?: string;
  encouragement_tip_1?: string;
  encouragement_tip_2?: string;
  encouragement_tip_3?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Quick Assessment: How Many of These Apply to You?' 
  },
  problem_statements: { 
    type: 'string' as const, 
    default: 'You spend more than 2 hours a day on repetitive manual tasks|Your team asks the same questions repeatedly because information isn\'t accessible|You\'ve missed important deadlines due to communication gaps|You use 5+ different tools that don\'t integrate with each other|You feel like you\'re constantly putting out fires instead of being strategic|Your processes break down when team members are absent|You struggle to get real-time visibility into project status|Customer complaints often stem from internal process failures|You work evenings and weekends just to keep up with operational demands|You\'ve delayed growth initiatives because operations can\'t support them' 
  },
  checklist_items: { 
    type: 'string' as const, 
    default: 'Manual task overload|Information silos|Communication breakdowns|Tool fragmentation|Reactive management|Process dependencies|Visibility gaps|Quality issues|Work-life imbalance|Growth limitations' 
  },
  conclusion_text: { 
    type: 'string' as const, 
    default: 'If you checked 3 or more items, you\'re dealing with systemic operational challenges that are costing you time, money, and peace of mind. The good news? These are exactly the problems our solution was designed to solve.' 
  },
  scoring_labels: { 
    type: 'string' as const, 
    default: '0-2: Well managed|3-5: Room for improvement|6-8: Significant challenges|9-10: Critical intervention needed' 
  },
  action_thresholds: { 
    type: 'string' as const, 
    default: 'Keep monitoring for potential issues|Consider optimization opportunities|Prioritize systematic improvements|Urgent action required to prevent major problems' 
  },
  intro_text: { 
    type: 'string' as const, 
    default: 'Check all the statements that apply to your current business situation:' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Get Solutions for My Challenges' 
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
  result_stat_1: { type: 'string' as const, default: '87%' },
  result_stat_1_label: { type: 'string' as const, default: 'of businesses see results within 30 days' },
  result_stat_2: { type: 'string' as const, default: '3.2x' },
  result_stat_2_label: { type: 'string' as const, default: 'average productivity increase' },
  result_stat_3: { type: 'string' as const, default: '$47K' },
  result_stat_3_label: { type: 'string' as const, default: 'average annual savings' },
  encouragement_tip_1: { type: 'string' as const, default: 'Regular process reviews' },
  encouragement_tip_2: { type: 'string' as const, default: 'Proactive improvements' },
  encouragement_tip_3: { type: 'string' as const, default: 'Team feedback loops' }
};

export default function ProblemChecklist(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<ProblemChecklistContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  const problemStatements = blockContent.problem_statements 
    ? blockContent.problem_statements.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const checklistItems = blockContent.checklist_items 
    ? blockContent.checklist_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const scoringLabels = blockContent.scoring_labels 
    ? blockContent.scoring_labels.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const actionThresholds = blockContent.action_thresholds 
    ? blockContent.action_thresholds.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const problems = problemStatements.map((statement, index) => ({
    statement,
    shortLabel: checklistItems[index] || `Problem ${index + 1}`
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Initialize checked items array
  React.useEffect(() => {
    if (checkedItems.length !== problems.length) {
      setCheckedItems(new Array(problems.length).fill(false));
    }
  }, [problems.length]);

  const handleCheckboxChange = (index: number) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = !newCheckedItems[index];
    setCheckedItems(newCheckedItems);
  };

  const checkedCount = checkedItems.filter(Boolean).length;

  const getScoreColor = (score: number) => {
    if (score >= 9) return { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    if (score >= 6) return { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    if (score >= 3) return { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    return { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  };

  const getScoreLevel = (score: number) => {
    if (score >= 9) return { label: 'Critical intervention needed', action: actionThresholds[3] || 'Urgent action required' };
    if (score >= 6) return { label: 'Significant challenges', action: actionThresholds[2] || 'Prioritize improvements' };
    if (score >= 3) return { label: 'Room for improvement', action: actionThresholds[1] || 'Consider optimization' };
    return { label: 'Well managed', action: actionThresholds[0] || 'Keep monitoring' };
  };

  const scoreColor = getScoreColor(checkedCount);
  const scoreLevel = getScoreLevel(checkedCount);

  const ChecklistItem = ({ problem, index }: {
    problem: typeof problems[0];
    index: number;
  }) => (
    <div 
      className={`bg-white rounded-lg border-2 p-6 transition-all duration-300 cursor-pointer ${
        checkedItems[index] 
          ? `${scoreColor.border} ${scoreColor.light}` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handleCheckboxChange(index)}
    >
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          checkedItems[index] 
            ? `${scoreColor.bg} border-transparent` 
            : 'border-gray-300 hover:border-gray-400'
        }`}>
          {checkedItems[index] && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 transition-colors duration-200 ${
            checkedItems[index] ? scoreColor.text : 'text-gray-900'
          }`}>
            {problem.shortLabel}
          </h4>
          <p className={`text-gray-700 leading-relaxed ${checkedItems[index] ? 'opacity-90' : ''}`}>
            {problem.statement}
          </p>
        </div>

        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
          checkedItems[index] ? scoreColor.bg : 'bg-gray-200'
        }`}></div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ProblemChecklist"
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
              placeholder="Add optional subheadline to introduce the problem checklist..."
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
                placeholder="Add introduction text to guide the assessment..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="intro_text"
              />
            </div>
          )}
        </div>

        {mode !== 'preview' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Problem Checklist Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.problem_statements || ''}
                  onEdit={(value) => handleContentUpdate('problem_statements', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Problem statements (pipe separated)"
                  sectionId={sectionId}
                  elementKey="problem_statements"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.checklist_items || ''}
                  onEdit={(value) => handleContentUpdate('checklist_items', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Checklist item labels (pipe separated)"
                  sectionId={sectionId}
                  elementKey="checklist_items"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.conclusion_text || ''}
                  onEdit={(value) => handleContentUpdate('conclusion_text', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Conclusion text"
                  sectionId={sectionId}
                  elementKey="conclusion_text"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.scoring_labels || ''}
                  onEdit={(value) => handleContentUpdate('scoring_labels', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Scoring labels (pipe separated)"
                  sectionId={sectionId}
                  elementKey="scoring_labels"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Checklist Items */}
            <div className="space-y-4 mb-12">
              {problems.map((problem, index) => (
                <ChecklistItem
                  key={index}
                  problem={problem}
                  index={index}
                />
              ))}
            </div>

            {/* Score Display */}
            <div className={`rounded-2xl p-8 border-2 ${scoreColor.border} ${scoreColor.light} mb-12`}>
              <div className="text-center">
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${scoreColor.bg} text-white mb-4`}>
                    <span className="text-3xl font-bold">{checkedCount}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Challenge Score: {checkedCount} out of {problems.length}
                  </h3>
                  <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${scoreColor.text}`}>
                    {scoreLevel.label}
                  </div>
                </div>

                {/* Score interpretation */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">What This Means:</h4>
                  <p className="text-gray-700 mb-4">{scoreLevel.action}</p>
                  
                  {checkedCount > 0 && blockContent.conclusion_text && (
                    <div className={`mt-4 p-4 rounded-lg ${scoreColor.light} border ${scoreColor.border}`}>
                      <p className={`${scoreColor.text} font-medium`}>
                        {blockContent.conclusion_text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring Guide */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mb-12">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
                Assessment Guide
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {scoringLabels.map((label, index) => {
                  const range = label.split(':')[0].trim();
                  const description = label.split(':')[1]?.trim() || '';
                  const color = getScoreColor(index === 0 ? 1 : index === 1 ? 4 : index === 2 ? 7 : 10);
                  
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{range}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{description}</div>
                        <div className="text-sm text-gray-600">{actionThresholds[index] || ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Section */}
            {checkedCount >= 3 && (
              <div className="text-center bg-blue-50 rounded-2xl p-8 border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Ready to Address These Challenges?
                </h3>
                <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto mb-8`}>
                  You've identified {checkedCount} areas where your business could be more efficient. 
                  These challenges are costing you time, money, and growth opportunities every day.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <CTAButton
                    text={blockContent.cta_text || 'Get Solutions for My Challenges'}
                    colorTokens={colorTokens}
                    className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="main_cta"
                  />
                </div>

                {/* Statistics */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-200 group/result-stat relative">
                    <div className="flex items-center justify-between mb-1">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.result_stat_1 || ''}
                        onEdit={(value) => handleContentUpdate('result_stat_1', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-2xl font-bold text-blue-600"
                        placeholder="87%"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="result_stat_1"
                      />
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('result_stat_1', '___REMOVED___');
                            handleContentUpdate('result_stat_1_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/result-stat:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.result_stat_1_label || ''}
                      onEdit={(value) => handleContentUpdate('result_stat_1_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="of businesses see results within 30 days"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="result_stat_1_label"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 group/result-stat relative">
                    <div className="flex items-center justify-between mb-1">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.result_stat_2 || ''}
                        onEdit={(value) => handleContentUpdate('result_stat_2', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-2xl font-bold text-green-600"
                        placeholder="3.2x"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="result_stat_2"
                      />
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('result_stat_2', '___REMOVED___');
                            handleContentUpdate('result_stat_2_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/result-stat:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.result_stat_2_label || ''}
                      onEdit={(value) => handleContentUpdate('result_stat_2_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="average productivity increase"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="result_stat_2_label"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 group/result-stat relative">
                    <div className="flex items-center justify-between mb-1">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.result_stat_3 || ''}
                        onEdit={(value) => handleContentUpdate('result_stat_3', value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-2xl font-bold text-purple-600"
                        placeholder="$47K"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="result_stat_3"
                      />
                      {mode !== 'preview' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentUpdate('result_stat_3', '___REMOVED___');
                            handleContentUpdate('result_stat_3_label', '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/result-stat:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this statistic"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.result_stat_3_label || ''}
                      onEdit={(value) => handleContentUpdate('result_stat_3_label', value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm text-gray-600"
                      placeholder="average annual savings"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="result_stat_3_label"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Encouragement for low scores */}
            {checkedCount < 3 && (
              <div className="text-center bg-green-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Great Job! Your Operations Are Solid
                </h3>
                <p className={`text-lg ${mutedTextColor} max-w-3xl mx-auto mb-6`}>
                  You're managing your business challenges well. Consider monitoring these areas 
                  and implementing preventive measures to maintain your operational excellence.
                </p>
                
                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Keep Growing:</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    {[
                      blockContent.encouragement_tip_1,
                      blockContent.encouragement_tip_2,
                      blockContent.encouragement_tip_3
                    ].filter(tip => tip && tip !== '___REMOVED___').map((tip, index) => (
                      <div key={index} className="group/tip relative flex items-center">
                        <span className="mr-2">✓</span>
                        <EditableAdaptiveText
                          mode={mode}
                          value={tip || ''}
                          onEdit={(value) => {
                            const fieldKey = `encouragement_tip_${index + 1}` as keyof ProblemChecklistContent;
                            handleContentUpdate(fieldKey, value);
                          }}
                          backgroundType={backgroundType}
                          colorTokens={colorTokens}
                          variant="body"
                          className="flex-1"
                          placeholder={`Encouragement tip ${index + 1}`}
                          sectionBackground={sectionBackground}
                          data-section-id={sectionId}
                          data-element-key={`encouragement_tip_${index + 1}`}
                        />
                        {mode !== 'preview' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const fieldKey = `encouragement_tip_${index + 1}` as keyof ProblemChecklistContent;
                              handleContentUpdate(fieldKey, '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/tip:opacity-100 ml-1 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                            title="Remove this tip"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                placeholder="Add optional supporting text to reinforce the assessment results..."
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
  name: 'ProblemChecklist',
  category: 'Problem',
  description: 'Interactive problem assessment checklist with scoring and recommendations. Perfect for qualifying prospects and identifying issues.',
  tags: ['checklist', 'assessment', 'interactive', 'scoring', 'qualification'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'problem_statements', label: 'Problem Statements (pipe separated)', type: 'textarea', required: true },
    { key: 'checklist_items', label: 'Checklist Item Labels (pipe separated)', type: 'text', required: true },
    { key: 'conclusion_text', label: 'Conclusion Text', type: 'textarea', required: false },
    { key: 'scoring_labels', label: 'Scoring Labels (pipe separated)', type: 'text', required: false },
    { key: 'action_thresholds', label: 'Action Thresholds (pipe separated)', type: 'text', required: false },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive checkbox assessment',
    'Real-time score calculation',
    'Color-coded scoring system',
    'Personalized recommendations',
    'Assessment guide and thresholds',
    'Conditional CTAs based on score'
  ],
  
  useCases: [
    'Problem qualification assessments',
    'Business health checkups',
    'Lead scoring mechanisms',
    'Self-assessment tools',
    'Problem identification quizzes'
  ]
};