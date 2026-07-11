// hooks/editStore/persistenceActions.ts - Simplified persistence and forms/images actions
import type { EditStore, FormField, ImageAsset } from '@/types/store';
import { buildPagesForExport, loadPageIntoActive, findHomeId, HOME_PAGE_ID, splitChrome } from './pageHelpers';
import type { ChromeState, PageSlice } from '@/types/store';

import { logger } from '@/lib/logger';

const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

// ===== i18n-phase-1 (3a): FULL-MAP EXPORT INVARIANT (contract i) =====
// saveDraft replaces `finalContent.localeContent` WHOLESALE when the key is
// present, so a partial map WIPES omitted locales. export() ships the COMPLETE
// project-global map (state.localeContent). This dev-mode assertion catches any
// future refactor that emits a filtered map: every locale the STORE holds with
// authored overlays must be present + non-empty in the EMITTED map. Mirrors the
// shape of Phase-2 test(f)'s `declaredLocalesFullyPresent`.
function assertFullLocaleExport(
  storeMap: Record<string, any> | undefined,
  emitted: Record<string, any> | undefined,
): void {
  if (process.env.NODE_ENV === 'production') return;
  const authored = Object.keys(storeMap || {}).filter(
    (l) => storeMap![l] && Object.keys(storeMap![l]).length > 0,
  );
  const missing = authored.filter(
    (l) => !emitted?.[l] || Object.keys(emitted[l]).length === 0,
  );
  if (missing.length) {
    console.error(
      `[i18n] FULL-MAP EXPORT VIOLATION: export dropped authored locale(s): ` +
        `${missing.join(', ')}. A save with this partial map would WIPE them.`,
    );
  }
}

// ---------------------------------------------------------------------------
// scale-04 (phase 6) — Brief.socialProfiles ({platform,url}[]) ↔ editor
// SocialMediaConfig ({items:{id,platform,url,icon,order}[]}) bridge.
// Load: seed the config from Brief when the editor has none (scrape-prefilled
// profiles only live in Brief). Save: derive the Brief shape from the config so
// panel edits round-trip into Project.brief.
// ---------------------------------------------------------------------------
type SocialProfile = { platform: string; url: string };

const SOCIAL_ICON_BY_PLATFORM: Record<string, string> = {
  twitter: 'FaTwitter',
  x: 'FaTwitter',
  'twitter/x': 'FaTwitter',
  linkedin: 'FaLinkedin',
  github: 'FaGithub',
  facebook: 'FaFacebook',
  instagram: 'FaInstagram',
  youtube: 'FaYoutube',
  tiktok: 'FaTiktok',
  discord: 'FaDiscord',
  medium: 'FaMedium',
  dribbble: 'FaDribbble',
};

function iconForPlatform(platform: string): string {
  return SOCIAL_ICON_BY_PLATFORM[(platform || '').trim().toLowerCase()] || 'FaGlobe';
}

function socialConfigFromProfiles(profiles: SocialProfile[]) {
  return {
    items: profiles
      .filter((p) => p && p.url)
      .map((p, i) => ({
        id: `social-brief-${i}`,
        platform: p.platform,
        url: p.url,
        icon: iconForPlatform(p.platform),
        order: i,
      })),
    maxItems: 8,
    lastUpdated: Date.now(),
  };
}

function socialProfilesFromConfig(
  cfg: { items?: Array<{ platform: string; url: string }> } | undefined,
): SocialProfile[] | undefined {
  if (!cfg?.items?.length) return undefined;
  const out = cfg.items
    .filter((i) => i && i.url)
    .map((i) => ({ platform: i.platform, url: i.url }));
  return out.length ? out : undefined;
}

/**
 * Hydration core shared by loadFromDraft AND resetToGenerated (header Reset
 * applies the stored baseline through this exact path so it inherits
 * pages/chrome/forms hydration). MUST run inside a set() producer — `state`
 * is an Immer draft. Callers passing a payload that lives in committed state
 * (e.g. state.baseline) must deep-clone it first: this function mutates
 * nested objects (blob-URL migration) and aliases payload.content into state.
 *
 * KNOWN LIMITATION (plan Design decision 2): theme is restored via MERGE
 * ({...state.theme, ...theme}), not wholesale — a theme key ADDED after
 * generation is not cleared by Reset. Near-equivalent in practice because the
 * baseline export() carries a FULL theme; documented, not fixed here.
 */
export function applySnapshot(state: EditStore, payload: any): void {
  // Extract sections from either new format (top-level) or legacy format (nested in layout)
  const sections = payload?.sections ?? payload?.layout?.sections ?? [];
  const sectionLayouts = payload?.sectionLayouts ?? payload?.layout?.sectionLayouts ?? {};
  const sectionSpacing = payload?.sectionSpacing ?? payload?.layout?.sectionSpacing ?? {};

  // Restore core content if available
  if (payload && sections && Array.isArray(sections)) {

    state.sections = sections;
    state.sectionLayouts = sectionLayouts;
    state.sectionSpacing = sectionSpacing;
    state.content = payload.content || {};

    // i18n-phase-1 (3a): the project-global overlay rides INSIDE finalContent
    // (Phase-2 D1, single map keyed by unique sectionId). Restore it here so it
    // travels through BOTH loadFromDraft (contentToLoad) AND resetToGenerated
    // (baseline snapshot, which is an export() payload). Absent ⇒ empty map
    // (legacy single-locale). Deep-clone: applySnapshot may run against committed
    // state (baseline) and must not alias it.
    state.localeContent = payload?.localeContent ? deepClone(payload.localeContent) : {};

    // Migrate blob URLs to placeholders
    let blobUrlsFound = 0;
    for (const sectionId in state.content) {
      const section = state.content[sectionId];
      if (section?.elements) {
        for (const elementKey in section.elements) {
          const element = section.elements[elementKey];
          if (element?.type === 'image' && typeof element.content === 'string') {
            if (element.content.startsWith('blob:')) {
              element.content = '/hero-placeholder.jpg';
              blobUrlsFound++;
              logger.warn(`⚠️ Migrated blob URL in ${sectionId}.${elementKey} to placeholder`);
            }
          }
        }
      }
    }

    if (blobUrlsFound > 0) {
      logger.warn(`⚠️ Found and migrated ${blobUrlsFound} blob URL(s) to placeholders. Please re-upload affected images.`);
    }

    // Log section/content match for debugging
    const sectionsInContent = Object.keys(state.content).length;
    const sectionsInLayout = state.sections.length;

    if (sectionsInContent !== sectionsInLayout) {
      logger.warn('⚠️ Section/Content mismatch detected:', {
        sectionsInLayout,
        sectionsInContent,
        sections: state.sections,
        contentKeys: Object.keys(state.content)
      });
    } else {
    }
  } else {
  }

  // Restore theme and settings if available (check both new and legacy paths)
  const theme = payload?.theme ?? payload?.layout?.theme;
  if (payload && theme) {
    // DEBUG: Verify shallow merge issue
    console.log('🔍 [DEBUG-BUG2] Theme BEFORE merge:', JSON.stringify(state.theme.colors, null, 2));
    console.log('🔍 [DEBUG-BUG2] Theme from API:', JSON.stringify(theme?.colors, null, 2));

    const mergedTheme = { ...state.theme, ...theme };
    state.theme = mergedTheme;

    console.log('🔍 [DEBUG-BUG2] Theme AFTER merge:', JSON.stringify(state.theme.colors, null, 2));
  } else {
    console.log('🔍 [DEBUG-BUG2] No theme in contentToLoad');
  }

  const globalSettings = payload?.globalSettings ?? payload?.layout?.globalSettings;
  if (payload && globalSettings) {
    Object.assign(state.globalSettings, globalSettings);
  }

  // Restore navigation configuration if available
  if (payload && payload.navigationConfig) {
    state.navigationConfig = payload.navigationConfig;
    logger.debug('🧭 [NAV-DEBUG] Restored navigation config:', state.navigationConfig);
  }

  if (payload && payload.socialMediaConfig) {
    state.socialMediaConfig = payload.socialMediaConfig;
    logger.debug('🔗 [SOCIAL-DEBUG] Restored social media config:', state.socialMediaConfig);
  }

  if (payload && payload.legalPages) {
    state.legalPages = payload.legalPages;
  }

  // Restore forms data if available
  if (payload && payload.forms) {
    const restoredForms: Record<string, any> = {};

    try {
      const formsData = payload.forms;

      if (typeof formsData === 'object' && formsData !== null) {
        Object.entries(formsData).forEach(([formId, form]: [string, any]) => {
          if (form && typeof form === 'object' && form.id && Array.isArray(form.fields)) {
            restoredForms[formId] = {
              ...form,
              createdAt: form.createdAt ? new Date(form.createdAt) : new Date(),
              updatedAt: form.updatedAt ? new Date(form.updatedAt) : new Date(),
            };
          }
        });

        state.forms = restoredForms;
        logger.debug('✅ Restored forms:', Object.keys(restoredForms).length);
      }
    } catch (error) {
      logger.error('❌ Error restoring forms:', error);
      state.forms = {};
    }
  } else {
    state.forms = {};
  }

  // Validate button-form connections
  if (state.forms && state.content) {
    const formIds = Object.keys(state.forms);
    let orphanedConnections = 0;

    Object.keys(state.content).forEach(sectionId => {
      const section = state.content[sectionId];
      if (section?.elements) {
        Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          const buttonConfig = element?.metadata?.buttonConfig;
          if (buttonConfig?.type === 'form' && buttonConfig.formId) {
            if (!formIds.includes(buttonConfig.formId)) {
              orphanedConnections++;
              logger.warn(`⚠️ Orphaned button: ${sectionId}.${elementKey} → ${buttonConfig.formId}`);
            }
          }
        });
      }
    });

    if (orphanedConnections > 0) {
      logger.warn(`⚠️ Found ${orphanedConnections} orphaned connection(s)`);
    }
  }

  // ===== Multi-page + shared-chrome hydration =====
  // Pages are stored BODY-ONLY; shared header/footer live in `chrome`.
  // - If the draft carries `chrome`, use it and assume pages are body-only.
  // - Else (Phase-1 data or legacy single page) MIGRATE: extract chrome by
  //   type from the home page and strip header/footer from ALL pages.
  const pagesFromDraft = payload?.pages;
  const chromeFromDraft: ChromeState | undefined = payload?.chrome;

  if (pagesFromDraft && typeof pagesFromDraft === 'object' && Object.keys(pagesFromDraft).length > 0) {
    const pages = deepClone(pagesFromDraft) as Record<string, any>;
    const homeId = findHomeId(pages) || Object.keys(pages)[0];

    if (chromeFromDraft && (chromeFromDraft.header || chromeFromDraft.footer)) {
      state.chrome = deepClone(chromeFromDraft);
    } else {
      // Migration: pull chrome out of the home page, strip from all pages.
      state.chrome = splitChrome(pages[homeId] as PageSlice).chrome;
    }
    // Ensure every page is body-only (idempotent; no-op when already clean).
    for (const pid of Object.keys(pages)) {
      const { body } = splitChrome(pages[pid] as PageSlice);
      pages[pid] = { ...pages[pid], ...body };
    }
    state.pages = pages;

    const desired =
      payload.currentPageId && pages[payload.currentPageId]
        ? payload.currentPageId
        : homeId;
    if (pages[desired]) loadPageIntoActive(state, pages[desired]); // injects chrome
  } else {
    // Legacy single page: top-level slice still has header/footer inline.
    const { body, chrome } = splitChrome(
      deepClone({
        sections: state.sections,
        sectionLayouts: state.sectionLayouts,
        sectionSpacing: state.sectionSpacing || {},
        content: state.content,
      }) as PageSlice,
    );
    state.chrome = chrome;
    state.pages = {
      [HOME_PAGE_ID]: {
        id: HOME_PAGE_ID,
        archetypeKey: 'home',
        pathSlug: '/',
        title: state.title || 'Home',
        order: 0,
        ...body,
      },
    };
    loadPageIntoActive(state, state.pages[HOME_PAGE_ID]); // re-inject chrome
  }
}

/**
 * Consolidated persistence actions for save/load operations plus forms and images
 */
export function createPersistenceActions(set: any, get: any) {
  return {
    /**
     * ===== CORE PERSISTENCE =====
     */
    save: async () => {
      try {
        set((state: EditStore) => {
          state.persistence.isSaving = true;
          state.persistence.saveError = undefined;
        });

        const state = get();
        const exportedData = state.export();


        if (!state.tokenId) {
          throw new Error('No tokenId available in EditStore');
        }

        // Baseline (header Reset) rides the save ONLY when freshly captured —
        // routine autosaves keep their body small. Flag cleared below only
        // when this request actually shipped it.
        const shipBaseline = state.baselineDirty && state.baseline ? state.baseline : undefined;

        // Project.brief mirror (scale-04): ship goal + socialProfiles when set.
        // Undefined = saveDraft leaves the persisted Project.brief untouched
        // (additive — never clobbers brief fields this phase doesn't own).
        // Phase 6: the D13 social panel edits socialMediaConfig — derive the
        // Brief shape from it so panel edits round-trip into Project.brief; fall
        // back to the passthrough mirror when the config is empty.
        const socialProfilesOut =
          socialProfilesFromConfig(state.socialMediaConfig) ?? state.socialProfiles;
        const briefPayload =
          state.goal || socialProfilesOut
            ? {
                ...(state.goal ? { goal: state.goal } : {}),
                ...(socialProfilesOut ? { socialProfiles: socialProfilesOut } : {}),
              }
            : undefined;

        // Real API call to save draft
        const response = await fetch('/api/saveDraft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: state.tokenId,
            finalContent: exportedData,  // Changed from 'content' to 'finalContent' to match API
            ...(shipBaseline !== undefined && { baseline: shipBaseline }),
            ...(briefPayload !== undefined && { brief: briefPayload }),
            // i18n-phase-1 (3a): localeConfig is TOP-LEVEL (D4 wholesale-replace),
            // NOT inside finalContent. OMIT the key when there's no config — the
            // schema is `.optional()` and REJECTS null (contract ii); a legacy
            // project sends nothing → zero storage diff. (localeContent rides
            // inside finalContent via export(), above.)
            ...(state.localeConfig ? { localeConfig: state.localeConfig } : {}),
            title: state.title,
            // Service template selection (Phase 11b) — persist editor switches.
            // Null for product; saveDraft writes only when provided.
            templateId: state.templateId ?? undefined,
            variantId: state.variantId ?? undefined,
            paletteId: state.paletteId ?? undefined,
            // Theme values (vestria mood etc.) — undefined = saveDraft leaves
            // the persisted Project.themeValues untouched.
            themeValues: state.themeValues ?? undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Save failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.lastSaved = Date.now();
          state.persistence.isDirty = false;
          // This save carried the baseline → it's persisted; stop shipping it.
          if (shipBaseline !== undefined) state.baselineDirty = false;
          state.persistence.metrics.totalSaves += 1;
          state.persistence.metrics.successfulSaves += 1;
          state.persistence.metrics.lastSaveTime = Date.now();
        });
      } catch (error) {
        logger.error('❌ Save failed:', error);
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
          state.persistence.metrics.failedSaves += 1;
        });
        throw error;
      }
    },

    loadFromDraft: async (apiResponse: any, urlTokenId?: string) => {
      try {
        set((state: EditStore) => {
          state.persistence.isLoading = true;
          state.persistence.loadError = undefined;
        });


        // Handle different response formats - check both finalContent and content
        // The API stores the data under content.finalContent path
        const contentToLoad = apiResponse.finalContent || apiResponse.content?.finalContent || apiResponse.content;

        // Stored baseline (header Reset): loadDraft returns it top-level
        // (from Project.content.baseline); tolerate a raw-content shape too.
        const storedBaseline = apiResponse.baseline ?? apiResponse.content?.baseline ?? null;

        set((state: EditStore) => {
          // Restore meta data — reads apiResponse (not the content payload) so
          // it stays here rather than in applySnapshot. Runs BEFORE the
          // snapshot so the legacy single-page branch's `state.title` fallback
          // sees the loaded title (same effective ordering as before the
          // extraction — nothing in the hydration core reads meta earlier).
          state.id = apiResponse.tokenId || urlTokenId || '';
          state.title = apiResponse.title || 'Untitled Project';
          state.tokenId = apiResponse.tokenId || urlTokenId || '';
          state.audienceType =
            apiResponse.audienceType === 'service' ? 'service'
            : apiResponse.audienceType === 'writer' ? 'writer'
            : 'product';
          state.templateId = apiResponse.templateId ?? null;
          state.variantId = apiResponse.variantId ?? null;
          state.paletteId = apiResponse.paletteId ?? null;
          // Project.themeValues mirror (loadDraft returns it top-level).
          // Carries vestria's `mood`; hydrating here means a later save()
          // round-trips the full record instead of dropping keys.
          state.themeValues = apiResponse.themeValues ?? null;

          // i18n-phase-1 (3a): restore the locale layer. loadDraft returns
          // `localeConfig` TOP-LEVEL (null for legacy projects — Phase 2). Store
          // null as-is; save() OMITS the key entirely when falsy so we never send
          // `null` (schema `.optional()` rejects null → 400, contract ii).
          // activeLocale ALWAYS re-derives to the default on load (plan 3a step 1:
          // init = defaultLocale) — a persisted non-default editing locale never
          // survives a reload. The overlay map itself is restored in applySnapshot.
          state.localeConfig = apiResponse.localeConfig ?? null;
          state.activeLocale = state.localeConfig?.defaultLocale ?? 'en';

          // Project.brief mirror (scale-04): loadDraft returns `brief` top-level.
          // Hold `goal` + `socialProfiles` in store; a later save() round-trips
          // them back into Project.brief. Null goal → GOAL_REF legacy fallback.
          state.goal = apiResponse.brief?.goal ?? null;
          state.socialProfiles = apiResponse.brief?.socialProfiles ?? undefined;

          // Dev-only override (Phase 11a): `?templateId=lex` (optionally
          // `&paletteId=counsel`) lets us exercise a template in edit/preview
          // without a DB edit, before the picker ships (11b). Forces the service
          // branch so the template module resolves. INERT in production.
          if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const devTemplateId = params.get('templateId');
            if (devTemplateId) {
              state.audienceType = 'service';
              state.templateId = devTemplateId;
              const devPaletteId = params.get('paletteId');
              if (devPaletteId) state.paletteId = devPaletteId;
              logger.warn(`[dev] templateId override → ${devTemplateId}${params.get('paletteId') ? ` / ${params.get('paletteId')}` : ''}`);
            }
          }
          
          // Restore onboarding data — check API top-level first, then contentToLoad fallback
          const onboardingFromContent = contentToLoad?.onboardingData;
          state.onboardingData = {
            oneLiner: onboardingFromContent?.oneLiner || apiResponse.inputText || '',
            validatedFields: onboardingFromContent?.validatedFields || apiResponse.validatedFields || {},
            featuresFromAI: onboardingFromContent?.featuresFromAI || apiResponse.featuresFromAI || [],
            hiddenInferredFields: onboardingFromContent?.hiddenInferredFields || apiResponse.hiddenInferredFields || {},
            confirmedFields: onboardingFromContent?.confirmedFields || apiResponse.confirmedFields || {},
          };

          // Hydration core (sections/layouts/spacing/content/theme/
          // globalSettings/nav/social/legal/forms/pages+chrome) — extracted
          // verbatim into applySnapshot, shared with resetToGenerated.
          applySnapshot(state, contentToLoad);

          // scale-04 (phase 6) bridge: seed the editor social config from the
          // persisted Brief ONLY when the config restored above is empty. Covers
          // scrape-prefilled profiles that live in Brief but not yet in the
          // richer editor config; the config (when present) always wins.
          const briefSocial = apiResponse.brief?.socialProfiles;
          if (
            Array.isArray(briefSocial) &&
            briefSocial.length &&
            !state.socialMediaConfig?.items?.length
          ) {
            state.socialMediaConfig = socialConfigFromProfiles(briefSocial);
          }

          // Hydrate the stored baseline (plain assignment — no export() here;
          // capture for the no-baseline case happens AFTER this producer, below).
          if (storedBaseline) {
            state.baseline = deepClone(storedBaseline);
            state.baselineDirty = false; // already persisted server-side
          }

          state.lastUpdated = Date.now();
          state.persistence.isLoading = false;
          state.persistence.isDirty = false;

          // Ensure performance object is initialized
          if (!state.performance) {
            state.performance = {
              saveCount: 0,
              averageSaveTime: 0,
              lastSaveTime: 0,
              failedSaves: 0,
            };
          }

        });

        // No stored baseline → capture the just-hydrated state as baseline.
        // This one path covers BOTH initial-generation capture (first editor
        // load after onboarding gen) AND legacy-page backfill. MUST run after
        // the hydration set() above has committed: captureBaseline → export()
        // reads committed state via get(); inside the producer it would
        // snapshot stale pre-hydration state.
        if (!storedBaseline) {
          get().captureBaseline();
        }

        // Fresh load = empty history. Idempotent overlap with the Phase-1
        // choke-point reset inside loadPageIntoActive (harmless double-clear).
        get().clearHistory();

      } catch (error) {
        logger.error('❌ Error in loadFromDraft:', error);
        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.loadError = error instanceof Error ? error.message : 'Failed to load draft';
        });
        throw error;
      }
    },

    export: () => {
      const state = get();
      // Multi-page + chrome: commit active page (body-only), guarantee home,
      // and emit the canonical `chrome`. Top-level sections/content are emitted
      // BODY-ONLY (== pages[home]) for back-compat — never carry chrome inline.
      const { pages, currentPageId, homeId, chrome } = buildPagesForExport(state);
      const home = pages[homeId];
      const exportData = {
        id: state.id,
        title: state.title,
        slug: state.slug,
        sections: home?.sections ?? [],
        sectionLayouts: home?.sectionLayouts ?? {},
        sectionSpacing: home?.sectionSpacing ?? {},
        content: home?.content ?? {},
        pages,
        currentPageId,
        chrome,
        theme: state.theme,
        globalSettings: state.globalSettings,
        navigationConfig: state.navigationConfig,
        socialMediaConfig: state.socialMediaConfig,
        legalPages: state.legalPages,
        onboardingData: state.onboardingData,
        forms: state.forms || {}, // Include forms in export
        lastUpdated: state.lastUpdated,
        version: state.version,
      };

      // i18n-phase-1 (3a): ship the COMPLETE project-global overlay INSIDE
      // finalContent so it rides saveDraft's `...finalContent` spread (Phase-2 D1).
      // Only emit the key when overlays exist → legacy single-locale export stays
      // byte-identical (no `localeContent` key at all). Full-map invariant enforced
      // by the dev-mode assertion (contract i).
      const localeContent = state.localeContent;
      if (localeContent && Object.keys(localeContent).length > 0) {
        (exportData as any).localeContent = localeContent;
        assertFullLocaleExport(localeContent, (exportData as any).localeContent);
      }

      return exportData;
    },

    /**
     * ===== BASELINE (header Reset) =====
     */
    // Snapshot the CURRENT committed state as the generation baseline.
    // Callers (caller-driven, never automatic): loadFromDraft when the server
    // returned no stored baseline, and regenerateAllContent after its loop.
    // NEVER call from inside a set() producer — export() reads via get().
    captureBaseline: () => {
      const snapshot = get().export();
      set((state: EditStore) => {
        state.baseline = snapshot;
        state.baselineDirty = true;
        // Intentionally does NOT set persistence.isDirty — the baseline rides
        // the next natural save; capturing alone is not a user edit.
      });
    },

    // Clear the dirty flag after a save that shipped the baseline succeeded.
    // Named action because utils/autoSaveDraft.ts (plain util) has no inline
    // store access; persistenceActions.save() clears the flag inline instead.
    markBaselineSaved: () => {
      set((state: EditStore) => {
        state.baselineDirty = false;
      });
    },

    /**
     * ===== LEGAL PAGES =====
     */
    setLegalPage: (kind: 'privacy', entry: { content: string; metadata?: any } | undefined) =>
      set((state: EditStore) => {
        if (!state.legalPages) state.legalPages = {};
        if (entry === undefined) {
          delete state.legalPages[kind];
        } else {
          state.legalPages[kind] = {
            content: entry.content,
            updatedAt: new Date().toISOString(),
            metadata: entry.metadata,
          };
        }
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    /**
     * ===== FORMS MANAGEMENT =====
     */
    addFormField: (formId: string, field: FormField) =>
      set((state: EditStore) => {
        if (!state.formData[formId]) {
          state.formData[formId] = { fields: [], settings: {} };
        }
        state.formData[formId].fields.push(field);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    removeFormField: (formId: string, fieldId: string) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          state.formData[formId].fields = state.formData[formId].fields.filter(
            field => field.id !== fieldId
          );
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    updateFormField: (formId: string, fieldId: string, updates: Partial<FormField>) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          const fieldIndex = state.formData[formId].fields.findIndex(
            field => field.id === fieldId
          );
          if (fieldIndex !== -1) {
            Object.assign(state.formData[formId].fields[fieldIndex], updates);
            state.persistence.isDirty = true;
            state.lastUpdated = Date.now();
          }
        }
      }),

    toggleFormFieldRequired: (formId: string, fieldId: string) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          const field = state.formData[formId].fields.find(f => f.id === fieldId);
          if (field) {
            field.required = !field.required;
            state.persistence.isDirty = true;
            state.lastUpdated = Date.now();
          }
        }
      }),

    showFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = true;
      }),

    hideFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = false;
      }),

    /**
     * ===== IMAGES MANAGEMENT =====
     */
    updateImageAsset: (imageId: string, asset: ImageAsset) =>
      set((state: EditStore) => {
        if (!state.images.assets) {
          state.images.assets = {};
        }
        state.images.assets[imageId] = asset;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    removeImageAsset: (imageId: string) =>
      set((state: EditStore) => {
        if (state.images.assets) {
          delete state.images.assets[imageId];
          state.persistence.isDirty = true;
          state.lastUpdated = Date.now();
        }
      }),

    showStockPhotoSearch: (query: string) =>
      set((state: EditStore) => {
        state.images.stockPhotos = {
          searchVisible: true,
          searchQuery: query,
          searchResults: [], // Will be populated by search API
        };
      }),

    hideStockPhotoSearch: () =>
      set((state: EditStore) => {
        state.images.stockPhotos.searchVisible = false;
        state.images.stockPhotos.searchQuery = '';
        state.images.stockPhotos.searchResults = [];
      }),

    updateUploadProgress: (imageId: string, progress: number) =>
      set((state: EditStore) => {
        state.images.uploadProgress[imageId] = progress;
      }),

    /**
     * ===== ERROR AND LOADING STATES =====
     */
    setError: (key: string, error: string) =>
      set((state: EditStore) => {
        state.errors[key] = error;
      }),

    clearError: (key: string) =>
      set((state: EditStore) => {
        delete state.errors[key];
      }),

    setLoading: (key: string, loading: boolean) =>
      set((state: EditStore) => {
        state.loadingStates[key] = loading;
        state.isLoading = Object.values(state.loadingStates).some(Boolean);
      }),

    /**
     * ===== UTILITY ACTIONS =====
     */
    reset: () => {
      const initialState = createInitialState();
      set(() => initialState);
    },

    updateMeta: (meta: Partial<any>) => {
      set((state: EditStore) => {
        Object.assign(state, meta);
        state.lastUpdated = Date.now();
        state.version += 1;
        state.persistence.isDirty = true;
      });
    },

    reorderSections: (newOrder: string[]) =>
      set((state: EditStore) => {
        state.sections = newOrder;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    // Auto-save middleware actions
    triggerAutoSave: async () => {
      const state = get();
      if (state.persistence.isDirty && !state.persistence.isSaving) {
        try {
          await state.save();
        } catch (error) {
          logger.error('❌ TriggerAutoSave: Save failed:', error);
          throw error;
        }
      } else {
      }
    },

    forceSave: async () => {
      return get().save();
    },

    clearAutoSaveError: () => {
      set((state: EditStore) => {
        state.persistence.saveError = undefined;
      });
    },

    getPerformanceStats: () => {
      return get().persistence.metrics;
    },

    resetPerformanceStats: () => {
      set((state: EditStore) => {
        state.persistence.metrics = {
          totalSaves: 0,
          successfulSaves: 0,
          failedSaves: 0,
          averageSaveTime: 0,
          lastSaveTime: 0,
          totalLoads: 0,
          cacheHits: 0,
          cacheMisses: 0,
          conflictsDetected: 0,
          conflictsResolved: 0,
        };
      });
    },
  };
}

// Helper function to create initial state
function createInitialState() {
  // Return minimal initial state - this would be imported from main store
  return {
    sections: [],
    content: {},
    persistence: { isDirty: false, isSaving: false },
    // ... other initial state
  };
}