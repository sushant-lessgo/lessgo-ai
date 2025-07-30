// Form management actions for MVP
import type { MVPForm, MVPFormField, MVPFormBuilderState } from '@/types/core/forms';
import type { EditStore } from '@/types/store';

export const createFormActions = (
  set: (fn: (state: EditStore) => void) => void,
  get: () => EditStore
) => ({
  // Form CRUD operations
  createForm: (form: Omit<MVPForm, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newForm: MVPForm = {
      ...form,
      id: `form-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set((state) => {
      if (!state.forms) {
        state.forms = {};
      }
      state.forms[newForm.id] = newForm;
    });
    
    return newForm.id;
  },

  updateForm: (id: string, updates: Partial<MVPForm>) => {
    set((state) => {
      if (state.forms && state.forms[id]) {
        state.forms[id] = {
          ...state.forms[id],
          ...updates,
          updatedAt: new Date()
        };
      }
    });
  },

  deleteForm: (id: string) => {
    set((state) => {
      if (state.forms && state.forms[id]) {
        delete state.forms[id];
      }
      
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
  addFormField: (formId: string, field: Omit<MVPFormField, 'id'>) => {
    const newField: MVPFormField = {
      ...field,
      id: `field-${Date.now()}`
    };
    
    set((state) => {
      if (state.forms && state.forms[formId]) {
        state.forms[formId].fields.push(newField);
        state.forms[formId].updatedAt = new Date();
      }
    });
  },

  updateFormField: (formId: string, fieldId: string, updates: Partial<MVPFormField>) => {
    set((state) => {
      if (state.forms && state.forms[formId]) {
        const fieldIndex = state.forms[formId].fields.findIndex(f => f.id === fieldId);
        if (fieldIndex !== -1) {
          state.forms[formId].fields[fieldIndex] = {
            ...state.forms[formId].fields[fieldIndex],
            ...updates
          };
          state.forms[formId].updatedAt = new Date();
        }
      }
    });
  },

  removeFormField: (formId: string, fieldId: string) => {
    set((state) => {
      if (state.forms && state.forms[formId]) {
        state.forms[formId].fields = state.forms[formId].fields.filter(f => f.id !== fieldId);
        state.forms[formId].updatedAt = new Date();
      }
    });
  },

  reorderFormFields: (formId: string, startIndex: number, endIndex: number) => {
    set((state) => {
      if (state.forms && state.forms[formId]) {
        const fields = [...state.forms[formId].fields];
        const [removed] = fields.splice(startIndex, 1);
        fields.splice(endIndex, 0, removed);
        state.forms[formId].fields = fields;
        state.forms[formId].updatedAt = new Date();
      }
    });
  },

  // Note: Button-to-form linking is now handled through element metadata
  // See ButtonConfigurationModal for implementation

  // Form builder UI
  showFormBuilder: (formId?: string) => {
    set((state) => {
      state.formBuilderOpen = true;
      state.editingFormId = formId || null;
    });
  },

  hideFormBuilder: () => {
    set((state) => {
      state.formBuilderOpen = false;
      state.editingFormId = null;
    });
  },

  // Get form by ID
  getFormById: (id: string): MVPForm | undefined => {
    const state = get();
    return state.forms?.[id];
  },

  // Get all forms
  getAllForms: (): MVPForm[] => {
    const state = get();
    return state.forms ? Object.values(state.forms) : [];
  }
});