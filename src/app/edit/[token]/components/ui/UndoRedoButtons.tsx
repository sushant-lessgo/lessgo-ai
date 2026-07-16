// /app/edit/[token]/components/ui/UndoRedoButtons.tsx
"use client";

// PHASE 8 — t1 undo/redo. Presentation only: the old grey bordered boxes (and
// their hand-drawn SVGs) are replaced by t1's ghost icon buttons — 19px Material
// `undo`/`redo` glyphs, disabled tone #c7c7cf (app-border-mute). `useUndoRedo`,
// the handlers, the `disabled` predicates and the shortcut titles are untouched.
//
// `disabled` is CORRECT here (unlike a <Coming> control): these buttons really do
// nothing when there is no history to walk, they carry no tooltip that needs
// pointer events, and they must not be tab stops in that state.

import React from 'react';
import { AppIcon } from '@/components/ui/icon';
import { useUndoRedo } from './useUndoRedo';

/** t1 bar icon button: 28px hit box, ghost hover, muted-when-dead. */
const ICON_BTN =
  'inline-flex h-7 w-7 flex-none items-center justify-center rounded-app-badge transition-colors ' +
  'text-app-icon-muted hover:bg-app-hover hover:text-app-ink ' +
  'disabled:cursor-not-allowed disabled:text-app-border-mute disabled:hover:bg-transparent disabled:hover:text-app-border-mute';

export function UndoRedoButtons() {
  const { handleUndo, handleRedo, canUndo, canRedo } = useUndoRedo();

  return (
    <div className="flex flex-none items-center gap-0.5">
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        className={ICON_BTN}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <AppIcon name="undo" size={19} />
      </button>

      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        className={ICON_BTN}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <AppIcon name="redo" size={19} />
      </button>
    </div>
  );
}
