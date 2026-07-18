// hooks/useAutoSave.ts - React Hook for Auto-Save Integration
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from './useEditStore';

// perf-02 phase 5: the dead autoSaveMiddleware module was deleted; the two type
// shapes this hook still needs are relocated here (AutoSaveState is used by
// getPerformanceStats's return type; ChangeEvent backs its queuedChanges field).
interface ChangeEvent {
  id: string;
  type: 'content' | 'layout' | 'theme' | 'meta';
  sectionId?: string;
  elementKey?: string;
  field?: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  userId?: string;
  source: 'user' | 'ai' | 'system';
}

interface AutoSaveState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: number;
  saveError?: string;
  queuedChanges: ChangeEvent[];
  conflictResolution: {
    hasConflict: boolean;
    conflictData?: any;
    resolveStrategy: 'manual' | 'auto-merge' | 'latest-wins';
  };
  performance: {
    saveCount: number;
    averageSaveTime: number;
    lastSaveTime: number;
    failedSaves: number;
  };
}

/**
 * ===== EVENT-DRIVEN AUTOSAVE TUNABLES (perf-02 phase 2) =====
 * Trailing debounce replaces the old 1s setInterval poll. Every server save is
 * dispatched through `dispatchSave()` (the single choke point), gated on the
 * OR-form `lastUpdated > lastSavedUpdatedRef || isDirty` (never `lastUpdated`
 * alone — dozens of mutation sites set isDirty without bumping lastUpdated).
 */
const DEBOUNCE_MS = 1000;        // trailing debounce (parity with old ≤1s poll)
const RETRY_BASE_MS = 2000;      // bounded failure retry: 2s → 4s → 8s
const MAX_RETRY_ATTEMPTS = 3;

/**
 * ===== HOOK TYPES =====
 */
// NOTE: the content-serialization layer (SerializationConfig/Status/Actions,
// useContentSerializer) was deleted — its serialize() path dropped pages/chrome
// (multi-page-UNSAFE per docs/task/edit-guide-and-verify.audit.md) and was never
// invoked. Saves go through store.forceSave()/triggerAutoSave() only.
// perf-02 phase 4: the dead VersionManager machinery (snapshot retention,
// undo/redo/conflict methods) was removed from this hook — real editor undo/redo
// is editStore's own history stack (uiActions.ts), never touched here.
export interface AutoSaveHookConfig {
  enableAutoSave: boolean;
  onSaveSuccess?: (duration: number) => void;
  onSaveError?: (error: string) => void;
}

export interface AutoSaveStatus {
  // Save State
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  saveError?: string;

  // Performance
  saveCount: number;
  averageSaveTime: number;
  lastSaveTime: number;

  // Queue Status
  queuedChanges: number;
  isOnline: boolean;
}
export interface AutoSaveActions {
  // Save Operations
  triggerSave: () => void;
  forceSave: () => Promise<void>;

  // Manual Controls
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  clearSaveError: () => void;

  // Development/Debug
  getPerformanceStats: () => AutoSaveState['performance'];
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  actions: AutoSaveActions;

  // Convenience functions for common operations
  saveNow: () => Promise<void>;

  // Component helpers
  getSaveStatusMessage: () => string;
  getSaveStatusColor: () => 'green' | 'yellow' | 'red' | 'gray';
}

/**
 * ===== MAIN HOOK IMPLEMENTATION =====
 */

export const useAutoSave = (config: Partial<AutoSaveHookConfig> = {}): UseAutoSaveReturn => {
  // Configuration with defaults.
  // perf-02 phase 2: memoize keyed on the INDIVIDUAL config fields so the
  // object identity is stable across renders (callers passing primitive-only
  // config get a frozen finalConfig) — stops the online/callback effects below
  // from re-subscribing every render.
  const {
    enableAutoSave: cfgEnableAutoSave = true,
    onSaveSuccess: cfgOnSaveSuccess,
    onSaveError: cfgOnSaveError,
  } = config;
  const finalConfig: AutoSaveHookConfig = useMemo(
    () => ({
      enableAutoSave: cfgEnableAutoSave,
      onSaveSuccess: cfgOnSaveSuccess,
      onSaveError: cfgOnSaveError,
    }),
    [
      cfgEnableAutoSave,
      cfgOnSaveSuccess,
      cfgOnSaveError,
    ]
  );
  // Store integration.
  // TRIGGER MECHANICS (perf-02 phase 2): the 1s setInterval poll is gone. The
  // auto-save trigger is now an event-driven trailing debounce armed by a
  // mount-once storeApi.subscribe() listener (below) — not driven by a render
  // pass. The `status` memo + several effects READ persistence/queuedChanges
  // DURING render, so we keep a NARROW reactive subscription to just those slices
  // (removing the whole-store subscription that re-rendered on unrelated edits)
  // and read actions/methods non-reactively via storeApi.getState().
  const storeApi = useEditStoreApi();
  const { persistence, queuedChanges } = useEditStore(
    useShallow((s) => ({ persistence: s.persistence, queuedChanges: s.queuedChanges }))
  );

  const isOnlineRef = useRef(navigator.onLine);

  // ===== EVENT-DRIVEN AUTOSAVE STATE (perf-02 phase 2) =====
  // lastSavedUpdatedRef: the `state.lastUpdated` value the last DISPATCHED save
  //   captured — the OR-gate's `lastUpdated > ref` term compares against it.
  // lastSeenUpdatedRef: the last `state.lastUpdated` the store-subscription
  //   listener observed — drives per-keystroke (re)arm of the trailing debounce.
  const lastSavedUpdatedRef = useRef<number>(storeApi.getState().lastUpdated ?? 0);
  const lastSeenUpdatedRef = useRef<number>(storeApi.getState().lastUpdated ?? 0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  // enableAutoSave read non-reactively by the stable dispatchSave gate.
  const enableAutoSaveRef = useRef(finalConfig.enableAutoSave);
  enableAutoSaveRef.current = finalConfig.enableAutoSave;

  // Stable dispatchSave holder — captured by the mount-once subscribe listener
  // and the online/visibility/pagehide effects (they read `.current`), so a
  // stale closure can never silently break mid-flight re-arm or the retry path.
  const dispatchSaveRef = useRef<() => void>(() => {});

  // The SINGLE choke point for every server save this hook fires (timer,
  // mid-flight re-arm, all flushes, online recovery, failure retry). Stable
  // (deps: storeApi only) — reads all live state via getState()/refs.
  const dispatchSave = useCallback(async () => {
    const s = storeApi.getState();
    // Uniform OR-gate everywhere. NEVER gate solely on lastUpdated: dozens of
    // mutation sites set isDirty without bumping lastUpdated.
    const hasUnsaved =
      s.lastUpdated > lastSavedUpdatedRef.current || s.persistence.isDirty;
    if (
      !enableAutoSaveRef.current ||
      !isOnlineRef.current ||
      !hasUnsaved ||
      s.persistence.isSaving
    ) {
      return;
    }

    // Capture-at-dispatch BEFORE awaiting — edits landing during the flight
    // then satisfy `lastUpdated > lastSavedUpdatedRef` and re-arm.
    const prev = lastSavedUpdatedRef.current;
    lastSavedUpdatedRef.current = s.lastUpdated;

    try {
      // Dispatch via save() DIRECTLY (not triggerAutoSave, which re-gates on
      // isDirty and would no-op mid-flight/teardown flushes per :349 clobber).
      await s.save();
      retryAttemptRef.current = 0; // success resets the bounded-retry counter
    } catch {
      // save() threw and has ALREADY set persistence.saveError. Restore the ref
      // so arm/flush gates still see the edit as unsaved, then schedule a
      // BOUNDED retry (2s → 4s → 8s, max 3). The mid-flight guard is gated off
      // saveError and never re-arms on failure — this catch SOLELY owns failure
      // re-arming.
      lastSavedUpdatedRef.current = prev;
      if (retryAttemptRef.current < MAX_RETRY_ATTEMPTS) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retryAttemptRef.current);
        retryAttemptRef.current += 1;
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          dispatchSaveRef.current();
        }, backoff);
      }
      // After the cap: stop, leave saveError surfaced; the next edit / visibility
      // / online event re-arms through the normal gates.
    }
  }, [storeApi]);
  dispatchSaveRef.current = dispatchSave;

  // (Re)arm the trailing debounce timer → fires dispatchSave once ~1s after the
  // LAST arm signal.
  const armDebounce = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      dispatchSaveRef.current();
    }, DEBOUNCE_MS);
  }, []);

  // Online/offline detection + online-recovery flush (re-pointed to dispatchSave
  // so lastSavedUpdatedRef stays consistent; its old isDirty read is subsumed by
  // dispatchSave's OR-gate). Mount-once (reads refs only).
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      dispatchSaveRef.current();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ===== STORE-SUBSCRIPTION TRAILING DEBOUNCE (replaces the 1s poll) =====
  // Mount-once. Cheap field compares only; arms/re-arms the debounce timer.
  useEffect(() => {
    const init = storeApi.getState();
    lastSeenUpdatedRef.current = init.lastUpdated ?? 0;

    const unsubscribe = storeApi.subscribe((state: any, prevState: any) => {
      // lastUpdated advance → distinguish a real edit from a load/programmatic
      // bump via isDirty AT THIS set(). A real user edit sets isDirty=true in the
      // same set() that bumps lastUpdated → record + (re)arm (per-keystroke
      // trailing) + reset the retry counter. A load/programmatic bump (e.g.
      // loadFromDraft) lands with isDirty=false → record the seen ref AND advance
      // the clean baseline (lastSavedUpdatedRef) so no save is owed, then do NOT
      // arm — this kills the spurious save on editor open.
      if ((state.lastUpdated ?? 0) > lastSeenUpdatedRef.current) {
        lastSeenUpdatedRef.current = state.lastUpdated;
        if (state.persistence.isDirty) {
          retryAttemptRef.current = 0;
          armDebounce();
        } else {
          lastSavedUpdatedRef.current = state.lastUpdated;
        }
      }

      // isDirty false→true → ALSO arm (plain OR semantics, NO saveError clause).
      // Only arm signal for the lastUpdated-silent mutation sites (section
      // reorder, form/image, nav/social). Double-arm is harmless (same timer).
      if (state.persistence.isDirty && !prevState.persistence.isDirty) {
        retryAttemptRef.current = 0;
        armDebounce();
      }

      // Mid-flight guard: isSaving true→false. Re-arm ONLY on success
      // transitions — the `&& !saveError` applies to THIS guard alone. On
      // failure the catch's bounded retry solely owns re-arming.
      if (prevState.persistence.isSaving && !state.persistence.isSaving) {
        const hasUnsaved =
          (state.lastUpdated ?? 0) > lastSavedUpdatedRef.current ||
          state.persistence.isDirty;
        if (hasUnsaved && !state.persistence.saveError) {
          armDebounce();
        }
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      // Effect cleanup (unmount / SPA route change away): one last flush; its
      // own OR-gate decides whether anything is outstanding.
      dispatchSaveRef.current();
    };
  }, [storeApi, armDebounce]);

  // ===== TEARDOWN FLUSH TRIGGERS ===== (mount-once, best-effort while alive)
  useEffect(() => {
    const flush = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      dispatchSaveRef.current();
    };
    // visibility→hidden is the PRIMARY teardown guarantee (page alive, normal
    // fetch OK).
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    // pagehide + beforeunload: immediate dispatch, explicitly best-effort.
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  // Save success/error callbacks
  useEffect(() => {
    if (persistence.lastSaved && finalConfig.onSaveSuccess) {
      finalConfig.onSaveSuccess(storeApi.getState().getPerformanceStats().lastSaveTime);
    }
  }, [persistence.lastSaved, finalConfig, storeApi]);

 useEffect(() => {
    if (persistence.saveError && finalConfig.onSaveError) {
      finalConfig.onSaveError(persistence.saveError);
    }
  }, [persistence.saveError, finalConfig]);

  /**
   * ===== STATUS COMPUTATION =====
   */
  const status: AutoSaveStatus = useMemo(() => {
    const perfStats = storeApi.getState().getPerformanceStats();

    return {
      // Save State
      isDirty: persistence.isDirty,
      isSaving: persistence.isSaving,
      lastSaved: persistence.lastSaved ? new Date(persistence.lastSaved) : undefined,
      saveError: persistence.saveError,

      // Performance
      saveCount: perfStats.saveCount,
      averageSaveTime: perfStats.averageSaveTime,
      lastSaveTime: perfStats.lastSaveTime,

      // Queue Status
      queuedChanges: (queuedChanges || []).length,
      isOnline: isOnlineRef.current,
    };
  }, [
    persistence.isDirty,
    persistence.isSaving,
    persistence.lastSaved,
    persistence.saveError,
    queuedChanges,
    storeApi,
  ]);

  /**
   * ===== ACTION IMPLEMENTATIONS =====
   */

  const triggerSave = useCallback(() => {
    // perf-02 phase 2: route through dispatchSave() → save() directly (its
    // OR-gate + online + !isSaving guards apply); never triggerAutoSave().
    dispatchSaveRef.current();
  }, []);

  // Enhanced forceSave implementation to replace existing:
const forceSave = useCallback(async () => {
  if (!isOnlineRef.current) {
    throw new Error('Cannot save while offline');
  }

  await storeApi.getState().forceSave();
}, [storeApi]);

  const enableAutoSave = useCallback(() => {
    // This would update the config - simplified implementation
  }, []);

  const disableAutoSave = useCallback(() => {
    // This would update the config - simplified implementation
  }, []);

  const clearSaveError = useCallback(() => {
    storeApi.getState().clearAutoSaveError();
  }, [storeApi]);

  const getPerformanceStats = useCallback(() => {
    return storeApi.getState().getPerformanceStats();
  }, [storeApi]);

  /**
   * ===== CONVENIENCE FUNCTIONS =====
   */

  const saveNow = useCallback(async () => {
    await forceSave();
  }, [forceSave]);

  const getSaveStatusMessage = useCallback((): string => {
    if (status.saveError) {
      return `Save failed: ${status.saveError}`;
    }

    if (status.isSaving) {
      return 'Saving...';
    }

    if (!status.isOnline) {
      return 'Offline - changes will save when online';
    }

    if (status.isDirty) {
      return 'Unsaved changes';
    }

    if (status.lastSaved) {
      const now = Date.now();
      const diff = now - status.lastSaved.getTime();

      if (diff < 60000) { // Less than 1 minute
        return 'Saved just now';
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `Saved ${minutes}m ago`;
      } else {
        return `Saved at ${status.lastSaved.toLocaleTimeString()}`;
      }
    }

    return 'No changes yet';
  }, [status]);

  const getSaveStatusColor = useCallback((): 'green' | 'yellow' | 'red' | 'gray' => {
    if (status.saveError) return 'red';
    if (status.isSaving) return 'yellow';
    if (!status.isOnline) return 'gray';
    if (status.isDirty) return 'yellow';
    return 'green';
  }, [status]);

  /**
   * ===== RETURN OBJECT =====
   */
  const actions: AutoSaveActions = {
    triggerSave,
    forceSave,
    enableAutoSave,
    disableAutoSave,
    clearSaveError,
    getPerformanceStats,
  };

  return {
    status,
    actions,
    saveNow,
    getSaveStatusMessage,
    getSaveStatusColor,
  };
};

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

// dev-SSR guard; module is on the /edit SSR import path where window is undefined
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__autoSaveHookDebug = {
    getHookInstance: () => {
      // This would need to be set up with React DevTools or similar
    },
  };
}
