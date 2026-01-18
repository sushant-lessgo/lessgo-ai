// components/layout/IndustryUseCaseGrid.tsx
import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline, EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';

interface IndustryUseCaseGridContent {
  headline: string;
  // Legacy pipe-separated format (for backwards compatibility)
  industries?: string;
  use_cases?: string;
  // Individual industry and use case fields
  industry_1?: string;
  industry_2?: string;
  industry_3?: string;
  industry_4?: string;
  industry_5?: string;
  industry_6?: string;
  use_case_1?: string;
  use_case_2?: string;
  use_case_3?: string;
  use_case_4?: string;
  use_case_5?: string;
  use_case_6?: string;
  // Industry icons
  industry_icon_1?: string;
  industry_icon_2?: string;
  industry_icon_3?: string;
  industry_icon_4?: string;
  industry_icon_5?: string;
  industry_icon_6?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Trusted Across Industries' },
  // Individual industry fields
  industry_1: { type: 'string' as const, default: 'Healthcare' },
  industry_2: { type: 'string' as const, default: 'Finance' },
  industry_3: { type: 'string' as const, default: 'Manufacturing' },
  industry_4: { type: 'string' as const, default: 'Retail' },
  industry_5: { type: 'string' as const, default: 'Education' },
  industry_6: { type: 'string' as const, default: 'Technology' },
  // Individual use case fields
  use_case_1: { type: 'string' as const, default: 'Patient data management and treatment optimization' },
  use_case_2: { type: 'string' as const, default: 'Risk assessment and fraud detection' },
  use_case_3: { type: 'string' as const, default: 'Quality control and supply chain optimization' },
  use_case_4: { type: 'string' as const, default: 'Customer analytics and inventory management' },
  use_case_5: { type: 'string' as const, default: 'Student performance tracking and curriculum planning' },
  use_case_6: { type: 'string' as const, default: 'Development workflow automation and testing' },
  // Industry icons - matching the defaults
  industry_icon_1: { type: 'string' as const, default: '🏥' },
  industry_icon_2: { type: 'string' as const, default: '🏦' },
  industry_icon_3: { type: 'string' as const, default: '🏭' },
  industry_icon_4: { type: 'string' as const, default: '🛍️' },
  industry_icon_5: { type: 'string' as const, default: '🎓' },
  industry_icon_6: { type: 'string' as const, default: '💻' }
};

// Helper functions for card management
const getIndustryCards = (blockContent: IndustryUseCaseGridContent) => {
  // First try individual fields
  const individualIndustries = [
    blockContent.industry_1,
    blockContent.industry_2,
    blockContent.industry_3,
    blockContent.industry_4,
    blockContent.industry_5,
    blockContent.industry_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  const individualUseCases = [
    blockContent.use_case_1,
    blockContent.use_case_2,
    blockContent.use_case_3,
    blockContent.use_case_4,
    blockContent.use_case_5,
    blockContent.use_case_6
  ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));

  // If individual fields exist, use them
  if (individualIndustries.length > 0) {
    return individualIndustries.map((industry, index) => ({
      industry,
      useCase: individualUseCases[index] || 'Industry-specific use case',
      id: `industry-${index}`
    }));
  }

  // Legacy format fallback
  if (blockContent.industries && blockContent.use_cases) {
    const industries = blockContent.industries.split('|').map(i => i.trim()).filter(Boolean);
    const useCases = blockContent.use_cases.split('|').map(u => u.trim()).filter(Boolean);
    return industries.map((industry, index) => ({
      industry,
      useCase: useCases[index] || 'Industry-specific use case',
      id: `industry-${index}`
    }));
  }

  return [];
};

// Helper function to add a new industry card
const addIndustryCard = (blockContent: IndustryUseCaseGridContent, handleContentUpdate: any) => {
  const allIndustries = [
    blockContent.industry_1,
    blockContent.industry_2,
    blockContent.industry_3,
    blockContent.industry_4,
    blockContent.industry_5,
    blockContent.industry_6
  ];

  const emptyIndex = allIndustries.findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');

  if (emptyIndex !== -1) {
    const industryField = `industry_${emptyIndex + 1}` as keyof IndustryUseCaseGridContent;
    const useCaseField = `use_case_${emptyIndex + 1}` as keyof IndustryUseCaseGridContent;
    handleContentUpdate(industryField, 'New Industry');
    handleContentUpdate(useCaseField, 'Describe how your solution helps this industry');
  }
};

// Helper function to remove an industry card
const removeIndustryCard = (index: number, handleContentUpdate: any) => {
  const industryField = `industry_${index + 1}` as keyof IndustryUseCaseGridContent;
  const useCaseField = `use_case_${index + 1}` as keyof IndustryUseCaseGridContent;
  handleContentUpdate(industryField, '___REMOVED___');
  handleContentUpdate(useCaseField, '___REMOVED___');
};

export default function IndustryUseCaseGrid(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<IndustryUseCaseGridContent>({ ...props, contentSchema: CONTENT_SCHEMA });

  // Detect theme: manual override > auto-detection > neutral fallback
  const uiTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based color mapping
  const getThemeColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        cardBg: 'bg-white',
        cardBorder: 'border-orange-200',
        cardHover: 'hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50',
        iconBg: 'bg-orange-50',
        iconText: 'text-orange-600',
        industryText: 'text-gray-900',
        useCaseText: 'text-gray-600'
      },
      cool: {
        cardBg: 'bg-white',
        cardBorder: 'border-blue-200',
        cardHover: 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50',
        iconBg: 'bg-blue-50',
        iconText: 'text-blue-600',
        industryText: 'text-gray-900',
        useCaseText: 'text-gray-600'
      },
      neutral: {
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        cardHover: 'hover:shadow-lg',
        iconBg: 'bg-gray-50',
        iconText: 'text-gray-600',
        industryText: 'text-gray-900',
        useCaseText: 'text-gray-600'
      }
    }[theme];
  };

  const themeColors = getThemeColors(uiTheme);

  const industryCards = getIndustryCards(blockContent);

  // Get industry icon from content fields by index
  const getIndustryIcon = (index: number) => {
    const iconFields = [
      blockContent.industry_icon_1,
      blockContent.industry_icon_2,
      blockContent.industry_icon_3,
      blockContent.industry_icon_4,
      blockContent.industry_icon_5,
      blockContent.industry_icon_6
    ];
    return iconFields[index] || '🏢';
  };

  // Handle individual field updates
  const handleIndustryUpdate = (index: number, value: string) => {
    const fieldKey = `industry_${index + 1}` as keyof IndustryUseCaseGridContent;
    handleContentUpdate(fieldKey, value);
  };

  const handleUseCaseUpdate = (index: number, value: string) => {
    const fieldKey = `use_case_${index + 1}` as keyof IndustryUseCaseGridContent;
    handleContentUpdate(fieldKey, value);
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="IndustryUseCaseGrid" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-7xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industryCards.map((card, index) => {
            // Calculate actual field index based on content
            const actualIndex = [
              blockContent.industry_1,
              blockContent.industry_2,
              blockContent.industry_3,
              blockContent.industry_4,
              blockContent.industry_5,
              blockContent.industry_6
            ].findIndex(item => item === card.industry && item !== '___REMOVED___');

            const fieldIndex = actualIndex !== -1 ? actualIndex : index;

            return (
              <div key={card.id} className={`relative group/industry-card-${fieldIndex} ${themeColors.cardBg} p-8 rounded-xl border ${themeColors.cardBorder} ${themeColors.cardHover} transition-all duration-300`}>
                {/* Delete button - only show in edit mode */}
                {mode === 'edit' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeIndustryCard(fieldIndex, handleContentUpdate);
                    }}
                    className={`opacity-0 group-hover/industry-card-${fieldIndex}:opacity-100 absolute top-4 right-4 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10`}
                    title="Remove this industry card"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className={`${themeColors.iconBg} ${themeColors.iconText} p-6 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-6`}>
                  <IconEditableText
                    mode={mode}
                    value={getIndustryIcon(fieldIndex)}
                    onEdit={(value) => handleContentUpdate(`industry_icon_${fieldIndex + 1}` as keyof IndustryUseCaseGridContent, value)}
                    backgroundType="neutral"
                    colorTokens={colorTokens}
                    iconSize="xl"
                    className="text-6xl"
                    placeholder="🏢"
                    sectionId={sectionId}
                    elementKey={`industry_icon_${fieldIndex + 1}`}
                  />
                </div>

                <div className="mb-4 text-center">
                  {mode === 'edit' ? (
                    <EditableAdaptiveText
                      mode={mode}
                      value={card.industry}
                      onEdit={(value) => handleIndustryUpdate(fieldIndex, value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="font-bold text-gray-900 text-center"
                      placeholder="Industry name"
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`industry_${fieldIndex + 1}`}
                    />
                  ) : (
                    <h3 className="font-bold text-gray-900">{card.industry}</h3>
                  )}
                </div>

                <div className="text-center">
                  {mode === 'edit' ? (
                    <EditableAdaptiveText
                      mode={mode}
                      value={card.useCase}
                      onEdit={(value) => handleUseCaseUpdate(fieldIndex, value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-gray-600 text-center"
                      placeholder="Describe how your solution helps this industry"
                      sectionBackground={sectionBackground}
                      sectionId={sectionId}
                      elementKey={`use_case_${fieldIndex + 1}`}
                    />
                  ) : (
                    <p className="text-gray-600">{card.useCase}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Industry Button - only show in edit mode and if under max limit */}
        {mode === 'edit' && industryCards.length < 6 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => addIndustryCard(blockContent, handleContentUpdate)}
              className="flex items-center space-x-2 mx-auto px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-blue-700 font-medium">Add Industry</span>
            </button>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'IndustryUseCaseGrid', category: 'Use Case', description: 'Industry-specific use cases grid', defaultBackgroundType: 'neutral' as const };