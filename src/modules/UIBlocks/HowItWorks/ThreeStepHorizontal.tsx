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
import IconEditableText from '@/components/ui/IconEditableText';

interface ThreeStepHorizontalProps extends LayoutComponentProps {}

// Step item structure
interface StepItem {
  title: string;
  description: string;
  number: string;
  id: string;
}

// Content interface for ThreeStepHorizontal layout
interface ThreeStepHorizontalContent {
  headline: string;
  step_titles: string;
  step_descriptions: string;
  step_numbers?: string;
  conclusion_text?: string;
  // Step icons
  step_icon_1?: string;
  step_icon_2?: string;
  step_icon_3?: string;
}

// Content schema for ThreeStepHorizontal layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How It Works' },
  step_titles: { type: 'string' as const, default: 'Sign Up & Connect|Customize Your Setup|Get Results' },
  step_descriptions: { type: 'string' as const, default: 'Create your account and connect your existing tools in just a few clicks.|Tailor the platform to your specific needs with our intuitive configuration wizard.|Watch as your automated workflows start delivering results immediately.' },
  step_numbers: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: '' },
  // Step icons
  step_icon_1: { type: 'string' as const, default: '👤' },
  step_icon_2: { type: 'string' as const, default: '⚙️' },
  step_icon_3: { type: 'string' as const, default: '📊' }
};

// Parse step data from pipe-separated strings
const parseStepData = (titles: string, descriptions: string, numbers?: string): StepItem[] => {
  const titleList = titles.split('|').map(t => t.trim()).filter(t => t);
  const descriptionList = descriptions.split('|').map(d => d.trim()).filter(d => d);
  const numberList = numbers ? numbers.split('|').map(n => n.trim()).filter(n => n) : [];
  
  return titleList.map((title, index) => ({
    id: `step-${index}`,
    title,
    description: descriptionList[index] || 'Step description not provided.',
    number: numberList[index] || (index + 1).toString()
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

// Step Icon Component
const StepIcon = ({ 
  stepNumber, 
  mode, 
  blockContent, 
  handleContentUpdate, 
  backgroundType, 
  colorTokens, 
  sectionId 
}: { 
  stepNumber: string;
  mode: 'edit' | 'preview';
  blockContent: ThreeStepHorizontalContent;
  handleContentUpdate: (key: string, value: any) => void;
  backgroundType: any;
  colorTokens: any;
  sectionId: string;
}) => {
  const stepIndex = parseInt(stepNumber) - 1;
  const iconFields = ['step_icon_1', 'step_icon_2', 'step_icon_3'];
  const defaultIcons = ['👤', '⚙️', '📊'];
  
  const getStepIcon = () => {
    if (stepIndex >= 0 && stepIndex < iconFields.length) {
      return blockContent[iconFields[stepIndex] as keyof ThreeStepHorizontalContent] || defaultIcons[stepIndex];
    }
    return '⭐'; // default for any other step
  };

  const handleIconEdit = (value: string) => {
    if (stepIndex >= 0 && stepIndex < iconFields.length) {
      handleContentUpdate(iconFields[stepIndex], value);
    }
  };

  return (
    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4 mx-auto">
      <IconEditableText
        mode={mode}
        value={getStepIcon()}
        onEdit={handleIconEdit}
        backgroundType={backgroundType as any}
        colorTokens={colorTokens}
        iconSize="md"
        className="text-2xl text-white"
        sectionId={sectionId}
        elementKey={iconFields[stepIndex] || 'step_icon_default'}
      />
    </div>
  );
};

// Individual Step Card
const StepCard = ({ 
  item, 
  mode, 
  sectionId, 
  index,
  onTitleEdit,
  onDescriptionEdit,
  isLast = false,
  blockContent,
  handleContentUpdate,
  backgroundType,
  colorTokens
}: {
  item: StepItem;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  isLast?: boolean;
  blockContent: ThreeStepHorizontalContent;
  handleContentUpdate: (key: string, value: any) => void;
  backgroundType: any;
  colorTokens: any;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="relative flex-1">
      {/* Step Content */}
      <div className="text-center">
        
        {/* Step Number Circle */}
        <div className="relative mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto shadow-lg">
            {item.number}
          </div>
          
          {/* Step Icon */}
          <div className="mt-4">
            <StepIcon 
              stepNumber={item.number}
              mode={mode}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              sectionId={sectionId}
            />
          </div>
        </div>

        {/* Step Title */}
        <div className="mb-4">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTitleEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
            >
              {item.title}
            </div>
          ) : (
            <h3 
              className="font-semibold text-gray-900 mb-3"
            >
              {item.title}
            </h3>
          )}
        </div>

        {/* Step Description */}
        <div>
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onDescriptionEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 text-gray-600 leading-relaxed"
            >
              {item.description}
            </div>
          ) : (
            <p 
              className="text-gray-600 leading-relaxed"
            >
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Connecting Arrow (Desktop Only) */}
      {!isLast && (
        <div className="lg:block absolute top-20 -right-8 w-16 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}

      {/* Connecting Line (Mobile) */}
      {!isLast && (
        <div className="lg:hidden flex justify-center mt-8 mb-8">
          <div className="w-1 h-12 bg-blue-200 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default function ThreeStepHorizontal(props: ThreeStepHorizontalProps) {
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
  } = useLayoutComponent<ThreeStepHorizontalContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse step data
  const stepItems = parseStepData(blockContent.step_titles, blockContent.step_descriptions, blockContent.step_numbers);

  // Handle individual title/description editing
  const handleTitleEdit = (index: number, value: string) => {
    const titles = blockContent.step_titles.split('|');
    titles[index] = value;
    handleContentUpdate('step_titles', titles.join('|'));
  };

  const handleDescriptionEdit = (index: number, value: string) => {
    const descriptions = blockContent.step_descriptions.split('|');
    descriptions[index] = value;
    handleContentUpdate('step_descriptions', descriptions.join('|'));
  };


  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ThreeStepHorizontal"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <ModeWrapper
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            onEdit={(value) => handleContentUpdate('headline', value)}
          >
            <h2 
              className={`mb-4 ${colorTokens.textPrimary}`}
            >
              {blockContent.headline}
            </h2>
          </ModeWrapper>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-12 lg:space-y-0 lg:space-x-8 relative">
          {stepItems.map((item, index) => (
            <StepCard
              key={item.id}
              item={item}
              mode={mode}
              sectionId={sectionId}
              index={index}
              onTitleEdit={handleTitleEdit}
              onDescriptionEdit={handleDescriptionEdit}
              isLast={index === stepItems.length - 1}
              blockContent={blockContent}
              handleContentUpdate={handleContentUpdate}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
            />
          ))}
        </div>

        {/* Optional Conclusion Text */}
        {(blockContent.conclusion_text || mode === 'edit') && (
          <div className="mt-16 text-center">
            <ModeWrapper
              mode={mode}
              sectionId={sectionId}
              elementKey="conclusion_text"
              onEdit={(value) => handleContentUpdate('conclusion_text', value)}
            >
              <p 
                className={`max-w-2xl mx-auto ${colorTokens.textSecondary} ${!blockContent.conclusion_text && mode === 'edit' ? 'opacity-50' : ''}`}
              >
                {blockContent.conclusion_text || (mode === 'edit' ? 'Add optional conclusion text to summarize the process...' : '')}
              </p>
            </ModeWrapper>
          </div>
        )}

      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ThreeStepHorizontal',
  category: 'Process',
  description: 'Horizontal step-by-step process with adaptive text colors and connecting arrows',
  tags: ['steps', 'process', 'horizontal', 'workflow', 'adaptive-colors'],
  features: [
    'Automatic text color adaptation based on background type',
    'Editable step titles and descriptions',
    'Connecting arrows on desktop layout',
    'Responsive mobile stacking',
    'Contextual step icons',
    'Optional conclusion text'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    step_titles: 'Pipe-separated list of step titles',
    step_descriptions: 'Pipe-separated list of step descriptions',
    step_numbers: 'Optional pipe-separated custom step numbers',
    conclusion_text: 'Optional conclusion text to summarize the process'
  },
  examples: [
    'How it works process',
    'Getting started guide',
    'Implementation steps',
    'Onboarding flow'
  ]
};