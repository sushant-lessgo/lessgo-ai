'use client';

// SaveStateChip — visible save-state indicator (editor-trust-truth, editorPlan
// law #5: the user never wonders if their work is safe).
//
// State is DERIVED from the existing persistence slice (perf-02 autosave layer):
//   - error   : persistence.saveError set (autosave layer is already retrying
//               with 2s→4s→8s backoff, max 3, in useAutoSave — no new retry here)
//   - saving  : a save is owed (isDirty ⇒ debounce pending) or in flight (isSaving)
//   - saved   : nothing owed, nothing in flight
// No new store state is added — the chip reads what perf-02 already tracks.
//
// Dirty-guard: registers a native `beforeunload` preventDefault whenever the
// status is not 'saved' (debounce pending / POST in flight / error), so the
// browser prompts before the tab closes with changes not yet synced to the
// SERVER. This composes with — does not replace — the two existing best-effort
// beforeunload flushers:
//   - InlineTextEditorV2: flushes in-progress DOM text → store (no preventDefault)
//   - useAutoSave: dispatches a final store → server save (no preventDefault)
// The guard reads store state via getState() at event time so it sees the
// freshest isDirty regardless of listener firing order.

import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useEditStore,
  useEditStoreApi,
} from '@/hooks/useEditStore';

type SaveStatus = 'saved' | 'saving' | 'error';

function deriveStatus(p: {
  isDirty: boolean;
  isSaving: boolean;
  saveError?: string;
}): SaveStatus {
  if (p.saveError) return 'error';
  if (p.isSaving || p.isDirty) return 'saving';
  return 'saved';
}

export function SaveStateChip() {
  const storeApi = useEditStoreApi();

  // Narrow reactive subscription — only the three persistence fields the chip
  // renders from (NOT a whole-store subscription).
  const { isDirty, isSaving, saveError } = useEditStore(
    useShallow((s) => ({
      isDirty: s.persistence.isDirty,
      isSaving: s.persistence.isSaving,
      saveError: s.persistence.saveError,
    })),
  );

  const status = deriveStatus({ isDirty, isSaving, saveError });

  // Dirty-guard: prompt before closing/navigating away while unsynced.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const p = storeApi.getState().persistence;
      // Mid-edit DOM text may not be in the store yet (the InlineTextEditorV2
      // flush listener can fire after this one, and its store write can't reach
      // the server during unload) — treat an actively-edited element as unsynced
      // regardless of listener order.
      const midEdit = !!document.querySelector(
        '[contenteditable="true"][data-editing="true"]',
      );
      if (midEdit || deriveStatus(p) !== 'saved') {
        e.preventDefault();
        // Legacy browsers require returnValue to be set to trigger the prompt.
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [storeApi]);

  const view = STATUS_VIEW[status];

  return (
    <div
      style={{
        ...chipStyle,
        color: view.color,
        background: view.bg,
        border: `1px solid ${view.border}`,
      }}
      title={view.title}
      role="status"
      aria-live="polite"
    >
      <span
        style={{ ...dotStyle, background: view.dot }}
        className={view.pulse ? 'animate-pulse' : undefined}
        aria-hidden="true"
      />
      <span>{view.label}</span>
    </div>
  );
}

// t1 status chip (editor-shell-redesign phase 2). The handoff specifies ONLY the
// saved state — "7px #16a34a dot + 500/12 #8a8a94", flat (no pill bg/border).
// The other two are defined by the plan against that geometry:
//   saving = same geometry, PULSING #8a8a94 dot + "Saving…"
//   error  = same geometry, app-danger (#d1483a) dot + text
// All three keep bg/border transparent so the three states are geometrically
// identical — combined with the min-width reservation below, the chip cannot
// shift the bar as it swaps. (The old error state had a #fef2f2 pill; dropping
// it is deliberate — t1's bar has no filled chips.)
const STATUS_VIEW: Record<
  SaveStatus,
  { label: string; title: string; dot: string; color: string; bg: string; border: string; pulse?: boolean }
> = {
  saved: {
    label: 'Saved',
    title: 'All changes saved',
    dot: '#16a34a', // app-success
    color: '#8a8a94', // app-dim
    bg: 'transparent',
    border: 'transparent',
  },
  saving: {
    label: 'Saving…',
    title: 'Saving your changes…',
    dot: '#8a8a94', // app-dim, pulsing — motion carries "in progress", not hue
    color: '#8a8a94',
    bg: 'transparent',
    border: 'transparent',
    pulse: true,
  },
  error: {
    label: 'Not saved — retrying',
    title: 'Could not reach the server — retrying automatically',
    dot: '#d1483a', // app-danger
    color: '#d1483a',
    bg: 'transparent',
    border: 'transparent',
  },
};

// Reserve a stable min-width so the chip never shifts the layout between states.
// LOAD-BEARING — the widest label ("Not saved — retrying") sets the floor; without
// the reservation the whole right cluster jitters every time the state flips.
// Restyle the value if t1 geometry demands, never remove the reservation.
const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: '150px',
  padding: '3px 8px',
  borderRadius: '9999px',
  justifyContent: 'flex-end',
  fontSize: '12px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const dotStyle: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '9999px',
  flexShrink: 0,
};
