// components/FounderNote/TimelineToToday.tsx
// Company growth story timeline
// Builds trust through demonstrating progression and milestones

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface TimelineToTodayContent {
  headline: string;
  intro_text: string;
  timeline_items: string;
  current_milestone: string;
  cta_text: string;
  founder_name?: string;
  company_name?: string;
  trust_items?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Our Journey: From Idea to Impact' 
  },
  intro_text: { 
    type: 'string' as const, 
    default: 'What started as a simple frustration in my garage has grown into a platform that serves thousands of businesses worldwide. Here\'s how we got here.' 
  },
  timeline_items: { 
    type: 'string' as const, 
    default: '2020|💡 The Idea|Sarah identifies the problem while managing her consulting business|Started with a simple spreadsheet and a big vision|2021|🚀 First Launch|Released MVP to 50 beta users|Processed our first $10K in transactions|2022|📈 Product-Market Fit|Reached 1,000 paying customers|Raised $2M seed round from top VCs|2023|🌍 Global Expansion|Launched in 15 countries|Hit $1M ARR milestone|2024|🎯 Today|Serving 10,000+ businesses|Processing $100M+ annually' 
  },
  current_milestone: { 
    type: 'string' as const, 
    default: 'Today, we\'re proud to serve over 10,000 businesses across 50+ countries. But this is just the beginning. Our mission is to empower every entrepreneur with the tools they need to build something amazing.' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Join Our Story' 
  },
  founder_name: { 
    type: 'string' as const, 
    default: 'Sarah Chen' 
  },
  company_name: { 
    type: 'string' as const, 
    default: 'YourCompany' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '10,000+ customers|50+ countries|$100M+ processed|99.9% uptime' 
  }
};

// Timeline Item Component
const TimelineItem = React.memo(({ 
  year, 
  icon, 
  title, 
  description, 
  stats, 
  isLast, 
  colorTokens,
  dynamicTextColors 
}: {
  year: string;
  icon: string;
  title: string;
  description: string;
  stats?: string;
  isLast: boolean;
  colorTokens: any;
  dynamicTextColors: any;
}) => (
  <div className="relative flex items-start space-x-6 pb-8">
    {/* Timeline line */}
    {!isLast && (
      <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-blue-200 to-purple-200"></div>
    )}
    
    {/* Year badge */}
    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
      {year.slice(-2)}
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0 bg-white rounded-lg shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-blue-600 font-medium">{year}</span>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed mb-3">{description}</p>
      
      {stats && (
        <div className="bg-gray-50 rounded-md px-3 py-2">
          <p className="text-sm font-medium text-gray-600">{stats}</p>
        </div>
      )}
    </div>
  </div>
));
TimelineItem.displayName = 'TimelineItem';

export default function TimelineToToday(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
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
  } = useLayoutComponent<TimelineToTodayContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse timeline items from pipe-separated string
  const timelineData = blockContent.timeline_items 
    ? blockContent.timeline_items.split('|')
    : [];

  const timelineItems = [];
  for (let i = 0; i < timelineData.length; i += 4) {
    if (i + 3 < timelineData.length) {
      timelineItems.push({
        year: timelineData[i]?.trim() || '',
        icon: timelineData[i + 1]?.trim() || '📅',
        title: timelineData[i + 1]?.split(' ').slice(1).join(' ') || 'Milestone',
        description: timelineData[i + 2]?.trim() || '',
        stats: timelineData[i + 3]?.trim() || ''
      });
    }
  }

  // Parse trust indicators from pipe-separated string
  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Growing fast', 'Trusted globally'];

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TimelineToToday"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
            className="leading-tight mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          <EditableAdaptiveText
            mode={mode}
            value={blockContent.intro_text}
            onEdit={(value) => handleContentUpdate('intro_text', value)}
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            variant="body"
            textStyle={getTextStyle('body-lg')}
            className="leading-relaxed max-w-2xl mx-auto"
            placeholder="Introduce your company's journey and growth story..."
            sectionId={sectionId}
            elementKey="intro_text"
            sectionBackground={sectionBackground}
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          {mode === 'edit' ? (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Timeline Items</h4>
              <p className="text-sm text-gray-600 mb-3">
                Format: Year|Icon Title|Description|Stats (repeat for each milestone)
              </p>
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.timeline_items}
                onEdit={(value) => handleContentUpdate('timeline_items', value)}
                backgroundType="white"
                colorTokens={colorTokens}
                variant="body"
                textStyle="text-gray-700 text-sm"
                placeholder="2020|💡 The Idea|Started with a problem|First prototype|2021|🚀 Launch|Released to users|1000 users..."
                sectionId={sectionId}
                elementKey="timeline_items"
                sectionBackground="bg-gray-50"
              />
            </div>
          ) : (
            <div className="space-y-0">
              {timelineItems.map((item, index) => (
                <TimelineItem
                  key={index}
                  year={item.year}
                  icon={item.icon.split(' ')[0]}
                  title={item.title}
                  description={item.description}
                  stats={item.stats}
                  isLast={index === timelineItems.length - 1}
                  colorTokens={colorTokens}
                  dynamicTextColors={dynamicTextColors}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current State */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
              🎯
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Where We Are Today</h3>
            
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.current_milestone}
              onEdit={(value) => handleContentUpdate('current_milestone', value)}
              backgroundType="white"
              colorTokens={colorTokens}
              variant="body"
              textStyle="text-gray-700 leading-relaxed mb-6"
              placeholder="Describe your current achievements and future vision..."
              sectionId={sectionId}
              elementKey="current_milestone"
              sectionBackground="bg-blue-50"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {trustItems.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {item.split(' ')[0]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              textStyle={getTextStyle('body-lg')}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />

            {/* Founder Attribution */}
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {blockContent.founder_name?.charAt(0) || 'F'}
                </div>
                <div className="text-left">
                  <EditableAdaptiveText
                    mode={mode}
                    value={blockContent.founder_name || ''}
                    onEdit={(value) => handleContentUpdate('founder_name', value)}
                    backgroundType="white"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle="font-semibold text-gray-900"
                    placeholder="Founder Name"
                    sectionId={sectionId}
                    elementKey="founder_name"
                    sectionBackground="bg-blue-50"
                  />
                  <EditableAdaptiveText
                    mode={mode}
                    value={`Founder, ${blockContent.company_name || 'Company'}`}
                    onEdit={(value) => {
                      const name = value.replace('Founder, ', '');
                      handleContentUpdate('company_name', name);
                    }}
                    backgroundType="white"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle="text-sm text-gray-600"
                    placeholder="Company Name"
                    sectionId={sectionId}
                    elementKey="company_name"
                    sectionBackground="bg-blue-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'TimelineToToday',
  category: 'Founder Note',
  description: 'Company growth story timeline showing progression from idea to current success.',
  tags: ['founder', 'timeline', 'growth', 'milestones', 'journey', 'progress'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'intro_text', label: 'Introduction Text', type: 'textarea', required: true },
    { key: 'timeline_items', label: 'Timeline Items (Year|Icon Title|Description|Stats - repeat)', type: 'textarea', required: true },
    { key: 'current_milestone', label: 'Current State Description', type: 'textarea', required: true },
    { key: 'founder_name', label: 'Founder Name', type: 'text', required: false },
    { key: 'company_name', label: 'Company Name', type: 'text', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'trust_items', label: 'Current Stats (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Visual timeline with year badges and connecting lines',
    'Milestone cards with icons and descriptions',
    'Current state highlight section',
    'Statistics grid showing current metrics',
    'Founder attribution and company branding',
    'Progressive disclosure of company growth'
  ],
  
  useCases: [
    'Established companies showing growth trajectory',
    'Startup funding pages demonstrating traction',
    'About pages telling company origin story',
    'Investor presentations showing milestones',
    'Team pages building credibility through progress',
    'Annual report summaries for stakeholders'
  ]
};