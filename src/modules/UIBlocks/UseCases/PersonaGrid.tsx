// components/layout/PersonaGrid.tsx
// V2 Schema - Array-based persona grid

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/uiBlockTheme';
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';
import { cn } from '@/lib/utils';
import { getCardStyles, type CardStyles } from '@/modules/Design/cardStyles';

// V2 Types
interface Persona {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

interface PersonaGridContent {
  headline: string;
  subheadline?: string;
  footer_text?: string;
  personas: Persona[];
}

// CONTENT_SCHEMA removed — defaults now in layoutElementSchema.ts (PersonaGrid entry)

// Generate unique ID
const generateId = () => `p${Date.now().toString(36)}`;

// Persona Avatar Component
const PersonaAvatar = React.memo(({
  name,
  icon,
  mode,
  colorTokens,
  sectionId,
  personaId,
  onIconEdit,
  themeColors
}: {
  name: string;
  icon?: string;
  mode: 'edit' | 'preview';
  colorTokens: any;
  sectionId: string;
  personaId: string;
  onIconEdit: (personaId: string, value: string) => void;
  themeColors: {
    avatarGradient: string;
    avatarRing: string;
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
      <div className={`w-16 h-16 bg-gradient-to-br ${themeColors.avatarGradient} rounded-full flex items-center justify-center text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] ${themeColors.avatarRing} ring-1 backdrop-blur-sm mx-auto transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.22)] group-hover:-translate-y-0.5`}>
        {icon ? (
          <IconEditableText
            mode={mode}
            value={icon}
            onEdit={(value) => onIconEdit(personaId, value)}
            backgroundType="primary"
            colorTokens={{ ...colorTokens, textPrimary: 'text-white' }}
            iconSize="lg"
            className="text-2xl text-white"
            sectionId={sectionId}
            elementKey={`persona_icon_${personaId}`}
          />
        ) : (
          <span className="font-bold text-lg">{initials}</span>
        )}
      </div>

      {/* Icon Override Button for Edit Mode */}
      {mode !== 'preview' && !icon && (
        <button
          onClick={() => onIconEdit(personaId, '👤')}
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
  sectionId,
  onNameEdit,
  onDescriptionEdit,
  onIconEdit,
  onRemovePersona,
  canRemove = true,
  themeColors,
  cardStyles,
  sectionBackground,
  cardClassName
}: {
  persona: Persona;
  mode: 'edit' | 'preview';
  colorTokens: any;
  sectionId: string;
  onNameEdit: (personaId: string, value: string) => void;
  onDescriptionEdit: (personaId: string, value: string) => void;
  onIconEdit: (personaId: string, value: string) => void;
  onRemovePersona?: (personaId: string) => void;
  canRemove?: boolean;
  themeColors: {
    avatarGradient: string;
    avatarRing: string;
    addButtonBg: string;
    addButtonBorder: string;
    addButtonHover: string;
    addButtonText: string;
  };
  cardStyles: CardStyles;
  sectionBackground: string;
  cardClassName?: string;
}) => {

  return (
    <div className={cn(`group/persona-card relative ${cardStyles.bg} ${cardStyles.blur} rounded-2xl border ${cardStyles.border} ${cardStyles.shadow} ${cardStyles.hoverEffect} hover:-translate-y-1 transition-all duration-300 text-center`, cardClassName || 'p-6')}>

      {/* Persona Avatar */}
      <PersonaAvatar
        name={persona.name}
        icon={persona.icon}
        mode={mode}
        colorTokens={colorTokens}
        sectionId={sectionId}
        personaId={persona.id}
        onIconEdit={onIconEdit}
        themeColors={themeColors}
      />

      {/* Persona Name */}
      <div className="mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={persona.name}
          onEdit={(value) => onNameEdit(persona.id, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className={`font-bold text-center ${cardStyles.textHeading}`}
          placeholder="Enter persona name..."
          sectionId={sectionId}
          elementKey={`persona_name_${persona.id}`}
          sectionBackground={sectionBackground}
          formatState={{ textAlign: 'center', bold: true } as any}
        />
      </div>

      {/* Persona Description */}
      <div className="mb-4">
        <EditableAdaptiveText
          mode={mode}
          value={persona.description}
          onEdit={(value) => onDescriptionEdit(persona.id, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          className={`leading-relaxed text-center ${cardStyles.textBody}`}
          placeholder="Enter persona description..."
          sectionId={sectionId}
          elementKey={`persona_description_${persona.id}`}
          sectionBackground={sectionBackground}
          formatState={{ textAlign: 'center', fontSize: '14px' } as any}
        />
      </div>

      {/* Delete button - only show in edit mode and if can remove */}
      {mode !== 'preview' && onRemovePersona && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemovePersona(persona.id);
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
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    handleContentUpdate,
    backgroundType
  } = useLayoutComponent<PersonaGridContent>({
    ...props
  });

  // Theme detection
  const uiTheme: UIBlockTheme = props.manualThemeOverride || 'neutral';

  // Get adaptive card styles based on section background luminance
  const cardStyles = React.useMemo(() => {
    return getCardStyles({
      sectionBackgroundCSS: sectionBackground || '',
      theme: uiTheme
    });
  }, [sectionBackground, uiTheme]);

  // Get theme-specific colors (avatar gradients and add button only - card styling from cardStyles)
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        avatarGradient: 'from-orange-500 to-red-600',
        avatarRing: 'ring-orange-200',
        addButtonBg: 'from-orange-50 to-red-50',
        addButtonBorder: 'border-orange-200',
        addButtonHover: 'hover:border-orange-300',
        addButtonText: 'text-orange-700'
      },
      cool: {
        avatarGradient: 'from-blue-500 to-indigo-600',
        avatarRing: 'ring-blue-200',
        addButtonBg: 'from-blue-50 to-indigo-50',
        addButtonBorder: 'border-blue-200',
        addButtonHover: 'hover:border-blue-300',
        addButtonText: 'text-blue-700'
      },
      neutral: {
        avatarGradient: 'from-gray-500 to-slate-600',
        avatarRing: 'ring-gray-200',
        addButtonBg: 'from-gray-50 to-slate-50',
        addButtonBorder: 'border-gray-200',
        addButtonHover: 'hover:border-gray-300',
        addButtonText: 'text-gray-700'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get personas array (with fallback)
  const personas: Persona[] = blockContent.personas || [];

  // Handle editing (cast to any for array updates)
  const handleNameEdit = (personaId: string, value: string) => {
    const updated = personas.map(p =>
      p.id === personaId ? { ...p, name: value } : p
    );
    (handleContentUpdate as any)('personas', updated);
  };

  const handleDescriptionEdit = (personaId: string, value: string) => {
    const updated = personas.map(p =>
      p.id === personaId ? { ...p, description: value } : p
    );
    (handleContentUpdate as any)('personas', updated);
  };

  const handleIconEdit = (personaId: string, value: string) => {
    const updated = personas.map(p =>
      p.id === personaId ? { ...p, icon: value } : p
    );
    (handleContentUpdate as any)('personas', updated);
  };

  // Handle adding a new persona
  const handleAddPersona = () => {
    const newPersona: Persona = {
      id: generateId(),
      name: 'New Team Member',
      description: 'Describe how this persona benefits from your solution.'
    };
    (handleContentUpdate as any)('personas', [...personas, newPersona]);
  };

  // Handle removing a persona
  const handleRemovePersona = (personaId: string) => {
    const updated = personas.filter(p => p.id !== personaId);
    (handleContentUpdate as any)('personas', updated);
  };

  // Dynamic card layout
  const layout = getDynamicCardLayout(personas.length);

  // Helper to render persona card
  const renderPersonaCard = (persona: Persona, cardClass: string) => (
    <PersonaCard
      key={persona.id}
      persona={persona}
      mode={mode}
      colorTokens={colorTokens}
      sectionId={sectionId}
      onNameEdit={handleNameEdit}
      onDescriptionEdit={handleDescriptionEdit}
      onIconEdit={handleIconEdit}
      onRemovePersona={handleRemovePersona}
      canRemove={personas.length > 1}
      themeColors={themeColors}
      cardStyles={cardStyles}
      sectionBackground={sectionBackground}
      cardClassName={cardClass}
    />
  );

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

          {/* Subheadline */}
          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a subheadline..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Persona Grid */}
        {isSplitLayout(personas.length) && layout.splitLayout ? (
          <div className={layout.containerClass}>
            <div className={layout.splitLayout.firstRowGrid}>
              {personas.slice(0, layout.splitLayout.firstRowCount).map((persona) =>
                renderPersonaCard(persona, layout.splitLayout!.firstRowCard)
              )}
            </div>
            <div className={layout.splitLayout.secondRowGrid}>
              {personas.slice(layout.splitLayout.firstRowCount).map((persona) =>
                renderPersonaCard(persona, layout.splitLayout!.secondRowCard)
              )}
            </div>
          </div>
        ) : (
          <div className={layout.containerClass}>
            <div className={layout.gridClass}>
              {personas.map((persona) =>
                renderPersonaCard(persona, layout.cardClass)
              )}
            </div>
          </div>
        )}

        {/* Add Persona Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && personas.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddPersona}
              className={`flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r ${themeColors.addButtonBg} border-2 border-dashed ${themeColors.addButtonBorder} ${themeColors.addButtonHover} rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addButtonText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addButtonText} font-medium`}>Add Persona</span>
            </button>
          </div>
        )}

        {/* Footer Text */}
        {(blockContent.footer_text || mode !== 'preview') && (
          <div className="mt-16 text-center mb-16">
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.footer_text || ''}
              onEdit={(value) => handleContentUpdate('footer_text', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg leading-relaxed max-w-5xl mx-auto text-center"
              placeholder="Add a summary statement about your target users..."
              sectionId={sectionId}
              elementKey="footer_text"
              sectionBackground={sectionBackground}
              formatState={{ textAlign: 'center' } as any}
            />
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export component metadata
export const componentMeta = {
  name: 'PersonaGrid',
  category: 'Use Cases',
  description: 'Show how your product serves different user personas',
  tags: ['personas', 'users', 'grid', 'targeting', 'use-cases'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',

  features: [
    'V2 array-based persona data',
    'Role-based persona avatars with initials',
    'Optional custom icons per persona',
    'Theme-aware styling (warm/cool/neutral)',
    'Responsive grid layout'
  ],

  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'text', required: false },
    { key: 'personas', label: 'Personas', type: 'array', required: true },
    { key: 'footer_text', label: 'Footer Text', type: 'text', required: false }
  ],

  useCases: [
    'Target audience showcase',
    'User persona section',
    'Team role alignment',
    'Product-market fit demonstration'
  ]
};
