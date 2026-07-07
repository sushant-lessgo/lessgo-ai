'use client';

// In-app replacement for window.confirm / window.prompt in the editor.
// Native dialogs block the renderer's event loop (they froze the editor tab on
// section delete — QA vestria E5) and can't be styled or automated.
//
// Imperative promise API so existing `if (confirm(...))` control flow converts
// to `if (await confirmDialog({...}))` without restructuring callers:
//
//   if (await confirmDialog({ message: 'Delete this section?', destructive: true })) { ... }
//   const name = await promptDialog({ title: 'Page name', defaultValue: 'New page' });
//
// <DialogHost /> must be mounted once (edit-page root). If no host is mounted
// (defensive), the functions fall back to the native dialogs.

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button red. */
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type DialogRequest =
  | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOptions)
  | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOptions);

let enqueueRequest: ((req: DialogRequest) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!enqueueRequest) {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(opts.message));
  }
  return new Promise((resolve) => enqueueRequest!({ kind: 'confirm', resolve, ...opts }));
}

export function promptDialog(opts: PromptOptions): Promise<string | null> {
  if (!enqueueRequest) {
    return Promise.resolve(
      typeof window !== 'undefined'
        ? window.prompt(opts.message || opts.title, opts.defaultValue ?? '')
        : null
    );
  }
  return new Promise((resolve) => enqueueRequest!({ kind: 'prompt', resolve, ...opts }));
}

export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    enqueueRequest = (req) => setQueue((q) => [...q, req]);
    return () => {
      enqueueRequest = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    if (current.kind === 'prompt') {
      setValue(current.defaultValue ?? '');
      requestAnimationFrame(() => inputRef.current?.select());
    } else {
      requestAnimationFrame(() => confirmRef.current?.focus());
    }
  }, [current]);

  const settle = useCallback(
    (confirmed: boolean) => {
      if (!current) return;
      if (current.kind === 'confirm') current.resolve(confirmed);
      else current.resolve(confirmed ? value : null);
      setQueue((q) => q.slice(1));
    },
    [current, value]
  );

  if (!current) return null;

  const confirmLabel = current.confirmLabel || (current.kind === 'prompt' ? 'OK' : 'Confirm');
  const cancelLabel = current.cancelLabel || 'Cancel';
  const destructive = current.kind === 'confirm' && current.destructive;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) settle(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          settle(false);
        }
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        role={current.kind === 'confirm' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
      >
        {current.title && (
          <h2 className="mb-1 text-base font-semibold text-gray-900">{current.title}</h2>
        )}
        {current.message && <p className="text-sm text-gray-600">{current.message}</p>}

        {current.kind === 'prompt' && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={current.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                settle(true);
              }
            }}
            className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => settle(false)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => settle(true)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
