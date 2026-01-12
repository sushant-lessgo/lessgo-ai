/**
 * Lessgo Forms - Vanilla JS Form Handler
 * Handles form submissions on static published pages
 *
 * Features:
 * - Client-side validation (required, email)
 * - Async submission with keepalive
 * - Success/error UI
 * - Analytics integration via window._lessgoTrack
 *
 * Target: <3KB gzipped
 */

(function() {
  'use strict';

  // Basic email validation (simplified per SecondOpinion.md)
  function isValidEmail(email) {
    return email && email.includes('@') && email.includes('.');
  }

  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Show inline error for a field
  function showFieldError(field, message) {
    // Remove existing error
    const existingError = field.parentElement.querySelector('.lessgo-form-error');
    if (existingError) existingError.remove();

    // Create error element
    const error = document.createElement('div');
    error.className = 'lessgo-form-error';
    error.textContent = message;
    error.style.cssText = 'color: #DC2626; font-size: 0.875rem; margin-top: 0.25rem;';

    field.parentElement.appendChild(error);
    field.style.borderColor = '#DC2626';
  }

  // Clear field error
  function clearFieldError(field) {
    const error = field.parentElement.querySelector('.lessgo-form-error');
    if (error) error.remove();
    field.style.borderColor = '';
  }

  // Validate form fields
  function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      clearFieldError(field);

      // Check required fields
      if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'This field is required');
        isValid = false;
        return;
      }

      // Validate email fields
      if (field.type === 'email' && field.value.trim()) {
        if (!isValidEmail(field.value.trim())) {
          showFieldError(field, 'Please enter a valid email address');
          isValid = false;
        }
      }
    });

    return isValid;
  }

  // Show success UI (matches FormIsland.tsx)
  function showSuccess(form, successMessage) {
    const successHTML = `
      <div class="bg-green-50 border border-green-200 rounded-2xl p-8">
        <div class="text-center">
          <div class="text-green-600 text-2xl mb-2">✓</div>
          <h3 class="text-lg font-semibold text-green-900 mb-1">Thank you!</h3>
          <p class="text-green-700">${escapeHTML(successMessage || 'Your submission has been received.')}</p>
        </div>
      </div>
    `;

    form.outerHTML = successHTML;
  }

  // Show inline success UI (for inline forms)
  function showInlineSuccess(container, successMessage) {
    const formContainer = container.querySelector('.inline-form-container');
    if (!formContainer) return;

    const successHTML = `
      <div class="flex items-center gap-2 text-green-600 font-medium">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>${escapeHTML(successMessage || "Thank you! We'll be in touch soon.")}</span>
      </div>
    `;

    formContainer.innerHTML = successHTML;
  }

  // Show inline error (for inline forms)
  function showInlineError(container, message) {
    // Remove existing error
    const existingError = container.querySelector('.inline-form-error');
    if (existingError) existingError.remove();

    // Create error element
    const error = document.createElement('div');
    error.className = 'inline-form-error text-red-600 text-sm mt-2';
    error.textContent = message;

    container.appendChild(error);

    // Auto-hide after 5s
    setTimeout(() => error.remove(), 5000);
  }

  // Show error UI
  function showError(form, message) {
    // Remove existing status
    const existingStatus = form.querySelector('.lessgo-form-status');
    if (existingStatus) existingStatus.remove();

    // Create error element
    const error = document.createElement('div');
    error.className = 'lessgo-form-status';
    error.textContent = message;
    error.style.cssText = 'background: #FEE2E2; color: #DC2626; padding: 0.75rem; border-radius: 0.5rem; margin-top: 1rem; font-size: 0.875rem;';

    form.appendChild(error);

    // Auto-hide after 5s
    setTimeout(() => error.remove(), 5000);
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    // Validate
    if (!validateForm(form)) {
      return;
    }

    // Get form config from data attributes
    const formId = form.dataset.formId;
    const pageId = form.dataset.pageId;
    const ownerId = form.dataset.ownerId;
    const successMessage = form.dataset.successMessage;

    if (!formId || !pageId || !ownerId) {
      showError(form, 'Form configuration error. Please contact support.');
      return;
    }

    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }

    // Collect form data
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      // Submit with keepalive for reliability
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data,
          publishedPageId: pageId,
          userId: ownerId,
        }),
        keepalive: true,
      });

      const result = await response.json();

      if (response.ok) {
        // Fire analytics event if tracking is enabled
        if (typeof window._lessgoTrack === 'function') {
          window._lessgoTrack('form_submit', {
            formId,
            pageId,
          });
        }

        // Show success UI
        showSuccess(form, successMessage);
      } else {
        showError(form, result.message || 'Submission failed. Please try again.');

        // Re-enable button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showError(form, 'Network error. Please check your connection and try again.');

      // Re-enable button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  }

  // Handle inline form submission
  async function handleInlineSubmit(event) {
    event.preventDefault();

    const formElement = event.target;
    const container = formElement.closest('[data-lessgo-inline-form]');
    if (!container) return;

    const submitButton = formElement.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    // Validate
    if (!validateForm(formElement)) {
      return;
    }

    // Get form config from data attributes
    const formId = container.dataset.lessgoInlineForm;
    const pageId = container.dataset.pageId;
    const ownerId = container.dataset.ownerId;
    const successMessage = container.dataset.successMessage;

    if (!formId || !pageId || !ownerId) {
      showInlineError(container, 'Form configuration error. Please contact support.');
      return;
    }

    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }

    // Collect form data
    const formData = new FormData(formElement);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      // Submit with keepalive for reliability
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data,
          publishedPageId: pageId,
          userId: ownerId,
        }),
        keepalive: true,
      });

      const result = await response.json();

      if (response.ok) {
        // Fire analytics event if tracking is enabled
        if (typeof window._lessgoTrack === 'function') {
          window._lessgoTrack('form_submit', {
            formId,
            pageId,
            placement: 'inline',
          });
        }

        // Show inline success UI
        showInlineSuccess(container, successMessage);
      } else {
        showInlineError(container, result.message || 'Submission failed. Please try again.');

        // Re-enable button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    } catch (error) {
      console.error('Inline form submission error:', error);
      showInlineError(container, 'Network error. Please check your connection and try again.');

      // Re-enable button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  }

  // Initialize forms on page load
  function initForms() {
    // Initialize full forms
    const forms = document.querySelectorAll('[data-lessgo-form]');
    forms.forEach(form => {
      form.addEventListener('submit', handleSubmit);
    });

    // Initialize inline forms
    const inlineForms = document.querySelectorAll('[data-lessgo-inline-form] form');
    inlineForms.forEach(form => {
      form.addEventListener('submit', handleInlineSubmit);
    });

    console.log(`[Lessgo Forms] Initialized ${forms.length} full form(s) and ${inlineForms.length} inline form(s)`);
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
