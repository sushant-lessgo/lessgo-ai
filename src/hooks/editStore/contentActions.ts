// hooks/editStore/contentActions.ts - Enhanced content actions with section CRUD methods
import { createSectionCRUDActions } from './sectionCRUDActions';
import { pushContentHistoryEntry, deepCopy } from './historyHelpers';
import type { BackgroundType } from '@/types/core/index';
import type { EditStore, APIRequest, ValidationError } from '@/types/store';
import type { ContentActions } from '@/types/store';
import type { ElementSelection } from '@/types/core/ui';
import type { ImageAsset } from '@/types/core/images';
import type { SectionType } from '@/types/core/content';

import { logger } from '@/lib/logger';
import { EDITOR_DEBUG } from '@/lib/debugFlags';
import { isForbiddenImageSrc } from './imageWriteGuard';
/**
 * ===== UTILITY FUNCTIONS =====
 */

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ===== i18n-phase-1 (3a): active-locale write routing helpers =====
// The default locale writes the flat `state.content` map exactly as today; a
// non-default active locale writes TEXT into the project-global overlay
// (`state.localeContent[locale][sectionId][key]`, keyed by globally-unique
// sectionId). Structure/media (setSection, collections, image src) stay base.
const localeDefaultOf = (state: EditStore): string => state.localeConfig?.defaultLocale ?? 'en';
const isNonDefaultLocale = (state: EditStore): boolean =>
  !!state.activeLocale && state.activeLocale !== localeDefaultOf(state);
/** True for overlay-eligible TEXT values (string or all-string array). Collection
 *  object-arrays are NOT text → they stay base (locale-shared structure). */
const isOverlayText = (v: unknown): v is string | string[] =>
  typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string'));
/** Immer-draft: write a text value into the project-global overlay for `locale`. */
function writeOverlayText(state: EditStore, locale: string, sectionId: string, key: string, value: string | string[]): void {
  if (!state.localeContent) state.localeContent = {};
  if (!state.localeContent[locale]) state.localeContent[locale] = {};
  if (!state.localeContent[locale][sectionId]) state.localeContent[locale][sectionId] = {};
  state.localeContent[locale][sectionId][key] = value;
}

// Validation helper
const validateSection = (section: any): string[] => {
  const errors: string[] = [];
  
  if (!section.id) errors.push('Section must have an ID');
  if (!section.elements || Object.keys(section.elements).length === 0) {
    errors.push('Section must have at least one element');
  }
  
  return errors;
};

// Validation helper for elements
const validateElement = (element: any, elementKey: string): string[] => {
  const errors: string[] = [];
  
  if (!element.type) errors.push(`Element ${elementKey} must have a type`);
  if (element.type === 'text' && !element.content) {
    errors.push(`Text element ${elementKey} must have content`);
  }
  
  return errors;
};

/**
 * ===== MAIN CONTENT ACTIONS FACTORY =====
 */

export function createContentActions(set: any, get: any): ContentActions {
  // Import section CRUD actions - this includes addSection, removeSection, etc.
  const sectionCRUDActions = createSectionCRUDActions(set, get);

  return {
    /**
     * ===== BASIC CONTENT OPERATIONS =====
     */
    
    updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) =>
      set((state: EditStore) => {
        const updateTime = Date.now();
        if (EDITOR_DEBUG) {
          logger.debug(`🔄 [${updateTime}] updateElementContent CALLED:`, {
            sectionId,
            elementKey,
            contentType: typeof content,
            contentLength: Array.isArray(content) ? content.length : content?.length,
            contentPreview: Array.isArray(content)
              ? JSON.stringify(content[0])?.substring(0, 50)
              : content?.toString().substring(0, 50),
            callStack: new Error().stack?.split('\n')[2]?.trim()
          });
        }

        // Defense-in-depth (perf-03): never persist an ephemeral/inlined image
        // src (`data:image/...` base64 or a `blob:` object URL) into content —
        // these bloat the draft and die on reload. The correct path uploads to
        // permanent storage via the store `uploadImage` action, which writes the
        // returned URL back through here. Cheap prefix check; guards strings only,
        // so text/URL content is untouched. Refuse the write (keep old value).
        // i18n-phase-1 (3a): locale-AGNOSTIC — a forbidden image src is refused
        // regardless of active locale (media is locale-shared, never overlaid).
        if (typeof content === 'string' && isForbiddenImageSrc(content)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[imageWriteGuard] Refused forbidden image src for ${sectionId}.${elementKey} ` +
                `(data:/blob: not allowed in content — upload via uploadImage first).`,
            );
          }
          return;
        }

        if (!state.content[sectionId]) {
          logger.warn(`🔄 [${updateTime}] Section ${sectionId} not found`);
          return;
        }

        // Check if element exists and handle different content structures
        if (!state.content[sectionId].elements) {
          logger.warn(`Elements not found in section ${sectionId}`);
          return;
        }

        // i18n-phase-1 (3a): NON-DEFAULT LOCALE text write → project-global overlay.
        // Text only (string / all-string array, incl. dotted V2 collection-field
        // strings) is overlaid; the key is stored verbatim (dotted keys included —
        // 3b readers resolve them). Collection OBJECT-arrays fall through to the
        // base write below (locale-shared structure/media). A locale-TAGGED history
        // entry is pushed (raw-value snapshot under the elementKey storage key);
        // uiActions.undo/redo routes the restore into localeContent[locale] via
        // `entry.locale`, so undo of an NL edit never touches EN base.
        if (isNonDefaultLocale(state) && isOverlayText(content)) {
          const loc = state.activeLocale;
          const oldValue = state.localeContent?.[loc]?.[sectionId]?.[elementKey];
          writeOverlayText(state, loc, sectionId, elementKey, content);
          if (JSON.stringify(oldValue) !== JSON.stringify(content)) {
            pushContentHistoryEntry(state, {
              type: 'content',
              description: `Edited ${elementKey} (${loc})`,
              timestamp: Date.now(),
              sectionId,
              elementKey,
              locale: loc,
              beforeState: { storageKey: elementKey, value: deepCopy(oldValue) },
              afterState: { storageKey: elementKey, value: deepCopy(content) },
            });
          }
          if (state.content[sectionId].editMetadata) {
            state.content[sectionId].editMetadata.lastModified = updateTime;
          }
          state.persistence.isDirty = true;
          state.lastUpdated = updateTime;
          return;
        }

        // V2: Handle nested collection paths like "features.f1.visual"
        // Format: collectionName.itemId.fieldName
        if (elementKey.includes('.') && typeof content === 'string') {
          const pathParts = elementKey.split('.');
          if (pathParts.length >= 3) {
            const [collectionName, itemId, fieldName] = pathParts;
            const collection = (state.content[sectionId].elements as Record<string, any>)[collectionName];

            if (Array.isArray(collection)) {
              const oldCollection = [...collection];
              const updatedCollection = collection.map(item =>
                item.id === itemId ? { ...item, [fieldName]: content } : item
              );

              (state.content[sectionId].elements as Record<string, any>)[collectionName] = updatedCollection;

              // History: raw collection-array snapshot under the collection's storage key.
              // Skip when nothing actually changed. Direct field compare (no serialization):
              // locate the target item by id and compare only the edited field.
              // elementKey = full dotted key (coalesce identity).
              const oldItem = oldCollection.find(item => item.id === itemId);
              if (oldItem?.[fieldName] !== content) {
                pushContentHistoryEntry(state, {
                  type: 'content',
                  description: `Edited ${elementKey}`,
                  timestamp: Date.now(),
                  sectionId,
                  elementKey,
                  beforeState: { storageKey: collectionName, value: deepCopy(oldCollection) },
                  afterState: { storageKey: collectionName, value: deepCopy(updatedCollection) },
                });
              }

              // Initialize aiMetadata if missing
              if (!state.content[sectionId].aiMetadata) {
                state.content[sectionId].aiMetadata = {
                  lastGenerated: 0,
                  aiGenerated: false,
                  isCustomized: false,
                  aiGeneratedElements: [],
                  excludedElements: []
                };
              }
              state.content[sectionId].aiMetadata.isCustomized = true;
              state.persistence.isDirty = true;

              // Track change for auto-save
              state.queuedChanges.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'content',
                sectionId,
                elementKey: collectionName,
                oldValue: oldCollection,
                newValue: updatedCollection,
                timestamp: Date.now(),
                source: 'user',
              });
              state.lastUpdated = Date.now();

              logger.debug(`🔄 [${updateTime}] updateElementContent V2 NESTED PATH:`, {
                sectionId,
                collectionName,
                itemId,
                fieldName,
                newValue: content.substring(0, 50)
              });
              return; // Early return - nested path handled
            }
          }
        }

        // V2 COLLECTIONS: Arrays stored directly, no stringify
        // Principle: "AI output = DB format = Component format"
        if (Array.isArray(content)) {
          const oldValue = state.content[sectionId].elements[elementKey];
          (state.content[sectionId].elements as Record<string, any>)[elementKey] = content;

          // History: raw array snapshot. Skip when JSON-equal.
          if (JSON.stringify(oldValue) !== JSON.stringify(content)) {
            pushContentHistoryEntry(state, {
              type: 'content',
              description: `Edited ${elementKey}`,
              timestamp: Date.now(),
              sectionId,
              elementKey,
              beforeState: { storageKey: elementKey, value: deepCopy(oldValue) },
              afterState: { storageKey: elementKey, value: deepCopy(content) },
            });
          }

          // Initialize aiMetadata if missing
          if (!state.content[sectionId].aiMetadata) {
            state.content[sectionId].aiMetadata = {
              lastGenerated: 0,
              aiGenerated: false,
              isCustomized: false,
              aiGeneratedElements: [],
              excludedElements: []
            };
          }
          state.content[sectionId].aiMetadata.isCustomized = true;
          state.persistence.isDirty = true;

          // Track change for auto-save
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'content',
            sectionId,
            elementKey,
            oldValue,
            newValue: content,
            timestamp: Date.now(),
            source: 'user',
          });
          state.lastUpdated = Date.now();

          logger.debug(`🔄 [${updateTime}] updateElementContent ARRAY stored directly:`, {
            sectionId,
            elementKey,
            itemCount: content.length
          });
          return; // Early return - arrays handled, skip string processing
        }

        // If element doesn't exist, create it as empty string (direct format)
        if (!state.content[sectionId].elements[elementKey]) {
          logger.debug(`Creating missing element: ${elementKey} in section ${sectionId}`);
          state.content[sectionId].elements[elementKey] = '';
        }

        const element = state.content[sectionId].elements[elementKey];

        // String content handling (non-array)
        let stringContent: string;
        if (typeof content === 'string') {
          stringContent = content;
        } else {
          logger.warn('Unexpected content type, converting to string:', { type: typeof content, content });
          stringContent = String(content);
        }
        
        // CRITICAL: Strip any object properties and ensure pure string
        if (typeof stringContent === 'object') {
          logger.error('CRITICAL: String content is actually an object! Converting...', stringContent);
          stringContent = JSON.stringify(stringContent);
        }
        
        // V2: Always store directly (no wrapped format)
        const oldValue = state.content[sectionId].elements[elementKey];
        (state.content[sectionId].elements[elementKey] as any) = stringContent;

        // History: raw string snapshot. Skip when unchanged.
        if (oldValue !== stringContent) {
          pushContentHistoryEntry(state, {
            type: 'content',
            description: `Edited ${elementKey}`,
            timestamp: Date.now(),
            sectionId,
            elementKey,
            beforeState: { storageKey: elementKey, value: deepCopy(oldValue) },
            afterState: { storageKey: elementKey, value: stringContent },
          });
        }


        // Mark as customized (initialize aiMetadata if missing)
        if (!state.content[sectionId].aiMetadata) {
          state.content[sectionId].aiMetadata = {
            lastGenerated: 0,
            aiGenerated: false,
            isCustomized: false,
            aiGeneratedElements: [],
            excludedElements: []
          };
        }
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.persistence.isDirty = true;
        
        // Track change for auto-save
        state.queuedChanges.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'content',
          sectionId,
          elementKey,
          oldValue,
          newValue: content,
          timestamp: Date.now(),
          source: 'user',
        });
        
        state.lastUpdated = Date.now();
        
        logger.debug(`🔄 [${updateTime}] updateElementContent COMPLETED:`, {
          sectionId,
          elementKey,
          oldValue: String(oldValue).substring(0, 50) + '...',
          newValue: (Array.isArray(content) ? content[0] : content)?.toString().substring(0, 50) + '...',
          isDirty: state.persistence.isDirty,
          queuedChangesCount: state.queuedChanges.length
        });
      }),

    // editor phase-3 (phase 6): per-item alt writer for imageCollection slots.
    // Canonical alt store (2026-07-11 law): the itemId-keyed map lives under the
    // COLLECTION key — content[sectionId].elementMetadata[collectionKey].alt[itemId].
    // Additive: never touches elements/collections (those ride updateElementContent).
    // Locale-agnostic (alt is media-adjacent metadata, not overlaid text).
    setItemAlt: (sectionId: string, collectionKey: string, itemId: string, alt: string) =>
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (!section) return;
        if (!section.elementMetadata) section.elementMetadata = {};
        if (!section.elementMetadata[collectionKey]) section.elementMetadata[collectionKey] = {};
        const entry = section.elementMetadata[collectionKey];
        const altMap =
          entry.alt && typeof entry.alt === 'object' ? (entry.alt as Record<string, string>) : {};
        altMap[itemId] = alt;
        entry.alt = altMap;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    // i18n-phase-1 (3a): switch active authoring locale (project-global). Text
    // writers branch on this; structure/media stay base. History is PRESERVED
    // across a locale switch — undo/redo restore is locale-aware (each 'content'
    // entry carries `entry.locale`; uiActions routes to base vs the overlay), so a
    // mixed EN/NL undo stack replays each entry against its own locale's target.
    setActiveLocale: (locale: string) =>
      set((state: EditStore) => {
        if (state.activeLocale === locale) return;
        state.activeLocale = locale;
      }),

    // Include all section CRUD actions
    ...sectionCRUDActions,



    /**
     * ===== SECTION DATA MANAGEMENT =====
     */

    // i18n-phase-1 (3a) — LIVE setSection (wins over coreActions copy). Deliberately
    // LOCALE-SHARED: writes always target base `state.content`, regardless of
    // activeLocale. Deliverable #2 proof (see Phase 3a audit): every setSection
    // caller passes STRUCTURE — element-map replacements from element CRUD
    // (add/remove/duplicate/reorder/move/props/position), variant-swap clamped
    // maps, layout-migrated maps, aiMetadata/elementMetadata/buttonConfig, or a
    // whole new sectionData. NONE pass an inline text edit (those exclusively use
    // updateElementContent). Structural ops preserve element KEYS, so the overlay
    // (keyed by sectionId+key) stays valid across them.
    setSection: (sectionId: string, sectionData: Partial<any>) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          const oldSection = { ...state.content[sectionId] };
          
          // Deep-merge known nested objects to prevent shallow overwrite
          if (sectionData.aiMetadata && state.content[sectionId].aiMetadata) {
            sectionData = {
              ...sectionData,
              aiMetadata: {
                ...state.content[sectionId].aiMetadata,
                ...sectionData.aiMetadata,
              },
            };
          }
          if (sectionData.editMetadata && state.content[sectionId].editMetadata) {
            sectionData = {
              ...sectionData,
              editMetadata: {
                ...state.content[sectionId].editMetadata,
                ...sectionData.editMetadata,
              },
            };
          }

          // Merge new data
          Object.assign(state.content[sectionId], sectionData);
          
          // Track change
          state.queuedChanges.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'content',
            sectionId,
            oldValue: oldSection,
            newValue: state.content[sectionId],
            timestamp: Date.now(),
            source: 'user',
          });
          
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    validateContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return false;
      
      const errors = validateSection(section);
      const elementErrors = Object.entries(section.elements).flatMap(([key, element]) => 
        validateElement(element, key)
      );
      
      const allErrors = [...errors, ...elementErrors];
      
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          // Initialize editMetadata if it doesn't exist
          if (!state.content[sectionId].editMetadata) {
            state.content[sectionId].editMetadata = {
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
          if (!state.content[sectionId].editMetadata.validationStatus) {
            state.content[sectionId].editMetadata.validationStatus = {
              isValid: true,
              errors: [],
              warnings: [],
              missingRequired: [],
              lastValidated: Date.now(),
            };
          }
          
          // Update validation
          state.content[sectionId].editMetadata.validationStatus.isValid = allErrors.length === 0;
          state.content[sectionId].editMetadata.validationStatus.errors = allErrors as any;
          state.content[sectionId].editMetadata.validationStatus.lastValidated = Date.now();
        }
      });
      
      return allErrors.length === 0;
    },

    exportSectionContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        sectionId,
        content: section,
        layout: state.sectionLayouts[sectionId],
        metadata: {
          exported: Date.now(),
          version: '1.0',
          backgroundType: section.backgroundType,
          isVisible: (section as any).isVisible,
        },
      };
    },

    importSectionContent: (sectionId: string, importData: any) =>
      set((state: EditStore) => {
        if (!state.content[sectionId] || !importData.content) return;
        
        const section = state.content[sectionId];
        
        // Merge imported elements
        Object.assign(section.elements, importData.content.elements);
        
        // Update metadata
        section.aiMetadata.isCustomized = true;
        section.backgroundType = importData.metadata?.backgroundType || section.backgroundType;
        if (importData.metadata?.isVisible !== undefined) {
          (section as any).isVisible = importData.metadata.isVisible;
        }
        
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    getContentSummary: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        sectionId,
        elementCount: Object.keys(section.elements || {}).length,
        isCustomized: section.aiMetadata?.isCustomized || false,
        lastModified: section.editMetadata?.lastModified || 0,
        completionPercentage: section.editMetadata?.completionPercentage || 0,
        backgroundType: section.backgroundType,
      };
    },

    // Missing methods that should be delegated to other action creators
    bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) =>
      set((state: EditStore) => {
        if (!state.content[sectionId]) {
          logger.warn(`Section ${sectionId} not found`);
          return;
        }

        // i18n-phase-1 (3a): non-default locale → route TEXT values into the
        // overlay (never base). Non-text values are skipped (structure/media are
        // shared). No history push (locale undo deferred).
        if (isNonDefaultLocale(state)) {
          const loc = state.activeLocale;
          Object.entries(elements).forEach(([elementKey, content]) => {
            if (isOverlayText(content)) writeOverlayText(state, loc, sectionId, elementKey, content);
          });
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
          return;
        }

        const section = state.content[sectionId];

        // Update all elements in bulk
        Object.entries(elements).forEach(([elementKey, content]) => {
          if (section.elements[elementKey]) {
            section.elements[elementKey].content = content;
          }
        });

        // Mark as customized
        section.aiMetadata.isCustomized = true;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    selectVariation: (index: number) =>
      set((state: EditStore) => {
        // This is a placeholder - actual implementation would select from shown variations
        logger.debug('Selecting variation:', index);
      }),

    applySelectedVariation: () =>
      set((state: EditStore) => {
        // This is a placeholder - actual implementation would apply the selected variation
        logger.debug('Applying selected variation');
      }),

    // These methods are implemented in aiActions.ts but required by ContentActions interface
    regenerateSection: async (sectionId: string, userGuidance?: string) => {
      logger.warn('regenerateSection should be called from aiActions');
    },

    regenerateElement: async (sectionId: string, elementKey: string, variationCount?: number) => {
      logger.warn('regenerateElement should be called from aiActions');
    },

    showElementVariations: (elementId: string, variations: string[]) => {
      logger.warn('showElementVariations should be called from aiActions');
    },

    hideElementVariations: () => {
      logger.warn('hideElementVariations should be called from aiActions');
    },

    // Background management
    setBackgroundType: (sectionId: string, backgroundType: BackgroundType) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          state.content[sectionId].backgroundType = backgroundType;
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    setSectionBackground: (sectionId: string, sectionBackground: any) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          state.content[sectionId].sectionBackground = sectionBackground;
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    markAsCustomized: (sectionId: string) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          if (state.content[sectionId].aiMetadata) {
            state.content[sectionId].aiMetadata.isCustomized = true;
          }
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    clearAIErrors: () => {
      logger.warn('clearAIErrors should be called from aiActions');
    },

    // These methods are implemented in generationActions.ts but required by ContentActions interface
    regenerateAllContent: async () => {
      logger.warn('regenerateAllContent should be called from generationActions');
    },

    updateFromAIResponse: (aiResponse: any) => {
      logger.warn('updateFromAIResponse should be called from generationActions');
    },

  };
}