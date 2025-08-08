import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface TwoColumnFAQContent {
  headline: string;
  subheadline?: string;
  questions_left: string;
  answers_left: string;
  questions_right: string;
  answers_right: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Frequently Asked Questions' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Everything you need to know about our platform' 
  },
  questions_left: { 
    type: 'string' as const, 
    default: 'How does the pricing work?|Is there a free trial available?|Can I cancel my subscription anytime?' 
  },
  answers_left: { 
    type: 'string' as const, 
    default: 'Our pricing is simple and transparent. Choose from monthly or annual plans, with discounts for annual billing. All plans include core features with no hidden fees.|Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.|Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or long-term commitments.' 
  },
  questions_right: { 
    type: 'string' as const, 
    default: 'What kind of support do you offer?|Do you integrate with other tools?|Is my data secure?' 
  },
  answers_right: { 
    type: 'string' as const, 
    default: 'We provide 24/7 customer support via live chat and email. Premium plans also include priority support and dedicated account managers.|Yes, we integrate with 50+ popular tools including Slack, Google Workspace, Microsoft Teams, and more. Custom integrations are available for enterprise plans.|Security is our top priority. We use bank-level encryption, regular security audits, and are SOC 2 compliant. Your data is always encrypted in transit and at rest.' 
  }
};

export default function TwoColumnFAQ(props: LayoutComponentProps) {
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
  } = useLayoutComponent<TwoColumnFAQContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse questions and answers
  const questionsLeft = blockContent.questions_left 
    ? blockContent.questions_left.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answersLeft = blockContent.answers_left 
    ? blockContent.answers_left.split('|').map(a => a.trim()).filter(Boolean)
    : [];
  const questionsRight = blockContent.questions_right 
    ? blockContent.questions_right.split('|').map(q => q.trim()).filter(Boolean)
    : [];
  const answersRight = blockContent.answers_right 
    ? blockContent.answers_right.split('|').map(a => a.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TwoColumnFAQ"
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
              style={{
                ...getTextStyle('body-lg'),
                textAlign: 'center'
              }}
              className="max-w-3xl mx-auto"
              placeholder="Add a supporting description for your FAQ section..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-6">
            {questionsLeft.map((question, index) => (
              <div key={index} className="space-y-3">
                <h3 
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                >
                  {question}
                </h3>
                {answersLeft[index] && (
                  <p className={`leading-relaxed ${mutedTextColor}`}>
                    {answersLeft[index]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {questionsRight.map((question, index) => (
              <div key={index} className="space-y-3">
                <h3 
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h3')}
                >
                  {question}
                </h3>
                {answersRight[index] && (
                  <p className={`leading-relaxed ${mutedTextColor}`}>
                    {answersRight[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'TwoColumnFAQ',
  category: 'FAQ Sections',
  description: 'Two-column layout for organized Q&A, ideal for technical audiences',
  tags: ['faq', 'two-column', 'organized', 'technical'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions_left', label: 'Left Column Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers_left', label: 'Left Column Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'questions_right', label: 'Right Column Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers_right', label: 'Right Column Answers (pipe separated)', type: 'textarea', required: true }
  ],
  
  features: [
    'Two-column layout for better organization',
    'Automatic text color adaptation',
    'Clean, scannable format',
    'Ideal for 6-10 FAQ items',
    'Responsive design'
  ],
  
  useCases: [
    'Technical documentation FAQs',
    'Enterprise software questions',
    'Product feature clarifications',
    'API usage questions',
    'Integration and compatibility FAQs'
  ]
};