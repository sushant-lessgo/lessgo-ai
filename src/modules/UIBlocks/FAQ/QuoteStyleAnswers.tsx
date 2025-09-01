import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface QuoteStyleAnswersContent {
  headline: string;
  subheadline?: string;
  // Individual Q&A fields (up to 3 items)
  question_1: string;
  answer_1: string;
  expert_name_1: string;
  expert_title_1: string;
  question_2: string;
  answer_2: string;
  expert_name_2: string;
  expert_title_2: string;
  question_3: string;
  answer_3: string;
  expert_name_3: string;
  expert_title_3: string;
  // Customization
  show_quote_mark?: boolean;
  quote_icon?: string;
  // Legacy fields for backward compatibility
  questions?: string;
  answers?: string;
  expert_names?: string;
  expert_titles?: string;
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
  // Individual Q&A fields
  question_1: { type: 'string' as const, default: 'What makes your solution enterprise-ready?' },
  answer_1: { type: 'string' as const, default: 'We\'ve built our platform from the ground up with enterprise requirements in mind. This includes role-based access control, audit logs, SSO integration, and dedicated infrastructure options. Our architecture supports millions of transactions daily with sub-second response times.' },
  expert_name_1: { type: 'string' as const, default: 'Sarah Chen' },
  expert_title_1: { type: 'string' as const, default: 'VP of Engineering' },
  question_2: { type: 'string' as const, default: 'How do you ensure data security and compliance?' },
  answer_2: { type: 'string' as const, default: 'Security isn\'t an afterthought—it\'s fundamental to our design. We maintain SOC 2 Type II certification, implement end-to-end encryption, and conduct quarterly penetration testing. Our compliance framework covers GDPR, CCPA, and HIPAA requirements.' },
  expert_name_2: { type: 'string' as const, default: 'Michael Rodriguez' },
  expert_title_2: { type: 'string' as const, default: 'Chief Security Officer' },
  question_3: { type: 'string' as const, default: 'What\'s your approach to scalability?' },
  answer_3: { type: 'string' as const, default: 'Our microservices architecture automatically scales based on demand. We use containerized deployments across multiple regions, with intelligent load balancing and auto-scaling. This ensures consistent performance whether you have 10 users or 10,000.' },
  expert_name_3: { type: 'string' as const, default: 'Dr. Emily Watson' },
  expert_title_3: { type: 'string' as const, default: 'Head of Infrastructure' },
  // Customization
  show_quote_mark: { type: 'boolean' as const, default: true },
  quote_icon: { type: 'string' as const, default: '💬' },
  // Legacy fields for backward compatibility
  questions: { type: 'string' as const, default: '' },
  answers: { type: 'string' as const, default: '' },
  expert_names: { type: 'string' as const, default: '' },
  expert_titles: { type: 'string' as const, default: '' }
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

  // Helper function to get FAQ items with expert info
  const getFAQItems = () => {
    const items = [];
    
    // Check individual fields first (preferred)
    for (let i = 1; i <= 3; i++) {
      const questionKey = `question_${i}` as keyof QuoteStyleAnswersContent;
      const answerKey = `answer_${i}` as keyof QuoteStyleAnswersContent;
      const nameKey = `expert_name_${i}` as keyof QuoteStyleAnswersContent;
      const titleKey = `expert_title_${i}` as keyof QuoteStyleAnswersContent;
      
      const question = blockContent[questionKey];
      const answer = blockContent[answerKey];
      const expertName = blockContent[nameKey];
      const expertTitle = blockContent[titleKey];
      
      if (question && typeof question === 'string' && question.trim() !== '' && question !== '___REMOVED___') {
        items.push({
          question: question.trim(),
          answer: (answer && typeof answer === 'string' && answer !== '___REMOVED___') ? answer.trim() : '',
          expertName: (expertName && typeof expertName === 'string' && expertName !== '___REMOVED___') ? expertName.trim() : 'Expert',
          expertTitle: (expertTitle && typeof expertTitle === 'string' && expertTitle !== '___REMOVED___') ? expertTitle.trim() : 'Senior Executive',
          index: i
        });
      }
    }
    
    // Fallback to legacy format if no individual items found
    if (items.length === 0 && blockContent.questions) {
      const questions = blockContent.questions.split('|').map(q => q.trim()).filter(Boolean);
      const answers = blockContent.answers?.split('|').map(a => a.trim()).filter(Boolean) || [];
      const expertNames = blockContent.expert_names?.split('|').map(n => n.trim()).filter(Boolean) || [];
      const expertTitles = blockContent.expert_titles?.split('|').map(t => t.trim()).filter(Boolean) || [];
      
      questions.forEach((question, index) => {
        items.push({
          question,
          answer: answers[index] || '',
          expertName: expertNames[index] || 'Expert',
          expertTitle: expertTitles[index] || 'Senior Executive',
          index: index + 1
        });
      });
    }
    
    return items;
  };
  
  const faqItems = getFAQItems();

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
          
          {(blockContent.subheadline || mode !== 'preview') && (
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
              placeholder="Add a supporting description..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Quote-style Q&As */}
        <div className="space-y-10">
          {faqItems.map((item) => (
            <div key={item.index} className="relative group/quote-item">
              {/* Question */}
              <div className="mb-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={item.question}
                  onEdit={(value) => handleContentUpdate(`question_${item.index}` as keyof QuoteStyleAnswersContent, value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                  style={getTextStyle('h2')}
                  placeholder={`Question ${item.index}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`question_${item.index}`}
                />
              </div>
              
              {/* Quote Block */}
              <div className="relative pl-8 border-l-4" style={{ borderColor: accentColor }}>
                {/* Large Quote Icon */}
                {blockContent.show_quote_mark !== false && (
                  <div className="absolute -left-4 -top-2 opacity-30">
                    <IconEditableText
                      mode={mode}
                      value={blockContent.quote_icon || '💬'}
                      onEdit={(value) => handleContentUpdate('quote_icon', value)}
                      backgroundType={backgroundType as any}
                      colorTokens={{
                        ...colorTokens,
                        textPrimary: accentColor,
                        textOnDark: accentColor
                      }}
                      iconSize="xl"
                      className="text-5xl"
                      style={{ color: accentColor }}
                      sectionId={sectionId}
                      elementKey={`quote_icon_${item.index}`}
                    />
                  </div>
                )}
                
                {/* Answer */}
                {(item.answer || mode !== 'preview') && (
                  <blockquote className="mb-4">
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.answer}
                      onEdit={(value) => handleContentUpdate(`answer_${item.index}` as keyof QuoteStyleAnswersContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`leading-relaxed italic ${mutedTextColor}`}
                      style={getTextStyle('body-lg')}
                      placeholder={`Expert answer ${item.index}...`}
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`answer_${item.index}`}
                    />
                  </blockquote>
                )}
                
                {/* Expert Attribution */}
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: accentColor }}
                  >
                    {item.expertName?.charAt(0) || 'E'}
                  </div>
                  
                  <div>
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.expertName}
                      onEdit={(value) => handleContentUpdate(`expert_name_${item.index}` as keyof QuoteStyleAnswersContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`font-semibold ${dynamicTextColors?.heading || colorTokens.textPrimary}`}
                      placeholder="Expert Name"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`expert_name_${item.index}`}
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={item.expertTitle}
                      onEdit={(value) => handleContentUpdate(`expert_title_${item.index}` as keyof QuoteStyleAnswersContent, value)}
                      backgroundType={backgroundType}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Expert Title"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key={`expert_title_${item.index}`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Remove button */}
              {mode !== 'preview' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentUpdate(`question_${item.index}` as keyof QuoteStyleAnswersContent, '___REMOVED___');
                    handleContentUpdate(`answer_${item.index}` as keyof QuoteStyleAnswersContent, '___REMOVED___');
                    handleContentUpdate(`expert_name_${item.index}` as keyof QuoteStyleAnswersContent, '___REMOVED___');
                    handleContentUpdate(`expert_title_${item.index}` as keyof QuoteStyleAnswersContent, '___REMOVED___');
                  }}
                  className="opacity-0 group-hover/quote-item:opacity-100 absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm z-10"
                  title="Remove this expert quote"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {/* Add new expert quote button */}
          {mode !== 'preview' && faqItems.length < 3 && (
            <button
              onClick={() => {
                // Find the first empty slot
                for (let i = 1; i <= 3; i++) {
                  const questionKey = `question_${i}` as keyof QuoteStyleAnswersContent;
                  if (!blockContent[questionKey] || blockContent[questionKey] === '' || blockContent[questionKey] === '___REMOVED___') {
                    handleContentUpdate(questionKey, 'New question');
                    handleContentUpdate(`answer_${i}` as keyof QuoteStyleAnswersContent, 'New expert answer');
                    handleContentUpdate(`expert_name_${i}` as keyof QuoteStyleAnswersContent, 'Expert Name');
                    handleContentUpdate(`expert_title_${i}` as keyof QuoteStyleAnswersContent, 'Expert Title');
                    break;
                  }
                }
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-6 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add expert quote</span>
            </button>
          )}
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