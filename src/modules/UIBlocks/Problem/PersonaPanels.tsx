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
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface PersonaPanelsContent {
  headline: string;
  persona_names: string;
  persona_problems: string;
  persona_descriptions?: string;
  persona_titles?: string;
  persona_pain_points?: string;
  persona_goals?: string;
  intro_text?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  persona_icon_1?: string;
  persona_icon_2?: string;
  persona_icon_3?: string;
  persona_icon_4?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Which Business Owner Are You?' 
  },
  persona_names: { 
    type: 'string' as const, 
    default: 'The Overwhelmed Founder|The Scaling CEO|The Efficiency Seeker|The Growth-Focused Leader' 
  },
  persona_problems: { 
    type: 'string' as const, 
    default: 'You\'re working 70+ hour weeks, constantly putting out fires, and feeling like you\'re the bottleneck in every process. You know you need systems but don\'t have time to build them.|Your team is growing but productivity isn\'t scaling with it. You\'re losing control of operations and worried about maintaining quality as you expand.|You see inefficiencies everywhere but struggle to fix them systematically. You want to optimize everything but don\'t know where to start or how to measure success.|You have ambitious growth targets but your current operations can\'t support them. You need to transform how you work before you can scale effectively.' 
  },
  persona_descriptions: { 
    type: 'string' as const, 
    default: 'Early-stage entrepreneur juggling everything|Mid-stage leader managing rapid growth|Operations-focused optimizer|Strategic growth planner' 
  },
  persona_titles: { 
    type: 'string' as const, 
    default: 'Startup Founder (0-10 employees)|Scale-up CEO (10-50 employees)|Operations Manager (50+ employees)|Growth Director (Established business)' 
  },
  persona_pain_points: { 
    type: 'string' as const, 
    default: 'No time for strategic work,Everything depends on me,Constant reactive mode|Quality inconsistency,Communication gaps,Process breakdowns|Scattered tools and data,Manual workflows,Measurement challenges|Operational bottlenecks,Resource constraints,System limitations' 
  },
  persona_goals: { 
    type: 'string' as const, 
    default: 'Work ON the business not IN it,Build sustainable systems,Reclaim personal time|Maintain quality while scaling,Empower team autonomy,Streamline operations|Eliminate inefficiencies,Optimize workflows,Data-driven decisions|Break growth barriers,Scale operations,Achieve targets' 
  },
  intro_text: { 
    type: 'string' as const, 
    default: 'Different business stages bring different challenges. See yourself in one of these profiles:' 
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
  persona_icon_1: { type: 'string' as const, default: '⏰' },
  persona_icon_2: { type: 'string' as const, default: '📈' },
  persona_icon_3: { type: 'string' as const, default: '⚙️' },
  persona_icon_4: { type: 'string' as const, default: '⚡' }
};

export default function PersonaPanels(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<PersonaPanelsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection with priority: manual override > auto-detection > neutral
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const [activePersona, setActivePersona] = useState(0);

  const personaNames = blockContent.persona_names 
    ? blockContent.persona_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const personaProblems = blockContent.persona_problems 
    ? blockContent.persona_problems.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const personaDescriptions = blockContent.persona_descriptions 
    ? blockContent.persona_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const personaTitles = blockContent.persona_titles 
    ? blockContent.persona_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const personaPainPoints = blockContent.persona_pain_points 
    ? blockContent.persona_pain_points.split('|').map(item => 
        item.trim().split(',').map(point => point.trim()).filter(Boolean)
      )
    : [];

  const personaGoals = blockContent.persona_goals 
    ? blockContent.persona_goals.split('|').map(item => 
        item.trim().split(',').map(goal => goal.trim()).filter(Boolean)
      )
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const personas = personaNames.map((name, index) => ({
    name,
    problem: personaProblems[index] || '',
    description: personaDescriptions[index] || '',
    title: personaTitles[index] || '',
    painPoints: personaPainPoints[index] || [],
    goals: personaGoals[index] || [],
    color: getPersonaColor(index, theme)
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Add a new persona
  const addPersona = () => {
    const names = blockContent.persona_names ? blockContent.persona_names.split('|') : [];
    const problems = blockContent.persona_problems ? blockContent.persona_problems.split('|') : [];
    const descriptions = blockContent.persona_descriptions ? blockContent.persona_descriptions.split('|') : [];
    const titles = blockContent.persona_titles ? blockContent.persona_titles.split('|') : [];
    const painPoints = blockContent.persona_pain_points ? blockContent.persona_pain_points.split('|') : [];
    const goals = blockContent.persona_goals ? blockContent.persona_goals.split('|') : [];

    // Add new persona with default content
    names.push('New Persona');
    problems.push('Describe the main challenge this persona faces in their daily work or life.');
    descriptions.push('Brief role description');
    titles.push('Role Title');
    painPoints.push('Daily frustration 1,Daily frustration 2,Daily frustration 3');
    goals.push('Goal 1,Goal 2,Goal 3');

    // Update all fields
    handleContentUpdate('persona_names', names.join('|'));
    handleContentUpdate('persona_problems', problems.join('|'));
    handleContentUpdate('persona_descriptions', descriptions.join('|'));
    handleContentUpdate('persona_titles', titles.join('|'));
    handleContentUpdate('persona_pain_points', painPoints.join('|'));
    handleContentUpdate('persona_goals', goals.join('|'));

    // Add smart icon for the new persona
    const newPersonaCount = names.length;
    const iconField = `persona_icon_${newPersonaCount}` as keyof PersonaPanelsContent;
    if (newPersonaCount <= 4) {
      const personaIcons = ['👤', '👥', '👔', '🎯', '💼', '🚀'];
      const defaultIcon = personaIcons[Math.floor(Math.random() * personaIcons.length)];
      handleContentUpdate(iconField, defaultIcon);
    }
  };

  // Remove a persona
  const removePersona = (indexToRemove: number) => {
    const names = blockContent.persona_names ? blockContent.persona_names.split('|') : [];
    const problems = blockContent.persona_problems ? blockContent.persona_problems.split('|') : [];
    const descriptions = blockContent.persona_descriptions ? blockContent.persona_descriptions.split('|') : [];
    const titles = blockContent.persona_titles ? blockContent.persona_titles.split('|') : [];
    const painPoints = blockContent.persona_pain_points ? blockContent.persona_pain_points.split('|') : [];
    const goals = blockContent.persona_goals ? blockContent.persona_goals.split('|') : [];

    // Remove at specified index
    if (indexToRemove >= 0 && indexToRemove < names.length) {
      names.splice(indexToRemove, 1);
      problems.splice(indexToRemove, 1);
      descriptions.splice(indexToRemove, 1);
      titles.splice(indexToRemove, 1);
      painPoints.splice(indexToRemove, 1);
      goals.splice(indexToRemove, 1);

      // Update all fields
      handleContentUpdate('persona_names', names.join('|'));
      handleContentUpdate('persona_problems', problems.join('|'));
      handleContentUpdate('persona_descriptions', descriptions.join('|'));
      handleContentUpdate('persona_titles', titles.join('|'));
      handleContentUpdate('persona_pain_points', painPoints.join('|'));
      handleContentUpdate('persona_goals', goals.join('|'));

      // Also clear the corresponding icon if it exists
      const iconField = `persona_icon_${indexToRemove + 1}` as keyof PersonaPanelsContent;
      if (blockContent[iconField]) {
        handleContentUpdate(iconField, '');
      }

      // Reset active persona if needed
      if (activePersona >= names.length && names.length > 0) {
        setActivePersona(names.length - 1);
      }
    }
  };

  // Individual field editing functions
  const handlePersonaNameEdit = (index: number, value: string) => {
    const names = blockContent.persona_names ? blockContent.persona_names.split('|') : [];
    names[index] = value;
    handleContentUpdate('persona_names', names.join('|'));
  };

  const handlePersonaTitleEdit = (index: number, value: string) => {
    const titles = blockContent.persona_titles ? blockContent.persona_titles.split('|') : [];
    titles[index] = value;
    handleContentUpdate('persona_titles', titles.join('|'));
  };

  const handlePersonaDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.persona_descriptions ? blockContent.persona_descriptions.split('|') : [];
    descriptions[index] = value;
    handleContentUpdate('persona_descriptions', descriptions.join('|'));
  };

  const handlePersonaProblemEdit = (index: number, value: string) => {
    const problems = blockContent.persona_problems ? blockContent.persona_problems.split('|') : [];
    problems[index] = value;
    handleContentUpdate('persona_problems', problems.join('|'));
  };

  const handlePainPointEdit = (personaIndex: number, pointIndex: number, value: string) => {
    const painPointsList = blockContent.persona_pain_points ? blockContent.persona_pain_points.split('|') : [];
    const currentPersonaPainPoints = painPointsList[personaIndex] ? painPointsList[personaIndex].split(',') : [];
    currentPersonaPainPoints[pointIndex] = value;
    painPointsList[personaIndex] = currentPersonaPainPoints.join(',');
    handleContentUpdate('persona_pain_points', painPointsList.join('|'));
  };

  const handleGoalEdit = (personaIndex: number, goalIndex: number, value: string) => {
    const goalsList = blockContent.persona_goals ? blockContent.persona_goals.split('|') : [];
    const currentPersonaGoals = goalsList[personaIndex] ? goalsList[personaIndex].split(',') : [];
    currentPersonaGoals[goalIndex] = value;
    goalsList[personaIndex] = currentPersonaGoals.join(',');
    handleContentUpdate('persona_goals', goalsList.join('|'));
  };

  function getPersonaColor(index: number, theme: UIBlockTheme) {
    // Warm theme: orange variations
    const warmColors = [
      { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
      { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      { bg: 'bg-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
    ];

    // Cool theme: blue variations
    const coolColors = [
      { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
      { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
      { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' }
    ];

    // Neutral theme: gray/slate variations
    const neutralColors = [
      { bg: 'bg-gray-500', light: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
      { bg: 'bg-slate-500', light: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
      { bg: 'bg-zinc-500', light: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700' },
      { bg: 'bg-stone-500', light: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700' }
    ];

    const colorSets = { warm: warmColors, cool: coolColors, neutral: neutralColors };
    const colors = colorSets[theme];
    return colors[index % colors.length];
  }

  // Get persona icon for specific index
  function getPersonaIcon(index: number) {
    const iconFields = ['persona_icon_1', 'persona_icon_2', 'persona_icon_3', 'persona_icon_4'];
    return blockContent[iconFields[index] as keyof PersonaPanelsContent] || '💼';
  }

  const PersonaCard = ({ persona, index, isActive, mode, colorTokens, backgroundType, sectionBackground, sectionId, handleContentUpdate, onRemove, canRemove }: {
    persona: typeof personas[0];
    index: number;
    isActive: boolean;
    mode: 'edit' | 'preview';
    colorTokens: any;
    backgroundType: string;
    sectionBackground: string;
    sectionId: string;
    handleContentUpdate: (field: keyof PersonaPanelsContent, value: string) => void;
    onRemove?: (index: number) => void;
    canRemove?: boolean;
  }) => (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
        isActive
          ? `${persona.color.border} shadow-xl scale-105`
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
      onClick={() => setActivePersona(index)}
    >
      {/* Remove button - only show in edit mode and if can remove */}
      {mode === 'edit' && onRemove && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10"
          title="Remove this persona"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full ${persona.color.bg} flex items-center justify-center text-white mx-auto mb-4 group/icon-edit relative`}>
            <IconEditableText
              mode={mode}
              value={getPersonaIcon(index)}
              onEdit={(value) => {
                const iconField = `persona_icon_${index + 1}` as keyof PersonaPanelsContent;
                handleContentUpdate(iconField, value);
              }}
              backgroundType={backgroundType as any}
              colorTokens={{...colorTokens, textPrimary: 'text-white'}}
              iconSize="xl"
              className="text-3xl text-white"
              sectionId={sectionId}
              elementKey={`persona_icon_${index + 1}`}
            />
          </div>
          <EditableAdaptiveText
            mode={mode}
            value={persona.name}
            onEdit={(value) => handlePersonaNameEdit(index, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            variant="body"
            className="text-xl font-bold text-gray-900 mb-2 text-center"
            placeholder="Persona name..."
            sectionId={sectionId}
            elementKey={`persona_name_${index}`}
            sectionBackground={sectionBackground}
          />
          {(persona.title || mode === 'edit') && (
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${persona.color.light} ${persona.color.text}`}>
              <EditableAdaptiveText
                mode={mode}
                value={persona.title || ''}
                onEdit={(value) => handlePersonaTitleEdit(index, value)}
                backgroundType={backgroundType as any}
                colorTokens={{...colorTokens, textPrimary: persona.color.text}}
                variant="body"
                className="text-sm font-medium"
                placeholder="Persona title..."
                sectionId={sectionId}
                elementKey={`persona_title_${index}`}
                sectionBackground={sectionBackground}
              />
            </div>
          )}
        </div>

        {/* Description */}
        {(persona.description || mode === 'edit') && (
          <div className="text-center mb-6">
            <EditableAdaptiveText
              mode={mode}
              value={persona.description || ''}
              onEdit={(value) => handlePersonaDescriptionEdit(index, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className={`${mutedTextColor}`}
              placeholder="Persona description..."
              sectionId={sectionId}
              elementKey={`persona_description_${index}`}
              sectionBackground={sectionBackground}
            />
          </div>
        )}

        {/* Indicator */}
        <div className="text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive ? persona.color.light : 'bg-gray-100'} ${isActive ? persona.color.text : 'text-gray-600'} transition-colors duration-300`}>
            {isActive ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">This is me!</span>
              </>
            ) : (
              <span className="text-sm">Click to select</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const PersonaDetails = ({ persona, mode, colorTokens, backgroundType, sectionBackground, sectionId, handleContentUpdate, activePersona }: {
    persona: typeof personas[0];
    mode: 'edit' | 'preview';
    colorTokens: any;
    backgroundType: string;
    sectionBackground: string;
    sectionId: string;
    handleContentUpdate: (field: keyof PersonaPanelsContent, value: string) => void;
    activePersona: number;
  }) => (
    <div className={`bg-gradient-to-br ${persona.color.light} to-white rounded-2xl p-8 border ${persona.color.border}`}>
      
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`w-16 h-16 rounded-full ${persona.color.bg} flex items-center justify-center text-white group/icon-edit relative`}>
          <IconEditableText
            mode={mode}
            value={getPersonaIcon(activePersona)}
            onEdit={(value) => {
              const iconField = `persona_icon_${activePersona + 1}` as keyof PersonaPanelsContent;
              handleContentUpdate(iconField, value);
            }}
            backgroundType={backgroundType as any}
            colorTokens={{...colorTokens, textPrimary: 'text-white'}}
            iconSize="xl"
            className="text-3xl text-white"
            sectionId={sectionId}
            elementKey={`persona_detail_icon_${activePersona + 1}`}
          />
        </div>
        <div>
          <EditableAdaptiveText
            mode={mode}
            value={persona.name}
            onEdit={(value) => handlePersonaNameEdit(activePersona, value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            variant="body"
            className="text-2xl font-bold text-gray-900"
            placeholder="Persona name..."
            sectionId={sectionId}
            elementKey={`persona_detail_name_${activePersona}`}
            sectionBackground={sectionBackground}
          />
          {(persona.title || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={persona.title || ''}
              onEdit={(value) => handlePersonaTitleEdit(activePersona, value)}
              backgroundType={backgroundType as any}
              colorTokens={{...colorTokens, textPrimary: persona.color.text}}
              variant="body"
              className={`${persona.color.text} font-medium`}
              placeholder="Persona title..."
              sectionId={sectionId}
              elementKey={`persona_detail_title_${activePersona}`}
              sectionBackground={sectionBackground}
            />
          )}
        </div>
      </div>

      {/* Problem Description */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Current Challenge:</h4>
        <EditableAdaptiveText
          mode={mode}
          value={persona.problem}
          onEdit={(value) => handlePersonaProblemEdit(activePersona, value)}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          variant="body"
          className="text-gray-700 leading-relaxed text-lg"
          placeholder="Describe the persona's main problem..."
          sectionId={sectionId}
          elementKey={`persona_problem_${activePersona}`}
          sectionBackground={sectionBackground}
        />
      </div>

      {/* Pain Points and Goals Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Pain Points */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Daily Frustrations
          </h4>
          <div className="space-y-3">
            {persona.painPoints.map((point, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <EditableAdaptiveText
                  mode={mode}
                  value={point}
                  onEdit={(value) => handlePainPointEdit(activePersona, index, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 flex-1"
                  placeholder="Pain point..."
                  sectionId={sectionId}
                  elementKey={`pain_point_${activePersona}_${index}`}
                  sectionBackground={sectionBackground}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your Goals
          </h4>
          <div className="space-y-3">
            {persona.goals.map((goal, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <EditableAdaptiveText
                  mode={mode}
                  value={goal}
                  onEdit={(value) => handleGoalEdit(activePersona, index, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-700 flex-1"
                  placeholder="Goal..."
                  sectionId={sectionId}
                  elementKey={`goal_${activePersona}_${index}`}
                  sectionBackground={sectionBackground}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaPanels"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
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
              placeholder="Add optional subheadline to introduce the persona panels..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          {(blockContent.intro_text || (mode as string) === 'edit') && (
            <div className="max-w-4xl mx-auto mb-8">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.intro_text || ''}
                onEdit={(value) => handleContentUpdate('intro_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="text-lg leading-relaxed"
                placeholder="Add introduction text to guide persona selection..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="intro_text"
              />
            </div>
          )}
        </div>

        {/* Persona Selection Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {personas.map((persona, index) => (
            <PersonaCard
              key={index}
              persona={persona}
              index={index}
              isActive={activePersona === index}
              mode={mode}
              colorTokens={colorTokens}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              handleContentUpdate={handleContentUpdate}
              onRemove={removePersona}
              canRemove={personas.length > 2}
            />
          ))}
        </div>

        {/* Add Persona Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && personas.length < 6 && (
          <div className="mb-8 text-center">
            <button
              onClick={addPersona}
              className="inline-flex items-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Persona</span>
            </button>
          </div>
        )}

        {/* Selected Persona Details */}
        {personas[activePersona] && (
          <div className="mb-16">
            <PersonaDetails
              persona={personas[activePersona]}
              mode={mode}
              colorTokens={colorTokens}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              handleContentUpdate={handleContentUpdate}
              activePersona={activePersona}
            />
          </div>
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
                placeholder="Add optional supporting text to reinforce persona identification..."
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
  name: 'PersonaPanels',
  category: 'Problem',
  description: 'Interactive persona identification panels with detailed problem descriptions and goals. Perfect for audience segmentation.',
  tags: ['personas', 'interactive', 'segmentation', 'problems', 'audience', 'dynamic'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',

  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'persona_names', label: 'Persona Names (pipe separated)', type: 'text', required: true },
    { key: 'persona_problems', label: 'Persona Problems (pipe separated)', type: 'textarea', required: true },
    { key: 'persona_descriptions', label: 'Persona Descriptions (pipe separated)', type: 'text', required: false },
    { key: 'persona_titles', label: 'Persona Titles (pipe separated)', type: 'text', required: false },
    { key: 'persona_pain_points', label: 'Persona Pain Points (pipe separated personas, comma separated points)', type: 'textarea', required: false },
    { key: 'persona_goals', label: 'Persona Goals (pipe separated personas, comma separated goals)', type: 'textarea', required: false },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'persona_icon_1', label: 'Persona Icon 1', type: 'icon', required: false },
    { key: 'persona_icon_2', label: 'Persona Icon 2', type: 'icon', required: false },
    { key: 'persona_icon_3', label: 'Persona Icon 3', type: 'icon', required: false },
    { key: 'persona_icon_4', label: 'Persona Icon 4', type: 'icon', required: false }
  ],

  features: [
    'Dynamic add/remove personas (2-6 range)',
    'Interactive persona selection',
    'Detailed persona problem descriptions',
    'Pain points and goals breakdown',
    'Color-coded persona identification',
    'True WYSIWYG inline editing',
    'Problem-focused without solution content'
  ],
  
  useCases: [
    'Audience segmentation',
    'Persona-based problem identification',
    'Targeted messaging sections',
    'Customer type qualification',
    'Personalized problem presentation'
  ]
};