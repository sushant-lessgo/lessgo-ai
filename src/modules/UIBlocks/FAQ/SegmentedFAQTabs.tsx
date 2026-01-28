// SegmentedFAQTabs.tsx
// V2 Schema - Clean nested array format, no numbered fields or pipe strings

import React, { useState, useMemo } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

// FAQ item structure (V2 - clean array format)
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Tab structure with nested items
interface Tab {
  id: string;
  label: string;
  items: FAQItem[];
}

// Content interface (V2 - nested arrays, not numbered fields)
interface SegmentedFAQTabsContent {
  headline: string;
  subheadline?: string;
  contact_prompt?: string;
  cta_text?: string;
  supporting_text?: string;
  tabs: Tab[];
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Everything You Need to Know'
  },
  subheadline: {
    type: 'string' as const,
    default: 'Find answers organized by topic for easy navigation'
  },
  contact_prompt: { type: 'string' as const, default: '' },
  cta_text: { type: 'string' as const, default: '' },
  supporting_text: { type: 'string' as const, default: '' },
  tabs: {
    type: 'array' as const,
    default: [
      {
        id: 'tab-1',
        label: 'Getting Started',
        items: [
          { id: 'tab-1-faq-1', question: 'How do I sign up?', answer: 'Simply click "Start Free Trial" and follow the guided setup process. It takes less than 2 minutes.' },
          { id: 'tab-1-faq-2', question: 'What\'s included in the free trial?', answer: 'Full access to all features, unlimited users, and priority support for 14 days.' },
          { id: 'tab-1-faq-3', question: 'How long does setup take?', answer: 'Most teams are up and running in under 10 minutes. We provide templates to get you started quickly.' },
        ]
      },
      {
        id: 'tab-2',
        label: 'Technical Details',
        items: [
          { id: 'tab-2-faq-1', question: 'What\'s your uptime guarantee?', answer: 'We guarantee 99.9% uptime with redundant infrastructure across multiple regions.' },
          { id: 'tab-2-faq-2', question: 'How is data encrypted?', answer: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We\'re SOC 2 Type II certified.' },
          { id: 'tab-2-faq-3', question: 'Can I export my data?', answer: 'Yes, you can export all your data anytime in JSON, CSV, or SQL format. We believe in data portability.' },
        ]
      },
      {
        id: 'tab-3',
        label: 'Billing & Support',
        items: [
          { id: 'tab-3-faq-1', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, ACH transfers, and wire transfers for enterprise customers.' },
          { id: 'tab-3-faq-2', question: 'Can I change plans anytime?', answer: 'Yes, upgrade or downgrade anytime. Changes are prorated to your billing cycle.' },
          { id: 'tab-3-faq-3', question: 'How do I contact support?', answer: '24/7 support via live chat, email at support@company.com, or schedule a call with our team.' },
        ]
      }
    ]
  }
};

// Theme-based tab colors
const getTabColors = (theme: UIBlockTheme) => ({
  warm: {
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    inactiveBg: 'bg-transparent',
    inactiveText: 'text-orange-700',
    inactiveHover: 'hover:bg-orange-50',
    cardBg: 'bg-orange-50',
    border: 'border-orange-200',
    divider: 'border-orange-100'
  },
  cool: {
    activeBg: 'bg-blue-500',
    activeText: 'text-white',
    inactiveBg: 'bg-transparent',
    inactiveText: 'text-blue-700',
    inactiveHover: 'hover:bg-blue-50',
    cardBg: 'bg-blue-50',
    border: 'border-blue-200',
    divider: 'border-blue-100'
  },
  neutral: {
    activeBg: 'bg-gray-700',
    activeText: 'text-white',
    inactiveBg: 'bg-transparent',
    inactiveText: 'text-gray-600',
    inactiveHover: 'hover:bg-gray-100',
    cardBg: 'bg-gray-50',
    border: 'border-gray-200',
    divider: 'border-gray-200'
  }
})[theme];

// Individual FAQ Item Component within a tab
const FAQTabItem = React.memo(({
  item,
  tabId,
  mode,
  colorTokens,
  getTextStyle,
  onQuestionEdit,
  onAnswerEdit,
  onRemove,
  backgroundType,
  sectionBackground,
  sectionId,
  themeColors
}: {
  item: FAQItem;
  tabId: string;
  mode: 'edit' | 'preview';
  colorTokens: any;
  getTextStyle: (variant: 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body-lg' | 'body' | 'body-sm' | 'caption') => React.CSSProperties;
  onQuestionEdit: (tabId: string, itemId: string, value: string) => void;
  onAnswerEdit: (tabId: string, itemId: string, value: string) => void;
  onRemove: (tabId: string, itemId: string) => void;
  backgroundType: any;
  sectionBackground: any;
  sectionId: string;
  themeColors: ReturnType<typeof getTabColors>;
}) => {
  return (
    <div className={`relative group/faq-item ${themeColors.cardBg} rounded-lg p-6`}>
      <div className="mb-3">
        <EditableAdaptiveText
          mode={mode}
          value={item.question}
          onEdit={(value) => onQuestionEdit(tabId, item.id, value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          variant="body"
          className={`font-semibold ${colorTokens.textPrimary}`}
          style={getTextStyle('h3')}
          placeholder="Enter question..."
          sectionBackground={sectionBackground}
          data-section-id={sectionId}
          data-element-key={`tabs.${tabId}.items.${item.id}.question`}
        />
      </div>

      {(item.answer || mode === 'edit') && (
        <EditableAdaptiveText
          mode={mode}
          value={item.answer}
          onEdit={(value) => onAnswerEdit(tabId, item.id, value)}
          backgroundType={backgroundType}
          colorTokens={colorTokens}
          variant="body"
          className={`leading-relaxed ${colorTokens.textSecondary}`}
          placeholder="Enter answer..."
          sectionBackground={sectionBackground}
          data-section-id={sectionId}
          data-element-key={`tabs.${tabId}.items.${item.id}.answer`}
        />
      )}

      {/* Remove button */}
      {mode !== 'preview' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tabId, item.id);
          }}
          className="opacity-0 group-hover/faq-item:opacity-100 absolute top-4 right-4 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
          title="Remove this item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
FAQTabItem.displayName = 'FAQTabItem';

export default function SegmentedFAQTabs(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<SegmentedFAQTabsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Theme detection: manual override > auto-detection > neutral fallback
  const uiBlockTheme = useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  const themeColors = getTabColors(uiBlockTheme);

  const [activeTab, setActiveTab] = useState(0);

  // Get tabs from content (direct array access)
  const tabs: Tab[] = blockContent.tabs || CONTENT_SCHEMA.tabs.default;

  // Handler: Edit tab label
  const handleTabLabelEdit = (tabId: string, value: string) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, label: value } : tab
    );
    (handleContentUpdate as any)('tabs', updatedTabs);
  };

  // Handler: Edit question
  const handleQuestionEdit = (tabId: string, itemId: string, value: string) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId
        ? {
            ...tab,
            items: tab.items.map(item =>
              item.id === itemId ? { ...item, question: value } : item
            )
          }
        : tab
    );
    (handleContentUpdate as any)('tabs', updatedTabs);
  };

  // Handler: Edit answer
  const handleAnswerEdit = (tabId: string, itemId: string, value: string) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId
        ? {
            ...tab,
            items: tab.items.map(item =>
              item.id === itemId ? { ...item, answer: value } : item
            )
          }
        : tab
    );
    (handleContentUpdate as any)('tabs', updatedTabs);
  };

  // Handler: Remove item from tab
  const handleRemoveItem = (tabId: string, itemId: string) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId
        ? { ...tab, items: tab.items.filter(item => item.id !== itemId) }
        : tab
    );
    (handleContentUpdate as any)('tabs', updatedTabs);
  };

  // Handler: Add item to tab
  const handleAddItem = (tabId: string) => {
    const newId = `${tabId}-faq-${Date.now()}`;
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId
        ? {
            ...tab,
            items: [...tab.items, { id: newId, question: 'New question', answer: 'New answer' }]
          }
        : tab
    );
    (handleContentUpdate as any)('tabs', updatedTabs);
  };

  // Handler: Remove tab
  const handleRemoveTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    (handleContentUpdate as any)('tabs', updatedTabs);
    // Adjust active tab if needed
    if (activeTab >= updatedTabs.length) {
      setActiveTab(Math.max(0, updatedTabs.length - 1));
    } else if (tabIndex <= activeTab && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // Handler: Add new tab
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const updatedTabs = [...tabs, {
      id: newId,
      label: 'New Category',
      items: [{ id: `${newId}-faq-1`, question: 'New question', answer: 'New answer' }]
    }];
    (handleContentUpdate as any)('tabs', updatedTabs);
    setActiveTab(updatedTabs.length - 1);
  };

  const currentTab = tabs[activeTab];

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SegmentedFAQTabs"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
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
              style={{
                ...getTextStyle('body-lg'),
                textAlign: 'center'
              }}
              className="max-w-3xl mx-auto"
              placeholder="Add a description for your segmented FAQ..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-wrap justify-center gap-4 mt-12 mb-8 pb-4 border-b ${themeColors.border}`}>
          {tabs.map((tab, index) => (
            <div key={tab.id} className="relative group/tab">
              <button
                onClick={() => setActiveTab(index)}
                className={`px-6 py-3 font-medium rounded-t-lg transition-all duration-200 ${
                  activeTab === index
                    ? `${themeColors.activeBg} ${themeColors.activeText}`
                    : `${themeColors.inactiveBg} ${themeColors.inactiveText} ${themeColors.inactiveHover}`
                }`}
              >
                {mode !== 'preview' ? (
                  <EditableAdaptiveText
                    mode={mode}
                    value={tab.label}
                    onEdit={(value) => handleTabLabelEdit(tab.id, value)}
                    backgroundType={activeTab === index ? 'primary' : backgroundType}
                    colorTokens={activeTab === index ? {
                      ...colorTokens,
                      textPrimary: '#ffffff',
                      textOnDark: '#ffffff'
                    } : colorTokens}
                    variant="body"
                    className="font-medium whitespace-nowrap"
                    placeholder={`Tab ${index + 1}`}
                    sectionBackground={activeTab === index ? themeColors.activeBg : sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`tabs.${tab.id}.label`}
                  />
                ) : (
                  tab.label
                )}
              </button>

              {/* Remove tab button */}
              {mode !== 'preview' && tabs.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTab(tab.id);
                  }}
                  className="opacity-0 group-hover/tab:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-sm z-10"
                  title="Remove this tab"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add tab button */}
          {mode !== 'preview' && tabs.length < 4 && (
            <button
              onClick={handleAddTab}
              className={`px-4 py-3 font-medium rounded-t-lg transition-all duration-200 border-2 border-dashed ${themeColors.border} ${themeColors.inactiveText} hover:bg-gray-50`}
              title="Add new tab"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {currentTab && (
          <div className="space-y-6">
            {currentTab.items.map((item) => (
              <FAQTabItem
                key={item.id}
                item={item}
                tabId={currentTab.id}
                mode={mode}
                colorTokens={colorTokens}
                getTextStyle={getTextStyle}
                onQuestionEdit={handleQuestionEdit}
                onAnswerEdit={handleAnswerEdit}
                onRemove={handleRemoveItem}
                backgroundType={backgroundType}
                sectionBackground={sectionBackground}
                sectionId={sectionId}
                themeColors={themeColors}
              />
            ))}

            {/* Add new item to current tab */}
            {mode !== 'preview' && currentTab.items.length < 5 && (
              <button
                onClick={() => handleAddItem(currentTab.id)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add item to {currentTab.label}</span>
              </button>
            )}
          </div>
        )}

        {/* Contact CTA Footer */}
        {(blockContent.contact_prompt || blockContent.cta_text || mode === 'edit') && (
          <div className={`mt-10 pt-6 border-t ${themeColors.divider} text-center`}>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.contact_prompt || ''}
              onEdit={(value) => handleContentUpdate('contact_prompt', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="mb-2"
              placeholder="Still have questions?"
              sectionId={sectionId}
              elementKey="contact_prompt"
              sectionBackground={sectionBackground}
            />
            {(blockContent.cta_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.cta_text || ''}
                onEdit={(value) => handleContentUpdate('cta_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium text-blue-600 hover:underline cursor-pointer"
                placeholder="Contact our support team"
                sectionId={sectionId}
                elementKey="cta_text"
                sectionBackground={sectionBackground}
              />
            )}
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="muted"
                className="mt-2 text-sm"
                placeholder="We typically respond within 24 hours"
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SegmentedFAQTabs',
  category: 'FAQ Sections',
  description: 'Tabbed FAQ sections for organized questions by category, ideal for complex products',
  tags: ['faq', 'tabs', 'segmented', 'enterprise', 'categories', 'theme-aware'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'moderate',

  // V2 Schema - nested array format
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'tabs', label: 'FAQ Tabs', type: 'array', required: true }
  ],

  features: [
    'Theme-aware styling (warm/cool/neutral)',
    'Nested tab/item structure',
    'Add/remove tabs dynamically',
    'Add/remove items per tab',
    'Interactive tab navigation',
    'Responsive design'
  ],

  useCases: [
    'Enterprise software documentation',
    'Complex product FAQs',
    'Multi-category support questions',
    'Technical implementation guides',
    'Compliance and security FAQs'
  ]
};
