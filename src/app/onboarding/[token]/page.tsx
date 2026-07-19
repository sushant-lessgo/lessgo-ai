'use client';

// Universal entry flow (scale-02 phase 5, D1): input → confirm → manual, plus a
// serve-redirect out of the confirm step. scale-06 phase 3 adds LOAD-DETECTION:
// on mount we fetch the project; a DB-confirmed brief (Project.brief non-null +
// audienceType set) renders the UNIFIED WIZARD (net-new post-confirm landing AND
// reload/resume-mid-wizard). As of phase 10 EVERY engine goes through the
// unified wizard — the old per-audience wizard fork is gone. No persisted brief
// ⇒ the in-memory entry flow (input|confirm|manual).
//
// Firewall: this segment imports only pure @/modules/brief + fetch. The wizard
// dispatcher (WizardShell + template-adjacent slot code) is DYNAMICALLY imported
// so it never enters the entry bundle.
//
// work-onboarding-shell P2b — JOURNEY DISPATCH:
//   (a) POST-CONFIRM: a confirmed brief whose engine has a seam AND whose
//       TEMPLATE is eligible renders `JourneyShell` instead of `WizardShell`.
// (The old PRE-CONFIRM `JourneyEntryStep` branch is RETIRED — engineDecider
// Phase 3. The work lane now enters the DECIDER at D1 → D2/D3 → D6, and D6 owns
// the confirm handoff `JourneyEntryStep` used to. That kills the O1 double-entry.)
// These are FULL-VIEWPORT early returns — they render their own chrome and must
// NOT sit inside this page's legacy max-w-xl card.
//
// The eligibility test is the ZERO-DEP LEAF `@/lib/journeyEngines` and nothing
// else. Importing a seam, the registry, or the shell statically here would put
// the seam/generation graph on the entry bundle (landmine 14) — the shells are
// dynamic (`ssr:false`) for the same reason as WizardShell.
//
// Why eligibility is template-gated, not engine-gated: `granth` (writer) is a
// work-engine template that is NOT work-copy-engine allow-listed. An
// engine-only dispatch would strand writers in a journey their generation path
// does not drive, so granth correctly keeps landing on `WizardShell`
// post-confirm. (Accepted cosmetic: a granth-bound work DRAFT does see branch
// (b)'s STEP 01 pre-confirm, since the template isn't known yet. It is
// data-inert.)

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import type {
  EngineStatus,
  ResolvedEngine,
  TiebreakerRung,
} from '@/modules/brief/classify';
import { getEntryFacts } from '@/modules/brief/classify';
import { isJourneyEligible } from '@/lib/journeyEngines';
import { screenForStatus } from './components/decider/deciderMachine';
import Logo from '@/components/shared/Logo';
import ConfirmBriefStep from './components/ConfirmBriefStep';
import ManualOnboardStep from './components/ManualOnboardStep';

// FIREWALL: dynamic-import the wizard dispatcher so the entry path stays
// firewall-pure and slot code stays out of the entry bundle.
const WizardShell = dynamic(
  () => import('@/components/onboarding/wizard/WizardShell'),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 text-center text-gray-500">Loading your page…</div>
    ),
  }
);

// FIREWALL: same rule as WizardShell — the journey shells are dynamically
// imported (ssr:false) so neither the seam registry nor any seam code enters the
// entry bundle. The entry page's DECISIONS come from the leaf only.
const JourneyShell = dynamic(
  () => import('@/components/onboarding/journey/JourneyShell'),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 text-center text-gray-500">Loading your page…</div>
    ),
  }
);

// FIREWALL: the decider work-lane screens (D3 + the silent FinalizeHandoff)
// transitively pull the agnostic rail (→ the wizard store) and, for Finalize, the
// seam registry loader — so each is DYNAMICALLY imported (ssr:false), same
// discipline as JourneyShell. FinalizeHandoff owns the confirm handoff that the
// retired JourneyEntryStep — and then the cut D6 ceremony screen — used to own.
// The clear/known path skips straight through it (no D2, no ceremony).
const D3AlmostSure = dynamic(() => import('./components/decider/D3AlmostSure'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
});
const FinalizeHandoff = dynamic(() => import('./components/decider/FinalizeHandoff'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
});

// FIREWALL: the D1 composer transitively pulls the agnostic rail (→ the wizard
// store), so it is DYNAMICALLY imported (ssr:false) to keep that graph off the
// entry bundle — same discipline as WizardShell/JourneyShell. D1 renders its own
// full-viewport chrome, so it must escape the legacy centered card below.
const D1Entry = dynamic(() => import('./components/decider/D1Entry'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
});

// engineDecider Phase 3 — `decider` is the WORK-lane sub-flow. The clear/known
// path goes STRAIGHT to the silent `finalize` transition (no D2, no ceremony);
// the almost-sure path stops at D3 for one tap, then `finalize`. The specific
// screen is tracked by `deciderScreen`. Non-work lanes still route to `confirm`
// this phase (Phases 4–5 re-point them to D4/D5).
type EntryStep = 'input' | 'decider' | 'confirm' | 'manual' | 'wizard' | 'journey';

/** Which work-lane decider screen renders (engineDecider Phase 3 follow-up). */
type DeciderScreen = 'D3' | 'finalize';

/**
 * The decider's LOCAL state (engineDecider Phase 2 — R4: no new store). Captured
 * from the D1 read; the D2/D3/D6 work-lane routing CONSUMES it (Phase 3).
 * Held here so the entry page owns the revisable-belief state end-to-end.
 */
interface DeciderState {
  oneLiner: string;
  entrySignals: {
    businessTypeGuess: string | null;
    confidence: number;
    tiebreaker: TiebreakerRung;
  };
  engineStatus?: EngineStatus;
  resolvedEngine: ResolvedEngine | null;
  demandTag?: string;
}

interface WizardData {
  brief: Brief;
  audienceType: AudienceType | null;
  templateId: TemplateId | null;
  /**
   * work-onboarding-shell P5 — the journey's RESUME input. `/api/loadDraft`
   * already returns it; load-detection used to discard it, which made every
   * generation-resume rule in the seam dead code (`resolveResumeStep` saw
   * `finalContent: undefined` forever ⇒ always STEP 02). Kept OPAQUE here: only
   * the engine's seam may interpret generated content. WizardShell does not take
   * it (the legacy wizard has its own resume) — journey only.
   */
  finalContent?: unknown;
}

export default function EntryOnboardingPage() {
  const params = useParams();
  const tokenId = (params?.token as string) ?? '';

  // Undetermined until load-detection resolves (avoids flashing the input step
  // before we know a confirmed brief exists).
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<EntryStep>('input');
  const [rawInput, setRawInput] = useState('');
  const [briefDraft, setBriefDraft] = useState<Brief | null>(null);
  const [missing, setMissing] = useState<string>('rungA:unclassified');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  // engineDecider Phase 2 — the decider's local state (R4: no new store). Phase 3
  // WIRES A REAL READER: the work-lane D2/D3/D6 routing consumes it below.
  const [deciderState, setDeciderState] = useState<DeciderState | null>(null);
  const [deciderScreen, setDeciderScreen] = useState<DeciderScreen>('finalize');

  // Load-detection: does a DB-confirmed brief already exist for this token?
  useEffect(() => {
    if (!tokenId) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) {
          if (!cancelled) setChecking(false);
          return;
        }
        const json = await res.json();
        const brief = json?.brief as Brief | null;
        const audienceType = (json?.audienceType ?? null) as AudienceType | null;
        const templateId = (json?.templateId ?? null) as TemplateId | null;

        // A confirmed brief requires both a persisted brief and a resolved
        // audienceType (both written together at /api/brief/confirm serve).
        const confirmed = !!brief && !!audienceType && !!brief.copyEngine;
        if (confirmed && brief) {
          // JOURNEY DISPATCH (a): seam EXISTS and the picked TEMPLATE is
          // eligible ⇒ the journey shell. Everything else — including
          // work-engine templates that are not allow-listed (granth) — keeps the
          // unified wizard, unchanged.
          const journey = isJourneyEligible(brief.copyEngine, templateId);
          if (!cancelled) {
            setWizardData({
              brief,
              audienceType,
              templateId,
              // Carried for the journey's resume rules only (see WizardData).
              finalContent: json?.finalContent ?? null,
            });
            setStep(journey ? 'journey' : 'wizard');
            setChecking(false);
          }
          return;
        }
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  // ── JOURNEY DISPATCH — FULL-VIEWPORT EARLY RETURNS ────────────────────────
  // These render their own chrome (top bar + `.app-chrome` wrapper), so they
  // must escape the legacy centered card below, not nest inside it.

  // (a) POST-CONFIRM: confirmed + seam + eligible template.
  if (!checking && step === 'journey' && wizardData) {
    return (
      <JourneyShell
        tokenId={tokenId}
        brief={wizardData.brief}
        audienceType={wizardData.audienceType}
        templateId={wizardData.templateId}
        finalContent={wizardData.finalContent}
      />
    );
  }

  // (b) PRE-CONFIRM seam entry: RETIRED (engineDecider Phase 3). The work lane —
  // the only engine with a seam — now enters the DECIDER at D1 → D2/D3 → D6
  // (below), which owns the confirm handoff `JourneyEntryStep` used to. Its
  // duplicate editable one-liner is gone (the O1 kill). Non-seam lanes were never
  // in this branch; they fall through to `ConfirmBriefStep`.

  // ── D1 ENTRY COMPOSER — FULL-VIEWPORT EARLY RETURN ────────────────────────
  // D1 renders its own chrome (composer + live-read rail), so it escapes the
  // legacy centered card like the journey branches. On a resolved read it hands
  // the draft up to the existing confirm/journey branch (routing is re-pointed
  // to D2–D6 in Phases 3–4); Phase 2 keeps that path intact.
  if (!checking && step === 'input') {
    return (
      <D1Entry
        onSuccess={(input, draft) => {
          setRawInput(input);
          setBriefDraft(draft);
          const facts = getEntryFacts(draft);
          const resolvedEngine = facts?.resolvedEngine ?? null;
          setDeciderState({
            oneLiner: facts?.oneLiner || facts?.rawInput || input,
            entrySignals: {
              businessTypeGuess: draft.businessType ?? null,
              confidence: draft.confidence ?? 0,
              tiebreaker: facts?.tiebreaker ?? 'none',
            },
            engineStatus: facts?.engineStatus,
            resolvedEngine,
          });

          // engineDecider Phase 3 (+ follow-up) — WORK LANE ONLY. A resolved
          // `work` engine (the ONLY engine with a journey seam today):
          //   • KNOWN → STRAIGHT to the silent `finalize` transition (no D2, no
          //     ceremony) — the clear ~80% path never stops to click.
          //   • ALMOST-SURE → D3 (one-tap confirm) → `finalize`.
          // FinalizeHandoff owns the confirm handoff; the old JourneyEntryStep
          // double-entry is bypassed entirely (O1 kill). Every other lane — clear
          // thing/trust, ambiguous, place/quick-yes — keeps the existing `confirm`
          // path until Phases 4–5 re-point it.
          if (resolvedEngine === 'work') {
            const screen = screenForStatus(facts?.engineStatus);
            setDeciderScreen(screen === 'D3' ? 'D3' : 'finalize');
            setStep('decider');
          } else {
            setStep('confirm');
          }
        }}
      />
    );
  }

  // ── DECIDER WORK LANE — FULL-VIEWPORT EARLY RETURNS (engineDecider Phase 3) ──
  // The clear/known path lands directly on `finalize` (no D2, no ceremony). The
  // almost-sure path stops at D3 for one tap, then `finalize`. NO editable
  // one-liner appears on any of these (the O1 kill): the one-liner is typed
  // exactly once, at D1. FinalizeHandoff owns the confirm POST and fires it
  // silently on mount; on serve it hard-navs and load-detection mounts
  // JourneyShell at showWork, on manual it routes to the existing demand branch.
  // (When D4 lands in Phase 4, its work-pick routes through this SAME `finalize`
  // transition — set `deciderScreen` to 'finalize' after `applyEnginePick`.)
  if (!checking && step === 'decider' && briefDraft && deciderState?.resolvedEngine) {
    const resolvedEngine = deciderState.resolvedEngine;
    if (deciderScreen === 'D3') {
      return (
        <D3AlmostSure
          briefDraft={briefDraft}
          resolvedEngine={resolvedEngine}
          // "Yes" = confirm the SAME lookup engine — pure local state, no
          // re-classification, no extra UNDERSTAND credit. → the silent finalize.
          onYes={() => setDeciderScreen('finalize')}
          // "Something else" → D4 (Phase 4) — greyed placeholder until then.
        />
      );
    }
    return (
      <FinalizeHandoff
        tokenId={tokenId}
        briefDraft={briefDraft}
        resolvedEngine={resolvedEngine}
        onManual={(missingTags) => {
          setMissing(missingTags);
          setStep('manual');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
          <Logo size={80} />
        </div>
      </div>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            {checking && (
              <div className="py-12 flex items-center justify-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {!checking && step === 'wizard' && wizardData && (
              <WizardShell
                tokenId={tokenId}
                brief={wizardData.brief}
                audienceType={wizardData.audienceType}
                templateId={wizardData.templateId}
              />
            )}

            {!checking && step === 'confirm' && briefDraft && (
              <ConfirmBriefStep
                tokenId={tokenId}
                briefDraft={briefDraft}
                onDraftCorrected={setBriefDraft}
                onManual={(missingTags) => {
                  setMissing(missingTags);
                  setStep('manual');
                }}
              />
            )}

            {!checking && step === 'manual' && briefDraft && (
              <ManualOnboardStep
                rawInput={rawInput}
                briefDraft={briefDraft}
                missing={missing}
                leadId={leadId}
                onLeadCreated={setLeadId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
