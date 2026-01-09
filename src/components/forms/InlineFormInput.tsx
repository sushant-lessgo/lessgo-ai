'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import posthog from 'posthog-js';
import type { MVPForm, MVPFormField } from '@/types/core/forms';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/app/p/[slug]/components/AnalyticsContext';

/**
 * InlineFormInput Component
 *
 * Single-field inline form that replaces CTA buttons for email capture.
 * Renders as: [Input Field] [Submit Button] side-by-side
 *
 * Features:
 * - Matches CTA button styling (size, variant, colors)
 * - Inline validation and error states
 * - Mobile responsive (stacks on small screens)
 * - Same submission logic as full forms
 */

interface InlineFormInputProps {
  /** The form configuration (must have exactly 1 field) */
  form: MVPForm;

  /** Button size to match */
  size?: 'small' | 'medium' | 'large';

  /** Button variant for styling */
  variant?: 'primary' | 'secondary';

  /** Color tokens for theming */
  colorTokens?: {
    ctaBg?: string;
    ctaText?: string;
    accentBorder?: string;
    textPrimary?: string;
    surfaceElevated?: string;
    inputBg?: string;
    inputBorder?: string;
    inputText?: string;
  };

  /** Custom className */
  className?: string;

  /** User ID for analytics */
  userId?: string;

  /** Published page ID for form submissions */
  publishedPageId?: string;

  /** Page slug for analytics */
  pageSlug?: string;

  /** Section ID for tracking */
  sectionId?: string;

  /** Custom submit handler */
  onSubmit?: (data: Record<string, any>) => Promise<void>;
}

export function InlineFormInput({
  form,
  size = 'large',
  variant = 'primary',
  colorTokens,
  className = '',
  userId,
  publishedPageId,
  pageSlug,
  sectionId,
  onSubmit,
}: InlineFormInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analytics = useAnalytics();

  // Validate that form has exactly one field
  if (!form.fields || form.fields.length !== 1) {
    logger.error('InlineFormInput requires exactly 1 field', { fieldCount: form.fields?.length });
    return null;
  }

  const field = form.fields[0];

  const validateField = (val: string): string | null => {
    // Required validation
    if (field.required && !val.trim()) {
      return `${field.label} is required`;
    }

    // Email validation
    if (field.type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return 'Please enter a valid email';
      }
    }

    // Phone validation
    if (field.type === 'tel' && val) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateField(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submissionData = {
        [field.id]: value,
      };

      // Custom submit handler or default API call
      if (onSubmit) {
        await onSubmit(submissionData);
      } else {
        const response = await fetch('/api/forms/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId: form.id,
            data: submissionData,
            userId,
            publishedPageId,
          }),
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }
      }

      // Success
      setIsSubmitted(true);

      // Track analytics
      if (analytics?.track) {
        analytics.track('form_submitted', {
          formId: form.id,
          formName: form.name,
          sectionId,
          pageSlug,
          fieldCount: 1,
          placement: 'inline',
        });
      }

      if (typeof posthog !== 'undefined') {
        posthog.capture('form_submitted', {
          formId: form.id,
          formName: form.name,
          placement: 'inline',
        });
      }

      logger.info('Inline form submitted', { formId: form.id });
    } catch (err: any) {
      logger.error('Inline form submission failed', err);
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className={`flex items-center gap-2 ${getSizeClasses(size).container} ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">
            {form.successMessage || 'Thank you! We\'ll be in touch soon.'}
          </span>
        </div>
      </div>
    );
  }

  // Get styling classes
  const sizeClasses = getSizeClasses(size);
  const buttonStyles = getButtonStyles(variant, colorTokens);

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Input Field */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type={field.type}
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || field.label}
            required={field.required}
            disabled={isSubmitting}
            className={`
              w-full rounded-lg border transition-all duration-200
              ${sizeClasses.input}
              ${
                error
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'focus:border-blue-500 focus:ring-blue-200'
              }
              ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            style={{
              backgroundColor: colorTokens?.inputBg || '#FFFFFF',
              borderColor: error ? '#EF4444' : (colorTokens?.inputBorder || '#D1D5DB'),
              color: colorTokens?.inputText || '#111827',
            }}
          />

          {/* Field Error */}
          {error && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            ${sizeClasses.button}
            rounded-lg font-semibold transition-all duration-200
            flex items-center justify-center gap-2
            ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105'}
          `}
          style={buttonStyles}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>{form.submitButtonText || 'Submit'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Form-level Error */}
      {submitError && (
        <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{submitError}</span>
        </div>
      )}
    </form>
  );
}

/**
 * Get size-specific classes for input and button
 */
function getSizeClasses(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: 'text-sm',
        input: 'px-3 py-2 text-sm',
        button: 'px-4 py-2 text-sm whitespace-nowrap',
      };
    case 'medium':
      return {
        container: 'text-base',
        input: 'px-4 py-2.5 text-base',
        button: 'px-5 py-2.5 text-base whitespace-nowrap',
      };
    case 'large':
      return {
        container: 'text-lg',
        input: 'px-5 py-3 text-lg',
        button: 'px-6 py-3 text-lg whitespace-nowrap',
      };
    default:
      return {
        container: 'text-base',
        input: 'px-4 py-2.5 text-base',
        button: 'px-5 py-2.5 text-base whitespace-nowrap',
      };
  }
}

/**
 * Get button styling based on variant and color tokens
 */
function getButtonStyles(
  variant: 'primary' | 'secondary',
  colorTokens?: any
): React.CSSProperties {
  if (variant === 'secondary') {
    return {
      backgroundColor: colorTokens?.surfaceElevated || '#F3F4F6',
      color: colorTokens?.textPrimary || '#111827',
    };
  }

  // Primary variant (default)
  return {
    backgroundColor: colorTokens?.ctaBg || '#14B8A6',
    color: colorTokens?.ctaText || '#FFFFFF',
  };
}
