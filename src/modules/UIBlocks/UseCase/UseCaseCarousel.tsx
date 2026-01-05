// components/layout/UseCaseCarousel.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface UseCaseCarouselContent {
  headline: string;
  use_cases: string; // Legacy pipe-separated format for backward compatibility
  use_case_description?: string;
  // Individual use case fields for enhanced editing
  use_case_1?: string;
  use_case_2?: string;
  use_case_3?: string;
  use_case_4?: string;
  use_case_5?: string;
  use_case_6?: string;
  // Use case icons
  usecase_icon_1?: string;
  usecase_icon_2?: string;
  usecase_icon_3?: string;
  usecase_icon_4?: string;
  usecase_icon_5?: string;
  usecase_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Endless Possibilities' },
  use_cases: { type: 'string' as const, default: 'Customer Support Automation|Sales Pipeline Management|Marketing Campaign Optimization|Financial Report Generation|HR Process Streamlining|Inventory Management' },
  use_case_description: { type: 'string' as const, default: 'Optimize and automate this critical business process.' },
  // Individual use case fields with meaningful defaults
  use_case_1: { type: 'string' as const, default: 'Customer Support Automation' },
  use_case_2: { type: 'string' as const, default: 'Sales Pipeline Management' },
  use_case_3: { type: 'string' as const, default: 'Marketing Campaign Optimization' },
  use_case_4: { type: 'string' as const, default: '' },
  use_case_5: { type: 'string' as const, default: '' },
  use_case_6: { type: 'string' as const, default: '' },
  // Use case icons - contextually relevant defaults
  usecase_icon_1: { type: 'string' as const, default: '🎧' }, // Customer Support
  usecase_icon_2: { type: 'string' as const, default: '📊' }, // Sales Pipeline
  usecase_icon_3: { type: 'string' as const, default: '📈' }, // Marketing Campaign
  usecase_icon_4: { type: 'string' as const, default: '📋' }, // Financial Report
  usecase_icon_5: { type: 'string' as const, default: '👥' }, // HR Process
  usecase_icon_6: { type: 'string' as const, default: '📦' }  // Inventory Management
};

// Helper function to get all use cases from individual fields
const getUseCases = (blockContent: UseCaseCarouselContent): string[] => {
  const individualUseCases = [
    blockContent.use_case_1,
    blockContent.use_case_2,
    blockContent.use_case_3,
    blockContent.use_case_4,
    blockContent.use_case_5,
    blockContent.use_case_6
  ].filter((useCase): useCase is string =>
    Boolean(useCase && useCase.trim() !== '' && useCase !== '___REMOVED___')
  );

  // If we have individual use cases, use them
  if (individualUseCases.length > 0) {
    return individualUseCases;
  }

  // Fallback to legacy pipe-separated format
  return blockContent.use_cases
    ? blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean)
    : [];
};

// Helper function to add a new use case
const addUseCase = (blockContent: UseCaseCarouselContent): number => {
  const useCaseFields = [
    blockContent.use_case_1,
    blockContent.use_case_2,
    blockContent.use_case_3,
    blockContent.use_case_4,
    blockContent.use_case_5,
    blockContent.use_case_6
  ];

  // Find the first empty slot
  const emptyIndex = useCaseFields.findIndex(useCase =>
    !useCase || useCase.trim() === '' || useCase === '___REMOVED___'
  );

  return emptyIndex !== -1 ? emptyIndex : -1;
};

export default function UseCaseCarousel(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<UseCaseCarouselContent>({ ...props, contentSchema: CONTENT_SCHEMA });

  // Get use cases using the new helper function
  const useCases = getUseCases(blockContent);

  // Theme detection with priority: manual > auto > neutral
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Get theme-specific colors
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        iconBg: 'bg-orange-100',
        addBg: 'bg-orange-50',
        addHoverBg: 'hover:bg-orange-100',
        addBorder: 'border-orange-200',
        addHoverBorder: 'hover:border-orange-300',
        addIcon: 'text-orange-600',
        addText: 'text-orange-700'
      },
      cool: {
        iconBg: 'bg-blue-100',
        addBg: 'bg-blue-50',
        addHoverBg: 'hover:bg-blue-100',
        addBorder: 'border-blue-200',
        addHoverBorder: 'hover:border-blue-300',
        addIcon: 'text-blue-600',
        addText: 'text-blue-700'
      },
      neutral: {
        iconBg: 'bg-gray-100',
        addBg: 'bg-gray-50',
        addHoverBg: 'hover:bg-gray-100',
        addBorder: 'border-gray-200',
        addHoverBorder: 'hover:border-gray-300',
        addIcon: 'text-gray-600',
        addText: 'text-gray-700'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  // Get use case icon from content fields by index
  const getUseCaseIcon = (index: number) => {
    const iconFields = [
      blockContent.usecase_icon_1,
      blockContent.usecase_icon_2,
      blockContent.usecase_icon_3,
      blockContent.usecase_icon_4,
      blockContent.usecase_icon_5,
      blockContent.usecase_icon_6
    ];
    return iconFields[index] || '📋';
  };

  // Get the actual use case content for a given index
  const getUseCaseContent = (index: number): string => {
    const useCaseFields = [
      blockContent.use_case_1,
      blockContent.use_case_2,
      blockContent.use_case_3,
      blockContent.use_case_4,
      blockContent.use_case_5,
      blockContent.use_case_6
    ];
    return useCaseFields[index] || '';
  };

  // Handle adding a new use case
  const handleAddUseCase = () => {
    const emptyIndex = addUseCase(blockContent);
    if (emptyIndex !== -1) {
      const fieldKey = `use_case_${emptyIndex + 1}` as keyof UseCaseCarouselContent;
      handleContentUpdate(fieldKey, 'New Use Case');
    }
  };

  // Handle removing a use case
  const handleRemoveUseCase = (index: number) => {
    const fieldKey = `use_case_${index + 1}` as keyof UseCaseCarouselContent;
    handleContentUpdate(fieldKey, '___REMOVED___');

    // Also clear the corresponding icon
    const iconField = `usecase_icon_${index + 1}` as keyof UseCaseCarouselContent;
    handleContentUpdate(iconField, '');
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="UseCaseCarousel" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline
          mode={mode}
          value={blockContent.headline || ''}
          onEdit={(value) => handleContentUpdate('headline', value)}
          level="h2"
          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'secondary')}
          colorTokens={colorTokens}
          className="text-center mb-16"
          sectionId={sectionId}
          elementKey="headline"
          sectionBackground={sectionBackground}
        />

        <div className="flex overflow-x-auto space-x-6 pb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const useCaseContent = getUseCaseContent(index);
            if (!useCaseContent || useCaseContent === '___REMOVED___') return null;

            return (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 min-w-[300px] flex-shrink-0 relative group/use-case-card">
                {/* Icon section */}
                <div className={`w-12 h-12 ${themeColors.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                  <IconEditableText
                    mode={mode}
                    value={getUseCaseIcon(index)}
                    onEdit={(value) => handleContentUpdate(`usecase_icon_${index + 1}` as keyof UseCaseCarouselContent, value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    iconSize="lg"
                    className="text-2xl"
                    placeholder="📋"
                    sectionId={sectionId}
                    elementKey={`usecase_icon_${index + 1}`}
                  />
                </div>

                {/* Use case title - now editable */}
                <div className="mb-2">
                  <EditableAdaptiveText
                    mode={mode}
                    value={useCaseContent}
                    onEdit={(value) => handleContentUpdate(`use_case_${index + 1}` as keyof UseCaseCarouselContent, value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    variant="body"
                    className="font-bold text-gray-900 text-lg"
                    placeholder="Enter use case title"
                    sectionId={sectionId}
                    elementKey={`use_case_${index + 1}`}
                    sectionBackground="bg-white"
                  />
                </div>

                {/* Use case description - editable */}
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.use_case_description || ''}
                  onEdit={(value) => handleContentUpdate('use_case_description', value)}
                  backgroundType="neutral"
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-gray-600 text-sm"
                  placeholder="Describe this use case..."
                  sectionId={sectionId}
                  elementKey="use_case_description"
                  sectionBackground="bg-white"
                />

                {/* Delete button - only show in edit mode and if we have more than 1 card */}
                {mode === 'edit' && useCases.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveUseCase(index);
                    }}
                    className="opacity-0 group-hover/use-case-card:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200"
                    title="Remove this use case"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Use Case button - only show in edit mode and if under max limit */}
        {mode === 'edit' && useCases.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleAddUseCase}
              className={`flex items-center space-x-2 mx-auto px-4 py-3 ${themeColors.addBg} ${themeColors.addHoverBg} border-2 ${themeColors.addBorder} ${themeColors.addHoverBorder} rounded-xl transition-all duration-200 group`}
            >
              <svg className={`w-5 h-5 ${themeColors.addIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className={`${themeColors.addText} font-medium`}>Add Use Case</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'UseCaseCarousel',
  category: 'Use Case',
  description: 'Editable scrolling use case examples carousel with add/delete functionality',
  defaultBackgroundType: 'secondary' as const,
  features: [
    'Editable use case titles and descriptions',
    'Dynamic add/remove use cases (up to 6)',
    'Editable icons for each use case',
    'Hover-based delete buttons in edit mode',
    'Backward compatibility with pipe-separated format'
  ]
};