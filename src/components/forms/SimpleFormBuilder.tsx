'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { useEditStore } from '@/hooks/useEditStore';
import { FORM_FIELD_OPTIONS } from '@/types/simpleForms';
import type { SimpleFormData, SimpleFormField } from '@/types/simpleForms';

export function SimpleFormBuilder() {
  const { 
    forms, 
    formBuilder,
    hideFormBuilder, 
    addForm, 
    updateForm, 
    getFormById,
    addFormField,
    updateFormField,
    removeFormField
  } = useEditStore();

  // Provide fallback if formBuilder is undefined
  const safeFormBuilder = formBuilder || {
    visible: false,
    editingFormId: undefined,
    editingField: undefined,
    fieldLibrary: []
  };

  const [formData, setFormData] = useState<SimpleFormData>({
    id: '',
    name: '',
    title: '',
    fields: [],
    buttonText: 'Submit',
    placement: 'hero',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const editingFormId = safeFormBuilder.editingFormId;

  useEffect(() => {
    if (editingFormId) {
      const existingForm = getFormById(editingFormId);
      if (existingForm) {
        setFormData(existingForm);
        setIsEditing(true);
      }
    } else {
      setFormData({
        id: `form-${Date.now()}`,
        name: '',
        title: '',
        fields: [],
        buttonText: 'Submit',
        placement: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsEditing(false);
    }
  }, [editingFormId, getFormById]);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Form name is required';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Form title is required';
    }
    
    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    if (isEditing) {
      updateForm(formData.id, formData);
    } else {
      addForm(formData);
    }
    
    hideFormBuilder();
  };

  const handleAddField = (fieldType: SimpleFormField['type']) => {
    const fieldOption = FORM_FIELD_OPTIONS.find(opt => opt.type === fieldType);
    if (!fieldOption) return;

    const newField: SimpleFormField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: fieldOption.label,
      placeholder: fieldOption.placeholder,
      required: false,
      order: formData.fields.length
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const handleUpdateField = (fieldId: string, updates: Partial<SimpleFormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleClose = () => {
    hideFormBuilder();
  };

  if (!safeFormBuilder.visible) return null;

  return (
    <Dialog open={safeFormBuilder.visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Form' : 'Create New Form'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-name">Form Name*</Label>
              <Input
                id="form-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Contact Form"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="form-title">Form Title*</Label>
              <Input
                id="form-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Get in Touch"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={formData.buttonText}
                onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                placeholder="Submit"
              />
            </div>

            <div>
              <Label>Form Placement</Label>
              <RadioGroup
                value={formData.placement}
                onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value as 'hero' | 'cta-section' }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hero" id="hero" />
                  <Label htmlFor="hero">Hero Section</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cta-section" id="cta-section" />
                  <Label htmlFor="cta-section">CTA Section</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="privacy-note">Privacy Note (Optional)</Label>
              <Textarea
                id="privacy-note"
                value={formData.privacyNote || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, privacyNote: e.target.value }))}
                placeholder="We respect your privacy and will never share your information."
                rows={2}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Form Fields</Label>
              <div className="flex gap-2">
                {FORM_FIELD_OPTIONS.map((option) => (
                  <Button
                    key={option.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField(option.type)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No fields added yet. Click the buttons above to add fields.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.fields.map((field) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <CardTitle className="text-sm">{field.type.toUpperCase()} Field</CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor={`field-${field.id}-label`}>Label</Label>
                        <Input
                          id={`field-${field.id}-label`}
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`field-${field.id}-placeholder`}>Placeholder</Label>
                        <Input
                          id={`field-${field.id}-placeholder`}
                          value={field.placeholder || ''}
                          onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.id}-required`}
                          checked={field.required}
                          onCheckedChange={(checked) => handleUpdateField(field.id, { required: !!checked })}
                        />
                        <Label htmlFor={`field-${field.id}-required`}>Required field</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {errors.fields && <p className="text-sm text-red-500">{errors.fields}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Update Form' : 'Create Form'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}