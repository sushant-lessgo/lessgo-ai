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
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';

// Content interface for type safety
interface LogoGridContent {
  headline: string;
  subheadline?: string;
  integration_names: string;
  default_icon?: string;
  logo_urls: string; // JSON structure: {"IntegrationName": "logoUrl"}
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
  },
  default_icon: { 
    type: 'string' as const, 
    default: '🔗' 
  },
  logo_urls: { 
    type: 'string' as const, 
    default: '{}' // JSON object for logo URLs
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

// Parse logo URLs from JSON string
const parseLogoUrls = (logoUrlsJson: string): Record<string, string> => {
  try {
    return JSON.parse(logoUrlsJson || '{}');
  } catch {
    return {};
  }
};

// Update logo URLs JSON string
const updateLogoUrls = (logoUrlsJson: string, integrationName: string, logoUrl: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  if (logoUrl === '') {
    delete logoUrls[integrationName];
  } else {
    logoUrls[integrationName] = logoUrl;
  }
  return JSON.stringify(logoUrls);
};

// Get logo URL for an integration
const getIntegrationLogoUrl = (logoUrlsJson: string, integrationName: string): string => {
  const logoUrls = parseLogoUrls(logoUrlsJson);
  return logoUrls[integrationName] || '';
};

// Update integration names and clean up orphaned logos
const updateIntegrationNames = (oldNames: string, newNames: string, logoUrlsJson: string): { names: string; logoUrls: string } => {
  const oldIntegrations = parsePipeData(oldNames).map(name => name.trim());
  const newIntegrations = parsePipeData(newNames).map(name => name.trim());
  const logoUrls = parseLogoUrls(logoUrlsJson);
  
  // Remove logos for integrations that no longer exist
  const cleanedLogoUrls: Record<string, string> = {};
  newIntegrations.forEach(integration => {
    if (logoUrls[integration]) {
      cleanedLogoUrls[integration] = logoUrls[integration];
    }
  });
  
  return {
    names: newIntegrations.join('|'),
    logoUrls: JSON.stringify(cleanedLogoUrls)
  };
};


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
          {(blockContent.subheadline || mode !== 'preview') && (
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
          {integrationItems.map((item) => {
            // Every integration gets an editable logo using dynamic system
            const logoUrl = getIntegrationLogoUrl(blockContent.logo_urls, item.name);
            
            return (
              // All integrations are now editable with isolated hover
              <div key={item.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center">
                <div className="mb-3 flex justify-center">
                  <LogoEditableComponent
                    mode={mode}
                    logoUrl={logoUrl}
                    onLogoChange={(url) => {
                      const updatedLogoUrls = updateLogoUrls(blockContent.logo_urls, item.name, url);
                      handleContentUpdate('logo_urls', updatedLogoUrls);
                    }}
                    companyName={item.name}
                    size="md"
                  />
                </div>
                
                {/* Integration Name */}
                <div className="text-center">
                  {mode !== 'preview' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleNameEdit(item.index, e.currentTarget.textContent || '')}
                        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-900 flex-1 text-center"
                        style={getTextStyle('body-sm')}
                      >
                        {item.name}
                      </div>
                      {/* Delete Integration Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Delete ${item.name} completely?`)) {
                            const currentNames = parsePipeData(blockContent.integration_names);
                            const updatedNames = currentNames.filter((_, idx) => idx !== item.index);
                            const updatedNamesString = updatedNames.join('|');
                            const { logoUrls } = updateIntegrationNames(blockContent.integration_names, updatedNamesString, blockContent.logo_urls);
                            handleContentUpdate('integration_names', updatedNamesString);
                            handleContentUpdate('logo_urls', logoUrls);
                          }
                        }}
                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        title="Delete integration"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-900" style={getTextStyle('body-sm')}>
                      {item.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Add Integration Button (Edit Mode Only) */}
          {mode !== 'preview' && (
            <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const newIntegrationName = prompt('Enter integration name:');
                  if (newIntegrationName && newIntegrationName.trim()) {
                    const currentNames = parsePipeData(blockContent.integration_names);
                    if (!currentNames.includes(newIntegrationName.trim())) {
                      const updatedNames = [...currentNames, newIntegrationName.trim()].join('|');
                      handleContentUpdate('integration_names', updatedNames);
                    } else {
                      alert('Integration already exists!');
                    }
                  }
                }}
                className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Integration</span>
              </button>
            </div>
          )}
        </div>

        {/* Additional Integration Info */}
        {integrationItems.length > 0 && (
          <div className="mt-12 text-center">
            <p className={`${colorTokens.textSecondary} mb-4`} style={getTextStyle('body-sm')}>
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