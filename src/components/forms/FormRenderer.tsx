'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import type { MVPForm, MVPFormField } from '@/types/core/forms';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/app/p/[slug]/components/AnalyticsContext';

interface FormRendererProps {
  form: MVPForm;
  mode?: 'inline' | 'modal';
  className?: string;
  userId?: string;
  publishedPageId?: string;
  pageSlug?: string; // For analytics tracking
  onSubmit?: (data: Record<string, any>) => Promise<void>;
  sectionId?: string; // For element selection in edit mode
  submitButtonElementKey?: string; // For element selection in edit mode
  colorTokens?: any; // Color tokens for styling submit button
}

interface FormErrors {
  [fieldId: string]: string;
}

export function FormRenderer({ form, mode = 'inline', className = '', userId, publishedPageId, pageSlug, onSubmit, sectionId, submitButtonElementKey, colorTokens }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const analytics = useAnalytics();

  const validateField = (field: MVPFormField, value: any): string | null => {
    // Required field validation
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    // Email validation
    if (field.type === 'email' && value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Phone validation (basic)
    if (field.type === 'tel' && value && typeof value === 'string') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    form.fields.forEach((field) => {
      const value = formData[field.id];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default form submission via API
        const response = await fetch('/api/forms/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: form.id,
            data: formData,
            userId,
            publishedPageId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit form');
        }
      }

      // Analytics: Track form submission
      const slug = pageSlug || analytics.pageSlug;
      if (slug) {
        analytics.trackEvent('landing_page_form_submit', {
          form_id: form.id,
          form_name: form.name,
          form_fields: form.fields.map(f => f.type),
          form_field_count: form.fields.length,
        });

        logger.debug('📊 Analytics: Form submission tracked', {
          slug,
          formId: form.id,
          formName: form.name,
        });
      }

      setIsSubmitted(true);
      setFormData({});
    } catch (error) {
      logger.error('Form submission error:', () => error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: MVPFormField) => {
    const fieldError = errors[field.id];
    const fieldValue = formData[field.id] || '';

    const fieldProps = {
      id: field.id,
      'aria-describedby': fieldError ? `${field.id}-error` : undefined,
      'aria-invalid': !!fieldError,
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            {...fieldProps}
            type="text"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case 'email':
        return (
          <Input
            {...fieldProps}
            type="email"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'your@email.com'}
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case 'tel':
        return (
          <Input
            {...fieldProps}
            type="tel"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || '+1 (555) 123-4567'}
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...fieldProps}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            {...fieldProps}
            type="text"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldError ? 'border-red-500' : ''}
          />
        );
    }
  };

  if (isSubmitted) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">Success!</h3>
        <p className="text-gray-600">{form.successMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            {renderField(field)}
            
            {errors[field.id] && (
              <p id={`${field.id}-error`} className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${colorTokens?.ctaBg || colorTokens?.accent || 'bg-primary'} ${colorTokens?.ctaText || 'text-white'} hover:${colorTokens?.ctaHover || colorTokens?.accentHover || 'bg-primary/90'}`}
          size="lg"
          data-section-id={sectionId}
          data-element-key={submitButtonElementKey}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            form.submitButtonText
          )}
        </Button>
      </form>
    </div>
  );
}