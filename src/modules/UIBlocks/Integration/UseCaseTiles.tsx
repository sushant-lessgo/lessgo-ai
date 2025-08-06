// Integration/UseCaseTiles.tsx - Integration use cases in tile format
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
interface UseCaseTilesContent {
  headline: string;
  subheadline?: string;
  usecase_1_title: string;
  usecase_1_description: string;
  usecase_1_integrations: string;
  usecase_1_icon: string;
  usecase_2_title: string;
  usecase_2_description: string;
  usecase_2_integrations: string;
  usecase_2_icon: string;
  usecase_3_title: string;
  usecase_3_description: string;
  usecase_3_integrations: string;
  usecase_3_icon: string;
  usecase_4_title: string;
  usecase_4_description: string;
  usecase_4_integrations: string;
  usecase_4_icon: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Integration Use Cases That Drive Results' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'See how leading companies use our integrations to streamline workflows and boost productivity.' 
  },
  usecase_1_title: { 
    type: 'string' as const, 
    default: 'Sales & Marketing Automation' 
  },
  usecase_1_description: { 
    type: 'string' as const, 
    default: 'Sync leads from marketing tools to CRM, trigger email sequences, and track conversions across all touchpoints.' 
  },
  usecase_1_integrations: { 
    type: 'string' as const, 
    default: 'HubSpot|Salesforce|Mailchimp|Google Analytics' 
  },
  usecase_1_icon: { 
    type: 'string' as const, 
    default: '📊' 
  },
  usecase_2_title: { 
    type: 'string' as const, 
    default: 'Customer Support Workflow' 
  },
  usecase_2_description: { 
    type: 'string' as const, 
    default: 'Route support tickets, sync customer data, and provide agents with complete conversation history.' 
  },
  usecase_2_integrations: { 
    type: 'string' as const, 
    default: 'Zendesk|Intercom|Slack|Jira' 
  },
  usecase_2_icon: { 
    type: 'string' as const, 
    default: '🎧' 
  },
  usecase_3_title: { 
    type: 'string' as const, 
    default: 'Development & DevOps' 
  },
  usecase_3_description: { 
    type: 'string' as const, 
    default: 'Automate deployments, sync code changes, and monitor application performance across environments.' 
  },
  usecase_3_integrations: { 
    type: 'string' as const, 
    default: 'GitHub|AWS|Docker|DataDog' 
  },
  usecase_3_icon: { 
    type: 'string' as const, 
    default: '⚙️' 
  },
  usecase_4_title: { 
    type: 'string' as const, 
    default: 'Data Analytics & Reporting' 
  },
  usecase_4_description: { 
    type: 'string' as const, 
    default: 'Aggregate data from multiple sources, generate automated reports, and sync insights to business tools.' 
  },
  usecase_4_integrations: { 
    type: 'string' as const, 
    default: 'Google Analytics|Mixpanel|Tableau|Slack' 
  },
  usecase_4_icon: { 
    type: 'string' as const, 
    default: '📈' 
  }
};

// Integration Badge Component
const IntegrationBadge = React.memo(({ name, colorTokens }: { name: string; colorTokens: any }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colorTokens.bgSecondary} ${colorTokens.textMuted} border border-gray-200`}>
    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></div>
    {name}
  </span>
));
IntegrationBadge.displayName = 'IntegrationBadge';

// Use Case Tile Component
const UseCaseTile = React.memo(({ 
  useCase, 
  isHovered, 
  onHover, 
  onLeave, 
  colorTokens
}: { 
  useCase: any; 
  isHovered: boolean; 
  onHover: () => void;
  onLeave: () => void;
  colorTokens: any;
}) => (
  <div 
    className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer group ${
      isHovered 
        ? `${colorTokens.bgSecondary} border-gray-200 shadow-lg scale-105` 
        : `${colorTokens.bgPrimary} ${colorTokens.borderSecondary} hover:${colorTokens.bgSecondary} hover:shadow-md`
    }`}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    {/* Icon */}
    <div className="text-4xl mb-4 transform transition-transform duration-300 group-hover:scale-110">
      {useCase.icon}
    </div>

    {/* Title */}
    <h3 className={`font-semibold mb-3 ${colorTokens.textPrimary}`}>
      {useCase.title}
    </h3>

    {/* Description */}
    <p className={`text-sm leading-relaxed mb-4 ${colorTokens.textSecondary}`}>
      {useCase.description}
    </p>

    {/* Integration Badges */}
    <div className="flex flex-wrap gap-1.5">
      {useCase.integrations.map((integration: string, index: number) => (
        <IntegrationBadge 
          key={index} 
          name={integration.trim()} 
          colorTokens={colorTokens}
        />
      ))}
    </div>

    {/* Hover Arrow */}
    {isHovered && (
      <div className={`absolute top-6 right-6 w-8 h-8 rounded-full ${colorTokens.ctaBg} flex items-center justify-center transition-all duration-300`}>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    )}
  </div>
));
UseCaseTile.displayName = 'UseCaseTile';

export default function UseCaseTiles(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<UseCaseTilesContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse use cases
  const useCases = [
    {
      title: blockContent.usecase_1_title,
      description: blockContent.usecase_1_description,
      integrations: blockContent.usecase_1_integrations ? blockContent.usecase_1_integrations.split('|') : [],
      icon: blockContent.usecase_1_icon
    },
    {
      title: blockContent.usecase_2_title,
      description: blockContent.usecase_2_description,
      integrations: blockContent.usecase_2_integrations ? blockContent.usecase_2_integrations.split('|') : [],
      icon: blockContent.usecase_2_icon
    },
    {
      title: blockContent.usecase_3_title,
      description: blockContent.usecase_3_description,
      integrations: blockContent.usecase_3_integrations ? blockContent.usecase_3_integrations.split('|') : [],
      icon: blockContent.usecase_3_icon
    },
    {
      title: blockContent.usecase_4_title,
      description: blockContent.usecase_4_description,
      integrations: blockContent.usecase_4_integrations ? blockContent.usecase_4_integrations.split('|') : [],
      icon: blockContent.usecase_4_icon
    }
  ];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="UseCaseTiles"
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
              placeholder="Add a description of your integration use cases..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Use Case Tiles Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <UseCaseTile
              key={index}
              useCase={useCase}
              isHovered={hoveredIndex === index}
              onHover={() => setHoveredIndex(index)}
              onLeave={() => setHoveredIndex(null)}
              colorTokens={colorTokens}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg ${colorTokens.bgSecondary} border-gray-200 border`}>
            <span className={`${colorTokens.textSecondary} text-sm`}>
              Ready to build your integration?
            </span>
            <button className={`${colorTokens.ctaBg} ${colorTokens.ctaText} px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}>
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'UseCaseTiles',
  category: 'Integration Sections',
  description: 'Integration use cases displayed in interactive tile format with technology badges',
  tags: ['integration', 'use-cases', 'tiles', 'interactive', 'workflows'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'usecase_1_title', label: 'Use Case 1 Title', type: 'text', required: true },
    { key: 'usecase_1_description', label: 'Use Case 1 Description', type: 'textarea', required: true },
    { key: 'usecase_1_integrations', label: 'Use Case 1 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'usecase_1_icon', label: 'Use Case 1 Icon (emoji)', type: 'text', required: true },
    { key: 'usecase_2_title', label: 'Use Case 2 Title', type: 'text', required: true },
    { key: 'usecase_2_description', label: 'Use Case 2 Description', type: 'textarea', required: true },
    { key: 'usecase_2_integrations', label: 'Use Case 2 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'usecase_2_icon', label: 'Use Case 2 Icon (emoji)', type: 'text', required: true },
    { key: 'usecase_3_title', label: 'Use Case 3 Title', type: 'text', required: true },
    { key: 'usecase_3_description', label: 'Use Case 3 Description', type: 'textarea', required: true },
    { key: 'usecase_3_integrations', label: 'Use Case 3 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'usecase_3_icon', label: 'Use Case 3 Icon (emoji)', type: 'text', required: true },
    { key: 'usecase_4_title', label: 'Use Case 4 Title', type: 'text', required: true },
    { key: 'usecase_4_description', label: 'Use Case 4 Description', type: 'textarea', required: true },
    { key: 'usecase_4_integrations', label: 'Use Case 4 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'usecase_4_icon', label: 'Use Case 4 Icon (emoji)', type: 'text', required: true }
  ],
  
  features: [
    'Interactive tile interface with hover effects',
    'Technology badge visualization',
    'Use case focused content structure',
    'Automatic text color adaptation',
    'Responsive grid layout'
  ],
  
  useCases: [
    'Showcase practical integration scenarios',
    'Help users understand workflow possibilities',
    'Demonstrate value through real use cases',
    'Guide integration planning and strategy'
  ]
};