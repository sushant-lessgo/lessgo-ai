import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface QuoteStyleAnswersContent {
  headline: string;
  subheadline?: string;
  questions: string;
  answers: string;
  expert_names: string;
  expert_titles: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Expert Insights & Answers' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Learn from industry leaders and technical experts' 
  },
  questions: { 
    type: 'string' as const, 
    default: 'What makes your solution enterprise-ready?|How do you ensure data security and compliance?|What\'s your approach to scalability?' 
  },
  answers: { 
    type: 'string' as const, 
    default: 'We\'ve built our platform from the ground up with enterprise requirements in mind. This includes role-based access control, audit logs, SSO integration, and dedicated infrastructure options. Our architecture supports millions of transactions daily with sub-second response times.|Security isn\'t an afterthought—it\'s fundamental to our design. We maintain SOC 2 Type II certification, implement end-to-end encryption, and conduct quarterly penetration testing. Our compliance framework covers GDPR, CCPA, and HIPAA requirements.|Our microservices architecture automatically scales based on demand. We use containerized deployments across multiple regions, with intelligent load balancing and auto-scaling. This ensures consistent performance whether you have 10 users or 10,000.' 
  },
  expert_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Michael Rodriguez|Dr. Emily Watson' 
  },
  expert_titles: { 
    type: 'string' as const, 
    default: 'VP of Engineering|Chief Security Officer|Head of Infrastructure' 
  }
};

export default function QuoteStyleAnswers(props: LayoutComponentProps) {
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
  } = useLayoutComponent<QuoteStyleAnswersContent>({
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
  const expertNames = blockContent.expert_names 
    ? blockContent.expert_names.split('|').map(n => n.trim()).filter(Boolean)
    : [];
  const expertTitles = blockContent.expert_titles 
    ? blockContent.expert_titles.split('|').map(t => t.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  const accentColor = colorTokens.ctaBg;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="QuoteStyleAnswers"
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
              placeholder="Add a supporting description..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Quote-style Q&As */}
        <div className="space-y-10">
          {questions.map((question, index) => (
            <div key={index} className="relative">
              {/* Question */}
              <h3 className={`text-xl font-semibold mb-4 ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                {question}
              </h3>
              
              {/* Quote Block */}
              <div className="relative pl-8 border-l-4" style={{ borderColor: accentColor }}>
                {/* Large Quote Icon */}
                <div 
                  className="absolute -left-4 -top-2 text-5xl opacity-20"
                  style={{ color: accentColor }}
                >
                  "
                </div>
                
                {/* Answer */}
                {answers[index] && (
                  <blockquote className={`text-lg leading-relaxed italic mb-4 ${mutedTextColor}`}>
                    {answers[index]}
                  </blockquote>
                )}
                
                {/* Expert Attribution */}
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: accentColor }}
                  >
                    {expertNames[index]?.charAt(0) || 'E'}
                  </div>
                  
                  <div>
                    <div className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}>
                      {expertNames[index] || 'Expert'}
                    </div>
                    <div className={`text-sm ${mutedTextColor}`}>
                      {expertTitles[index] || 'Senior Executive'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'QuoteStyleAnswers',
  category: 'FAQ Sections',
  description: 'Expert answers styled as quotes for authority and trust',
  tags: ['faq', 'quotes', 'expert', 'authority', 'luxury'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Section Description', type: 'textarea', required: false },
    { key: 'questions', label: 'Questions (pipe separated)', type: 'textarea', required: true },
    { key: 'answers', label: 'Expert Answers (pipe separated)', type: 'textarea', required: true },
    { key: 'expert_names', label: 'Expert Names (pipe separated)', type: 'text', required: true },
    { key: 'expert_titles', label: 'Expert Titles (pipe separated)', type: 'text', required: true }
  ],
  
  features: [
    'Quote-style formatting for authority',
    'Expert attribution with avatars',
    'Accent color borders and highlights',
    'Professional, luxury aesthetic',
    'Builds trust through expertise'
  ],
  
  useCases: [
    'Enterprise decision-maker FAQs',
    'High-value product explanations',
    'Executive-level concerns',
    'Trust-building for luxury brands',
    'Expert positioning content'
  ]
};