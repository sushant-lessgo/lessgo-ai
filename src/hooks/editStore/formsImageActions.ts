// hooks/editStore/formsImageActions.ts - Forms and image management actions
import type { EditStore } from '@/types/store';
import type { FormsImageActions } from '@/types/store';
import type { FormField } from '@/types/core/forms';
import { createFormActions } from './formActions';
import { logger } from '@/lib/logger';
/**
 * ===== UTILITY FUNCTIONS =====
 */

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Validate file type
const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return validTypes.includes(file.type);
};

// Get file size in MB
const getFileSizeMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * ===== FORMS & IMAGE ACTIONS CREATOR =====
 */
export function createFormsImageActions(set: any, get: any): FormsImageActions {
  const formActions = createFormActions(set, get);
  
  return {
    // Include all form actions
    ...formActions,
    
    // Legacy compatibility methods (will be removed after full migration)
    addForm: (form: any) => {
      // Legacy method - delegate to createForm
      return formActions.createForm(form);
    },
    linkButtonToForm: (sectionId: string, formId: string, behavior: 'scrollTo' | 'openModal') => {
      // Legacy method - stub for now
      logger.warn('linkButtonToForm is legacy, needs migration');
    },
    unlinkButtonFromForm: (sectionId: string) => {
      // Legacy method - stub for now  
      logger.warn('unlinkButtonFromForm is legacy, needs migration');
    },
    getFormsByPlacement: (placement: 'hero' | 'cta-section') => {
      // Legacy method - return empty for now
      logger.warn('getFormsByPlacement is legacy, needs migration');
      return [];
    },
    /**
     * ===== FORM MANAGEMENT =====
     */
    
    createForm: (sectionId: string, elementKey: string) => {
      const formId = generateId();
      
      set((state: EditStore) => {
        // Convert element to form type
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
            description: `Created form from ${elementKey} in ${sectionId}`,
            timestamp: Date.now(),
            beforeState: { sectionId, elementKey, element: oldElement },
            afterState: { sectionId, elementKey, formId },
            sectionId,
          });
          
          state.history.redoStack = [];
        }
        
        (state.forms as any).activeForm = formId;
        state.persistence.isDirty = true;
      });
      
      logger.debug('✅ Form created:', formId);
      return formId;
    },
    
    addFormField: (formId: string, fieldType: string) =>
      set((state: EditStore) => {
        const fieldId = generateId();
        
        // Create form data structure if it doesn't exist
        if (!state.content[`form-${formId}`]) {
          state.content[`form-${formId}`] = {
            id: `form-${formId}`,
            layout: 'form',
            elements: {
              fields: {
                content: [],
                type: 'list',
                isEditable: true,
                editMode: 'modal',
              },
            },
            aiMetadata: {
              aiGenerated: false,
              isCustomized: true,
              aiGeneratedElements: [],
            },
            editMetadata: {
              isSelected: false,
              isEditing: false,
              isDeletable: true,
              isMovable: false,
              isDuplicable: false,
              validationStatus: {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              },
              completionPercentage: 50,
            },
          };
        }
        
        // Add field to form
        const formData = state.content[`form-${formId}`];
        if (formData && Array.isArray(formData.elements.fields.content)) {
          const newField = {
            id: fieldId,
            type: fieldType,
            label: `${fieldType} Field`,
            required: false,
            placeholder: '',
            validation: {},
            options: fieldType === 'select' || fieldType === 'radio' ? ['Option 1', 'Option 2'] : undefined,
          };
          
          (formData.elements.fields.content as any).push(newField);
          formData.editMetadata.completionPercentage = Math.min(100, 
            formData.elements.fields.content.length * 20
          );
        }
        
        state.persistence.isDirty = true;
        logger.debug('✅ Form field added:', { formId, fieldType, fieldId });
      }),
    
    updateFormField: (formId: string, fieldId: string, properties: any) =>
      set((state: EditStore) => {
        const formData = state.content[`form-${formId}`];
        
        if (formData && Array.isArray(formData.elements.fields.content)) {
          const fieldIndex = formData.elements.fields.content.findIndex(
            (field: any) => field.id === fieldId
          );
          
          if (fieldIndex !== -1) {
            const oldField = { ...(formData.elements.fields.content[fieldIndex] as any) };
            Object.assign(formData.elements.fields.content[fieldIndex], properties);
            
            // Track change
            state.history.undoStack.push({
              type: 'content',
              description: `Updated form field ${properties.label || fieldId}`,
              timestamp: Date.now(),
              beforeState: { formId, fieldId, field: oldField },
              afterState: { formId, fieldId, field: formData.elements.fields.content[fieldIndex] },
            });
            
            state.history.redoStack = [];
            state.persistence.isDirty = true;
            
            logger.debug('✅ Form field updated:', { formId, fieldId, properties });
          }
        }
      }),
    
    deleteFormField: (formId: string, fieldId: string) =>
      set((state: EditStore) => {
        const formData = state.content[`form-${formId}`];
        
        if (formData && Array.isArray(formData.elements.fields.content)) {
          const fieldIndex = formData.elements.fields.content.findIndex(
            (field: any) => field.id === fieldId
          );
          
          if (fieldIndex !== -1) {
            const deletedField = formData.elements.fields.content[fieldIndex];
            formData.elements.fields.content.splice(fieldIndex, 1);
            
            // Update completion percentage
            formData.editMetadata.completionPercentage = Math.max(0,
              formData.elements.fields.content.length * 20
            );
            
            // Track change
            state.history.undoStack.push({
              type: 'content',
              description: `Deleted form field ${(deletedField as any).label || fieldId}`,
              timestamp: Date.now(),
              beforeState: { formId, fieldId, field: deletedField, index: fieldIndex },
              afterState: null,
            });
            
            state.history.redoStack = [];
            state.persistence.isDirty = true;
            
            logger.debug('✅ Form field deleted:', { formId, fieldId });
          }
        }
      }),
    
    updateFormSettings: (formId: string, settings: any) =>
      set((state: EditStore) => {
        const formData = state.content[`form-${formId}`];
        
        if (formData) {
          // Add settings to form elements
          if (!formData.elements.settings) {
            formData.elements.settings = {
              content: {} as any,
              type: 'form',
              isEditable: true,
              editMode: 'modal',
            };
          }
          
          const oldSettings = { ...formData.elements.settings.content as any };
          Object.assign(formData.elements.settings.content, settings);
          
          // Track change
          state.history.undoStack.push({
            type: 'content',
            description: 'Updated form settings',
            timestamp: Date.now(),
            beforeState: { formId, settings: oldSettings },
            afterState: { formId, settings: formData.elements.settings.content },
          });
          
          state.history.redoStack = [];
          state.persistence.isDirty = true;
          
          logger.debug('✅ Form settings updated:', { formId, settings });
        }
      }),
    
    connectFormIntegration: (formId: string, integration: any) =>
      set((state: EditStore) => {
        const formData = state.content[`form-${formId}`];
        
        if (formData) {
          // Add integration to form elements
          if (!formData.elements.integrations) {
            formData.elements.integrations = {
              content: [],
              type: 'list',
              isEditable: true,
              editMode: 'modal',
            };
          }
          
          if (Array.isArray(formData.elements.integrations.content)) {
            formData.elements.integrations.content.push({
              id: generateId(),
              ...integration,
              connectedAt: Date.now(),
            });
            
            // Track change
            state.history.undoStack.push({
              type: 'content',
              description: `Connected ${integration.name || 'integration'} to form`,
              timestamp: Date.now(),
              beforeState: { formId },
              afterState: { formId, integration },
            });
            
            state.history.redoStack = [];
            state.persistence.isDirty = true;
            
            logger.debug('✅ Form integration connected:', { formId, integration });
          }
        }
      }),

    /**
     * ===== IMAGE MANAGEMENT =====
     */
    
    uploadImage: async (file: File, targetElement?: { sectionId: string; elementKey: string }) => {
      const imageId = generateId();

      // Validate file
      if (!isValidImageType(file)) {
        throw new Error('Invalid file type. Please upload a valid image file.');
      }

      if (getFileSizeMB(file) > 10) {
        throw new Error('File too large. Please upload an image smaller than 10MB.');
      }

      set((state: EditStore) => {
        state.images.uploadProgress[imageId] = 0;
      });

      try {
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tokenId', get().tokenId || '');

        // Update progress during upload
        set((state: EditStore) => {
          state.images.uploadProgress[imageId] = 25;
        });

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        set((state: EditStore) => {
          state.images.uploadProgress[imageId] = 75;
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const { url: permanentUrl, metadata } = await response.json();

        set((state: EditStore) => {
          state.images.uploadProgress[imageId] = 100;
        });

        // Update target element if specified
        if (targetElement) {
          get().updateElementContent(targetElement.sectionId, targetElement.elementKey, permanentUrl);

          // Force immediate save for preview consistency
          try {
            const currentState = get();
            const tokenId = currentState.tokenId;

            if (tokenId) {
              const savePayload = {
                tokenId,
                finalContent: {
                  layout: {
                    sections: currentState.sections,
                    theme: currentState.theme,
                  },
                  content: currentState.content,
                },
              };

              const saveResponse = await fetch('/api/saveDraft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
              });

              if (saveResponse.ok) {
                set((state: EditStore) => {
                  state.persistence.isDirty = false;
                  state.persistence.lastSaved = Date.now();
                });
                logger.debug('💾 Immediate save after image upload succeeded');
              } else {
                logger.warn('⚠️ Immediate save after image upload failed - auto-save will retry');
              }
            }
          } catch (error) {
            // Non-blocking - auto-save will retry
            logger.warn('❌ Immediate save failed after upload:', error);
          }

          // Track change
          set((state: EditStore) => {
            state.history.undoStack.push({
              type: 'content',
              description: `Uploaded image to ${targetElement.elementKey}`,
              timestamp: Date.now(),
              beforeState: { sectionId: targetElement.sectionId, elementKey: targetElement.elementKey },
              afterState: { sectionId: targetElement.sectionId, elementKey: targetElement.elementKey, imageUrl: permanentUrl },
              sectionId: targetElement.sectionId,
            });

            state.history.redoStack = [];
          });
        }

        // Clean up progress tracking
        setTimeout(() => {
          set((state: EditStore) => {
            delete state.images.uploadProgress[imageId];
          });
        }, 1000);

        logger.debug('✅ Image uploaded successfully:', { url: permanentUrl, metadata });
        return permanentUrl;

      } catch (error) {
        set((state: EditStore) => {
          delete state.images.uploadProgress[imageId];
          state.errors['image-upload'] = error instanceof Error ? error.message : 'Upload failed';
        });

        logger.error('❌ Image upload failed:', error);
        throw error;
      }
    },
    
    replaceImage: (sectionId: string, elementKey: string, imageUrl: string) => {
      const oldImageUrl = get().content[sectionId]?.elements[elementKey]?.content;
      
      get().updateElementContent(sectionId, elementKey, imageUrl);
      
      set((state: EditStore) => {
        state.history.undoStack.push({
          type: 'content',
          description: `Replaced image in ${elementKey}`,
          timestamp: Date.now(),
          beforeState: { sectionId, elementKey, imageUrl: oldImageUrl },
          afterState: { sectionId, elementKey, imageUrl },
          sectionId,
        });
        
        state.history.redoStack = [];
      });
      
      logger.debug('✅ Image replaced:', { sectionId, elementKey, imageUrl });
    },
    
    searchStockPhotos: async (query: string, targetElement?: { sectionId: string; elementKey: string }) => {
      set((state: EditStore) => {
        state.images.stockPhotos.searchQuery = query;
        state.images.stockPhotos.searchVisible = true;
        state.loadingStates['stock-search'] = true;
      });
      
      try {
        // Simulate API call to stock photo service
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock stock photo results
        const mockResults = [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
            thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200',
            alt: 'Professional business meeting',
            source: 'Unsplash',
            photographer: 'John Doe',
            downloadUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
          },
          {
            id: '2',
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
            thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
            alt: 'Modern office workspace',
            source: 'Unsplash',
            photographer: 'Jane Smith',
            downloadUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
          },
          {
            id: '3',
            url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
            thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200',
            alt: 'Team collaboration',
            source: 'Unsplash',
            photographer: 'Mike Johnson',
            downloadUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
          },
        ];
        
        set((state: EditStore) => {
          state.images.stockPhotos.searchResults = mockResults;
          state.loadingStates['stock-search'] = false;
        });
        
        // If target element specified, this is for replacement
        if (targetElement) {
          set((state: EditStore) => {
            state.images.stockPhotos.targetElement = targetElement;
          });
        }
        
        logger.debug('✅ Stock photo search completed:', { query, resultCount: mockResults.length });
        
      } catch (error) {
        set((state: EditStore) => {
          state.loadingStates['stock-search'] = false;
          state.errors['stock-search'] = error instanceof Error ? error.message : 'Search failed';
        });
        
        logger.error('❌ Stock photo search failed:', error);
        throw error;
      }
    },
    
    selectStockPhoto: (photoId: string) => {
      const state = get();
      const photo = state.images.stockPhotos.searchResults.find((p: any) => p.id === photoId);

      if (!photo) {
        logger.warn('⚠️ Photo not found:', photoId);
        return;
      }

      // Use Pexels URL immediately for optimistic UX
      const previewUrl = photo.downloadUrl || photo.url;
      const targetElement = (state.images.stockPhotos as any).targetElement;

      if (targetElement) {
        // Show preview immediately
        get().replaceImage(targetElement.sectionId, targetElement.elementKey, previewUrl);

        // Proxy through Sharp in background for compression
        const tokenId = get().tokenId;
        if (tokenId) {
          fetch('/api/proxy-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pexelsPhotoId: photoId, tokenId }),
          })
            .then(async (res) => {
              if (res.ok) {
                const { url: blobUrl } = await res.json();
                // Swap to compressed Blob URL
                get().replaceImage(targetElement.sectionId, targetElement.elementKey, blobUrl);
                logger.debug('✅ Stock photo compressed:', { photoId, blobUrl });
              } else {
                logger.warn('⚠️ Proxy failed, keeping Pexels URL');
              }
            })
            .catch((err) => {
              logger.warn('⚠️ Proxy error, keeping Pexels URL:', err);
            });
        }

        // Clean up target element
        set((state: EditStore) => {
          delete (state.images.stockPhotos as any).targetElement;
        });
      }

      // Hide search results
      get().hideStockPhotoSearch();

      logger.debug('✅ Stock photo selected (preview):', { photoId, previewUrl });
      return previewUrl;
    },
    
    generateImageAltText: async (imageUrl: string) => {
      try {
        // Simulate AI-powered alt text generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock alt text based on image URL patterns
        let altText = 'Professional image';
        
        if (imageUrl.includes('business') || imageUrl.includes('office')) {
          altText = 'Professional business environment with modern workspace';
        } else if (imageUrl.includes('team') || imageUrl.includes('meeting')) {
          altText = 'Team collaboration and professional meeting';
        } else if (imageUrl.includes('tech') || imageUrl.includes('computer')) {
          altText = 'Technology and digital workspace setup';
        } else if (imageUrl.includes('product')) {
          altText = 'Product showcase and demonstration';
        }
        
        logger.debug('✅ Alt text generated:', altText);
        return altText;
        
      } catch (error) {
        logger.error('❌ Alt text generation failed:', error);
        return 'Image description not available';
      }
    },
    
    optimizeImage: async (imageUrl: string, options: any = {}) => {
      try {
        // Simulate image optimization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const {
          quality = 80,
          format = 'webp',
          width,
          height,
        } = options;
        
        // Mock optimization by appending query parameters
        const url = new URL(imageUrl);
        url.searchParams.set('q', quality.toString());
        url.searchParams.set('fm', format);
        if (width) url.searchParams.set('w', width.toString());
        if (height) url.searchParams.set('h', height.toString());
        
        const optimizedUrl = url.toString();
        
        
        return optimizedUrl;
        
      } catch (error) {
        logger.error('❌ Image optimization failed:', error);
        throw error;
      }
    },

    /**
     * ===== BULK OPERATIONS =====
     */
    
    bulkUploadImages: async (files: FileList) => {
      const results = [];
      const errors = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const imageUrl = await get().uploadImage(file);
          results.push({ file: file.name, url: imageUrl });
        } catch (error) {
          errors.push({ file: file.name, error: error instanceof Error ? error.message : 'Upload failed' });
        }
      }
      
      logger.debug('📁 Bulk upload completed:', { 
        successful: results.length, 
        failed: errors.length 
      });
      
      return { results, errors };
    },
    
    optimizeAllImages: async () => {
      const state = get();
      const imageElements: Array<{ sectionId: string; elementKey: string; imageUrl: string }> = [];
      
      // Collect all image elements
      Object.entries(state.content).forEach(([sectionId, section]: [string, any]) => {
  Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          if (element.type === 'image' && typeof element.content === 'string') {
            imageElements.push({
              sectionId,
              elementKey,
              imageUrl: element.content,
            });
          }
        });
      });
      
      const results = [];
      const errors = [];
      
      set((state: EditStore) => {
        state.loadingStates['optimize-images'] = true;
      });
      
      try {
        for (const { sectionId, elementKey, imageUrl } of imageElements) {
          try {
            const optimizedUrl = await get().optimizeImage(imageUrl, {
              quality: 85,
              format: 'webp',
            });
            
            // Update element with optimized URL
            get().updateElementContent(sectionId, elementKey, optimizedUrl);
            
            results.push({ sectionId, elementKey, originalUrl: imageUrl, optimizedUrl });
          } catch (error) {
            errors.push({ sectionId, elementKey, error: error instanceof Error ? error.message : 'Optimization failed' });
          }
        }
        
        set((state: EditStore) => {
          state.loadingStates['optimize-images'] = false;
        });
        
        logger.debug('🚀 Bulk image optimization completed:', {
          successful: results.length,
          failed: errors.length,
        });
        
        return { results, errors };
        
      } catch (error) {
        set((state: EditStore) => {
          state.loadingStates['optimize-images'] = false;
          state.errors['optimize-images'] = error instanceof Error ? error.message : 'Bulk optimization failed';
        });
        throw error;
      }
    },

    /**
     * ===== FORM VALIDATION =====
     */
    
    validateForm: (formId: string) => {
      const formData = get().content[`form-${formId}`];
      
      if (!formData || !Array.isArray(formData.elements.fields?.content)) {
        return {
          isValid: false,
          errors: ['Form data not found'],
          warnings: [],
        };
      }
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const fields = formData.elements.fields.content;
      
      // Check if form has at least one field
      if (fields.length === 0) {
        errors.push('Form must have at least one field');
      }
      
      // Validate individual fields
      fields.forEach((field: any, index: number) => {
        if (!field.label || field.label.trim() === '') {
          errors.push(`Field ${index + 1} is missing a label`);
        }
        
        if (field.type === 'select' || field.type === 'radio') {
          if (!field.options || field.options.length === 0) {
            errors.push(`${field.label || `Field ${index + 1}`} must have at least one option`);
          }
        }
        
        if (field.type === 'email' && !field.validation?.pattern) {
          warnings.push(`${field.label || `Field ${index + 1}`} should have email validation`);
        }
      });
      
      // Check for required fields
      const hasRequiredField = fields.some((field: any) => field.required);
      if (!hasRequiredField) {
        warnings.push('Consider making at least one field required');
      }
      
      const isValid = errors.length === 0;
      
      // Update form validation status
      set((state: EditStore) => {
        if (state.content[`form-${formId}`]) {
          // Initialize editMetadata if it doesn't exist
          if (!state.content[`form-${formId}`].editMetadata) {
            state.content[`form-${formId}`].editMetadata = {
              isSelected: false,
              lastModified: Date.now(),
              completionPercentage: 0,
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
            };
          }
          
          // Initialize validationStatus if it doesn't exist
          if (!state.content[`form-${formId}`].editMetadata.validationStatus) {
            state.content[`form-${formId}`].editMetadata.validationStatus = {
              isValid: true,
              errors: [],
              warnings: [],
              missingRequired: [],
              lastValidated: Date.now(),
            };
          }
          
          state.content[`form-${formId}`].editMetadata.validationStatus = {
            isValid,
            errors: errors.map(error => ({
              elementKey: 'form',
              code: 'validation',
              message: error,
              severity: 'error' as const,
            })),
            warnings: warnings.map(warning => ({
              elementKey: 'form',
              code: 'warning',
              message: warning,
              autoFixable: false,
            })),
            missingRequired: isValid ? [] : ['validation'],
            lastValidated: Date.now(),
          };
        }
      });
      
      return { isValid, errors, warnings };
    },
    
    exportForm: (formId: string) => {
      const formData = get().content[`form-${formId}`];
      
      if (!formData) {
        throw new Error('Form not found');
      }
      
      const exportData = {
        id: formId,
        name: formData.elements.settings?.content?.name || 'Untitled Form',
        fields: formData.elements.fields?.content || [],
        settings: formData.elements.settings?.content || {},
        integrations: formData.elements.integrations?.content || [],
        validation: get().validateForm(formId),
        exportedAt: Date.now(),
        version: '1.0',
      };
      
      logger.debug('📤 Form exported:', formId);
      return exportData;
    },
    
    importForm: (formData: any, targetSection?: { sectionId: string; elementKey: string }) => {
      const formId = generateId();
      
      set((state: EditStore) => {
        // Create form content
        state.content[`form-${formId}`] = {
          id: `form-${formId}`,
          layout: 'form',
          elements: {
            fields: {
              content: formData.fields || [],
              type: 'list',
              isEditable: true,
              editMode: 'modal',
            },
            settings: {
              content: formData.settings || {},
              type: 'form',
              isEditable: true,
              editMode: 'modal',
            },
            integrations: {
              content: formData.integrations || [],
              type: 'list',
              isEditable: true,
              editMode: 'modal',
            },
          },
          aiMetadata: {
            aiGenerated: false,
            isCustomized: true,
            aiGeneratedElements: [],
          },
          editMetadata: {
            isSelected: false,
            isEditing: false,
            isDeletable: true,
            isMovable: false,
            isDuplicable: true,
            validationStatus: {
              isValid: true,
              errors: [],
              warnings: [],
              missingRequired: [],
              lastValidated: Date.now(),
            },
            completionPercentage: 100,
          },
        };
        
        // If target section specified, replace element
        if (targetSection) {
          const { sectionId, elementKey } = targetSection;
          if (state.content[sectionId]) {
            state.content[sectionId].elements[elementKey] = {
              content: formId,
              type: 'form',
              isEditable: true,
              editMode: 'modal',
            };
          }
        }
        
        (state.forms as any).activeForm = formId;
        state.persistence.isDirty = true;
        
        // Track change
        state.history.undoStack.push({
          type: 'content',
          description: `Imported form ${formData.name || 'Untitled'}`,
          timestamp: Date.now(),
          beforeState: null,
          afterState: { formId, formData },
        });
        
        state.history.redoStack = [];
      });
      
      logger.debug('📥 Form imported:', formId);
      return formId;
    },

    /**
     * ===== IMAGE UTILITIES =====
     */
    
    getImageMetadata: async (imageUrl: string) => {
      try {
        // Create an image element to get dimensions
        const img = new Image();
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            resolve({
              url: imageUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight,
              size: 'unknown', // Would need server-side for actual file size
              format: imageUrl.split('.').pop()?.toLowerCase() || 'unknown',
            });
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
          
          img.src = imageUrl;
        });
        
      } catch (error) {
        logger.error('❌ Failed to get image metadata:', error);
        throw error;
      }
    },
    
    generateImageVariations: async (imageUrl: string, variations: Array<'crop' | 'filter' | 'resize'>) => {
      try {
        const results = [];
        
        for (const variation of variations) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const url = new URL(imageUrl);
          
          switch (variation) {
            case 'crop':
              url.searchParams.set('crop', 'center');
              url.searchParams.set('ar', '16:9');
              break;
            case 'filter':
              url.searchParams.set('filter', 'enhance');
              break;
            case 'resize':
              url.searchParams.set('w', '800');
              url.searchParams.set('h', '600');
              break;
          }
          
          results.push({
            type: variation,
            url: url.toString(),
            description: `${variation} variation`,
          });
        }
        
        logger.debug('🎨 Image variations generated:', results.length);
        return results;
        
      } catch (error) {
        logger.error('❌ Failed to generate image variations:', error);
        throw error;
      }
    },
    
    cleanupUnusedImages: () => {
      const state = get();
      const usedImages = new Set<string>();
      
      // Collect all used image URLs
      Object.values(state.content).forEach((section: any) => {
  Object.values(section.elements).forEach((element: any) => {
          if (element.type === 'image' && typeof element.content === 'string') {
            usedImages.add(element.content);
          }
        });
      });
      
      // Find uploaded images that are no longer used
      const uploadedImages = Object.keys(state.images.uploadProgress || {});
      const unusedImages = uploadedImages.filter(imageId => !usedImages.has(imageId));
      
      if (unusedImages.length > 0) {
        set((state: EditStore) => {
          unusedImages.forEach(imageId => {
            delete state.images.uploadProgress[imageId];
          });
        });
        
        logger.debug('🧹 Cleaned up unused images:', unusedImages.length);
      }
      
      return unusedImages;
    },

    /**
     * ===== ACCESSIBILITY HELPERS =====
     */
    
    auditFormAccessibility: (formId: string) => {
      const formData = get().content[`form-${formId}`];
      
      if (!formData || !Array.isArray(formData.elements.fields?.content)) {
        return { score: 0, issues: ['Form not found'], recommendations: [] };
      }
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;
      
      const fields = formData.elements.fields.content;
      
      fields.forEach((field: any, index: number) => {
        // Check for proper labels
        if (!field.label || field.label.trim() === '') {
          issues.push(`Field ${index + 1} is missing a label`);
          score -= 20;
        }
        
        // Check for placeholder as label anti-pattern
        if (field.placeholder && (!field.label || field.label === field.placeholder)) {
          issues.push(`Field ${index + 1} uses placeholder as label (accessibility issue)`);
          recommendations.push(`Add a proper label for field ${index + 1}`);
          score -= 10;
        }
        
        // Check for required field indicators
        if (field.required && !field.label?.includes('*') && !field.label?.includes('(required)')) {
          recommendations.push(`Add visual indicator for required field: ${field.label}`);
          score -= 5;
        }
        
        // Check for error message support
        if (!field.validation?.errorMessage) {
          recommendations.push(`Add custom error message for field: ${field.label}`);
          score -= 5;
        }
      });
      
      // Check for form instructions
      const hasInstructions = formData.elements.settings?.content?.instructions;
      if (!hasInstructions) {
        recommendations.push('Add form instructions to help users');
        score -= 10;
      }
      
      return {
        score: Math.max(0, score),
        issues,
        recommendations,
        totalFields: fields.length,
      };
    },
    
    auditImageAccessibility: () => {
      const state = get();
      const issues: string[] = [];
      const recommendations: string[] = [];
      let totalImages = 0;
      let imagesWithAlt = 0;
      
      Object.entries(state.content).forEach(([sectionId, section]: [string, any]) => {
  Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          if (element.type === 'image') {
            totalImages++;
            
            // Check for alt text (would be stored as metadata)
            const hasAltText = false; // This would check actual alt text storage
            
            if (!hasAltText) {
              issues.push(`Image in ${sectionId}.${elementKey} is missing alt text`);
              recommendations.push(`Add descriptive alt text for image in ${sectionId}`);
            } else {
              imagesWithAlt++;
            }
          }
        });
      });
      
      const score = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100;
      
      return {
        score,
        issues,
        recommendations,
        totalImages,
        imagesWithAlt,
      };
    },
  } as unknown as FormsImageActions;
}