'use client';

// ConfirmToWizard — the SILENT thing/trust confirm→wizard transition
// (engineDecider Phase 4). The clear/picked thing/trust counterpart to
// FinalizeHandoff (which owns the WORK confirm→journey). It fires the confirm
// AUTOMATICALLY on mount behind a "setting up your site…" spinner — no ceremony,
// no re-asked one-liner (the O1 kill): PLAIN POST /api/brief/confirm (thing/trust
// have no journey seam, so no enrichment) → on `serve`, HARD-navigate to
// `redirectTo` WITH `?enter=understanding` so the reloaded wizard skips the
// `identity` re-ask (load-detection reads the param); on `manual`, hand the tags
// to the demand branch.
//
// Kept OUT of FinalizeHandoff (which is work-only and errors without a seam) and
// extracted from page.tsx so it is unit-testable in isolation. The mount-once
// guard mirrors FinalizeHandoff: a persistent `firedRef` survives StrictMode's
// dev setup→cleanup→setup on the same fiber, so the confirm POST fires EXACTLY
// once (a duplicate would double-persist / double-nav — the exact failure the
// Phase 3 follow-up fixed: duplicate testimonial imports). Firewall: pure fetch
// only — no seam/registry/template/generation graph. Dynamically imported
// (ssr:false) by page.tsx, same discipline as FinalizeHandoff/D4.

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';

interface ConfirmToWizardProps {
  tokenId: string;
  briefDraft: Brief;
  onManual: (missing: string) => void;
}

export default function ConfirmToWizard({
  tokenId,
  briefDraft,
  onManual,
}: ConfirmToWizardProps) {
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const onManualRef = useRef(onManual);
  onManualRef.current = onManual;
  // Persistent mount-once guard (survives StrictMode's same-fiber remount).
  const firedRef = useRef(false);
  // Live-mount guard for post-unmount setState/nav (flipped by cleanup, restored
  // by the next setup — see FinalizeHandoff for the full rationale).
  const activeRef = useRef(true);

  useEffect(() => {
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
        // Plain POST — thing/trust have no journey seam, so no enrichment.
        const res = await fetch('/api/brief/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, brief: briefDraft }),
        });
        const json = await res.json();
        if (!activeRef.current) return;
        if (!res.ok || !json?.outcome) {
          setError(json?.error || 'Something went wrong. Please try again.');
          return;
        }
        if (json.outcome === 'serve' && json.redirectTo) {
          // HARD nav + `?enter=understanding` so the reloaded wizard skips the
          // identity re-ask (load-detection reads the param).
          const sep = String(json.redirectTo).includes('?') ? '&' : '?';
          window.location.assign(`${json.redirectTo}${sep}enter=understanding`);
          return;
        }
        // MANUAL — hand the server's tags to the demand branch (Phase 5 reskins it).
        onManualRef.current(
          typeof json.missing === 'string' ? json.missing : 'rungA:unclassified'
        );
      } catch {
        if (activeRef.current) setError('Something went wrong. Please try again.');
      } finally {
        if (activeRef.current) setInFlight(false);
      }
    })();
    return () => {
      activeRef.current = false;
    };
    // Re-runs ONLY on an explicit Retry (retryNonce); the firedRef guard makes it
    // idempotent under StrictMode's dev double-invoke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryNonce]);

  const handleRetry = () => {
    if (inFlight) return;
    firedRef.current = false;
    setError(null);
    setRetryNonce((n) => n + 1);
  };

  return (
    <div className="app-chrome fixed inset-0 flex flex-col items-center justify-center gap-4 bg-app-canvas p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
      <div
        data-testid="decider-confirm-wizard"
        className="flex flex-col items-center text-center gap-4"
      >
        {error ? (
          <>
            <p
              data-testid="decider-confirm-wizard-error"
              className="font-app-sans text-sm text-app-danger"
            >
              {error}
            </p>
            <button
              type="button"
              data-testid="decider-confirm-wizard-retry"
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
            <p className="font-app-sans text-[15px] text-app-muted">
              Setting up your site…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
