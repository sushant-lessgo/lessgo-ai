// /app/edit/[token]/components/ui/MobilePreviewFrame.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useEditStoreApi } from '@/hooks/useEditStore';

interface MobilePreviewFrameProps {
  tokenId: string;
}

/**
 * True-viewport mobile preview (editor-route-consolidation phase 4).
 *
 * A centered ~390×844 phone frame containing an <iframe> of the chromeless
 * `/edit/{token}/preview` sub-route (phase 2). Because the iframe is a SEPARATE
 * document it gets a real 390px viewport — the block components' mobile
 * breakpoints actually fire, and it escapes the editor's `.app-chrome` (font
 * bleed can't reach it). The sub-route is framable same-origin via the phase-3
 * XFO SAMEORIGIN rule.
 *
 * ── State handoff = DB reload, NOT postMessage ────────────────────────────
 * Before the iframe mounts we force `save()` so the sub-route's own EditProvider
 * `loadDraft` reads the latest edits from the DB. We deliberately do NOT
 * rearchitect a live cross-document channel (per spec) — a one-shot save→reload
 * is the whole handoff. The parent gates the iframe behind `ready` so it never
 * loads before the save resolves (stale-content guard).
 *
 * ── Fresh remount per entry ───────────────────────────────────────────────
 * EditLayout only mounts this component while `mode==='preview' && deviceMode
 * ==='mobile'`, and passes a `key` that changes on each entry — so re-entering
 * mobile view remounts this component, re-runs the save, and reloads the iframe
 * fresh. No stale iframe survives a desktop↔mobile round-trip.
 */
export function MobilePreviewFrame({ tokenId }: MobilePreviewFrameProps) {
  const storeApi = useEditStoreApi();
  // Gate the iframe until the forced save resolves — so the sub-route's
  // loadDraft can't race ahead of the latest edits.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await storeApi.getState().save();
      } catch {
        // Save failure still shows the iframe (it renders the last-persisted
        // draft) — surfacing a hard error here would be worse than a slightly
        // stale mobile preview. The editor's own save-error UI owns the signal.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeApi]);

  return (
    <div
      className="flex-1 min-h-0 flex items-center justify-center overflow-auto bg-app-frame p-6"
      data-testid="mobile-preview-frame"
    >
      {/* Phone shell: a dark bezel around a fixed 390×844 device viewport. The
          iframe itself is exactly 390px wide so its content sees a true mobile
          breakpoint. */}
      <div
        className="relative flex-none overflow-hidden rounded-[2.25rem] border-[10px] border-gray-900 bg-white shadow-2xl"
        style={{ width: 410, height: 864 }}
      >
        {ready ? (
          <iframe
            title="Mobile preview"
            src={`/edit/${tokenId}/preview`}
            data-testid="mobile-preview-iframe"
            className="block border-0"
            style={{ width: 390, height: 844 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] text-gray-500">
            Loading preview…
          </div>
        )}
      </div>
    </div>
  );
}
