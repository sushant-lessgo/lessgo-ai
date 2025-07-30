'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, GripVertical, Settings } from 'lucide-react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { MVPForm, MVPFormField, MVPFormFieldType, MVPFormIntegration } from '@/types/core/forms';

interface FormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingFormId?: string | null;
}

const FIELD_TYPES: { value: MVPFormFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text Input', description: 'Single line text field' },
  { value: 'email', label: 'Email', description: 'Email address field with validation' },
  { value: 'tel', label: 'Phone', description: 'Phone number field' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text field' },
  { value: 'select', label: 'Dropdown', description: 'Select from predefined options' },
];

export function FormBuilder({ isOpen, onClose, editingFormId }: FormBuilderProps) {
  const {
    forms,
    createForm,
    updateForm,
    deleteForm,
    addFormField,
    updateFormField,
    removeFormField,
    reorderFormFields,
  } = useEditStore();

  const [formData, setFormData] = useState<Partial<MVPForm>>({
    name: '',
    fields: [],
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    integrations: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load form data when editing
  useEffect(() => {
    if (editingFormId && forms?.[editingFormId]) {
      const existingForm = forms[editingFormId];
      setFormData({
        name: existingForm.name,
        fields: [...existingForm.fields],
        submitButtonText: existingForm.submitButtonText,
        successMessage: existingForm.successMessage,
        integrations: existingForm.integrations ? [...existingForm.integrations] : [],
      });
    } else {
      // Reset for new form
      setFormData({
        name: '',
        fields: [],
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!',
        integrations: [],
      });
    }
    setErrors({});
  }, [editingFormId, forms, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Form name is required';
    }

    if (!formData.fields?.length) {
      newErrors.fields = 'At least one field is required';
    }


    // Validate fields
    formData.fields?.forEach((field, index) => {
      if (!field.label?.trim()) {
        newErrors[`field-${index}-label`] = 'Field label is required';
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        newErrors[`field-${index}-options`] = 'Dropdown fields must have at least one option';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingFormId) {
        // Update existing form
        updateForm(editingFormId, formData as Partial<MVPForm>);
      } else {
        // Create new form
        createForm(formData as Omit<MVPForm, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddField = () => {
    const newField: MVPFormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: `Field ${(formData.fields?.length || 0) + 1}`,
      placeholder: '',
      required: false,
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const handleUpdateField = (fieldIndex: number, updates: Partial<MVPFormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.map((field, index) =>
        index === fieldIndex ? { ...field, ...updates } : field
      ) || [],
    }));
  };

  const handleRemoveField = (fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, index) => index !== fieldIndex) || [],
    }));
  };

  const handleMoveField = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const fields = [...(prev.fields || [])];
      const [movedField] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, movedField);
      return { ...prev, fields };
    });
  };

  const handleAddIntegration = (type: 'dashboard' | 'convertkit') => {
    const newIntegration: MVPFormIntegration = {
      id: `integration-${Date.now()}`,
      type,
      name: type === 'dashboard' ? 'Dashboard Storage' : 'ConvertKit',
      enabled: true,
      settings: {},
    };

    setFormData(prev => ({
      ...prev,
      integrations: [...(prev.integrations || []), newIntegration],
    }));
  };

  const handleUpdateIntegration = (integrationIndex: number, updates: Partial<MVPFormIntegration>) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations?.map((integration, index) =>
        index === integrationIndex ? { ...integration, ...updates } : integration
      ) || [],
    }));
  };

  const handleRemoveIntegration = (integrationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations?.filter((_, index) => index !== integrationIndex) || [],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFormId ? 'Edit Form' : 'Create New Form'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-name">Form Name*</Label>
              <Input
                id="form-name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact Form"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="submit-button">Submit Button Text</Label>
              <Input
                id="submit-button"
                value={formData.submitButtonText || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, submitButtonText: e.target.value }))}
                placeholder="Submit"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="success-message">Success Message</Label>
            <Textarea
              id="success-message"
              value={formData.successMessage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
              placeholder="Thank you for your submission!"
              rows={2}
            />
          </div>

          {/* Form Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Form Fields</h3>
              <Button onClick={handleAddField} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {errors.fields && <p className="text-sm text-red-500 mb-4">{errors.fields}</p>}

            <div className="space-y-4">
              {formData.fields?.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-sm font-medium">Field {index + 1}</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveField(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: MVPFormFieldType) =>
                          handleUpdateField(index, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((fieldType) => (
                            <SelectItem key={fieldType.value} value={fieldType.value}>
                              {fieldType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Field Label*</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        placeholder="Enter field label"
                      />
                      {errors[`field-${index}-label`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`field-${index}-label`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-4">
                      <Label>Options (one per line)*</Label>
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter(opt => opt.trim());
                          handleUpdateField(index, { options });
                        }}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                      {errors[`field-${index}-options`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`field-${index}-options`]}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={`required-${index}`}>Required field</Label>
                  </div>
                </div>
              ))}

              {formData.fields?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields added yet. Click "Add Field" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Integrations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Data Storage</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddIntegration('dashboard')} 
                  size="sm" 
                  variant="outline"
                  disabled={formData.integrations?.some(i => i.type === 'dashboard')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => handleAddIntegration('convertkit')} 
                  size="sm" 
                  variant="outline"
                  disabled={formData.integrations?.some(i => i.type === 'convertkit')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ConvertKit
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.integrations?.map((integration, index) => (
                <div key={integration.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={integration.enabled}
                          onChange={(e) => handleUpdateIntegration(index, { enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">({integration.type})</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveIntegration(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {integration.type === 'convertkit' && integration.enabled && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>API Key*</Label>
                        <Input
                          type="password"
                          value={integration.settings?.apiKey || ''}
                          onChange={(e) => handleUpdateIntegration(index, {
                            settings: { ...integration.settings, apiKey: e.target.value }
                          })}
                          placeholder="Enter ConvertKit API key"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Find your API key in ConvertKit Account Settings → API Keys
                        </p>
                      </div>
                      <div>
                        <Label>Form ID (Optional)</Label>
                        <Input
                          value={integration.settings?.formId || ''}
                          onChange={(e) => handleUpdateIntegration(index, {
                            settings: { ...integration.settings, formId: e.target.value }
                          })}
                          placeholder="ConvertKit form ID"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Leave empty to use default subscriber list
                        </p>
                      </div>
                    </div>
                  )}

                  {integration.type === 'dashboard' && integration.enabled && (
                    <div className="text-sm text-gray-600">
                      <p>✓ Form submissions will be stored in your dashboard</p>
                      <p>✓ View and export submissions from the main dashboard</p>
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  <p>No integrations configured. Add Dashboard or ConvertKit integration above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingFormId ? 'Update Form' : 'Create Form'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}