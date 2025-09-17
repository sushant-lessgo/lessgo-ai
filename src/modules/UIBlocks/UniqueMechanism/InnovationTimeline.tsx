// components/layout/InnovationTimeline.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InnovationTimelineContent {
  headline: string;
  timeline_items: string; // Legacy format for backward compatibility
  timeline_item_1?: string;
  timeline_item_2?: string;
  timeline_item_3?: string;
  timeline_item_4?: string;
  timeline_item_5?: string;
  timeline_item_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Innovation Timeline' },
  timeline_items: { type: 'string' as const, default: '2020: Initial Research|2021: First Prototype|2022: Beta Testing|2023: Market Launch|2024: AI Integration|2025: Global Expansion' },
  timeline_item_1: { type: 'string' as const, default: '2020: Initial Research' },
  timeline_item_2: { type: 'string' as const, default: '2021: First Prototype' },
  timeline_item_3: { type: 'string' as const, default: '2022: Beta Testing' },
  timeline_item_4: { type: 'string' as const, default: '2023: Market Launch' },
  timeline_item_5: { type: 'string' as const, default: '2024: AI Integration' },
  timeline_item_6: { type: 'string' as const, default: '2025: Global Expansion' }
};

// Parse timeline data from individual fields
const parseTimelineData = (blockContent: InnovationTimelineContent): { item: string; id: string }[] => {
  const individualItems = [
    blockContent.timeline_item_1,
    blockContent.timeline_item_2,
    blockContent.timeline_item_3,
    blockContent.timeline_item_4,
    blockContent.timeline_item_5,
    blockContent.timeline_item_6
  ].map((item, index) => ({
    item: item || '',
    id: `timeline-${index}`
  })).filter(timelineItem =>
    timelineItem.item &&
    timelineItem.item.trim() !== '' &&
    timelineItem.item !== '___REMOVED___'
  );

  // Fallback to legacy format if no individual items
  if (individualItems.length === 0 && blockContent.timeline_items) {
    return blockContent.timeline_items
      .split('|')
      .map((item, index) => ({
        item: item.trim(),
        id: `timeline-legacy-${index}`
      }))
      .filter(timelineItem => timelineItem.item);
  }

  return individualItems;
};


// Individual Timeline Card Component
const TimelineCard = ({
  timelineItem,
  index,
  mode,
  sectionId,
  onEdit,
  onRemove,
  colorTokens,
  backgroundType,
  sectionBackground,
  canRemove = true
}: {
  timelineItem: { item: string; id: string };
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onEdit: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  colorTokens: any;
  backgroundType: string;
  sectionBackground: string;
  canRemove?: boolean;
}) => {
  const { getTextStyle } = useTypography();
  const h3Style = getTextStyle('h3');

  return (
    <div className="group/timeline-item relative flex items-center space-x-6">
      {/* Timeline Number Circle */}
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg">
        {index + 1}
      </div>

      {/* Timeline Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex-1 relative">
        {mode !== 'preview' ? (
          <EditableAdaptiveText
            mode={mode}
            value={timelineItem.item || ''}
            onEdit={(value) => onEdit(index, value)}
            backgroundType="neutral"
            colorTokens={colorTokens}
            variant="h3"
            className="font-bold text-gray-900 text-lg leading-relaxed"
            placeholder={`Timeline item ${index + 1} (e.g., "2024: Product Launch")`}
            sectionBackground="bg-white"
            sectionId={sectionId}
            elementKey={`timeline_item_${index + 1}`}
          />
        ) : (
          <h3 style={h3Style} className="font-bold text-gray-900 text-lg leading-relaxed">
            {timelineItem.item}
          </h3>
        )}

        {/* Delete button - only show in edit mode and if can remove */}
        {mode !== 'preview' && onRemove && canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="opacity-0 group-hover/timeline-item:opacity-100 absolute top-4 right-4 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            title="Remove this timeline item"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    sectionBackground,
    handleContentUpdate,
    backgroundType
  } = useLayoutComponent<InnovationTimelineContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse timeline data
  const timelineItems = parseTimelineData(blockContent);

  // Handle individual timeline item editing
  const handleTimelineEdit = (index: number, value: string) => {
    const fieldKey = `timeline_item_${index + 1}` as keyof InnovationTimelineContent;
    handleContentUpdate(fieldKey, value);
  };

  // Handle adding a new timeline item
  const handleAddTimelineItem = () => {
    const emptyIndex = [
      blockContent.timeline_item_1,
      blockContent.timeline_item_2,
      blockContent.timeline_item_3,
      blockContent.timeline_item_4,
      blockContent.timeline_item_5,
      blockContent.timeline_item_6
    ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');

    if (emptyIndex !== -1) {
      const fieldKey = `timeline_item_${emptyIndex + 1}` as keyof InnovationTimelineContent;
      handleContentUpdate(fieldKey, `Timeline Item ${emptyIndex + 1}`);
    }
  };

  // Handle removing a timeline item
  const handleRemoveTimelineItem = (indexToRemove: number) => {
    const fieldKey = `timeline_item_${indexToRemove + 1}` as keyof InnovationTimelineContent;
    handleContentUpdate(fieldKey, '___REMOVED___');
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="InnovationTimeline"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline || ''}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h2"
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
          colorTokens={colorTokens}
          className="text-center mb-12"
          sectionId={sectionId}
          elementKey="headline"
          sectionBackground={sectionBackground}
        />

        {/* Timeline Items */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 hidden md:block"></div>

          <div className="space-y-8">
            {timelineItems.map((timelineItem, index) => (
              <TimelineCard
                key={timelineItem.id}
                timelineItem={timelineItem}
                index={index}
                mode={mode}
                sectionId={sectionId}
                onEdit={handleTimelineEdit}
                onRemove={handleRemoveTimelineItem}
                colorTokens={colorTokens}
                backgroundType={backgroundType || 'neutral'}
                sectionBackground={sectionBackground}
                canRemove={timelineItems.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Add Timeline Item Button - only show in edit mode and if under max limit */}
        {mode !== 'preview' && timelineItems.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddTimelineItem}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Timeline Item</span>
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
  description: 'Interactive innovation and development timeline with editable milestones',
  defaultBackgroundType: 'neutral' as const,
  features: [
    'Editable timeline milestones',
    'Add/remove timeline items (up to 6)',
    'Sequential numbering with progress indicators',
    'Hover-based delete controls',
    'Visual connecting line for timeline flow'
  ]
};