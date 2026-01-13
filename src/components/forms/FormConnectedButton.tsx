'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { FormRenderer } from './FormRenderer';
import { InlineFormInput } from './InlineFormInput';
import { logger } from '@/lib/logger';
import { determineFormPlacement } from '@/utils/formPlacement';
import { findPrimaryCTASection } from '@/utils/sectionHelpers';

interface ButtonConfig {
  type: 'link' | 'form' | 'link-with-input';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary'; // NEW: CTA type for placement logic
  url?: string;
  inputConfig?: {
    label?: string;
    placeholder?: string;
    queryParamName?: string;
  };
}

interface FormConnectedButtonProps {
  buttonConfig?: ButtonConfig;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  userId?: string;
  publishedPageId?: string;
  pageSlug?: string; // For analytics tracking
  sectionId?: string; // NEW: Current section for placement logic
  size?: 'small' | 'medium' | 'large'; // NEW: Button size for inline forms
  variant?: 'primary' | 'secondary'; // NEW: Button variant for inline forms
  colorTokens?: any; // NEW: Color tokens for styling
}

export function FormConnectedButton({
  buttonConfig,
  className,
  children,
  onClick,
  userId,
  publishedPageId,
  pageSlug,
  sectionId,
  size,
  variant,
  colorTokens,
}: FormConnectedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const { getFormById, sections } = useEditStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // If there's a custom onClick handler, use it
    if (onClick) {
      onClick();
      return;
    }

    if (!buttonConfig) return;

    switch (buttonConfig.type) {
      case 'link':
        if (buttonConfig.url) {
          window.open(buttonConfig.url, '_blank');
        }
        break;

      case 'link-with-input':
        if (buttonConfig.url && buttonConfig.inputConfig?.queryParamName) {
          let url = buttonConfig.url;
          if (!url.match(/^https?:\/\//)) {
            url = `https://${url}`;
          }
          const separator = url.includes('?') ? '&' : '?';
          const encodedValue = encodeURIComponent(inputValue);
          const finalUrl = `${url}${separator}${buttonConfig.inputConfig.queryParamName}=${encodedValue}`;
          window.open(finalUrl, '_blank');
        }
        break;

      case 'form':
        if (buttonConfig.formId) {
          const form = getFormById(buttonConfig.formId);
          if (!form) {
            logger.warn('Form not found:', () => buttonConfig.formId);
            return;
          }

          if (buttonConfig.behavior === 'openModal') {
            setIsModalOpen(true);
          } else {
            // Scroll to primary CTA section (where full forms render)
            const primaryCTASection = findPrimaryCTASection(sections);
            if (primaryCTASection) {
              const ctaSectionElement = document.getElementById(`section-${primaryCTASection}`);
              if (ctaSectionElement) {
                ctaSectionElement.scrollIntoView({ behavior: 'smooth' });
              } else {
                // Fallback: scroll to form ID
                const formElement = document.getElementById(`form-${buttonConfig.formId}`);
                if (formElement) {
                  formElement.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }
          }
        }
        break;
    }
  };

  const form = buttonConfig?.formId ? getFormById(buttonConfig.formId) : null;

  // NEW: Check if this button should render as inline form
  if (buttonConfig?.type === 'form' && form && sectionId) {
    const ctaType = buttonConfig.ctaType || 'primary';
    const placement = determineFormPlacement(
      form,
      ctaType,
      sectionId,
      sections,
      buttonConfig.behavior
    );

    // Inline forms: Replace button with InlineFormInput
    if (placement.renderAs === 'inputWithButton') {
      return (
        <InlineFormInput
          form={form}
          size={size || 'large'}
          variant={variant || 'primary'}
          colorTokens={colorTokens}
          userId={userId}
          publishedPageId={publishedPageId}
          pageSlug={pageSlug}
          sectionId={sectionId}
          className={className}
        />
      );
    }

    // Invalid form: Render disabled button
    if (placement.placement === 'invalid') {
      return (
        <Button disabled className={className}>
          {children || 'Configure CTA'}
        </Button>
      );
    }
  }

  return (
    <>
      {buttonConfig?.type === 'link-with-input' ? (
        <div className="space-y-3">
          {buttonConfig.inputConfig?.label && (
            <label className="block text-sm font-medium mb-2">
              {buttonConfig.inputConfig.label}
            </label>
          )}
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            placeholder={buttonConfig.inputConfig?.placeholder || 'Enter value...'}
            className={`w-full ${inputError ? 'border-red-500' : ''}`}
          />
          {inputError && (
            <p className="text-sm text-red-500 mt-1">{inputError}</p>
          )}
          <Button onClick={handleClick} className={className}>
            {children}
          </Button>
        </div>
      ) : (
        <Button onClick={handleClick} className={className}>
          {children}
        </Button>
      )}

      {buttonConfig?.behavior === 'openModal' && form && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{form.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <FormRenderer
                form={form}
                userId={userId}
                publishedPageId={publishedPageId}
                pageSlug={pageSlug}
                mode="modal"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}