// Form management actions for MVP
import type { SimpleFormData, SimpleFormField } from '@/types/simpleForms';
import type { EditStore } from '@/types/store';

export const createFormActions = (
  set: (fn: (state: EditStore) => void) => void,
  get: () => EditStore
) => ({
  // Form CRUD operations
  addForm: (form: SimpleFormData) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      state.simpleForms.push(form);
    });
  },

  updateForm: (id: string, updates: Partial<SimpleFormData>) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      const formIndex = state.simpleForms.findIndex((f: SimpleFormData) => f.id === id);
      if (formIndex !== -1) {
        state.simpleForms[formIndex] = {
          ...state.simpleForms[formIndex],
          ...updates,
          updatedAt: new Date()
        };
      }
    });
  },

  deleteForm: (id: string) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      state.simpleForms = state.simpleForms.filter((f: SimpleFormData) => f.id !== id);
      
      // Also remove any button links to this form
      Object.keys(state.content).forEach(sectionId => {
        const section = state.content[sectionId];
        if (section?.cta?.formId === id) {
          delete section.cta.formId;
          delete section.cta.behavior;
          if (section.cta.type === 'form') {
            section.cta.type = 'link';
          }
        }
      });
    });
  },

  // Form field operations
  addFormField: (formId: string, field: SimpleFormField) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      const form = state.simpleForms.find((f: SimpleFormData) => f.id === formId);
      if (form) {
        form.fields.push(field);
        form.updatedAt = new Date();
      }
    });
  },

  updateFormField: (formId: string, fieldId: string, updates: Partial<SimpleFormField>) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      const form = state.simpleForms.find((f: SimpleFormData) => f.id === formId);
      if (form) {
        const fieldIndex = form.fields.findIndex((f: SimpleFormField) => f.id === fieldId);
        if (fieldIndex !== -1) {
          form.fields[fieldIndex] = { ...form.fields[fieldIndex], ...updates };
          form.updatedAt = new Date();
        }
      }
    });
  },

  removeFormField: (formId: string, fieldId: string) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      const form = state.simpleForms.find((f: SimpleFormData) => f.id === formId);
      if (form) {
        form.fields = form.fields.filter((f: SimpleFormField) => f.id !== fieldId);
        form.updatedAt = new Date();
      }
    });
  },

  reorderFormFields: (formId: string, fieldIds: string[]) => {
    set((state) => {
      state.simpleForms = state.simpleForms || [];
      const form = state.simpleForms.find((f: SimpleFormData) => f.id === formId);
      if (form) {
        form.fields = fieldIds.map(id => form.fields.find((f: SimpleFormField) => f.id === id)!).filter(Boolean);
        form.updatedAt = new Date();
      }
    });
  },

  // Button-to-form linking
  linkButtonToForm: (sectionId: string, formId: string, behavior: 'scrollTo' | 'openModal') => {
    set((state) => {
      const section = state.content[sectionId];
      if (section?.cta) {
        section.cta.type = 'form';
        section.cta.formId = formId;
        section.cta.behavior = behavior;
      }
    });
  },

  unlinkButtonFromForm: (sectionId: string) => {
    set((state) => {
      const section = state.content[sectionId];
      if (section?.cta) {
        delete section.cta.formId;
        delete section.cta.behavior;
        section.cta.type = 'link';
      }
    });
  },

  // Form builder UI
  showFormBuilder: (formId?: string) => {
    set((state) => {
      state.formBuilder.visible = true;
      state.formBuilder.editingFormId = formId;
    });
  },

  hideFormBuilder: () => {
    set((state) => {
      state.formBuilder.visible = false;
      delete state.formBuilder.editingFormId;
    });
  },

  // Get form by ID
  getFormById: (id: string): SimpleFormData | undefined => {
    const state = get();
    return state.simpleForms?.find((f: SimpleFormData) => f.id === id);
  },

  // Get all forms
  getAllForms: (): SimpleFormData[] => {
    const state = get();
    return state.simpleForms || [];
  },

  // Get forms for a specific placement
  getFormsByPlacement: (placement: 'hero' | 'cta-section'): SimpleFormData[] => {
    const state = get();
    return (state.simpleForms || []).filter((f: SimpleFormData) => f.placement === placement);
  }
});