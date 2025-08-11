// components/layout/LogoGrid.tsx
// Production-ready integration logo grid using abstraction system

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface LogoGridContent {
  headline: string;
  subheadline?: string;
  integration_names: string;
}

// Integration item structure
interface IntegrationItem {
  id: string;
  index: number;
  name: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Integrates with Your Favorite Tools' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Connect seamlessly with the tools your team already uses and loves.' 
  },
  integration_names: { 
    type: 'string' as const, 
    default: 'Slack|Microsoft Teams|Google Workspace|Salesforce|HubSpot|Zoom|Asana|Trello|Notion|Airtable|Dropbox|GitHub' 
  }
};

// Parse integration data from pipe-separated strings
const parseIntegrationData = (names: string): IntegrationItem[] => {
  const nameList = parsePipeData(names);
  
  return nameList.map((name, index) => ({
    id: `integration-${index}`,
    index,
    name: name.trim()
  }));
};

// Logo Placeholder Component
const LogoPlaceholder = React.memo(({ name }: { name: string }) => {
  // Generate a simple logo placeholder
  const getLogoPlaceholder = (integrationName: string) => {
    const firstLetter = integrationName.charAt(0).toUpperCase();
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600'
    ];
    
    // Simple hash for consistent color
    const hash = integrationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { letter: firstLetter, colorClass };
  };

  const { letter, colorClass } = getLogoPlaceholder(name);
  
  return (
    <div className="group p-6 bg-white rounded-lg border border-border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center">
      {/* Logo Circle */}
      <div className="mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
          {letter}
        </div>
      </div>
      
      {/* Integration Name */}
      <h3 className="text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
        {name}
      </h3>
    </div>
  );
});
LogoPlaceholder.displayName = 'LogoPlaceholder';

// Editable Logo Item for Edit Mode
const EditableLogoItem = React.memo(({ 
  item, 
  mode, 
  getTextStyle,
  onNameEdit
}: {
  item: IntegrationItem;
  mode: 'edit' | 'preview';
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onNameEdit: (index: number, value: string) => void;
}) => {
  
  if (mode === 'edit') {
    const { letter, colorClass } = (() => {
      const firstLetter = item.name.charAt(0).toUpperCase();
      const colors = [
        'from-blue-500 to-blue-600',
        'from-green-500 to-green-600', 
        'from-purple-500 to-purple-600',
        'from-red-500 to-red-600',
        'from-yellow-500 to-yellow-600',
        'from-indigo-500 to-indigo-600'
      ];
      
      const hash = item.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorClass = colors[hash % colors.length];
      
      return { letter: firstLetter, colorClass };
    })();
    
    return (
      <div className="group p-6 bg-white rounded-lg border border-border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center">
        <div className="mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
            {letter}
          </div>
        </div>
        
        <div 
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onNameEdit(item.index, e.currentTarget.textContent || '')}
          className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-900"
          style={getTextStyle('body-sm')}
        >
          {item.name}
        </div>
      </div>
    );
  }
  
  return <LogoPlaceholder name={item.name} />;
});
EditableLogoItem.displayName = 'EditableLogoItem';

export default function LogoGrid(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<LogoGridContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse integration data
  const integrationItems = parseIntegrationData(blockContent.integration_names);
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const bodySmStyle = getTypographyStyle('body-sm');
  const labelStyle = getTypographyStyle('label');

  // Handle individual name editing
  const handleNameEdit = (index: number, value: string) => {
    const updatedNames = updateListData(blockContent.integration_names, index, value);
    handleContentUpdate('integration_names', updatedNames);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LogoGrid"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
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
            textStyle={{ ...getTextStyle('h1'), textAlign: 'center' }}
            className="mb-4"
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
              textStyle={{ ...getTextStyle('body-lg'), textAlign: 'center' }}
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline..."
            />
          )}
        </div>

        {/* Integration Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {integrationItems.map((item) => (
            <EditableLogoItem
              key={item.id}
              item={item}
              mode={mode}
              getTextStyle={getTextStyle}
              onNameEdit={handleNameEdit}
            />
          ))}
        </div>

        {/* Additional Integration Info */}
        {integrationItems.length > 0 && (
          <div className="mt-12 text-center">
            <p className={`${colorTokens.textSecondary} mb-4`} style={bodySmStyle}>
              and {integrationItems.length}+ more integrations available
            </p>
            
            {/* Connection Indicators */}
            <div className="flex justify-center items-center space-x-2 opacity-60">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">Connected</span>
            </div>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'LogoGrid',
  category: 'Integration Sections',
  description: 'Integration logo grid showing connected tools and services with adaptive text colors',
  tags: ['integrations', 'logos', 'tools', 'partnerships', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  // Key features
  features: [
    'Automatic text color adaptation based on background type',
    'Integration logo placeholders',
    'Responsive grid layout',
    'Hover effects and animations',
    'Connection status indicators'
  ],
  
  // Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'integration_names', label: 'Integration Names (pipe separated)', type: 'textarea', required: true }
  ],
  
  // Usage examples
  useCases: [
    'Integration showcase',
    'Tool compatibility section',
    'Partnership logos',
    'Platform connections'
  ]
};