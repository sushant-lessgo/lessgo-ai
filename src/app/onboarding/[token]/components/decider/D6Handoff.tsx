'use client';

// D6 — "Engine set → hand off" (engineDecider Phase 3). **Owns the confirm
// handoff** — the ownership that used to live in JourneyEntryStep (now retired).
//
// Its Continue CTA performs EXACTLY the pre-journey handoff sequence:
//   loadJourneySeam(engine) → seam.enrichDraftForConfirm(draft) [PURE] →
//   POST /api/brief/confirm → on `serve`: HARD-navigate to redirectTo (a full
//   load re-runs page.tsx load-detection, which mounts JourneyShell at showWork);
//   on `manual`: hand the server's `missing` tags to the demand branch.
//
// The server ALWAYS re-runs the serve gate (authoritative); ours is nothing —
// D6 never guesses the outcome. `/api/brief/confirm` is a CONSUMED CONTRACT:
// request `{tokenId, brief}`, response `{outcome, redirectTo|missing}` — unchanged.
//
// Unlike the retired JourneyEntryStep, D6 shows NO editable one-liner and NEVER
// re-classifies (no extra UNDERSTAND credit): the one-liner is typed once at D1.
// That is the O1 kill.
//
// Firewall: the seam is reached ONLY through the registry loader (a dynamic
// import); no engine literal, no template/generation graph statically here. D6 is
// itself dynamically imported (ssr:false) by page.tsx — same discipline as
// JourneyShell/WizardShell.

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { loadJourneySeam } from '@/components/onboarding/journey/engines/registry';
import type { JourneyEngineSeam } from '@/components/onboarding/journey/engines/types';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';
import { ENGINE_LEAD } from './D2Known';

interface D6HandoffProps {
  tokenId: string;
  briefDraft: Brief;
  resolvedEngine: ResolvedEngine;
  /** MANUAL verdict — carries the server's `missing` tags to demand capture. */
  onManual: (missing: string) => void;
  /** Optional back affordance (to D2/D3). */
  onBack?: () => void;
}

export default function D6Handoff({
  tokenId,
  briefDraft,
  resolvedEngine,
  onManual,
  onBack,
}: D6HandoffProps) {
  const [seam, setSeam] = useState<JourneyEngineSeam | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = ENGINE_LEAD[resolvedEngine];

  // The seam follows the confirmed draft's engine (work today).
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

  const handleContinue = async () => {
    if (confirming) return;
    setConfirming(true);
    setError(null);
    try {
      if (!seam) {
        setError('Still getting things ready — please try again.');
        setConfirming(false);
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
      if (!res.ok || !json?.outcome) {
        setError(json?.error || 'Something went wrong. Please try again.');
        setConfirming(false);
        return;
      }
      if (json.outcome === 'serve' && json.redirectTo) {
        // HARD navigation: a full load re-runs load-detection, which mounts the
        // journey shell at showWork. No `confirming` reset — this screen stays
        // mounted until unload.
        window.location.assign(json.redirectTo);
        return;
      }
      // MANUAL — hand the tags to the demand branch (Phase 5 reskins it).
      onManual(typeof json.missing === 'string' ? json.missing : 'rungA:unclassified');
      setConfirming(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirming(false);
    }
  };

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex flex-col items-center justify-center p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
        <div data-testid="decider-d6" className="w-full max-w-[560px] flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-tint px-2.5 py-1 font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-primary-deep">
            <span className="flex items-center justify-center">{copy.icon}</span>
            ENGINE SET
          </div>

          <h1 className="mt-4 font-app-sans font-extrabold text-[30px] leading-[1.16] tracking-[-1px] text-app-ink max-w-[480px]">
            {copy.label}.
          </h1>
          <p className="mt-2.5 font-app-sans text-[14.5px] text-app-muted max-w-[440px]">
            {copy.descriptor}. You can still change this any time before we build.
          </p>

          {/* Belief-lifecycle card: inferred → revised → committed. */}
          <div className="mt-6 w-full max-w-[460px] rounded-app-panel border border-app-border-hairline bg-app-surface p-4 text-left">
            <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-2.5">
              HOW THIS SETTLES
            </div>
            <ol className="flex flex-col gap-2">
              <LifecycleRow n={1} state="now" label="Inferred from your line" />
              <LifecycleRow n={2} state="next" label="Revised as you add your work" />
              <LifecycleRow n={3} state="later" label="Committed when you approve the plan" />
            </ol>
          </div>

          {/* Dark handoff banner. */}
          <div className="mt-6 w-full max-w-[460px] rounded-app-panel bg-[#0b1830] px-4 py-3.5 flex items-center gap-3 text-left">
            <span className="font-app-sans text-[13px] text-white/85">
              Handing off to build your site.
            </span>
            <button
              type="button"
              data-testid="decider-d6-continue"
              onClick={handleContinue}
              disabled={confirming || !seam}
              className="ml-auto inline-flex items-center justify-center gap-2 rounded-[10px] bg-app-cta px-5 py-2.5 font-app-sans font-bold text-[13px] text-white shadow-app-btn-cta disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {onBack && !confirming && (
            <button
              type="button"
              data-testid="decider-d6-back"
              onClick={onBack}
              className="mt-4 font-app-sans font-semibold text-[12px] text-app-muted hover:text-app-ink"
            >
              Back
            </button>
          )}

          {error && (
            <p data-testid="decider-d6-error" className="mt-4 font-app-sans text-xs text-app-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LifecycleRow({
  n,
  state,
  label,
}: {
  n: number;
  state: 'now' | 'next' | 'later';
  label: string;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={
          'flex-none w-[20px] h-[20px] rounded-full flex items-center justify-center font-app-sans font-bold text-[11px] ' +
          (state === 'now'
            ? 'bg-app-primary text-white'
            : 'bg-app-track text-app-muted')
        }
      >
        {n}
      </span>
      <span
        className={
          'font-app-sans text-[13px] ' +
          (state === 'now' ? 'text-app-ink font-semibold' : 'text-app-muted')
        }
      >
        {label}
      </span>
    </li>
  );
}
