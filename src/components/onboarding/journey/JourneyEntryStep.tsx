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
// ── EDITED LINE ⇒ RE-CLASSIFY (decision 3; accepted trade-offs) ─────────────
// Editing the one-liner re-runs `/api/v2/understand` — the SAME route
// `EntryInputStep` uses. Costs 1 UNDERSTAND credit per re-classify (accepted for
// E1). `applyBusinessTypeCorrection` (the confirm step's 1-tap chooser) is NOT
// offered here (accepted for E1). If the fresh draft's engine has NO seam, this
// screen must hand back to the legacy `ConfirmBriefStep` — see `onDraftCorrected`.
//
// AGNOSTIC: the copy is UNIVERSAL (closed ruling — a seam copy override is
// optional and unused). No engine literal appears in this file; the seam is
// reached through the registry and the dispatch predicate through the leaf.
// ============================================================================

import { useEffect, useState } from 'react';
import type { Brief } from '@/types/brief';
import { hasJourneySeam } from '@/lib/journeyEngines';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Textarea } from '@/components/ui/textarea';
import JourneyTopBar from './JourneyTopBar';
import { loadJourneySeam } from './engines/registry';
import type { JourneyEngineSeam } from './engines/types';

export interface JourneyEntryStepProps {
  tokenId: string;
  briefDraft: Brief;
  /**
   * A re-classified draft (the user edited the one-liner). The parent MUST feed
   * this back into the draft it renders from: when the fresh draft's engine has
   * no seam, that is exactly what flips this screen back to the legacy
   * `ConfirmBriefStep` (the entry page's `step` is already `'confirm'`).
   *
   * OPTIONAL only so this component can be mounted standalone (tests). Without
   * it, a non-seam re-classification has nowhere to go and is surfaced as an
   * error rather than silently stranding the user here.
   */
  onDraftCorrected?: (draft: Brief) => void;
  /** MANUAL verdict — carries the server's `missing` tags to demand capture. */
  onManual: (missing: string) => void;
}

function entryOneLiner(draft: Brief): string {
  const entry = draft.facts?.['entry'] as
    | { oneLiner?: string; rawInput?: string }
    | undefined;
  return entry?.oneLiner ?? entry?.rawInput ?? '';
}

export default function JourneyEntryStep({
  tokenId,
  briefDraft,
  onDraftCorrected,
  onManual,
}: JourneyEntryStepProps) {
  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState('describe');
  const [line, setLine] = useState(() => entryOneLiner(briefDraft));

  // The seam follows the (possibly re-classified) draft's engine.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadJourneySeam(briefDraft.copyEngine);
      if (!cancelled) setSeam(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [briefDraft.copyEngine]);

  const original = entryOneLiner(briefDraft);
  const edited = line.trim() !== original.trim();

  /** POST the enriched draft to the authoritative serve gate. */
  const confirmDraft = async (draft: Brief, draftSeam: JourneyEngineSeam) => {
    // The seam's enrichment is the ONLY draft mutation on this path, and it is
    // PURE — it returns the draft to POST and never persists. A missing seam
    // must NOT silently drop it: an un-enriched work draft confirms into a
    // journey whose rail has no facts to project.
    const enriched = draftSeam.enrichDraftForConfirm(draft);
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
  };

  /** The user rewrote the line ⇒ the classification is stale. Re-run it. */
  const reclassify = async (): Promise<Brief | null> => {
    const res = await fetch('/api/v2/understand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oneLiner: line.trim(), entry: true }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success || !json?.briefDraft) {
      setError(json?.message || "Couldn't understand that. Try rephrasing in a sentence.");
      setConfirming(false);
      return null;
    }
    return json.briefDraft as Brief;
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setError(null);
    try {
      if (!seam) {
        setError('Still getting things ready — please try again.');
        setConfirming(false);
        return;
      }

      if (!edited) {
        await confirmDraft(briefDraft, seam);
        return;
      }

      const fresh = await reclassify();
      if (!fresh) return;

      // A fresh draft whose engine has NO seam does not belong in this journey —
      // hand it back to the legacy confirm step with the corrected draft
      // (decision 3). Never confirm it from here.
      if (!hasJourneySeam(fresh.copyEngine)) {
        if (onDraftCorrected) {
          onDraftCorrected(fresh);
          return; // this component unmounts; ConfirmBriefStep takes over.
        }
        setError('That looks like a different kind of business — please refresh and try again.');
        setConfirming(false);
        return;
      }

      // Still seamed — but possibly a DIFFERENT engine, so load ITS seam rather
      // than reusing the one this screen mounted with.
      const freshSeam = await loadJourneySeam(fresh.copyEngine);
      if (!freshSeam) {
        setError('Something went wrong. Please try again.');
        setConfirming(false);
        return;
      }
      onDraftCorrected?.(fresh);
      await confirmDraft(fresh, freshSeam);
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

      <div
        className="flex-1 min-h-0 overflow-auto flex flex-col items-center justify-center p-10
                   bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]"
      >
        <div data-testid="journey-entry-step" className="w-full flex flex-col items-center">
          <Badge variant="secondary" className="rounded-app-pill mb-5 py-[5px] px-3">
            <AppIcon name="rocket_launch" size={15} className="text-app-primary" />
            Welcome to Lessgo AI
          </Badge>

          <h1
            className="font-app-sans font-extrabold text-[40px] leading-[1.12] tracking-[-1.2px]
                       text-app-ink text-center max-w-[640px] mb-3.5"
          >
            Let&rsquo;s build your first site
          </h1>
          <p className="font-app-sans text-[15.5px] leading-[1.55] text-app-muted text-center max-w-[540px] mb-8">
            Describe what you&rsquo;re launching and Lessgo AI builds a high-converting site
            with copy, layout, and a lead form in seconds.
          </p>

          <div className="w-full max-w-[720px] bg-app-surface border border-app-border rounded-app-modal shadow-app-float p-[18px] pb-[15px]">
            <SegmentedControl
              className="mb-[15px] w-fit"
              aria-label="How would you like to start?"
              value={mode}
              onValueChange={setMode}
              options={[
                { value: 'describe', label: 'Describe your site', icon: 'edit_note' },
                // E1: stub. The URL path exists at EntryInputStep (scrape) and is
                // out of scope here (decision 8 / landmine 13).
                {
                  value: 'url',
                  label: 'Use my current site',
                  icon: 'link',
                  disabled: true,
                },
              ]}
            />

            <Textarea
              value={line}
              disabled={confirming}
              maxLength={500}
              data-testid="journey-entry-oneliner"
              aria-label="Describe your site"
              onChange={(e) => {
                setLine(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-[64px] border-0 px-0 text-base text-app-ink focus-visible:ring-0 resize-none"
            />

            <div className="flex items-center gap-2.5 mt-2">
              <span className="font-app-sans text-[11.5px] text-app-faint">
                {edited
                  ? 'You changed this — we’ll re-read it before building.'
                  : 'Change anything that isn’t right.'}
              </span>
              <span className="flex-1" />
              <Button
                type="button"
                variant="cta"
                onClick={handleConfirm}
                disabled={confirming || !seam || !line.trim()}
                data-testid="journey-entry-cta"
              >
                {confirming ? (
                  <>
                    <AppIcon name="progress_activity" size={16} className="animate-spin mr-1.5" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Build my site
                    <AppIcon name="arrow_forward" size={18} className="ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p data-testid="journey-entry-error" className="font-app-sans text-xs text-app-danger mt-4">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
