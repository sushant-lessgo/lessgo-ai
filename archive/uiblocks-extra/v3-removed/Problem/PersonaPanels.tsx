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
interface PersonaItem {
  id: string;
  name: string;
  problem: string;
  description: string;
  title: string;
  icon?: string;
  pain_points: string[];  // Nested array of strings
  goals: string[];        // Nested array of strings
}

interface TrustItem {
  id: string;
  text: string;
}

interface PersonaPanelsContent {
  headline: string;
  subheadline?: string;
  intro_text?: string;
  supporting_text?: string;
  // V2: Arrays instead of pipe-separated strings
  personas?: PersonaItem[];
  trust_items?: TrustItem[];
}

const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Which Business Owner Are You?'
  },
  subheadline: {
    type: 'string' as const,
    default: ''
  },
  intro_text: {
    type: 'string' as const,
    default: 'Different business stages bring different challenges. See yourself in one of these profiles:'
  },
  supporting_text: {
    type: 'string' as const,
    default: ''
  },
  personas: {
    type: 'array' as const,
    default: [
      {
        id: 'persona1',
        name: 'The Overwhelmed Founder',
        problem: 'You\'re working 70+ hour weeks, constantly putting out fires, and feeling like you\'re the bottleneck in every process.',
        description: 'Early-stage entrepreneur juggling everything',
        title: 'Startup Founder (0-10 employees)',
        icon: '⏰',
        pain_points: ['No time for strategic work', 'Everything depends on me', 'Constant reactive mode'],
        goals: ['Work ON the business not IN it', 'Build sustainable systems', 'Reclaim personal time']
      },
      {
        id: 'persona2',
        name: 'The Scaling CEO',
        problem: 'Your team is growing but productivity isn\'t scaling with it. You\'re losing control of operations.',
        description: 'Mid-stage leader managing rapid growth',
        title: 'Scale-up CEO (10-50 employees)',
        icon: '📈',
        pain_points: ['Quality inconsistency', 'Communication gaps', 'Process breakdowns'],
        goals: ['Maintain quality while scaling', 'Empower team autonomy', 'Streamline operations']
      },
      {
        id: 'persona3',
        name: 'The Efficiency Seeker',
        problem: 'You see inefficiencies everywhere but struggle to fix them systematically.',
        description: 'Operations-focused optimizer',
        title: 'Operations Manager (50+ employees)',
        icon: '⚙️',
        pain_points: ['Scattered tools and data', 'Manual workflows', 'Measurement challenges'],
        goals: ['Eliminate inefficiencies', 'Optimize workflows', 'Data-driven decisions']
      },
      {
        id: 'persona4',
        name: 'The Growth-Focused Leader',
        problem: 'You have ambitious growth targets but your current operations can\'t support them.',
        description: 'Strategic growth planner',
        title: 'Growth Director (Established business)',
        icon: '⚡',
        pain_points: ['Operational bottlenecks', 'Resource constraints', 'System limitations'],
        goals: ['Break growth barriers', 'Scale operations', 'Achieve targets']
      }
    ]
  },
  trust_items: {
    type: 'array' as const,
    default: []
  }
};

// Helper to generate unique ID
const generateId = () => `persona${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default icons for new personas
const DEFAULT_PERSONA_ICONS = ['👤', '👥', '👔', '🎯', '💼', '🚀', '⭐', '🔥'];

export default function PersonaPanels(props: LayoutComponentProps) {

  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
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

  // Get personas array from content (V2 format)
  const personas: PersonaItem[] = blockContent.personas || CONTENT_SCHEMA.personas.default;

  // Get trust items array
  const trustItems: TrustItem[] = blockContent.trust_items || [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Color mapping for personas
  function getPersonaColor(index: number, theme: UIBlockTheme) {
    const warmColors = [
      { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
      { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      { bg: 'bg-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
    ];

    const coolColors = [
      { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
      { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
      { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' }
    ];

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

  // Add a new persona
  const addPersona = () => {
    if (personas.length >= 6) return;

    const newPersona: PersonaItem = {
      id: generateId(),
      name: 'New Persona',
      problem: 'Describe the main challenge this persona faces in their daily work or life.',
      description: 'Brief role description',
      title: 'Role Title',
      icon: DEFAULT_PERSONA_ICONS[Math.floor(Math.random() * DEFAULT_PERSONA_ICONS.length)],
      pain_points: ['Daily frustration 1', 'Daily frustration 2', 'Daily frustration 3'],
      goals: ['Goal 1', 'Goal 2', 'Goal 3']
    };

    handleContentUpdate('personas', [...personas, newPersona]);
  };

  // Remove a persona
  const removePersona = (id: string) => {
    if (personas.length <= 2) return;

    const index = personas.findIndex(p => p.id === id);
    if (activePersona >= personas.length - 1 && personas.length > 1) {
      setActivePersona(personas.length - 2);
    }

    handleContentUpdate('personas', personas.filter(p => p.id !== id));
  };

  // Update a specific field in a persona
  const updatePersonaField = (id: string, field: keyof PersonaItem, value: any) => {
    const updated = personas.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    handleContentUpdate('personas', updated);
  };

  // Update a specific pain point
  const updatePainPoint = (personaId: string, pointIndex: number, value: string) => {
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return;

    const newPainPoints = [...persona.pain_points];
    newPainPoints[pointIndex] = value;
    updatePersonaField(personaId, 'pain_points', newPainPoints);
  };

  // Update a specific goal
  const updateGoal = (personaId: string, goalIndex: number, value: string) => {
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return;

    const newGoals = [...persona.goals];
    newGoals[goalIndex] = value;
    updatePersonaField(personaId, 'goals', newGoals);
  };

  const PersonaCard = ({ persona, index, isActive }: {
    persona: PersonaItem;
    index: number;
    isActive: boolean;
  }) => {
    const color = getPersonaColor(index, theme);

    return (
      <div
        className={`relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
          isActive
            ? `${color.border} shadow-xl scale-105`
            : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }`}
        onClick={() => setActivePersona(index)}
      >
        {/* Remove button */}
        {mode !== 'preview' && personas.length > 2 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePersona(persona.id);
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
            <div className={`w-16 h-16 rounded-full ${color.bg} flex items-center justify-center text-white mx-auto mb-4 group/icon-edit relative`}>
              <IconEditableText
                mode={mode}
                value={persona.icon || '👤'}
                onEdit={(value) => updatePersonaField(persona.id, 'icon', value)}
                backgroundType={backgroundType as any}
                colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
                iconSize="xl"
                className="text-3xl text-white"
                sectionId={sectionId}
                elementKey={`persona_icon_${persona.id}`}
              />
            </div>
            <EditableAdaptiveText
              mode={mode}
              value={persona.name}
              onEdit={(value) => updatePersonaField(persona.id, 'name', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-xl font-bold text-gray-900 mb-2 text-center"
              placeholder="Persona name..."
              sectionId={sectionId}
              elementKey={`persona_name_${persona.id}`}
              sectionBackground={sectionBackground}
            />
            {(persona.title || mode === 'edit') && (
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${color.light} ${color.text}`}>
                <EditableAdaptiveText
                  mode={mode}
                  value={persona.title || ''}
                  onEdit={(value) => updatePersonaField(persona.id, 'title', value)}
                  backgroundType={backgroundType as any}
                  colorTokens={{ ...colorTokens, textPrimary: color.text }}
                  variant="body"
                  className="text-sm font-medium"
                  placeholder="Persona title..."
                  sectionId={sectionId}
                  elementKey={`persona_title_${persona.id}`}
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
                onEdit={(value) => updatePersonaField(persona.id, 'description', value)}
                backgroundType={backgroundType as any}
                colorTokens={colorTokens}
                variant="body"
                className={`${mutedTextColor}`}
                placeholder="Persona description..."
                sectionId={sectionId}
                elementKey={`persona_description_${persona.id}`}
                sectionBackground={sectionBackground}
              />
            </div>
          )}

          {/* Indicator */}
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive ? color.light : 'bg-gray-100'} ${isActive ? color.text : 'text-gray-600'} transition-colors duration-300`}>
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
  };

  const PersonaDetails = ({ persona, index }: {
    persona: PersonaItem;
    index: number;
  }) => {
    const color = getPersonaColor(index, theme);

    return (
      <div className={`bg-gradient-to-br ${color.light} to-white rounded-2xl p-8 border ${color.border}`}>
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className={`w-16 h-16 rounded-full ${color.bg} flex items-center justify-center text-white group/icon-edit relative`}>
            <IconEditableText
              mode={mode}
              value={persona.icon || '👤'}
              onEdit={(value) => updatePersonaField(persona.id, 'icon', value)}
              backgroundType={backgroundType as any}
              colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
              iconSize="xl"
              className="text-3xl text-white"
              sectionId={sectionId}
              elementKey={`persona_detail_icon_${persona.id}`}
            />
          </div>
          <div>
            <EditableAdaptiveText
              mode={mode}
              value={persona.name}
              onEdit={(value) => updatePersonaField(persona.id, 'name', value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              variant="body"
              className="text-2xl font-bold text-gray-900"
              placeholder="Persona name..."
              sectionId={sectionId}
              elementKey={`persona_detail_name_${persona.id}`}
              sectionBackground={sectionBackground}
            />
            {(persona.title || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={persona.title || ''}
                onEdit={(value) => updatePersonaField(persona.id, 'title', value)}
                backgroundType={backgroundType as any}
                colorTokens={{ ...colorTokens, textPrimary: color.text }}
                variant="body"
                className={`${color.text} font-medium`}
                placeholder="Persona title..."
                sectionId={sectionId}
                elementKey={`persona_detail_title_${persona.id}`}
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
            onEdit={(value) => updatePersonaField(persona.id, 'problem', value)}
            backgroundType={backgroundType as any}
            colorTokens={colorTokens}
            variant="body"
            className="text-gray-700 leading-relaxed text-lg"
            placeholder="Describe the persona's main problem..."
            sectionId={sectionId}
            elementKey={`persona_problem_${persona.id}`}
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
              {persona.pain_points.map((point, pointIndex) => (
                <div key={pointIndex} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={point}
                    onEdit={(value) => updatePainPoint(persona.id, pointIndex, value)}
                    backgroundType={backgroundType as any}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-700 flex-1"
                    placeholder="Pain point..."
                    sectionId={sectionId}
                    elementKey={`pain_point_${persona.id}_${pointIndex}`}
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
              {persona.goals.map((goal, goalIndex) => (
                <div key={goalIndex} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <EditableAdaptiveText
                    mode={mode}
                    value={goal}
                    onEdit={(value) => updateGoal(persona.id, goalIndex, value)}
                    backgroundType={backgroundType as any}
                    colorTokens={colorTokens}
                    variant="body"
                    className="text-gray-700 flex-1"
                    placeholder="Goal..."
                    sectionId={sectionId}
                    elementKey={`goal_${persona.id}_${goalIndex}`}
                    sectionBackground={sectionBackground}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                sectionId={sectionId}
                elementKey="intro_text"
              />
            </div>
          )}
        </div>

        {/* Persona Selection Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {personas.map((persona, index) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              index={index}
              isActive={activePersona === index}
            />
          ))}
        </div>

        {/* Add Persona Button */}
        {mode !== 'preview' && personas.length < 6 && (
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
              index={activePersona}
            />
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
                placeholder="Add optional supporting text to reinforce persona identification..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {trustItems.length > 0 && (
              <TrustIndicators
                items={trustItems.map(t => t.text)}
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
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'personas', label: 'Personas', type: 'array', required: true },
    { key: 'trust_items', label: 'Trust Items', type: 'array', required: false }
  ],

  features: [
    'Dynamic add/remove personas (2-6 range)',
    'Interactive persona selection',
    'Detailed persona problem descriptions',
    'Pain points and goals breakdown',
    'Color-coded persona identification',
    'V2 array-based data format'
  ],

  useCases: [
    'Audience segmentation',
    'Persona-based problem identification',
    'Targeted messaging sections',
    'Customer type qualification',
    'Personalized problem presentation'
  ]
};
