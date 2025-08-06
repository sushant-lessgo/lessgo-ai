'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { Plus } from 'lucide-react';
import type { ElementSelection } from '@/types/store/state';

interface ButtonConfig {
  type: 'link' | 'form';
  text: string;
  url?: string;
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with current element content and saved configuration
  useEffect(() => {
    if (elementSelection && content[elementSelection.sectionId]) {
      const element = content[elementSelection.sectionId].elements[elementSelection.elementKey];
      if (element) {
        const buttonText = typeof element.content === 'string' ? element.content : 'Button Text';
        
        // Check if there's saved button configuration in metadata
        const savedConfig = element.metadata?.buttonConfig;
        
        if (savedConfig) {
          // Load saved configuration
          setConfig({
            type: savedConfig.type || 'link',
            text: buttonText,
            url: savedConfig.url || '',
            formId: savedConfig.formId || '',
            behavior: savedConfig.behavior || 'scrollTo',
          });
          console.log('Loaded saved button config:', savedConfig);
        } else {
          // Default configuration
          setConfig({
            type: 'link',
            text: buttonText,
          });
        }
      }
    }
    // Reset success state when modal opens
    setShowSuccess(false);
  }, [elementSelection, content]);

  const handleSave = async () => {
    console.log('🔧 handleSave called');
    const newErrors: Record<string, string> = {};

    if (!config.text.trim()) {
      newErrors.text = 'Button text is required.';
    }

    if (config.type === 'link' && !config.url?.trim()) {
      newErrors.url = 'URL is required for external link.';
    }


    if (config.type === 'form' && !config.formId) {
      newErrors.form = 'Please select a form or create a new one.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('🔧 Validation errors:', newErrors);
      return;
    }

    console.log('🔧 Validation passed, updating content');
    setIsSaving(true);

    try {
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
            }
          }
        };

        // Create ctaConfig for compatibility with HeroSection
        const ctaConfig = {
          type: config.type === 'link' ? 'link' as const : 'form' as const,
          cta_text: config.text,
          url: config.type === 'link' ? config.url : undefined,
          formId: config.type === 'form' ? config.formId : undefined,
          behavior: config.type === 'form' ? config.behavior : undefined,
        };

        // Update the element in store using setSection, including ctaConfig
        setSection(elementSelection.sectionId, {
          elements: {
            ...currentSection.elements,
            [elementSelection.elementKey]: updatedElement
          }
        });
        
        console.log('🔧 Button configuration saved:', config);
        console.log('🔧 CTA config created:', ctaConfig);
      }

      // Clear any existing errors first
      setErrors({});
      
      // Show success message using DOM manipulation
      console.log('🔧 Setting showSuccess to true');
      setShowSuccess(true);
      setIsSaving(false);
      
      // Create success notification directly
      const successDiv = document.createElement('div');
      successDiv.id = 'button-config-success';
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #16a34a;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideDown 0.3s ease-out;
      `;
      
      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      // Create checkmark icon
      const iconSvg = `
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
      
      // Build success message content
      let messageHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${iconSvg}
          <div>
            <div style="font-weight: 600; font-size: 16px;">Success!</div>
            <div style="font-size: 14px; margin-top: 2px; opacity: 0.9;">
              ${config.type === 'link' ? 'External link configured successfully' : 
                'Form connection configured successfully'}
            </div>
          </div>
        </div>
      `;
      
      successDiv.innerHTML = messageHTML;
      document.body.appendChild(successDiv);
      
      // Close after showing the message
      setTimeout(() => {
        console.log('🔧 Timeout triggered, closing modal');
        if (document.getElementById('button-config-success')) {
          document.body.removeChild(successDiv);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
        onClose();
      }, 2000);
    } catch (error) {
      console.error('🔧 Error saving configuration:', error);
      setIsSaving(false);
    }
  };

  const handleCreateNewForm = () => {
    showFormBuilder();
    // Don't close the button config modal yet - let user create the form first
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
                    Create a custom form with built-in integrations.
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
                        {availableForms.map((form: any) => (
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


          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}