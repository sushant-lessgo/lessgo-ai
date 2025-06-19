import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { usePageStore } from '@/hooks/usePageStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface PersonaGridProps extends LayoutComponentProps {}

// Persona structure
interface Persona {
  name: string;
  description: string;
  useCaseExample?: string;
  id: string;
}

// Content interface for PersonaGrid layout
interface PersonaGridContent {
  headline: string;
  persona_names: string;
  persona_descriptions: string;
  use_case_examples?: string;
}

// Content schema for PersonaGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Built for Every Team Member' },
  persona_names: { type: 'string' as const, default: 'Marketing Manager|Sales Director|Operations Lead|Product Manager|Customer Success Manager|Finance Director' },
  persona_descriptions: { type: 'string' as const, default: 'Track campaign performance, manage content calendars, and coordinate cross-team marketing initiatives with real-time visibility into ROI and engagement metrics.|Monitor sales pipeline, forecast revenue, and optimize team performance while maintaining clear visibility into customer interactions and deal progression.|Streamline processes, manage resource allocation, and ensure smooth day-to-day operations with automated workflows and performance tracking.|Coordinate product development, manage feature requests, and track user feedback while keeping stakeholders aligned on roadmap priorities.|Manage customer relationships, track satisfaction metrics, and proactively address issues while ensuring seamless onboarding and retention.|Oversee budgets, generate financial reports, and maintain fiscal oversight with real-time spending tracking and automated approval workflows.' },
  use_case_examples: { type: 'string' as const, default: '' }
};

// Parse persona data from pipe-separated strings
const parsePersonaData = (names: string, descriptions: string, examples?: string): Persona[] => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const exampleList = examples ? examples.split('|').map(e => e.trim()).filter(e => e) : [];
  
  return nameList.map((name, index) => ({
    id: `persona-${index}`,
    name,
    description: descriptionList[index] || 'Persona description not provided.',
    useCaseExample: exampleList[index] || undefined
  }));
};

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Persona Avatar Component
const PersonaAvatar = ({ name }: { name: string }) => {
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

  const { bg, icon, initials } = getPersonaInfo(name);

  // Icon components
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'megaphone':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'trending-up':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'cube':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      {/* Main Avatar Circle */}
      <div className={`w-16 h-16 bg-gradient-to-br ${bg} rounded-full flex items-center justify-center text-white shadow-lg mb-4 mx-auto`}>
        <span className="font-bold text-lg">{initials}</span>
      </div>
      
      {/* Role Icon Badge */}
      <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
        <div className={`w-6 h-6 bg-gradient-to-br ${bg} rounded-full flex items-center justify-center text-white`}>
          {getIcon(icon)}
        </div>
      </div>
    </div>
  );
};

// Individual Persona Card
const PersonaCard = ({ 
  persona, 
  index, 
  mode, 
  sectionId,
  onNameEdit,
  onDescriptionEdit,
  onExampleEdit
}: {
  persona: Persona;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onNameEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onExampleEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
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
            onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-bold text-gray-900"
            style={getTextStyle('h3')}
          >
            {persona.name}
          </div>
        ) : (
          <h3 
            className="font-bold text-gray-900"
            style={getTextStyle('h3')}
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
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed text-left"
            style={getTextStyle('body-sm')}
          >
            {persona.description}
          </div>
        ) : (
          <p 
            className="text-gray-600 leading-relaxed text-left"
            style={getTextStyle('body-sm')}
          >
            {persona.description}
          </p>
        )}
      </div>
      
      {/* Optional Use Case Example */}
      {(persona.useCaseExample || mode === 'edit') && (
        <div className="pt-4 border-t border-gray-100">
          <div className="text-left">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Use Case Example
            </div>
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onExampleEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[40px] cursor-text hover:bg-gray-50 text-blue-700 text-sm leading-relaxed ${!persona.useCaseExample ? 'opacity-50 italic' : ''}`}
                style={getTextStyle('body-sm')}
              >
                {persona.useCaseExample || 'Add specific use case example for this persona...'}
              </div>
            ) : persona.useCaseExample && (
              <p 
                className="text-blue-700 text-sm leading-relaxed"
                style={getTextStyle('body-sm')}
              >
                {persona.useCaseExample}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Persona Badge */}
      <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Target User
      </div>
    </div>
  );
};

export default function PersonaGrid({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: PersonaGridProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    ui: { mode }, 
    layout: { theme },
    updateElementContent 
  } = usePageStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: PersonaGridContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse persona data
  const personas = parsePersonaData(
    blockContent.persona_names,
    blockContent.persona_descriptions,
    blockContent.use_case_examples
  );

  // Handle individual editing
  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.persona_names.split('|');
    names[index] = value;
    handleContentUpdate('persona_names', names.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.persona_descriptions.split('|');
    descriptions[index] = value;
    handleContentUpdate('persona_descriptions', descriptions.join('|'));
  };

  const handleExampleEdit = (index: number, value: string) => {
    const examples = blockContent.use_case_examples ? blockContent.use_case_examples.split('|') : [];
    examples[index] = value;
    handleContentUpdate('use_case_examples', examples.join('|'));
  };

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = usePageStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="PersonaGrid"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
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
          {personas.map((persona, index) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onNameEdit={handleNameEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onExampleEdit={handleExampleEdit}
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

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  PersonaGrid - Edit persona content or click individual elements above
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Persona Names (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="persona_names"
                    onEdit={(value) => handleContentUpdate('persona_names', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto">
                      {blockContent.persona_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Use Case Examples (optional, |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="use_case_examples"
                    onEdit={(value) => handleContentUpdate('use_case_examples', value)}
                  >
                    <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto ${!blockContent.use_case_examples ? 'opacity-50 italic' : ''}`}>
                      {blockContent.use_case_examples || 'Add specific use case examples...'}
                    </div>
                  </ModeWrapper>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-blue-700 font-medium mb-1">Persona Descriptions (|):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="persona_descriptions"
                    onEdit={(value) => handleContentUpdate('persona_descriptions', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {blockContent.persona_descriptions}
                    </div>
                  </ModeWrapper>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 Tip: Avatars and role icons are auto-generated based on persona names (Marketing, Sales, Operations, etc.). Grid adapts automatically to 1-6+ personas.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}