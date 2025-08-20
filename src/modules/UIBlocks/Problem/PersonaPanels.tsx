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
  solution_title_1?: string;
  solution_description_1?: string;
  solution_title_2?: string;
  solution_description_2?: string;
  solution_title_3?: string;
  solution_description_3?: string;
  solution_title_4?: string;
  solution_description_4?: string;
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
  solution_title_1: { type: 'string' as const, default: 'Automation' },
  solution_description_1: { type: 'string' as const, default: 'Reduce manual work by 80%' },
  solution_title_2: { type: 'string' as const, default: 'Analytics' },
  solution_description_2: { type: 'string' as const, default: 'Clear visibility into everything' },
  solution_title_3: { type: 'string' as const, default: 'Integration' },
  solution_description_3: { type: 'string' as const, default: 'Connect all your tools' },
  solution_title_4: { type: 'string' as const, default: 'Scaling' },
  solution_description_4: { type: 'string' as const, default: 'Grow without complexity' },
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
    color: getPersonaColor(index)
  }));

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  function getPersonaColor(index: number) {
    const colors = [
      { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
    ];
    return colors[index % colors.length];
  }

  // Get persona icon for specific index
  function getPersonaIcon(index: number) {
    const iconFields = ['persona_icon_1', 'persona_icon_2', 'persona_icon_3', 'persona_icon_4'];
    return blockContent[iconFields[index] as keyof PersonaPanelsContent] || '💼';
  }

  const PersonaCard = ({ persona, index, isActive }: {
    persona: typeof personas[0];
    index: number;
    isActive: boolean;
  }) => (
    <div 
      className={`bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
        isActive 
          ? `${persona.color.border} shadow-xl scale-105` 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
      onClick={() => setActivePersona(index)}
    >
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">{persona.name}</h3>
          {persona.title && (
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${persona.color.light} ${persona.color.text}`}>
              {persona.title}
            </div>
          )}
        </div>

        {/* Description */}
        {persona.description && (
          <p className={`text-center ${mutedTextColor} mb-6`}>
            {persona.description}
          </p>
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

  const PersonaDetails = ({ persona }: { persona: typeof personas[0] }) => (
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
          <h3 className="text-2xl font-bold text-gray-900">{persona.name}</h3>
          {persona.title && (
            <p className={`${persona.color.text} font-medium`}>{persona.title}</p>
          )}
        </div>
      </div>

      {/* Problem Description */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Current Challenge:</h4>
        <p className="text-gray-700 leading-relaxed text-lg">
          {persona.problem}
        </p>
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
                <span className="text-gray-700">{point}</span>
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
                <span className="text-gray-700">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Ready to Transform Your Experience?
        </h4>
        <p className={`${mutedTextColor} mb-4`}>
          Thousands of {persona.name.toLowerCase()}s have already made the leap. Join them in creating the business experience you actually want.
        </p>
        
        <CTAButton
          text={`Solutions for ${persona.name}`}
          colorTokens={colorTokens}
          className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          variant="primary"
          sectionId={sectionId}
          elementKey={`persona_cta_${activePersona}`}
        />
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

          {(blockContent.subheadline || mode === 'edit') && (
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

          {(blockContent.intro_text || mode === 'edit') && (
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

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Persona Panels Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_names || ''}
                  onEdit={(value) => handleContentUpdate('persona_names', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Persona names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="persona_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_problems || ''}
                  onEdit={(value) => handleContentUpdate('persona_problems', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Persona problems (pipe separated)"
                  sectionId={sectionId}
                  elementKey="persona_problems"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_titles || ''}
                  onEdit={(value) => handleContentUpdate('persona_titles', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Persona titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="persona_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.persona_pain_points || ''}
                  onEdit={(value) => handleContentUpdate('persona_pain_points', value)}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Persona pain points (pipe separated personas, comma separated points)"
                  sectionId={sectionId}
                  elementKey="persona_pain_points"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Persona Selection Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {personas.map((persona, index) => (
                <PersonaCard
                  key={index}
                  persona={persona}
                  index={index}
                  isActive={activePersona === index}
                />
              ))}
            </div>

            {/* Selected Persona Details */}
            {personas[activePersona] && (
              <div className="mb-16">
                <PersonaDetails persona={personas[activePersona]} />
              </div>
            )}

            {/* Common Solutions Preview */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Solutions That Work Across All Personas
              </h3>
              
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { title: blockContent.solution_title_1, description: blockContent.solution_description_1, color: 'bg-blue-500', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                  { title: blockContent.solution_title_2, description: blockContent.solution_description_2, color: 'bg-green-500', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  { title: blockContent.solution_title_3, description: blockContent.solution_description_3, color: 'bg-purple-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { title: blockContent.solution_title_4, description: blockContent.solution_description_4, color: 'bg-orange-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
                ].filter(item => item.title && item.title !== '___REMOVED___').map((solution, index) => (
                  <div key={index} className="text-center group/solution-item relative">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-12 h-12 ${solution.color} rounded-lg flex items-center justify-center mx-auto`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={solution.icon} />
                        </svg>
                      </div>
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const titleKey = `solution_title_${index + 1}` as keyof PersonaPanelsContent;
                            const descKey = `solution_description_${index + 1}` as keyof PersonaPanelsContent;
                            handleContentUpdate(titleKey, '___REMOVED___');
                            handleContentUpdate(descKey, '___REMOVED___');
                          }}
                          className="opacity-0 group-hover/solution-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                          title="Remove this solution"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={solution.title || ''}
                      onEdit={(value) => {
                        const fieldKey = `solution_title_${index + 1}` as keyof PersonaPanelsContent;
                        handleContentUpdate(fieldKey, value);
                      }}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className="font-semibold text-gray-900 mb-2"
                      placeholder={`Solution ${index + 1} title`}
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`solution_title_${index + 1}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={solution.description || ''}
                      onEdit={(value) => {
                        const fieldKey = `solution_description_${index + 1}` as keyof PersonaPanelsContent;
                        handleContentUpdate(fieldKey, value);
                      }}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder={`Solution ${index + 1} description`}
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`solution_description_${index + 1}`}
                    />
                  </div>
                ))}
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
  tags: ['personas', 'interactive', 'segmentation', 'problems', 'audience'],
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
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive persona selection',
    'Detailed persona problem descriptions',
    'Pain points and goals breakdown',
    'Color-coded persona identification',
    'Dynamic CTA for each persona',
    'Common solutions preview'
  ],
  
  useCases: [
    'Audience segmentation',
    'Persona-based problem identification',
    'Targeted messaging sections',
    'Customer type qualification',
    'Personalized problem presentation'
  ]
};