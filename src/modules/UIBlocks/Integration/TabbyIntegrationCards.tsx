// Integration/TabbyIntegrationCards.tsx - Tabbed interface with integration cards
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface TabbyIntegrationCardsContent {
  headline: string;
  subheadline?: string;
  tab_1_title: string;
  tab_1_integrations: string;
  tab_2_title: string;
  tab_2_integrations: string;
  tab_3_title: string;
  tab_3_integrations: string;
  tab_4_title: string;
  tab_4_integrations: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Seamless Integration Ecosystem' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Connect your tools and data sources with our comprehensive integration library.' 
  },
  tab_1_title: { 
    type: 'string' as const, 
    default: 'Communication' 
  },
  tab_1_integrations: { 
    type: 'string' as const, 
    default: 'Slack|Microsoft Teams|Discord|Zoom|Google Meet|Notion|Linear|Asana' 
  },
  tab_2_title: { 
    type: 'string' as const, 
    default: 'CRM & Sales' 
  },
  tab_2_integrations: { 
    type: 'string' as const, 
    default: 'HubSpot|Salesforce|Pipedrive|Copper|Airtable|Monday.com|ClickUp|Zendesk' 
  },
  tab_3_title: { 
    type: 'string' as const, 
    default: 'Development' 
  },
  tab_3_integrations: { 
    type: 'string' as const, 
    default: 'GitHub|GitLab|Jira|Linear|Figma|Vercel|AWS|Google Cloud' 
  },
  tab_4_title: { 
    type: 'string' as const, 
    default: 'Analytics' 
  },
  tab_4_integrations: { 
    type: 'string' as const, 
    default: 'Google Analytics|Mixpanel|Amplitude|Segment|Hotjar|Datadog|New Relic|Sentry' 
  }
};

// Integration Card Component
const IntegrationCard = React.memo(({ 
  name, 
  colorTokens, 
  isHovered, 
  onHover, 
  onLeave 
}: { 
  name: string; 
  colorTokens: any;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) => {
  // Generate random status and setup time for demo
  const statuses = ['Connected', 'Available', 'Popular'];
  const setupTimes = ['2 min', '5 min', '10 min', 'Instant'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const setupTime = setupTimes[Math.floor(Math.random() * setupTimes.length)];
  
  const statusColors = {
    'Connected': 'bg-green-100 text-green-800 border-green-200',
    'Available': 'bg-blue-100 text-blue-800 border-blue-200',
    'Popular': 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <div 
      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
        isHovered 
          ? `${colorTokens.bgSecondary} ${colorTokens.borderPrimary} shadow-lg scale-105` 
          : `${colorTokens.bgPrimary} ${colorTokens.borderSecondary} hover:${colorTokens.bgSecondary}`
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Logo Placeholder */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
        <span className="text-white font-bold text-lg">
          {name.substring(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Integration Name */}
      <h4 className={`font-semibold mb-2 ${colorTokens.textHeading}`}>
        {name}
      </h4>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border mb-2 ${statusColors[status as keyof typeof statusColors]}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current mr-1"></div>
        {status}
      </div>

      {/* Setup Time */}
      <p className={`text-xs ${colorTokens.textMuted}`}>
        Setup time: {setupTime}
      </p>

      {/* Connect Button (appears on hover) */}
      {isHovered && (
        <button className={`mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${colorTokens.accent} ${colorTokens.accentText} hover:opacity-90`}>
          Connect
        </button>
      )}
    </div>
  );
});
IntegrationCard.displayName = 'IntegrationCard';

// Tab Button Component
const TabButton = React.memo(({ 
  title, 
  isActive, 
  onClick, 
  colorTokens, 
  textStyle 
}: { 
  title: string; 
  isActive: boolean; 
  onClick: () => void;
  colorTokens: any;
  textStyle: string;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${textStyle} ${
      isActive 
        ? `${colorTokens.accent} ${colorTokens.accentText} shadow-md` 
        : `${colorTokens.bgSecondary} ${colorTokens.textBody} ${colorTokens.borderPrimary} border hover:${colorTokens.bgTertiary}`
    }`}
  >
    {title}
  </button>
));
TabButton.displayName = 'TabButton';

export default function TabbyIntegrationCards(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<TabbyIntegrationCardsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [activeTab, setActiveTab] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Parse integration tabs
  const tabs = [
    {
      title: blockContent.tab_1_title,
      integrations: blockContent.tab_1_integrations ? blockContent.tab_1_integrations.split('|') : []
    },
    {
      title: blockContent.tab_2_title,
      integrations: blockContent.tab_2_integrations ? blockContent.tab_2_integrations.split('|') : []
    },
    {
      title: blockContent.tab_3_title,
      integrations: blockContent.tab_3_integrations ? blockContent.tab_3_integrations.split('|') : []
    },
    {
      title: blockContent.tab_4_title,
      integrations: blockContent.tab_4_integrations ? blockContent.tab_4_integrations.split('|') : []
    }
  ];

  const currentTab = tabs[activeTab];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TabbyIntegrationCards"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg leading-relaxed max-w-3xl mx-auto"
              placeholder="Add a description of your integration ecosystem..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab, index) => (
            <TabButton
              key={index}
              title={tab.title}
              isActive={activeTab === index}
              onClick={() => setActiveTab(index)}
              colorTokens={colorTokens}
              textStyle={getTextStyle('body')}
            />
          ))}
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {currentTab.integrations.map((integration, index) => (
            <IntegrationCard
              key={`${activeTab}-${index}`}
              name={integration.trim()}
              colorTokens={colorTokens}
              isHovered={hoveredCard === integration.trim()}
              onHover={() => setHoveredCard(integration.trim())}
              onLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>

        {/* Tab Summary */}
        <div className={`text-center p-6 rounded-xl ${colorTokens.bgSecondary} ${colorTokens.borderPrimary} border`}>
          <h3 className={`font-semibold mb-2 ${colorTokens.textHeading} ${getTextStyle('body-lg')}`}>
            {currentTab.title} Tools ({currentTab.integrations.length} available)
          </h3>
          <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
            Streamline your {currentTab.title.toLowerCase()} workflow with our pre-built integrations
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button className={`px-6 py-3 rounded-lg font-medium ${colorTokens.accent} ${colorTokens.accentText} hover:opacity-90 transition-opacity`}>
            View All Integrations
          </button>
          <button className={`px-6 py-3 rounded-lg font-medium border ${colorTokens.borderPrimary} ${colorTokens.textBody} hover:${colorTokens.bgSecondary} transition-colors`}>
            Request Custom Integration
          </button>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'TabbyIntegrationCards',
  category: 'Integration Sections',
  description: 'Tabbed interface displaying integration cards organized by category with hover interactions',
  tags: ['integration', 'tabs', 'cards', 'organized', 'interactive'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tab_1_title', label: 'Tab 1 Title', type: 'text', required: true },
    { key: 'tab_1_integrations', label: 'Tab 1 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'tab_2_title', label: 'Tab 2 Title', type: 'text', required: true },
    { key: 'tab_2_integrations', label: 'Tab 2 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'tab_3_title', label: 'Tab 3 Title', type: 'text', required: true },
    { key: 'tab_3_integrations', label: 'Tab 3 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'tab_4_title', label: 'Tab 4 Title', type: 'text', required: true },
    { key: 'tab_4_integrations', label: 'Tab 4 Integrations (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Tabbed interface for organized browsing',
    'Interactive integration cards with hover effects',
    'Status indicators and setup time estimates',
    'Connect buttons with call-to-action',
    'Category summaries and counts'
  ],
  
  useCases: [
    'Organize integrations by functional category',
    'Provide detailed integration information',
    'Enable quick integration discovery',
    'Support technical implementation planning'
  ]
};