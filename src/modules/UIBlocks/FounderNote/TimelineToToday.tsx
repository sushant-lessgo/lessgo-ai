// components/FounderNote/TimelineToToday.tsx
// Company growth story timeline
// Builds trust through demonstrating progression and milestones

import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
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
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import IconEditableText from '@/components/ui/IconEditableText';
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
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  trust_item_4: string;
  trust_item_5: string;
  current_state_heading: string;
  // Individual timeline icon fields
  timeline_icon_1?: string;
  timeline_icon_2?: string;
  timeline_icon_3?: string;
  timeline_icon_4?: string;
  timeline_icon_5?: string;
  timeline_icon_6?: string;
  current_state_icon?: string;
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
  },
  trust_item_1: { type: 'string' as const, default: '10,000+ customers' },
  trust_item_2: { type: 'string' as const, default: '50+ countries' },
  trust_item_3: { type: 'string' as const, default: '$100M+ processed' },
  trust_item_4: { type: 'string' as const, default: '99.9% uptime' },
  trust_item_5: { type: 'string' as const, default: '' },
  current_state_heading: { type: 'string' as const, default: 'Where We Are Today' },
  // Individual timeline icon fields
  timeline_icon_1: { type: 'string' as const, default: '💡' },
  timeline_icon_2: { type: 'string' as const, default: '🚀' },
  timeline_icon_3: { type: 'string' as const, default: '📈' },
  timeline_icon_4: { type: 'string' as const, default: '🌍' },
  timeline_icon_5: { type: 'string' as const, default: '🎯' },
  timeline_icon_6: { type: 'string' as const, default: '✨' },
  current_state_icon: { type: 'string' as const, default: '🎯' }
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
  dynamicTextColors,
  mode,
  onIconEdit,
  index,
  sectionId,
  backgroundType
}: {
  year: string;
  icon: string;
  title: string;
  description: string;
  stats?: string;
  isLast: boolean;
  colorTokens: any;
  dynamicTextColors: any;
  mode?: string;
  onIconEdit?: (index: number, value: string) => void;
  index?: number;
  sectionId?: string;
  backgroundType?: string;
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
          <div className="text-2xl relative group/icon-edit">
            {mode === 'edit' ? (
              <IconEditableText
                mode={mode}
                value={icon}
                onEdit={(value) => onIconEdit?.(index || 0, value)}
                backgroundType={backgroundType as any}
                colorTokens={colorTokens}
                iconSize="lg"
                className="text-2xl"
                sectionId={sectionId || 'timeline'}
                elementKey={`timeline_icon_${(index || 0) + 1}`}
              />
            ) : (
              <span>{icon}</span>
            )}
          </div>
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
  
  const { getTextStyle: getTypographyStyle } = useTypography();

  // Get individual timeline icon fields
  const getTimelineIcon = (index: number): string => {
    const iconFields = ['timeline_icon_1', 'timeline_icon_2', 'timeline_icon_3', 'timeline_icon_4', 'timeline_icon_5', 'timeline_icon_6'];
    return blockContent[iconFields[index] as keyof TimelineToTodayContent] || '📅';
  };

  // Handle timeline icon editing
  const handleTimelineIconEdit = (index: number, value: string) => {
    const iconFields = ['timeline_icon_1', 'timeline_icon_2', 'timeline_icon_3', 'timeline_icon_4', 'timeline_icon_5', 'timeline_icon_6'];
    const fieldKey = iconFields[index] as keyof TimelineToTodayContent;
    handleContentUpdate(fieldKey, value);
  };

  // Parse timeline items from pipe-separated string
  const timelineData = blockContent.timeline_items 
    ? blockContent.timeline_items.split('|')
    : [];

  const timelineItems = [];
  for (let i = 0; i < timelineData.length; i += 4) {
    if (i + 3 < timelineData.length) {
      const itemIndex = timelineItems.length;
      const fallbackIcon = timelineData[i + 1]?.trim().split(' ')[0] || '📅';
      const icon = getTimelineIcon(itemIndex) || fallbackIcon;
      
      timelineItems.push({
        year: timelineData[i]?.trim() || '',
        icon: icon,
        title: timelineData[i + 1]?.split(' ').slice(1).join(' ') || 'Milestone',
        description: timelineData[i + 2]?.trim() || '',
        stats: timelineData[i + 3]?.trim() || '',
        index: itemIndex
      });
    }
  }

  // Helper function to get trust items with individual field support
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2,
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    // Legacy format fallback
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['10,000+ customers', '50+ countries'];
  };
  
  const trustItems = getTrustItems();

  // Get muted text color for trust indicators
  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="TimelineToToday"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="leading-tight mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          <EditableAdaptiveText
            mode={mode}
            value={blockContent.intro_text || ''}
            onEdit={(value) => handleContentUpdate('intro_text', value)}
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            variant="body"
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
                value={blockContent.timeline_items || ''}
                onEdit={(value) => handleContentUpdate('timeline_items', value)}
                backgroundType="neutral"
                colorTokens={colorTokens}
                variant="body"
                textStyle={{ color: '#374151', fontSize: '0.875rem' }}
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
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  stats={item.stats}
                  isLast={index === timelineItems.length - 1}
                  colorTokens={colorTokens}
                  dynamicTextColors={dynamicTextColors}
                  mode={mode}
                  onIconEdit={handleTimelineIconEdit}
                  index={item.index}
                  sectionId={sectionId}
                  backgroundType={backgroundType}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current State */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg relative group/icon-edit">
              {mode === 'edit' ? (
                <IconEditableText
                  mode={mode}
                  value={blockContent.current_state_icon || '🎯'}
                  onEdit={(value) => handleContentUpdate('current_state_icon', value)}
                  backgroundType={'primary' as any}
                  colorTokens={colorTokens}
                  iconSize="xl"
                  className="text-2xl text-white"
                  sectionId={sectionId}
                  elementKey="current_state_icon"
                />
              ) : (
                blockContent.current_state_icon || '🎯'
              )}
            </div>
            
            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.current_state_heading || ''}
              onEdit={(value) => handleContentUpdate('current_state_heading', value)}
              level="h3"
              backgroundType="neutral"
              colorTokens={colorTokens}
              textStyle={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}
              placeholder="Where We Are Today"
              sectionId={sectionId}
              elementKey="current_state_heading"
              sectionBackground="bg-blue-50"
            />
            
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.current_milestone || ''}
              onEdit={(value) => handleContentUpdate('current_milestone', value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              textStyle={{ color: '#374151', lineHeight: '1.625', marginBottom: '1.5rem' }}
              placeholder="Describe your current achievements and future vision..."
              sectionId={sectionId}
              elementKey="current_milestone"
              sectionBackground="bg-blue-50"
            />

            {/* Stats Grid */}
            <div className="mb-8">
              {mode === 'edit' ? (
                <EditableTrustIndicators
                  mode={mode}
                  trustItems={[
                    blockContent.trust_item_1 || '',
                    blockContent.trust_item_2 || '',
                    blockContent.trust_item_3 || '',
                    blockContent.trust_item_4 || '',
                    blockContent.trust_item_5 || ''
                  ]}
                  onTrustItemChange={(index, value) => {
                    const fieldKey = `trust_item_${index + 1}` as keyof TimelineToTodayContent;
                    handleContentUpdate(fieldKey, value);
                  }}
                  onAddTrustItem={() => {
                    const emptyIndex = [
                      blockContent.trust_item_1,
                      blockContent.trust_item_2,
                      blockContent.trust_item_3,
                      blockContent.trust_item_4,
                      blockContent.trust_item_5
                    ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                    
                    if (emptyIndex !== -1) {
                      const fieldKey = `trust_item_${emptyIndex + 1}` as keyof TimelineToTodayContent;
                      handleContentUpdate(fieldKey, 'New trust item');
                    }
                  }}
                  onRemoveTrustItem={(index) => {
                    const fieldKey = `trust_item_${index + 1}` as keyof TimelineToTodayContent;
                    handleContentUpdate(fieldKey, '___REMOVED___');
                  }}
                  colorTokens={colorTokens}
                  sectionBackground="bg-blue-50"
                  sectionId={sectionId}
                  backgroundType="neutral"
                  iconColor="text-green-500"
                  colorClass="text-gray-600"
                  showAddButton={true}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              )}
            </div>

            {/* CTA */}
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
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
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{ fontWeight: '600', color: '#111827' }}
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
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    textStyle={{ fontSize: '0.875rem', color: '#4B5563' }}
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