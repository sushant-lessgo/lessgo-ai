// Integration/TabbyIntegrationCards.tsx - Tabbed interface with integration cards
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface TabbyIntegrationCardsContent {
  headline: string;
  subheadline?: string;
  tab_1_title: string;
  tab_1_integrations: string;
  tab_1_icon?: string;
  tab_2_title: string;
  tab_2_integrations: string;
  tab_2_icon?: string;
  tab_3_title: string;
  tab_3_integrations: string;
  tab_3_icon?: string;
  tab_4_title: string;
  tab_4_integrations: string;
  tab_4_icon?: string;
  // Logo URLs for popular integrations
  slack_logo?: string;
  hubspot_logo?: string;
  github_logo?: string;
  google_meet_logo?: string;
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
  },
  tab_1_icon: { 
    type: 'string' as const, 
    default: '💬' 
  },
  tab_2_icon: { 
    type: 'string' as const, 
    default: '📊' 
  },
  tab_3_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  tab_4_icon: { 
    type: 'string' as const, 
    default: '📈' 
  },
  // Logo URLs for popular integrations
  slack_logo: { 
    type: 'string' as const, 
    default: '' 
  },
  hubspot_logo: { 
    type: 'string' as const, 
    default: '' 
  },
  github_logo: { 
    type: 'string' as const, 
    default: '' 
  },
  google_meet_logo: { 
    type: 'string' as const, 
    default: '' 
  }
};

// Integration Card Component
const IntegrationCard = React.memo(({ 
  name, 
  colorTokens, 
  isHovered, 
  onHover, 
  onLeave,
  h4Style,
  bodySmStyle,
  labelStyle,
  tabIcon,
  mode,
  onTabIconEdit,
  sectionId,
  tabIndex,
  blockContent,
  handleContentUpdate
}: { 
  name: string; 
  colorTokens: any;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  h4Style: React.CSSProperties;
  bodySmStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  tabIcon: string;
  mode: 'edit' | 'preview';
  onTabIconEdit: (value: string) => void;
  sectionId: string;
  tabIndex: number;
  blockContent: TabbyIntegrationCardsContent;
  handleContentUpdate: (key: keyof TabbyIntegrationCardsContent, value: any) => void;
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
          ? `${colorTokens.bgSecondary} border-gray-200 shadow-lg scale-105` 
          : `${colorTokens.bgPrimary} ${colorTokens.borderSecondary} hover:${colorTokens.bgSecondary}`
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Logo Placeholder */}
      <div className="mb-3">
        {(() => {
          // Check if this integration has editable logo support
          const logoKey = `${name.toLowerCase().replace(/\s+/g, '_')}_logo` as keyof TabbyIntegrationCardsContent;
          const hasEditableLogo = ['slack', 'hubspot', 'github', 'google_meet'].includes(name.toLowerCase().replace(/\s+/g, '_'));
          
          if (hasEditableLogo && logoKey in blockContent) {
            // Use LogoEditableComponent for supported integrations
            return (
              <LogoEditableComponent
                mode={mode}
                logoUrl={blockContent[logoKey] as string}
                onLogoChange={(url) => handleContentUpdate(logoKey, url)}
                companyName={name}
                size="md"
              />
            );
          }
          
          // Use existing IconEditableText for other integrations
          return (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <IconEditableText
                mode={mode}
                value={tabIcon}
                onEdit={onTabIconEdit}
                backgroundType="primary"
                colorTokens={colorTokens}
                iconSize="md"
                className="text-xl text-white"
                placeholder="🔗"
                sectionId={sectionId}
                elementKey={`tab_${tabIndex + 1}_icon`}
              />
            </div>
          );
        })()}
      </div>

      {/* Integration Name */}
      <h4 className={`mb-2 ${colorTokens.textPrimary}`} style={h4Style}>
        {name}
      </h4>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-2 py-1 rounded-md border mb-2 ${statusColors[status as keyof typeof statusColors]}`} style={bodySmStyle}>
        <div className="w-1.5 h-1.5 rounded-full bg-current mr-1"></div>
        {status}
      </div>

      {/* Setup Time */}
      <p className={`${colorTokens.textMuted}`} style={bodySmStyle}>
        Setup time: {setupTime}
      </p>

      {/* Connect Button (appears on hover) */}
      {isHovered && (
        <button className={`mt-3 w-full py-2 px-3 rounded-lg transition-all duration-200 ${colorTokens.ctaBg} ${colorTokens.ctaBgText} hover:opacity-90`} style={labelStyle}>
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
  colorTokens
}: { 
  title: string; 
  isActive: boolean; 
  onClick: () => void;
  colorTokens: any;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
      isActive 
        ? `${colorTokens.ctaBg} ${colorTokens.ctaBgText} shadow-md` 
        : `${colorTokens.bgSecondary} ${colorTokens.textSecondary} border-gray-200 border hover:${colorTokens.bgSecondary}`
    }`}
  >
    {title}
  </button>
));
TabButton.displayName = 'TabButton';

export default function TabbyIntegrationCards(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  
  // Create typography styles
  const h4Style = getTypographyStyle('h4');
  const bodySmStyle = getTypographyStyle('body-sm');
  const labelStyle = getTypographyStyle('label');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Icon edit handler
  const handleTabIconEdit = (tabIndex: number, value: string) => {
    const iconField = `tab_${tabIndex + 1}_icon` as keyof TabbyIntegrationCardsContent;
    handleContentUpdate(iconField, value);
  };

  // Parse integration tabs
  const tabs = [
    {
      title: blockContent.tab_1_title,
      integrations: blockContent.tab_1_integrations ? blockContent.tab_1_integrations.split('|') : [],
      icon: blockContent.tab_1_icon || '💬'
    },
    {
      title: blockContent.tab_2_title,
      integrations: blockContent.tab_2_integrations ? blockContent.tab_2_integrations.split('|') : [],
      icon: blockContent.tab_2_icon || '📊'
    },
    {
      title: blockContent.tab_3_title,
      integrations: blockContent.tab_3_integrations ? blockContent.tab_3_integrations.split('|') : [],
      icon: blockContent.tab_3_icon || '⚡'
    },
    {
      title: blockContent.tab_4_title,
      integrations: blockContent.tab_4_integrations ? blockContent.tab_4_integrations.split('|') : [],
      icon: blockContent.tab_4_icon || '📈'
    }
  ];

  const currentTab = tabs[activeTab];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TabbyIntegrationCards"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
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
              h4Style={h4Style}
              bodySmStyle={bodySmStyle}
              labelStyle={labelStyle}
              tabIcon={currentTab.icon}
              mode={mode}
              onTabIconEdit={(value) => handleTabIconEdit(activeTab, value)}
              sectionId={sectionId}
              tabIndex={activeTab}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
            />
          ))}
        </div>

        {/* Tab Summary */}
        <div className={`text-center p-6 rounded-xl ${colorTokens.bgSecondary} border-gray-200 border`}>
          <h3 className={`font-semibold mb-2 ${colorTokens.textPrimary} ${getTextStyle('body-lg')}`}>
            {currentTab.title} Tools ({currentTab.integrations.length} available)
          </h3>
          <p className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
            Streamline your {currentTab.title.toLowerCase()} workflow with our pre-built integrations
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button className={`px-6 py-3 rounded-lg font-medium ${colorTokens.ctaBg} ${colorTokens.ctaText} hover:opacity-90 transition-opacity`}>
            View All Integrations
          </button>
          <button className={`px-6 py-3 rounded-lg font-medium border border-gray-200 ${colorTokens.textSecondary} hover:${colorTokens.bgSecondary} transition-colors`}>
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