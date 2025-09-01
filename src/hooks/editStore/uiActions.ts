// hooks/editStore/uiActions.ts - UI state and interaction actions
import type { EditStore, UISlice, ElementSelection, ToolbarAction, EditHistoryEntry } from '@/types/store';
import type { UIActions } from '@/types/store';
import type { AdvancedActionItem, AdvancedMenuState } from '@/types/store/state';
import { logger } from '@/lib/logger';
import type { 
  UndoableAction, 
  ActionHistoryItem, 
  UndoRedoState 
} from '@/types/core';

/**
 * Helper function to parse image targetId (copied from ImageToolbar)
 */
function parseImageTargetId(targetId: string) {
  logger.debug('🔍 Parsing image targetId:', targetId);
  
  // Check if targetId follows the "sectionId.elementKey" format (from showToolbar)
  if (targetId.includes('.')) {
    const [sectionId, elementKey] = targetId.split('.');
    const result = { sectionId, elementKey };
    logger.debug('🎯 Dot notation parsed:', result);
    return result;
  }
  
  // For hero images, targetId format is: sectionId-hero-image
  // For other images, targetId format might be: sectionId-elementKey
  const parts = targetId.split('-');
  logger.debug('🔍 Split parts:', parts);
  
  // Check most specific patterns first (longest matches)
  if (parts.length >= 5 && parts[parts.length - 4] === 'image' && parts[parts.length - 3] === 'first' && parts[parts.length - 2] === 'hero') {
    // Image first hero case: "section123-image-first-hero-image" -> sectionId: "section123", elementKey: "image_first_hero_image"
    const sectionId = parts.slice(0, -4).join('-');
    const result = { sectionId, elementKey: 'image_first_hero_image' };
    logger.debug('🎯 Image first hero image parsed:', result);
    return result;
  } else if (parts.length >= 4 && parts[parts.length - 3] === 'center' && parts[parts.length - 2] === 'hero') {
    // Center hero image case: "section123-center-hero-image" -> sectionId: "section123", elementKey: "center_hero_image"
    const sectionId = parts.slice(0, -3).join('-');
    const result = { sectionId, elementKey: 'center_hero_image' };
    logger.debug('🎯 Center hero image parsed:', result);
    return result;
  } else if (parts.length >= 4 && parts[parts.length - 3] === 'split' && parts[parts.length - 2] === 'hero') {
    // Split hero image case: "section123-split-hero-image" -> sectionId: "section123", elementKey: "split_hero_image"
    const sectionId = parts.slice(0, -3).join('-');
    const result = { sectionId, elementKey: 'split_hero_image' };
    logger.debug('🎯 Split hero image parsed:', result);
    return result;
  } else if (parts.length >= 3 && parts[parts.length - 2] === 'hero') {
    // Standard hero image case: "section123-hero-image" -> sectionId: "section123", elementKey: "hero_image"
    const sectionId = parts.slice(0, -2).join('-');
    const result = { sectionId, elementKey: 'hero_image' };
    logger.debug('🎯 Hero image parsed:', result);
    return result;
  } else if (parts.length >= 2) {
    // Other image cases - assume format: "sectionId-elementKey"
    const sectionId = parts[0];
    const elementKey = parts.slice(1).join('-');
    const result = { sectionId, elementKey };
    logger.debug('🎯 Other image parsed:', result);
    return result;
  }
  logger.debug('❌ Failed to parse image targetId');
  return null;
}

/**
 * Helper function to get context-aware actions for toolbar types
 */
function getActionsForType(type: string, targetId: string, state: EditStore): string[] {
  switch (type) {
    case 'section':
      return ['change-layout', 'add-element', 'background-settings', 'regenerate-section', 'duplicate-section', 'delete-section'];
    case 'element':
      return ['regenerate-element', 'duplicate-element', 'element-style', 'delete-element'];
    case 'text':
      return ['format-bold', 'format-italic', 'text-color', 'font-size', 'text-align', 'regenerate'];
    case 'image':
      return ['replace-image', 'stock-photos', 'edit-image', 'alt-text', 'delete-image'];
    case 'form':
      return ['add-field', 'form-settings', 'integrations', 'form-styling'];
    default:
      return [];
  }
}

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
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
      }),
    
    setEditMode: (mode: 'section' | 'element' | 'global') =>
      set((state: EditStore) => {
        state.editMode = mode;
        
        // Clear inappropriate selections for mode
        if (mode === 'section') {
          state.selectedElement = undefined;
          if (state.toolbar.type === 'element') {
            state.toolbar.visible = false;
            state.toolbar.type = null;
          }
        } else if (mode === 'element') {
          // Keep element selection if valid
        } else if (mode === 'global') {
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          state.toolbar.visible = false;
          state.toolbar.type = null;
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
          if (state.toolbar.type === 'element') {
            state.toolbar.visible = false;
            state.toolbar.type = null;
          }
        }
        
        // Update section metadata
        Object.values(state.content).forEach(section => {
          if (section.editMetadata) {
            section.editMetadata.isSelected = section.id === sectionId;
          }
        });
        
        // Hide section toolbar if no section selected
        if (!sectionId && state.toolbar.type === 'section') {
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
      }),
    
    selectElement: (selection: ElementSelection | null) =>
      set((state: EditStore) => {
        // Prevent infinite loops by checking if selection actually changed
        const currentSelection = state.selectedElement;
        const isSameSelection = currentSelection && selection && 
          currentSelection.sectionId === selection.sectionId && 
          currentSelection.elementKey === selection.elementKey;
        
        if (isSameSelection) {
          return; // No change, prevent infinite loop
        }
        
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
        if (!selection && state.toolbar.type === 'element') {
          state.toolbar.visible = false;
          state.toolbar.type = null;
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
          state.toolbar.visible = false;
          state.toolbar.type = null;
        }
      }),

    /**
     * ===== TEXT EDITING MANAGEMENT =====
     */
    
    setTextEditingMode: (isEditing: boolean, element?: { sectionId: string; elementKey: string }) =>
      set((state: EditStore) => {
        state.isTextEditing = isEditing;
        state.textEditingElement = isEditing && element ? element : undefined;
        
        logger.debug('📝 Text editing mode changed:', { 
          isEditing, 
          element,
          currentToolbar: state.toolbar.type 
        });
      }),

    /**
     * ===== FORMATTING STATE MANAGEMENT =====
     */
    
    setFormattingInProgress: (isInProgress: boolean) =>
      set((state: EditStore) => {
        state.formattingInProgress = isInProgress;
        
        logger.debug('✨ Formatting in progress changed:', { 
          isInProgress,
          timestamp: Date.now()
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
        state.leftPanel.manuallyToggled = true; // Mark as manually toggled
      }),
    
    setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) =>
      set((state: EditStore) => {
        state.leftPanel.activeTab = tab;
      }),

    /**
     * ===== SIMPLIFIED TOOLBAR MANAGEMENT =====
     */
    
    showToolbar: (type: 'section' | 'element' | 'text' | 'image' | 'form', targetId: string, position?: { x: number; y: number }) =>
      set((state: EditStore) => {
        
        // Simple position calculation if not provided
        const pos = position || { x: 0, y: 0 };
        
        // Get context-aware actions based on type
        const actions = getActionsForType(type, targetId, state);
        
        
        // Update toolbar state
        state.toolbar = {
          type,
          visible: true,
          position: pos,
          targetId,
          actions,
        };
        
        
        // Update selection state
        if (type === 'section') {
          state.selectedSection = targetId;
          state.selectedElement = undefined;
        } else if (type === 'element') {
          const [sectionId, elementKey] = targetId.split('.');
          state.selectedElement = { 
            sectionId, 
            elementKey, 
            type: 'text' as any, // Default type
            editMode: 'edit' as any // Default edit mode
          };
          state.selectedSection = sectionId;
        } else if (type === 'text') {
          // For text toolbar, maintain the current element selection
          const [sectionId, elementKey] = targetId.split('.');
          if (sectionId && elementKey) {
            state.selectedElement = { 
              sectionId, 
              elementKey,
              type: 'text' as any,
              editMode: 'inline' as any
            };
            state.selectedSection = sectionId;
          }
        } else if (type === 'image') {
          // For image toolbar, parse the complex targetId format
          const parsedImage = parseImageTargetId(targetId);
          if (parsedImage) {
            state.selectedElement = { 
              sectionId: parsedImage.sectionId, 
              elementKey: parsedImage.elementKey,
              type: 'image' as any,
              editMode: 'edit' as any
            };
            state.selectedSection = parsedImage.sectionId;
          }
          logger.debug('🎯 Image selection state set:', parsedImage);
        } else if (type === 'form') {
          // For form toolbar, parse the targetId (could be complex like image)
          const [sectionId, elementKey] = targetId.split('.');
          if (sectionId && elementKey) {
            state.selectedElement = { 
              sectionId, 
              elementKey,
              type: 'form' as any,
              editMode: 'edit' as any
            };
            state.selectedSection = sectionId;
          }
        }
      }),
    
    hideToolbar: () =>
      set((state: EditStore) => {
        state.toolbar.visible = false;
        state.toolbar.type = null;
        state.toolbar.targetId = null;
        state.toolbar.actions = [];
      }),
    
    // Legacy wrapper functions for compatibility
    showSectionToolbar: (sectionId: string, position: { x: number; y: number }) => 
      get().showToolbar('section', sectionId, position),
    
    showElementToolbar: (elementId: string, position: { x: number; y: number }) => 
      get().showToolbar('element', elementId, position),
    
    hideSectionToolbar: () => get().hideToolbar(),
    hideElementToolbar: () => get().hideToolbar(),
    
    showFormToolbar: (formId: string, position: { x: number; y: number }) => 
      get().showToolbar('form', formId, position),
    
    hideFormToolbar: () => get().hideToolbar(),
    
    showImageToolbar: (imageId: string, position: { x: number; y: number }) => 
      get().showToolbar('image', imageId, position),
    
    hideImageToolbar: () => get().hideToolbar(),
    
    showTextToolbar: (position: { x: number; y: number }) => 
      get().showToolbar('text', 'current-text', position),
    
    hideTextToolbar: () => get().hideToolbar(),

    /**
     * ===== AUTO-SAVE UI =====
     */
    
    triggerAutoSave: () => {
      const state = get();
      if (state.persistence.isDirty && !state.persistence.isSaving) {
        // Simplified auto-save trigger
        setTimeout(async () => {
          try {
            await state.save();
          } catch (error) {
            logger.error('Auto-save failed:', error);
          }
        }, 2000);
      }
    },
    
    clearAutoSaveError: () =>
      set((state: EditStore) => {
        // Clear error from persistence state
        state.persistence.saveError = undefined;
      }),

    // Simplified trackUIChange for toolbar actions
    trackUIChange: (change: any) => {
      set((state: EditStore) => {
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
    },


    /**
     * ===== FORMS UI =====
     */
    
    setActiveForm: (formId?: string) =>
      set((state: EditStore) => {
        (state.forms as any).activeForm = formId;
      }),
    
    showFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = true;
        state.leftPanel.activeTab = 'pageStructure'; // Or dedicated forms tab
      }),
    
    hideFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = false;
        (state.forms as any).formBuilder.editingField = undefined;
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
        
        (state.forms as any).activeForm = formId;
        (state.forms as any).formBuilder.visible = true;
        state.persistence.isDirty = true;
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
            // Initialize editMetadata if it doesn't exist
            if (!state.content[sectionId].editMetadata) {
              state.content[sectionId].editMetadata = {
                isSelected: false,
                isEditing: false,
                lastModified: Date.now(),
                isDeletable: true,
                isMovable: true,
                isDuplicable: true,
                completionPercentage: 0,
                validationStatus: {
                  isValid: true,
                  errors: [],
                  warnings: [],
                  missingRequired: [],
                  lastValidated: Date.now(),
                },
              };
            }
            
            // Initialize validationStatus if it doesn't exist
            if (!state.content[sectionId].editMetadata.validationStatus) {
              state.content[sectionId].editMetadata.validationStatus = {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              };
            }
            
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
            // Initialize editMetadata if it doesn't exist
            if (!state.content[sectionId].editMetadata) {
              state.content[sectionId].editMetadata = {
                isSelected: false,
                isEditing: false,
                lastModified: Date.now(),
                isDeletable: true,
                isMovable: true,
                isDuplicable: true,
                completionPercentage: 0,
                validationStatus: {
                  isValid: true,
                  errors: [],
                  warnings: [],
                  missingRequired: [],
                  lastValidated: Date.now(),
                },
              };
            }
            
            // Initialize validationStatus if it doesn't exist
            if (!state.content[sectionId].editMetadata.validationStatus) {
              state.content[sectionId].editMetadata.validationStatus = {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              };
            }
            
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
        logger.debug('Advanced menu functionality not implemented in current store structure');
      }),

    hideAdvancedMenu: () =>
      set((state: EditStore) => {
        logger.debug('Advanced menu functionality not implemented in current store structure');
      }),

    toggleAdvancedMenu: (
      toolbarType: 'section' | 'element' | 'text' | 'form' | 'image',
      triggerElement: HTMLElement,
      actions: AdvancedActionItem[]
    ) => {
      logger.debug('Advanced menu functionality not implemented in current store structure');
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
        
        state.persistence.isDirty = true;
        
        logger.debug('🔄 Undo:', lastAction.description);
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
        
        state.persistence.isDirty = true;
        
        logger.debug('🔄 Redo:', actionToRedo.description);
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
              logger.debug('Show advanced menu for element via keyboard:', elementId);
            } else if (state.selectedSection) {
              logger.debug('Show advanced menu for section via keyboard:', state.selectedSection);
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
     * ===== RESPONSIVE HELPERS =====
     */
    
    updateViewportInfo: () => {
      set((state: EditStore) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Auto-collapse left panel on mobile (but allow manual toggle back)
        if (width < 768 && !state.leftPanel.collapsed && !state.leftPanel.manuallyToggled) {
          state.leftPanel.collapsed = true;
        }
        
        // Auto-expand on desktop if it was auto-collapsed
        if (width >= 768 && state.leftPanel.collapsed && !state.leftPanel.manuallyToggled) {
          state.leftPanel.collapsed = false;
        }
        
        // Adjust panel width for smaller screens
        if (width < 1024 && state.leftPanel.width > 280) {
          state.leftPanel.width = 280;
        }
        
        // Hide toolbars on very small screens
        if (width < 640) {
          state.toolbar.visible = false;
          state.toolbar.type = null;
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
     * ===== DRAG AND DROP =====
     */
    
    handleDragStart: (sectionId: string, event: DragEvent) => {
      // TODO: Implement drag start functionality
      logger.debug('Drag start:', { sectionId, event });
    },

    handleDragOver: (event: DragEvent) => {
      // TODO: Implement drag over functionality
      event.preventDefault();
      logger.debug('Drag over:', event);
    },

    handleDrop: (targetSectionId: string, position: 'before' | 'after', event: DragEvent) => {
      // TODO: Implement drop functionality
      event.preventDefault();
      logger.debug('Drop:', { targetSectionId, position, event });
    },

    /**
     * ===== PERFORMANCE MONITORING =====
     */
    
    trackPerformance: (operation: string, startTime: number) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow operations
        logger.warn(`🐌 Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      // Track in performance metrics if available
      if (process.env.NODE_ENV === 'development') {
        const debug = (window as any).__editStoreDebug;
        if (debug && debug.trackRender) {
          debug.trackRender(operation, duration);
        }
      }
    },

    getPerformanceStats: () => {
      // TODO: Implement performance stats
      return {
        totalOperations: 0,
        averageOperationTime: 0,
        slowOperations: [],
        memoryUsage: 0
      };
    },

    /**
     * ===== LAYOUT CHANGE MODAL =====
     */
    
    showLayoutChangeModal: (sectionId: string, sectionType: string, currentLayout: string, currentData: Record<string, any>) =>
      set((state: EditStore) => {
        state.layoutChangeModal = {
          visible: true,
          sectionId,
          sectionType,
          currentLayout,
          currentData,
        };
      }),

    hideLayoutChangeModal: () =>
      set((state: EditStore) => {
        state.layoutChangeModal = {
          visible: false,
          sectionId: undefined,
          sectionType: undefined,
          currentLayout: undefined,
          currentData: undefined,
        };
      }),
  };
}