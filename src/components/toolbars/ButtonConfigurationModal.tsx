'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditStore } from '@/hooks/useEditStore';
import { Plus } from 'lucide-react';
import type { ElementSelection } from '@/types/core/ui';

interface ButtonConfig {
  type: 'link' | 'email-form' | 'form';
  text: string;
  url?: string;
  embed_code?: string;
  placement?: 'hero' | 'separate-section';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
}

interface ButtonConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementSelection: ElementSelection;
}

export function ButtonConfigurationModal({ 
  isOpen, 
  onClose, 
  elementSelection 
}: ButtonConfigurationModalProps) {
  const { 
    getAllForms, 
    showFormBuilder, 
    content,
    updateElementContent,
    setSection
  } = useEditStore();
  
  const availableForms = getAllForms();

  const [config, setConfig] = useState<ButtonConfig>({
    type: 'link',
    text: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with current element content
  useEffect(() => {
    if (elementSelection && content[elementSelection.sectionId]) {
      const element = content[elementSelection.sectionId].elements[elementSelection.elementKey];
      if (element) {
        setConfig({
          type: 'link',
          text: typeof element.content === 'string' ? element.content : 'Button Text',
        });
      }
    }
  }, [elementSelection, content]);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!config.text.trim()) {
      newErrors.text = 'Button text is required.';
    }

    if (config.type === 'link' && !config.url?.trim()) {
      newErrors.url = 'URL is required for external link.';
    }

    if (config.type === 'email-form' && !config.embed_code?.trim()) {
      newErrors.embedCode = 'Embed code is required for email form.';
    }

    if (config.type === 'form' && !config.formId) {
      newErrors.form = 'Please select a form or create a new one.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    // Update element content with button text
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      config.text
    );

    // Store button configuration in element metadata
    const currentSection = content[elementSelection.sectionId];
    if (currentSection?.elements[elementSelection.elementKey]) {
      const element = currentSection.elements[elementSelection.elementKey];
      const updatedElement = {
        ...element,
        metadata: {
          ...element.metadata,
          buttonConfig: {
            type: config.type,
            ...(config.type === 'link' && { url: config.url }),
            ...(config.type === 'form' && { 
              formId: config.formId, 
              behavior: config.behavior 
            }),
            ...(config.type === 'email-form' && { 
              embed_code: config.embed_code, 
              placement: config.placement 
            }),
          }
        }
      };

      // Update the element in store using setSection
      setSection(elementSelection.sectionId, {
        elements: {
          ...currentSection.elements,
          [elementSelection.elementKey]: updatedElement
        }
      });
      
      console.log('Button configuration saved:', config);
    }

    onClose();
  };

  const handleCreateNewForm = () => {
    showFormBuilder();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Button Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Button Text */}
          <div>
            <Label htmlFor="button-text">Button Text*</Label>
            <Input
              id="button-text"
              value={config.text}
              onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter button text"
            />
            {errors.text && <p className="text-sm text-red-500 mt-1">{errors.text}</p>}
          </div>

          {/* Button Action Type */}
          <div>
            <Label>Button Action*</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(val) => setConfig(prev => ({ ...prev, type: val as any }))}
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="link" id="link" />
                <div>
                  <Label htmlFor="link">External Link</Label>
                  <p className="text-sm text-gray-600">
                    Redirect to external URL like Typeform, Calendly, etc.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="form" id="form" />
                <div>
                  <Label htmlFor="form">Native Form</Label>
                  <p className="text-sm text-gray-600">
                    Link to a custom form with scroll or modal behavior.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="email-form" id="email-form" />
                <div>
                  <Label htmlFor="email-form">Email Form Embed</Label>
                  <p className="text-sm text-gray-600">
                    Embed Mailchimp, ConvertKit, etc. form code.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Link Configuration */}
          {config.type === 'link' && (
            <div>
              <Label htmlFor="url">URL*</Label>
              <Input
                id="url"
                type="url"
                value={config.url || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-link.com"
              />
              {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
            </div>
          )}

          {/* Form Configuration */}
          {config.type === 'form' && (
            <div className="space-y-3">
              <div>
                <Label>Form Selection*</Label>
                <div className="space-y-2">
                  {availableForms.length > 0 ? (
                    <Select 
                      value={config.formId || ''} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, formId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a form" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.name} ({form.fields.length} fields)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No forms available. Create your first form below.
                    </div>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCreateNewForm}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Form
                  </Button>
                </div>
                {errors.form && <p className="text-sm text-red-500 mt-1">{errors.form}</p>}
              </div>

              {config.formId && (
                <div>
                  <Label>Button Behavior</Label>
                  <RadioGroup
                    value={config.behavior || 'scrollTo'}
                    onValueChange={(val) => setConfig(prev => ({ ...prev, behavior: val as 'scrollTo' | 'openModal' }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scrollTo" id="scroll-to" />
                      <Label htmlFor="scroll-to">Scroll to Form</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="openModal" id="open-modal" />
                      <Label htmlFor="open-modal">Open in Modal</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}

          {/* Email Form Configuration */}
          {config.type === 'email-form' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="embed-code">Embed Code*</Label>
                <Input
                  id="embed-code"
                  value={config.embed_code || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, embed_code: e.target.value }))}
                  placeholder="Paste HTML form code here"
                />
                {errors.embedCode && <p className="text-sm text-red-500 mt-1">{errors.embedCode}</p>}
                <p className="text-xs text-gray-600 mt-1">
                  Only pure HTML embeds are supported. Script-based forms are not supported.
                </p>
              </div>

              <div>
                <Label>Placement</Label>
                <RadioGroup
                  value={config.placement || 'hero'}
                  onValueChange={(val) => setConfig(prev => ({ ...prev, placement: val as 'hero' | 'separate-section' }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hero" id="place-hero" />
                    <Label htmlFor="place-hero">Hero Section</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="separate-section" id="place-section" />
                    <Label htmlFor="place-section">Separate Section</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}