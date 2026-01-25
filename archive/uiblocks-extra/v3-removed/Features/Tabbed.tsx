import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TabbedContent {
  headline: string;
  tab_labels: string;
  tab_titles: string;
  tab_descriptions: string;
  tab_visuals?: string;
  // Individual tab visual fields for image toolbar support
  tab_visual_0?: string;
  tab_visual_1?: string;
  tab_visual_2?: string;
  tab_visual_3?: string;
  tab_visual_4?: string;
  tab_visual_5?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  // Benefit badge fields
  benefit_1?: string;
  benefit_2?: string;
  // Benefit icons
  benefit_icon_1?: string;
  benefit_icon_2?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'All Your Features in One Platform' 
  },
  tab_labels: { 
    type: 'string' as const, 
    default: 'Analytics|Automation|Collaboration|Security' 
  },
  tab_titles: { 
    type: 'string' as const, 
    default: 'Powerful Analytics Dashboard|Smart Workflow Automation|Real-Time Team Collaboration|Enterprise Security' 
  },
  tab_descriptions: { 
    type: 'string' as const, 
    default: 'Get actionable insights with our comprehensive analytics dashboard. Track KPIs, monitor trends, and make data-driven decisions with customizable reports and real-time metrics.|Automate repetitive tasks and streamline your workflows with our intelligent automation engine. Set up triggers, actions, and conditional logic without any coding required.|Work together seamlessly with built-in collaboration tools. Share projects, comment in real-time, and keep everyone aligned with activity feeds and notifications.|Bank-level security keeps your data protected. With SOC 2 compliance, end-to-end encryption, and advanced access controls, your information is always secure.' 
  },
  tab_visuals: { 
    type: 'string' as const, 
    default: '/analytics-visual.jpg|/automation-visual.jpg|/collaboration-visual.jpg|/security-visual.jpg' 
  },
  // Individual tab visual fields for image toolbar support
  tab_visual_0: { 
    type: 'string' as const, 
    default: '' 
  },
  tab_visual_1: { 
    type: 'string' as const, 
    default: '' 
  },
  tab_visual_2: { 
    type: 'string' as const, 
    default: '' 
  },
  tab_visual_3: { 
    type: 'string' as const, 
    default: '' 
  },
  tab_visual_4: { 
    type: 'string' as const, 
    default: '' 
  },
  tab_visual_5: { 
    type: 'string' as const, 
    default: '' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  // Benefit badge schema
  benefit_1: { 
    type: 'string' as const, 
    default: 'Fast Implementation' 
  },
  benefit_2: { 
    type: 'string' as const, 
    default: 'Enterprise Ready' 
  },
  // Benefit icon schema
  benefit_icon_1: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  benefit_icon_2: { 
    type: 'string' as const, 
    default: '✅' 
  }
};

export default function Tabbed(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  } = useLayoutComponent<TabbedContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h3Style = getTypographyStyle('h3');

  // Helper function to get individual tab visual
  const getTabVisual = (index: number): string => {
    const fieldName = `tab_visual_${index}` as keyof TabbedContent;
    return (blockContent[fieldName] as string) || '';
  };

  const tabLabels = blockContent.tab_labels 
    ? blockContent.tab_labels.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tabTitles = blockContent.tab_titles 
    ? blockContent.tab_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tabDescriptions = blockContent.tab_descriptions 
    ? blockContent.tab_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tabVisuals = blockContent.tab_visuals 
    ? blockContent.tab_visuals.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const tabs = tabLabels.map((label, index) => ({
    label,
    title: tabTitles[index] || '',
    description: tabDescriptions[index] || '',
    visual: getTabVisual(index) || tabVisuals[index] || '' // Use individual field first, then fallback
  }));

  const [activeTab, setActiveTab] = useState(0);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // Migration logic: Convert pipe-separated tab_visuals to individual fields
  React.useEffect(() => {
    if (blockContent.tab_visuals && !blockContent.tab_visual_0) {
      const tabVisuals = blockContent.tab_visuals.split('|').map(item => item.trim()).filter(Boolean);
      const updates: Partial<TabbedContent> = {};
      
      tabVisuals.forEach((visual, index) => {
        if (index < 6) { // Max 6 tabs
          const fieldName = `tab_visual_${index}` as keyof TabbedContent;
          updates[fieldName] = visual as any;
        }
      });
      
      // Apply all updates at once
      Object.entries(updates).forEach(([key, value]) => {
        handleContentUpdate(key as keyof TabbedContent, value);
      });
    }
  }, [blockContent.tab_visuals, blockContent.tab_visual_0, handleContentUpdate]);

  const VisualPlaceholder = ({ index, onClick }: { index: number; onClick?: (e: React.MouseEvent) => void }) => (
    <div 
      className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 cursor-pointer hover:bg-gradient-to-br hover:from-purple-100 hover:to-indigo-150 transition-all duration-300"
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            {tabs[index]?.label || 'Feature'} Visual
          </div>
          {mode === 'edit' && (
            <div className="text-xs text-gray-500 mt-2">
              Click to add image
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Tabbed"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || (mode as any) === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your feature categories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div>
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center mb-8 gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                    activeTab === index
                      ? `${colorTokens.ctaBg} text-white shadow-lg transform scale-105`
                      : `${colorTokens.surfaceElevated} ${colorTokens.textSecondary} hover:${colorTokens.textPrimary} hover:shadow-md`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                <div className="space-y-6">
                  {/* Editable Tab Title */}
                  {mode !== 'preview' ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const tabTitles = blockContent.tab_titles ? blockContent.tab_titles.split('|') : [];
                        tabTitles[activeTab] = e.currentTarget.textContent || '';
                        handleContentUpdate('tab_titles', tabTitles.join('|'));
                      }}
                      className="text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]"
                      style={{
                        fontSize: h3Style.fontSize,
                        fontWeight: h3Style.fontWeight,
                        lineHeight: h3Style.lineHeight,
                        letterSpacing: h3Style.letterSpacing,
                        fontFamily: h3Style.fontFamily
                      }}
                      data-placeholder="Tab title"
                    >
                      {tabs[activeTab]?.title}
                    </div>
                  ) : (
                    <h3 
                      className="text-gray-900"
                      style={{
                        fontSize: h3Style.fontSize,
                        fontWeight: h3Style.fontWeight,
                        lineHeight: h3Style.lineHeight,
                        letterSpacing: h3Style.letterSpacing,
                        fontFamily: h3Style.fontFamily
                      }}
                    >
                      {tabs[activeTab]?.title}
                    </h3>
                  )}
                  
                  {/* Editable Tab Description */}
                  {mode !== 'preview' ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const tabDescriptions = blockContent.tab_descriptions ? blockContent.tab_descriptions.split('|') : [];
                        tabDescriptions[activeTab] = e.currentTarget.textContent || '';
                        handleContentUpdate('tab_descriptions', tabDescriptions.join('|'));
                      }}
                      className="text-gray-600 leading-relaxed text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]"
                      data-placeholder="Tab description"
                    >
                      {tabs[activeTab]?.description}
                    </div>
                  ) : (
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {tabs[activeTab]?.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4">
                    {(blockContent.benefit_1 || (mode as any) === 'edit') && blockContent.benefit_1 !== '___REMOVED___' && (
                      <div className="flex items-center space-x-2 group/benefit-item relative">
                        <div className={`w-10 h-10 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center`}>
                          <IconEditableText
                            mode={mode as 'edit' | 'preview'}
                            value={blockContent.benefit_icon_1 || '⚡'}
                            onEdit={(value) => handleContentUpdate('benefit_icon_1', value)}
                            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                            colorTokens={colorTokens}
                            iconSize="md"
                            className="text-white text-xl"
                            sectionId={sectionId}
                            elementKey="benefit_icon_1"
                          />
                        </div>
                        {(mode as any) === 'edit' ? (
                          <EditableAdaptiveText
                            mode={mode}
                            value={blockContent.benefit_1 || ''}
                            onEdit={(value) => handleContentUpdate('benefit_1', value)}
                            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                            colorTokens={colorTokens}
                            variant="body"
                            className="text-sm font-medium text-gray-700"
                            placeholder="Benefit 1"
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key="benefit_1"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{blockContent.benefit_1}</span>
                        )}
                        {(mode as any) === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('benefit_1', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                            title="Remove benefit 1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {(blockContent.benefit_2 || (mode as any) === 'edit') && blockContent.benefit_2 !== '___REMOVED___' && (
                      <div className="flex items-center space-x-2 group/benefit-item relative">
                        <div className={`w-10 h-10 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center`}>
                          <IconEditableText
                            mode={mode as 'edit' | 'preview'}
                            value={blockContent.benefit_icon_2 || '✅'}
                            onEdit={(value) => handleContentUpdate('benefit_icon_2', value)}
                            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                            colorTokens={colorTokens}
                            iconSize="md"
                            className="text-white text-xl"
                            sectionId={sectionId}
                            elementKey="benefit_icon_2"
                          />
                        </div>
                        {(mode as any) === 'edit' ? (
                          <EditableAdaptiveText
                            mode={mode}
                            value={blockContent.benefit_2 || ''}
                            onEdit={(value) => handleContentUpdate('benefit_2', value)}
                            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                            colorTokens={colorTokens}
                            variant="body"
                            className="text-sm font-medium text-gray-700"
                            placeholder="Benefit 2"
                            sectionBackground={sectionBackground}
                            data-section-id={sectionId}
                            data-element-key="benefit_2"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{blockContent.benefit_2}</span>
                        )}
                        {(mode as any) === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentUpdate('benefit_2', '___REMOVED___');
                            }}
                            className="opacity-0 group-hover/benefit-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                            title="Remove benefit 2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {tabs[activeTab]?.visual && tabs[activeTab].visual !== '' ? (
                    <img
                      src={tabs[activeTab].visual}
                      alt={tabs[activeTab].title}
                      className="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
                      data-image-id={`${sectionId}.tab-visual-${activeTab}`}
                      onMouseUp={(e) => {
                        if (mode === 'edit') {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const imageId = `${sectionId}.tab-visual-${activeTab}`;
                          const position = {
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          };
                          handleImageToolbar(imageId, position);
                        }
                      }}
                      onClick={(e) => {
                        if (mode === 'edit') {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                      }}
                    />
                  ) : (
                    <VisualPlaceholder 
                      index={activeTab}
                      onClick={(e) => {
                        if (mode === 'edit') {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const imageId = `${sectionId}.tab-visual-${activeTab}`;
                          const position = {
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          };
                          handleImageToolbar(imageId, position);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Tab Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {tabs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeTab === index
                      ? `w-8 ${colorTokens.ctaBg}`
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

        {(blockContent.cta_text || blockContent.trust_items || (mode as any) === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || (mode as any) === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce your platform capabilities..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'Tabbed',
  category: 'Features',
  description: 'Tabbed interface for organizing features. Perfect for solution-aware audiences and marketing tools.',
  tags: ['features', 'tabs', 'interactive', 'organized', 'marketing'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'tab_labels', label: 'Tab Labels (pipe separated)', type: 'text', required: true },
    { key: 'tab_titles', label: 'Tab Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'tab_descriptions', label: 'Tab Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'tab_visuals', label: 'Tab Visuals (pipe separated)', type: 'textarea', required: false },
    { key: 'tab_visual_0', label: 'Tab 1 Visual', type: 'image', required: false },
    { key: 'tab_visual_1', label: 'Tab 2 Visual', type: 'image', required: false },
    { key: 'tab_visual_2', label: 'Tab 3 Visual', type: 'image', required: false },
    { key: 'tab_visual_3', label: 'Tab 4 Visual', type: 'image', required: false },
    { key: 'tab_visual_4', label: 'Tab 5 Visual', type: 'image', required: false },
    { key: 'tab_visual_5', label: 'Tab 6 Visual', type: 'image', required: false },
    { key: 'benefit_1', label: 'Benefit Badge 1', type: 'text', required: false },
    { key: 'benefit_2', label: 'Benefit Badge 2', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Interactive tabbed navigation',
    'Clean organized feature presentation',
    'Visual content support for each tab',
    'Smooth transitions between tabs',
    'Tab indicators for navigation',
    'Perfect for categorized features'
  ],
  
  useCases: [
    'Marketing platform features',
    'Multi-category product capabilities',
    'Solution-aware audience targeting',
    'Organized feature presentations',
    'SaaS platform feature tours'
  ]
};