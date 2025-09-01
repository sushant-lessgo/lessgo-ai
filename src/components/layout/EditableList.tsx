// components/layout/EditableList.tsx
// Handles multi-item editing patterns with bulk editing interface

import React from 'react';
import { EditableContent } from './EditableContent';
import { updateListData } from '@/utils/dataParsingUtils';

interface EditableListProps<T> {
  mode: 'edit' | 'preview';
  items: T[];
  onUpdateItem: (field: string, index: number, value: string) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  bulkEditFields?: {
    key: string;
    label: string;
    currentValue: string;
    onUpdate: (value: string) => void;
  }[];
  listName: string;
  tips?: string[];
}

export function EditableList<T extends { id: string; index: number }>({
  mode,
  items,
  onUpdateItem,
  renderItem,
  bulkEditFields = [],
  listName,
  tips = []
}: EditableListProps<T>) {
  
  return (
    <>
      {/* Render individual items */}
      <div className="space-y-8 lg:space-y-0">
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Bulk editing interface (edit mode only) */}
      {mode !== 'preview' && bulkEditFields.length > 0 && (
        <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-700 mb-3">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              {listName} - Bulk Edit (separated by |)
            </span>
          </div>
          
          <div className="space-y-4 text-sm">
            {bulkEditFields.map((field) => (
              <div key={field.key}>
                <label className="block text-blue-700 font-medium mb-1">
                  {field.label}:
                </label>
                <EditableContent
                  mode="edit"
                  value={field.currentValue}
                  onEdit={field.onUpdate}
                  element="div"
                  className="bg-white p-3 rounded border text-gray-800 text-xs leading-relaxed max-h-32 overflow-y-auto"
                  multiline
                />
              </div>
            ))}
            
            {tips.length > 0 && (
              <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded space-y-1">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start">
                    <span className="mr-1">💡</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Specialized component for step lists
export function EditableStepList({
  mode,
  stepTitles,
  stepDescriptions,
  stepNumbers,
  onUpdateTitles,
  onUpdateDescriptions,
  onUpdateNumbers,
  renderStep,
  children
}: {
  mode: 'edit' | 'preview';
  stepTitles: string;
  stepDescriptions: string;
  stepNumbers?: string;
  onUpdateTitles: (value: string) => void;
  onUpdateDescriptions: (value: string) => void;
  onUpdateNumbers?: (value: string) => void;
  renderStep?: (title: string, description: string, number: string, index: number) => React.ReactNode;
  children?: React.ReactNode;
}) {
  
  const titles = stepTitles.split('|').map(t => t.trim()).filter(t => t);
  const descriptions = stepDescriptions.split('|').map(d => d.trim()).filter(d => d);
  const numbers = stepNumbers ? stepNumbers.split('|').map(n => n.trim()).filter(n => n) : [];
  
  const handleItemUpdate = (field: string, index: number, value: string) => {
    switch (field) {
      case 'title':
        onUpdateTitles(updateListData(stepTitles, index, value));
        break;
      case 'description':
        onUpdateDescriptions(updateListData(stepDescriptions, index, value));
        break;
      case 'number':
        if (onUpdateNumbers) {
          onUpdateNumbers(updateListData(stepNumbers || '', index, value));
        }
        break;
    }
  };

  const items = titles.map((title, index) => ({
    id: `step-${index}`,
    index,
    title,
    description: descriptions[index] || '',
    number: numbers[index] || (index + 1).toString()
  }));

  const bulkEditFields = [
    {
      key: 'titles',
      label: 'Step Titles',
      currentValue: stepTitles,
      onUpdate: onUpdateTitles
    },
    {
      key: 'descriptions',
      label: 'Step Descriptions',
      currentValue: stepDescriptions,
      onUpdate: onUpdateDescriptions
    }
  ];

  if (onUpdateNumbers) {
    bulkEditFields.push({
      key: 'numbers',
      label: 'Step Numbers (optional)',
      currentValue: stepNumbers || '',
      onUpdate: onUpdateNumbers
    });
  }

  return (
    <EditableList
      mode={mode}
      items={items}
      onUpdateItem={handleItemUpdate}
      renderItem={(item, index) => 
        renderStep ? 
          renderStep(item.title, item.description, item.number, index) :
          children
      }
      bulkEditFields={bulkEditFields}
      listName="Step List"
      tips={[
        'Steps are automatically numbered 1, 2, 3 unless custom numbers provided',
        'Each item should be separated by the | character',
        'You can also edit individual items by clicking directly on them above'
      ]}
    />
  );
}