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
  // Individual tab labels
  tab_label_1: string;
  tab_label_2: string;
  tab_label_3: string;
  // Tab 1 Q&A (up to 4 items per tab)
  tab1_question_1: string;
  tab1_answer_1: string;
  tab1_question_2: string;
  tab1_answer_2: string;
  tab1_question_3: string;
  tab1_answer_3: string;
  tab1_question_4: string;
  tab1_answer_4: string;
  // Tab 2 Q&A
  tab2_question_1: string;
  tab2_answer_1: string;
  tab2_question_2: string;
  tab2_answer_2: string;
  tab2_question_3: string;
  tab2_answer_3: string;
  tab2_question_4: string;
  tab2_answer_4: string;
  // Tab 3 Q&A
  tab3_question_1: string;
  tab3_answer_1: string;
  tab3_question_2: string;
  tab3_answer_2: string;
  tab3_question_3: string;
  tab3_answer_3: string;
  tab3_question_4: string;
  tab3_answer_4: string;
  // Legacy fields for backward compatibility
  tab_labels?: string;
  tab1_questions?: string;
  tab1_answers?: string;
  tab2_questions?: string;
  tab2_answers?: string;
  tab3_questions?: string;
  tab3_answers?: string;
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
  // Individual tab labels
  tab_label_1: { type: 'string' as const, default: 'Getting Started' },
  tab_label_2: { type: 'string' as const, default: 'Technical Details' },
  tab_label_3: { type: 'string' as const, default: 'Billing & Support' },
  // Tab 1 Q&A
  tab1_question_1: { type: 'string' as const, default: 'How do I sign up?' },
  tab1_answer_1: { type: 'string' as const, default: 'Simply click "Start Free Trial" and follow the guided setup process. It takes less than 2 minutes.' },
  tab1_question_2: { type: 'string' as const, default: 'What\'s included in the free trial?' },
  tab1_answer_2: { type: 'string' as const, default: 'Full access to all features, unlimited users, and priority support for 14 days.' },
  tab1_question_3: { type: 'string' as const, default: 'How long does setup take?' },
  tab1_answer_3: { type: 'string' as const, default: 'Most teams are up and running in under 10 minutes. We provide templates to get you started quickly.' },
  tab1_question_4: { type: 'string' as const, default: 'Do I need to install anything?' },
  tab1_answer_4: { type: 'string' as const, default: 'No downloads required. Our platform works entirely in your browser on any device.' },
  // Tab 2 Q&A
  tab2_question_1: { type: 'string' as const, default: 'What\'s your uptime guarantee?' },
  tab2_answer_1: { type: 'string' as const, default: 'We guarantee 99.9% uptime with redundant infrastructure across multiple regions.' },
  tab2_question_2: { type: 'string' as const, default: 'How is data encrypted?' },
  tab2_answer_2: { type: 'string' as const, default: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We\'re SOC 2 Type II certified.' },
  tab2_question_3: { type: 'string' as const, default: 'Which APIs do you support?' },
  tab2_answer_3: { type: 'string' as const, default: 'We support REST, GraphQL, and webhooks. Full API documentation is available in your dashboard.' },
  tab2_question_4: { type: 'string' as const, default: 'Can I export my data?' },
  tab2_answer_4: { type: 'string' as const, default: 'Yes, you can export all your data anytime in JSON, CSV, or SQL format. We believe in data portability.' },
  // Tab 3 Q&A
  tab3_question_1: { type: 'string' as const, default: 'What payment methods do you accept?' },
  tab3_answer_1: { type: 'string' as const, default: 'We accept all major credit cards, ACH transfers, and wire transfers for enterprise customers.' },
  tab3_question_2: { type: 'string' as const, default: 'Can I change plans anytime?' },
  tab3_answer_2: { type: 'string' as const, default: 'Yes, upgrade or downgrade anytime. Changes are prorated to your billing cycle.' },
  tab3_question_3: { type: 'string' as const, default: 'Do you offer refunds?' },
  tab3_answer_3: { type: 'string' as const, default: 'We offer a 30-day money-back guarantee if you\'re not completely satisfied.' },
  tab3_question_4: { type: 'string' as const, default: 'How do I contact support?' },
  tab3_answer_4: { type: 'string' as const, default: '24/7 support via live chat, email at support@company.com, or schedule a call with our team.' },
  // Legacy fields for backward compatibility
  tab_labels: { type: 'string' as const, default: '' },
  tab1_questions: { type: 'string' as const, default: '' },
  tab1_answers: { type: 'string' as const, default: '' },
  tab2_questions: { type: 'string' as const, default: '' },
  tab2_answers: { type: 'string' as const, default: '' },
  tab3_questions: { type: 'string' as const, default: '' },
  tab3_answers: { type: 'string' as const, default: '' }
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

  // Helper function to get tab labels
  const getTabLabels = () => {
    const labels = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const labelKey = `tab_label_${i}` as keyof SegmentedFAQTabsContent;
      const label = blockContent[labelKey];
      
      if (label && label.trim() !== '' && label !== '___REMOVED___') {
        labels.push(label.trim());
      }
    }
    
    // Fallback to legacy format if no individual labels found
    if (labels.length === 0 && blockContent.tab_labels) {
      return blockContent.tab_labels.split('|').map(label => label.trim()).filter(Boolean);
    }
    
    // Default labels if nothing found
    if (labels.length === 0) {
      return ['General', 'Technical', 'Billing'];
    }
    
    return labels;
  };
  
  // Helper function to get FAQ items for a specific tab
  const getTabFAQItems = (tabNumber: number) => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 4; i++) {
      const questionKey = `tab${tabNumber}_question_${i}` as keyof SegmentedFAQTabsContent;
      const answerKey = `tab${tabNumber}_answer_${i}` as keyof SegmentedFAQTabsContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      
      if (question && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && answer !== '___REMOVED___') ? answer.trim() : '',
          index: i,
          tabNumber
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0) {
      const questionsKey = `tab${tabNumber}_questions` as keyof SegmentedFAQTabsContent;
      const answersKey = `tab${tabNumber}_answers` as keyof SegmentedFAQTabsContent;
      
      const questions = blockContent[questionsKey]?.split('|').map(q => q.trim()).filter(Boolean) || [];
      const answers = blockContent[answersKey]?.split('|').map(a => a.trim()).filter(Boolean) || [];
      
      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          index: index + 1,
          tabNumber
        });
      });
    }
    
    return items;
  };
  
  const tabLabels = getTabLabels();
  const tabs = [
    { items: getTabFAQItems(1) },
    { items: getTabFAQItems(2) },
    { items: getTabFAQItems(3) }
  ];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

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
        <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {tabLabels.map((label, index) => (
            <div key={index} className="relative group/tab-label">
              <button
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
                {mode === 'edit' ? (
                  <EditableAdaptiveText
                    mode={mode}
                    value={label}
                    onEdit={(value) => handleContentUpdate(`tab_label_${index + 1}` as keyof SegmentedFAQTabsContent, value)}
                    backgroundType={activeTab === index ? 'primary' : backgroundType}
                    colorTokens={activeTab === index ? {
                      ...colorTokens,
                      textPrimary: colorTokens.ctaText || '#ffffff',
                      textOnDark: colorTokens.ctaText || '#ffffff'
                    } : colorTokens}
                    variant="body"
                    className="font-medium"
                    placeholder={`Tab ${index + 1}`}
                    sectionBackground={activeTab === index ? colorTokens.ctaBg : sectionBackground}
                    data-section-id={sectionId}
                    data-element-key={`tab_label_${index + 1}`}
                  />
                ) : (
                  label
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {tabs[activeTab].items.map((item) => (
            <div key={`${item.tabNumber}-${item.index}`} className="relative group/tab-item bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="mb-3">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`tab${item.tabNumber}_question_${item.index}` as keyof SegmentedFAQTabsContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                  placeholder={`Question ${item.index} for Tab ${item.tabNumber}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`tab${item.tabNumber}_question_${item.index}`}
                />
              </div>
              
              {(item.answer || mode === 'edit') && (
                <EditableAdaptiveText
                  mode={mode}
                  value={item.answer}
                  onEdit={(value) => handleContentUpdate(`tab${item.tabNumber}_answer_${item.index}` as keyof SegmentedFAQTabsContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`leading-relaxed ${mutedTextColor}`}
                  placeholder={`Answer ${item.index} for Tab ${item.tabNumber}...`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`tab${item.tabNumber}_answer_${item.index}`}
                />
              )}
              
              {/* Remove button */}
              {mode === 'edit' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate(`tab${item.tabNumber}_question_${item.index}` as keyof SegmentedFAQTabsContent, '___REMOVED___');
                    handleContentUpdate(`tab${item.tabNumber}_answer_${item.index}` as keyof SegmentedFAQTabsContent, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/tab-item:opacity-100 absolute top-4 right-4 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                  title="Remove this item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add new item to current tab */}
          {mode === 'edit' && tabs[activeTab].items.length < 4 && (
            <button
              onClick={() => {
                const tabNumber = activeTab + 1;
                // Find the first empty slot in the current tab
                for (let i = 1; i <= 4; i++) {
                  const questionKey = `tab${tabNumber}_question_${i}` as keyof SegmentedFAQTabsContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, `New question for ${tabLabels[activeTab]}`);
                    handleContentUpdate(`tab${tabNumber}_answer_${i}` as keyof SegmentedFAQTabsContent, 'New answer');
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add item to {tabLabels[activeTab]}</span>
            </button>
          )}
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