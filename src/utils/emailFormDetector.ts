import { logger } from '@/lib/logger';

/**
 * Finds the first form element on the page that contains an email input field
 * Used for auto-scrolling CTA buttons to email capture forms
 *
 * @returns HTMLElement of the form container, or null if not found
 */
export function findFirstEmailForm(): HTMLElement | null {
  // Priority: Find forms with data-has-email-form attribute (if enhanced)
  const formWithAttribute = document.querySelector('[data-has-email-form="true"]');
  if (formWithAttribute) {
    logger.debug('📧 Found email form via data attribute:', formWithAttribute.id);
    return formWithAttribute as HTMLElement;
  }

  // Primary strategy: Find form wrappers with id="form-{formId}"
  const formWrappers = document.querySelectorAll('[id^="form-"]');

  for (const wrapper of formWrappers) {
    const emailInput = wrapper.querySelector('input[type="email"]');
    if (emailInput) {
      logger.debug('📧 Found email form:', wrapper.id);
      return wrapper as HTMLElement;
    }
  }

  // Fallback: Find any email input and get its section
  const emailInputs = document.querySelectorAll('input[type="email"]');
  if (emailInputs.length > 0) {
    const input = emailInputs[0];
    // Try to find parent section
    const section = input.closest('section[data-section-id]');
    if (section) {
      logger.debug('📧 Found email form in section:', section.getAttribute('data-section-id'));
      return section as HTMLElement;
    }
    // Last resort: return parent element
    return input.parentElement as HTMLElement;
  }

  logger.debug('⚠️ No email form found on page');
  return null;
}

/**
 * Checks if the current page is in edit mode
 * Used to disable auto-scroll during editing
 */
export function isEditMode(): boolean {
  // Check for edit mode indicators in DOM
  return (
    !!document.querySelector('[data-editor-active="true"]') ||
    !!document.querySelector('.editor-toolbar') ||
    !!document.querySelector('[data-mode="edit"]')
  );
}

/**
 * Scrolls to the first email form on the page with smooth animation
 * Only works in preview/published mode, not edit mode
 *
 * @returns boolean - true if scrolled, false if no form found or in edit mode
 */
export function scrollToEmailForm(): boolean {
  if (isEditMode()) {
    logger.debug('⏸️ Auto-scroll disabled in edit mode');
    return false;
  }

  const emailForm = findFirstEmailForm();
  if (emailForm) {
    emailForm.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    logger.debug('✅ Auto-scrolled to email form');
    return true;
  }

  return false;
}
