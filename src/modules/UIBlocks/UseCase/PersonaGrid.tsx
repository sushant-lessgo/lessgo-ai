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

// Content interface for type safety
interface PersonaGridContent {
  headline: string;
  persona_names: string;
  persona_descriptions: string;
  footer_text?: string;
  badge_text?: string;
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
    default: 'Designed to work seamlessly across all team roles' 
  },
  badge_text: { 
    type: 'string' as const, 
    default: 'Target User' 
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

// Persona Avatar Component
const PersonaAvatar = React.memo(({ 
  name, 
  iconOverride, 
  mode, 
  colorTokens, 
  sectionId, 
  index, 
  onIconEdit 
}: { 
  name: string;
  iconOverride?: string;
  mode: 'edit' | 'preview';
  colorTokens: any;
  sectionId: string;
  index: number;
  onIconEdit: (index: number, value: string) => void;
}) => {
  // Generate avatar based on persona type
  const getPersonaInfo = (personaName: string) => {
    const lower = personaName.toLowerCase();
    
    // Professional color schemes for different roles
    const roleColors = {
      marketing: { bg: 'from-pink-500 to-purple-600', icon: 'megaphone' },
      sales: { bg: 'from-green-500 to-emerald-600', icon: 'trending-up' },
      operations: { bg: 'from-blue-500 to-indigo-600', icon: 'settings' },
      product: { bg: 'from-orange-500 to-red-600', icon: 'cube' },
      customer: { bg: 'from-teal-500 to-cyan-600', icon: 'users' },
      finance: { bg: 'from-yellow-500 to-amber-600', icon: 'chart' },
      default: { bg: 'from-gray-500 to-slate-600', icon: 'user' }
    };
    
    let roleInfo = roleColors.default;
    
    if (lower.includes('marketing')) roleInfo = roleColors.marketing;
    else if (lower.includes('sales')) roleInfo = roleColors.sales;
    else if (lower.includes('operations') || lower.includes('ops')) roleInfo = roleColors.operations;
    else if (lower.includes('product')) roleInfo = roleColors.product;
    else if (lower.includes('customer') || lower.includes('success')) roleInfo = roleColors.customer;
    else if (lower.includes('finance') || lower.includes('accounting')) roleInfo = roleColors.finance;
    
    // Generate initials
    const initials = personaName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return { ...roleInfo, initials };
  };

  const { bg, initials } = getPersonaInfo(name);

  return (
    <div className="relative mb-4">
      {/* Main Avatar Circle */}
      <div className={`w-16 h-16 bg-gradient-to-br ${bg} rounded-full flex items-center justify-center text-white shadow-lg mx-auto`}>
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
      
      {/* Role Badge */}
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      
      {/* Icon Override Button for Edit Mode */}
      {mode === 'edit' && !iconOverride && (
        <button
          onClick={() => onIconEdit(index, '👤')}
          className="absolute top-0 right-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
  badgeText,
  iconOverride,
  onNameEdit,
  onDescriptionEdit,
  onIconEdit
}: {
  persona: Persona;
  mode: 'edit' | 'preview';
  colorTokens: any;
  backgroundType: any;
  sectionBackground: any;
  sectionId: string;
  badgeText: string;
  iconOverride?: string;
  onNameEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onIconEdit: (index: number, value: string) => void;
}) => {
  
  return (
    <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center">
      
      {/* Persona Avatar */}
      <PersonaAvatar 
        name={persona.name} 
        iconOverride={iconOverride}
        mode={mode}
        colorTokens={colorTokens}
        sectionId={sectionId}
        index={persona.index}
        onIconEdit={onIconEdit}
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
          className="font-bold"
          placeholder="Enter persona name..."
          sectionId={sectionId}
          elementKey={`persona_name_${persona.index}`}
          sectionBackground="bg-white"
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
          className="leading-relaxed text-left text-gray-600"
          placeholder="Enter persona description..."
          sectionId={sectionId}
          elementKey={`persona_description_${persona.index}`}
          sectionBackground="bg-white"
        />
      </div>
      
      {/* Persona Badge */}
      <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        {badgeText}
      </div>
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
        <div className="text-center mb-16">
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
              badgeText={blockContent.badge_text || 'Target User'}
              iconOverride={getPersonaIcon(persona.index)}
              onNameEdit={handleNameEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onIconEdit={handleIconEdit}
            />
          ))}
        </div>

        {/* Universal Appeal */}
        {(blockContent.footer_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-blue-50 border border-blue-200 rounded-full">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType="neutral"
                colorTokens={{ ...colorTokens, textPrimary: 'text-blue-800' }}
                variant="body"
                className="font-medium text-blue-800"
                placeholder="Add footer message about team compatibility..."
                sectionId={sectionId}
                elementKey="footer_text"
                sectionBackground="bg-blue-50"
              />
            </div>
          </div>
        )}

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