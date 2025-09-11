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
    default: 'Q1 2023|💡 The Idea|Sarah identifies the problem while managing her consulting business|Started with a simple spreadsheet and a big vision|Q2 2023|🚀 First Launch|Released MVP to 50 beta users|Processed our first $10K in transactions|Q3 2023|📈 Product-Market Fit|Reached 1,000 paying customers|Raised $2M seed round from top VCs|Q4 2023|🌍 Global Expansion|Launched in 15 countries|Hit $1M ARR milestone|Q1 2024|🎯 Today|Serving 10,000+ businesses|Processing $100M+ annually' 
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

// Smart badge display logic for different time period formats
const getBadgeDisplay = (period: string): string => {
  if (!period) return '??';
  
  // Check for quarters (Q1 2024, Q2 2024)
  if (period.match(/^Q\d/i)) {
    return period.substring(0, 2).toUpperCase(); // Shows "Q1", "Q2", etc.
  }
  
  // Check for months (Jan 2024, February 2024)
  const monthMatch = period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (monthMatch) {
    return monthMatch[1].substring(0, 3).toUpperCase(); // Shows "JAN", "FEB", etc.
  }
  
  // Check for phases (Phase 1, Stage 2)
  const phaseMatch = period.match(/^(Phase|Stage)\s+(\d+)/i);
  if (phaseMatch) {
    return `P${phaseMatch[2]}`; // Shows "P1", "P2", etc.
  }
  
  // Check for year only (2024)
  if (period.match(/^\d{4}$/)) {
    return period; // Show full year for clarity
  }
  
  // Check for year in format "2024" within longer string
  const yearMatch = period.match(/\d{4}/);
  if (yearMatch) {
    return yearMatch[0]; // Show full year
  }
  
  // Default: show first 3 characters
  return period.substring(0, 3).trim().toUpperCase();
};

// Get badge background color based on period type
const getBadgeColor = (period: string): string => {
  if (!period) return 'from-gray-400 to-gray-600';
  
  // Quarters - green
  if (period.match(/^Q\d/i)) {
    return 'from-green-500 to-emerald-600';
  }
  
  // Months - purple
  if (period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
    return 'from-purple-500 to-violet-600';
  }
  
  // Phases - orange
  if (period.match(/^(Phase|Stage)/i)) {
    return 'from-orange-500 to-amber-600';
  }
  
  // Default (years) - blue
  return 'from-blue-500 to-indigo-600';
};

// Timeline Item Component with WYSIWYG editing
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
  onYearEdit,
  onTitleEdit,
  onDescriptionEdit,
  onStatsEdit,
  onRemove,
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
  onYearEdit?: (index: number, value: string) => void;
  onTitleEdit?: (index: number, value: string) => void;
  onDescriptionEdit?: (index: number, value: string) => void;
  onStatsEdit?: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  index?: number;
  sectionId?: string;
  backgroundType?: string;
}) => (
  <div className="relative flex items-start space-x-6 pb-8">
    {/* Timeline line */}
    {!isLast && (
      <div className="absolute left-7 top-16 w-0.5 h-full bg-gradient-to-b from-blue-200 to-purple-200"></div>
    )}
    
    {/* Period badge with dynamic color */}
    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${getBadgeColor(year)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
      {getBadgeDisplay(year)}
    </div>
    
    {/* Content */}
    <div className="flex-1 min-w-0 bg-white rounded-lg shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200 relative group">
      {/* Remove button in edit mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={() => onRemove(index || 0)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          title="Remove timeline item"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl relative group/icon-edit">
            <IconEditableText
              mode={(mode || 'preview') as 'preview' | 'edit'}
              value={icon}
              onEdit={(value) => onIconEdit?.(index || 0, value)}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              iconSize="lg"
              className="text-2xl"
              sectionId={sectionId || 'timeline'}
              elementKey={`timeline_icon_${(index || 0) + 1}`}
            />
          </div>
          <div className="flex-1">
            {mode === 'edit' ? (
              <>
                <EditableAdaptiveText
                  mode={mode as 'edit' | 'preview'}
                  value={title}
                  onEdit={(value) => onTitleEdit?.(index || 0, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}
                  placeholder="Milestone title"
                  sectionId={sectionId || 'timeline'}
                  elementKey={`timeline_title_${(index || 0) + 1}`}
                  sectionBackground="bg-white"
                />
                <EditableAdaptiveText
                  mode={mode as 'edit' | 'preview'}
                  value={year}
                  onEdit={(value) => onYearEdit?.(index || 0, value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={{ fontSize: '0.875rem', fontWeight: '500', color: '#2563eb' }}
                  placeholder="Year"
                  sectionId={sectionId || 'timeline'}
                  elementKey={`timeline_year_${(index || 0) + 1}`}
                  sectionBackground="bg-white"
                />
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <span className="text-sm text-blue-600 font-medium">{year}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {mode === 'edit' ? (
        <EditableAdaptiveText
          mode={mode as 'edit' | 'preview'}
          value={description}
          onEdit={(value) => onDescriptionEdit?.(index || 0, value)}
          backgroundType="neutral"
          colorTokens={colorTokens}
          variant="body"
          textStyle={{ color: '#374151', lineHeight: '1.75', marginBottom: '0.75rem' }}
          placeholder="Milestone description"
          sectionId={sectionId || 'timeline'}
          elementKey={`timeline_description_${(index || 0) + 1}`}
          sectionBackground="bg-white"
        />
      ) : (
        <p className="text-gray-700 leading-relaxed mb-3">{description}</p>
      )}
      
      {(stats || mode === 'edit') && (
        <div className="bg-gray-50 rounded-md px-3 py-2">
          {mode === 'edit' ? (
            <EditableAdaptiveText
              mode={mode as 'edit' | 'preview'}
              value={stats || ''}
              onEdit={(value) => onStatsEdit?.(index || 0, value)}
              backgroundType="neutral"
              colorTokens={colorTokens}
              variant="body"
              textStyle={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563' }}
              placeholder="Achievement or stat (optional)"
              sectionId={sectionId || 'timeline'}
              elementKey={`timeline_stats_${(index || 0) + 1}`}
              sectionBackground="bg-gray-50"
            />
          ) : (
            <p className="text-sm font-medium text-gray-600">{stats}</p>
          )}
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

  // Handle individual timeline field editing
  const handleTimelineFieldEdit = (index: number, field: 'year' | 'title' | 'description' | 'stats', value: string) => {
    const items = blockContent.timeline_items.split('|');
    const itemStartIndex = index * 4;
    
    switch(field) {
      case 'year':
        items[itemStartIndex] = value;
        break;
      case 'title':
        // Preserve icon if it exists, update title
        const currentTitleParts = items[itemStartIndex + 1]?.split(' ') || [];
        const currentIcon = currentTitleParts[0] || '';
        items[itemStartIndex + 1] = `${currentIcon} ${value}`;
        break;
      case 'description':
        items[itemStartIndex + 2] = value;
        break;
      case 'stats':
        items[itemStartIndex + 3] = value;
        break;
    }
    
    handleContentUpdate('timeline_items', items.join('|'));
  };

  // Add new timeline item
  const handleAddTimelineItem = () => {
    const currentItems = blockContent.timeline_items || '';
    // Intelligently suggest next period based on existing items
    let suggestedPeriod = 'Q2 2024';
    const existingItems = currentItems.split('|');
    if (existingItems.length >= 4) {
      const lastPeriod = existingItems[existingItems.length - 4];
      // Try to increment based on pattern
      if (lastPeriod.match(/^Q(\d)/i)) {
        const quarter = parseInt(lastPeriod.match(/Q(\d)/i)?.[1] || '1');
        const year = lastPeriod.match(/\d{4}/)?.[0] || '2024';
        if (quarter < 4) {
          suggestedPeriod = `Q${quarter + 1} ${year}`;
        } else {
          suggestedPeriod = `Q1 ${parseInt(year) + 1}`;
        }
      } else if (lastPeriod.match(/^\d{4}$/)) {
        suggestedPeriod = String(parseInt(lastPeriod) + 1);
      }
    }
    const newItem = `${suggestedPeriod}|🆕 New Milestone|Describe your milestone|Key achievement`;
    const updatedItems = currentItems ? `${currentItems}|${newItem}` : newItem;
    handleContentUpdate('timeline_items', updatedItems);
  };

  // Remove timeline item
  const handleRemoveTimelineItem = (index: number) => {
    const items = blockContent.timeline_items.split('|');
    const itemStartIndex = index * 4;
    items.splice(itemStartIndex, 4);
    handleContentUpdate('timeline_items', items.join('|'));
  };

  // Parse timeline items from pipe-separated string
  const timelineData = blockContent.timeline_items 
    ? blockContent.timeline_items.split('|')
    : [];

  const timelineItems = [];
  for (let i = 0; i < timelineData.length; i += 4) {
    if (i + 3 < timelineData.length) {
      const itemIndex: number = timelineItems.length;
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
      mode={(mode || 'preview') as 'preview' | 'edit'}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={(mode || 'preview') as 'preview' | 'edit'}
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
            mode={(mode || 'preview') as 'preview' | 'edit'}
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

        {/* Timeline - WYSIWYG in both modes */}
        <div className="relative">
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
                mode={(mode || 'preview') as 'preview' | 'edit'}
                onIconEdit={handleTimelineIconEdit}
                onYearEdit={(idx, value) => handleTimelineFieldEdit(idx, 'year', value)}
                onTitleEdit={(idx, value) => handleTimelineFieldEdit(idx, 'title', value)}
                onDescriptionEdit={(idx, value) => handleTimelineFieldEdit(idx, 'description', value)}
                onStatsEdit={(idx, value) => handleTimelineFieldEdit(idx, 'stats', value)}
                onRemove={mode === 'edit' ? handleRemoveTimelineItem : undefined}
                index={item.index}
                sectionId={sectionId}
                backgroundType={backgroundType}
              />
            ))}
          </div>
          
          {/* Add button in edit mode */}
          {mode === 'edit' && (
            <div className="mt-8 text-center">
              <button
                onClick={handleAddTimelineItem}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                type="button"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Timeline Item
              </button>
            </div>
          )}
        </div>

        {/* Current State */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg relative group/icon-edit">
              {mode !== 'preview' ? (
                <IconEditableText
                  mode={(mode || 'preview') as 'preview' | 'edit'}
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
              mode={(mode || 'preview') as 'preview' | 'edit'}
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
              mode={(mode || 'preview') as 'preview' | 'edit'}
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
              {mode !== 'preview' ? (
                <EditableTrustIndicators
                  mode={(mode || 'preview') as 'preview' | 'edit'}
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
                    mode={(mode || 'preview') as 'preview' | 'edit'}
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
                    mode={(mode || 'preview') as 'preview' | 'edit'}
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