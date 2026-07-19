'use client';

// FinalizeHandoff — the SILENT confirm-handoff transition (engineDecider Phase 3
// follow-up). **Owns the confirm handoff** — the ownership that used to live in
// JourneyEntryStep (retired), then in the D6 ceremony screen (CUT per founder QA:
// the clear ~80% path must not stop for a "handing off" ceremony + Continue).
//
// It fires the WHOLE pre-journey handoff AUTOMATICALLY on mount behind a minimal
// "setting up your site…" spinner — NO Continue button, NO belief-lifecycle card:
//   loadJourneySeam(engine) → seam.enrichDraftForConfirm(draft) [PURE] →
//   POST /api/brief/confirm → on `serve`: HARD-navigate to redirectTo (a full
//   load re-runs page.tsx load-detection, which mounts JourneyShell at showWork);
//   on `manual`: hand the server's `missing` tags to the demand branch.
//
// The confirm sequence is byte-equivalent to the retired D6 Continue handler —
// ONLY its trigger changed (an auto `useEffect`, not a click). The server ALWAYS
// re-runs the serve gate (authoritative); we never guess the outcome.
// `/api/brief/confirm` is a CONSUMED CONTRACT: request `{tokenId, brief}`,
// response `{outcome, redirectTo|missing}` — unchanged.
//
// Reached on TWO lanes: the clear/known path (D1 → here, no D2) and the
// almost-sure "Yes" path (D1 → D3 → here). When D4 lands (Phase 4) its work-pick
// routes through this SAME transition. All three: no editable one-liner, no
// re-classify, no extra UNDERSTAND credit — the O1 kill (typed once, at D1).
//
// Firewall: the seam is reached ONLY through the registry loader (a dynamic
// import); no engine literal, no template/generation graph statically here.
// FinalizeHandoff is itself dynamically imported (ssr:false) by page.tsx — same
// discipline as JourneyShell/WizardShell.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { loadJourneySeam } from '@/components/onboarding/journey/engines/registry';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';

interface FinalizeHandoffProps {
  tokenId: string;
  briefDraft: Brief;
  /** The resolved engine (work today). Load-bearing for D4's work-pick seam; the
   *  seam itself follows `briefDraft.copyEngine`. */
  resolvedEngine: ResolvedEngine;
  /** MANUAL verdict — carries the server's `missing` tags to demand capture. */
  onManual: (missing: string) => void;
}

export default function FinalizeHandoff({ tokenId, briefDraft, onManual }: FinalizeHandoffProps) {
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);
  // A Retry bump (see handleRetry) that the confirm effect depends on so the
  // error path has a real re-trigger — the effect otherwise never re-runs.
  const [retryNonce, setRetryNonce] = useState(0);
  // onManual may change identity across renders; ref keeps the mount-once effect
  // stable without re-firing the confirm POST.
  const onManualRef = useRef(onManual);
  onManualRef.current = onManual;

  // Persistent mount-once guard. A useRef SURVIVES StrictMode's dev
  // setup→cleanup→setup remount on the SAME fiber, so the confirm handoff fires
  // EXACTLY once. A bare per-invocation `cancelled` flag would NOT stop a second
  // effect invocation's fetch — under StrictMode the draft could be confirmed
  // TWICE (duplicate testimonial rows + double nav). Reset only by an explicit
  // Retry.
  const firedRef = useRef(false);
  // Live-mount guard for post-unmount setState/nav. Distinct from firedRef: it is
  // flipped false by cleanup and TRUE again by the next setup, so StrictMode's
  // setup→cleanup→setup leaves the component ACTIVE and the single in-flight async
  // (kept alive by firedRef, NOT restarted) resumes normally. On a REAL unmount
  // there is no re-setup, so it stays false and late setState/nav is skipped.
  const activeRef = useRef(true);

  // Auto-run the confirm handoff EXACTLY ONCE on mount. No Continue button, no
  // ceremony — the clear path never stops here. The seam load + enrich + POST is
  // byte-equivalent to the retired D6 Continue handler; only the trigger changed.
  useEffect(() => {
    // Set active BEFORE the fired guard so StrictMode's re-setup restores it.
    activeRef.current = true;
    if (firedRef.current) {
      return () => {
        activeRef.current = false;
      };
    }
    firedRef.current = true;
    setInFlight(true);
    (async () => {
      try {
        // The seam follows the confirmed draft's engine (work today).
        const seam = await loadJourneySeam(briefDraft.copyEngine);
        if (!activeRef.current) return;
        if (!seam) {
          setError('Something went wrong. Please try again.');
          return;
        }
        // The seam's enrichment is the ONLY draft mutation on this path and it is
        // PURE — it returns the draft to POST and never persists. For work it is
        // what writes facts.work; without it the journey rail has nothing to show.
        const enriched = seam.enrichDraftForConfirm(briefDraft);
        const res = await fetch('/api/brief/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, brief: enriched }),
        });
        const json = await res.json();
        if (!activeRef.current) return;
        if (!res.ok || !json?.outcome) {
          setError(json?.error || 'Something went wrong. Please try again.');
          return;
        }
        if (json.outcome === 'serve' && json.redirectTo) {
          // HARD navigation: a full load re-runs load-detection, which mounts the
          // journey shell at showWork.
          window.location.assign(json.redirectTo);
          return;
        }
        // MANUAL — hand the tags to the demand branch (Phase 5 reskins it).
        onManualRef.current(typeof json.missing === 'string' ? json.missing : 'rungA:unclassified');
      } catch {
        if (activeRef.current) setError('Something went wrong. Please try again.');
      } finally {
        if (activeRef.current) setInFlight(false);
      }
    })();
    return () => {
      activeRef.current = false;
    };
    // Re-runs ONLY on an explicit Retry (retryNonce). briefDraft/tokenId are
    // stable for the life of this transition; the firedRef guard makes the effect
    // idempotent under StrictMode's dev double-invoke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryNonce]);

  // Error-state Retry: reset the mount-once guard, clear the error, and bump the
  // nonce to re-fire the confirm handoff. The firedRef reset + nonce bump is the
  // ONLY way the effect re-runs; `inFlight` disables the button so a retry cannot
  // double-fire concurrently.
  const handleRetry = useCallback(() => {
    if (inFlight) return;
    firedRef.current = false;
    setError(null);
    setRetryNonce((n) => n + 1);
  }, [inFlight]);

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex flex-col items-center justify-center gap-4 p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
        <div
          data-testid="decider-finalize"
          className="flex flex-col items-center text-center gap-4"
        >
          {error ? (
            <>
              <p data-testid="decider-finalize-error" className="font-app-sans text-sm text-app-danger">
                {error}
              </p>
              <button
                type="button"
                data-testid="decider-finalize-retry"
                onClick={handleRetry}
                disabled={inFlight}
                className="rounded-app-panel border-[1.5px] border-app-primary bg-app-tint px-5 py-2.5 font-app-sans font-bold text-[14px] text-app-ink transition-colors hover:bg-app-tint/70 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-app-primary" />
              <p className="font-app-sans text-[15px] text-app-muted">Setting up your site…</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
