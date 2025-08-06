// Integration/CategoryAccordion.tsx - Integrations organized by category with accordion
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
interface CategoryAccordionContent {
  headline: string;
  subheadline?: string;
  category_1_title: string;
  category_1_integrations: string;
  category_2_title: string;
  category_2_integrations: string;
  category_3_title: string;
  category_3_integrations: string;
  category_4_title: string;
  category_4_integrations: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Connect With Your Favorite Tools' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Seamlessly integrate with 200+ popular tools and services to supercharge your workflow.' 
  },
  category_1_title: { 
    type: 'string' as const, 
    default: 'Communication & Collaboration' 
  },
  category_1_integrations: { 
    type: 'string' as const, 
    default: 'Slack|Microsoft Teams|Discord|Zoom|Google Meet|Notion|Asana|Trello' 
  },
  category_2_title: { 
    type: 'string' as const, 
    default: 'Marketing & Sales' 
  },
  category_2_integrations: { 
    type: 'string' as const, 
    default: 'HubSpot|Salesforce|Mailchimp|ConvertKit|Klaviyo|Stripe|PayPal|Shopify' 
  },
  category_3_title: { 
    type: 'string' as const, 
    default: 'Development & Analytics' 
  },
  category_3_integrations: { 
    type: 'string' as const, 
    default: 'GitHub|GitLab|Jira|Google Analytics|Mixpanel|Amplitude|Datadog|New Relic' 
  },
  category_4_title: { 
    type: 'string' as const, 
    default: 'Cloud & Storage' 
  },
  category_4_integrations: { 
    type: 'string' as const, 
    default: 'AWS|Google Cloud|Azure|Dropbox|Google Drive|OneDrive|Box|S3' 
  }
};

// Integration Badge Component
const IntegrationBadge = React.memo(({ name, colorTokens }: { name: string; colorTokens: any }) => (
  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 ${colorTokens.bgSecondary} ${colorTokens.textSecondary} hover:scale-105 transition-transform duration-200`}>
    <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
    {name}
  </div>
));
IntegrationBadge.displayName = 'IntegrationBadge';

// Accordion Item Component
const AccordionItem = React.memo(({ 
  title, 
  integrations, 
  isOpen, 
  onToggle, 
  colorTokens
}: { 
  title: string; 
  integrations: string[]; 
  isOpen: boolean; 
  onToggle: () => void;
  colorTokens: any;
}) => (
  <div className={`border rounded-xl border-gray-200 ${colorTokens.bgSecondary} overflow-hidden`}>
    <button
      onClick={onToggle}
      className={`w-full px-6 py-4 text-left flex items-center justify-between ${colorTokens.textPrimary} hover:${colorTokens.bgSecondary} transition-colors duration-200`}
    >
      <h3 className="font-semibold">{title}</h3>
      <svg 
        className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    {isOpen && (
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {integrations.map((integration, index) => (
            <IntegrationBadge 
              key={index} 
              name={integration.trim()} 
              colorTokens={colorTokens}
            />
          ))}
        </div>
      </div>
    )}
  </div>
));
AccordionItem.displayName = 'AccordionItem';

export default function CategoryAccordion(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<CategoryAccordionContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])); // First item open by default

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Parse integration lists
  const categories = [
    {
      title: blockContent.category_1_title,
      integrations: blockContent.category_1_integrations ? blockContent.category_1_integrations.split('|') : []
    },
    {
      title: blockContent.category_2_title,
      integrations: blockContent.category_2_integrations ? blockContent.category_2_integrations.split('|') : []
    },
    {
      title: blockContent.category_3_title,
      integrations: blockContent.category_3_integrations ? blockContent.category_3_integrations.split('|') : []
    },
    {
      title: blockContent.category_4_title,
      integrations: blockContent.category_4_integrations ? blockContent.category_4_integrations.split('|') : []
    }
  ];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CategoryAccordion"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
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

        {/* Accordion */}
        <div className="space-y-4">
          {categories.map((category, index) => (
            <AccordionItem
              key={index}
              title={category.title}
              integrations={category.integrations}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
              colorTokens={colorTokens}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <p className={`${dynamicTextColors?.muted || colorTokens.textMuted} text-sm`}>
            Can't find your tool? <span className={`${colorTokens.ctaBg} hover:underline cursor-pointer`}>Request an integration</span>
          </p>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'CategoryAccordion',
  category: 'Integration Sections',
  description: 'Displays integrations organized by category with expandable accordion interface',
  tags: ['integration', 'accordion', 'category', 'trust-building'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'category_1_title', label: 'Category 1 Title', type: 'text', required: true },
    { key: 'category_1_integrations', label: 'Category 1 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'category_2_title', label: 'Category 2 Title', type: 'text', required: true },
    { key: 'category_2_integrations', label: 'Category 2 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'category_3_title', label: 'Category 3 Title', type: 'text', required: true },
    { key: 'category_3_integrations', label: 'Category 3 Integrations (pipe separated)', type: 'text', required: true },
    { key: 'category_4_title', label: 'Category 4 Title', type: 'text', required: true },
    { key: 'category_4_integrations', label: 'Category 4 Integrations (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Expandable accordion interface for organized browsing',
    'Status indicators for each integration',
    'Automatic text color adaptation based on background',
    'Interactive hover effects and animations',
    'Mobile-responsive design'
  ],
  
  useCases: [
    'Showcase integration ecosystem by category',
    'Help users find specific tool integrations',
    'Demonstrate platform connectivity',
    'Build trust through comprehensive tool support'
  ]
};