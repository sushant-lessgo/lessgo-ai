// components/layout/InteractiveUseCaseMap.tsx
import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveHeadline } from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface InteractiveUseCaseMapContent {
  headline: string;
  // Individual category and use case fields
  category_1?: string;
  category_2?: string;
  category_3?: string;
  category_4?: string;
  category_5?: string;
  category_6?: string;
  use_case_1?: string;
  use_case_2?: string;
  use_case_3?: string;
  use_case_4?: string;
  use_case_5?: string;
  use_case_6?: string;
  // Optional category icons
  category_icon_1?: string;
  category_icon_2?: string;
  category_icon_3?: string;
  category_icon_4?: string;
  category_icon_5?: string;
  category_icon_6?: string;
  // Legacy support
  categories?: string;
  use_cases?: string;
}

const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'Explore Use Cases by Category' },
  // Individual category fields
  category_1: { type: 'string' as const, default: 'Marketing' },
  category_2: { type: 'string' as const, default: 'Sales' },
  category_3: { type: 'string' as const, default: 'Operations' },
  category_4: { type: 'string' as const, default: 'Finance' },
  category_5: { type: 'string' as const, default: 'HR' },
  category_6: { type: 'string' as const, default: 'IT' },
  // Individual use case fields
  use_case_1: { type: 'string' as const, default: 'Campaign automation and lead nurturing' },
  use_case_2: { type: 'string' as const, default: 'Pipeline management and forecasting' },
  use_case_3: { type: 'string' as const, default: 'Process optimization and workflow automation' },
  use_case_4: { type: 'string' as const, default: 'Budget planning and expense tracking' },
  use_case_5: { type: 'string' as const, default: 'Recruitment and employee onboarding' },
  use_case_6: { type: 'string' as const, default: 'System monitoring and maintenance' },
  // Optional category icons - department-specific defaults
  category_icon_1: { type: 'string' as const, default: '📊' }, // Marketing - chart
  category_icon_2: { type: 'string' as const, default: '💰' }, // Sales - money bag
  category_icon_3: { type: 'string' as const, default: '⚙️' }, // Operations - gear
  category_icon_4: { type: 'string' as const, default: '📋' }, // Finance - clipboard
  category_icon_5: { type: 'string' as const, default: '👥' }, // HR - people
  category_icon_6: { type: 'string' as const, default: '💻' }  // IT - computer
};

// Helper functions for parsing categories and use cases
const parseCategories = (content: InteractiveUseCaseMapContent): { category: string; useCase: string; index: number }[] => {
  const categoryFields = [
    content.category_1,
    content.category_2,
    content.category_3,
    content.category_4,
    content.category_5,
    content.category_6
  ];

  const useCaseFields = [
    content.use_case_1,
    content.use_case_2,
    content.use_case_3,
    content.use_case_4,
    content.use_case_5,
    content.use_case_6
  ];

  const items: { category: string; useCase: string; index: number }[] = [];

  // Check for individual fields first
  for (let i = 0; i < 6; i++) {
    if (categoryFields[i] && categoryFields[i] !== '___REMOVED___') {
      items.push({
        category: categoryFields[i] || '',
        useCase: useCaseFields[i] || 'Use case details for this category',
        index: i
      });
    }
  }

  // Legacy fallback if no individual fields
  if (items.length === 0 && content.categories) {
    const cats = content.categories.split('|').map(c => c.trim()).filter(Boolean);
    const uses = content.use_cases ? content.use_cases.split('|').map(u => u.trim()).filter(Boolean) : [];
    cats.forEach((cat, i) => {
      items.push({
        category: cat,
        useCase: uses[i] || 'Use case details for this category',
        index: i
      });
    });
  }

  // Default if no data
  if (items.length === 0) {
    items.push({
      category: 'New Category',
      useCase: 'Describe the use case for this category',
      index: 0
    });
  }

  return items;
};

// Helper function to add a category
const addCategory = (content: InteractiveUseCaseMapContent, handleUpdate: (field: string, value: string) => void) => {
  // Find the first empty slot
  for (let i = 1; i <= 6; i++) {
    const categoryField = `category_${i}` as keyof InteractiveUseCaseMapContent;
    if (!content[categoryField] || content[categoryField] === '___REMOVED___') {
      handleUpdate(categoryField, 'New Category');
      handleUpdate(`use_case_${i}`, 'Describe the use case for this category');
      handleUpdate(`category_icon_${i}`, '🎯');
      break;
    }
  }
};

// Helper function to remove a category
const removeCategory = (index: number, handleUpdate: (field: string, value: string) => void) => {
  handleUpdate(`category_${index + 1}`, '___REMOVED___');
  handleUpdate(`use_case_${index + 1}`, '___REMOVED___');
  handleUpdate(`category_icon_${index + 1}`, '___REMOVED___');
};

export default function InteractiveUseCaseMap(props: LayoutComponentProps) {
  const { sectionId, mode, blockContent, colorTokens, getTextStyle, sectionBackground, handleContentUpdate } = useLayoutComponent<InteractiveUseCaseMapContent>({ ...props, contentSchema: CONTENT_SCHEMA });
  const categoryData = parseCategories(blockContent);
  const [selectedCategory, setSelectedCategory] = useState(0);

  // Get category icon from content fields by index
  const getCategoryIcon = (index: number) => {
    const iconFields = [
      blockContent.category_icon_1,
      blockContent.category_icon_2,
      blockContent.category_icon_3,
      blockContent.category_icon_4,
      blockContent.category_icon_5,
      blockContent.category_icon_6
    ];
    return iconFields[index] && iconFields[index] !== '___REMOVED___' ? iconFields[index] : '🎯';
  };

  // Handle category edit
  const handleCategoryEdit = (index: number, value: string) => {
    handleContentUpdate(`category_${index + 1}` as keyof InteractiveUseCaseMapContent, value);
  };

  // Handle use case edit
  const handleUseCaseEdit = (index: number, value: string) => {
    handleContentUpdate(`use_case_${index + 1}` as keyof InteractiveUseCaseMapContent, value);
  };

  return (
    <LayoutSection sectionId={sectionId} sectionType="InteractiveUseCaseMap" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} sectionBackground={sectionBackground} mode={mode} className={props.className}>
      <div className="max-w-6xl mx-auto">
        <EditableAdaptiveHeadline mode={mode} value={blockContent.headline || ''} onEdit={(value) => handleContentUpdate('headline', value)} level="h2" backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')} colorTokens={colorTokens} className="text-center mb-16" sectionId={sectionId} elementKey="headline" sectionBackground={sectionBackground} />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {categoryData.map((item, idx) => (
              <div key={item.index} className={`relative group/category-${item.index}`}>
                <button
                  onClick={() => setSelectedCategory(idx)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedCategory === idx ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'}`}
                >
                  <div className="flex items-center space-x-3">
                    <IconEditableText
                      mode={mode}
                      value={getCategoryIcon(item.index)}
                      onEdit={(value) => handleContentUpdate(`category_icon_${item.index + 1}` as keyof InteractiveUseCaseMapContent, value)}
                      backgroundType={selectedCategory === idx ? 'primary' : 'neutral'}
                      colorTokens={selectedCategory === idx ?
                        { ...colorTokens, textPrimary: 'text-white' } :
                        colorTokens
                      }
                      iconSize="sm"
                      className={`text-lg ${selectedCategory === idx ? 'text-white' : 'text-gray-600'}`}
                      sectionId={sectionId}
                      elementKey={`category_icon_${item.index + 1}`}
                    />
                    {mode === 'edit' ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleCategoryEdit(item.index, e.currentTarget.textContent || '')}
                        className={`outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 font-semibold ${selectedCategory === idx ? 'text-white' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.category}
                      </div>
                    ) : (
                      <div className="font-semibold">{item.category}</div>
                    )}
                  </div>
                </button>

                {/* Delete button */}
                {mode === 'edit' && categoryData.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(item.index, handleContentUpdate);
                      if (selectedCategory === idx) {
                        setSelectedCategory(0);
                      }
                    }}
                    className={`absolute top-2 right-2 opacity-0 group-hover/category-${item.index}:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 z-10`}
                    title="Remove this category"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* Add Category Button */}
            {mode === 'edit' && categoryData.length < 6 && (
              <button
                onClick={() => addCategory(blockContent, handleContentUpdate)}
                className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Category</span>
              </button>
            )}
          </div>
          <div className="bg-white p-8 rounded-xl border border-gray-200">
            {categoryData.length > 0 && categoryData[selectedCategory] && (
              <>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">
                  {categoryData[selectedCategory].category} Use Cases
                </h3>
                {mode === 'edit' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleUseCaseEdit(categoryData[selectedCategory].index, e.currentTarget.textContent || '')}
                    className="text-gray-600 mb-6 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[60px] cursor-text hover:bg-gray-50"
                  >
                    {categoryData[selectedCategory].useCase}
                  </div>
                ) : (
                  <p className="text-gray-600 mb-6">
                    {categoryData[selectedCategory].useCase}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = { name: 'InteractiveUseCaseMap', category: 'Use Case', description: 'Interactive use case explorer by category', defaultBackgroundType: 'neutral' as const };