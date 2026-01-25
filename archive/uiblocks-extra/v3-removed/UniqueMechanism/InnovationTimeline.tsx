import React, { useEffect } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getIconFromCategory, getRandomIconFromCategory } from '@/utils/iconMapping';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface InnovationTimelineContent {
  headline: string;
  timeline_subtitle?: string;
  timeline_dates: string;
  timeline_events: string;
  timeline_descriptions: string;
  timeline_icon_1?: string;
  timeline_icon_2?: string;
  timeline_icon_3?: string;
  timeline_icon_4?: string;
  timeline_icon_5?: string;
  timeline_icon_6?: string;
  timeline_icon_7?: string;
}

interface TimelineItem {
  date: string;
  event: string;
  description: string;
  id: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Innovation Timeline' },
  timeline_subtitle: { type: 'string' as const, default: '' },
  timeline_dates: { type: 'string' as const, default: '2020|2021|2022|2023|2024' },
  timeline_events: { type: 'string' as const, default: 'Initial Research|First Prototype|Beta Testing|Market Launch|AI Integration' },
  timeline_descriptions: { type: 'string' as const, default: 'Started fundamental research into breakthrough technology|Built first working prototype demonstrating core concepts|Conducted extensive testing with select customers|Officially launched product to the market|Integrated advanced AI capabilities for enhanced performance' },
  timeline_icon_1: { type: 'string' as const, default: '🔬' },
  timeline_icon_2: { type: 'string' as const, default: '🔧' },
  timeline_icon_3: { type: 'string' as const, default: '🧪' },
  timeline_icon_4: { type: 'string' as const, default: '🚀' },
  timeline_icon_5: { type: 'string' as const, default: '🤖' },
  timeline_icon_6: { type: 'string' as const, default: '🌍' },
  timeline_icon_7: { type: 'string' as const, default: '💡' }
};

const parseTimelineData = (dates: string, events: string, descriptions: string): TimelineItem[] => {
  const dateList = dates.split('|').map(d => d.trim()).filter(d => d);
  const eventList = events.split('|').map(e => e.trim()).filter(e => e);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  return dateList.map((date, index) => ({
    id: `timeline-${index}`,
    date,
    event: eventList[index] || 'Event not provided',
    description: descriptionList[index] || 'Description not provided.'
  }));
};

const getTimelineIcon = (blockContent: InnovationTimelineContent, index: number) => {
  const iconFields = [
    blockContent.timeline_icon_1,
    blockContent.timeline_icon_2,
    blockContent.timeline_icon_3,
    blockContent.timeline_icon_4,
    blockContent.timeline_icon_5,
    blockContent.timeline_icon_6,
    blockContent.timeline_icon_7
  ];
  return iconFields[index] || '📅';
};

const addTimelineItem = (dates: string, events: string, descriptions: string): {
  newDates: string;
  newEvents: string;
  newDescriptions: string;
} => {
  const dateList = dates.split('|').map(d => d.trim()).filter(d => d);
  const eventList = events.split('|').map(e => e.trim()).filter(e => e);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  const currentYear = new Date().getFullYear();
  dateList.push(`${currentYear + dateList.length}`);
  eventList.push('New Milestone');
  descriptionList.push('Describe this innovation milestone.');

  return {
    newDates: dateList.join('|'),
    newEvents: eventList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const removeTimelineItem = (dates: string, events: string, descriptions: string, indexToRemove: number): {
  newDates: string;
  newEvents: string;
  newDescriptions: string;
} => {
  const dateList = dates.split('|').map(d => d.trim()).filter(d => d);
  const eventList = events.split('|').map(e => e.trim()).filter(e => e);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);

  if (indexToRemove >= 0 && indexToRemove < dateList.length) {
    dateList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < eventList.length) {
    eventList.splice(indexToRemove, 1);
  }
  if (indexToRemove >= 0 && indexToRemove < descriptionList.length) {
    descriptionList.splice(indexToRemove, 1);
  }

  return {
    newDates: dateList.join('|'),
    newEvents: eventList.join('|'),
    newDescriptions: descriptionList.join('|')
  };
};

const TimelineCard = ({
  timelineItem,
  index,
  mode,
  sectionId,
  onDateEdit,
  onEventEdit,
  onDescriptionEdit,
  onRemoveItem,
  blockContent,
  colorTokens,
  handleContentUpdate,
  canRemove = true,
  sectionBackground,
  isLast = false,
  timelineColors
}: {
  timelineItem: TimelineItem;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onDateEdit: (index: number, value: string) => void;
  onEventEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemoveItem?: (index: number) => void;
  blockContent: InnovationTimelineContent;
  colorTokens: any;
  handleContentUpdate: (field: keyof InnovationTimelineContent, value: string) => void;
  canRemove?: boolean;
  sectionBackground?: string;
  isLast?: boolean;
  timelineColors: {
    timelineLine: string;
    iconBg: string;
    dateBadgeBg: string;
    dateBadgeText: string;
    dateBadgeHover: string;
    cardBorderHover: string;
    addButtonBg: string;
    focusRing: string;
  };
}) => {
  const { getTextStyle } = useTypography();

  return (
    <div className="group/timeline-item relative flex items-start space-x-6">
      {/* Timeline Line */}
      {!isLast && (
        <div className={`absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b ${timelineColors.timelineLine} to-transparent`}></div>
      )}

      {/* Timeline Icon Circle */}
      <div className={`w-12 h-12 bg-gradient-to-br ${timelineColors.iconBg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg z-10`}>
        <IconEditableText
          mode={mode}
          value={getTimelineIcon(blockContent, index)}
          onEdit={(value) => {
            const iconField = `timeline_icon_${index + 1}` as keyof InnovationTimelineContent;
            handleContentUpdate(iconField, value);
          }}
          backgroundType="primary"
          colorTokens={colorTokens}
          iconSize="sm"
          className="text-white"
          sectionId={sectionId}
          elementKey={`timeline_icon_${index + 1}`}
        />
      </div>

      {/* Timeline Card */}
      <div className={`bg-white p-6 rounded-lg border border-gray-200 ${timelineColors.cardBorderHover} hover:shadow-lg transition-all duration-300 flex-1 relative`}>
        <div className="flex items-center gap-4 mb-3">
          <div className={`${timelineColors.dateBadgeBg} ${timelineColors.dateBadgeText} px-3 py-1 rounded-full font-semibold text-sm`}>
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDateEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 ${timelineColors.focusRing} focus:ring-opacity-50 rounded px-1 cursor-text ${timelineColors.dateBadgeHover}`}
              >
                {timelineItem.date}
              </div>
            ) : (
              <span>{timelineItem.date}</span>
            )}
          </div>
        </div>

        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onEventEdit(index, e.currentTarget.textContent || '')}
            className={`outline-none focus:ring-2 ${timelineColors.focusRing} focus:ring-opacity-50 rounded px-1 mb-2 cursor-text hover:bg-gray-50 font-bold text-gray-900 text-lg`}
          >
            {timelineItem.event}
          </div>
        ) : (
          <h3 className="font-bold text-gray-900 text-lg mb-2">{timelineItem.event}</h3>
        )}

        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
            className={`outline-none focus:ring-2 ${timelineColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[48px] cursor-text hover:bg-gray-50 text-gray-600`}
          >
            {timelineItem.description}
          </div>
        ) : (
          <p className="text-gray-600">{timelineItem.description}</p>
        )}

        {mode === 'edit' && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem?.(index);
            }}
            className="opacity-0 group-hover/timeline-item:opacity-100 absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this timeline item"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default function InnovationTimeline(props: LayoutComponentProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<InnovationTimelineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const { getTextStyle: getTypographyStyle } = useTypography();
  const store = useEditStore();
  const onboardingStore = useOnboardingStore();

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getTimelineColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        timelineLine: 'from-orange-400',
        iconBg: 'from-orange-500 to-orange-600',
        dateBadgeBg: 'bg-orange-100',
        dateBadgeText: 'text-orange-800',
        dateBadgeHover: 'hover:bg-orange-200',
        cardBorderHover: 'hover:border-orange-300',
        addButtonBg: 'bg-orange-600 hover:bg-orange-700',
        focusRing: 'focus:ring-orange-500'
      },
      cool: {
        timelineLine: 'from-blue-400',
        iconBg: 'from-blue-500 to-blue-600',
        dateBadgeBg: 'bg-blue-100',
        dateBadgeText: 'text-blue-800',
        dateBadgeHover: 'hover:bg-blue-200',
        cardBorderHover: 'hover:border-blue-300',
        addButtonBg: 'bg-blue-600 hover:bg-blue-700',
        focusRing: 'focus:ring-blue-500'
      },
      neutral: {
        timelineLine: 'from-gray-400',
        iconBg: 'from-gray-500 to-gray-600',
        dateBadgeBg: 'bg-gray-100',
        dateBadgeText: 'text-gray-800',
        dateBadgeHover: 'hover:bg-gray-200',
        cardBorderHover: 'hover:border-gray-400',
        addButtonBg: 'bg-gray-600 hover:bg-gray-700',
        focusRing: 'focus:ring-gray-500'
      }
    }[theme];
  };

  const timelineColors = getTimelineColors(uiTheme);

  // Auto-populate icons on initial generation
  useEffect(() => {
    if (mode === 'edit' && blockContent.timeline_dates) {
      const timelineItems = parseTimelineData(
        blockContent.timeline_dates,
        blockContent.timeline_events,
        blockContent.timeline_descriptions
      );

      timelineItems.forEach((_, index) => {
        const iconField = `timeline_icon_${index + 1}` as keyof InnovationTimelineContent;
        if (!blockContent[iconField] || blockContent[iconField] === '') {
          const categories = ['innovation', 'technology', 'growth', 'success', 'advanced', 'cutting_edge'];
          const icon = getRandomIconFromCategory(categories[index % categories.length]);
          handleContentUpdate(iconField, icon);
        }
      });
    }
  }, [blockContent.timeline_dates]);

  const timelineItems = parseTimelineData(
    blockContent.timeline_dates || '',
    blockContent.timeline_events || '',
    blockContent.timeline_descriptions || ''
  );

  const handleDateEdit = (index: number, newDate: string) => {
    const dates = (blockContent.timeline_dates || '').split('|').map(d => d.trim());
    dates[index] = newDate;
    handleContentUpdate('timeline_dates', dates.join('|'));
  };

  const handleEventEdit = (index: number, newEvent: string) => {
    const events = (blockContent.timeline_events || '').split('|').map(e => e.trim());
    events[index] = newEvent;
    handleContentUpdate('timeline_events', events.join('|'));
  };

  const handleDescriptionEdit = (index: number, newDescription: string) => {
    const descriptions = (blockContent.timeline_descriptions || '').split('|').map(d => d.trim());
    descriptions[index] = newDescription;
    handleContentUpdate('timeline_descriptions', descriptions.join('|'));
  };

  const handleAddItem = () => {
    const { newDates, newEvents, newDescriptions } = addTimelineItem(
      blockContent.timeline_dates || '',
      blockContent.timeline_events || '',
      blockContent.timeline_descriptions || ''
    );
    handleContentUpdate('timeline_dates', newDates);
    handleContentUpdate('timeline_events', newEvents);
    handleContentUpdate('timeline_descriptions', newDescriptions);
  };

  const handleRemoveItem = (index: number) => {
    const { newDates, newEvents, newDescriptions } = removeTimelineItem(
      blockContent.timeline_dates || '',
      blockContent.timeline_events || '',
      blockContent.timeline_descriptions || '',
      index
    );
    handleContentUpdate('timeline_dates', newDates);
    handleContentUpdate('timeline_events', newEvents);
    handleContentUpdate('timeline_descriptions', newDescriptions);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InnovationTimeline"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
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

          {blockContent.timeline_subtitle && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.timeline_subtitle}
              onEdit={(value) => handleContentUpdate('timeline_subtitle', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="timeline_subtitle"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        <div className="space-y-8">
          {timelineItems.map((timelineItem, index) => (
            <TimelineCard
              key={timelineItem.id}
              timelineItem={timelineItem}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onDateEdit={handleDateEdit}
              onEventEdit={handleEventEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemoveItem={handleRemoveItem}
              blockContent={blockContent}
              colorTokens={colorTokens}
              handleContentUpdate={handleContentUpdate}
              canRemove={timelineItems.length > 3}
              sectionBackground={sectionBackground}
              isLast={index === timelineItems.length - 1}
              timelineColors={timelineColors}
            />
          ))}
        </div>

        {mode === 'edit' && timelineItems.length < 7 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddItem}
              className={`inline-flex items-center gap-2 px-6 py-3 ${timelineColors.addButtonBg} text-white rounded-lg transition-colors duration-200`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Timeline Item
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'InnovationTimeline',
  category: 'Unique Mechanism',
  description: 'Showcase your innovation journey through a dynamic timeline',
  defaultBackgroundType: 'primary' as const
};