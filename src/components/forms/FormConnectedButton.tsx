'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEditStore } from '@/hooks/useEditStore';
import { SimpleFormRenderer } from './SimpleFormRenderer';
interface ButtonConfig {
  type: 'link' | 'form' | 'email-form';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  url?: string;
}

interface FormConnectedButtonProps {
  buttonConfig?: ButtonConfig;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function FormConnectedButton({ buttonConfig, className, children, onClick }: FormConnectedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getFormById } = useEditStore();

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
        
      case 'form':
        if (buttonConfig.formId) {
          const form = getFormById(buttonConfig.formId);
          if (!form) {
            console.warn('Form not found:', buttonConfig.formId);
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
        
      case 'email-form':
        console.log('Email form embed not yet implemented');
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
              <DialogTitle>{form.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <SimpleFormRenderer form={form} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}