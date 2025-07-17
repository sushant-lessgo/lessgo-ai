// Form actions interface for MVP
import type { SimpleFormData, SimpleFormField } from '@/types/simpleForms';

export interface FormActions {
  // Form CRUD operations
  addForm: (form: SimpleFormData) => void;
  updateForm: (id: string, updates: Partial<SimpleFormData>) => void;
  deleteForm: (id: string) => void;
  
  // Form field operations
  addFormField: (formId: string, field: SimpleFormField) => void;
  updateFormField: (formId: string, fieldId: string, updates: Partial<SimpleFormField>) => void;
  removeFormField: (formId: string, fieldId: string) => void;
  reorderFormFields: (formId: string, fieldIds: string[]) => void;
  
  // Button-to-form linking
  linkButtonToForm: (sectionId: string, formId: string, behavior: 'scrollTo' | 'openModal') => void;
  unlinkButtonFromForm: (sectionId: string) => void;
  
  // Form builder UI
  showFormBuilder: (formId?: string) => void;
  hideFormBuilder: () => void;
  
  // Getters
  getFormById: (id: string) => SimpleFormData | undefined;
  getAllForms: () => SimpleFormData[];
  getFormsByPlacement: (placement: 'hero' | 'cta-section') => SimpleFormData[];
}