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

interface LogoGridProps extends LayoutComponentProps {}

// Integration item structure
interface IntegrationItem {
  name: string;
  category?: string;
  id: string;
}

// Content interface for LogoGrid layout
interface LogoGridContent {
  headline: string;
  integration_names: string;
  subheadline?: string;
  category_labels?: string;
}

// Content schema for LogoGrid layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Integrates with Your Favorite Tools' },
  integration_names: { type: 'string' as const, default: 'Slack|Microsoft Teams|Google Workspace|Salesforce|HubSpot|Zoom|Asana|Trello|Notion|Airtable|Dropbox|OneDrive|GitHub|Jira|Figma|Adobe Creative Suite' },
  subheadline: { type: 'string' as const, default: '' },
  category_labels: { type: 'string' as const, default: '' }
};

// Parse integration data from pipe-separated strings
const parseIntegrationData = (names: string, categories?: string): IntegrationItem[] => {
  const nameList = names.split('|').map(n => n.trim()).filter(n => n);
  const categoryList = categories ? categories.split('|').map(c => c.trim()).filter(c => c) : [];
  
  return nameList.map((name, index) => ({
    id: `integration-${index}`,
    name,
    category: categoryList[index] || undefined
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

// Logo Placeholder Component
const LogoPlaceholder = ({ name, category }: { name: string, category?: string }) => {
  // Generate a simple logo placeholder based on the integration name
  const getLogoPlaceholder = (integrationName: string) => {
    const firstLetter = integrationName.charAt(0).toUpperCase();
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
    ];
    
    // Simple hash to pick consistent color
    const hash = integrationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { letter: firstLetter, colorClass };
  };

  const { letter, colorClass } = getLogoPlaceholder(name);
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center">
      {/* Logo Circle */}
      <div className="mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
          {letter}
        </div>
      </div>
      
      {/* Integration Name */}
      <div className="space-y-1">
        <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors duration-300">
          {name}
        </h3>
        
        {/* Category Badge */}
        {category && (
          <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {category}
          </span>
        )}
      </div>
    </div>
  );
};

// Editable Logo Item for Edit Mode
const EditableLogoItem = ({ 
  item, 
  mode, 
  index,
  onNameEdit
}: {
  item: IntegrationItem;
  mode: 'edit' | 'preview';
  index: number;
  onNameEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  if (mode === 'edit') {
    const { letter, colorClass } = (() => {
      const firstLetter = item.name.charAt(0).toUpperCase();
      const colors = [
        'from-blue-500 to-blue-600',
        'from-green-500 to-green-600', 
        'from-purple-500 to-purple-600',
        'from-red-500 to-red-600',
        'from-yellow-500 to-yellow-600',
        'from-indigo-500 to-indigo-600',
        'from-pink-500 to-pink-600',
        'from-teal-500 to-teal-600'
      ];
      
      const hash = item.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorClass = colors[hash % colors.length];
      
      return { letter: firstLetter, colorClass };
    })();
    
    return (
      <div className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center">
        {/* Logo Circle */}
        <div className="mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
            {letter}
          </div>
        </div>
        
        {/* Editable Integration Name */}
        <div 
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onNameEdit(index, e.currentTarget.textContent || '')}
          className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-gray-900 text-sm"
          style={getTextStyle('body-sm')}
        >
          {item.name}
        </div>
      </div>
    );
  }
  
  return <LogoPlaceholder name={item.name} category={item.category} />;
};

export default function LogoGrid({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: LogoGridProps) {

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
  const blockContent: LogoGridContent = extractLayoutContent(elements, CONTENT_SCHEMA);

  // Parse integration data
  const integrationItems = parseIntegrationData(blockContent.integration_names, blockContent.category_labels);

  // Handle individual name editing
  const handleNameEdit = (index: number, value: string) => {
    const names = blockContent.integration_names.split('|');
    names[index] = value;
    handleContentUpdate('integration_names', names.join('|'));
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
      data-section-type="LogoGrid"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
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

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p 
                className={`mb-6 max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline...' : '')}
              </p>
            </ModeWrapper>
          )}
        </div>

        {/* Integration Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {integrationItems.map((item, index) => (
            <EditableLogoItem
              key={item.id}
              item={item}
              mode={mode}
              index={index}
              onNameEdit={handleNameEdit}
            />
          ))}
        </div>

        {/* Additional Integration Info */}
        {integrationItems.length > 0 && (
          <div className="mt-12 text-center">
            <p className={`text-sm ${colorTokens.textSecondary}`}>
              and {integrationItems.length}+ more integrations available
            </p>
            
            {/* Connection Indicators */}
            <div className="flex justify-center items-center space-x-2 mt-4 opacity-60">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-gray-500">Connected</span>
            </div>
          </div>
        )}

        {/* Edit Mode Data Editing */}
        {mode === 'edit' && (
          <div className="mt-12 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700 mb-3">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  LogoGrid - Edit integration names or click individual logos above
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-blue-700 font-medium mb-1">Integration Names (separated by |):</label>
                  <ModeWrapper
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="integration_names"
                    onEdit={(value) => handleContentUpdate('integration_names', value)}
                  >
                    <div className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto">
                      {blockContent.integration_names}
                    </div>
                  </ModeWrapper>
                </div>
                
                {(blockContent.category_labels || mode === 'edit') && (
                  <div>
                    <label className="block text-blue-700 font-medium mb-1">Category Labels (optional, separated by |):</label>
                    <ModeWrapper
                      mode={mode}
                      sectionId={sectionId}
                      elementKey="category_labels"
                      onEdit={(value) => handleContentUpdate('category_labels', value)}
                    >
                      <div className={`bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-24 overflow-y-auto ${!blockContent.category_labels ? 'opacity-50 italic' : ''}`}>
                        {blockContent.category_labels || 'Add category labels to group integrations...'}
                      </div>
                    </ModeWrapper>
                  </div>
                )}
                
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Logo placeholders are auto-generated with colors based on integration names. You can edit individual names by clicking directly on them above.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}