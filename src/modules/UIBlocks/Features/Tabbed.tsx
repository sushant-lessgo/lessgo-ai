import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TabbedContent {
  headline: string;
  tab_labels: string;
  tab_titles: string;
  tab_descriptions: string;
  tab_visuals?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
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
  }
};

export default function Tabbed(props: LayoutComponentProps) {
  
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
    visual: tabVisuals[index] || ''
  }));

  const [activeTab, setActiveTab] = useState(0);

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);

  const VisualPlaceholder = ({ index }: { index: number }) => (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100">
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
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="Tabbed"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
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
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your feature categories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Tab Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tab_labels}
                  onEdit={(value) => handleContentUpdate('tab_labels', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Tab labels (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tab_labels"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tab_titles}
                  onEdit={(value) => handleContentUpdate('tab_titles', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Tab titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tab_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.tab_descriptions}
                  onEdit={(value) => handleContentUpdate('tab_descriptions', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Tab descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="tab_descriptions"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
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
                  <h3 className="text-3xl font-bold text-gray-900">
                    {tabs[activeTab]?.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {tabs[activeTab]?.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-10 h-10 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Fast Implementation</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-10 h-10 rounded-lg ${colorTokens.ctaBg} flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Enterprise Ready</span>
                    </div>
                  </div>
                </div>

                <div>
                  {tabs[activeTab]?.visual && tabs[activeTab].visual !== '' ? (
                    <img
                      src={tabs[activeTab].visual}
                      alt={tabs[activeTab].title}
                      className="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
                      data-image-id={`${sectionId}-tab${activeTab}-visual`}
                      onMouseUp={(e) => {
                        if (mode === 'edit') {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          showImageToolbar(`${sectionId}-tab${activeTab}-visual`, {
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          });
                        }
                      }}
                    />
                  ) : (
                    <VisualPlaceholder index={activeTab} />
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
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
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
                    textStyle={getTextStyle('body-lg')}
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