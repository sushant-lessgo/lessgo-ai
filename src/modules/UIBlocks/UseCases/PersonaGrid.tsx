// components/layout/PersonaGrid.tsx
// Production-ready persona grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// Content interface for type safety
interface PersonaGridContent {
  headline: string;
  persona_names: string;
  persona_descriptions: string;
  footer_text?: string;
  // Optional persona icon overrides
  persona_icon_1?: string;
  persona_icon_2?: string;
  persona_icon_3?: string;
  persona_icon_4?: string;
  persona_icon_5?: string;
  persona_icon_6?: string;
}

// Persona structure
interface Persona {
  id: string;
  index: number;
  name: string;
  description: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Built for Every Team Member' 
  },
  persona_names: { 
    type: 'string' as const, 
    default: 'Marketing Manager|Sales Director|Operations Lead|Product Manager|Customer Success Manager|Finance Director' 
  },
  persona_descriptions: { 
    type: 'string' as const, 
    default: 'Track campaign performance, manage content calendars, and coordinate cross-team marketing initiatives with real-time visibility into ROI and engagement metrics.|Monitor sales pipeline, forecast revenue, and optimize team performance while maintaining clear visibility into customer interactions and deal progression.|Streamline processes, manage resource allocation, and ensure smooth day-to-day operations with automated workflows and performance tracking.|Coordinate product development, manage feature requests, and track user feedback while keeping stakeholders aligned on roadmap priorities.|Manage customer relationships, track satisfaction metrics, and proactively address issues while ensuring seamless onboarding and retention.|Oversee budgets, generate financial reports, and maintain fiscal oversight with real-time spending tracking and automated approval workflows.' 
  },
  footer_text: {
    type: 'string' as const,
    default: 'Add a summary statement about your target users and how your product serves them...'
  },
  // Optional persona icon overrides (empty by default to show initials)
  persona_icon_1: { type: 'string' as const, default: '' },
  persona_icon_2: { type: 'string' as const, default: '' },
  persona_icon_3: { type: 'string' as const, default: '' },
  persona_icon_4: { type: 'string' as const, default: '' },
  persona_icon_5: { type: 'string' as const, default: '' },
  persona_icon_6: { type: 'string' as const, default: '' }
};

// Parse persona data from pipe-separated strings
const parsePersonaData = (names: string, descriptions: string): Persona[] => {
  const nameList = parsePipeData(names);
  const descriptionList = parsePipeData(descriptions);

  return nameList.map((name, index) => ({
    id: `persona-${index}`,
    index,
    name: name.trim(),
    description: descriptionList[index] || 'Persona description not provided.'
  }));
};

// Helper function to add a new persona
const addPersona = (names: string, descriptions: string): { newNames: string; newDescriptions: string } => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Add new persona with default content
  nameList.push('New Team Member');
  descriptionList.push('Describe how this persona benefits from your solution.');

  return {
    newNames: nameList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Helper function to remove a persona
const removePersona = (names: string, descriptions: string, indexToRemove: number): { newNames: string; newDescriptions: string } => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  // Remove the persona at the specified index
  if (indexToRemove >= 0 && indexToRemove < nameList.length) {
    nameList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newNames: nameList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

// Persona Avatar Component
const PersonaAvatar = React.memo(({
  name,
  iconOverride,
  mode,
  colorTokens,
  sectionId,
  index,
  onIconEdit,
  themeColors
}: {
  name: string;
  iconOverride?: string;
  mode: 'edit' | 'preview';
  colorTokens: any;
  sectionId: string;
  index: number;
  onIconEdit: (index: number, value: string) => void;
  themeColors: {
    avatarGradient: string;
    avatarRing: string;
    cardBorder: string;
    cardHover: string;
    addButtonBg: string;
    addButtonBorder: string;
    addButtonHover: string;
    addButtonText: string;
  };
}) => {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative mb-4">
      {/* Main Avatar Circle */}
      <div className={`w-16 h-16 bg-gradient-to-br ${themeColors.avatarGradient} rounded-full flex items-center justify-center text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] ${themeColors.avatarRing} ring-1 backdrop-blur-sm mx-auto transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.22)] group-hover:-translate-y-0.5`}>
        {iconOverride ? (
          <IconEditableText
            mode={mode}
            value={iconOverride}
            onEdit={(value) => onIconEdit(index, value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            iconSize="lg"
            className="text-2xl text-white"
            sectionId={sectionId}
            elementKey={`persona_icon_${index + 1}`}
          />
        ) : (
          <span className="font-bold text-lg">{initials}</span>
        )}
      </div>

      {/* Icon Override Button for Edit Mode */}
      {mode !== 'preview' && !iconOverride && (
        <button
          onClick={() => onIconEdit(index, '👤')}
          className="absolute top-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Add custom icon"
        >
          +
        </button>
      )}
    </div>
  );
});
PersonaAvatar.displayName = 'PersonaAvatar';

// Individual Persona Card
const PersonaCard = React.memo(({
  persona,
  mode,
  colorTokens,
  backgroundType,
  sectionBackground,
  sectionId,
  iconOverride,
  onNameEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemovePersona,
  canRemove = true,
  themeColors
}: {
  persona: Persona;
  mode: 'edit' | 'preview';
  colorTokens: any;
  backgroundType: any;
  sectionBackground: any;
  sectionId: string;
  iconOverride?: string;
  onNameEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onIconEdit: (index: number, value: string) => void;
  onRemovePersona?: (index: number) => void;
  canRemove?: boolean;
  themeColors: {
    avatarGradient: string;
    avatarRing: string;
    cardBorder: string;
    cardHover: string;
    addButtonBg: string;
    addButtonBorder: string;
    addButtonHover: string;
    addButtonText: string;
  };
}) => {

  return (
    <div className={`group/persona-card relative bg-white p-6 rounded-2xl border ${themeColors.cardBorder} shadow-lg ${themeColors.cardHover} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center`}>

      {/* Persona Avatar */}
      <PersonaAvatar
        name={persona.name}
        iconOverride={iconOverride}
        mode={mode}
        colorTokens={colorTokens}
        sectionId={sectionId}
        index={persona.index}
        onIconEdit={onIconEdit}
        themeColors={themeColors}
      />
      
      {/* Persona Name */}
      <div className="mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={persona.name}
          onEdit={(value) => onNameEdit(persona.index, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className="font-bold text-center"
          placeholder="Enter persona name..."
          sectionId={sectionId}
          elementKey={`persona_name_${persona.index}`}
          sectionBackground="bg-white"
          formatState={{ textAlign: 'center', bold: true } as any}
        />
      </div>
      
      {/* Persona Description */}
      <div className="mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={persona.description}
          onEdit={(value) => onDescriptionEdit(persona.index, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className="leading-relaxed text-center text-gray-600"
          placeholder="Enter persona description..."
          sectionId={sectionId}
          elementKey={`persona_description_${persona.index}`}
          sectionBackground="bg-white"
          formatState={{ textAlign: 'center', fontSize: '14px' } as any}
        />
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemovePersona && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePersona(persona.index);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover/persona-card:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
          title="Remove this persona"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
PersonaCard.displayName = 'PersonaCard';

export default function PersonaGrid(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate,
    dynamicTextColors,
    backgroundType
  } = useLayoutComponent<PersonaGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get theme-specific colors
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        avatarGradient: 'from-orange-500 to-red-600',
        avatarRing: 'ring-orange-200',
        cardBorder: 'border-orange-100',
        cardHover: 'hover:border-orange-200',
        addButtonBg: 'from-orange-50 to-red-50',
        addButtonBorder: 'border-orange-200',
        addButtonHover: 'hover:border-orange-300',
        addButtonText: 'text-orange-700'
      },
      cool: {
        avatarGradient: 'from-blue-500 to-indigo-600',
        avatarRing: 'ring-blue-200',
        cardBorder: 'border-blue-100',
        cardHover: 'hover:border-blue-200',
        addButtonBg: 'from-blue-50 to-indigo-50',
        addButtonBorder: 'border-blue-200',
        addButtonHover: 'hover:border-blue-300',
        addButtonText: 'text-blue-700'
      },
      neutral: {
        avatarGradient: 'from-gray-500 to-slate-600',
        avatarRing: 'ring-gray-200',
        cardBorder: 'border-gray-200',
        cardHover: 'hover:border-gray-300',
        addButtonBg: 'from-gray-50 to-slate-50',
        addButtonBorder: 'border-gray-200',
        addButtonHover: 'hover:border-gray-300',
        addButtonText: 'text-gray-700'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Parse persona data
  const personas = parsePersonaData(blockContent.persona_names, blockContent.persona_descriptions);

  // Get persona icon from content fields by index
  const getPersonaIcon = (index: number) => {
    const iconFields = [
      blockContent.persona_icon_1,
      blockContent.persona_icon_2,
      blockContent.persona_icon_3,
      blockContent.persona_icon_4,
      blockContent.persona_icon_5,
      blockContent.persona_icon_6
    ];
    return iconFields[index];
  };

  // Handle individual editing
  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.persona_names, index, value);
    handleContentUpdate('persona_names', updatedNames);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.persona_descriptions, index, value);
    handleContentUpdate('persona_descriptions', updatedDescriptions);
  };

  const handleIconEdit = (index: number, value: string) => {
    const iconField = `persona_icon_${index + 1}` as keyof PersonaGridContent;
    handleContentUpdate(iconField, value);
  };

  // Handle adding a new persona
  const handleAddPersona = () => {
    const { newNames, newDescriptions } = addPersona(blockContent.persona_names, blockContent.persona_descriptions);
    handleContentUpdate('persona_names', newNames);
    handleContentUpdate('persona_descriptions', newDescriptions);
  };

  // Handle removing a persona
  const handleRemovePersona = (indexToRemove: number) => {
    const { newNames, newDescriptions } = removePersona(blockContent.persona_names, blockContent.persona_descriptions, indexToRemove);
    handleContentUpdate('persona_names', newNames);
    handleContentUpdate('persona_descriptions', newDescriptions);

    // Also clear the corresponding icon if it exists
    const iconField = `persona_icon_${indexToRemove + 1}` as keyof PersonaGridContent;
    if (blockContent[iconField]) {
      handleContentUpdate(iconField, '');
    }
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaGrid"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 mt-8">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
            className="mb-4"
          />
        </div>

        {/* Persona Grid */}
        <div className={`grid gap-8 ${
          personas.length === 1 ? 'max-w-md mx-auto' :
          personas.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          personas.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          personas.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          personas.length === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              mode={mode}
              colorTokens={colorTokens}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              sectionId={sectionId}
              iconOverride={getPersonaIcon(persona.index)}
              onNameEdit={handleNameEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
              onRemovePersona={handleRemovePersona}
              canRemove={personas.length > 1}
              themeColors={themeColors}
            />
          ))}
        </div>

        {/* Add Persona Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && personas.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddPersona}
              className={`flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r ${themeColors.addButtonBg} hover:from-${uiTheme === 'warm' ? 'orange' : uiTheme === 'cool' ? 'blue' : 'gray'}-100 hover:to-${uiTheme === 'warm' ? 'red' : uiTheme === 'cool' ? 'indigo' : 'slate'}-100 border-2 border-dashed ${themeColors.addButtonBorder} ${themeColors.addButtonHover} rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addButtonText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addButtonText} font-medium`}>Add Persona</span>
            </button>
          </div>
        )}

        {/* Summary Statement */}
        <div className="mt-16 text-center mb-16">
          <EditableAdaptiveText
            mode={mode}
            value={blockContent.footer_text || ''}
            onEdit={(value) => handleContentUpdate('footer_text', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            variant="body"
            className="text-lg leading-relaxed max-w-5xl mx-auto text-center"
            placeholder="Add a summary statement about your target users and how your product serves them..."
            sectionId={sectionId}
            elementKey="footer_text"
            sectionBackground={sectionBackground}
            formatState={{ textAlign: 'center' } as any}
          />
        </div>

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'PersonaGrid',
  category: 'Feature Sections',
  description: 'Show how your product serves different user personas with adaptive text colors',
  tags: ['personas', 'users', 'grid', 'targeting', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  // Key features
  features: [
    'Automatic text color adaptation based on background type',
    'Role-based persona avatars',
    'Editable persona descriptions',
    'Professional role indicators',
    'Responsive grid layout'
  ],
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'persona_names', label: 'Persona Names (pipe separated)', type: 'textarea', required: true },
    { key: 'persona_descriptions', label: 'Persona Descriptions (pipe separated)', type: 'textarea', required: true }
  ],
  
  // Usage examples
  useCases: [
    'Target audience showcase',
    'User persona section',
    'Team role alignment',
    'Product-market fit demonstration'
  ]
};