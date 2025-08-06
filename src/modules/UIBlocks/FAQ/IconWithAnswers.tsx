import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface IconWithAnswersContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
  icons: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Common Questions Answered' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Quick visual guides to help you understand our platform' 
  },
  questions: { 
    type: 'string' as const, 
    default: 'Is it really that simple to use?|What if I make a mistake?|How secure is my data?|Can I customize everything?|Will it work with my existing tools?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'Yes! Our interface is designed for anyone to use, regardless of technical background. Most users are creating their first automation within minutes.|Don\'t worry! Everything can be undone, and we provide preview mode so you can test before going live. Plus, our support team is always here to help.|Your data is protected with bank-level encryption and we\'re certified for enterprise security standards. We never share or access your private information.|Absolutely! You can customize colors, layouts, workflows, and integrations to match your exact needs and brand.|We integrate with 200+ popular tools including Slack, Google Workspace, Salesforce, and more. If we don\'t have an integration you need, we\'ll build it.' 
  },
  icons: { 
    type: 'string' as const, 
    default: '🎯|⚡|🔒|🎨|🔗' 
  }
};

export default function IconWithAnswers(props: LayoutComponentProps) {
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
  } = useLayoutComponent<IconWithAnswersContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse content
  const questions = blockContent.questions 
    ? blockContent.questions.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answers = blockContent.answers 
    ? blockContent.answers.split('|').map(a => a.trim()).filter(Boolean)
    : [];
  const icons = blockContent.icons 
    ? blockContent.icons.split('|').map(i => i.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="IconWithAnswers"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-5xl mx-auto">
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
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a description with visual elements..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Icon-based Q&As */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 lg:gap-6">
          {questions.map((question, index) => (
            <div key={index} className="flex gap-4 lg:gap-6 items-start">
              {/* Icon Container */}
              <div 
                className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <span className="text-2xl">
                  {icons[index] || '💡'}
                </span>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                  {question}
                </h3>
                {answers[index] && (
                  <p className={`leading-relaxed ${mutedTextColor}`}>
                    {answers[index]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Visual Element */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-full">
            <span className="text-2xl">✨</span>
            <span className={`text-sm font-medium ${mutedTextColor}`}>
              Still have questions? We're here to help!
            </span>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'IconWithAnswers',
  category: 'FAQ Sections',
  description: 'FAQ with icons for visual clarity and friendly appeal',
  tags: ['faq', 'icons', 'visual', 'friendly', 'creators'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '8 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'icons', label: 'Icons/Emojis (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Visual icons for each question',
    'Friendly, approachable design',
    'Clear visual hierarchy',
    'Perfect for creator-focused content',
    'Responsive layout'
  ],
  
  useCases: [
    'Creator tool FAQs',
    'Early-stage product questions',
    'User onboarding guides',
    'Simple feature explanations',
    'Friendly support content'
  ]
};