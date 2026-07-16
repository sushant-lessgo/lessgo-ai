'use client';

// ============================================================================
// JourneyEntryStep — STEP 01. The confirm-step replacement when a seam exists.
//
// Mounted by the ENTRY PAGE (dynamic, ssr:false) PRE-CONFIRM, in place of
// `ConfirmBriefStep`, whenever `hasJourneySeam(briefDraft.copyEngine)`. It is
// NOT part of the resumable step machine — STEP 01 is pre-confirm and never
// resumed (there is no project to resume yet).
//
// The ONE thing it adds over `ConfirmBriefStep`: it loads the engine's seam and
// calls `seam.enrichDraftForConfirm(draft)` BEFORE POSTing `/api/brief/confirm`.
// For work that is what writes `facts.work` — nothing else in the system does,
// so without it the rail would project over nothing.
//
// Everything else mirrors `ConfirmBriefStep` deliberately: the server ALWAYS
// re-runs the serve gate (its verdict is authoritative; ours is advisory),
// serve ⇒ a HARD navigation (the shell re-hydrates the brief from the DB, not
// from client memory), manual ⇒ the existing `ManualOnboardStep` path.
//
// ── STATUS (P2b): MINIMAL BY INTENT ─────────────────────────────────────────
// This is the DISPATCH PROOF, not the screen. P3 builds handoff 1a for real
// (radial-gradient body, rocket_launch chip, display headline, 720px card,
// segmented "Describe your site" / "Use my current site", coral CTA) and adds
// the edited-line re-classify. Keep the rework bounded — don't polish here.
//
// AGNOSTIC: the copy is UNIVERSAL (closed ruling — a seam copy override is
// optional and unused). No engine literal appears in this file.
// ============================================================================

import { useEffect, useState } from 'react';
import type { Brief } from '@/types/brief';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import JourneyTopBar from './JourneyTopBar';
import { loadJourneySeam } from './engines/registry';
import type { JourneyEngineSeam } from './engines/types';

export interface JourneyEntryStepProps {
  tokenId: string;
  briefDraft: Brief;
  /** MANUAL verdict — carries the server's `missing` tags to demand capture. */
  onManual: (missing: string) => void;
}

export default function JourneyEntryStep({
  tokenId,
  briefDraft,
  onManual,
}: JourneyEntryStepProps) {
  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadJourneySeam(briefDraft.copyEngine);
      if (!cancelled) setSeam(loaded);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oneLiner =
    (briefDraft.facts?.['entry'] as { oneLiner?: string; rawInput?: string } | undefined)
      ?.oneLiner ?? '';

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setError(null);
    try {
      // The seam's enrichment is the ONLY draft mutation on this path, and it is
      // PURE — it returns the draft to POST and never persists. A missing seam
      // must NOT silently drop it: an un-enriched work draft confirms into a
      // journey whose rail has no facts to project. Fail loudly instead.
      if (!seam) {
        setError('Still getting things ready — please try again.');
        setConfirming(false);
        return;
      }
      const enriched = seam.enrichDraftForConfirm(briefDraft);

      const res = await fetch('/api/brief/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, brief: enriched }),
      });
      const json = await res.json();
      if (!res.ok || !json?.outcome) {
        setError(json?.error || 'Something went wrong. Please try again.');
        setConfirming(false);
        return;
      }
      if (json.outcome === 'serve' && json.redirectTo) {
        // HARD navigation (mirrors ConfirmBriefStep): a full load re-runs
        // load-detection, which is what mounts the journey shell at its resume
        // step. No `confirming` reset — this screen stays mounted until unload,
        // and re-enabling the button mid-transition makes the click look like a
        // no-op.
        window.location.assign(json.redirectTo);
        return;
      }
      onManual(typeof json.missing === 'string' ? json.missing : 'rungA:unclassified');
      setConfirming(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirming(false);
    }
  };

  return (
    // `.app-chrome` on this component's OWN full-viewport wrapper only — the
    // same hard scope rule as JourneyShell. Never on <body>, never around a
    // rendered site.
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      {/* STEP 01 is pre-confirm ⇒ no dot progress (nothing to resume yet). */}
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto">
        <div
          data-testid="journey-entry-step"
          className="mx-auto max-w-[720px] px-6 py-16 space-y-6"
        >
          <h1 className="font-app-sans text-3xl font-semibold text-app-ink">
            Here&apos;s what we&apos;ll build
          </h1>

          {oneLiner && (
            <p
              data-testid="journey-entry-oneliner"
              className="font-app-sans text-base text-app-body"
            >
              {oneLiner}
            </p>
          )}

          {error && <p className="font-app-sans text-xs text-app-danger">{error}</p>}

          <Button
            type="button"
            variant="cta"
            size="lg"
            onClick={handleConfirm}
            disabled={confirming || !seam}
            data-testid="journey-entry-cta"
          >
            {confirming ? (
              <>
                <AppIcon name="progress_activity" size={16} className="animate-spin mr-1.5" />
                Setting up…
              </>
            ) : (
              'Build my site'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
