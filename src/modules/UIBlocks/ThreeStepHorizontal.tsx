import React, { useEffect } from 'react';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { useTypography } from '@/hooks/useTypography';
import { useEditStore } from '@/hooks/useEditStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { 
  LayoutComponentProps, 
  extractLayoutContent,
  StoreElementTypes 
} from '@/types/storeTypes';

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
}

// Content schema for ThreeStepHorizontal layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'How It Works' },
  step_titles: { type: 'string' as const, default: 'Sign Up & Connect|Customize Your Setup|Get Results' },
  step_descriptions: { type: 'string' as const, default: 'Create your account and connect your existing tools in just a few clicks.|Tailor the platform to your specific needs with our intuitive configuration wizard.|Watch as your automated workflows start delivering results immediately.' },
  step_numbers: { type: 'string' as const, default: '' },
  conclusion_text: { type: 'string' as const, default: '' }
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
const StepIcon = ({ stepNumber }: { stepNumber: string }) => {
  const getIcon = (number: string) => {
    switch (number) {
      case '1':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case '2':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case '3':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4 mx-auto">
      {getIcon(stepNumber)}
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
  isLast = false
}: {
  item: StepItem;
  mode: 'edit' | 'preview';
  sectionId: string;
  index: number;
  onTitleEdit: (index: number, value: string) => void;
  onDescriptionEdit: (index: number, value: string) => void;
  isLast?: boolean;
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
            <StepIcon stepNumber={item.number} />
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
              style={getTextStyle('h3')}
            >
              {item.title}
            </div>
          ) : (
            <h3 
              className="font-semibold text-gray-900 mb-3"
              style={getTextStyle('h3')}
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
              style={getTextStyle('body')}
            >
              {item.description}
            </div>
          ) : (
            <p 
              className="text-gray-600 leading-relaxed"
              style={getTextStyle('body')}
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

export default function ThreeStepHorizontal({ 
  sectionId, 
  className = '',
  backgroundType = 'neutral' 
}: ThreeStepHorizontalProps) {

  const { getTextStyle } = useTypography();
  const { 
    content, 
    mode, 
    theme,
    updateElementContent 
  } = useEditStore();

  // Get content for this section with type safety
  const sectionContent = content[sectionId];
  const elements = sectionContent?.elements || {} as Partial<StoreElementTypes>;

  // Helper to handle content updates
  const handleContentUpdate = (elementKey: string, value: string) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Extract content with type safety and defaults using the new system
  const blockContent: ThreeStepHorizontalContent = extractLayoutContent(elements, CONTENT_SCHEMA);

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

  // Generate color tokens from theme with correct nested structure
  const colorTokens = generateColorTokens({
    baseColor: theme?.colors?.baseColor || '#3B82F6',
    accentColor: theme?.colors?.accentColor || '#10B981',
    sectionBackgrounds: theme?.colors?.sectionBackgrounds || {
      primary: '#F8FAFC',
      secondary: '#F1F5F9', 
      neutral: '#FFFFFF',
      divider: '#E2E8F0'
    }
  });

  // Get section background based on type
  const getSectionBackground = () => {
    switch(backgroundType) {
      case 'primary': return colorTokens.bgPrimary;
      case 'secondary': return colorTokens.bgSecondary;
      case 'divider': return colorTokens.bgDivider;
      default: return colorTokens.bgNeutral;
    }
  };

  // Initialize fonts on component mount
  useEffect(() => {
    const { updateFontsFromTone } = useEditStore.getState();
    updateFontsFromTone(); // Set fonts based on current tone
  }, []);

  return (
    <section 
      className={`py-16 px-4 ${getSectionBackground()} ${className}`}
      data-section-id={sectionId}
      data-section-type="ThreeStepHorizontal"
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
              style={getTextStyle('h1')}
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
                style={getTextStyle('body-lg')}
              >
                {blockContent.conclusion_text || (mode === 'edit' ? 'Add optional conclusion text to summarize the process...' : '')}
              </p>
            </ModeWrapper>
          </div>
        )}

      </div>
    </section>
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