'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { FormRenderer } from './FormRenderer';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/app/p/[slug]/components/AnalyticsContext';

interface ButtonConfig {
  type: 'link' | 'form';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  url?: string;
}

interface FormConnectedButtonProps {
  buttonConfig?: ButtonConfig;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  userId?: string;
  publishedPageId?: string;
  pageSlug?: string; // For analytics tracking
}

export function FormConnectedButton({ buttonConfig, className, children, onClick, userId, publishedPageId, pageSlug }: FormConnectedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getFormById } = useEditStore();
  const analytics = useAnalytics();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Track CTA click analytics
    const slug = pageSlug || analytics.pageSlug;
    if (slug && children) {
      analytics.trackEvent('landing_page_cta_click', {
        cta_text: typeof children === 'string' ? children : 'Button',
        cta_action: buttonConfig?.type || 'unknown',
        cta_behavior: buttonConfig?.behavior || null,
      });

      logger.debug('📊 Analytics: CTA click tracked', {
        slug,
        ctaText: children,
        action: buttonConfig?.type,
      });
    }

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
            // Scroll to form
            const formElement = document.getElementById(`form-${buttonConfig.formId}`);
            if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
        break;
    }
  };

  const form = buttonConfig?.formId ? getFormById(buttonConfig.formId) : null;

  return (
    <>
      <Button onClick={handleClick} className={className}>
        {children}
      </Button>
      
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