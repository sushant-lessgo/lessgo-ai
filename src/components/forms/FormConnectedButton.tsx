'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEditStore } from '@/hooks/useEditStore';
import { FormRenderer } from './FormRenderer';
import { InlineFormInput } from './InlineFormInput';
import { logger } from '@/lib/logger';
import { determineFormPlacement } from '@/utils/formPlacement';
import { findPrimaryCTASection, deriveCtaRole } from '@/utils/sectionHelpers';
import { toDestination } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';

interface ButtonConfig {
  type: 'link' | 'form' | 'link-with-input';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary'; // legacy role field (fallback for deriveCtaRole)
  url?: string;
  // scale-04: new-shape role carrier (read first by deriveCtaRole).
  cta?: { role?: 'primary' | 'secondary' };
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
  const getFormById = useEditStore((s) => s.getFormById);
  const sections = useEditStore((s) => s.sections);
  // Subscribe to the forms slice so form edits re-render (getFormById derives from it).
  const forms = useEditStore((s) => s.forms);
  void forms;

  // scale-04: navigate to a resolved Destination (or a raw href string). Behavior
  // is keyed off the Destination TYPE — section anchors scroll, tel:/mailto: stay
  // same-tab, everything else opens a new tab. Shared model with the resolver.
  const navigateToDestination = (target: import('@/types/destination').Destination | string) => {
    const dest =
      typeof target === 'string' ? toDestination(target) : target;
    if (dest === undefined || dest === 'GOAL_REF') return;
    const href = resolveDestination(dest);
    if (!href) return;

    if (dest.kind === 'section') {
      const el =
        document.getElementById(`section-${dest.anchor}`) ||
        document.getElementById(dest.anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (dest.kind === 'call' || dest.kind === 'email' || dest.kind === 'page') {
      window.location.href = href;
      return;
    }
    let url = href;
    if (/^www\./i.test(url) || !/^[a-z]+:|^\//i.test(url)) url = `https://${url}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // If there's a custom onClick handler, use it
    if (onClick) {
      onClick();
      return;
    }

    if (!buttonConfig) return;

    // Form case (D-D): keep the scroll/modal behavior — the forms-existence
    // check stays out of the pure shim.
    if (buttonConfig.type === 'form') {
      if (!buttonConfig.formId) return;
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
            const formElement = document.getElementById(`form-${buttonConfig.formId}`);
            if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
      return;
    }

    // link-with-input: fold the input value into the url, then route through the
    // shared shim so tel:/mailto:/wa.me classify like everywhere else.
    if (buttonConfig.type === 'link-with-input') {
      if (buttonConfig.url && buttonConfig.inputConfig?.queryParamName) {
        let url = buttonConfig.url;
        if (!url.match(/^https?:\/\//)) url = `https://${url}`;
        const separator = url.includes('?') ? '&' : '?';
        const encodedValue = encodeURIComponent(inputValue);
        const finalUrl = `${url}${separator}${buttonConfig.inputConfig.queryParamName}=${encodedValue}`;
        navigateToDestination(finalUrl);
      }
      return;
    }

    // Everything else (link): shim → resolver → navigate by Destination type.
    const dest = toDestination(buttonConfig);
    if (dest === undefined || dest === 'GOAL_REF') return;
    navigateToDestination(dest);
  };

  const form = buttonConfig?.formId ? getFormById(buttonConfig.formId) : null;

  // NEW: Check if this button should render as inline form
  if (buttonConfig?.type === 'form' && form && sectionId) {
    // scale-04: unified role read — new `cta.role` first, legacy `ctaType` next.
    const ctaType = deriveCtaRole({ cta: buttonConfig.cta, ctaType: buttonConfig.ctaType });
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