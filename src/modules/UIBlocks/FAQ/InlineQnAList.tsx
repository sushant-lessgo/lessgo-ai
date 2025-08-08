import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InlineQnAListContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Quick Questions & Answers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Get instant answers to the most common questions' 
  },
  questions: { 
    type: 'string' as const, 
    default: 'What is your product?|How much does it cost?|Do I need technical knowledge?|How quickly can I get started?|What if I need help?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'We\'re a no-code automation platform that helps you streamline your business processes without writing a single line of code.|We offer flexible pricing starting at $29/month. See our pricing page for detailed plans.|Not at all! Our platform is designed for non-technical users. If you can use email, you can use our product.|You can get started in under 5 minutes. Just sign up, connect your tools, and start automating.|We provide 24/7 support via chat and email, plus extensive documentation and video tutorials.' 
  }
};

export default function InlineQnAList(props: LayoutComponentProps) {
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
  } = useLayoutComponent<InlineQnAListContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse questions and answers
  const questions = blockContent.questions 
    ? blockContent.questions.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answers = blockContent.answers 
    ? blockContent.answers.split('|').map(a => a.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InlineQnAList"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-3"
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
              className=""
              placeholder="Add a brief description..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Simple Q&A List */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
              <h3 
                className={`font-medium mb-2 ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                style={getTextStyle('h3')}
              >
                {question}
              </h3>
              {answers[index] && (
                <p className={`leading-relaxed ${mutedTextColor}`}>
                  {answers[index]}
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
  name: 'InlineQnAList',
  category: 'FAQ Sections',
  description: 'Simple inline list of questions and answers for low-complexity needs',
  tags: ['faq', 'simple', 'inline', 'minimal'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '5 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Answers (pipe separated)', type: 'textarea', required: true }
  ],
  
  features: [
    'Simple, clean layout',
    'Easy to scan format',
    'Minimal design approach',
    'Perfect for 3-6 FAQs',
    'Mobile-friendly'
  ],
  
  useCases: [
    'Early-stage startup FAQs',
    'Simple product questions',
    'Basic pricing clarifications',
    'Getting started guides',
    'Quick reference sections'
  ]
};