import React from 'react';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';

interface EditableTrustIndicatorsProps {
  mode: 'preview' | 'edit';
  trustItems: string[];
  onTrustItemChange: (index: number, value: string) => void;
  onAddTrustItem?: () => void;
  onRemoveTrustItem?: (index: number) => void;
  colorTokens: any;
  sectionBackground: string;
  sectionId: string;
  iconColor?: string;
  colorClass?: string;
  backgroundType?: 'primary' | 'secondary' | 'custom' | 'neutral' | 'divider' | 'theme' | string;
  maxItems?: number;
  showAddButton?: boolean;
}

export function EditableTrustIndicators({
  mode,
  trustItems,
  onTrustItemChange,
  onAddTrustItem,
  onRemoveTrustItem,
  colorTokens,
  sectionBackground,
  sectionId,
  iconColor = 'text-green-500',
  colorClass,
  backgroundType = 'primary',
  maxItems = 5,
  showAddButton = true
}: EditableTrustIndicatorsProps) {
  
  const mutedTextColor = colorClass || colorTokens.textMuted || 'text-gray-500';

  // Filter out empty items, null values, and removed markers for display
  const validItems = trustItems.filter(item => 
    item != null && 
    item.trim() !== '' && 
    item !== '___REMOVED___'
  ) as string[];
  const displayItems = validItems; // Always filter empty items, even in edit mode

  const handleAddItem = () => {
    // Count actual non-empty items, not the array length
    const actualItemCount = validItems.length;
    if (onAddTrustItem && actualItemCount < maxItems) {
      onAddTrustItem();
    }
  };

  const handleRemoveItem = (displayIndex: number) => {
    // Find the actual index in the original trustItems array
    let actualIndex = -1;
    let validCount = 0;
    for (let i = 0; i < trustItems.length; i++) {
      if (trustItems[i] != null && trustItems[i].trim() !== '' && trustItems[i] !== '___REMOVED___') {
        if (validCount === displayIndex) {
          actualIndex = i;
          break;
        }
        validCount++;
      }
    }
    
    if (onRemoveTrustItem && actualIndex !== -1) {
      onRemoveTrustItem(actualIndex);
    }
  };

  if (mode === 'preview' && validItems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {displayItems.map((item, displayIndex) => {
          // Find the actual index in the original trustItems array
          let actualIndex = -1;
          let validCount = 0;
          for (let i = 0; i < trustItems.length; i++) {
            if (trustItems[i] != null && trustItems[i].trim() !== '' && trustItems[i] !== '___REMOVED___') {
              if (validCount === displayIndex) {
                actualIndex = i;
                break;
              }
              validCount++;
            }
          }
          
          return (
          <div key={displayIndex} className="flex items-center space-x-2 relative group/trust-item">
            <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            
            {mode === 'edit' ? (
              <div className="flex items-center space-x-1">
                <EditableAdaptiveText
                  mode={mode}
                  value={item}
                  onEdit={(value) => onTrustItemChange(actualIndex, value)}
                  backgroundType={backgroundType as any}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm inline-block min-w-[100px]"
                  placeholder={`Trust item ${actualIndex + 1}`}
                  sectionBackground={sectionBackground}
                  data-section-id={sectionId}
                  data-element-key={`trust_item_${actualIndex + 1}`}
                />
                
                {/* Remove button - always show to allow complete removal */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(displayIndex);
                  }}
                  className="opacity-0 group-hover/trust-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
                  title="Remove this trust item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className={mutedTextColor}>{item}</span>
            )}
          </div>
          );
        })}
      </div>

      {/* Add button - only show in edit mode */}
      {mode === 'edit' && showAddButton && validItems.length < maxItems && (
        <button
          onClick={handleAddItem}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add trust item</span>
        </button>
      )}
    </div>
  );
}

export default EditableTrustIndicators;