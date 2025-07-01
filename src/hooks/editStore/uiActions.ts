// hooks/editStore/uiActions.ts - UI state and interaction actions
import type { EditStore, UISlice, ElementSelection, ToolbarAction, EditHistoryEntry } from '@/types/store';
import type { UIActions } from '@/types/store';
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
        state.floatingToolbars.element.visible = false;
        state.floatingToolbars.form.visible = false;
        state.floatingToolbars.image.visible = false;
        
        state.floatingToolbars.section = {
          visible: true,
          position,
          targetId: sectionId,
          contextActions: [
            { 
              id: 'regenerate', 
              label: 'Regenerate', 
              type: 'button', 
              icon: 'refresh',
              handler: () => get().regenerateSection(sectionId) 
            },
            { 
              id: 'duplicate', 
              label: 'Duplicate', 
              type: 'button', 
              icon: 'copy',
              handler: () => get().duplicateSection(sectionId) 
            },
            { id: 'separator1', label: '', type: 'separator' },
            { 
              id: 'move-up', 
              label: 'Move Up', 
              type: 'button', 
              icon: 'arrow-up',
              disabled: state.sections.indexOf(sectionId) === 0,
              handler: () => {
                const currentIndex = state.sections.indexOf(sectionId);
                if (currentIndex > 0) {
                  const newOrder = [...state.sections];
                  [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
                  get().reorderSections(newOrder);
                }
              }
            },
            { 
              id: 'move-down', 
              label: 'Move Down', 
              type: 'button', 
              icon: 'arrow-down',
              disabled: state.sections.indexOf(sectionId) === state.sections.length - 1,
              handler: () => {
                const currentIndex = state.sections.indexOf(sectionId);
                if (currentIndex < state.sections.length - 1) {
                  const newOrder = [...state.sections];
                  [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                  get().reorderSections(newOrder);
                }
              }
            },
            { id: 'separator2', label: '', type: 'separator' },
            { 
              id: 'delete', 
              label: 'Delete', 
              type: 'button', 
              icon: 'trash',
              handler: () => {
                if (confirm('Are you sure you want to delete this section?')) {
                  get().removeSection(sectionId);
                }
              }
            },
          ],
        };
      }),
    
    hideSectionToolbar: () =>
      set((state: EditStore) => {
        state.floatingToolbars.section.visible = false;
      }),
    
    showElementToolbar: (elementId: string, position: { x: number; y: number }) =>
      set((state: EditStore) => {
        const [sectionId, elementKey] = elementId.split('.');
        
        // Hide other toolbars first
        state.floatingToolbars.section.visible = false;
        state.floatingToolbars.form.visible = false;
        state.floatingToolbars.image.visible = false;
        
        state.floatingToolbars.element = {
          visible: true,
          position,
          targetId: elementId,
          contextActions: [
            { 
              id: 'regenerate', 
              label: 'Regenerate', 
              type: 'button', 
              icon: 'refresh',
              handler: () => get().regenerateElement(sectionId, elementKey) 
            },
            { 
              id: 'variations', 
              label: 'Get Variations', 
              type: 'button', 
              icon: 'layers',
              handler: () => get().regenerateElement(sectionId, elementKey, 5) 
            },
            { id: 'separator1', label: '', type: 'separator' },
            { 
              id: 'format', 
              label: 'Format', 
              type: 'dropdown', 
              icon: 'type',
              children: [
                { id: 'bold', label: 'Bold', type: 'button', icon: 'bold' },
                { id: 'italic', label: 'Italic', type: 'button', icon: 'italic' },
                { id: 'underline', label: 'Underline', type: 'button', icon: 'underline' },
              ]
            },
            { 
              id: 'edit-mode', 
              label: 'Edit Mode', 
              type: 'dropdown', 
              icon: 'edit',
              children: [
                { id: 'inline', label: 'Inline', type: 'button' },
                { id: 'modal', label: 'Modal', type: 'button' },
                { id: 'sidebar', label: 'Sidebar', type: 'button' },
              ]
            },
          ],
        };
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
      if (!state.autoSave.isDirty || state.autoSave.isSaving) return;
      
      // This connects to the debounced auto-save function
      const debouncedAutoSave = (get() as any).debouncedAutoSave;
      if (debouncedAutoSave) {
        debouncedAutoSave();
      }
    },
    
    clearAutoSaveError: () =>
      set((state: EditStore) => {
        state.autoSave.error = undefined;
      }),

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
    
    undo: () =>
      set((state: EditStore) => {
        const entry = state.history.undoStack.pop();
        if (!entry) return;
        
        // Apply undo logic based on entry type
        try {
          switch (entry.type) {
            case 'content':
              if (entry.sectionId && entry.beforeState) {
                const section = state.content[entry.sectionId];
                if (section && entry.beforeState.elementKey) {
                  // Restore element content
                  if (entry.beforeState.content !== undefined) {
                    section.elements[entry.beforeState.elementKey] = {
                      content: entry.beforeState.content,
                      type: section.elements[entry.beforeState.elementKey]?.type || 'text',
                      isEditable: true,
                      editMode: 'inline',
                    };
                  }
                } else if (section && entry.beforeState.elements) {
                  // Restore multiple elements
                  section.elements = entry.beforeState.elements;
                }
              }
              break;
              
            case 'section':
              if (entry.beforeState?.sectionId && entry.beforeState?.sectionData) {
                // Restore removed section
                const { sectionId, sectionData, sectionIndex } = entry.beforeState;
                state.sections.splice(sectionIndex || state.sections.length, 0, sectionId);
                state.content[sectionId] = sectionData;
                state.sectionLayouts[sectionId] = sectionData.layout || 'default';
              } else if (entry.afterState?.sectionId) {
                // Remove added section
                const sectionId = entry.afterState.sectionId;
                state.sections = state.sections.filter(id => id !== sectionId);
                delete state.content[sectionId];
                delete state.sectionLayouts[sectionId];
              }
              break;
              
            case 'layout':
              if (entry.beforeState?.sections) {
                // Restore section order
                state.sections = entry.beforeState.sections;
              } else if (entry.beforeState?.layouts) {
                // Restore section layouts
                state.sectionLayouts = entry.beforeState.layouts;
              }
              break;
              
            case 'theme':
              if (entry.beforeState?.theme) {
                // Restore theme
                state.theme = entry.beforeState.theme;
              } else if (entry.beforeState?.baseColor) {
                state.theme.colors.baseColor = entry.beforeState.baseColor;
              } else if (entry.beforeState?.accentColor) {
                state.theme.colors.accentColor = entry.beforeState.accentColor;
              }
              break;
          }
          
          console.log('✅ Undo:', entry.description);
          state.history.redoStack.push(entry);
          state.autoSave.isDirty = true;
          
        } catch (error) {
          console.error('❌ Undo failed:', error);
          // Push entry back to undo stack
          state.history.undoStack.push(entry);
        }
      }),
    
    redo: () =>
      set((state: EditStore) => {
        const entry = state.history.redoStack.pop();
        if (!entry) return;
        
        // Apply redo logic based on entry type
        try {
          switch (entry.type) {
            case 'content':
              if (entry.sectionId && entry.afterState) {
                const section = state.content[entry.sectionId];
                if (section && entry.afterState.elementKey) {
                  // Restore element content
                  if (entry.afterState.content !== undefined) {
                    section.elements[entry.afterState.elementKey] = {
                      content: entry.afterState.content,
                      type: section.elements[entry.afterState.elementKey]?.type || 'text',
                      isEditable: true,
                      editMode: 'inline',
                    };
                  }
                } else if (section && entry.afterState.elements) {
                  // Restore multiple elements
                  section.elements = entry.afterState.elements;
                }
              }
              break;
              
            case 'section':
              if (entry.afterState?.sectionId && !entry.beforeState) {
                // Re-add section
                const sectionId = entry.afterState.sectionId;
                if (!state.sections.includes(sectionId)) {
                  state.sections.push(sectionId);
                  // Create basic section if it doesn't exist
                  if (!state.content[sectionId]) {
                    state.content[sectionId] = {
                      id: sectionId,
                      layout: 'default',
                      elements: {},
                      aiMetadata: {
                        aiGenerated: false,
                        isCustomized: false,
                        aiGeneratedElements: [],
                      },
                      editMetadata: {
                        isSelected: false,
                        isEditing: false,
                        isDeletable: true,
                        isMovable: true,
                        isDuplicable: true,
                        validationStatus: {
                          isValid: true,
                          errors: [],
                          warnings: [],
                          missingRequired: [],
                          lastValidated: Date.now(),
                        },
                        completionPercentage: 0,
                      },
                    };
                  }
                }
              } else if (entry.beforeState?.sectionId) {
                // Re-remove section
                const sectionId = entry.beforeState.sectionId;
                state.sections = state.sections.filter(id => id !== sectionId);
                delete state.content[sectionId];
                delete state.sectionLayouts[sectionId];
              }
              break;
              
            case 'layout':
              if (entry.afterState?.sections) {
                // Restore section order
                state.sections = entry.afterState.sections;
              } else if (entry.afterState?.layouts) {
                // Restore section layouts
                state.sectionLayouts = entry.afterState.layouts;
              }
              break;
              
            case 'theme':
              if (entry.afterState?.theme) {
                // Restore theme
                state.theme = entry.afterState.theme;
              } else if (entry.afterState?.baseColor) {
                state.theme.colors.baseColor = entry.afterState.baseColor;
              } else if (entry.afterState?.accentColor) {
                state.theme.colors.accentColor = entry.afterState.accentColor;
              }
              break;
          }
          
          console.log('✅ Redo:', entry.description);
          state.history.undoStack.push(entry);
          state.autoSave.isDirty = true;
          
        } catch (error) {
          console.error('❌ Redo failed:', error);
          // Push entry back to redo stack
          state.history.redoStack.push(entry);
        }
      }),
    
    clearHistory: () =>
      set((state: EditStore) => {
        state.history.undoStack = [];
        state.history.redoStack = [];
      }),

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