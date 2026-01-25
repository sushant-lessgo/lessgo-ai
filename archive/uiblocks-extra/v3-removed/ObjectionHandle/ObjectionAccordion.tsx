// components/layout/ObjectionAccordion.tsx
// Production-ready objection handling accordion using abstraction system

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { parsePipeData, updateListData } from '@/utils/dataParsingUtils';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

// Content interface for type safety
interface ObjectionAccordionContent {
  headline: string;
  subheadline?: string;
  // Individual objection fields (up to 6 items)
  objection_1: string;
  response_1: string;
  objection_2: string;
  response_2: string;
  objection_3: string;
  response_3: string;
  objection_4: string;
  response_4: string;
  objection_5: string;
  response_5: string;
  objection_6: string;
  response_6: string;
  // Icon fields for each objection
  objection_icon_1?: string;
  objection_icon_2?: string;
  objection_icon_3?: string;
  objection_icon_4?: string;
  objection_icon_5?: string;
  objection_icon_6?: string;
  // Global settings
  response_icon?: string;
  trust_icon?: string;
  help_text?: string;
  // Legacy fields for backward compatibility
  objection_titles?: string;
  objection_responses?: string;
  objection_icons?: string;
}

// Objection item structure
interface ObjectionItem {
  id: string;
  index: number;
  title: string;
  response: string;
  icon?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: {
    type: 'string' as const,
    default: 'Common Questions & Concerns'
  },
  subheadline: {
    type: 'string' as const,
    default: 'We understand your concerns. Here are honest answers to the questions we hear most often.'
  },
  // Individual objection fields
  objection_1: { type: 'string' as const, default: 'Is this too expensive for a small business?' },
  response_1: { type: 'string' as const, default: 'We designed our pricing specifically for growing businesses. Most customers save more than the monthly cost within the first week through improved efficiency.' },
  objection_2: { type: 'string' as const, default: 'Will this replace our current system?' },
  response_2: { type: 'string' as const, default: 'Not at all. We integrate seamlessly with your existing tools and workflows. You can start small and gradually expand usage as your team gets comfortable.' },
  objection_3: { type: 'string' as const, default: 'How do we know it will actually work?' },
  response_3: { type: 'string' as const, default: 'We offer a 30-day free trial with full access to all features. Plus, over 10,000 businesses already trust us with their operations.' },
  objection_4: { type: 'string' as const, default: 'What if we need help setting it up?' },
  response_4: { type: 'string' as const, default: 'Our dedicated onboarding team provides white-glove setup, training, and ongoing support. Most customers are fully operational within 24 hours.' },
  objection_5: { type: 'string' as const, default: 'Is our data really secure with you?' },
  response_5: { type: 'string' as const, default: 'Absolutely. We use bank-level encryption, are SOC 2 compliant, and never share your data with third parties. Your information is more secure with us than on local systems.' },
  objection_6: { type: 'string' as const, default: 'What about integration complexity?' },
  response_6: { type: 'string' as const, default: 'Our platform connects with 500+ popular tools through our API. Most integrations take under 10 minutes to set up with our step-by-step guides.' },
  // Icon fields
  objection_icon_1: { type: 'string' as const, default: '💰' },
  objection_icon_2: { type: 'string' as const, default: '🔧' },
  objection_icon_3: { type: 'string' as const, default: '❓' },
  objection_icon_4: { type: 'string' as const, default: '🛠️' },
  objection_icon_5: { type: 'string' as const, default: '🔒' },
  objection_icon_6: { type: 'string' as const, default: '⚡' },
  // Global settings
  response_icon: { type: 'string' as const, default: '✅' },
  trust_icon: { type: 'string' as const, default: '✅' },
  help_text: { type: 'string' as const, default: 'Still have questions? We\'re here to help.' },
  // Legacy fields for backward compatibility
  objection_titles: { type: 'string' as const, default: 'Is this too expensive for a small business?|Will this replace our current system?|How do we know it will actually work?|What if we need help setting it up?|Is our data really secure with you?' },
  objection_responses: { type: 'string' as const, default: 'We designed our pricing specifically for growing businesses. Most customers save more than the monthly cost within the first week through improved efficiency.|Not at all. We integrate seamlessly with your existing tools and workflows. You can start small and gradually expand usage as your team gets comfortable.|We offer a 30-day free trial with full access to all features. Plus, over 10,000 businesses already trust us with their operations.|Our dedicated onboarding team provides white-glove setup, training, and ongoing support. Most customers are fully operational within 24 hours.|Absolutely. We use bank-level encryption, are SOC 2 compliant, and never share your data with third parties. Your information is more secure with us than on local systems.' },
  objection_icons: { type: 'string' as const, default: '💰|🔧|❓|🛠️|🔒' }
};

// Parse objection data from both individual and pipe-separated formats
const parseObjectionData = (content: ObjectionAccordionContent): ObjectionItem[] => {
  const objections: ObjectionItem[] = [];

  // Check for individual fields first (preferred format)
  const individualFields = [
    { objection: content.objection_1, response: content.response_1, icon: content.objection_icon_1 },
    { objection: content.objection_2, response: content.response_2, icon: content.objection_icon_2 },
    { objection: content.objection_3, response: content.response_3, icon: content.objection_icon_3 },
    { objection: content.objection_4, response: content.response_4, icon: content.objection_icon_4 },
    { objection: content.objection_5, response: content.response_5, icon: content.objection_icon_5 },
    { objection: content.objection_6, response: content.response_6, icon: content.objection_icon_6 }
  ];

  // Process individual fields
  individualFields.forEach((field, index) => {
    if (field.objection && field.objection.trim()) {
      objections.push({
        id: `objection-${index}`,
        index,
        title: field.objection.trim(),
        response: field.response?.trim() || 'Response not provided.',
        icon: field.icon || getDefaultIcon(field.objection)
      });
    }
  });

  // Fallback to legacy pipe-separated format if no individual fields
  if (objections.length === 0 && content.objection_titles && content.objection_responses) {
    const titleList = parsePipeData(content.objection_titles);
    const responseList = parsePipeData(content.objection_responses);
    const iconList = content.objection_icons ? parsePipeData(content.objection_icons) : [];

    titleList.forEach((title, index) => {
      objections.push({
        id: `objection-${index}`,
        index,
        title,
        response: responseList[index] || 'Response not provided.',
        icon: iconList[index] || getDefaultIcon(title)
      });
    });
  }

  return objections;
};

// Get default icon based on content
const getDefaultIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price')) {
    return '💰';
  } else if (lower.includes('replace') || lower.includes('system') || lower.includes('integration')) {
    return '🔧';
  } else if (lower.includes('secure') || lower.includes('data') || lower.includes('privacy')) {
    return '🔒';
  } else if (lower.includes('help') || lower.includes('support') || lower.includes('setup')) {
    return '🛠️';
  }
  // Default question icon
  return '❓';
};

// Helper function to get next available objection slot
const getNextAvailableSlot = (content: ObjectionAccordionContent): number => {
  const fields = [
    content.objection_1,
    content.objection_2,
    content.objection_3,
    content.objection_4,
    content.objection_5,
    content.objection_6
  ];

  for (let i = 0; i < fields.length; i++) {
    if (!fields[i] || fields[i].trim() === '') {
      return i + 1;
    }
  }

  return -1; // No slots available
};

// Helper function to shift objections down when removing one
const shiftObjectionsDown = (content: ObjectionAccordionContent, removedIndex: number): Partial<ObjectionAccordionContent> => {
  const updates: Partial<ObjectionAccordionContent> = {};

  // Get all objections after the removed one
  const allObjections = [
    { objection: content.objection_1, response: content.response_1, icon: content.objection_icon_1 },
    { objection: content.objection_2, response: content.response_2, icon: content.objection_icon_2 },
    { objection: content.objection_3, response: content.response_3, icon: content.objection_icon_3 },
    { objection: content.objection_4, response: content.response_4, icon: content.objection_icon_4 },
    { objection: content.objection_5, response: content.response_5, icon: content.objection_icon_5 },
    { objection: content.objection_6, response: content.response_6, icon: content.objection_icon_6 }
  ];

  // Filter out the removed item and empty slots
  const validObjections = allObjections
    .map((obj, index) => ({ ...obj, originalIndex: index }))
    .filter((obj, index) => index !== removedIndex && obj.objection && obj.objection.trim())
    .slice(0, 5); // Limit to 5 since one is being removed

  // Clear all fields first
  for (let i = 1; i <= 6; i++) {
    updates[`objection_${i}` as keyof ObjectionAccordionContent] = '';
    updates[`response_${i}` as keyof ObjectionAccordionContent] = '';
    updates[`objection_icon_${i}` as keyof ObjectionAccordionContent] = '';
  }

  // Reassign remaining objections
  validObjections.forEach((obj, newIndex) => {
    const fieldNum = newIndex + 1;
    updates[`objection_${fieldNum}` as keyof ObjectionAccordionContent] = obj.objection || '';
    updates[`response_${fieldNum}` as keyof ObjectionAccordionContent] = obj.response || '';
    updates[`objection_icon_${fieldNum}` as keyof ObjectionAccordionContent] = obj.icon || '';
  });

  return updates;
};

// Color mapping function for theme-aware styling
const getObjectionColors = (theme: UIBlockTheme) => {
  const colorMap = {
    warm: {
      objectionBg: 'bg-orange-100',
      objectionBorder: 'border-orange-200',
      objectionIconBg: 'bg-orange-100',
      objectionIconText: 'text-orange-600',
      responseBg: 'bg-orange-50',
      responseBorder: 'border-orange-200',
      responseIconBg: 'bg-orange-600',
      responseIconText: 'text-white',
      responseTextColor: 'text-orange-800',
      responseHoverBg: 'hover:bg-orange-100',
      trustBg: 'bg-orange-50',
      trustText: 'text-orange-700',
      deleteBg: 'bg-orange-500',
      deleteBgHover: 'hover:bg-orange-600',
      focusRing: 'focus:ring-orange-500'
    },
    cool: {
      objectionBg: 'bg-blue-100',
      objectionBorder: 'border-blue-200',
      objectionIconBg: 'bg-blue-100',
      objectionIconText: 'text-blue-600',
      responseBg: 'bg-blue-50',
      responseBorder: 'border-blue-200',
      responseIconBg: 'bg-blue-600',
      responseIconText: 'text-white',
      responseTextColor: 'text-blue-800',
      responseHoverBg: 'hover:bg-blue-100',
      trustBg: 'bg-blue-50',
      trustText: 'text-blue-700',
      deleteBg: 'bg-blue-500',
      deleteBgHover: 'hover:bg-blue-600',
      focusRing: 'focus:ring-blue-500'
    },
    neutral: {
      objectionBg: 'bg-amber-100',
      objectionBorder: 'border-amber-200',
      objectionIconBg: 'bg-amber-100',
      objectionIconText: 'text-amber-600',
      responseBg: 'bg-amber-50',
      responseBorder: 'border-amber-200',
      responseIconBg: 'bg-amber-600',
      responseIconText: 'text-white',
      responseTextColor: 'text-amber-800',
      responseHoverBg: 'hover:bg-amber-100',
      trustBg: 'bg-amber-50',
      trustText: 'text-amber-700',
      deleteBg: 'bg-amber-500',
      deleteBgHover: 'hover:bg-amber-600',
      focusRing: 'focus:ring-amber-500'
    }
  };
  return colorMap[theme];
};

// Individual Objection Accordion Item
const ObjectionAccordionItem = React.memo(({
  item,
  isOpen,
  onToggle,
  mode,
  colorTokens,
  onTitleEdit,
  onResponseEdit,
  onIconEdit,
  onRemoveObjection,
  responseIcon,
  onResponseIconEdit,
  sectionId,
  backgroundType,
  sectionBackground,
  canRemove = true,
  theme,
  objectionColors
}: {
  item: ObjectionItem;
  isOpen: boolean;
  onToggle: () => void;
  mode: 'edit' | 'preview';
  colorTokens: any;
  onTitleEdit: (index: number, value: string) => void;
  onResponseEdit: (index: number, value: string) => void;
  onIconEdit: (index: number, value: string) => void;
  onRemoveObjection?: (index: number) => void;
  responseIcon: string;
  onResponseIconEdit: (value: string) => void;
  sectionId: string;
  backgroundType: any;
  sectionBackground: any;
  canRemove?: boolean;
  theme: UIBlockTheme;
  objectionColors: ReturnType<typeof getObjectionColors>;
}) => {
  
  return (
    <div className={`relative group/objection-item border ${objectionColors.objectionBorder} rounded-lg overflow-hidden mb-4 bg-white shadow-sm ${cardEnhancements.hoverLift} ${cardEnhancements.transition}`}>
      {/* Delete button - appears on hover in edit mode */}
      {mode === 'edit' && onRemoveObjection && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveObjection(item.index);
          }}
          className={`absolute top-4 right-4 z-10 opacity-0 group-hover/objection-item:opacity-100 w-6 h-6 ${objectionColors.deleteBg} ${objectionColors.deleteBgHover} rounded-full flex items-center justify-center transition-all duration-200`}
          title="Remove this objection"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Objection Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-4 flex-1 ${mode === 'edit' && onRemoveObjection && canRemove ? 'pr-12' : 'pr-4'}`}>
            {/* Objection Icon */}
            <div className={`flex-shrink-0 w-10 h-10 ${objectionColors.objectionIconBg} rounded-lg flex items-center justify-center ${objectionColors.objectionIconText}`}>
              <IconEditableText
                mode={mode}
                value={item.icon || '❓'}
                onEdit={(value) => onIconEdit(item.index, value)}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: objectionColors.objectionIconText}}
                iconSize="sm"
                className="text-xl"
                sectionId={sectionId}
                elementKey={`objection_icon_${item.index}`}
              />
            </div>

            {/* Objection Title */}
            <div className="flex-1">
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTitleEdit(item.index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </div>
              ) : (
                <h3
                  className="font-semibold text-gray-900"
                >
                  {item.title}
                </h3>
              )}
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Response Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`px-6 py-5 ${objectionColors.responseBg} border-t ${objectionColors.responseBorder}`}>
          <div className="flex items-start space-x-4">
            {/* Response Icon */}
            <div className={`flex-shrink-0 w-8 h-8 ${objectionColors.responseIconBg} rounded-full flex items-center justify-center ${objectionColors.responseIconText} mt-1`}>
              <IconEditableText
                mode={mode}
                value={responseIcon || '✅'}
                onEdit={onResponseIconEdit}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: objectionColors.responseIconText}}
                iconSize="sm"
                className="text-base"
                sectionId={sectionId}
                elementKey="response_icon"
              />
            </div>
            
            {/* Response Text */}
            <div className="flex-1">
              {mode !== 'preview' ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onResponseEdit(item.index, e.currentTarget.textContent || '')}
                  className={`outline-none focus:ring-2 ${objectionColors.focusRing} focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text ${objectionColors.responseHoverBg} ${objectionColors.responseTextColor} leading-relaxed`}
                >
                  {item.response}
                </div>
              ) : (
                <p
                  className={`${objectionColors.responseTextColor} leading-relaxed`}
                >
                  {item.response}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ObjectionAccordionItem.displayName = 'ObjectionAccordionItem';

export default function ObjectionAccordion(props: LayoutComponentProps) {
  // Use the abstraction hook for all common functionality
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
  } = useLayoutComponent<ObjectionAccordionContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Detect theme: manual override > auto-detection > neutral fallback
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Debug theme detection
  React.useEffect(() => {
    console.log('🎨 ObjectionAccordion theme detection:', {
      sectionId,
      hasManualOverride: !!props.manualThemeOverride,
      manualTheme: props.manualThemeOverride,
      hasUserContext: !!props.userContext,
      userContext: props.userContext,
      finalTheme: theme
    });
  }, [theme, props.manualThemeOverride, props.userContext, sectionId]);

  // Get theme-specific colors
  const objectionColors = getObjectionColors(theme);

  // State for accordion open/closed items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Parse objection data from both individual and legacy formats
  const objectionItems = parseObjectionData(blockContent);

  // Handle individual field editing
  const handleTitleEdit = (index: number, value: string) => {
    const fieldName = `objection_${index + 1}` as keyof ObjectionAccordionContent;
    handleContentUpdate(fieldName, value);
  };

  const handleResponseEdit = (index: number, value: string) => {
    const fieldName = `response_${index + 1}` as keyof ObjectionAccordionContent;
    handleContentUpdate(fieldName, value);
  };

  const handleIconEdit = (index: number, value: string) => {
    const fieldName = `objection_icon_${index + 1}` as keyof ObjectionAccordionContent;
    handleContentUpdate(fieldName, value);
  };

  // Handle adding a new objection
  const handleAddObjection = () => {
    const nextSlot = getNextAvailableSlot(blockContent);
    if (nextSlot > 0) {
      handleContentUpdate(`objection_${nextSlot}` as keyof ObjectionAccordionContent, 'New objection or concern');
      handleContentUpdate(`response_${nextSlot}` as keyof ObjectionAccordionContent, 'Address this objection with a clear, honest response that builds trust.');
      handleContentUpdate(`objection_icon_${nextSlot}` as keyof ObjectionAccordionContent, '❓');
    }
  };

  // Handle removing an objection
  const handleRemoveObjection = (indexToRemove: number) => {
    const updates = shiftObjectionsDown(blockContent, indexToRemove);

    // Apply all updates at once
    Object.entries(updates).forEach(([key, value]) => {
      handleContentUpdate(key as keyof ObjectionAccordionContent, value as string);
    });
  };

  // Toggle accordion item
  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ObjectionAccordion"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
            textStyle={{
              textAlign: 'center'
            }}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              textStyle={{
                textAlign: 'center'
              }}
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Objections Accordion */}
        <div className="space-y-0">
          {objectionItems.map((item) => (
            <ObjectionAccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              mode={mode}
              colorTokens={colorTokens}
              onTitleEdit={handleTitleEdit}
              onResponseEdit={handleResponseEdit}
              onIconEdit={handleIconEdit}
              onRemoveObjection={handleRemoveObjection}
              responseIcon={blockContent.response_icon || '✅'}
              onResponseIconEdit={(value) => handleContentUpdate('response_icon', value)}
              sectionId={sectionId}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              canRemove={objectionItems.length > 1}
              theme={theme}
              objectionColors={objectionColors}
            />
          ))}
        </div>

        {/* Add Objection Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && objectionItems.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddObjection}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Objection</span>
            </button>
          </div>
        )}

        {/* Trust Reinforcement */}
        {(blockContent.help_text || mode === 'edit') && (
          <div className="mt-12 text-center">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 ${objectionColors.trustBg} rounded-full ${objectionColors.trustText} text-sm`}>
              <IconEditableText
                mode={mode}
                value={blockContent.trust_icon || '✅'}
                onEdit={(value) => handleContentUpdate('trust_icon', value)}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: objectionColors.trustText}}
                iconSize="sm"
                className="text-base"
                sectionId={sectionId}
                elementKey="trust_icon"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.help_text || ''}
                onEdit={(value) => handleContentUpdate('help_text', value)}
                backgroundType="custom"
                colorTokens={{...colorTokens, primaryText: objectionColors.trustText}}
                variant="body"
                className="text-sm"
                placeholder="Still have questions? We're here to help."
                sectionId={sectionId}
                elementKey="help_text"
                sectionBackground={objectionColors.trustBg}
              />
            </div>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ObjectionAccordion',
  category: 'Conversion Sections',
  description: 'Address customer objections with adaptive text colors and expandable responses',
  tags: ['objections', 'accordion', 'conversion', 'sales', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'medium',
  estimatedBuildTime: '25 minutes',
  
  // ✅ ENHANCED: Schema for component generation tools
  contentFields: [
    { key: 'headline', label: 'Section Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    // Individual objection fields
    { key: 'objection_1', label: 'First Objection', type: 'text', required: true },
    { key: 'response_1', label: 'First Response', type: 'textarea', required: true },
    { key: 'objection_2', label: 'Second Objection', type: 'text', required: true },
    { key: 'response_2', label: 'Second Response', type: 'textarea', required: true },
    { key: 'objection_3', label: 'Third Objection', type: 'text', required: true },
    { key: 'response_3', label: 'Third Response', type: 'textarea', required: true },
    { key: 'objection_4', label: 'Fourth Objection', type: 'text', required: false },
    { key: 'response_4', label: 'Fourth Response', type: 'textarea', required: false },
    { key: 'objection_5', label: 'Fifth Objection', type: 'text', required: false },
    { key: 'response_5', label: 'Fifth Response', type: 'textarea', required: false },
    { key: 'objection_6', label: 'Sixth Objection', type: 'text', required: false },
    { key: 'response_6', label: 'Sixth Response', type: 'textarea', required: false }
  ],
  
  // ✅ NEW: Enhanced features
  features: [
    'Automatic text color adaptation based on background type',
    'Professional objection handling design',
    'Smooth accordion animations with icons',
    'Individual objection editing in edit mode',
    'Persuasive response formatting',
    'Mobile-optimized accordion behavior'
  ],
  
  // Usage examples
  useCases: [
    'Sales page objection handling on dark backgrounds',
    'FAQ with persuasive responses on brand colors',
    'Conversion optimization with custom styling',
    'Trust building section with adaptive text'
  ]
};