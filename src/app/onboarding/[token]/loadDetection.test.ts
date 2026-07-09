// src/app/onboarding/[token]/loadDetection.test.ts
// scale-06 phase 11 — coverage for the [token] LOAD-DETECTION + resume mechanism.
//
// Load-detection (page.tsx, ~line 81) is what turns the unified route into both
// the post-confirm wizard landing AND the net-new mid-wizard RELOAD/RESUME
// capability (the old in-memory entry flow restarted on reload). The predicate
// lives INSIDE the page component and is not exported, so — per the phase plan —
// this file locks the two testable halves of the mechanism instead:
//
//   1. the detection PREDICATE truth-table. `confirmed = !!brief && !!audienceType
//      && !!brief.copyEngine` (page.tsx). Mirrored here as a pure helper kept
//      byte-identical to the page; any drift is a deliberate edit in both places.
//   2. RESUME rehydration: `useWizardStore.hydrate` rebuilds a usable wizard
//      (engine/slots/mode/fields) from the SAME persisted brief a reload's
//      /api/loadDraft returns — proving reload resumes rather than restarts.
//
// SPLIT NOTE: the fetch+setState wiring in page.tsx is only reachable in a
// browser (Clerk-gated route); that half is the founder's /manual-test + the
// (auth-gated, written-only) e2e reload step. This file owns the pure logic.

import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { Brief } from '@/types/brief';
import type { AudienceType } from '@/types/service';

// ── Mirror of the page.tsx load-detection predicate (keep in lockstep) ──
// page.tsx: `const confirmed = !!brief && !!audienceType && !!brief.copyEngine;`
function isConfirmedForWizard(
  brief: Brief | null | undefined,
  audienceType: AudienceType | null | undefined,
): boolean {
  return !!brief && !!audienceType && !!brief?.copyEngine;
}

/** A DB-confirmed brief the way /api/loadDraft returns it after confirm/serve. */
function persistedBrief(over: Partial<Brief> = {}): Brief {
  return {
    copyEngine: 'thing',
    businessType: 'saas',
    confidence: 0.9,
    facts: {
      entry: {
        rawInput: 'https://acme.app',
        businessName: 'Acme Invoicing',
        oneLiner: 'Invoicing software for freelancers that auto-chases late payments',
        audiences: ['freelance designers'],
        offerings: ['auto-chase', 'reminders'],
        offer: 'Free 14-day trial',
        outcomes: ['gets paid 40% faster'],
        testimonials: ['"Saved me hours." — Jane'],
      },
    },
    goal: { intent: 'free-trial', param: { url: 'https://acme.app/signup' } },
    ...over,
  } as Brief;
}

describe('load-detection — the wizard-vs-entry predicate (mirror of page.tsx)', () => {
  it('a persisted brief + audienceType + copyEngine ⇒ render the WIZARD', () => {
    expect(isConfirmedForWizard(persistedBrief(), 'product')).toBe(true);
  });

  it('no persisted brief ⇒ ENTRY input (fresh token)', () => {
    expect(isConfirmedForWizard(null, null)).toBe(false);
  });

  it('brief present but audienceType not yet resolved ⇒ ENTRY (not a false wizard)', () => {
    expect(isConfirmedForWizard(persistedBrief(), null)).toBe(false);
  });

  it('brief without a resolved copyEngine ⇒ ENTRY (can not build a contract)', () => {
    const noEngine = persistedBrief({ copyEngine: undefined });
    expect(isConfirmedForWizard(noEngine, 'product')).toBe(false);
  });
});

describe('load-detection — resume rehydrates a usable wizard from the persisted brief', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('reload (loadDraft brief) ⇒ hydrate rebuilds engine/slots/mode/fields', () => {
    // Simulates a mid-wizard reload: the page re-fetches the persisted brief and
    // re-hydrates the store — the wizard resumes instead of restarting to entry.
    useWizardStore.getState().hydrate({
      tokenId: 'tok-resume',
      brief: persistedBrief(),
      audienceType: 'product',
      templateId: 'meridian',
    });
    const s = useWizardStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.engine).toBe('thing');
    expect(s.tokenId).toBe('tok-resume');
    // Slot machine rebuilt (thing keeps the full skeleton incl. structure).
    expect(s.slots.length).toBeGreaterThan(0);
    expect(s.currentSlot).toBe(s.slots[0]);
    // URL entry ⇒ review mode restored on reload.
    expect(s.mode).toBe('review');
    // Scraped facts + goal survived the reload → confirm-per-slot, not re-ask.
    expect(s.fields.name?.value).toBe('Acme Invoicing');
    expect(s.fields.name?.state).toBe('scraped');
    expect(s.goalIntent).toBe('free-trial');
  });

  it('the resume is deterministic — two hydrates from the same brief agree', () => {
    const api = useWizardStore.getState();
    api.hydrate({ tokenId: 't', brief: persistedBrief(), audienceType: 'product', templateId: 'meridian' });
    const first = { slots: useWizardStore.getState().slots, mode: useWizardStore.getState().mode };
    api.reset();
    api.hydrate({ tokenId: 't', brief: persistedBrief(), audienceType: 'product', templateId: 'meridian' });
    expect(useWizardStore.getState().slots).toEqual(first.slots);
    expect(useWizardStore.getState().mode).toBe(first.mode);
  });

  it('a brief with no engine hydrates without throwing (entry-flow fallback parity)', () => {
    useWizardStore.getState().hydrate({ brief: persistedBrief({ copyEngine: undefined }) });
    expect(useWizardStore.getState().hydrated).toBe(true);
    expect(useWizardStore.getState().engine).toBeNull();
  });
});
