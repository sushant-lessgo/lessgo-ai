/**
 * FormMarkupPublished - Server-rendered form component for static pages
 *
 * Renders vanilla HTML forms without React hydration.
 * Pairs with formHandler.js for client-side submission.
 *
 * Key differences from FormIsland:
 * - No 'use client' directive (server component)
 * - No React state or event handlers
 * - Data attributes for JS handler integration
 * - Matches FormIsland styling
 */

import React from 'react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
}

interface FormMarkupPublishedProps {
  formId: string;
  fields: FormField[];
  submitButtonText: string;
  successMessage?: string;
  publishedPageId: string;
  pageOwnerId: string;
  buttonColor?: string;
  textColor?: string;
}

export function FormMarkupPublished({
  formId,
  fields,
  submitButtonText = 'Submit',
  successMessage = 'Your submission has been received.',
  publishedPageId,
  pageOwnerId,
  buttonColor = '#DB2777',
  textColor = '#FFFFFF',
}: FormMarkupPublishedProps) {
  return (
    <form
      data-lessgo-form
      data-form-id={formId}
      data-page-id={publishedPageId}
      data-owner-id={pageOwnerId}
      data-success-message={successMessage}
      className="space-y-4"
    >
      {fields.map((field) => (
        <div key={field.id}>
          {field.label && (
            <label
              htmlFor={`${formId}-${field.id}`}
              className="text-gray-700 font-semibold block mb-2"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {field.type === 'textarea' ? (
            <textarea
              id={`${formId}-${field.id}`}
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          ) : field.type === 'select' ? (
            <select
              id={`${formId}-${field.id}`}
              name={field.id}
              required={field.required}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${formId}-${field.id}`}
              type={field.type}
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        style={{
          background: buttonColor,
          color: textColor,
        }}
        className="w-full px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
      >
        {submitButtonText}
      </button>
    </form>
  );
}
