// hooks/editStore/uiActions.ts - UI state and interaction actions
import type { EditStore, UISlice, ElementSelection, ToolbarAction, EditHistoryEntry } from '@/types/store';
import type { UIActions } from '@/types/store';
import type { 
  UndoableAction, 
  ActionHistoryItem, 
  UndoRedoState 
} from '@/types/core';

import type { AdvancedActionItem, AdvancedMenuState } from '@/app/edit/[token]/components/toolbars/AdvancedActionsMenu';
import type { ElementSelection } from '@/types/core/ui';

/**
 * ===== UI ACTIONS CREATOR =====
 */
export function createUIActions(set: any, get: any): UIActions {
  return {
    /**
     * ===== BASIC UI STATE =====
     */
    
    setMode: (mode: 'preview' | 'edit') =>
      set((state: EditStore) => {
        state.mode = mode;
        
        // Clear selections when switching modes
        if (mode === 'preview') {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.floatingToolbars.section.visible = false;
          state.floatingToolbars.element.visible = false;
        }
      }),
    
    setEditMode: (mode: 'section' | 'element' | 'global') =>
      set((state: EditStore) => {
        state.editMode = mode;
        
        // Clear inappropriate selections for mode
        if (mode === 'section') {
          state.selectedElement = undefined;
          state.floatingToolbars.element.visible = false;
        } else if (mode === 'element') {
          // Keep element selection if valid
        } else if (mode === 'global') {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.floatingToolbars.section.visible = false;
          state.floatingToolbars.element.visible = false;
        }
      }),

    /**
     * ===== SELECTION MANAGEMENT =====
     */
    
    setActiveSection: (sectionId?: string) =>
      set((state: EditStore) => {
        state.selectedSection = sectionId;
        
        // Clear element selection when changing sections
        if (state.selectedElement && state.selectedElement.sectionId !== sectionId) {
          state.selectedElement = undefined;
          state.floatingToolbars.element.visible = false;
        }
        
        // Update section metadata
        Object.values(state.content).forEach(section => {
          if (section.editMetadata) {
            section.editMetadata.isSelected = section.id === sectionId;
          }
        });
        
        // Hide section toolbar if no section selected
        if (!sectionId) {
          state.floatingToolbars.section.visible = false;
        }
      }),
    
    selectElement: (selection: ElementSelection | null) =>
      set((state: EditStore) => {
        state.selectedElement = selection || undefined;
        
        // Update active section to match selected element
        if (selection) {
          state.selectedSection = selection.sectionId;
          
          // Update element metadata
          const section = state.content[selection.sectionId];
          if (section && section.elements[selection.elementKey]) {
            // Reset all elements
            Object.values(section.elements).forEach(element => {
              if (element.editMode) {
                // Reset edit mode for other elements
              }
            });
          }
        }
        
        // Hide element toolbar if no element selected
        if (!selection) {
          state.floatingToolbars.element.visible = false;
        }
      }),
    
    setMultiSelection: (sectionIds: string[]) =>
      set((state: EditStore) => {
        state.multiSelection = sectionIds;
        
        // Update selection metadata for all sections
        Object.values(state.content).forEach(section => {
          if (section.editMetadata) {
            section.editMetadata.isSelected = sectionIds.includes(section.id);
          }
        });
        
        // Clear single selection if multi-selecting
        if (sectionIds.length > 1) {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.floatingToolbars.section.visible = false;
          state.floatingToolbars.element.visible = false;
        }
      }),

      // Enhanced setSelectedElement for toolbar integration
setSelectedElement: (elementSelection: ElementSelection | undefined) =>
  set((state: EditStore) => {
    state.selectedElement = elementSelection;
    
    // Update active section when element is selected
    if (elementSelection) {
      state.selectedSection = elementSelection.sectionId;
    }
  }),

// Enhanced setActiveSection for toolbar integration
setActiveSection: (sectionId: string | undefined) =>
  set((state: EditStore) => {
    state.selectedSection = sectionId;
    
    // Clear element selection when changing sections
    if (state.selectedElement && state.selectedElement.sectionId !== sectionId) {
      state.selectedElement = undefined;
      state.floatingToolbars.element.visible = false;
    }
    
    // Update section metadata
    Object.values(state.content).forEach(section => {
      if (section.editMetadata) {
        section.editMetadata.isSelected = section.id === sectionId;
      }
    });
  }),

    /**
     * ===== PANEL MANAGEMENT =====
     */
    
    setLeftPanelWidth: (width: number) =>
      set((state: EditStore) => {
        state.leftPanel.width = Math.max(250, Math.min(500, width));
      }),
    
    toggleLeftPanel: () =>
      set((state: EditStore) => {
        state.leftPanel.collapsed = !state.leftPanel.collapsed;
      }),
    
    setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) =>
      set((state: EditStore) => {
        state.leftPanel.activeTab = tab;
      }),

    /**
     * ===== FLOATING TOOLBAR MANAGEMENT =====
     */
    
    showSectionToolbar: (sectionId: string, position: { x: number; y: number }) =>
  set((state: EditStore) => {
    // Hide other toolbars first
    Object.keys(state.floatingToolbars).forEach(key => {
      if (key !== 'section') {
        state.floatingToolbars[key as keyof typeof state.floatingToolbars].visible = false;
      }
    });
    
    // Show section toolbar with context-aware actions
    state.floatingToolbars.section = {
      visible: true,
      position,
      targetId: sectionId,
      contextActions: [
        { id: 'change-layout', label: 'Change Layout', icon: 'layout', type: 'button' },
        { id: 'add-element', label: 'Add Element', icon: 'plus', type: 'button' },
        { id: 'background-settings', label: 'Background', icon: 'image', type: 'button' },
        { id: 'regenerate-section', label: 'Regenerate', icon: 'refresh', type: 'button' },
        { id: 'duplicate-section', label: 'Duplicate', icon: 'copy', type: 'button' },
        { id: 'delete-section', label: 'Delete', icon: 'trash', type: 'button' },
      ],
      advancedActions: [
        { id: 'section-settings', label: 'Section Settings', icon: 'settings', handler: () => {} },
        { id: 'export-section', label: 'Export Section', icon: 'download', handler: () => {} },
        { id: 'section-analytics', label: 'Section Analytics', icon: 'chart', handler: () => {} },
      ],
    };
    
    // Update selection
    state.selectedSection = sectionId;
    state.selectedElement = undefined;
  }),

    
    hideSectionToolbar: () =>
      set((state: EditStore) => {
        state.floatingToolbars.section.visible = false;
      }),
    
   showElementToolbar: (elementId: string, position: { x: number; y: number }) =>
  set((state: EditStore) => {
    const [sectionId, elementKey] = elementId.split('.');
    const section = state.content[sectionId];
    const element = section?.elements[elementKey];
    
    if (!element) return;
    
    // Hide other toolbars first
    Object.keys(state.floatingToolbars).forEach(key => {
      if (key !== 'element') {
        state.floatingToolbars[key as keyof typeof state.floatingToolbars].visible = false;
      }
    });
    
    // Determine context actions based on element type
    let contextActions: any[] = [
      { id: 'element-regenerate', label: 'Regenerate', icon: 'refresh', type: 'button' },
      { id: 'element-variations', label: 'Variations', icon: 'layers', type: 'button' },
      { id: 'duplicate-element', label: 'Duplicate', icon: 'copy', type: 'button' },
      { id: 'delete-element', label: 'Delete', icon: 'trash', type: 'button' },
    ];
    
    // Add type-specific actions
    if (element.type === 'button' || elementKey.includes('cta')) {
      contextActions.unshift(
        { id: 'link-settings', label: 'Link Settings', icon: 'link', type: 'button' },
        { id: 'convert-cta-to-form', label: 'Convert to Form', icon: 'form-input', type: 'button' }
      );
    }
    
    if (['text', 'headline', 'subheadline'].includes(element.type)) {
      contextActions.unshift(
        { id: 'apply-text-format', label: 'Bold', icon: 'bold', type: 'button' },
        { id: 'change-text-color', label: 'Color', icon: 'palette', type: 'button' },
        { id: 'change-font-size', label: 'Size', icon: 'type', type: 'button' }
      );
    }
    
    state.floatingToolbars.element = {
      visible: true,
      position,
      targetId: elementId,
      contextActions,
      advancedActions: [
        { id: 'element-style', label: 'Element Styling', icon: 'palette', handler: () => {} },
        { id: 'change-element-type', label: 'Change Type', icon: 'transform', handler: () => {} },
        { id: 'element-analytics', label: 'Element Analytics', icon: 'chart', handler: () => {} },
      ],
    };
    
    // Update selection
    state.selectedElement = {
      sectionId,
      elementKey,
      type: element.type,
      editMode: element.editMode,
    };
    state.selectedSection = sectionId;
  }),

    
    hideElementToolbar: () =>
      set((state: EditStore) => {
        state.floatingToolbars.element.visible = false;
      }),
    
    showFormToolbar: (formId: string, position: { x: number; y: number }) =>
      set((state: EditStore) => {
        // Hide other toolbars first
        state.floatingToolbars.section.visible = false;
        state.floatingToolbars.element.visible = false;
        state.floatingToolbars.image.visible = false;
        
        state.floatingToolbars.form = {
          visible: true,
          position,
          targetId: formId,
          contextActions: [
            { 
              id: 'edit-fields', 
              label: 'Edit Fields', 
              type: 'button', 
              icon: 'list',
              handler: () => get().showFormBuilder()
            },
            { 
              id: 'settings', 
              label: 'Form Settings', 
              type: 'button', 
              icon: 'settings',
              handler: () => {
                // Open form settings modal
              }
            },
            { 
              id: 'integrations', 
              label: 'Connect Integration', 
              type: 'button', 
              icon: 'link',
              handler: () => {
                // Open integrations panel
              }
            },
            { id: 'separator1', label: '', type: 'separator' },
            { 
              id: 'preview', 
              label: 'Preview Form', 
              type: 'button', 
              icon: 'eye',
              handler: () => {
                // Open form preview
              }
            },
            { 
              id: 'test', 
              label: 'Test Form', 
              type: 'button', 
              icon: 'play',
              handler: () => {
                // Test form submission
              }
            },
          ],
        };
      }),
    
    hideFormToolbar: () =>
      set((state: EditStore) => {
        state.floatingToolbars.form.visible = false;
      }),
    
    showImageToolbar: (imageId: string, position: { x: number; y: number }) =>
      set((state: EditStore) => {
        // Hide other toolbars first
        state.floatingToolbars.section.visible = false;
        state.floatingToolbars.element.visible = false;
        state.floatingToolbars.form.visible = false;
        
        state.floatingToolbars.image = {
          visible: true,
          position,
          targetId: imageId,
          contextActions: [
            { 
              id: 'replace', 
              label: 'Replace Image', 
              type: 'button', 
              icon: 'image',
              handler: () => {
                // Open image picker
              }
            },
            { 
              id: 'edit', 
              label: 'Edit Image', 
              type: 'button', 
              icon: 'edit',
              handler: () => {
                // Open image editor
              }
            },
            { 
              id: 'alt-text', 
              label: 'Edit Alt Text', 
              type: 'button', 
              icon: 'type',
              handler: () => {
                // Open alt text editor
              }
            },
            { id: 'separator1', label: '', type: 'separator' },
            { 
              id: 'optimize', 
              label: 'Optimize', 
              type: 'button', 
              icon: 'zap',
              handler: () => {
                // Optimize image
              }
            },
            { 
              id: 'stock-search', 
              label: 'Find Similar', 
              type: 'button', 
              icon: 'search',
              handler: () => {
                get().showStockPhotoSearch('similar image');
              }
            },
          ],
        };
      }),
    
    hideImageToolbar: () =>
      set((state: EditStore) => {
        state.floatingToolbars.image.visible = false;
      }),

    /**
     * ===== AUTO-SAVE UI =====
     */
    
    triggerAutoSave: () => {
  const state = get();
  if (state.autoSave.isDirty && !state.autoSave.isSaving && state.queuedChanges.length > 0) {
    // Debounce auto-save
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
    }
    
    set((state: EditStore) => {
      state.autoSaveTimer = setTimeout(async () => {
        try {
          await state.save();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 2000); // 2 second debounce
    });
  }
},
    
    clearAutoSaveError: () =>
      set((state: EditStore) => {
        state.autoSave.error = undefined;
      }),

// Enhanced trackChange for toolbar actions
trackChange: (change: any) => {
  set((state: EditStore) => {
    state.queuedChanges.push({
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    });
    state.autoSave.isDirty = true;
    state.lastUpdated = Date.now();
  });
},

// Clear queued changes after successful save
clearQueuedChanges: () => {
  set((state: EditStore) => {
    state.queuedChanges = [];
    state.autoSave.isDirty = false;
  });
},


    /**
     * ===== FORMS UI =====
     */
    
    setActiveForm: (formId?: string) =>
      set((state: EditStore) => {
        state.forms.activeForm = formId;
      }),
    
    showFormBuilder: () =>
      set((state: EditStore) => {
        state.forms.formBuilder.visible = true;
        state.leftPanel.activeTab = 'pageStructure'; // Or dedicated forms tab
      }),
    
    hideFormBuilder: () =>
      set((state: EditStore) => {
        state.forms.formBuilder.visible = false;
        state.forms.formBuilder.editingField = undefined;
      }),
    
    convertCTAToForm: (sectionId: string, elementKey: string) =>
      set((state: EditStore) => {
        const formId = `form-${Date.now()}`;
        
        // Replace CTA element with form element
        if (state.content[sectionId] && state.content[sectionId].elements[elementKey]) {
          const oldElement = state.content[sectionId].elements[elementKey];
          
          state.content[sectionId].elements[elementKey] = {
            content: formId,
            type: 'form',
            isEditable: true,
            editMode: 'modal',
          };
          
          // Track change
          state.history.undoStack.push({
            type: 'content',
            description: `Converted CTA to form in ${sectionId}`,
            timestamp: Date.now(),
            beforeState: { sectionId, elementKey, element: oldElement },
            afterState: { sectionId, elementKey, formId },
            sectionId,
          });
          
          state.history.redoStack = [];
        }
        
        state.forms.activeForm = formId;
        state.forms.formBuilder.visible = true;
        state.autoSave.isDirty = true;
      }),

    /**
     * ===== IMAGES UI =====
     */
    
    setActiveImage: (imageId?: string) =>
      set((state: EditStore) => {
        state.images.activeImage = imageId;
      }),
    
    showStockPhotoSearch: (query: string) =>
      set((state: EditStore) => {
        state.images.stockPhotos.searchQuery = query;
        state.images.stockPhotos.searchVisible = true;
      }),
    
    hideStockPhotoSearch: () =>
      set((state: EditStore) => {
        state.images.stockPhotos.searchVisible = false;
        state.images.stockPhotos.searchResults = [];
      }),
    
    setImageUploadProgress: (imageId: string, progress: number) =>
      set((state: EditStore) => {
        state.images.uploadProgress[imageId] = progress;
        
        // Clean up completed uploads
        if (progress >= 100) {
          setTimeout(() => {
            set((state: EditStore) => {
              delete state.images.uploadProgress[imageId];
            });
          }, 2000);
        }
      }),

    /**
     * ===== ERROR HANDLING =====
     */
    
    setError: (error: string, sectionId?: string) =>
      set((state: EditStore) => {
        if (sectionId) {
          state.errors[sectionId] = error;
          
          // Update section validation
          if (state.content[sectionId]) {
            state.content[sectionId].editMetadata.validationStatus.errors.push({
              elementKey: 'general',
              code: 'error',
              message: error,
              severity: 'error',
            });
          }
        } else {
          state.errors['global'] = error;
        }
      }),
    
    clearError: (sectionId?: string) =>
      set((state: EditStore) => {
        if (sectionId) {
          delete state.errors[sectionId];
          
          // Clear section validation errors
          if (state.content[sectionId]) {
            state.content[sectionId].editMetadata.validationStatus.errors = 
              state.content[sectionId].editMetadata.validationStatus.errors.filter(
                err => err.elementKey !== 'general'
              );
          }
        } else {
          state.errors = {};
        }
      }),
    
    setLoading: (isLoading: boolean, sectionId?: string) =>
      set((state: EditStore) => {
        if (sectionId) {
          state.loadingStates[sectionId] = isLoading;
        } else {
          state.isLoading = isLoading;
        }
      }),

       /**
     * ===== ADVANCED MENU MANAGEMENT =====
     */
    
    showAdvancedMenu: (
      toolbarType: 'section' | 'element' | 'text' | 'form' | 'image',
      triggerElement: HTMLElement,
      actions: AdvancedActionItem[]
    ) =>
      set((state: EditStore) => {
        const triggerBounds = triggerElement.getBoundingClientRect();
        
        // Set active dropdown state for the toolbar
        if (state.floatingToolbars[toolbarType]) {
          state.floatingToolbars[toolbarType].activeDropdown = 'advanced';
        }
        
        // Show advanced menu
        state.advancedMenu = {
          visible: true,
          position: { x: triggerBounds.right + 8, y: triggerBounds.top },
          actions,
          triggerElement,
          toolbarType,
        };
      }),

    hideAdvancedMenu: () =>
      set((state: EditStore) => {
        if (state.advancedMenu) {
          state.advancedMenu.visible = false;
          
          // Clear active dropdown from all toolbars
          Object.keys(state.floatingToolbars).forEach(key => {
            const toolbar = state.floatingToolbars[key as keyof typeof state.floatingToolbars];
            if (toolbar.activeDropdown === 'advanced') {
              toolbar.activeDropdown = undefined;
            }
          });
        }
      }),

    toggleAdvancedMenu: (
      toolbarType: 'section' | 'element' | 'text' | 'form' | 'image',
      triggerElement: HTMLElement,
      actions: AdvancedActionItem[]
    ) => {
      const state = get();
      
      if (state.advancedMenu?.visible && state.advancedMenu.toolbarType === toolbarType) {
        get().hideAdvancedMenu();
      } else {
        get().showAdvancedMenu(toolbarType, triggerElement, actions);
      }
    },

    /**
     * ===== HISTORY MANAGEMENT =====
     */
    
    pushHistory: (entry: EditHistoryEntry) =>
      set((state: EditStore) => {
        state.history.undoStack.push(entry);
        
        // Limit history size
        if (state.history.undoStack.length > state.history.maxHistorySize) {
          state.history.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        state.history.redoStack = [];
      }),

    /**
     * ===== UNDO/REDO SYSTEM =====
     */
    
    undo: () =>
      set((state: EditStore) => {
        if (state.history.undoStack.length === 0) return;
        
        const lastAction = state.history.undoStack.pop()!;
        state.history.redoStack.push(lastAction);
        
        // Restore previous state
        if (lastAction.type === 'theme') {
          if (lastAction.beforeState?.theme) {
            state.theme = lastAction.beforeState.theme;
          }
        } else if (lastAction.type === 'section') {
          if (lastAction.beforeState?.sectionData && lastAction.sectionId) {
            // Restore section
            if (!state.sections.includes(lastAction.sectionId)) {
              state.sections.splice(lastAction.beforeState.sectionIndex || 0, 0, lastAction.sectionId);
            }
            state.content[lastAction.sectionId] = lastAction.beforeState.sectionData;
          } else if (lastAction.afterState?.sectionId) {
            // Remove section that was added
            const sectionId = lastAction.afterState.sectionId;
            const index = state.sections.indexOf(sectionId);
            if (index !== -1) {
              state.sections.splice(index, 1);
              delete state.content[sectionId];
              delete state.sectionLayouts[sectionId];
            }
          }
        } else if (lastAction.type === 'layout') {
          if (lastAction.beforeState?.sections) {
            state.sections = lastAction.beforeState.sections;
          }
          if (lastAction.beforeState?.layouts) {
            state.sectionLayouts = lastAction.beforeState.layouts;
          }
        } else if (lastAction.type === 'content') {
          if (lastAction.sectionId && lastAction.beforeState) {
            const section = state.content[lastAction.sectionId];
            if (section && lastAction.beforeState.elementKey) {
              // Restore element content
              if (lastAction.beforeState.content !== undefined) {
                section.elements[lastAction.beforeState.elementKey] = {
                  content: lastAction.beforeState.content,
                  type: section.elements[lastAction.beforeState.elementKey]?.type || 'text',
                  isEditable: true,
                  editMode: 'inline',
                };
              }
            } else if (section && lastAction.beforeState.elements) {
              // Restore multiple elements
              section.elements = lastAction.beforeState.elements;
            }
          }
        }
        
        state.autoSave.isDirty = true;
        
        console.log('🔄 Undo:', lastAction.description);
      }),

    redo: () =>
      set((state: EditStore) => {
        if (state.history.redoStack.length === 0) return;
        
        const actionToRedo = state.history.redoStack.pop()!;
        state.history.undoStack.push(actionToRedo);
        
        // Apply the action again
        if (actionToRedo.type === 'theme') {
          if (actionToRedo.afterState?.theme) {
            state.theme = actionToRedo.afterState.theme;
          }
        } else if (actionToRedo.type === 'section') {
          if (actionToRedo.afterState?.sectionId && actionToRedo.afterState?.sectionType) {
            // Re-add section
            const sectionId = actionToRedo.afterState.sectionId;
            if (!state.sections.includes(sectionId)) {
              state.sections.push(sectionId);
            }
          } else if (actionToRedo.beforeState?.sectionId) {
            // Re-remove section
            const sectionId = actionToRedo.beforeState.sectionId;
            const index = state.sections.indexOf(sectionId);
            if (index !== -1) {
              state.sections.splice(index, 1);
              delete state.content[sectionId];
              delete state.sectionLayouts[sectionId];
            }
          }
        } else if (actionToRedo.type === 'layout') {
          if (actionToRedo.afterState?.sections) {
            state.sections = actionToRedo.afterState.sections;
          }
          if (actionToRedo.afterState?.layouts) {
            state.sectionLayouts = actionToRedo.afterState.layouts;
          }
        } else if (actionToRedo.type === 'content') {
          if (actionToRedo.sectionId && actionToRedo.afterState) {
            const section = state.content[actionToRedo.sectionId];
            if (section && actionToRedo.afterState.elementKey) {
              // Restore element content
              if (actionToRedo.afterState.content !== undefined) {
                section.elements[actionToRedo.afterState.elementKey] = {
                  content: actionToRedo.afterState.content,
                  type: section.elements[actionToRedo.afterState.elementKey]?.type || 'text',
                  isEditable: true,
                  editMode: 'inline',
                };
              }
            } else if (section && actionToRedo.afterState.elements) {
              // Restore multiple elements
              section.elements = actionToRedo.afterState.elements;
            }
          }
        }
        
        state.autoSave.isDirty = true;
        
        console.log('🔄 Redo:', actionToRedo.description);
      }),

    canUndo: () => {
      const state = get();
      return state.history.undoStack.length > 0;
    },

    canRedo: () => {
      const state = get();
      return state.history.redoStack.length > 0;
    },

    clearHistory: () =>
      set((state: EditStore) => {
        state.history.undoStack = [];
        state.history.redoStack = [];
      }),

    executeUndoableAction: <T>(
      actionType: UndoableAction,
      actionName: string,
      action: () => T
    ): T => {
      const previousState = get();
      
      // Execute the action
      const result = action();
      
      const newState = get();
      
      // Add to history using EditHistoryEntry format
      const historyItem: EditHistoryEntry = {
        type: actionType === 'background-system-change' || actionType === 'color-tokens-update' || actionType === 'typography-theme-change' || actionType === 'theme-update' ? 'theme' :
              actionType === 'section-add' || actionType === 'section-delete' ? 'section' :
              actionType === 'section-reorder' ? 'layout' :
              actionType === 'element-content-update' ? 'content' : 'theme',
        description: actionName,
        timestamp: Date.now(),
        beforeState: {
          theme: previousState.theme,
          sections: [...previousState.sections],
          content: { ...previousState.content },
          sectionLayouts: { ...previousState.sectionLayouts },
        },
        afterState: {
          theme: newState.theme,
          sections: [...newState.sections],
          content: { ...newState.content },
          sectionLayouts: { ...newState.sectionLayouts },
        },
      };
      
      set((state: EditStore) => {
        state.history.undoStack.push(historyItem);
        state.history.redoStack = [];
        
        if (state.history.undoStack.length > state.history.maxHistorySize) {
          state.history.undoStack.shift();
        }
      });
      
      return result;
    },

    /**
     * ===== KEYBOARD SHORTCUTS =====
     */
    
    handleKeyboardShortcut: (event: KeyboardEvent) => {
      const state = get();
      
      // Prevent shortcuts in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;
      
      if (cmdKey && !event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            get().undo();
            break;
          case 'y':
            event.preventDefault();
            get().redo();
            break;
          case 's':
            event.preventDefault();
            get().triggerAutoSave();
            break;
          case 'd':
            event.preventDefault();
            if (state.selectedSection) {
              get().duplicateSection(state.selectedSection);
            }
            case '.':
            event.preventDefault();
            // Show advanced menu for current selection
            if (state.selectedElement) {
              const elementId = `${state.selectedElement.sectionId}.${state.selectedElement.elementKey}`;
              // This would need to be handled by the toolbar component
              console.log('Show advanced menu for element via keyboard:', elementId);
            } else if (state.selectedSection) {
              console.log('Show advanced menu for section via keyboard:', state.selectedSection);
            }
            break;
            
        }
      }
      
      if (cmdKey && event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            get().redo();
            break;
        }
      }
      
      // Non-modifier shortcuts
      if (!cmdKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            // Clear selections and hide toolbars
            get().setActiveSection(undefined);
            get().selectElement(null);
            get().hideSectionToolbar();
            get().hideElementToolbar();
            get().hideFormToolbar();
            get().hideImageToolbar();
            break;
          case 'Delete':
          case 'Backspace':
            event.preventDefault();
            if (state.selectedSection && state.mode === 'edit') {
              if (confirm('Are you sure you want to delete this section?')) {
                get().removeSection(state.selectedSection);
              }
            }
            break;
        }
      }
    },

    /**
     * ===== DRAG AND DROP =====
     */
    
    handleDragStart: (sectionId: string, event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', sectionId);
        event.dataTransfer.effectAllowed = 'move';
      }
      
      set((state: EditStore) => {
        state.selectedSection = sectionId;
      });
    },
    
    handleDragOver: (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    },
    
    handleDrop: (targetSectionId: string, position: 'before' | 'after', event: DragEvent) => {
      event.preventDefault();
      
      const draggedSectionId = event.dataTransfer?.getData('text/plain');
      if (!draggedSectionId || draggedSectionId === targetSectionId) return;
      
      const state = get();
      const currentSections = [...state.sections];
      const draggedIndex = currentSections.indexOf(draggedSectionId);
      const targetIndex = currentSections.indexOf(targetSectionId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Remove dragged section
      currentSections.splice(draggedIndex, 1);
      
      // Calculate new position
      const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const newIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;
      
      // Insert at new position
      currentSections.splice(newIndex, 0, draggedSectionId);
      
      get().reorderSections(currentSections);
    },

    /**
     * ===== RESPONSIVE HELPERS =====
     */
    
    updateViewportInfo: () => {
      set((state: EditStore) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Auto-collapse left panel on mobile
        if (width < 768 && !state.leftPanel.collapsed) {
          state.leftPanel.collapsed = true;
        }
        
        // Adjust panel width for smaller screens
        if (width < 1024 && state.leftPanel.width > 280) {
          state.leftPanel.width = 280;
        }
        
        // Hide toolbars on very small screens
        if (width < 640) {
          state.floatingToolbars.section.visible = false;
          state.floatingToolbars.element.visible = false;
          state.floatingToolbars.form.visible = false;
          state.floatingToolbars.image.visible = false;
        }
      });
    },

    /**
     * ===== ACCESSIBILITY =====
     */
    
    announceLiveRegion: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      // Create or update live region for screen readers
      let liveRegion = document.getElementById('edit-store-live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'edit-store-live-region';
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
      }
      
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegion) {
          liveRegion.textContent = '';
        }
      }, 1000);
    },
    
    focusElement: (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        
        // Announce focus change
        const elementType = element.getAttribute('data-element-type') || 'element';
        get().announceLiveRegion(`Focused ${elementType}`);
      }
    },

    /**
     * ===== PERFORMANCE MONITORING =====
     */
    
    trackPerformance: (operation: string, startTime: number) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow operations
        console.warn(`🐌 Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      // Track in performance metrics if available
      if (process.env.NODE_ENV === 'development') {
        const debug = (window as any).__editStoreDebug;
        if (debug && debug.trackRender) {
          debug.trackRender(operation, duration);
        }
      }
    },
  };
}