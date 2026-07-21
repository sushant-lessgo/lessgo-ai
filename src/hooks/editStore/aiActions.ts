// hooks/editStore/aiActions.ts - AI generation and regeneration actions
import posthog from 'posthog-js';

import type { EditStore } from '@/types/store';

import { logger } from '@/lib/logger';
// data-capture Phase 3: reuse the SERVER extractor so the re-frozen baseline
// string is byte-identical to what the server-side diff (collectElements →
// extractElementText) later extracts. capture.ts is a pure module (only pulls in
// editDistance) — safe to import into this client store slice; no server-only deps.
import { extractElementText } from '@/lib/editDelta/capture';
// billing-beta phase 4 — credit blocks (402) must SURFACE, not vanish. Both
// modules are client-safe leaves (no prisma, no React).
import {
  parseInsufficientCredits,
  InsufficientCreditsError,
} from '@/lib/billing/insufficientCredits';
import { emitCreditsBlocked } from '@/lib/billing/creditsBlockedBus';
import { deepCopy, pushHistoryEntry } from './historyHelpers';

// billing-beta phase 4 — the ONE credit-block handler for this file's three
// credit-gated fetches (/api/regenerate-section, /api/audience/work/regenerate-story,
// /api/regenerate-element). If the response is an insufficient-credits block,
// announce it on the bus (a mounted CreditsBlockedHost renders the modal) and
// return a typed error for the caller to throw; otherwise return null and let
// the existing non-credit error handling run UNCHANGED.
//
// The throw still lands in aiGeneration.errors via each catch block — this is a
// behavior superset, not a store-shape change.
//
// ⚠️ NOT for `regenerateElement` (:~460): that one is a setTimeout MOCK with no
// network call and no credit spend. Nothing to gate.
function creditBlockFrom(status: number, body: unknown): InsufficientCreditsError | null {
  const info = parseInsufficientCredits(status, body);
  if (!info) return null;
  emitCreditsBlocked(info);
  return new InsufficientCreditsError(info);
}

// data-capture Phase 3 — session-scoped regen attempt counters (module-scoped,
// in-memory; reset on reload). Keyed `${sectionId}` / `${sectionId}.${elementKey}`.
const sectionAttempts = new Map<string, number>();
const elementAttempts = new Map<string, number>();
function nextAttempt(map: Map<string, number>, key: string): number {
  const n = (map.get(key) ?? 0) + 1;
  map.set(key, n);
  return n;
}

// Fire-and-forget PostHog emit (never breaks a regen if posthog is unavailable).
function trackRegen(event: string, props: Record<string, unknown>): void {
  try {
    posthog.capture(event, props);
  } catch (e) {
    logger.warn(`[data-capture] posthog ${event} emit failed`, e);
  }
}

// i18n-phase-1 (3a) REGEN GUARD: AI (re)generation writes must never target a
// non-default-locale overlay in v1. When the editor is on a non-default locale,
// every regenerate/generate entry point no-ops with a warning (UI disable lands
// in Phase 4). Paired with the generationActions.updateFromAIResponse guard, this
// makes it impossible for an AI write to land in — or clobber base from — a
// non-default-locale session (regenerationActions funnels through that same guard).
function regenBlockedForLocale(get: () => any): boolean {
  const s = get();
  const def = s?.localeConfig?.defaultLocale ?? 'en';
  if (s?.activeLocale && s.activeLocale !== def) {
    console.warn(
      '[i18n] Regeneration is disabled while editing a non-default language. ' +
        'Switch to the default language to regenerate.',
    );
    return true;
  }
  return false;
}

/**
 * Consolidated AI actions for content generation and regeneration
 */
export function createAIActions(set: any, get: any) {
  return {
    /**
     * ===== GENERATION ACTIONS =====
     */
    regenerateSection: async (
      sectionId: string,
      userGuidance?: string,
      options?: { suppressHistory?: boolean }
    ) => {
      if (regenBlockedForLocale(get)) return; // i18n-phase-1 (3a) regen guard
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'section';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Regenerating section content...';
        state.aiGeneration.context = {
          type: 'section',
          sectionId: sectionId,
        };
      });

      try {
        const currentState = get() as EditStore;
        const section = currentState.content[sectionId];
        
        if (!section) {
          throw new Error(`Section ${sectionId} not found`);
        }
        
        // Get section type and layout
        const sectionType = sectionId.split('-')[0]; // Extract type from ID like "hero-123456"
        const layout = currentState.sectionLayouts?.[sectionId];
        
        logger.debug('Regenerating section:', {
          sectionId,
          sectionType,
          layout,
          tokenId: currentState.tokenId,
          hasUserGuidance: !!userGuidance
        });
        
        // Call the API endpoint
        const response = await fetch('/api/regenerate-section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionId,
            tokenId: currentState.tokenId,
            userGuidance,
            currentContent: section.elements,
            sectionType,
            layout
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          // billing-beta phase 4 — surface a 402 credit block BEFORE the generic
          // error throw (announce on the bus + throw the typed error).
          const blocked = creditBlockFrom(response.status, errorData);
          if (blocked) throw blocked;
          // regen-modernization phase 4 (R6.3): prefer the server's honest
          // `message` over the machine `error` CODE — the atelier `quote` band
          // 422s `invalid_scope`, which alone tells the user nothing.
          throw new Error(
            errorData?.message || errorData?.error || 'Failed to regenerate section'
          );
        }
        
        const data = await response.json();
        logger.debug('Section regeneration response:', data);
        
        // Update the section content
        set((state: EditStore) => {
          if (state.content[sectionId] && data.content) {
            const existingElements = state.content[sectionId].elements;
            // Snapshot pre-mutation elements for the undo entry (whole-map
            // swap rides the existing { elements } restorer branch).
            const preElements = deepCopy(existingElements);
            const updatedElements = { ...existingElements };

            // Helpers: detect image elements to preserve during copy regen
            const isImageValue = (val: unknown): boolean => {
              const str = typeof val === 'string' ? val : (val as any)?.content;
              return typeof str === 'string' && (
                str.startsWith('/') || str.startsWith('http') || str.startsWith('blob:') || str.startsWith('data:image')
              );
            };
            const isImageKey = (key: string): boolean =>
              key.includes('image') || key.includes('avatar') ||
              key.includes('visual') || key.includes('mockup') ||
              key.includes('logo');

            // Merge new content — skip image elements.
            // Shape-preserving: string slots STAY strings. The old code spread
            // the existing value into the merge object, so a string element
            // became { 0:'H', 1:'e', …, type, content } — the exact object
            // that React-#31-crashed the published page (QA naayom §H).
            Object.entries(data.content).forEach(([key, value]: [string, any]) => {
              if (isImageValue(existingElements[key]) || isImageKey(key)) return;

              const existing = updatedElements[key];
              const existingIsObject =
                existing !== null && typeof existing === 'object' && !Array.isArray(existing);

              if (existing !== undefined && existing !== null && existing !== '') {
                if (typeof value === 'object' && value !== null && value.content !== undefined) {
                  updatedElements[key] = existingIsObject
                    ? { ...existing, content: value.content, ...(value.type && { type: value.type }) }
                    : value.content;
                } else if (typeof value === 'string') {
                  if (existingIsObject) {
                    updatedElements[key] = { ...existing, content: value };
                  } else if (!Array.isArray(existing)) {
                    updatedElements[key] = value;
                  }
                  // Array (collection) receiving a plain string: skip — never
                  // clobber a collection with scalar copy.
                }
              } else {
                updatedElements[key] = value;
              }
            });

            // Update the section
            state.content[sectionId].elements = updatedElements;
            
            // Update AI metadata
            state.content[sectionId].aiMetadata = {
              ...state.content[sectionId].aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: false,
            };
            
            // Update generation state
            state.aiGeneration.isGenerating = false;
            state.aiGeneration.currentOperation = null;
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Section regenerated successfully';
            state.aiGeneration.context = null;
            state.persistence.isDirty = true;
            state.lastUpdated = Date.now();
            
            // Track change for auto-save
            state.queuedChanges.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'content',
              sectionId,
              oldValue: section.elements,
              newValue: updatedElements,
              timestamp: Date.now(),
              source: 'ai',
            });

            // ONE undo entry per standalone section regen. Suppressed when
            // called from regenerateAllContent, which pushes a single
            // 'fullContent' entry for the whole loop instead.
            if (!options?.suppressHistory) {
              pushHistoryEntry(state, {
                type: 'content',
                description: `Regenerated section ${sectionId}`,
                timestamp: Date.now(),
                sectionId,
                beforeState: { elements: preElements },
                afterState: { elements: deepCopy(updatedElements) },
              });
            }
          }
        });
        
        // data-capture Phase 3 — re-freeze the regen output as the NEW AI
        // baseline for this section (so the whole regen is not later mis-captured
        // as a giant user edit vs the stale original-AI baseline), then emit the
        // regen event. MUST run BEFORE the autosave below so the patch ships in it.
        try {
          const applied = (get() as EditStore).content[sectionId]?.elements ?? {};
          const normalized: Record<string, string> = {};
          for (const [k, v] of Object.entries(applied)) {
            const t = extractElementText(v);
            if (t !== null) normalized[k] = t;
          }
          // Section regen replaces the whole section's queued baseline map.
          (get() as EditStore).queueAiBaselinePatch(sectionId, normalized, 'replace');

          const st = get() as EditStore;
          trackRegen('section_regenerated', {
            sectionType,
            attemptNumber: nextAttempt(sectionAttempts, sectionId),
            templateId: st.templateId ?? null,
            audienceType: st.audienceType ?? null,
          });
        } catch (e) {
          logger.warn('[data-capture] section re-freeze/emit failed', e);
        }

        // Trigger auto-save
        const autoSaveModule = await import('@/utils/autoSaveDraft');
        if (autoSaveModule.completeSaveDraft) {
          await autoSaveModule.completeSaveDraft(currentState.tokenId, {
            description: `Section ${sectionId} regenerated`,
          });
        }
        
      } catch (error) {
        logger.error('Section regeneration error:', error);
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.context = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Regeneration failed');
        });
        
        // Show user-friendly error message
        set((state: EditStore) => {
          state.aiGeneration.status = 'Failed to regenerate section. Please try again.';
        });
        
        throw error;
      }
    },

    // work-copy-engine phase 6 — story-interview (Sugarman) regen. THIN parallel
    // of regenerateSection: POSTs the 3 interview answers + Brief to the dedicated
    // work-copy route (NOT the legacy /api/regenerate-section) and applies the
    // returned `content` EXACTLY the way regenerateSection applies its content.
    // Additive only — existing actions are unchanged. The route validates the
    // returned story against workElementContract.about before responding, so only
    // the `about` (story) section is affected; proof/testimonials are untouched.
    regenerateStoryFromInterview: async (
      sectionId: string,
      interviewAnswers: { origin: string; moment: string; belief: string },
    ) => {
      if (regenBlockedForLocale(get)) return; // i18n-phase-1 (3a) regen guard
      // work-copy-engine phase 6 (review-fix) — defensive target guard. This
      // action is the untyped-cast entry point for the story interview; it must
      // only ever touch an `about` (story) section. No-op if mis-targeted so a
      // stray call can never rewrite hero/proof/etc via the work-story route.
      if (sectionId.split('-')[0] !== 'about') {
        logger.warn(
          `[work-copy-engine] regenerateStoryFromInterview ignored: ${sectionId} is not an about section`,
        );
        return;
      }
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'section';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Rewriting your story…';
        state.aiGeneration.context = { type: 'section', sectionId };
      });

      try {
        const currentState = get() as EditStore;
        const section = currentState.content[sectionId];
        if (!section) {
          throw new Error(`Section ${sectionId} not found`);
        }

        const sectionType = sectionId.split('-')[0];

        const response = await fetch('/api/audience/work/regenerate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: currentState.tokenId,
            sectionId,
            interviewAnswers,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const blocked = creditBlockFrom(response.status, errorData);
          if (blocked) throw blocked;
          throw new Error(errorData.error || errorData.message || 'Failed to regenerate story');
        }

        const data = await response.json();
        logger.debug('Story regeneration response:', data);

        // Apply the returned content — IDENTICAL merge to regenerateSection.
        set((state: EditStore) => {
          if (state.content[sectionId] && data.content) {
            const existingElements = state.content[sectionId].elements;
            const preElements = deepCopy(existingElements);
            const updatedElements = { ...existingElements };

            const isImageValue = (val: unknown): boolean => {
              const str = typeof val === 'string' ? val : (val as any)?.content;
              return typeof str === 'string' && (
                str.startsWith('/') || str.startsWith('http') || str.startsWith('blob:') || str.startsWith('data:image')
              );
            };
            const isImageKey = (key: string): boolean =>
              key.includes('image') || key.includes('avatar') ||
              key.includes('visual') || key.includes('mockup') ||
              key.includes('logo');

            Object.entries(data.content).forEach(([key, value]: [string, any]) => {
              // BELT (Wave 2 About lane): `signature` is a manual-lane field
              // (fillMode:'system', stamped first-gen, stripped at parse) — never
              // legitimately in a story-regen response. Skip it so even a hostile/
              // legacy response can't clobber a user-customized signature.
              // (portrait_image is already covered by isImageKey; badge stays
              // absent because story output is hard-listed to {eyebrow,heading,bio}.)
              if (key === 'signature') return;
              if (isImageValue(existingElements[key]) || isImageKey(key)) return;

              const existing = updatedElements[key];
              const existingIsObject =
                existing !== null && typeof existing === 'object' && !Array.isArray(existing);

              if (existing !== undefined && existing !== null && existing !== '') {
                if (typeof value === 'object' && value !== null && value.content !== undefined) {
                  updatedElements[key] = existingIsObject
                    ? { ...existing, content: value.content, ...(value.type && { type: value.type }) }
                    : value.content;
                } else if (typeof value === 'string') {
                  if (existingIsObject) {
                    updatedElements[key] = { ...existing, content: value };
                  } else if (!Array.isArray(existing)) {
                    updatedElements[key] = value;
                  }
                }
              } else {
                updatedElements[key] = value;
              }
            });

            state.content[sectionId].elements = updatedElements;
            state.content[sectionId].aiMetadata = {
              ...state.content[sectionId].aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: false,
            };

            state.aiGeneration.isGenerating = false;
            state.aiGeneration.currentOperation = null;
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Story regenerated successfully';
            state.aiGeneration.context = null;
            state.persistence.isDirty = true;
            state.lastUpdated = Date.now();

            state.queuedChanges.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'content',
              sectionId,
              oldValue: section.elements,
              newValue: updatedElements,
              timestamp: Date.now(),
              source: 'ai',
            });

            pushHistoryEntry(state, {
              type: 'content',
              description: `Regenerated story ${sectionId}`,
              timestamp: Date.now(),
              sectionId,
              beforeState: { elements: preElements },
              afterState: { elements: deepCopy(updatedElements) },
            });
          }
        });

        // data-capture Phase 3 — re-freeze the regen output as the new AI baseline.
        try {
          const applied = (get() as EditStore).content[sectionId]?.elements ?? {};
          const normalized: Record<string, string> = {};
          for (const [k, v] of Object.entries(applied)) {
            const t = extractElementText(v);
            if (t !== null) normalized[k] = t;
          }
          (get() as EditStore).queueAiBaselinePatch(sectionId, normalized, 'replace');

          const st = get() as EditStore;
          trackRegen('section_regenerated', {
            sectionType,
            attemptNumber: nextAttempt(sectionAttempts, sectionId),
            templateId: st.templateId ?? null,
            audienceType: st.audienceType ?? null,
            source: 'story-interview',
          });
        } catch (e) {
          logger.warn('[data-capture] story re-freeze/emit failed', e);
        }

        const autoSaveModule = await import('@/utils/autoSaveDraft');
        if (autoSaveModule.completeSaveDraft) {
          await autoSaveModule.completeSaveDraft(currentState.tokenId, {
            description: `Story ${sectionId} regenerated`,
          });
        }
      } catch (error) {
        logger.error('Story regeneration error:', error);
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.context = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Story regeneration failed');
          state.aiGeneration.status = 'Failed to regenerate story. Please try again.';
        });
        throw error;
      }
    },

    regenerateElement: async (sectionId: string, elementKey: string, variationCount: number = 1) => {
      if (regenBlockedForLocale(get)) return; // i18n-phase-1 (3a) regen guard
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Regenerating element content...';
      });

      try {
        // Mock regeneration logic - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        set((state: EditStore) => {
          const section = state.content[sectionId];
          if (section && section.elements[elementKey]) {
            // Update element with new content
            (section.elements[elementKey] as any).aiMetadata = {
              ...(section.elements[elementKey] as any).aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: false,
            };
            
            section.editMetadata.lastModified = Date.now();
            state.aiGeneration.isGenerating = false;
            state.aiGeneration.currentOperation = null;
            state.aiGeneration.progress = 100;
            state.aiGeneration.status = 'Element regenerated successfully';
            state.persistence.isDirty = true;
          }
        });
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Element regeneration failed');
        });
        throw error;
      }
    },

    // Unified regenerate function that always returns variations
    regenerateElementWithVariations: async (sectionId: string, elementKey: string, variationCount: number = 5) => {
      if (regenBlockedForLocale(get)) return []; // i18n-phase-1 (3a) regen guard
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.progress = 0;
        state.aiGeneration.status = 'Generating variations...';
      });

      try {
        const currentState = get() as any;
        const section = currentState.content[sectionId];
        
        // Handle both structures: section.elements[elementKey] and section[elementKey]
        let element = section?.elements?.[elementKey] || section?.[elementKey];
        
        if (!section || !element) {
          logger.error('Element not found:', {
            sectionId,
            elementKey,
            sectionExists: !!section,
            hasElementsObject: !!section?.elements,
            elementInElements: section?.elements?.[elementKey],
            elementDirect: section?.[elementKey],
            availableSections: Object.keys(currentState.content || {}),
            availableElementKeys: section?.elements ? Object.keys(section.elements) : [],
            availableDirectKeys: section ? Object.keys(section) : []
          });
          throw new Error('Element not found');
        }

        // Extract content - handle both element.content and direct content
        let currentContent = element.content !== undefined ? element.content : element;
        
        // Handle array content by joining it or using the first element
        if (Array.isArray(currentContent)) {
          currentContent = currentContent.length > 0 ? currentContent.join(' ') : '';
        }
        
        // Ensure currentContent is a string
        currentContent = String(currentContent || '');
        
        logger.debug('Regenerate element request:', {
          sectionId,
          elementKey,
          currentContent: currentContent.substring(0, 100) + '...',
          tokenId: currentState.tokenId
        });
        
        // Call the new API endpoint
        const response = await fetch(`/api/regenerate-element?tokenId=${encodeURIComponent(currentState.tokenId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionId,
            elementKey,
            currentContent,
            variationCount
          })
        });

        if (!response.ok) {
          // This path used to throw on the STATUS ALONE, never reading the body —
          // so a 402 was indistinguishable from any other failure and the block
          // died in the toolbar's empty catch. Read it (defensively: the body may
          // be empty/non-JSON) so the normalizer has something to see.
          const errorData = await response.json().catch(() => null);
          // billing-beta phase 4 — surface a 402 credit block before the generic throw.
          const blocked = creditBlockFrom(response.status, errorData);
          if (blocked) throw blocked;
          // regen-modernization phase 4 (R6.3): surface the SERVER's honest reason
          // (e.g. "This element isn't AI-written…" on a 422) instead of a bare
          // `API error: 422`. A why-message the user never sees isn't a why-message.
          throw new Error(
            errorData?.message || errorData?.error || `API error: ${response.status}`
          );
        }

        const result = await response.json();

        // data-capture Phase 3 — emit on the regen REQUEST (variations returned);
        // the re-freeze happens later in applyVariation (accept), per plan.
        {
          const st = get() as EditStore;
          trackRegen('element_regenerated', {
            sectionType: sectionId.split('-')[0],
            elementKey,
            attemptNumber: nextAttempt(elementAttempts, `${sectionId}.${elementKey}`),
            templateId: st.templateId ?? null,
            audienceType: st.audienceType ?? null,
          });
        }

        set((state: EditStore) => {
          state.elementVariations = {
            visible: true,
            variations: [currentContent, ...result.variations], // Include current as first option
            selectedIndex: 0,
            sectionId,
            elementKey
          };
          
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.progress = 100;
          state.aiGeneration.status = 'Variations generated successfully';
        });

        return result.variations;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Variation generation failed');
        });
        throw error;
      }
    },

    generateVariations: async (sectionId: string, elementKey: string, count: number = 5) => {
      if (regenBlockedForLocale(get)) return []; // i18n-phase-1 (3a) regen guard
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'element';
        state.aiGeneration.status = 'Generating variations...';
      });

      try {
        // Mock variation generation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockVariations = Array.from({ length: count }, (_, i) => 
          `Variation ${i + 1} - Generated content with different tone and style`
        );

        set((state: EditStore) => {
          state.elementVariations = {
            visible: true,
            variations: mockVariations,
            selectedIndex: 0,
            sectionId,
            elementKey
          };
          
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Variations generated successfully';
        });

        return mockVariations;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Variation generation failed');
        });
        throw error;
      }
    },

    /**
     * ===== VARIATION MANAGEMENT =====
     */
    showElementVariations: (elementId: string, variations: string[]) =>
      set((state: EditStore) => {
        // Parse elementId to get sectionId and elementKey
        const [sectionId, elementKey] = elementId.split('.');
        state.elementVariations = {
          visible: true,
          variations,
          selectedIndex: 0,
          sectionId: sectionId || '',
          elementKey: elementKey || ''
        };
      }),

    hideElementVariations: () =>
      set((state: EditStore) => {
        state.elementVariations = {
          visible: false,
          variations: [],
          selectedIndex: 0,
          sectionId: '',
          elementKey: ''
        };
      }),

    setVariationSelection: (index: number) =>
      set((state: EditStore) => {
        state.elementVariations.selectedIndex = index;
      }),

    applyVariation: (sectionId: string, elementKey: string, variationIndex: number) => {
      const state = get() as EditStore;
      const variation = state.elementVariations.variations[variationIndex];
      
      if (variation) {
        // Use the proper updateElementContent function to update the content
        // This ensures proper state management, change tracking, and auto-save
        get().updateElementContent(sectionId, elementKey, variation);

        // data-capture Phase 3 — re-freeze the accepted variation as the new AI
        // baseline for this one element (element-level merge). `variation` is a
        // string, so it is already normalized. Rides the autosave triggered by
        // updateElementContent above.
        try {
          (get() as EditStore).queueAiBaselinePatch(sectionId, { [elementKey]: variation });
        } catch (e) {
          logger.warn('[data-capture] element re-freeze failed', e);
        }

        // Update AI metadata
        set((state: EditStore) => {
          const section = state.content[sectionId];
          if (section) {
            // Handle both structures: section.elements[elementKey] and section[elementKey]
            if (section.elements && section.elements[elementKey]) {
              // Update AI metadata — only for object-valued elements. Meridian (and
              // other templates) store text elements as bare strings; assigning
              // `.aiMetadata` onto a string primitive throws under immer, so no-op.
              const elVal: any = section.elements[elementKey];
              if (elVal !== null && typeof elVal === 'object' && !Array.isArray(elVal)) {
                elVal.aiMetadata = {
                  ...elVal.aiMetadata,
                  lastGenerated: Date.now(),
                  isCustomized: variationIndex === 0, // First option is original content
                };
              }
            }
            
            // Update section's edit metadata
            if (section.editMetadata) {
              section.editMetadata.lastModified = Date.now();
            }
          }
          
          // Hide variations modal after applying
          state.elementVariations = {
            visible: false,
            variations: [],
            selectedIndex: 0,
            sectionId: '',
            elementKey: ''
          };
        });
      }
    },

    /**
     * ===== AI GENERATION STATUS =====
     */
    setGenerationMode: (enabled: boolean) =>
      set((state: EditStore) => {
        (state as any).generationMode = enabled;
        
        if (enabled) {
          // Disable heavy features during generation
          state.leftPanel.collapsed = true;
          // state.toolbar.visible = false;
          // state.toolbar.type = null;
        }
      }),

    clearAIErrors: () =>
      set((state: EditStore) => {
        state.aiGeneration.errors = [];
        state.aiGeneration.warnings = [];
      }),

    updateGenerationProgress: (progress: number, status: string) =>
      set((state: EditStore) => {
        state.aiGeneration.progress = Math.max(0, Math.min(100, progress));
        state.aiGeneration.status = status;
      }),

    /**
     * ===== INFERENCE AND VALIDATION =====
     */
    inferFields: async (inputText: string) => {
      set((state: EditStore) => {
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'page';
        state.aiGeneration.status = 'Analyzing input and inferring fields...';
      });

      try {
        // Mock field inference - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockInferredFields = {
          marketCategory: { value: 'Software', confidence: 0.85 },
          targetAudience: { value: 'Small businesses', confidence: 0.75 },
          keyProblem: { value: 'Manual processes', confidence: 0.8 },
        };

        set((state: EditStore) => {
          state.onboardingData.validatedFields = mockInferredFields as any;
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.status = 'Field inference completed';
        });

        return mockInferredFields;
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Field inference failed');
        });
        throw error;
      }
    },

    validateGeneratedContent: (sectionId: string) => {
      set((state: EditStore) => {
        const section = state.content[sectionId];
        if (section) {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Basic validation logic
          if (!section.elements || Object.keys(section.elements).length === 0) {
            errors.push('Section has no content elements');
          }
          
          if (!section.layout) {
            errors.push('Section has no layout defined');
          }
          
          // Update validation status
          section.editMetadata.validationStatus = {
            isValid: errors.length === 0,
            errors: errors as any,
            warnings: warnings as any,
            missingRequired: [],
            lastValidated: Date.now(),
          };
          
          section.editMetadata.completionPercentage = errors.length === 0 ? 100 : 50;
        }
      });
    },
  };
}