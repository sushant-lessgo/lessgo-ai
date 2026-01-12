/**
 * InlineFormMarkupPublished - Server-rendered inline form for static export
 *
 * Single-field form that renders inline (email input + submit button side-by-side).
 * Server component (no client state) for static HTML generation.
 * Pairs with form.v1.js for client-side submission handling.
 *
 * Key differences from InlineFormInput:
 * - No 'use client' directive (server component)
 * - No React state or event handlers
 * - Data attributes for form.v1.js integration
 * - Uses inline styles for theme colors
 */

import React from 'react';
import type { MVPForm, MVPFormField } from '@/types/core/forms';

interface InlineFormMarkupPublishedProps {
  /** The form configuration (must have exactly 1 field) */
  form: MVPForm;

  /** Published page ID for form submissions */
  publishedPageId: string;

  /** Page owner ID for form submissions */
  pageOwnerId: string;

  /** Button size to match CTA styling */
  size?: 'medium' | 'large';

  /** Button variant for styling */
  variant?: 'primary' | 'secondary';

  /** Color tokens for theming */
  colorTokens?: {
    bg: string;
    text: string;
    bgHover?: string;
  };

  /** Custom className */
  className?: string;
}

export function InlineFormMarkupPublished({
  form,
  publishedPageId,
  pageOwnerId,
  size = 'large',
  variant = 'primary',
  colorTokens,
  className = '',
}: InlineFormMarkupPublishedProps) {
  // Validate single field
  if (!form.fields || form.fields.length !== 1) {
    console.warn(`InlineFormMarkupPublished requires exactly 1 field, got ${form.fields?.length}`);
    return null;
  }

  const field = form.fields[0];
  const sizeClasses = getSizeClasses(size);

  // Default colors
  const buttonBg = colorTokens?.bg || '#DB2777';
  const buttonText = colorTokens?.text || '#FFFFFF';

  return (
    <div
      data-lessgo-inline-form={form.id}
      data-page-id={publishedPageId}
      data-owner-id={pageOwnerId}
      data-success-message={form.successMessage || "Thank you! We'll be in touch soon."}
      className={`w-full ${className}`}
    >
      <form className="inline-form-container">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input Field */}
          <div className="flex-1">
            <input
              type={field.type}
              name={field.id}
              id={`${form.id}-${field.id}`}
              placeholder={field.placeholder || field.label}
              required={field.required}
              className={`
                w-full min-w-[200px] rounded-lg border border-gray-300
                transition-all duration-200
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                ${sizeClasses.input}
              `}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#111827',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`
              ${sizeClasses.button}
              rounded-lg font-semibold transition-all duration-200
              shadow-xl hover:shadow-2xl
              transform hover:-translate-y-0.5
              flex items-center justify-center gap-2
              whitespace-nowrap
            `}
            style={{
              backgroundColor: buttonBg,
              color: buttonText,
            }}
          >
            <span>{form.submitButtonText || 'Submit'}</span>
            {/* Arrow icon SVG */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Get size-specific classes for input and button
 * Matches InlineFormInput sizing
 */
function getSizeClasses(size: 'medium' | 'large') {
  switch (size) {
    case 'medium':
      return {
        input: 'px-4 py-2.5 text-base',
        button: 'px-5 py-2.5 text-base',
      };
    case 'large':
      return {
        input: 'px-6 py-4 text-lg',
        button: 'px-8 py-4 text-lg',
      };
    default:
      return {
        input: 'px-4 py-2.5 text-base',
        button: 'px-5 py-2.5 text-base',
      };
  }
}
