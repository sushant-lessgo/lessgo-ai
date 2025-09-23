// Integration/CategoryAccordion.tsx - Integrations organized by category with accordion
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState, useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import {
  LayoutComponentProps,
  extractLayoutContent,
  StoreElementTypes
} from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';

interface CategoryAccordionProps extends LayoutComponentProps {}

// Category item structure
interface CategoryItem {
  title: string;
  integrations: string;
  icon: string;
  id: string;
}

// Content interface for CategoryAccordion layout
interface CategoryAccordionContent {
  headline: string;
  subheadline?: string;
  category_titles: string;
  category_integrations: string;
  category_icons?: string;
}

// Content schema for CategoryAccordion layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Connect With Your Favorite Tools' },
  subheadline: { type: 'string' as const, default: 'Seamlessly integrate with 200+ popular tools and services to supercharge your workflow.' },
  category_titles: { type: 'string' as const, default: 'Communication & Collaboration|Marketing & Sales|Development & Analytics|Cloud & Storage' },
  category_integrations: { type: 'string' as const, default: 'Slack|Microsoft Teams|Discord|Zoom|Google Meet|Notion|Asana|Trello!HubSpot|Salesforce|Mailchimp|ConvertKit|Klaviyo|Stripe|PayPal|Shopify!GitHub|GitLab|Jira|Google Analytics|Mixpanel|Amplitude|Datadog|New Relic!AWS|Google Cloud|Azure|Dropbox|Google Drive|OneDrive|Box|S3' },
  category_icons: { type: 'string' as const, default: '💬|📊|⚡|☁️' }
};

// Integration Badge Component
const IntegrationBadge = React.memo(({ name, colorTokens, labelStyle }: { name: string; colorTokens: any; labelStyle: React.CSSProperties }) => (
  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 ${colorTokens.bgSecondary} ${colorTokens.textSecondary} hover:scale-105 transition-transform duration-200`} style={labelStyle}>
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
  colorTokens,
  h3Style,
  labelStyle,
  categoryIcon,
  mode,
  onIconEdit,
  sectionId,
  categoryIndex
}: { 
  title: string; 
  integrations: string[]; 
  isOpen: boolean; 
  onToggle: () => void;
  colorTokens: any;
  h3Style: React.CSSProperties;
  labelStyle: React.CSSProperties;
  categoryIcon: string;
  mode: 'edit' | 'preview';
  onIconEdit: (value: string) => void;
  sectionId: string;
  categoryIndex: number;
}) => (
  <div className={`border rounded-xl border-gray-200 ${colorTokens.bgSecondary} overflow-hidden`}>
    <button
      onClick={onToggle}
      className={`w-full px-6 py-4 text-left flex items-center justify-between ${colorTokens.textPrimary} hover:${colorTokens.bgSecondary} transition-colors duration-200`}
    >
      <div className="flex items-center">
        <div className="mr-3">
          <IconEditableText
            mode={mode}
            value={categoryIcon}
            onEdit={onIconEdit}
            backgroundType="primary"
            colorTokens={colorTokens}
            iconSize="md"
            className="text-2xl"
            placeholder="📁"
            sectionId={sectionId}
            elementKey={`category_${categoryIndex + 1}_icon`}
          />
        </div>
        <h3 style={h3Style}>{title}</h3>
      </div>
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
              labelStyle={labelStyle}
            />
          ))}
        </div>
      </div>
    )}
  </div>
));
AccordionItem.displayName = 'AccordionItem';

// Parse category data with dynamic icon integration
const parseCategoryData = (titles: string, integrations: string, icons?: string): CategoryItem[] => {
  const titleList = titles.split('|');
  const integrationsList = integrations.split('!'); // Using ! as separator between categories
  const iconList = icons ? icons.split('|') : [];

  return titleList.map((title, index) => ({
    id: `category-${index}`,
    title: title.trim(),
    integrations: integrationsList[index] || '',
    icon: iconList[index] || getRandomIconFromCategory('integration') || '📁'
  }));
};

export default function CategoryAccordion(props: CategoryAccordionProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  const { blockContent: storeContent, setBlockContent, getBusinessContext } = useEditStore();
  const { getOnboardingFieldValue } = useOnboardingStore();

  // Extract content using the extractLayoutContent helper
  const blockContent = extractLayoutContent<CategoryAccordionContent>(
    storeContent,
    props.sectionId,
    CONTENT_SCHEMA
  );

  const {
    sectionId,
    mode,
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

  // Create typography styles
  const h3Style = getTypographyStyle('h3');
  const labelStyle = getTypographyStyle('label');
  const bodySmStyle = getTypographyStyle('body-sm');
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Auto-populate icons for categories if they're missing
  useEffect(() => {
    const categoryData = parseCategoryData(
      blockContent.category_titles,
      blockContent.category_integrations,
      blockContent.category_icons
    );

    const businessContext = getBusinessContext();

    // Auto-generate icons if missing or insufficient
    if (!blockContent.category_icons || blockContent.category_icons.split('|').length < categoryData.length) {
      const generatedIcons = categoryData.map((category, index) => {
        const existingIcon = blockContent.category_icons?.split('|')[index];
        if (existingIcon) return existingIcon;

        // Generate appropriate icon based on category title
        return getIconFromCategory(category.title, businessContext?.category) || getRandomIconFromCategory('integration');
      });

      handleContentUpdate('category_icons', generatedIcons.join('|'));
    }
  }, [blockContent.category_titles, blockContent.category_integrations, blockContent.category_icons, getBusinessContext, handleContentUpdate]);

  // Parse category data
  const categories = parseCategoryData(
    blockContent.category_titles,
    blockContent.category_integrations,
    blockContent.category_icons
  );

  // Icon edit handler
  const handleCategoryIconEdit = (categoryIndex: number, value: string) => {
    const currentIcons = blockContent.category_icons?.split('|') || [];
    currentIcons[categoryIndex] = value;
    handleContentUpdate('category_icons', currentIcons.join('|'));
  };

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Add new category
  const handleAddCategory = () => {
    const newCategoryTitle = prompt('Enter category title:');
    if (newCategoryTitle && newCategoryTitle.trim()) {
      const currentTitles = blockContent.category_titles.split('|');
      const currentIntegrations = blockContent.category_integrations.split('!');
      const currentIcons = blockContent.category_icons?.split('|') || [];

      const updatedTitles = [...currentTitles, newCategoryTitle.trim()].join('|');
      const updatedIntegrations = [...currentIntegrations, 'New Integration|Another Tool'].join('!');
      const newIcon = getRandomIconFromCategory('integration') || '📁';
      const updatedIcons = [...currentIcons, newIcon].join('|');

      handleContentUpdate('category_titles', updatedTitles);
      handleContentUpdate('category_integrations', updatedIntegrations);
      handleContentUpdate('category_icons', updatedIcons);
    }
  };

  // Remove category
  const handleRemoveCategory = (categoryIndex: number) => {
    if (categories.length <= 1) {
      alert('Cannot remove the last category');
      return;
    }

    if (confirm(`Remove "${categories[categoryIndex].title}" category?`)) {
      const currentTitles = blockContent.category_titles.split('|');
      const currentIntegrations = blockContent.category_integrations.split('!');
      const currentIcons = blockContent.category_icons?.split('|') || [];

      currentTitles.splice(categoryIndex, 1);
      currentIntegrations.splice(categoryIndex, 1);
      currentIcons.splice(categoryIndex, 1);

      handleContentUpdate('category_titles', currentTitles.join('|'));
      handleContentUpdate('category_integrations', currentIntegrations.join('!'));
      handleContentUpdate('category_icons', currentIcons.join('|'));

      // Close removed item if it was open
      const newOpenItems = new Set(openItems);
      newOpenItems.delete(categoryIndex);
      setOpenItems(newOpenItems);
    }
  };

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
              className="leading-relaxed max-w-3xl mx-auto"
              style={bodyLgStyle}
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
            <div key={category.id} className="relative">
              <AccordionItem
                title={category.title}
                integrations={category.integrations.split('|')}
                isOpen={openItems.has(index)}
                onToggle={() => toggleItem(index)}
                colorTokens={colorTokens}
                h3Style={h3Style}
                labelStyle={labelStyle}
                categoryIcon={category.icon}
                mode={mode}
                onIconEdit={(value) => handleCategoryIconEdit(index, value)}
                sectionId={sectionId}
                categoryIndex={index}
              />
              {mode !== 'preview' && (
                <button
                  onClick={() => handleRemoveCategory(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-10"
                  title="Remove category"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Add Category Button (Edit Mode Only) */}
          {mode !== 'preview' && (
            <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 flex flex-col items-center justify-center min-h-[80px]">
              <button
                onClick={handleAddCategory}
                className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Add Category</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <p className={`${dynamicTextColors?.muted || colorTokens.textMuted}`} style={bodySmStyle}>
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