import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface SegmentedFAQTabsContent {
  headline: string;
  subheadline?: string;
  tab_labels: string;
  tab1_questions: string;
  tab1_answers: string;
  tab2_questions: string;
  tab2_answers: string;
  tab3_questions: string;
  tab3_answers: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Everything You Need to Know' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Find answers organized by topic for easy navigation' 
  },
  tab_labels: { 
    type: 'string' as const, 
    default: 'Getting Started|Technical Details|Billing & Support' 
  },
  tab1_questions: { 
    type: 'string' as const, 
    default: 'How do I sign up?|What\'s included in the free trial?|How long does setup take?|Do I need to install anything?' 
  },
  tab1_answers: { 
    type: 'string' as const, 
    default: 'Simply click "Start Free Trial" and follow the guided setup process. It takes less than 2 minutes.|Full access to all features, unlimited users, and priority support for 14 days.|Most teams are up and running in under 10 minutes. We provide templates to get you started quickly.|No downloads required. Our platform works entirely in your browser on any device.' 
  },
  tab2_questions: { 
    type: 'string' as const, 
    default: 'What\'s your uptime guarantee?|How is data encrypted?|Which APIs do you support?|Can I export my data?' 
  },
  tab2_answers: { 
    type: 'string' as const, 
    default: 'We guarantee 99.9% uptime with redundant infrastructure across multiple regions.|All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We\'re SOC 2 Type II certified.|We support REST, GraphQL, and webhooks. Full API documentation is available in your dashboard.|Yes, you can export all your data anytime in JSON, CSV, or SQL format. We believe in data portability.' 
  },
  tab3_questions: { 
    type: 'string' as const, 
    default: 'What payment methods do you accept?|Can I change plans anytime?|Do you offer refunds?|How do I contact support?' 
  },
  tab3_answers: { 
    type: 'string' as const, 
    default: 'We accept all major credit cards, ACH transfers, and wire transfers for enterprise customers.|Yes, upgrade or downgrade anytime. Changes are prorated to your billing cycle.|We offer a 30-day money-back guarantee if you\'re not completely satisfied.|24/7 support via live chat, email at support@company.com, or schedule a call with our team.' 
  }
};

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

  const [activeTab, setActiveTab] = useState(0);

  // Parse tab labels
  const tabLabels = blockContent.tab_labels 
    ? blockContent.tab_labels.split('|').map(label => label.trim()).filter(Boolean)
    : ['General', 'Technical', 'Billing'];

  // Parse questions and answers for each tab
  const tabs = [
    {
      questions: blockContent.tab1_questions?.split('|').map(q => q.trim()).filter(Boolean) || [],
      answers: blockContent.tab1_answers?.split('|').map(a => a.trim()).filter(Boolean) || []
    },
    {
      questions: blockContent.tab2_questions?.split('|').map(q => q.trim()).filter(Boolean) || [],
      answers: blockContent.tab2_answers?.split('|').map(a => a.trim()).filter(Boolean) || []
    },
    {
      questions: blockContent.tab3_questions?.split('|').map(q => q.trim()).filter(Boolean) || [],
      answers: blockContent.tab3_answers?.split('|').map(a => a.trim()).filter(Boolean) || []
    }
  ];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="SegmentedFAQTabs"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
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
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a description for your segmented FAQ..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {tabLabels.map((label, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === index
                  ? `${accentColor} text-white border-transparent`
                  : `${mutedTextColor} border-transparent hover:border-gray-300`
              }`}
              style={{
                backgroundColor: activeTab === index ? colorTokens.ctaBg : 'transparent',
                color: activeTab === index ? colorTokens.ctaText : undefined
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {tabs[activeTab].questions.map((question, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <h3 className={`text-lg font-semibold mb-3 ${dynamicTextColors?.heading || colorTokens.text}`}>
                {question}
              </h3>
              {tabs[activeTab].answers[index] && (
                <p className={`leading-relaxed ${mutedTextColor}`}>
                  {tabs[activeTab].answers[index]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'SegmentedFAQTabs',
  category: 'FAQ Sections',
  description: 'Tabbed FAQ sections for complex questions, ideal for enterprise',
  tags: ['faq', 'tabs', 'segmented', 'enterprise', 'complex'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'moderate',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'tab_labels', label: 'Tab Labels (pipe separated)', type: 'text', required: true },
    { key: 'tab1_questions', label: 'Tab 1 Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'tab1_answers', label: 'Tab 1 Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'tab2_questions', label: 'Tab 2 Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'tab2_answers', label: 'Tab 2 Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'tab3_questions', label: 'Tab 3 Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'tab3_answers', label: 'Tab 3 Answers (pipe separated)', type: 'textarea', required: true }
  ],
  
  features: [
    'Organized by topic tabs',
    'Handles complex FAQ structures',
    'Interactive tab navigation',
    'Accent color for active states',
    'Enterprise-ready design'
  ],
  
  useCases: [
    'Enterprise software documentation',
    'Complex product FAQs',
    'Technical implementation guides',
    'Multi-category support questions',
    'Compliance and security FAQs'
  ]
};