/**
 * Form Placement Logic
 * Determines where and how forms should be rendered based on field count, CTA type, and section type
 */

import { MVPForm } from '@/types/core/forms';
import { hasPrimaryCTASection, getSectionType } from './sectionHelpers';

/**
 * Form placement strategies
 */
export type FormPlacement =
  | 'invalid'           // Form has no fields
  | 'inline'            // Single-field inline input (replaces button)
  | 'primaryCTA'        // Full form in primary CTA section
  | 'modal';            // Form opens in modal

/**
 * How the button/form should render
 */
export type FormRenderAs =
  | 'disabled-button'     // Disabled button with error (invalid form)
  | 'inputWithButton'     // Inline input + submit button (single-field)
  | 'button-to-modal'     // Button that opens modal
  | 'button-to-scroll';   // Button that scrolls to form

/**
 * Result of placement determination
 */
export interface FormPlacementResult {
  /** Where the form should be placed */
  placement: FormPlacement;

  /** How it should render in the current context */
  renderAs: FormRenderAs;

  /** Target section for placement (if applicable) */
  targetSection?: 'hero' | 'cta' | 'other';

  /** Effective behavior (may override user setting) */
  effectiveBehavior?: 'inline' | 'scrollTo' | 'openModal';

  /** Warning/error messages for editor */
  editorMessage?: string;
}

/**
 * Determine form placement and rendering strategy
 *
 * @param form - The form configuration
 * @param ctaType - Type of CTA ('primary' or 'secondary')
 * @param sectionId - Current section ID (e.g., 'hero', 'cta', 'features')
 * @param allSections - All section IDs in the page
 * @param userBehavior - User's selected behavior ('scrollTo' or 'openModal')
 * @returns Placement result with rendering strategy
 */
export function determineFormPlacement(
  form: MVPForm | undefined,
  ctaType: 'primary' | 'secondary',
  sectionId: string,
  allSections: string[],
  userBehavior?: 'scrollTo' | 'openModal'
): FormPlacementResult {
  // Guardrail: no form or no fields = invalid
  if (!form || !form.fields || form.fields.length === 0) {
    return {
      placement: 'invalid',
      renderAs: 'disabled-button',
      editorMessage: 'Configure CTA: Add form fields',
    };
  }

  const fieldCount = form.fields.length;
  const isSingleField = fieldCount === 1;
  const sectionType = getSectionType(sectionId);
  const hasPrimaryCTA = hasPrimaryCTASection(allSections);

  // Secondary CTA: always modal (regardless of field count or user setting)
  if (ctaType === 'secondary') {
    return {
      placement: 'modal',
      renderAs: 'button-to-modal',
      effectiveBehavior: 'openModal',
      editorMessage: 'Secondary CTAs always open in modal',
    };
  }

  // Single-field: always inline in same section (hero or CTA)
  if (isSingleField) {
    return {
      placement: 'inline',
      renderAs: 'inputWithButton',
      targetSection: sectionType,
      effectiveBehavior: 'inline',
      editorMessage: sectionType === 'hero' || sectionType === 'cta'
        ? 'Single-field forms display inline'
        : 'Form will display inline in this section',
    };
  }

  // Multi-field + non-hero/cta section: scroll to primary CTA
  if (sectionType === 'other') {
    if (hasPrimaryCTA) {
      return {
        placement: 'primaryCTA',
        renderAs: 'button-to-scroll',
        targetSection: 'cta',
        effectiveBehavior: 'scrollTo',
        editorMessage: 'Button will scroll to Primary CTA section',
      };
    } else {
      // No primary CTA section: force modal
      return {
        placement: 'modal',
        renderAs: 'button-to-modal',
        effectiveBehavior: 'openModal',
        editorMessage: 'No Primary CTA section: using modal',
      };
    }
  }

  // Multi-field in hero or primary CTA section
  if (hasPrimaryCTA) {
    // Respect user's behavior choice
    if (userBehavior === 'openModal') {
      return {
        placement: 'primaryCTA',
        renderAs: 'button-to-modal',
        targetSection: 'cta',
        effectiveBehavior: 'openModal',
      };
    } else {
      // Default to scroll
      return {
        placement: 'primaryCTA',
        renderAs: 'button-to-scroll',
        targetSection: 'cta',
        effectiveBehavior: 'scrollTo',
      };
    }
  } else {
    // No primary CTA section: force modal
    return {
      placement: 'modal',
      renderAs: 'button-to-modal',
      effectiveBehavior: 'openModal',
      editorMessage: 'No Primary CTA section: using modal',
    };
  }
}

/**
 * Check if a form should render inline in the current section
 *
 * @param placementResult - Result from determineFormPlacement
 * @param currentSectionId - The section being rendered
 * @returns true if form should render inline in this section
 */
export function shouldRenderInline(
  placementResult: FormPlacementResult,
  currentSectionId: string
): boolean {
  if (placementResult.placement !== 'inline') {
    return false;
  }

  const sectionType = getSectionType(currentSectionId);

  // Inline forms appear in hero AND primary CTA sections
  return sectionType === 'hero' || sectionType === 'cta';
}

/**
 * Check if the full form should render in the current section
 *
 * @param placementResult - Result from determineFormPlacement
 * @param currentSectionId - The section being rendered
 * @returns true if full form should render in this section
 */
export function shouldRenderFullForm(
  placementResult: FormPlacementResult,
  currentSectionId: string
): boolean {
  if (placementResult.placement !== 'primaryCTA') {
    return false;
  }

  // Full forms only render in the primary CTA section
  return currentSectionId === 'cta';
}

/**
 * Get user-facing description of form behavior
 *
 * @param placementResult - Result from determineFormPlacement
 * @returns Human-readable description
 */
export function getFormBehaviorDescription(
  placementResult: FormPlacementResult
): string {
  switch (placementResult.placement) {
    case 'invalid':
      return 'Form needs configuration';
    case 'inline':
      return 'Inline email capture';
    case 'primaryCTA':
      if (placementResult.renderAs === 'button-to-modal') {
        return 'Opens form in modal';
      } else {
        return 'Scrolls to form in CTA section';
      }
    case 'modal':
      return 'Opens form in modal';
    default:
      return 'Form action';
  }
}

/**
 * Check if user behavior setting should be disabled in editor
 *
 * @param form - The form configuration
 * @param ctaType - Type of CTA
 * @param hasPrimaryCTA - Whether primary CTA section exists
 * @returns Object indicating which options should be disabled
 */
export function getDisabledBehaviorOptions(
  form: MVPForm | undefined,
  ctaType: 'primary' | 'secondary',
  hasPrimaryCTA: boolean
): {
  disableModal: boolean;
  disableScroll: boolean;
  reason: string;
} {
  // Secondary CTA: only modal available
  if (ctaType === 'secondary') {
    return {
      disableModal: false,
      disableScroll: true,
      reason: 'Secondary CTAs always use modal',
    };
  }

  // Single-field: force inline (disable both)
  if (form && form.fields && form.fields.length === 1) {
    return {
      disableModal: true,
      disableScroll: true,
      reason: 'Single-field forms display inline',
    };
  }

  // Multi-field without primary CTA: only modal available
  if (form && form.fields && form.fields.length >= 2 && !hasPrimaryCTA) {
    return {
      disableModal: false,
      disableScroll: true,
      reason: 'No Primary CTA section available',
    };
  }

  // Normal case: both options available
  return {
    disableModal: false,
    disableScroll: false,
    reason: '',
  };
}
