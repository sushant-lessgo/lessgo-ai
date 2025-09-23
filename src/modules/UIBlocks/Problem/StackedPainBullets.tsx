import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import {
  EditableAdaptiveHeadline,
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { getRandomIconFromCategory } from '@/utils/iconMapping';


// Pain point structure
interface PainPoint {
  point: string;
  description?: string;
  id: string;
}

// Content interface for StackedPainBullets layout
interface StackedPainBulletsContent {
  headline: string;
  pain_points: string;
  pain_descriptions?: string;
  subheadline?: string;
  conclusion_text?: string;
  pain_icon_1?: string;
  pain_icon_2?: string;
  pain_icon_3?: string;
  pain_icon_4?: string;
  pain_icon_5?: string;
  pain_icon_6?: string;
}

// Content schema for StackedPainBullets layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Are You Struggling With These Daily Frustrations?' },
  pain_points: { type: 'string' as const, default: 'Spending hours on manual data entry that could be automated|Juggling multiple tools that don\'t talk to each other|Missing important deadlines because nothing is centralized|Watching your team burn out from repetitive, mind-numbing tasks|Losing potential customers because your response time is too slow|Feeling overwhelmed by the chaos of disconnected workflows' },
  pain_descriptions: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: 'Sound familiar? You\'re not alone.' },
  pain_icon_1: { type: 'string' as const, default: '⏰' },
  pain_icon_2: { type: 'string' as const, default: '🔗' },
  pain_icon_3: { type: 'string' as const, default: '⚠️' },
  pain_icon_4: { type: 'string' as const, default: '😰' },
  pain_icon_5: { type: 'string' as const, default: '📉' },
  pain_icon_6: { type: 'string' as const, default: '🌪️' }
};

// Parse pain point data from pipe-separated strings
const parsePainData = (points: string, descriptions?: string): PainPoint[] => {
  const pointList = points.split('|').map(p => p.trim()).filter(p => p);
  const descriptionList = descriptions ? descriptions.split('|').map(d => d.trim()).filter(d => d) : [];
  
  return pointList.map((point, index) => ({
    id: `pain-${index}`,
    point,
    description: descriptionList[index] || undefined
  }));
};


// Get pain icon for specific index
const getPainIcon = (index: number, blockContent: StackedPainBulletsContent) => {
  const iconFields = ['pain_icon_1', 'pain_icon_2', 'pain_icon_3', 'pain_icon_4', 'pain_icon_5', 'pain_icon_6'];
  return blockContent[iconFields[index] as keyof StackedPainBulletsContent] || '⚠️';
};

// Individual Pain Point Item
const PainPointItem = ({ 
  painPoint, 
  index, 
  mode, 
  sectionId,
  colorTokens,
  backgroundType,
  sectionBackground,
  blockContent,
  handleContentUpdate,
  onPointEdit,
  onDescriptionEdit,
  onRemove,
  canRemove
}: {
  painPoint: PainPoint;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  colorTokens: any;
  backgroundType: any;
  sectionBackground: any;
  blockContent: StackedPainBulletsContent;
  handleContentUpdate: (field: keyof StackedPainBulletsContent, value: any) => void;
  onPointEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) => {
  return (
    <div className="group flex items-start space-x-4 p-6 bg-white rounded-lg border border-red-200 hover:border-red-300 hover:shadow-md transition-all duration-300">
      
      {/* Pain Icon */}
      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors duration-300 group/icon-edit relative">
        <IconEditableText
          mode={mode}
          value={getPainIcon(index, blockContent)}
          onEdit={(value) => {
            const iconField = `pain_icon_${index + 1}` as keyof StackedPainBulletsContent;
            handleContentUpdate(iconField, value);
          }}
          backgroundType={backgroundType as any}
          colorTokens={colorTokens}
          iconSize="lg"
          className="text-2xl"
          sectionId={sectionId}
          elementKey={`pain_icon_${index + 1}`}
        />
      </div>
      
      {/* Pain Content */}
      <div className="flex-1">
        {/* Pain Point */}
        <div className="mb-2">
          <EditableAdaptiveText
            mode={mode}
            value={painPoint.point}
            onEdit={(value) => onPointEdit(index, value)}
            backgroundType={backgroundType}
            colorTokens={colorTokens}
            variant="body"
            className="font-semibold text-gray-900 leading-relaxed"
            placeholder="Enter pain point..."
            sectionBackground={sectionBackground}
            data-section-id={sectionId}
            data-element-key={`pain_point_${index}`}
          />
        </div>
        
        {/* Optional Description */}
        {(painPoint.description || mode === 'edit') && (
          <div>
            <EditableAdaptiveText
              mode={mode}
              value={painPoint.description || ''}
              onEdit={(value) => onDescriptionEdit(index, value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className={`text-gray-600 leading-relaxed ${!painPoint.description && mode === 'edit' ? 'opacity-50 italic' : ''}`}
              placeholder="Add optional description to elaborate on this pain point..."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key={`pain_description_${index}`}
            />
          </div>
        )}
      </div>
      
      {/* Remove Button (Edit Mode Only) */}
      {mode === 'edit' && canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (painPoint.point.trim() && !confirm('Are you sure you want to remove this pain point?')) {
              return;
            }
            onRemove(index);
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm ml-2"
          title="Remove this pain point"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Emphasis Indicator */}
      <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full group-hover:bg-red-500 transition-colors duration-300"></div>
    </div>
  );
};

export default function StackedPainBullets(props: LayoutComponentProps) {
  // ✅ Use the standard useLayoutComponent hook
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
  } = useLayoutComponent<StackedPainBulletsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse pain point data
  const painPoints = parsePainData(blockContent.pain_points, blockContent.pain_descriptions);

  // Handle individual editing
  const handlePointEdit = (index: number, value: string) => {
    const points = blockContent.pain_points.split('|');
    points[index] = value;
    handleContentUpdate('pain_points', points.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.pain_descriptions ? blockContent.pain_descriptions.split('|') : [];
    descriptions[index] = value;
    handleContentUpdate('pain_descriptions', descriptions.join('|'));
  };

  // Add new pain point
  const addPainPoint = () => {
    const points = blockContent.pain_points.split('|');
    if (points.length >= 6) return; // Maximum 6 pain points

    const newPoints = [...points, 'New pain point'];

    // Update pain points
    handleContentUpdate('pain_points', newPoints.join('|'));

    // Add a smart icon for the new pain point
    const newPainCount = newPoints.length;
    const iconField = `pain_icon_${newPainCount}` as keyof StackedPainBulletsContent;
    if (newPainCount <= 6) {
      // Use random icon from pain/problem category
      const painIcons = ['😰', '⚠️', '😤', '😫', '💢', '😓'];
      const defaultIcon = painIcons[Math.floor(Math.random() * painIcons.length)];
      handleContentUpdate(iconField, defaultIcon);
    }
  };

  // Remove pain point
  const removePainPoint = (index: number) => {
    const points = blockContent.pain_points.split('|');
    if (points.length <= 1) return; // Keep at least 1 pain point
    
    const newPoints = points.filter((_, i) => i !== index);
    handleContentUpdate('pain_points', newPoints.join('|'));
    
    // Remove corresponding description if it exists
    if (blockContent.pain_descriptions) {
      const descriptions = blockContent.pain_descriptions.split('|');
      const newDescriptions = descriptions.filter((_, i) => i !== index);
      handleContentUpdate('pain_descriptions', newDescriptions.join('|'));
    }
    
    // Shift icons down to maintain continuity
    for (let i = index + 1; i < points.length; i++) {
      const currentIconField = `pain_icon_${i + 1}` as keyof StackedPainBulletsContent;
      const nextIconField = `pain_icon_${i}` as keyof StackedPainBulletsContent;
      const iconValue = blockContent[currentIconField] || '⚠️';
      handleContentUpdate(nextIconField, iconValue);
    }
    
    // Clear the last icon slot
    const lastIconField = `pain_icon_${points.length}` as keyof StackedPainBulletsContent;
    handleContentUpdate(lastIconField, '⚠️');
  };


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedPainBullets"
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
            className="mb-6"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              className="max-w-2xl mx-auto"
              placeholder="Add optional subheadline to provide context..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Pain Points List */}
        <div className="space-y-6">
          {painPoints.map((painPoint, index) => (
            <PainPointItem
              key={painPoint.id}
              painPoint={painPoint}
              index={index}
              mode={mode}
              sectionId={sectionId}
              colorTokens={colorTokens}
              backgroundType={backgroundType}
              sectionBackground={sectionBackground}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              onPointEdit={handlePointEdit}
              onDescriptionEdit={handleDescriptionEdit}
              onRemove={removePainPoint}
              canRemove={painPoints.length > 1}
            />
          ))}
        </div>

        {/* Add Pain Point Button */}
        {mode === 'edit' && painPoints.length < 6 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={addPainPoint}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Pain Point</span>
            </button>
          </div>
        )}

        {/* Emotional Conclusion */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-red-50 border border-red-200 rounded-full text-red-800">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.conclusion_text || ''}
              onEdit={(value) => handleContentUpdate('conclusion_text', value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="font-medium"
              placeholder="Sound familiar? You're not alone."
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key="conclusion_text"
            />
          </div>
        </div>


      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedPainBullets',
  category: 'Problem',
  description: 'Simple, focused pain point identification with editable content and emotional conclusion.',
  tags: ['pain-points', 'problems', 'empathy', 'bullets'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple',
  estimatedBuildTime: '20 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'pain_points', label: 'Pain Points (pipe separated)', type: 'textarea', required: true },
    { key: 'pain_descriptions', label: 'Pain Point Descriptions (pipe separated)', type: 'textarea', required: false },
    { key: 'conclusion_text', label: 'Conclusion Text', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Items (pipe separated)', type: 'textarea', required: false },
    { key: 'pain_icon_1', label: 'Pain Icon 1', type: 'icon', required: false },
    { key: 'pain_icon_2', label: 'Pain Icon 2', type: 'icon', required: false },
    { key: 'pain_icon_3', label: 'Pain Icon 3', type: 'icon', required: false },
    { key: 'pain_icon_4', label: 'Pain Icon 4', type: 'icon', required: false },
    { key: 'pain_icon_5', label: 'Pain Icon 5', type: 'icon', required: false },
    { key: 'pain_icon_6', label: 'Pain Icon 6', type: 'icon', required: false }
  ],
  
  features: [
    'Editable pain points with optional descriptions',
    'Contextual warning icons for each pain point',
    'Editable emotional conclusion',
    'Clean, focused design',
    'Standard EditableAdaptive integration'
  ],
  
  useCases: [
    'Customer frustration identification',
    'Problem statement sections',
    'Challenge recognition',
    'Pain point validation'
  ]
};