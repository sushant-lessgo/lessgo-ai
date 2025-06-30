// components/layout/PersonaGrid.tsx
// Production-ready persona grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableHeadline, 
  EditableText 
} from '@/components/layout/EditableContent';
import { EditableList } from '@/components/layout/EditableList';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface PersonaGridContent {
  headline: string;
  persona_names: string;
  persona_descriptions: string;
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
  }
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
const PersonaAvatar = React.memo(({ name }: { name: string }) => {
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
        <span className="font-bold text-lg">{initials}</span>
      </div>
      
      {/* Role Badge */}
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
    </div>
  );
});
PersonaAvatar.displayName = 'PersonaAvatar';

// Individual Persona Card
const PersonaCard = React.memo(({ 
  persona, 
  mode, 
  colorTokens,
  getTextStyle,
  onNameEdit,
  onDescriptionEdit
}: {
  persona: Persona;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onNameEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  
  return (
    <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center">
      
      {/* Persona Avatar */}
      <PersonaAvatar name={persona.name} />
      
      {/* Persona Name */}
      <div className="mb-4">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onNameEdit(persona.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold"
            style={getTextStyle('h4')}
          >
            {persona.name}
          </div>
        ) : (
          <h3 
            className={`font-bold ${colorTokens.textPrimary}`}
            style={getTextStyle('h4')}
          >
            {persona.name}
          </h3>
        )}
      </div>
      
      {/* Persona Description */}
      <div className="mb-4">
        {mode === 'edit' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(persona.index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 leading-relaxed text-left"
            style={getTextStyle('body-sm')}
          >
            {persona.description}
          </div>
        ) : (
          <p 
            className={`${colorTokens.textSecondary} leading-relaxed text-left`}
            style={getTextStyle('body-sm')}
          >
            {persona.description}
          </p>
        )}
      </div>
      
      {/* Persona Badge */}
      <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Target User
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
    handleContentUpdate
  } = useLayoutComponent<PersonaGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse persona data
  const personas = parsePersonaData(blockContent.persona_names, blockContent.persona_descriptions);

  // Handle individual editing
  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.persona_names, index, value);
    handleContentUpdate('persona_names', updatedNames);
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const updatedDescriptions = updateListData(blockContent.persona_descriptions, index, value);
    handleContentUpdate('persona_descriptions', updatedDescriptions);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="PersonaGrid"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
      editModeInfo={{
        componentName: 'PersonaGrid',
        description: 'Show how your product serves different user personas',
        tips: [
          'Avatars and role colors are auto-generated based on persona names',
          'Grid adapts automatically to 1-6+ personas',
          'Click individual elements to edit them directly'
        ]
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            colorClass={colorTokens.textOnLight || colorTokens.textPrimary}
            textStyle={getTextStyle('h1')}
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
              getTextStyle={getTextStyle}
              onNameEdit={handleNameEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* Universal Appeal */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-800">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Designed to work seamlessly across all team roles</span>
          </div>
        </div>

        {/* Bulk Edit Interface */}
        <EditableList
          mode={mode}
          items={personas}
          onUpdateItem={(field, index, value) => {
            if (field === 'name') handleNameEdit(index, value);
            if (field === 'description') handleDescriptionEdit(index, value);
          }}
          renderItem={() => null} // Items already rendered above
          bulkEditFields={[
            {
              key: 'persona_names',
              label: 'Persona Names',
              currentValue: blockContent.persona_names,
              onUpdate: (value) => handleContentUpdate('persona_names', value)
            },
            {
              key: 'persona_descriptions',
              label: 'Persona Descriptions',
              currentValue: blockContent.persona_descriptions,
              onUpdate: (value) => handleContentUpdate('persona_descriptions', value)
            }
          ]}
          listName="Persona Grid"
          tips={[
            'Avatars and role icons are auto-generated based on persona names (Marketing, Sales, Operations, etc.)',
            'Grid adapts automatically to 1-6+ personas'
          ]}
        />
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'PersonaGrid',
  category: 'Feature Sections',
  description: 'Show how your product serves different user personas',
  tags: ['personas', 'users', 'grid', 'targeting'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
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