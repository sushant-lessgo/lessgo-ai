// app/edit/[token]/components/toolbars/FormToolbar.tsx - Complete Form Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';

interface FormToolbarProps {
  targetId: string;
  position: { x: number; y: number };
  contextActions: any[];
}

export function FormToolbar({ targetId, position, contextActions }: FormToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const fieldPickerRef = useRef<HTMLDivElement>(null);

  const {
    forms,
    showFormBuilder,
    addFormField,
    removeFormField,
    updateFormField,
    toggleFormFieldRequired,
    reorderFormFields,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();

  // Calculate arrow position
  const targetElement = document.querySelector(`[data-form-id="${targetId}"]`);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 360, height: 48 }
  ) : null;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
      if (
        fieldPickerRef.current &&
        !fieldPickerRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowFieldPicker(false);
      }
    };

    if (showAdvanced || showFieldPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced, showFieldPicker]);

  // Handle adding form field
  const handleAddField = (fieldType: string) => {
    addFormField(targetId, {
      id: `field-${Date.now()}`,
      type: fieldType as any,
      label: getFieldLabel(fieldType),
      placeholder: getFieldPlaceholder(fieldType),
      required: false,
      validation: {},
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : undefined,
    });
    
    setShowFieldPicker(false);
    announceLiveRegion(`Added ${fieldType} field`);
  };

  // Handle removing form field
  const handleRemoveField = () => {
    const fieldId = prompt('Enter field ID to remove:');
    if (fieldId) {
      removeFormField(targetId, fieldId);
      announceLiveRegion(`Removed field ${fieldId}`);
    }
  };

  // Handle toggling required field
  const handleToggleRequired = () => {
    const fieldId = prompt('Enter field ID to toggle required:');
    if (fieldId) {
      toggleFormFieldRequired(targetId, fieldId);
      announceLiveRegion(`Toggled required for field ${fieldId}`);
    }
  };

  // Handle form builder
  const handleFormBuilder = () => {
    showFormBuilder(targetId);
    announceLiveRegion('Opening form builder');
  };

  // Utility functions
  const getFieldLabel = (fieldType: string): string => {
    const labels = {
      'text': 'Text Input',
      'email': 'Email Address',
      'tel': 'Phone Number',
      'textarea': 'Message',
      'select': 'Select Option',
      'checkbox': 'Checkbox',
      'radio': 'Radio Button',
      'file': 'File Upload',
      'date': 'Date',
      'url': 'Website URL',
    };
    return labels[fieldType as keyof typeof labels] || 'Form Field';
  };

  const getFieldPlaceholder = (fieldType: string): string => {
    const placeholders = {
      'text': 'Enter text...',
      'email': 'Enter your email...',
      'tel': 'Enter your phone number...',
      'textarea': 'Enter your message...',
      'url': 'Enter website URL...',
    };
    return placeholders[fieldType as keyof typeof placeholders] || '';
  };

  // Primary Actions
  const primaryActions = [
    {
      id: 'add-field',
      label: 'Add Field',
      icon: 'plus',
      handler: () => setShowFieldPicker(true),
    },
    {
      id: 'remove-field',
      label: 'Remove Field',
      icon: 'minus',
      handler: handleRemoveField,
    },
    {
      id: 'toggle-required',
      label: 'Required',
      icon: 'required',
      handler: handleToggleRequired,
    },
    {
      id: 'form-builder',
      label: 'Form Builder',
      icon: 'builder',
      handler: handleFormBuilder,
    },
    {
      id: 'reorder-fields',
      label: 'Reorder',
      icon: 'reorder',
      handler: () => executeAction('reorder-form-fields', { formId: targetId }),
    },
  ];

  // Advanced Actions
  const advancedActions = [
    {
      id: 'form-validation',
      label: 'Validation Rules',
      icon: 'validation',
      handler: () => executeAction('form-validation', { formId: targetId }),
    },
    {
      id: 'form-integrations',
      label: 'Integrations',
      icon: 'integrations',
      handler: () => executeAction('form-integrations', { formId: targetId }),
    },
    {
      id: 'form-styling',
      label: 'Form Styling',
      icon: 'palette',
      handler: () => executeAction('form-styling', { formId: targetId }),
    },
    {
      id: 'form-logic',
      label: 'Conditional Logic',
      icon: 'logic',
      handler: () => executeAction('form-logic', { formId: targetId }),
    },
    {
      id: 'form-notifications',
      label: 'Notifications',
      icon: 'notifications',
      handler: () => executeAction('form-notifications', { formId: targetId }),
    },
    {
      id: 'form-export',
      label: 'Export Data',
      icon: 'export',
      handler: () => executeAction('form-export', { formId: targetId }),
    },
    {
      id: 'form-analytics',
      label: 'Form Analytics',
      icon: 'analytics',
      handler: () => executeAction('form-analytics', { formId: targetId }),
    },
  ];

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Arrow */}
        {arrowInfo && (
          <div 
            className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              arrowInfo.direction === 'up' ? 'border-t-0 border-l-0 -bottom-1' :
              arrowInfo.direction === 'down' ? 'border-b-0 border-r-0 -top-1' :
              arrowInfo.direction === 'left' ? 'border-l-0 border-b-0 -right-1' :
              'border-r-0 border-t-0 -left-1'
            }`}
            style={{
              left: arrowInfo.direction === 'up' || arrowInfo.direction === 'down' ? arrowInfo.x - 4 : undefined,
              top: arrowInfo.direction === 'left' || arrowInfo.direction === 'right' ? arrowInfo.y - 4 : undefined,
            }}
          />
        )}
        
        <div className="flex items-center px-3 py-2">
          {/* Form Indicator */}
          <div className="flex items-center space-x-1 mr-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">Form</span>
          </div>
          
          {/* Primary Actions */}
          {primaryActions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
              <button
                onClick={action.handler}
                className="flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                title={action.label}
              >
                <FormIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
          
          {/* Advanced Actions Trigger */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showAdvanced 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="More form options"
          >
            <span>⋯</span>
          </button>
        </div>
      </div>

      {/* Advanced Actions Menu */}
      {showAdvanced && (
        <AdvancedActionsMenu
          ref={advancedRef}
          actions={advancedActions}
          position={{
            x: position.x + 360,
            y: position.y,
          }}
          onClose={() => setShowAdvanced(false)}
        />
      )}

      {/* Field Picker Panel */}
      {showFieldPicker && (
        <FieldPickerPanel
          ref={fieldPickerRef}
          position={{
            x: position.x,
            y: position.y + 60,
          }}
          onSelectField={handleAddField}
          onClose={() => setShowFieldPicker(false)}
        />
      )}
    </>
  );
}

// Field Picker Panel Component
const FieldPickerPanel = React.forwardRef<HTMLDivElement, {
  position: { x: number; y: number };
  onSelectField: (fieldType: string) => void;
  onClose: () => void;
}>(({ position, onSelectField, onClose }, ref) => {
  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: 'text' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'tel', label: 'Phone', icon: 'phone' },
    { type: 'textarea', label: 'Text Area', icon: 'textarea' },
    { type: 'select', label: 'Dropdown', icon: 'dropdown' },
    { type: 'checkbox', label: 'Checkbox', icon: 'checkbox' },
    { type: 'radio', label: 'Radio Button', icon: 'radio' },
    { type: 'file', label: 'File Upload', icon: 'file' },
    { type: 'date', label: 'Date', icon: 'date' },
    { type: 'url', label: 'URL', icon: 'url' },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: 280,
        maxHeight: 400,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Add Form Field</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {fieldTypes.map((field) => (
            <button
              key={field.type}
              onClick={() => onSelectField(field.type)}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="mb-2">
                <FormIcon icon={field.icon} />
              </div>
              <span className="text-xs text-gray-700 text-center">{field.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

FieldPickerPanel.displayName = 'FieldPickerPanel';

// Form Icon Component
function FormIcon({ icon }: { icon: string }) {
  const iconMap = {
    'plus': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    'minus': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
      </svg>
    ),
    'required': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    'builder': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    'reorder': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    'validation': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'integrations': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    'palette': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    'logic': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3" />
      </svg>
    ),
    'notifications': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 17h5l-5 5v-5z" />
      </svg>
    ),
    'export': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    'analytics': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'text': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    'email': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'phone': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    'textarea': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'dropdown': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    ),
    'checkbox': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'radio': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'file': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    'date': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    'url': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}