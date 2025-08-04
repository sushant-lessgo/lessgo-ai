import React, { useEffect } from 'react';
import { generateColorTokens } from '../../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

interface StackedPainBulletsProps extends LayoutComponentProps {}

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
}

// Content schema for StackedPainBullets layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Are You Struggling With These Daily Frustrations?' },
  pain_points: { type: 'string' as const, default: 'Spending hours on manual data entry that could be automated|Juggling multiple tools that don\'t talk to each other|Missing important deadlines because nothing is centralized|Watching your team burn out from repetitive, mind-numbing tasks|Losing potential customers because your response time is too slow|Feeling overwhelmed by the chaos of disconnected workflows' },
  pain_descriptions: { type: 'string' as const, default: '' },
  subheadline: { type: 'string' as const, default: '' }
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

// ModeWrapper component for handling edit/preview modes
const ModeWrapper = ({ 
  mode, 
  children, 
  sectionId, 
  elementKey,
  onEdit 
}: {
  mode: 'edit' | 'preview';
  children: React.ReactNode;
  sectionId: string;
  elementKey: string;
  onEdit?: (value: string) => void;
}) => {
  if (mode === 'edit' && onEdit) {
    return (
      <div 
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50"
        data-placeholder={`Edit ${elementKey.replace('_', ' ')}`}
      >
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
};

// Pain Point Icon Component
const PainIcon = ({ index }: { index: number }) => {
  const icons = [
    // Clock - Time wasting
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    // Disconnect - Integration issues
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-3-3m-5.64-5.64l-.006-.006m1.318-1.318L15 11l-1-1m-3.682-2.682L9 9" />
    </svg>,
    // Warning - Missing deadlines
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>,
    // Stress - Burnout
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>,
    // Loss - Losing customers
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>,
    // Chaos - Overwhelm
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  ];
  
  return icons[index % icons.length];
};

// Individual Pain Point Item
const PainPointItem = ({ 
  painPoint, 
  index, 
  mode, 
  sectionId,
  onPointEdit,
  onDescriptionEdit
}: {
  painPoint: PainPoint;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onPointEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group flex items-start space-x-4 p-6 bg-white rounded-lg border border-red-200 hover:border-red-300 hover:shadow-md transition-all duration-300">
      
      {/* Pain Icon */}
      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors duration-300">
        <PainIcon index={index} />
      </div>
      
      {/* Pain Content */}
      <div className="flex-1">
        {/* Pain Point */}
        <div className="mb-2">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onPointEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900 leading-relaxed"
              style={getTextStyle('h3')}
            >
              {painPoint.point}
            </div>
          ) : (
            <h3 
              className="font-semibold text-gray-900 leading-relaxed"
              style={getTextStyle('h3')}
            >
              {painPoint.point}
            </h3>
          )}
        </div>
        
        {/* Optional Description */}
        {(painPoint.description || mode === 'edit') && (
          <div>
            {mode === 'edit' ? (
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
                className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed ${!painPoint.description ? 'opacity-50 italic' : ''}`}
                style={getTextStyle('body-sm')}
              >
                {painPoint.description || 'Add optional description to elaborate on this pain point...'}
              </div>
            ) : painPoint.description && (
              <p 
                className="text-gray-600 leading-relaxed"
                style={getTextStyle('body-sm')}
              >
                {painPoint.description}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Emphasis Indicator */}
      <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full group-hover:bg-red-500 transition-colors duration-300"></div>
    </div>
  );
};

export default function StackedPainBullets(props: StackedPainBulletsProps) {
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
    handleContentUpdate,
    theme
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

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="StackedPainBullets"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-6 ${colorTokens.textPrimary}`}
              style={getTextStyle('h1')}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode === 'edit') && (
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="subheadline"
              onEdit={(value) => handleContentUpdate('subheadline', value)}
            >
              <p 
                className={`max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.subheadline && mode === 'edit' ? 'opacity-50' : ''}`}
                style={getTextStyle('body-lg')}
              >
                {blockContent.subheadline || (mode === 'edit' ? 'Add optional subheadline to provide context...' : '')}
              </p>
            </ModeWrapper>
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
              onPointEdit={handlePointEdit}
              onDescriptionEdit={handleDescriptionEdit}
            />
          ))}
        </div>

        {/* Emotional Conclusion */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-red-50 border border-red-200 rounded-full text-red-800">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">Sound familiar? You're not alone.</span>
          </div>
        </div>

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'StackedPainBullets',
  category: 'Problem Identification',
  description: 'Pain point identification with adaptive text colors and emotional appeal',
  tags: ['pain-points', 'problems', 'empathy', 'bullets', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable pain points with optional descriptions',
    'Contextual warning icons for each pain point',
    'Optional subheadline for additional context',
    'Emotional conclusion to build empathy',
    'Red-themed design for urgency'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text (often a question)',
    pain_points: 'Pipe-separated list of pain points',
    pain_descriptions: 'Optional pipe-separated descriptions for each pain point',
    subheadline: 'Optional subheading for additional context'
  },
  examples: [
    'Customer frustration identification',
    'Problem statement section',
    'Challenge recognition',
    'Pain point validation'
  ]
};